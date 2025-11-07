# Productions Workflow System - Summary

## Vision
Transform the casting application into a full production management system that follows shows from initial auditions through to final performances.

## Workflow States
1. **Auditioning** - Accepting audition signups and scheduling slots
2. **Casting** - Reviewing auditions and making casting decisions
3. **Offering Roles** - Sending casting offers and awaiting responses
4. **Rehearsing** - Production in rehearsal phase with detailed scheduling
5. **Performing** - Show is currently running
6. **Completed** - Production has finished

## Key Features

### Flexible Workflow
- Can jump between any states (non-linear)
- Can move backward if needed (e.g., recast during rehearsals)
- Controlled by audition owners and production team only

### Rehearsal Management
- Structured rehearsal events (replaces simple date arrays)
- Detailed agenda items with 5-minute increments
- Assign any combination of cast members and production team
- Location and notes for each event

### Cast Scheduling
- Cast members can view full schedule (read-only)
- Cast members can report conflicts
- Production team gets notified of conflicts
- Assignments appear in user calendars

### Performance Tracking
- Call times and curtain times
- Location and notes
- Integrated with calendar system

### Notifications
- Rehearsal assignments
- Conflict reports (to production team)
- Cast removal notifications
- Agenda changes
- Configurable rehearsal reminders (1-24 hours)

## Implementation Phases

### ✅ Phase 1: Workflow Foundation (COMPLETED)
- Database migration with all tables
- TypeScript types
- API functions for workflow status
- WorkflowStatusBadge component
- WorkflowTransition component
- Implementation guide

### Phase 2: Navigation Restructure
- Create `/productions` route structure
- Add "Productions" to main nav with submenu
- Separate casting and active shows views

### Phase 3: Rehearsal Events
- UI for creating/editing rehearsal events
- Data migration from rehearsal_dates JSONB
- List and card views

### Phase 4: Agenda Scheduling
- Time-slot scheduler component
- 5-minute increment time picker
- Conflict detection
- Drag-and-drop support (optional)

### Phase 5: Cast Assignments
- Multi-select for cast + production team
- Assignment status tracking
- Conflict request modal for cast members

### Phase 6: Calendar Integration
- Update calendar queries
- Event type differentiation
- Color-coding by event type
- Filter controls

### Phase 7: Call Sheet View
- Read-only view for cast members
- Full schedule display
- "My Schedule" filtered view
- Print-friendly CSS
- PDF export

### Phase 8: Performance Events
- Performance scheduler UI
- Call time + curtain time fields
- Calendar integration

### Phase 9: Notifications
- Assignment notifications
- Conflict notifications
- Reminder system (cron/scheduled function)
- Cast removal notifications

### Phase 10: User Preferences
- Rehearsal reminder configuration
- Multiple reminder support

## Database Schema

### New Tables
- `rehearsal_events` - Structured rehearsal scheduling
- `rehearsal_agenda_items` - Detailed time-slot agenda
- `agenda_assignments` - User assignments to agenda items
- `performance_events` - Performance scheduling

### Modified Tables
- `auditions` - Added `workflow_status` column
- `profiles` - Added `rehearsal_reminder_hours` column

## Permissions Model

### Audition Owners & Production Team (Owner/Admin/Member)
- Change workflow status
- Create/edit/delete rehearsal events
- Create/edit/delete agenda items
- Assign cast members to agenda items
- View all schedules
- Receive conflict notifications

### Cast Members
- View full rehearsal schedule (read-only)
- View their own assignments
- Report conflicts
- Accept/decline assignments
- Configure reminder preferences

## User Experience

### For Directors/Production Team
1. Create audition (status: Auditioning)
2. Review auditions, send callbacks (status: Casting)
3. Send casting offers (status: Offering Roles)
4. Once cast is set, move to Rehearsing
5. Create rehearsal events with detailed agendas
6. Assign cast members to specific agenda items
7. Receive conflict reports from cast
8. Move to Performing when show opens
9. Move to Completed when show closes

### For Actors/Cast Members
1. Sign up for auditions
2. Receive callback invitations
3. Receive casting offers
4. View full rehearsal schedule
5. See their specific assignments
6. Report conflicts if needed
7. Receive rehearsal reminders
8. View call sheet before performances

## Technical Stack
- **Database**: PostgreSQL (Supabase)
- **Backend**: Supabase API with RLS policies
- **Frontend**: Next.js 14 with React Server Components
- **Styling**: Tailwind CSS + Neumorphic design system
- **State Management**: React hooks + Supabase realtime
- **Notifications**: Email (Resend) + In-app

## Security
- Row Level Security (RLS) on all tables
- Permission checks in API functions
- Only authorized users can modify schedules
- Cast members can only update their own assignment status

## Next Actions
1. Run database migration: `DATABASE_MIGRATION_PRODUCTIONS_WORKFLOW.sql`
2. Test workflow status changes in existing auditions
3. Begin Phase 2: Navigation restructure
4. Plan rehearsal event UI design
