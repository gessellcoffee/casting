'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { canManageRehearsalEvents, deleteRehearsalEvent, getRehearsalEventsWithAgenda } from '@/lib/supabase/rehearsalEvents';
import { getBatchConflictSummary } from '@/lib/supabase/agendaItems';
import { getDailyConflictsForAudition } from '@/lib/supabase/dailyConflicts';
import { getUser } from '@/lib/supabase';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import Button from '@/components/Button';
import Avatar from '@/components/shared/Avatar';
import ConflictsModal from '@/components/productions/ConflictsModal';
import DailyConflictsDisplay from '@/components/productions/DailyConflictsDisplay';
import DownloadShowPDFButton from '@/components/shows/DownloadShowPDFButton';
import { MdAdd, MdEdit, MdDelete, MdLocationOn, MdAccessTime, MdCalendarToday, MdArrowBack, MdChevronLeft, MdChevronRight, MdWarning, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { formatUSDate, isToday } from '@/lib/utils/dateUtils';
import type { RehearsalEvent } from '@/lib/supabase/types';
import type { ProductionDateEvent } from '@/lib/utils/calendarEvents';
import ConfirmationModal from '@/components/shared/ConfirmationModal';
import SchedulingModal from '@/components/productions/SchedulingModal';
import { deleteProductionEvent, getProductionEvents } from '@/lib/supabase/productionEvents';
import { getProductionEventConflictSummary } from '@/lib/supabase/productionEventConflicts';

 type RehearsalEventWithAgenda = RehearsalEvent & {
   rehearsal_agenda_items?: any[];
 };

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

export default function SchedulingPage() {
  const params = useParams();
  const router = useRouter();
  const [audition, setAudition] = useState<any>(null);
  const [rehearsalEvents, setRehearsalEvents] = useState<RehearsalEventWithAgenda[]>([]);
  const [productionEvents, setProductionEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [conflicts, setConflicts] = useState<Record<string, any[]>>({});
  const [dailyConflicts, setDailyConflicts] = useState<Record<string, any>>({});
  const [loadingConflicts, setLoadingConflicts] = useState(false);
  const [loadingDailyConflicts, setLoadingDailyConflicts] = useState(false);
  const [showConflicts, setShowConflicts] = useState(true);
  const [selectedConflictEvent, setSelectedConflictEvent] = useState<string | null>(null);
  const [selectedProductionConflictEvent, setSelectedProductionConflictEvent] = useState<string | null>(null);
  const [productionConflictAgendaItems, setProductionConflictAgendaItems] = useState<any[]>([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true,
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

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

    const { data: auditionData, error: auditionError } = await getAuditionById(params.id as string);
    if (auditionError || !auditionData) {
      openModal('Error', 'Error loading audition. Redirecting to dashboard.', () => router.push('/cast'), 'OK', false);
      return;
    }
    setAudition(auditionData);

    const { data: eventsData } = await getRehearsalEventsWithAgenda(params.id as string);
    setRehearsalEvents((eventsData as any) || []);

    const productionEventsData = await getProductionEvents(params.id as string);
    setProductionEvents(productionEventsData || []);

    const hasPermission = await canManageRehearsalEvents(params.id as string);
    setCanManage(hasPermission);

    setLoading(false);
  };

  const handleDelete = async (eventId: string) => {
    const deleteAction = async () => {
      setDeleting(eventId);
      const { error } = await deleteRehearsalEvent(eventId);
      if (error) {
        openModal('Error', 'Failed to delete rehearsal event.', undefined, 'OK', false);
      } else {
        setRehearsalEvents(prev => prev.filter(e => e.rehearsal_events_id !== eventId));
      }
      setDeleting(null);
    };

    openModal('Confirm Deletion', 'Are you sure you want to delete this rehearsal event?', deleteAction, 'Delete');
  };

  const handleDeleteProductionEvent = async (productionEventId: string) => {
    const deleteAction = async () => {
      setDeleting(productionEventId);
      const { error } = await deleteProductionEvent(productionEventId);
      if (error) {
        openModal('Error', error.message || 'Failed to delete production event.', undefined, 'OK', false);
      } else {
        setProductionEvents(prev => prev.filter(e => e.production_event_id !== productionEventId));
      }
      setDeleting(null);
    };

    openModal('Confirm Deletion', 'Are you sure you want to delete this event?', deleteAction, 'Delete');
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from({ length: startingDayOfWeek }, (_, i) => ({
      date: prevMonthLastDay - startingDayOfWeek + i + 1,
      isCurrentMonth: false,
      fullDate: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
    }));

    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: true,
      fullDate: new Date(year, month, i + 1),
    }));

    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
      date: i + 1,
      isCurrentMonth: false,
      fullDate: new Date(year, month + 1, i + 1),
    }));

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);

  useEffect(() => {
    if (calendarDays.length > 0 && params.id) {
      loadConflicts();
      loadDailyConflicts();
    }
  }, [calendarDays, params.id]);

  const loadConflicts = async () => {
    if (!calendarDays.length) return;

    setLoadingConflicts(true);
    const startDate = calendarDays[0].fullDate;
    const endDate = calendarDays[calendarDays.length - 1].fullDate;

    const { data } = await getBatchConflictSummary(params.id as string, startDate, endDate);

    if (data) {
      setConflicts(prev => ({ ...prev, ...data }));
    }
    setLoadingConflicts(false);
  };

  const loadDailyConflicts = async () => {
    if (!calendarDays.length) return;

    setLoadingDailyConflicts(true);
    const startDate = calendarDays[0].fullDate;
    const endDate = calendarDays[calendarDays.length - 1].fullDate;

    const { data } = await getDailyConflictsForAudition(params.id as string, startDate, endDate);

    if (data) {
      setDailyConflicts(data);
    }
    setLoadingDailyConflicts(false);
  };

  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const pdfEvents = useMemo((): ProductionDateEvent[] => {
    const showTitle = audition?.show?.title || 'Production';
    const showAuthor = audition?.show?.author;

    const rehearsalPdfEvents: ProductionDateEvent[] = (rehearsalEvents || []).map((e: any) => {
      const baseDate = parseLocalDate(e.date);
      const [sh, sm] = String(e.start_time || '00:00').split(':');
      const [eh, em] = String(e.end_time || '00:00').split(':');

      const agendaItems = Array.isArray(e?.rehearsal_agenda_items) ? e.rehearsal_agenda_items : [];
      const agendaLines: string[] = [];
      agendaItems.forEach((item: any) => {
        const start = item?.start_time ? formatTimeString(item.start_time) : '';
        const end = item?.end_time ? formatTimeString(item.end_time) : '';
        const timeLabel = start && end ? `${start}-${end}` : start || end;

        const assignments = Array.isArray(item?.agenda_assignments) ? item.agenda_assignments : [];
        const calledNames = assignments
          .map((a: any) => {
            const first = a?.profiles?.first_name || '';
            const last = a?.profiles?.last_name || '';
            return `${first} ${last}`.trim();
          })
          .filter(Boolean);

        const calledLabel = calledNames.length > 0 ? `Called: ${calledNames.join(', ')}` : 'Called: (none)';
        agendaLines.push(`${timeLabel} ${item?.title || 'Agenda Item'} — ${calledLabel}`.trim());
      });

      const agendaDescription = agendaLines.length > 0 ? `Agenda:\n${agendaLines.map((l) => `- ${l}`).join('\n')}` : undefined;

      const startTime = new Date(baseDate);
      startTime.setHours(parseInt(sh, 10), parseInt(sm, 10), 0);

      const endTime = new Date(baseDate);
      endTime.setHours(parseInt(eh, 10), parseInt(em, 10), 0);

      return {
        type: 'rehearsal_event',
        title: `${showTitle} - ${e.is_tech_rehearsal ? 'Tech Rehearsal' : 'Rehearsal'}`,
        show: { title: showTitle, author: showAuthor },
        date: startTime,
        startTime,
        endTime,
        location: e.location || null,
        auditionId: params.id as string,
        userRole: 'production_team',
        eventId: e.rehearsal_events_id,
        notes: e.notes,
        description: agendaDescription,
      } as any;
    });

    const rehearsalAgendaItemEvents: ProductionDateEvent[] = (rehearsalEvents || []).flatMap((e: any) => {
      const agendaItems = Array.isArray(e?.rehearsal_agenda_items) ? e.rehearsal_agenda_items : [];
      if (agendaItems.length === 0) return [];

      const baseDate = parseLocalDate(e.date);

      return agendaItems.map((item: any) => {
        let startTime: Date | undefined;
        let endTime: Date | undefined;

        if (item?.start_time) {
          const [h, m] = String(item.start_time).split(':');
          startTime = new Date(baseDate);
          startTime.setHours(parseInt(h, 10), parseInt(m, 10), 0);
        }

        if (item?.end_time) {
          const [h, m] = String(item.end_time).split(':');
          endTime = new Date(baseDate);
          endTime.setHours(parseInt(h, 10), parseInt(m, 10), 0);
        }

        const assignments = Array.isArray(item?.agenda_assignments) ? item.agenda_assignments : [];
        const calledNames = assignments
          .map((a: any) => {
            const first = a?.profiles?.first_name || '';
            const last = a?.profiles?.last_name || '';
            return `${first} ${last}`.trim();
          })
          .filter(Boolean);

        const calledLabel = calledNames.length > 0 ? `Called: ${calledNames.join(', ')}` : 'Called: (none)';

        return {
          type: 'agenda_item',
          title: item?.title || 'Agenda Item',
          show: { title: showTitle, author: showAuthor },
          date: startTime || new Date(baseDate),
          startTime,
          endTime,
          location: e.location || null,
          auditionId: params.id as string,
          userRole: 'production_team',
          eventId: e.rehearsal_events_id,
          agendaItemId: item?.rehearsal_agenda_items_id,
          description: calledLabel,
        } as any;
      });
    });

    const productionPdfEvents: ProductionDateEvent[] = (productionEvents || []).map((e: any) => {
      const baseDate = parseLocalDate(e.date);

      let startTime: Date | undefined;
      let endTime: Date | undefined;

      if (e.start_time) {
        const [sh, sm] = String(e.start_time).split(':');
        startTime = new Date(baseDate);
        startTime.setHours(parseInt(sh, 10), parseInt(sm, 10), 0);
      }

      if (e.end_time) {
        const [eh, em] = String(e.end_time).split(':');
        endTime = new Date(baseDate);
        endTime.setHours(parseInt(eh, 10), parseInt(em, 10), 0);
      }

      const typeName = e.production_event_types?.name || 'Production Event';

      return {
        type: 'production_event',
        title: `${showTitle} - ${typeName}`,
        show: { title: showTitle, author: showAuthor },
        date: startTime || baseDate,
        startTime,
        endTime,
        location: e.location || null,
        auditionId: params.id as string,
        userRole: 'production_team',
        productionEventId: e.production_event_id,
        eventTypeName: typeName,
        eventTypeColor: e.production_event_types?.color || null,
        notes: e.notes,
      } as any;
    });

    return [...rehearsalPdfEvents, ...rehearsalAgendaItemEvents, ...productionPdfEvents];
  }, [audition?.show?.author, audition?.show?.title, params.id, productionEvents, rehearsalEvents]);

  const rehearsalsByDate = useMemo(() => {
    const grouped: Record<string, RehearsalEvent[]> = {};
    rehearsalEvents.forEach(event => {
      const eventDate = parseLocalDate(event.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [rehearsalEvents]);

  const getRehearsalsForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return rehearsalsByDate[dateKey] || [];
  };

  const periodDisplay = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const handleDayClick = (date: Date) => {
    if (!canManage) return;
    setSelectedDate(date);
    setShowSchedulingModal(true);
  };

  const openProductionConflicts = async (productionEventId: string) => {
    setLoadingConflicts(true);
    const { data } = await getProductionEventConflictSummary(productionEventId);
    setProductionConflictAgendaItems(data || []);
    setSelectedProductionConflictEvent(productionEventId);
    setLoadingConflicts(false);
  };

  const productionEventsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    productionEvents.forEach((event: any) => {
      const eventDate = parseLocalDate(event.date);
      const key = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(event);
    });
    return grouped;
  }, [productionEvents]);

  const getProductionEventsForDate = (date: Date) => {
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return productionEventsByDate[dateKey] || [];
  };

  const getDailyConflictsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    return dailyConflicts[dateStr] || null;
  };

  const getProductionEventStartTimeLabel = (event: any): string => {
    if (!event?.start_time) return '';
    return formatTimeString(event.start_time);
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
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.push('/cast')}
              className="mb-6 text-neu-accent-primary hover:text-neu-accent-secondary transition-colors flex items-center gap-2"
            >
              <MdArrowBack className="w-5 h-5" />
              Back to Productions
            </button>

            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-4xl font-bold text-neu-text-primary">Production Schedule</h1>
                    <WorkflowStatusBadge status={audition.workflow_status} />
                  </div>
                  <h2 className="text-2xl text-neu-text-secondary">{audition.show?.title || 'Untitled Show'}</h2>
                  {audition.company && <p className="text-neu-text-secondary mt-1">{audition.company.name}</p>}
                </div>

                <div className="shrink-0">
                  <DownloadShowPDFButton
                    events={pdfEvents}
                    showDetails={{
                      title: audition.show?.title || 'Production',
                      author: audition.show?.author,
                      workflowStatus: audition.workflow_status,
                    }}
                    actorName="Production Team"
                    format="production"
                  />
                </div>
              </div>
            </div>

            <div className="calendar-container rounded-xl">
              <div className="calendar-header-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-semibold text-neu-text-primary">{periodDisplay}</h2>
                    {loadingConflicts && (
                      <span className="text-xs text-neu-text-secondary animate-pulse">Checking conflicts...</span>
                    )}
                  </div>

                  {canManage && (
                    <Button
                      text="+ Add Event"
                      onClick={() => {
                        setSelectedDate(new Date());
                        setShowSchedulingModal(true);
                      }}
                      className="neu-button-primary"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 justify-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevious}
                      className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200"
                      aria-label="Previous"
                    >
                      <MdChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleToday}
                      className="px-3 sm:px-4 py-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Today
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-2 rounded-lg bg-neu-surface border border-neu-border-focus text-neu-text-primary shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] hover:text-neu-accent-primary transition-all duration-200"
                      aria-label="Next"
                    >
                      <MdChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Conflicts Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowConflicts(!showConflicts)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 text-sm font-medium ${
                        showConflicts
                          ? 'bg-neu-accent-primary border-neu-accent-primary shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]'
                          : 'bg-white dark:bg-neu-surface border-gray-300 dark:border-neu-border-focus text-gray-700 dark:text-neu-text-primary shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-neu-surface/80'
                      }`}
                      title={showConflicts ? 'Hide conflicts' : 'Show conflicts'}
                    >
                      {showConflicts ? <MdVisibility className="w-4 h-4" /> : <MdVisibilityOff className="w-4 h-4" />}
                      <span className="hidden sm:inline">All Conflicts</span>
                    </button>
                    {loadingDailyConflicts && (
                      <span className="text-xs text-neu-text-secondary animate-pulse">Loading conflicts...</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                {rehearsalEvents.length === 0 && productionEvents.length === 0 ? (
                  <div className="neu-card-raised p-12 text-center">
                    <MdCalendarToday className="w-16 h-16 mx-auto mb-4 text-neu-text-secondary" />
                    <p className="text-neu-text-secondary text-lg mb-4">No events scheduled yet</p>
                    {canManage && (
                      <Button
                        text="Schedule First Event"
                        onClick={() => {
                          setSelectedDate(new Date());
                          setShowSchedulingModal(true);
                        }}
                        className="neu-button-primary"
                      />
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[600px]">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div
                          key={day}
                          className="text-center text-xs sm:text-sm font-semibold text-neu-text-primary/70 py-1 sm:py-2"
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{day.charAt(0)}</span>
                        </div>
                      ))}

                      {calendarDays.map((day, index) => {
                        const dayRehearsals = getRehearsalsForDate(day.fullDate);
                        const dayProductionEvents = getProductionEventsForDate(day.fullDate);
                        const dayConflicts = getDailyConflictsForDate(day.fullDate);
                        const today = isToday(day.fullDate);

                        return (
                          <div
                            key={index}
                            className={`min-h-[100px] sm:min-h-[140px] p-1 sm:p-2 rounded-lg border transition-all duration-200 ${
                              day.isCurrentMonth ? 'bg-neu-surface/30 border-neu-border' : 'bg-neu-surface/10 border-[#4a7bd9]/10'
                            } ${today ? 'ring-1 sm:ring-2 ring-[#5a8ff5]/50' : ''} ${
                              canManage ? 'cursor-pointer hover:bg-neu-surface/50' : ''
                            }`}
                            onClick={() => handleDayClick(day.fullDate)}
                          >
                            <div
                              className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                                day.isCurrentMonth ? 'text-neu-text-primary' : 'text-neu-text-primary/40'
                              } ${today ? 'text-neu-accent-primary font-bold' : ''}`}
                            >
                              {day.date}
                            </div>

                            {/* Daily Conflicts Display */}
                            <DailyConflictsDisplay 
                              conflicts={dayConflicts} 
                              showConflicts={showConflicts} 
                            />

                            <div className="space-y-1">
                              {dayRehearsals.map(event => {
                                const startTime = formatTimeString(event.start_time);
                                const eventConflicts = conflicts[event.rehearsal_events_id] || [];
                                const hasConflicts = eventConflicts.length > 0;
                                const showAvatars = hasConflicts && eventConflicts.length <= 3;
                                const showWarning = hasConflicts && eventConflicts.length > 3;

                                return (
                                  <div key={event.rehearsal_events_id} className="relative group/event">
                                    <button
                                      onClick={e => {
                                        e.stopPropagation();
                                        router.push(`/productions/active-shows/${params.id}/scheduling/rehearsals/${event.rehearsal_events_id}`);
                                      }}
                                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 text-neu-text-primary hover:bg-amber-500/30 hover:border-amber-500/70 transition-all duration-200"
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <div className="font-medium truncate flex items-center gap-1">
                                          <span className="shrink-0">🎬</span>
                                          <span className="truncate">{event.is_tech_rehearsal ? 'Tech Rehearsal' : 'Rehearsal'}</span>
                                        </div>
                                        {showWarning && (
                                          <div
                                            className="flex items-center gap-0.5 bg-yellow-500/90 text-white rounded-full px-1 py-0.5 hover:bg-yellow-600 transition-colors cursor-pointer"
                                            onClick={e => {
                                              e.stopPropagation();
                                              setSelectedConflictEvent(event.rehearsal_events_id);
                                            }}
                                            title={`${eventConflicts.length} users with conflicts`}
                                          >
                                            <MdWarning className="w-3 h-3" />
                                            <span className="text-[9px] font-bold">{eventConflicts.length}</span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-amber-400 text-[9px] sm:text-[10px] truncate">{startTime}</div>
                                      {event.location && (
                                        <div className="text-amber-400/70 text-[9px] truncate mb-0.5">📍 {event.location}</div>
                                      )}

                                      {showAvatars && (
                                        <div
                                          className="flex items-center -space-x-1.5 mt-1 relative z-10"
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedConflictEvent(event.rehearsal_events_id);
                                          }}
                                        >
                                          {eventConflicts.map((c: any) => (
                                            <div
                                              key={c.user.id}
                                              className="ring-1 ring-amber-500 rounded-full bg-neu-surface cursor-pointer hover:z-20 hover:scale-110 transition-transform"
                                              title={`${c.user.first_name} ${c.user.last_name}: ${c.conflicts.length} conflicts`}
                                            >
                                              <Avatar
                                                src={c.user.profile_photo_url}
                                                alt={`${c.user.first_name} ${c.user.last_name}`}
                                                size="sm"
                                                className="w-4 h-4 text-[8px]"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </button>

                                    {canManage && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          handleDelete(event.rehearsal_events_id);
                                        }}
                                        disabled={deleting === event.rehearsal_events_id}
                                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity disabled:opacity-50 shadow-lg z-20"
                                        title="Delete rehearsal"
                                      >
                                        <MdDelete className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {dayProductionEvents.map((event: any) => {
                                const typeName = event?.production_event_types?.name || 'Production Event';
                                const typeColor = event?.production_event_types?.color || '#5a8ff5';
                                const startTime = getProductionEventStartTimeLabel(event);
                                const assigned = event?.production_event_assignments || [];
                                const hasAssignees = Array.isArray(assigned) && assigned.length > 0;
                                const showAvatars = hasAssignees && assigned.length <= 3;
                                const showCount = hasAssignees && assigned.length > 3;

                                return (
                                  <div key={event.production_event_id} className="relative group/event">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/productions/active-shows/${params.id}/scheduling/events/${event.production_event_id}`);
                                      }}
                                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs backdrop-blur-sm border text-neu-text-primary transition-all duration-200"
                                      style={{
                                        backgroundColor: `${typeColor}20`,
                                        borderColor: `${typeColor}80`,
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-0.5">
                                        <div className="font-medium truncate flex items-center gap-1">
                                          <span className="shrink-0">📌</span>
                                          <span className="truncate">{typeName}</span>
                                        </div>
                                        {showCount && (
                                          <div
                                            className="flex items-center gap-0.5 text-white rounded-full px-1 py-0.5 transition-colors"
                                            style={{ backgroundColor: `${typeColor}CC` }}
                                            title={`${assigned.length} assigned`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openProductionConflicts(event.production_event_id);
                                            }}
                                          >
                                            <span className="text-[9px] font-bold">{assigned.length}</span>
                                          </div>
                                        )}
                                      </div>
                                      {startTime && (
                                        <div className="text-[9px] sm:text-[10px] truncate" style={{ color: typeColor }}>
                                          {startTime}
                                        </div>
                                      )}
                                      {event.location && (
                                        <div className="text-[9px] truncate mb-0.5" style={{ color: `${typeColor}B3` }}>
                                          📍 {event.location}
                                        </div>
                                      )}

                                      {showAvatars && (
                                        <div
                                          className="flex items-center -space-x-1.5 mt-1 relative z-10"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openProductionConflicts(event.production_event_id);
                                          }}
                                        >
                                          {assigned.map((a: any) => (
                                            <div
                                              key={a.production_event_assignment_id}
                                              className="rounded-full bg-neu-surface cursor-pointer hover:z-20 hover:scale-110 transition-transform"
                                              style={{ boxShadow: `0 0 0 1px ${typeColor}` }}
                                              title={`${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim()}
                                            >
                                              <Avatar
                                                src={a.profiles?.profile_photo_url}
                                                alt={`${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim()}
                                                size="sm"
                                                className="w-4 h-4 text-[8px]"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </button>

                                    {canManage && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteProductionEvent(event.production_event_id);
                                        }}
                                        disabled={deleting === event.production_event_id}
                                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity shadow-lg z-20"
                                        title="Delete event"
                                      >
                                        <MdDelete className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {canManage && dayRehearsals.length === 0 && (
                                <div className="text-[10px] text-neu-text-primary/40 text-center mt-2">Click to add</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showSchedulingModal && selectedDate && (
          <SchedulingModal
            isOpen={showSchedulingModal}
            auditionId={params.id as string}
            date={selectedDate}
            onClose={() => setShowSchedulingModal(false)}
            onCreated={() => {
              loadData();
              loadConflicts();
            }}
          />
        )}



        {selectedConflictEvent && conflicts[selectedConflictEvent] && (
          <ConflictsModal
            isOpen={!!selectedConflictEvent}
            onClose={() => setSelectedConflictEvent(null)}
            title="Rehearsal Conflicts"
            agendaItems={[
              {
                rehearsal_agenda_items_id: 'batch-view',
                title: 'All Conflicts for this Event',
                start_time: rehearsalEvents.find(e => e.rehearsal_events_id === selectedConflictEvent)?.start_time || '',
                end_time: rehearsalEvents.find(e => e.rehearsal_events_id === selectedConflictEvent)?.end_time || '',
                conflicts: conflicts[selectedConflictEvent].map(c => ({
                  agenda_assignments_id: 'batch-' + c.user.id,
                  status: 'conflict',
                  user_id: c.user.id,
                  profiles: c.user,
                  conflicting_events: c.conflicts,
                })),
              },
            ]}
            formatTimeString={formatTimeString}
          />
        )}

        {selectedProductionConflictEvent && (
          <ConflictsModal
            isOpen={!!selectedProductionConflictEvent}
            onClose={() => setSelectedProductionConflictEvent(null)}
            title="Event Conflicts"
            agendaItems={productionConflictAgendaItems}
            formatTimeString={formatTimeString}
          />
        )}
      </StarryContainer>
    </ProtectedRoute>
  );
}
