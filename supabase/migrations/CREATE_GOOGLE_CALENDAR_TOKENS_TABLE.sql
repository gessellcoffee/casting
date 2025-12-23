-- Create table for storing Google Calendar OAuth tokens
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to make migration idempotent)
DROP POLICY IF EXISTS "Users can view own tokens" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON google_calendar_tokens;
DROP POLICY IF EXISTS "Users can delete own tokens" ON google_calendar_tokens;

-- RLS Policies
-- Users can only view their own tokens
CREATE POLICY "Users can view own tokens" ON google_calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens" ON google_calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens" ON google_calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens" ON google_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- Add comment
COMMENT ON TABLE google_calendar_tokens IS 'Stores OAuth tokens for Google Calendar integration';
