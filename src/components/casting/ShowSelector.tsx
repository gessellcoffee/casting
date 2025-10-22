'use client';

import { useState, useEffect } from 'react';
import { getUserShows, createShow, searchShows } from '@/lib/supabase/shows';
import type { Show } from '@/lib/supabase/types';
import RadioCard from '@/components/ui/forms/RadioCard';
import FormInput from '@/components/ui/forms/FormInput';
import FormTextarea from '@/components/ui/forms/FormTextarea';
import Alert from '@/components/ui/feedback/Alert';
import WizardNavigation from '@/components/ui/navigation/WizardNavigation';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface ShowSelectorProps {
  userId: string;
  companyId: string | null;
  selectedShowId: string | null;
  onSelect: (showId: string, showData: Show) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ShowSelector({
  userId,
  companyId,
  selectedShowId,
  onSelect,
  onNext,
  onBack,
}: ShowSelectorProps) {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchResults, setSearchResults] = useState<Show[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [newShow, setNewShow] = useState({
    title: '',
    author: '',
    description: '',
  });

  useEffect(() => {
    loadShows();
  }, [userId]);

  useEffect(() => {
    if (debouncedSearchTerm.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm]);

  const loadShows = async () => {
    setLoading(true);
    const userShows = await getUserShows(userId);
    setShows(userShows);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!debouncedSearchTerm.trim()) return;
    
    setSearching(true);
    const results = await searchShows(debouncedSearchTerm);
    setSearchResults(results);
    setSearching(false);
  };

  const handleCreateShow = async () => {
    if (!newShow.title.trim()) {
      setError('Show title is required');
      return;
    }

    setCreating(true);
    setError(null);

    const { data, error: createError } = await createShow({
      title: newShow.title.trim(),
      author: newShow.author.trim() || null,
      description: newShow.description.trim() || null,
    });

    if (createError) {
      setError('Failed to create show');
      setCreating(false);
      return;
    }

    if (data) {
      setShows([data, ...shows]);
      onSelect(data.show_id, data);
      setNewShow({ title: '', author: '', description: '' });
      setShowCreateForm(false);
    }

    setCreating(false);
  };

  const handleSelectShow = (show: Show) => {
    onSelect(show.show_id, show);
  };

  const handleNext = () => {
    if (!selectedShowId) {
      setError('Please select or create a show');
      return;
    }
    onNext();
  };

  if (loading) {
    return <div className="text-[#c5ddff]">Loading shows...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#c5ddff] mb-4">
          Select a Show
        </h2>
        <p className="text-[#c5ddff]/70 mb-6">
          Choose an existing show or create a new one for this audition.
        </p>
      </div>

      {/* Search Bar */}
      <FormInput
        label="Search for a Show"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by title..."
        helperText={searching ? 'Searching...' : undefined}
      />

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#b5ccff]">Search Results</h3>
          {searchResults.map((show) => (
            <RadioCard
              key={show.show_id}
              name="show"
              value={show.show_id}
              checked={selectedShowId === show.show_id}
              onChange={() => handleSelectShow(show)}
              title={show.title}
            >
              {show.author && (
                <div className="text-[#c5ddff]/60 text-sm">by {show.author}</div>
              )}
              {show.description && (
                <div className="text-[#c5ddff]/50 text-sm mt-1">{show.description}</div>
              )}
            </RadioCard>
          ))}
        </div>
      )}

      {/* Your Shows */}
      {shows.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-[#b5ccff]">Your Shows</h3>
          {shows.map((show) => (
            <RadioCard
              key={show.show_id}
              name="show"
              value={show.show_id}
              checked={selectedShowId === show.show_id}
              onChange={() => handleSelectShow(show)}
              title={show.title}
            >
              {show.author && (
                <div className="text-[#c5ddff]/60 text-sm">by {show.author}</div>
              )}
              {show.description && (
                <div className="text-[#c5ddff]/50 text-sm mt-1">{show.description}</div>
              )}
            </RadioCard>
          ))}
        </div>
      )}

      {/* Create New Show */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="text-[#5a8ff5] hover:text-[#94b0f6] transition-colors text-sm font-medium"
        >
          + Create New Show
        </button>
      ) : (
        <div className="p-4 rounded-xl bg-[#2e3e5e]/50 border border-[#4a7bd9]/20 space-y-4">
          <h3 className="text-lg font-medium text-[#c5ddff]">Create New Show</h3>
          
          <FormInput
            label="Title"
            required
            value={newShow.title}
            onChange={(e) => setNewShow({ ...newShow, title: e.target.value })}
            placeholder="Enter show title"
            disabled={creating}
          />

          <FormInput
            label="Author"
            value={newShow.author}
            onChange={(e) => setNewShow({ ...newShow, author: e.target.value })}
            placeholder="Enter author name"
            disabled={creating}
          />

          <FormTextarea
            label="Description"
            value={newShow.description}
            onChange={(e) => setNewShow({ ...newShow, description: e.target.value })}
            placeholder="Enter show description"
            rows={3}
            disabled={creating}
          />

          <div className="flex gap-2">
            <button
              onClick={handleCreateShow}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-[#5a8ff5] text-white hover:bg-[#4a7bd9] transition-colors disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewShow({ title: '', author: '', description: '' });
                setError(null);
              }}
              disabled={creating}
              className="px-4 py-2 rounded-xl bg-[#2e3e5e] text-[#c5ddff] hover:bg-[#3e4e6e] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {/* Navigation */}
      <WizardNavigation
        onBack={onBack}
        onNext={handleNext}
      />
    </div>
  );
}
