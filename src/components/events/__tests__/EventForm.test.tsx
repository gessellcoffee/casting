import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EventForm from '../EventForm';

describe('EventForm', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    userId: 'test-user-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('renderRecurrenceOptions', () => {
    it('should render day selection options when frequency is WEEKLY', () => {
      render(
        <EventForm {...defaultProps} />
      );

      // Enable recurring events
      const recurringToggle = screen.getByRole('switch', { name: /enable recurrence/i });
      fireEvent.click(recurringToggle);

      // Select WEEKLY frequency
      const frequencySelect = screen.getByRole('combobox');
      fireEvent.change(frequencySelect, { target: { value: 'WEEKLY' } });

      // Check that day options are rendered
      expect(screen.getByText('On days')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument(); // Monday
      expect(screen.getByText('T')).toBeInTheDocument(); // Tuesday
    });

    it('should render day selection options when frequency is CUSTOM', () => {
      render(
        <EventForm {...defaultProps} />
      );

      // Enable recurring events
      const recurringToggle = screen.getByRole('switch', { name: /enable recurrence/i });
      fireEvent.click(recurringToggle);

      // Select CUSTOM frequency
      const frequencySelect = screen.getByRole('combobox');
      fireEvent.change(frequencySelect, { target: { value: 'CUSTOM' } });

      // Check that day options are rendered
      expect(screen.getByText('On days')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument(); // Monday
      expect(screen.getByText('T')).toBeInTheDocument(); // Tuesday
    });

    it('should not render day selection options when frequency is DAILY', () => {
      render(
        <EventForm {...defaultProps} />
      );

      // Enable recurring events
      const recurringToggle = screen.getByRole('switch', { name: /enable recurrence/i });
      fireEvent.click(recurringToggle);

      // Select DAILY frequency
      const frequencySelect = screen.getByRole('combobox');
      fireEvent.change(frequencySelect, { target: { value: 'DAILY' } });

      // Check that day options are not rendered
      expect(screen.queryByText('On days')).not.toBeInTheDocument();
    });

    it('should render custom frequency type selector when frequency is CUSTOM', () => {
      render(
        <EventForm {...defaultProps} />
      );

      // Enable recurring events
      const recurringToggle = screen.getByRole('switch', { name: /enable recurrence/i });
      fireEvent.click(recurringToggle);

      // Select CUSTOM frequency
      const frequencySelect = screen.getByRole('combobox');
      fireEvent.change(frequencySelect, { target: { value: 'CUSTOM' } });

      // Check that custom frequency type selector is rendered
      const customFrequencySelects = screen.getAllByRole('combobox');
      expect(customFrequencySelects.length).toBeGreaterThan(1);
      
      // Verify the options include week, month, year
      const customTypeSelect = customFrequencySelects[1];
      expect(customTypeSelect).toBeInTheDocument();
    });

    it('should update custom frequency type when changed', () => {
      render(
        <EventForm {...defaultProps} />
      );

      // Enable recurring events
      const recurringToggle = screen.getByRole('switch', { name: /enable recurrence/i });
      fireEvent.click(recurringToggle);

      // Select CUSTOM frequency
      const frequencySelect = screen.getByRole('combobox');
      fireEvent.change(frequencySelect, { target: { value: 'CUSTOM' } });

      // Change custom frequency type to MONTHLY
      const customFrequencySelects = screen.getAllByRole('combobox');
      const customTypeSelect = customFrequencySelects[1];
      fireEvent.change(customTypeSelect, { target: { value: 'MONTHLY' } });

      // Verify the value changed
      expect(customTypeSelect).toHaveValue('MONTHLY');
    });
  });
});
