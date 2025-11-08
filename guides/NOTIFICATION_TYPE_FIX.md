# Notification Type Fix

## Problem

The TypeScript error `Module '"@/lib/supabase/types"' has no exported member 'NotificationType'` occurred because:

1. **Missing Type Export**: The `NotificationType` type was not exported from `types.ts`
2. **Database Constraint Mismatch**: The code uses `'casting_offer'` as a notification type, but the database CHECK constraint only allowed:
   - `'company_approval'`
   - `'user_affiliation'`
   - `'casting_decision'`
   - `'general'`

## Solution

### 1. Created Dedicated Type Definition File

**File**: `src/lib/supabase/notificationTypes.ts`

```typescript
export type NotificationType = 
  | 'company_approval'
  | 'user_affiliation'
  | 'casting_decision'
  | 'casting_offer'
  | 'general';

export const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'company_approval',
  'user_affiliation',
  'casting_decision',
  'casting_offer',
  'general',
];
```

**Benefits**:
- Centralized type definition
- Easy to maintain and update
- Includes validation array for runtime checks
- Avoids issues with types.ts file (which had encoding problems)

### 2. Updated Imports

**Files Updated**:
- `src/app/api/send-notification-email/route.ts`
- `src/lib/email/emailService.ts`

Changed from:
```typescript
import type { NotificationType } from '@/lib/supabase/types';
```

To:
```typescript
import type { NotificationType } from '@/lib/supabase/notificationTypes';
```

### 3. Database Migration Required

**File**: `migrations/ADD_CASTING_OFFER_NOTIFICATION_TYPE.sql`

This migration updates the database CHECK constraint to include `'casting_offer'`:

```sql
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'company_approval', 
  'user_affiliation', 
  'casting_decision', 
  'casting_offer',
  'general'
));
```

**Action Required**: Run this migration in your Supabase SQL Editor.

## Files Modified

1. ✅ `src/lib/supabase/notificationTypes.ts` - Created
2. ✅ `src/app/api/send-notification-email/route.ts` - Import updated
3. ✅ `src/lib/email/emailService.ts` - Import updated
4. ✅ `migrations/ADD_CASTING_OFFER_NOTIFICATION_TYPE.sql` - Created

## Testing

After running the migration, verify:

1. TypeScript errors are resolved
2. Casting offers create notifications successfully
3. Email notifications are sent for casting offers
4. No database constraint violations occur

## Future Considerations

If you need to add more notification types:

1. Update `NotificationType` in `notificationTypes.ts`
2. Update `VALID_NOTIFICATION_TYPES` array
3. Run a migration to update the database CHECK constraint
4. Update email templates in `emailService.ts` if needed
