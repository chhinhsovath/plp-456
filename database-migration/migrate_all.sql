-- Master migration script to run all migrations in order
-- This script migrates paper-based evaluation forms to PostgreSQL database
-- 
-- Database connection info:
-- Host: 157.10.73.52
-- Port: 5432
-- Database: plp_456
-- User: admin
-- Password: P@ssw0rd

-- Start transaction to ensure all-or-nothing migration
BEGIN;

-- Show current database
SELECT current_database() AS "Migrating Database";

-- 1. Enable required extensions
\echo 'Step 1: Enabling PostgreSQL extensions...'
\i 00_enable_extensions.sql

-- 2. Create inspection sessions table (main evaluation form)
\echo 'Step 2: Creating inspection sessions table...'
\i 01_inspection_sessions.sql

-- 3. Create master fields table (evaluation indicators)
\echo 'Step 3: Creating master fields table with 22 indicators...'
\i 02_master_fields.sql

-- 4. Create student assessment tables
\echo 'Step 4: Creating dynamic student assessment tables...'
\i 03_dynamic_student_assessment.sql

-- 5. Create evaluation scores table to link inspection sessions with master fields
\echo 'Step 5: Creating evaluation scores linking table...'
CREATE TABLE IF NOT EXISTS inspection_evaluation_scores (
    score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_session_id UUID REFERENCES inspection_sessions(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES master_fields(field_id),
    score VARCHAR(20) CHECK (score IN ('yes', 'some_practice', 'no', 'not_applicable')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one score per indicator per inspection
    UNIQUE(inspection_session_id, field_id)
);

-- Create indexes for evaluation scores
CREATE INDEX idx_evaluation_scores_session ON inspection_evaluation_scores(inspection_session_id);
CREATE INDEX idx_evaluation_scores_field ON inspection_evaluation_scores(field_id);
CREATE INDEX idx_evaluation_scores_score ON inspection_evaluation_scores(score);

-- Add update trigger
CREATE TRIGGER trigger_update_evaluation_scores_updated_at 
    BEFORE UPDATE ON inspection_evaluation_scores 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inspection_sessions_updated_at();

-- 6. Create summary view combining all data
\echo 'Step 6: Creating summary views...'
CREATE OR REPLACE VIEW inspection_complete_summary AS
SELECT 
    -- Inspection session info
    ins.id as inspection_id,
    ins.inspection_date,
    ins.province,
    ins.district,
    ins.commune,
    ins.school,
    ins.name_of_teacher,
    ins.sex as teacher_gender,
    ins.employment_type,
    ins.grade,
    ins.subject,
    ins.level as evaluation_level,
    ins.total_students,
    ins.total_present,
    ins.total_absent,
    ROUND((ins.total_present::decimal / NULLIF(ins.total_students, 0)) * 100, 2) as attendance_rate,
    
    -- Evaluation scores summary
    COUNT(DISTINCT ies.field_id) as indicators_evaluated,
    COUNT(DISTINCT ies.field_id) FILTER (WHERE ies.score = 'yes') as yes_count,
    COUNT(DISTINCT ies.field_id) FILTER (WHERE ies.score = 'some_practice') as some_practice_count,
    COUNT(DISTINCT ies.field_id) FILTER (WHERE ies.score = 'no') as no_count,
    
    -- Student assessment summary
    COUNT(DISTINCT sas.assessment_id) as assessments_conducted,
    AVG(sc.score) as avg_student_score
    
FROM inspection_sessions ins
LEFT JOIN inspection_evaluation_scores ies ON ies.inspection_session_id = ins.id
LEFT JOIN student_assessment_sessions sas ON sas.inspection_session_id = ins.id
LEFT JOIN student_scores sc ON sc.assessment_id = sas.assessment_id
WHERE ins.is_active = true
GROUP BY ins.id;

-- 7. Create helper functions
\echo 'Step 7: Creating helper functions...'

-- Function to create a complete inspection with evaluation
CREATE OR REPLACE FUNCTION create_complete_inspection(
    p_location JSONB,      -- {"province": "...", "district": "...", etc.}
    p_teacher JSONB,       -- {"name": "...", "sex": "M/F", "employment_type": "official/contract"}
    p_lesson JSONB,        -- {"subject": "...", "grade": 1-12, "chapter": "...", etc.}
    p_students JSONB,      -- {"total_male": 20, "total_female": 25, "total_absent": 5, etc.}
    p_inspection JSONB,    -- {"date": "2024-01-15", "level": 1-3, "inspector_name": "...", etc.}
    p_evaluations JSONB,   -- {"1": "yes", "2": "some_practice", "3": "no", ...}
    p_student_assessment JSONB DEFAULT NULL -- Optional student assessment data
)
RETURNS UUID AS $$
DECLARE
    v_inspection_id UUID;
    v_field_id INTEGER;
    v_score TEXT;
BEGIN
    -- Create inspection session
    INSERT INTO inspection_sessions (
        province, district, commune, village, cluster, school,
        name_of_teacher, sex, employment_type,
        session_time, subject, chapter, lesson, title, sub_title,
        inspection_date, start_time, end_time, grade,
        total_male, total_female, total_absent, total_absent_female,
        level, inspector_name, inspector_position, inspector_organization,
        academic_year, semester, lesson_duration_minutes, general_notes
    ) VALUES (
        p_location->>'province', p_location->>'district', p_location->>'commune',
        p_location->>'village', p_location->>'cluster', p_location->>'school',
        p_teacher->>'name', p_teacher->>'sex', p_teacher->>'employment_type',
        COALESCE(p_lesson->>'session_time', 'morning'),
        p_lesson->>'subject', p_lesson->>'chapter', p_lesson->>'lesson',
        p_lesson->>'title', p_lesson->>'sub_title',
        (p_inspection->>'date')::date,
        (p_inspection->>'start_time')::time,
        (p_inspection->>'end_time')::time,
        (p_lesson->>'grade')::integer,
        (p_students->>'total_male')::integer,
        (p_students->>'total_female')::integer,
        (p_students->>'total_absent')::integer,
        (p_students->>'total_absent_female')::integer,
        (p_inspection->>'level')::integer,
        p_inspection->>'inspector_name',
        p_inspection->>'inspector_position',
        p_inspection->>'inspector_organization',
        p_inspection->>'academic_year',
        (p_inspection->>'semester')::integer,
        (p_inspection->>'lesson_duration_minutes')::integer,
        p_inspection->>'notes'
    ) RETURNING id INTO v_inspection_id;
    
    -- Insert evaluation scores
    FOR v_field_id, v_score IN 
        SELECT (key::integer), value::text 
        FROM jsonb_each_text(p_evaluations)
    LOOP
        INSERT INTO inspection_evaluation_scores (
            inspection_session_id, field_id, score
        ) VALUES (
            v_inspection_id, v_field_id, v_score
        ) ON CONFLICT (inspection_session_id, field_id) DO UPDATE
        SET score = EXCLUDED.score, updated_at = CURRENT_TIMESTAMP;
    END LOOP;
    
    -- Insert student assessment if provided
    IF p_student_assessment IS NOT NULL THEN
        PERFORM insert_student_assessment(
            v_inspection_id,
            p_student_assessment->'subjects',
            p_student_assessment->'students',
            p_student_assessment->'scores',
            p_student_assessment->>'notes'
        );
    END IF;
    
    RETURN v_inspection_id;
END;
$$ LANGUAGE plpgsql;

-- 8. Create sample data insertion function
\echo 'Step 8: Creating sample data...'

-- Function to insert sample data for testing
CREATE OR REPLACE FUNCTION insert_sample_data()
RETURNS VOID AS $$
BEGIN
    -- Insert a sample inspection
    PERFORM create_complete_inspection(
        '{"province": "Phnom Penh", "district": "Chamkar Mon", "commune": "Tonle Bassac", "school": "Hun Sen Primary School"}'::jsonb,
        '{"name": "Ms. Sophea Chan", "sex": "F", "employment_type": "official"}'::jsonb,
        '{"subject": "Mathematics", "grade": 3, "chapter": "5", "lesson": "2", "title": "Addition and Subtraction", "session_time": "morning"}'::jsonb,
        '{"total_male": 18, "total_female": 22, "total_absent": 3, "total_absent_female": 2}'::jsonb,
        '{"date": "2024-01-15", "level": 2, "inspector_name": "Mr. Vuthy Sok", "inspector_position": "District Education Officer", "academic_year": "2023-2024", "semester": 2}'::jsonb,
        '{"1": "yes", "2": "yes", "3": "some_practice", "4": "yes", "5": "yes", "6": "yes", "7": "yes", "8": "some_practice", "9": "yes", "10": "yes", "11": "yes", "12": "yes", "13": "some_practice"}'::jsonb,
        '{
            "subjects": [
                {"name_km": "អំណាន", "name_en": "Reading", "order": 1},
                {"name_km": "សរសេរ", "name_en": "Writing", "order": 2},
                {"name_km": "គណិតវិទ្យា", "name_en": "Mathematics", "order": 3}
            ],
            "students": [
                {"identifier": "សិស្សទី១", "order": 1, "gender": "M"},
                {"identifier": "សិស្សទី២", "order": 2, "gender": "F"},
                {"identifier": "សិស្សទី៣", "order": 3, "gender": "M"},
                {"identifier": "សិស្សទី៤", "order": 4, "gender": "F"}
            ],
            "scores": {
                "subject_1": {"student_1": 85, "student_2": 92, "student_3": 78, "student_4": 88},
                "subject_2": {"student_1": 80, "student_2": 85, "student_3": 75, "student_4": 90},
                "subject_3": {"student_1": 90, "student_2": 88, "student_3": 82, "student_4": 95}
            },
            "notes": "Sample assessment for demonstration"
        }'::jsonb
    );
    
    RAISE NOTICE 'Sample data inserted successfully';
END;
$$ LANGUAGE plpgsql;

-- 9. Verify migration
\echo 'Step 9: Verifying migration...'

-- Check tables exist
SELECT 
    schemaname,
    tablename,
    (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count
FROM pg_tables t
WHERE schemaname = 'public' 
  AND tablename IN (
    'inspection_sessions',
    'master_fields',
    'student_assessment_sessions',
    'assessment_subjects',
    'assessment_students',
    'student_scores',
    'dynamic_student_assessments',
    'inspection_evaluation_scores'
  )
ORDER BY tablename;

-- Check row counts
SELECT 
    'inspection_sessions' as table_name, COUNT(*) as row_count FROM inspection_sessions
UNION ALL
SELECT 
    'master_fields', COUNT(*) FROM master_fields
UNION ALL
SELECT 
    'student_assessment_sessions', COUNT(*) FROM student_assessment_sessions
UNION ALL
SELECT 
    'inspection_evaluation_scores', COUNT(*) FROM inspection_evaluation_scores;

-- Insert sample data (optional - comment out if not needed)
-- SELECT insert_sample_data();

-- Commit transaction
COMMIT;

\echo 'Migration completed successfully!'
\echo 'Database schema for paper-based evaluation forms has been created.'
\echo ''
\echo 'Tables created:'
\echo '  - inspection_sessions: Main evaluation session data'
\echo '  - master_fields: 22 evaluation indicators'
\echo '  - student_assessment_sessions: Student assessment headers'
\echo '  - assessment_subjects: Dynamic subjects per assessment'
\echo '  - assessment_students: Students per assessment'
\echo '  - student_scores: Individual student scores'
\echo '  - dynamic_student_assessments: Alternative JSONB storage'
\echo '  - inspection_evaluation_scores: Links inspections to evaluation scores'
\echo ''
\echo 'To insert sample data, run: SELECT insert_sample_data();'