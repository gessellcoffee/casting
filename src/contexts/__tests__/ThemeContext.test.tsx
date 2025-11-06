import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';
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

// Test component that uses the theme context
function TestComponent() {
  const { theme, toggleTheme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <button onClick={toggleTheme} data-testid="toggle-button">
        Toggle Theme
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark-button">
        Set Dark
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light-button">
        Set Light
      </button>
    </div>
  );
}

describe('ThemeContext', () => {
  const mockUser = { id: 'user-123' };
  const mockProfile = {
    id: 'user-123',
    email: 'testuser',
    preferences: { dark_mode: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document attribute
    document.documentElement.removeAttribute('data-theme');
  });

  describe('Theme Loading', () => {
    it('should load light theme when user has no dark mode preference', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue({
        ...mockProfile,
        preferences: { dark_mode: false },
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should load dark theme when user has dark mode preference enabled', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue({
        ...mockProfile,
        preferences: { dark_mode: true },
      });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should default to light theme when user is not logged in', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('should handle errors gracefully when loading theme', async () => {
      (getUser as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle from light to dark theme', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const toggleButton = screen.getByTestId('toggle-button');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should toggle from dark to light theme', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue({
        ...mockProfile,
        preferences: { dark_mode: true },
      });
      (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const toggleButton = screen.getByTestId('toggle-button');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference to user profile when toggling', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const toggleButton = screen.getByTestId('toggle-button');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      await waitFor(() => {
        expect(updateProfile).toHaveBeenCalledWith('user-123', {
          preferences: {
            dark_mode: true,
          },
        });
      });
    });

    it('should handle save errors gracefully', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const toggleButton = screen.getByTestId('toggle-button');
      await act(async () => {
        await userEvent.click(toggleButton);
      });

      // Theme should still change locally even if save fails
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving theme preference:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('setTheme Function', () => {
    it('should set theme to dark directly', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const setDarkButton = screen.getByTestId('set-dark-button');
      await act(async () => {
        await userEvent.click(setDarkButton);
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('should set theme to light directly', async () => {
      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue({
        ...mockProfile,
        preferences: { dark_mode: true },
      });
      (updateProfile as jest.Mock).mockResolvedValue({ data: {}, error: null });

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      const setLightButton = screen.getByTestId('set-light-button');
      await act(async () => {
        await userEvent.click(setLightButton);
      });

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('useTheme Hook', () => {
    it('should throw error when used outside ThemeProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within a ThemeProvider');

      consoleSpy.mockRestore();
    });
  });
});
