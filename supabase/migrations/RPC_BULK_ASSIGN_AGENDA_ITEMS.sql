-- =====================================================
-- RPC for Bulk Agenda Item Assignments
-- =====================================================
-- This script creates a database function to handle bulk
-- assignments securely, bypassing potential RLS issues on
-- bulk inserts by using SECURITY DEFINER.

CREATE OR REPLACE FUNCTION bulk_assign_agenda_items(p_agenda_item_id UUID, p_user_ids UUID[])
RETURNS VOID AS $$
DECLARE
  v_audition_id UUID;
  v_company_id UUID;
  v_is_authorized BOOLEAN := FALSE;
  user_id_to_insert UUID;
BEGIN
  -- Step 1: Get the audition_id and company_id for the given agenda item
  SELECT a.audition_id, a.company_id
  INTO v_audition_id, v_company_id
  FROM rehearsal_agenda_items rai
  JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
  JOIN auditions a ON re.audition_id = a.audition_id
  WHERE rai.rehearsal_agenda_items_id = p_agenda_item_id;

  IF v_audition_id IS NULL THEN
    RAISE EXCEPTION 'Agenda item not found or not linked to an audition.';
  END IF;

  -- Step 2: Check if the calling user is authorized
  SELECT 
    (a.user_id = auth.uid()) OR
    (
      a.company_id IS NOT NULL AND
      EXISTS (
        SELECT 1
        FROM company_members cm
        WHERE cm.company_id = a.company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('Owner', 'Admin', 'Member')
          AND cm.status = 'active'
      )
    )
  INTO v_is_authorized
  FROM auditions a
  WHERE a.audition_id = v_audition_id;

  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'User is not authorized to assign cast members for this audition.';
  END IF;

  -- Step 3: Insert the assignments
  FOREACH user_id_to_insert IN ARRAY p_user_ids
  LOOP
    INSERT INTO agenda_assignments (agenda_item_id, user_id)
    VALUES (p_agenda_item_id, user_id_to_insert)
    ON CONFLICT (agenda_item_id, user_id) DO NOTHING;
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
