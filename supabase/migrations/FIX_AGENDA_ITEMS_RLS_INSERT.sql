-- =====================================================
-- FIX AGENDA ITEMS RLS POLICIES FOR INSERT
-- =====================================================
-- The "FOR ALL" policy doesn't work properly for inserts.
-- We need separate INSERT, UPDATE, and DELETE policies.

-- Drop the existing "FOR ALL" policy
DROP POLICY IF EXISTS "Audition owners and production team can manage agenda items" ON rehearsal_agenda_items;

-- Create separate policies for each operation

-- INSERT: Audition owners and production team can insert agenda items
CREATE POLICY "Audition owners and production team can insert agenda items" ON rehearsal_agenda_items
FOR INSERT WITH CHECK (
  rehearsal_event_id IN (
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- UPDATE: Audition owners and production team can update agenda items
CREATE POLICY "Audition owners and production team can update agenda items" ON rehearsal_agenda_items
FOR UPDATE USING (
  rehearsal_event_id IN (
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
) WITH CHECK (
  rehearsal_event_id IN (
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- DELETE: Audition owners and production team can delete agenda items
CREATE POLICY "Audition owners and production team can delete agenda items" ON rehearsal_agenda_items
FOR DELETE USING (
  rehearsal_event_id IN (
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT re.rehearsal_events_id 
    FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);
