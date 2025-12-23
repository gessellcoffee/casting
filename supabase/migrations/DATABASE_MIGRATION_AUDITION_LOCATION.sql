-- Migration: Add audition_location column to auditions table
-- Description: Adds a general audition location field to store the primary audition venue
-- Date: 2025-01-22

-- Add audition_location column to auditions table
ALTER TABLE auditions
ADD COLUMN audition_location TEXT;

-- Add comment to document the column
COMMENT ON COLUMN auditions.audition_location IS 'Primary location where auditions will be held';

-- Optional: Create an index if you plan to search/filter by location
CREATE INDEX IF NOT EXISTS idx_auditions_location ON auditions(audition_location);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auditions' AND column_name = 'audition_location';
