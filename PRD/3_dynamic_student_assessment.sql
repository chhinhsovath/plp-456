-- Create table for dynamic student assessment storage
-- This supports flexible subjects and variable number of students

-- Main assessment sessions table (links to inspection_sessions)
CREATE TABLE student_assessment_sessions (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_session_id UUID REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) DEFAULT 'sample_students', -- sample_students, full_class, etc.
    assessment_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Subjects table for this assessment (dynamic subjects per session)
CREATE TABLE assessment_subjects (
    subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES student_assessment_sessions(assessment_id) ON DELETE CASCADE,
    subject_name_km VARCHAR(100) NOT NULL, -- អំណាន, សរពណ៍, តារាងគុណ
    subject_name_en VARCHAR(100),
    subject_order INTEGER NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    min_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table for this assessment (dynamic number of students)
CREATE TABLE assessment_students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES student_assessment_sessions(assessment_id) ON DELETE CASCADE,
    student_identifier VARCHAR(50) NOT NULL, -- Student 1, Student 2, etc. or actual names
    student_order INTEGER NOT NULL,
    student_name VARCHAR(255), -- Optional: actual student name
    student_gender VARCHAR(10) CHECK (student_gender IN ('M', 'F', 'Male', 'Female')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main scores table (flexible key-value storage)
CREATE TABLE student_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES student_assessment_sessions(assessment_id) ON DELETE CASCADE,
    subject_id UUID REFERENCES assessment_subjects(subject_id) ON DELETE CASCADE,
    student_id UUID REFERENCES assessment_students(student_id) ON DELETE CASCADE,
    score DECIMAL(5,2),
    score_text VARCHAR(20), -- For non-numeric scores like "Good", "Poor", etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one score per student per subject per assessment
    UNIQUE(assessment_id, subject_id, student_id)
);

-- Alternative: Single flexible table approach using JSONB
CREATE TABLE dynamic_student_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_session_id UUID REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    
    -- Store subjects dynamically
    subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"name_km": "អំណាន", "name_en": "Reading", "order": 1, "max_score": 100}]
    
    -- Store students dynamically  
    students JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Example: [{"identifier": "Student 1", "name": "Optional Name", "gender": "M", "order": 1}]
    
    -- Store all scores in a matrix format
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- Example: {"subject_1": {"student_1": 85, "student_2": 92}, "subject_2": {"student_1": 78}}
    
    -- Metadata
    assessment_date DATE DEFAULT CURRENT_DATE,
    assessment_type VARCHAR(50) DEFAULT 'sample_students',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_assessment_sessions_inspection ON student_assessment_sessions(inspection_session_id);
CREATE INDEX idx_assessment_subjects_assessment ON assessment_subjects(assessment_id);
CREATE INDEX idx_assessment_students_assessment ON assessment_students(assessment_id);
CREATE INDEX idx_student_scores_assessment ON student_scores(assessment_id);
CREATE INDEX idx_student_scores_subject ON student_scores(subject_id);
CREATE INDEX idx_student_scores_student ON student_scores(student_id);

-- JSONB indexes for the flexible approach
CREATE INDEX idx_dynamic_assessments_inspection ON dynamic_student_assessments(inspection_session_id);
CREATE INDEX idx_dynamic_assessments_subjects ON dynamic_student_assessments USING GIN (subjects);
CREATE INDEX idx_dynamic_assessments_students ON dynamic_student_assessments USING GIN (students);
CREATE INDEX idx_dynamic_assessments_scores ON dynamic_student_assessments USING GIN (scores);

-- Update trigger for student_scores
CREATE TRIGGER trigger_update_student_scores_updated_at 
    BEFORE UPDATE ON student_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inspection_sessions_updated_at();

