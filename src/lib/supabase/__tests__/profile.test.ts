import { updateProfile } from '../profile';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Profile Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should allow users to update their own profile', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful database update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: mockAuthenticatedUserId, first_name: 'John' },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateProfile(mockAuthenticatedUserId, {
        first_name: 'John',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent users from updating other users profiles', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock database update (should not be called)
      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      // Attempt to update another user's profile
      const result = await updateProfile(mockOtherUserId, {
        first_name: 'Malicious',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateProfile(mockAuthenticatedUserId, {
        first_name: 'John',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should handle authentication errors gracefully', async () => {
      // Mock authentication error
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: new Error('Auth service unavailable'),
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateProfile(mockAuthenticatedUserId, {
        first_name: 'John',
      });

      expect(result.error).toBeTruthy();
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
