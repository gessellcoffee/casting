import { supabase } from './client';
import type { AuditionRole, AuditionRoleInsert, AuditionRoleUpdate } from './types';

/**
 * Get an audition role by ID
 */
export async function getAuditionRole(auditionRoleId: string): Promise<AuditionRole | null> {
  const { data, error } = await supabase
    .from('audition_roles')
    .select('*')
    .eq('audition_role_id', auditionRoleId)
    .single();

  if (error) {
    console.error('Error fetching audition role:', error);
    return null;
  }

  return data;
}

/**
 * Get all roles for a specific audition
 */
export async function getAuditionRoles(auditionId: string): Promise<AuditionRole[]> {
  const { data, error } = await supabase
    .from('audition_roles')
    .select('*')
    .eq('audition_id', auditionId)
    .order('role_name', { ascending: true });

  if (error) {
    console.error('Error fetching audition roles:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new audition role
 */
export async function createAuditionRole(
  roleData: AuditionRoleInsert
): Promise<{ data: AuditionRole | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_roles')
    .insert(roleData)
    .select()
    .single();

  if (error) {
    console.error('Error creating audition role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple audition roles at once
 */
export async function createAuditionRoles(
  rolesData: AuditionRoleInsert[]
): Promise<{ data: AuditionRole[] | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_roles')
    .insert(rolesData)
    .select();

  if (error) {
    console.error('Error creating audition roles:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an audition role
 */
export async function updateAuditionRole(
  auditionRoleId: string,
  updates: AuditionRoleUpdate
): Promise<{ data: AuditionRole | null; error: any }> {
  const { data, error } = await supabase
    .from('audition_roles')
    .update(updates)
    .eq('audition_role_id', auditionRoleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating audition role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete an audition role
 */
export async function deleteAuditionRole(
  auditionRoleId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('audition_roles')
    .delete()
    .eq('audition_role_id', auditionRoleId);

  if (error) {
    console.error('Error deleting audition role:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Delete all roles for an audition
 */
export async function deleteAuditionRoles(
  auditionId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('audition_roles')
    .delete()
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error deleting audition roles:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if an audition has any roles
 */
export async function auditionHasRoles(auditionId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('audition_roles')
    .select('audition_role_id')
    .eq('audition_id', auditionId)
    .limit(1);

  if (error) {
    console.error('Error checking audition roles:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get role count for an audition
 */
export async function getAuditionRoleCount(auditionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('audition_roles')
    .select('*', { count: 'exact', head: true })
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error counting audition roles:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Copy roles from a show to an audition
 * This is useful when creating an audition from a show template
 */
export async function copyShowRolesToAudition(
  showId: string,
  auditionId: string
): Promise<{ data: AuditionRole[] | null; error: any }> {
  // First, get the show's roles
  const { data: showRoles, error: fetchError } = await supabase
    .from('roles')
    .select('*')
    .eq('show_id', showId);

  if (fetchError) {
    console.error('Error fetching show roles:', fetchError);
    return { data: null, error: fetchError };
  }

  if (!showRoles || showRoles.length === 0) {
    return { data: [], error: null };
  }

  // Convert show roles to audition roles
  const auditionRolesData: AuditionRoleInsert[] = showRoles.map(role => ({
    audition_id: auditionId,
    role_id: role.role_id, // Keep reference to original role
    role_name: role.role_name,
    description: role.description,
    role_type: role.role_type,
    gender: role.gender,
    needs_understudy: role.needs_understudy,
  }));

  // Create the audition roles
  return createAuditionRoles(auditionRolesData);
}
