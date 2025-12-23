-- Create custom events table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT false,
    location TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recurrence_rule_id UUID REFERENCES public.recurrence_rules(id) ON DELETE SET NULL,
    is_recurring BOOLEAN GENERATED ALWAYS AS (recurrence_rule_id IS NOT NULL) STORED
);

-- Create recurrence rules table
CREATE TABLE IF NOT EXISTS public.recurrence_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
    interval INTEGER NOT NULL DEFAULT 1,
    count INTEGER,
    until TIMESTAMPTZ,
    by_second INTEGER[],
    by_minute INTEGER[],
    by_hour INTEGER[],
    by_day TEXT[],
    by_month_day INTEGER[],
    by_year_day INTEGER[],
    by_week_number INTEGER[],
    by_month INTEGER[],
    by_set_pos INTEGER[],
    week_start TEXT DEFAULT 'MO',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_end_time ON public.events(end_time);
CREATE INDEX IF NOT EXISTS idx_events_recurrence_rule_id ON public.events(recurrence_rule_id);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on recurrence_rules table
ALTER TABLE public.recurrence_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for events
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for recurrence_rules
CREATE POLICY "Users can view their own recurrence rules" 
ON public.recurrence_rules 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.recurrence_rule_id = recurrence_rules.id 
    AND events.user_id = auth.uid()
));

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update timestamps
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurrence_rules_updated_at
BEFORE UPDATE ON public.recurrence_rules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate event instances from recurrence rules
CREATE OR REPLACE FUNCTION generate_recurring_instances(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    all_day BOOLEAN,
    location TEXT,
    color TEXT,
    is_recurring BOOLEAN,
    recurrence_rule_id UUID
) AS $$
BEGIN
    RETURN QUERY
    -- Non-recurring events in the date range
    SELECT 
        e.id,
        e.title,
        e.description,
        e.start_time,
        e.end_time,
        e.all_day,
        e.location,
        e.color,
        false as is_recurring,
        NULL::UUID as recurrence_rule_id
    FROM 
        public.events e
    WHERE 
        e.user_id = auth.uid()
        AND e.is_recurring = false
        AND e.start_time <= p_end_date
        AND e.end_time >= p_start_date
        AND (p_event_id IS NULL OR e.id = p_event_id)
    
    UNION ALL
    
    -- Recurring events with instances in the date range
    SELECT 
        e.id,
        e.title,
        e.description,
        (e.start_time + (interval '1 day' * (r.occurrence - 1) * r.interval)) as start_time,
        (e.end_time + (interval '1 day' * (r.occurrence - 1) * r.interval)) as end_time,
        e.all_day,
        e.location,
        e.color,
        true as is_recurring,
        e.recurrence_rule_id
    FROM 
        public.events e
    CROSS JOIN LATERAL (
        -- This is a simplified example - in practice, you'd use rrule.js on the client side
        -- or a more sophisticated function on the server side to generate occurrences
        SELECT 
            generate_series(
                1, 
                CASE 
                    WHEN r.count IS NOT NULL THEN LEAST(r.count, 100) -- Limit to 100 occurrences
                    WHEN r.until IS NOT NULL THEN 
                        CEIL(EXTRACT(EPOCH FROM (LEAST(r.until, p_end_date) - e.start_time)) / 
                             (r.interval * 86400))::INT
                    ELSE 100 -- Default limit to prevent excessive generation
                END
            ) as occurrence,
            r.interval
        FROM 
            public.recurrence_rules r
        WHERE 
            r.id = e.recurrence_rule_id
    ) r
    WHERE 
        e.user_id = auth.uid()
        AND e.is_recurring = true
        AND (e.start_time + (interval '1 day' * (r.occurrence - 1) * r.interval)) <= p_end_date
        AND (e.end_time + (interval '1 day' * (r.occurrence - 1) * r.interval)) >= p_start_date
        AND (p_event_id IS NULL OR e.id = p_event_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
