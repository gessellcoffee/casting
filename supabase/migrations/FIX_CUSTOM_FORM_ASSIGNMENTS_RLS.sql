-- Fix RLS policies for custom_form_assignments to allow automatic form assignment during audition signup

-- Add policy to allow users to create form assignments for themselves during audition signup
CREATE POLICY "Users can create form assignments for audition signup"
ON custom_form_assignments
FOR INSERT
WITH CHECK (
  target_type = 'audition'
  AND filled_out_by = 'assignee'
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM auditions a
    WHERE a.audition_id = target_id
      AND a.workflow_status = 'auditioning'
      AND (
        a.required_signup_forms ? form_id::text
        OR a.required_callback_forms ? form_id::text
      )
  )
);

-- Add policy to allow users to view their own form assignments for auditions
CREATE POLICY "Users can view their own audition form assignments"
ON custom_form_assignments
FOR SELECT
USING (
  target_type = 'audition'
  AND filled_out_by = 'assignee'
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM auditions a
    WHERE a.audition_id = target_id
      AND a.workflow_status = 'auditioning'
  )
);
