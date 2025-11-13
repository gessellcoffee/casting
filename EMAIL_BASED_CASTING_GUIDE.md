# Email-Based Casting & Callback System

## Overview

The casting application now supports casting and callback invitations by email address. This allows directors to cast actors who may not yet be members of the platform. The system automatically:

1. **Checks if the email exists** in the user database
2. **If user exists**: Creates a normal casting offer/callback invitation with in-app notification
3. **If user doesn't exist**: Sends a beautiful invitation email to join the platform

## Architecture

### Core Components

#### 1. User Lookup Service
**File**: `src/lib/supabase/userLookup.ts`

```typescript
getUserByEmail(email: string): Promise<Profile | null>
emailExists(email: string): Promise<boolean>
isValidEmail(email: string): boolean
```

- Looks up users by email address (case-insensitive)
- Validates email format
- Returns null if user not found (not an error)

#### 2. Invitation Email Service
**File**: `src/lib/email/invitationService.ts`

```typescript
sendCastingInvitationEmail(data: CastingInvitationData): Promise<Result>
```

**Features**:
- Beautiful HTML email templates with neumorphic design
- Personalized messages from casting director
- Role details (principal, understudy, or ensemble)
- Callback details (date, time, location)
- Direct signup link with pre-filled email
- Plain text fallback for compatibility

**Email Types**:
- **Casting Offers**: "You've Been Cast in [Show]!"
- **Callback Invitations**: "Callback Invitation for [Show]"

#### 3. Casting Offer by Email
**File**: `src/lib/supabase/castingOffers.ts`

```typescript
createCastingOfferByEmail(offerData): Promise<Result>
```

**Workflow**:
1. Validate email format
2. Look up user by email
3. **If user exists**:
   - Create normal casting offer
   - Create cast_member record
   - Send in-app notification
   - Send email notification (via existing system)
4. **If user doesn't exist**:
   - Send invitation email with casting details
   - Return `userExists: false, invitationSent: true`

**Return Type**:
```typescript
{
  data: CastingOffer | null;
  error: any;
  userExists: boolean;
  invitationSent?: boolean;
}
```

#### 4. Callback Invitation by Email
**File**: `src/lib/supabase/callbackInvitations.ts`

```typescript
sendCallbackInvitationByEmail(invitationData): Promise<Result>
```

**Workflow**:
1. Validate email format
2. Look up user by email
3. **If user exists**:
   - Find existing audition signup (required for callback)
   - Create callback invitation
   - Send in-app notification
4. **If user doesn't exist**:
   - Send invitation email with callback details
   - Return `userExists: false, invitationSent: true`

**Important Note**: For existing users, they must have signed up for an audition slot before receiving a callback invitation. This maintains data integrity with the `signup_id` foreign key requirement.

### UI Components

#### 1. CastByEmailModal
**File**: `src/components/casting/CastByEmailModal.tsx`

**Features**:
- Email input field with validation
- Casting type selection (Cast, Understudy, Ensemble)
- Role selection (hidden for ensemble)
- Personal message textarea
- Offer summary preview
- Clear success/error messaging

**Usage**:
```tsx
<CastByEmailModal
  auditionId={auditionId}
  currentUserId={currentUserId}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    loadData();
    setShowModal(false);
  }}
/>
```

#### 2. CallbackByEmailModal
**File**: `src/components/casting/CallbackByEmailModal.tsx`

**Features**:
- Email input field with validation
- Callback slot selection with date/time/location display
- Personal message textarea
- Invitation summary preview
- Clear success/error messaging

**Usage**:
```tsx
<CallbackByEmailModal
  auditionId={auditionId}
  currentUserId={currentUserId}
  onClose={() => setShowModal(false)}
  onSuccess={() => {
    loadData();
    setShowModal(false);
  }}
/>
```

## Integration Guide

### Adding "Cast by Email" Button

In your casting interface (e.g., `CastShow.tsx`):

```tsx
import CastByEmailModal from '@/components/casting/CastByEmailModal';

const [showCastByEmailModal, setShowCastByEmailModal] = useState(false);

// Add button
<button
  onClick={() => setShowCastByEmailModal(true)}
  className="neu-button-primary"
>
  Cast by Email
</button>

// Add modal
{showCastByEmailModal && (
  <CastByEmailModal
    auditionId={audition.audition_id}
    currentUserId={user.id}
    onClose={() => setShowCastByEmailModal(false)}
    onSuccess={() => {
      loadData();
      setShowCastByEmailModal(false);
    }}
  />
)}
```

### Adding "Invite by Email" Button

In your callbacks interface (e.g., `CallbacksPanel.tsx`):

```tsx
import CallbackByEmailModal from '@/components/casting/CallbackByEmailModal';

const [showCallbackByEmailModal, setShowCallbackByEmailModal] = useState(false);

// Add button
<button
  onClick={() => setShowCallbackByEmailModal(true)}
  className="neu-button-primary"
>
  Invite by Email
</button>

// Add modal
{showCallbackByEmailModal && (
  <CallbackByEmailModal
    auditionId={audition.audition_id}
    currentUserId={user.id}
    onClose={() => setShowCallbackByEmailModal(false)}
    onSuccess={() => {
      loadData();
      setShowCallbackByEmailModal(false);
    }}
  />
)}
```

## User Experience Flow

### For Existing Users

