# Profile Security Fixes

## Security Vulnerability Identified

**Issue**: Users could potentially edit other users' profiles by manipulating the `userId` parameter in client-side function calls.

**Risk Level**: HIGH - Unauthorized data modification

## Root Cause

The original implementation accepted a `userId` parameter from the client without verifying that the authenticated user had permission to modify that profile. While Supabase Row Level Security (RLS) policies provide database-level protection, relying solely on database security is not best practice.

## Security Layers Implemented

### 1. Application-Level Authorization (NEW)

Added authorization checks in the following functions:

#### Profile Functions (`src/lib/supabase/profile.ts`)
- **`updateProfile()`**: Now verifies the authenticated user ID matches the profile being updated
  - Retrieves current authenticated user via `supabase.auth.getUser()`
  - Compares authenticated user ID with requested userId
  - Returns error if IDs don't match
  - Logs authorization failures for security monitoring

#### Storage Functions (`src/lib/supabase/storage.ts`)
- **`uploadProfilePhoto()`**: Verifies user can only upload to their own folder
- **`uploadResume()`**: Verifies user can only upload to their own folder
- **`uploadGalleryImage()`**: Verifies user can only upload to their own folder

All functions now:
1. Authenticate the current user
2. Verify authorization before proceeding
3. Return descriptive error messages
4. Log security violations

### 2. Database-Level Security (Existing)

Row Level Security (RLS) policies on the `profiles` table:

```sql
-- Users can only update their own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);
```

Storage bucket policies ensure users can only access files in their own folders:

```sql
-- Users can only upload to their own folder
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Defense in Depth Strategy

This implementation follows the **defense in depth** security principle:

1. **Client-side validation**: UI only allows editing own profile
2. **Application-level authorization**: Functions verify user permissions
3. **Database-level security**: RLS policies enforce access control
4. **Storage-level security**: Bucket policies restrict file access

Even if one layer fails, the others provide protection.

## Testing

Comprehensive unit tests have been added:

### Profile Tests (`__tests__/profile.test.ts`)
- ✅ Users can update their own profile
- ✅ Users cannot update other users' profiles
- ✅ Unauthenticated requests are rejected
- ✅ Authentication errors are handled gracefully

### Storage Tests (`__tests__/storage.test.ts`)
- ✅ Users can upload to their own folders
- ✅ Users cannot upload to other users' folders
- ✅ Unauthenticated uploads are rejected
- ✅ All three upload types are protected (photo, resume, gallery)

## Running Tests

```bash
npm test -- profile.test.ts
npm test -- storage.test.ts
```

## Security Best Practices Applied

1. **Never trust client input**: Always validate userId server-side
2. **Explicit authorization checks**: Don't assume authentication equals authorization
3. **Fail securely**: Return errors rather than proceeding with uncertain permissions
4. **Audit logging**: Log authorization failures for security monitoring
5. **Principle of least privilege**: Users can only access their own resources
6. **Defense in depth**: Multiple security layers protect against failures

## What Changed

### Before
```typescript
export async function updateProfile(userId: string, updates: ProfileUpdate) {
  // Directly updates any profile - VULNERABLE
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}
```

### After
```typescript
export async function updateProfile(userId: string, updates: ProfileUpdate) {
  // Verify authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check - SECURE
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { data: null, error: unauthorizedError };
  }

  // Proceed with update
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}
```

## Verification Steps

To manually verify the security fix:

1. **Login as User A**
2. **Open browser console**
3. **Attempt to update User B's profile**:
   ```javascript
   // This should now fail with "Unauthorized" error
   await updateProfile('user-b-id', { first_name: 'Hacked' });
   ```
4. **Check console logs** - Should see authorization failure message
5. **Verify User B's profile** - Should remain unchanged

## Recommendations

### Immediate Actions
- ✅ Application-level authorization checks implemented
- ✅ Unit tests created
- ✅ Security documentation written

### Future Enhancements
1. **Rate limiting**: Prevent brute force attacks
2. **Audit trail**: Log all profile modifications with timestamps
3. **Admin override**: Allow admins to edit profiles with proper logging
4. **Two-factor authentication**: Add extra security layer
5. **Session management**: Implement session timeouts
6. **Input validation**: Add stricter validation on profile fields

## Compliance Notes

These security measures help meet common compliance requirements:
- **GDPR**: Users can only access their own personal data
- **SOC 2**: Access controls and audit logging
- **HIPAA**: (if applicable) Protected health information access controls

## Support

If you encounter any security issues:
1. Do not discuss publicly
2. Report to the security team immediately
3. Include steps to reproduce
4. Provide relevant logs (sanitized)
