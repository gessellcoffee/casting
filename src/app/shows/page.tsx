'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllShows, searchShows, deleteShow } from '@/lib/supabase/shows';
import { getShowRoleCount } from '@/lib/supabase/roles';
import { supabase } from '@/lib/supabase/client';
import type { Show } from '@/lib/supabase/types';
import FormInput from '@/components/ui/forms/FormInput';
import LoadingSpinner from '@/components/ui/feedback/LoadingSpinner';
import EmptyState from '@/components/ui/feedback/EmptyState';
import { useDebounce } from '@/lib/hooks/useDebounce';
import StarryContainer from '@/components/StarryContainer';

interface ShowWithStats extends Show {
  roleCount?: number;
}

export default function ShowsPage() {
  const router = useRouter();
  const [shows, setShows] = useState<ShowWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadShows();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadShows = async () => {
    setLoading(true);
    const data = await getAllShows();
    
    // Load role counts for each show
    const showsWithStats = await Promise.all(
      data.map(async (show) => {
        const roleCount = await getShowRoleCount(show.show_id);
        return { ...show, roleCount };
      })
    );
    
    setShows(showsWithStats);
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadShows();
      return;
    }

    setLoading(true);
    const data = await searchShows(query);
    
    // Load role counts for search results
    const showsWithStats = await Promise.all(
      data.map(async (show) => {
        const roleCount = await getShowRoleCount(show.show_id);
        return { ...show, roleCount };
      })
    );
    
    setShows(showsWithStats);
    setLoading(false);
  };

  const handleDelete = async (showId: string) => {
    const { error } = await deleteShow(showId);
    
    if (error) {
      alert(`Error deleting show: ${error.message}`);
      return;
    }
    
    setDeleteConfirm(null);
    loadShows();
  };

  const canManageShow = (show: Show) => {
    return currentUserId && show.creator_user_id === currentUserId;
  };

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearchQuery !== '') {
      handleSearch(debouncedSearchQuery);
    } else {
      loadShows();
    }
  }, [debouncedSearchQuery]);

  return (
    <StarryContainer>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold text-neu-text-primary">Show Management</h1>
            <Link
              href="/cast/new"
              className="n-button-primary px-6 py-3 rounded-lg"
            >
              + Create New Show
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <FormInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shows by title..."
              className="pr-12"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neu-text-primary/40 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingSpinner message="Loading shows..." />
        )}

        {/* Empty State */}
        {!loading && shows.length === 0 && (
          <EmptyState
            icon="🎭"
            title={searchQuery ? 'No shows found' : 'No shows yet'}
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Create your first show to get started'
            }
            action={
              !searchQuery ? (
                <Link
                  href="/cast/new"
                  className="n-button-primary px-6 py-3 rounded-lg"
                >
                  Create Your First Show
                </Link>
              ) : undefined
            }
          />
        )}

        {/* Shows Grid */}
        {!loading && shows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shows.map((show) => (
              <div
                key={show.show_id}
                className="p-6 rounded-xl neu-card-raised shadow-[5px_5px_10px_var(--neu-shadow-dark),-5px_-5px_10px_var(--neu-shadow-light)] hover:border-neu-border-focus transition-all duration-300"
              >
                {/* Show Header */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-neu-text-primary mb-2">
                    {show.title}
                  </h3>
                  {show.author && (
                    <p className="text-sm text-neu-text-primary/60">by {show.author}</p>
                  )}
                </div>

                {/* Show Description */}
                {show.description && (
                  <p className="text-neu-text-primary/70 text-sm mb-4 line-clamp-3">
                    {show.description}
                  </p>
                )}

                {/* Show Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-neu-text-primary/60">
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{show.roleCount || 0} roles</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{new Date(show.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/shows/${show.show_id}`}
                    className="n-button-primary flex-1 px-4 py-2 rounded-lg"
                  >
                    View Details
                  </Link>
                  {canManageShow(show) && (
                    <>
                      {deleteConfirm === show.show_id ? (
                        <div className="flex gap-2 flex-1">
                          <button
                            onClick={() => handleDelete(show.show_id)}
                            className="n-button-danger flex-1 px-3 py-2 rounded-lg"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="n-button-secondary flex-1 px-3 py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(show.show_id)}
                          className="n-button-danger px-4 py-2 rounded-lg"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StarryContainer>
  );
}
