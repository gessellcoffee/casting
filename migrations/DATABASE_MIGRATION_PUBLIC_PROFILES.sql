-- =====================================================
-- Database Migration: Public Profile Viewing
-- =====================================================
-- This script ensures that profiles and resumes can be viewed publicly
-- while maintaining security for updates

-- =====================================================
-- STEP 1: Enable RLS on profiles table (if not already enabled)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Create RLS Policies for profiles
-- =====================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Policy: Anyone can view profiles (public read access)
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles
FOR SELECT
USING (true);

-- Policy: Users can insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can update only their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id);

-- =====================================================
-- STEP 3: Enable RLS on user_resume table (if not already enabled)
-- =====================================================

ALTER TABLE user_resume ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create RLS Policies for user_resume
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public resumes are viewable by everyone" ON user_resume;
DROP POLICY IF EXISTS "Users can view all resumes" ON user_resume;
DROP POLICY IF EXISTS "Users can insert their own resume entries" ON user_resume;
DROP POLICY IF EXISTS "Users can update their own resume entries" ON user_resume;
DROP POLICY IF EXISTS "Users can delete their own resume entries" ON user_resume;

-- Policy: Anyone can view resume entries (public read access)
CREATE POLICY "Public resumes are viewable by everyone"
ON user_resume
FOR SELECT
USING (true);

-- Policy: Users can insert their own resume entries
CREATE POLICY "Users can insert their own resume entries"
ON user_resume
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own resume entries
CREATE POLICY "Users can update their own resume entries"
ON user_resume
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete only their own resume entries
CREATE POLICY "Users can delete their own resume entries"
ON user_resume
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Verification Queries
-- =====================================================

-- Uncomment these to verify the policies

-- Check profiles policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'profiles'
-- ORDER BY policyname;

-- Check user_resume policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'user_resume'
-- ORDER BY policyname;

-- Test profile read access (should work for any user)
-- SELECT id, email, first_name, last_name FROM profiles LIMIT 5;

-- Test resume read access (should work for any user)
-- SELECT resume_entry_id, user_id, show_name, role FROM user_resume LIMIT 5;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Profiles and resumes are now publicly viewable while maintaining
-- security for create, update, and delete operations.
