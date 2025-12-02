# Audition Signup Fixes - Summary

## Issues Fixed

### Issue 1: Missing audition_id Column ✅
**Error**: `Could not find the 'audition_id' column of 'audition_signups' in the schema cache`

**Root Cause**: The `audition_signups` table never had an `audition_id` column. The code was incorrectly trying to insert it.

**Solution**:
1. Fixed TypeScript types in `src/lib/supabase/types.ts`
   - Removed `audition_id` from `AuditionSignup` interface
   - Removed `audition_id` from `AuditionSignupInsert` interface
   - Made `slot_id` required (not optional)

2. Fixed calling code:
   - `src/components/auditions/SlotsList.tsx` - Removed `audition_id` from signup call
   - `src/components/auditions/AuditionSignupModal.tsx` - Removed `audition_id` from signup call

**How It Works**: Audition relationship is maintained through slots:
```
audition_signups.slot_id → audition_slots.slot_id → audition_slots.audition_id → auditions
```

### Issue 2: Ambiguous Profile Relationships ✅
**Error**: `Could not embed because more than one relationship was found for 'audition_signups' and 'profiles'`

**Root Cause**: The `audition_signups` table has TWO foreign keys to the `profiles` table:
1. `user_id` → profiles (the actor who signed up)
2. `last_updated_by` → profiles (who last updated the signup)

When queries used `profiles (...)` without specifying which foreign key, Supabase couldn't determine which relationship to use.

**Solution**: Fixed all queries in `src/lib/supabase/auditionSignups.ts` to explicitly specify the foreign key:

Changed from:
```typescript
profiles (
  id,
  first_name,
  last_name,
  profile_photo_url
)
```

To:
```typescript
profiles!audition_signups_user_id_fkey (
  id,
  first_name,
  last_name,
  profile_photo_url
)
```

**Functions Fixed**:
- `getAuditionSignupWithDetails()` - auditionSignups.ts
- `getAuditionSignups()` - auditionSignups.ts
- `getSignupsByStatus()` - auditionSignups.ts
- `getSignupsForSlots()` - auditionSignups.ts
- `getSignupWithDetails()` - auditionSignups.ts
- `getAllAuditionees()` - virtualAuditions.ts

## Database Schema Clarifications

### audition_signups Table Structure:
- `signup_id` (PK)
- `slot_id` (FK → audition_slots) - **NOT audition_id**
- `user_id` (FK → profiles) - The actor who signed up
- `last_updated_by` (FK → profiles) - Who last updated the record
- `notes`
- `status`
- `created_at`
- `updated_at`

### Foreign Key Naming Convention:
When you have multiple foreign keys from one table to another, Supabase creates named foreign keys:
- `{table}_{column}_fkey` format
- Example: `audition_signups_user_id_fkey`

In queries, specify the exact foreign key using `!{fkey_name}`:
```typescript
profiles!audition_signups_user_id_fkey (...)
```

## Files Modified

1. ✅ `src/lib/supabase/types.ts` - Fixed type definitions
2. ✅ `src/components/auditions/SlotsList.tsx` - Fixed signup call
3. ✅ `src/components/auditions/AuditionSignupModal.tsx` - Fixed signup call
4. ✅ `src/lib/supabase/auditionSignups.ts` - Fixed all profile queries (5 functions)
5. ✅ `src/lib/supabase/virtualAuditions.ts` - Fixed getAllAuditionees() profile query

## Testing
After these fixes:
1. ✅ Users can sign up for audition slots without errors
2. ✅ Cast-Show page displays audition signups correctly
3. ✅ Callbacks page displays audition signups correctly
4. ✅ All profile data loads correctly (actor info, photos, etc.)
5. ✅ Virtual auditions display correctly with actor profiles

## Callback Invitations 406 Error (Separate Issue)

If you're still seeing a 406 error for callback_invitations queries like:
```
GET /callback_invitations?select=invitation_id,callback_slots(...) 406 (Not Acceptable)
```

This is likely an RLS (Row Level Security) policy issue, not related to the ambiguous relationships. The 406 error typically means:
1. The authenticated user doesn't have permission to access the data
2. An RLS policy is blocking the query
3. The nested query path violates security rules

**To investigate**:
- Check RLS policies on `callback_invitations`, `callback_slots`, and `auditions` tables
- Verify the user is authenticated
- Check if the user has the necessary permissions to view the data
- Review the RLS policies in `DATABASE_MIGRATION_CALLBACKS.sql`

## Prevention
When creating tables with multiple foreign keys to the same table:
1. Always specify explicit foreign key names in queries
2. Use the format: `table!{table}_{column}_fkey (...)`
3. Document which foreign key represents what relationship
4. Update TypeScript types to match actual database schema
