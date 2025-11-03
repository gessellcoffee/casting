# How to Apply the Event Creation Fix

## Quick Summary
The event creation error was caused by a mismatch between the code and database schema. The code was trying to insert recurrence rules as JSONB directly into the events table, but the database uses a separate `recurrence_rules` table. Additionally, the RLS policies for the `recurrence_rules` table were incomplete.

## Steps to Apply the Fix

### 1. Apply Database Migration
Run the SQL migration to add missing RLS policies:

```bash
# In your Supabase SQL Editor, run:
casting/migrations/FIX_RECURRENCE_RULES_RLS_POLICIES.sql
```

This adds INSERT, UPDATE, and DELETE policies for the `recurrence_rules` table.

### 2. Verify Code Changes
The following files have been updated (changes already made):

- ✅ `src/lib/supabase/events.ts` - Fixed to work with separate recurrence_rules table
- ✅ `src/components/events/EventForm.tsx` - Improved error logging
- ✅ `src/lib/supabase/__tests__/events.test.ts` - Added comprehensive tests

### 3. Test the Fix

#### Manual Testing
1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Test non-recurring event**:
   - Open the calendar
   - Click to create a new event
   - Fill in title, date, time
   - Leave "Recurrence" toggle OFF
   - Click "Create Event"
   - ✅ Event should be created successfully

3. **Test recurring event**:
   - Create a new event
   - Turn ON the "Recurrence" toggle
   - Select a frequency (Daily, Weekly, Monthly, etc.)
   - Set end conditions (Never, On date, After X occurrences)
   - Click "Create Event"
   - ✅ Event should be created successfully

4. **Test updating events**:
   - Edit an existing non-recurring event to add recurrence
   - Edit a recurring event to change the recurrence pattern
   - Edit a recurring event to remove recurrence
   - ✅ All updates should work

#### Automated Testing
Run the test suite:
```bash
npm test src/lib/supabase/__tests__/events.test.ts
```

### 4. Monitor for Errors
After applying the fix:

1. **Check browser console** - Should see detailed error logs if any issues occur
2. **Check Supabase logs** - Look for any RLS policy violations
3. **Verify data** - Check that events and recurrence_rules are being created in the database

## What Was Changed

### Database Schema (No changes needed - already correct)
```sql
-- Events table has recurrence_rule_id foreign key
CREATE TABLE events (
    ...
    recurrence_rule_id UUID REFERENCES recurrence_rules(id)
);

-- Separate recurrence_rules table
CREATE TABLE recurrence_rules (
    id UUID PRIMARY KEY,
    frequency TEXT NOT NULL,
    interval INTEGER,
    ...
);
```

### Code Changes

**Before (Incorrect)**:
```typescript
// Tried to insert recurrence_rule as JSONB
const payload = {
  recurrence_rule: form.isRecurring ? {...} : null
};
await supabase.from('events').insert(payload);
```

**After (Correct)**:
```typescript
// Create recurrence rule first, then reference it
let recurrenceRuleId = null;
if (form.isRecurring) {
  const { data } = await supabase
    .from('recurrence_rules')
    .insert({...})
    .select('id')
    .single();
  recurrenceRuleId = data.id;
}

const payload = {
  recurrence_rule_id: recurrenceRuleId
};
await supabase.from('events').insert(payload);
```

## Troubleshooting

### If you still see errors:

1. **"new row violates row-level security policy"**
   - Make sure you ran the migration SQL
   - Check that you're authenticated
   - Verify RLS policies in Supabase dashboard

2. **"null value in column recurrence_rule_id violates not-null constraint"**
   - This shouldn't happen with the fix
   - Check that `recurrence_rule_id` is nullable in your schema

3. **"Error saving event: {}"**
   - Check browser console for detailed error logs
   - The new error handling should show the actual error message

4. **Events not appearing in calendar**
   - Check that `getEvents` is being called
   - Verify the date range being queried
   - Check that events exist in the database

## Need Help?
- Review the detailed guide: `guides/EVENT_CREATION_FIX.md`
- Check the test file for examples: `src/lib/supabase/__tests__/events.test.ts`
- Look at the migration file: `migrations/FIX_RECURRENCE_RULES_RLS_POLICIES.sql`
