-- Create table for collaborative signup notes
-- Allows multiple production team members to add notes to each audition signup

CREATE TABLE IF NOT EXISTS signup_notes (
  signup_note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id UUID NOT NULL REFERENCES audition_signups(signup_id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_signup_notes_signup_id ON signup_notes(signup_id);
CREATE INDEX idx_signup_notes_author_id ON signup_notes(author_id);
CREATE INDEX idx_signup_notes_created_at ON signup_notes(created_at DESC);

-- Enable RLS
ALTER TABLE signup_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Production team members and audition owners can view/manage notes
-- SELECT: Anyone who can view the audition can see notes
CREATE POLICY "Production team can view signup notes" ON signup_notes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM audition_signups
    JOIN audition_slots ON audition_signups.slot_id = audition_slots.slot_id
    JOIN auditions ON audition_slots.audition_id = auditions.audition_id
    WHERE audition_signups.signup_id = signup_notes.signup_id
    AND (
      auditions.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM production_team_members
        WHERE production_team_members.audition_id = auditions.audition_id
        AND production_team_members.user_id = auth.uid()
        AND production_team_members.status = 'active'
      )
    )
  )
);

-- INSERT: Production team members and owners can add notes
CREATE POLICY "Production team can add signup notes" ON signup_notes
FOR INSERT WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM audition_signups
    JOIN audition_slots ON audition_signups.slot_id = audition_slots.slot_id
    JOIN auditions ON audition_slots.audition_id = auditions.audition_id
    WHERE audition_signups.signup_id = signup_notes.signup_id
    AND (
      auditions.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM production_team_members
        WHERE production_team_members.audition_id = auditions.audition_id
        AND production_team_members.user_id = auth.uid()
        AND production_team_members.status = 'active'
      )
    )
  )
);

-- UPDATE: Authors can update their own notes
CREATE POLICY "Authors can update own signup notes" ON signup_notes
FOR UPDATE USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- DELETE: Authors can delete their own notes
CREATE POLICY "Authors can delete own signup notes" ON signup_notes
FOR DELETE USING (auth.uid() = author_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signup_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER signup_note_updated_at_trigger
  BEFORE UPDATE ON signup_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_signup_note_updated_at();

-- Add comments
COMMENT ON TABLE signup_notes IS 'Collaborative notes from production team members about audition performances';
COMMENT ON COLUMN signup_notes.signup_id IS 'Reference to the audition signup';
COMMENT ON COLUMN signup_notes.author_id IS 'Production team member who wrote the note';
COMMENT ON COLUMN signup_notes.note_text IS 'The note content';
