'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { MdClose, MdChevronLeft, MdChevronRight, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { getProfile } from '@/lib/supabase/profile';
import { getUserResumes } from '@/lib/supabase/resume';
import { getUserAvailability } from '@/lib/supabase/userEvents';
import { getUserCastingHistory } from '@/lib/supabase/castingHistory';
import type { Profile, UserResume, CalendarEvent, UserPreferences } from '@/lib/supabase/types';
import CallbackSlotSelectorModal from './CallbackSlotSelectorModal';
import Button from '@/components/Button';
import PDFViewer from '@/components/PDFViewer';

interface UserProfileModalProps {
  userId: string;
  auditionId?: string;
  signupId?: string;
  onClose?: () => void;
  onActionComplete?: () => void;
  mode?: 'modal' | 'embedded';
}

export default function UserProfileModal({ userId, auditionId, signupId, onClose, onActionComplete, mode = 'modal' }: UserProfileModalProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resumes, setResumes] = useState<UserResume[]>([]);
  const [castingHistory, setCastingHistory] = useState<any[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  
  // Collapsible section states - all collapsed by default
  const [expandedSections, setExpandedSections] = useState({
    location: false,
    bio: false,
    skills: false,
    imageGallery: false,
    videoGallery: false,
    resumePdf: false,
    resume: false,
    castingHistory: false,
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

      // Fetch casting history
      const history = await getUserCastingHistory(userId);
      setCastingHistory(history);

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
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        
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
      profile.email ||
      'Anonymous User'
    : 'Loading...';

  const manualResumes = useMemo(() => {
    return resumes.filter((resume) => {
      if (resume.source === 'Application') return false;

      const showName = typeof resume.show_name === 'string' ? resume.show_name.trim() : '';
      const role = typeof resume.role === 'string' ? resume.role.trim() : '';
      const companyName = typeof resume.company_name === 'string' ? resume.company_name.trim() : '';
      const dateOfProduction = typeof resume.date_of_production === 'string' ? resume.date_of_production.trim() : '';

      return Boolean(showName || role || companyName || dateOfProduction);
    });
  }, [resumes]);

  const canShowCastingHistory = useMemo(() => {
    const prefs = profile?.preferences as UserPreferences | null;
    return prefs?.show_casting_history !== false;
  }, [profile]);

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
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        )
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [calendarDays]);

  const isEmbedded = mode === 'embedded';
  const handleClose = onClose || (() => {});

  const content = (
    <>
      {/* Header */}
      <div
        className={`${isEmbedded ? 'p-4' : 'sticky top-0 p-6'} border-b border-neu-border `}
        style={{ backgroundColor: 'var(--neu-surface)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-neu-text-primary mb-1">User Profile</h2>
            <p className="text-neu-text-secondary neu-text-mobile-truncate">{fullName}</p>
          </div>

          <div className="neu-modal-header-actions">
            {auditionId && signupId && (
              <Button
                text="Callback"
                onClick={() => setShowCallbackModal(true)}
                variant="primary"
              />
            )}

            {!isEmbedded && (
              <button
                onClick={handleClose}
                className="p-2 rounded-xl text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
                style={{ backgroundColor: 'var(--neu-surface)' }}
              >
                <MdClose className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`${isEmbedded ? 'p-4' : 'p-6 overflow-y-auto max-h-[calc(90vh-100px)]'}`}>
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
                {profile?.skills && profile.skills.toString().split(',').length > 0 && (
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
                          {profile.skills.toString().split(',').map((skill, index) => (
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
                      <div className="px-4 pb-4 flex gap-3">
                        <button
                          onClick={() => setShowPDFViewer(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] text-neu-text-primary hover:text-neu-accent-primary transition-all duration-200 border border-neu-border"
                        >
                          <span>📄</span>
                          <span>View Resume</span>
                        </button>
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

                {/* Casting History Section */}
                {castingHistory.length > 0 && canShowCastingHistory && (
                  <div className="rounded-2xl shadow-[inset_3px_3px_6px_var(--neu-shadow-dark),inset_-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border" style={{ backgroundColor: 'var(--neu-surface)' }}>
                    <button
                      onClick={() => toggleSection('castingHistory')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neu-surface/50 transition-colors rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-neu-accent-primary cursor-pointer">Casting History</h3>
                        <span className="text-xs text-neu-text-primary/60 bg-green-500/10 border border-green-500/30 px-2 py-1 rounded-full">
                          ✓ Verified
                        </span>
                      </div>
                      {expandedSections.castingHistory ? (
                        <MdExpandLess className="w-5 h-5 text-neu-accent-primary" />
                      ) : (
                        <MdExpandMore className="w-5 h-5 text-neu-accent-primary" />
                      )}
                    </button>
                    {expandedSections.castingHistory && (
                      <div className="px-4 pb-4 space-y-3">
                        {castingHistory.map((cast) => (
                          <div
                            key={cast.id}
                            className="p-4 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                            style={{ backgroundColor: 'var(--neu-surface)' }}
                          >
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-semibold text-neu-text-primary text-base">
                                  {cast.show_name}
                                </h4>
                                <p className="text-neu-accent-primary text-sm font-medium">
                                  {cast.role}{cast.is_understudy && ' (Understudy)'}
                                </p>
                              </div>

                              {cast.company_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-neu-text-secondary">Company:</span>
                                  <span className="text-sm text-neu-text-primary">{cast.company_name}</span>
                                </div>
                              )}

                              {cast.date_of_production && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-neu-text-secondary">Performance Dates:</span>
                                  <span className="text-sm text-neu-text-primary">{cast.date_of_production}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resume Section */}
                {manualResumes.length > 0 && (
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
                        {manualResumes.map((resume) => {
                          const showName = typeof resume.show_name === 'string' ? resume.show_name.trim() : '';
                          const role = typeof resume.role === 'string' ? resume.role.trim() : '';
                          const companyName = typeof resume.company_name === 'string' ? resume.company_name.trim() : '';
                          const dateOfProduction = typeof resume.date_of_production === 'string' ? resume.date_of_production.trim() : '';

                          const title = showName || role;
                          const subtitle = showName ? role : '';

                          return (
                            <div
                              key={resume.resume_entry_id}
                              className="p-4 rounded-xl shadow-[3px_3px_6px_var(--neu-shadow-dark),-3px_-3px_6px_var(--neu-shadow-light)] border border-neu-border"
                              style={{ backgroundColor: 'var(--neu-surface)' }}
                            >
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-semibold text-neu-text-primary text-base">
                                    {title}
                                  </h4>
                                  {subtitle && (
                                    <p className="text-neu-accent-primary text-sm font-medium">
                                      {subtitle}
                                    </p>
                                  )}
                                </div>

                                {companyName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-neu-text-secondary">Company:</span>
                                    <span className="text-sm text-neu-text-primary">{companyName}</span>
                                    {resume.company_approved && (
                                      <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
                                        ✓ Verified
                                      </span>
                                    )}
                                  </div>
                                )}

                                {dateOfProduction && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-neu-text-secondary">Date:</span>
                                    <span className="text-sm text-neu-text-primary">
                                      {new Date(dateOfProduction).toLocaleDateString('en-US', { 
                                        month: 'long', 
                                        year: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                              const startTime = event.start_time ? new Date(event.start_time) : null;
                              const endTime = event.end_time ? new Date(event.end_time) : null;
                              const isAllDay = event.all_day;

                              return (
                                <div
                                  key={eventIndex}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span className="text-neu-accent-danger font-medium">●</span>
                                  <span className="text-neu-text-secondary">
                                    {isAllDay 
                                      ? 'All Day' 
                                      : startTime && endTime
                                      ? `${formatTime(startTime)} - ${formatTime(endTime)}`
                                      : 'Time not specified'
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
    </>
  );

  const panelClassName = `rounded-3xl shadow-[20px_20px_60px_var(--neu-shadow-dark),-20px_-20px_60px_var(--neu-shadow-light)] ${
    isEmbedded ? 'w-full' : 'max-w-5xl w-full max-h-[90vh]'
  } overflow-hidden border border-neu-border`;

  return (
    <>
      {isEmbedded ? (
        <div className={panelClassName} style={{ backgroundColor: 'var(--neu-surface)' }}>
          {content}
        </div>
      ) : (
        <Transition appear show={true} as={Fragment}>
          <Dialog as="div" className="relative z-[10000]" onClose={handleClose}>
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
                  <Dialog.Panel className={panelClassName} style={{ backgroundColor: 'var(--neu-surface)' }}>
                    {content}
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
    
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

      {/* PDF Viewer Modal */}
      {showPDFViewer && profile?.resume_url && (
        <PDFViewer
          pdfUrl={profile.resume_url}
          onClose={() => setShowPDFViewer(false)}
          fileName={`${profile.first_name || 'User'}_${profile.last_name || 'Resume'}.pdf`}
        />
      )}
    </>
  );
}
