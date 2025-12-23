# Fix Events RLS for Availability Viewing

## Problem
The UserProfileModal cannot display busy times for other users because the Row Level Security (RLS) policy on the `events` table only allows users to view their own events.

## Root Cause
The current RLS policy:
```sql
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = user_id);
```

This policy blocks queries like `getUserAvailability(otherUserId)` because the authenticated user is not the owner of those events.

## Solution
Add an additional RLS policy that allows authenticated users to view other users' events for availability checking purposes. The `getUserAvailability` function already protects privacy by:
- Replacing event titles with "Busy"
- Removing descriptions
- Removing locations
- Only showing start/end times

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `FIX_EVENTS_RLS_FOR_AVAILABILITY.sql`
4. Click **Run**

### Option 2: Supabase CLI
```bash
supabase db push --file migrations/FIX_EVENTS_RLS_FOR_AVAILABILITY.sql
```

### Option 3: psql
```bash
psql -h your-db-host -U postgres -d your-database -f migrations/FIX_EVENTS_RLS_FOR_AVAILABILITY.sql
```

## Verification
After applying the migration:
1. Open the UserProfileModal for a user who has events
2. Check the browser console for:
   - `[getUserAvailability] Non-recurring events found: X` (where X > 0)
   - `[getUserAvailability] Total events returned: X` (where X > 0)
3. Verify that busy days show up on the calendar with red borders
4. Verify that the "Busy Times" section appears below the calendar

## Security Considerations
- ✅ Event titles are hidden (replaced with "Busy")
- ✅ Descriptions are hidden
- ✅ Locations are hidden
- ✅ Only start/end times are visible
- ✅ Only authenticated users can view (not anonymous)
- ✅ This matches the privacy model where availability is public but details are private

## Rollback
If you need to rollback this change:
```sql
-- Remove the new policy
DROP POLICY IF EXISTS "Authenticated users can view events for availability" ON public.events;

-- The original "Users can view their own events" policy will remain
```
