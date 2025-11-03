import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LocationAutocomplete from '../LocationAutocomplete';
import * as googleMapsConfig from '@/lib/google-maps/config';

// Mock the Google Maps config
jest.mock('@/lib/google-maps/config', () => ({
  loadGoogleMapsScript: jest.fn(),
  isGoogleMapsConfigured: jest.fn(),
  GOOGLE_MAPS_OPTIONS: {
    autocompleteOptions: {
      types: ['(cities)'],
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
    },
  },
}));

describe('LocationAutocomplete', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Without Google Maps API', () => {
    beforeEach(() => {
      (googleMapsConfig.isGoogleMapsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should render as manual text input when API is not configured', async () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          placeholder="Enter location"
        />
      );

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter location');
        expect(input).toBeInTheDocument();
      });

      expect(screen.getByText(/Google Maps API key not configured/i)).toBeInTheDocument();
    });

    it('should handle manual text input', async () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      fireEvent.change(input, { target: { value: 'New York' } });

      expect(mockOnChange).toHaveBeenCalledWith('New York');
    });

    it('should display label when provided', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          label="Your Location"
        />
      );

      expect(screen.getByText('Your Location')).toBeInTheDocument();
    });

    it('should display error message when provided', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          error="Location is required"
        />
      );

      expect(screen.getByText('Location is required')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('With Google Maps API', () => {
    beforeEach(() => {
      (googleMapsConfig.isGoogleMapsConfigured as jest.Mock).mockReturnValue(true);
      (googleMapsConfig.loadGoogleMapsScript as jest.Mock).mockResolvedValue(undefined);

      // Mock Google Maps API
      const mockAutocomplete = {
        addListener: jest.fn(),
        getPlace: jest.fn(),
      };

      (window as any).google = {
        maps: {
          places: {
            Autocomplete: jest.fn(() => mockAutocomplete),
          },
        },
      };
    });

    afterEach(() => {
      delete (window as any).google;
    });

    it('should load Google Maps script on mount', async () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(googleMapsConfig.loadGoogleMapsScript).toHaveBeenCalled();
      });
    });

    it('should show loading state while script loads', () => {
      (googleMapsConfig.loadGoogleMapsScript as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('should initialize autocomplete after script loads', async () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(window.google?.maps.places.Autocomplete).toHaveBeenCalled();
      });
    });

    it('should show helper text when Google Maps is ready', async () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Start typing to see location suggestions/i)).toBeInTheDocument();
      });
    });

    it('should handle script loading errors gracefully', async () => {
      (googleMapsConfig.loadGoogleMapsScript as jest.Mock).mockRejectedValue(
        new Error('Failed to load')
      );

      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load location services/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      (googleMapsConfig.isGoogleMapsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should have accessible input', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          label="Location"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should associate label with input', () => {
      render(
        <LocationAutocomplete
          value="New York"
          onChange={mockOnChange}
          label="Your Location"
        />
      );

      const label = screen.getByText('Your Location');
      expect(label).toBeInTheDocument();
    });

    it('should show error with appropriate styling', () => {
      render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          error="Invalid location"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Value handling', () => {
    beforeEach(() => {
      (googleMapsConfig.isGoogleMapsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should display provided value', () => {
      render(
        <LocationAutocomplete
          value="San Francisco, CA"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('San Francisco, CA');
    });

    it('should update value on change', () => {
      const { rerender } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Chicago' } });

      expect(mockOnChange).toHaveBeenCalledWith('Chicago');

      rerender(
        <LocationAutocomplete
          value="Chicago"
          onChange={mockOnChange}
        />
      );

      expect((input as HTMLInputElement).value).toBe('Chicago');
    });
  });

  describe('Custom styling', () => {
    beforeEach(() => {
      (googleMapsConfig.isGoogleMapsConfigured as jest.Mock).mockReturnValue(false);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <LocationAutocomplete
          value=""
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });
});
