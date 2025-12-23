-- Add columns to audition_signups for production team notes and media
-- This enables production teams to take notes and upload media during live auditions

-- Add notes column for text notes
ALTER TABLE audition_signups
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add media_files column for storing file metadata (JSONB array)
-- Format: [{ url: string, type: 'image' | 'video', filename: string, uploaded_at: timestamp }]
ALTER TABLE audition_signups
ADD COLUMN IF NOT EXISTS media_files JSONB DEFAULT '[]'::jsonb;

-- Add updated_at column to track when notes/media were last updated
ALTER TABLE audition_signups
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add last_updated_by to track who made the last update
ALTER TABLE audition_signups
ADD COLUMN IF NOT EXISTS last_updated_by UUID REFERENCES profiles(id);

-- Create an index on media_files for faster queries
CREATE INDEX IF NOT EXISTS idx_audition_signups_media_files ON audition_signups USING GIN (media_files);

-- Create an index on slot_id for faster lookup during live auditions
CREATE INDEX IF NOT EXISTS idx_audition_signups_slot_id ON audition_signups(slot_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_audition_signup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audition_signup_updated_at_trigger ON audition_signups;
CREATE TRIGGER audition_signup_updated_at_trigger
  BEFORE UPDATE ON audition_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_audition_signup_updated_at();

-- Add comment explaining the schema
COMMENT ON COLUMN audition_signups.notes IS 'Production team notes about the audition performance';
COMMENT ON COLUMN audition_signups.media_files IS 'Array of uploaded media files (images/videos) with metadata';
COMMENT ON COLUMN audition_signups.last_updated_by IS 'User ID of production team member who last updated notes/media';
COMMENT ON COLUMN audition_signups.updated_at IS 'Timestamp of last update to notes or media';
