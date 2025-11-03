import { supabase } from './client';
import type { 
  ProductionTeamMember, 
  ProductionTeamMemberInsert, 
  ProductionTeamMemberUpdate,
  ProductionTeamMemberWithProfile 
} from './types';

/**
 * Get all production team members for an audition
 */
export async function getProductionTeamMembers(
  auditionId: string
): Promise<ProductionTeamMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('production_team_members')
    .select(`
      *,
      profiles!production_team_members_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        profile_photo_url
      )
    `)
    .eq('audition_id', auditionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching production team members:', error);
    return [];
  }

  return data as ProductionTeamMemberWithProfile[] || [];
}

/**
 * Get a single production team member by ID
 */
export async function getProductionTeamMember(
  memberId: string
): Promise<ProductionTeamMemberWithProfile | null> {
  const { data, error } = await supabase
    .from('production_team_members')
    .select(`
      *,
      profiles!production_team_members_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        profile_photo_url
      )
    `)
    .eq('production_team_member_id', memberId)
    .single();

  if (error) {
    console.error('Error fetching production team member:', error);
    return null;
  }

  return data as ProductionTeamMemberWithProfile;
}

/**
 * Add a production team member (existing user)
 */
export async function addProductionTeamMember(
  auditionId: string,
  userId: string,
  roleTitle: string,
  invitedBy: string
): Promise<{ data: ProductionTeamMember | null; error: any }> {
  const { data, error } = await supabase
    .from('production_team_members')
    .insert({
      audition_id: auditionId,
      user_id: userId,
      role_title: roleTitle,
      status: 'active',
      invited_by: invitedBy,
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding production team member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Invite a production team member by email (user doesn't exist yet)
 */
export async function inviteProductionTeamMember(
  auditionId: string,
  email: string,
  roleTitle: string,
  invitedBy: string
): Promise<{ data: ProductionTeamMember | null; error: any }> {
  const { data, error } = await supabase
    .from('production_team_members')
    .insert({
      audition_id: auditionId,
      invited_email: email,
      role_title: roleTitle,
      status: 'pending',
      invited_by: invitedBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inviting production team member:', error);
    return { data: null, error };
  }

  // TODO: Send email invitation
  // This would integrate with your email service to send an invitation
  // to the email address with a link to create an account

  return { data, error: null };
}

/**
 * Update a production team member
 */
export async function updateProductionTeamMember(
  memberId: string,
  updates: ProductionTeamMemberUpdate
): Promise<{ data: ProductionTeamMember | null; error: any }> {
  const { data, error } = await supabase
    .from('production_team_members')
    .update(updates)
    .eq('production_team_member_id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating production team member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Remove a production team member
 */
export async function removeProductionTeamMember(
  memberId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('production_team_members')
    .delete()
    .eq('production_team_member_id', memberId);

  if (error) {
    console.error('Error removing production team member:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Search for users by username or name (for adding to production team)
 */
export async function searchUsersForProductionTeam(
  query: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, profile_photo_url')
    .or(`username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if an email is already registered
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  // Note: This requires a database function or RPC call
  // For now, we'll return false and handle this on the backend
  // You may want to create a Supabase Edge Function for this
  return false;
}

/**
 * Accept a production team invitation (when user creates account)
 */
export async function acceptProductionTeamInvitation(
  memberId: string,
  userId: string
): Promise<{ data: ProductionTeamMember | null; error: any }> {
  const { data, error } = await supabase
    .from('production_team_members')
    .update({
      user_id: userId,
      status: 'active',
      joined_at: new Date().toISOString(),
    })
    .eq('production_team_member_id', memberId)
    .select()
    .single();

  if (error) {
    console.error('Error accepting production team invitation:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get production team invitations for a user by email
 */
export async function getProductionTeamInvitationsByEmail(
  email: string
): Promise<ProductionTeamMemberWithProfile[]> {
  const { data, error } = await supabase
    .from('production_team_members')
    .select(`
      *,
      profiles!production_team_members_user_id_fkey (
        id,
        first_name,
        last_name,
        username,
        profile_photo_url
      )
    `)
    .eq('invited_email', email)
    .eq('status', 'pending');

  if (error) {
    console.error('Error fetching production team invitations:', error);
    return [];
  }

  return data as ProductionTeamMemberWithProfile[] || [];
}

/**
 * Check if a user is a production team member for an audition
 */
export async function isUserProductionMember(
  auditionId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('production_team_members')
    .select('production_team_member_id')
    .eq('audition_id', auditionId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Error checking production team membership:', error);
    return false;
  }

  return !!data;
}
