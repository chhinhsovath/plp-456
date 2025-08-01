#!/usr/bin/env python3
"""
Database Migration Script for PLP-456
Migrates paper-based evaluation forms to PostgreSQL database

Database connection details:
- Host: 157.10.73.52
- Port: 5432
- Database: plp_456
- User: admin
- Password: P@ssw0rd
"""

import psycopg2
import os
import sys
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('migration.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Database connection parameters
DB_CONFIG = {
    'host': '157.10.73.52',
    'port': 5432,
    'database': 'plp_456',
    'user': 'admin',
    'password': 'P@ssw0rd'
}

# Migration files in order
MIGRATION_FILES = [
    '00_enable_extensions.sql',
    '01_inspection_sessions.sql',
    '02_master_fields.sql',
    '03_dynamic_student_assessment.sql'
]

def read_sql_file(filepath):
    """Read SQL file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            return file.read()
    except Exception as e:
        logging.error(f"Error reading file {filepath}: {e}")
        return None

def execute_migration(conn, sql_content, filename):
    """Execute a single migration file"""
    try:
        with conn.cursor() as cursor:
            logging.info(f"Executing migration: {filename}")
            cursor.execute(sql_content)
            conn.commit()
            logging.info(f"Successfully executed: {filename}")
            return True
    except Exception as e:
        conn.rollback()
        logging.error(f"Error executing {filename}: {e}")
        return False

def create_evaluation_scores_table(conn):
    """Create the evaluation scores linking table"""
    sql = """
    -- Create evaluation scores table to link inspection sessions with master fields
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
    CREATE INDEX IF NOT EXISTS idx_evaluation_scores_session ON inspection_evaluation_scores(inspection_session_id);
    CREATE INDEX IF NOT EXISTS idx_evaluation_scores_field ON inspection_evaluation_scores(field_id);
    CREATE INDEX IF NOT EXISTS idx_evaluation_scores_score ON inspection_evaluation_scores(score);

    -- Add update trigger
    DROP TRIGGER IF EXISTS trigger_update_evaluation_scores_updated_at ON inspection_evaluation_scores;
    CREATE TRIGGER trigger_update_evaluation_scores_updated_at 
        BEFORE UPDATE ON inspection_evaluation_scores 
        FOR EACH ROW 
        EXECUTE FUNCTION update_inspection_sessions_updated_at();
    """
    
    try:
        with conn.cursor() as cursor:
            logging.info("Creating evaluation scores linking table...")
            cursor.execute(sql)
            conn.commit()
            logging.info("Successfully created evaluation scores table")
            return True
    except Exception as e:
        conn.rollback()
        logging.error(f"Error creating evaluation scores table: {e}")
        return False

def create_helper_functions(conn):
    """Create helper functions and views"""
    sql = """
    -- Create summary view combining all data
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

    -- Function to create a complete inspection with evaluation
    CREATE OR REPLACE FUNCTION create_complete_inspection(
        p_location JSONB,
        p_teacher JSONB,
        p_lesson JSONB,
        p_students JSONB,
        p_inspection JSONB,
        p_evaluations JSONB,
        p_student_assessment JSONB DEFAULT NULL
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
    """
    
    try:
        with conn.cursor() as cursor:
            logging.info("Creating helper functions and views...")
            cursor.execute(sql)
            conn.commit()
            logging.info("Successfully created helper functions")
            return True
    except Exception as e:
        conn.rollback()
        logging.error(f"Error creating helper functions: {e}")
        return False

def verify_migration(conn):
    """Verify the migration was successful"""
    try:
        with conn.cursor() as cursor:
            # Check tables exist
            cursor.execute("""
                SELECT tablename 
                FROM pg_tables 
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
            """)
            tables = cursor.fetchall()
            logging.info(f"Tables created: {len(tables)}")
            for table in tables:
                logging.info(f"  - {table[0]}")
            
            # Check master fields count
            cursor.execute("SELECT COUNT(*) FROM master_fields;")
            count = cursor.fetchone()[0]
            logging.info(f"Master fields (evaluation indicators) loaded: {count}")
            
            if count != 22:
                logging.warning(f"Expected 22 evaluation indicators, but found {count}")
            
            return len(tables) == 8 and count == 22
    except Exception as e:
        logging.error(f"Error verifying migration: {e}")
        return False

def main():
    """Main migration function"""
    logging.info("Starting database migration for PLP-456")
    logging.info(f"Connecting to database at {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        logging.info("Successfully connected to database")
        
        # Execute each migration file
        all_success = True
        for migration_file in MIGRATION_FILES:
            sql_content = read_sql_file(migration_file)
            if sql_content:
                if not execute_migration(conn, sql_content, migration_file):
                    all_success = False
                    break
            else:
                logging.error(f"Could not read migration file: {migration_file}")
                all_success = False
                break
        
        # Create additional tables and functions
        if all_success:
            all_success = create_evaluation_scores_table(conn) and create_helper_functions(conn)
        
        # Verify migration
        if all_success:
            if verify_migration(conn):
                logging.info("Migration completed successfully!")
                logging.info("All paper-based evaluation form structures have been migrated to the database.")
            else:
                logging.error("Migration verification failed")
        else:
            logging.error("Migration failed - some steps were not completed")
        
        # Close connection
        conn.close()
        logging.info("Database connection closed")
        
    except psycopg2.Error as e:
        logging.error(f"Database connection error: {e}")
        sys.exit(1)
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()