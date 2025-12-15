'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdClose, MdUpload, MdDelete, MdPlayArrow, MdImage, MdVideocam, MdSave, MdPerson, MdArrowBack, MdExpandMore, MdChevronRight, MdEdit, MdCheck } from 'react-icons/md';
import Avatar from '@/components/shared/Avatar';
import { formatUSTime, formatUSDateWithFullWeekday } from '@/lib/utils/dateUtils';
import { 
  getSignupsWithDetailsForSlots, 
  addSignupMedia, 
  removeSignupMedia,
  type MediaFile 
} from '@/lib/supabase/auditionSignups';
import { 
  getNotesForSignups, 
  createSignupNote, 
  updateSignupNote,
  deleteSignupNote,
  type SignupNoteWithAuthor 
} from '@/lib/supabase/signupNotes';
import { 
  getAuditionVirtualSubmissions,
  type VirtualAuditionWithDetails
} from '@/lib/supabase/virtualAuditions';
import { uploadAuditionMedia, deleteAuditionMedia } from '@/lib/supabase/storage';
import { useToast } from '@/contexts/ToastContext';
import Alert from '@/components/ui/feedback/Alert';

interface LiveAuditionManagerProps {
  auditionId: string;
  auditionTitle: string;
  slots: any[];
  userId: string;
  onClose: () => void;
}

interface SignupWithDetails {
  signup_id: string;
  user_id: string;
  notes: string | null;
  media_files: MediaFile[] | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  };
  audition_slots: {
    slot_id: string;
    start_time: string;
    end_time: string;
    location: string | null;
  };
}

