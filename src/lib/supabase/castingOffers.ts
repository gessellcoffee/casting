import { supabase } from './client';
import type { CastingOffer, CastingOfferInsert, CastingOfferUpdate, CastingOfferWithDetails } from './types';
import { createNotification } from './notifications';
import { createCastMember, updateCastMemberStatus } from './castMembers';
import { getUserByEmail, isValidEmail } from './userLookup';
import { createPendingSignup } from './pendingSignups';
import type { CastingOfferRequestData } from '@/types/pendingSignup';

/**
 * Create a single casting offer
 */
export async function createCastingOffer(
  offerData: {
    auditionId: string;
    userId: string;
    roleId: string | null;
    auditionRoleId?: string | null;
    isUnderstudy: boolean;
    sentBy: string;
    offerMessage?: string;
    offerNotes?: string;
  }
): Promise<{ data: CastingOffer | null; error: any }> {
  try {
    // Find the existing cast member - it MUST exist before sending an offer
    const { data: existingCastMembers, error: fetchError } = await supabase
      .from('cast_members')
      .select('*')
      .eq('audition_id', offerData.auditionId)
      .eq('user_id', offerData.userId)
      .eq('is_understudy', offerData.isUnderstudy);

    if (fetchError) {
      console.error('Error fetching cast members:', fetchError);
      return { data: null, error: fetchError };
    }
    
    // Find matching cast member by audition_role_id (preferred) or role_id
    const castMember = existingCastMembers?.find((cm) => {
      if (offerData.auditionRoleId) {
        return cm.audition_role_id === offerData.auditionRoleId;
      } else if (offerData.roleId) {
        return cm.role_id === offerData.roleId;
      } else {
        // For ensemble (no role)
        return !cm.role_id && !cm.audition_role_id;
      }
    });

    if (!castMember) {
      return { 
        data: null, 
        error: new Error('Cast member must be saved before sending an offer. Please save the cast first.') 
      };
    }

    // Update cast member status to 'Offered'
    const { error: updateError } = await supabase
      .from('cast_members')
      .update({ status: 'Offered' })
      .eq('cast_member_id', castMember.cast_member_id);
    
    if (updateError) {
      console.error('Error updating cast member:', updateError);
      return { data: null, error: updateError };
    }

    // Create the casting offer record
    const castingOfferData: CastingOfferInsert = {
      cast_member_id: castMember.cast_member_id,
      audition_id: offerData.auditionId,
      user_id: offerData.userId,
      role_id: offerData.roleId,
      sent_by: offerData.sentBy,
      offer_message: offerData.offerMessage || null,
      offer_notes: offerData.offerNotes || null,
    };

    const { data: offer, error: offerError } = await supabase
      .from('casting_offers')
      .insert(castingOfferData)
      .select()
      .single();

    if (offerError) {
      console.error('Error creating casting offer:', offerError);
      return { data: null, error: offerError };
    }

    // Get show and role information for the notification
    const { data: auditionData } = await supabase
      .from('auditions')
      .select(`
        audition_id,
        shows (
          title
        )
      `)
      .eq('audition_id', offerData.auditionId)
      .single();

    let roleInfo = '';
    if (offerData.auditionRoleId) {
      // Get role name from audition_roles (primary source)
      const { data: roleData } = await supabase
        .from('audition_roles')
        .select('role_name')
        .eq('audition_role_id', offerData.auditionRoleId)
        .single();

      if (roleData) {
        roleInfo = offerData.isUnderstudy
          ? ` the understudy role for ${roleData.role_name}`
          : ` the role of ${roleData.role_name}`;
      }
    } else if (offerData.roleId) {
      // Fallback to base roles table
      const { data: roleData } = await supabase
        .from('roles')
        .select('role_name')
        .eq('role_id', offerData.roleId)
        .single();

      if (roleData) {
        roleInfo = offerData.isUnderstudy
          ? ` the understudy role for ${roleData.role_name}`
          : ` the role of ${roleData.role_name}`;
      }
    } else {
      roleInfo = ' an ensemble role';
    }

    // Get sender name
    const { data: senderData } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', offerData.sentBy)
      .single();

    const senderName = senderData
      ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.email
      : 'The casting director';

    const showTitle = auditionData?.shows?.title || 'a production';

    // Create notification
    const notificationData = {
      user_id: offerData.userId,
      recipient_id: offerData.userId,
      sender_id: offerData.sentBy,
      type: 'casting_offer' as const,
      title: 'Casting Offer Received',
      message: `${senderName} has offered you${roleInfo} in "${showTitle}"`,
      action_url: `/auditions/${offerData.auditionId}`,
      reference_id: offer.offer_id,
      reference_type: 'casting_offer',
      is_actionable: true,
      is_read: false,
    };

    const { data: notificationResult, error: notificationError } = await createNotification(notificationData);

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
      console.error('Notification error details:', JSON.stringify(notificationError, null, 2));
      // Don't fail the whole operation if notification fails
    }

    // TODO: Send email notification
    // For now, we'll just mark email as not sent
    // In the future, integrate with an email service (SendGrid, Resend, etc.)

    return { data: offer, error: null };
  } catch (error) {
    console.error('Error in createCastingOffer:', error);
    return { data: null, error };
  }
}

