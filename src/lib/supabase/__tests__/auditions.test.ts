import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getAudition,
  getAuditionWithDetails,
  getShowAuditions,
  getUserAuditions,
  getCompanyAuditions,
  getAllAuditions,
  createAudition,
  updateAudition,
  deleteAudition,
  markAuditionSlotsFilled,
  searchAuditions,
} from '../auditions';
import type { Audition } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Auditions Functions', () => {
  const mockAudition: Audition = {
    audition_id: 'audition-123',
    show_id: 'show-123',
    user_id: 'user-123',
    company_id: 'company-123',
    rehearsal_dates: 'March 1-15, 2024',
    rehearsal_location: 'Studio Theater',
    performance_dates: 'March 20-30, 2024',
    performance_location: 'Main Stage',
    ensemble_size: 10,
    equity_status: 'Non-Equity',
    show_filled_slots: false,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAudition', () => {
    it('should fetch an audition by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAudition('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('auditions');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result).toEqual(mockAudition);
    });

    it('should return null when audition is not found', async () => {
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

      const result = await getAudition('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAuditionWithDetails', () => {
    it('should fetch audition with related show and company data', async () => {
      const mockAuditionWithDetails = {
        ...mockAudition,
        shows: {
          show_id: 'show-123',
          title: 'Hamilton',
          author: 'Lin-Manuel Miranda',
          description: 'An American Musical',
        },
        companies: {
          company_id: 'company-123',
          name: 'Broadway Productions',
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAuditionWithDetails, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAuditionWithDetails('audition-123');

      expect(result).toEqual(mockAuditionWithDetails);
    });
  });

  describe('getShowAuditions', () => {
    it('should fetch all auditions for a show', async () => {
      const mockAuditions = [mockAudition];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockAuditions, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getShowAuditions('show-123');

      expect(supabase.from).toHaveBeenCalledWith('auditions');
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockAuditions);
    });
  });

  describe('getUserAuditions', () => {
    it('should fetch all auditions created by a user', async () => {
      const mockAuditions = [mockAudition];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockAuditions, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserAuditions('user-123');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockAuditions);
    });
  });

  describe('getCompanyAuditions', () => {
    it('should fetch all auditions for a company', async () => {
      const mockAuditions = [mockAudition];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockAuditions, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getCompanyAuditions('company-123');

      expect(mockEq).toHaveBeenCalledWith('company_id', 'company-123');
      expect(result).toEqual(mockAuditions);
    });
  });

  describe('getAllAuditions', () => {
    it('should fetch all auditions with default limit', async () => {
      const mockAuditions = [mockAudition];
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockAuditions, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await getAllAuditions();

      expect(mockLimit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockAuditions);
    });

    it('should fetch all auditions with custom limit', async () => {
      const mockAuditions = [mockAudition];
      const mockSelect = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockAuditions, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        order: mockOrder,
      });
      mockOrder.mockReturnValue({
        limit: mockLimit,
      });

      const result = await getAllAuditions(10);

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockAuditions);
    });
  });

  describe('createAudition', () => {
    it('should create an audition successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const auditionData = {
        show_id: 'show-123',
        user_id: 'user-123',
        company_id: 'company-123',
        rehearsal_dates: 'March 1-15, 2024',
        equity_status: 'Non-Equity' as const,
      };

      const result = await createAudition(auditionData);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('auditions');
      expect(result.data).toEqual(mockAudition);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await createAudition({ show_id: 'show-123', user_id: 'user-123' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateAudition', () => {
    it('should update an audition successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getAudition
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

      // Mock update
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEqForUpdate = jest.fn().mockReturnThis();
      const mockSelectForUpdate = jest.fn().mockReturnThis();
      const mockSingleForUpdate = jest.fn().mockResolvedValue({ 
        data: { ...mockAudition, ensemble_size: 15 }, 
        error: null 
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mockSelectForGet,
          };
        } else {
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

      const result = await updateAudition('audition-123', { ensemble_size: 15 });

      expect(result.data?.ensemble_size).toBe(15);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not authorized', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'other@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateAudition('audition-123', { ensemble_size: 15 });

      expect(result.data).toBeNull();
      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('deleteAudition', () => {
    it('should delete an audition successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getAudition
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

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

      const result = await deleteAudition('audition-123');

      expect(result.error).toBeNull();
    });
  });

  describe('markAuditionSlotsFilled', () => {
    it('should mark audition slots as filled', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockAudition, error: null });

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEqForUpdate = jest.fn().mockReturnThis();
      const mockSelectForUpdate = jest.fn().mockReturnThis();
      const mockSingleForUpdate = jest.fn().mockResolvedValue({ 
        data: { ...mockAudition, show_filled_slots: true }, 
        error: null 
      });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mockSelectForGet,
          };
        } else {
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

      const result = await markAuditionSlotsFilled('audition-123', true);

      expect(result.error).toBeNull();
    });
  });

  describe('searchAuditions', () => {
    it('should search auditions by show title', async () => {
      const mockResults = [{
        ...mockAudition,
        shows: {
          show_id: 'show-123',
          title: 'Hamilton',
          author: 'Lin-Manuel Miranda',
          description: 'An American Musical',
        },
      }];

      const mockSelect = jest.fn().mockReturnThis();
      const mockIlike = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockResults, error: null });

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

      const result = await searchAuditions('Hamilton');

      expect(mockIlike).toHaveBeenCalledWith('shows.title', '%Hamilton%');
      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(result).toEqual(mockResults);
    });
  });
});
