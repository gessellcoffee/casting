import { supabase } from './client';

/**
 * Fetch all auditions with related show, company, and slot data
 */
export async function getAuditionsWithDetails() {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      shows!auditions_show_id_fkey(*),
      companies!auditions_company_id_fkey(*),
      audition_slots(
        *,
        current_signups:audition_signups(count)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching auditions:', error);
    return { data: null, error };
  }

  // Transform data to match expected structure
  const transformedData = data?.map(audition => ({
    ...audition,
    show: audition.shows,
    company: audition.companies,
    slots: audition.audition_slots?.map((slot: any) => ({
      ...slot,
      current_signups: slot.current_signups?.[0]?.count || 0,
    })),
  }));

  return { data: transformedData, error: null };
}

/**
 * Fetch a single audition with all details including roles
 * Note: Roles are fetched separately because there's no direct FK between auditions and roles
 */
export async function getAuditionById(auditionId: string) {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      shows!auditions_show_id_fkey(*),
      companies!auditions_company_id_fkey(*),
      audition_slots(
        *,
        current_signups:audition_signups(count)
      )
    `)
    .eq('audition_id', auditionId)
    .single();

  if (error) {
    console.error('Error fetching audition:', error);
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: { message: 'Audition not found' } };
  }

  // Fetch roles separately using the show_id (no direct FK between auditions and roles)
  let roles: any[] = [];
  if (data.show_id) {
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .eq('show_id', data.show_id);
    
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }
    
    roles = rolesData || [];
  }

  // Transform data to match expected structure
  const transformedData = {
    ...data,
    show: data.shows,
    company: data.companies,
    slots: data.audition_slots?.map((slot: any) => ({
      ...slot,
      current_signups: slot.current_signups?.[0]?.count || 0,
    })),
    roles: roles,
  };

  return { data: transformedData, error: null };
}

/**
 * Search auditions by show title or company name
 */
export async function searchAuditions(query: string) {
  const { data, error } = await supabase
    .from('auditions')
    .select(`
      *,
      show:shows(*),
      company:companies(*),
      user:users(*),
      slots:audition_slots(*)
    `)
    .or(`show.title.ilike.%${query}%,company.name.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching auditions:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