/**
 * Create multiple casting offers at once
 */
export async function createBulkCastingOffers(
  offers: Array<{
    auditionId: string;
    userId: string;
    roleId: string | null;
    auditionRoleId?: string | null;
    isUnderstudy: boolean;
    sentBy: string;
    offerMessage?: string;
    offerNotes?: string;
  }>
): Promise<{ data: CastingOffer[] | null; error: any; successCount: number; failedCount: number }> {
  const results: CastingOffer[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (const offer of offers) {
    const { data, error } = await createCastingOffer(offer);
    if (error) {
      console.error('Failed to create offer for user:', offer.userId, error);
      failedCount++;
    } else if (data) {
      results.push(data);
      successCount++;
    }
  }

  return {
    data: results.length > 0 ? results : null,
    error: failedCount > 0 ? new Error(`${failedCount} offers failed to send`) : null,
    successCount,
    failedCount,
  };
}

/**
 * Get a casting offer by ID
 */
export async function getCastingOffer(offerId: string): Promise<CastingOfferWithDetails | null> {
  const { data, error } = await supabase
    .from('casting_offers')
    .select(`
      *,
      recipient:profiles!casting_offers_user_id_fkey (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name,
        description
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      cast_members (
        cast_member_id,
        status,
        is_understudy
      )
    `)
    .eq('offer_id', offerId)
    .single();

  if (error) {
    console.error('Error fetching casting offer:', error);
    return null;
  }

  // Map recipient to profiles for type compatibility
  const result = data as any;
  if (result) {
    result.profiles = result.recipient;
    delete result.recipient;
  }

  return result as CastingOfferWithDetails;
}

/**
 * Get all casting offers for an audition
 */
export async function getAuditionOffers(auditionId: string): Promise<CastingOfferWithDetails[]> {
  const { data, error } = await supabase
    .from('casting_offers')
    .select(`
      *,
      recipient:profiles!casting_offers_user_id_fkey (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name,
        description
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      cast_members (
        cast_member_id,
        status,
        is_understudy
      )
    `)
    .eq('audition_id', auditionId)
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching audition offers:', error);
    return [];
  }

  // Map recipient to profiles for type compatibility
  const results = (data || []).map((item: any) => {
    if (item.recipient) {
      item.profiles = item.recipient;
      delete item.recipient;
    }
    return item;
  });

  return results as CastingOfferWithDetails[];
}

/**
 * Get all casting offers for a user
 */
