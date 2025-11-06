import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { Notification, NotificationInsert, NotificationUpdate } from './types';

/**
 * Send email notification to recipient
 */
async function sendEmailNotification(
  recipientId: string,
  senderId: string | null,
  notificationType: string,
  title: string,
  message: string,
  actionUrl?: string | null
): Promise<void> {
  try {
    // Fetch recipient profile to get email and name
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', recipientId)
      .single();

    if (!recipientProfile?.email) {
      console.warn('Recipient profile not found or missing email:', recipientId);
      return;
    }

    const recipientName = `${recipientProfile.first_name || ''} ${recipientProfile.last_name || ''}`.trim() 
      || recipientProfile.email;

    // Fetch sender name if available
    let senderName: string | undefined;
    if (senderId) {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', senderId)
        .single();

      if (senderProfile) {
        senderName = `${senderProfile.first_name || ''} ${senderProfile.last_name || ''}`.trim() 
          || senderProfile.email;
      }
    }

    // Call the email API route
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipientEmail: recipientProfile.email,
        recipientName,
        notificationType,
        title,
        message,
        actionUrl: actionUrl || undefined,
        senderName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send email notification:', errorData);
    } else {
      console.log('Email notification sent successfully to:', recipientProfile.email);
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    // Don't throw - we don't want email failures to block notification creation
  }
}

/**
 * Create a notification (in-app and email)
 */
export async function createNotification(
  notificationData: NotificationInsert
): Promise<{ data: Notification | null; error: any }> {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    return { data: null, error };
  }

  // Send email notification asynchronously (don't wait for it)
  if (data) {
    sendEmailNotification(
      notificationData.recipient_id,
      notificationData.sender_id || null,
      notificationData.type,
      notificationData.title,
      notificationData.message,
      notificationData.action_url
    ).catch(err => {
      console.error('Email notification failed (non-blocking):', err);
    });
  }

  return { data, error: null };
}

/**
 * Get all notifications for the current user
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:profiles!notifications_sender_id_fkey (
        first_name,
        last_name,
        email,
        profile_photo_url
      )
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return [];
  }

  // For callback invitation notifications, fetch the invitation details
  const notificationsWithDetails = await Promise.all(
    (data || []).map(async (notification) => {
      if (notification.reference_type === 'callback_invitation' && notification.reference_id) {
        const { data: invitationData } = await supabase
          .from('callback_invitations')
          .select(`
            invitation_id,
            callback_slots (
              callback_slot_id,
              start_time,
              end_time,
              location,
              auditions (
                audition_id,
                shows (
                  show_id,
                  title
                )
              )
            )
          `)
          .eq('invitation_id', notification.reference_id)
          .single();
        
        return {
          ...notification,
          callback_invitations: invitationData
        };
      }
      return notification;
    })
  );

  return notificationsWithDetails;
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ data: Notification | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('notification_id', notificationId)
    .eq('recipient_id', user.id) // Ensure user can only mark their own notifications
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  // Verify the user is marking their own notifications
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only mark your own notifications as read');
    console.error('Authorization failed');
    return { error: unauthorizedError };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ 
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('recipient_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('notification_id', notificationId)
    .eq('recipient_id', user.id); // Ensure user can only delete their own notifications

  if (error) {
    console.error('Error deleting notification:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Handle notification action (for actionable notifications like approvals)
 */
export async function handleNotificationAction(
  notificationId: string,
  action: string
): Promise<{ data: Notification | null; error: any }> {
  // Verify the authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ 
      action_taken: action,
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('notification_id', notificationId)
    .eq('recipient_id', user.id) // Ensure user can only act on their own notifications
    .select()
    .single();

  if (error) {
    console.error('Error handling notification action:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Create a company approval notification
 */
export async function createCompanyApprovalNotification(
  companyOwnerId: string,
  requesterId: string,
  companyName: string,
  showName: string | null,
  role: string | null,
  requestId: string
): Promise<{ data: Notification | null; error: any }> {
  // Fetch requester's profile to get their name
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', requesterId)
    .single();

  // Build requester's display name
  const requesterName = requesterProfile
    ? `${requesterProfile.first_name || ''} ${requesterProfile.last_name || ''}`.trim() || requesterProfile.email || 'A user'
    : 'A user';

  const title = 'Company Approval Request';
  const message = `${requesterName} wants to associate ${showName ? `"${showName}"` : 'a production'}${role ? ` (${role})` : ''} with ${companyName}`;

  return createNotification({
    recipient_id: companyOwnerId,
    sender_id: requesterId,
    type: 'company_approval',
    title,
    message,
    action_url: `/profile?user=${requesterId}`,
    reference_id: requestId,
    reference_type: 'company_approval_request',
    is_actionable: true,
    is_read: false,
  });
}
