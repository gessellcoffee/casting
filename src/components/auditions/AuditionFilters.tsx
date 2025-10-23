'use client';

import { useState, useEffect } from 'react';
import FormInput from '@/components/ui/forms/FormInput';
import FormSelect from '@/components/ui/forms/FormSelect';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface AuditionFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: {
    equityStatus: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
}

export default function AuditionFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}: AuditionFiltersProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Call onSearchChange when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  return (
    <div className="mb-8 p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-neu-border/60 shadow-neu-raised">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <FormInput
          label="Search"
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder="Search by show or company..."
        />

        {/* Equity Status */}
        <FormSelect
          label="Equity Status"
          value={filters.equityStatus}
          onChange={(e) => onFiltersChange({ ...filters, equityStatus: e.target.value })}
        >
          <option value="all">All</option>
          <option value="Equity">Equity</option>
          <option value="Non-Equity">Non-Equity</option>
          <option value="Hybrid">Hybrid</option>
        </FormSelect>

        {/* Date Range */}
        <FormSelect
          label="Audition Date"
          value={filters.dateRange}
          onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value })}
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </FormSelect>
      </div>
    </div>
  );
}
