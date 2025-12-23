-- Add exdate column to recurrence_rules table for storing exception dates
-- This allows us to exclude specific occurrences from recurring events

ALTER TABLE public.recurrence_rules 
ADD COLUMN exdate TEXT[] DEFAULT '{}';

-- Add comment to document the column purpose
COMMENT ON COLUMN public.recurrence_rules.exdate IS 'Array of exception dates (YYYY-MM-DD format) to exclude from recurring event instances';
