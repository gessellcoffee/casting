-- =============================================
-- Migration: Casting Offers System
-- Description: Adds support for sending casting offers (mass and individual) 
--              with email and in-app notifications
-- Date: 2025-11-02
-- =============================================

-- =============================================
-- 1. Create casting_offers table
-- =============================================
-- This table tracks metadata about casting offers sent to users
CREATE TABLE IF NOT EXISTS casting_offers (
  offer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cast_member_id UUID NOT NULL REFERENCES cast_members(cast_member_id) ON DELETE CASCADE,
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(role_id) ON DELETE SET NULL,
  sent_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_message TEXT,
  offer_notes TEXT, -- Internal notes for casting director (not visible to user)
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  email_sent BOOLEAN NOT NULL DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_casting_offers_cast_member_id ON casting_offers(cast_member_id);
CREATE INDEX IF NOT EXISTS idx_casting_offers_audition_id ON casting_offers(audition_id);
CREATE INDEX IF NOT EXISTS idx_casting_offers_user_id ON casting_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_casting_offers_sent_by ON casting_offers(sent_by);
CREATE INDEX IF NOT EXISTS idx_casting_offers_sent_at ON casting_offers(sent_at DESC);

-- Add RLS policies
ALTER TABLE casting_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view offers sent to them
CREATE POLICY "Users can view their own casting offers"
  ON casting_offers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Casting directors can view offers they sent
CREATE POLICY "Casting directors can view offers they sent"
  ON casting_offers
  FOR SELECT
  USING (auth.uid() = sent_by);

-- Policy: Audition owners can view all offers for their auditions
CREATE POLICY "Audition owners can view offers for their auditions"
  ON casting_offers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = casting_offers.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Policy: Audition owners can create offers
CREATE POLICY "Audition owners can create offers"
  ON casting_offers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = casting_offers.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- Policy: Audition owners can update offers they sent
CREATE POLICY "Audition owners can update their offers"
  ON casting_offers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auditions
      WHERE auditions.audition_id = casting_offers.audition_id
      AND auditions.user_id = auth.uid()
    )
  );

-- =============================================
-- 2. Notifications type column
-- =============================================
-- The notifications.type column is TEXT (not an enum)
-- It accepts: 'company_approval', 'user_affiliation', 'casting_decision', 'casting_offer', 'general'
-- No schema changes needed - TEXT columns accept any value
-- The TypeScript types already include 'casting_offer' in the union type

-- =============================================
-- 3. Add trigger for updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION update_casting_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_casting_offers_updated_at
  BEFORE UPDATE ON casting_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_casting_offers_updated_at();

-- =============================================
-- 4. Create helper function to send casting offer
-- =============================================
-- This function creates a cast_member record, casting_offer record, and notification
-- Note: cast_members table doesn't have a unique constraint, so we check manually
CREATE OR REPLACE FUNCTION send_casting_offer(
  p_audition_id UUID,
  p_user_id UUID,
  p_role_id UUID,
  p_is_understudy BOOLEAN,
  p_sent_by UUID,
  p_offer_message TEXT,
  p_offer_notes TEXT
)
RETURNS UUID AS $$
DECLARE
  v_cast_member_id UUID;
  v_offer_id UUID;
  v_notification_id UUID;
  v_show_title TEXT;
  v_role_name TEXT;
  v_sender_name TEXT;
  v_existing_cast_member_id UUID;
BEGIN
  -- Get show and role information
  SELECT s.title INTO v_show_title
  FROM auditions a
  JOIN shows s ON a.show_id = s.show_id
  WHERE a.audition_id = p_audition_id;

  IF p_role_id IS NOT NULL THEN
    SELECT role_name INTO v_role_name
    FROM roles
    WHERE role_id = p_role_id;
  END IF;

  -- Get sender name
  SELECT COALESCE(
    NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), ''),
    email
  ) INTO v_sender_name
  FROM profiles
  WHERE id = p_sent_by;

  -- Check if cast_member already exists for this user/audition/role combination
  SELECT cast_member_id INTO v_existing_cast_member_id
  FROM cast_members
  WHERE audition_id = p_audition_id
    AND user_id = p_user_id
    AND (role_id = p_role_id OR (role_id IS NULL AND p_role_id IS NULL))
    AND is_understudy = p_is_understudy
  LIMIT 1;

  IF v_existing_cast_member_id IS NOT NULL THEN
    -- Update existing cast_member
    UPDATE cast_members
    SET status = 'Offered'
    WHERE cast_member_id = v_existing_cast_member_id;
    
    v_cast_member_id := v_existing_cast_member_id;
  ELSE
    -- Create new cast_member record
    INSERT INTO cast_members (
      audition_id,
      user_id,
      role_id,
      is_understudy,
      status
    ) VALUES (
      p_audition_id,
      p_user_id,
      p_role_id,
      p_is_understudy,
      'Offered'
    )
    RETURNING cast_member_id INTO v_cast_member_id;
  END IF;

  -- Create casting_offer record
  INSERT INTO casting_offers (
    cast_member_id,
    audition_id,
    user_id,
    role_id,
    sent_by,
    offer_message,
    offer_notes
  ) VALUES (
    v_cast_member_id,
    p_audition_id,
    p_user_id,
    p_role_id,
    p_sent_by,
    p_offer_message,
    p_offer_notes
  )
  RETURNING offer_id INTO v_offer_id;

  -- Create notification
  INSERT INTO notifications (
    recipient_id,
    sender_id,
    type,
    title,
    message,
    action_url,
    reference_id,
    reference_type,
    is_actionable,
    is_read
  ) VALUES (
    p_user_id,
    p_sent_by,
    'casting_offer',
    'Casting Offer Received',
    v_sender_name || ' has offered you ' || 
    CASE 
      WHEN p_role_id IS NULL THEN 'an ensemble role'
      WHEN p_is_understudy THEN 'the understudy role for ' || COALESCE(v_role_name, 'a role')
      ELSE 'the role of ' || COALESCE(v_role_name, 'a role')
    END ||
    ' in "' || COALESCE(v_show_title, 'a production') || '"',
    '/auditions/' || p_audition_id::TEXT,
    v_offer_id::TEXT,
    'casting_offer',
    TRUE,
    FALSE
  )
  RETURNING notification_id INTO v_notification_id;

  RETURN v_offer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 5. Comments for documentation
-- =============================================
COMMENT ON TABLE casting_offers IS 'Tracks casting offers sent to users for roles in auditions';
COMMENT ON COLUMN casting_offers.offer_message IS 'Message sent to the user with the offer';
COMMENT ON COLUMN casting_offers.offer_notes IS 'Internal notes for casting director (not visible to user)';
COMMENT ON COLUMN casting_offers.email_sent IS 'Whether an email notification was sent';
COMMENT ON FUNCTION send_casting_offer IS 'Creates a casting offer with cast_member record and notification';
