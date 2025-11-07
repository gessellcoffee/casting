-- =====================================================
-- FIX AGENDA ASSIGNMENTS RLS FOR BULK INSERT
-- =====================================================
-- This policy grants INSERT permission to audition owners
-- and production team members, allowing them to bulk assign
-- cast members to agenda items.

-- Enable RLS on agenda_assignments if not already enabled
ALTER TABLE agenda_assignments ENABLE ROW LEVEL SECURITY;

-- Allow production team members to insert assignments
CREATE POLICY "Production team can insert assignments" ON agenda_assignments
FOR INSERT WITH CHECK (
  agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE
      -- User is the owner of the audition
      a.user_id = auth.uid()
      OR
      -- User is a member of the production company
      (
        a.company_id IS NOT NULL AND
        a.company_id IN (
          SELECT cm.company_id
          FROM company_members cm
          WHERE cm.user_id = auth.uid()
            AND cm.role IN ('Owner', 'Admin', 'Member')
            AND cm.status = 'active'
        )
      )
  )
);
