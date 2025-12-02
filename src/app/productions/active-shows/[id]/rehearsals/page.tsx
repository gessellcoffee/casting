'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAuditionById } from '@/lib/supabase/auditionQueries';
import { getRehearsalEvents, canManageRehearsalEvents, deleteRehearsalEvent } from '@/lib/supabase/rehearsalEvents';
import { getUser } from '@/lib/supabase';
import StarryContainer from '@/components/StarryContainer';
import ProtectedRoute from '@/components/ProtectedRoute';
import WorkflowStatusBadge from '@/components/productions/WorkflowStatusBadge';
import Button from '@/components/Button';
import { MdAdd, MdEdit, MdDelete, MdLocationOn, MdAccessTime, MdCalendarToday, MdArrowBack, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { formatUSDate, isToday } from '@/lib/utils/dateUtils';
import type { RehearsalEvent } from '@/lib/supabase/types';
import RehearsalEventForm from '@/components/productions/RehearsalEventForm';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmButtonText: 'Confirm',
    showCancel: true
  });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const openModal = (title: string, message: string, onConfirmAction?: () => void, confirmText?: string, showCancelBtn: boolean = true) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        if (onConfirmAction) onConfirmAction();
        setModalConfig({ ...modalConfig, isOpen: false });
      },
      confirmButtonText: confirmText || 'Confirm',
      showCancel: showCancelBtn
    });
  };

  const loadData = async () => {
    setLoading(true);

    // Load audition
    const { data: auditionData, error: auditionError } = await getAuditionById(params.id as string);
    if (auditionError || !auditionData) {
      openModal('Error', 'Error loading audition. Redirecting to dashboard.', () => router.push('/cast'), 'OK', false);
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

  // Calendar navigation
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

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        date: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
      })
    );
    
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i + 1),
      })
    );
    
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const nextMonthDays = Array.from(
      { length: remainingDays },
      (_, i) => ({
        date: i + 1,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i + 1),
      })
    );
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);

  // Parse YYYY-MM-DD string as local date to avoid UTC conversion
  const parseLocalDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Group rehearsal events by date
  const rehearsalsByDate = useMemo(() => {
    const grouped: Record<string, RehearsalEvent[]> = {};
    rehearsalEvents.forEach(event => {
      // Parse as local date to avoid timezone shift
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

  // Format month/year display
  const periodDisplay = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Handle day click to add rehearsal
  const handleDayClick = (date: Date) => {
    if (!canManage) return;
    setSelectedDate(date);
    setShowAddForm(true);
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

            {/* Calendar Container */}
            <div className="calendar-container rounded-xl">
              {/* Calendar Header */}
              <div className="calendar-header-border p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-neu-text-primary">
                    {periodDisplay}
                  </h2>
                  
                  {/* Add Rehearsal Button */}
                  {canManage && (
                    <Button
                      text="+ Add Rehearsal Event"
                      onClick={() => {
                        setSelectedDate(null);
                        setShowAddForm(true);
                      }}
                      className="neu-button-primary"
                    />
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2 justify-center sm:justify-start">
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
              </div>

              {/* Calendar Grid */}
              <div className="p-6">
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
                  <div className="overflow-x-auto -mx-6 px-6">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 min-w-[600px]">
                      {/* Day headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div
                          key={day}
                          className="text-center text-xs sm:text-sm font-semibold text-neu-text-primary/70 py-1 sm:py-2"
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{day.charAt(0)}</span>
                        </div>
                      ))}

                      {/* Calendar days */}
                      {calendarDays.map((day, index) => {
                        const dayRehearsals = getRehearsalsForDate(day.fullDate);
                        const today = isToday(day.fullDate);

                        return (
                          <div
                            key={index}
                            className={`min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 rounded-lg border transition-all duration-200 ${
                              day.isCurrentMonth
                                ? 'bg-neu-surface/30 border-neu-border'
                                : 'bg-neu-surface/10 border-[#4a7bd9]/10'
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

                            {/* Rehearsal Events for this day */}
                            <div className="space-y-1">
                              {dayRehearsals.map((event) => {
                                const startTime = formatTimeString(event.start_time);
                                
                                return (
                                  <div
                                    key={event.rehearsal_events_id}
                                    className="relative group/event"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/productions/active-shows/${params.id}/rehearsals/${event.rehearsal_events_id}`);
                                      }}
                                      className="w-full text-left px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs bg-amber-500/20 backdrop-blur-sm border border-amber-500/50 text-neu-text-primary hover:bg-amber-500/30 hover:border-amber-500/70 transition-all duration-200 truncate"
                                    >
                                      <div className="font-medium truncate flex items-center gap-1">
                                        <span className="shrink-0">🎬</span>
                                        <span className="truncate">Rehearsal</span>
                                      </div>
                                      <div className="text-amber-400 text-[9px] sm:text-[10px] truncate">
                                        {startTime}
                                      </div>
                                      {event.location && (
                                        <div className="text-amber-400/70 text-[9px] truncate">
                                          📍 {event.location}
                                        </div>
                                      )}
                                    </button>
                                    
                                    {/* Delete button - only show if user can manage */}
                                    {canManage && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(event.rehearsal_events_id);
                                        }}
                                        disabled={deleting === event.rehearsal_events_id}
                                        className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity disabled:opacity-50 shadow-lg"
                                        title="Delete rehearsal"
                                      >
                                        <MdDelete className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Add indicator when clickable */}
                              {canManage && dayRehearsals.length === 0 && (
                                <div className="text-[10px] text-neu-text-primary/40 text-center mt-2">
                                  Click to add
                                </div>
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

        {/* Add Rehearsal Form Modal */}
        {showAddForm && (
          <RehearsalEventForm
            auditionId={params.id as string}
            onSuccess={() => {
              setShowAddForm(false);
              setSelectedDate(null);
              loadData();
            }}
            onCancel={() => {
              setShowAddForm(false);
              setSelectedDate(null);
            }}
            initialDate={selectedDate}
          />
        )}
      </StarryContainer>
    </ProtectedRoute>
  );
}
