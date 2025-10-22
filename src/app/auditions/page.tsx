'use client';

import { useState, useEffect } from 'react';
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

    setFilteredAuditions(filtered);
  };

  return (
    <StarryContainer>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-4xl font-bold text-[#c5ddff] mb-2">
                  Browse Auditions
                </h1>
                <p className="text-[#c5ddff]/70">
                  Find your next role and sign up for audition slots
                </p>
              </div>
              <Link
                href="/my-auditions"
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-[#2e3e5e] to-[#26364e] border border-[#5a8ff5]/30 text-[#c5ddff] shadow-[3px_3px_6px_var(--cosmic-shadow-dark),-3px_-3px_6px_var(--cosmic-shadow-light)] hover:shadow-[inset_3px_3px_6px_var(--cosmic-shadow-dark),inset_-3px_-3px_6px_var(--cosmic-shadow-light)] hover:text-[#5a8ff5] transition-all duration-200 font-medium flex items-center gap-2 whitespace-nowrap"
              >
                <MdCalendarToday className="w-5 h-5" />
                My Calendar
              </Link>
            </div>
          </div>

          {/* Filters */}
          <AuditionFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
          />

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-[#c5ddff]/70">Loading auditions...</div>
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
              <div className="text-[#c5ddff]/70 mb-4">
                {searchQuery || filters.equityStatus !== 'all' || filters.dateRange !== 'all'
                  ? 'No auditions match your filters'
                  : 'No auditions posted yet'}
              </div>
              {(searchQuery || filters.equityStatus !== 'all' || filters.dateRange !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ equityStatus: 'all', dateRange: 'all' });
                  }}
                  className="text-[#5a8ff5] hover:text-[#94b0f6] transition-colors"
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
