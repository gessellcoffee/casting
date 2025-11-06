# Public Profile Viewing - Setup Guide

## Overview
This guide explains how to enable public viewing of user profiles so that company owners can view requesters' profiles when reviewing approval requests.

## What Was Implemented

### 1. Public Profile Page
**Location:** `/app/profile/[userid]/page.tsx`

A dynamic route that displays any user's public profile:
- **URL Format:** `/profile/{userid}`
- **Example:** `/profile/123e4567-e89b-12d3-a456-426614174000`

**Features:**
- Profile photo
- Full name and email
- Bio/description
- Skills (as tags)
- Image gallery
- Resume file link
- Resume entries with verification badges

### 2. Notification Integration
**Location:** `NotificationsDropdown.tsx`

Added "View Requestor" link in company approval notifications:
- Links to `/profile/{sender_id}`
- Allows company owners to review requester's profile before approving

### 3. Enhanced Notification Message
**Location:** `lib/supabase/notifications.ts`

Updated `createCompanyApprovalNotification` to:
- Fetch requester's name from profile
- Include requester's name in notification message
- Add profile link in `action_url`

## Database Requirements

### RLS Policies Needed

For this feature to work, you need to ensure the database has proper Row Level Security (RLS) policies that allow **public read access** to profiles and resumes.

Run the migration file: `DATABASE_MIGRATION_PUBLIC_PROFILES.sql`

This will:
1. Enable RLS on `profiles` and `user_resume` tables
2. Create policies for public SELECT access
3. Maintain security for INSERT, UPDATE, DELETE operations

### Key Policies

**Profiles Table:**
- ✅ **SELECT:** Anyone can view (public)
- 🔒 **INSERT:** Only authenticated users can create their own profile
- 🔒 **UPDATE:** Users can only update their own profile

**User Resume Table:**
- ✅ **SELECT:** Anyone can view (public)
- 🔒 **INSERT:** Users can only create their own resume entries
- 🔒 **UPDATE:** Users can only update their own resume entries
- 🔒 **DELETE:** Users can only delete their own resume entries

## User Flow

### For Resume Owners (Actors/Performers):
1. Add resume entry with company association
2. System creates approval request
3. Notification sent to company owner with their name included

### For Company Owners:
1. Receive notification: "John Doe wants to associate 'Hamlet' with Your Company"
2. Click notification to open dropdown
3. Click "View Requestor" link
4. Opens `/profile/{userid}` showing John Doe's full profile
5. Review their:
   - Resume entries
   - Skills
   - Experience
   - Photos/gallery
6. Return to notification
7. Click "Approve" or "Reject"

## Data Flow

### When Approval Request is Created:

```
User adds resume entry with company
    ↓
createResumeEntry() called
    ↓
createApprovalRequest() called
    ↓
createCompanyApprovalNotification() called
    ↓
Notification created with:
  - recipient_id: company owner's ID
  - sender_id: requester's ID ← Used for profile link
  - reference_id: approval request ID
  - action_url: /profile/{sender_id}
```

### When Viewing Profile:

```
Company owner clicks "View Requestor"
    ↓
Navigate to /profile/{sender_id}
    ↓
getProfile(sender_id) - Fetches profile data
    ↓
getUserResumes(sender_id) - Fetches resume entries
    ↓
Display public profile view
```

## Verification Steps

### 1. Check Database Policies
```sql
-- Check profiles policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check user_resume policies
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'user_resume';
```

Expected results:
- `profiles` should have SELECT policy with `USING (true)`
- `user_resume` should have SELECT policy with `USING (true)`

### 2. Test Profile Viewing
1. Create a test user (User A)
2. Add resume entries for User A
3. Log in as different user (User B)
4. Navigate to `/profile/{User A's ID}`
5. Should see User A's profile without errors

### 3. Test Notification Flow
1. User A adds resume entry with User B's company
2. User B receives notification
3. Notification should show User A's name
4. Click "View Requestor" link
5. Should open User A's profile
6. Should show all public information

### 4. Check Console Logs
Open browser console (F12) and check for:
```
Loaded notifications: [...]
Company approval notification: {
  id: "...",
  sender_id: "user-id-here",  ← Should be present
  reference_id: "request-id",
  message: "John Doe wants to associate..."
}
```

## Troubleshooting

### Issue: "User not found" error
**Cause:** Profile doesn't exist or RLS policy blocking access  
**Solution:**
1. Verify user ID is correct
2. Check RLS policies allow public SELECT
3. Verify profile exists in database

### Issue: "View Requestor" link not showing
**Cause:** `sender_id` is null in notification  
**Solution:**
1. Check console logs for notification data
2. Verify `createCompanyApprovalNotification` is passing `userId` as `sender_id`
3. Check notification in database has `sender_id` populated

### Issue: Profile loads but shows no data
**Cause:** RLS policies blocking resume or profile data  
**Solution:**
1. Run `DATABASE_MIGRATION_PUBLIC_PROFILES.sql`
2. Verify policies with verification queries
3. Check Supabase logs for policy violations

### Issue: Can't view other users' profiles
**Cause:** RLS policies too restrictive  
**Solution:**
```sql
-- Temporarily disable RLS to test (DON'T DO IN PRODUCTION)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_resume DISABLE ROW LEVEL SECURITY;

-- If this works, the issue is RLS policies
-- Re-enable and fix policies:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resume ENABLE ROW LEVEL SECURITY;

-- Then run the public profiles migration
```

## Security Considerations

### What's Public:
- ✅ Profile information (name, email, bio)
- ✅ Skills
- ✅ Image gallery
- ✅ Resume entries
- ✅ Resume file (if uploaded)

### What's Protected:
- 🔒 Email addresses (not shown on public profile)
- 🔒 Profile editing (only owner can edit)
- 🔒 Resume editing (only owner can edit)
- 🔒 Account settings

### Privacy Notes:
- All profile information is **public by design**
- Users should be informed that their profiles are publicly viewable
- Consider adding privacy settings in future if needed
- Resume entries are public to facilitate casting and networking

## Testing Checklist

- [ ] Database migration executed successfully
- [ ] RLS policies created for profiles
- [ ] RLS policies created for user_resume
- [ ] Can view own profile at `/profile/{own-id}`
- [ ] Can view other users' profiles at `/profile/{other-id}`
- [ ] Notification shows requester's name
- [ ] "View Requestor" link appears in notifications
- [ ] Clicking link opens correct profile
- [ ] Profile shows all expected information
- [ ] Resume entries display correctly
- [ ] Verification badges show correctly
- [ ] No console errors
- [ ] sender_id is present in notifications (check console)

## Next Steps

1. **Run Database Migration:**
   ```bash
   # In Supabase SQL Editor
   # Run: DATABASE_MIGRATION_PUBLIC_PROFILES.sql
   ```

2. **Test the Flow:**
   - Create test approval request
   - Check notification
   - Click "View Requestor"
   - Verify profile loads

3. **Monitor Console:**
   - Check for sender_id in logs
   - Verify no RLS errors
   - Check for any 403/401 errors

4. **Optional Enhancements:**
   - Add profile view analytics
   - Add "Contact" button on profiles
   - Add social media links
   - Add privacy settings
   - Add profile completeness indicator

## Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs for RLS violations
3. Verify notification has `sender_id` populated
4. Test with different users
5. Verify RLS policies are correct
