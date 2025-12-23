import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { CallbackInvitation, CallbackInvitationInsert, CallbackInvitationUpdate, CallbackInvitationStatus } from './types';
import { createNotification } from './notifications';
import { getUserByEmail, isValidEmail } from './userLookup';
import { assignFormsOnCallbackInvitation } from './customForms';

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
        email
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
        email
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

  // Send notifications and assign forms to each invited user
  const notificationPromises = invitations.map(async (invitation) => {
    const slot = slotMap.get(invitation.callback_slot_id);
    if (!slot) return;

    // Automatically assign any required callback forms
    const { error: formAssignError } = await assignFormsOnCallbackInvitation(invitation.audition_id, invitation.user_id);
    if (formAssignError) {
      console.warn('Failed to assign callback forms for invitation:', formAssignError);
      // Don't block callback invitation for form assignment errors, just log them
    }

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
      action_url: `/notifications`,
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
): Promise<{ data: CallbackInvitation | null; error: any; requiresFormCompletion?: boolean; auditionId?: string }> {
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

  // If accepting, check for required callback forms
  if (status === 'accepted') {
    const { getIncompleteRequiredCallbackForms } = await import('./customForms');
    const { incompleteAssignmentIds, error: formsError } = await getIncompleteRequiredCallbackForms(invitation.audition_id);
    
    console.log('Callback form check:', {
      auditionId: invitation.audition_id,
      incompleteAssignmentIds,
      formsError,
      status
    });
    
    if (formsError) {
      console.error('Error checking callback forms:', formsError);
      // Don't block acceptance if there's an error checking forms
    } else if (incompleteAssignmentIds.length > 0) {
      console.log('Blocking callback acceptance due to incomplete forms:', incompleteAssignmentIds);
      return { 
        data: null, 
        error: new Error('Please complete all required forms before accepting this callback'), 
        requiresFormCompletion: true,
        auditionId: invitation.audition_id
      };
    }
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

  const email = profile ? `${profile.first_name} ${profile.last_name}` : 'An actor';
  const showTitle = (audition as any).shows?.title || 'your show';
  const statusText = status === 'accepted' ? 'accepted' : 'declined';

  // Notify the audition creator
  await createNotification({
    recipient_id: audition.user_id,
    sender_id: user.id,
    type: 'casting_decision',
    title: `Callback Response: ${email}`,
    message: `${email} has ${statusText} the callback invitation for ${showTitle}.${actorComment ? ` Comment: "${actorComment}"` : ''}`,
    action_url: `/notifications`,
    reference_id: invitationId,
    reference_type: 'callback_response',
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user accepted callbacks:', error);
    return [];
  }

  return data || [];
}

/**
 * Send a callback invitation by email address
 * If the email exists in the system, creates a normal callback invitation
 * If the email doesn't exist, sends an invitation email to join the platform
 */
export async function sendCallbackInvitationByEmail(
  invitationData: {
    auditionId: string;
    email: string;
    callbackSlotId: string;
    invitedBy: string;
    message?: string;
  }
): Promise<{ 
  data: CallbackInvitation | null; 
  error: any; 
  userExists: boolean;
  invitationSent?: boolean;
}> {
  try {
    // Validate email format
    if (!isValidEmail(invitationData.email)) {
      return { 
        data: null, 
        error: new Error('Invalid email format'), 
        userExists: false 
      };
    }

    // Look up user by email
    const user = await getUserByEmail(invitationData.email);

    if (user) {
      // User exists - create normal callback invitation
      // Note: For email-based invitations, we need to find or create a signup_id
      // First, try to find an existing signup for this user and audition
      const { data: existingSignup } = await supabase
        .from('audition_signups')
        .select('signup_id')
        .eq('user_id', user.id)
        .eq('audition_slots.audition_id', invitationData.auditionId)
        .limit(1)
        .single();

      if (!existingSignup) {
        // If no signup exists, we can't create a callback invitation
        // The user needs to have signed up for an audition slot first
        return {
          data: null,
          error: new Error('User must sign up for an audition slot before receiving a callback invitation'),
          userExists: true,
        };
      }

      const newInvitation: CallbackInvitationInsert = {
        audition_id: invitationData.auditionId,
        user_id: user.id,
        callback_slot_id: invitationData.callbackSlotId,
        signup_id: existingSignup.signup_id,
        status: 'pending',
      };

      const { data, error } = await createCallbackInvitation(newInvitation);
      
      if (error) {
        return { data: null, error, userExists: true };
      }

      // Send notification to existing user
      const { data: audition } = await supabase
        .from('auditions')
        .select(`
          audition_id,
          shows (
            title
          )
        `)
        .eq('audition_id', invitationData.auditionId)
        .single();

      const { data: slot } = await supabase
        .from('callback_slots')
        .select('start_time, end_time, location')
        .eq('callback_slot_id', invitationData.callbackSlotId)
        .single();

      const { data: senderData } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', invitationData.invitedBy)
        .single();

      const showTitle = (audition as any)?.shows?.title || 'Unknown Show';
      const senderName = senderData
        ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim()
        : 'The casting director';

      if (slot) {
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
          recipient_id: user.id,
          sender_id: invitationData.invitedBy,
          type: 'casting_decision',
          title: `Callback Invitation for ${showTitle}`,
          message: `${senderName} has invited you to a callback for ${showTitle} on ${formattedDate} at ${formattedTime}${slot.location ? ` at ${slot.location}` : ''}. Please respond to accept or decline.`,
          action_url: `/callbacks/${data?.invitation_id}`,
          reference_id: data?.invitation_id,
          reference_type: 'callback_invitation',
          is_actionable: true,
        });
      }

      return { 
        data, 
        error: null, 
        userExists: true 
      };
    } else {
      // User doesn't exist - send invitation email
      
      // Get audition and show details
      const { data: auditionData } = await supabase
        .from('auditions')
        .select(`
          audition_id,
          shows (
            title
          )
        `)
        .eq('audition_id', invitationData.auditionId)
        .single();

      // Get callback slot details
      const { data: slotData } = await supabase
        .from('callback_slots')
        .select('start_time, end_time, location')
        .eq('callback_slot_id', invitationData.callbackSlotId)
        .single();

      // Get sender name
      const { data: senderData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', invitationData.invitedBy)
        .single();

      const senderName = senderData
        ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.email
        : 'The casting director';

      const showTitle = (auditionData as any)?.shows?.title || 'a production';

      let callbackDate: string | undefined;
      let callbackTime: string | undefined;
      let callbackLocation: string | undefined;

      if (slotData) {
        const startTime = new Date(slotData.start_time);
        callbackDate = startTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        callbackTime = startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        callbackLocation = slotData.location || undefined;
      }

      // Send invitation email via API route
      const response = await fetch('/api/send-invitation-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: invitationData.email,
          showTitle,
          senderName,
          message: invitationData.message,
          invitationType: 'callback',
          callbackDate,
          callbackTime,
          callbackLocation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          data: null,
          error: new Error(`Failed to send invitation email: ${errorData.error || 'Unknown error'}`),
          userExists: false,
          invitationSent: false,
        };
      }

      return {
        data: null,
        error: null,
        userExists: false,
        invitationSent: true,
      };
    }
  } catch (error) {
    console.error('Error in sendCallbackInvitationByEmail:', error);
    return { 
      data: null, 
      error, 
      userExists: false 
    };
  }
}
