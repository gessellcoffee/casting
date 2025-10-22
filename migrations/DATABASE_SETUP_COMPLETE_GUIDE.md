# Complete Database Setup Guide

## Overview
This guide walks you through setting up all database tables, columns, and policies needed for the Casting application, including the Company Approval and Notification systems.

## Prerequisites
- Access to your Supabase project dashboard
- SQL Editor access in Supabase
- Basic understanding of SQL

## Quick Start - Run All Migrations

If you want to run everything at once, use the comprehensive migration file:

### Option 1: Single Migration File (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Open the file: `DATABASE_MIGRATION_APPROVALS_AND_NOTIFICATIONS.sql`
5. Copy and paste the entire contents
6. Click **Run** or press `Ctrl+Enter`
7. Wait for all statements to execute successfully

This will set up:
- ✅ Company association columns in `user_resume` table
- ✅ `company_approval_requests` table
- ✅ `notifications` table
- ✅ All necessary indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Trigger functions for auto-updating timestamps

## Step-by-Step Migration (Alternative)

If you prefer to run migrations step-by-step, follow these guides in order:

### 1. Resume Source Enum Update
**File:** `DATABASE_MIGRATION_RESUME_SOURCE.md`

This adds the `'manual'` and `'application'` values to the resume source enum.

```sql
ALTER TYPE resume_source_enum ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE resume_source_enum ADD VALUE IF NOT EXISTS 'application';
```

### 2. Company Approval System
**File:** `DATABASE_MIGRATION_INSTRUCTIONS.md`

This sets up the approval system for company associations.

Key components:
- Adds `company_id` and `company_approved` columns to `user_resume`
- Creates `company_approval_requests` table
- Sets up RLS policies

### 3. Notifications System
**Included in:** `DATABASE_MIGRATION_APPROVALS_AND_NOTIFICATIONS.sql`

Creates the notifications table for system-wide notifications.

## What Gets Created

### Tables

#### 1. `user_resume` (Updated)
New columns:
- `company_id` (UUID) - References companies table
- `company_approved` (BOOLEAN) - NULL (pending), TRUE (approved), FALSE (rejected)

#### 2. `company_approval_requests` (New)
Tracks approval requests when users associate with companies.

Columns:
- `request_id` (UUID, Primary Key)
- `resume_entry_id` (UUID) - References user_resume
- `company_id` (UUID) - References companies
- `user_id` (UUID) - References profiles
- `status` (VARCHAR) - 'pending', 'approved', or 'rejected'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### 3. `notifications` (New)
Stores all system notifications.

Columns:
- `notification_id` (UUID, Primary Key)
- `recipient_id` (UUID) - References profiles
- `sender_id` (UUID) - References profiles (nullable)
- `type` (VARCHAR) - 'company_approval', 'user_affiliation', 'casting_decision', 'general'
- `title` (VARCHAR)
- `message` (TEXT)
- `action_url` (TEXT)
- `reference_id` (UUID)
- `reference_type` (VARCHAR)
- `is_read` (BOOLEAN)
- `is_actionable` (BOOLEAN)
- `action_taken` (VARCHAR)
- `created_at` (TIMESTAMP)
- `read_at` (TIMESTAMP)

### Indexes Created

For optimal query performance:

**company_approval_requests:**
- `idx_company_approval_requests_company_id`
- `idx_company_approval_requests_status`
- `idx_company_approval_requests_user_id`
- `idx_company_approval_requests_resume_entry_id`
- `idx_company_approval_requests_company_status` (composite)

**notifications:**
- `idx_notifications_recipient_id`
- `idx_notifications_sender_id`
- `idx_notifications_type`
- `idx_notifications_is_read`
- `idx_notifications_created_at`
- `idx_notifications_recipient_read` (composite)
- `idx_notifications_recipient_created` (composite)

**user_resume:**
- `idx_user_resume_company_id`

### Row Level Security (RLS) Policies

#### company_approval_requests:
1. **"Users can view their own approval requests"** - Users see requests they created
2. **"Company owners can view approval requests for their companies"** - Company owners see requests for their companies
3. **"Users can create their own approval requests"** - Users can create requests for themselves
4. **"Company owners can update approval requests"** - Company owners can approve/reject requests

#### notifications:
1. **"Users can view their own notifications"** - Users see notifications sent to them
2. **"Users can view notifications they sent"** - Users see notifications they sent
3. **"System can create notifications"** - Authenticated users can create notifications
4. **"Users can update their own notifications"** - Users can mark their notifications as read
5. **"Users can delete their own notifications"** - Users can delete their notifications

### Trigger Functions

**update_company_approval_request_updated_at()**
- Automatically updates the `updated_at` timestamp when an approval request is modified

## Verification

After running the migration, verify everything is set up correctly:

