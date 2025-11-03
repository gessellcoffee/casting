'use client';

import React, { useState, useRef, useEffect, Fragment, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown, X, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  label?: ReactNode;
  placeholder?: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  error?: string;
  helperText?: string;
  itemsPerPage?: number;
}

export default function MultiSelectDropdown({
  label,
  placeholder = 'Select options...',
  options,
  selectedValues,
  onChange,
  className = '',
  error,
  helperText,
  itemsPerPage = 20,
}: MultiSelectDropdownProps) {
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const openStateRef = useRef(false);

  // Filter options based on search query
  const filteredOptions = query === ''
    ? options
    : options.filter((option) =>
        option.toLowerCase().includes(query.toLowerCase())
      );

  // Get visible options for infinite scroll
  const visibleOptions = filteredOptions.slice(0, visibleCount);
  const hasMore = visibleCount < filteredOptions.length;

  // Handle scroll for infinite loading
  const handleScroll = () => {
    if (!listRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80%
    if (scrollPercentage > 0.8) {
      setVisibleCount((prev) => Math.min(prev + itemsPerPage, filteredOptions.length));
    }
  };

  // Reset visible count when query changes
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [query, itemsPerPage]);

  // Function to update dropdown position
  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  // Handle selection
  const handleChange = (values: string[]) => {
    onChange(values);
  };

  // Remove a selected value
  const removeValue = (valueToRemove: string) => {
    onChange(selectedValues.filter((v) => v !== valueToRemove));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary/70 mb-2">
          {label}
        </label>
      )}

      <Listbox value={selectedValues} onChange={handleChange} multiple>
        {({ open }) => {
          // Update position when opened
          if (open && !openStateRef.current) {
            openStateRef.current = true;
            requestAnimationFrame(updatePosition);
          } else if (!open) {
            openStateRef.current = false;
          }
          
          return (
        <div className="relative">
          {/* Selected Values Display - Wrapped in Button to make entire area clickable */}
          <Listbox.Button ref={buttonRef} className="w-full text-left">
            <div className="w-full rounded-xl bg-gradient-to-br from-neu-surface/50 to-neu-surface-dark/50 border border-neu-border min-h-[44px] flex flex-wrap gap-2 p-2">
              {selectedValues.length > 0 ? (
                selectedValues.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#4a7bd9] text-white text-sm"
                  >
                    {value}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeValue(value);
                      }}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-neu-text-primary/50 py-1 px-2 text-sm">
                  {placeholder}
                </span>
              )}
              {/* Chevron Icon */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="w-5 h-5 text-neu-text-primary/50" aria-hidden="true" />
              </div>
            </div>
          </Listbox.Button>

          {/* Dropdown Options - Rendered in Portal */}
          {typeof window !== 'undefined' && createPortal(
            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => setQuery('')}
            >
              <Listbox.Options 
                className="neu-dropdown max-h-80 overflow-hidden"
                style={{
                  position: 'fixed',
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`,
                  zIndex: 99999,
                }}
              >
              {/* Search Input */}
              <div className="sticky top-0 bg-gradient-to-br from-neu-surface to-neu-surface-dark backdrop-filter backdrop-blur-sm border-b border-neu-border p-3 z-[10000]">
                <div className="relative z-[10001]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neu-text-primary/50 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-neu-surface-dark/50 border border-neu-border text-neu-text-primary placeholder-neu-text-primary/50 focus:outline-none focus:ring-2 focus:ring-neu-accent-primary/50 text-sm relative z-[10002]"
                    placeholder="Search..."
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
              </div>

              {/* Options List with Infinite Scroll */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                className="overflow-y-auto max-h-60 py-2"
              >
                {visibleOptions.length === 0 && query !== '' ? (
                  <div className="px-4 py-3 text-sm text-neu-text-primary/50">
                    No results found
                  </div>
                ) : visibleOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-neu-text-primary/50">
                    No options available
                  </div>
                ) : (
                  <>
                    {visibleOptions.map((option) => (
                      <Listbox.Option
                        key={option}
                        value={option}
                        className={({ active }) =>
                          `neu-dropdown-item relative pl-10 pr-4 ${
                            active ? 'bg-[#4a7bd9]/20' : ''
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {option}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#4a7bd9]">
                                <Check className="w-4 h-4" aria-hidden="true" />
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                    {hasMore && (
                      <div className="px-4 py-2 text-xs text-neu-text-primary/50 text-center">
                        Scroll for more...
                      </div>
                    )}
                  </>
                )}
              </div>
              </Listbox.Options>
            </Transition>,
            document.body
          )}
        </div>
          );
        }}
      </Listbox>

      {error && (
        <p className="text-neu-accent-danger text-xs mt-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-neu-text-primary/50 text-xs mt-1">{helperText}</p>
      )}
    </div>
  );
}
