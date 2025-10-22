import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlotsList from '../SlotsList';
import * as auditionSignups from '@/lib/supabase/auditionSignups';

// Mock the auditionSignups module
jest.mock('@/lib/supabase/auditionSignups', () => ({
  createAuditionSignup: jest.fn(),
  getUserSignupForAudition: jest.fn(),
  getUserSignupsWithTimes: jest.fn(),
  doSlotsOverlap: jest.fn(),
  deleteAuditionSignup: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('SlotsList', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSlots = [
    {
      slot_id: 'slot-1',
      start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      end_time: new Date(Date.now() + 90000000).toISOString(),
      location: 'Theater A',
      max_signups: 10,
      current_signups: 3,
    },
    {
      slot_id: 'slot-2',
      start_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      end_time: new Date(Date.now() + 176400000).toISOString(),
      location: 'Theater B',
      max_signups: 10,
      current_signups: 5,
    },
  ];

  const mockUserSignup = {
    signup_id: 'signup-123',
    slot_id: 'slot-1',
    user_id: 'user-123',
    audition_slots: {
      slot_id: 'slot-1',
      start_time: mockSlots[0].start_time,
      end_time: mockSlots[0].end_time,
      location: 'Theater A',
    },
  };

  const mockOnSignupSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(null);
    (auditionSignups.getUserSignupsWithTimes as any).mockResolvedValue([]);
    (auditionSignups.doSlotsOverlap as any).mockReturnValue(false);
  });

  describe('Cancel Signup', () => {
    it('should display cancel button when user has a signup', async () => {
      (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(mockUserSignup);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("You're signed up for this audition")).toBeInTheDocument();
      });

      expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
    });

    it('should call deleteAuditionSignup when cancel button is clicked and confirmed', async () => {
      (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(mockUserSignup);
      (auditionSignups.deleteAuditionSignup as any).mockResolvedValue({ error: null });
      
      // Mock window.confirm to return true
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => true);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Signup');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith(
          'Are you sure you want to cancel this audition signup? You can sign up for a different slot afterwards.'
        );
        expect(auditionSignups.deleteAuditionSignup).toHaveBeenCalledWith('signup-123');
      });
    });

    it('should not call deleteAuditionSignup when cancel is not confirmed', async () => {
      (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(mockUserSignup);
      
      // Mock window.confirm to return false
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => false);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Signup');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
      });

      expect(auditionSignups.deleteAuditionSignup).not.toHaveBeenCalled();
    });

    it('should refresh signup state after successful cancellation', async () => {
      (auditionSignups.getUserSignupForAudition as any)
        .mockResolvedValueOnce(mockUserSignup)
        .mockResolvedValueOnce(null);
      (auditionSignups.deleteAuditionSignup as any).mockResolvedValue({ error: null });
      (auditionSignups.getUserSignupsWithTimes as any).mockResolvedValue([]);
      
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => true);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Signup');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(auditionSignups.getUserSignupsWithTimes).toHaveBeenCalledWith('user-123');
        expect(mockOnSignupSuccess).toHaveBeenCalled();
      });
    });

    it('should display error message when cancellation fails', async () => {
      (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(mockUserSignup);
      (auditionSignups.deleteAuditionSignup as any).mockResolvedValue({ 
        error: { message: 'Failed to delete' } 
      });
      
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => true);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Signup');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to delete')).toBeInTheDocument();
      });
    });

    it('should disable cancel button while canceling', async () => {
      (auditionSignups.getUserSignupForAudition as any).mockResolvedValue(mockUserSignup);
      (auditionSignups.deleteAuditionSignup as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      );
      
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => true);

      render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel Signup') as HTMLButtonElement;
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Canceling...')).toBeInTheDocument();
      });

      // Button should be disabled
      const disabledButton = screen.getByText('Canceling...').closest('button');
      expect(disabledButton).toBeDisabled();
    });
  });

  describe('Slot Display', () => {
    it('should enable signup buttons after canceling existing signup', async () => {
      (auditionSignups.getUserSignupForAudition as any)
        .mockResolvedValueOnce(mockUserSignup)
        .mockResolvedValueOnce(null);
      (auditionSignups.deleteAuditionSignup as any).mockResolvedValue({ error: null });
      (auditionSignups.getUserSignupsWithTimes as any).mockResolvedValue([]);
      
      global.confirm = jest.spyOn(global, 'confirm').mockImplementation(() => true);

      const { rerender } = render(
        <SlotsList
          slots={mockSlots}
          auditionId="audition-123"
          user={mockUser}
          onSignupSuccess={mockOnSignupSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Cancel Signup')).toBeInTheDocument();
      });

      // Initially, signup buttons should show "Already Signed Up"
      const alreadySignedUpButtons = screen.getAllByText('Already Signed Up');
      expect(alreadySignedUpButtons.length).toBeGreaterThan(0);

      const cancelButton = screen.getByText('Cancel Signup');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(auditionSignups.deleteAuditionSignup).toHaveBeenCalled();
      });

      // After cancellation, the info box should be gone
      await waitFor(() => {
        expect(screen.queryByText("You're signed up for this audition")).not.toBeInTheDocument();
      });
    });
  });
});
