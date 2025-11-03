'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdChevronLeft, MdChevronRight, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { getProfile } from '@/lib/supabase/profile';
import { getUserResumes } from '@/lib/supabase/resume';
import { getUserAvailability } from '@/lib/supabase/userEvents';
import type { Profile, UserResume, CalendarEvent } from '@/lib/supabase/types';
import CallbackSlotSelectorModal from './CallbackSlotSelectorModal';
import RoleCastingModal from './RoleCastingModal';
import Button from '@/components/Button';

interface UserProfileModalProps {
  userId: string;
  auditionId?: string;
  signupId?: string;
  onClose: () => void;
  onActionComplete?: () => void;
}

export default function UserProfileModal({ userId, auditionId, signupId, onClose, onActionComplete }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  
  // Collapsible section states - all collapsed by default
  const [expandedSections, setExpandedSections] = useState({
    location: false,
    bio: false,
    skills: false,
    imageGallery: false,
    videoGallery: false,
    resumePdf: false,
    resume: false,
    calendar: false,
    busyTimes: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, currentDate]);

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
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
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

    const days: Array<{ date: Date | null; events: CalendarEvent[] }> = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, events: [] });
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Create day boundaries in local time
      const dayStart = new Date(year, month, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
      
      // Find events that overlap with this day
      const dayEvents = events.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Event overlaps with day if: eventStart <= dayEnd AND eventEnd >= dayStart
        const overlaps = eventStart <= dayEnd && eventEnd >= dayStart;
        
        return overlaps;
      });
      
      days.push({ date, events: dayEvents });
    }

    return days;
  }, [currentDate, events]);

  const fullName = profile
    ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.username ||
      'Anonymous User'
    : 'Loading...';

  const monthDisplay = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Get busy days with their events sorted by date
  const busyDays = useMemo(() => {
    return calendarDays
      .filter(day => day.date && day.events.length > 0)
      .map(day => ({
        date: day.date!,
        events: day.events.sort((a, b) => 
          new Date(a.start).getTime() - new Date(b.start).getTime()
        )
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [calendarDays]);

  return (
    <>
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-[10000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(10, 14, 39, 0.85)' }} />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] max-w-5xl w-full max-h-[90vh] overflow-hidden border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
        {/* Header */}
        <div className="sticky top-0 h-[80px] p-6 border-b border-neu-border shadow-[inset_0_-2px_4px_var(--neu-shadow-dark)]" style={{ backgroundColor: 'var(--neu-surface)' }}>
          <div className="flex h-full items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-neu-text-primary mb-1">User Profile</h2>
              <p className="text-neu-text-secondary">{fullName}</p>
            </div>
            
            {/* Action Buttons */}
            {auditionId && (
              <div className="flex gap-3">
                <Button
                  text="Callback"
                  onClick={() => setShowCallbackModal(true)}
                  variant="secondary"
                />
                <Button
                  text="Cast"
                  onClick={() => setShowCastModal(true)}
                  variant="primary"
                />
              </div>
            )}
            
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

                {/* Location */}
                {profile?.location && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('location')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Location
                      </label>
                      {expandedSections.location ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.location && (
                      <div className="px-4 pb-4">
                        <p className="text-neu-text-primary">{profile.location}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Bio */}
                {profile?.description && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('bio')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Bio
                      </label>
                      {expandedSections.bio ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.bio && (
                      <div className="px-4 pb-4">
                        <p className="text-neu-text-primary whitespace-pre-wrap">{profile.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {profile?.skills && profile.skills.length > 0 && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('skills')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Skills
                      </label>
                      {expandedSections.skills ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.skills && (
                      <div className="px-4 pb-4">
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
  </div>
                )}

                {/* Image Gallery */}
                {profile?.image_gallery && Array.isArray(profile.image_gallery) && profile.image_gallery.length > 0 && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('imageGallery')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Image Gallery ({profile.image_gallery.length})
                      </label>
                      {expandedSections.imageGallery ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.imageGallery && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-3">
                          {profile.image_gallery.map((image: any, index: number) => (
                            <div
                              key={index}
                              className="rounded-xl overflow-hidden shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                            >
                              <img
                                src={typeof image === 'string' ? image : image.url}
                                alt={typeof image === 'object' && image.caption ? image.caption : `Gallery image ${index + 1}`}
                                className="w-full h-40 object-cover"
                              />
                              {typeof image === 'object' && image.caption && (
                                <div className="p-2 bg-neu-surface/80">
                                  <p className="text-xs text-neu-text-secondary">{image.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Video Gallery */}
                {profile?.video_gallery && Array.isArray(profile.video_gallery) && profile.video_gallery.length > 0 && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('videoGallery')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Video Gallery ({profile.video_gallery.length})
                      </label>
                      {expandedSections.videoGallery ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.videoGallery && (
                      <div className="px-4 pb-4">
                        <div className="space-y-3">
                          {profile.video_gallery.map((video: any, index: number) => (
                            <div
                              key={index}
                              className="rounded-xl overflow-hidden shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                            >
                              <video
                                src={typeof video === 'string' ? video : video.url}
                                controls
                                className="w-full"
                              />
                              {typeof video === 'object' && video.caption && (
                                <div className="p-2 bg-neu-surface/80">
                                  <p className="text-xs text-neu-text-secondary">{video.caption}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resume PDF */}
                {profile?.resume_url && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('resumePdf')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <label className="text-sm font-semibold text-neu-accent-primary cursor-pointer">
                        Resume PDF
                      </label>
                      {expandedSections.resumePdf ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.resumePdf && (
                      <div className="px-4 pb-4">
                        <a
                          href={profile.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Resume
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Resume Section */}
                {resumes.length > 0 && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('resume')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <h3 className="text-lg font-semibold text-neu-accent-primary cursor-pointer">Resume</h3>
                      {expandedSections.resume ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.resume && (
                      <div className="px-4 pb-4 space-y-3">
                        {resumes.map((resume) => (
                          <div
                            key={resume.resume_entry_id}
                            className="p-4 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                            style={{ backgroundColor: 'var(--neu-surface)' }}
                          >
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-semibold text-neu-text-primary text-base">
                                  {resume.show_name || 'Untitled Production'}
                                </h4>
                                <p className="text-neu-accent-primary text-sm font-medium">
                                  {resume.role || 'Role not specified'}
                                </p>
                              </div>
                              
                              {resume.company_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-neu-text-secondary">Company:</span>
                                  <span className="text-sm text-neu-text-primary">{resume.company_name}</span>
                                  {resume.company_approved && (
                                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
                                      ✓ Verified
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {resume.date_of_production && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-neu-text-secondary">Date:</span>
                                  <span className="text-sm text-neu-text-primary">
                                    {new Date(resume.date_of_production).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neu-text-secondary">Source:</span>
                                <span className="px-2 py-0.5 rounded-full bg-neu-accent-primary/20 text-neu-accent-primary text-xs font-medium capitalize">
                                  {resume.source}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Calendar */}
              <div className="space-y-4">
                <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                  <button
                    onClick={() => toggleSection('calendar')}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-t-2xl"
                  >
                    <h3 className="text-lg font-semibold text-neu-accent-primary cursor-pointer">
                      Availability Calendar
                    </h3>
                    {expandedSections.calendar ? (
                      <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                    ) : (
                      <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                    )}
                  </button>
                  {expandedSections.calendar && (
                    <div className="px-4 pb-4">
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
                  )}
                </div>

                {/* Busy Times List */}
                {busyDays.length > 0 && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('busyTimes')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <h3 className="text-lg font-semibold text-neu-accent-primary cursor-pointer">
                        Busy Times
                      </h3>
                      {expandedSections.busyTimes ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.busyTimes && (
                      <div className="px-4 pb-4">
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {busyDays.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className="p-3 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                          style={{ backgroundColor: 'var(--neu-surface)' }}
                        >
                          <div className="font-semibold text-neu-text-primary mb-2">
                            {day.date.toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="space-y-1.5">
                            {day.events.map((event, eventIndex) => {
                              const startTime = new Date(event.start);
                              const endTime = new Date(event.end);
                              const isAllDay = event.allDay;

                              return (
                                <div
                                  key={eventIndex}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-neu-accent-danger font-medium">●</span>
                                  <span className="text-neu-text-secondary">
                                    {isAllDay 
                                      ? 'All Day' 
                                      : `${formatTime(startTime)} - ${formatTime(endTime)}`
                                    }
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    
      {/* Callback Modal */}
      {showCallbackModal && auditionId && (
        <CallbackSlotSelectorModal
          auditionId={auditionId}
          userId={userId}
          signupId={signupId}
          onClose={() => setShowCallbackModal(false)}
          onSuccess={() => {
            setShowCallbackModal(false);
            onActionComplete?.();
          }}
        />
      )}
      
      {/* Cast Modal */}
      {showCastModal && auditionId && (
        <RoleCastingModal
          auditionId={auditionId}
          userId={userId}
          onClose={() => setShowCastModal(false)}
          onSuccess={() => {
            setShowCastModal(false);
            onActionComplete?.();
          }}
        />
      )}
    </>
  );
}
