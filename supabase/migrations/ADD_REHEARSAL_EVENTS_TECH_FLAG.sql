ALTER TABLE rehearsal_events
ADD COLUMN IF NOT EXISTS is_tech_rehearsal boolean NOT NULL DEFAULT false;
