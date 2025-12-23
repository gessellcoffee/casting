-- =====================================================
-- Database Migration: Company Approvals & Notifications
-- =====================================================
-- This script sets up the complete approval and notification system
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Update user_resume Table
-- =====================================================

-- Add company association columns
ALTER TABLE user_resume 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS company_approved BOOLEAN DEFAULT NULL;

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_resume_company_id_fkey'
  ) THEN
    ALTER TABLE user_resume 
    ADD CONSTRAINT user_resume_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES companies(company_id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_resume_company_id 
ON user_resume(company_id);

-- =====================================================
-- STEP 2: Create company_approval_requests Table
-- =====================================================

CREATE TABLE IF NOT EXISTS company_approval_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_entry_id UUID NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key constraints
  CONSTRAINT company_approval_requests_resume_entry_id_fkey 
    FOREIGN KEY (resume_entry_id) 
    REFERENCES user_resume(resume_entry_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT company_approval_requests_company_id_fkey 
    FOREIGN KEY (company_id) 
    REFERENCES companies(company_id) 
    ON DELETE CASCADE,
    
  CONSTRAINT company_approval_requests_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE
);

-- =====================================================
-- STEP 3: Create notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  sender_id UUID,
  type VARCHAR(50) NOT NULL CHECK (type IN ('company_approval', 'user_affiliation', 'casting_decision', 'general')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  reference_id UUID,
  reference_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Foreign key constraints
  CONSTRAINT notifications_recipient_id_fkey 
    FOREIGN KEY (recipient_id) 
    REFERENCES profiles(id) 
    ON DELETE CASCADE,
    
  CONSTRAINT notifications_sender_id_fkey 
    FOREIGN KEY (sender_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL
);

-- =====================================================
-- STEP 4: Create Indexes for Performance
-- =====================================================

-- Indexes for company_approval_requests
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_company_id 
ON company_approval_requests(company_id);

CREATE INDEX IF NOT EXISTS idx_company_approval_requests_status 
ON company_approval_requests(status);

CREATE INDEX IF NOT EXISTS idx_company_approval_requests_user_id 
ON company_approval_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_company_approval_requests_resume_entry_id 
ON company_approval_requests(resume_entry_id);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_company_approval_requests_company_status 
ON company_approval_requests(company_id, status);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id 
ON notifications(recipient_id);

CREATE INDEX IF NOT EXISTS idx_notifications_sender_id 
ON notifications(sender_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
ON notifications(created_at DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
ON notifications(recipient_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created 
ON notifications(recipient_id, created_at DESC);

-- =====================================================
-- STEP 5: Set Up Row Level Security (RLS)
-- =====================================================

-- Enable RLS on company_approval_requests
ALTER TABLE company_approval_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own approval requests" ON company_approval_requests;
DROP POLICY IF EXISTS "Company owners can view approval requests for their companies" ON company_approval_requests;
DROP POLICY IF EXISTS "Users can create their own approval requests" ON company_approval_requests;
DROP POLICY IF EXISTS "Company owners can update approval requests" ON company_approval_requests;

-- Policy: Users can view their own approval requests
CREATE POLICY "Users can view their own approval requests"
ON company_approval_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can view approval requests for companies they own
CREATE POLICY "Company owners can view approval requests for their companies"
ON company_approval_requests
FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM companies WHERE creator_user_id = auth.uid()
  )
);

-- Policy: Users can create approval requests for themselves
CREATE POLICY "Users can create their own approval requests"
ON company_approval_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Company owners can update approval requests for their companies
CREATE POLICY "Company owners can update approval requests"
ON company_approval_requests
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM companies WHERE creator_user_id = auth.uid()
  )
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view notifications they sent" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Policy: Users can view notifications sent to them
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = recipient_id);

-- Policy: Users can view notifications they sent
CREATE POLICY "Users can view notifications they sent"
ON notifications
FOR SELECT
USING (auth.uid() = sender_id);

-- Policy: Authenticated users can create notifications
CREATE POLICY "System can create notifications"
ON notifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own notifications (mark as read, etc.)
CREATE POLICY "Users can update their own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = recipient_id);

-- Policy: Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications
FOR DELETE
USING (auth.uid() = recipient_id);

-- =====================================================
-- STEP 6: Create Helper Functions
-- =====================================================

-- Function to automatically update the updated_at timestamp for approval requests
CREATE OR REPLACE FUNCTION update_company_approval_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_company_approval_request_updated_at_trigger ON company_approval_requests;

CREATE TRIGGER update_company_approval_request_updated_at_trigger
BEFORE UPDATE ON company_approval_requests
FOR EACH ROW
EXECUTE FUNCTION update_company_approval_request_updated_at();

-- =====================================================
-- STEP 7: Verification Queries
-- =====================================================

-- Uncomment these to verify the migration

-- Check user_resume columns
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'user_resume'
-- AND column_name IN ('company_id', 'company_approved');

-- Check tables exist
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name IN ('company_approval_requests', 'notifications');

-- Check indexes
-- SELECT indexname, tablename
-- FROM pg_indexes 
-- WHERE tablename IN ('company_approval_requests', 'notifications')
-- ORDER BY tablename, indexname;

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies 
-- WHERE tablename IN ('company_approval_requests', 'notifications')
-- ORDER BY tablename, policyname;

-- =====================================================
-- Migration Complete!
-- =====================================================
-- Your database is now ready for the approval and notification system.
