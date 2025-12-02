# Production Team Member RLS Policies Guide

## Overview

This migration grants **production team members** the same permissions as audition owners for managing all aspects of a production, with **one exception**: only the audition owner can delete the audition itself.

## What Changed

### New Helper Function: `can_manage_audition()`

A PostgreSQL function that checks if the current user can manage an audition by verifying if they are:

1. **The audition owner** - Created the audition
2. **A production team member** - Added to `production_team_members` table
3. **A company member** - Part of the company with proper role (Owner/Admin/Member)

### Tables Updated

The following tables now grant full management permissions to production team members:

#### Core Audition Tables
- ✅ `auditions` - UPDATE only (NOT DELETE)
- ✅ `audition_roles` - Full access
- ✅ `audition_slots` - Full access

#### Casting Tables
- ✅ `cast_members` - Full access
- ✅ `callback_invitations` - Full access
- ✅ `casting_offers` - Full access
- ✅ `signup_notes` - Create notes, edit/delete own notes

#### Rehearsal Tables
- ✅ `rehearsal_events` - Full access
- ✅ `rehearsal_agenda_items` - Full access
- ✅ `agenda_assignments` - Assign/unassign cast members
- ✅ `performance_events` - Full access

#### Other Tables
- ✅ `virtual_audition_submissions` - View all submissions

## Permission Matrix

| Action | Owner | Production Team | Company Member | Notes |
|--------|-------|----------------|----------------|-------|
| **View audition** | ✅ | ✅ | ✅ | |
| **Edit audition details** | ✅ | ✅ | ✅ | Location, dates, workflow status, etc. |
| **Delete audition** | ✅ | ❌ | ❌ | **Owner only** |
| **Manage roles** | ✅ | ✅ | ✅ | Add, edit, delete roles |
| **Manage slots** | ✅ | ✅ | ✅ | Create, edit, delete audition slots |
| **Cast actors** | ✅ | ✅ | ✅ | Assign roles, manage understudy |
| **Send callbacks** | ✅ | ✅ | ✅ | Invite actors to callbacks |
| **Send casting offers** | ✅ | ✅ | ✅ | Make role offers |
| **Add signup notes** | ✅ | ✅ | ✅ | Collaborative notes |
| **Edit/delete notes** | Own only | Own only | Own only | Can only modify own notes |
| **Manage rehearsals** | ✅ | ✅ | ✅ | Schedule rehearsals and agenda |
| **Assign to agenda** | ✅ | ✅ | ✅ | Assign cast to rehearsal items |
| **View submissions** | ✅ | ✅ | ✅ | Virtual audition submissions |

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `ADD_PRODUCTION_TEAM_RLS_POLICIES.sql`
5. Click **Run** to execute
6. Verify success (see verification section below)

### Option 2: Command Line

```bash
# Using psql
psql -h your-db-host -U postgres -d your-database -f migrations/ADD_PRODUCTION_TEAM_RLS_POLICIES.sql

# Or using Supabase CLI
supabase db push migrations/ADD_PRODUCTION_TEAM_RLS_POLICIES.sql
```

## Verification

After running the migration, verify the policies were created:

```sql
-- View all policies for audition-related tables
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as operation
FROM pg_policies 
WHERE tablename IN (
  'auditions', 
  'audition_roles', 
  'audition_slots', 
  'cast_members',
  'callback_invitations', 
  'casting_offers', 
  'signup_notes',
  'rehearsal_events', 
  'rehearsal_agenda_items', 
  'agenda_assignments',
  'performance_events', 
  'virtual_audition_submissions'
)
ORDER BY tablename, cmd, policyname;
```

Expected results:
- Each table should have SELECT, INSERT, UPDATE policies
- Most tables should have DELETE policies (except auditions)
- `auditions` table should have separate owner-only DELETE policy

### Test the Helper Function

```sql
-- Replace 'your-audition-id' with an actual audition ID
SELECT can_manage_audition('your-audition-id-here');

-- Should return:
-- - true if you own the audition, are on production team, or are company member
-- - false otherwise
```

## Security Considerations

### ✅ What's Protected

1. **Audition deletion** - Only owners can delete
2. **Note ownership** - Users can only edit/delete their own notes
3. **Assignment status** - Users can only update their own assignment status
4. **User context** - All policies use `auth.uid()` to verify current user

### ⚠️ Important Notes

1. **Production team access is audition-specific** - Adding someone to the production team for one audition doesn't grant access to other auditions
2. **Company members have broad access** - Company-level members can manage ALL auditions for that company
3. **Deletion is restricted** - Production team members cannot accidentally delete the entire audition

## Rollback

If you need to revert these changes, run:

```sql
-- Drop the helper function
DROP FUNCTION IF EXISTS can_manage_audition(uuid);

-- Then re-run the previous RLS migration:
-- FIX_PRODUCTIONS_WORKFLOW_RLS_POLICIES.sql
```

## Testing Checklist

After applying this migration, test the following scenarios:

### As Production Team Member

- [ ] View audition details
- [ ] Edit audition information (location, dates, etc.)
- [ ] Add/edit/delete roles
- [ ] Add/edit/delete audition slots
- [ ] Cast actors to roles
- [ ] Send callback invitations
- [ ] Send casting offers
- [ ] Add notes to audition signups
- [ ] Edit your own notes (but not others' notes)
- [ ] Schedule rehearsals
- [ ] Create agenda items
- [ ] Assign cast members to agenda items
- [ ] View virtual audition submissions
- [ ] **SHOULD FAIL**: Try to delete the audition

### As Audition Owner

- [ ] All of the above
- [ ] **SHOULD SUCCEED**: Delete the audition

### As Non-Member

- [ ] **SHOULD FAIL**: All management operations
- [ ] **SHOULD SUCCEED**: View audition details (if public)
- [ ] **SHOULD SUCCEED**: Sign up for audition slots
- [ ] **SHOULD SUCCEED**: View/update own cast records
- [ ] **SHOULD SUCCEED**: View/update own callbacks

## Troubleshooting

### "Permission denied" errors

1. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename LIKE '%audition%';
   ```

2. Check if user is in production_team_members:
   ```sql
   SELECT * FROM production_team_members 
   WHERE user_id = auth.uid() 
   AND audition_id = 'your-audition-id';
   ```

3. Test the helper function:
   ```sql
   SELECT can_manage_audition('your-audition-id');
   ```

### Policies not working as expected

1. Drop and recreate the policies (re-run the migration)
2. Clear any cached policies in your application
3. Check for conflicting policies:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'your_table_name';
   ```

## Related Files

- **Migration**: `ADD_PRODUCTION_TEAM_RLS_POLICIES.sql`
- **Previous RLS Fix**: `FIX_PRODUCTIONS_WORKFLOW_RLS_POLICIES.sql`
- **Production Team Setup**: `DATABASE_MIGRATION_PRODUCTION_TEAM.sql`

## Summary

This migration ensures that production team members can fully collaborate on managing auditions while maintaining security:

✅ **Full collaborative access** for production team  
✅ **Owner-only deletion** to prevent accidents  
✅ **Individual note ownership** for accountability  
✅ **Audition-specific permissions** for security  
✅ **Consistent policy pattern** using helper function  

Production team members can now work alongside owners with confidence! 🎭
