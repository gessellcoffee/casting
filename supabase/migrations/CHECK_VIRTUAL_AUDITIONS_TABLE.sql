-- Check if virtual_auditions table exists and what columns it has
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'virtual_auditions'
ORDER BY ordinal_position;

-- Check RLS policies on virtual_auditions
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'virtual_auditions';

-- Try to describe the table structure
SELECT 
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
FROM 
    pg_catalog.pg_attribute a
WHERE 
    a.attrelid = 'virtual_auditions'::regclass
    AND a.attnum > 0 
    AND NOT a.attisdropped
ORDER BY a.attnum;
