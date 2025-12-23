-- =============================================
-- Migration: Add RLS Policies for Cast Members Public Access
-- Description: Allow all authenticated users to view accepted cast members
--              This enables public profiles to show casting information
-- Date: 2025-11-03
-- =============================================

-- Enable RLS on cast_members if not already enabled
ALTER TABLE cast_members ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view accepted cast members
CREATE POLICY "Authenticated users can view accepted cast members"
  ON cast_members
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND status = 'Accepted'
  );

-- Policy: Users can view their own cast member records (any status)
CREATE POLICY "Users can view their own cast member records"
  ON cast_members
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Audition owners can view all cast members for their auditions
CREATE POLICY "Audition owners can view cast members for their auditions"
  ON cast_members
  FOR SELECT
  USING (
    audition_id IN (
      SELECT audition_id 
      FROM auditions 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Production team members can view all cast members for their auditions
CREATE POLICY "Production team members can view cast members"
  ON cast_members
  FOR SELECT
  USING (
    audition_id IN (
      SELECT audition_id 
      FROM production_team_members 
      WHERE user_id = auth.uid()
    )
  );

-- Note: INSERT, UPDATE, DELETE policies should be managed separately
-- and restricted to audition owners and production team members only
