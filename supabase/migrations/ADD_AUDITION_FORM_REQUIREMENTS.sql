-- Add form requirements to auditions table
ALTER TABLE auditions 
ADD COLUMN required_signup_forms JSONB DEFAULT '[]'::jsonb,
ADD COLUMN required_callback_forms JSONB DEFAULT '[]'::jsonb;

-- Add indexes for efficient querying
CREATE INDEX idx_auditions_required_signup_forms ON auditions USING gin (required_signup_forms);
CREATE INDEX idx_auditions_required_callback_forms ON auditions USING gin (required_callback_forms);

-- Add comments for documentation
COMMENT ON COLUMN auditions.required_signup_forms IS 'Array of form IDs that users must complete before signing up for audition slots';
COMMENT ON COLUMN auditions.required_callback_forms IS 'Array of form IDs that users must complete before accepting callback invitations';
