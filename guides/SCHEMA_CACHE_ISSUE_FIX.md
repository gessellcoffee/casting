# Audition Signup Error - Fix Guide

## Problem
When users try to sign up for an audition slot, they get the following error:
```
Could not find the 'audition_id' column of 'audition_signups' in the schema cache
```

## Root Cause - FIXED ✅
The **actual root cause** was incorrect TypeScript types and code passing `audition_id` to the `audition_signups` table, which **doesn't have an `audition_id` column**.

The `audition_signups` table structure:
- `signup_id` (PK)
- `slot_id` (FK to audition_slots)
- `user_id` (FK to profiles)
- `notes`
- `status`
- `created_at`
- `updated_at`

The audition_id comes from the **slot relationship**, not as a direct column. The code was incorrectly trying to insert `audition_id` directly into the table.

## Solution - COMPLETED ✅

The following fixes were applied:

### 1. Fixed TypeScript Types (`src/lib/supabase/types.ts`)
Removed `audition_id` from:
- `AuditionSignup` interface
- `AuditionSignupInsert` interface

Changed `AuditionSignupInsert` to only require:
```typescript
export interface AuditionSignupInsert {
  slot_id: string;
  user_id: string;
  notes?: string | null;
  status?: string | null;
}
```

### 2. Fixed SlotsList Component (`src/components/auditions/SlotsList.tsx`)
Changed signup call from:
```typescript
// BEFORE (incorrect)
await createAuditionSignup({
  audition_id: auditionId,
  slot_id: slotId,
  user_id: user.id,
});
```
To:
```typescript
// AFTER (correct)
await createAuditionSignup({
  slot_id: slotId,
  user_id: user.id,
});
```

### 3. Fixed AuditionSignupModal Component (`src/components/auditions/AuditionSignupModal.tsx`)
Applied the same fix - removed `audition_id` from the signup data.

## How the Signup Process Works

The correct flow:
1. User selects a slot (which has `slot_id` and belongs to an audition via `audition_slots.audition_id`)
2. Code calls `createAuditionSignup()` with only `slot_id` and `user_id`
3. The function internally fetches the audition_id from the slot (line 237-241 in `auditionSignups.ts`)
4. The signup is created with just `slot_id` and `user_id`
5. The audition relationship is maintained through the slot

## Verification
Test by:
1. Create or update an audition
2. Have a user sign up for a slot
3. The signup should now succeed without errors

## Related Files
- ✅ `src/lib/supabase/types.ts` - Fixed type definitions
- ✅ `src/components/auditions/SlotsList.tsx` - Fixed signup call
- ✅ `src/components/auditions/AuditionSignupModal.tsx` - Fixed signup call
- `src/lib/supabase/auditionSignups.ts` - Signup functionality (no changes needed)
- `src/app/auditions/[id]/page.tsx` - Audition detail page where signups occur

## Key Takeaway
The `audition_signups` table **never had** an `audition_id` column. The relationship to auditions is maintained through:
```
audition_signups.slot_id → audition_slots.slot_id → audition_slots.audition_id → auditions.audition_id
```

The error message was misleading - it wasn't a cache issue, it was the code trying to insert a column that doesn't exist in the table schema.
