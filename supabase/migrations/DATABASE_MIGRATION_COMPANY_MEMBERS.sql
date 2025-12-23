-- Migration: Add company_members table
-- Description: Allows companies to have multiple members/users with different roles
-- Created: 2024

-- Create company_members table
CREATE TABLE IF NOT EXISTS company_members (
  member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a user can only be a member of a company once
  UNIQUE(company_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_status ON company_members(status);

-- Add RLS (Row Level Security) policies
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of companies they belong to or own
CREATE POLICY "Users can view company members they belong to"
  ON company_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.company_id = company_members.company_id 
      AND companies.creator_user_id = auth.uid()
    )
  );

-- Policy: Company owners can add members
CREATE POLICY "Company owners can add members"
  ON company_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.company_id = company_members.company_id 
      AND companies.creator_user_id = auth.uid()
    )
  );

-- Policy: Company owners can update members
CREATE POLICY "Company owners can update members"
  ON company_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.company_id = company_members.company_id 
      AND companies.creator_user_id = auth.uid()
    )
  );

-- Policy: Company owners can remove members
CREATE POLICY "Company owners can remove members"
  ON company_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM companies 
      WHERE companies.company_id = company_members.company_id 
      AND companies.creator_user_id = auth.uid()
    )
  );

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_members_updated_at
  BEFORE UPDATE ON company_members
  FOR EACH ROW
  EXECUTE FUNCTION update_company_members_updated_at();

-- Add the company creator as the first member with 'owner' role when a company is created
CREATE OR REPLACE FUNCTION add_creator_as_company_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO company_members (company_id, user_id, role, status)
  VALUES (NEW.company_id, NEW.creator_user_id, 'owner', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER company_created_add_owner
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_company_member();

-- Comments for documentation
COMMENT ON TABLE company_members IS 'Stores members/users associated with companies';
COMMENT ON COLUMN company_members.role IS 'Member role: owner, admin, member, viewer';
COMMENT ON COLUMN company_members.status IS 'Member status: active, inactive, pending';
