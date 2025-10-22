import {
  getUserResumes,
  getResumeEntry,
  createResumeEntry,
  updateResumeEntry,
  deleteResumeEntry,
} from '../resume';
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

describe('Resume CRUD Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockResumeEntryId = 'resume-789';

  const mockResumeEntry = {
    resume_entry_id: mockResumeEntryId,
    user_id: mockAuthenticatedUserId,
    company_name: 'Shakespeare Theater Company',
    show_name: 'Hamlet',
    role: 'Ophelia',
    date_of_production: '2024',
    source: 'theater' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserResumes', () => {
    it('should fetch all resume entries for a user', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [mockResumeEntry],
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getUserResumes(mockAuthenticatedUserId);

      expect(result).toEqual([mockResumeEntry]);
      expect(supabase.from).toHaveBeenCalledWith('user_resume');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getUserResumes(mockAuthenticatedUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getResumeEntry', () => {
    it('should fetch a single resume entry by ID', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockResumeEntry,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getResumeEntry(mockResumeEntryId);

      expect(result).toEqual(mockResumeEntry);
      expect(supabase.from).toHaveBeenCalledWith('user_resume');
    });

    it('should return null on error', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getResumeEntry(mockResumeEntryId);

      expect(result).toBeNull();
    });
  });

  describe('createResumeEntry', () => {
    it('should allow users to create their own resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful database insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockResumeEntry,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createResumeEntry({
        user_id: mockAuthenticatedUserId,
        company_name: 'Shakespeare Theater Company',
        show_name: 'Hamlet',
        role: 'Ophelia',
        date_of_production: '2024',
        source: 'theater',
      });

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockResumeEntry);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should prevent users from creating resume entries for other users', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock database insert (should not be called)
      const mockInsert = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Attempt to create resume entry for another user
      const result = await createResumeEntry({
        user_id: mockOtherUserId,
        company_name: 'Test Company',
        show_name: 'Test Show',
        role: 'Test Role',
        date_of_production: '2024',
        source: 'theater',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockInsert = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createResumeEntry({
        user_id: mockAuthenticatedUserId,
        company_name: 'Test Company',
        show_name: 'Test Show',
        role: 'Test Role',
        date_of_production: '2024',
        source: 'theater',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('updateResumeEntry', () => {
    it('should allow users to update their own resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return existing entry
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockResumeEntry,
            error: null,
          }),
        }),
      });

      // Mock successful database update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockResumeEntry, role: 'Hamlet' },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelectForGet })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await updateResumeEntry(mockResumeEntryId, {
        role: 'Hamlet',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.role).toBe('Hamlet');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent users from updating other users resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return entry owned by another user
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockResumeEntry, user_id: mockOtherUserId },
            error: null,
          }),
        }),
      });

      // Mock database update (should not be called)
      const mockUpdate = jest.fn();

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelectForGet })
        .mockReturnValueOnce({ update: mockUpdate });

      const result = await updateResumeEntry(mockResumeEntryId, {
        role: 'Malicious',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should handle non-existent resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return null
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelectForGet,
      });

      const result = await updateResumeEntry(mockResumeEntryId, {
        role: 'Test',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('not found');
      expect(result.data).toBeNull();
    });
  });

  describe('deleteResumeEntry', () => {
    it('should allow users to delete their own resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return existing entry
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockResumeEntry,
            error: null,
          }),
        }),
      });

      // Mock successful database delete
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelectForGet })
        .mockReturnValueOnce({ delete: mockDelete });

      const result = await deleteResumeEntry(mockResumeEntryId);

      expect(result.error).toBeNull();
      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should prevent users from deleting other users resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return entry owned by another user
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...mockResumeEntry, user_id: mockOtherUserId },
            error: null,
          }),
        }),
      });

      // Mock database delete (should not be called)
      const mockDelete = jest.fn();

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({ select: mockSelectForGet })
        .mockReturnValueOnce({ delete: mockDelete });

      const result = await deleteResumeEntry(mockResumeEntryId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.success).toBe(false);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle non-existent resume entries', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getResumeEntry to return null
      const mockSelectForGet = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Not found'),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelectForGet,
      });

      const result = await deleteResumeEntry(mockResumeEntryId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('not found');
      expect(result.success).toBe(false);
    });

    it('should reject unauthenticated delete requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockDelete = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await deleteResumeEntry(mockResumeEntryId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.success).toBe(false);
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
