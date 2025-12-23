-- Add virtual audition fields to auditions table
ALTER TABLE auditions
ADD COLUMN IF NOT EXISTS virtual_auditions_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS virtual_audition_instructions TEXT;

-- Create virtual_auditions table for storing virtual audition submissions
CREATE TABLE IF NOT EXISTS virtual_auditions (
  virtual_audition_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one virtual audition submission per user per audition
  CONSTRAINT unique_virtual_audition_per_user UNIQUE (audition_id, user_id)
);

-- Create junction table for virtual audition media files
CREATE TABLE IF NOT EXISTS virtual_audition_media (
  virtual_audition_media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  virtual_audition_id UUID NOT NULL REFERENCES virtual_auditions(virtual_audition_id) ON DELETE CASCADE,
  media_file_id UUID NOT NULL REFERENCES media_files(media_file_id) ON DELETE CASCADE,
  media_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate media files in same virtual audition
  CONSTRAINT unique_media_per_virtual_audition UNIQUE (virtual_audition_id, media_file_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_virtual_auditions_audition_id ON virtual_auditions(audition_id);
CREATE INDEX idx_virtual_auditions_user_id ON virtual_auditions(user_id);
CREATE INDEX idx_virtual_audition_media_virtual_audition_id ON virtual_audition_media(virtual_audition_id);
CREATE INDEX idx_virtual_audition_media_media_file_id ON virtual_audition_media(media_file_id);

-- Enable RLS
ALTER TABLE virtual_auditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE virtual_audition_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for virtual_auditions

-- Users can view their own virtual auditions
CREATE POLICY "Users can view own virtual auditions" ON virtual_auditions
FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own virtual auditions
CREATE POLICY "Users can insert own virtual auditions" ON virtual_auditions
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own virtual auditions
CREATE POLICY "Users can update own virtual auditions" ON virtual_auditions
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own virtual auditions
CREATE POLICY "Users can delete own virtual auditions" ON virtual_auditions
FOR DELETE USING (auth.uid() = user_id);

-- Audition owners can view all virtual auditions for their auditions
CREATE POLICY "Audition owners can view virtual auditions" ON virtual_auditions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM auditions a
    WHERE a.audition_id = virtual_auditions.audition_id
    AND a.user_id = auth.uid()
  )
);

-- Production team can view virtual auditions for their productions
CREATE POLICY "Production team can view virtual auditions" ON virtual_auditions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM production_team_members ptm
    JOIN auditions a ON a.audition_id = virtual_auditions.audition_id
    WHERE ptm.audition_id = a.audition_id
    AND ptm.user_id = auth.uid()
    AND ptm.status = 'active'
  )
);

-- RLS Policies for virtual_audition_media

-- Users can view media for their own virtual auditions
CREATE POLICY "Users can view own virtual audition media" ON virtual_audition_media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM virtual_auditions va
    WHERE va.virtual_audition_id = virtual_audition_media.virtual_audition_id
    AND va.user_id = auth.uid()
  )
);

-- Users can insert media for their own virtual auditions
CREATE POLICY "Users can insert own virtual audition media" ON virtual_audition_media
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM virtual_auditions va
    WHERE va.virtual_audition_id = virtual_audition_media.virtual_audition_id
    AND va.user_id = auth.uid()
  )
);

-- Users can delete media from their own virtual auditions
CREATE POLICY "Users can delete own virtual audition media" ON virtual_audition_media
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM virtual_auditions va
    WHERE va.virtual_audition_id = virtual_audition_media.virtual_audition_id
    AND va.user_id = auth.uid()
  )
);

-- Audition owners can view virtual audition media
CREATE POLICY "Audition owners can view virtual audition media" ON virtual_audition_media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM virtual_auditions va
    JOIN auditions a ON a.audition_id = va.audition_id
    WHERE va.virtual_audition_id = virtual_audition_media.virtual_audition_id
    AND a.user_id = auth.uid()
  )
);

-- Production team can view virtual audition media
CREATE POLICY "Production team can view virtual audition media" ON virtual_audition_media
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM virtual_auditions va
    JOIN production_team_members ptm ON ptm.audition_id = va.audition_id
    WHERE va.virtual_audition_id = virtual_audition_media.virtual_audition_id
    AND ptm.user_id = auth.uid()
    AND ptm.status = 'active'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_virtual_audition_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_virtual_auditions_updated_at
  BEFORE UPDATE ON virtual_auditions
  FOR EACH ROW
  EXECUTE FUNCTION update_virtual_audition_updated_at();

-- Function to prevent both slot signup and virtual audition
CREATE OR REPLACE FUNCTION check_audition_signup_conflict()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has a slot signup for this audition
  IF TG_TABLE_NAME = 'virtual_auditions' THEN
    IF EXISTS (
      SELECT 1 FROM audition_signups
      WHERE audition_id = NEW.audition_id
      AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot submit virtual audition when already signed up for a time slot';
    END IF;
  ELSIF TG_TABLE_NAME = 'audition_signups' THEN
    IF EXISTS (
      SELECT 1 FROM virtual_auditions
      WHERE audition_id = NEW.audition_id
      AND user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Cannot sign up for time slot when virtual audition already submitted';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to enforce the conflict check
CREATE TRIGGER prevent_virtual_audition_with_slot_signup
  BEFORE INSERT ON virtual_auditions
  FOR EACH ROW
  EXECUTE FUNCTION check_audition_signup_conflict();

CREATE TRIGGER prevent_slot_signup_with_virtual_audition
  BEFORE INSERT ON audition_signups
  FOR EACH ROW
  EXECUTE FUNCTION check_audition_signup_conflict();

-- Add comments
COMMENT ON TABLE virtual_auditions IS 'Stores virtual audition submissions from actors';
COMMENT ON TABLE virtual_audition_media IS 'Links media files to virtual audition submissions';
COMMENT ON COLUMN auditions.virtual_auditions_enabled IS 'Whether this audition accepts virtual submissions';
COMMENT ON COLUMN auditions.virtual_audition_instructions IS 'Instructions for actors submitting virtual auditions';
