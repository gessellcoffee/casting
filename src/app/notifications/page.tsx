'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
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

      await markNotificationAsRead(modalData.notificationId);
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
          <div className="text-[#c5ddff]/70">Loading notifications...</div>
        </div>
      </StarryContainer>
    );
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#c5ddff] mb-2">Notifications</h1>
            <p className="text-[#c5ddff]/70">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-[#5a8ff5] text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]'
                    : 'bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'unread'
                    ? 'bg-[#5a8ff5] text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]'
                    : 'bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]'
                }`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('callbacks')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filter === 'callbacks'
                    ? 'bg-[#5a8ff5] text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]'
                    : 'bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]'
                }`}
              >
                Callbacks ({callbackCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 transition-all shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-center shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]">
                <p className="text-[#c5ddff]/70">No notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const isCallback = notification.reference_type === 'callback_invitation';
                const isPending = isCallback && notification.is_actionable;

                return (
                  <div
                    key={notification.notification_id}
                    className={`p-6 rounded-xl border transition-all ${
                      notification.is_read
                        ? 'bg-[#2e3e5e]/30 border-[#4a7bd9]/10'
                        : 'bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border-[#5a8ff5]/30 shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[#c5ddff] mb-1">
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[#c5ddff]/70 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#c5ddff]/50">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>

                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.notification_id)}
                          className="ml-4 px-3 py-1 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff]/60 hover:text-[#c5ddff] text-xs transition-all shadow-[2px_2px_5px_var(--cosmic-shadow-dark),-2px_-2px_5px_var(--cosmic-shadow-light)]"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>

                    {/* Callback Response Actions */}
                    {isPending && (
                      <div className="flex gap-3 mt-4 pt-4 border-t border-[#4a7bd9]/20">
                        <button
                          onClick={() => openResponseModal(notification.reference_id, notification.notification_id, 'accept', notification)}
                          disabled={responding === notification.notification_id}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3)]"
                        >
                          Accept Callback
                        </button>
                        <button
                          onClick={() => openResponseModal(notification.reference_id, notification.notification_id, 'decline', notification)}
                          disabled={responding === notification.notification_id}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[5px_5px_10px_var(--cosmic-shadow-dark),-5px_-5px_10px_var(--cosmic-shadow-light)] hover:shadow-[inset_2px_2px_5px_var(--cosmic-shadow-dark)]"
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
                          className="text-[#5a8ff5] hover:text-[#94b0f6] text-sm font-semibold transition-colors"
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
