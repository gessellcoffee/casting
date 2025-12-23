ALTER TABLE custom_form_assignments
ADD COLUMN IF NOT EXISTS filled_out_by TEXT NOT NULL DEFAULT 'assignee'
CHECK (filled_out_by IN ('assignee', 'production_team'));

CREATE INDEX IF NOT EXISTS idx_custom_form_assignments_filled_out_by
  ON custom_form_assignments(filled_out_by);
DROP POLICY IF EXISTS "Users can submit their own custom form responses" ON custom_form_responses;
DROP POLICY IF EXISTS "Users can update their own custom form responses" ON custom_form_responses;

CREATE POLICY "Users can submit custom form responses when allowed"
ON custom_form_responses
FOR INSERT
WITH CHECK (
  respondent_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM custom_form_assignments a
    WHERE a.assignment_id = custom_form_responses.assignment_id
      AND (
        (
          a.filled_out_by = 'assignee'
          AND (
            (a.target_type = 'cast_member' AND EXISTS (
              SELECT 1
              FROM cast_members cm
              WHERE cm.cast_member_id = a.target_id
                AND cm.user_id = auth.uid()
            ))
            OR (a.target_type = 'audition' AND (
              a.target_id IN (
                SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                UNION
                SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                UNION
                SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
              )
              OR EXISTS (
                SELECT 1
                FROM auditions au
                WHERE au.audition_id = a.target_id
                  AND au.workflow_status = 'auditioning'
              )
            ))
            OR (a.target_type = 'audition_slot' AND auth.uid() IS NOT NULL AND EXISTS (
              SELECT 1
              FROM audition_slots s
              WHERE s.slot_id = a.target_id
            ))
            OR (a.target_type = 'callback_slot' AND EXISTS (
              SELECT 1
              FROM callback_invitations ci
              WHERE ci.callback_slot_id = a.target_id
                AND ci.user_id = auth.uid()
            ))
          )
        )
        OR (
          a.filled_out_by = 'production_team'
          AND (
            (a.target_type = 'cast_member' AND EXISTS (
              SELECT 1
              FROM cast_members cm
              JOIN auditions au ON au.audition_id = cm.audition_id
              LEFT JOIN production_team_members pt
                ON pt.audition_id = cm.audition_id
               AND pt.user_id = auth.uid()
               AND pt.status = 'active'
              WHERE cm.cast_member_id = a.target_id
                AND (au.user_id = auth.uid() OR pt.production_team_member_id IS NOT NULL)
            ))
            OR (a.target_type = 'audition' AND a.target_id IN (
              SELECT audition_id FROM auditions WHERE user_id = auth.uid()
              UNION
              SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
            ))
            OR (a.target_type = 'audition_slot' AND EXISTS (
              SELECT 1
              FROM audition_slots s
              WHERE s.slot_id = a.target_id
                AND s.audition_id IN (
                  SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                  UNION
                  SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                )
            ))
            OR (a.target_type = 'callback_slot' AND EXISTS (
              SELECT 1
              FROM callback_slots cs
              WHERE cs.callback_slot_id = a.target_id
                AND cs.audition_id IN (
                  SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                  UNION
                  SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                )
            ))
          )
        )
      )
  )
);

CREATE POLICY "Users can update custom form responses when allowed"
ON custom_form_responses
FOR UPDATE
USING (
  respondent_user_id = auth.uid()
)
WITH CHECK (
  respondent_user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM custom_form_assignments a
    WHERE a.assignment_id = custom_form_responses.assignment_id
      AND (
        (a.filled_out_by = 'assignee' AND (
          (a.target_type = 'cast_member' AND EXISTS (
            SELECT 1 FROM cast_members cm WHERE cm.cast_member_id = a.target_id AND cm.user_id = auth.uid()
          ))
          OR (a.target_type = 'audition_slot' AND auth.uid() IS NOT NULL AND EXISTS (
            SELECT 1 FROM audition_slots s WHERE s.slot_id = a.target_id
          ))
          OR (a.target_type = 'callback_slot' AND EXISTS (
            SELECT 1 FROM callback_invitations ci WHERE ci.callback_slot_id = a.target_id AND ci.user_id = auth.uid()
          ))
          OR (a.target_type = 'audition' AND (
            a.target_id IN (
              SELECT audition_id FROM auditions WHERE user_id = auth.uid()
              UNION
              SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
              UNION
              SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
            )
            OR EXISTS (
              SELECT 1
              FROM auditions au
              WHERE au.audition_id = a.target_id
                AND au.workflow_status = 'auditioning'
            )
          ))
        ))
        OR (a.filled_out_by = 'production_team' AND (
          (a.target_type = 'cast_member' AND EXISTS (
            SELECT 1
            FROM cast_members cm
            JOIN auditions au ON au.audition_id = cm.audition_id
            LEFT JOIN production_team_members pt
              ON pt.audition_id = cm.audition_id
             AND pt.user_id = auth.uid()
             AND pt.status = 'active'
            WHERE cm.cast_member_id = a.target_id
              AND (au.user_id = auth.uid() OR pt.production_team_member_id IS NOT NULL)
          ))
          OR (a.target_type = 'audition' AND a.target_id IN (
            SELECT audition_id FROM auditions WHERE user_id = auth.uid()
            UNION
            SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
          ))
          OR (a.target_type = 'audition_slot' AND EXISTS (
            SELECT 1
            FROM audition_slots s
            WHERE s.slot_id = a.target_id
              AND s.audition_id IN (
                SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                UNION
                SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
              )
          ))
          OR (a.target_type = 'callback_slot' AND EXISTS (
            SELECT 1
            FROM callback_slots cs
            WHERE cs.callback_slot_id = a.target_id
              AND cs.audition_id IN (
                SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                UNION
                SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
              )
          ))
        ))
      )
  )
);
