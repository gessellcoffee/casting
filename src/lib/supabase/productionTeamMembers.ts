import { supabase } from './client';
import type { 
  ProductionTeamMember, 
  ProductionTeamMemberInsert, 
  ProductionTeamMemberUpdate,
  ProductionTeamMemberWithProfile 
} from './types';
import { 
  generateAuditionCalendarEvents, 
  generateICSFile, 
  type AuditionCalendarData 
} from '@/lib/utils/calendarUtils';

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
      profiles!user_id (
        id,
        email,
        first_name,
        last_name,
        email,
        profile_photo_url
      )
    `)
    .eq('audition_id', auditionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching production team members:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
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
      profiles!user_id (
        id,
        email,
        first_name,
        last_name,
        email,
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
 * Search for users by email or name (for adding to production team)
 */
export async function searchUsersForProductionTeam(
  query: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, profile_photo_url')
    .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
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
      profiles!user_id (
        id,
        email,
        first_name,
        last_name,
        email,
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

/**
 * Generate calendar data for an audition (for production team members)
 * Returns ICS file content that can be downloaded or sent via email
 */
export async function generateProductionCalendar(
  auditionId: string
): Promise<{ data: string | null; error: any }> {
  try {
    // Fetch audition with all related data
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select(`
        *,
        shows (
          title
        )
      `)
      .eq('audition_id', auditionId)
      .single();

    if (auditionError || !audition) {
      console.error('Error fetching audition for calendar:', auditionError);
      return { data: null, error: auditionError || new Error('Audition not found') };
    }

    // Fetch audition slots
    const { data: slots, error: slotsError } = await supabase
      .from('audition_slots')
      .select('*')
      .eq('audition_id', auditionId)
      .order('start_time', { ascending: true });

    if (slotsError) {
      console.error('Error fetching slots for calendar:', slotsError);
    }

    // Fetch callback slots
    const { data: callbackSlots, error: callbackError } = await supabase
      .from('callback_slots')
      .select('*')
      .eq('audition_id', auditionId)
      .order('start_time', { ascending: true });

    if (callbackError) {
      console.error('Error fetching callback slots for calendar:', callbackError);
    }

    // Parse rehearsal and performance dates from comma-separated strings
    const rehearsalDates = audition.rehearsal_dates 
      ? audition.rehearsal_dates.split(',').map((d: string) => d.trim()).filter(Boolean)
      : [];
    
    const performanceDates = audition.performance_dates 
      ? audition.performance_dates.split(',').map((d: string) => d.trim()).filter(Boolean)
      : [];

    // Prepare calendar data (convert null to undefined for optional fields)
    const calendarData: AuditionCalendarData = {
      showTitle: audition.shows?.title || 'Untitled Show',
      auditionDates: audition.audition_dates || [],
      auditionLocation: audition.audition_location || undefined,
      rehearsalDates,
      rehearsalLocation: audition.rehearsal_location || undefined,
      performanceDates,
      performanceLocation: audition.performance_location || undefined,
      slots: slots?.map(s => ({ ...s, location: s.location || undefined })) || [],
      callbackSlots: callbackSlots?.map(s => ({ ...s, location: s.location || undefined })) || [],
    };

    // Generate calendar events
    const events = generateAuditionCalendarEvents(calendarData);

    // Generate ICS file
    const icsContent = generateICSFile(
      events,
      `${audition.shows?.title || 'Production'} - Full Schedule`
    );

    return { data: icsContent, error: null };
  } catch (err: any) {
    console.error('Error generating production calendar:', err);
    return { data: null, error: err };
  }
}

/**
 * Send calendar to production team members
 * TODO: Integrate with email service to send ICS files to team members
 * For now, this prepares the calendar data that can be sent
 */
export async function sendCalendarToProductionTeam(
  auditionId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Generate the calendar
    const { data: icsContent, error: calendarError } = await generateProductionCalendar(auditionId);

    if (calendarError || !icsContent) {
      return { success: false, error: calendarError || new Error('Failed to generate calendar') };
    }

    // Get production team members
    const members = await getProductionTeamMembers(auditionId);

    // TODO: Send email with ICS attachment to each team member
    // For now, we'll just log that the calendar was generated
    console.log(`Calendar generated for ${members.length} production team members`);
    console.log('ICS content ready to send (email integration pending)');

    // In a future implementation, you would:
    // 1. Set up an email service (e.g., SendGrid, Resend, or Supabase Edge Function with SMTP)
    // 2. Send emails to each team member with the ICS file as an attachment
    // 3. Include a personalized message with their role title
    
    // Example (pseudo-code):
    // for (const member of members) {
    //   await sendEmail({
    //     to: member.profiles?.email || member.invited_email,
    //     subject: `Production Calendar - ${showTitle}`,
    //     body: `You've been added as ${member.role_title}...`,
    //     attachments: [{ filename: 'production-calendar.ics', content: icsContent }]
    //   });
    // }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error sending calendar to production team:', err);
    return { success: false, error: err };
  }
}
