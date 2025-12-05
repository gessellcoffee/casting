'use client';

import { useState, useRef, useEffect } from 'react';
import { getUserByEmail, isValidEmail, searchUsers } from '@/lib/supabase/userLookup';
import { createCastingOfferByEmail } from '@/lib/supabase/castingOffers';
import { MdSearch, MdEmail } from 'react-icons/md';

interface Actor {
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url?: string | null;
}

interface SearchableCastSelectProps {
  value: string;
  onChange: (userId: string) => void;
  availableActors: Actor[];
  placeholder?: string;
  disabled?: boolean;
  auditionId: string;
  roleId: string | null;
  auditionRoleId?: string | null;
  isUnderstudy: boolean;
  currentUserId: string;
  onInviteSent?: () => void;
}

export default function SearchableCastSelect({
  value,
  onChange,
  availableActors,
  placeholder = 'Search by name or email...',
  disabled = false,
  auditionId,
  roleId,
  auditionRoleId,
  isUnderstudy,
  currentUserId,
  onInviteSent,
}: SearchableCastSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [searchResults, setSearchResults] = useState<Actor[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedActor = availableActors.find(a => a.user_id === value);

  // Search database for users when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Use the searchUsers function from userLookup
        const profiles = await searchUsers(searchQuery);

        // Transform to Actor format
        const actors: Actor[] = profiles.map(profile => ({
          user_id: profile.id,
          full_name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}`
            : profile.email || 'Unknown User',
          email: profile.email || '',
          profile_photo_url: profile.profile_photo_url,
        }));

        setSearchResults(actors);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Combine availableActors with search results, prioritizing availableActors
  const filteredActors = searchQuery.trim().length >= 2
    ? searchResults
    : availableActors.filter(actor => {
        const query = searchQuery.toLowerCase();
        return (
          actor.full_name.toLowerCase().includes(query) ||
          actor.email.toLowerCase().includes(query)
        );
      });

  // Check if search query is a valid email not in the list
  const isValidEmailNotInList = 
    isValidEmail(searchQuery) && 
    !searchResults.some(a => a.email.toLowerCase() === searchQuery.toLowerCase()) &&
    !availableActors.some(a => a.email.toLowerCase() === searchQuery.toLowerCase());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelectActor = (actor: Actor) => {
    onChange(actor.user_id);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleSendInvite = async () => {
    if (!isValidEmail(searchQuery)) {
      return;
    }

    setIsSendingInvite(true);

    try {
      const result = await createCastingOfferByEmail({
        auditionId,
        email: searchQuery.toLowerCase().trim(),
        roleId,
        auditionRoleId,
        isUnderstudy,
        sentBy: currentUserId,
        offerMessage: `You've been cast! Please join Belong Here Theater to accept your role.`,
      });

      if (result.error) {
        throw result.error;
      }

      // Success!
      setIsOpen(false);
      setSearchQuery('');
      
      if (onInviteSent) {
        onInviteSent();
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setIsSendingInvite(false);
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-visible z-1000">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (selectedActor?.full_name || '')}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="neu-input w-full pl-11 pr-8"
        />
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neu-text-primary/50 w-5 h-5" />
        {selectedActor && !isOpen && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neu-text-primary/50 hover:text-neu-text-primary"
          >
            ×
          </button>
        )}
      </div>

      {isOpen && (
        <div className="z-1000 w-full mt-2 neu-card-raised rounded-xl max-h-64 overflow-y-auto">
          {/* Show invite option if valid email with no results */}
          {isValidEmailNotInList && !isSearching && filteredActors.length === 0 && (
            <div className="px-4 py-3 bg-yellow-500/10">
              <p className="text-sm text-neu-text-primary mb-3">
                No user found with email: <strong>{searchQuery}</strong>
              </p>
              <button
                type="button"
                onClick={handleSendInvite}
                disabled={isSendingInvite}
                className="n-button-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MdEmail className="w-4 h-4" />
                {isSendingInvite ? 'Sending Invite...' : 'Invite to Belong Here Theater'}
              </button>
            </div>
          )}

          {/* Filtered actors list */}
          {filteredActors.length > 0 ? (
            <div>
              {filteredActors.map((actor) => (
                <button
                  key={actor.user_id}
                  type="button"
                  onClick={() => handleSelectActor(actor)}
                  className={`w-full px-4 py-3 text-left hover:bg-neu-surface/50 transition-colors ${
                    actor.user_id === value ? 'bg-neu-accent-primary/10' : ''
                  }`}
                >
                  <div className="font-medium text-neu-text-primary">{actor.full_name}</div>
                  <div className="text-sm text-neu-text-primary/60">{actor.email}</div>
                </button>
              ))}
            </div>
          ) : searchQuery && !isValidEmail(searchQuery) ? (
            <div className="px-4 py-3 text-center text-neu-text-primary/60">
              No actors found matching "{searchQuery}"
            </div>
          ) : !searchQuery && availableActors.length === 0 ? (
            <div className="px-4 py-3 text-center text-neu-text-primary/60">
              No actors available
            </div>
          ) : null}

          {isSearching && (
            <div className="px-4 py-3 text-center text-neu-text-primary/60">
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
