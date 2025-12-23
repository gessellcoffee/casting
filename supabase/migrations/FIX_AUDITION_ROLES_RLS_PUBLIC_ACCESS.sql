-- =============================================
-- Migration: Fix Audition Roles RLS for Public Access
-- Description: Allow all authenticated users to view audition roles
--              since roles are public information for anyone viewing auditions
-- Date: 2025-11-03
-- =============================================

-- Drop the restrictive policy that only allows owners to view roles
DROP POLICY IF EXISTS "Users can view their audition roles" ON audition_roles;

-- Add new policy: All authenticated users can view audition roles
CREATE POLICY "Authenticated users can view audition roles"
  ON audition_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Keep the existing policies for insert, update, delete (only owners and production members)
-- These remain unchanged and properly restricted

-- Add policy for production team members to view roles
CREATE POLICY "Production team members can view audition roles"
  ON audition_roles
  FOR SELECT
  USING (
    audition_id IN (
      SELECT audition_id 
      FROM production_team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Note: We now have two SELECT policies:
-- 1. All authenticated users can view (public access)
-- 2. Production team members can view (redundant but kept for clarity)
-- Supabase will combine these with OR logic
