# Google Calendar Integration Guide

## Overview
This feature allows users to import events from their Google Calendar into their personal events on the My Auditions page.

## Setup Requirements

### 1. Google Cloud Console Setup
Before using this feature, you need to set up OAuth credentials in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

### 2. Environment Variables
Add these to your `.env.local`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
```

For production, update `GOOGLE_REDIRECT_URI` to your production URL.

### 3. Database Migration
Run the migration to create the tokens table:

```sql
-- File: migrations/DATABASE_MIGRATION_GOOGLE_CALENDAR_TOKENS.sql
```

This creates the `google_calendar_tokens` table with proper RLS policies.

### 4. Regenerate Supabase Types
After running the migration, regenerate TypeScript types:

```bash
npm run supabase:types
```

Or manually update `src/lib/supabase/types.ts` to include:

```typescript
google_calendar_tokens: {
  Row: {
    id: string;
    user_id: string;
    access_token: string;
    refresh_token: string | null;
    expiry_date: number | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    access_token: string;
    refresh_token?: string | null;
    expiry_date?: number | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    user_id?: string;
    access_token?: string;
    refresh_token?: string | null;
    expiry_date?: number | null;
    created_at?: string;
    updated_at?: string;
  };
}
```

## Architecture

### Files Created

**Backend:**
- `src/lib/google/auth.ts` - OAuth helper functions
- `src/lib/google/calendar.ts` - Google Calendar API integration
- `src/app/api/google/auth/route.ts` - Initiate OAuth flow
- `src/app/api/auth/callback/google/route.ts` - OAuth callback handler
- `src/app/api/google/calendars/route.ts` - List user's calendars
- `src/app/api/google/events/route.ts` - Fetch calendar events
- `src/app/api/google/disconnect/route.ts` - Disconnect Google account

**Frontend:**
- `src/components/calendar/GoogleCalendarImport.tsx` - Import UI component
- `src/components/calendar/GoogleCalendarImportModal.tsx` - Modal for import process

**Database:**
- `migrations/DATABASE_MIGRATION_GOOGLE_CALENDAR_TOKENS.sql` - Token storage

## User Flow

1. User clicks "Import from Google Calendar" button
2. Redirected to Google OAuth consent screen
3. User authorizes access to their calendar
4. Redirected back to app with authorization code
5. App exchanges code for access/refresh tokens
6. Tokens stored securely in database
7. User selects which calendar to import from
8. User selects date range
9. Events imported into personal events

## Security Features

- **Row Level Security (RLS)**: Users can only access their own tokens
- **Token Refresh**: Automatic refresh when access token expires
- **OAuth 2.0**: Industry standard authentication
- **Disconnect**: Users can revoke access anytime
- **Environment Variables**: Credentials never exposed to client

## API Endpoints

### GET `/api/google/auth`
Generates OAuth authorization URL.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET `/api/auth/callback/google`
Handles OAuth callback and stores tokens.

**Query Params:**
- `code`: Authorization code from Google
- `state`: User ID for security

### GET `/api/google/calendars`
Lists user's Google calendars.

**Response:**
```json
{
  "calendars": [
    {
      "id": "primary",
      "summary": "My Calendar",
      "primary": true,
      "backgroundColor": "#9fc6e7"
    }
  ]
}
```

### POST `/api/google/events`
Fetches events from a calendar.

**Request:**
```json
{
  "calendarId": "primary",
  "timeMin": "2025-01-01T00:00:00Z",
  "timeMax": "2025-12-31T23:59:59Z"
}
```

**Response:**
```json
{
  "events": [
    {
      "title": "Meeting",
      "description": "Team sync",
      "start": "2025-01-15T10:00:00Z",
      "end": "2025-01-15T11:00:00Z",
      "location": "Office",
      "allDay": false,
      "color": "#4285f4"
    }
  ]
}
```

### POST `/api/google/disconnect`
Removes stored tokens and disconnects Google account.

## UI Components

### GoogleCalendarImport
Main component that handles the import flow.

**Usage:**
```tsx
<GoogleCalendarImport userId={user.id} onImportComplete={() => refreshEvents()} />
```

**Features:**
- Connect/disconnect Google account
- Select calendar
- Select date range
- Preview events before import
- Import selected events

## Error Handling

Common errors and solutions:

1. **"Google OAuth credentials not configured"**
   - Add environment variables to `.env.local`

2. **"Not connected to Google Calendar"**
   - User needs to connect their account first

3. **"Failed to fetch events"**
   - Token may be expired (should auto-refresh)
   - Check Google Calendar API is enabled

4. **"access_denied"**
   - User declined authorization
   - Ask user to try again

## Testing

1. **Development Testing:**
   - Use `http://localhost:3000` in authorized origins
   - Add test users in OAuth consent screen

2. **Production Testing:**
   - Update redirect URIs to production domain
   - Ensure HTTPS is enabled

## Limitations

- Maximum 250 events per import (API limit)
- Recurring events imported as individual instances
- Some recurring patterns may not convert perfectly
- Token refresh requires refresh token (obtained with `prompt: 'consent'`)

## Future Enhancements

- Two-way sync (update Google Calendar from app)
- Auto-sync on schedule
- Support for multiple connected calendars
- Event color mapping
- Better recurring event handling
- Conflict detection/resolution
