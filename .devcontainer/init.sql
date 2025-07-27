-- PostgreSQL Initialization Script for Task Manager Development
-- This script sets up the database for local development

-- Create extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create development user (already created by POSTGRES_USER)
-- This is just for documentation of what we expect

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE taskmanager_dev TO taskmanager;
GRANT ALL ON SCHEMA public TO taskmanager;

-- Set timezone
SET TIME ZONE 'UTC';

-- Create some useful functions for development
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Tables will be created by Flask-Migrate
-- This script is primarily for extensions and initial setup