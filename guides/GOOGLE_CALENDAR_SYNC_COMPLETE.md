# Google Calendar Sync - Complete Implementation

## Overview
Comprehensive two-way sync between Belong Here Theater and Google Calendar with full user control over what gets synced.

## Event Types Synced

### ✅ Pushed TO Google Calendar

1. **Audition Slots** (Teal Calendar)
   - For owners/production team managing auditions
   - Includes time, location, and show title
   - Timed events with specific start/end times

2. **Audition Signups** (Blue Calendar)
   - For actors attending auditions
   - Includes audition time and location
   - Timed events

3. **Callbacks** (Purple Calendar)
   - For actors invited to callbacks
   - Includes callback time and location
   - Only syncs pending and accepted callbacks
   - Timed events

4. **Rehearsal Dates** (Orange Calendar)
   - All-day events for rehearsal dates
   - For cast members in shows

5. **Rehearsal Events** (Yellow/Amber Calendar)
   - Detailed rehearsal events with times and locations
   - For cast members and production team
   - Timed events with specific start/end

6. **Agenda Items** (Yellow/Amber Calendar)
   - Specific rehearsal schedule items (scenes, songs, etc.)
   - Only syncs items where user is assigned
   - Includes show title, item title, time, and location
   - Timed events

7. **Performance Dates** (Red Calendar)
   - All-day events for performance dates
   - For cast members in shows

### ❌ NOT Pushed TO Google Calendar

**Personal Events**
- These are imported FROM Google Calendar
- Not pushed back to avoid creating duplicates
- Remain in app database only
- Clearly marked in sync settings as "Import Only"

## User Features

### Sync Settings Modal

Users can control exactly what gets synced with a new "Settings" button:

**Features:**
- Toggle each event type on/off individually
- See which Google Calendar each type syncs to
- Personal events are disabled (import only)
- Clear descriptions of what each type includes
- Changes save immediately to database

**Access:**
After connecting and setting up sync:
```
[Sync to Google ↑] [Import from Google ↓] [⚙️ Settings]
```

### Smart Status Detection

The system automatically knows if you've already set up sync calendars:
- First time → Shows "Setup Sync" button
- Returning user → Skips straight to "Sync to Google" and "Import from Google"
- No duplicate calendar creation

### Complete Event Coverage

**For Actors:**
- ✅ Audition signups
- ✅ Callback invitations
- ✅ Rehearsal dates/events for cast shows
- ✅ Agenda items where assigned
- ✅ Performance dates

**For Owners/Production Team:**
- ✅ All audition slots they manage
- ✅ All rehearsal events they create
- ✅ All agenda items (even if not assigned)
- ✅ Rehearsal/performance dates for their shows

## Technical Implementation

### Database Tables

**google_calendar_sync**
```sql
- user_id (UUID)
- event_type (TEXT) - One of: audition_slots, auditions, callbacks, rehearsals, performances, personal
- google_calendar_id (TEXT) - Google Calendar ID
- calendar_name (TEXT) - Display name
- sync_enabled (BOOLEAN) - User's preference for this type
- last_synced_at (TIMESTAMPTZ)
- created_at, updated_at (TIMESTAMPTZ)
```

**google_event_mappings**
```sql
- mapping_id (UUID, PK)
- user_id (UUID)
- event_type (TEXT)
- event_id (UUID) - ID from app's event table
- google_calendar_id (TEXT)
- google_event_id (TEXT) - Google's event ID
- created_at (TIMESTAMPTZ)
```

### API Endpoints

**POST /api/google/sync/status**
- Checks if sync calendars are set up
- Returns which calendars exist
- Used for smart UI adaptation

**POST /api/google/sync/setup**
- Creates all 6 sync calendars in Google
- Stores mappings in database
- Idempotent - reuses existing calendars

**POST /api/google/sync/push**
- Pushes events to Google Calendar
- Streaming response with progress updates
- Only syncs event types where `sync_enabled = true`
- Prevents duplicates using google_event_mappings
- Supports all event types

**POST /api/google/import**
- Imports events FROM Google Calendar
- Saves as personal events in app database
- User selects which Google Calendar to import from
- Supports next 6 months by default

**POST /api/google/sync/preferences**
- Gets user's current sync preferences
- Returns all event types with their settings

**PUT /api/google/sync/preferences**
- Updates user's sync preferences
- Allows enabling/disabling specific event types

### Sync Logic

**Push (App → Google):**
```
1. User clicks "Sync to Google"
2. System checks which event types are enabled
3. For each enabled type:
   - Fetch relevant events from app database
   - Check google_event_mappings for already-synced events
   - Create only new/missing events in Google Calendar
   - Store mapping for future sync
4. Show progress with event type being synced
5. Update last_synced_at timestamp
```

**Import (Google → App):**
```
1. User clicks "Import from Google"
2. User selects which Google Calendar
3. System fetches events from Google (next 6 months)
4. Converts to personal events format
5. Inserts into app's events table
6. Personal events appear immediately on calendar
```

### Duplicate Prevention

- **google_event_mappings table** tracks which app events have been pushed to Google
- Before creating a Google Calendar event, system checks if mapping exists
- Only creates events that haven't been synced yet
- Works across multiple sync sessions

## Color Coding

Each event type gets a distinct color in Google Calendar:
- **Teal (#7)** - Audition Slots
- **Blue (#9)** - Audition Signups  
- **Purple (#3)** - Callbacks
- **Orange (#6)** - Rehearsal Dates (all-day)
- **Yellow/Amber (#5)** - Rehearsal Events & Agenda Items (timed)
- **Red (#11)** - Performance Dates

## User Workflow

### First Time Setup
1. Click "Connect Google Calendar"
2. Authorize access
3. Click "Setup Sync"
4. 6 calendars created in Google
5. Click "Settings" to customize which types to sync
6. Click "Sync to Google" to push events
7. Click "Import from Google" to pull personal events

### Ongoing Use
1. Click "Sync to Google" whenever you want to push new events
2. Click "Import from Google" to pull in new personal events
3. Use "Settings" to adjust which types sync
4. Events automatically appear in both systems

## Benefits

✅ **Full Control** - Choose exactly what syncs
✅ **No Duplicates** - Smart duplicate detection
✅ **Complete Coverage** - All event types supported
✅ **Personal Events** - Import from Google, don't push back
✅ **Progress Feedback** - See what's being synced in real-time
✅ **Color Coded** - Easy to identify event types in Google
✅ **Persistent** - Settings saved per user
✅ **Smart Detection** - Knows if you've already set up
✅ **Comprehensive** - Includes new features like agenda items and rehearsal events

## Notes

- Personal events are one-way (Google → App) to avoid duplicates
- Sync is manual (on-demand) not automatic background sync
- Rehearsals calendar includes 3 types: dates, events, and agenda items
- All dates stored in ISO 8601 format for consistency
- Agenda items only sync for users who are assigned to them
- Production team sees all events for shows they manage

## Future Enhancements

Possible additions:
- Automatic sync on schedule (daily/weekly)
- Webhook listeners for real-time updates
- Two-way sync for personal events with smart conflict resolution
- Bulk delete/cleanup of synced events
- Sync history and audit log
