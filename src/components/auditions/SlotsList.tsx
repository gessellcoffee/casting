'use client';

import React, { useState, useEffect } from 'react';
import { createAuditionSignup, getUserSignupForAudition, getUserSignupsWithTimes, doSlotsOverlap, deleteAuditionSignup } from '@/lib/supabase/auditionSignups';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MdCalendarToday, MdCheckCircle, MdWarning, MdDelete } from 'react-icons/md';
import Alert from '@/components/ui/feedback/Alert';
import EmptyState from '@/components/ui/feedback/EmptyState';

interface SlotsListProps {
  slots: any[];
  auditionId: string;
  user: any;
  onSignupSuccess: () => void;
}

export default function SlotsList({ slots, auditionId, user, onSignupSuccess }: SlotsListProps) {
  const router = useRouter();
  const [signingUp, setSigningUp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userSignup, setUserSignup] = useState<any | null>(null);
  const [isLoadingSignup, setIsLoadingSignup] = useState(true);
  const [userSignups, setUserSignups] = useState<any[]>([]);
  const [isCanceling, setIsCanceling] = useState(false);

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

  // Filter and sort slots
  const now = new Date();
  const availableSlots = slots
    .filter(slot => new Date(slot.start_time) > now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const handleSignup = async (slotId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setSigningUp(slotId);
    setError(null);
    setSuccessMessage(null);

    const { error: signupError } = await createAuditionSignup({
      slot_id: slotId,
      user_id: user.id,
    });

    if (signupError) {
      setError(signupError.message || 'Failed to sign up. You may have already signed up for this slot.');
    } else {
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
      <div className="p-6 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20">
        <h2 className="text-2xl font-semibold text-[#c5ddff] mb-4">
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
    <div className="p-6 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20">
      <h2 className="text-2xl font-semibold text-[#c5ddff] mb-4">
        Available Audition Slots
      </h2>

      {error && (
        <Alert variant="error" className="mb-4">{error}</Alert>
      )}

      {userSignup && (
        <Alert variant="info" className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <MdCheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1 text-[#5a8ff5]">You're signed up for this audition</div>
                <div className="text-sm text-[#c5ddff]/80">
                  {new Date(userSignup.audition_slots.start_time).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })} at {new Date(userSignup.audition_slots.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-xs text-[#c5ddff]/60 mt-2">
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
            href="/my-auditions"
            className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
          >
            <MdCalendarToday className="w-4 h-4" />
            View My Calendar
          </Link>
        </Alert>
      )}

      <div className="space-y-3">
        {availableSlots.map((slot) => {
          const startTime = new Date(slot.start_time);
          const endTime = new Date(slot.end_time);
          const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
          
          // Check if this slot conflicts with any existing signups
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
              className="p-4 rounded-lg bg-[#2e3e5e]/50 border border-[#4a7bd9]/10 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="text-[#c5ddff] font-medium">
                  {startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-[#c5ddff]/70 text-sm">
                  {startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} - {endTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} ({duration} min)
                </div>
                {slot.location && (
                  <div className="text-[#c5ddff]/60 text-xs mt-1">
                    📍 {slot.location}
                  </div>
                )}
                <div className="text-[#c5ddff]/50 text-xs mt-1">
                  {slot.current_signups || 0} / {slot.max_signups} signed up
                </div>
                {hasConflict && (
                  <div className="flex items-center gap-1 text-orange-300 text-xs mt-1">
                    <MdWarning className="w-3 h-3" />
                    <span className="text-orange-300/90">Time conflict with another audition</span>
                  </div>
                )}
              </div>

              {userSignup && userSignup.audition_slots.slot_id === slot.slot_id ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#2e3e5e]/50 to-[#26364e]/50 border border-green-500/30 text-green-300 font-medium shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)]">
                  <MdCheckCircle className="w-5 h-5" />
                  Signed Up
                </div>
              ) : (
                <button
                  onClick={() => handleSignup(slot.slot_id)}
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
        })}
      </div>
    </div>
  );
}
