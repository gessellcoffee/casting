# Google Calendar Import Duplicate Fix

## Problem

When importing events from Google Calendar, duplicate events were being created every time the user clicked "Import". If a user imported 10 events, then imported again (even with the same date range), they would end up with 20 events total - 10 originals + 10 duplicates.

## Root Cause

The import process had two issues:

1. **Missing Google Event ID**: The `convertGoogleEventToLocal()` function was not including the Google Calendar event ID in the converted event data
2. **No Duplicate Check**: The import logic was not checking if an event had already been imported before creating it

## Solution

### 1. Include Google Event ID in Converted Events

**File**: `src/lib/google/calendar.ts`

Added `googleEventId` to the converted event:

```typescript
export function convertGoogleEventToLocal(googleEvent: GoogleCalendarEvent) {
  const isAllDay = !!googleEvent.start.date;
  
  return {
    googleEventId: googleEvent.id, // ← Added this
    title: googleEvent.summary || 'Untitled Event',
    description: googleEvent.description || null,
    // ... rest of fields
  };
}
```

### 2. Check for Existing Events Before Import

**File**: `src/components/calendar/GoogleCalendarImport.tsx`

Updated `handleImport()` to:
1. Check if the Google event ID already exists in `google_event_mappings` table
2. Skip the event if it's already been imported
3. Create a mapping after successfully importing a new event
4. Show user how many events were imported vs skipped

```typescript
for (const event of events) {
  // Check if already imported
  if (event.googleEventId) {
    const response = await fetch('/api/google/event-mapping', {
      method: 'POST',
      body: JSON.stringify({ userId, googleEventId: event.googleEventId, action: 'check' })
    });
    
    const { exists } = await response.json();
    if (exists) {
      skippedCount++;
      continue; // Skip this event
    }
  }
  
  // Create the event
  const createdEvent = await createEvent(eventData, userId);
  
  // Create mapping to track it
  if (event.googleEventId && createdEvent) {
    await fetch('/api/google/event-mapping', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        googleEventId: event.googleEventId,
        eventId: createdEvent.id,
        calendarId: selectedCalendarId,
        action: 'create'
      })
    });
  }
  
  importedCount++;
}
```

### 3. Created Event Mapping API

**File**: `src/app/api/google/event-mapping/route.ts` (NEW)

Created API endpoint to handle two actions:

- **`check`**: Returns whether a Google event has already been imported
- **`create`**: Creates a mapping between Google event ID and our event ID

Uses the `google_event_mappings` table with fields:
- `user_id` - Who imported it
- `google_event_id` - Google Calendar event ID
- `event_id` - Our internal event ID
- `google_calendar_id` - Which Google calendar it came from
- `event_type` - Always 'personal' for manual imports

## User Experience

### Before
```
Import 10 events → 10 events created
Import again → 10 MORE events created (20 total duplicates!)
```

### After
```
Import 10 events → "10 new events imported"
Import again → "0 new events imported, 10 duplicates skipped"
Add 1 new event in Google Calendar
Import again → "1 new event imported, 10 duplicates skipped"
```

## Testing

1. **Connect Google Calendar** to your account
2. **Import events** from a date range with some events
3. **Note the count** (e.g., "5 new events imported")
4. **Import again** with the same date range
5. **Verify**: Should see "0 new events imported, 5 duplicates skipped"
6. **Create a new event** in Google Calendar
7. **Import again**
8. **Verify**: Should see "1 new event imported, 5 duplicates skipped"

## Files Modified

1. `src/lib/google/calendar.ts` - Added `googleEventId` to converted events
2. `src/components/calendar/GoogleCalendarImport.tsx` - Added duplicate checking logic
3. `src/app/api/google/event-mapping/route.ts` - NEW API endpoint

## Database Tables Used

- **`google_event_mappings`**: Tracks which Google Calendar events have been imported
  - Primary key: `id`
  - Unique constraint: `user_id` + `google_event_id` (prevents duplicate imports)

## Notes

- This fix only applies to manual imports via the "Import from Google Calendar" button
- Auto-sync functionality (if implemented) would use similar logic
- Event updates from Google Calendar are not automatically reflected (by design)
- Deleting an event in our app does not delete the mapping (user can re-import if desired)
