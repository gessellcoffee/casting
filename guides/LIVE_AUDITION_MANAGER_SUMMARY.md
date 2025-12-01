# Live Audition Manager - Quick Reference

## What It Does

Real-time audition management interface allowing production teams to:
- ✅ Track current/active audition slot automatically
- 📝 Take notes on each performer's audition
- 📸 Upload images/videos of auditions
- 👤 View performer profiles and contact info
- 💾 Auto-save all notes and media

## Access

**Route**: `/auditions/[id]/live`

**Button**: "🎬 Live Audition Manager" on audition detail page

**Permissions**: Audition owner or production team member only

## Key Features

### Real-Time Tracking
- Active slot highlighted in green with "Now" badge
- Auto-refreshes every 30 seconds
- Shows next upcoming slot if none active

### Notes System
- Auto-saves 1 second after typing stops
- Full textarea with no character limit
- Shows "Saving..." indicator
- Persistent storage in database

### Media Upload
- Accepts images and videos
- Max file size: 50MB
- Preview with playback controls
- Easy deletion with confirmation

### Actor Info
- Profile photo and name
- Email and scheduled time
- Quick access to full profile

## Files Modified/Created

### Database
- `migrations/ADD_AUDITION_SIGNUP_NOTES_AND_MEDIA.sql` - Schema changes

### Backend
- `src/lib/supabase/auditionSignups.ts` - API functions
- `src/lib/supabase/storage.ts` - File upload/delete
- `src/lib/supabase/types.ts` - Updated type definitions

### Frontend
- `src/components/auditions/LiveAuditionManager.tsx` - Main component
- `src/app/auditions/[id]/live/page.tsx` - Route page
- `src/app/auditions/[id]/page.tsx` - Added button

## Database Changes

### New Columns on `audition_signups`
```sql
notes TEXT
media_files JSONB DEFAULT '[]'
updated_at TIMESTAMPTZ DEFAULT NOW()
last_updated_by UUID REFERENCES profiles(id)
```

### Storage Bucket
**Name**: `audition-media`
**Path**: `auditions/{auditionId}/signups/{signupId}/{filename}`

## API Functions

### Notes
- `updateSignupNotes(signupId, notes, updatedBy)`

### Media
- `addSignupMedia(signupId, mediaFile, updatedBy)`
- `removeSignupMedia(signupId, mediaPath, updatedBy)`
- `uploadAuditionMedia(auditionId, signupId, file)`
- `deleteAuditionMedia(filePath)`

### Data
- `getSignupsWithDetailsForSlots(slotIds[])`
- `getSignupWithDetails(signupId)`

## Usage Flow

1. **Open Manager**: Click "🎬 Live Audition Manager" button
2. **Select Actor**: Click actor card in left sidebar
3. **Take Notes**: Type in notes textarea (auto-saves)
4. **Upload Media**: Click "Upload" → Select file → Preview appears
5. **Switch Actors**: Click next actor to continue

## Technical Details

### Auto-Save
- 1-second debounce on note changes
- Cancels previous save if still typing
- Shows save status indicator

### Active Slot Detection
```typescript
// Runs every 30 seconds
if (now >= slot.start_time && now <= slot.end_time) {
  // Mark as active
}
```

### File Validation
- Type: image/* or video/*
- Size: < 50MB
- Format: Any browser-supported format

### Security
- Authorization: Owner or team member only
- RLS: Database-level access control
- Storage: Auth-required bucket policies

## UI Layout

```
┌─────────────────────────────────────────┐
│  Live Audition Manager - [Show Name]    │
├──────────────┬──────────────────────────┤
│   SLOTS      │   ACTOR DETAILS          │
│              │                          │
│ 🟢 2:00 PM   │  [Profile Photo]         │
│    Now       │  John Doe                │
│    • John Doe│  john@example.com        │
│              │  2:00 PM - 2:30 PM       │
│   2:30 PM    │                          │
│    • Jane S  │  ┌─────────────────┐    │
│              │  │ Notes (auto-save)│    │
│   3:00 PM    │  │                  │    │
│    • Bob J   │  │ Great audition...│    │
│              │  └─────────────────┘    │
│              │                          │
│              │  📎 Media Files          │
│              │  [thumbnail][thumbnail]  │
└──────────────┴──────────────────────────┘
```

## Common Tasks

### Taking Quick Notes
1. Click actor during/after their slot
2. Type observations in notes field
3. Move to next actor (auto-saves)

### Recording Performance
1. Record video on phone/camera
2. Click actor in manager
3. Click Upload → Select video
4. Wait for upload complete

### Reviewing Later
- All notes saved to `audition_signups.notes`
- All media saved to `audition_signups.media_files`
- Access anytime through database or future reports

## Performance

- **Load Time**: ~1-2 seconds for typical audition
- **Auto-Save Delay**: 1 second
- **Active Slot Refresh**: Every 30 seconds
- **File Upload**: Depends on size/connection

## Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️  Mobile browsers (works but desktop recommended)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Notes not saving | Check network, refresh page |
| Can't upload file | Check size (<50MB) and type |
| Slot not active | Wait 30s for refresh |
| Can't access | Must be owner/team member |

## Migration Checklist

- [ ] Run database migration
- [ ] Create `audition-media` storage bucket
- [ ] Configure bucket RLS policies
- [ ] Test with sample audition
- [ ] Verify notes auto-save
- [ ] Verify media upload/delete
- [ ] Train production team on usage

## Future Enhancements

- Callback buttons for quick actions
- Rating/scoring system
- Side-by-side comparisons
- PDF export of notes
- Voice notes support
- Real-time collaboration
- Offline mode

---

**Full Documentation**: See `LIVE_AUDITION_MANAGER.md`
