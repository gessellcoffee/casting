-- =====================================================
-- DATABASE FIX: AUDITION DATES TIMEZONE BUG
-- =====================================================
-- This migration fixes dates that were saved one day earlier
-- due to a timezone bug in the DateArrayInput component.
-- The bug has been fixed in the component, but existing data
-- needs to be corrected.
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Create a temporary function to increment dates in JSONB array
-- =====================================================
CREATE OR REPLACE FUNCTION increment_dates_in_array(date_array JSONB)
RETURNS JSONB AS $$
DECLARE
    date_elem TEXT;
    result JSONB := '[]'::jsonb;
    incremented_date DATE;
BEGIN
    -- Loop through each date in the array
    FOR date_elem IN SELECT jsonb_array_elements_text(date_array)
    LOOP
        -- Parse the date string and add 1 day
        incremented_date := (date_elem::DATE + INTERVAL '1 day')::DATE;
        
        -- Add the incremented date to result array
        result := result || to_jsonb(incremented_date::TEXT);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Backup current audition_dates (optional but recommended)
-- =====================================================
-- Create a backup table to store original values in case rollback is needed
CREATE TABLE IF NOT EXISTS audition_dates_backup AS
SELECT audition_id, audition_dates, NOW() as backup_timestamp
FROM auditions
WHERE audition_dates IS NOT NULL 
  AND jsonb_array_length(audition_dates) > 0;

-- STEP 3: Update all audition_dates by incrementing each date by 1 day
-- =====================================================
UPDATE auditions
SET audition_dates = increment_dates_in_array(audition_dates)
WHERE audition_dates IS NOT NULL 
  AND jsonb_array_length(audition_dates) > 0;

-- STEP 4: Verify the changes
-- =====================================================
-- Show count of updated records
SELECT COUNT(*) as updated_auditions_count
FROM auditions
WHERE audition_dates IS NOT NULL 
  AND jsonb_array_length(audition_dates) > 0;

-- Show sample of updated dates (first 5 records)
SELECT 
    a.audition_id,
    a.audition_dates as new_dates,
    b.audition_dates as old_dates
FROM auditions a
LEFT JOIN audition_dates_backup b USING (audition_id)
WHERE a.audition_dates IS NOT NULL 
  AND jsonb_array_length(a.audition_dates) > 0
LIMIT 5;

-- STEP 5: Cleanup temporary function
-- =====================================================
DROP FUNCTION IF EXISTS increment_dates_in_array(JSONB);

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- Uncomment and run these commands if you need to rollback this migration

/*
-- Restore original dates from backup
UPDATE auditions a
SET audition_dates = b.audition_dates
FROM audition_dates_backup b
WHERE a.audition_id = b.audition_id;

-- Verify rollback
SELECT COUNT(*) as rolled_back_count
FROM auditions a
INNER JOIN audition_dates_backup b USING (audition_id)
WHERE a.audition_dates = b.audition_dates;

-- Drop backup table
DROP TABLE IF EXISTS audition_dates_backup;
*/

-- =====================================================
-- NOTES
-- =====================================================
-- After running this migration successfully and verifying the data:
-- 1. Test the DateArrayInput component to ensure it now saves correct dates
-- 2. Create a new audition and verify dates are saved correctly
-- 3. Once confident, you can drop the backup table:
--    DROP TABLE IF EXISTS audition_dates_backup;
