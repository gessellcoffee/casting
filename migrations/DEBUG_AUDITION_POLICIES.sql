-- =====================================================
-- DEBUG: Check current RLS policies on auditions table
-- =====================================================

-- View all current policies on auditions table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'auditions'
ORDER BY cmd, policyname;

-- Test the can_manage_audition function with your audition ID
-- Replace 'your-audition-id-here' with the actual audition ID you're trying to edit
SELECT can_manage_audition('your-audition-id-here'::uuid) as can_manage;

-- Check if you're the owner
SELECT audition_id, user_id, auth.uid() as current_user_id
FROM auditions 
WHERE audition_id = 'your-audition-id-here';

-- Check if you're a production team member
SELECT * FROM production_team_members
WHERE audition_id = 'your-audition-id-here'
AND user_id = auth.uid();

-- Try a simple SELECT to see if it returns multiple rows
SELECT count(*) as row_count
FROM auditions 
WHERE audition_id = 'your-audition-id-here';

-- Try to see what the SELECT policy actually returns
SELECT * FROM auditions 
WHERE audition_id = 'your-audition-id-here';
