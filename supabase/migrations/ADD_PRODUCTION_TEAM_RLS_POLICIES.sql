-- =====================================================
-- ADD PRODUCTION TEAM MEMBER RLS POLICIES
-- =====================================================
-- This migration grants production team members the same
-- permissions as audition owners for managing productions,
-- EXCEPT they cannot delete the audition itself.
--
-- Production team members are stored in the production_team_members
-- table and are audition-specific (not company-wide).
--
-- Date: December 2, 2025
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if user can manage audition
-- =====================================================
-- This function checks if a user is either:
-- 1. The audition owner
-- 2. A production team member
-- 3. A company member (owner/admin/member)
-- =====================================================

CREATE OR REPLACE FUNCTION can_manage_audition(target_audition_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Check if user is audition owner
  SELECT EXISTS (
    SELECT 1 FROM auditions 
    WHERE auditions.audition_id = target_audition_id 
    AND auditions.user_id = auth.uid()
  ) INTO has_access;
  
  IF has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is production team member
  SELECT EXISTS (
    SELECT 1 FROM production_team_members
    WHERE production_team_members.audition_id = target_audition_id
    AND production_team_members.user_id = auth.uid()
    AND production_team_members.status = 'active'
  ) INTO has_access;
  
  IF has_access THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is company member
  SELECT EXISTS (
    SELECT 1 FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE a.audition_id = target_audition_id
    AND cm.user_id = auth.uid()
    AND cm.role IN ('Owner', 'Admin', 'Member')
    AND cm.status = 'active'
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- =====================================================
-- AUDITIONS TABLE
-- =====================================================
-- Production team members can UPDATE but NOT DELETE

DROP POLICY IF EXISTS "Users can view their own auditions" ON auditions;
DROP POLICY IF EXISTS "Users can create auditions" ON auditions;
DROP POLICY IF EXISTS "Users can update their own auditions" ON auditions;
DROP POLICY IF EXISTS "Audition owners can update their auditions" ON auditions;
DROP POLICY IF EXISTS "Users can delete their own auditions" ON auditions;
DROP POLICY IF EXISTS "Production team can view auditions" ON auditions;
DROP POLICY IF EXISTS "Production team can update auditions" ON auditions;

-- SELECT: View auditions you own, are production member of, or company member of
CREATE POLICY "Users can view their managed auditions" ON auditions
FOR SELECT USING (can_manage_audition(auditions.audition_id));

-- INSERT: Only the owner can create
CREATE POLICY "Users can create auditions" ON auditions
FOR INSERT WITH CHECK (auditions.user_id = auth.uid());

-- UPDATE: Owners, production team members, and company members can update
CREATE POLICY "Audition managers can update auditions" ON auditions
FOR UPDATE USING (can_manage_audition(auditions.audition_id))
WITH CHECK (can_manage_audition(auditions.audition_id));

-- DELETE: Only the owner can delete (NOT production team)
CREATE POLICY "Only owners can delete auditions" ON auditions
FOR DELETE USING (auditions.user_id = auth.uid());

-- =====================================================
-- AUDITION_ROLES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view roles for their auditions" ON audition_roles;
DROP POLICY IF EXISTS "Users can manage roles for their auditions" ON audition_roles;
DROP POLICY IF EXISTS "Production team can manage audition roles" ON audition_roles;

-- SELECT: View roles for auditions you manage
CREATE POLICY "Users can view roles for their auditions" ON audition_roles
FOR SELECT USING (can_manage_audition(audition_roles.audition_id));

-- INSERT/UPDATE/DELETE: Full access for audition managers
CREATE POLICY "Audition managers can manage roles" ON audition_roles
FOR ALL USING (can_manage_audition(audition_roles.audition_id))
WITH CHECK (can_manage_audition(audition_roles.audition_id));

-- =====================================================
-- AUDITION_SLOTS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view slots for their auditions" ON audition_slots;
DROP POLICY IF EXISTS "Users can manage slots for their auditions" ON audition_slots;
DROP POLICY IF EXISTS "Production team can manage audition slots" ON audition_slots;

-- SELECT: View slots for auditions you manage
CREATE POLICY "Users can view slots for their auditions" ON audition_slots
FOR SELECT USING (can_manage_audition(audition_slots.audition_id));

-- INSERT/UPDATE/DELETE: Full access for audition managers
CREATE POLICY "Audition managers can manage slots" ON audition_slots
FOR ALL USING (can_manage_audition(audition_slots.audition_id))
WITH CHECK (can_manage_audition(audition_slots.audition_id));

-- =====================================================
-- CAST_MEMBERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view cast for their auditions" ON cast_members;
DROP POLICY IF EXISTS "Users can manage cast for their auditions" ON cast_members;
DROP POLICY IF EXISTS "Users can view their own cast records" ON cast_members;
DROP POLICY IF EXISTS "Production team can manage cast members" ON cast_members;

-- SELECT: View cast for auditions you manage OR your own cast records
CREATE POLICY "Users can view relevant cast members" ON cast_members
FOR SELECT USING (
  cast_members.user_id = auth.uid()
  OR can_manage_audition(cast_members.audition_id)
);

-- INSERT/UPDATE/DELETE: Full access for audition managers
CREATE POLICY "Audition managers can manage cast members" ON cast_members
FOR ALL USING (can_manage_audition(cast_members.audition_id))
WITH CHECK (can_manage_audition(cast_members.audition_id));

-- =====================================================
-- CALLBACK_INVITATIONS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view callbacks for their auditions" ON callback_invitations;
DROP POLICY IF EXISTS "Users can manage callbacks for their auditions" ON callback_invitations;
DROP POLICY IF EXISTS "Users can view their own callbacks" ON callback_invitations;
DROP POLICY IF EXISTS "Production team can manage callbacks" ON callback_invitations;

-- SELECT: View callbacks for auditions you manage OR your own callbacks
CREATE POLICY "Users can view relevant callbacks" ON callback_invitations
FOR SELECT USING (
  callback_invitations.user_id = auth.uid()
  OR can_manage_audition(callback_invitations.audition_id)
);

-- INSERT/UPDATE/DELETE: Full access for audition managers
CREATE POLICY "Audition managers can manage callbacks" ON callback_invitations
FOR ALL USING (can_manage_audition(callback_invitations.audition_id))
WITH CHECK (can_manage_audition(callback_invitations.audition_id));

-- =====================================================
-- CASTING_OFFERS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view casting offers for their auditions" ON casting_offers;
DROP POLICY IF EXISTS "Users can manage casting offers for their auditions" ON casting_offers;
DROP POLICY IF EXISTS "Production team can manage casting offers" ON casting_offers;

-- SELECT: View offers for auditions you manage
CREATE POLICY "Users can view casting offers for their auditions" ON casting_offers
FOR SELECT USING (can_manage_audition(casting_offers.audition_id));

-- INSERT/UPDATE/DELETE: Full access for audition managers
CREATE POLICY "Audition managers can manage casting offers" ON casting_offers
FOR ALL USING (can_manage_audition(casting_offers.audition_id))
WITH CHECK (can_manage_audition(casting_offers.audition_id));

-- =====================================================
-- SIGNUP_NOTES TABLE
-- =====================================================

DROP POLICY IF EXISTS "Production team can view signup notes" ON signup_notes;
DROP POLICY IF EXISTS "Production team can manage their own notes" ON signup_notes;
DROP POLICY IF EXISTS "Users can view signup notes for their auditions" ON signup_notes;
DROP POLICY IF EXISTS "Users can manage their own signup notes" ON signup_notes;

-- SELECT: View notes for auditions you manage
CREATE POLICY "Users can view signup notes for their auditions" ON signup_notes
FOR SELECT USING (
  signup_notes.signup_id IN (
    SELECT asig.signup_id FROM audition_signups asig
    WHERE can_manage_audition(asig.audition_id)
  )
);

-- INSERT: Create notes for auditions you manage
CREATE POLICY "Audition managers can create signup notes" ON signup_notes
FOR INSERT WITH CHECK (
  signup_notes.signup_id IN (
    SELECT asig.signup_id FROM audition_signups asig
    WHERE can_manage_audition(asig.audition_id)
  )
);

-- UPDATE/DELETE: Only manage your own notes
CREATE POLICY "Users can manage their own signup notes" ON signup_notes
FOR UPDATE USING (signup_notes.author_id = auth.uid())
WITH CHECK (signup_notes.author_id = auth.uid());

CREATE POLICY "Users can delete their own signup notes" ON signup_notes
FOR DELETE USING (signup_notes.author_id = auth.uid());

-- =====================================================
-- REHEARSAL_EVENTS TABLE (Update existing policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view rehearsal events for their auditions" ON rehearsal_events;
DROP POLICY IF EXISTS "Audition owners and production team can manage rehearsal events" ON rehearsal_events;

CREATE POLICY "Users can view rehearsal events for their auditions" ON rehearsal_events
FOR SELECT USING (can_manage_audition(rehearsal_events.audition_id));

CREATE POLICY "Audition managers can manage rehearsal events" ON rehearsal_events
FOR ALL USING (can_manage_audition(rehearsal_events.audition_id))
WITH CHECK (can_manage_audition(rehearsal_events.audition_id));

-- =====================================================
-- REHEARSAL_AGENDA_ITEMS TABLE (Update existing policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view agenda items for accessible events" ON rehearsal_agenda_items;
DROP POLICY IF EXISTS "Audition owners and production team can manage agenda items" ON rehearsal_agenda_items;

CREATE POLICY "Users can view agenda items for accessible events" ON rehearsal_agenda_items
FOR SELECT USING (
  rehearsal_agenda_items.rehearsal_event_id IN (
    SELECT re.rehearsal_events_id FROM rehearsal_events re
    WHERE can_manage_audition(re.audition_id)
  )
);

CREATE POLICY "Audition managers can manage agenda items" ON rehearsal_agenda_items
FOR ALL USING (
  rehearsal_agenda_items.rehearsal_event_id IN (
    SELECT re.rehearsal_events_id FROM rehearsal_events re
    WHERE can_manage_audition(re.audition_id)
  )
)
WITH CHECK (
  rehearsal_agenda_items.rehearsal_event_id IN (
    SELECT re.rehearsal_events_id FROM rehearsal_events re
    WHERE can_manage_audition(re.audition_id)
  )
);

-- =====================================================
-- AGENDA_ASSIGNMENTS TABLE (Update existing policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own agenda assignments" ON agenda_assignments;
DROP POLICY IF EXISTS "Production team can manage agenda assignments" ON agenda_assignments;
DROP POLICY IF EXISTS "Production team can delete agenda assignments" ON agenda_assignments;

-- SELECT: View your own assignments OR all if you manage the audition
CREATE POLICY "Users can view relevant agenda assignments" ON agenda_assignments
FOR SELECT USING (
  agenda_assignments.user_id = auth.uid()
  OR agenda_assignments.agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    WHERE can_manage_audition(re.audition_id)
  )
);

-- INSERT/DELETE: Audition managers can assign/unassign
CREATE POLICY "Audition managers can manage agenda assignments" ON agenda_assignments
FOR INSERT WITH CHECK (
  agenda_assignments.agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    WHERE can_manage_audition(re.audition_id)
  )
);

CREATE POLICY "Audition managers can delete agenda assignments" ON agenda_assignments
FOR DELETE USING (
  agenda_assignments.agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id 
    FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    WHERE can_manage_audition(re.audition_id)
  )
);

-- UPDATE: Users can update their own assignment status
CREATE POLICY "Users can update their own agenda assignments" ON agenda_assignments
FOR UPDATE USING (agenda_assignments.user_id = auth.uid())
WITH CHECK (agenda_assignments.user_id = auth.uid());

-- =====================================================
-- PERFORMANCE_EVENTS TABLE (Update existing policies)
-- =====================================================

DROP POLICY IF EXISTS "Users can view performance events for their auditions" ON performance_events;
DROP POLICY IF EXISTS "Audition owners and production team can manage performance events" ON performance_events;

CREATE POLICY "Users can view performance events for their auditions" ON performance_events
FOR SELECT USING (can_manage_audition(performance_events.audition_id));

CREATE POLICY "Audition managers can manage performance events" ON performance_events
FOR ALL USING (can_manage_audition(performance_events.audition_id))
WITH CHECK (can_manage_audition(performance_events.audition_id));

-- =====================================================
-- VIRTUAL_AUDITION_SUBMISSIONS TABLE (if exists)
-- =====================================================

DROP POLICY IF EXISTS "Users can view submissions for their auditions" ON virtual_audition_submissions;
DROP POLICY IF EXISTS "Production team can view submissions" ON virtual_audition_submissions;

CREATE POLICY "Audition managers can view submissions" ON virtual_audition_submissions
FOR SELECT USING (
  can_manage_audition(virtual_audition_submissions.audition_id)
  OR virtual_audition_submissions.user_id = auth.uid()
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify policies were created correctly:

-- View all policies for audition-related tables:
-- SELECT schemaname, tablename, policyname, cmd
-- FROM pg_policies 
-- WHERE tablename IN (
--   'auditions', 'audition_roles', 'audition_slots', 'cast_members',
--   'callback_invitations', 'casting_offers', 'signup_notes',
--   'rehearsal_events', 'rehearsal_agenda_items', 'agenda_assignments',
--   'performance_events', 'virtual_audition_submissions'
-- )
-- ORDER BY tablename, cmd, policyname;

-- Test the helper function:
-- SELECT can_manage_audition('your-audition-id-here');

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Production team members have FULL access to manage auditions
--    EXCEPT they cannot DELETE the audition record itself
--
-- 2. The can_manage_audition() function checks three levels:
--    - Audition owner (user_id in auditions table)
--    - Production team member (production_team_members table)
--    - Company member with proper role (company_members table)
--
-- 3. All policies use this function for consistency
--
-- 4. Users can always view/update their own records (cast_members,
--    callback_invitations, agenda_assignments)
-- =====================================================
