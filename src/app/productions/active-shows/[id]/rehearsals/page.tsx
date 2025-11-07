'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getRehearsalEvents, canManageRehearsalEvents, deleteRehearsalEvent } from '@/lib/supabase/rehearsalEvents';
import { getUser } from '@/lib/supabase';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import Button from '@/components/Button';
import { MdAdd, MdEdit, MdDelete, MdLocationOn, MdAccessTime, MdCalendarToday, MdArrowBack } from 'react-icons/md';
import { formatUSDate } from '@/lib/utils/dateUtils';
import type { RehearsalEvent } from '@/lib/supabase/types';
import RehearsalEventForm from '@/components/productions/RehearsalEventForm';

// Helper function to format time string (HH:MM:SS) to 12-hour format
function formatTimeString(timeString: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function RehearsalsPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [rehearsalEvents, setRehearsalEvents] = useState<RehearsalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    setLoading(true);

    // Load audition
    const { data: auditionData, error: auditionError } = await getAuditionById(params.id as string);
    if (auditionError || !auditionData) {
      alert('Error loading audition');
      router.push('/cast');
      return;
    }
    setAudition(auditionData);

    // Load rehearsal events
    const { data: eventsData } = await getRehearsalEvents(params.id as string);
    setRehearsalEvents(eventsData || []);

    // Check permissions
    const hasPermission = await canManageRehearsalEvents(params.id as string);
    setCanManage(hasPermission);

    setLoading(false);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this rehearsal event?')) {
      return;
    }

    setDeleting(eventId);
    const { error } = await deleteRehearsalEvent(eventId);

    if (error) {
      alert('Failed to delete rehearsal event');
    } else {
      setRehearsalEvents(prev => prev.filter(e => e.rehearsal_events_id !== eventId));
    }

    setDeleting(null);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <StarryContainer>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-neu-text-primary">Loading rehearsal schedule...</div>
          </div>
        </StarryContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <button
              onClick={() => router.push('/cast')}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back to Productions
            </button>

            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-4xl font-bold text-neu-text-primary">
                  Rehearsal Schedule
                </h1>
                <WorkflowStatusBadge status={audition.workflow_status} />
              </div>
              <h2 className="text-2xl text-neu-text-secondary">
                {audition.show?.title || 'Untitled Show'}
              </h2>
              {audition.company && (
                <p className="text-neu-text-secondary mt-1">
                  {audition.company.name}
                </p>
              )}
            </div>

            {/* Add Rehearsal Button */}
            {canManage && (
              <div className="mb-6">
                <Button
                  text="+ Add Rehearsal Event"
                  onClick={() => setShowAddForm(true)}
                  className="neu-button-primary"
                />
              </div>
            )}

            {/* Rehearsal Events List */}
            {rehearsalEvents.length === 0 ? (
              <div className="neu-card-raised p-12 text-center">
                <MdCalendarToday className="w-16 h-16 mx-auto mb-4 text-neu-text-secondary" />
                <p className="text-neu-text-secondary text-lg mb-4">
                  No rehearsal events scheduled yet
                </p>
                {canManage && (
                  <Button
                    text="Schedule First Rehearsal"
                    onClick={() => setShowAddForm(true)}
                    className="neu-button-primary"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {rehearsalEvents.map((event) => (
                  <div
                    key={event.rehearsal_events_id}
                    className="neu-card-raised p-6 hover:shadow-neu-raised-lg hover:scale-[1.02] transition-all cursor-pointer group"
                    onClick={() => router.push(`/productions/active-shows/${params.id}/rehearsals/${event.rehearsal_events_id}`)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        {/* Click to view indicator */}
                        <div className="text-xs text-neu-accent-primary mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to view agenda →
                        </div>
                        {/* Date */}
                        <div className="flex items-center gap-2 mb-3">
                          <MdCalendarToday className="w-5 h-5 text-neu-accent-primary" />
                          <span className="text-xl font-bold text-neu-text-primary">
                            {formatUSDate(event.date)}
                          </span>
                        </div>

                        {/* Time */}
                        <div className="flex items-center gap-2 mb-2">
                          <MdAccessTime className="w-5 h-5 text-neu-text-secondary" />
                          <span className="text-neu-text-primary">
                            {formatTimeString(event.start_time)} - {formatTimeString(event.end_time)}
                          </span>
                        </div>

                        {/* Location */}
                        {event.location && (
                          <div className="flex items-center gap-2 mb-2">
                            <MdLocationOn className="w-5 h-5 text-neu-text-secondary" />
                            <span className="text-neu-text-primary">{event.location}</span>
                          </div>
                        )}

                        {/* Notes */}
                        {event.notes && (
                          <div className="mt-3 p-3 rounded-lg bg-neu-surface-light">
                            <p className="text-sm text-neu-text-primary">{event.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {canManage && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => router.push(`/productions/active-shows/${params.id}/rehearsals/${event.rehearsal_events_id}?edit=true`)}
                            className="neu-icon-btn"
                            title="Edit Event"
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.rehearsal_events_id)}
                            disabled={deleting === event.rehearsal_events_id}
                            className="neu-icon-btn hover:text-neu-accent-danger disabled:opacity-50"
                            title="Delete Event"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Rehearsal Form Modal */}
            {showAddForm && (
              <RehearsalEventForm
                auditionId={params.id as string}
                onSuccess={() => {
                  setShowAddForm(false);
                  loadData(); // Reload events
                }}
                onCancel={() => setShowAddForm(false)}
              />
            )}
          </div>
        </div>
      </StarryContainer>
    </ProtectedRoute>
  );
}
