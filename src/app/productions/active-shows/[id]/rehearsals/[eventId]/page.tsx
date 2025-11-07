'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getRehearsalEvent, updateRehearsalEvent } from '@/lib/supabase/rehearsalEvents';
import { getAgendaItems, deleteAgendaItem, removeAssignment, getCastMembers, assignMultipleCastMembers } from '@/lib/supabase/agendaItems';
import { canManageRehearsalEvents } from '@/lib/supabase/rehearsalEvents';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Button from '@/components/Button';
import AgendaItemCard from '@/components/productions/AgendaItemCard';
import AgendaItemForm from '@/components/productions/AgendaItemForm';
import AssignCastMemberModal from '@/components/productions/AssignCastMemberModal';
import AddressInput from '@/components/ui/AddressInput';
import { MdArrowBack, MdAdd, MdLocationOn, MdAccessTime, MdCalendarToday, MdEdit, MdSave, MdClose } from 'react-icons/md';
import { formatUSDate } from '@/lib/utils/dateUtils';

// Helper function to format time string (HH:MM:SS) to 12-hour format
function formatTimeString(timeString: string): string {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

export default function RehearsalEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [assigningToItem, setAssigningToItem] = useState<string | null>(null);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editFormData, setEditFormData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [params.eventId]);

  useEffect(() => {
    // Check if edit query param is present
    if (searchParams.get('edit') === 'true' && canManage) {
      setIsEditingEvent(true);
    }
  }, [searchParams, canManage]);

  const loadData = async () => {
    setLoading(true);

    // Load rehearsal event
    const { data: eventData } = await getRehearsalEvent(params.eventId as string);
    setEvent(eventData);

    // Populate edit form data
    if (eventData) {
      setEditFormData({
        date: eventData.date || '',
        start_time: eventData.start_time?.substring(0, 5) || '', // HH:MM format
        end_time: eventData.end_time?.substring(0, 5) || '', // HH:MM format
        location: eventData.location || '',
        notes: eventData.notes || '',
      });
    }

    // Load agenda items
    const { data: itemsData } = await getAgendaItems(params.eventId as string);
    setAgendaItems(itemsData || []);

    // Check permissions
    if (eventData && eventData.audition_id) {
      const hasPermission = await canManageRehearsalEvents(eventData.audition_id);
      setCanManage(hasPermission);
    }

    setLoading(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this agenda item?')) {
      return;
    }

    const { error } = await deleteAgendaItem(itemId);
    if (error) {
      alert('Failed to delete agenda item');
    } else {
      setAgendaItems(prev => prev.filter(item => item.rehearsal_agenda_items_id !== itemId));
    }
  };

  const handleAssignAll = async (agendaItemId: string) => {
    if (!event?.audition_id) return;

    const { data: castData } = await getCastMembers(event.audition_id);
    if (!castData || castData.length === 0) {
      alert('No cast members found to assign.');
      return;
    }

    const userIds = castData.map(member => member.user_id);
    const { error } = await assignMultipleCastMembers(agendaItemId, userIds);

    if (error) {
      alert('Failed to assign all cast members.');
    } else {
      loadData(); // Reload to show new assignments
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this cast member from the agenda item?')) {
      return;
    }

    const { error } = await removeAssignment(assignmentId);
    if (error) {
      alert('Failed to remove assignment');
    } else {
      loadData(); // Reload to update assignments
    }
  };

  const handleSaveEvent = async () => {
    setSaving(true);

    const { error } = await updateRehearsalEvent(params.eventId as string, {
      date: editFormData.date,
      start_time: editFormData.start_time + ':00', // Add seconds
      end_time: editFormData.end_time + ':00', // Add seconds
      location: editFormData.location || undefined,
      notes: editFormData.notes || undefined,
    });

    setSaving(false);

    if (error) {
      alert('Failed to update rehearsal event');
      return;
    }

    setIsEditingEvent(false);
    // Remove edit query param
    router.push(`/productions/active-shows/${params.id}/rehearsals/${params.eventId}`);
    loadData();
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <StarryContainer>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-neu-text-primary">Loading rehearsal details...</div>
          </div>
        </StarryContainer>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <StarryContainer>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-neu-text-primary">Rehearsal event not found</div>
          </div>
        </StarryContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <StarryContainer>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.push(`/productions/active-shows/${params.id}/rehearsals`)}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back to Rehearsal Schedule
            </button>

            {/* Event Header */}
            <div className="neu-card-raised p-6 mb-6">
              {isEditingEvent ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-neu-text-primary">Edit Rehearsal Event</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditingEvent(false);
                          router.push(`/productions/active-shows/${params.id}/rehearsals/${params.eventId}`);
                        }}
                        className="neu-button-secondary flex items-center gap-2"
                        disabled={saving}
                      >
                        <MdClose className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEvent}
                        disabled={saving}
                        className="neu-button-primary flex items-center gap-2"
                      >
                        <MdSave className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="neu-input w-full"
                      required
                    />
                  </div>

                  {/* Time Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={editFormData.start_time}
                        onChange={(e) => setEditFormData({ ...editFormData, start_time: e.target.value })}
                        className="neu-input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={editFormData.end_time}
                        onChange={(e) => setEditFormData({ ...editFormData, end_time: e.target.value })}
                        className="neu-input w-full"
                        required
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <AddressInput
                      value={editFormData.location}
                      onChange={(value) => setEditFormData({ ...editFormData, location: value })}
                      label="Location"
                      placeholder="Rehearsal space, theater, etc."
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="neu-input w-full"
                      rows={4}
                      placeholder="Any additional information about this rehearsal..."
                    />
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MdCalendarToday className="w-6 h-6 text-neu-accent-primary" />
                      <h1 className="text-3xl font-bold text-neu-text-primary">
                        {formatUSDate(event.date)}
                      </h1>
                    </div>
                    {canManage && (
                      <button
                        onClick={() => setIsEditingEvent(true)}
                        className="neu-icon-btn"
                        title="Edit Event"
                      >
                        <MdEdit className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <MdAccessTime className="w-5 h-5 text-neu-text-secondary" />
                    <span className="text-lg text-neu-text-primary">
                      {formatTimeString(event.start_time)} - {formatTimeString(event.end_time)}
                    </span>
                  </div>

                  {event.location && (
                    <div className="flex items-center gap-2 mb-2">
                      <MdLocationOn className="w-5 h-5 text-neu-text-secondary" />
                      <span className="text-neu-text-primary">{event.location}</span>
                    </div>
                  )}

                  {event.notes && (
                    <div className="mt-4 p-4 rounded-lg bg-neu-surface-light">
                      <p className="text-sm text-neu-text-primary">{event.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Agenda Section */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neu-text-primary">Agenda</h2>
              {canManage && (
                <Button
                  text="+ Add Agenda Item"
                  onClick={() => setShowAddForm(true)}
                  className="neu-button-primary"
                />
              )}
            </div>

            {/* Agenda Items */}
            {agendaItems.length === 0 ? (
              <div className="neu-card-raised p-12 text-center">
                <p className="text-neu-text-secondary text-lg mb-4">
                  No agenda items yet
                </p>
                {canManage && (
                  <Button
                    text="Add First Item"
                    onClick={() => setShowAddForm(true)}
                    className="neu-button-primary"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {agendaItems.map((item) => (
                  <AgendaItemCard
                    key={item.rehearsal_agenda_items_id}
                    item={item}
                    canManage={canManage}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDeleteItem(item.rehearsal_agenda_items_id)}
                    onAddAssignment={() => setAssigningToItem(item.rehearsal_agenda_items_id)}
                    onRemoveAssignment={handleRemoveAssignment}
                    onAssignAll={() => handleAssignAll(item.rehearsal_agenda_items_id)}
                  />
                ))}
              </div>
            )}

            {/* Add/Edit Form */}
            {(showAddForm || editingItem) && event && (
              <AgendaItemForm
                rehearsalEventId={params.eventId as string}
                rehearsalStartTime={event.start_time}
                rehearsalEndTime={event.end_time}
                existingItem={editingItem}
                nextOrderIndex={agendaItems.length}
                onSuccess={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  loadData();
                }}
                onCancel={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                }}
              />
            )}

            {/* Assignment Modal */}
            {assigningToItem && event && (
              <AssignCastMemberModal
                isOpen={!!assigningToItem}
                agendaItemId={assigningToItem}
                auditionId={event.audition_id}
                existingAssignments={
                  agendaItems
                    .find(item => item.rehearsal_agenda_items_id === assigningToItem)
                    ?.agenda_assignments?.map((a: any) => a.user_id) || []
                }
                onSuccess={() => {
                  setAssigningToItem(null);
                  loadData();
                }}
                onCancel={() => setAssigningToItem(null)}
              />
            )}
          </div>
        </div>
      </StarryContainer>
    </ProtectedRoute>
  );
}
