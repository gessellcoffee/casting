import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getShow,
  getUserShows,
  getAllShows,
  createShow,
  updateShow,
  deleteShow,
  searchShows,
} from '../shows';
import type { Show } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Shows Functions', () => {
  const mockShow: Show = {
    show_id: 'show-123',
    title: 'Hamilton',
    author: 'Lin-Manuel Miranda',
    description: 'An American Musical',
    creator_user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getShow', () => {
    it('should fetch a show by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getShow('show-123');

      expect(supabase.from).toHaveBeenCalledWith('shows');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
      expect(result).toEqual(mockShow);
    });

    it('should return null when show is not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Not found' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getShow('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getUserShows', () => {
    it('should fetch all shows for a user', async () => {
      const mockShows = [mockShow, { ...mockShow, show_id: 'show-456', title: 'Wicked' }];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockShows, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserShows('user-123');

      expect(supabase.from).toHaveBeenCalledWith('shows');
      expect(mockEq).toHaveBeenCalledWith('creator_user_id', 'user-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockShows);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserShows('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getAllShows', () => {
    it('should fetch all shows ordered by title', async () => {
      const mockShows = [mockShow, { ...mockShow, show_id: 'show-456', title: 'Wicked' }];
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockShows, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAllShows();

      expect(supabase.from).toHaveBeenCalledWith('shows');
      expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
      expect(result).toEqual(mockShows);
    });
  });

  describe('createShow', () => {
    it('should create a show successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const showData = {
        title: 'Hamilton',
        author: 'Lin-Manuel Miranda',
        description: 'An American Musical',
      };

      const result = await createShow(showData);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('shows');
      expect(mockInsert).toHaveBeenCalledWith({
        ...showData,
        creator_user_id: mockUser.id,
      });
      expect(result.data).toEqual(mockShow);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await createShow({ title: 'Test Show' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await createShow({ title: 'Test Show' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateShow', () => {
    it('should update a show successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getShow
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEqForUpdate = jest.fn().mockReturnThis();
      const mockSelectForUpdate = jest.fn().mockReturnThis();
      const mockSingleForUpdate = jest.fn().mockResolvedValue({ 
        data: { ...mockShow, title: 'Updated Title' }, 
        error: null 
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for getShow
          return {
            select: mockSelectForGet,
          };
        } else {
          // Second call for update
          return {
            update: mockUpdate,
          };
        }
      });

      mockSelectForGet.mockReturnValue({
        eq: mockEqForGet,
      });
      mockEqForGet.mockReturnValue({
        single: mockSingleForGet,
      });

      mockUpdate.mockReturnValue({
        eq: mockEqForUpdate,
      });
      mockEqForUpdate.mockReturnValue({
        select: mockSelectForUpdate,
      });
      mockSelectForUpdate.mockReturnValue({
        single: mockSingleForUpdate,
      });

      const result = await updateShow('show-123', { title: 'Updated Title' });

      expect(result.data?.title).toBe('Updated Title');
      expect(result.error).toBeNull();
    });

    it('should return error when show not found', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateShow('nonexistent', { title: 'Updated' });

      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Show not found');
    });

    it('should return error when user is not authorized', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'other@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateShow('show-123', { title: 'Updated' });

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('deleteShow', () => {
    it('should delete a show successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getShow
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      // Mock delete
      const mockDelete = jest.fn().mockReturnThis();
      const mockEqForDelete = jest.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mockSelectForGet,
          };
        } else {
          return {
            delete: mockDelete,
          };
        }
      });

      mockSelectForGet.mockReturnValue({
        eq: mockEqForGet,
      });
      mockEqForGet.mockReturnValue({
        single: mockSingleForGet,
      });

      mockDelete.mockReturnValue({
        eq: mockEqForDelete,
      });

      const result = await deleteShow('show-123');

      expect(result.error).toBeNull();
    });

    it('should return error when user is not authorized to delete', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'other@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockShow, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await deleteShow('show-123');

      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('searchShows', () => {
    it('should search shows by title', async () => {
      const mockShows = [mockShow];
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockShows, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });
      mockIlike.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await searchShows('Hamilton');

      expect(supabase.from).toHaveBeenCalledWith('shows');
      expect(mockIlike).toHaveBeenCalledWith('title', '%Hamilton%');
      expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockShows);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Search error' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        ilike: mockIlike,
      });
      mockIlike.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await searchShows('test');

      expect(result).toEqual([]);
    });
  });
});
