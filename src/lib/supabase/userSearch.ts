import { supabase } from './client';
import type { Profile } from './types';

export interface UserSearchFilters {
  query?: string;
  skills?: string[];
  location?: string;
  limit?: number;
  offset?: number;
}

export interface UserSearchResult {
  users: Profile[];
  total: number;
}

/**
 * Search for users with optional filters
 */
export async function searchUsers(
  filters: UserSearchFilters = {}
): Promise<UserSearchResult> {
  const {
    query = '',
    skills = [],
    location = '',
    limit = 20,
    offset = 0,
  } = filters;

  try {
    // Start building the query
    let queryBuilder = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Text search across name and username
    if (query) {
      queryBuilder = queryBuilder.or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%,description.ilike.%${query}%`
      );
    }

    // Filter by skills (if user has any of the selected skills)
    if (skills.length > 0) {
      // Build OR conditions for each skill using contains operator
      // This checks if the user's skills array contains any of the selected skills
      const skillFilters = skills.map(skill => `skills.cs.["${skill}"]`).join(',');
      queryBuilder = queryBuilder.or(skillFilters);
    }

    // Filter by location (AND condition)
    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`);
    }

    // Apply pagination
    queryBuilder = queryBuilder
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await queryBuilder;

    if (error) {
      console.error('Error searching users:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return { users: [], total: 0 };
    }

    return {
      users: data || [],
      total: count || 0,
    };
  } catch (err) {
    console.error('Error in searchUsers:', err);
    return { users: [], total: 0 };
  }
}

/**
 * Get all unique skills from all users
 */
export async function getAllSkills(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('skills')
      .not('skills', 'is', null);

    if (error) {
      console.error('Error fetching skills:', error);
      return [];
    }

    // Flatten and deduplicate skills
    const allSkills = new Set<string>();
    data?.forEach((profile) => {
      if (profile.skills && Array.isArray(profile.skills)) {
        profile.skills.forEach((skill) => allSkills.add(skill));
      }
    });

    return Array.from(allSkills).sort();
  } catch (err) {
    console.error('Error in getAllSkills:', err);
    return [];
  }
}

/**
 * Get all unique locations from all users
 */
export async function getAllLocations(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('location')
      .not('location', 'is', null);

    if (error) {
      console.error('Error fetching locations:', error);
      return [];
    }

    // Deduplicate locations
    const allLocations = new Set<string>();
    data?.forEach((profile) => {
      if (profile.location) {
        allLocations.add(profile.location);
      }
    });

    return Array.from(allLocations).sort();
  } catch (err) {
    console.error('Error in getAllLocations:', err);
    return [];
  }
}
