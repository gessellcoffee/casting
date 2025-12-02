# Google Calendar Import - Debugging Guide

## Overview
Comprehensive logging has been added to help diagnose import issues.

## How to Debug

### 1. Open Browser Console
- Press F12 in your browser
- Go to the "Console" tab
- Keep it open while performing the import

### 2. Perform Import
1. Navigate to `/my-calendar`
2. Click "Import from Google"
3. Select a calendar
4. Click "Import"

### 3. Check Console Logs
Look for logs with these prefixes:
- `[GoogleCalendarSync]` - Client-side logs
- `[Import]` - Server-side logs (in terminal where Next.js is running)
- `[MyCalendar]` - Calendar page logs

## Common Issues & Solutions

### Issue 1: No Events Found
**Logs to check:**
```
[Import] Found 0 events from Google Calendar
[Import] No events found in the selected calendar
```

**Solution:**
- The selected calendar has no events in the next 6 months
- Try a different calendar or add some events to your Google Calendar first

### Issue 2: Token/Authentication Error
**Logs to check:**
```
[Import] Token fetch error: ...
[Import] No tokens found for user
```

**Solution:**
1. Click "Disconnect" in Google Calendar settings
2. Click "Connect Google Calendar" again
3. Accept all permissions
4. Try import again

### Issue 3: Database Insert Errors
**Logs to check:**
```
[Import] Error inserting event: ...
```

**Solution:**
- Check if the `events` table exists in your database
- Verify RLS policies allow inserting events
- Check the error details in the console

### Issue 4: Events Not Showing After Import
**Logs to check:**
```
[GoogleCalendarSync] Calling onSyncComplete...
[MyCalendar] Loading calendar data...
```

**Solution:**
- The calendar should automatically refresh after import
- If not, manually refresh the page
- Check that `personalEvents` are being fetched in the console logs

## Checking Server Logs

### In Development (Terminal)
Look for these logs in your terminal where `npm run dev` is running:
```
[Import] Starting Google Calendar import...
[Import] Request params: { userId: '...', calendarId: '...', ... }
[Import] Found X events from Google Calendar
[Import] Import complete: X imported, Y errors out of Z total
```

### Expected Success Flow
```
Client Side:
[GoogleCalendarSync] Starting import...
[GoogleCalendarSync] Request body: { userId: '...', ... }
[GoogleCalendarSync] Calling /api/google/import...
[GoogleCalendarSync] Response status: 200
[GoogleCalendarSync] Import result: { imported: X, errors: 0, total: X }
[GoogleCalendarSync] Calling onSyncComplete...
[MyCalendar] Loading calendar data...

Server Side:
[Import] Starting Google Calendar import...
[Import] Request params: { userId: '...', ... }
[Import] Tokens found, checking expiry...
[Import] Fetching events from Google Calendar...
[Import] Found X events from Google Calendar
[Import] Processing event: Event Name 1
[Import] Successfully imported: Event Name 1
...
[Import] Import complete: X imported, 0 errors out of X total
```

## Manual Verification

### Check Database
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM events 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Calendar Display
1. After import, personal events should appear in green
2. Check the Calendar Legend filter - ensure "Personal Events" is checked
3. Try different calendar views (Month, Week, List)

## Reporting Issues
If import still doesn't work, include these details:
1. Full console logs (both browser and terminal)
2. Calendar name/type you're trying to import from
3. Number of events in that calendar
4. Any error messages from the modal dialogs
5. Browser type and version
