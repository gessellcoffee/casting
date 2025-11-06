import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { CompanyApprovalRequest, CompanyApprovalRequestInsert, CompanyApprovalRequestUpdate } from './types';
import { getCompany } from './company';
import { createCompanyApprovalNotification } from './notifications';

/**
 * Create a company approval request when a user selects a company for their resume
 */
export async function createApprovalRequest(
  resumeEntryId: string,
  companyId: string,
  userId: string
): Promise<{ data: CompanyApprovalRequest | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Verify the user is creating a request for themselves
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only create approval requests for yourself');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('company_approval_requests')
    .insert({
      resume_entry_id: resumeEntryId,
      company_id: companyId,
      user_id: userId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating approval request:', error);
    return { data: null, error };
  }

  // Get company and resume details for notification
  if (data) {
    const company = await getCompany(companyId);
    
    // Get resume entry details
    const { data: resumeEntry } = await supabase
      .from('user_resume')
      .select('show_name, role')
      .eq('resume_entry_id', resumeEntryId)
      .single();

    if (company && resumeEntry) {
      // Create notification for company owner
      await createCompanyApprovalNotification(
        company.creator_user_id,
        userId,
        company.name,
        resumeEntry.show_name,
        resumeEntry.role,
        data.request_id
      );
    }
  }

  return { data, error: null };
}

/**
 * Get all approval requests for a company owner
 */
export async function getCompanyApprovalRequests(companyId: string): Promise<CompanyApprovalRequest[]> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return [];
  }

  // Verify the user owns the company
  const company = await getCompany(companyId);
  if (!company || company.creator_user_id !== user.id) {
    console.error('Unauthorized: User does not own this company');
    return [];
  }

  const { data, error } = await supabase
    .from('company_approval_requests')
    .select(`
      *,
      user_resume (
        show_name,
        role,
        date_of_production
      ),
      profiles (
        first_name,
        last_name,
        email,
        profile_photo_url
      )
    `)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching approval requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all pending approval requests for companies owned by the current user
 */
export async function getUserPendingApprovalRequests(): Promise<any[]> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return [];
  }

  // Get all companies owned by the user
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('company_id')
    .eq('creator_user_id', user.id);

  if (companiesError || !companies || companies.length === 0) {
    return [];
  }

  const companyIds = companies.map(c => c.company_id);

  // Get all pending approval requests for these companies
  const { data, error } = await supabase
    .from('company_approval_requests')
    .select(`
      *,
      user_resume (
        show_name,
        role,
        date_of_production
      ),
      profiles (
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      companies (
        name
      )
    `)
    .in('company_id', companyIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending approval requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Approve or reject a company approval request
 */
export async function updateApprovalRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<{ data: CompanyApprovalRequest | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Get the approval request to verify ownership
  const { data: request, error: requestError } = await supabase
    .from('company_approval_requests')
    .select('*, companies(creator_user_id)')
    .eq('request_id', requestId)
    .single();

  if (requestError || !request) {
    console.error('Error fetching approval request:', requestError);
    return { data: null, error: requestError || new Error('Request not found') };
  }

  // Verify the user owns the company
  if (request.companies?.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only approve requests for your own companies');
    console.error('Authorization failed');
    return { data: null, error: unauthorizedError };
  }

  // Update the approval request
  const { data, error } = await supabase
    .from('company_approval_requests')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('request_id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Error updating approval request:', error);
    return { data: null, error };
  }

  // If approved, update the resume entry
  if (status === 'approved' && data) {
    const { error: resumeError } = await supabase
      .from('user_resume')
      .update({ company_approved: true })
      .eq('resume_entry_id', data.resume_entry_id);

    if (resumeError) {
      console.error('Error updating resume entry approval status:', resumeError);
    }
  }

  return { data, error: null };
}

/**
 * Check if a resume entry has a pending approval request
 */
export async function hasPendingApprovalRequest(resumeEntryId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('company_approval_requests')
    .select('request_id')
    .eq('resume_entry_id', resumeEntryId)
    .eq('status', 'pending')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking for pending approval request:', error);
    return false;
  }

  return !!data;
}

/**
 * Get approval request status for a resume entry
 */
export async function getApprovalRequestStatus(resumeEntryId: string): Promise<'pending' | 'approved' | 'rejected' | null> {
  const { data, error } = await supabase
    .from('company_approval_requests')
    .select('status')
    .eq('resume_entry_id', resumeEntryId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching approval request status:', error);
    return null;
  }

  return data?.status || null;
}
