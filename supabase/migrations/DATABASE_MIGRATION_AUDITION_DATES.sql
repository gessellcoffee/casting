-- =====================================================
-- DATABASE MIGRATION: AUDITION DATES
-- =====================================================
-- This migration adds support for storing audition dates as a JSON array
-- in the auditions table. Previously, rehearsal dates were being used
-- for audition scheduling, which was incorrect.
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Add audition_dates column to auditions table
-- =====================================================
-- This column will store an array of date strings in JSON format
-- Each date can be a single date or a range (stored as individual dates)
ALTER TABLE auditions 
ADD COLUMN IF NOT EXISTS audition_dates JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the column
COMMENT ON COLUMN auditions.audition_dates IS 'Array of audition date strings. Stores individual dates even when user selects a range. Format: ["2024-01-15", "2024-01-16", "2024-01-17"]';

-- STEP 2: Create index for better query performance
-- =====================================================
-- GIN index for JSONB column to enable efficient queries
CREATE INDEX IF NOT EXISTS idx_auditions_audition_dates 
ON auditions USING GIN (audition_dates);

-- =====================================================
-- VERIFICATION QUERIES (Uncomment to verify)
-- =====================================================

-- Check that column was added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'auditions' AND column_name = 'audition_dates';

-- Check index
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'auditions' 
-- AND indexname = 'idx_auditions_audition_dates';

-- =====================================================
-- EXAMPLE DATA
-- =====================================================
-- Example of how audition_dates should be stored:
-- Single date: ["2024-03-15"]
-- Multiple dates: ["2024-03-15", "2024-03-16", "2024-03-17"]
-- Range expanded: ["2024-03-15", "2024-03-16", "2024-03-17", "2024-03-18", "2024-03-19"]

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- Uncomment and run these commands if you need to rollback this migration

-- DROP INDEX IF EXISTS idx_auditions_audition_dates;
-- ALTER TABLE auditions DROP COLUMN IF EXISTS audition_dates;
