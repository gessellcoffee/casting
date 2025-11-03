import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../ThemeToggle';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { getUser } from '@/lib/supabase';
import { getProfile, updateProfile } from '@/lib/supabase/profile';

// Mock the Supabase functions
jest.mock('@/lib/supabase', () => ({
  getUser: jest.fn(),
}));

jest.mock('@/lib/supabase/profile', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

describe('ThemeToggle Component', () => {
  const mockUser = { id: 'user-123' };
  const mockProfile = {
    id: 'user-123',
    username: 'testuser',
    preferences: { dark_mode: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should render loading state initially', () => {
    (getUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(screen.getByLabelText('Loading theme')).toBeInTheDocument();
  });

  it('should render moon icon in light mode', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme')).not.toBeInTheDocument();
    });

    const button = screen.getByLabelText('Switch to dark mode');
    expect(button).toBeInTheDocument();
  });

  it('should render sun icon in dark mode', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getProfile as jest.Mock).mockResolvedValue({
      ...mockProfile,
      preferences: { dark_mode: true },
    });

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme')).not.toBeInTheDocument();
    });

    const button = screen.getByLabelText('Switch to light mode');
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getProfile as jest.Mock).mockResolvedValue(mockProfile);
    (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme')).not.toBeInTheDocument();
    });

    const button = screen.getByLabelText('Switch to dark mode');
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should have proper accessibility attributes', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme')).not.toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    expect(button).toHaveAttribute('title', 'Switch to dark mode');
  });

  it('should apply neumorphic button styling', async () => {
    (getUser as jest.Mock).mockResolvedValue(mockUser);
    (getProfile as jest.Mock).mockResolvedValue(mockProfile);

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.queryByLabelText('Loading theme')).not.toBeInTheDocument();
    });

    const button = screen.getByRole('button');
    expect(button).toHaveClass('neu-icon-btn');
  });

  it('should be disabled during loading', () => {
    (getUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});
