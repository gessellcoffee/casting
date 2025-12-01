# Production Refactor & Enhancement Plan

## ✅ COMPLETED: Calendar Event Filtering
- Removed duplicate events from `rehearsal_dates` and `performance_dates` arrays
- Calendars now only show **scheduled events** (rehearsal_events, agenda_items, audition_slots)
- Date arrays remain on production records for reference during signup

---

## 🎯 PHASE 1: Add Performance Events (Immediate)

### Database Changes Needed
**Option A: Add type field to rehearsal_events (RECOMMENDED)**
```sql
-- Add event_type column to existing rehearsal_events table
ALTER TABLE rehearsal_events 
ADD COLUMN event_type TEXT DEFAULT 'rehearsal' CHECK (event_type IN ('rehearsal', 'performance'));

-- Rename table for clarity (optional but recommended)
ALTER TABLE rehearsal_events RENAME TO production_events;
ALTER TABLE production_events RENAME COLUMN rehearsal_events_id TO production_events_id;

-- Update foreign keys in agenda_items
ALTER TABLE rehearsal_agenda_items RENAME TO production_agenda_items;
ALTER TABLE production_agenda_items RENAME COLUMN rehearsal_event_id TO production_event_id;
ALTER TABLE production_agenda_items RENAME COLUMN rehearsal_agenda_items_id TO production_agenda_items_id;
```

**Option B: Keep separate tables (simpler, no breaking changes)**
```sql
-- Create new performance_events table (mirrors rehearsal_events)
CREATE TABLE performance_events (
  performance_events_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID REFERENCES auditions(audition_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy RLS policies from rehearsal_events
-- (owners and production team can manage, cast can view)
```

### Code Changes (Option B - Simpler)
1. **Create `src/lib/supabase/performanceEvents.ts`** - copy from rehearsalEvents.ts
2. **Create `src/components/productions/PerformanceEventForm.tsx`** - copy from RehearsalEventForm.tsx
3. **Add "Performance Schedule" button** to active shows page
4. **Create performance event pages** (list and detail views)
5. **Update calendar generation** to include performance_events

### Estimated Time: 2-3 hours

---

## 🎯 PHASE 2: Call Sheets for Performances

### Changes Needed
1. **Update `DownloadCallSheetButton`** to work with both rehearsal and performance events
2. **Add event_type prop** to distinguish rehearsal vs performance call sheets
3. **Update PDF generator** to show "PERFORMANCE CALL SHEET" vs "REHEARSAL CALL SHEET"
4. **Add button to performance event detail page**

### Code Changes
```typescript
// DownloadCallSheetButton.tsx
interface Props {
  eventId: string;
  eventType: 'rehearsal' | 'performance'; // NEW
  auditionId: string;
}
```

### Estimated Time: 1 hour

---

## 🎯 PHASE 3: Rename "Audition" → "Production" (Major Refactor)

### ⚠️ CRITICAL: Database Cannot Be Renamed Without Breaking Changes
The database table is called `auditions` and has foreign keys throughout. Renaming would require:
- Dropping and recreating all foreign keys
- Updating all RLS policies
- Potential data migration issues

### RECOMMENDED APPROACH: Code-Only Rename

**Strategy:**
1. Keep database table named `auditions` (backend)
2. Update all user-facing text to say "Production" (frontend)
3. Create type aliases for clarity

### Step-by-Step Implementation

#### 1. Create Type Aliases
```typescript
// src/lib/supabase/types.ts
export type ProductionRow = AuditionRow;
export type ProductionInsert = AuditionInsert;
export type ProductionUpdate = AuditionUpdate;

// Alias the database table reference
export type Production = Audition;
```

#### 2. Update Function Names (New Wrapper Functions)
```typescript
// src/lib/supabase/productions.ts (NEW FILE)
import * as auditions from './auditions';

export const getProduction = auditions.getAudition;
export const getProductionWithDetails = auditions.getAuditionWithDetails;
export const createProduction = auditions.createAudition;
export const updateProduction = auditions.updateAudition;
export const deleteProduction = auditions.deleteAudition;
// ... etc for all functions

// Keep old auditions.ts file for backwards compatibility
```

#### 3. Update UI Text (200+ locations)

**Files to Update:**
- Navigation: "Auditions" → "Productions" 
- Breadcrumbs: "Audition Details" → "Production Details"
- Page titles: "My Auditions" → "My Shows/Productions"
- Forms: "Create Audition" → "Create Production"
- Buttons: "Post Audition" → "Post Production"

**Search and Replace Strategy:**
```bash
# Search for all instances (case-sensitive):
- "Audition" → "Production"
- "audition" → "production" (in user-facing text only)
- "My Auditions" → "My Shows"
- "Post an Audition" → "Create a Production"

# DO NOT REPLACE in:
- Database queries (keep auditions table name)
- File paths (would break imports)
- Variable names that reference DB (auditionId, etc.)
```

#### 4. Gradual Migration Path

**Phase 3A: Add "Production" terminology alongside "Audition"**
```typescript
// Example: Show both terms during transition
<h1>Production Details (Audition #{audition.audition_id})</h1>
```

**Phase 3B: Update all user-facing text**
- Update all components to use "Production"
- Keep internal variable names (auditionId, etc.)
- Update route names: `/cast/new` → `/productions/new`

**Phase 3C: Update route structure** (optional, breaking change)
```
OLD: /auditions/[id]
NEW: /productions/[id] (with redirect from old URL)

OLD: /cast/new
NEW: /productions/new (with redirect from old URL)
```

### Estimated Time: 8-12 hours for full refactor

---

## 📋 RECOMMENDED IMPLEMENTATION ORDER

### Week 1: Add Performance Events
1. ✅ Fix calendar duplicates (DONE)
2. Create performance_events table
3. Build performance scheduling UI
4. Test with real production

### Week 2: Performance Call Sheets
1. Update DownloadCallSheetButton for performances
2. Add to performance event pages
3. Test PDF generation

### Week 3: Terminology Update
1. Create productions.ts wrapper
2. Update all UI text to "Production"
3. Update navigation and routes
4. Add redirects for old URLs
5. Update documentation

---

## 🚨 BREAKING CHANGES TO AVOID

**DO NOT:**
- Rename database table `auditions`
- Rename column `audition_id` (used in 20+ foreign keys)
- Change API route paths without redirects
- Update database column names (would break all queries)

**DO:**
- Add new tables (performance_events)
- Add new columns (event_type)
- Create wrapper functions
- Update UI text
- Add route redirects

---

## 📝 MIGRATION CHECKLIST

### Performance Events
- [ ] Create database table/column
- [ ] Write CRUD functions
- [ ] Build event form component
- [ ] Create list and detail pages
- [ ] Update calendar event generation
- [ ] Test with multiple productions

### Performance Call Sheets
- [ ] Update DownloadCallSheetButton component
- [ ] Add to performance event detail page
- [ ] Update PDF template
- [ ] Test with cast assignments

### Production Renaming
- [ ] Create type aliases
- [ ] Create productions.ts wrapper
- [ ] Update NavigationBar
- [ ] Update all page titles
- [ ] Update all form labels
- [ ] Update breadcrumbs
- [ ] Update button text
- [ ] Add route redirects
- [ ] Update documentation
- [ ] Test all workflows

---

## 🎬 READY TO START?

I recommend starting with **Performance Events** (Option B - new table).

Would you like me to:
1. **Create the performance_events table and RLS policies?**
2. **Build the performance scheduling UI?**
3. **Update call sheets for performances?**
4. **Start the production renaming?**

Let me know which phase you'd like to tackle first!
