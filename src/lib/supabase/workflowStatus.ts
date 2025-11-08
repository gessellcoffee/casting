/**
 * Workflow Status Management
 * Handles production workflow state transitions for auditions
 * 
 * NOTE: TypeScript errors will appear until the database migration is run.
 * Run: DATABASE_MIGRATION_PRODUCTIONS_WORKFLOW.sql
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Workflow status type definition
 */
export type WorkflowStatus =
  | 'auditioning'
  | 'casting'
  | 'offering_roles'
  | 'rehearsing'
  | 'performing'
  | 'completed';

/**
 * Get the current workflow status for an audition
 */
export async function getWorkflowStatus(auditionId: string) {
  
  const { data, error } = await supabase
    .from('auditions')
    .select('workflow_status')
    .eq('audition_id', auditionId)
    .single();

  if (error) {
    console.error('Error fetching workflow status:', error);
    return { data: null, error };
  }

  return { data: data.workflow_status as WorkflowStatus, error: null };
}

/**
 * Update the workflow status for an audition
 * Only audition owners and production team members can update status
 */
export async function updateWorkflowStatus(
  auditionId: string,
  newStatus: WorkflowStatus
) {

  // Verify user has permission (audition owner or production team)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  // Check if user is audition owner or production team member
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select(`
      audition_id,
      user_id,
      company_id
    `)
    .eq('audition_id', auditionId)
    .single();

  if (auditionError) {
    console.error('Error checking audition permissions:', auditionError);
    return { data: null, error: auditionError };
  }

  const isOwner = audition.user_id === user.id;
  
  // Check if user is a production team member (if audition has a company)
  let isProductionMember = false;
  if (audition.company_id) {
    const { data: membership } = await supabase
      .from('company_members')
      .select('role, status')
      .eq('company_id', audition.company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .in('role', ['owner', 'admin', 'member'])
      .single();
    
    isProductionMember = !!membership;
  }

  if (!isOwner && !isProductionMember) {
    return { 
      data: null, 
      error: new Error('You do not have permission to update workflow status') 
    };
  }

  // Update the status
  const { data, error } = await supabase
    .from('auditions')
    .update({ workflow_status: newStatus })
    .eq('audition_id', auditionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating workflow status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get all auditions by workflow status
 * Useful for filtering auditions in the UI
 */
export async function getAuditionsByWorkflowStatus(
  status: WorkflowStatus | WorkflowStatus[]
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: new Error('Not authenticated') };
  }

  const statuses = Array.isArray(status) ? status : [status];

  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      shows(show_name, show_id),
      companies(company_name, company_id)
    `)
    .in('workflow_status', statuses)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching auditions by workflow status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get workflow status display information
 */
export function getWorkflowStatusInfo(status: WorkflowStatus) {
  const statusInfo: Record<WorkflowStatus, { label: string; color: string; description: string }> = {
    auditioning: {
      label: 'Auditioning',
      color: 'blue',
      description: 'Accepting audition signups and scheduling slots'
    },
    casting: {
      label: 'Casting',
      color: 'purple',
      description: 'Reviewing auditions and making casting decisions'
    },
    offering_roles: {
      label: 'Offering Roles',
      color: 'yellow',
      description: 'Sending casting offers and awaiting responses'
    },
    rehearsing: {
      label: 'Rehearsing',
      color: 'green',
      description: 'Production in rehearsal phase'
    },
    performing: {
      label: 'Performing',
      color: 'red',
      description: 'Show is currently running'
    },
    completed: {
      label: 'Completed',
      color: 'gray',
      description: 'Production has finished'
    }
  };

  return statusInfo[status];
}

/**
 * Get available workflow transitions from current status
 * Users can move forward or backward in the workflow
 */
export function getAvailableTransitions(currentStatus: WorkflowStatus): WorkflowStatus[] {
  const allStatuses: WorkflowStatus[] = [
    'auditioning',
    'casting',
    'offering_roles',
    'rehearsing',
    'performing',
    'completed'
  ];

  // Can transition to any status except the current one
  return allStatuses.filter(status => status !== currentStatus);
}