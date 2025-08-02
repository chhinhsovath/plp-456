# Database Schema Documentation

## Overview
This document provides comprehensive documentation of the PLP-456 database schema, including table structures, relationships, migrations, and consistency guidelines.

## Database Configuration

### Connection Details
- **Database Type**: PostgreSQL
- **Provider**: Prisma ORM
- **Environment Variable**: `DATABASE_URL`

### Prisma Configuration
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Table Schemas

### 1. Users Table (`users`)
Central authentication and user management table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PK, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password | VARCHAR(255) | NULL | Hashed password (null for OAuth) |
| name | VARCHAR(255) | NULL | User display name |
| role | VARCHAR(50) | DEFAULT 'ADMINISTRATOR' | User role (ADMINISTRATOR, MENTOR, TEACHER) |
| auth_provider | VARCHAR(50) | DEFAULT 'EMAIL' | Authentication provider (EMAIL, TELEGRAM) |
| telegram_id | BIGINT | UNIQUE, NULL | Telegram user ID |
| telegram_username | VARCHAR(255) | NULL | Telegram username |
| telegram_photo_url | TEXT | NULL | Telegram profile photo URL |
| is_active | BOOLEAN | DEFAULT true | Account active status |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | AUTO UPDATE | Last modification timestamp |

#### Indexes
- Primary Key: `id`
- Unique: `email`
- Unique: `telegram_id`

#### Role Definitions
```javascript
const UserRoles = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  MENTOR: 'MENTOR', 
  TEACHER: 'TEACHER'
};
```

### 2. Geographic Table (`geographic`)
Hierarchical geographic data for Cambodia administrative divisions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT | Row identifier |
| province_code | INT | Province code |
| province_name_kh | VARCHAR(255) | Province name in Khmer |
| province_name_en | VARCHAR(255) | Province name in English |
| district_code | BIGINT | District code |
| district_name_kh | VARCHAR(255) | District name in Khmer |
| district_name_en | VARCHAR(255) | District name in English |
| commune_code | BIGINT | Commune code |
| commune_name_kh | VARCHAR(255) | Commune name in Khmer |
| commune_name_en | VARCHAR(255) | Commune name in English |
| village_code | BIGINT | Village code |
| village_name_kh | VARCHAR(255) | Village name in Khmer |
| village_name_en | VARCHAR(255) | Village name in English |
| created_at | VARCHAR(255) | Creation timestamp |
| updated_at | VARCHAR(255) | Update timestamp |
| deleted_at | VARCHAR(255) | Soft delete timestamp |

**Note**: This table is marked with `@@ignore` in Prisma schema due to lack of unique identifier.

### 3. Schools Table (`schools`)
Educational institution data.

| Column | Type | Description |
|--------|------|-------------|
| sclAutoID | INT | School unique identifier |
| sclName | VARCHAR(255) | School name |
| sclCode | VARCHAR(255) | School code |
| sclCluster | VARCHAR(255) | School cluster |
| sclCommune | VARCHAR(255) | Commune name |
| sclDistrict | VARCHAR(255) | District name |
| sclProvince | VARCHAR(255) | Province name |
| sclZone | VARCHAR(255) | Zone code |
| sclOrder | INT | Display order |
| sclStatus | INT | Active status |
| sclImage | VARCHAR(255) | School image URL |
| latitude | FLOAT | Geographic latitude |
| longitude | FLOAT | Geographic longitude |
| total_students | INT | Total student count |
| total_teachers | INT | Total teacher count |
| total_teachers_female | INT | Female teacher count |
| total_students_female | INT | Female student count |

**Note**: This table is also marked with `@@ignore` in Prisma schema.

## Extended Schema (Application Tables)

### 4. Observations Table (To be created)
```sql
CREATE TABLE observations (
  id SERIAL PRIMARY KEY,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  mentor_id INTEGER NOT NULL REFERENCES users(id),
  school_id INTEGER,
  observation_date DATE NOT NULL,
  observation_type VARCHAR(50) NOT NULL,
  subject VARCHAR(100),
  grade_level VARCHAR(20),
  status VARCHAR(50) DEFAULT 'scheduled',
  
  -- Scoring fields
  teaching_methods_score INTEGER CHECK (teaching_methods_score >= 1 AND teaching_methods_score <= 5),
  student_engagement_score INTEGER CHECK (student_engagement_score >= 1 AND student_engagement_score <= 5),
  classroom_management_score INTEGER CHECK (classroom_management_score >= 1 AND classroom_management_score <= 5),
  learning_outcomes_score INTEGER CHECK (learning_outcomes_score >= 1 AND learning_outcomes_score <= 5),
  
  -- Feedback
  initial_notes TEXT,
  detailed_feedback TEXT,
  action_items TEXT[],
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Indexes
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_mentor_id (mentor_id),
  INDEX idx_status (status),
  INDEX idx_observation_date (observation_date)
);
```

