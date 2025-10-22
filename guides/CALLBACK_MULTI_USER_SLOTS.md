# Multiple Users Per Callback Slot

## Overview

The callback system supports **multiple actors in a single callback slot**, allowing for efficient group callbacks or back-to-back individual callbacks within the same time block.

## How It Works

### Callback Slot Configuration

When creating a callback slot, the `max_signups` field determines how many actors can be invited to that slot:

```typescript
{
  audition_id: 'audition-123',
  start_time: '2025-11-01T10:00:00Z',
  end_time: '2025-11-01T12:00:00Z',
  location: 'Studio A',
  max_signups: 5,  // ← Up to 5 actors can be invited to this slot
  notes: 'Group callback for ensemble roles'
}
```

### Default Behavior

- **Default `max_signups`**: 1 (one actor per slot)
- **Can be set to any number** based on your needs
- **No hard limit** - set based on your callback format

## Use Cases

### 1. Group Callbacks (Ensemble Roles)
```typescript
// Multiple actors auditioning together
{
  start_time: '2025-11-01T10:00:00Z',
  end_time: '2025-11-01T12:00:00Z',
  location: 'Main Stage',
  max_signups: 10,  // 10 actors for ensemble callback
  notes: 'Group dance callback - wear comfortable clothing'
}
```

### 2. Back-to-Back Individual Callbacks
```typescript
// Multiple actors, each getting 15 minutes
{
  start_time: '2025-11-01T14:00:00Z',
  end_time: '2025-11-01T16:00:00Z',
  location: 'Studio B',
  max_signups: 8,  // 8 actors × 15 min each = 2 hours
  notes: 'Individual callbacks - 15 minutes each'
}
```

### 3. Partner/Duo Callbacks
```typescript
// Pairs of actors for chemistry reads
{
  start_time: '2025-11-01T13:00:00Z',
  end_time: '2025-11-01T14:00:00Z',
  location: 'Studio C',
  max_signups: 2,  // 2 actors for scene work
  notes: 'Partner callback - romantic leads'
}
```

### 4. One-on-One Callbacks
```typescript
// Traditional individual callback
{
  start_time: '2025-11-01T15:00:00Z',
  end_time: '2025-11-01T15:30:00Z',
  location: 'Director\'s Office',
  max_signups: 1,  // Just one actor
  notes: 'Individual callback with director'
}
```

## Invitation Process

### Step 1: Create Callback Slot
```typescript
const slot = await createCallbackSlot({
  audition_id: 'audition-123',
  start_time: '2025-11-01T10:00:00Z',
  end_time: '2025-11-01T12:00:00Z',
  location: 'Studio A',
  max_signups: 5,  // Allow 5 actors
});
```

### Step 2: Invite Multiple Actors to Same Slot
```typescript
const invitations = [
  {
    callback_slot_id: slot.callback_slot_id,
    signup_id: 'signup-1',
    user_id: 'user-1',
    audition_id: 'audition-123',
  },
  {
    callback_slot_id: slot.callback_slot_id,  // Same slot
    signup_id: 'signup-2',
    user_id: 'user-2',
    audition_id: 'audition-123',
  },
  {
    callback_slot_id: slot.callback_slot_id,  // Same slot
    signup_id: 'signup-3',
    user_id: 'user-3',
    audition_id: 'audition-123',
  },
  // ... up to 5 total
];

await sendCallbackInvitations(invitations);
```

### Step 3: System Tracks Capacity
The `isCallbackSlotFull()` function checks **accepted invitations** against `max_signups`:

```typescript
// Returns true if accepted invitations >= max_signups
const isFull = await isCallbackSlotFull(slot.callback_slot_id);

// Example:
// max_signups: 5
// accepted invitations: 3
// isFull: false (2 spots remaining)

// max_signups: 5
// accepted invitations: 5
// isFull: true (no spots remaining)
```

## Important Notes

### Capacity is Based on Accepted Invitations

- **Pending invitations** don't count toward capacity
- **Rejected invitations** don't count toward capacity
- **Only accepted invitations** count toward `max_signups`

This means you can invite MORE than `max_signups` initially, accounting for potential rejections:

```typescript
// Slot has max_signups: 5
// You can invite 7 actors
// If 2 reject, you'll have 5 accepted (perfect!)
// If all 7 accept, you'll have 7 accepted (over capacity - handle in UI)
```

### Viewing Who's in a Slot

```typescript
// Get slot with all invitations
const slotWithInvitations = await getCallbackSlotsWithInvitations('audition-123');

// Example result:
{
  callback_slot_id: 'slot-123',
  start_time: '2025-11-01T10:00:00Z',
  end_time: '2025-11-01T12:00:00Z',
  location: 'Studio A',
  max_signups: 5,
  callback_invitations: [
    {
      invitation_id: 'inv-1',
      user_id: 'user-1',
      status: 'accepted',
      profiles: { first_name: 'John', last_name: 'Doe' }
    },
    {
      invitation_id: 'inv-2',
      user_id: 'user-2',
      status: 'accepted',
      profiles: { first_name: 'Jane', last_name: 'Smith' }
    },
    {
      invitation_id: 'inv-3',
      user_id: 'user-3',
      status: 'pending',
      profiles: { first_name: 'Bob', last_name: 'Johnson' }
    },
  ]
}
```

