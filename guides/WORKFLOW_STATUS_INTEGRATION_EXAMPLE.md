# Workflow Status Integration Examples

## Quick Start: Add to Existing Audition Page

### 1. Import Components
```tsx
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import WorkflowTransition from '@/components/productions/WorkflowTransition';
import type { WorkflowStatus } from '@/lib/supabase/types';
```

### 2. Display Status Badge (All Users)
```tsx
// In your audition details component
<div className="flex items-center gap-4">
  <h1>{audition.title}</h1>
  <WorkflowStatusBadge status={audition.workflow_status} />
</div>
```

### 3. Allow Status Changes (Owners/Production Team Only)
```tsx
// Check if user can manage (you probably already have this logic)
const canManage = audition.user_id === user?.id || isProductionMember;

// Add the transition component
{canManage && (
  <WorkflowTransition
    auditionId={audition.audition_id}
    currentStatus={audition.workflow_status}
    onStatusChange={(newStatus) => {
      // Update local state
      setAudition({ ...audition, workflow_status: newStatus });
      // Or refetch audition data
      fetchAudition();
    }}
  />
)}
```

## Example: Audition Details Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getAudition } from '@/lib/supabase/auditions';
import { getUser } from '@/lib/supabase';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import WorkflowTransition from '@/components/productions/WorkflowTransition';

export default function AuditionDetailsPage() {
  const params = useParams();
  const [audition, setAudition] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const userData = await getUser();
      setUser(userData);

      const { data } = await getAudition(params.id);
      setAudition(data);
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;
  if (!audition) return <div>Audition not found</div>;

  const canManage = audition.user_id === user?.id;

  return (
    <div className="container mx-auto p-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">{audition.title}</h1>
          <WorkflowStatusBadge status={audition.workflow_status} />
        </div>

        {/* Status Change Button (Owners Only) */}
        {canManage && (
          <WorkflowTransition
            auditionId={audition.audition_id}
            currentStatus={audition.workflow_status}
            onStatusChange={(newStatus) => {
              setAudition({ ...audition, workflow_status: newStatus });
            }}
          />
        )}
      </div>

      {/* Rest of your audition details */}
      <div className="neu-card-raised p-6">
        <p>{audition.description}</p>
        {/* ... more details ... */}
      </div>
    </div>
  );
}
```

## Example: Auditions List with Status Filter

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getAuditionsByWorkflowStatus } from '@/lib/supabase/workflowStatus';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import type { WorkflowStatus } from '@/lib/supabase/types';

export default function AuditionsListPage() {
  const [auditions, setAuditions] = useState([]);
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'all'>('all');

  useEffect(() => {
    async function loadAuditions() {
      if (statusFilter === 'all') {
        // Load all auditions (use your existing function)
        const { data } = await getAllAuditions();
        setAuditions(data);
      } else {
        // Load filtered by status
        const { data } = await getAuditionsByWorkflowStatus(statusFilter);
        setAuditions(data);
      }
    }
    loadAuditions();
  }, [statusFilter]);

  return (
    <div className="container mx-auto p-6">
      {/* Status Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WorkflowStatus | 'all')}
          className="neu-input"
        >
          <option value="all">All Auditions</option>
          <option value="auditioning">Auditioning</option>
          <option value="casting">Casting</option>
          <option value="offering_roles">Offering Roles</option>
          <option value="rehearsing">Rehearsing</option>
          <option value="performing">Performing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Auditions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {auditions.map((audition) => (
          <div key={audition.audition_id} className="neu-card-raised p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold">{audition.title}</h3>
              <WorkflowStatusBadge status={audition.workflow_status} />
            </div>
            <p className="text-sm text-neu-text-secondary">{audition.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Example: Separate Active Shows View

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getAuditionsByWorkflowStatus } from '@/lib/supabase/workflowStatus';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import Link from 'next/link';

export default function ActiveShowsPage() {
  const [activeShows, setActiveShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActiveShows() {
      // Get shows in rehearsing or performing status
      const { data } = await getAuditionsByWorkflowStatus(['rehearsing', 'performing']);
      setActiveShows(data || []);
      setLoading(false);
    }
    loadActiveShows();
  }, []);

  if (loading) return <div>Loading active shows...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Active Shows</h1>

      {activeShows.length === 0 ? (
        <div className="neu-card-raised p-8 text-center">
          <p className="text-neu-text-secondary">No active shows at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeShows.map((show) => (
            <Link
              key={show.audition_id}
              href={`/productions/active-shows/${show.audition_id}`}
              className="neu-card-raised p-6 hover:scale-105 transition-transform"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{show.shows?.show_name}</h2>
                <WorkflowStatusBadge status={show.workflow_status} />
              </div>
              
              {show.companies && (
                <p className="text-sm text-neu-text-secondary mb-2">
                  {show.companies.company_name}
                </p>
              )}

              <div className="flex gap-2 mt-4">
                {show.workflow_status === 'rehearsing' && (
                  <span className="text-sm text-green-400">In Rehearsal</span>
                )}
                {show.workflow_status === 'performing' && (
                  <span className="text-sm text-red-400">Now Performing</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Styling Tips

### Custom Badge Styling
```tsx
// Add custom className for different sizes
<WorkflowStatusBadge 
  status={audition.workflow_status} 
  className="text-xs" // Smaller badge
/>

<WorkflowStatusBadge 
  status={audition.workflow_status} 
  showDescription // Show description text below badge
/>
```

### Conditional Rendering Based on Status
```tsx
{audition.workflow_status === 'rehearsing' && (
  <Link href={`/productions/active-shows/${audition.audition_id}/rehearsals`}>
    <Button text="View Rehearsal Schedule" />
  </Link>
)}

{audition.workflow_status === 'performing' && (
  <Link href={`/productions/active-shows/${audition.audition_id}/performances`}>
    <Button text="View Performance Schedule" />
  </Link>
)}
```

## Testing Checklist

- [ ] Status badge displays correctly for each workflow state
- [ ] Badge colors match the design (blue, purple, yellow, green, red, gray)
- [ ] Only owners/production team see "Change Status" button
- [ ] Workflow transition modal opens and displays all available states
- [ ] Status changes persist to database
- [ ] Status changes trigger onStatusChange callback
- [ ] Filtering by status works correctly
- [ ] Unauthorized users cannot change status (API blocks it)

## Next Steps

Once workflow status is integrated:
1. Test status changes on a few auditions
2. Add status filter to your main auditions list
3. Create separate views for "Casting" and "Active Shows"
4. Begin Phase 2: Navigation restructure
5. Move to Phase 3: Rehearsal events UI
