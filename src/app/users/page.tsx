'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import StarryContainer from '@/components/StarryContainer';
import { searchUsers, getAllSkills, getAllLocations } from '@/lib/supabase/userSearch';
import type { Profile } from '@/lib/supabase/types';
import { Search, MapPin, Award, User } from 'lucide-react';
import MultiSelectDropdown from '@/components/ui/forms/MultiSelectDropdown';

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [allSkills, setAllSkills] = useState<string[]>([]);
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const PAGE_SIZE = 20;

  // Load available skills and locations
  useEffect(() => {
    const loadFilters = async () => {
      const [skills, locations] = await Promise.all([
        getAllSkills(),
        getAllLocations(),
      ]);
      setAllSkills(skills);
      setAllLocations(locations);
    };
    loadFilters();
  }, []);

  // Debounced search function
  const performSearch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await searchUsers({
        query: searchQuery,
        skills: selectedSkills,
        location: locationFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });
      setUsers(result.users);
      setTotal(result.total);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkills, locationFilter, page]);

  // Trigger search with debounce for text input
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      performSearch();
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, selectedSkills, locationFilter, page]);

  const handleLocationChange = (location: string) => {
    setLocationFilter(location);
    setPage(0); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSkills([]);
    setLocationFilter('');
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <StarryContainer starCount={20} className="card mb-8">
          <div className="p-8">
            <h1 className="text-4xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#4a7bd9] via-[#5a8ff5] to-[#94b0f6] drop-shadow-[0_0_15px_rgba(90,143,245,0.5)] mb-2">
              Find Talent
            </h1>
            <p className="text-neu-text-primary/70 mb-6">
              Search for actors, directors, and theater professionals
            </p>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neu-text-primary/50 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by name, username, or bio..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border text-neu-text-primary placeholder-neu-text-primary/50 focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border text-neu-text-primary focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50"
                >
                  <option value="">All Locations</option>
                  {allLocations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Skills Filter */}
              <div>
                <MultiSelectDropdown
                  label={
                    <>
                      <Award className="inline w-4 h-4 mr-1" />
                      Skills ({selectedSkills.length} selected)
                    </>
                  }
                  placeholder="Select skills..."
                  options={allSkills}
                  selectedValues={selectedSkills}
                  onChange={(values) => {
                    setSelectedSkills(values);
                    setPage(0);
                  }}
                  className="z-[100000]"
                  itemsPerPage={20}
                />
              </div>
            </div>

            {/* Clear Filters */}
            {(searchQuery || selectedSkills.length > 0 || locationFilter) && (
              <button
                onClick={clearFilters}
                className="mb-4 text-sm text-neu-accent-primary hover:text-[#6a9fff] underline"
              >
                Clear all filters
              </button>
            )}

            {/* Results Count */}
            <div className="text-sm text-neu-text-primary/70 mb-4">
              {loading ? 'Searching...' : `Found ${total} user${total !== 1 ? 's' : ''}`}
            </div>
          </div>
        </StarryContainer>

        {/* User Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-neu-accent-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <StarryContainer starCount={10} className="card">
            <div className="p-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-neu-text-primary/30" />
              <p className="text-neu-text-primary/70 text-lg">No users found</p>
              <p className="text-neu-text-primary/50 text-sm mt-2">
                Try adjusting your search criteria
              </p>
            </div>
          </StarryContainer>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {users.map((user) => {
                const fullName = [user.first_name, user.last_name]
                  .filter(Boolean)
                  .join(' ') || user.username || 'Anonymous User';

                return (
                  <Link key={user.id} href={`/profile/${user.id}`}>
                    <StarryContainer starCount={5} className="card h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="p-6">
                        {/* Profile Photo */}
                        <div className="flex flex-col items-center mb-4">
                          {user.profile_photo_url ? (
                            <img
                              src={user.profile_photo_url}
                              alt={fullName}
                              className="w-24 h-24 rounded-full border-4 border-neu-border object-cover"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-full border-4 border-neu-border bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 flex items-center justify-center">
                              <User className="w-12 h-12 text-[#4a7bd9]/50" />
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="text-xl font-semibold text-neu-text-primary text-center mb-2">
                          {fullName}
                        </h3>

                        {/* Username */}
                        {user.username && (
                          <p className="text-sm text-neu-text-primary/60 text-center mb-3">
                            @{user.username}
                          </p>
                        )}

                        {/* Location */}
                        {user.location && (
                          <div className="flex items-center justify-center gap-1 text-sm text-neu-text-primary/70 mb-3">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}

                        {/* Bio Preview */}
                        {user.description && (
                          <p className="text-sm text-neu-text-primary/70 text-center mb-4 line-clamp-2">
                            {user.description}
                          </p>
                        )}

                        {/* Skills */}
                        {user.skills && user.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {user.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 rounded-full bg-[#4a7bd9]/20 border border-neu-border text-neu-text-primary text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                            {user.skills.length > 3 && (
                              <span className="px-2 py-1 rounded-full bg-neu-surface/50 border border-neu-border text-neu-text-primary/50 text-xs">
                                +{user.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </StarryContainer>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="n-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-neu-text-primary">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="n-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
