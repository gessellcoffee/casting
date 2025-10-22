# Audition Location Field Implementation

## Summary

Added a new `audition_location` field to the auditions table and integrated it throughout the application with smart address verification.

## What Was Done

### 1. Database Changes

**Migration File:** `/migrations/DATABASE_MIGRATION_AUDITION_LOCATION.sql`

- Added `audition_location` column to `auditions` table (TEXT, nullable)
- Created index for performance: `idx_auditions_location`
- Added column comment for documentation

### 2. TypeScript Type Updates

**File:** `/src/lib/supabase/types.ts`

Updated the `auditions` table types:
- Added `audition_location: string | null` to `Row` interface
- Added `audition_location?: string | null` to `Insert` interface  
- Added `audition_location?: string | null` to `Update` interface

### 3. Component Updates

#### AuditionDetailsForm
**File:** `/src/components/casting/AuditionDetailsForm.tsx`

- Added `auditionLocation: string` to `AuditionDetails` interface
- Added `AddressInput` component for audition location field
- Placed in "Audition Information" section, right after audition dates

#### New Casting Page
**File:** `/src/app/cast/new/page.tsx`

- Added `auditionLocation: string` to `CastingData.auditionDetails` interface
- Initialized with empty string in state
- Automatically passed to form components

#### Edit Casting Page
**File:** `/src/app/cast/edit/[id]/page.tsx`

- Added `auditionLocation: string` to state interface
- Loads existing `audition_location` from database
- Saves `audition_location` when updating audition

#### ReviewAndSubmit Component
**File:** `/src/components/casting/ReviewAndSubmit.tsx`

- Added `audition_location` field to `createAudition` call
- Passes value from form to database

## Database Migration

### To Apply the Migration

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the following SQL:

```sql
-- Add audition_location column to auditions table
ALTER TABLE auditions
ADD COLUMN audition_location TEXT;

-- Add comment to document the column
COMMENT ON COLUMN auditions.audition_location IS 'Primary location where auditions will be held';

-- Create an index for searching by location
CREATE INDEX IF NOT EXISTS idx_auditions_location ON auditions(audition_location);
```

### To Verify

```sql
-- Check the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auditions' AND column_name = 'audition_location';
```

Expected result:
- `column_name`: audition_location
- `data_type`: text
- `is_nullable`: YES

## Features

### Smart Address Verification

The audition location field uses the `AddressInput` component, which provides:

✅ **Autocomplete** - Google Places API suggestions as you type  
✅ **Verification** - Green checkmark when address is verified  
✅ **Geocoding** - Lat/lng data for verified addresses  
✅ **Formatting** - Standardized address format  
✅ **Fallback** - Works as normal text input if API unavailable  

### User Experience

1. User creates or edits an audition
2. In "Audition Information" section, they see "Audition Location" field
3. As they type, address suggestions appear
4. They select a suggestion or type manually
5. Verified addresses show a green checkmark
6. Location is saved with the audition

## Data Flow

### Creating New Audition

1. User fills out `AuditionDetailsForm`
2. `auditionLocation` stored in component state
3. Passed to `ReviewAndSubmit` component
4. Sent to `createAudition()` function
5. Saved to database as `audition_location`

### Editing Existing Audition

1. Load audition from database
2. Parse `audition_location` field
3. Populate `AuditionDetailsForm` with existing value
4. User can modify location
5. Save updates to database

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Create new audition with location
- [ ] Edit existing audition location
- [ ] Verify location saves to database
- [ ] Test address autocomplete (with API key)
- [ ] Test manual entry (without API key)
- [ ] Verify location displays in audition details
- [ ] Check location index works for queries

## Files Modified

### Database
- `/migrations/DATABASE_MIGRATION_AUDITION_LOCATION.sql` - New migration file
- `/migrations/DATABASE_MIGRATION_INSTRUCTIONS.md` - Updated with new migration

### Types
- `/src/lib/supabase/types.ts` - Added audition_location to types

### Components
- `/src/components/casting/AuditionDetailsForm.tsx` - Added location field
- `/src/components/casting/ReviewAndSubmit.tsx` - Added to create call

### Pages
- `/src/app/cast/new/page.tsx` - Added to state
- `/src/app/cast/edit/[id]/page.tsx` - Added to state and save logic

### Documentation
- `/guides/AUDITION_LOCATION_IMPLEMENTATION.md` - This file

## Related Features

This implementation builds on the address verification system:
- See `/guides/ADDRESS_VERIFICATION_SETUP.md` for Google Maps API setup
- See `/QUICK_START_ADDRESS_VERIFICATION.md` for quick start guide
- See `AddressInput` component at `/src/components/ui/AddressInput.tsx`

## Future Enhancements

Potential improvements:
- Display location on a map in audition details
- Filter auditions by location/proximity
- Show distance from user's location
- Bulk update locations for multiple auditions
- Location history/favorites for quick selection

## Notes

- The field is nullable - existing auditions without location will have `NULL`
- Location is stored as plain text (formatted address)
- Geocoding data (lat/lng) is available but not currently stored
- The field uses the same `AddressInput` component as other location fields
- Index created for future location-based queries

## Support

For issues or questions:
1. Check database migration was applied successfully
2. Verify TypeScript types are up to date
3. Ensure Google Maps API is configured (for autocomplete)
4. Check browser console for errors
5. Review `/guides/ADDRESS_VERIFICATION_SETUP.md` for address verification issues
