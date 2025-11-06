import { supabase } from './client';

/**
 * Get all shows a user has been cast in (accepted casting offers)
 * Returns data formatted like resume entries for display
 */
export async function getUserCastingHistory(userId: string) {
  // First, get cast members with their audition_role_id
  const { data: castMembers, error: castError } = await supabase
    .from('cast_members')
    .select('cast_member_id, is_understudy, audition_role_id')
    .eq('user_id', userId)
    .eq('status', 'Accepted');

  if (castError) {
    console.error('Error fetching cast members:', castError);
    return [];
  }

  if (!castMembers || castMembers.length === 0) {
    console.log('No accepted cast members found');
    return [];
  }

  console.log('Found cast members:', castMembers);
  console.log('Cast member details:', castMembers.map(cm => ({
    id: cm.cast_member_id,
    audition_role_id: cm.audition_role_id,
    is_understudy: cm.is_understudy
  })));

  // Get the audition_role_ids
  const auditionRoleIds = castMembers
    .map(cm => cm.audition_role_id)
    .filter((id): id is string => id !== null && id !== undefined);

  console.log('Filtered audition_role_ids:', auditionRoleIds);

  if (auditionRoleIds.length === 0) {
    console.log('No audition_role_ids found');
    return [];
  }

  // Fetch audition roles with their related data
  const { data: auditionRoles, error: rolesError } = await supabase
    .from('audition_roles')
    .select(`
      audition_role_id,
      role_name,
      audition_id,
      auditions (
        audition_id,
        performance_dates,
        shows (
          title,
          author
        ),
        companies (
          company_id,
          name
        )
      )
    `)
    .in('audition_role_id', auditionRoleIds);

  if (rolesError) {
    console.error('Error fetching audition roles:', rolesError);
    return [];
  }

  console.log('Found audition roles:', auditionRoles);

  // Map the data together
  const castingHistory = castMembers.map((cast) => {
    const auditionRole = auditionRoles?.find(
      ar => ar.audition_role_id === cast.audition_role_id
    );
    const audition = auditionRole?.auditions;
    const show = audition?.shows;
    const company = audition?.companies;
    
    console.log('Processing cast member:', {
      cast_member_id: cast.cast_member_id,
      auditionRole,
      audition,
      show,
      company
    });
    
    return {
      id: cast.cast_member_id,
      show_name: show?.title || 'Unknown Show',
      role: auditionRole?.role_name || 'Role not specified',
      company_name: company?.name || null,
      company_id: company?.company_id || null,
      date_of_production: audition?.performance_dates || null,
      is_understudy: cast.is_understudy,
      source: 'casting' as const,
      verified: true,
    };
  });

  console.log('Transformed casting history:', castingHistory);

  return castingHistory;
}
