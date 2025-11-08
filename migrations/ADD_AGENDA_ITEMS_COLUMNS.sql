-- =====================================================
-- ADD MISSING COLUMNS TO REHEARSAL_AGENDA_ITEMS
-- =====================================================
-- Add duration_minutes and order_index columns for better agenda management

-- Add duration_minutes column (optional, in minutes)
ALTER TABLE rehearsal_agenda_items 
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Add order_index column for sorting agenda items
ALTER TABLE rehearsal_agenda_items 
ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Create index for order_index to improve sorting performance
CREATE INDEX IF NOT EXISTS idx_rehearsal_agenda_items_order 
ON rehearsal_agenda_items(rehearsal_event_id, order_index);

-- Drop the old start_time and end_time columns if they exist (we're using duration instead)
-- Comment these out if you want to keep them
-- ALTER TABLE rehearsal_agenda_items DROP COLUMN IF EXISTS start_time;
-- ALTER TABLE rehearsal_agenda_items DROP COLUMN IF EXISTS end_time;
