-- Create performance_events table (mirrors rehearsal_events structure)
CREATE TABLE IF NOT EXISTS performance_events (
  performance_events_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID NOT NULL REFERENCES auditions(audition_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_performance_events_audition_id ON performance_events(audition_id);
CREATE INDEX idx_performance_events_date ON performance_events(date);

-- Enable Row Level Security
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Same pattern as rehearsal_events
-- Users can view performance events for productions they're involved in (owner, production team, or cast member)
CREATE POLICY "Users can view performance events for their productions"
ON performance_events
FOR SELECT
USING (
  -- Production owners can view
  audition_id IN (
    SELECT audition_id FROM auditions WHERE created_by = auth.uid()
  )
  OR
  -- Production team members can view
  audition_id IN (
    SELECT a.audition_id 
    FROM auditions a
    JOIN production_team pt ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid()
  )
  OR
  -- Cast members can view
  audition_id IN (
    SELECT a.audition_id
    FROM auditions a
    JOIN audition_slots asl ON a.audition_id = asl.audition_id
    JOIN cast_members cm ON asl.slot_id = cm.slot_id
    WHERE cm.user_id = auth.uid()
  )
);

-- Only production owners and team members can insert performance events
CREATE POLICY "Production owners and team can insert performance events"
ON performance_events
FOR INSERT
WITH CHECK (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE created_by = auth.uid()
  )
  OR
  audition_id IN (
    SELECT a.audition_id 
    FROM auditions a
    JOIN production_team pt ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid() AND pt.role IN ('Owner', 'Admin', 'Member')
  )
);

-- Only production owners and team members can update performance events
CREATE POLICY "Production owners and team can update performance events"
ON performance_events
FOR UPDATE
USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE created_by = auth.uid()
  )
  OR
  audition_id IN (
    SELECT a.audition_id 
    FROM auditions a
    JOIN production_team pt ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid() AND pt.role IN ('Owner', 'Admin', 'Member')
  )
)
WITH CHECK (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE created_by = auth.uid()
  )
  OR
  audition_id IN (
    SELECT a.audition_id 
    FROM auditions a
    JOIN production_team pt ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid() AND pt.role IN ('Owner', 'Admin', 'Member')
  )
);

-- Only production owners and team members can delete performance events
CREATE POLICY "Production owners and team can delete performance events"
ON performance_events
FOR DELETE
USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE created_by = auth.uid()
  )
  OR
  audition_id IN (
    SELECT a.audition_id 
    FROM auditions a
    JOIN production_team pt ON a.audition_id = pt.audition_id
    WHERE pt.user_id = auth.uid() AND pt.role IN ('Owner', 'Admin', 'Member')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_performance_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER performance_events_updated_at
BEFORE UPDATE ON performance_events
FOR EACH ROW
EXECUTE FUNCTION update_performance_events_updated_at();

-- Add comment for documentation
COMMENT ON TABLE performance_events IS 'Scheduled performance events with specific dates and times';
COMMENT ON COLUMN performance_events.date IS 'Date of the performance';
COMMENT ON COLUMN performance_events.start_time IS 'Start time of the performance (TIME format)';
COMMENT ON COLUMN performance_events.end_time IS 'End time of the performance (TIME format)';
COMMENT ON COLUMN performance_events.location IS 'Venue or location of the performance';
COMMENT ON COLUMN performance_events.notes IS 'Additional notes about the performance';
