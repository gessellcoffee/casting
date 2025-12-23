-- Migration: Callback System
-- Description: Adds callback slots and invitation workflow for managing callbacks after auditions
-- Date: 2025-10-22

-- ============================================================================
-- Table: callback_slots
-- Description: Time slots for callbacks, similar to audition_slots
-- ============================================================================
CREATE TABLE IF NOT EXISTS callback_slots (
  callback_slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_signups INTEGER DEFAULT 1,
  notes TEXT, -- Optional notes for the callback session
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries by audition
CREATE INDEX IF NOT EXISTS idx_callback_slots_audition_id ON callback_slots(audition_id);
CREATE INDEX IF NOT EXISTS idx_callback_slots_start_time ON callback_slots(start_time);

-- ============================================================================
-- Table: callback_invitations
-- Description: Tracks callback invitations sent to actors with their responses
-- ============================================================================
CREATE TABLE IF NOT EXISTS callback_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  callback_slot_id UUID NOT NULL REFERENCES callback_slots(callback_slot_id) ON DELETE CASCADE,
  signup_id UUID NOT NULL REFERENCES audition_signups(signup_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  actor_comment TEXT, -- Actor's comment when accepting/rejecting
  casting_notes TEXT, -- Casting director's notes about this callback
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one invitation per signup per callback slot
  UNIQUE(callback_slot_id, signup_id)
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_callback_invitations_callback_slot_id ON callback_invitations(callback_slot_id);
CREATE INDEX IF NOT EXISTS idx_callback_invitations_signup_id ON callback_invitations(signup_id);
CREATE INDEX IF NOT EXISTS idx_callback_invitations_user_id ON callback_invitations(user_id);
CREATE INDEX IF NOT EXISTS idx_callback_invitations_audition_id ON callback_invitations(audition_id);
CREATE INDEX IF NOT EXISTS idx_callback_invitations_status ON callback_invitations(status);

-- ============================================================================
-- Function: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_callback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_callback_slots_updated_at
  BEFORE UPDATE ON callback_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_callback_updated_at();

CREATE TRIGGER update_callback_invitations_updated_at
  BEFORE UPDATE ON callback_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_callback_updated_at();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE callback_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE callback_invitations ENABLE ROW LEVEL SECURITY;

-- Callback Slots Policies
-- Anyone can view callback slots
CREATE POLICY "Callback slots are viewable by everyone"
  ON callback_slots FOR SELECT
  USING (true);

-- Only audition creators can create callback slots
CREATE POLICY "Audition creators can create callback slots"
  ON callback_slots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_slots.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Only audition creators can update their callback slots
CREATE POLICY "Audition creators can update their callback slots"
  ON callback_slots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_slots.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Only audition creators can delete their callback slots
CREATE POLICY "Audition creators can delete their callback slots"
  ON callback_slots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_slots.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Callback Invitations Policies
-- Users can view invitations for their auditions (as creator) or their own invitations (as actor)
CREATE POLICY "Users can view relevant callback invitations"
  ON callback_invitations FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_invitations.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Only audition creators can create callback invitations
CREATE POLICY "Audition creators can create callback invitations"
  ON callback_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_invitations.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Audition creators can update invitations, or actors can update their own response
CREATE POLICY "Users can update callback invitations appropriately"
  ON callback_invitations FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_invitations.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Only audition creators can delete callback invitations
CREATE POLICY "Audition creators can delete callback invitations"
  ON callback_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = callback_invitations.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE callback_slots IS 'Time slots for callback auditions';
COMMENT ON TABLE callback_invitations IS 'Tracks callback invitations and actor responses';
COMMENT ON COLUMN callback_invitations.status IS 'Invitation status: pending, accepted, or rejected';
COMMENT ON COLUMN callback_invitations.actor_comment IS 'Optional comment from actor when responding';
COMMENT ON COLUMN callback_invitations.casting_notes IS 'Private notes from casting director';
