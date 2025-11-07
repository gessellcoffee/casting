-- =====================================================
-- PRODUCTIONS WORKFLOW SYSTEM MIGRATION
-- =====================================================
-- This migration adds support for production workflow management,
-- including rehearsal scheduling, agenda items, and performance tracking.
--
-- Features:
-- - Workflow status tracking (auditioning → performing)
-- - Rehearsal events with detailed scheduling
-- - Agenda items with 5-minute increments
-- - Cast/crew assignments to agenda items
-- - Performance events with call times
-- - User rehearsal reminder preferences
--
-- Date: November 6, 2025
-- =====================================================

-- Workflow status enum
CREATE TYPE workflow_status AS ENUM (
  'auditioning',
  'casting', 
  'offering_roles',
  'rehearsing',
  'performing',
  'completed'
);

-- Add to auditions table
ALTER TABLE auditions ADD COLUMN workflow_status workflow_status DEFAULT 'auditioning';

-- Rehearsal events (replaces rehearsal_dates JSONB)
CREATE TABLE rehearsal_events (
  rehearsal_events_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID REFERENCES auditions(audition_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rehearsal agenda items (5-min increments within events)
CREATE TABLE rehearsal_agenda_items (
  rehearsal_agenda_items_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rehearsal_event_id UUID REFERENCES rehearsal_events(rehearsal_events_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agenda assignments (many-to-many: items to users)
CREATE TABLE agenda_assignments (
  agenda_assignments_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agenda_item_id UUID REFERENCES rehearsal_agenda_items(rehearsal_agenda_items_id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'assigned', -- 'assigned', 'accepted', 'declined', 'conflict'
  conflict_note TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agenda_item_id, user_id)
);

-- Performance events
CREATE TABLE performance_events (
  performance_events_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id UUID REFERENCES auditions(audition_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  call_time TIME NOT NULL,
  curtain_time TIME NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User notification preferences for rehearsals
ALTER TABLE profiles ADD COLUMN rehearsal_reminder_hours INTEGER DEFAULT 24;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_rehearsal_events_audition ON rehearsal_events(audition_id);
CREATE INDEX idx_rehearsal_events_date ON rehearsal_events(date);
CREATE INDEX idx_rehearsal_agenda_items_event ON rehearsal_agenda_items(rehearsal_event_id);
CREATE INDEX idx_agenda_assignments_item ON agenda_assignments(agenda_item_id);
CREATE INDEX idx_agenda_assignments_user ON agenda_assignments(user_id);
CREATE INDEX idx_performance_events_audition ON performance_events(audition_id);
CREATE INDEX idx_performance_events_date ON performance_events(date);
CREATE INDEX idx_auditions_workflow_status ON auditions(workflow_status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE rehearsal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehearsal_agenda_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;

-- Rehearsal Events Policies
-- Users can view rehearsal events for auditions they own or are production members of
CREATE POLICY "Users can view rehearsal events for their auditions" ON rehearsal_events
FOR SELECT USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT audition_id FROM company_members 
    WHERE user_id = auth.uid() AND role IN ('Owner', 'Admin', 'Member') AND status = 'active'
  )
);

-- Only audition owners and production team can insert/update/delete
CREATE POLICY "Audition owners and production team can manage rehearsal events" ON rehearsal_events
FOR ALL USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT a.audition_id FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

-- Rehearsal Agenda Items Policies
-- Users can view agenda items for events they have access to
CREATE POLICY "Users can view agenda items for accessible events" ON rehearsal_agenda_items
FOR SELECT USING (
  rehearsal_event_id IN (
    SELECT rehearsal_events_id FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rehearsal_events_id FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.status = 'active'
  )
);

-- Only audition owners and production team can manage agenda items
CREATE POLICY "Audition owners and production team can manage agenda items" ON rehearsal_agenda_items
FOR ALL USING (
  rehearsal_event_id IN (
    SELECT rehearsal_events_id FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rehearsal_events_id FROM rehearsal_events re
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

-- Agenda Assignments Policies
-- Users can view their own assignments or all assignments if they're production team
CREATE POLICY "Users can view their own agenda assignments" ON agenda_assignments
FOR SELECT USING (
  user_id = auth.uid()
  OR agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

-- Production team can insert/delete assignments
CREATE POLICY "Production team can manage agenda assignments" ON agenda_assignments
FOR INSERT WITH CHECK (
  agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

CREATE POLICY "Production team can delete agenda assignments" ON agenda_assignments
FOR DELETE USING (
  agenda_item_id IN (
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    WHERE a.user_id = auth.uid()
    UNION
    SELECT rai.rehearsal_agenda_items_id FROM rehearsal_agenda_items rai
    JOIN rehearsal_events re ON rai.rehearsal_event_id = re.rehearsal_events_id
    JOIN auditions a ON re.audition_id = a.audition_id
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

-- Users can update their own assignment status (accept/decline/conflict)
CREATE POLICY "Users can update their own assignment status" ON agenda_assignments
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Performance Events Policies (similar to rehearsal events)
CREATE POLICY "Users can view performance events for their auditions" ON performance_events
FOR SELECT USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT audition_id FROM company_members 
    WHERE user_id = auth.uid() AND role IN ('Owner', 'Admin', 'Member') AND status = 'active'
  )
);

CREATE POLICY "Audition owners and production team can manage performance events" ON performance_events
FOR ALL USING (
  audition_id IN (
    SELECT audition_id FROM auditions WHERE user_id = auth.uid()
    UNION
    SELECT a.audition_id FROM auditions a
    JOIN company_members cm ON a.company_id = cm.company_id
    WHERE cm.user_id = auth.uid() AND cm.role IN ('Owner', 'Admin', 'Member') AND cm.status = 'active'
  )
);

-- =====================================================
-- NOTIFICATION TYPES
-- =====================================================
-- Update the CHECK constraint on notifications table to include new types
-- Current types: 'company_approval', 'user_affiliation', 'casting_decision', 'general'
-- Adding: 'rehearsal_assignment', 'rehearsal_conflict', 'rehearsal_reminder', 'cast_removal', 'agenda_change'

ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'company_approval',
  'user_affiliation', 
  'casting_decision',
  'general',
  'rehearsal_assignment',
  'rehearsal_conflict',
  'rehearsal_reminder',
  'cast_removal',
  'agenda_change',
  'casting_offer',
  'callback_invitation',
  'callback_response',
  'offer_revocation'
));
