-- Migration: Add RLS policy to allow cast members to view auditions they're cast in
-- Created: 2024-12-04
-- Purpose: Cast members couldn't view production details from "my-shows" page

-- =====================================================
-- HELPER FUNCTION: Check if user is cast in audition
-- =====================================================
CREATE OR REPLACE FUNCTION is_cast_in_audition(target_audition_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cast_members
    WHERE cast_members.audition_id = target_audition_id
    AND cast_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDITIONS TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their managed auditions" ON auditions;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view their auditions" ON auditions
FOR SELECT USING (
  can_manage_audition(auditions.audition_id)
  OR
  is_cast_in_audition(auditions.audition_id)
);

-- =====================================================
-- AUDITION_ROLES TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view roles for their auditions" ON audition_roles;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view audition roles" ON audition_roles
FOR SELECT USING (
  can_manage_audition(audition_roles.audition_id)
  OR
  is_cast_in_audition(audition_roles.audition_id)
);

-- =====================================================
-- AUDITION_SLOTS TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view slots for their auditions" ON audition_slots;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view audition slots" ON audition_slots
FOR SELECT USING (
  can_manage_audition(audition_slots.audition_id)
  OR
  is_cast_in_audition(audition_slots.audition_id)
);
