-- Fix RLS policies for custom_form_responses to allow users to read their own responses

-- Enable RLS on custom_form_responses if not already enabled
ALTER TABLE custom_form_responses ENABLE ROW LEVEL SECURITY;

-- Add policy to allow users to view their own form responses
CREATE POLICY "Users can view their own form responses"
ON custom_form_responses
FOR SELECT
USING (respondent_user_id = auth.uid());

-- Add policy to allow users to create their own form responses
CREATE POLICY "Users can create their own form responses"
ON custom_form_responses
FOR INSERT
WITH CHECK (respondent_user_id = auth.uid());

-- Add policy to allow users to update their own form responses
CREATE POLICY "Users can update their own form responses"
ON custom_form_responses
FOR UPDATE
USING (respondent_user_id = auth.uid())
WITH CHECK (respondent_user_id = auth.uid());

-- Add policy to allow users to delete their own form responses
CREATE POLICY "Users can delete their own form responses"
ON custom_form_responses
FOR DELETE
USING (respondent_user_id = auth.uid());
