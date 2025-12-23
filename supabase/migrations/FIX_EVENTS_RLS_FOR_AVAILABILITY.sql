-- Fix RLS policies to allow viewing other users' events for availability checking
-- This is needed for the UserProfileModal to show busy times

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;

-- Create new policies:
-- 1. Users can always view their own events
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Authenticated users can view other users' events (for availability checking)
-- This allows casting directors to see when actors are busy
CREATE POLICY "Authenticated users can view events for availability" 
ON public.events 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Note: The getUserAvailability function already hides sensitive information
-- by replacing titles with "Busy" and removing descriptions/locations
