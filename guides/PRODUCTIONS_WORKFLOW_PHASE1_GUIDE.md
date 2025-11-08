# Productions Workflow System - Phase 1 Implementation Guide

## Overview
Phase 1 establishes the foundation for the productions workflow system by adding workflow status tracking to auditions. This allows productions to move through different stages: Auditioning → Casting → Offering Roles → Rehearsing → Performing → Completed.

## What's Been Created

### 1. Database Migration
**File**: `migrations/DATABASE_MIGRATION_PRODUCTIONS_WORKFLOW.sql`

**What it does**:
- Creates `workflow_status` enum with 6 states
- Adds `workflow_status` column to `auditions` table (defaults to 'auditioning')
- Creates 4 new tables:
  - `rehearsal_events` - Replaces rehearsal_dates JSONB with structured data
  - `rehearsal_agenda_items` - 5-minute increment scheduling within events
  - `agenda_assignments` - Many-to-many assignments of users to agenda items
  - `performance_events` - Performance dates with call times and curtain times
- Adds `rehearsal_reminder_hours` to profiles for user preferences
- Creates indexes for performance
- Sets up Row Level Security (RLS) policies

**To run**: Execute the SQL in your Supabase SQL Editor

### 2. TypeScript Types
**File**: `src/lib/supabase/types.ts`

**Added types**:
- `WorkflowStatus` - Union type for workflow states
- `RehearsalEvent` - Rehearsal event structure
- `RehearsalAgendaItem` - Agenda item structure
- `AgendaAssignment` - Assignment structure
- `AgendaAssignmentStatus` - Status type
- `PerformanceEvent` - Performance event structure
- Extended types with joined data

### 3. API Functions
**File**: `src/lib/supabase/workflowStatus.ts`

**Functions**:
- `getWorkflowStatus(auditionId)` - Get current status
- `updateWorkflowStatus(auditionId, newStatus)` - Change status (with permission check)
- `getAuditionsByWorkflowStatus(status)` - Filter auditions by status
- `getWorkflowStatusInfo(status)` - Get display info (label, color, description)
- `getAvailableTransitions(currentStatus)` - Get possible status changes

**Permission Logic**: Only audition owners and production team members (Owner, Admin, Member) can update workflow status.

### 4. UI Components
**File**: `src/components/productions/WorkflowStatusBadge.tsx`

**Purpose**: Display workflow status as a colored badge
**Props**:
- `status` - Current workflow status
- `showDescription` - Optional description text
- `className` - Additional CSS classes

**Colors**:
- Auditioning: Blue
- Casting: Purple
- Offering Roles: Yellow
- Rehearsing: Green
- Performing: Red
- Completed: Gray

**File**: `src/components/productions/WorkflowTransition.tsx`

**Purpose**: Modal for changing workflow status
**Props**:
- `auditionId` - Audition to update
- `currentStatus` - Current workflow status
- `onStatusChange` - Callback when status changes

**Features**:
- Shows current status
- Grid of available transitions
- Confirmation before changing
- Error handling
- Permission-based (only shows for authorized users)

## How to Use

### Step 1: Run the Database Migration
```sql
-- In Supabase SQL Editor, run:
-- migrations/DATABASE_MIGRATION_PRODUCTIONS_WORKFLOW.sql
```

### Step 2: Add Workflow Status to Audition Display

Example in an audition details page:

```tsx
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import WorkflowTransition from '@/components/productions/WorkflowTransition';

// In your component:
const [audition, setAudition] = useState<Audition | null>(null);

// Display status badge
<WorkflowStatusBadge status={audition.workflow_status} />

// Allow status changes (for owners/production team)
{canManage && (
  <WorkflowTransition
    auditionId={audition.audition_id}
    currentStatus={audition.workflow_status}
    onStatusChange={(newStatus) => {
      // Refresh audition data
      setAudition({ ...audition, workflow_status: newStatus });
    }}
  />
)}
```

### Step 3: Filter Auditions by Status

```tsx
import { getAuditionsByWorkflowStatus } from '@/lib/supabase/workflowStatus';

// Get all auditions in rehearsing or performing status
const { data: activeShows } = await getAuditionsByWorkflowStatus([
  'rehearsing',
  'performing'
]);

// Get only completed shows
const { data: completedShows } = await getAuditionsByWorkflowStatus('completed');
```

## Integration Points

### Current Auditions Page
Add workflow status badge to audition cards:
```tsx
<WorkflowStatusBadge status={audition.workflow_status} />
```

### Audition Details Page
Add workflow transition component for owners/production team:
```tsx
<WorkflowTransition
  auditionId={audition.audition_id}
  currentStatus={audition.workflow_status}
  onStatusChange={handleStatusChange}
/>
```

### Auditions List Filtering
Add filter dropdown for workflow status:
```tsx
const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');

// Filter auditions client-side or fetch by status
const filteredAuditions = auditions.filter(
  a => statusFilter === 'all' || a.workflow_status === statusFilter
);
```

## Next Steps (Phase 2)

### Navigation Restructure
- Create `/productions` route
- Add submenu with:
  - `/productions/casting` - Auditions in casting phase
  - `/productions/active-shows` - Shows in rehearsing/performing
- Update main navigation

### Rehearsal Events (Phase 3)
- Create UI for managing rehearsal events
- Migrate existing `rehearsal_dates` JSONB to new table
- Build rehearsal event cards and list views

### Agenda Scheduling (Phase 4)
- Time-slot scheduler component
- 5-minute increment picker
- Drag-and-drop support
- Conflict detection

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Workflow status badge displays correctly for each status
- [ ] Workflow transition modal opens and shows available transitions
- [ ] Only authorized users can change workflow status
- [ ] Status changes persist to database
- [ ] Error handling works for unauthorized attempts
- [ ] Status filtering works correctly
- [ ] Colors and styling match app theme

## Notes

- TypeScript errors in `workflowStatus.ts` are expected until migration is run
- All workflow transitions are allowed (can jump or go backward)
- RLS policies ensure only authorized users can modify status
- Workflow status is separate from casting status (offered/accepted/declined)

## Questions or Issues?

If you encounter any issues:
1. Verify the database migration ran successfully
2. Check browser console for errors
3. Verify user has proper permissions (owner or production team member)
4. Check Supabase logs for RLS policy errors
