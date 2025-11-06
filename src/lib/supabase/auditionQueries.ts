import { supabase } from './client';
import type { AuditionSlot, Role } from './types';

// Type for audition slot with signup count from the query
type AuditionSlotWithSignups = AuditionSlot & {
  current_signups: Array<{ count: number }>;
};

/**
 * Fetch all auditions with related show, company, and slot data
 */
export async function getAuditionsWithDetails() {
  // First, get auditions with basic data
  const { data: auditionsData, error: auditionsError } = await supabase
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

  if (auditionsError) {
    console.error('Error fetching auditions:', auditionsError);
    return { data: null, error: auditionsError };
  }

  // Then fetch production team members separately for each audition
  const auditionIds = auditionsData?.map(a => a.audition_id) || [];
  
  let productionTeamData: any[] = [];
  if (auditionIds.length > 0) {
    const { data: teamData, error: teamError } = await supabase
      .from('production_team_members')
      .select(`
        production_team_member_id,
        audition_id,
        user_id,
        role_title,
        status,
        profiles!production_team_members_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          profile_photo_url
        )
      `)
      .in('audition_id', auditionIds);

    if (teamError) {
      console.error('Error fetching production team:', teamError);
    } else if (teamData) {
      productionTeamData = teamData;
    }
  }

  // Transform data to match expected structure
  const transformedData = auditionsData?.map((audition: any) => {
    // Find production team members for this audition
    const teamMembers = productionTeamData.filter(
      (member: any) => member.audition_id === audition.audition_id
    );

    return {
      ...audition,
      show: audition.shows,
      company: audition.companies,
      slots: audition.audition_slots?.map((slot: AuditionSlotWithSignups) => ({
        ...slot,
        current_signups: slot.current_signups?.[0]?.count || 0,
      })),
      productionTeam: teamMembers,
    };
  });

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

  // Fetch audition roles (which include audition_role_id) instead of base roles
  let roles: any[] = [];
  const { data: auditionRolesData, error: rolesError } = await supabase
    .from('audition_roles')
    .select(`
      *,
      roles (
        role_name,
        description,
        role_type,
        gender,
        needs_understudy,
        show_id
      )
    `)
    .eq('audition_id', auditionId);
  
  if (rolesError) {
    console.error('Error fetching audition roles:', rolesError);
  } else {
    // Flatten the structure for easier access
    roles = (auditionRolesData || []).map(ar => ({
      role_id: ar.role_id,
      audition_role_id: ar.audition_role_id,
      role_name: ar.roles?.role_name || 'Unknown Role',
      description: ar.roles?.description,
      role_type: ar.roles?.role_type,
      gender: ar.roles?.gender,
      needs_understudy: ar.needs_understudy,
      show_id: ar.roles?.show_id,
    }));
  }

  // Transform data to match expected structure
  const transformedData = {
    ...data,
    show: data.shows,
    company: data.companies,
    slots: data.audition_slots?.map((slot: any) => ({
      ...slot,
      current_signups: slot.current_signups?.[0]?.count || 0,
      signups: slot.signups?.map((signup: any) => ({
        id: signup.id,
        user_id: signup.user_id,
        user: signup.users
      })) || []
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