### 1. Check Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('user_resume', 'company_approval_requests', 'notifications', 'companies', 'profiles');
```

### 2. Check Columns in user_resume
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_resume'
AND column_name IN ('company_id', 'company_approved');
```

### 3. Check Indexes
```sql
SELECT tablename, indexname
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('company_approval_requests', 'notifications', 'user_resume')
ORDER BY tablename, indexname;
```

### 4. Check RLS Policies
```sql
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('company_approval_requests', 'notifications')
ORDER BY tablename, policyname;
```

### 5. Check Foreign Keys
```sql
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_resume', 'company_approval_requests', 'notifications');
```

## Testing the Setup

### Test 1: Create a Test Approval Request
```sql
-- Note: Replace UUIDs with actual IDs from your database
INSERT INTO company_approval_requests (
  resume_entry_id,
  company_id,
  user_id,
  status
) VALUES (
  'your-resume-entry-id',
  'your-company-id',
  'your-user-id',
  'pending'
);
```

### Test 2: Create a Test Notification
```sql
-- Note: Replace UUIDs with actual IDs from your database
INSERT INTO notifications (
  recipient_id,
  sender_id,
  type,
  title,
  message,
  is_actionable
) VALUES (
  'recipient-user-id',
  'sender-user-id',
  'company_approval',
  'New Approval Request',
  'Someone wants to associate with your company',
  true
);
```

### Test 3: Query Pending Requests
```sql
SELECT 
  car.*,
  c.name as company_name,
  p.first_name || ' ' || p.last_name as user_name
FROM company_approval_requests car
JOIN companies c ON car.company_id = c.company_id
JOIN profiles p ON car.user_id = p.id
WHERE car.status = 'pending';
```

### Test 4: Query Unread Notifications
```sql
SELECT *
FROM notifications
WHERE is_read = false
ORDER BY created_at DESC;
```

## Troubleshooting

### Error: "relation already exists"
**Cause:** Table or column already exists  
**Solution:** This is normal if you've run the migration before. The script uses `IF NOT EXISTS` to prevent errors.

### Error: "foreign key constraint violation"
**Cause:** Referenced tables don't exist or have wrong data types  
**Solution:** Ensure these tables exist first:
- `profiles`
- `companies`
- `user_resume`

### Error: "permission denied"
**Cause:** Insufficient privileges  
**Solution:** Ensure you're running the SQL as a database admin in Supabase

### Error: "duplicate key value violates unique constraint"
**Cause:** Trying to create a policy that already exists  
**Solution:** The script drops existing policies before creating them. If you still get this error, manually drop the policy:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### RLS Blocking Queries
**Cause:** Row Level Security policies are too restrictive  
**Solution:** 
1. Check you're authenticated: `SELECT auth.uid();`
2. Verify the policy conditions match your use case
3. Temporarily disable RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
   (Don't forget to re-enable it!)

## Post-Migration Checklist

- [ ] All SQL scripts executed successfully
- [ ] Verification queries return expected results
- [ ] All tables exist
- [ ] All columns exist with correct data types
- [ ] Foreign key constraints are in place
- [ ] Indexes are created
- [ ] RLS is enabled on all tables
- [ ] RLS policies are created
- [ ] Trigger functions are working
- [ ] Test queries work as expected
- [ ] Application can connect and query the new tables
- [ ] No errors in Supabase logs

## Rollback (If Needed)

If you need to undo the migration:

```sql
-- WARNING: This will delete all data in these tables!

-- Drop tables (cascades to dependent objects)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS company_approval_requests CASCADE;

-- Remove columns from user_resume
ALTER TABLE user_resume 
DROP COLUMN IF EXISTS company_id,
DROP COLUMN IF EXISTS company_approved;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_company_approval_request_updated_at() CASCADE;
```

## Next Steps

After completing the database setup:

1. **Test the Application**
   - Try creating a resume entry with a company association
   - Check if approval requests are created
   - Verify notifications appear

2. **Monitor Performance**
   - Check query performance in Supabase dashboard
   - Review slow query logs
   - Adjust indexes if needed

3. **Set Up Monitoring**
   - Enable Supabase logging
   - Set up alerts for errors
   - Monitor RLS policy violations

4. **Documentation**
   - Document any custom changes you make
   - Keep track of migration versions
   - Update team on new features

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **SQL Reference:** https://www.postgresql.org/docs/
- **Project Documentation:**
  - `COMPANY_APPROVAL_SYSTEM.md` - Approval system overview
  - `DATABASE_MIGRATION_INSTRUCTIONS.md` - Original migration guide
  - `DATABASE_MIGRATION_RESUME_SOURCE.md` - Resume source enum update

## Summary

This migration sets up a complete approval and notification system that allows:
- Users to associate their resume entries with companies
- Company owners to approve or reject these associations
- System-wide notifications for various events
- Proper security through Row Level Security policies
- Optimized queries through strategic indexing

All changes are production-ready and follow Supabase best practices.
