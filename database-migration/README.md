# Database Migration for Paper-Based Evaluation Forms

This directory contains the migration scripts to convert paper-based teacher evaluation forms into a PostgreSQL database structure.

## Database Connection Information

```
Host: 157.10.73.52
Port: 5432
Database: plp_456
User: admin
Password: P@ssw0rd
```

## Migration Files

### 1. `00_enable_extensions.sql`
Enables required PostgreSQL extensions:
- `uuid-ossp`: For UUID generation
- `pg_trgm`: For text similarity search
- `citext`: For case-insensitive text

### 2. `01_inspection_sessions.sql`
Creates the main evaluation session table with:
- Location information (province, district, commune, village, cluster, school)
- Teacher information (name, gender, employment type)
- Schedule and lesson details
- Student statistics (attendance, gender distribution)
- Inspector information
- Computed fields and audit trails

### 3. `02_master_fields.sql`
Creates the evaluation indicators table with all 22 evaluation criteria:
- **Level 1 (Basic)**: 5 indicators covering content and materials
- **Level 2 (Intermediate)**: 8 indicators covering teaching activities
- **Level 3 (Advanced)**: 9 indicators covering advanced teaching methods and evaluation

Each indicator includes:
- Khmer and English descriptions
- AI context for automated evaluation assistance
- Scoring options (yes/some practice/no)

### 4. `03_dynamic_student_assessment.sql`
Creates flexible student assessment storage supporting:
- Variable number of subjects per assessment
- Variable number of students
- Two storage approaches:
  - Normalized tables (recommended)
  - JSONB flexible storage (alternative)

## Running the Migration

### Option 1: Using Python Script (Recommended)

```bash
# Make the script executable
chmod +x run_migration.py

# Run the migration
python3 run_migration.py
```

The Python script will:
- Connect to the database
- Execute all migrations in order
- Create additional linking tables
- Verify the migration
- Log all activities to `migration.log`

### Option 2: Using psql Command Line

```bash
# Connect to the database
psql -h 157.10.73.52 -p 5432 -U admin -d plp_456

# Run the master migration script
\i migrate_all.sql
```

### Option 3: Manual Migration

Execute each SQL file in order:
```bash
psql -h 157.10.73.52 -p 5432 -U admin -d plp_456 -f 00_enable_extensions.sql
psql -h 157.10.73.52 -p 5432 -U admin -d plp_456 -f 01_inspection_sessions.sql
psql -h 157.10.73.52 -p 5432 -U admin -d plp_456 -f 02_master_fields.sql
psql -h 157.10.73.52 -p 5432 -U admin -d plp_456 -f 03_dynamic_student_assessment.sql
```

## Database Schema Overview

### Main Tables Created

1. **inspection_sessions**: Main evaluation form data
   - Links all evaluation components
   - Stores session metadata and statistics

2. **master_fields**: 22 evaluation indicators
   - Bilingual support (Khmer/English)
   - Three complexity levels
   - AI context for each indicator

3. **student_assessment_sessions**: Assessment headers
   - Links to inspection sessions
   - Tracks assessment metadata

4. **assessment_subjects**: Dynamic subjects per assessment
   - Flexible subject configuration
   - Supports Khmer and English names

5. **assessment_students**: Students per assessment
   - Flexible student roster
   - Gender tracking

6. **student_scores**: Individual scores
   - One score per student per subject
   - Supports numeric and text scores

7. **dynamic_student_assessments**: Alternative JSONB storage
   - Fully flexible structure
   - Better for unstructured data

8. **inspection_evaluation_scores**: Links inspections to evaluation scores
   - Maps inspection sessions to master field evaluations
   - Tracks yes/some practice/no ratings

## Helper Functions

### create_complete_inspection()
Creates a complete inspection with all related data in one transaction:
```sql
SELECT create_complete_inspection(
    location_data::jsonb,
    teacher_data::jsonb,
    lesson_data::jsonb,
    student_data::jsonb,
    inspection_data::jsonb,
    evaluation_scores::jsonb,
    student_assessment::jsonb -- optional
);
```

### get_student_assessment()
Retrieves complete assessment data in structured JSON format:
```sql
SELECT get_student_assessment(assessment_id);
```

### get_assessment_summary()
Gets assessment summary for a school or teacher:
```sql
SELECT * FROM get_assessment_summary('School Name', 'Teacher Name', '2024-01-01', '2024-12-31');
```

### calculate_student_performance()
Calculates performance distribution for an assessment:
```sql
SELECT * FROM calculate_student_performance(assessment_id);
```

## Sample Data

To insert sample data for testing:
```sql
SELECT insert_sample_data();
```

This will create:
- One complete inspection session
- Evaluation scores for 13 indicators
- Student assessment with 3 subjects and 4 students

## Verification

After migration, verify the setup:
```sql
-- Check all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%inspection%' 
   OR tablename LIKE '%assessment%' 
   OR tablename LIKE '%master_fields%';

-- Verify 22 evaluation indicators loaded
SELECT COUNT(*) FROM master_fields;

-- Check views and functions
\dv  -- List views
\df  -- List functions
```

## Troubleshooting

1. **Connection Issues**: Ensure you can reach the database server on port 5432
2. **Permission Errors**: The admin user should have full privileges
3. **Extension Errors**: Some extensions may require superuser privileges
4. **Foreign Key Errors**: Ensure migrations run in the correct order

## Next Steps

After successful migration:
1. Test the database with sample data
2. Create application-specific indexes based on query patterns
3. Set up regular backups
4. Configure monitoring and alerts
5. Document API endpoints for accessing the data