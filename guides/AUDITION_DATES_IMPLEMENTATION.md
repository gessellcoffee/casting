# Audition Dates Implementation Guide

## Overview

This document describes the implementation of audition dates in the casting system. Previously, the system incorrectly used rehearsal dates for scheduling audition slots. This has been corrected by adding a dedicated `audition_dates` field to the auditions table.

## Changes Made

### 1. Database Schema

**File:** `DATABASE_MIGRATION_AUDITION_DATES.sql`

Added a new column to the `auditions` table:
- **Column:** `audition_dates` (JSONB)
- **Type:** Array of date strings
- **Default:** Empty array (`[]`)
- **Index:** GIN index for efficient JSONB queries

**How dates are stored:**
- Individual dates are stored as separate entries in the array
- When a user selects a date range, it's expanded into individual dates
- Format: `["2024-01-15", "2024-01-16", "2024-01-17"]`

**To apply the migration:**
1. Open your Supabase SQL Editor
2. Copy the contents of `DATABASE_MIGRATION_AUDITION_DATES.sql`
3. Run the migration
4. Verify with the included verification queries

### 2. TypeScript Types

**File:** `src/lib/supabase/types.ts`

Updated the `auditions` table type definition to include:
```typescript
audition_dates: any | null; // JSONB array of date strings
```

This field is included in:
- `Row` interface (for reading)
- `Insert` interface (for creating)
- `Update` interface (for updating)

### 3. UI Components

#### AuditionDetailsForm
**File:** `src/components/casting/AuditionDetailsForm.tsx`

Added a new "Audition Information" section with:
- Date range selector (start date + optional end date)
- Automatic expansion of date ranges into individual dates
- Display of all selected dates as individual chips
- Ability to remove individual dates

**Key features:**
- If user selects a range (e.g., Jan 15 - Jan 17), it stores: `["2024-01-15", "2024-01-16", "2024-01-17"]`
- If user selects a single date, it stores: `["2024-01-15"]`
- Dates are displayed in a scrollable container with remove buttons

#### SlotScheduler
**File:** `src/components/casting/SlotScheduler.tsx`

Updated to:
- Accept `auditionDates` prop instead of using rehearsal dates
- Display message: "Only showing dates from your selected audition dates"
- Filter calendar to only show available audition dates

#### ReviewAndSubmit
**File:** `src/components/casting/ReviewAndSubmit.tsx`

Updated to:
- Display audition dates in the review section
- Include `audition_dates` when creating the audition
- Show dates as individual chips in the UI

### 4. Page Components

#### New Audition Page
**File:** `src/app/cast/new/page.tsx`

Updated `CastingData` interface to include:
```typescript
auditionDetails: {
  auditionDates: string[];
  rehearsalDates: string[];
  // ... other fields
}
```

Updated `SlotScheduler` to receive `auditionDates` from the form.

#### Edit Audition Page
**File:** `src/app/cast/edit/[id]/page.tsx`

Updated to:
- Load existing `audition_dates` from the database
- Include `auditionDates` in the state
- Save `audition_dates` when updating the audition
- Pass `auditionDates` to `SlotScheduler`

## User Experience

### Creating an Audition

1. **Audition Details Step:**
   - User sees a new "Audition Information" section at the top
   - User can select a single date or a date range
   - Clicking "Add Date/Range" adds the dates to the list
   - Each date appears as a removable chip
   - Date ranges are automatically expanded into individual dates

2. **Slot Scheduler Step:**
   - Calendar only shows weeks containing audition dates
   - Unavailable dates are grayed out and marked as "Unavailable"
   - User can only create slots on selected audition dates
   - Message displays: "Only showing dates from your selected audition dates (X days available)"

3. **Review Step:**
   - Audition dates are displayed as individual chips
   - Shows the total count of audition dates

### Editing an Audition

- Existing audition dates are loaded from the database
- User can add or remove dates
- Changes are saved when clicking "Save Changes"

## Data Flow

```
User Input (Date Range)
  ↓
AuditionDetailsForm (Expands to individual dates)
  ↓
CastingData State (Array of date strings)
  ↓
SlotScheduler (Filters calendar)
  ↓
ReviewAndSubmit (Displays and saves)
  ↓
Database (JSONB array)
```

## Migration Path

For existing auditions without `audition_dates`:
- The field will be `null` or `[]` (empty array)
- Users can edit the audition to add audition dates
- The system gracefully handles missing audition dates

## Benefits

1. **Correct Semantics:** Audition dates are now separate from rehearsal dates
2. **Flexible Selection:** Users can select non-contiguous dates
3. **Better UX:** Clear visual representation of selected dates
4. **Efficient Storage:** Individual dates stored in JSONB array
5. **Easy Querying:** GIN index allows efficient date-based queries

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create new audition with single date
- [ ] Create new audition with date range
- [ ] Create new audition with multiple non-contiguous dates
- [ ] Verify dates appear correctly in slot scheduler
- [ ] Verify only audition dates are selectable in calendar
- [ ] Edit existing audition and add dates
- [ ] Edit existing audition and remove dates
- [ ] Verify dates display correctly in review section
- [ ] Verify dates are saved to database correctly

## Future Enhancements

Potential improvements for future iterations:
- Calendar view for date selection instead of date pickers
- Bulk date selection (e.g., "all weekdays in January")
- Date templates (e.g., "typical audition schedule")
- Conflict detection with other auditions
- Integration with calendar exports (iCal, Google Calendar)

## Rollback

If you need to rollback this change:

```sql
-- Remove the column and index
DROP INDEX IF EXISTS idx_auditions_audition_dates;
ALTER TABLE auditions DROP COLUMN IF EXISTS audition_dates;
```

Then revert the code changes in the affected files.
