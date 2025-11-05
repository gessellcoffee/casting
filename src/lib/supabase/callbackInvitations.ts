import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { CallbackInvitation, CallbackInvitationInsert, CallbackInvitationUpdate, CallbackInvitationStatus } from './types';
import { createNotification } from './notifications';

/**
 * Get a callback invitation by ID
 */
export async function getCallbackInvitation(invitationId: string): Promise<CallbackInvitation | null> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select('*')
    .eq('invitation_id', invitationId)
    .single();

  if (error) {
    console.error('Error fetching callback invitation:', error);
    return null;
  }

  return data;
}

/**
 * Get callback invitation with full details (user, slot, signup info)
 */
export async function getCallbackInvitationWithDetails(invitationId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select(`
      *,
      callback_slots (
        callback_slot_id,
        start_time,
        end_time,
        location,
        notes
      ),
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url,
        username
      ),
      audition_signups (
        signup_id,
        role_id,
        roles (
          role_id,
          role_name,
          description
        )
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      )
    `)
    .eq('invitation_id', invitationId)
    .single();

  if (error) {
    console.error('Error fetching callback invitation with details:', error);
    return null;
  }

  return data;
}

/**
 * Get all invitations for a callback slot
 */
export async function getSlotInvitations(callbackSlotId: string): Promise<CallbackInvitation[]> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select('*')
    .eq('callback_slot_id', callbackSlotId)
    .order('invited_at', { ascending: true });

  if (error) {
    console.error('Error fetching slot invitations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all invitations for a user
 */
export async function getUserInvitations(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select(`
      *,
      callback_slots (
        callback_slot_id,
        start_time,
        end_time,
        location,
        notes
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      audition_signups (
        signup_id,
        role_id,
        roles (
          role_id,
          role_name
        )
      )
    `)
    .eq('user_id', userId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching user invitations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get all invitations for an audition
 */
export async function getAuditionInvitations(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select(`
      *,
      callback_slots (
        callback_slot_id,
        start_time,
        end_time,
        location,
        notes
      ),
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url,
        username
      ),
      audition_signups (
        signup_id,
        role_id,
        roles (
          role_id,
          role_name
        )
      )
    `)
    .eq('audition_id', auditionId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching audition invitations:', error);
    return [];
  }

  return data || [];
}

/**
 * Get invitations by status for an audition
 */
export async function getInvitationsByStatus(
  auditionId: string,
  status: CallbackInvitationStatus
): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select(`
      *,
      callback_slots (
        callback_slot_id,
        start_time,
        end_time,
        location
      ),
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      audition_signups (
        signup_id,
        role_id,
        roles (
          role_id,
          role_name
        )
      )
    `)
    .eq('audition_id', auditionId)
    .eq('status', status)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching invitations by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a callback invitation (without sending notification)
 * Use sendCallbackInvitations to create and send notifications
 */
export async function createCallbackInvitation(
  invitationData: CallbackInvitationInsert
): Promise<{ data: CallbackInvitation | null; error: any }> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .insert(invitationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating callback invitation:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create multiple callback invitations at once
 */
export async function createCallbackInvitations(
  invitationsData: CallbackInvitationInsert[]
): Promise<{ data: CallbackInvitation[] | null; error: any }> {
  if (invitationsData.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from('callback_invitations')
    .insert(invitationsData)
    .select();

  if (error) {
    console.error('Error creating callback invitations:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Send callback invitations (creates invitations and sends notifications)
 */
export async function sendCallbackInvitations(
  invitationsData: CallbackInvitationInsert[]
): Promise<{ data: CallbackInvitation[] | null; error: any }> {
  // Create the invitations
  const { data: invitations, error: createError } = await createCallbackInvitations(invitationsData);

  if (createError || !invitations) {
    return { data: null, error: createError };
  }

  // Get the audition creator for sender_id
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: invitations, error: null }; // Still return invitations even if notifications fail
  }

  // Get callback slot details for each invitation
  const slotIds = [...new Set(invitations.map(inv => inv.callback_slot_id))];
  const { data: slots, error: slotsError } = await supabase
    .from('callback_slots')
    .select('callback_slot_id, start_time, end_time, location')
    .in('callback_slot_id', slotIds);

  if (slotsError || !slots) {
    console.error('Error fetching callback slots for notifications:', slotsError);
    return { data: invitations, error: null }; // Still return invitations
  }

  // Get show details for notifications
  const auditionId = invitations[0].audition_id;
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select(`
      audition_id,
      shows (
        title
      )
    `)
    .eq('audition_id', auditionId)
    .single();

  if (auditionError || !audition) {
    console.error('Error fetching audition for notifications:', auditionError);
    return { data: invitations, error: null };
  }

  const showTitle = (audition as any).shows?.title || 'Unknown Show';

  // Create a map of slot details
  const slotMap = new Map(slots.map(slot => [slot.callback_slot_id, slot]));

  // Send notifications to each invited user
  const notificationPromises = invitations.map(async (invitation) => {
    const slot = slotMap.get(invitation.callback_slot_id);
    if (!slot) return;

    const startTime = new Date(slot.start_time);
    const formattedDate = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    await createNotification({
      recipient_id: invitation.user_id,
      sender_id: user.id,
      type: 'casting_decision',
      title: `Callback Invitation for ${showTitle}`,
      message: `You've been invited to a callback for ${showTitle} on ${formattedDate} at ${formattedTime}${slot.location ? ` at ${slot.location}` : ''}. Please respond to accept or decline.`,
      action_url: `/callbacks/${invitation.invitation_id}`,
      reference_id: invitation.invitation_id,
      reference_type: 'callback_invitation',
      is_actionable: true,
    });
  });

  await Promise.all(notificationPromises);

  return { data: invitations, error: null };
}

/**
 * Update a callback invitation
 */
export async function updateCallbackInvitation(
  invitationId: string,
  updates: CallbackInvitationUpdate
): Promise<{ data: CallbackInvitation | null; error: any }> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .update(updates)
    .eq('invitation_id', invitationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating callback invitation:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Actor responds to callback invitation (accept or reject)
 */
export async function respondToCallbackInvitation(
  invitationId: string,
  status: 'accepted' | 'rejected',
  actorComment?: string
): Promise<{ data: CallbackInvitation | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  // Get the invitation to verify ownership and get audition creator
  const invitation = await getCallbackInvitation(invitationId);
  
  if (!invitation) {
    return { data: null, error: new Error('Invitation not found') };
  }

  if (invitation.user_id !== user.id) {
    return { data: null, error: new Error('Unauthorized: You can only respond to your own invitations') };
  }

  // Update the invitation
  const { data, error } = await updateCallbackInvitation(invitationId, {
    status,
    actor_comment: actorComment || null,
    responded_at: new Date().toISOString(),
  });

  if (error) {
    return { data: null, error };
  }

  // Get audition creator and show details for notification
  const { data: audition, error: auditionError } = await supabase
    .from('auditions')
    .select(`
      audition_id,
      user_id,
      shows (
        title
      )
    `)
    .eq('audition_id', invitation.audition_id)
    .single();

  if (auditionError || !audition) {
    console.error('Error fetching audition for notification:', auditionError);
    return { data, error: null }; // Still return the updated invitation
  }

  // Get user's name
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const userName = profile ? `${profile.first_name} ${profile.last_name}` : 'An actor';
  const showTitle = (audition as any).shows?.title || 'your show';
  const statusText = status === 'accepted' ? 'accepted' : 'declined';

  // Notify the audition creator
  await createNotification({
    recipient_id: audition.user_id,
    sender_id: user.id,
    type: 'casting_decision',
    title: `Callback Response: ${userName}`,
    message: `${userName} has ${statusText} the callback invitation for ${showTitle}.${actorComment ? ` Comment: "${actorComment}"` : ''}`,
    action_url: `/auditions/${invitation.audition_id}/callbacks`,
    reference_id: invitationId,
    reference_type: 'callback_response',
    is_actionable: false,
  });

  return { data, error: null };
}

/**
 * Delete a callback invitation
 */
export async function deleteCallbackInvitation(
  invitationId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('callback_invitations')
    .delete()
    .eq('invitation_id', invitationId);

  if (error) {
    console.error('Error deleting callback invitation:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Bulk delete callback invitations
 */
export async function deleteCallbackInvitations(
  invitationIds: string[]
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('callback_invitations')
    .delete()
    .in('invitation_id', invitationIds);

  if (error) {
    console.error('Error deleting callback invitations:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Check if a user has been invited to a callback for an audition
 */
export async function hasUserBeenInvited(
  userId: string,
  auditionId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select('invitation_id')
    .eq('user_id', userId)
    .eq('audition_id', auditionId)
    .limit(1);

  if (error) {
    console.error('Error checking user invitation:', error);
    return false;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Get pending invitations count for a user
 */
export async function getPendingInvitationsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('callback_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) {
    console.error('Error counting pending invitations:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Get accepted invitations for an audition (for calendar display)
 */
export async function getAcceptedCallbacks(auditionId: string): Promise<any[]> {
  return getInvitationsByStatus(auditionId, 'accepted');
}

/**
 * Get user's accepted callback invitations (for calendar display)
 */
export async function getUserAcceptedCallbacks(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('callback_invitations')
    .select(`
      *,
      callback_slots (
        callback_slot_id,
        start_time,
        end_time,
        location,
        notes,
        audition_id,
        auditions (
          audition_id,
          show_id,
          shows (
            title,
            author
          )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .order('callback_slots(start_time)', { ascending: true });

  if (error) {
    console.error('Error fetching user accepted callbacks:', error);
    return [];
  }

  return data || [];
}
