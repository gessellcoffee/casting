# Row-Level Security Policies for user_resume Table

## Problem
The error `new row violates row-level security policy for table "user_resume"` indicates that RLS is enabled on the `user_resume` table, but there are no policies allowing users to insert/update/delete their own resume entries.

## Solution
Run the following SQL commands in your Supabase SQL Editor to create the necessary RLS policies:

```sql
-- Enable RLS on user_resume table (if not already enabled)
ALTER TABLE user_resume ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own resume entries
CREATE POLICY "Users can view own resume entries"
ON user_resume
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own resume entries
CREATE POLICY "Users can insert own resume entries"
ON user_resume
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own resume entries
CREATE POLICY "Users can update own resume entries"
ON user_resume
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own resume entries
CREATE POLICY "Users can delete own resume entries"
ON user_resume
FOR DELETE
USING (auth.uid() = user_id);
```

## Alternative: If policies already exist

If you get errors about policies already existing, you may need to drop and recreate them:

```sql
-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own resume entries" ON user_resume;
DROP POLICY IF EXISTS "Users can insert own resume entries" ON user_resume;
DROP POLICY IF EXISTS "Users can update own resume entries" ON user_resume;
DROP POLICY IF EXISTS "Users can delete own resume entries" ON user_resume;

-- Then run the CREATE POLICY commands above
```

## Steps to Execute

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Paste the SQL commands above
5. Run the query

## Verification

After running the migration, try adding a resume entry again. The RLS error should be resolved.

## What These Policies Do

- **SELECT policy**: Users can only view their own resume entries
- **INSERT policy**: Users can only create resume entries for themselves
- **UPDATE policy**: Users can only update their own resume entries
- **DELETE policy**: Users can only delete their own resume entries

All policies use `auth.uid()` which returns the currently authenticated user's ID, ensuring users can only access their own data.
