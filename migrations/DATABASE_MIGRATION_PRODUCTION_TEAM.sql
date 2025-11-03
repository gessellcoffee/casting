-- Migration: Production Team Members
-- Description: Add production team members table to track custom production roles for auditions
-- Date: 2024-11-02

-- Create production_team_members table
CREATE TABLE IF NOT EXISTS production_team_members (
  production_team_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role_title TEXT NOT NULL,
  invited_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_user_or_email CHECK (
    (user_id IS NOT NULL) OR (invited_email IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_production_team_members_audition_id 
  ON production_team_members(audition_id);
CREATE INDEX IF NOT EXISTS idx_production_team_members_user_id 
  ON production_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_production_team_members_invited_email 
  ON production_team_members(invited_email);
CREATE INDEX IF NOT EXISTS idx_production_team_members_status 
  ON production_team_members(status);

-- Add RLS policies
ALTER TABLE production_team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view production team members for auditions they can see
CREATE POLICY "Anyone can view production team members"
  ON production_team_members
  FOR SELECT
  USING (true);

-- Policy: Audition owners can insert production team members
CREATE POLICY "Audition owners can add production team members"
  ON production_team_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = production_team_members.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Policy: Audition owners can update production team members
CREATE POLICY "Audition owners can update production team members"
  ON production_team_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = production_team_members.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Policy: Invited users can update their own status
CREATE POLICY "Invited users can update their own status"
  ON production_team_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Audition owners can delete production team members
CREATE POLICY "Audition owners can delete production team members"
  ON production_team_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = production_team_members.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_production_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER production_team_members_updated_at
  BEFORE UPDATE ON production_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_production_team_members_updated_at();

-- Comments for documentation
COMMENT ON TABLE production_team_members IS 'Stores production team members with custom role titles for auditions';
COMMENT ON COLUMN production_team_members.production_team_member_id IS 'Primary key';
COMMENT ON COLUMN production_team_members.audition_id IS 'Reference to the audition';
COMMENT ON COLUMN production_team_members.user_id IS 'Reference to the user (null if not yet registered)';
COMMENT ON COLUMN production_team_members.role_title IS 'Custom role title (e.g., Director, Stage Manager, Choreographer)';
COMMENT ON COLUMN production_team_members.invited_email IS 'Email address for invitation if user does not exist';
COMMENT ON COLUMN production_team_members.status IS 'Status of the team member: pending, active, or declined';
COMMENT ON COLUMN production_team_members.invited_by IS 'User who invited this team member';
COMMENT ON COLUMN production_team_members.invited_at IS 'Timestamp when the invitation was sent';
COMMENT ON COLUMN production_team_members.joined_at IS 'Timestamp when the user accepted the invitation';
