'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAuditionsWithDetails } from '@/lib/supabase/auditionQueries';
import StarryContainer from '@/components/StarryContainer';
import AuditionCard from '@/components/auditions/AuditionCard';
import AuditionFilters from '@/components/auditions/AuditionFilters';
import Link from 'next/link';
import { MdCalendarToday } from 'react-icons/md';

export default function AuditionsPage() {
  const [auditions, setAuditions] = useState<any[]>([]);
  const [filteredAuditions, setFilteredAuditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    equityStatus: 'all',
    dateRange: 'all',
    state: 'all',
    city: 'all',
  });

  useEffect(() => {
    loadAuditions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditions, searchQuery, filters]);

  const loadAuditions = async () => {
    setLoading(true);
    const { data, error } = await getAuditionsWithDetails();
    
    if (data) {
      setAuditions(data);
    }
    
    setLoading(false);
  };

  // Helper function to extract state from location string
  const extractState = (location: string | null): string | null => {
    if (!location) return null;
    // Common US address format: "Street, City, State ZIP"
    // or "City, State ZIP"
    // State is typically a 2-letter code before the ZIP
    const stateMatch = location.match(/,\s*([A-Z]{2})\s+\d{5}/);
    if (stateMatch) return stateMatch[1];
    
    // Try alternative format: "City, State"
    const altMatch = location.match(/,\s*([A-Z]{2})\s*(?:,|$)/);
    if (altMatch) return altMatch[1];
    
    return null;
  };

  // Helper function to extract city from location string
  const extractCity = (location: string | null): string | null => {
    if (!location) return null;
    // Common format: "Street, City, State ZIP" or "City, State ZIP"
    // Find the state code first, then get the part before it
    const parts = location.split(',').map(p => p.trim());
    
    // Find which part contains the state code (2 letters followed by optional ZIP)
    let stateIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      // Check if this part starts with a 2-letter state code
      if (/^[A-Z]{2}(\s+\d{5})?/.test(parts[i])) {
        stateIndex = i;
        break;
      }
    }
    
    // If we found a state, get the part immediately before it
    if (stateIndex > 0) {
      const cityPart = parts[stateIndex - 1];
      // Remove any leading numbers/addresses and get the city name
      const cityMatch = cityPart.match(/^(?:\d+\s+)?(.+?)$/);
      if (cityMatch) {
        const city = cityMatch[1].trim();
        // Make sure it's not empty and looks like a city (not just numbers)
        if (city && /[A-Za-z]/.test(city)) {
          return city;
        }
      }
    }
    
    return null;
  };

  // Extract unique states and cities from auditions
  const { states, cities } = useMemo(() => {
    const statesSet = new Set<string>();
    const citiesSet = new Set<string>();
    
    auditions.forEach(audition => {
      const state = extractState(audition.audition_location);
      const city = extractCity(audition.audition_location);
      
      if (state) statesSet.add(state);
      if (city) citiesSet.add(city);
    });
    
    return {
      states: Array.from(statesSet).sort(),
      cities: Array.from(citiesSet).sort(),
    };
  }, [auditions]);

  // Filter cities based on selected state
  const filteredCities = useMemo(() => {
    if (filters.state === 'all') return cities;
    
    const citiesInState = new Set<string>();
    auditions.forEach(audition => {
      const state = extractState(audition.audition_location);
      const city = extractCity(audition.audition_location);
      
      if (state === filters.state && city) {
        citiesInState.add(city);
      }
    });
    
    return Array.from(citiesInState).sort();
  }, [auditions, filters.state, cities]);

  const applyFilters = () => {
    let filtered = [...auditions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(audition => 
        audition.show?.title?.toLowerCase().includes(query) ||
        audition.company?.name?.toLowerCase().includes(query)
      );
    }

    // Equity status filter
    if (filters.equityStatus !== 'all') {
      filtered = filtered.filter(audition => 
        audition.equity_status === filters.equityStatus
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter(audition => {
        if (!audition.slots || audition.slots.length === 0) return false;
        
        const earliestSlot = audition.slots.reduce((earliest: any, slot: any) => {
          const slotDate = new Date(slot.start_time);
          return !earliest || slotDate < new Date(earliest.start_time) ? slot : earliest;
        }, null);

        if (!earliestSlot) return false;
        
        const slotDate = new Date(earliestSlot.start_time);
        const daysDiff = Math.ceil((slotDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        switch (filters.dateRange) {
          case 'today':
            return daysDiff === 0;
          case 'week':
            return daysDiff >= 0 && daysDiff <= 7;
          case 'month':
            return daysDiff >= 0 && daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    // State filter
    if (filters.state !== 'all') {
      filtered = filtered.filter(audition => {
        const state = extractState(audition.audition_location);
        return state === filters.state;
      });
    }

    // City filter
    if (filters.city !== 'all') {
      filtered = filtered.filter(audition => {
        const city = extractCity(audition.audition_location);
        return city === filters.city;
      });
    }

    setFilteredAuditions(filtered);
  };

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto on-background">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-neu-text-primary mb-2">
                  Browse Auditions
                </h1>
                <p className="text-neu-text-secondary">
                  Find your next role and sign up for audition slots
                </p>
              </div>
              <Link
                href="/my-auditions"
                className="n-button-primary flex items-center justify-center gap-2 whitespace-nowrap sm:flex-shrink-0"
              >
                <MdCalendarToday className="w-5 h-5" />
                <span className="hidden sm:inline">My Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </Link>
            </div>
          </div>

          {/* Filters */}
          <AuditionFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            states={states}
            cities={filteredCities}
          />

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-neu-text-secondary">Loading auditions...</div>
            </div>
          )}

          {/* Auditions Grid */}
          {!loading && filteredAuditions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAuditions.map((audition) => (
                <AuditionCard key={audition.audition_id} audition={audition} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAuditions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-neu-text-secondary mb-4">
                {searchQuery || filters.equityStatus !== 'all' || filters.dateRange !== 'all' || filters.state !== 'all' || filters.city !== 'all'
                  ? 'No auditions match your filters'
                  : 'No auditions posted yet'}
              </div>
              {(searchQuery || filters.equityStatus !== 'all' || filters.dateRange !== 'all' || filters.state !== 'all' || filters.city !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ equityStatus: 'all', dateRange: 'all', state: 'all', city: 'all' });
                  }}
                  className="n-button-secondary"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </StarryContainer>
  );
}