## UI Considerations

### Callback Management Interface

When building the UI, show:

1. **Slot capacity indicator**
   ```
   Studio A - 10:00 AM - 12:00 PM
   Capacity: 3/5 accepted (1 pending)
   ```

2. **List of invited actors with status**
   ```
   ✓ John Doe (accepted)
   ✓ Jane Smith (accepted)
   ✓ Bob Johnson (accepted)
   ⏳ Alice Brown (pending)
   ✗ Charlie Wilson (rejected)
   ```

3. **Warning when over capacity**
   ```
   ⚠️ Warning: 6 actors have accepted, but slot capacity is 5
   ```

### Actor View

When an actor views their invitation, optionally show:
```
You've been invited to a group callback with 4 other actors
```

Or keep it private:
```
You've been invited to a callback
```

## Calendar Display

On the calendar, show slot occupancy:

```typescript
const calendarEvent = {
  title: `Callback: ${acceptedCount}/${slot.max_signups} actors`,
  // e.g., "Callback: 3/5 actors"
  start: slot.start_time,
  end: slot.end_time,
  location: slot.location,
};
```

## Database Constraints

The database enforces:
- **Unique constraint** on `(callback_slot_id, signup_id)` - prevents inviting the same actor twice to the same slot
- No constraint preventing over-capacity - this is handled in application logic

## Best Practices

### 1. Set Realistic Capacity
```typescript
// For group callbacks
max_signups: 10-20  // Ensemble/dance callbacks

// For individual callbacks
max_signups: 1      // One-on-one

// For back-to-back
max_signups: 4-8    // Based on time slot duration
```

### 2. Over-Invite Strategically
```typescript
// If you need 5 actors and expect 20% rejection rate
// Invite 6-7 actors to ensure 5 acceptances
```

### 3. Monitor Capacity in Real-Time
```typescript
// Before sending more invitations, check current capacity
const slot = await getCallbackSlot(slotId);
const acceptedCount = await getInvitationsByStatus(auditionId, 'accepted')
  .then(invs => invs.filter(inv => inv.callback_slot_id === slotId).length);

if (acceptedCount < slot.max_signups) {
  // Can invite more actors
}
```

### 4. Handle Over-Capacity Gracefully
```typescript
// In your UI, warn casting director if over capacity
if (acceptedCount > slot.max_signups) {
  showWarning(`This slot is over capacity by ${acceptedCount - slot.max_signups} actors`);
  // Suggest: create another slot, or increase max_signups
}
```

## Example: Complete Multi-User Callback Flow

```typescript
// 1. Create a group callback slot
const { data: slot } = await createCallbackSlot({
  audition_id: 'audition-123',
  start_time: '2025-11-01T10:00:00Z',
  end_time: '2025-11-01T12:00:00Z',
  location: 'Main Stage',
  max_signups: 8,
  notes: 'Group dance callback for ensemble roles',
});

// 2. Select 8 actors from audition signups
const selectedActors = [
  { signup_id: 'signup-1', user_id: 'user-1' },
  { signup_id: 'signup-2', user_id: 'user-2' },
  { signup_id: 'signup-3', user_id: 'user-3' },
  { signup_id: 'signup-4', user_id: 'user-4' },
  { signup_id: 'signup-5', user_id: 'user-5' },
  { signup_id: 'signup-6', user_id: 'user-6' },
  { signup_id: 'signup-7', user_id: 'user-7' },
  { signup_id: 'signup-8', user_id: 'user-8' },
];

// 3. Create invitations for all actors to the same slot
const invitations = selectedActors.map(actor => ({
  callback_slot_id: slot.callback_slot_id,
  signup_id: actor.signup_id,
  user_id: actor.user_id,
  audition_id: 'audition-123',
  casting_notes: 'Strong dancer, good for ensemble',
}));

// 4. Send all invitations at once
await sendCallbackInvitations(invitations);

// 5. All 8 actors receive notifications
// 6. Each actor can accept or reject independently
// 7. Casting director sees real-time status updates
// 8. Calendar shows "Callback: 6/8 actors" (if 6 accept)
```

## Summary

✅ **Multiple actors per slot** - Supported via `max_signups`  
✅ **Flexible capacity** - Set any number based on callback type  
✅ **Independent responses** - Each actor accepts/rejects individually  
✅ **Capacity tracking** - System tracks accepted vs. max_signups  
✅ **Over-invitation** - Can invite more than capacity to account for rejections  
✅ **Real-time updates** - Casting director sees status changes as they happen  

The system is fully designed to handle both individual and group callbacks efficiently!
