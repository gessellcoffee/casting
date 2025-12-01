'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/supabase/auth';
import { getUserCastMemberships } from '@/lib/supabase/castMembers';
import StarryContainer from '@/components/StarryContainer';
import ActorShowCard from '@/components/shows/ActorShowCard';
import Button from '@/components/Button';
import { Filter, X } from 'lucide-react';

type CastStatus = 'Offered' | 'Accepted' | 'Declined' | 'all';
type WorkflowStatus = 'auditioning' | 'casting' | 'offering_roles' | 'rehearsing' | 'performing' | 'completed' | 'all';

export default function MyShowsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [allShows, setAllShows] = useState<any[]>([]);
  const [filteredShows, setFilteredShows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<CastStatus>('all');
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [statusFilter, workflowFilter, allShows]);

  const loadData = async () => {
    setLoading(true);

    const currentUser = await getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);

    // Get all cast memberships
    const memberships = await getUserCastMemberships(currentUser.id);
    
    // Transform data to include workflow status and show info
    const showsData = memberships
      .filter(m => m.auditions && m.auditions.shows) // Only include valid shows
      .map(membership => ({
        ...membership,
        show_title: membership.auditions?.shows?.title || 'Untitled Show',
        show_author: membership.auditions?.shows?.author,
        company_name: membership.auditions?.companies?.name,
        audition_id: membership.auditions?.audition_id,
        workflow_status: membership.auditions?.workflow_status || 'auditioning',
        role_name: membership.role_info?.role_name || 'Ensemble',
        role_type: membership.role_info?.role_type,
        role_description: membership.role_info?.description,
      }));
    
    setAllShows(showsData);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...allShows];

    // Filter by cast status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(show => show.status === statusFilter);
    }

    // Filter by workflow status
    if (workflowFilter !== 'all') {
      filtered = filtered.filter(show => show.workflow_status === workflowFilter);
    }

    setFilteredShows(filtered);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setWorkflowFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || workflowFilter !== 'all';

  // Count shows by status
  const offeredCount = allShows.filter(s => s.status === 'Offered').length;
  const acceptedCount = allShows.filter(s => s.status === 'Accepted').length;
  const declinedCount = allShows.filter(s => s.status === 'Declined').length;

  if (loading) {
    return (
      <StarryContainer>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-neu-text-primary/70">Loading your shows...</div>
        </div>
      </StarryContainer>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-neu-text-primary mb-2">My Shows</h1>
            <p className="text-neu-text-secondary">
              View all productions you're cast in and manage your schedule
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="neu-stat-card">
              <div className="text-2xl font-bold text-neu-text-primary">{allShows.length}</div>
              <div className="text-sm text-neu-text-secondary">Total Shows</div>
            </div>
            <div className="neu-stat-card">
              <div className="text-2xl font-bold text-yellow-400">{offeredCount}</div>
              <div className="text-sm text-neu-text-secondary">Pending</div>
            </div>
            <div className="neu-stat-card">
              <div className="text-2xl font-bold text-green-400">{acceptedCount}</div>
              <div className="text-sm text-neu-text-secondary">Accepted</div>
            </div>
            <div className="neu-stat-card">
              <div className="text-2xl font-bold text-red-400">{declinedCount}</div>
              <div className="text-sm text-neu-text-secondary">Declined</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Filter size={18} />
              <span className="font-medium">Filters</span>
              {hasActiveFilters && (
                <span className="ml-2 neu-badge neu-badge-primary neu-badge-pill text-xs">
                  Active
                </span>
              )}
            </Button>

            {showFilters && (
              <div className="mt-4 neu-container">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neu-text-primary">Filter Shows</h3>
                  {hasActiveFilters && (
                    <Button
                      onClick={clearFilters}
                      variant="secondary"
                      className="flex items-center gap-1 text-sm"
                    >
                      <X size={16} />
                      <span>Clear All</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      Cast Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'Offered', 'Accepted', 'Declined'] as CastStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`n-button-primary ${
                            statusFilter === status
                              ? 'neu-shadow-pressed border-neu-accent-primary text-neu-accent-primary'
                              : ''
                          }`}
                        >
                          {status === 'all' ? 'All' : status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Workflow Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-neu-text-primary mb-2">
                      Production Stage
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'auditioning', 'casting', 'offering_roles', 'rehearsing', 'performing', 'completed'] as WorkflowStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => setWorkflowFilter(status)}
                          className={`n-button-primary neu-button-sm ${
                            workflowFilter === status
                              ? 'neu-shadow-pressed border-neu-accent-primary text-neu-accent-primary'
                              : ''
                          }`}
                        >
                          {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-neu-text-secondary">
                  Showing {filteredShows.length} of {allShows.length} shows
                </div>
              </div>
            )}
          </div>

          {/* Shows List */}
          <div className="space-y-4">
            {filteredShows.length === 0 ? (
              <div className="neu-card-raised p-12 text-center">
                <p className="text-neu-text-secondary text-lg mb-2">
                  {hasActiveFilters ? 'No shows match your filters' : 'No shows yet'}
                </p>
                <p className="text-neu-text-secondary text-sm">
                  {hasActiveFilters
                    ? 'Try adjusting your filters to see more results'
                    : 'Accept casting offers to see your shows here'}
                </p>
              </div>
            ) : (
              <>
                {/* Group by status */}
                {statusFilter === 'all' && (
                  <>
                    {filteredShows.filter(s => s.status === 'Offered').length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                          Pending Offers
                        </h2>
                        <div className="space-y-4">
                          {filteredShows
                            .filter(s => s.status === 'Offered')
                            .map((show) => (
                              <ActorShowCard
                                key={show.cast_member_id}
                                show={show}
                                userId={user.id}
                                onUpdate={loadData}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {filteredShows.filter(s => s.status === 'Accepted').length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-green-400"></span>
                          Active Shows
                        </h2>
                        <div className="space-y-4">
                          {filteredShows
                            .filter(s => s.status === 'Accepted')
                            .map((show) => (
                              <ActorShowCard
                                key={show.cast_member_id}
                                show={show}
                                userId={user.id}
                                onUpdate={loadData}
                              />
                            ))}
                        </div>
                      </div>
                    )}

                    {filteredShows.filter(s => s.status === 'Declined').length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-xl font-semibold text-neu-text-primary mb-4 flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-400"></span>
                          Declined
                        </h2>
                        <div className="space-y-4">
                          {filteredShows
                            .filter(s => s.status === 'Declined')
                            .map((show) => (
                              <ActorShowCard
                                key={show.cast_member_id}
                                show={show}
                                userId={user.id}
                                onUpdate={loadData}
                              />
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Show all if filtering */}
                {statusFilter !== 'all' && (
                  <div className="space-y-4">
                    {filteredShows.map((show) => (
                      <ActorShowCard
                        key={show.cast_member_id}
                        show={show}
                        userId={user.id}
                        onUpdate={loadData}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </StarryContainer>
  );
}