export async function getUserOffers(userId: string): Promise<CastingOfferWithDetails[]> {
  const { data, error } = await supabase
    .from('casting_offers')
    .select(`
      *,
      sender:profiles!casting_offers_sent_by_fkey (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name,
        description
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      cast_members (
        cast_member_id,
        status,
        is_understudy
      )
    `)
    .eq('user_id', userId)
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching user offers:', error);
    return [];
  }

  // Map sender to profiles for type compatibility (for user offers, we show sender info)
  const results = (data || []).map((item: any) => {
    if (item.sender) {
      item.profiles = { ...item.sender, email: null };
      delete item.sender;
    }
    return item;
  });

  return results as CastingOfferWithDetails[];
}

/**
 * Get pending offers for a user
 */
export async function getUserPendingOffers(userId: string): Promise<CastingOfferWithDetails[]> {
  const { data, error } = await supabase
    .from('casting_offers')
    .select(`
      *,
      sender:profiles!casting_offers_sent_by_fkey (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      ),
      roles (
        role_id,
        role_name,
        description
      ),
      auditions (
        audition_id,
        shows (
          show_id,
          title,
          author
        )
      ),
      cast_members!inner (
        cast_member_id,
        status,
        is_understudy
      )
    `)
    .eq('user_id', userId)
    .eq('cast_members.status', 'Offered')
    .is('responded_at', null)
    .order('sent_at', { ascending: false });

  if (error) {
    console.error('Error fetching user pending offers:', error);
    return [];
  }

  // Map sender to profiles for type compatibility
  const results = (data || []).map((item: any) => {
    if (item.sender) {
      item.profiles = { ...item.sender, email: null };
      delete item.sender;
    }
    return item;
  });

  return results as CastingOfferWithDetails[];
}

/**
 * Update offer email status
 */