-- Function to insert a complete assessment (normalized approach)
CREATE OR REPLACE FUNCTION insert_student_assessment(
    p_inspection_session_id UUID,
    p_subjects JSONB, -- [{"name_km": "អំណាន", "name_en": "Reading", "order": 1}]
    p_students JSONB, -- [{"identifier": "Student 1", "name": "John", "order": 1}]
    p_scores JSONB,   -- {"subject_1": {"student_1": 85, "student_2": 92}}
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assessment_id UUID;
    v_subject JSONB;
    v_student JSONB;
    v_subject_id UUID;
    v_student_id UUID;
    v_subject_key TEXT;
    v_student_key TEXT;
    v_score DECIMAL;
BEGIN
    -- Create main assessment session
    INSERT INTO student_assessment_sessions (inspection_session_id, notes)
    VALUES (p_inspection_session_id, p_notes)
    RETURNING assessment_id INTO v_assessment_id;
    
    -- Create subjects
    FOR v_subject IN SELECT * FROM jsonb_array_elements(p_subjects)
    LOOP
        INSERT INTO assessment_subjects (assessment_id, subject_name_km, subject_name_en, subject_order)
        VALUES (
            v_assessment_id,
            v_subject->>'name_km',
            v_subject->>'name_en',
            (v_subject->>'order')::integer
        ) RETURNING subject_id INTO v_subject_id;
        
        -- Store subject_id mapping for scores
        v_subject_key := 'subject_' || (v_subject->>'order');
        
        -- Create students (only once)
        IF NOT EXISTS (SELECT 1 FROM assessment_students WHERE assessment_id = v_assessment_id) THEN
            FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
            LOOP
                INSERT INTO assessment_students (assessment_id, student_identifier, student_name, student_order)
                VALUES (
                    v_assessment_id,
                    v_student->>'identifier',
                    v_student->>'name',
                    (v_student->>'order')::integer
                );
            END LOOP;
        END IF;
        
        -- Insert scores for this subject
        FOR v_student IN SELECT * FROM jsonb_array_elements(p_students)
        LOOP
            v_student_key := 'student_' || (v_student->>'order');
            
            -- Get student_id
            SELECT student_id INTO v_student_id 
            FROM assessment_students 
            WHERE assessment_id = v_assessment_id 
              AND student_order = (v_student->>'order')::integer;
            
            -- Get score if exists
            IF p_scores ? v_subject_key AND (p_scores->v_subject_key) ? v_student_key THEN
                v_score := (p_scores->v_subject_key->>v_student_key)::decimal;
                
                INSERT INTO student_scores (assessment_id, subject_id, student_id, score)
                VALUES (v_assessment_id, v_subject_id, v_student_id, v_score);
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get assessment data in a structured format
CREATE OR REPLACE FUNCTION get_student_assessment(p_assessment_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'assessment_id', sas.assessment_id,
        'inspection_session_id', sas.inspection_session_id,
        'assessment_date', sas.assessment_date,
        'subjects', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'subject_id', subj.subject_id,
                    'name_km', subj.subject_name_km,
                    'name_en', subj.subject_name_en,
                    'order', subj.subject_order
                ) ORDER BY subj.subject_order
            )
            FROM assessment_subjects subj
            WHERE subj.assessment_id = sas.assessment_id
        ),
        'students', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'student_id', stud.student_id,
                    'identifier', stud.student_identifier,
                    'name', stud.student_name,
                    'order', stud.student_order
                ) ORDER BY stud.student_order
            )
            FROM assessment_students stud
            WHERE stud.assessment_id = sas.assessment_id
        ),
        'scores', (
            SELECT jsonb_object_agg(
                'subject_' || subj.subject_order,
                (
                    SELECT jsonb_object_agg(
                        'student_' || stud.student_order,
                        COALESCE(sc.score, 0)
                    )
                    FROM assessment_students stud
                    LEFT JOIN student_scores sc ON sc.student_id = stud.student_id 
                        AND sc.subject_id = subj.subject_id
                    WHERE stud.assessment_id = sas.assessment_id
                )
            )
            FROM assessment_subjects subj
            WHERE subj.assessment_id = sas.assessment_id
        )
    ) INTO result
    FROM student_assessment_sessions sas
    WHERE sas.assessment_id = p_assessment_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function for JSONB approach - simpler insert
CREATE OR REPLACE FUNCTION insert_dynamic_assessment(
    p_inspection_session_id UUID,
    p_subjects JSONB,
    p_students JSONB,
    p_scores JSONB,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_assessment_id UUID;
BEGIN
    INSERT INTO dynamic_student_assessments (
        inspection_session_id,
        subjects,
        students,
        scores,
        notes
    ) VALUES (
        p_inspection_session_id,
        p_subjects,
        p_students,
        p_scores,
        p_notes
    ) RETURNING assessment_id INTO v_assessment_id;
    
    RETURN v_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
/*
-- Sample data insertion using normalized approach
SELECT insert_student_assessment(
    'your-inspection-session-uuid',
    '[
        {"name_km": "អំណាន", "name_en": "Reading", "order": 1},
        {"name_km": "សរពណ៍", "name_en": "Writing", "order": 2},
        {"name_km": "តារាងគុណ", "name_en": "Multiplication", "order": 3}
    ]'::jsonb,
    '[
        {"identifier": "សិស្សទី១", "name": "Student 1", "order": 1},
        {"identifier": "សិស្សទី២", "name": "Student 2", "order": 2},
        {"identifier": "សិស្សទី៣", "name": "Student 3", "order": 3},
        {"identifier": "សិស្សទី៤", "name": "Student 4", "order": 4}
    ]'::jsonb,
    '{
        "subject_1": {"student_1": 85, "student_2": 92, "student_3": 78, "student_4": 88},
        "subject_2": {"student_1": 90, "student_2": 87, "student_3": 82, "student_4": 91},
        "subject_3": {"student_1": 76, "student_2": 84, "student_3": 79, "student_4": 85}
    }'::jsonb,
    'Sample assessment notes'
);

-- Sample data insertion using JSONB approach
SELECT insert_dynamic_assessment(
    'your-inspection-session-uuid',
    '[
        {"name_km": "អំណាន", "name_en": "Reading", "order": 1, "max_score": 100},
        {"name_km": "សរពណ៍", "name_en": "Writing", "order": 2, "max_score": 100}
    ]'::jsonb,
    '[
        {"identifier": "សិស្សទី១", "order": 1},
        {"identifier": "សិស្សទី២", "order": 2}
    ]'::jsonb,
    '{
        "subject_1": {"student_1": 85, "student_2": 92},
        "subject_2": {"student_1": 90, "student_2": 87}
    }'::jsonb
);
*/