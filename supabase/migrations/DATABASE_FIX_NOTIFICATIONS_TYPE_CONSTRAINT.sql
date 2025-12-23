-- =============================================
-- Migration: Fix notifications.type constraint to include 'casting_offer'
-- Description: Updates the check constraint to allow 'casting_offer' type
-- Date: 2025-11-03
-- =============================================

-- Drop the existing constraint
ALTER TABLE notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with 'casting_offer' included
ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('company_approval', 'user_affiliation', 'casting_decision', 'casting_offer', 'general'));

-- Add comment
COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 'Ensures notification type is one of the allowed values';
