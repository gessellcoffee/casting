-- Migration: Create audition_roles table for user-specific role customizations
-- This allows users to customize roles for their specific audition without modifying the base show

-- Create audition_roles table
CREATE TABLE IF NOT EXISTS audition_roles (
  audition_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL, -- Optional reference to base role
  role_name TEXT NOT NULL,
  description TEXT,
  role_type role_type_enum,
  gender role_genders,
  needs_understudy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_audition_roles_audition_id ON audition_roles(audition_id);
CREATE INDEX idx_audition_roles_role_id ON audition_roles(role_id);

-- Add RLS policies
ALTER TABLE audition_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audition roles for auditions they created
CREATE POLICY "Users can view their audition roles"
  ON audition_roles
  FOR SELECT
  USING (
    audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert audition roles for their auditions
CREATE POLICY "Users can create audition roles for their auditions"
  ON audition_roles
  FOR INSERT
  WITH CHECK (
    audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update their audition roles
CREATE POLICY "Users can update their audition roles"
  ON audition_roles
  FOR UPDATE
  USING (
    audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete their audition roles
CREATE POLICY "Users can delete their audition roles"
  ON audition_roles
  FOR DELETE
  USING (
    audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    )
  );

-- Update cast_members table to reference audition_roles instead of roles
-- First, add the new column
ALTER TABLE cast_members ADD COLUMN IF NOT EXISTS audition_role_id UUID REFERENCES audition_roles(audition_role_id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_cast_members_audition_role_id ON cast_members(audition_role_id);

-- Note: We keep the old role_id column for backward compatibility
-- In the application, we'll prioritize audition_role_id over role_id

-- Add updated_at trigger for audition_roles
CREATE OR REPLACE FUNCTION update_audition_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audition_roles_updated_at
  BEFORE UPDATE ON audition_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_audition_roles_updated_at();
