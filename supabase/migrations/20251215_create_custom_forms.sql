CREATE TABLE IF NOT EXISTS custom_forms (
  form_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_forms_owner_user_id ON custom_forms(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_custom_forms_status ON custom_forms(status);

ALTER TABLE custom_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom forms"
ON custom_forms
FOR SELECT
USING (owner_user_id = auth.uid());

CREATE POLICY "Production team can view audition owner's custom forms"
ON custom_forms
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM production_team_members pt
    JOIN auditions a ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid()
      AND pt.status = 'active'
      AND a.user_id = custom_forms.owner_user_id
  )
);

CREATE POLICY "Users can view custom forms assigned to them"
ON custom_forms
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM custom_form_assignments a
    WHERE a.form_id = custom_forms.form_id
      AND (
        (
          a.target_type = 'audition_slot'
          AND EXISTS (
            SELECT 1
            FROM audition_slots s
            WHERE s.slot_id = a.target_id
          )
        )
        OR (
          a.target_type = 'callback_slot'
          AND EXISTS (
            SELECT 1
            FROM callback_invitations ci
            WHERE ci.callback_slot_id = a.target_id
              AND ci.user_id = auth.uid()
          )
        )
        OR (
          a.target_type = 'audition'
          AND a.target_id IN (
            SELECT audition_id FROM auditions WHERE user_id = auth.uid()
            UNION
            SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
            UNION
            SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
          )
        )
        OR (
          a.target_type = 'cast_member'
          AND EXISTS (
            SELECT 1
            FROM cast_members cm
            WHERE cm.cast_member_id = a.target_id
              AND (
                cm.user_id = auth.uid()
                OR cm.audition_id IN (
                  SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                  UNION
                  SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                )
              )
          )
        )
      )
  )
);

CREATE POLICY "Users can create their own custom forms"
ON custom_forms
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own custom forms"
ON custom_forms
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own custom forms"
ON custom_forms
FOR DELETE
USING (owner_user_id = auth.uid());


CREATE TABLE IF NOT EXISTS custom_form_fields (
  field_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES custom_forms(form_id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (
    field_type IN (
      'text',
      'textarea',
      'integer',
      'decimal',
      'boolean',
      'date',
      'time',
      'datetime',
      'single_select',
      'multi_select',
      'color'
    )
  ),
  required BOOLEAN NOT NULL DEFAULT FALSE,
  help_text TEXT,
  options JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT custom_form_fields_unique_key_per_form UNIQUE (form_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_custom_form_fields_form_id ON custom_form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_fields_sort_order ON custom_form_fields(form_id, sort_order);

ALTER TABLE custom_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fields for forms they can access"
ON custom_form_fields
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM custom_forms f
    WHERE f.form_id = custom_form_fields.form_id
      AND (
        f.owner_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM production_team_members pt
          JOIN auditions a ON a.audition_id = pt.audition_id
          WHERE pt.user_id = auth.uid()
            AND pt.status = 'active'
            AND a.user_id = f.owner_user_id
        )
        OR EXISTS (
          SELECT 1
          FROM custom_form_assignments a
          WHERE a.form_id = f.form_id
            AND (
              (
                a.target_type = 'audition_slot'
                AND auth.uid() IS NOT NULL
                AND EXISTS (
                  SELECT 1
                  FROM audition_slots s
                  WHERE s.slot_id = a.target_id
                )
              )
              OR (
                a.target_type = 'callback_slot'
                AND EXISTS (
                  SELECT 1
                  FROM callback_invitations ci
                  WHERE ci.callback_slot_id = a.target_id
                    AND ci.user_id = auth.uid()
                )
              )
              OR (
                a.target_type = 'audition'
                AND a.target_id IN (
                  SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                  UNION
                  SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                  UNION
                  SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
                )
              )
              OR (
                a.target_type = 'cast_member'
                AND EXISTS (
                  SELECT 1
                  FROM cast_members cm
                  WHERE cm.cast_member_id = a.target_id
                    AND (
                      cm.user_id = auth.uid()
                      OR cm.audition_id IN (
                        SELECT audition_id FROM auditions WHERE user_id = auth.uid()
                        UNION
                        SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
                      )
                    )
                )
              )
            )
        )
      )
  )
);

