# Production Calendar Integration

## Overview

The production calendar integration allows audition creators and their production team members to have all audition-related dates automatically added to their calendars. This includes:

- **Audition Dates**: All scheduled audition days
- **Audition Slots**: Specific time slots for auditions
- **Callback Dates**: Callback audition time slots
- **Rehearsal Dates**: All rehearsal days
- **Performance Dates**: All performance/show dates

## Implementation Status

### ✅ Completed Features

1. **ICS Calendar File Generation** (`src/lib/utils/calendarUtils.ts`)
   - Generates standard iCalendar (RFC 5545) format files
   - Supports both all-day events (dates) and timed events (slots)
   - Properly escapes special characters
   - Creates unique UIDs for each event
   - Handles timezone conversion (America/Chicago)

2. **Production Calendar API** (`src/lib/supabase/productionTeamMembers.ts`)
   - `generateProductionCalendar()`: Fetches all audition data and generates ICS file
   - `sendCalendarToProductionTeam()`: Prepares calendar for distribution
   - Automatically fetches audition slots and callback slots
   - Parses rehearsal and performance dates from database

3. **Audition Creation Integration** (`src/components/casting/ReviewAndSubmit.tsx`)
   - Automatically generates calendar when audition is created
   - Calls calendar generation after production team members are added
   - Non-blocking - won't fail audition creation if calendar generation fails

4. **Download Calendar Buttons**
   - **Production Calendar** (`src/components/auditions/DownloadCalendarButton.tsx`)
     - For audition creators and production team
     - Available in audition dashboard (`src/app/cast/page.tsx`)
     - Downloads complete production schedule with all dates
   
   - **Personal Calendar** (`src/components/auditions/DownloadMyCalendarButton.tsx`)
     - For actors viewing their own auditions
     - Available on My Auditions page (`src/app/my-auditions/page.tsx`)
     - Downloads user's personal audition schedule
     - Includes: audition slots, callbacks, rehearsals, performances
     - Shows event count badge
     - Disabled when no events scheduled
   
   Both components:
   - Support primary/secondary variants and multiple sizes
   - Show loading state during generation
   - Display error messages if generation fails

## How It Works

### Calendar Generation Flow

1. **When an audition is created:**
   ```
   User fills out audition form
   → Production team members added
   → Calendar generated with all dates
   → [Future] Calendar emailed to team members
   → Calendar ready for download
   ```

2. **Calendar Contents:**
   - **Audition Dates**: All-day events for each audition day
   - **Audition Slots**: Timed events with exact start/end times
   - **Callback Slots**: Timed events for callback auditions
   - **Rehearsal Dates**: All-day events for rehearsal days
   - **Performance Dates**: All-day events for performance days

3. **File Format:**
   - Standard `.ics` file format
   - Compatible with Google Calendar, Outlook, Apple Calendar, etc.
   - Includes location information when available
   - Events marked as CONFIRMED status

### Using the Download Buttons

**Production Calendar Button** (for audition creators):

```tsx
import DownloadCalendarButton from '@/components/auditions/DownloadCalendarButton';

<DownloadCalendarButton
  auditionId={audition.audition_id}
  showTitle={audition.show?.title || 'Production'}
  variant="secondary"  // or "primary"
  size="sm"            // or "md", "lg"
/>
```

**Personal Calendar Button** (for actors):

```tsx
import DownloadMyCalendarButton from '@/components/auditions/DownloadMyCalendarButton';

<DownloadMyCalendarButton
  signups={signups}
  callbacks={callbacks}
  productionEvents={productionEvents}
  variant="primary"    // or "secondary"
  size="md"            // or "sm", "lg"
/>
```

## Future Enhancements Needed

### 🔜 Email Integration

**Status**: Prepared but not implemented

**What's needed:**
1. Set up email service provider:
   - Option 1: Supabase Edge Function with SMTP
   - Option 2: Third-party service (SendGrid, Resend, etc.)
   - Option 3: Transactional email API

2. Implementation location:
   - File: `src/lib/supabase/productionTeamMembers.ts`
   - Function: `sendCalendarToProductionTeam()`
   - See TODO comments in the code

3. Email template should include:
   - Personalized greeting with role title
   - Show/production name
   - Calendar file as attachment
   - Brief instructions on how to import calendar

**Example pseudo-code:**
```typescript
for (const member of members) {
  await sendEmail({
    to: member.profiles?.email || member.invited_email,
    subject: `Production Calendar - ${showTitle}`,
    body: `You've been added as ${member.role_title} for ${showTitle}. 
           Attached is a calendar file with all production dates.`,
    attachments: [{
      filename: 'production-calendar.ics',
      content: icsContent,
      type: 'text/calendar'
    }]
  });
}
```

