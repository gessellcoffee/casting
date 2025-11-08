-- =====================================================
-- Database Migration: Add 'casting_offer' to Notification Types
-- =====================================================
-- This script updates the notifications table to include 'casting_offer' type
-- Run this in your Supabase SQL Editor

-- Drop the existing CHECK constraint
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated CHECK constraint with 'casting_offer' included
ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'company_approval', 
  'user_affiliation', 
  'casting_decision', 
  'casting_offer',
  'general'
));

-- =====================================================
-- Verification Query
-- =====================================================
-- Uncomment to verify the constraint was updated:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'notifications'::regclass 
-- AND conname = 'notifications_type_check';

-- =====================================================
-- Migration Complete!
-- =====================================================
