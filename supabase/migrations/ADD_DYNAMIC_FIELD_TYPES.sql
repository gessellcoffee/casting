-- Add dynamic field types to custom_form_fields constraint
-- This allows role and cast member selection field types

ALTER TABLE custom_form_fields 
DROP CONSTRAINT IF EXISTS custom_form_fields_field_type_check;

ALTER TABLE custom_form_fields 
ADD CONSTRAINT custom_form_fields_field_type_check 
CHECK (
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
    'color',
    'role_list_single_select',
    'role_list_multi_select',
    'cast_members_single_select',
    'cast_members_multi_select'
  )
);
