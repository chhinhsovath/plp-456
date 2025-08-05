-- Add missing geographic code fields
ALTER TABLE inspection_sessions
ADD COLUMN IF NOT EXISTS province_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS province_name_kh VARCHAR(100),
ADD COLUMN IF NOT EXISTS district_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS district_name_kh VARCHAR(100),
ADD COLUMN IF NOT EXISTS commune_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS commune_name_kh VARCHAR(100),
ADD COLUMN IF NOT EXISTS village_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS village_name_kh VARCHAR(100),
ADD COLUMN IF NOT EXISTS school_id INTEGER;

-- Add indexes for the new code fields
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_province_code ON inspection_sessions(province_code);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_district_code ON inspection_sessions(district_code);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_commune_code ON inspection_sessions(commune_code);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_village_code ON inspection_sessions(village_code);
CREATE INDEX IF NOT EXISTS idx_inspection_sessions_school_id ON inspection_sessions(school_id);