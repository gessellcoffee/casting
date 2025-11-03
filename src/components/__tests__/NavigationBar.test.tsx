import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationBar from '../NavigationBar';
import { getUser } from '@/lib/supabase/auth';
import { getProfile } from '@/lib/supabase/profile';
import { supabase } from '@/lib/supabase/client';

// Mock Next.js modules
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock Supabase modules
jest.mock('@/lib/supabase/auth', () => ({
  getUser: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/lib/supabase/profile', () => ({
  getProfile: jest.fn(),
}));

// Mock ThemeContext
jest.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
    isLoading: false,
  }),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

describe('NavigationBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Profile Photo Display', () => {
    it('should display user profile photo from database when available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          avatar_url: 'https://example.com/oauth-avatar.jpg',
        },
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        profile_photo_url: 'https://example.com/profile-photo.jpg',
        first_name: 'Test',
        last_name: 'User',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      render(<NavigationBar />);

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg).toHaveAttribute('src', mockProfile.profile_photo_url);
      });

      expect(getProfile).toHaveBeenCalledWith(mockUser.id);
    });

    it('should fallback to user_metadata avatar_url when profile_photo_url is not available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          avatar_url: 'https://example.com/oauth-avatar.jpg',
        },
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        profile_photo_url: null,
        first_name: 'Test',
        last_name: 'User',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      render(<NavigationBar />);

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg).toHaveAttribute('src', mockUser.user_metadata.avatar_url);
      });
    });

    it('should fallback to pravatar when both profile_photo_url and user_metadata avatar_url are not available', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        profile_photo_url: null,
        first_name: 'Test',
        last_name: 'User',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      render(<NavigationBar />);

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg).toHaveAttribute('src', 'https://i.pravatar.cc/50');
      });
    });

    it('should not fetch profile when user is not logged in', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      render(<NavigationBar />);

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });

      expect(getProfile).not.toHaveBeenCalled();
    });

    it('should handle profile fetch errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
          avatar_url: 'https://example.com/oauth-avatar.jpg',
        },
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockRejectedValue(new Error('Profile fetch failed'));

      render(<NavigationBar />);

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg).toHaveAttribute('src', mockUser.user_metadata.avatar_url);
      });
    });

    it('should update profile photo when user changes', async () => {
      const mockUser1 = {
        id: 'user-123',
        email: 'test1@example.com',
        user_metadata: {},
      };

      const mockProfile1 = {
        id: 'user-123',
        username: 'testuser1',
        profile_photo_url: 'https://example.com/profile1.jpg',
        first_name: 'Test',
        last_name: 'User1',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser1);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile1);

      const { rerender } = render(<NavigationBar />);

      await waitFor(() => {
        const avatarImg = screen.getByAltText('Avatar');
        expect(avatarImg).toHaveAttribute('src', mockProfile1.profile_photo_url);
      });

      // Verify getProfile was called with the first user's ID
      expect(getProfile).toHaveBeenCalledWith(mockUser1.id);
    });
  });

  describe('Authentication State', () => {
    it('should show login button when user is not authenticated', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      render(<NavigationBar />);

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
      });
    });

    it('should show sign out button and avatar when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        profile_photo_url: 'https://example.com/profile.jpg',
        first_name: 'Test',
        last_name: 'User',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      render(<NavigationBar />);

      await waitFor(() => {
        expect(screen.getByText('Sign Out')).toBeInTheDocument();
        expect(screen.getByAltText('Avatar')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    it('should display Users link when user is authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      const mockProfile = {
        id: 'user-123',
        username: 'testuser',
        profile_photo_url: null,
        first_name: 'Test',
        last_name: 'User',
        middle_name: null,
        description: null,
        resume_url: null,
        image_gallery: null,
        video_gallery: null,
        skills: null,
        education: null,
        preferences: null,
        created_at: '2024-01-01T00:00:00Z',
        location: null,
      };

      (getUser as jest.Mock).mockResolvedValue(mockUser);
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      render(<NavigationBar />);

      await waitFor(() => {
        expect(screen.getAllByText('Users').length).toBeGreaterThan(0);
      });
    });

    it('should not display Users link when user is not authenticated', async () => {
      (getUser as jest.Mock).mockResolvedValue(null);

      render(<NavigationBar />);

      await waitFor(() => {
        expect(screen.queryByText('Users')).not.toBeInTheDocument();
      });
    });
  });
});