### 🔜 Real-time Updates

**Potential enhancement:**
- Regenerate and resend calendar when dates change
- Notify production team of schedule changes
- Handle callback slot creation separately

### 🔜 Selective Date Export

**Potential enhancement:**
- Allow users to choose which types of dates to include
- Separate calendars for different roles
- Personal vs team calendars

## Database Schema

### Relevant Tables

- **auditions**: Stores audition_dates (JSONB), rehearsal_dates, performance_dates
- **audition_slots**: Stores specific time slots for auditions
- **callback_slots**: Stores callback audition time slots
- **production_team_members**: Links team members to auditions

### Date Storage Format

- **Audition dates**: JSONB array of YYYY-MM-DD strings
- **Rehearsal/Performance dates**: Comma-separated YYYY-MM-DD strings
- **Slots**: ISO 8601 datetime strings (start_time, end_time)

## Technical Details

### Calendar Event Types

1. **All-Day Events** (Dates):
   - Format: `DTSTART;VALUE=DATE:YYYYMMDD`
   - Used for: Audition dates, rehearsal dates, performance dates
   - No timezone required

2. **Timed Events** (Slots):
   - Format: `DTSTART:YYYYMMDDTHHmmss`
   - Used for: Audition slots, callback slots
   - Includes specific start and end times

### File Generation

The ICS file follows RFC 5545 specification:
- VCALENDAR wrapper with METHOD:PUBLISH
- Multiple VEVENT components (one per date/slot)
- Each event has unique UID
- Location included when available
- All events marked as CONFIRMED

## Testing

To test the calendar feature:

1. **Create an audition** with:
   - Multiple audition dates
   - Rehearsal dates
   - Performance dates
   - Audition slots
   - Production team members

2. **Click "Download Calendar"** on the dashboard

3. **Import the .ics file** into your calendar app:
   - Google Calendar: Settings → Import & Export
   - Outlook: File → Open & Export → Import/Export
   - Apple Calendar: File → Import

4. **Verify** all dates and slots appear correctly

## Troubleshooting

### Calendar not downloading
- Check browser console for errors
- Ensure audition has at least one date/slot
- Verify all date formats are valid

### Dates showing incorrectly
- Check timezone settings in calendar app
- Verify database stores dates in YYYY-MM-DD format
- Confirm local date parsing is working

### Production team not receiving calendars
- Email integration not yet implemented
- See "Future Enhancements" section above

## Files Modified/Created

### New Files
- `src/lib/utils/calendarUtils.ts` - Calendar generation utilities
- `src/components/auditions/DownloadCalendarButton.tsx` - Production calendar download button
- `src/components/auditions/DownloadMyCalendarButton.tsx` - Personal audition calendar download button
- `guides/PRODUCTION_CALENDAR_INTEGRATION.md` - This documentation

### Modified Files
- `src/lib/supabase/productionTeamMembers.ts` - Added calendar generation functions
- `src/components/casting/ReviewAndSubmit.tsx` - Integrated calendar generation
- `src/app/cast/page.tsx` - Added download button to casting dashboard
- `src/app/my-auditions/page.tsx` - Added personal calendar download button

## Summary

The calendar integration is now **fully functional for manual downloads** with two distinct calendar types:

### Production Calendar (For Creators & Team)
- Comprehensive calendar with all production dates
- Available on Cast Dashboard (`/cast`)
- Includes: audition dates, slots, callbacks, rehearsals, performances
- Infrastructure ready for automated email distribution

### Personal Calendar (For Actors)
- Personal audition schedule
- Available on My Auditions page (`/my-auditions`)
- Includes: your audition slots, callbacks, and production events
- Shows event count and disabled state when empty

**Current Workflow:**

*For Audition Creators:*
1. ✅ Create audition with all dates
2. ✅ Add production team members
3. ✅ Calendar automatically generated
4. ✅ Download calendar from dashboard
5. ⏳ Email distribution (pending email service setup)

*For Actors:*
1. ✅ Sign up for auditions
2. ✅ Get cast in shows
3. ✅ View all events on calendar page
4. ✅ Download personal calendar with one click

**Next Steps:**
1. Set up email service provider
2. Implement email sending in `sendCalendarToProductionTeam()`
3. Test email delivery and calendar import
4. Add notification when calendar is sent
5. Consider automated calendar updates on schedule changes
