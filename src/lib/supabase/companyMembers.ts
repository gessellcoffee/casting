import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { 
  CompanyMember, 
  CompanyMemberInsert, 
  CompanyMemberUpdate,
  CompanyMemberWithProfile,
  CompanyMemberRole 
} from './types';
import { getCompany } from './company';

/**
 * Get all members of a company with their profile details
 */
export async function getCompanyMembers(companyId: string): Promise<CompanyMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('company_members')
    .select(`
      *,
      profiles!company_members_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        profile_photo_url
      )
    `)
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching company members:', error);
    return [];
  }

  return data as CompanyMemberWithProfile[] || [];
}

/**
 * Get all companies a user is a member of
 */
export async function getUserCompanyMemberships(userId: string): Promise<CompanyMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('company_members')
    .select(`
      *,
      profiles!company_members_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        profile_photo_url
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user company memberships:', error);
    return [];
  }

  return data as CompanyMemberWithProfile[] || [];
}

/**
 * Add a member to a company
 */
export async function addCompanyMember(
  companyId: string,
  userId: string,
  role: CompanyMemberRole = 'member'
): Promise<{ data: CompanyMember | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Verify the user has permission to add members (must be company owner)
  const company = await getCompany(companyId);
  
  if (!company) {
    const notFoundError = new Error('Company not found');
    console.error('Company not found:', companyId);
    return { data: null, error: notFoundError };
  }

  // Check if user is the company creator (only creators can manage members)
  if (company.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: Only company owners can add members');
    console.error('Authorization failed');
    return { data: null, error: unauthorizedError };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('company_members')
    .select('member_id, status')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .single();

  if (existingMember) {
    if (existingMember.status === 'active') {
      return { data: null, error: new Error('User is already a member of this company') };
    }
    // If member exists but is inactive, reactivate them
    const { data, error } = await supabase
      .from('company_members')
      .update({ 
        status: 'active',
        role,
        invited_by: user.id,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString()
      })
      .eq('member_id', existingMember.member_id)
      .select()
      .single();

    if (error) {
      console.error('Error reactivating company member:', error);
      return { data: null, error };
    }

    return { data, error: null };
  }

  // Add new member
  const { data, error } = await supabase
    .from('company_members')
    .insert({
      company_id: companyId,
      user_id: userId,
      role,
      invited_by: user.id,
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding company member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a company member's role
 */
export async function updateCompanyMemberRole(
  memberId: string,
  role: CompanyMemberRole
): Promise<{ data: CompanyMember | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Get the member to update
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('*, companies(creator_user_id)')
    .eq('member_id', memberId)
    .single();

  if (memberError || !member) {
    console.error('Error fetching member:', memberError);
    return { data: null, error: memberError || new Error('Member not found') };
  }

  // Check if user is the company creator (only creators can update roles)
  if (member.companies?.creator_user_id !== user.id) {
    const unauthorizedError = new Error('Unauthorized: Only company owners can update member roles');
    console.error('Authorization failed');
    return { data: null, error: unauthorizedError };
  }

  // Update the member's role
  const { data, error } = await supabase
    .from('company_members')
    .update({ role })
    .eq('member_id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating member role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Remove a member from a company
 */
export async function removeCompanyMember(
  memberId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // Get the member to remove
  const { data: member, error: memberError } = await supabase
    .from('company_members')
    .select('*, companies(creator_user_id)')
    .eq('member_id', memberId)
    .single();

  if (memberError || !member) {
    console.error('Error fetching member:', memberError);
    return { error: memberError || new Error('Member not found') };
  }

  // Check if user is the company creator or removing themselves
  const isCreator = member.companies?.creator_user_id === user.id;
  const isSelfRemoval = member.user_id === user.id;

  if (!isCreator && !isSelfRemoval) {
    const unauthorizedError = new Error('Unauthorized: Only company owners or the member themselves can remove members');
    console.error('Authorization failed');
    return { error: unauthorizedError };
  }

  // Prevent removing the last owner
  if (member.role === 'owner') {
    const { data: owners } = await supabase
      .from('company_members')
      .select('member_id')
      .eq('company_id', member.company_id)
      .eq('role', 'owner')
      .eq('status', 'active');

    if (owners && owners.length <= 1) {
      return { error: new Error('Cannot remove the last owner of the company') };
    }
  }

  // Soft delete by setting status to inactive
  const { error } = await supabase
    .from('company_members')
    .update({ status: 'inactive' })
    .eq('member_id', memberId);

  if (error) {
    console.error('Error removing company member:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a user is a member of a company
 */
export async function isCompanyMember(
  companyId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('company_members')
    .select('member_id')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking company membership:', error);
    return false;
  }

  return !!data;
}

/**
 * Get a user's role in a company
 */
export async function getUserRoleInCompany(
  companyId: string,
  userId: string
): Promise<CompanyMemberRole | null> {
  const { data, error } = await supabase
    .from('company_members')
    .select('role')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data?.role || null;
}

/**
 * Search for users by username or name (for adding to company)
 */
export async function searchUsers(query: string): Promise<any[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username, profile_photo_url')
    .or(`username.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}
