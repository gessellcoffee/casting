# Cast Member View Access Fix

## Problem

Cast members could not view production details when clicking on a show from their "my-shows" page. They would see a "show doesn't exist" error even though they were cast in the production.

## Root Cause

The RLS (Row Level Security) policies on the `auditions` table and related tables were too restrictive. They only allowed:
- Audition owners
- Production team members
- Company members

Cast members who were offered or accepted roles had no permission to view the audition details, roles, or slots.

## Solution

Created a new database migration (`ADD_CAST_MEMBER_AUDITION_VIEW_ACCESS.sql`) that:

1. **Adds a helper function** `is_cast_in_audition(target_audition_id)` to check if a user is cast in an audition
2. **Updates RLS policies** on the following tables to allow cast members to view data:
   - `auditions` - View production details
   - `audition_roles` - View roles for the production
   - `audition_slots` - View audition time slots

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `migrations/ADD_CAST_MEMBER_AUDITION_VIEW_ACCESS.sql`
5. Paste and run the migration
6. Verify success - you should see "Success. No rows returned"

### Option 2: Supabase CLI

```bash
# Make sure you're in the casting directory
cd casting

# Apply the migration
supabase db push

# Or apply specific migration
supabase migration up
```

## What This Enables

After applying this migration, cast members can:
- ✅ View production details from "my-shows" page
- ✅ See roles for productions they're cast in
- ✅ View audition slots (if workflow is still in "auditioning" status)
- ✅ Access all production information relevant to their role

## What Cast Members Still Cannot Do

Cast members who don't own or aren't on the production team cannot:
- ❌ Edit production details
- ❌ Manage callbacks
- ❌ Cast other actors
- ❌ Delete the production
- ❌ Add/remove production team members

These management functions remain restricted to owners and production team members.

## Security Considerations

This change is **safe** because:
- It only grants **read access** (SELECT), not write access
- Cast members can only view productions they're actually cast in
- The `cast_members` table still has its own RLS policies protecting cast data
- All management functions remain protected by `can_manage_audition()` checks

## Testing

After applying the migration, test by:

1. Log in as a user who is cast in a production (but not the owner)
2. Navigate to `/my-shows`
3. Click on a show you're cast in
4. Verify you can see:
   - Production title and details
   - Show roles
   - Company information
   - Audition information panel

## Files Modified

- **Migration**: `migrations/ADD_CAST_MEMBER_AUDITION_VIEW_ACCESS.sql`
- **Documentation**: `guides/CAST_MEMBER_VIEW_ACCESS_FIX.md`

## Related Issues

This fix resolves the navigation from:
- "My Shows" page → Click show → Audition detail page
- Cast member calendar view → View production details

## Future Considerations

If you add more tables related to auditions that cast members should view, remember to:
1. Add `OR is_cast_in_audition(table_name.audition_id)` to the SELECT policy
2. Keep management operations (INSERT/UPDATE/DELETE) restricted to `can_manage_audition()`
