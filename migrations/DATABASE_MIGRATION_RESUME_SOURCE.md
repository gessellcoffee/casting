# Database Migration: Update Resume Source Enum

## Problem
The `resume_source_enum` in the database needs to be updated to include `'manual'` and `'application'` values.

## Solution
Run the following SQL commands in your Supabase SQL Editor:

```sql
-- Add 'manual' and 'application' to the resume_source_enum
ALTER TYPE resume_source_enum ADD VALUE IF NOT EXISTS 'manual';
ALTER TYPE resume_source_enum ADD VALUE IF NOT EXISTS 'application';
```

## Steps to Execute

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Paste the SQL commands above
5. Run the query

## Alternative: If the above doesn't work

If you get an error about adding values to an enum, you may need to use this approach:

```sql
-- IMPORTANT: Run these commands in order

-- Step 1: Set a temporary default for existing rows
UPDATE user_resume SET source = 'Manual' WHERE source IS NULL;

-- Step 2: Create a new enum type with all values
CREATE TYPE resume_source_enum_new AS ENUM (
  'Manual',
  'Application'
);

-- Step 3: Set default BEFORE changing the type
ALTER TABLE user_resume 
  ALTER COLUMN source SET DEFAULT 'Manual';

-- Step 4: Update the table to use the new enum
ALTER TABLE user_resume 
  ALTER COLUMN source TYPE resume_source_enum_new 
  USING COALESCE(source::text, 'Manual')::resume_source_enum_new;

-- Step 5: Drop the old enum and rename the new one
DROP TYPE resume_source_enum;
ALTER TYPE resume_source_enum_new RENAME TO resume_source_enum;
```

## Verification

After running the migration, try adding a resume entry again.

**Note**: If you get an RLS (Row-Level Security) error, you'll also need to set up RLS policies. See `RLS_POLICIES_USER_RESUME.md` for the required policies.

## What Changed in the Code

- **types.ts**: 
  - Updated `resume_source_enum` to include `'manual'` and `'application'`
  - Made `source` optional in the Insert type (it will auto-populate from database default)
- **ResumeSection.tsx**: Removed `source` field from form - it auto-populates as `'Manual'` in the database
- **ResumeEntry.tsx**: Entries with `source: 'application'` display a green checkmark icon

## How It Works

- When a user manually adds a resume entry through the form, the database automatically sets `source = 'Manual'`
- When a user is cast through an audition event, the system will set `source = 'Application'`
- Entries with `source = 'Application'` show a green checkmark to indicate they were cast through the platform
