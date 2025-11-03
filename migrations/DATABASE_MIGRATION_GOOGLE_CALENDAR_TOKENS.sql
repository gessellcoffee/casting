-- Create table for Google Calendar tokens
-- This stores OAuth tokens for each user to enable Google Calendar import functionality

CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT, -- Unix timestamp in milliseconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id) -- Each user can only have one connected Google account
);

-- Enable Row Level Security
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own tokens
CREATE POLICY "Users can view own tokens" ON google_calendar_tokens
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens" ON google_calendar_tokens
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON google_calendar_tokens
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens" ON google_calendar_tokens
FOR DELETE USING (auth.uid() = user_id);

-- Index for faster lookups by user_id
CREATE INDEX idx_google_calendar_tokens_user_id ON google_calendar_tokens(user_id);

-- Add comment
COMMENT ON TABLE google_calendar_tokens IS 'Stores OAuth tokens for Google Calendar integration. Enables users to import events from their Google Calendar.';
