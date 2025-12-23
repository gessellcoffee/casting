# Database Migration Instructions

## Overview
This document provides step-by-step instructions for applying database changes for the casting application.

## Prerequisites
- Access to your Supabase project dashboard
- SQL Editor access in Supabase

## Migration Steps

### Latest Migration: Add audition_location Column (2025-01-22)

**File:** `DATABASE_MIGRATION_AUDITION_LOCATION.sql`

Run this SQL in your Supabase SQL Editor:

```sql
-- Add audition_location column to auditions table
ALTER TABLE auditions
ADD COLUMN audition_location TEXT;

-- Add comment to document the column
COMMENT ON COLUMN auditions.audition_location IS 'Primary location where auditions will be held';

-- Create an index for searching by location
CREATE INDEX IF NOT EXISTS idx_auditions_location ON auditions(audition_location);
```

**Verification:**
```sql
-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auditions' AND column_name = 'audition_location';
```

**Expected Result:**
- Column name: `audition_location`
- Data type: `text`
- Is nullable: `YES`

---

### Step 1: Update user_resume Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add new columns to user_resume table
ALTER TABLE user_resume 
ADD COLUMN IF NOT EXISTS company_id UUID,
ADD COLUMN IF NOT EXISTS company_approved BOOLEAN DEFAULT NULL;

-- Add foreign key constraint
ALTER TABLE user_resume 
ADD CONSTRAINT user_resume_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(company_id) 
ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_resume_company_id 
ON user_resume(company_id);
```

### Step 2: Create company_approval_requests Table

```sql
-- Create the approval requests table
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
```

### Step 3: Create Indexes for Performance

```sql
-- Create indexes for faster queries
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
```

### Step 4: Set Up Row Level Security (RLS)

```sql
-- Enable RLS on the new table
ALTER TABLE company_approval_requests ENABLE ROW LEVEL SECURITY;

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
```

### Step 5: Create Helper Function (Optional but Recommended)

```sql
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_approval_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
CREATE TRIGGER update_company_approval_request_updated_at_trigger
BEFORE UPDATE ON company_approval_requests
FOR EACH ROW
EXECUTE FUNCTION update_company_approval_request_updated_at();
```

## Verification

After running the migrations, verify the changes:

```sql
-- Check user_resume table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_resume'
AND column_name IN ('company_id', 'company_approved');

-- Check company_approval_requests table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'company_approval_requests';

-- Check indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'company_approval_requests';

-- Check RLS policies
SELECT policyname, tablename 
FROM pg_policies 
WHERE tablename = 'company_approval_requests';
```

## Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Drop the approval requests table (this will cascade)
DROP TABLE IF EXISTS company_approval_requests CASCADE;

-- Remove columns from user_resume
ALTER TABLE user_resume 
DROP COLUMN IF EXISTS company_id,
DROP COLUMN IF EXISTS company_approved;

-- Drop the helper function
DROP FUNCTION IF EXISTS update_company_approval_request_updated_at() CASCADE;
```

## Testing the Migration

After migration, test with these queries:

```sql
-- Test 1: Insert a test approval request
INSERT INTO company_approval_requests (
  resume_entry_id,
  company_id,
  user_id,
  status
) VALUES (
  'test-resume-id',
  'test-company-id',
  'test-user-id',
  'pending'
);

-- Test 2: Query pending requests
SELECT * FROM company_approval_requests 
WHERE status = 'pending';

-- Test 3: Update a request
UPDATE company_approval_requests 
SET status = 'approved' 
WHERE request_id = 'test-request-id';

-- Clean up test data
DELETE FROM company_approval_requests 
WHERE resume_entry_id = 'test-resume-id';
```

## Post-Migration Checklist

- [ ] All SQL scripts executed successfully
- [ ] Verification queries return expected results
- [ ] RLS policies are enabled and working
- [ ] Indexes are created
- [ ] Test queries work as expected
- [ ] Application can connect and query the new tables
- [ ] No errors in Supabase logs

## Troubleshooting

### Error: "relation already exists"
- This means the table or column already exists
- Check if migration was already run
- Use `IF NOT EXISTS` clauses (already included in scripts above)

### Error: "foreign key constraint violation"
- Ensure referenced tables (companies, user_resume, profiles) exist
- Check that the referenced columns have the correct data types

### Error: "permission denied"
- Ensure you have sufficient privileges in Supabase
- Check RLS policies aren't blocking your queries

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify all prerequisite tables exist
3. Ensure foreign key relationships are correct
4. Review RLS policies if queries are blocked
