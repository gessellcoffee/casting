'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
import { acceptCastingOffer, declineCastingOffer } from '@/lib/supabase/castingOffers';
import Link from 'next/link';
import { useClickOutside } from '@/lib/hooks/useClickOutside';
import { formatTimeAgo, formatUSDate, formatUSTime } from '@/lib/utils/dateUtils';
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
        showTitle: `Callback Invitation for ${notification.callback_invitations?.callback_slots?.auditions?.shows?.title || 'Unknown Show'}`,
        date: notification.callback_invitations?.callback_slots?.start_time 
          ? formatUSDate(notification.callback_invitations.callback_slots.start_time)
          : undefined,
        time: notification.callback_invitations?.callback_slots?.start_time 
          ? formatUSTime(notification.callback_invitations.callback_slots.start_time)
          : undefined,
        location: notification.callback_invitations?.callback_slots?.location,
      },
    });
    setModalOpen(true);
    setIsOpen(false); // Close the notifications dropdown
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

      // Mark notification as handled with the action taken
      await handleNotificationAction(modalData.notificationId, status);
      
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

  const handleAcceptCastingOffer = async (notification: any) => {
    if (!notification.reference_id) return;

    setProcessing(notification.notification_id);
    try {
      const { error } = await acceptCastingOffer(notification.reference_id, userId);
      if (error) throw error;

      // Mark notification as handled
      await handleNotificationAction(notification.notification_id, 'accepted');
      
      loadNotifications();
      loadUnreadCount();
    } catch (err: any) {
      console.error('Error accepting casting offer:', err);
      alert('Failed to accept offer: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineCastingOffer = async (notification: any) => {
    if (!notification.reference_id) return;

    setProcessing(notification.notification_id);
    try {
      const { error } = await declineCastingOffer(notification.reference_id, userId);
      if (error) throw error;

      // Mark notification as handled
      await handleNotificationAction(notification.notification_id, 'declined');
      
      loadNotifications();
      loadUnreadCount();
    } catch (err: any) {
      console.error('Error declining casting offer:', err);
      alert('Failed to decline offer: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'company_approval':
        return (
          <svg className="w-5 h-5 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'user_affiliation':
        return (
          <svg className="w-5 h-5 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'casting_decision':
        return (
          <svg className="w-5 h-5 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'casting_offer':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-neu-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="neu-icon-btn relative"
        title="Notifications"
      >
        <svg
          className="w-5 h-5"
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
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white bg-neu-accent-danger rounded-full shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="notification-dropdown fixed sm:absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 sm:w-96 w-[calc(100vw-2rem)] mx-4 sm:mx-0 max-h-[calc(100vh-120px)] overflow-hidden rounded-xl shadow-2xl z-[9999] flex flex-col">
          {/* Header */}
          <div className="notification-dropdown-header p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neu-text-primary">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-neu-accent-primary hover:text-neu-accent-secondary underline transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 relative" style={{ scrollBehavior: 'smooth' }}>
            {/* Fade indicator at bottom */}
            <div className="notification-fade-bottom absolute bottom-0 left-0 right-0 h-12 pointer-events-none z-10"></div>
            {loading ? (
              <div className="p-8 text-center text-neu-text-primary/70">Loading...</div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="w-12 h-12 mx-auto text-neu-accent-primary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`notification-card p-4 transition-colors ${
                    !notification.is_read ? 'notification-unread-bg' : ''
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
                        <p className="text-sm font-semibold text-neu-text-primary">
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="notification-unread-dot flex-shrink-0 w-2 h-2 rounded-full mt-1"></span>
                        )}
                      </div>
                      <p className="text-sm text-neu-text-primary/80 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-neu-text-primary/50 mt-2">
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
                              className="text-neu-accent-primary hover:text-[#6a9fff] underline text-xs block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Requestor
                            </Link>
                          )}
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(notification);
                              }}
                              disabled={processing === notification.notification_id}
                              className="n-button-danger px-3 py-1 text-xs rounded-lg disabled:opacity-50 w-full sm:w-auto"
                            >
                              {processing === notification.notification_id ? 'Processing...' : 'Reject'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(notification);
                              }}
                              disabled={processing === notification.notification_id}
                              className="n-button-primary px-3 py-1 text-xs rounded-lg disabled:opacity-50 w-full sm:w-auto"
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
                            variant={
                              notification.action_taken === 'approved' || notification.action_taken === 'accepted'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {notification.action_taken === 'approved' && '✓ Approved'}
                            {notification.action_taken === 'rejected' && '✗ Rejected'}
                            {notification.action_taken === 'accepted' && '✓ Accepted'}
                            {notification.action_taken === 'declined' && '✗ Declined'}
                          </Badge>
                        </div>
                      )}

                      {/* Action Buttons for Callback Invitations */}
                      {notification.is_actionable && 
                       notification.reference_type === 'callback_invitation' && 
                       !notification.action_taken && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openResponseModal(notification.reference_id, notification.notification_id, 'accept', notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="n-button-primary flex-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 text-xs font-semibold "
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openResponseModal(notification.reference_id, notification.notification_id, 'decline', notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="n-button-danger flex-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 text-xs font-semibold "
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      {/* Action Buttons for Casting Offers */}
                      {notification.is_actionable && 
                       notification.type === 'casting_offer' && 
                       !notification.action_taken && (
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAcceptCastingOffer(notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="n-button-primary flex-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 text-xs font-semibold"
                          >
                            {processing === notification.notification_id ? 'Processing...' : 'Accept Offer'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeclineCastingOffer(notification);
                            }}
                            disabled={processing === notification.notification_id}
                            className="n-button-danger flex-1 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 text-xs font-semibold"
                          >
                            {processing === notification.notification_id ? 'Processing...' : 'Decline Offer'}
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
          <div className="notification-dropdown-footer p-4">
            <Link
              href="/notifications"
              className="block text-center text-sm font-semibold text-neu-accent-primary hover:text-neu-accent-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View All Notifications →
            </Link>
          </div>
        </div>
      )}

      {/* Callback Response Modal - Rendered via Portal */}
      {typeof window !== 'undefined' && modalOpen && createPortal(
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
        />,
        document.body
      )}
    </div>
  );
}
