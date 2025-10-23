'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  handleNotificationAction,
} from '@/lib/supabase/notifications';
import { respondToCallbackInvitation } from '@/lib/supabase/callbackInvitations';
import StarryContainer from '@/components/StarryContainer';
import { formatTimeAgo } from '@/lib/utils/dateUtils';
import CallbackResponseModal from '@/components/callbacks/CallbackResponseModal';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'callbacks'>('all');
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    invitationId: string;
    notificationId: string;
    responseType: 'accept' | 'decline';
    details?: any;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await getUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const data = await getUserNotifications(currentUser.id, 100);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    loadData();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    loadData();
  };

  const openResponseModal = (
    invitationId: string,
    notificationId: string,
    responseType: 'accept' | 'decline',
    notification: any
  ) => {
    setModalData({
      invitationId,
      notificationId,
      responseType,
      details: {
        showTitle: notification.title,
        // You can extract more details from notification.message if needed
      },
    });
    setModalOpen(true);
  };

  const handleCallbackResponse = async (comment: string) => {
    if (!modalData) return;

    setResponding(modalData.notificationId);
    try {
      const status = modalData.responseType === 'accept' ? 'accepted' : 'rejected';
      const { error } = await respondToCallbackInvitation(
        modalData.invitationId,
        status,
        comment || undefined
      );
      if (error) throw error;

      // Mark notification as handled with the action taken
      await handleNotificationAction(modalData.notificationId, status);
      
      setModalOpen(false);
      setModalData(null);
      loadData();
    } catch (err: any) {
      console.error('Error responding to callback:', err);
      alert('Failed to respond: ' + err.message);
    } finally {
      setResponding(null);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.is_read;
    if (filter === 'callbacks') return notif.reference_type === 'callback_invitation';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const callbackCount = notifications.filter(n => n.reference_type === 'callback_invitation' && !n.is_read).length;

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading notifications...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#2d3748] mb-1">Notifications</h1>
            <p className="text-sm text-[#718096]">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`notification-filter-btn ${filter === 'all' ? 'active' : ''}`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`notification-filter-btn ${filter === 'unread' ? 'active' : ''}`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('callbacks')}
                className={`notification-filter-btn ${filter === 'callbacks' ? 'active' : ''}`}
              >
                Callbacks ({callbackCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="notification-filter-btn"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <p className="text-[#718096]">No notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isCallback = notification.reference_type === 'callback_invitation';
                const isPending = isCallback && notification.is_actionable && !notification.action_taken;

                return (
                  <div
                    key={notification.notification_id}
                    className={`notification-card ${notification.is_read ? 'read' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#2d3748] mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[#4a5568] mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#9ca3af]">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notification_id)}
                          className="ml-4 notification-mark-read-btn"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>

                    {/* Callback Response Actions */}
                    {isPending && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openResponseModal(notification.reference_id, notification.notification_id, 'accept', notification)}
                          disabled={responding === notification.notification_id}
                          className="n-button-primary"
                        >
                          Accept Callback
                        </button>
                        <button
                          onClick={() => openResponseModal(notification.reference_id, notification.notification_id, 'decline', notification)}
                          disabled={responding === notification.notification_id}
                          className="n-button-danger"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {/* Action Link */}
                    {notification.action_url && !isPending && (
                      <div className="mt-4">
                        <button
                          onClick={() => {
                            handleMarkAsRead(notification.notification_id);
                            router.push(notification.action_url);
                          }}
                          className="text-neu-accent-primary hover:text-neu-accent-secondary text-sm font-semibold transition-colors"
                        >
                          View Details →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Callback Response Modal */}
      <CallbackResponseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalData(null);
        }}
        onConfirm={handleCallbackResponse}
        responseType={modalData?.responseType || 'accept'}
        callbackDetails={modalData?.details}
        isSubmitting={responding !== null}
      />
    </StarryContainer>
  );
}