CREATE POLICY "Users can create fields for their own forms"
ON custom_form_fields
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM custom_forms f
    WHERE f.form_id = custom_form_fields.form_id
      AND f.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update fields for their own forms"
ON custom_form_fields
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM custom_forms f
    WHERE f.form_id = custom_form_fields.form_id
      AND f.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM custom_forms f
    WHERE f.form_id = custom_form_fields.form_id
      AND f.owner_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete fields for their own forms"
ON custom_form_fields
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM custom_forms f
    WHERE f.form_id = custom_form_fields.form_id
      AND f.owner_user_id = auth.uid()
  )
);


CREATE TABLE IF NOT EXISTS custom_form_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES custom_forms(form_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('audition_slot', 'callback_slot', 'audition', 'cast_member')),
  target_id UUID NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT custom_form_assignments_unique UNIQUE (form_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_form_assignments_target ON custom_form_assignments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_assignments_form_id ON custom_form_assignments(form_id);

ALTER TABLE custom_form_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audition slot form assignments"
ON custom_form_assignments
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND target_type = 'audition_slot'
  AND EXISTS (
    SELECT 1 FROM audition_slots s WHERE s.slot_id = custom_form_assignments.target_id
  )
);

CREATE POLICY "Users can view callback slot form assignments when invited"
ON custom_form_assignments
FOR SELECT
USING (
  target_type = 'callback_slot'
  AND EXISTS (
    SELECT 1
    FROM callback_invitations ci
    WHERE ci.callback_slot_id = custom_form_assignments.target_id
      AND ci.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view audition form assignments for their productions"
ON custom_form_assignments
FOR SELECT
USING (
  target_type = 'audition'
  AND target_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    UNION
    SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view cast member form assignments for their productions"
ON custom_form_assignments
FOR SELECT
USING (
  target_type = 'cast_member'
  AND EXISTS (
    SELECT 1
    FROM cast_members cm
    WHERE cm.cast_member_id = custom_form_assignments.target_id
      AND (
        cm.user_id = auth.uid()
        OR cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
      )
  )
);

CREATE POLICY "Audition owners and production team can create custom form assignments"
ON custom_form_assignments
FOR INSERT
WITH CHECK (
  (
    target_type = 'audition'
    AND target_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
  OR (
    target_type = 'audition_slot'
    AND EXISTS (
      SELECT 1
      FROM audition_slots s
      WHERE s.slot_id = custom_form_assignments.target_id
        AND s.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'callback_slot'
    AND EXISTS (
      SELECT 1
      FROM callback_slots cs
      WHERE cs.callback_slot_id = custom_form_assignments.target_id
        AND cs.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'cast_member'
    AND EXISTS (
      SELECT 1
      FROM cast_members cm
      WHERE cm.cast_member_id = custom_form_assignments.target_id
        AND cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
);

CREATE POLICY "Audition owners and production team can update custom form assignments"
ON custom_form_assignments
FOR UPDATE
USING (
  (
    target_type = 'audition'
    AND target_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
  OR (
    target_type = 'audition_slot'
    AND EXISTS (
      SELECT 1
      FROM audition_slots s
      WHERE s.slot_id = custom_form_assignments.target_id
        AND s.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'callback_slot'
    AND EXISTS (
      SELECT 1
      FROM callback_slots cs
      WHERE cs.callback_slot_id = custom_form_assignments.target_id
        AND cs.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'cast_member'
    AND EXISTS (
      SELECT 1
      FROM cast_members cm
      WHERE cm.cast_member_id = custom_form_assignments.target_id
        AND cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
)
WITH CHECK (
  (
    target_type = 'audition'
    AND target_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
  OR (
    target_type = 'audition_slot'
    AND EXISTS (
      SELECT 1
      FROM audition_slots s
      WHERE s.slot_id = custom_form_assignments.target_id
        AND s.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'callback_slot'
    AND EXISTS (
      SELECT 1
      FROM callback_slots cs
      WHERE cs.callback_slot_id = custom_form_assignments.target_id
        AND cs.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'cast_member'
    AND EXISTS (
      SELECT 1
      FROM cast_members cm
      WHERE cm.cast_member_id = custom_form_assignments.target_id
        AND cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
);

CREATE POLICY "Audition owners and production team can delete custom form assignments"
ON custom_form_assignments
FOR DELETE
USING (
  (
    target_type = 'audition'
    AND target_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
  OR (
    target_type = 'audition_slot'
    AND EXISTS (
      SELECT 1
      FROM audition_slots s
      WHERE s.slot_id = custom_form_assignments.target_id
        AND s.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'callback_slot'
    AND EXISTS (
      SELECT 1
      FROM callback_slots cs
      WHERE cs.callback_slot_id = custom_form_assignments.target_id
        AND cs.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'cast_member'
    AND EXISTS (
      SELECT 1
      FROM cast_members cm
      WHERE cm.cast_member_id = custom_form_assignments.target_id
        AND cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
);


CREATE TABLE IF NOT EXISTS custom_form_responses (
  response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES custom_form_assignments(assignment_id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES custom_forms(form_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('audition_slot', 'callback_slot', 'audition', 'cast_member')),
  target_id UUID NOT NULL,
  respondent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT custom_form_responses_unique UNIQUE (assignment_id, respondent_user_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_form_responses_assignment_id ON custom_form_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_responses_respondent_user_id ON custom_form_responses(respondent_user_id);
CREATE INDEX IF NOT EXISTS idx_custom_form_responses_target ON custom_form_responses(target_type, target_id);

ALTER TABLE custom_form_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom form responses"
ON custom_form_responses
FOR SELECT
USING (respondent_user_id = auth.uid());

CREATE POLICY "Audition owners and production team can view responses for their productions"
ON custom_form_responses
FOR SELECT
USING (
  (
    target_type = 'audition'
    AND target_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
  OR (
    target_type = 'audition_slot'
    AND EXISTS (
      SELECT 1
      FROM audition_slots s
      WHERE s.slot_id = custom_form_responses.target_id
        AND s.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'callback_slot'
    AND EXISTS (
      SELECT 1
      FROM callback_slots cs
      WHERE cs.callback_slot_id = custom_form_responses.target_id
        AND cs.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
  OR (
    target_type = 'cast_member'
    AND EXISTS (
      SELECT 1
      FROM cast_members cm
      WHERE cm.cast_member_id = custom_form_responses.target_id
        AND cm.audition_id IN (
          SELECT audition_id FROM auditions WHERE user_id = auth.uid()
          UNION
          SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
        )
    )
  )
);

CREATE POLICY "Users can submit their own custom form responses"
ON custom_form_responses
FOR INSERT
WITH CHECK (respondent_user_id = auth.uid());

CREATE POLICY "Users can update their own custom form responses"
ON custom_form_responses
FOR UPDATE
USING (respondent_user_id = auth.uid())
WITH CHECK (respondent_user_id = auth.uid());

CREATE POLICY "Users can delete their own custom form responses"
ON custom_form_responses
FOR DELETE
USING (respondent_user_id = auth.uid());


CREATE OR REPLACE FUNCTION update_custom_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION sync_custom_form_response_from_assignment()
RETURNS TRIGGER AS $$
BEGIN
  SELECT
    a.form_id,
    a.target_type,
    a.target_id
  INTO
    NEW.form_id,
    NEW.target_type,
    NEW.target_id
  FROM custom_form_assignments a
  WHERE a.assignment_id = NEW.assignment_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS custom_forms_updated_at ON custom_forms;
CREATE TRIGGER custom_forms_updated_at
BEFORE UPDATE ON custom_forms
FOR EACH ROW
EXECUTE FUNCTION update_custom_forms_updated_at();

DROP TRIGGER IF EXISTS custom_form_fields_updated_at ON custom_form_fields;
CREATE TRIGGER custom_form_fields_updated_at
BEFORE UPDATE ON custom_form_fields
FOR EACH ROW
EXECUTE FUNCTION update_custom_forms_updated_at();

DROP TRIGGER IF EXISTS custom_form_responses_updated_at ON custom_form_responses;
CREATE TRIGGER custom_form_responses_updated_at
BEFORE UPDATE ON custom_form_responses
FOR EACH ROW
EXECUTE FUNCTION update_custom_forms_updated_at();

DROP TRIGGER IF EXISTS custom_form_responses_sync_from_assignment ON custom_form_responses;
CREATE TRIGGER custom_form_responses_sync_from_assignment
BEFORE INSERT OR UPDATE ON custom_form_responses
FOR EACH ROW
EXECUTE FUNCTION sync_custom_form_response_from_assignment();
