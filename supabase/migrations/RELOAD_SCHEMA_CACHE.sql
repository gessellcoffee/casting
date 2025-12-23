-- Reload Supabase PostgREST schema cache
-- This fixes the error: "Could not find the 'audition_id' column of 'audition_signups' in the schema cache"
-- When the database schema changes, Supabase's PostgREST server caches the schema
-- and needs to be explicitly told to reload it.

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Alternative: You can also run this in the Supabase dashboard SQL Editor:
-- SELECT pg_notify('pgrst', 'reload schema');
