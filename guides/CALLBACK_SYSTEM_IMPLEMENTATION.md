# Callback System Implementation Guide

## Overview

This guide documents the callback system implementation for the Belong Here Theater casting application. The system allows casting directors to invite actors to callbacks after initial auditions, with a complete workflow for invitation, acceptance/rejection, and calendar integration.

## Architecture

### Database Schema

#### `callback_slots` Table
Stores callback time slots (similar to audition_slots).

**Columns:**
- `callback_slot_id` (UUID, PK) - Unique identifier
- `audition_id` (UUID, FK) - References the original audition
- `start_time` (TIMESTAMPTZ) - Callback start time
- `end_time` (TIMESTAMPTZ) - Callback end time
- `location` (TEXT) - Callback location
- `max_signups` (INTEGER) - Maximum number of actors per slot (default: 1)
- `notes` (TEXT) - Optional notes for the callback session
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

#### `callback_invitations` Table
Tracks callback invitations and actor responses.

**Columns:**
- `invitation_id` (UUID, PK) - Unique identifier
- `callback_slot_id` (UUID, FK) - References callback_slots
- `signup_id` (UUID, FK) - References audition_signups
- `user_id` (UUID, FK) - References profiles (the invited actor)
- `audition_id` (UUID, FK) - References auditions
- `status` (TEXT) - Invitation status: 'pending', 'accepted', 'rejected'
- `actor_comment` (TEXT) - Actor's comment when responding
- `casting_notes` (TEXT) - Casting director's private notes
- `invited_at` (TIMESTAMPTZ) - When invitation was sent
- `responded_at` (TIMESTAMPTZ) - When actor responded
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Constraints:**
- Unique constraint on (callback_slot_id, signup_id) - prevents duplicate invitations

### Workflow

```
1. Auditions Complete
   ↓
2. Casting Director Reviews Auditionees
   ↓
3. Casting Director Creates Callback Slots
   ↓
4. Casting Director Selects Actors & Assigns to Slots
   ↓
5. Casting Director Clicks "Send Callback Requests"
   ↓
6. System Creates Invitations & Sends Notifications
   ↓
7. Actor Receives In-App + Email Notification
   ↓
8. Actor Accepts/Rejects with Optional Comment
   ↓
9. System Updates Invitation Status
   ↓
10. Casting Director Receives Notification of Response
    ↓
11. Accepted Callbacks Appear on Calendar
```

## Backend Implementation

### Files Created

1. **`src/lib/supabase/callbackSlots.ts`**
   - CRUD operations for callback slots
   - Functions to check slot availability
   - Date range queries

2. **`src/lib/supabase/callbackInvitations.ts`**
   - CRUD operations for callback invitations
   - `sendCallbackInvitations()` - Creates invitations and sends notifications
   - `respondToCallbackInvitation()` - Actor response handler
   - Status filtering and queries

3. **`src/lib/supabase/types.ts`** (updated)
   - Added `CallbackSlot`, `CallbackSlotInsert`, `CallbackSlotUpdate` types
   - Added `CallbackInvitation`, `CallbackInvitationInsert`, `CallbackInvitationUpdate` types
   - Added `CallbackInvitationStatus` type

4. **`migrations/DATABASE_MIGRATION_CALLBACKS.sql`**
   - Complete database schema
   - Row Level Security (RLS) policies
   - Indexes for performance
   - Triggers for updated_at timestamps

### Key Functions

#### Callback Slots

```typescript
// Get all callback slots for an audition
getCallbackSlots(auditionId: string): Promise<CallbackSlot[]>

// Create a single callback slot
createCallbackSlot(slotData: CallbackSlotInsert): Promise<{ data, error }>

// Create multiple callback slots
createCallbackSlots(slotsData: CallbackSlotInsert[]): Promise<{ data, error }>

// Check if a slot is full (based on accepted invitations)
isCallbackSlotFull(callbackSlotId: string): Promise<boolean>

// Get slots with invitation details
getCallbackSlotsWithInvitations(auditionId: string): Promise<any[]>
```

#### Callback Invitations

```typescript
// Create invitations and send notifications
sendCallbackInvitations(invitationsData: CallbackInvitationInsert[]): Promise<{ data, error }>

// Actor responds to invitation
respondToCallbackInvitation(
  invitationId: string,
  status: 'accepted' | 'rejected',
  actorComment?: string
): Promise<{ data, error }>

// Get all invitations for an audition
getAuditionInvitations(auditionId: string): Promise<any[]>

// Get invitations by status
getInvitationsByStatus(auditionId: string, status: CallbackInvitationStatus): Promise<any[]>

// Get accepted callbacks (for calendar display)
getAcceptedCallbacks(auditionId: string): Promise<any[]>

// Get user's pending invitations count
getPendingInvitationsCount(userId: string): Promise<number>
```

