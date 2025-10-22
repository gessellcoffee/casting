# Skills Implementation: Using Profiles Table

## Overview
**NOTE: This implementation uses the existing `skills` JSONB column in the `profiles` table. No separate table or migration is needed.**

## Database Schema

The `profiles` table already has a `skills` column:
```sql
skills JSONB -- Array of skill names, e.g., ['Acting', 'Singing', 'Dancing']
```

## No Migration Required

Skills are stored as a JSON array directly in the user's profile. This approach:
- ✅ Simplifies the data model (no joins needed)
- ✅ Works with existing RLS policies on the profiles table
- ✅ No additional database setup required
- ✅ Autocomplete is handled in application code by aggregating skills from all profiles

## How It Works

1. **Storage**: Skills are stored as `string[]` in the `profiles.skills` column
2. **Autocomplete**: The application queries all profiles and aggregates unique skills with usage counts
3. **Authorization**: Existing profile RLS policies handle permissions
4. **Updates**: Skills are updated by modifying the entire skills array in the profile

## Implementation Details

- Skills are managed through `src/lib/supabase/skills.ts`
- Uses existing `getProfile()` and `updateProfile()` functions
- Autocomplete fetches all profiles and counts skill occurrences client-side
- No database functions or triggers needed
