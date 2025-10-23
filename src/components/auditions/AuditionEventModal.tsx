'use client';

import { useState } from 'react';
import { MdClose, MdCalendarToday, MdAccessTime, MdLocationOn, MdPerson, MdDelete } from 'react-icons/md';
import { deleteAuditionSignup } from '@/lib/supabase/auditionSignups';
import { useRouter } from 'next/navigation';

interface AuditionEventModalProps {
  signup: any;
  userId: string;
  onClose: () => void;
  onDelete?: () => void;
}

export default function AuditionEventModal({ signup, userId, onClose, onDelete }: AuditionEventModalProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTime = new Date(signup.audition_slots.start_time);
  const endTime = new Date(signup.audition_slots.end_time);
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  
  const show = signup.audition_slots?.auditions?.shows;
  const audition = signup.audition_slots?.auditions;
  const role = signup.roles;
  const slotLocation = signup.audition_slots.location;
  const auditionLocation = audition?.audition_location;
  const location = slotLocation || auditionLocation;

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to cancel this audition signup?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const { error: deleteError } = await deleteAuditionSignup(signup.signup_id);

    if (deleteError) {
      setError('Failed to cancel signup. Please try again.');
      setIsDeleting(false);
    } else {
      // Call the onDelete callback to refresh data
      if (onDelete) {
        onDelete();
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="mt-4 sm:mt-20 bg-neu-surface border border-neu-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-neu-surface border-b border-neu-border p-4 sm:p-6 flex flex-col sm:flex-row items-start gap-3 sm:justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-neu-text-primary mb-1">
              {show?.title || 'Unknown Show'}
            </h2>
            {show?.author && (
              <p className="text-neu-text-primary/70">by {show.author}</p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => router.push(`/auditions/${audition?.audition_id}`)}
              className="n-button-primary text-sm sm:text-base"
            >
              View Audition
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-neu-surface/50 border border-neu-border text-neu-text-primary hover:text-neu-accent-primary hover:border-neu-border-focus transition-all duration-200"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Date and Time */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MdCalendarToday className="w-5 h-5 text-neu-accent-primary mt-1" />
              <div>
                <div className="text-sm text-neu-text-primary/70 mb-1">Date</div>
                <div className="text-neu-text-primary font-medium">
                  {startTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MdAccessTime className="w-5 h-5 text-neu-accent-primary mt-1" />
              <div>
                <div className="text-sm text-neu-text-primary/70 mb-1">Time</div>
                <div className="text-neu-text-primary font-medium">
                  {startTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} - {endTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} ({duration} minutes)
                </div>
              </div>
            </div>

            {location && (
              <div className="flex items-start gap-3">
                <MdLocationOn className="w-5 h-5 text-neu-accent-primary mt-1" />
                <div>
                  <div className="text-sm text-neu-text-primary/70 mb-1">Location</div>
                  <div className="text-neu-text-primary font-medium">{location}</div>
                  {slotLocation && auditionLocation && slotLocation !== auditionLocation && (
                    <div className="text-xs text-neu-text-primary/50 mt-1">
                      General audition location: {auditionLocation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {role && (
              <div className="flex items-start gap-3">
                <MdPerson className="w-5 h-5 text-neu-accent-primary mt-1" />
                <div>
                  <div className="text-sm text-neu-text-primary/70 mb-1">Role</div>
                  <div className="text-neu-text-primary font-medium">{role.role_name}</div>
                  {role.description && (
                    <div className="text-sm text-neu-text-primary/60 mt-1">
                      {role.description}
                    </div>
                  )}
                  {role.role_type && (
                    <div className="text-xs text-neu-text-primary/50 mt-1">
                      Type: {role.role_type}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          {signup.status && (
            <div className="p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
              <div className="text-sm text-neu-text-primary/70 mb-2">Status</div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                signup.status === 'Signed Up' ? 'bg-[#5a8ff5]/20 text-neu-accent-primary border border-neu-border-focus' :
                signup.status === 'Callback' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                signup.status === 'Offer Extended' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                signup.status === 'Offer Accepted' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                signup.status === 'Offer Rejected' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                signup.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                'bg-[#5a8ff5]/20 text-neu-accent-primary border border-neu-border-focus'
              }`}>
                {signup.status}
              </span>
            </div>
          )}

          {/* Show Description */}
          {show?.description && (
            <div className="p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
              <div className="text-sm text-neu-text-primary/70 mb-2">About the Show</div>
              <div className="text-neu-text-primary/90 text-sm leading-relaxed">
                {show.description}
              </div>
            </div>
          )}

          {/* Rehearsal and Performance Info */}
          {(audition?.rehearsal_dates || audition?.performance_dates) && (
            <div className="space-y-3">
              {audition.rehearsal_dates && (
                <div className="p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
                  <div className="text-sm text-neu-text-primary/70 mb-1">Rehearsal Dates</div>
                  <div className="text-neu-text-primary text-sm">{audition.rehearsal_dates}</div>
                  {audition.rehearsal_location && (
                    <div className="text-neu-text-primary/60 text-xs mt-1">
                      📍 {audition.rehearsal_location}
                    </div>
                  )}
                </div>
              )}

              {audition.performance_dates && (
                <div className="p-4 rounded-lg bg-neu-surface/50 border border-neu-border">
                  <div className="text-sm text-neu-text-primary/70 mb-1">Performance Dates</div>
                  <div className="text-neu-text-primary text-sm">{audition.performance_dates}</div>
                  {audition.performance_location && (
                    <div className="text-neu-text-primary/60 text-xs mt-1">
                      📍 {audition.performance_location}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-neu-surface border-t border-neu-border p-4 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200 font-medium text-sm sm:text-base"
          >
            Close
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="n-button-danger px-6 py-2 rounded-lg text-white shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <MdDelete className="w-4 h-4" />
            {isDeleting ? 'Canceling...' : 'Cancel Signup'}
          </button>
        </div>
      </div>
    </div>
  );
}
