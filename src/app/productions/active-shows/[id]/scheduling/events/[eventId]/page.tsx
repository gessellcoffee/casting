'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import Button from '@/components/Button';
import AddressInput from '@/components/ui/AddressInput';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import ConflictsModal from '@/components/productions/ConflictsModal';
import UserProfileModal from '@/components/casting/UserProfileModal';
import Avatar from '@/components/shared/Avatar';
import { MdArrowBack, MdEdit, MdSave, MdClose, MdWarning, MdDelete } from 'react-icons/md';
import { formatUSDate } from '@/lib/utils/dateUtils';
import { canManageRehearsalEvents } from '@/lib/supabase/rehearsalEvents';
import {
  deleteProductionEvent,
  getProductionEventTypes,
  setProductionEventAssignments,
  updateProductionEvent,
} from '@/lib/supabase/productionEvents';
import { getCastMembers } from '@/lib/supabase/agendaItems';
import { getProductionTeamMembers } from '@/lib/supabase/productionTeamMembers';
import { getAudition } from '@/lib/supabase/auditions';
import { getCompanyMembers } from '@/lib/supabase/companyMembers';
import { supabase } from '@/lib/supabase/client';
import { getProductionEventConflictSummary } from '@/lib/supabase/productionEventConflicts';

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

function ProductionEventDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const auditionId = params.id as string;
  const productionEventId = params.eventId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);

  const [event, setEvent] = useState<any>(null);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [castMembers, setCastMembers] = useState<any[]>([]);
  const [productionTeamMembers, setProductionTeamMembers] = useState<any[]>([]);
  const [companyMembers, setCompanyMembers] = useState<any[]>([]);

  const [selectedAssigneeUserIds, setSelectedAssigneeUserIds] = useState<string[]>([]);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeSearchDebounced, setAssigneeSearchDebounced] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    production_event_type_id: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    notes: '',
    assignToEntireCast: true,
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true,
  });

  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [conflictAgendaItems, setConflictAgendaItems] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setAssigneeSearchDebounced(assigneeSearch);
    }, 250);
    return () => clearTimeout(t);
  }, [assigneeSearch]);

  useEffect(() => {
    void loadData();
  }, [productionEventId]);

  useEffect(() => {
    if (searchParams.get('edit') === 'true' && canManage) {
      setIsEditing(true);
    }
  }, [searchParams, canManage]);

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

  const loadData = async () => {
    setLoading(true);

    const [types, cast, team, audition, hasPermission] = await Promise.all([
      getProductionEventTypes(),
      getCastMembers(auditionId).then(r => r.data || []),
      getProductionTeamMembers(auditionId),
      getAudition(auditionId),
      canManageRehearsalEvents(auditionId),
    ]);

    const companyId = audition?.company_id;
    const company = companyId ? await getCompanyMembers(companyId) : [];

    setEventTypes(types);
    setCastMembers(cast);
    setProductionTeamMembers(team || []);
    setCompanyMembers(company || []);
    setCanManage(hasPermission);

    const { data: eventData, error } = await supabase
      .from('production_events')
      .select(`
        *,
        production_event_types (*),
        production_event_assignments (
          production_event_assignment_id,
          user_id,
          profiles (
            id,
            first_name,
            last_name,
            profile_photo_url
          )
        )
      `)
      .eq('production_event_id', productionEventId)
      .single();

    if (error || !eventData) {
      openModal('Error', 'Production event not found.', () => router.push(`/productions/active-shows/${auditionId}/scheduling`), 'OK', false);
      setLoading(false);
      return;
    }

    setEvent(eventData);
    setForm({
      production_event_type_id: eventData.production_event_type_id || '',
      date: eventData.date || '',
      start_time: eventData.start_time ? String(eventData.start_time).substring(0, 5) : '',
      end_time: eventData.end_time ? String(eventData.end_time).substring(0, 5) : '',
      location: eventData.location || '',
      notes: eventData.notes || '',
      assignToEntireCast: false,
    });

    setSelectedAssigneeUserIds(
      (eventData.production_event_assignments || [])
        .map((a: any) => a.user_id)
        .filter(Boolean)
    );

    setLoading(false);
  };

  const assignedUserIds = useMemo(() => {
    const assigned = event?.production_event_assignments || [];
    return assigned.map((a: any) => a.user_id).filter(Boolean);
  }, [event]);

  const uniqueCastMembers = useMemo(() => {
    const membersMap = new Map<string, any>();
    (castMembers || []).forEach((member: any) => {
      const userId = member.user_id;
      if (!userId) return;

      let roleName = member.audition_roles?.role_name || member.roles?.role_name;
      if (roleName && member.is_understudy) {
        roleName += ' (Understudy)';
      }

      if (membersMap.has(userId)) {
        const existing = membersMap.get(userId);
        if (roleName && Array.isArray(existing.roles) && !existing.roles.includes(roleName)) {
          existing.roles.push(roleName);
        }
        membersMap.set(userId, existing);
      } else {
        membersMap.set(userId, {
          ...member,
          roles: roleName ? [roleName] : [],
        });
      }
    });

    return Array.from(membersMap.values());
  }, [castMembers]);

  const assigneePool = useMemo(() => {
    type Assignee = {
      user_id: string;
      profiles: any;
      labels: string[];
    };

    const byUserId = new Map<string, Assignee>();

    (uniqueCastMembers || []).forEach((member: any) => {
      const userId = member.user_id;
      if (!userId) return;

      const fullName = `${member?.profiles?.first_name || ''} ${member?.profiles?.last_name || ''}`.trim();
      const roles = Array.isArray(member.roles) ? member.roles.filter(Boolean) : [];

      byUserId.set(userId, {
        user_id: userId,
        profiles: member.profiles,
        labels: roles.length > 0 ? roles : [fullName ? 'Cast' : 'Cast'],
      });
    });

    (productionTeamMembers || []).forEach((m: any) => {
      const userId = m.user_id;
      if (!userId || !m.profiles) return;

      const label = m.role_title ? `Production: ${m.role_title}` : 'Production Team';
      const existing = byUserId.get(userId);

      if (existing) {
        if (!existing.labels.includes(label)) {
          existing.labels.push(label);
        }
        if (!existing.profiles) {
          existing.profiles = m.profiles;
        }
        byUserId.set(userId, existing);
      } else {
        byUserId.set(userId, {
          user_id: userId,
          profiles: m.profiles,
          labels: [label],
        });
      }
    });

    (companyMembers || []).forEach((m: any) => {
      const userId = m.user_id;
      const profile = m.profiles;
      if (!userId || !profile) return;

      const label = m.role ? `Company: ${m.role}` : 'Company Member';
      const existing = byUserId.get(userId);

      if (existing) {
        if (!existing.labels.includes(label)) {
          existing.labels.push(label);
        }
        if (!existing.profiles) {
          existing.profiles = profile;
        }
        byUserId.set(userId, existing);
      } else {
        byUserId.set(userId, {
          user_id: userId,
          profiles: profile,
          labels: [label],
        });
      }
    });

    return Array.from(byUserId.values()).sort((a, b) => {
      const aLast = (a?.profiles?.last_name || '').toLowerCase();
      const bLast = (b?.profiles?.last_name || '').toLowerCase();
      return aLast.localeCompare(bLast);
    });
  }, [companyMembers, productionTeamMembers, uniqueCastMembers]);

  const filteredCastMembers = useMemo(() => {
    const q = assigneeSearchDebounced.trim().toLowerCase();
    if (!q) return assigneePool;
    return assigneePool.filter((member: any) => {
      const fullName = `${member?.profiles?.first_name || ''} ${member?.profiles?.last_name || ''}`.trim().toLowerCase();
      return fullName.includes(q);
    });
  }, [assigneePool, assigneeSearchDebounced]);

  const showTitle = event?.production_event_types?.name || 'Production Event';

  const handleSave = async () => {
    if (!canManage) return;
    setSaving(true);

    const start = form.start_time ? `${form.start_time}:00` : null;
    const end = form.end_time ? `${form.end_time}:00` : null;

    const { error: updateError } = await updateProductionEvent(productionEventId, {
      production_event_type_id: form.production_event_type_id,
      date: form.date,
      start_time: start,
      end_time: end,
      location: form.location || null,
      notes: form.notes || null,
    });

    if (updateError) {
      setSaving(false);
      openModal('Error', updateError.message || 'Failed to update event.', undefined, 'OK', false);
      return;
    }

    const userIdsToAssign = form.assignToEntireCast
      ? (uniqueCastMembers || []).map((m: any) => m.user_id).filter(Boolean)
      : selectedAssigneeUserIds;

    const { error: assignError } = await setProductionEventAssignments(productionEventId, userIdsToAssign);
    if (assignError) {
      setSaving(false);
      openModal('Error', assignError.message || 'Event updated, but failed to update assignments.', undefined, 'OK', false);
      return;
    }

    setSaving(false);
    setIsEditing(false);
    router.replace(`/productions/active-shows/${auditionId}/scheduling/events/${productionEventId}`);
    loadData();
  };

  const handleDelete = async () => {
    if (!canManage) return;

    openModal(
      'Delete Event',
      'Are you sure you want to delete this production event?',
      async () => {
        const { error } = await deleteProductionEvent(productionEventId);
        if (error) {
          openModal('Error', error.message || 'Failed to delete event.', undefined, 'OK', false);
          return;
        }
        router.push(`/productions/active-shows/${auditionId}/scheduling`);
      },
      'Delete'
    );
  };

  const openConflicts = async () => {
    const { data } = await getProductionEventConflictSummary(productionEventId);
    setConflictAgendaItems(data || []);
    setShowConflictsModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <StarryContainer>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-neu-text-primary">Loading event...</div>
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
            <div className="text-neu-text-primary">Event not found</div>
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
              onClick={() => router.push(`/productions/active-shows/${auditionId}/scheduling`)}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back to Production Schedule
            </button>

            <div className="neu-card-raised p-6 mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h1 className="text-3xl font-bold text-neu-text-primary">{showTitle}</h1>
                  <p className="text-neu-text-secondary mt-1">{formatUSDate(new Date(event.date))}</p>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={openConflicts}
                          className="neu-button-secondary flex items-center gap-2"
                          title="View Conflicts"
                        >
                          <MdWarning className="w-5 h-5" />
                          View Conflicts
                        </button>
                        <button onClick={() => setIsEditing(true)} className="neu-icon-btn" title="Edit Event">
                          <MdEdit className="w-5 h-5" />
                        </button>
                        <button onClick={handleDelete} className="neu-icon-btn" title="Delete Event">
                          <MdDelete className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            router.replace(`/productions/active-shows/${auditionId}/scheduling/events/${productionEventId}`);
                          }}
                          className="neu-button-secondary flex items-center gap-2"
                          disabled={saving}
                        >
                          <MdClose className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          className="neu-button-primary flex items-center gap-2"
                          disabled={saving}
                        >
                          <MdSave className="w-4 h-4" />
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <>
                  {(event.start_time || event.end_time) && (
                    <p className="text-neu-text-primary">
                      {formatTimeString(event.start_time || '')}
                      {event.end_time ? ` - ${formatTimeString(event.end_time)}` : ''}
                    </p>
                  )}
                  {event.location && <p className="text-neu-text-secondary mt-1">📍 {event.location}</p>}
                  {event.notes && <div className="mt-4 p-4 rounded-lg bg-neu-surface-light"><p className="text-sm text-neu-text-primary">{event.notes}</p></div>}

                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-neu-text-primary mb-2">Assigned</h2>
                    {assignedUserIds.length === 0 ? (
                      <p className="text-sm text-neu-text-secondary">No one assigned yet.</p>
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        {(event.production_event_assignments || []).map((a: any) => (
                          <Avatar
                            key={a.production_event_assignment_id}
                            src={a.profiles?.profile_photo_url}
                            alt={`${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim()}
                            size="sm"
                            onClick={() => setSelectedUserId(a.user_id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">Event Type *</label>
                    <select
                      value={form.production_event_type_id}
                      onChange={e => setForm({ ...form, production_event_type_id: e.target.value })}
                      className="neu-input w-full"
                    >
                      {eventTypes.map((t: any) => (
                        <option key={t.production_event_type_id} value={t.production_event_type_id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({ ...form, date: e.target.value })}
                      className="neu-input w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">Start Time</label>
                      <input
                        type="time"
                        value={form.start_time}
                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                        className="neu-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neu-text-secondary mb-2">End Time</label>
                      <input
                        type="time"
                        value={form.end_time}
                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                        className="neu-input w-full"
                      />
                    </div>
                  </div>

                  <AddressInput
                    value={form.location}
                    onChange={value => setForm({ ...form, location: value })}
                    label="Location"
                    placeholder="Location"
                  />

                  <div>
                    <label className="block text-sm font-medium text-neu-text-secondary mb-2">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="neu-input w-full"
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="assignToEntireCast"
                      type="checkbox"
                      checked={form.assignToEntireCast}
                      onChange={e => setForm({ ...form, assignToEntireCast: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label htmlFor="assignToEntireCast" className="text-sm text-neu-text-primary">
                      Assign to entire cast
                    </label>
                  </div>

                  {!form.assignToEntireCast && (
                    <div className="mt-2">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-neu-text-secondary mb-2">
                            Assign specific people
                          </label>
                          <input
                            type="text"
                            value={assigneeSearch}
                            onChange={e => setAssigneeSearch(e.target.value)}
                            placeholder="Search cast members..."
                            className="neu-input w-full"
                          />
                        </div>

                        <div className="pt-8 text-sm text-neu-text-secondary whitespace-nowrap">
                          {selectedAssigneeUserIds.length} selected
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-neu-surface-light">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={
                                filteredCastMembers.length > 0 &&
                                filteredCastMembers.every((m: any) => selectedAssigneeUserIds.includes(m.user_id))
                              }
                              onChange={e => {
                                if (e.target.checked) {
                                  const visibleIds = filteredCastMembers.map((m: any) => m.user_id).filter(Boolean);
                                  setSelectedAssigneeUserIds(prev => Array.from(new Set([...prev, ...visibleIds])));
                                } else {
                                  const visibleIds = new Set(filteredCastMembers.map((m: any) => m.user_id));
                                  setSelectedAssigneeUserIds(prev => prev.filter(id => !visibleIds.has(id)));
                                }
                              }}
                              className="neu-checkbox"
                            />
                            <span className="text-sm text-neu-text-secondary">Select all visible</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedAssigneeUserIds([])}
                            className="text-sm text-neu-accent-primary hover:text-neu-accent-secondary transition-colors"
                          >
                            Clear
                          </button>
                        </div>

                        {filteredCastMembers.length === 0 ? (
                          <div className="text-sm text-neu-text-secondary p-3">No cast members match your search.</div>
                        ) : (
                          filteredCastMembers.map((member: any) => {
                            const fullName = `${member?.profiles?.first_name || ''} ${member?.profiles?.last_name || ''}`.trim();
                            const isChecked = selectedAssigneeUserIds.includes(member.user_id);
                            return (
                              <button
                                type="button"
                                key={member.user_id}
                                onClick={() => {
                                  setSelectedAssigneeUserIds(prev =>
                                    isChecked ? prev.filter(id => id !== member.user_id) : [...prev, member.user_id]
                                  );
                                }}
                                className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-lg neu-card-raised hover:shadow-neu-raised-lg transition-all"
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="neu-checkbox"
                                  />
                                  <Avatar
                                    src={member?.profiles?.profile_photo_url}
                                    alt={fullName}
                                    size="sm"
                                  />
                                  <div>
                                    <div className="font-medium text-neu-text-primary">{fullName}</div>
                                    {Array.isArray(member.labels) && member.labels.length > 0 && (
                                      <div className="text-sm text-neu-text-secondary">{member.labels.join(', ')}</div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <ConflictsModal
          isOpen={showConflictsModal}
          onClose={() => setShowConflictsModal(false)}
          title="Event Conflicts"
          agendaItems={conflictAgendaItems}
          formatTimeString={formatTimeString}
          onAvatarClick={userId => {
            setShowConflictsModal(false);
            setSelectedUserId(userId);
          }}
        />

        {selectedUserId && (
          <UserProfileModal
            userId={selectedUserId}
            auditionId={auditionId}
            onClose={() => setSelectedUserId(null)}
            onActionComplete={() => {
              setSelectedUserId(null);
              loadData();
            }}
          />
        )}
      </StarryContainer>
    </ProtectedRoute>
  );
}

export default function ProductionEventDetailPage() {
  return (
    <Suspense fallback={
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading event details...</div>
        </div>
      </StarryContainer>
    }>
      <ProductionEventDetailPageContent />
    </Suspense>
  );
}
