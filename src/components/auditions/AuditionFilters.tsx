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
    state: string;
    city: string;
    compensation: string;
  };
  onFiltersChange: (filters: any) => void;
  states: string[];
  cities: string[];
}

export default function AuditionFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  states,
  cities,
}: AuditionFiltersProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debouncedQuery = useDebounce(localQuery, 300);

  // Call onSearchChange when debounced value changes
  useEffect(() => {
    onSearchChange(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  return (
    <div className="mb-8 p-6 rounded-2xl neu-card-raised">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

        {/* State Filter */}
        <FormSelect
          label="State"
          value={filters.state}
          onChange={(e) => onFiltersChange({ ...filters, state: e.target.value, city: 'all' })}
        >
          <option value="all">All States</option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </FormSelect>

        {/* City Filter */}
        <FormSelect
          label="City"
          value={filters.city}
          onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
        >
          <option value="all">All Cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </FormSelect>

        {/* Compensation Filter */}
        <FormSelect
          label="Compensation"
          value={filters.compensation}
          onChange={(e) => onFiltersChange({ ...filters, compensation: e.target.value })}
        >
          <option value="all">All</option>
          <option value="paid">💰 Paid</option>
          <option value="not-paid">🎭 Non-Paid</option>
        </FormSelect>
      </div>
    </div>
  );
}
