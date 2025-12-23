-- Fix RLS policies for audition_signups to allow users to read their own signups

-- Enable RLS on audition_signups if not already enabled
ALTER TABLE audition_signups ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to view their own audition signups
CREATE POLICY "Users can view their own audition signups"
ON audition_signups
FOR SELECT
USING (user_id = auth.uid());

-- Add policy to allow users to create their own audition signups
CREATE POLICY "Users can create their own audition signups"
ON audition_signups
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add policy to allow users to update their own audition signups
CREATE POLICY "Users can update their own audition signups"
ON audition_signups
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Add policy to allow users to delete their own audition signups
CREATE POLICY "Users can delete their own audition signups"
ON audition_signups
FOR DELETE
USING (user_id = auth.uid());
