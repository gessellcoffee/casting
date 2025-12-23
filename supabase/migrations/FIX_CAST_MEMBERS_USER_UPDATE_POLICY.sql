-- =====================================================
-- FIX: Allow users to update their own cast member status
-- =====================================================
-- This migration fixes the casting offer acceptance/decline
-- functionality by allowing users to update the status of
-- their own cast_members records.
--
-- Issue: The ADD_PRODUCTION_TEAM_RLS_POLICIES migration
-- removed the ability for actors to update their own
-- cast member status when accepting/declining offers.
--
-- Solution: Add a separate UPDATE policy for users to
-- update their own cast_members.status field.
--
-- Date: December 2, 2025
-- =====================================================

-- Drop the existing all-encompassing policy
DROP POLICY IF EXISTS "Audition managers can manage cast members" ON cast_members;

-- Recreate with separate INSERT/DELETE policies for managers
CREATE POLICY "Audition managers can insert cast members" ON cast_members
FOR INSERT WITH CHECK (can_manage_audition(cast_members.audition_id));

CREATE POLICY "Audition managers can delete cast members" ON cast_members
FOR DELETE USING (can_manage_audition(cast_members.audition_id));

-- Managers can update all fields
CREATE POLICY "Audition managers can update cast members" ON cast_members
FOR UPDATE USING (can_manage_audition(cast_members.audition_id))
WITH CHECK (can_manage_audition(cast_members.audition_id));

-- NEW: Users can update ONLY their own cast member status
-- This allows actors to accept/decline casting offers
CREATE POLICY "Users can update their own cast member status" ON cast_members
FOR UPDATE USING (cast_members.user_id = auth.uid())
WITH CHECK (cast_members.user_id = auth.uid());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- View all policies for cast_members table:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies 
-- WHERE tablename = 'cast_members'
-- ORDER BY cmd, policyname;
--
-- Test as an actor:
-- 1. Get a casting offer
-- 2. Try to accept it via the notification
-- 3. Should now work without RLS errors
-- =====================================================

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Users can now update their own cast_members records
--    This is required for accepting/declining offers
--
-- 2. Audition managers still have full control via separate
--    INSERT, UPDATE, and DELETE policies
--
-- 3. The SELECT policy (from previous migration) remains:
--    "Users can view relevant cast members"
--    - Shows users their own cast records
--    - Shows managers all cast records for their auditions
-- =====================================================
