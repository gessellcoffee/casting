import { supabase } from './client';
import type { Notification, NotificationInsert, NotificationUpdate } from './types';

/**
 * Create a notification
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
        username,
        profile_photo_url
      )
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
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
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
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
    .select('first_name, last_name, username')
    .eq('id', requesterId)
    .single();

  // Build requester's display name
  const requesterName = requesterProfile
    ? `${requesterProfile.first_name || ''} ${requesterProfile.last_name || ''}`.trim() || requesterProfile.username || 'A user'
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
