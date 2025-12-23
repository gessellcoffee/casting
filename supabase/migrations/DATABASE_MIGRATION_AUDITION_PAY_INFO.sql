-- Migration: Add pay information fields to auditions table
-- Description: Adds is_paid boolean, pay_range text, and pay_comments text fields
-- Author: System
-- Date: 2025-01-06

-- Add new columns to auditions table
ALTER TABLE auditions
ADD COLUMN is_paid BOOLEAN DEFAULT false,
ADD COLUMN pay_range TEXT,
ADD COLUMN pay_comments TEXT;

-- Add comment to columns for documentation
COMMENT ON COLUMN auditions.is_paid IS 'Indicates if the audition/production is paid';
COMMENT ON COLUMN auditions.pay_range IS 'Pay range for the production (required if is_paid is true)';
COMMENT ON COLUMN auditions.pay_comments IS 'Additional comments or details about compensation';

-- Create index for querying paid auditions
CREATE INDEX idx_auditions_is_paid ON auditions(is_paid);
