'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getRehearsalEvent, updateRehearsalEvent } from '@/lib/supabase/rehearsalEvents';
import { getAgendaItems, deleteAgendaItem, removeAssignment, getCastMembers, assignMultipleCastMembers, getConflictSummary, getBatchConflictSummary } from '@/lib/supabase/agendaItems';
import { canManageRehearsalEvents } from '@/lib/supabase/rehearsalEvents';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Button from '@/components/Button';
import AgendaItemCard from '@/components/productions/AgendaItemCard';
import AgendaItemForm from '@/components/productions/AgendaItemForm';
import AssignCastMemberModal from '@/components/productions/AssignCastMemberModal';
import AddressInput from '@/components/ui/AddressInput';
import { MdArrowBack, MdAdd, MdLocationOn, MdAccessTime, MdCalendarToday, MdEdit, MdSave, MdClose, MdWarning } from 'react-icons/md';
import { formatUSDate } from '@/lib/utils/dateUtils';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import DownloadCallSheetButton from '@/components/productions/DownloadCallSheetButton';
import ConflictsModal from '@/components/productions/ConflictsModal';
import UserProfileModal from '@/components/casting/UserProfileModal';
import DailyConflictsDisplay from '@/components/productions/DailyConflictsDisplay';

function formatTimeString(timeString: string): string {
  if (!timeString) return '';

  if (timeString.includes('T')) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function RehearsalEventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [event, setEvent] = useState<any>(null);
  const [agendaItems, setAgendaItems] = useState<any[]>([]);
  const [castMembers, setCastMembers] = useState<any[]>([]);
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
    is_tech_rehearsal: false,
    location: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true,
  });
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [conflictData, setConflictData] = useState<any[]>([]);
  const [conflictCount, setConflictCount] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [eventConflicts, setEventConflicts] = useState<any[]>([]);
  const [showEventConflicts, setShowEventConflicts] = useState(true);

  useEffect(() => {
    loadData();
  }, [params.eventId]);

  const openModal = (
    title: string,
    message: string,
    onConfirmAction?: () => void,
    confirmText?: string,
    showCancelBtn: boolean = true
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn,
    });
  };

  useEffect(() => {
    if (searchParams.get('edit') === 'true' && canManage) {
      setIsEditingEvent(true);
    }
  }, [searchParams, canManage]);

  const loadData = async () => {
    setLoading(true);

    const { data: eventData } = await getRehearsalEvent(params.eventId as string);
    setEvent(eventData);

    if (eventData) {
      setEditFormData({
        date: eventData.date || '',
        start_time: eventData.start_time?.substring(0, 5) || '',
        end_time: eventData.end_time?.substring(0, 5) || '',
        is_tech_rehearsal: !!eventData.is_tech_rehearsal,
        location: eventData.location || '',
        notes: eventData.notes || '',
      });
    }

    const { data: itemsData } = await getAgendaItems(params.eventId as string);
    setAgendaItems(itemsData || []);

    if (eventData?.audition_id) {
      const { data: castData } = await getCastMembers(eventData.audition_id);
      setCastMembers(castData || []);
    } else {
      setCastMembers([]);
    }

    const { data: conflictsData } = await getConflictSummary(params.eventId as string);
    if (conflictsData) {
      setConflictData(conflictsData);
      const totalConflicts = conflictsData.reduce((sum: number, item: any) => sum + item.conflicts.length, 0);
      setConflictCount(totalConflicts);
    }

    // Load event conflicts using the working batch conflict system
    if (eventData && eventData.audition_id) {
      const eventDate = new Date(eventData.date);
      const { data: batchConflictsData } = await getBatchConflictSummary(
        eventData.audition_id,
        eventDate,
        eventDate
      );
      
      // Extract conflicts for this specific event
      const thisEventConflicts = (batchConflictsData && typeof batchConflictsData === 'object') 
        ? (batchConflictsData as Record<string, any[]>)[params.eventId as string] || []
        : [];
      setEventConflicts(thisEventConflicts);
    }

    if (eventData && eventData.audition_id) {
      const hasPermission = await canManageRehearsalEvents(eventData.audition_id);
      setCanManage(hasPermission);
    }

    setLoading(false);
  };

  const handleDeleteItem = async (itemId: string) => {
    const deleteAction = async () => {
      const { error } = await deleteAgendaItem(itemId);
      if (error) {
        openModal('Error', 'Failed to delete agenda item.', undefined, 'OK', false);
      } else {
        setAgendaItems(prev => prev.filter(item => item.rehearsal_agenda_items_id !== itemId));
      }
    };

    openModal('Confirm Deletion', 'Are you sure you want to delete this agenda item?', deleteAction, 'Delete');
  };

  const handleAssignAll = async (agendaItemId: string) => {
    if (!event?.audition_id) return;

    const { data: castData } = await getCastMembers(event.audition_id);
    if (!castData || castData.length === 0) {
      openModal('No Cast Members', 'No cast members were found for this production to assign.', undefined, 'OK', false);
      return;
    }

    const userIds = castData.map((member: any) => member.user_id);
    const { error } = await assignMultipleCastMembers(agendaItemId, userIds);

    if (error) {
      openModal('Error', 'Failed to assign all cast members.', undefined, 'OK', false);
    } else {
      loadData();
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const removeAction = async () => {
      const { error } = await removeAssignment(assignmentId);
      if (error) {
        openModal('Error', 'Failed to remove assignment.', undefined, 'OK', false);
      } else {
        loadData();
      }
    };

    openModal('Confirm Removal', 'Are you sure you want to remove this cast member from the agenda item?', removeAction, 'Remove');
  };

  const handleSaveEvent = async () => {
    setSaving(true);

    const { error } = await updateRehearsalEvent(params.eventId as string, {
      date: editFormData.date,
      start_time: editFormData.start_time + ':00',
      end_time: editFormData.end_time + ':00',
      is_tech_rehearsal: editFormData.is_tech_rehearsal,
      location: editFormData.location || undefined,
      notes: editFormData.notes || undefined,
    });

    setSaving(false);

    if (error) {
      openModal('Error', 'Failed to update rehearsal event.', undefined, 'OK', false);
      return;
    }

    setIsEditingEvent(false);
    router.push(`/productions/active-shows/${params.id}/scheduling/rehearsals/${params.eventId}`);
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
        <ConfirmationModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
          confirmButtonText={modalConfig.confirmButtonText}
          showCancel={modalConfig.showCancel}
        />
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => router.push(`/productions/active-shows/${params.id}/scheduling`)}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back to Production Schedule
            </button>

            <div className="neu-card-raised p-6 mb-6">
              {isEditingEvent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-neu-text-primary">Edit Rehearsal Event</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setIsEditingEvent(false);
                          router.push(`/productions/active-shows/${params.id}/scheduling/rehearsals/${params.eventId}`);
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

                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">Date *</label>
                    <input
                      type="date"
                      value={editFormData.date}
                      onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                      className="neu-input w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">Start Time *</label>
                      <input
                        type="time"
                        value={editFormData.start_time}
                        onChange={e => setEditFormData({ ...editFormData, start_time: e.target.value })}
                        className="neu-input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">End Time *</label>
                      <input
                        type="time"
                        value={editFormData.end_time}
                        onChange={e => setEditFormData({ ...editFormData, end_time: e.target.value })}
                        className="neu-input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <AddressInput
                      value={editFormData.location}
                      onChange={value => setEditFormData({ ...editFormData, location: value })}
                      label="Location"
                      placeholder="Rehearsal space, theater, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="neu-input w-full"
                      rows={4}
                      placeholder="Any additional information about this rehearsal..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="isTechRehearsal"
                      type="checkbox"
                      checked={editFormData.is_tech_rehearsal}
                      onChange={(e) => setEditFormData({ ...editFormData, is_tech_rehearsal: e.target.checked })}
                      className="neu-checkbox"
                    />
                    <label htmlFor="isTechRehearsal" className="text-sm text-neu-text-secondary">
                      Tech rehearsal
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MdCalendarToday className="w-6 h-6 text-neu-accent-primary" />
                      <h1 className="text-3xl font-bold text-neu-text-primary">{formatUSDate(event.date)}</h1>
                    </div>
                    {canManage && (
                      <div className="flex items-center gap-3">
                        <DownloadCallSheetButton
                          rehearsalEvent={{
                            date: event.date,
                            start_time: event.start_time,
                            end_time: event.end_time,
                            location: event.location,
                            notes: event.notes,
                          }}
                          showDetails={{
                            title: event.auditions?.shows?.title || 'Production',
                            author: event.auditions?.shows?.author,
                          }}
                          companyId={event.auditions?.company_id || null}
                          agendaItems={
                            (() => {
                              const castByUserId = new Map<string, any>();
                              (castMembers || []).forEach((m: any) => {
                                if (m?.user_id) castByUserId.set(m.user_id, m);
                              });

                              const getRoleNameForUser = (userId: string): string | undefined => {
                                const m = castByUserId.get(userId);
                                if (!m) return undefined;

                                const fromAuditionRole = m?.audition_roles?.role_name;
                                const fromRole = Array.isArray(m?.roles) ? m.roles?.[0]?.role_name : m?.roles?.role_name;
                                return fromAuditionRole || fromRole || undefined;
                              };

                              const getEmailForUser = (userId: string): string | undefined => {
                                const m = castByUserId.get(userId);
                                return m?.profiles?.email || undefined;
                              };

                              const getPhoneForUser = (userId: string): string | undefined => {
                                const m = castByUserId.get(userId);
                                return m?.profiles?.phone || undefined;
                              };

                              const getNameForUser = (userId: string): { first: string; last: string } => {
                                const m = castByUserId.get(userId);
                                return {
                                  first: m?.profiles?.first_name || '',
                                  last: m?.profiles?.last_name || '',
                                };
                              };

                              return agendaItems.map((item: any) => ({
                              title: item.title,
                              description: item.description,
                              start_time: item.start_time,
                              end_time: item.end_time,
                              assignments: (item.agenda_assignments || []).map((a: any) => ({
                                user_id: a.user_id,
                                first_name: getNameForUser(a.user_id).first || a.profiles?.first_name || '',
                                last_name: getNameForUser(a.user_id).last || a.profiles?.last_name || '',
                                email: getEmailForUser(a.user_id) || a.profiles?.email || '',
                                phone: getPhoneForUser(a.user_id) || a.profiles?.phone || undefined,
                                role_name: getRoleNameForUser(a.user_id) || undefined,
                              })),
                            }));
                            })()
                          }
                        />
                        <button onClick={() => setIsEditingEvent(true)} className="neu-icon-btn" title="Edit Event">
                          <MdEdit className="w-5 h-5" />
                        </button>
                      </div>
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

                  {/* Event Time Conflicts Display */}
                  {eventConflicts && eventConflicts.length > 0 && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 mb-2">
                        <MdWarning className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                          Event Time Conflicts ({eventConflicts.length})
                        </h3>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                        The following cast members have conflicts during this rehearsal time:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {eventConflicts.map((conflict, index) => (
                          <div key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                            <strong>{conflict.user?.full_name || 'Unknown User'}</strong>
                            {conflict.conflicts && conflict.conflicts.length > 0 && (
                              <span className="ml-2 text-xs">
                                ({conflict.conflicts.map((c: any) => c.event_title || c.title).join(', ')})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-neu-text-primary">Agenda</h2>
              {canManage && (
                <Button text="+ Add Agenda Item" onClick={() => setShowAddForm(true)} className="neu-button-primary" />
              )}
            </div>

            {agendaItems.length === 0 ? (
              <div className="neu-card-raised p-12 text-center">
                <p className="text-neu-text-secondary text-lg mb-4">No agenda items yet</p>
                {canManage && (
                  <Button text="Add First Item" onClick={() => setShowAddForm(true)} className="neu-button-primary" />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {agendaItems.map(item => (
                  <AgendaItemCard
                    key={item.rehearsal_agenda_items_id}
                    item={item}
                    canManage={canManage}
                    onEdit={() => setEditingItem(item)}
                    onDelete={() => handleDeleteItem(item.rehearsal_agenda_items_id)}
                    onAddAssignment={() => setAssigningToItem(item.rehearsal_agenda_items_id)}
                    onRemoveAssignment={handleRemoveAssignment}
                    onAssignAll={() => handleAssignAll(item.rehearsal_agenda_items_id)}
                    onAvatarClick={userId => setSelectedUserId(userId)}
                  />
                ))}
              </div>
            )}

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

            <ConflictsModal
              isOpen={showConflictsModal}
              onClose={() => setShowConflictsModal(false)}
              agendaItems={conflictData}
              formatTimeString={formatTimeString}
              onAvatarClick={userId => {
                setShowConflictsModal(false);
                setSelectedUserId(userId);
              }}
            />

            {selectedUserId && event && (
              <UserProfileModal
                userId={selectedUserId}
                auditionId={event.audition_id}
                onClose={() => setSelectedUserId(null)}
                onActionComplete={() => {
                  setSelectedUserId(null);
                  loadData();
                }}
              />
            )}
          </div>
        </div>
      </StarryContainer>
    </ProtectedRoute>
  );
}

export default function RehearsalEventDetailPage() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading rehearsal details...</div>
        </div>
      </StarryContainer>
    }>
      <RehearsalEventDetailPageContent />
    </Suspense>
  );
}