## Security (RLS Policies)

### Callback Slots
- **SELECT**: Anyone can view callback slots
- **INSERT**: Only audition creators can create callback slots
- **UPDATE**: Only audition creators can update their callback slots
- **DELETE**: Only audition creators can delete their callback slots

### Callback Invitations
- **SELECT**: Users can view invitations for their auditions (as creator) or their own invitations (as actor)
- **INSERT**: Only audition creators can create callback invitations
- **UPDATE**: Audition creators can update invitations, or actors can update their own response
- **DELETE**: Only audition creators can delete callback invitations

## Notification System

### Callback Invitation Notification
**Sent to:** Actor  
**Trigger:** When casting director clicks "Send Callback Requests"  
**Type:** `casting_decision`  
**Contains:**
- Show title
- Callback date and time
- Callback location
- Link to respond to invitation

### Callback Response Notification
**Sent to:** Casting Director  
**Trigger:** When actor accepts or rejects invitation  
**Type:** `casting_decision`  
**Contains:**
- Actor's name
- Response (accepted/rejected)
- Actor's comment (if provided)
- Link to callback management page

## Email Integration

**TODO:** Implement email service integration

The notification system currently creates in-app notifications. Email integration should:

1. Send email when callback invitation is created
2. Send email when actor responds to invitation
3. Include all relevant details (date, time, location, show info)
4. Provide direct links to respond (for actors) or view responses (for directors)

**Recommended Services:**
- Resend (modern, developer-friendly)
- SendGrid
- AWS SES

## Frontend Implementation (TODO)

### 1. Callback Management Page (Casting Director)

**Location:** `/auditions/[auditionId]/callbacks`

**Features:**
- View all auditionees from the audition
- Filter by role, status, etc.
- Select actors to invite to callbacks
- Create callback time slots
- Assign actors to specific slots
- "Send Callback Requests" button
- View invitation statuses (pending, accepted, rejected)
- View actor comments

**Components Needed:**
- `CallbackManagement.tsx` - Main container
- `CallbackSlotCreator.tsx` - Form to create callback slots
- `AuditioneeSelector.tsx` - List of auditionees with checkboxes
- `InvitationStatusTable.tsx` - Table showing invitation statuses

### 2. Callback Response Page (Actor)

**Location:** `/callbacks/[invitationId]`

**Features:**
- View callback details (show, date, time, location)
- Accept or reject invitation
- Add optional comment
- View confirmation after response

**Components Needed:**
- `CallbackInvitationDetail.tsx` - Display invitation details
- `CallbackResponseForm.tsx` - Accept/reject form with comment field

### 3. Callback Notifications (Both Roles)

**Location:** Notification dropdown in nav bar

**Features:**
- Show pending callback invitations (actors)
- Show callback responses (casting directors)
- Badge count for pending items
- Click to navigate to relevant page

**Components Needed:**
- Update existing `NotificationDropdown.tsx` to handle callback notifications

### 4. Calendar Integration

**Location:** Existing audition calendar view

**Features:**
- Display callback slots alongside audition slots
- Different visual styling (e.g., different color)
- Show only accepted callbacks
- Click to view callback details
- Filter to show/hide callbacks

**Components Needed:**
- Update existing calendar component
- Add callback event rendering
- Add callback-specific styling

## Testing

### Unit Tests
- ✅ `callbackSlots.test.ts` - All CRUD operations for callback slots
- ✅ `callbackInvitations.test.ts` - All CRUD operations for callback invitations

### Integration Tests (TODO)
- Test full workflow from invitation to response
- Test notification creation
- Test RLS policies
- Test calendar integration

### UI Tests (TODO)
- Test callback management interface
- Test actor response flow
- Test notification display
- Test calendar display

## Migration Steps

### 1. Run Database Migration

