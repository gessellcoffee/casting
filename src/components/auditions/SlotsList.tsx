"use client";

import React, { useState, useEffect } from 'react';
import { createAuditionSignup, getUserSignupForAudition, getUserSignupsWithTimes, doSlotsOverlap, deleteAuditionSignup, getSlotSignups } from '@/lib/supabase/auditionSignups';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdCalendarToday, MdCheckCircle, MdWarning, MdDelete, MdKeyboardArrowDown } from 'react-icons/md';
import Alert from '@/components/ui/feedback/Alert';
import EmptyState from '@/components/ui/feedback/EmptyState';
import { formatUSDateWithFullWeekday, formatUSTime } from '@/lib/utils/dateUtils';
import Avatar from '@/components/shared/Avatar';
import UserProfileModal from '@/components/casting/UserProfileModal';
import AuditionSignupModal from './AuditionSignupModal';
import { getIncompleteRequiredAuditionForms, assignFormsOnAuditionSignup } from '@/lib/supabase/customForms';
import RequiredFormsModal from './RequiredFormsModal';

interface SlotsListProps {
  slots: any[];
  auditionId: string;
  auditionTitle: string;
  user: any;
  onSignupSuccess: () => void;
  canManage?: boolean;
}

export default function SlotsList({ slots, auditionId, auditionTitle, user, onSignupSuccess, canManage = false }: SlotsListProps) {
  const router = useRouter();
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userSignup, setUserSignup] = useState<any | null>(null);
  const [isLoadingSignup, setIsLoadingSignup] = useState(true);
  const [userSignups, setUserSignups] = useState<any[]>([]);
  const [isCanceling, setIsCanceling] = useState(false);
  const [slotSignups, setSlotSignups] = useState<Record<string, any[]>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'filled'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showRequiredFormsModal, setShowRequiredFormsModal] = useState(false);
  const [pendingSlotId, setPendingSlotId] = useState<string | null>(null);

  // Check if user has already signed up for this audition and get all their signups
  useEffect(() => {
    async function checkUserSignup() {
      if (!user) {
        setIsLoadingSignup(false);
        return;
      }

      setIsLoadingSignup(true);
      const signup = await getUserSignupForAudition(user.id, auditionId);
      setUserSignup(signup);
      
      // Get all user signups to check for time conflicts
      const allSignups = await getUserSignupsWithTimes(user.id);
      setUserSignups(allSignups);
      
      setIsLoadingSignup(false);
    }

    checkUserSignup();
  }, [user, auditionId]);

  // Fetch signups for each slot if user can manage
  useEffect(() => {
    async function fetchSlotSignups() {
      if (!canManage || !slots || slots.length === 0) return;

      const signupsMap: Record<string, any[]> = {};
      await Promise.all(
        slots.map(async (slot) => {
          const signups = await getSlotSignups(slot.slot_id);
          signupsMap[slot.slot_id] = signups;
        })
      );
      setSlotSignups(signupsMap);
    }

    fetchSlotSignups();
  }, [canManage, slots]);

  // Filter and sort slots
  const now = new Date();
  let availableSlots = (canManage ? slots : slots.filter(slot => new Date(slot.start_time) > now))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Get unique dates for filter dropdown
  const uniqueDates = Array.from(
    new Set(
      availableSlots.map(slot => {
        const date = new Date(slot.start_time);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      })
    )
  ).sort();

  // Apply date filter
  if (selectedDate !== 'all') {
    availableSlots = availableSlots.filter(slot => {
      const slotDate = new Date(slot.start_time).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      return slotDate === selectedDate;
    });
  }

  // Apply status filter
  if (filterStatus === 'open') {
    availableSlots = availableSlots.filter(slot => (slot.current_signups || 0) < slot.max_signups);
  } else if (filterStatus === 'filled') {
    availableSlots = availableSlots.filter(slot => (slot.current_signups || 0) >= slot.max_signups);
  }

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const renderSlotRow = (slot: any) => {
    const startTime = new Date(slot.start_time);
    const endTime = new Date(slot.end_time);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const conflictingSignup = userSignups.find(signup =>
      signup.audition_slots &&
      signup.audition_slots.slot_id !== slot.slot_id &&
      doSlotsOverlap(
        slot.start_time,
        slot.end_time,
        signup.audition_slots.start_time,
        signup.audition_slots.end_time
      )
    );
    const hasConflict = !!conflictingSignup;

    return (
      <div
        key={slot.slot_id}
        className="calendar-slot-card p-4 rounded-lg flex items-center justify-between"
      >
        <div className="flex-1">
          <div className="text-neu-text-primary font-medium">
            {formatUSDateWithFullWeekday(startTime)}
          </div>
          <div className="text-neu-text-primary/70 text-sm">
            {formatUSTime(startTime)} - {formatUSTime(endTime)} ({duration} min)
          </div>
          {slot.location && (
            <div className="text-neu-text-primary/60 text-xs mt-1">
              📍 {slot.location}
            </div>
          )}
          <div className="text-neu-text-primary/50 text-xs mt-1">
            {slot.current_signups || 0} / {slot.max_signups} signed up
          </div>

          {/* Show avatars for production team/owners */}
          {canManage && slotSignups[slot.slot_id] && slotSignups[slot.slot_id].length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {slotSignups[slot.slot_id].map((signup: any) => {
                const userName = signup.profiles?.first_name && signup.profiles?.last_name
                  ? `${signup.profiles.first_name} ${signup.profiles.last_name}`
                  : signup.profiles?.email || 'User';
                return (
                  <Avatar
                    key={signup.signup_id}
                    src={signup.profiles?.profile_photo_url}
                    alt={userName}
                    size="sm"
                    onClick={() => setSelectedUserId(signup.user_id)}
                  />
                );
              })}
            </div>
          )}
          {hasConflict && (
            <div className="flex items-center gap-1 text-orange-300 text-xs mt-1">
              <MdWarning className="w-3 h-3" />
              <span className="text-orange-300/90">Time conflict with another audition</span>
            </div>
          )}
        </div>

        {userSignup && userSignup.audition_slots.slot_id === slot.slot_id ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neu-surface border border-neu-border text-neu-accent-success font-medium shadow-[4px_4px_8px_rgba(163,177,198,0.3),-2px_-2px_6px_rgba(255,255,255,0.4)]">
            <MdCheckCircle className="w-5 h-5" />
            Signed Up
          </div>
        ) : (
          <button
            onClick={() => handleSignup(slot.slot_id, slot)}
            disabled={
              signingUp === slot.slot_id ||
              (slot.current_signups >= slot.max_signups) ||
              (userSignup !== null) ||
              hasConflict ||
              isLoadingSignup
            }
            className="n-button-primary px-4 py-2 rounded-lg font-medium"
          >
            {signingUp === slot.slot_id
              ? 'Signing up...'
              : slot.current_signups >= slot.max_signups
              ? 'Full'
              : userSignup !== null
              ? 'Already Signed Up'
              : hasConflict
              ? 'Time Conflict'
              : 'Sign Up'}
          </button>
        )}
      </div>
    );
  };

  const handleSignup = async (slotId: string, slot?: any) => {
    if (!user) {
      // Check if slot is full before opening modal
      if (slot && (slot.current_signups || 0) >= slot.max_signups) {
        setError('This slot is full. Please choose a different time slot.');
        return;
      }
      // Open signup modal instead of redirecting to login
      setSelectedSlot(slot);
      setShowSignupModal(true);
      return;
    }

    setSigningUp(slotId);
    setError(null);
    setSuccessMessage(null);

    const { incompleteAssignmentIds, error: formsError } = await getIncompleteRequiredAuditionForms(auditionId);
    if (formsError) {
      setError(formsError.message || 'Unable to check required forms. Please try again.');
      setSigningUp(null);
      return;
    }

    if (incompleteAssignmentIds.length > 0) {
      // Show required forms modal instead of redirecting
      setPendingSlotId(slotId);
      setShowRequiredFormsModal(true);
      setSigningUp(null);
      return;
    }

    const { error: signupError } = await createAuditionSignup({
      slot_id: slotId,
      user_id: user.id,
    });

    if (signupError) {
      setError(signupError.message || 'Failed to sign up. You may have already signed up for this slot.');
    } else {
      // Automatically assign any required forms for this audition
      const { error: formAssignError } = await assignFormsOnAuditionSignup(auditionId, user.id);
      if (formAssignError) {
        console.warn('Failed to assign forms on signup:', formAssignError);
        // Don't block signup for form assignment errors, just log them
      }

      setSuccessMessage('Successfully signed up! View your audition in your calendar.');
      // Refresh user signup status and all signups
      const signup = await getUserSignupForAudition(user.id, auditionId);
      setUserSignup(signup);
      const allSignups = await getUserSignupsWithTimes(user.id);
      setUserSignups(allSignups);
      onSignupSuccess();
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
    }

    setSigningUp(null);
  };

  const handleFormsCompleted = async () => {
    // Close the modal and proceed with signup for the pending slot
    setShowRequiredFormsModal(false);
    
    if (!pendingSlotId) return;
    
    // Proceed with the actual signup now that forms are completed
    setSigningUp(pendingSlotId);
    
    const { error: signupError } = await createAuditionSignup({
      slot_id: pendingSlotId,
      user_id: user.id,
    });

    if (signupError) {
      setError(signupError.message || 'Failed to sign up. You may have already signed up for this slot.');
    } else {
      // Automatically assign any required forms for this audition
      const { error: formAssignError } = await assignFormsOnAuditionSignup(auditionId, user.id);
      if (formAssignError) {
        console.warn('Failed to assign forms on signup:', formAssignError);
        // Don't block signup for form assignment errors, just log them
      }

      setSuccessMessage('Successfully signed up! View your audition in your calendar.');
      // Refresh user signup status and all signups
      const signup = await getUserSignupForAudition(user.id, auditionId);
      setUserSignup(signup);
      const allSignups = await getUserSignupsWithTimes(user.id);
      setUserSignups(allSignups);
      onSignupSuccess();
      // Clear success message after 10 seconds
      setTimeout(() => setSuccessMessage(null), 10000);
    }

    setSigningUp(null);
    setPendingSlotId(null);
  };

  const handleFormsModalClose = () => {
    setShowRequiredFormsModal(false);
    setPendingSlotId(null);
  };

  const handleCancelSignup = async () => {
    if (!userSignup) return;

    if (!confirm('Are you sure you want to cancel this audition signup? You can sign up for a different slot afterwards.')) {
      return;
    }

    setIsCanceling(true);
    setError(null);

    const { error: cancelError } = await deleteAuditionSignup(userSignup.signup_id);

    if (cancelError) {
      setError(cancelError.message || 'Failed to cancel signup. Please try again.');
      setIsCanceling(false);
    } else {
      // Clear user signup state
      setUserSignup(null);
      // Refresh all signups
      const allSignups = await getUserSignupsWithTimes(user.id);
      setUserSignups(allSignups);
      // Notify parent to refresh
      onSignupSuccess();
      setIsCanceling(false);
    }
  };

  if (!availableSlots || availableSlots.length === 0) {
    return (
      <div className="p-6 rounded-xl calendar-container">
        <h2 className="text-2xl font-semibold text-neu-text-primary mb-4">
          Audition Slots
        </h2>
        <EmptyState
          title="No available audition slots"
          description="No available audition slots at this time."
        />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl calendar-container">
      <div className="flex flex-col gap-4 mb-4">
        <h2 className="text-2xl font-semibold text-neu-text-primary">
          Available Audition Slots
        </h2>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Date Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="date-filter" className="text-sm font-medium text-neu-text-primary whitespace-nowrap">
              Filter by Date:
            </label>
            <select
              id="date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="neu-input px-3 py-2 rounded-lg text-sm min-w-[180px]"
            >
              <option value="all">All Dates</option>
              {uniqueDates.map(date => {
                const dateObj = new Date(date);
                const displayDate = dateObj.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
                return (
                  <option key={date} value={date}>
                    {displayDate}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`n-button-primary px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'all' ? '!shadow-[inset_6px_6px_12px_var(--neu-shadow-inset-dark),inset_-6px_-6px_12px_var(--neu-shadow-inset-light)]' : ''}`}
          >
            All Slots
          </button>
          {!canManage && (
            <button
              onClick={() => setFilterStatus('open')}
              className={`n-button-primary px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'open' ? '!shadow-[inset_6px_6px_12px_var(--neu-shadow-inset-dark),inset_-6px_-6px_12px_var(--neu-shadow-inset-light)]' : ''}`}
            >
              Open Slots
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setFilterStatus('filled')}
              className={`n-button-primary px-4 py-2 rounded-lg text-sm font-medium ${filterStatus === 'filled' ? '!shadow-[inset_6px_6px_12px_var(--neu-shadow-inset-dark),inset_-6px_-6px_12px_var(--neu-shadow-inset-light)]' : ''}`}
            >
              Filled Slots
            </button>
          )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      {userSignup && (
        <Alert variant="info" className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <MdCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1 text-neu-accent-primary">You're signed up for this audition</div>
                <div className="text-sm text-neu-text-primary/80">
                  {formatUSDateWithFullWeekday(userSignup.audition_slots.start_time)} at {formatUSTime(userSignup.audition_slots.start_time)}
                </div>
                <div className="text-xs text-neu-text-primary/60 mt-2">
                  You can only sign up for one slot per audition. To change your slot, cancel your current signup first.
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelSignup}
              disabled={isCanceling}
              className="n-button-danger px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap"
            >
              <MdDelete className="w-4 h-4" />
              {isCanceling ? 'Canceling...' : 'Cancel Signup'}
            </button>
          </div>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage(null)} className="mb-4">
          <div className="font-medium mb-2">{successMessage}</div>
          <Link
            href="/my-calendar"
            className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <MdCalendarToday className="w-4 h-4" />
            View My Calendar
          </Link>
        </Alert>
      )}

      {availableSlots.length === 0 ? (
        <EmptyState
          title={filterStatus === 'open' ? 'No open slots' : filterStatus === 'filled' ? 'No filled slots' : 'No slots available'}
          description={
            selectedDate !== 'all'
              ? `No slots found for the selected date. Try selecting "All Dates" to see more options.`
              : filterStatus === 'open' 
              ? 'All slots are currently full. Try selecting "All Slots" to see filled slots.'
              : filterStatus === 'filled'
              ? 'No slots are filled yet. Try selecting "All Slots" to see available slots.'
              : 'No slots match your current filter.'
          }
        />
      ) : (
        <div className="space-y-4">
          {(() => {
            const slotsByDate: Record<string, any[]> = {};
            availableSlots.forEach((slot) => {
              const dateKey = new Date(slot.start_time).toISOString().slice(0, 10);
              if (!slotsByDate[dateKey]) {
                slotsByDate[dateKey] = [];
              }
              slotsByDate[dateKey].push(slot);
            });

            return Object.entries(slotsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([dateKey, dateSlots]) => {
                if (dateSlots.length === 0) return null;

                const dayLabel = formatUSDateWithFullWeekday(new Date(dateSlots[0].start_time));
                const isDayExpanded = !!expandedDays[dateKey];

                const groups: any[][] = [];
                for (let i = 0; i < dateSlots.length; i += 10) {
                  groups.push(dateSlots.slice(i, i + 10));
                }

                return (
                  <div key={dateKey} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleDay(dateKey)}
                      className="w-full flex items-center justify-between px-2 py-2 text-left"
                      aria-expanded={isDayExpanded}
                    >
                      <span className="text-sm font-semibold text-neu-text-primary/80">
                        {dayLabel}
                      </span>
                      <MdKeyboardArrowDown
                        className={`w-5 h-5 text-neu-text-primary/70 transition-transform ${
                          isDayExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isDayExpanded && groups.map((group, groupIndex) => {
                      const globalStartIndex = groupIndex * 10;
                      const firstSlot = group[0];
                      const lastSlot = group[group.length - 1];
                      const firstStart = new Date(firstSlot.start_time);
                      const lastEnd = new Date(lastSlot.end_time || lastSlot.start_time);
                      const timeRangeLabel = `${formatUSTime(firstStart)} - ${formatUSTime(lastEnd)}`;
                      const indexLabel = `Slots ${globalStartIndex + 1}-${globalStartIndex + group.length}`;
                      const groupId = `${dateKey}-group-${groupIndex}`;
                      const isExpanded = !!expandedGroups[groupId];

                      return (
                        <div key={groupId} className="neu-card-raised rounded-xl">
                          <button
                            type="button"
                            onClick={() => toggleGroup(groupId)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                            aria-expanded={isExpanded}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                              <span className="font-medium text-neu-text-primary text-sm sm:text-base">
                                {indexLabel}
                              </span>
                              <span className="text-xs sm:text-sm text-neu-text-primary/70">
                                {timeRangeLabel}
                              </span>
                            </div>
                            <MdKeyboardArrowDown
                              className={`w-5 h-5 text-neu-text-primary/70 transition-transform ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isExpanded && (
                            <div className="border-t border-neu-border px-4 py-3 space-y-3">
                              {group.map((slot) => renderSlotRow(slot))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              });
          })()}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUserId && (
        <UserProfileModal
          userId={selectedUserId}
          auditionId={auditionId}
          onClose={() => setSelectedUserId(null)}
          onActionComplete={() => {
            setSelectedUserId(null);
            onSignupSuccess();
          }}
        />
      )}

      {/* Signup Modal for non-authenticated users */}
      {showSignupModal && selectedSlot && (
        <AuditionSignupModal
          isOpen={showSignupModal}
          onClose={() => {
            setShowSignupModal(false);
            setSelectedSlot(null);
          }}
          slotId={selectedSlot.slot_id}
          auditionId={auditionId}
          auditionTitle={auditionTitle}
          slotTime={`${formatUSDateWithFullWeekday(selectedSlot.start_time)} at ${formatUSTime(selectedSlot.start_time)}`}
          onSuccess={() => {
            setSuccessMessage('Account created and signed up successfully! Please check your email to verify your account.');
            onSignupSuccess();
          }}
        />
      )}

      {/* Required Forms Modal */}
      <RequiredFormsModal
        isOpen={showRequiredFormsModal}
        onClose={handleFormsModalClose}
        auditionId={auditionId}
        auditionTitle={auditionTitle}
        onAllFormsCompleted={handleFormsCompleted}
      />
    </div>
  );
}
