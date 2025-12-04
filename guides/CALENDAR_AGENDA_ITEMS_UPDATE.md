# Calendar View Update: Rehearsal Events Only

## Change Summary

Updated the calendar to show **only rehearsal events** instead of individual agenda items. Agenda items are now visible within the rehearsal event modal when you click on an event.

## What Changed

### 1. **Removed Agenda Items from Calendar Display**

**Files Updated:**
- `src/app/my-shows/[auditionId]/calendar/page.tsx`
- `src/app/my-calendar/page.tsx`

**Changes:**
- Removed `generateAgendaItemEvents(userAgendaItems)` from production events generation
- Added comment explaining that agenda items are shown in rehearsal event modals instead

### 2. **Added Agenda Items to Rehearsal Event Data**

**Files Updated:**
- `src/lib/supabase/auditionSignups.ts`

**Functions Modified:**
- `getUserOwnedRehearsalEvents()` - Added `rehearsal_agenda_items` to query
- `getUserProductionTeamRehearsalEvents()` - Added `rehearsal_agenda_items` to query
- `getUserCastRehearsalEvents()` - Added `rehearsal_agenda_items` to query

**Query Addition:**
```typescript
rehearsal_agenda_items (
  rehearsal_agenda_items_id,
  title,
  description,
  start_time,
  end_time
)
```

### 3. **Pass Agenda Items to Calendar Events**

**File Updated:**
- `src/lib/utils/calendarEvents.ts`

**Changes:**
- Modified `generateProductionEvents()` to include `notes` and `agendaItems` properties when creating rehearsal event objects

```typescript
events.push({
  type: 'rehearsal_event',
  title: `${audition.shows.title} - Rehearsal`,
  show: audition.shows,
  date: startTime,
  startTime,
  endTime,
  location: event.location,
  auditionId: audition.audition_id,
  userRole,
  eventId: event.rehearsal_events_id,
  notes: event.notes,                          // ← Added
  agendaItems: event.rehearsal_agenda_items || [] // ← Added
} as any);
```

### 4. **Rehearsal Event Modal Already Implemented** ✅

**File:** `src/components/auditions/RehearsalEventModal.tsx`

The modal already had full support for displaying agenda items:
- Shows each agenda item in a card
- Displays title, description, and time range
- Shows "No agenda items" message for full cast calls
- Clean, organized UI with neumorphic design

## User Experience

### Before
- Calendar showed individual agenda items as separate events
- Calendar was cluttered with many small events
- Had to click each agenda item to see details

### After
- Calendar shows one rehearsal event per rehearsal
- Cleaner, more organized calendar view
- Click on rehearsal event to see all agenda items within that rehearsal
- Better overview of rehearsal schedule

## How It Works

1. **Calendar View**: Shows rehearsal events with date, time, and location
2. **Click Event**: Opens `RehearsalEventModal`
3. **Modal Display**: Shows:
   - Rehearsal date and time
   - Location (clickable Google Maps link)
   - Notes (if any)
   - **All agenda items** with their individual times
   - If no agenda items: "This is a full cast call"

## Benefits

✅ **Cleaner calendar** - Less visual clutter
✅ **Better organization** - Agenda items grouped under their rehearsal
✅ **Faster loading** - Fewer calendar events to render
✅ **Easier navigation** - See full rehearsal structure at a glance
✅ **Logical hierarchy** - Rehearsal → Agenda Items

## Testing

After restarting your dev server, verify:

1. **Calendar displays only rehearsal events** (not agenda items)
2. **Click rehearsal event** opens modal
3. **Modal shows all agenda items** for that rehearsal
4. **Agenda items show** title, description, and time range
5. **Works for all user roles**: cast members, owners, production team

## Files Modified

1. `src/app/my-shows/[auditionId]/calendar/page.tsx` - Removed agenda item events
2. `src/app/my-calendar/page.tsx` - Removed agenda item events
3. `src/lib/supabase/auditionSignups.ts` - Added agenda items to queries (3 functions)
4. `src/lib/utils/calendarEvents.ts` - Pass agenda items to events
5. `src/components/auditions/RehearsalEventModal.tsx` - Already supported agenda items ✅

## Notes

- The `RehearsalEventModal` component already had full support for displaying agenda items - no changes needed there
- Agenda items are fetched as part of the rehearsal event query for efficiency
- This pattern is more scalable for productions with many agenda items per rehearsal
