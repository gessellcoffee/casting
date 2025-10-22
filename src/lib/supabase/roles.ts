import { supabase } from './client';
import type { Role, RoleInsert, RoleUpdate } from './types';

/**
 * Get a role by ID
 */
export async function getRole(roleId: string): Promise<Role | null> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('role_id', roleId)
    .single();

  if (error) {
    console.error('Error fetching role:', error);
    return null;
  }

  return data;
}

/**
 * Get all roles for a specific show
 */
export async function getShowRoles(showId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('show_id', showId)
    .order('role_name', { ascending: true });

  if (error) {
    console.error('Error fetching show roles:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new role
 */
export async function createRole(
  roleData: RoleInsert
): Promise<{ data: Role | null; error: any }> {
  const { data, error } = await supabase
    .from('roles')
    .insert(roleData)
    .select()
    .single();

  if (error) {
    console.error('Error creating role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple roles at once
 */
export async function createRoles(
  rolesData: RoleInsert[]
): Promise<{ data: Role[] | null; error: any }> {
  const { data, error } = await supabase
    .from('roles')
    .insert(rolesData)
    .select();

  if (error) {
    console.error('Error creating roles:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update a role
 */
export async function updateRole(
  roleId: string,
  updates: RoleUpdate
): Promise<{ data: Role | null; error: any }> {
  const { data, error } = await supabase
    .from('roles')
    .update(updates)
    .eq('role_id', roleId)
    .select()
    .single();

  if (error) {
    console.error('Error updating role:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a role
 */
export async function deleteRole(
  roleId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('role_id', roleId);

  if (error) {
    console.error('Error deleting role:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Delete all roles for a show
 */
export async function deleteShowRoles(
  showId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('show_id', showId);

  if (error) {
    console.error('Error deleting show roles:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a show has any roles
 */
export async function showHasRoles(showId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('roles')
    .select('role_id')
    .eq('show_id', showId)
    .limit(1);

  if (error) {
    console.error('Error checking show roles:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get role count for a show
 */
export async function getShowRoleCount(showId: string): Promise<number> {
  const { count, error } = await supabase
    .from('roles')
    .select('*', { count: 'exact', head: true })
    .eq('show_id', showId);

  if (error) {
    console.error('Error counting show roles:', error);
    return 0;
  }

  return count ?? 0;
}
