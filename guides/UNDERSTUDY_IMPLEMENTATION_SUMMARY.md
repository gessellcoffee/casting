# Understudy System Implementation Summary

## What Was Implemented

I've implemented a complete understudy support system that allows you to:
1. Mark roles as needing understudies with a checkbox
2. Keep all roles as "Principal" characters
3. Assign separate actors to Principal and Understudy positions during casting
4. Avoid creating duplicate role entries

## Files Created

### 1. `DATABASE_MIGRATION_UNDERSTUDY_SUPPORT.sql`
Database migration script that adds:
- `needs_understudy` column to `roles` table
- `is_understudy` column to `cast_members` table
- Indexes for performance
- Unique constraint to prevent duplicate assignments

### 2. `UNDERSTUDY_SYSTEM_GUIDE.md`
Comprehensive documentation covering:
- How the system works
- How to use it
- Code examples
- Migration instructions
- Future enhancements

### 3. `UNDERSTUDY_IMPLEMENTATION_SUMMARY.md`
This file - a quick reference for what was done

## Files Modified

### 1. `src/lib/supabase/types.ts`
**Changes:**
- Added `needs_understudy: boolean` to `roles` table types (Row, Insert, Update)
- Added `is_understudy: boolean` to `cast_members` table types (Row, Insert, Update)

### 2. `src/app/shows/[id]/page.tsx`
**Changes:**
- Added `needs_understudy: false` to new role initialization
- Added understudy checkbox to new role form
- Added understudy checkbox to role edit form
- Added "+ Understudy" badge display on role cards
- Updated state management to include `needs_understudy` field

### 3. `src/components/casting/RoleManager.tsx`
**Changes:**
- Added `needs_understudy: boolean` to `RoleFormData` interface
- Added `needs_understudy: false` to new role initialization
- Added understudy checkbox to role form
- Fixed TypeScript type issues with null handling

### 4. `src/lib/supabase/castMembers.ts`
**New Functions Added:**
- `getRolePrincipal()` - Get the principal actor for a role
- `getRoleUnderstudy()` - Get the understudy actor for a role
- `getRoleCasting()` - Get both principal and understudy for a role
- `isRolePrincipalFilled()` - Check if principal position is filled
- `isRoleUnderstudyFilled()` - Check if understudy position is filled

## How to Deploy

### Step 1: Run Database Migration
1. Open Supabase SQL Editor
2. Copy contents of `DATABASE_MIGRATION_UNDERSTUDY_SUPPORT.sql`
3. Execute the script
4. Verify with the verification queries in the script

### Step 2: Test the System
1. Navigate to a show detail page (`/shows/[id]`)
2. Create a new role
3. Check the "This role needs an understudy" checkbox
4. Save the role
5. Verify the "+ Understudy" badge appears

### Step 3: Use in Casting
When you're ready to cast actors:

```typescript
import { createCastMember } from '@/lib/supabase/castMembers';

// Cast the principal
await createCastMember({
  audition_id: 'your-audition-id',
  user_id: 'principal-actor-id',
  role_id: 'role-id',
  status: 'Offered',
  is_understudy: false  // Principal
});

// Cast the understudy (only if role.needs_understudy is true)
await createCastMember({
  audition_id: 'your-audition-id',
  user_id: 'understudy-actor-id',
  role_id: 'role-id',  // Same role!
  status: 'Offered',
  is_understudy: true  // Understudy
});
```

## Key Benefits

✅ **No Duplicate Roles**: Create "Eliza Hamilton" once, not "Eliza Hamilton" and "Eliza Hamilton (Understudy)"

✅ **Clear Data Model**: The `is_understudy` flag makes it crystal clear who's who

✅ **Flexible Casting**: Easily assign and reassign principals and understudies

✅ **Database Constraints**: Prevents accidentally assigning multiple principals or understudies to the same role

✅ **Visual Indicators**: Roles with understudies show a "+ Understudy" badge

## What's Next

To complete the casting workflow, you may want to:

1. **Build Casting UI**: Create a page/component where casting directors can:
   - View all audition signups
   - Assign actors to principal and understudy positions
   - See which roles still need to be filled

2. **Cast List Display**: Show cast lists with clear principal/understudy distinctions

3. **Notifications**: Send different notifications to principals vs understudies

4. **Reports**: Generate printable cast lists

## Example Usage

### Creating a Role with Understudy
```typescript
// In the UI, user checks "This role needs an understudy"
const newRole = {
  show_id: 'show-123',
  role_name: 'Eliza Hamilton',
  role_type: 'Principal',
  gender: 'feminine',
  needs_understudy: true  // ← This is the key
};

await createRole(newRole);
```

### Querying Cast Members
```typescript
import { getRoleCasting } from '@/lib/supabase/castMembers';

// Get both principal and understudy
const { principal, understudy } = await getRoleCasting(
  'audition-123',
  'role-eliza-id'
);

console.log('Principal:', principal?.profiles?.first_name);
console.log('Understudy:', understudy?.profiles?.first_name);
```

## Database Schema Changes

### Before
```
roles: role_id, show_id, role_name, description, role_type, gender
cast_members: cast_member_id, audition_id, user_id, role_id, status
```

### After
```
roles: role_id, show_id, role_name, description, role_type, gender, needs_understudy
cast_members: cast_member_id, audition_id, user_id, role_id, status, is_understudy
```

## Rollback Instructions

If you need to rollback this change:

```sql
-- Uncomment and run these commands in Supabase SQL Editor
DROP INDEX IF EXISTS idx_cast_members_unique_principal;
DROP INDEX IF EXISTS idx_cast_members_is_understudy;
DROP INDEX IF EXISTS idx_roles_needs_understudy;
ALTER TABLE cast_members DROP COLUMN IF EXISTS is_understudy;
ALTER TABLE roles DROP COLUMN IF EXISTS needs_understudy;
```

## Support

All changes follow your project's existing patterns:
- ✅ TypeScript types are properly defined
- ✅ Database queries use Supabase client
- ✅ UI follows the cosmic theme styling
- ✅ Error handling is consistent
- ✅ No breaking changes to existing functionality

The system is backward compatible - existing roles without `needs_understudy` will default to `false`, and existing cast members without `is_understudy` will default to `false` (principal).
