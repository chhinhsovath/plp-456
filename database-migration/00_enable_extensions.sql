-- Enable required PostgreSQL extensions
-- Run this first before other migrations

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram search for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- Add comment
COMMENT ON EXTENSION "uuid-ossp" IS 'Provides UUID generation functions';
COMMENT ON EXTENSION pg_trgm IS 'Provides trigram-based text similarity search';
COMMENT ON EXTENSION citext IS 'Provides case-insensitive character string type';