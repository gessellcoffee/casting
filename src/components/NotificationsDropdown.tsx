'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/supabase/types';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  handleNotificationAction,
} from '@/lib/supabase/notifications';
import { updateApprovalRequest } from '@/lib/supabase/companyApprovals';
import { respondToCallbackInvitation } from '@/lib/supabase/callbackInvitations';
import Link from 'next/link';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { formatTimeAgo } from '@/lib/utils/dateUtils';
import EmptyState from '@/components/ui/feedback/EmptyState';
import Badge from '@/components/ui/feedback/Badge';
import CallbackResponseModal from '@/components/callbacks/CallbackResponseModal';

interface NotificationsDropdownProps {
  userId: string;
}

export default function NotificationsDropdown({ userId }: NotificationsDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    invitationId: string;
    notificationId: string;
    responseType: 'accept' | 'decline';
    details?: any;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getUserNotifications(userId, 20);
    console.log('Loaded notifications:', data);
    // Log sender_id for company approval notifications
    data.forEach(notif => {
      if (notif.type === 'company_approval') {
        console.log('Company approval notification:', {
          id: notif.notification_id,
          sender_id: notif.sender_id,
          reference_id: notif.reference_id,
          message: notif.message
        });
      }
    });
    setNotifications(data);
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    const count = await getUnreadNotificationCount(userId);
    setUnreadCount(count);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    loadNotifications();
    loadUnreadCount();
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
    loadNotifications();
    loadUnreadCount();
  };

  const handleApprove = async (notification: any) => {
    if (!notification.reference_id) return;

    setProcessing(notification.notification_id);
    try {
      // Update the approval request
      await updateApprovalRequest(notification.reference_id, 'approved');
      
      // Mark notification as handled
      await handleNotificationAction(notification.notification_id, 'approved');
      
      // Reload notifications
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (notification: any) => {
    if (!notification.reference_id) return;

    setProcessing(notification.notification_id);
    try {
      // Update the approval request
      await updateApprovalRequest(notification.reference_id, 'rejected');
      
      // Mark notification as handled
      await handleNotificationAction(notification.notification_id, 'rejected');
      
      // Reload notifications
      loadNotifications();
      loadUnreadCount();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setProcessing(null);
    }
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
      },
    });
    setModalOpen(true);
  };

  const handleCallbackResponse = async (comment: string) => {
    if (!modalData) return;

    setProcessing(modalData.notificationId);
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
      loadNotifications();
      loadUnreadCount();
    } catch (err: any) {
      console.error('Error responding to callback:', err);
      alert('Failed to respond: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'company_approval':
        return (
          <svg className="w-5 h-5 text-[#5a8ff5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'user_affiliation':
        return (
          <svg className="w-5 h-5 text-[#5a8ff5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'casting_decision':
        return (
          <svg className="w-5 h-5 text-[#5a8ff5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-[#5a8ff5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={handleToggle}
        className="text-[#b5ccff] hover:text-[#5a8ff5] "
      >
        <svg
          className="w-6 h-6 text-[#c5ddff]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[600px] overflow-hidden rounded-xl bg-gradient-to-br from-[#2e3e5e]/95 to-[#26364e]/95 backdrop-blur-lg border border-[#4a7bd9]/20 shadow-2xl z-[9999]">
          {/* Header */}
          <div className="p-4 border-b border-[#4a7bd9]/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#c5ddff]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-[#5a8ff5] hover:text-[#6a9fff] underline"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-[#c5ddff]/70">Loading...</div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12 mx-auto text-[#4a7bd9]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                }
                title="No notifications"
                className="p-8"
              />
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 border-b border-[#4a7bd9]/10 hover:bg-[#2e3e5e]/30 transition-colors ${
                    !notification.is_read ? 'bg-[#4a7bd9]/5' : ''
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.notification_id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-[#c5ddff]">
                          {notification.title}
                        </p>
                        <Link href={`/profile/${notification.reference_id}`}>View User</Link>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-[#5a8ff5] rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-[#b5ccff]/80 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#b5ccff]/50 mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>

                      {/* Action Buttons for Company Approvals */}
                      {notification.is_actionable && 
                       notification.type === 'company_approval' && 
                       !notification.action_taken && (
                        <div className="space-y-2 mt-3">
                          {notification.sender_id && (
                            <Link 
                              href={`/profile/${notification.sender_id}`}
                              className="text-[#5a8ff5] hover:text-[#6a9fff] underline text-xs block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Requestor
                            </Link>
                          )}
                          <div className="flex gap-2">
                            <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="px-3 py-1 text-xs rounded-lg bg-[#1a2332] border border-[#4a7bd9]/30 text-[#c5ddff] hover:border-[#5a8ff5] transition-colors disabled:opacity-50"
                          >
                            {processing === notification.notification_id ? 'Processing...' : 'Reject'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="px-3 py-1 text-xs rounded-lg bg-[#5a8ff5] text-white hover:bg-[#6a9fff] transition-colors disabled:opacity-50"
                          >
                            {processing === notification.notification_id ? 'Processing...' : 'Approve'}
                          </button>
                          </div>
                        </div>
                      )}

                      {/* Show action taken */}
                      {notification.action_taken && (
                        <div className="mt-2">
                          <Badge
                            variant={notification.action_taken === 'approved' ? 'success' : 'danger'}
                          >
                            {notification.action_taken === 'approved' ? '✓ Approved' : '✗ Rejected'}
                          </Badge>
                        </div>
                      )}

                      {/* Action Buttons for Callback Invitations */}
                      {notification.is_actionable && 
                       notification.reference_type === 'callback_invitation' && 
                       !notification.action_taken && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openResponseModal(notification.reference_id, notification.notification_id, 'accept', notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-all disabled:opacity-50 text-xs font-semibold shadow-[2px_2px_5px_var(--cosmic-shadow-dark),-2px_-2px_5px_var(--cosmic-shadow-light)]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openResponseModal(notification.reference_id, notification.notification_id, 'decline', notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 text-[#c5ddff] hover:bg-[#2e3e5e]/80 transition-all disabled:opacity-50 text-xs shadow-[2px_2px_5px_var(--cosmic-shadow-dark),-2px_-2px_5px_var(--cosmic-shadow-light)]"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* View All Link */}
          <div className="p-4 border-t border-[#4a7bd9]/20 bg-[#2e3e5e]/30">
            <Link
              href="/notifications"
              className="block text-center text-sm font-semibold text-[#5a8ff5] hover:text-[#94b0f6] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}

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
        isSubmitting={processing !== null}
      />
    </div>
  );
}
