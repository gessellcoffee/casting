# Live Audition Manager

## Overview

The Live Audition Manager is a comprehensive real-time interface for production teams to manage auditions as they happen. It provides an easy-to-use dashboard showing the current active audition slot, allows note-taking on each performer, and enables uploading of audition recordings (videos/images).

## Features

### 1. Real-Time Slot Tracking
- **Auto-Detection**: Automatically highlights the currently active audition slot based on current time
- **Next Up**: If no slot is currently active, highlights the next upcoming slot
- **30-Second Updates**: Refreshes active slot status every 30 seconds
- **Visual Indicators**: Active slots shown with green border and "Now" badge

### 2. Organized Slot View
- **Chronological Order**: All slots displayed in time order for easy navigation
- **Signup Counts**: Shows how many people signed up for each slot
- **Actor Profiles**: Clickable actor cards with profile photos and names
- **Status Indicators**: Visual badges showing if notes/media have been added

### 3. Notes Management
- **Auto-Save**: Notes automatically save 1 second after you stop typing
- **Rich Text**: Full-featured textarea for detailed performance notes
- **Save Indicators**: Visual feedback showing when notes are being saved
- **Persistent Storage**: All notes saved to database for later review

### 4. Media Upload & Management
- **Multiple Formats**: Support for images (jpg, png, etc.) and videos (mp4, mov, etc.)
- **50MB Limit**: Files up to 50MB can be uploaded
- **Preview**: Images show thumbnail preview, videos have playback controls
- **Delete Option**: Easy removal of uploaded media files
- **Organized Storage**: Files organized by audition and signup in cloud storage

### 5. Actor Information Display
- **Profile Integration**: Shows actor's profile photo, name, and email
- **Time Slot**: Displays the performer's scheduled audition time
- **Quick Access**: View full profile details for casting decisions

## Database Schema

### New Columns Added to `audition_signups`

```sql
-- Text notes about the audition
notes TEXT

-- Array of media files with metadata
media_files JSONB DEFAULT '[]'

-- Tracking fields
updated_at TIMESTAMPTZ
last_updated_by UUID REFERENCES profiles(id)
```

### Media File Structure (JSONB)

```typescript
interface MediaFile {
  url: string;           // Public URL to access the file
  path: string;          // Storage path for deletion
  type: 'image' | 'video';  // File type
  filename: string;      // Original filename
  uploaded_at: string;   // ISO timestamp
}
```

## Storage

### Bucket: `audition-media`

Files organized by path:
```
auditions/{auditionId}/signups/{signupId}/{filename}
```

Example:
```
auditions/abc123/signups/def456/def456-1701234567890.mp4
```

### Security
- RLS policies ensure only production team members and audition owners can upload
- Authorization checks before upload and deletion
- Unique filenames prevent conflicts

## API Functions

### Notes Management

**updateSignupNotes**
```typescript
updateSignupNotes(
  signupId: string,
  notes: string,
  updatedBy: string
): Promise<{ data: any; error: any }>
```

### Media Management

**addSignupMedia**
```typescript
addSignupMedia(
  signupId: string,
  mediaFile: MediaFile,
  updatedBy: string
): Promise<{ data: any; error: any }>
```

**removeSignupMedia**
```typescript
removeSignupMedia(
  signupId: string,
  mediaPath: string,
  updatedBy: string
): Promise<{ data: any; error: any }>
```

### Storage Functions

**uploadAuditionMedia**
```typescript
uploadAuditionMedia(
  auditionId: string,
  signupId: string,
  file: File
): Promise<{ url: string | null; path: string | null; error: any }>
```

**deleteAuditionMedia**
```typescript
deleteAuditionMedia(
  filePath: string
): Promise<{ error: any }>
```

### Data Retrieval

**getSignupsWithDetailsForSlots**
```typescript
getSignupsWithDetailsForSlots(
  slotIds: string[]
): Promise<SignupWithDetails[]>
```

**getSignupWithDetails**
```typescript
getSignupWithDetails(
  signupId: string
): Promise<SignupWithDetails>
```

## User Flow

### Access
1. Navigate to an audition page as owner or production team member
2. Click **"🎬 Live Audition Manager"** button in the Manage Audition section
3. Manager opens showing all slots for today

### Taking Notes
1. Click on any actor in the slots sidebar
2. Actor details appear in the main panel
3. Type notes in the text area
4. Notes auto-save after 1 second of inactivity
5. "Saving..." indicator shows progress

### Uploading Media
1. Select an actor from the sidebar
2. Click **"Upload"** button in the Media Files section
3. Choose an image or video file (max 50MB)
4. File uploads with progress indicator
5. Preview appears in the media grid
6. Click trash icon to delete if needed

### During Live Auditions
1. Currently active slot automatically highlighted in green
2. Click on the active slot's actor to take notes immediately
3. Upload recordings or photos right after their performance
4. Move to next actor as slots progress

## Component Structure

### Files

