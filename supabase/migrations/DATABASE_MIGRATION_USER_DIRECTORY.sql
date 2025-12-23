-- Migration: Add location field to profiles table for user directory feature
-- Description: This migration adds a location field to the profiles table to enable
--              location-based user search and filtering in the user directory.
-- Date: 2025-11-02

-- Add location column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'location'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location TEXT;
        
        -- Add comment to document the column
        COMMENT ON COLUMN profiles.location IS 'User location for search and filtering purposes';
    END IF;
END $$;

-- Add location coordinates for distance-based searches (optional, for Google Maps integration)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'location_lat'
    ) THEN
        ALTER TABLE profiles ADD COLUMN location_lat DOUBLE PRECISION;
        ALTER TABLE profiles ADD COLUMN location_lng DOUBLE PRECISION;
        
        COMMENT ON COLUMN profiles.location_lat IS 'Latitude coordinate for location-based searches';
        COMMENT ON COLUMN profiles.location_lng IS 'Longitude coordinate for location-based searches';
    END IF;
END $$;

-- Create an index on location for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING btree (location);

-- Create a GIN index on skills for faster array overlap searches
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON profiles USING gin (skills);

-- Add text search capabilities for name and email searches
-- Create a generated tsvector column for full-text search
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE profiles ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
            setweight(to_tsvector('english', coalesce(first_name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(last_name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'C')
        ) STORED;
        
        -- Create GIN index on the search vector for fast full-text search
        CREATE INDEX idx_profiles_search_vector ON profiles USING gin (search_vector);
        
        COMMENT ON COLUMN profiles.search_vector IS 'Full-text search vector for profile searches';
    END IF;
END $$;

-- Grant appropriate permissions (adjust role names as needed)
-- GRANT SELECT ON profiles TO authenticated;
-- GRANT UPDATE (location) ON profiles TO authenticated;

-- Verification queries
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' 
-- AND column_name IN ('location', 'search_vector');

-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'profiles' 
-- AND indexname LIKE 'idx_profiles_%';
