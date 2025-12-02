# Google Calendar Sync - Smart Button Display

## Overview
The Google Calendar sync buttons now intelligently adapt based on whether sync calendars have already been created.

## User Flow

### First Time Connection
1. **Initial State**: "Connect Google Calendar" button
2. **After Connection**: "Setup Sync" button + "Disconnect"
3. **After Setup**: "Sync to Google" + "Import from Google" + "Disconnect"

### Returning Users
If you've already set up sync calendars in a previous session:
- ✅ Skip the "Setup Sync" step
- ✅ Immediately see "Sync to Google" and "Import from Google" buttons
- ✅ No need to recreate calendars

## How It Works

### Automatic Detection
When you visit the calendar page, the system:
1. Checks if you're connected to Google Calendar
2. **Automatically checks if sync calendars exist** in your database
3. Shows the appropriate buttons based on what's already set up

### Sync Calendars Created
The system creates 6 dedicated calendars in your Google Calendar:
- **Belong Here Theater: Audition Slots** - Slots you're managing
- **Belong Here Theater: Auditions** - Auditions you've signed up for
- **Belong Here Theater: Callbacks** - Callback invitations
- **Belong Here Theater: Rehearsals** - Rehearsal events and agenda items
- **Belong Here Theater: Performances** - Performance dates
- **Belong Here Theater: Personal Events** - Your personal events

### Button States

**State 1: Not Connected**
```
[Connect Google Calendar]
```

**State 2: Connected, Calendars Not Set Up**
```
[Setup Sync]  [Disconnect]
```

**State 3: Connected, Calendars Already Set Up**
```
[Sync to Google ↑]  [Import from Google ↓]  [Disconnect]
Last synced: 12/02/2025, 2:25 AM
```

## Technical Details

### Status Check Endpoint
- **Endpoint**: `/api/google/sync/status`
- **Checks**: Database for existing sync calendar configurations
- **Returns**: `calendarsSetup: true/false`

### Database Table
- **Table**: `google_calendar_sync`
- **Stores**: Calendar IDs and configurations for each event type
- **Per User**: One entry per event type (6 total)

### Reconnection
If you disconnect and reconnect:
- Calendars remain in your Google Calendar
- Database records remain intact
- Status check will find existing calendars
- No need to recreate anything

## Benefits

✅ **No Duplicate Work** - Never recreate calendars unnecessarily
✅ **Faster Setup** - Skip straight to sync/import on return visits
✅ **Smart Detection** - Automatic status checking
✅ **Clear Feedback** - Know exactly what step you're on
✅ **Persistent State** - Works across sessions and devices

## Console Logs

When checking status, you'll see:
```
[GoogleCalendarSync] Sync status: { calendarsSetup: true, calendarsCount: 6 }
```

This confirms the system detected your existing calendars.

## Notes

- If all 6 calendar types exist, `calendarsSetup = true`
- If any are missing, `calendarsSetup = false` and you'll see "Setup Sync"
- "Setup Sync" is idempotent - safe to run multiple times
- Existing calendars are reused, not recreated