export default function LiveAuditionManager({ 
  auditionId, 
  auditionTitle, 
  slots, 
  userId, 
  onClose 
}: LiveAuditionManagerProps) {
  const { showToast } = useToast();
  const [signups, setSignups] = useState<SignupWithDetails[]>([]);
  const [virtualAuditions, setVirtualAuditions] = useState<VirtualAuditionWithDetails[]>([]);
  const [selectedSignup, setSelectedSignup] = useState<SignupWithDetails | null>(null);
  const [selectedVirtualAudition, setSelectedVirtualAudition] = useState<VirtualAuditionWithDetails | null>(null);
  const [viewMode, setViewMode] = useState<'slots' | 'virtual'>('slots');
  const [notes, setNotes] = useState<SignupNoteWithAuthor[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSlotDateKey = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Sort slots by start time
  const sortedSlots = [...slots].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  // Load signups for all slots and virtual auditions
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Load slot signups
      const slotIds = slots.map(s => s.slot_id);
      const signupsData = await getSignupsWithDetailsForSlots(slotIds);
      setSignups(signupsData);
      
      // Load virtual auditions
      const { data: virtualData } = await getAuditionVirtualSubmissions(auditionId);
      setVirtualAuditions(virtualData || []);
      
      setLoading(false);
    }
    loadData();
  }, [slots, auditionId]);

  // Determine active slot based on current time
  useEffect(() => {
    function updateActiveSlot() {
      const now = new Date();
      
      for (const slot of sortedSlots) {
        const startTime = new Date(slot.start_time);
        const endTime = new Date(slot.end_time);
        
        if (now >= startTime && now <= endTime) {
          setActiveSlotId(slot.slot_id);
          return;
        }
      }
      
      // If no active slot, find the next upcoming slot
      for (const slot of sortedSlots) {
        const startTime = new Date(slot.start_time);
        if (now < startTime) {
          setActiveSlotId(slot.slot_id);
          return;
        }
      }
      
      setActiveSlotId(null);
    }

    updateActiveSlot();
    const interval = setInterval(updateActiveSlot, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [sortedSlots]);

  useEffect(() => {
    if (!activeSlotId || viewMode !== 'slots') return;

    const activeSlot = sortedSlots.find(s => s.slot_id === activeSlotId);
    if (!activeSlot) return;

    const dateKey = getSlotDateKey(activeSlot.start_time);

    setCollapsedDates(prev => {
      if (!prev.has(dateKey)) return prev;
      const next = new Set(prev);
      next.delete(dateKey);
      return next;
    });

    const timeout = setTimeout(() => {
      const el = document.getElementById(`live-slot-${activeSlotId}`);
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, 50);

    return () => clearTimeout(timeout);
  }, [activeSlotId, sortedSlots, viewMode]);

  // Load notes when selecting a signup
  useEffect(() => {
    async function loadNotes() {
      if (!selectedSignup) {
        setNotes([]);
        setEditingNoteId(null);
        setEditNoteText('');
        return;
      }

      // Cancel any ongoing edits when switching signups
      setEditingNoteId(null);
      setEditNoteText('');

      try {
        const signupNotes = await getNotesForSignups([selectedSignup.signup_id]);
        setNotes(signupNotes);
      } catch (error) {
        console.error('Error loading notes:', error);
        // Table might not exist yet - gracefully handle
        setNotes([]);
      }
    }

    loadNotes();
  }, [selectedSignup]);

  const handleAddNote = async () => {
    if (!selectedSignup || !newNoteText.trim()) return;

    setSaving(true);
    const { data, error } = await createSignupNote(
      selectedSignup.signup_id,
      newNoteText.trim(),
      userId
    );

    if (error) {
      showToast('Failed to add note', 'error');
      setSaving(false);
      return;
    }

    // Reload notes
    const updatedNotes = await getNotesForSignups([selectedSignup.signup_id]);
    setNotes(updatedNotes);
    setNewNoteText('');
    showToast('Note added', 'success');
    setSaving(false);
  };

  const handleEditNote = (note: SignupNoteWithAuthor) => {
    setEditingNoteId(note.signup_note_id);
    setEditNoteText(note.note_text);
  };

  const handleSaveEdit = async () => {
    if (!selectedSignup || !editingNoteId || !editNoteText.trim()) return;

    setSaving(true);
    const { error } = await updateSignupNote(editingNoteId, editNoteText.trim());

    if (error) {
      showToast('Failed to update note', 'error');
      setSaving(false);
      return;
    }

    // Reload notes
    const updatedNotes = await getNotesForSignups([selectedSignup.signup_id]);
    setNotes(updatedNotes);
    setEditingNoteId(null);
    setEditNoteText('');
    showToast('Note updated', 'success');
    setSaving(false);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedSignup) return;

    if (!confirm('Delete this note?')) return;

    const { error } = await deleteSignupNote(noteId);
    
    if (error) {
      showToast('Failed to delete note', 'error');
      return;
    }

    // Reload notes
    const updatedNotes = await getNotesForSignups([selectedSignup.signup_id]);
    setNotes(updatedNotes);
    showToast('Note deleted', 'success');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedSignup) return;

    const file = files[0];
    
    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      showToast('Please upload an image or video file', 'error');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      showToast('File size must be less than 50MB', 'error');
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const { url, path, error: uploadError } = await uploadAuditionMedia(
        auditionId,
        selectedSignup.signup_id,
        file
      );

      if (uploadError || !url || !path) {
        throw new Error('Upload failed');
      }

      // Create media file object
      const mediaFile: MediaFile = {
        url,
        path,
        type: isImage ? 'image' : 'video',
        filename: file.name,
        uploaded_at: new Date().toISOString(),
      };

      // Add to signup
      const { error: addError } = await addSignupMedia(
        selectedSignup.signup_id,
        mediaFile,
        userId
      );

      if (addError) {
        throw new Error('Failed to save media reference');
      }

      // Update local state
      const updatedMediaFiles = [...(selectedSignup.media_files || []), mediaFile];
      setSignups(prev => prev.map(s => 
        s.signup_id === selectedSignup.signup_id 
          ? { ...s, media_files: updatedMediaFiles }
          : s
      ));
      setSelectedSignup(prev => prev ? { ...prev, media_files: updatedMediaFiles } : null);

      showToast('Media uploaded successfully', 'success');
    } catch (error) {
      console.error('Error uploading media:', error);
      showToast('Failed to upload media', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMedia = async (mediaFile: MediaFile) => {
    if (!selectedSignup) return;

    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      // Delete from storage
      await deleteAuditionMedia(mediaFile.path);

      // Remove from signup
      await removeSignupMedia(selectedSignup.signup_id, mediaFile.path, userId);

      // Update local state
      const updatedMediaFiles = (selectedSignup.media_files || []).filter(
        f => f.path !== mediaFile.path
      );
      setSignups(prev => prev.map(s => 
        s.signup_id === selectedSignup.signup_id 
          ? { ...s, media_files: updatedMediaFiles }
          : s
      ));
      setSelectedSignup(prev => prev ? { ...prev, media_files: updatedMediaFiles } : null);

      showToast('Media deleted', 'success');
    } catch (error) {
      console.error('Error deleting media:', error);
      showToast('Failed to delete media', 'error');
    }
  };

  const getSignupsForSlot = (slotId: string) => {
    return signups.filter(s => s.audition_slots.slot_id === slotId);
  };

  // Group slots by date
  const groupSlotsByDate = () => {
    const groups: { [date: string]: typeof sortedSlots } = {};
    
    sortedSlots.forEach(slot => {
      const dateKey = getSlotDateKey(slot.start_time);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(slot);
    });
    
    return groups;
  };

  const toggleDateCollapse = (dateKey: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const slotsByDate = groupSlotsByDate();

  // Handle selection with mobile support
  const handleSelectSignup = (signup: SignupWithDetails) => {
    setSelectedSignup(signup);
    setSelectedVirtualAudition(null);
    setShowMobileDetails(true);
  };

  const handleSelectVirtualAudition = (va: VirtualAuditionWithDetails) => {
    setSelectedVirtualAudition(va);
    setSelectedSignup(null);
    setShowMobileDetails(true);
  };

  const handleCloseMobileDetails = () => {
    setShowMobileDetails(false);
  };

  return (
    <div className="min-h-screen">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-neu-border flex items-center justify-between bg-neu-surface shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              onClick={onClose}
              className="neu-icon-btn-sm neu-button-primary shrink-0"
              aria-label="Back to Audition"
            >
              <MdArrowBack className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-semibold text-neu-text-primary truncate">Live Audition Manager</h1>
              <p className="text-xs sm:text-sm text-neu-text-primary/70 mt-1 truncate">{auditionTitle}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neu-border bg-neu-surface flex">
          <button
            onClick={() => {
              setViewMode('slots');
              setShowMobileDetails(false);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 font-medium transition-all text-sm sm:text-base ${
              viewMode === 'slots'
                ? 'text-neu-accent-primary border-b-2 border-neu-accent-primary'
                : 'text-neu-text-secondary hover:text-neu-text-primary'
            }`}
          >
            <span className="hidden sm:inline">Slot Signups</span>
            <span className="sm:hidden">Slots</span>
            <span className="ml-1">({signups.length})</span>
          </button>
          <button
            onClick={() => {
              setViewMode('virtual');
              setShowMobileDetails(false);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-3 font-medium transition-all text-sm sm:text-base ${
              viewMode === 'virtual'
                ? 'text-neu-accent-primary border-b-2 border-neu-accent-primary'
                : 'text-neu-text-secondary hover:text-neu-text-primary'
            }`}
          >
            <span className="hidden sm:inline">Virtual Auditions</span>
            <span className="sm:hidden">Virtual</span>
            <span className="ml-1">({virtualAuditions.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex relative">
          {/* Mobile backdrop overlay */}
          {showMobileDetails && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
              onClick={handleCloseMobileDetails}
              aria-label="Close details"
            />
          )}
          
          {/* Sidebar - Full width on mobile, fixed width on desktop */}
          <div className={`w-full lg:w-80 xl:w-96 border-r border-neu-border overflow-y-auto bg-neu-surface transition-transform duration-300 ${
            showMobileDetails ? 'hidden lg:block' : 'block'
          }`}>
            <div className="p-3 sm:p-4">
              <h3 className="text-xs sm:text-sm font-semibold text-neu-text-primary/70 uppercase mb-3">
                {viewMode === 'slots' ? 'Audition Slots' : 'Virtual Submissions'}
              </h3>

              {loading ? (
                <div className="text-center py-8 text-neu-text-primary/50">Loading...</div>
              ) : viewMode === 'virtual' ? (
                // Virtual Auditions View
                virtualAuditions.length === 0 ? (
                  <div className="text-center py-8 text-neu-text-primary/50">
                    No virtual auditions submitted
                  </div>
                ) : (
                  <div className="space-y-3">
                    {virtualAuditions.map((va) => {
                      const userName = va.profiles.first_name && va.profiles.last_name
                        ? `${va.profiles.first_name} ${va.profiles.last_name}`
                        : va.profiles.email;
                      const isSelected = selectedVirtualAudition?.virtual_audition_id === va.virtual_audition_id;

                      return (
                        <button
                          key={va.virtual_audition_id}
                          onClick={() => handleSelectVirtualAudition(va)}
                          className={`w-full p-4 sm:p-3 rounded-lg text-left transition-all active:scale-98 ${
                            isSelected
                              ? 'bg-neu-accent-primary/20 border-2 border-neu-accent-primary shadow-md'
                              : 'neu-card-inset border border-neu-border hover:border-neu-accent-primary/50 active:bg-neu-accent-primary/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={va.profiles.profile_photo_url}
                              alt={userName}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neu-text-primary truncate">{userName}</p>
                              <div className="flex items-center gap-2 text-xs text-neu-text-secondary mt-1">
                                <MdVideocam className="w-3 h-3" />
                                <span>{va.media_files.length} video{va.media_files.length !== 1 ? 's' : ''}</span>
                              </div>
                              <p className="text-xs text-neu-text-secondary mt-1">
                                {new Date(va.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : sortedSlots.length === 0 ? (
                <div className="text-center py-8 text-neu-text-primary/50">
                  No slots available
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => {
                    const isCollapsed = collapsedDates.has(dateKey);
                    const dateObj = new Date(dateKey);
                    const formattedDate = dateObj.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    });
                    const totalSignups = dateSlots.reduce((sum, slot) => {
                      return sum + getSignupsForSlot(slot.slot_id).length;
                    }, 0);

                    return (
                      <div key={dateKey} className="space-y-2">
                        {/* Date Header */}
                        <button
                          onClick={() => toggleDateCollapse(dateKey)}
                          className="w-full flex items-center justify-between p-4 sm:p-3 rounded-lg neu-card-raised border border-neu-border hover:border-neu-accent-primary transition-all active:scale-98"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? (
                              <MdChevronRight className="w-5 h-5 text-neu-text-primary" />
                            ) : (
                              <MdExpandMore className="w-5 h-5 text-neu-text-primary" />
                            )}
                            <span className="text-sm sm:text-base font-semibold text-neu-text-primary">
                              {formattedDate}
                            </span>
                          </div>
                          <span className="text-xs text-neu-text-primary/60">
                            {dateSlots.length} {dateSlots.length === 1 ? 'slot' : 'slots'} • {totalSignups} {totalSignups === 1 ? 'signup' : 'signups'}
                          </span>
                        </button>

                        {/* Slots for this date */}
                        {!isCollapsed && (
                          <div className="space-y-3 sm:space-y-4 pl-1 sm:pl-2">
                            {dateSlots.map((slot) => {
                    const slotSignups = getSignupsForSlot(slot.slot_id);
                    const now = new Date();
                    const startTime = new Date(slot.start_time);
                    const endTime = new Date(slot.end_time);
                    const isPast = now > endTime;
                    const isInProgress = now >= startTime && now <= endTime;
                    const isHighlighted = activeSlotId === slot.slot_id;
                    const isNext = isHighlighted && !isInProgress && !isPast;

                    return (
                      <div key={slot.slot_id} id={`live-slot-${slot.slot_id}`} className="space-y-2">
                        {/* Slot Time Header */}
                        <div className={`p-3 sm:p-3 rounded-lg ${
                          isInProgress 
                            ? 'bg-green-500/20 border-2 border-green-500'
                            : isNext
                            ? 'bg-neu-accent-primary/20 border-2 border-neu-accent-primary'
                            : isPast
                            ? 'neu-card-inset border border-neu-border opacity-60'
                            : 'neu-card-inset border border-neu-border'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neu-text-primary">
                                  {formatUSTime(slot.start_time)} - {formatUSTime(slot.end_time)}
                                </span>
                                {isInProgress && (
                                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                    <MdPlayArrow className="w-3 h-3" />
                                    NOW
                                  </span>
                                )}
                                {isNext && (
                                  <span className="flex items-center gap-1 text-xs text-neu-accent-primary font-medium">
                                    <MdChevronRight className="w-3 h-3" />
                                    NEXT
                                  </span>
                                )}
                                {isPast && (
                                  <span className="text-xs text-neu-text-primary/40">
                                    Completed
                                  </span>
                                )}
                              </div>
                              {slot.location && (
                                <div className="text-xs text-neu-text-primary/60 mt-1">
                                  📍 {slot.location}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-neu-text-primary/60">
                              {slotSignups.length} {slotSignups.length === 1 ? 'signup' : 'signups'}
                            </div>
                          </div>
                        </div>

                        {/* All Signups for this slot */}
                        {slotSignups.length > 0 ? (
                          <div className="space-y-2 pl-2 sm:pl-3">
                            {slotSignups.map((signup) => {
                              const userName = signup.profiles.first_name && signup.profiles.last_name
                                ? `${signup.profiles.first_name} ${signup.profiles.last_name}`
                                : signup.profiles.email;
                              
                              const isSelected = selectedSignup?.signup_id === signup.signup_id;
                              const hasMedia = signup.media_files && signup.media_files.length > 0;

                              return (
                                <button
                                  key={signup.signup_id}
                                  onClick={() => handleSelectSignup(signup)}
                                  className={`w-full text-left p-4 sm:p-3 rounded-lg transition-all flex items-center gap-3 active:scale-98 ${
                                    isSelected
                                      ? 'bg-neu-accent-primary/20 border-2 border-neu-accent-primary'
                                      : 'neu-card-raised border border-neu-border hover:border-neu-accent-primary active:bg-neu-accent-primary/10'
                                  }`}
                                >
                                  <Avatar
                                    src={signup.profiles.profile_photo_url}
                                    alt={userName}
                                    size="sm"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-neu-text-primary truncate">
                                      {userName}
                                    </div>
                                    {hasMedia && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-neu-accent-success">
                                          📎 {signup.media_files!.length}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-neu-text-primary/40 italic pl-3">
                            No signups yet
                          </div>
                        )}
                      </div>
                    );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Details Panel - Slide in on mobile, always visible on desktop */}
          <div className={`
            fixed lg:relative inset-0 lg:inset-auto
            z-50 lg:z-auto
            flex-1 
            bg-neu-surface lg:bg-transparent
            transition-transform duration-300 ease-out
            flex flex-col
            ${
              showMobileDetails 
                ? 'translate-x-0' 
                : 'translate-x-full lg:translate-x-0'
            }
          `}>
            {/* Mobile back button - Fixed at top */}
            {(selectedSignup || selectedVirtualAudition) && (
              <div className="lg:hidden sticky top-0 z-20 bg-neu-surface border-b border-neu-border p-4 flex items-center gap-3 shadow-md">
                <button
                  onClick={handleCloseMobileDetails}
                  className="neu-icon-btn-sm neu-button-primary shrink-0"
                  aria-label="Back to list"
                >
                  <MdArrowBack className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-semibold text-neu-text-primary">Details</h2>
              </div>
            )}
            
            {/* Scrollable content area */}
            <div className="flex-1 overflow-y-auto">
            {selectedVirtualAudition ? (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Actor Info */}
                <div className="neu-card-raised p-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedVirtualAudition.profiles.profile_photo_url}
                      alt={`${selectedVirtualAudition.profiles.first_name} ${selectedVirtualAudition.profiles.last_name}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary">
                        {selectedVirtualAudition.profiles.first_name && selectedVirtualAudition.profiles.last_name
                          ? `${selectedVirtualAudition.profiles.first_name} ${selectedVirtualAudition.profiles.last_name}`
                          : selectedVirtualAudition.profiles.email}
                      </h3>
                      <p className="text-sm text-neu-text-primary/60">{selectedVirtualAudition.profiles.email}</p>
                      <p className="text-sm text-neu-text-primary/60 mt-1">
                        Submitted: {new Date(selectedVirtualAudition.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submission Notes */}
                {selectedVirtualAudition.submission_notes && (
                  <div className="neu-card-raised p-4">
                    <h4 className="font-semibold text-neu-text-primary flex items-center gap-2 mb-3">
                      <MdSave className="w-5 h-5" />
                      Submission Notes
                    </h4>
                    <p className="text-neu-text-secondary whitespace-pre-wrap">
                      {selectedVirtualAudition.submission_notes}
                    </p>
                  </div>
                )}

                {/* Videos */}
                <div className="neu-card-raised p-4">
                  <h4 className="font-semibold text-neu-text-primary flex items-center gap-2 mb-3">
                    <MdVideocam className="w-5 h-5" />
                    Submitted Videos ({selectedVirtualAudition.media_files.length})
                  </h4>
                  {selectedVirtualAudition.media_files.length > 0 ? (
                    <div className="space-y-4">
                      {selectedVirtualAudition.media_files.map((file, index) => (
                        <div key={file.media_file_id} className="neu-card-inset p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <MdVideocam className="w-5 h-5 text-neu-accent-primary" />
                              <span className="font-medium text-neu-text-primary">Video {index + 1}</span>
                            </div>
                            <span className="text-xs text-neu-text-secondary">
                              {(file.file_size / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          </div>
                          <p className="text-sm text-neu-text-secondary mb-3">{file.file_name}</p>
                          <video
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: '400px' }}
                          >
                            <source src={file.file_url} type={file.file_type} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-neu-text-secondary text-center py-4">No videos submitted</p>
                  )}
                </div>
              </div>
            ) : selectedSignup ? (
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Actor Info */}
                <div className="neu-card-raised p-4">
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={selectedSignup.profiles.profile_photo_url}
                      alt={`${selectedSignup.profiles.first_name} ${selectedSignup.profiles.last_name}`}
                      size="lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-neu-text-primary">
                        {selectedSignup.profiles.first_name && selectedSignup.profiles.last_name
                          ? `${selectedSignup.profiles.first_name} ${selectedSignup.profiles.last_name}`
                          : selectedSignup.profiles.email}
                      </h3>
                      <p className="text-sm text-neu-text-primary/60">{selectedSignup.profiles.email}</p>
                      <p className="text-sm text-neu-text-primary/60 mt-1">
                        {formatUSTime(selectedSignup.audition_slots.start_time)} - {formatUSTime(selectedSignup.audition_slots.end_time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="neu-card-raised p-4">
                  <h4 className="font-semibold text-neu-text-primary flex items-center gap-2 mb-3">
                    <MdSave className="w-5 h-5" />
                    Production Notes
                  </h4>

                  {/* Existing Notes */}
                  {notes.length > 0 ? (
                    <div className="space-y-3 mb-4">
                      {notes.map((note) => {
                        const authorName = note.author.first_name && note.author.last_name
                          ? `${note.author.first_name} ${note.author.last_name}`
                          : note.author.email;
                        const isOwnNote = note.author_id === userId;
                        const noteDate = new Date(note.created_at);

                        const isEditing = editingNoteId === note.signup_note_id;

                        return (
                          <div key={note.signup_note_id} className="neu-card-inset p-3 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Avatar
                                src={note.author.profile_photo_url}
                                alt={authorName}
                                size="sm"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-neu-text-primary">
                                    {authorName}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-neu-text-primary/50">
                                      {noteDate.toLocaleString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        hour: 'numeric', 
                                        minute: '2-digit' 
                                      })}
                                    </span>
                                    {isOwnNote && !isEditing && (
                                      <>
                                        <button
                                          onClick={() => handleEditNote(note)}
                                          className="text-neu-accent-primary hover:text-neu-accent-primary/80"
                                          title="Edit note"
                                        >
                                          <MdEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteNote(note.signup_note_id)}
                                          className="text-red-400 hover:text-red-300"
                                          title="Delete note"
                                        >
                                          <MdDelete className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                    {isEditing && (
                                      <>
                                        <button
                                          onClick={handleSaveEdit}
                                          disabled={saving || !editNoteText.trim()}
                                          className="text-green-400 hover:text-green-300 disabled:opacity-50"
                                          title="Save"
                                        >
                                          <MdCheck className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="text-neu-text-primary/50 hover:text-neu-text-primary"
                                          title="Cancel"
                                        >
                                          <MdClose className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                {isEditing ? (
                                  <textarea
                                    value={editNoteText}
                                    onChange={(e) => setEditNoteText(e.target.value)}
                                    className="neu-input w-full min-h-[80px] p-2 rounded-lg text-sm"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-sm text-neu-text-primary whitespace-pre-wrap">
                                    {note.note_text}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-neu-text-primary/50 mb-4 italic">
                      No notes yet. Add the first note below.
                    </p>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-2">
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add your notes about this performance..."
                      className="neu-input w-full min-h-[100px] p-3 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={saving || !newNoteText.trim()}
                      className="n-button-primary px-4 py-2 rounded-lg text-sm w-full"
                    >
                      {saving ? 'Adding...' : 'Add Note'}
                    </button>
                  </div>
                </div>

                {/* Media Section */}
                <div className="neu-card-raised p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-neu-text-primary flex items-center gap-2">
                      <MdUpload className="w-5 h-5" />
                      Media Files
                    </h4>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="n-button-primary px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                    >
                      <MdUpload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {selectedSignup.media_files && selectedSignup.media_files.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedSignup.media_files.map((media, index) => (
                        <div key={index} className="neu-card-inset rounded-lg overflow-hidden relative group">
                          {media.type === 'image' ? (
                            <img 
                              src={media.url} 
                              alt={media.filename}
                              className="w-full h-40 object-cover"
                            />
                          ) : (
                            <video 
                              src={media.url}
                              className="w-full h-40 object-cover"
                              controls
                            />
                          )}
                          <div className="p-2 bg-neu-surface/90 backdrop-blur-sm">
                            <p className="text-xs text-neu-text-primary truncate">{media.filename}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-neu-text-primary/50">
                                {media.type === 'image' ? <MdImage className="w-3 h-3" /> : <MdVideocam className="w-3 h-3" />}
                              </span>
                              <button
                                onClick={() => handleDeleteMedia(media)}
                                className="neu-icon-btn-sm neu-icon-btn-danger"
                              >
                                <MdDelete className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neu-text-primary/50">
                      <MdImage className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No media files uploaded yet</p>
                      <p className="text-xs mt-1">Upload images or videos of the audition</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-neu-text-primary/50 p-4">
                <div className="text-center max-w-sm">
                  {viewMode === 'virtual' ? (
                    <>
                      <MdVideocam className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Select a virtual audition submission to view videos and details</p>
                    </>
                  ) : (
                    <>
                      <MdPerson className="w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-sm sm:text-base">Select an auditionee to view and manage their information</p>
                    </>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
