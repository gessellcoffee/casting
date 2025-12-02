-- Create table for Google Calendar sync configuration
-- This stores the mapping between event types and Google Calendar IDs for automatic sync

CREATE TABLE IF NOT EXISTS google_calendar_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  google_calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_event_type UNIQUE(user_id, event_type)
);

-- Enable Row Level Security
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own sync configurations
CREATE POLICY "Users can view own sync config" ON google_calendar_sync
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync config" ON google_calendar_sync
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync config" ON google_calendar_sync
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync config" ON google_calendar_sync
FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups by user_id
CREATE INDEX idx_google_calendar_sync_user_id ON google_calendar_sync(user_id);

-- Index for lookups by user_id and event_type
CREATE INDEX idx_google_calendar_sync_user_event ON google_calendar_sync(user_id, event_type);

-- Add comment
COMMENT ON TABLE google_calendar_sync IS 'Stores sync configuration for Google Calendar integration. Maps event types to dedicated Google Calendar IDs for automatic synchronization.';

-- Add check constraint for valid event types
ALTER TABLE google_calendar_sync ADD CONSTRAINT check_event_type 
  CHECK (event_type IN ('audition_slots', 'auditions', 'callbacks', 'rehearsals', 'performances', 'personal'));
