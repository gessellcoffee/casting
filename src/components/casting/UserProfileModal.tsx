'use client';

import { useState, useEffect, useMemo } from 'react';
import { MdClose, MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { getProfile } from '@/lib/supabase/profile';
import { getUserResumes } from '@/lib/supabase/resume';
import { getUserAvailability } from '@/lib/supabase/userEvents';
import type { Profile, UserResume, CalendarEvent } from '@/lib/supabase/types';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadData();
  }, [userId, currentDate]);

  // Debug logging for events
  useEffect(() => {
    console.log('[UserProfileModal] Events updated:', events.length);
    console.log('[UserProfileModal] Sample events:', events.slice(0, 5));
  }, [events]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const profileData = await getProfile(userId);
      if (!profileData) {
        setError('User not found');
        return;
      }
      setProfile(profileData);

      // Fetch resume entries
      const resumeData = await getUserResumes(userId);
      setResumes(resumeData);

      // Fetch user availability for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const eventsData = await getUserAvailability(userId, startOfMonth, endOfMonth);
      setEvents(eventsData);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
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
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    console.log('[UserProfileModal] Generating calendar for:', { year, month, daysInMonth, totalEvents: events.length });

    const days: Array<{ date: Date | null; events: CalendarEvent[] }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, events: [] });
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayStart = new Date(year, month, day, 0, 0, 0);
      const dayEnd = new Date(year, month, day, 23, 59, 59);
      
      // Find events that overlap with this day
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Event overlaps with day if: eventStart <= dayEnd AND eventEnd >= dayStart
        const overlaps = eventStart <= dayEnd && eventEnd >= dayStart;
        
        if (overlaps && day <= 5) {
          console.log(`[UserProfileModal] Day ${day} has event:`, { eventStart, eventEnd, overlaps });
        }
        
        return overlaps;
      });
      
      days.push({ date, events: dayEvents });
    }

    const daysWithEvents = days.filter(d => d.events.length > 0).length;
    console.log('[UserProfileModal] Calendar generated:', { totalDays: days.length, daysWithEvents });

    return days;
  }, [currentDate, events]);

  const fullName = profile
    ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.username ||
      'Anonymous User'
    : 'Loading...';

  const monthDisplay = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: 'rgba(10, 14, 39, 0.85)' }}>
      <div className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-5xl w-full max-h-[90vh] overflow-hidden border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
        {/* Header */}
        <div className="sticky top-0 p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neu-text-primary mb-1">User Profile</h2>
              <p className="text-neu-text-secondary">{fullName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
              style={{ backgroundColor: 'var(--neu-surface)' }}
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {loading ? (
            <div className="text-center py-12 text-neu-text-secondary">Loading profile...</div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-neu-accent-danger mb-4">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Profile Info */}
              <div className="space-y-6">
                {/* Profile Photo */}
                <div className="flex justify-center">
                  {profile?.profile_photo_url ? (
                    <div className="rounded-full p-1 shadow-[8px_8px_16px_var(--neu-shadow-dark),-8px_-8px_16px_var(--neu-shadow-light)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
                      <img
                        src={profile.profile_photo_url}
                        alt={fullName}
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full shadow-[inset_8px_8px_16px_var(--neu-shadow-dark),inset_-8px_-8px_16px_var(--neu-shadow-light)] flex items-center justify-center border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                      <svg
                        className="w-16 h-16 text-neu-accent-primary"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Basic Information */}
                {profile?.location && (
                  <div className="p-4 rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <label className="block text-sm font-semibold text-neu-accent-primary mb-2">
                      Location
                    </label>
                    <p className="text-neu-text-primary">{profile.location}</p>
                  </div>
                )}

                {/* Description */}
                {profile?.description && (
                  <div className="p-4 rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <label className="block text-sm font-semibold text-neu-accent-primary mb-2">
                      Bio
                    </label>
                    <p className="text-neu-text-primary whitespace-pre-wrap">{profile.description}</p>
                  </div>
                )}

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="p-4 rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <label className="block text-sm font-semibold text-neu-accent-primary mb-3">
                      Skills
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary text-sm border border-neu-border"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Section */}
                {resumes.length > 0 && (
                  <div className="p-4 rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <h3 className="text-lg font-semibold text-neu-accent-primary mb-4">Resume</h3>
                    <div className="space-y-3">
                      {resumes.slice(0, 5).map((resume) => (
                        <div
                          key={resume.resume_entry_id}
                          className="p-3 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-neu-text-primary">
                                {resume.show_name || 'Untitled Production'}
                              </h4>
                              <p className="text-neu-accent-primary text-sm">
                                {resume.role || 'Role not specified'}
                              </p>
                              {resume.company_name && (
                                <p className="text-neu-text-primary/60 text-xs mt-1">
                                  {resume.company_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Calendar */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <h3 className="text-lg font-semibold text-neu-accent-primary mb-4">
                    Availability Calendar
                  </h3>
                  <div className="mb-4 p-3 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <p className="text-sm text-neu-text-secondary font-medium">
                      Days with conflicts are highlighted. Event details remain private.
                    </p>
                  </div>

                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={handlePreviousMonth}
                      className="p-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all border border-neu-border"
                      style={{ backgroundColor: 'var(--neu-surface)' }}
                    >
                      <MdChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-neu-text-primary">{monthDisplay}</h4>
                      <button
                        onClick={handleToday}
                        className="px-3 py-1 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all text-sm border border-neu-border"
                        style={{ backgroundColor: 'var(--neu-surface)' }}
                      >
                        Today
                      </button>
                    </div>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all border border-neu-border"
                      style={{ backgroundColor: 'var(--neu-surface)' }}
                    >
                      <MdChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-semibold text-neu-accent-primary py-2"
                      >
                        {day}
                      </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                      const isToday =
                        day.date &&
                        day.date.toDateString() === new Date().toDateString();
                      const hasBusyTime = day.events.length > 0;

                      return (
                        <div
                          key={index}
                          className={`
                            aspect-square flex items-center justify-center text-center text-sm rounded-xl transition-all
                            ${
                              day.date
                                ? hasBusyTime
                                  ? 'shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] border-2 border-neu-accent-danger'
                                  : 'shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border'
                                : ''
                            }
                            ${isToday ? 'ring-2 ring-neu-accent-primary ring-offset-2' : ''}
                          `}
                          style={day.date ? { backgroundColor: 'var(--neu-surface)' } : {}}
                        >
                          {day.date && (
                            <div className="flex flex-col items-center justify-center">
                              <span
                                className={`
                                  font-semibold text-sm
                                  ${hasBusyTime ? 'text-neu-accent-danger' : isToday ? 'text-neu-accent-primary' : 'text-neu-text-primary'}
                                `}
                              >
                                {day.date.getDate()}
                              </span>
                              {hasBusyTime && (
                                <span className="text-[10px] font-bold text-neu-accent-danger mt-0.5">●</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 p-3 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}></div>
                        <span className="font-medium text-neu-text-secondary">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border-2 border-neu-accent-danger flex items-center justify-center" style={{ backgroundColor: 'var(--neu-surface)' }}>
                          <span className="text-[8px] text-neu-accent-danger">●</span>
                        </div>
                        <span className="font-medium text-neu-accent-danger">Conflict</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg ring-2 ring-neu-accent-primary ring-offset-2" style={{ backgroundColor: 'var(--neu-surface)' }}></div>
                        <span className="font-medium text-neu-accent-primary">Today</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
