-- Create production_event_types table
CREATE TABLE IF NOT EXISTS production_event_types (
  production_event_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_event_types_owner_name
  ON production_event_types(owner_user_id, name);

CREATE INDEX IF NOT EXISTS idx_production_event_types_owner_user_id
  ON production_event_types(owner_user_id);

ALTER TABLE production_event_types ENABLE ROW LEVEL SECURITY;

-- Types visibility:
-- - global types (owner_user_id IS NULL)
-- - user's own custom types
-- - custom types owned by the production owner of auditions where the user is an active production team member
CREATE POLICY "Users can view relevant production event types"
ON production_event_types
FOR SELECT
USING (
  owner_user_id IS NULL
  OR owner_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM production_team_members pt
    JOIN auditions a ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid()
      AND pt.status = 'active'
      AND a.user_id = production_event_types.owner_user_id
  )
);

-- Only the owner can create/update/delete their custom types
CREATE POLICY "Users can create their own production event types"
ON production_event_types
FOR INSERT
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own production event types"
ON production_event_types
FOR UPDATE
USING (owner_user_id = auth.uid())
WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can delete their own production event types"
ON production_event_types
FOR DELETE
USING (owner_user_id = auth.uid());

-- Seed the 5 global fixed event types (colors aligned to existing calendar palette)
INSERT INTO production_event_types (owner_user_id, name, color)
VALUES
  (NULL, 'Rehearsal', '#f59e0b'),
  (NULL, 'Tech Rehearsal', '#f97316'),
  (NULL, 'Sitzprobe', '#9b87f5'),
  (NULL, 'Performance', '#ef4444'),
  (NULL, 'Production Team Meeting', '#14b8a6')
ON CONFLICT DO NOTHING;


-- Create production_events table
CREATE TABLE IF NOT EXISTS production_events (
  production_event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  production_event_type_id UUID NOT NULL REFERENCES production_event_types(production_event_type_id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_production_events_audition_id ON production_events(audition_id);
CREATE INDEX IF NOT EXISTS idx_production_events_date ON production_events(date);
CREATE INDEX IF NOT EXISTS idx_production_events_type_id ON production_events(production_event_type_id);

ALTER TABLE production_events ENABLE ROW LEVEL SECURITY;

-- Users can view production events for auditions they are involved in (owner, production team member, cast member)
CREATE POLICY "Users can view production events for their productions"
ON production_events
FOR SELECT
USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    UNION
    SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
  )
);

-- Only audition owners and production team members can manage production events
CREATE POLICY "Audition owners and production team can manage production events"
ON production_events
FOR ALL
USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT pt.audition_id
    FROM production_team_members pt
    WHERE pt.user_id = auth.uid() AND pt.status = 'active'
  )
)
WITH CHECK (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT pt.audition_id
    FROM production_team_members pt
    WHERE pt.user_id = auth.uid() AND pt.status = 'active'
  )
);


-- Assignments table for production event visibility/filtering
CREATE TABLE IF NOT EXISTS production_event_assignments (
  production_event_assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  production_event_id UUID NOT NULL REFERENCES production_events(production_event_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_production_event_assignments_unique
  ON production_event_assignments(production_event_id, user_id);

CREATE INDEX IF NOT EXISTS idx_production_event_assignments_user_id
  ON production_event_assignments(user_id);

ALTER TABLE production_event_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view assignments for productions they're involved in
CREATE POLICY "Users can view production event assignments for their productions"
ON production_event_assignments
FOR SELECT
USING (
  production_event_id IN (
    SELECT pe.production_event_id
    FROM production_events pe
    WHERE pe.audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
      UNION
      SELECT cm.audition_id FROM cast_members cm WHERE cm.user_id = auth.uid()
    )
  )
);

-- Only audition owners and production team members can manage assignments
CREATE POLICY "Audition owners and production team can manage production event assignments"
ON production_event_assignments
FOR ALL
USING (
  production_event_id IN (
    SELECT pe.production_event_id
    FROM production_events pe
    WHERE pe.audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
)
WITH CHECK (
  production_event_id IN (
    SELECT pe.production_event_id
    FROM production_events pe
    WHERE pe.audition_id IN (
      SELECT audition_id FROM auditions WHERE user_id = auth.uid()
      UNION
      SELECT pt.audition_id FROM production_team_members pt WHERE pt.user_id = auth.uid() AND pt.status = 'active'
    )
  )
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_production_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS production_events_updated_at ON production_events;
CREATE TRIGGER production_events_updated_at
BEFORE UPDATE ON production_events
FOR EACH ROW
EXECUTE FUNCTION update_production_events_updated_at();
