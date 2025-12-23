-- Migration: Add Dark Mode Preference Support
-- Description: Updates the profiles table to support dark mode preference in the preferences JSONB column
-- Date: 2025-11-02

-- The profiles table already has a 'preferences' column of type JSONB
-- This migration adds documentation and example for storing dark_mode preference

-- Example of how to update a user's dark mode preference:
-- UPDATE profiles 
-- SET preferences = jsonb_set(
--   COALESCE(preferences, '{}'::jsonb),
--   '{dark_mode}',
--   'true'::jsonb
-- )
-- WHERE id = 'user-id-here';

-- Example of how to query users with dark mode enabled:
-- SELECT * FROM profiles 
-- WHERE preferences->>'dark_mode' = 'true';

-- No schema changes needed - the existing preferences JSONB column
-- already supports storing the dark_mode boolean value.

-- Verify the preferences column exists:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'preferences'
  ) THEN
    RAISE EXCEPTION 'preferences column does not exist in profiles table';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Dark mode preference support verified. The preferences column is ready to store dark_mode values.';
END $$;