```bash
# Apply the migration to your Supabase database
psql -h your-db-host -U your-user -d your-database -f migrations/DATABASE_MIGRATION_CALLBACKS.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 2. Verify Types

The TypeScript types are already updated in `src/lib/supabase/types.ts`. No action needed.

### 3. Run Tests

```bash
npm test src/lib/supabase/__tests__/callbackSlots.test.ts
npm test src/lib/supabase/__tests__/callbackInvitations.test.ts
```

### 4. Implement Frontend Components

Follow the frontend implementation section above to create the UI components.

### 5. Implement Email Service

Integrate an email service provider to send emails for:
- Callback invitations
- Callback responses

### 6. Test End-to-End

Test the complete workflow:
1. Create an audition
2. Have actors sign up
3. Create callback slots
4. Send callback invitations
5. Have actors respond
6. Verify notifications
7. Check calendar display

## API Examples

### Creating Callback Slots

```typescript
import { createCallbackSlots } from '@/lib/supabase';

const slots = await createCallbackSlots([
  {
    audition_id: 'audition-123',
    start_time: '2025-11-01T10:00:00Z',
    end_time: '2025-11-01T11:00:00Z',
    location: 'Studio A',
    max_signups: 5,
    notes: 'Bring sheet music for your callback song',
  },
  {
    audition_id: 'audition-123',
    start_time: '2025-11-01T14:00:00Z',
    end_time: '2025-11-01T15:00:00Z',
    location: 'Studio B',
    max_signups: 5,
  },
]);
```

### Sending Callback Invitations

```typescript
import { sendCallbackInvitations } from '@/lib/supabase';

// Get selected signups from your UI
const selectedSignups = [
  { signup_id: 'signup-1', user_id: 'user-1' },
  { signup_id: 'signup-2', user_id: 'user-2' },
];

// Assign to callback slot
const invitations = selectedSignups.map(signup => ({
  callback_slot_id: 'slot-123',
  signup_id: signup.signup_id,
  user_id: signup.user_id,
  audition_id: 'audition-123',
  casting_notes: 'Strong audition, excited to see more',
}));

// Send invitations (creates invitations and sends notifications)
const result = await sendCallbackInvitations(invitations);
```

### Actor Responding to Invitation

```typescript
import { respondToCallbackInvitation } from '@/lib/supabase';

// Actor accepts
await respondToCallbackInvitation(
  'invitation-123',
  'accepted',
  'Thank you! I\'m excited for the callback!'
);

// Actor rejects
await respondToCallbackInvitation(
  'invitation-456',
  'rejected',
  'Unfortunately I have a conflict. Thank you for considering me.'
);
```

### Getting Callbacks for Calendar

```typescript
import { getAcceptedCallbacks, getCallbackSlotsWithInvitations } from '@/lib/supabase';

// Get all accepted callbacks for an audition
const acceptedCallbacks = await getAcceptedCallbacks('audition-123');

// Get callback slots with full invitation details
const slotsWithInvitations = await getCallbackSlotsWithInvitations('audition-123');

// Transform for calendar display
const calendarEvents = slotsWithInvitations.map(slot => ({
  id: slot.callback_slot_id,
  title: `Callback: ${slot.callback_invitations.length} actors`,
  start: slot.start_time,
  end: slot.end_time,
  location: slot.location,
  type: 'callback',
  acceptedCount: slot.callback_invitations.filter(inv => inv.status === 'accepted').length,
}));
```

## Future Enhancements

### Phase 2 Features
- **Multiple callback rounds** - Support for multiple rounds of callbacks
- **Callback materials** - Allow directors to specify materials needed for callbacks
- **Video callback option** - Support for virtual callbacks
- **Callback feedback** - Allow directors to add feedback after callbacks
- **Callback scheduling conflicts** - Automatic detection of scheduling conflicts

### Phase 3 Features
- **Callback reminders** - Automated reminders before callbacks
- **Callback check-in** - QR code or digital check-in system
- **Callback recording** - Option to record callback performances
- **Callback comparison** - Side-by-side comparison of callback performances

## Troubleshooting

### Common Issues

**Issue:** Invitations not being created  
**Solution:** Check RLS policies, ensure user owns the audition

**Issue:** Notifications not sending  
**Solution:** Verify notification service is configured, check createNotification function

**Issue:** Actor can't respond to invitation  
**Solution:** Verify user_id matches invitation.user_id, check RLS policies

**Issue:** Callbacks not showing on calendar  
**Solution:** Ensure only accepted callbacks are being queried, check date filtering

## Support

For questions or issues with the callback system:
1. Check this documentation
2. Review the test files for usage examples
3. Check RLS policies in the migration file
4. Review console logs for error messages

## Changelog

### v1.0.0 (2025-10-22)
- Initial implementation
- Database schema and migrations
- Backend functions and types
- Comprehensive unit tests
- Documentation
