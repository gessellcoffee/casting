-- =============================================
-- PENDING SIGNUPS TABLE
-- =============================================
-- Purpose: Store pending invitations for users who haven't signed up yet
-- Features:
--   - Reusable across multiple invitation types (casting, company, callbacks)
--   - Auto-processes on user signup via trigger
--   - 15 invitation limit per email
--   - 30-day expiration
--   - Cancellation support with email notifications

-- Create the table
CREATE TABLE IF NOT EXISTS pending_signups (
  pending_signup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('casting_offer', 'company_member', 'callback_invitation')),
  request_data JSONB NOT NULL,
  invited_by UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  invitation_sent_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(user_id),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pending_signups_email ON pending_signups(LOWER(email));
CREATE INDEX idx_pending_signups_active ON pending_signups(email, completed_at, cancelled_at, expires_at) 
  WHERE completed_at IS NULL AND cancelled_at IS NULL;
CREATE INDEX idx_pending_signups_invited_by ON pending_signups(invited_by);

-- Enable RLS
ALTER TABLE pending_signups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view pending signups they created
CREATE POLICY "Users can view own pending signups" ON pending_signups
  FOR SELECT USING (auth.uid() = invited_by);

-- Users can insert pending signups (with limit check in application layer)
CREATE POLICY "Users can create pending signups" ON pending_signups
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- Users can update (cancel) their own pending signups
CREATE POLICY "Users can update own pending signups" ON pending_signups
  FOR UPDATE USING (auth.uid() = invited_by);

-- Function to check pending signup limit per email
CREATE OR REPLACE FUNCTION check_pending_signup_limit()
RETURNS TRIGGER AS $$
DECLARE
  active_count INTEGER;
BEGIN
  -- Count active (non-completed, non-cancelled, non-expired) pending signups for this email
  SELECT COUNT(*) INTO active_count
  FROM pending_signups
  WHERE LOWER(email) = LOWER(NEW.email)
    AND completed_at IS NULL
    AND cancelled_at IS NULL
    AND expires_at > NOW();
  
  -- Enforce 15 invitation limit
  IF active_count >= 15 THEN
    RAISE EXCEPTION 'Maximum of 15 pending invitations per email address. Please wait for existing invitations to be processed or expire.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce limit before insert
CREATE TRIGGER enforce_pending_signup_limit
  BEFORE INSERT ON pending_signups
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_signup_limit();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pending_signups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_pending_signups_timestamp
  BEFORE UPDATE ON pending_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_signups_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON pending_signups TO authenticated;

COMMENT ON TABLE pending_signups IS 'Stores pending invitations for users who have not yet signed up';
COMMENT ON COLUMN pending_signups.request_type IS 'Type of invitation: casting_offer, company_member, or callback_invitation';
COMMENT ON COLUMN pending_signups.request_data IS 'JSONB data specific to the request type (audition_id, role info, company info, etc.)';
COMMENT ON COLUMN pending_signups.expires_at IS 'Invitation expires 30 days after creation';
