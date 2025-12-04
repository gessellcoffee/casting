# Quick Fix: Cast Member Access Issue

## Problem
Cast members see "Show not found" when viewing their productions.

## Cause
Database RLS policies are too restrictive - they only allow owners and production team to view audition data.

## Solution (2 Steps)

### Step 1: Run Database Migration

**Go to Supabase Dashboard:**
1. Open your project at https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy ALL the SQL below and paste it:

```sql
-- Migration: Add RLS policy to allow cast members to view auditions they're cast in
-- Created: 2024-12-04

-- =====================================================
-- HELPER FUNCTION: Check if user is cast in audition
-- =====================================================
CREATE OR REPLACE FUNCTION is_cast_in_audition(target_audition_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cast_members
    WHERE cast_members.audition_id = target_audition_id
    AND cast_members.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- AUDITIONS TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their managed auditions" ON auditions;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view their auditions" ON auditions
FOR SELECT USING (
  can_manage_audition(auditions.audition_id)
  OR
  is_cast_in_audition(auditions.audition_id)
);

-- =====================================================
-- AUDITION_ROLES TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view roles for their auditions" ON audition_roles;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view audition roles" ON audition_roles
FOR SELECT USING (
  can_manage_audition(audition_roles.audition_id)
  OR
  is_cast_in_audition(audition_roles.audition_id)
);

-- =====================================================
-- AUDITION_SLOTS TABLE
-- =====================================================

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view slots for their auditions" ON audition_slots;

-- Add new policy that includes cast member access
CREATE POLICY "Users can view audition slots" ON audition_slots
FOR SELECT USING (
  can_manage_audition(audition_slots.audition_id)
  OR
  is_cast_in_audition(audition_slots.audition_id)
);
```

5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 2: Verify Fix

1. **Refresh your local dev server** (if it's running):
   - Stop the server (Ctrl+C)
   - Restart: `npm run dev`

2. **Test the fix**:
   - Log in as a cast member (not the production owner)
   - Go to `/my-shows`
   - Click on a show you're cast in
   - You should now see the production details and calendar ✅

## What This Does

The migration adds a helper function and updates RLS policies to allow cast members to:
- ✅ **View** audition details
- ✅ **View** roles
- ✅ **View** audition slots
- ✅ **View** all production information

Cast members still **cannot**:
- ❌ Edit production details
- ❌ Manage callbacks
- ❌ Cast other actors
- ❌ Delete productions

## Files Changed

The code changes I made will work once the migration is applied:

1. **New function**: `getUserCastShowsFromCastMembers()` in `src/lib/supabase/auditionSignups.ts`
   - Queries `cast_members` table instead of `audition_signups`
   - Gets all cast members regardless of how they were cast

2. **Updated calendar page**: `src/app/my-shows/[auditionId]/calendar/page.tsx`
   - Uses both signup-based and cast_members-based data
   - Properly displays role info for all cast members

## Troubleshooting

**If it still doesn't work:**

1. Check the browser console for errors (F12 → Console tab)
2. Check the Network tab to see if the API calls are returning data
3. Verify the migration ran successfully in Supabase
4. Make sure you're logged in as the correct user (cast member, not owner)

**Common issues:**
- Migration not applied → Run the SQL in Supabase dashboard
- Browser cache → Hard refresh (Ctrl+Shift+R)
- Old session → Log out and log back in