1. Director enters email address
2. System finds user in database
3. Creates casting offer/callback invitation
4. User receives:
   - In-app notification
   - Email notification (via existing system)
5. User can accept/decline through the app

### For Non-Users

1. Director enters email address
2. System doesn't find user in database
3. Sends invitation email with:
   - Personalized greeting
   - Show and role details
   - Callback details (if applicable)
   - Personal message from director
   - "Create Your Free Account" button
4. Recipient clicks button → taken to signup page with email pre-filled
5. After signup, they can:
   - View the production details
   - Accept/decline the offer
   - Communicate with the production team

## Email Template Features

### Design
- Neumorphic design matching app theme
- Gradient header (blue to purple)
- Color-coded badges (casting offer = pink/blue, callback = purple)
- Mobile-responsive layout
- Professional typography

### Content
- **Greeting**: "Hello!" (friendly, not assuming name)
- **Main Message**: Clear statement of casting offer or callback invitation
- **Personal Message**: Optional custom message from director
- **Details Section**: Role info or callback date/time/location
- **Info Box**: Explains Belong Here Theater platform
- **CTA Button**: Large, prominent "Create Your Free Account" button
- **Footer**: Copyright, links to website and help center

### Technical
- HTML and plain text versions
- Signup URL with pre-filled email parameter
- Proper email headers and metadata
- Uses Resend API for delivery

## Error Handling

### Invalid Email Format
```typescript
{
  data: null,
  error: new Error('Invalid email format'),
  userExists: false
}
```

### User Exists But No Audition Signup (Callbacks Only)
```typescript
{
  data: null,
  error: new Error('User must sign up for an audition slot before receiving a callback invitation'),
  userExists: true
}
```

### Email Service Not Configured
```typescript
{
  data: null,
  error: new Error('Failed to send invitation email: Email service not configured'),
  userExists: false,
  invitationSent: false
}
```

### Cast Member Must Exist First (Casting Offers)
```typescript
{
  data: null,
  error: new Error('Cast member must be saved before sending an offer. Please save the cast first.'),
  userExists: true
}
```

## Configuration

### Environment Variables Required

```env
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@belongheretheater.com

# App URL for email links
NEXT_PUBLIC_APP_URL=https://belongheretheater.com
```

### Email Sending Limits

**Resend Free Tier**:
- 100 emails/day
- 3,000 emails/month
- Excellent deliverability
- No credit card required

## Database Considerations

### Casting Offers
- No schema changes required
- Works with existing `cast_members` and `casting_offers` tables
- Maintains all existing RLS policies

### Callback Invitations
- Requires `signup_id` for existing users
- For non-users, invitation is email-only (no database record until they join)
- This prevents orphaned records for users who never join

## Security

### Email Validation
- Format validation using regex
- Case-insensitive email lookup
- Trimmed whitespace

### Authorization
- Only audition owners and production team can send invitations
- Existing RLS policies apply
- No bypass of security measures

### Privacy
- Emails are not exposed to other users
- Only the sender knows the recipient's email
- Non-users are not added to database until they sign up

## Future Enhancements

### Potential Improvements
1. **Tracking**: Store invitation emails in database for audit trail
2. **Reminders**: Automatic follow-up emails for non-responders
3. **Bulk Email Invitations**: Send to multiple email addresses at once
4. **Custom Templates**: Allow directors to customize email templates
5. **Email Preferences**: Let users control which emails they receive
6. **Invitation Expiry**: Set expiration dates for invitations
7. **Pre-Signup Responses**: Allow non-users to accept/decline before signing up

### Database Schema Updates (Optional)
Consider adding an `email_invitations` table to track:
- Invitation ID
- Email address
- Invitation type (casting_offer, callback)
- Sent timestamp
- Opened timestamp (via tracking pixel)
- Clicked timestamp
- Signed up timestamp
- Status (pending, accepted, declined, expired)

## Testing Checklist

### Casting by Email
- [ ] Valid email, existing user → Creates offer, sends notification
- [ ] Valid email, non-user → Sends invitation email
- [ ] Invalid email format → Shows error
- [ ] Empty email → Shows error
- [ ] No role selected (non-ensemble) → Shows error
- [ ] Ensemble casting → Works without role selection
- [ ] Personal message → Included in email
- [ ] Email service not configured → Graceful degradation

### Callback by Email
- [ ] Valid email, existing user with signup → Creates invitation
- [ ] Valid email, existing user without signup → Shows error
- [ ] Valid email, non-user → Sends invitation email
- [ ] Invalid email format → Shows error
- [ ] Empty email → Shows error
- [ ] No slot selected → Shows error
- [ ] Personal message → Included in email
- [ ] Callback details → Displayed correctly in email

### Email Delivery
- [ ] HTML version renders correctly
- [ ] Plain text version is readable
- [ ] Signup link works with pre-filled email
- [ ] Mobile responsive design
- [ ] All links work correctly
- [ ] Branding is consistent

## Support

For issues or questions:
1. Check environment variables are configured
2. Verify Resend API key is valid
3. Check email service logs in console
4. Ensure RLS policies are correct
5. Test with known email addresses first

## Summary

This feature enables directors to cast anyone by email, whether they're already on the platform or not. It provides a seamless onboarding experience for new users while maintaining all existing functionality for current users. The system is secure, user-friendly, and follows all existing design patterns in the application.
