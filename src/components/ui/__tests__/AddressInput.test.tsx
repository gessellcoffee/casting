import React from 'react';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddressInput from '../AddressInput';

// Mock window.google
const mockAutocompleteService = {
  getPlacePredictions: jest.fn(),
};

const mockPlacesService = {
  getDetails: jest.fn(),
};

beforeEach(() => {
  // Setup Google Maps mock
  (global as any).google = {
    maps: {
      places: {
        AutocompleteService: jest.fn(() => mockAutocompleteService),
        PlacesService: jest.fn(() => mockPlacesService),
        PlacesServiceStatus: {
          OK: 'OK',
          ZERO_RESULTS: 'ZERO_RESULTS',
        },
      },
    },
  };
});

describe('AddressInput', () => {
  it('renders with default props', () => {
    const onChange = jest.fn();
    render(<AddressInput value="" onChange={onChange} />);
    
    expect(screen.getByPlaceholderText('Enter address...')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('renders with custom label and placeholder', () => {
    const onChange = jest.fn();
    render(
      <AddressInput
        value=""
        onChange={onChange}
        label="Custom Label"
        placeholder="Custom placeholder"
      />
    );
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    const onChange = jest.fn();
    render(<AddressInput value="" onChange={onChange} required />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn();
    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main St' } });
    
    expect(onChange).toHaveBeenCalledWith('123 Main St', false);
  });

  it('displays the current value', () => {
    const onChange = jest.fn();
    render(<AddressInput value="123 Main Street" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...') as HTMLInputElement;
    expect(input.value).toBe('123 Main Street');
  });

  it('is disabled when disabled prop is true', () => {
    const onChange = jest.fn();
    render(<AddressInput value="" onChange={onChange} disabled />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    expect(input).toBeDisabled();
  });

  it('fetches suggestions when user types', async () => {
    const onChange = jest.fn();
    const mockPredictions = [
      {
        place_id: '1',
        description: '123 Main St, City, State',
        structured_formatting: {
          main_text: '123 Main St',
          secondary_text: 'City, State',
        },
      },
    ];

    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback: any) => {
      callback(mockPredictions, 'OK');
    });

    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      expect(mockAutocompleteService.getPlacePredictions).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('displays suggestions when available', async () => {
    const onChange = jest.fn();
    const mockPredictions = [
      {
        place_id: '1',
        description: '123 Main St, City, State',
        structured_formatting: {
          main_text: '123 Main St',
          secondary_text: 'City, State',
        },
      },
    ];

    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback: any) => {
      callback(mockPredictions, 'OK');
    });

    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('City, State')).toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls onChange with verified address when suggestion is selected', async () => {
    const onChange = jest.fn();
    const mockPredictions = [
      {
        place_id: '1',
        description: '123 Main St, City, State',
        structured_formatting: {
          main_text: '123 Main St',
          secondary_text: 'City, State',
        },
      },
    ];

    const mockPlaceDetails = {
      formatted_address: '123 Main Street, City, State 12345',
      geometry: {
        location: {
          lat: () => 40.7128,
          lng: () => -74.0060,
        },
      },
      name: '123 Main St',
    };

    mockAutocompleteService.getPlacePredictions.mockImplementation((request, callback: any) => {
      callback(mockPredictions, 'OK');
    });

    mockPlacesService.getDetails.mockImplementation((request, callback: any) => {
      callback(mockPlaceDetails, 'OK');
    });

    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
    }, { timeout: 500 });

    const suggestion = screen.getByText('123 Main St');
    fireEvent.click(suggestion);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        '123 Main Street, City, State 12345',
        true,
        expect.objectContaining({
          lat: 40.7128,
          lng: -74.0060,
          placeId: '1',
          formattedAddress: '123 Main Street, City, State 12345',
        })
      );
    });
  });

  it('handles API errors gracefully', async () => {
    const onChange = jest.fn();
    
    mockAutocompleteService.getPlacePredictions.mockImplementation((request: any, callback: any) => {
      callback(null, 'ERROR');
    });

    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main' } });

    await waitFor(() => {
      expect(screen.getAllByText('Unable to fetch address suggestions').length).toBeGreaterThan(0);
    }, { timeout: 500 });
  });

  it('works as standard input when Google Maps is not available', () => {
    // Remove Google Maps mock
    delete (global as any).google;

    const onChange = jest.fn();
    render(<AddressInput value="" onChange={onChange} />);
    
    const input = screen.getByPlaceholderText('Enter address...');
    fireEvent.change(input, { target: { value: '123 Main St' } });
    
    expect(onChange).toHaveBeenCalledWith('123 Main St', false);
    expect(input).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AddressInput value="" onChange={onChange} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
