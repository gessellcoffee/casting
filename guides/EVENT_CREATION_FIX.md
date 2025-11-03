# Event Creation Error Fix

## Problem
When creating a personal event, the application was throwing an error: `Error saving event: {}`

## Root Cause
The issue had two main components:

### 1. Schema Mismatch
The `createEvent` and `updateEvent` functions in `src/lib/supabase/events.ts` were trying to insert `recurrence_rule` as a JSONB column directly into the events table. However, the actual database schema uses:
- A separate `recurrence_rules` table
- A `recurrence_rule_id` foreign key in the events table

### 2. Missing RLS Policies
The `recurrence_rules` table only had a SELECT policy defined. It was missing:
- INSERT policy (preventing creation of recurrence rules)
- UPDATE policy (preventing modification of recurrence rules)
- DELETE policy (preventing deletion of recurrence rules)

## Solution

### 1. Updated Event Functions
Modified `src/lib/supabase/events.ts`:

- **`createEvent`**: Now creates a recurrence rule in the `recurrence_rules` table first (if recurring), then creates the event with the `recurrence_rule_id`
- **`updateEvent`**: Now properly handles updating or creating recurrence rules, and deletes them when no longer needed
- **`getEvents`**: Now joins with `recurrence_rules` table to fetch complete recurrence data
- **`mapRow`**: Updated to properly map the joined recurrence rule data

### 2. Added RLS Policies
Created migration file `migrations/FIX_RECURRENCE_RULES_RLS_POLICIES.sql` with:

- **INSERT policy**: Allows authenticated users to create recurrence rules
- **UPDATE policy**: Allows users to update recurrence rules for their own events
- **DELETE policy**: Allows users to delete recurrence rules for their own events

### 3. Improved Error Logging
Updated `EventForm.tsx` to log detailed error information:
- Error message
- Error details
- Error hint
- Error code
- Full error object

This helps with debugging future issues.

## How to Apply the Fix

1. **Run the migration**:
   ```sql
   -- Execute the SQL in: migrations/FIX_RECURRENCE_RULES_RLS_POLICIES.sql
   ```

2. **Restart the development server** to pick up the code changes

3. **Test event creation**:
   - Create a non-recurring event
   - Create a recurring event with different frequencies
   - Update an event to add/remove recurrence
   - Verify all operations work correctly

## Testing Checklist

- [ ] Create a non-recurring event
- [ ] Create a daily recurring event
- [ ] Create a weekly recurring event
- [ ] Create a monthly recurring event
- [ ] Create a custom recurring event
- [ ] Update a non-recurring event to be recurring
- [ ] Update a recurring event to be non-recurring
- [ ] Update a recurring event's recurrence pattern
- [ ] Delete a recurring event
- [ ] Verify RLS policies prevent unauthorized access

## Technical Details

### Database Schema
```sql
-- Events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    recurrence_rule_id UUID REFERENCES public.recurrence_rules(id),
    ...
);

-- Recurrence rules table
CREATE TABLE public.recurrence_rules (
    id UUID PRIMARY KEY,
    frequency TEXT NOT NULL,
    interval INTEGER NOT NULL DEFAULT 1,
    count INTEGER,
    until TIMESTAMPTZ,
    by_day TEXT[],
    by_month_day INTEGER[],
    by_month INTEGER[],
    ...
);
```

### Key Changes in Code

**Before (incorrect)**:
```typescript
const payload = {
  user_id: userId,
  title: form.title,
  recurrence_rule: form.isRecurring ? {...} : null, // Wrong!
};
```

**After (correct)**:
```typescript
// First create recurrence rule if needed
let recurrenceRuleId = null;
if (form.isRecurring) {
  const { data: ruleData } = await supabase
    .from('recurrence_rules')
    .insert({...})
    .select('id')
    .single();
  recurrenceRuleId = ruleData.id;
}

// Then create event with recurrence_rule_id
const payload = {
  user_id: userId,
  title: form.title,
  recurrence_rule_id: recurrenceRuleId, // Correct!
};
```
