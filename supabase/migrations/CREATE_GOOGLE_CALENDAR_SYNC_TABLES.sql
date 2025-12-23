-- Table to store user's synced Google Calendar IDs
CREATE TABLE IF NOT EXISTS google_calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'audition_slots', 'auditions', 'callbacks', 'rehearsals', 'performances', 'personal'
  google_calendar_id TEXT NOT NULL,
  calendar_name TEXT NOT NULL,
  last_synced_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_type)
);

-- Table to map app events to Google Calendar events
CREATE TABLE IF NOT EXISTS google_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'audition_slot', 'audition_signup', 'callback', 'rehearsal_event', 'rehearsal_agenda', 'user_event'
  event_id UUID NOT NULL, -- ID from the respective table (audition_slots, audition_signups, etc.)
  google_calendar_id TEXT NOT NULL,
  google_event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_type, event_id, google_calendar_id)
);

-- Enable RLS
ALTER TABLE google_calendar_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_event_mappings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own sync settings" ON google_calendar_sync;
DROP POLICY IF EXISTS "Users can insert own sync settings" ON google_calendar_sync;
DROP POLICY IF EXISTS "Users can update own sync settings" ON google_calendar_sync;
DROP POLICY IF EXISTS "Users can delete own sync settings" ON google_calendar_sync;

DROP POLICY IF EXISTS "Users can view own event mappings" ON google_event_mappings;
DROP POLICY IF EXISTS "Users can insert own event mappings" ON google_event_mappings;
DROP POLICY IF EXISTS "Users can update own event mappings" ON google_event_mappings;
DROP POLICY IF EXISTS "Users can delete own event mappings" ON google_event_mappings;

-- RLS Policies for google_calendar_sync
CREATE POLICY "Users can view own sync settings" ON google_calendar_sync
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync settings" ON google_calendar_sync
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync settings" ON google_calendar_sync
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sync settings" ON google_calendar_sync
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for google_event_mappings
CREATE POLICY "Users can view own event mappings" ON google_event_mappings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own event mappings" ON google_event_mappings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own event mappings" ON google_event_mappings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own event mappings" ON google_event_mappings
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_user_id ON google_calendar_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_sync_event_type ON google_calendar_sync(event_type);
CREATE INDEX IF NOT EXISTS idx_google_event_mappings_user_id ON google_event_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_google_event_mappings_event ON google_event_mappings(event_type, event_id);

-- Add comments
COMMENT ON TABLE google_calendar_sync IS 'Stores mapping between app event types and user Google Calendars';
COMMENT ON TABLE google_event_mappings IS 'Maps individual app events to their corresponding Google Calendar events';
