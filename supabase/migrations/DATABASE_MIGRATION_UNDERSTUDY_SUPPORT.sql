-- =====================================================
-- DATABASE MIGRATION: UNDERSTUDY SUPPORT
-- =====================================================
-- This migration adds support for marking roles as needing understudies
-- and tracking which cast members are understudies vs principals
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- =====================================================

-- STEP 1: Add needs_understudy column to roles table
-- =====================================================
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS needs_understudy BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN roles.needs_understudy IS 'Indicates if this principal role requires an understudy to be cast';

-- STEP 2: Add is_understudy column to cast_members table
-- =====================================================
ALTER TABLE cast_members 
ADD COLUMN IF NOT EXISTS is_understudy BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN cast_members.is_understudy IS 'Indicates if this cast member is the understudy (true) or principal (false) for the role';

-- STEP 3: Create index for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_roles_needs_understudy 
ON roles(needs_understudy) 
WHERE needs_understudy = TRUE;

CREATE INDEX IF NOT EXISTS idx_cast_members_is_understudy 
ON cast_members(role_id, is_understudy);

-- STEP 4: Add constraint to ensure only one principal and one understudy per role per audition
-- =====================================================
-- This ensures we don't accidentally assign multiple principals or multiple understudies to the same role
CREATE UNIQUE INDEX IF NOT EXISTS idx_cast_members_unique_principal 
ON cast_members(audition_id, role_id, is_understudy);

-- =====================================================
-- VERIFICATION QUERIES (Uncomment to verify)
-- =====================================================

-- Check that columns were added
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'roles' AND column_name = 'needs_understudy';

-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'cast_members' AND column_name = 'is_understudy';

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('roles', 'cast_members') 
-- AND indexname LIKE '%understudy%'
-- ORDER BY tablename, indexname;

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================
-- Uncomment and run these commands if you need to rollback this migration

-- DROP INDEX IF EXISTS idx_cast_members_unique_principal;
-- DROP INDEX IF EXISTS idx_cast_members_is_understudy;
-- DROP INDEX IF EXISTS idx_roles_needs_understudy;
-- ALTER TABLE cast_members DROP COLUMN IF EXISTS is_understudy;
-- ALTER TABLE roles DROP COLUMN IF EXISTS needs_understudy;