**Component**: `src/components/auditions/LiveAuditionManager.tsx`
- Main manager interface
- Handles state management
- Manages auto-save and uploads

**Page**: `src/app/auditions/[id]/live/page.tsx`
- Route wrapper
- Authorization checks
- Filters today's slots only

**API**: `src/lib/supabase/auditionSignups.ts`
- CRUD functions for notes and media

**Storage**: `src/lib/supabase/storage.ts`
- File upload/delete functions

**Migration**: `migrations/ADD_AUDITION_SIGNUP_NOTES_AND_MEDIA.sql`
- Database schema changes

### Props

```typescript
interface LiveAuditionManagerProps {
  auditionId: string;
  auditionTitle: string;
  slots: any[];
  userId: string;
  onClose: () => void;
}
```

## UI/UX Patterns

### Layout
- **Two-Panel Design**: Slots sidebar (left) + Details panel (right)
- **Fixed Height**: Max 90vh with scrollable content areas
- **Responsive**: Adapts to different screen sizes
- **Modal Overlay**: Full-screen takeover for focused work

### Visual Design
- **Neumorphic Cards**: Consistent with app design system
- **Color Coding**:
  - Green border = Active slot
  - Blue border = Selected actor
  - Gray = Standard slots
- **Icons**: Clear visual indicators for media types and actions
- **Badges**: Small status indicators for notes/media presence

### Interaction Patterns
- **Click to Select**: Click actor card to view details
- **Auto-Save**: No manual save needed for notes
- **Drag & Drop**: Could be added for media uploads (future enhancement)
- **Confirmation**: Delete actions require confirmation

## Performance Optimizations

### Debouncing
- Notes auto-save with 1-second debounce
- Prevents excessive database writes
- Cancels pending saves when typing continues

### Batch Loading
- Fetches all signups for all slots at once
- Reduces number of database queries
- Better UX with immediate data availability

### Real-Time Updates
- Active slot updates every 30 seconds
- Lightweight check (date comparison only)
- Minimal performance impact

### Local State Management
- Optimistic updates for better UX
- Local state syncs after successful operations
- No page reloads needed

## Security

### Authorization
- Only audition owners can access
- Production team members can access
- Regular users blocked with error message

### File Validation
- Type checking (images/videos only)
- Size limit enforcement (50MB max)
- Server-side validation in storage functions

### RLS Policies
- Database-level access control
- Prevents unauthorized data access
- Enforced on all operations

## Future Enhancements

### Possible Additions
1. **Callback Buttons**: Quick callback invitation from manager
2. **Rating System**: Star ratings or scoring for performances
3. **Comparison View**: Side-by-side actor comparisons
4. **Export Notes**: PDF export of all notes for production team
5. **Voice Notes**: Audio recording support
6. **Real-Time Collaboration**: Multiple team members viewing simultaneously
7. **Templates**: Pre-defined note templates for consistency
8. **Search**: Find actors by name or notes content

### Technical Improvements
1. **Websockets**: Real-time updates across multiple users
2. **Video Compression**: Reduce file sizes before upload
3. **Image Optimization**: Auto-resize large images
4. **Offline Support**: Local storage for notes when offline
5. **Keyboard Shortcuts**: Quick navigation and actions

## Troubleshooting

### Notes Not Saving
- Check auto-save indicator
- Verify network connection
- Ensure user has permission (owner/team member)
- Check browser console for errors

### Media Upload Fails
- Verify file size (must be < 50MB)
- Check file type (images or videos only)
- Ensure network connection stable
- Try a different file format

### Slot Not Showing as Active
- Verify current time matches slot time
- Wait up to 30 seconds for auto-refresh
- Check slot times are correct in database
- Refresh page if stuck

### Can't Access Manager
- Must be audition owner or production team member
- Verify logged in as correct user
- Check audition ID is valid
- Contact admin if permission issues persist

## Migration Steps

1. **Run Database Migration**:
   ```bash
   # Apply the migration
   supabase db push migrations/ADD_AUDITION_SIGNUP_NOTES_AND_MEDIA.sql
   ```

2. **Create Storage Bucket**:
   - Create `audition-media` bucket in Supabase Dashboard
   - Set bucket to public (for authenticated access)
   - Configure RLS policies for upload/delete

3. **No Code Changes Needed**:
   - All API functions are backward compatible
   - Existing signups work without notes/media
   - Optional fields default to null

## Best Practices

### During Auditions
- Open manager before first slot begins
- Keep one tab dedicated to the manager
- Take notes immediately after each performance
- Upload media while fresh in memory

### Note Taking
- Include specific details about performance
- Note any special skills demonstrated
- Mention chemistry with other actors (if applicable)
- Record any technical issues or concerns

### Media Management
- Upload best take for each actor
- Use descriptive filenames
- Delete poor quality recordings
- Keep file sizes reasonable

### Team Coordination
- Designate one person as primary note-taker
- Share access with assistant directors
- Review notes together after auditions
- Use for callback decisions
