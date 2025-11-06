'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MdLocationOn, MdCheckCircle, MdError } from 'react-icons/md';

interface AddressInputProps {
  value: string;
  onChange: (value: string, isVerified: boolean, placeDetails?: PlaceDetails) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export interface PlaceDetails {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  formattedAddress: string;
}

export default function AddressInput({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Enter address...',
  required = false,
  className = '',
  disabled = false,
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize Google Places API
  useEffect(() => {
    const initGooglePlaces = () => {
      if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
        try {
          autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
          placesService.current = new (window as any).google.maps.places.PlacesService(
            document.createElement('div')
          );
        } catch (err) {
          console.error('Failed to initialize Google Places API:', err);
          setError('Address verification unavailable');
        }
      }
    };

    // Check if Google Maps is already loaded
    if ((window as any).google?.maps?.places) {
      initGooglePlaces();
    } else {
      // Wait for Google Maps to load (with timeout)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if ((window as any).google?.maps?.places) {
          initGooglePlaces();
          clearInterval(checkInterval);
        } else if (attempts >= maxAttempts) {
          console.warn('Google Maps API not loaded. Address verification will be disabled.');
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, []);

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    if (!autocompleteService.current) {
      console.warn(
        'Google Places API not initialized. Address autocomplete is disabled.\n' +
        'To enable: Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local\n' +
        'See QUICK_START_ADDRESS_VERIFICATION.md for setup instructions.'
      );
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      autocompleteService.current.getPlacePredictions(
        {
          input,
          types: ['geocode'],
        },
        (predictions: any[], status: any) => {
          setIsLoading(false);
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
            setShowSuggestions(true);
          } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([]);
            setShowSuggestions(false);
          } else {
            setError('Unable to fetch address suggestions');
            setSuggestions([]);
          }
        }
      );
    } catch (err) {
      setIsLoading(false);
      setError('Error fetching suggestions');
      console.error('Address autocomplete error:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsVerified(false);
    onChange(newValue, false);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the API call
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const selectSuggestion = (prediction: any) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['formatted_address', 'geometry', 'name'],
      },
      (place: any, status: any) => {
        setIsLoading(false);
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
          const placeDetails: PlaceDetails = {
            address: place.name || prediction.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: prediction.place_id,
            formattedAddress: place.formatted_address,
          };

          setInputValue(place.formatted_address);
          setIsVerified(true);
          setShowSuggestions(false);
          setSuggestions([]);
          onChange(place.formatted_address, true, placeDetails);
        } else {
          setError('Unable to verify address');
        }
      }
    );
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neu-text-primary mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neu-accent-primary">
          <MdLocationOn className="w-5 h-5" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-neu-surface border border-neu-border text-neu-text-primary placeholder-neu-text-muted focus:outline-none focus:border-neu-border-focus focus:ring-2 focus:ring-neu-accent-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && (
            <div className="w-5 h-5 border-2 border-[#5a8ff5] border-t-transparent rounded-full animate-spin" />
          )}
          {!isLoading && isVerified && (
            <MdCheckCircle className="w-5 h-5 text-green-400" title="Address verified" />
          )}
          {!isLoading && error && (
            <MdError className="w-5 h-5 text-red-400" title={error} />
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="z-[10000] w-full mt-2 rounded-xl max-h-60 overflow-y-auto"
          style={{
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)',
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.place_id}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left border-none flex items-start gap-3 transition-colors first:rounded-t-xl last:rounded-b-xl"
              style={{
                background: 'var(--neu-surface)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--neu-surface-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--neu-surface)';
              }}
            >
              <MdLocationOn className="w-5 h-5 mt-0.5 flex-shrink-0 text-neu-accent-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neu-text-primary truncate">
                  {suggestion.structured_formatting.main_text}
                </div>
                <div className="text-xs text-neu-text-secondary truncate">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
          <MdError className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {!error && !isVerified && inputValue && (
        <div className="mt-2 text-xs text-neu-text-primary/60">
          Start typing to see address suggestions
        </div>
      )}
    </div>
  );
}