export async function updateOfferEmailStatus(
  offerId: string,
  emailSent: boolean
): Promise<{ data: CastingOffer | null; error: any }> {
  const { data, error } = await supabase
    .from('casting_offers')
    .update({
      email_sent: emailSent,
      email_sent_at: emailSent ? new Date().toISOString() : null,
    })
    .eq('offer_id', offerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating offer email status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Accept a casting offer
 */
export async function acceptCastingOffer(
  offerId: string,
  userId: string
): Promise<{ data: CastingOffer | null; error: any }> {
  try {
    // Get the offer details
    const offer = await getCastingOffer(offerId);
    if (!offer) {
      return { data: null, error: new Error('Offer not found') };
    }

    // Verify the user is the recipient
    if (offer.user_id !== userId) {
      return { data: null, error: new Error('Unauthorized') };
    }

    // Update the cast_member status
    const { error: castMemberError } = await updateCastMemberStatus(
      offer.cast_member_id,
      'Accepted'
    );

    if (castMemberError) {
      console.error('Cast member update error:', castMemberError);
      return { data: null, error: castMemberError };
    }

    // Try to update the offer responded_at timestamp (may fail due to RLS)
    const { data, error } = await supabase
      .from('casting_offers')
      .update({ responded_at: new Date().toISOString() })
      .eq('offer_id', offerId)
      .select()
      .single();

    if (error) {
      console.warn('Could not update offer timestamp (RLS restriction):', error);
      // Continue anyway - the cast_member status is what matters
    }

    // Create notification for casting director
    await createNotification({
      user_id: offer.sent_by,
      recipient_id: offer.sent_by,
      sender_id: userId,
      type: 'casting_decision',
      title: 'Casting Offer Accepted',
      message: `${offer.profiles?.first_name || 'An actor'} has accepted your casting offer`,
      action_url: `/auditions/${offer.audition_id}`,
      reference_id: offerId,
      reference_type: 'casting_offer',
      is_actionable: false,
      is_read: false,
    });

    // Return success even if timestamp update failed
    return { data: offer as any, error: null };
  } catch (error) {
    console.error('Error accepting casting offer:', error);
    return { data: null, error };
  }
}

/**
 * Decline a casting offer
 */
export async function declineCastingOffer(
  offerId: string,
  userId: string
): Promise<{ data: CastingOffer | null; error: any }> {
  try {
    // Get the offer details
    const offer = await getCastingOffer(offerId);
    if (!offer) {
      return { data: null, error: new Error('Offer not found') };
    }

    // Verify the user is the recipient
    if (offer.user_id !== userId) {
      return { data: null, error: new Error('Unauthorized') };
    }

    // Update the cast_member status
    const { error: castMemberError } = await updateCastMemberStatus(
      offer.cast_member_id,
      'Declined'
    );

    if (castMemberError) {
      return { data: null, error: castMemberError };
    }

    // Try to update the offer responded_at timestamp (may fail due to RLS)
    const { data, error } = await supabase
      .from('casting_offers')
      .update({ responded_at: new Date().toISOString() })
      .eq('offer_id', offerId)
      .select()
      .single();

    if (error) {
      console.warn('Could not update offer timestamp (RLS restriction):', error);
      // Continue anyway - the cast_member status is what matters
    }

    // Create notification for casting director
    await createNotification({
      user_id: offer.sent_by,
      recipient_id: offer.sent_by,
      sender_id: userId,
      type: 'casting_decision',
      title: 'Casting Offer Declined',
      message: `${offer.profiles?.first_name || 'An actor'} has declined your casting offer`,
      action_url: `/auditions/${offer.audition_id}`,
      reference_id: offerId,
      reference_type: 'casting_offer',
      is_actionable: false,
      is_read: false,
    });

    // Return success even if timestamp update failed
    return { data: offer as any, error: null };
  } catch (error) {
    console.error('Error declining casting offer:', error);
    return { data: null, error };
  }
}

/**
 * Get offer statistics for an audition
 */
export async function getOfferStats(auditionId: string): Promise<{
  total: number;
  pending: number;
  accepted: number;
  declined: number;
}> {
  const { data, error } = await supabase
    .from('casting_offers')
    .select(`
      offer_id,
      cast_members!inner (
        status
      )
    `)
    .eq('audition_id', auditionId);

  if (error) {
    console.error('Error fetching offer stats:', error);
    return { total: 0, pending: 0, accepted: 0, declined: 0 };
  }

  const stats = {
    total: data?.length || 0,
    pending: 0,
    accepted: 0,
    declined: 0,
  };

  data?.forEach((offer: any) => {
    const status = offer.cast_members?.status;
    if (status === 'Offered') stats.pending++;
    else if (status === 'Accepted') stats.accepted++;
    else if (status === 'Declined') stats.declined++;
  });

  return stats;
}

/**
 * Delete a casting offer (and associated cast_member if no other references)
 */
export async function deleteCastingOffer(offerId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('casting_offers')
    .delete()
    .eq('offer_id', offerId);

  if (error) {
    console.error('Error deleting casting offer:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Revoke a casting offer
 */
export async function revokeCastingOffer(
  offerId: string,
  revokedBy: string,
  revokeMessage: string
): Promise<{ error: any }> {
  try {
    // Get the offer details
    const offer = await getCastingOffer(offerId);
    if (!offer) {
      return { error: new Error('Offer not found') };
    }

    // Delete the cast member (this will cascade delete the offer via FK)
    const { error: castMemberError } = await supabase
      .from('cast_members')
      .delete()
      .eq('cast_member_id', offer.cast_member_id);

    if (castMemberError) {
      console.error('Error deleting cast member:', castMemberError);
      return { error: castMemberError };
    }

    // Get the sender's name for the notification
    const { data: senderData } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', revokedBy)
      .single();

    const senderName = senderData
      ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.email
      : 'The casting director';

    // Create notification for the actor
    await createNotification({
      user_id: offer.user_id,
      recipient_id: offer.user_id,
      sender_id: revokedBy,
      type: 'general',
      title: 'Casting Offer Revoked',
      message: revokeMessage,
      action_url: `/auditions/${offer.audition_id}`,
      reference_id: offer.cast_member_id,
      reference_type: 'cast_member',
      is_actionable: false,
      is_read: false,
    });

    return { error: null };
  } catch (error) {
    console.error('Error revoking casting offer:', error);
    return { error };
  }
}

/**
 * Create a casting offer by email address
 * If the email exists in the system, creates a normal casting offer
 * If the email doesn't exist, sends an invitation email to join the platform
 */
export async function createCastingOfferByEmail(
  offerData: {
    auditionId: string;
    email: string;
    roleId: string | null;
    auditionRoleId?: string | null;
    isUnderstudy: boolean;
    sentBy: string;
    offerMessage?: string;
    offerNotes?: string;
  }
): Promise<{ 
  data: CastingOffer | null; 
  error: any; 
  userExists: boolean;
  invitationSent?: boolean;
}> {
  try {
    // Validate email format
    if (!isValidEmail(offerData.email)) {
      return { 
        data: null, 
        error: new Error('Invalid email format'), 
        userExists: false 
      };
    }

    // Look up user by email
    const user = await getUserByEmail(offerData.email);

    if (user) {
      // User exists - create normal casting offer
      const { data, error } = await createCastingOffer({
        ...offerData,
        userId: user.id,
      });

      return { 
        data, 
        error, 
        userExists: true 
      };
    } else {
      // User doesn't exist - create pending signup
      
      // Get audition and show details
      const { data: auditionData } = await supabase
        .from('auditions')
        .select(`
          audition_id,
          shows (
            title
          )
        `)
        .eq('audition_id', offerData.auditionId)
        .single();

      // Get role name
      let roleName: string | undefined;
      if (offerData.auditionRoleId) {
        const { data: roleData } = await supabase
          .from('audition_roles')
          .select('role_name')
          .eq('audition_role_id', offerData.auditionRoleId)
          .single();
        roleName = roleData?.role_name;
      } else if (offerData.roleId) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('role_name')
          .eq('role_id', offerData.roleId)
          .single();
        roleName = roleData?.role_name;
      }

      const showTitle = (auditionData as any)?.shows?.title || 'a production';

      // Create pending signup with casting offer data
      const requestData: CastingOfferRequestData = {
        audition_id: offerData.auditionId,
        role_id: offerData.roleId || undefined,
        audition_role_id: offerData.auditionRoleId || undefined,
        is_understudy: offerData.isUnderstudy,
        offer_message: offerData.offerMessage || '',
        show_title: showTitle,
        role_name: roleName || 'Ensemble'
      };

      const { data: pendingSignup, error: pendingError } = await createPendingSignup({
        email: offerData.email,
        request_type: 'casting_offer',
        request_data: requestData,
        invited_by: offerData.sentBy
      });

      if (pendingError) {
        return {
          data: null,
          error: pendingError,
          userExists: false,
          invitationSent: false,
        };
      }

      // Get sender profile for email
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', offerData.sentBy)
        .single() as any;

      // Send invitation email via API route (non-blocking)
      if (senderProfile) {
        const inviterFullName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() || senderProfile.email;
        fetch('/api/send-pending-signup-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: offerData.email,
            requestType: 'casting_offer',
            requestData,
            inviterUsername: senderProfile.email,
            inviterFullName: inviterFullName
          })
        })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to send invitation email:', response.status, errorData);
          } else {
            console.log('Invitation email sent successfully to:', offerData.email);
          }
        })
        .catch(err => console.error('Error sending invitation email:', err));
      }

      return {
        data: null,
        error: null,
        userExists: false,
        invitationSent: true,
      };
    }
  } catch (error) {
    console.error('Error in createCastingOfferByEmail:', error);
    return { 
      data: null, 
      error, 
      userExists: false 
    };
  }
}
