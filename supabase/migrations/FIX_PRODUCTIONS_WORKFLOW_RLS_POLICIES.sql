-- =====================================================
-- FIX PRODUCTIONS WORKFLOW RLS POLICIES
-- =====================================================
-- This script fixes the RLS policies that have incorrect joins
-- between auditions and company_members tables.
--
-- The issue: Policies were trying to join auditions directly with
-- company_members, but they need to go through the companies table.
--
-- Date: November 6, 2025
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view rehearsal events for their auditions" ON rehearsal_events;
DROP POLICY IF EXISTS "Audition owners and production team can manage rehearsal events" ON rehearsal_events;
DROP POLICY IF EXISTS "Users can view agenda items for accessible events" ON rehearsal_agenda_items;
DROP POLICY IF EXISTS "Audition owners and production team can manage agenda items" ON rehearsal_agenda_items;
DROP POLICY IF EXISTS "Users can view their own agenda assignments" ON agenda_assignments;
DROP POLICY IF EXISTS "Production team can manage agenda assignments" ON agenda_assignments;
DROP POLICY IF EXISTS "Production team can delete agenda assignments" ON agenda_assignments;
DROP POLICY IF EXISTS "Users can view performance events for their auditions" ON performance_events;
DROP POLICY IF EXISTS "Audition owners and production team can manage performance events" ON performance_events;

-- =====================================================
-- CORRECTED REHEARSAL EVENTS POLICIES
-- =====================================================

-- Users can view rehearsal events for auditions they own or are production members of
CREATE POLICY "Users can view rehearsal events for their auditions" ON rehearsal_events
FOR SELECT USING (
  audition_id IN (
    -- Auditions the user owns
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    -- Auditions where user is a production team member
    SELECT a.audition_id 
    FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- Only audition owners and production team can insert/update/delete
CREATE POLICY "Audition owners and production team can manage rehearsal events" ON rehearsal_events
FOR ALL USING (
  audition_id IN (
    -- Auditions the user owns
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    -- Auditions where user is a production team member
    SELECT a.audition_id 
    FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- =====================================================
-- CORRECTED REHEARSAL AGENDA ITEMS POLICIES
-- =====================================================

-- Users can view agenda items for events they have access to
CREATE POLICY "Users can view agenda items for accessible events" ON rehearsal_agenda_items
FOR SELECT USING (
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
      AND cm.status = 'active'
  )
);

-- Only audition owners and production team can manage agenda items
CREATE POLICY "Audition owners and production team can manage agenda items" ON rehearsal_agenda_items
FOR ALL USING (
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

-- =====================================================
-- CORRECTED AGENDA ASSIGNMENTS POLICIES
-- =====================================================

-- Users can view their own assignments or all assignments if they're production team
CREATE POLICY "Users can view their own agenda assignments" ON agenda_assignments
FOR SELECT USING (
  user_id = auth.uid()
  OR agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- Production team can insert assignments
CREATE POLICY "Production team can manage agenda assignments" ON agenda_assignments
FOR INSERT WITH CHECK (
  agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- Production team can delete assignments
CREATE POLICY "Production team can delete agenda assignments" ON agenda_assignments
FOR DELETE USING (
  agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- =====================================================
-- CORRECTED PERFORMANCE EVENTS POLICIES
-- =====================================================

-- Users can view performance events for their auditions
CREATE POLICY "Users can view performance events for their auditions" ON performance_events
FOR SELECT USING (
  audition_id IN (
    -- Auditions the user owns
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    -- Auditions where user is a production team member
    SELECT a.audition_id 
    FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- Audition owners and production team can manage performance events
CREATE POLICY "Audition owners and production team can manage performance events" ON performance_events
FOR ALL USING (
  audition_id IN (
    -- Auditions the user owns
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    -- Auditions where user is a production team member
    SELECT a.audition_id 
    FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() 
      AND cm.role IN ('Owner', 'Admin', 'Member') 
      AND cm.status = 'active'
  )
);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify all policies were created:
-- SELECT schemaname, tablename, policyname 
-- FROM pg_policies 
-- WHERE tablename IN ('rehearsal_events', 'rehearsal_agenda_items', 'agenda_assignments', 'performance_events')
-- ORDER BY tablename, policyname;