### 5. Mentoring Sessions Table (To be created)
```sql
CREATE TABLE mentoring_sessions (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES users(id),
  scheduled_date TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type VARCHAR(50) NOT NULL, -- 'individual', 'group'
  status VARCHAR(50) DEFAULT 'scheduled',
  agenda TEXT,
  location VARCHAR(255),
  notes TEXT,
  actual_duration_minutes INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  INDEX idx_mentor_id (mentor_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
);

-- Junction table for session participants
CREATE TABLE session_participants (
  session_id INTEGER NOT NULL REFERENCES mentoring_sessions(id),
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  attended BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  PRIMARY KEY (session_id, teacher_id)
);
```

### 6. Resources Table (To be created)
```sql
CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(50) NOT NULL,
  subject VARCHAR(100),
  grade_levels VARCHAR(50)[],
  language VARCHAR(10) DEFAULT 'en',
  file_url TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  tags VARCHAR(50)[],
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Full-text search
  search_vector tsvector,
  
  INDEX idx_resource_type (resource_type),
  INDEX idx_subject (subject),
  INDEX idx_search_vector (search_vector) USING gin
);
```

## Migration Strategy

### 1. Initial Setup
```bash
# Initialize Prisma
npx prisma init

# Create initial migration
npx prisma migrate dev --name init

# Apply migrations
npx prisma migrate deploy
```

### 2. Migration Files Structure
```
prisma/
├── schema.prisma
├── migrations/
│   ├── 20240101000000_init/
│   │   └── migration.sql
│   ├── 20240102000000_add_observations/
│   │   └── migration.sql
│   └── migration_lock.toml
```

### 3. Migration Best Practices
- Always create backups before migrations
- Test migrations on staging first
- Use descriptive migration names
- Keep migrations atomic and reversible

## Data Consistency Guidelines

### 1. Foreign Key Constraints
```sql
-- Ensure referential integrity
ALTER TABLE observations 
  ADD CONSTRAINT fk_teacher 
  FOREIGN KEY (teacher_id) 
  REFERENCES users(id) 
  ON DELETE RESTRICT;
```

### 2. Data Validation Rules
```javascript
// Application-level validation
const ObservationSchema = {
  teacherId: z.number().positive(),
  mentorId: z.number().positive(),
  observationDate: z.date().max(new Date()),
  scores: z.object({
    teachingMethods: z.number().min(1).max(5),
    studentEngagement: z.number().min(1).max(5),
    classroomManagement: z.number().min(1).max(5),
    learningOutcomes: z.number().min(1).max(5)
  })
};
```

### 3. Audit Trail
```sql
-- Add audit fields to all tables
ALTER TABLE table_name ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE table_name ADD COLUMN updated_by INTEGER REFERENCES users(id);
ALTER TABLE table_name ADD COLUMN deleted_by INTEGER REFERENCES users(id);
ALTER TABLE table_name ADD COLUMN deleted_at TIMESTAMP;
```

## Database Maintenance

### 1. Regular Tasks
```sql
-- Analyze tables for query optimization
ANALYZE observations;
ANALYZE users;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Reindex for performance
REINDEX TABLE observations;
```

### 2. Backup Strategy
```bash
# Daily backup
pg_dump -h localhost -U postgres -d plp456 > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -h localhost -U postgres -d plp456 < backup_20240115.sql
```

### 3. Performance Monitoring
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Schema Versioning

### Version Control
- All schema changes must go through migrations
- Never modify migrations after deployment
- Use semantic versioning for major changes

### Documentation Updates
- Update this document with each schema change
- Include migration scripts in documentation
- Document any breaking changes

## Security Considerations

### 1. Access Control
```sql
-- Create read-only user for reporting
CREATE USER report_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO report_user;

-- Revoke unnecessary permissions
REVOKE ALL ON DATABASE plp456 FROM PUBLIC;
```

### 2. Data Encryption
- Passwords: bcrypt with salt rounds >= 10
- Sensitive data: Consider column-level encryption
- Connections: Always use SSL/TLS

### 3. SQL Injection Prevention
- Use parameterized queries exclusively
- Validate all inputs
- Use Prisma's built-in protections

## Troubleshooting

### Common Issues

1. **Migration Conflicts**
```bash
# Reset migrations (development only)
npx prisma migrate reset

# Force sync schema
npx prisma db push
```

2. **Connection Issues**
```bash
# Test connection
npx prisma db pull

# Check connection string
echo $DATABASE_URL
```

3. **Performance Issues**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query_start < now() - interval '1 hour';
```

## Future Considerations

### Planned Schema Changes
1. Add multi-tenancy support
2. Implement event sourcing for audit logs
3. Add JSON columns for flexible metadata
4. Consider partitioning for large tables

### Scalability Planning
- Implement read replicas for reporting
- Consider sharding by geographic region
- Plan for archival strategy
- Monitor growth patterns