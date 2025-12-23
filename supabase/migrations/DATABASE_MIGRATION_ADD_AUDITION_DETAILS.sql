-- Add audition_details column to auditions table
-- This column will store additional instructions and details for actors regarding the audition

ALTER TABLE auditions 
ADD COLUMN audition_details TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN auditions.audition_details IS 'Additional instructions, requirements, or details for actors regarding the audition (e.g., what to prepare, dress code, materials to bring)';
