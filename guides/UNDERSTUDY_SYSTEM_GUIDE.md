# Understudy System Guide

## Overview

The understudy system allows you to mark roles as needing understudies and assign separate actors to both the principal and understudy positions for the same role, without creating duplicate role entries.

## Key Features

1. **Single Role Entry**: Create one role (e.g., "Eliza Hamilton") instead of two separate entries
2. **Understudy Checkbox**: Mark roles that need understudies with a simple checkbox
3. **Dual Casting**: Assign different actors to the principal and understudy positions
4. **Visual Indicators**: Roles with understudies show a badge in the UI

## Database Schema

### Roles Table
- `needs_understudy` (boolean): Indicates if this role requires an understudy

### Cast Members Table
- `is_understudy` (boolean): Indicates if this cast member is the understudy (true) or principal (false)

## How to Use

### 1. Creating Roles with Understudies

When creating or editing a role in the Show Detail page:

1. Fill in the role name (e.g., "Eliza Hamilton")
2. Select role type as "Principal"
3. Check the **"This role needs an understudy"** checkbox
4. Save the role

The role will now display with a "+ Understudy" badge.

### 2. Casting Principal and Understudy

When assigning actors during the casting process:

```typescript
// Example: Casting a principal
await createCastMember({
  audition_id: 'audition-123',
  user_id: 'actor-principal-id',
  role_id: 'role-eliza-id',
  status: 'Offered',
  is_understudy: false  // This is the principal
});

// Example: Casting an understudy for the same role
await createCastMember({
  audition_id: 'audition-123',
  user_id: 'actor-understudy-id',
  role_id: 'role-eliza-id',  // Same role_id
  status: 'Offered',
  is_understudy: true  // This is the understudy
});
```

### 3. Querying Cast Members

```typescript
// Get all cast members for a role
const castMembers = await getRoleCastMembers('role-eliza-id');

// Filter for principal
const principal = castMembers.find(cm => !cm.is_understudy);

// Filter for understudy
const understudy = castMembers.find(cm => cm.is_understudy);
```

## Migration Instructions

### Step 1: Run the Database Migration

1. Open your Supabase SQL Editor
2. Copy the contents of `DATABASE_MIGRATION_UNDERSTUDY_SUPPORT.sql`
3. Execute the migration script
4. Verify the migration with the verification queries in the script

### Step 2: Update Existing Code

The TypeScript types have been updated to include:
- `Role.needs_understudy`
- `CastMember.is_understudy`

All role creation and editing forms now include the understudy checkbox.

## UI Components Updated

### Show Detail Page (`/shows/[id]`)
- ✅ New role form includes understudy checkbox
- ✅ Role edit form includes understudy checkbox
- ✅ Role cards display "+ Understudy" badge when `needs_understudy` is true

### Role Manager Component
- ✅ Audition creation flow includes understudy checkbox for each role

## Future Enhancements

To complete the casting workflow, you'll need to:

1. **Update Casting UI**: Create a component that allows casting directors to assign both principal and understudy actors to roles marked with `needs_understudy`

2. **Cast List Display**: Show both principal and understudy assignments in cast lists

3. **Notifications**: Send different notifications to principals vs understudies

4. **Reporting**: Generate cast lists that clearly distinguish principals from understudies

## Example Casting UI Component

Here's a conceptual example of how the casting UI might work:

```tsx
function RoleCastingCard({ role, auditionId }: { role: Role, auditionId: string }) {
  const [principalUserId, setPrincipalUserId] = useState<string | null>(null);
  const [understudyUserId, setUnderstudyUserId] = useState<string | null>(null);

  const handleCastPrincipal = async () => {
    await createCastMember({
      audition_id: auditionId,
      user_id: principalUserId!,
      role_id: role.role_id,
      status: 'Offered',
      is_understudy: false
    });
  };

  const handleCastUnderstudy = async () => {
    if (!role.needs_understudy) return;
    
    await createCastMember({
      audition_id: auditionId,
      user_id: understudyUserId!,
      role_id: role.role_id,
      status: 'Offered',
      is_understudy: true
    });
  };

  return (
    <div className="role-casting-card">
      <h3>{role.role_name}</h3>
      
      {/* Principal Selection */}
      <div>
        <label>Principal</label>
        <UserSelector 
          value={principalUserId} 
          onChange={setPrincipalUserId} 
        />
        <button onClick={handleCastPrincipal}>Cast as Principal</button>
      </div>

      {/* Understudy Selection (only if needed) */}
      {role.needs_understudy && (
        <div>
          <label>Understudy</label>
          <UserSelector 
            value={understudyUserId} 
            onChange={setUnderstudyUserId} 
          />
          <button onClick={handleCastUnderstudy}>Cast as Understudy</button>
        </div>
      )}
    </div>
  );
}
```

## Benefits

1. **Cleaner Data Model**: No duplicate role entries cluttering your database
2. **Flexible Casting**: Easily assign and reassign principals and understudies
3. **Clear Distinction**: Always know who's the principal and who's the understudy
4. **Scalable**: Works for any number of roles, from small shows to large productions

## Database Constraints

The migration includes a unique constraint to ensure:
- Only ONE principal per role per audition
- Only ONE understudy per role per audition

This prevents accidental duplicate assignments.

## Testing

After running the migration, test the following:

1. ✅ Create a new role with `needs_understudy` checked
2. ✅ Edit an existing role to add/remove understudy requirement
3. ✅ Verify the "+ Understudy" badge appears on roles
4. ✅ Create cast members with `is_understudy: false` (principal)
5. ✅ Create cast members with `is_understudy: true` (understudy)
6. ✅ Verify you cannot create duplicate principals or understudies for the same role

## Support

If you encounter any issues with the understudy system:
1. Check that the database migration ran successfully
2. Verify the TypeScript types are up to date
3. Ensure all components are using the updated `Role` and `CastMember` types
