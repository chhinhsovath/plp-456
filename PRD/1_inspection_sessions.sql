-- Create inspection_sessions table to store all evaluation session data
CREATE TABLE inspection_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location Information
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    commune VARCHAR(100) NOT NULL,
    village VARCHAR(100),
    cluster VARCHAR(100),
    school VARCHAR(255) NOT NULL,
    
    -- Teacher Information
    name_of_teacher VARCHAR(255) NOT NULL,
    sex VARCHAR(10) CHECK (sex IN ('M', 'F', 'Male', 'Female')) NOT NULL,
    employment_type VARCHAR(20) CHECK (employment_type IN ('official', 'contract')) NOT NULL,
    
    -- Schedule Information
    session_time VARCHAR(20) CHECK (session_time IN ('morning', 'afternoon', 'both')) NOT NULL,
    
    -- Lesson Information
    subject VARCHAR(100) NOT NULL,
    chapter VARCHAR(10),
    lesson VARCHAR(10),
    title TEXT,
    sub_title TEXT,
    
    -- Inspection Details
    inspection_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    grade INTEGER CHECK (grade BETWEEN 1 AND 12) NOT NULL,
    
    -- Student Statistics
    total_male INTEGER DEFAULT 0 CHECK (total_male >= 0),
    total_female INTEGER DEFAULT 0 CHECK (total_female >= 0),
    total_absent INTEGER DEFAULT 0 CHECK (total_absent >= 0),
    total_absent_female INTEGER DEFAULT 0 CHECK (total_absent_female >= 0),
    
    -- Computed fields
    total_students INTEGER GENERATED ALWAYS AS (total_male + total_female) STORED,
    total_present INTEGER GENERATED ALWAYS AS (total_male + total_female - total_absent) STORED,
    total_absent_male INTEGER GENERATED ALWAYS AS (total_absent - total_absent_female) STORED,
    
    -- Evaluation Level
    level INTEGER CHECK (level BETWEEN 1 AND 3) DEFAULT 1,
    
    -- Inspector Information
    inspector_name VARCHAR(255),
    inspector_position VARCHAR(100),
    inspector_organization VARCHAR(255),
    
    -- Additional metadata
    academic_year VARCHAR(20),
    semester INTEGER CHECK (semester IN (1, 2)),
    lesson_duration_minutes INTEGER,
    
    -- Status and notes
    inspection_status VARCHAR(20) DEFAULT 'completed' CHECK (inspection_status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    general_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for better performance
CREATE INDEX idx_inspection_sessions_province ON inspection_sessions(province);
CREATE INDEX idx_inspection_sessions_district ON inspection_sessions(district);
CREATE INDEX idx_inspection_sessions_school ON inspection_sessions(school);
CREATE INDEX idx_inspection_sessions_teacher ON inspection_sessions(name_of_teacher);
CREATE INDEX idx_inspection_sessions_date ON inspection_sessions(inspection_date);
CREATE INDEX idx_inspection_sessions_grade ON inspection_sessions(grade);
CREATE INDEX idx_inspection_sessions_subject ON inspection_sessions(subject);
CREATE INDEX idx_inspection_sessions_level ON inspection_sessions(level);
CREATE INDEX idx_inspection_sessions_status ON inspection_sessions(inspection_status);
CREATE INDEX idx_inspection_sessions_active ON inspection_sessions(is_active);

-- Composite indexes for common queries
CREATE INDEX idx_inspection_location ON inspection_sessions(province, district, commune);
CREATE INDEX idx_inspection_teacher_date ON inspection_sessions(name_of_teacher, inspection_date);
CREATE INDEX idx_inspection_school_date ON inspection_sessions(school, inspection_date);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_inspection_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER trigger_update_inspection_sessions_updated_at 
    BEFORE UPDATE ON inspection_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_inspection_sessions_updated_at();

-- Add constraint to ensure total_absent_female doesn't exceed total_absent
ALTER TABLE inspection_sessions 
ADD CONSTRAINT chk_absent_female_valid 
CHECK (total_absent_female <= total_absent);

-- Add constraint to ensure total_absent doesn't exceed total students
ALTER TABLE inspection_sessions 
ADD CONSTRAINT chk_absent_total_valid 
CHECK (total_absent <= (total_male + total_female));

-- Create view for summary statistics
CREATE VIEW inspection_sessions_summary AS
SELECT 
    id,
    province,
    district,
    school,
    name_of_teacher,
    subject,
    grade,
    inspection_date,
    total_students,
    total_present,
    total_absent,
    ROUND((total_present::decimal / NULLIF(total_students, 0)) * 100, 2) as attendance_percentage,
    level,
    inspection_status
FROM inspection_sessions 
WHERE is_active = true;

-- Create view for location-based statistics
CREATE VIEW inspection_location_stats AS
SELECT 
    province,
    district,
    commune,
    COUNT(*) as total_inspections,
    COUNT(DISTINCT school) as unique_schools,
    COUNT(DISTINCT name_of_teacher) as unique_teachers,
    AVG(total_students) as avg_class_size,
    AVG(CASE WHEN total_students > 0 THEN (total_present::decimal / total_students) * 100 ELSE 0 END) as avg_attendance_rate,
    MIN(inspection_date) as first_inspection,
    MAX(inspection_date) as last_inspection
FROM inspection_sessions 
WHERE is_active = true
GROUP BY province, district, commune
ORDER BY province, district, commune;

-- Create function to get inspections by date range
CREATE OR REPLACE FUNCTION get_inspections_by_date_range(
    p_start_date DATE,
    p_end_date DATE,
    p_province VARCHAR DEFAULT NULL,
    p_district VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    session_id UUID,
    province VARCHAR,
    district VARCHAR,
    school VARCHAR,
    teacher_name VARCHAR,
    subject VARCHAR,
    grade INTEGER,
    inspection_date DATE,
    total_students INTEGER,
    attendance_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ins.id,
        ins.province,
        ins.district,
        ins.school,
        ins.name_of_teacher,
        ins.subject,
        ins.grade,
        ins.inspection_date,
        ins.total_students,
        CASE 
            WHEN ins.total_students > 0 THEN 
                ROUND((ins.total_present::decimal / ins.total_students) * 100, 2)
            ELSE 0
        END as attendance_rate
    FROM inspection_sessions ins
    WHERE ins.is_active = true
      AND ins.inspection_date BETWEEN p_start_date AND p_end_date
      AND (p_province IS NULL OR ins.province = p_province)
      AND (p_district IS NULL OR ins.district = p_district)
    ORDER BY ins.inspection_date DESC, ins.school, ins.name_of_teacher;
END;
$$ LANGUAGE plpgsql;

-- Create function to get teacher inspection history
CREATE OR REPLACE FUNCTION get_teacher_inspection_history(p_teacher_name VARCHAR)
RETURNS TABLE (
    session_id UUID,
    inspection_date DATE,
    school VARCHAR,
    subject VARCHAR,
    grade INTEGER,
    total_students INTEGER,
    attendance_rate DECIMAL,
    level INTEGER,
    inspector_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ins.id,
        ins.inspection_date,
        ins.school,
        ins.subject,
        ins.grade,
        ins.total_students,
        CASE 
            WHEN ins.total_students > 0 THEN 
                ROUND((ins.total_present::decimal / ins.total_students) * 100, 2)
            ELSE 0
        END as attendance_rate,
        ins.level,
        ins.inspector_name
    FROM inspection_sessions ins
    WHERE ins.is_active = true
      AND ins.name_of_teacher ILIKE '%' || p_teacher_name || '%'
    ORDER BY ins.inspection_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get school statistics
CREATE OR REPLACE FUNCTION get_school_statistics(p_school_name VARCHAR)
RETURNS TABLE (
    total_inspections BIGINT,
    unique_teachers BIGINT,
    avg_class_size DECIMAL,
    avg_attendance_rate DECIMAL,
    subjects_taught TEXT[],
    grades_covered INTEGER[],
    latest_inspection DATE,
    employment_distribution JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_inspections,
        COUNT(DISTINCT ins.name_of_teacher) as unique_teachers,
        ROUND(AVG(ins.total_students), 2) as avg_class_size,
        ROUND(AVG(CASE WHEN ins.total_students > 0 THEN (ins.total_present::decimal / ins.total_students) * 100 ELSE 0 END), 2) as avg_attendance_rate,
        ARRAY_AGG(DISTINCT ins.subject) as subjects_taught,
        ARRAY_AGG(DISTINCT ins.grade ORDER BY ins.grade) as grades_covered,
        MAX(ins.inspection_date) as latest_inspection,
        jsonb_build_object(
            'official', COUNT(*) FILTER (WHERE ins.employment_type = 'official'),
            'contract', COUNT(*) FILTER (WHERE ins.employment_type = 'contract')
        ) as employment_distribution
    FROM inspection_sessions ins
    WHERE ins.is_active = true
      AND ins.school ILIKE '%' || p_school_name || '%';
END;
$$ LANGUAGE plpgsql;

-- Sample data insertion (you can modify as needed)
-- INSERT INTO inspection_sessions (
--     province, district, commune, village, cluster, school,
--     name_of_teacher, sex, employment_type, session_time,
--     subject, chapter, lesson, title, sub_title,
--     inspection_date, start_time, end_time, grade,
--     total_male, total_female, total_absent, total_absent_female,
--     level, inspector_name, inspector_position
-- ) VALUES (
--     'Phnom Penh', 'Chamkar Mon', 'Tonle Bassac', 'Boeung Keng Kang', 'Cluster A', 'Hun Sen Primary School',
--     'Sophea Chan', 'F', 'official', 'morning',
--     'Mathematics', '3', '2', 'Addition and Subtraction', 'Basic Operations',
--     '2025-08-01', '08:00', '09:30', 4,
--     15, 18, 3, 2,
--     2, 'Inspector Name', 'Senior Inspector'
-- );

-- Sample queries to test the table
-- SELECT * FROM inspection_sessions_summary LIMIT 10;
-- SELECT * FROM inspection_location_stats;
-- SELECT * FROM get_inspections_by_date_range('2025-01-01', '2025-12-31', 'Phnom Penh');
-- SELECT * FROM get_teacher_inspection_history('Sophea');
-- SELECT * FROM get_school_statistics('Hun Sen');