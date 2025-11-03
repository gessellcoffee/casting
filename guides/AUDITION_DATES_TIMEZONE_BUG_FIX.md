# Audition Dates Timezone Bug Fix

## Problem
The `DateArrayInput` component had a timezone bug where dates were being saved one day earlier than selected. For example, if a user clicked **10/17/2025**, it would save as **10/16/2025**.

### Root Cause
JavaScript's `new Date("2025-10-17")` creates a UTC date at midnight. When converted to local time in timezones west of UTC (like US timezones), the date shifts backward by one day.

## Solution

### 1. Component Fix (Already Applied)
The component has been fixed by adding a `parseLocalDate()` helper function that correctly parses YYYY-MM-DD strings as local dates instead of UTC dates.

**File**: `src/components/ui/DateArrayInput.tsx`

### 2. Database Migration (Required)
Existing dates in the database need to be corrected by incrementing them by one day.

**Migration File**: `migrations/FIX_AUDITION_DATES_TIMEZONE_BUG.sql`

## How to Run the Migration

### Step 1: Open Supabase SQL Editor
1. Log in to your Supabase project
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Migration Script
1. Copy the entire contents of `migrations/FIX_AUDITION_DATES_TIMEZONE_BUG.sql`
2. Paste it into the SQL Editor
3. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Step 3: Verify the Results
The script will automatically:
- ✅ Create a backup of all current `audition_dates`
- ✅ Increment each date by 1 day
- ✅ Show you a count of updated records
- ✅ Display a sample of old vs new dates for verification

### Step 4: Test the Fix
1. Create a new audition with audition dates
2. Select a date (e.g., 10/17/2025)
3. Save the audition
4. Verify in the database that it saved as 2025-10-17 (not 2025-10-16)

## What the Migration Does

### Creates a Backup
```sql
CREATE TABLE audition_dates_backup AS
SELECT audition_id, audition_dates, NOW() as backup_timestamp
FROM auditions
WHERE audition_dates IS NOT NULL;
```

This creates a safety net in case you need to rollback.

### Increments All Dates
```sql
UPDATE auditions
SET audition_dates = increment_dates_in_array(audition_dates)
WHERE audition_dates IS NOT NULL;
```

Uses a temporary function to parse each date in the JSONB array and add 1 day.

### Example Transformation
**Before (incorrect)**:
```json
["2025-10-16", "2025-10-17", "2025-10-18"]
```

**After (correct)**:
```json
["2025-10-17", "2025-10-18", "2025-10-19"]
```

## Rollback Instructions

If something goes wrong, the migration includes a rollback script:

```sql
-- Restore original dates from backup
UPDATE auditions a
SET audition_dates = b.audition_dates
FROM audition_dates_backup b
WHERE a.audition_id = b.audition_id;

-- Drop backup table
DROP TABLE audition_dates_backup;
```

## After Migration

### Cleanup (Optional)
Once you've verified everything is working correctly, you can drop the backup table:

```sql
DROP TABLE IF EXISTS audition_dates_backup;
```

### Monitor
Keep an eye on new auditions created after the fix to ensure dates are saving correctly going forward.

## Technical Details

### Affected Table
- **Table**: `auditions`
- **Column**: `audition_dates` (JSONB array of date strings)

### Date Format
Dates are stored in ISO 8601 format: `YYYY-MM-DD`

### Timezone Consideration
The fix ensures dates are interpreted as local dates, not UTC, preventing the off-by-one error for users in western timezones.
