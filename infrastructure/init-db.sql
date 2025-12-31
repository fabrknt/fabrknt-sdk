-- Fabrknt Suite Database Initialization
-- This script runs on first database startup

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For faster text search

-- Create schemas if needed (currently using public)
-- CREATE SCHEMA IF NOT EXISTS fabrknt;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE fabrknt_dev TO fabrknt;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'Fabrknt database initialized successfully';
END $$;
