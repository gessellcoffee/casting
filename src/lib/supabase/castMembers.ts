import { supabase } from './client';
import type { CastMember, CastMemberInsert, CastMemberUpdate } from './types';

/**
 * Get a cast member by ID
 */
export async function getCastMember(castMemberId: string): Promise<CastMember | null> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('*')
    .eq('cast_member_id', castMemberId)
    .single();

  if (error) {
    console.error('Error fetching cast member:', error);
    return null;
  }

  return data;
}

/**
 * Get cast member with related user, audition, and role data
 */
export async function getCastMemberWithDetails(castMemberId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      auditions (
        audition_id,
        show_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      roles (
        role_id,
        role_name,
        description,
        role_type,
        gender
      )
    `)
    .eq('cast_member_id', castMemberId)
    .single();

  if (error) {
    console.error('Error fetching cast member with details:', error);
    return null;
  }

  return data;
}

/**
 * Get all cast members for a specific audition
 */
export async function getAuditionCastMembers(auditionId: string): Promise<CastMember[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('*')
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error fetching audition cast members:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all cast members for a specific role
 */
export async function getRoleCastMembers(roleId: string): Promise<CastMember[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('*')
    .eq('role_id', roleId);

  if (error) {
    console.error('Error fetching role cast members:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all cast members for a specific user
 */
export async function getUserCastMemberships(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      auditions (
        audition_id,
        show_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      roles (
        role_id,
        role_name,
        description
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user cast memberships:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new cast member (offer a role)
 */
export async function createCastMember(
  castMemberData: CastMemberInsert
): Promise<{ data: CastMember | null; error: any }> {
  const { data, error } = await supabase
    .from('cast_members')
    .insert(castMemberData)
    .select()
    .single();

  if (error) {
    console.error('Error creating cast member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple cast members at once
 */
export async function createCastMembers(
  castMembersData: CastMemberInsert[]
): Promise<{ data: CastMember[] | null; error: any }> {
  const { data, error } = await supabase
    .from('cast_members')
    .insert(castMembersData)
    .select();

  if (error) {
    console.error('Error creating cast members:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a cast member
 */
export async function updateCastMember(
  castMemberId: string,
  updates: CastMemberUpdate
): Promise<{ data: CastMember | null; error: any }> {
  const { data, error } = await supabase
    .from('cast_members')
    .update(updates)
    .eq('cast_member_id', castMemberId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cast member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update cast member status
 */
export async function updateCastMemberStatus(
  castMemberId: string,
  status: NonNullable<CastMember['status']>
): Promise<{ data: CastMember | null; error: any }> {
  return updateCastMember(castMemberId, { status });
}

/**
 * Delete a cast member
 */
export async function deleteCastMember(
  castMemberId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('cast_members')
    .delete()
    .eq('cast_member_id', castMemberId);

  if (error) {
    console.error('Error deleting cast member:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a user is already cast in a role
 */
export async function isUserCastInRole(
  userId: string,
  roleId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('cast_member_id')
    .eq('user_id', userId)
    .eq('role_id', roleId)
    .limit(1);

  if (error) {
    console.error('Error checking user cast status:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get cast members by status
 */
export async function getCastMembersByStatus(
  auditionId: string,
  status: NonNullable<CastMember['status']>
): Promise<any[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name,
        description
      )
    `)
    .eq('audition_id', auditionId)
    .eq('status', status);

  if (error) {
    console.error('Error fetching cast members by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Get accepted cast members for an audition
 */
export async function getAcceptedCastMembers(auditionId: string): Promise<any[]> {
  return getCastMembersByStatus(auditionId, 'Accepted');
}

/**
 * Get pending offers for an audition
 */
export async function getPendingOffers(auditionId: string): Promise<any[]> {
  return getCastMembersByStatus(auditionId, 'Offered');
}

/**
 * Get cast count for an audition
 */
export async function getCastMemberCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cast_members')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error counting cast members:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get accepted cast count for an audition
 */
export async function getAcceptedCastCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cast_members')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId)
    .eq('status', 'Accepted');

  if (error) {
    console.error('Error counting accepted cast members:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Check if a role is filled (has an accepted cast member)
 */
export async function isRoleFilled(roleId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('cast_member_id')
    .eq('role_id', roleId)
    .eq('status', 'Accepted')
    .limit(1);

  if (error) {
    console.error('Error checking if role is filled:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Bulk update cast member statuses
 */
export async function bulkUpdateCastMemberStatus(
  castMemberIds: string[],
  status: NonNullable<CastMember['status']>
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('cast_members')
    .update({ status })
    .in('cast_member_id', castMemberIds);

  if (error) {
    console.error('Error bulk updating cast member statuses:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get principal cast member for a role
 */
export async function getRolePrincipal(
  auditionId: string,
  roleId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .eq('audition_id', auditionId)
    .eq('role_id', roleId)
    .eq('is_understudy', false)
    .single();

  if (error) {
    console.error('Error fetching role principal:', error);
    return null;
  }

  return data;
}

/**
 * Get understudy cast member for a role
 */
export async function getRoleUnderstudy(
  auditionId: string,
  roleId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .eq('audition_id', auditionId)
    .eq('role_id', roleId)
    .eq('is_understudy', true)
    .single();

  if (error) {
    console.error('Error fetching role understudy:', error);
    return null;
  }

  return data;
}

/**
 * Get both principal and understudy for a role
 */
export async function getRoleCasting(
  auditionId: string,
  roleId: string
): Promise<{ principal: any | null; understudy: any | null }> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .eq('audition_id', auditionId)
    .eq('role_id', roleId);

  if (error) {
    console.error('Error fetching role casting:', error);
    return { principal: null, understudy: null };
  }

  const principal = data?.find(cm => !cm.is_understudy) || null;
  const understudy = data?.find(cm => cm.is_understudy) || null;

  return { principal, understudy };
}

/**
 * Check if a role's principal position is filled
 */
export async function isRolePrincipalFilled(
  auditionId: string,
  roleId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('cast_member_id')
    .eq('audition_id', auditionId)
    .eq('role_id', roleId)
    .eq('is_understudy', false)
    .eq('status', 'Accepted')
    .limit(1);

  if (error) {
    console.error('Error checking if role principal is filled:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Check if a role's understudy position is filled
 */
export async function isRoleUnderstudyFilled(
  auditionId: string,
  roleId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('cast_member_id')
    .eq('audition_id', auditionId)
    .eq('role_id', roleId)
    .eq('is_understudy', true)
    .eq('status', 'Accepted')
    .limit(1);

  if (error) {
    console.error('Error checking if role understudy is filled:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get all ensemble members for an audition (cast members with null role_id)
 */
export async function getEnsembleMembers(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url,
        email
      )
    `)
    .eq('audition_id', auditionId)
    .is('role_id', null);

  if (error) {
    console.error('Error fetching ensemble members:', error);
    return [];
  }

  return data || [];
}

/**
 * Get ensemble member count for an audition
 */
export async function getEnsembleMemberCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cast_members')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId)
    .is('role_id', null);

  if (error) {
    console.error('Error counting ensemble members:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Check if a user is already in the ensemble for an audition
 */
export async function isUserInEnsemble(
  userId: string,
  auditionId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_members')
    .select('cast_member_id')
    .eq('user_id', userId)
    .eq('audition_id', auditionId)
    .is('role_id', null)
    .limit(1);

  if (error) {
    console.error('Error checking user ensemble status:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get all roles a user is cast in for an audition (excluding ensemble)
 */
export async function getUserRolesInAudition(
  userId: string,
  auditionId: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      roles (
        role_id,
        role_name,
        description,
        role_type
      )
    `)
    .eq('user_id', userId)
    .eq('audition_id', auditionId)
    .not('role_id', 'is', null);

  if (error) {
    console.error('Error fetching user roles in audition:', error);
    return [];
  }

  return data || [];
}
