import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { Company, CompanyInsert, CompanyUpdate } from './types';

/**
 * Get a company by ID
 */
export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (error) {
    console.error('Error fetching company:', error);
    return null;
  }

  return data;
}

/**
 * Get all companies created by a specific user
 */
export async function getUserCompanies(userId: string): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('creator_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user companies:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new company
 */
export async function createCompany(
  companyData: CompanyInsert
): Promise<{ data: Company | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Set the creator_user_id to the authenticated user
  const dataToInsert = {
    ...companyData,
    creator_user_id: user.id,
  };

  const { data, error } = await supabase
    .from('companies')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateCompanyPdfBranding(
  companyId: string,
  pdfBranding: CompanyUpdate['pdf_branding']
): Promise<{ data: Company | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const company = await getCompany(companyId);
  if (!company) {
    const notFoundError = new Error('Company not found');
    console.error('Company not found:', companyId);
    return { data: null, error: notFoundError };
  }

  // Allow company creator, or active company member role owner/admin
  let canUpdate = company.creator_user_id === user.id;
  if (!canUpdate) {
    const { data: membership, error: membershipError } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (membershipError && membershipError.code !== 'PGRST116') {
      console.error('Error checking company membership:', membershipError);
      return { data: null, error: membershipError };
    }

    const role = String(membership?.role || '').toLowerCase();
    canUpdate = role === 'owner' || role === 'admin';
  }

  if (!canUpdate) {
    const unauthorizedError = new Error('Unauthorized: Only company owners/admins can update PDF branding');
    console.error('Authorization failed');
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('companies')
    .update({ pdf_branding: pdfBranding })
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company pdf_branding:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a company
 */
export async function updateCompany(
  companyId: string,
  updates: CompanyUpdate
): Promise<{ data: Company | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this company
  const company = await getCompany(companyId);
  
  if (!company) {
    const notFoundError = new Error('Company not found');
    console.error('Company not found:', companyId);
    return { data: null, error: notFoundError };
  }

  // Authorization check: user can only update their own companies
  if (company.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only update your own companies');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      companyCreatorId: company.creator_user_id 
    });
    return { data: null, error: unauthorizedError };
  }

  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('company_id', companyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a company
 */
export async function deleteCompany(
  companyId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // First, verify the user owns this company
  const company = await getCompany(companyId);
  
  if (!company) {
    const notFoundError = new Error('Company not found');
    console.error('Company not found:', companyId);
    return { error: notFoundError };
  }

  // Authorization check: user can only delete their own companies
  if (company.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: You can only delete your own companies');
    console.error('Authorization failed:', { 
      authenticatedUserId: user.id, 
      companyCreatorId: company.creator_user_id 
    });
    return { error: unauthorizedError };
  }

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('company_id', companyId);

  if (error) {
    console.error('Error deleting company:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a company name is available for a specific user
 */
export async function isCompanyNameAvailable(
  name: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('companies')
    .select('name')
    .eq('name', name)
    .eq('creator_user_id', userId)
    .single();

  // If there's an error and it's not a "not found" error, return false
  if (error && error.code !== 'PGRST116') {
    return false;
  }

  // If data exists, name is taken
  return !data;
}

/**
 * Get all companies (for dropdown selection)
 */
export async function getAllCompanies(): Promise<Pick<Company, 'company_id' | 'name' | 'creator_user_id'>[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('company_id, name, creator_user_id')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching all companies:', error);
    return [];
  }

  return data || [];
}
