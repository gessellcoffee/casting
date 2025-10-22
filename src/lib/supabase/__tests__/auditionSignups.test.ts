import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getAuditionSignup,
  getAuditionSignupWithDetails,
  getSlotSignups,
  getUserSignups,
  getUserSignupsWithDetails,
  getRoleSignups,
  getAuditionSignups,
  createAuditionSignup,
  updateAuditionSignup,
  updateSignupStatus,
  deleteAuditionSignup,
  hasUserSignedUpForSlot,
  getUserSignupForAudition,
  doSlotsOverlap,
  getUserSignupsWithTimes,
  checkSlotConflict,
  getSlotSignupCount,
  getSignupsByStatus,
  bulkUpdateSignupStatus,
} from '../auditionSignups';
import type { AuditionSignup } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  },
}));

describe('Audition Signups Functions', () => {
  const mockSignup: AuditionSignup = {
    signup_id: 'signup-123',
    slot_id: 'slot-123',
    user_id: 'user-123',
    role_id: 'role-123',
    status: 'Signed Up',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditionSignup', () => {
    it('should fetch an audition signup by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockSignup, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAuditionSignup('signup-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('signup_id', 'signup-123');
      expect(result).toEqual(mockSignup);
    });

    it('should return null when signup is not found', async () => {
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

      const result = await getAuditionSignup('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSlotSignups', () => {
    it('should fetch all signups for a slot', async () => {
      const mockSignups = [mockSignup];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockSignups, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getSlotSignups('slot-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockEq).toHaveBeenCalledWith('slot_id', 'slot-123');
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockSignups);
    });
  });

  describe('getUserSignups', () => {
    it('should fetch all signups for a user', async () => {
      const mockSignups = [mockSignup];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockSignups, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserSignups('user-123');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockSignups);
    });
  });

  describe('getUserSignupsWithDetails', () => {
    it('should fetch all signups for a user with full details', async () => {
      const mockSignupWithDetails = {
        ...mockSignup,
        audition_slots: {
          slot_id: 'slot-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T10:30:00Z',
          location: 'Theater A',
          auditions: {
            audition_id: 'audition-123',
            rehearsal_dates: 'March 1-15',
            rehearsal_location: 'Studio B',
            performance_dates: 'March 20-25',
            performance_location: 'Main Stage',
            shows: {
              show_id: 'show-123',
              title: 'Hamlet',
              author: 'William Shakespeare',
              description: 'A tragedy',
            },
          },
        },
        roles: {
          role_id: 'role-123',
          role_name: 'Hamlet',
          description: 'Prince of Denmark',
          role_type: 'Principal',
          gender: 'masculine',
        },
      };
      const mockSignups = [mockSignupWithDetails];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockSignups, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserSignupsWithDetails('user-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockSignups);
      expect(result[0].audition_slots).toBeDefined();
      expect(result[0].audition_slots.auditions).toBeDefined();
      expect(result[0].audition_slots.auditions.shows).toBeDefined();
      expect(result[0].roles).toBeDefined();
    });

    it('should return empty array when user has no signups', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserSignupsWithDetails('user-123');

      expect(result).toEqual([]);
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

      const result = await getUserSignupsWithDetails('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('getRoleSignups', () => {
    it('should fetch all signups for a role', async () => {
      const mockSignups = [mockSignup];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockSignups, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getRoleSignups('role-123');

      expect(mockEq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result).toEqual(mockSignups);
    });
  });

  describe('createAuditionSignup', () => {
    it('should create an audition signup successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      const mockSelectForSlot = jest.fn().mockReturnThis();
      const mockEqForSlot = jest.fn().mockReturnThis();
      const mockSingleForSlot = jest.fn().mockResolvedValue({ 
        data: { audition_id: 'audition-123' }, 
        error: null 
      });

      const mockSelectForCheck = jest.fn().mockReturnThis();
      const mockEq1ForCheck = jest.fn().mockReturnThis();
      const mockEq2ForCheck = jest.fn().mockReturnThis();
      const mockLimitForCheck = jest.fn().mockReturnThis();
      const mockSingleForCheck = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelectForInsert = jest.fn().mockReturnThis();
      const mockSingleForInsert = jest.fn().mockResolvedValue({ data: mockSignup, error: null });

      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get slot's audition_id
          return { select: mockSelectForSlot };
        } else if (callCount === 2) {
          // Second call: check for existing signup
          return { select: mockSelectForCheck };
        } else {
          // Third call: insert new signup
          return { insert: mockInsert };
        }
      });

      mockSelectForSlot.mockReturnValue({ eq: mockEqForSlot });
      mockEqForSlot.mockReturnValue({ single: mockSingleForSlot });

      mockSelectForCheck.mockReturnValue({ eq: mockEq1ForCheck });
      mockEq1ForCheck.mockReturnValue({ eq: mockEq2ForCheck });
      mockEq2ForCheck.mockReturnValue({ limit: mockLimitForCheck });
      mockLimitForCheck.mockReturnValue({ single: mockSingleForCheck });

      mockInsert.mockReturnValue({ select: mockSelectForInsert });
      mockSelectForInsert.mockReturnValue({ single: mockSingleForInsert });

      const signupData = {
        slot_id: 'slot-123',
        user_id: 'user-123',
        role_id: 'role-123',
      };

      const result = await createAuditionSignup(signupData);

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result.data).toEqual(mockSignup);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const result = await createAuditionSignup({ 
        slot_id: 'slot-123', 
        user_id: 'user-123' 
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should return error when user already has a signup for the audition', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      const mockSelectForSlot = jest.fn().mockReturnThis();
      const mockEqForSlot = jest.fn().mockReturnThis();
      const mockSingleForSlot = jest.fn().mockResolvedValue({ 
        data: { audition_id: 'audition-123' }, 
        error: null 
      });

      const mockSelectForCheck = jest.fn().mockReturnThis();
      const mockEq1ForCheck = jest.fn().mockReturnThis();
      const mockEq2ForCheck = jest.fn().mockReturnThis();
      const mockLimitForCheck = jest.fn().mockReturnThis();
      const mockSingleForCheck = jest.fn().mockResolvedValue({ 
        data: {
          ...mockSignup,
          audition_slots: {
            slot_id: 'different-slot-123',
            audition_id: 'audition-123',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T10:30:00Z',
            location: 'Theater A',
          },
        }, 
        error: null 
      });

      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get slot's audition_id
          return { select: mockSelectForSlot };
        } else {
          // Second call: check for existing signup
          return { select: mockSelectForCheck };
        }
      });

      mockSelectForSlot.mockReturnValue({ eq: mockEqForSlot });
      mockEqForSlot.mockReturnValue({ single: mockSingleForSlot });

      mockSelectForCheck.mockReturnValue({ eq: mockEq1ForCheck });
      mockEq1ForCheck.mockReturnValue({ eq: mockEq2ForCheck });
      mockEq2ForCheck.mockReturnValue({ limit: mockLimitForCheck });
      mockLimitForCheck.mockReturnValue({ single: mockSingleForCheck });

      const signupData = {
        slot_id: 'slot-123',
        user_id: 'user-123',
        role_id: 'role-123',
      };

      const result = await createAuditionSignup(signupData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('already signed up');
      expect(result.error.message).toContain('one slot per audition');
    });

    it('should return error when slot is not found', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Slot not found' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });

      const result = await createAuditionSignup({ 
        slot_id: 'nonexistent-slot', 
        user_id: 'user-123' 
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should return error when slot conflicts with another signup', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let callCount = 0;
      const mockSelectForSlot = jest.fn().mockReturnThis();
      const mockEqForSlot = jest.fn().mockReturnThis();
      const mockSingleForSlot = jest.fn().mockResolvedValue({ 
        data: { 
          audition_id: 'audition-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T11:00:00Z'
        }, 
        error: null 
      });

      const mockSelectForCheck1 = jest.fn().mockReturnThis();
      const mockEq1ForCheck1 = jest.fn().mockReturnThis();
      const mockEq2ForCheck1 = jest.fn().mockReturnThis();
      const mockLimitForCheck1 = jest.fn().mockReturnThis();
      const mockSingleForCheck1 = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      const mockSelectForCheck2 = jest.fn().mockReturnThis();
      const mockEqForCheck2 = jest.fn().mockResolvedValue({ 
        data: [{
          ...mockSignup,
          audition_slots: {
            slot_id: 'conflicting-slot',
            audition_id: 'different-audition-123',
            start_time: '2024-01-15T10:30:00Z',
            end_time: '2024-01-15T11:30:00Z',
            location: 'Theater B',
          },
        }], 
        error: null 
      });

      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get slot's audition_id and times
          return { select: mockSelectForSlot };
        } else if (callCount === 2) {
          // Second call: check for existing signup in same audition
          return { select: mockSelectForCheck1 };
        } else {
          // Third call: check for time conflicts
          return { select: mockSelectForCheck2 };
        }
      });

      mockSelectForSlot.mockReturnValue({ eq: mockEqForSlot });
      mockEqForSlot.mockReturnValue({ single: mockSingleForSlot });

      mockSelectForCheck1.mockReturnValue({ eq: mockEq1ForCheck1 });
      mockEq1ForCheck1.mockReturnValue({ eq: mockEq2ForCheck1 });
      mockEq2ForCheck1.mockReturnValue({ limit: mockLimitForCheck1 });
      mockLimitForCheck1.mockReturnValue({ single: mockSingleForCheck1 });

      mockSelectForCheck2.mockReturnValue({ eq: mockEqForCheck2 });

      const signupData = {
        slot_id: 'slot-123',
        user_id: 'user-123',
        role_id: 'role-123',
      };

      const result = await createAuditionSignup(signupData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('conflicts with another audition');
    });
  });

  describe('updateAuditionSignup', () => {
    it('should update an audition signup successfully', async () => {
      const updatedSignup = { ...mockSignup, status: 'Callback' as const };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedSignup, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateAuditionSignup('signup-123', { status: 'Callback' });

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'Callback' });
      expect(mockEq).toHaveBeenCalledWith('signup_id', 'signup-123');
      expect(result.data?.status).toBe('Callback');
      expect(result.error).toBeNull();
    });
  });

  describe('updateSignupStatus', () => {
    it('should update signup status successfully', async () => {
      const updatedSignup = { ...mockSignup, status: 'Offer Extended' as const };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedSignup, error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await updateSignupStatus('signup-123', 'Offer Extended');

      expect(result.data?.status).toBe('Offer Extended');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteAuditionSignup', () => {
    it('should delete an audition signup successfully', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock getAuditionSignup
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockSignup, error: null });

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

      const result = await deleteAuditionSignup('signup-123');

      expect(result.error).toBeNull();
    });

    it('should return error when user is not authorized', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'other@example.com' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockSignup, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await deleteAuditionSignup('signup-123');

      expect(result.error?.message).toContain('Unauthorized');
    });
  });

  describe('hasUserSignedUpForSlot', () => {
    it('should return true when user has signed up', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [{ signup_id: 'signup-123' }], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        limit: mockLimit,
      });

      const result = await hasUserSignedUpForSlot('user-123', 'slot-123');

      expect(result).toBe(true);
    });

    it('should return false when user has not signed up', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        limit: mockLimit,
      });

      const result = await hasUserSignedUpForSlot('user-123', 'slot-123');

      expect(result).toBe(false);
    });
  });

  describe('getUserSignupForAudition', () => {
    it('should return signup when user has signed up for the audition', async () => {
      const mockSignupWithSlot = {
        ...mockSignup,
        audition_slots: {
          slot_id: 'slot-123',
          audition_id: 'audition-123',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T10:30:00Z',
          location: 'Theater A',
        },
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockSignupWithSlot, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        single: mockSingle,
      });

      const result = await getUserSignupForAudition('user-123', 'audition-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockEq2).toHaveBeenCalledWith('audition_slots.audition_id', 'audition-123');
      expect(result).toEqual(mockSignupWithSlot);
    });

    it('should return null when user has not signed up for the audition', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116', message: 'Not found' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        single: mockSingle,
      });

      const result = await getUserSignupForAudition('user-123', 'audition-123');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { code: 'DB_ERROR', message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });
      mockEq2.mockReturnValue({
        limit: mockLimit,
      });
      mockLimit.mockReturnValue({
        single: mockSingle,
      });

      const result = await getUserSignupForAudition('user-123', 'audition-123');

      expect(result).toBeNull();
    });
  });

  describe('doSlotsOverlap', () => {
    it('should return true when slots overlap', () => {
      const slot1Start = '2024-01-15T10:00:00Z';
      const slot1End = '2024-01-15T11:00:00Z';
      const slot2Start = '2024-01-15T10:30:00Z';
      const slot2End = '2024-01-15T11:30:00Z';

      const result = doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End);

      expect(result).toBe(true);
    });

    it('should return true when one slot contains another', () => {
      const slot1Start = '2024-01-15T10:00:00Z';
      const slot1End = '2024-01-15T12:00:00Z';
      const slot2Start = '2024-01-15T10:30:00Z';
      const slot2End = '2024-01-15T11:00:00Z';

      const result = doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End);

      expect(result).toBe(true);
    });

    it('should return false when slots do not overlap', () => {
      const slot1Start = '2024-01-15T10:00:00Z';
      const slot1End = '2024-01-15T11:00:00Z';
      const slot2Start = '2024-01-15T11:00:00Z';
      const slot2End = '2024-01-15T12:00:00Z';

      const result = doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End);

      expect(result).toBe(false);
    });

    it('should return false when slots are completely separate', () => {
      const slot1Start = '2024-01-15T10:00:00Z';
      const slot1End = '2024-01-15T11:00:00Z';
      const slot2Start = '2024-01-15T14:00:00Z';
      const slot2End = '2024-01-15T15:00:00Z';

      const result = doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End);

      expect(result).toBe(false);
    });

    it('should handle Date objects', () => {
      const slot1Start = new Date('2024-01-15T10:00:00Z');
      const slot1End = new Date('2024-01-15T11:00:00Z');
      const slot2Start = new Date('2024-01-15T10:30:00Z');
      const slot2End = new Date('2024-01-15T11:30:00Z');

      const result = doSlotsOverlap(slot1Start, slot1End, slot2Start, slot2End);

      expect(result).toBe(true);
    });
  });

  describe('getUserSignupsWithTimes', () => {
    it('should fetch all user signups with time information', async () => {
      const mockSignupsWithTimes = [
        {
          ...mockSignup,
          audition_slots: {
            slot_id: 'slot-123',
            audition_id: 'audition-123',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T10:30:00Z',
            location: 'Theater A',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockSignupsWithTimes, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getUserSignupsWithTimes('user-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockSignupsWithTimes);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getUserSignupsWithTimes('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('checkSlotConflict', () => {
    it('should return conflict when user has overlapping signup', async () => {
      const mockSignupsWithTimes = [
        {
          ...mockSignup,
          audition_slots: {
            slot_id: 'slot-123',
            audition_id: 'audition-123',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            location: 'Theater A',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockSignupsWithTimes, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await checkSlotConflict(
        'user-123',
        '2024-01-15T10:30:00Z',
        '2024-01-15T11:30:00Z'
      );

      expect(result.hasConflict).toBe(true);
      expect(result.conflictingSignup).toEqual(mockSignupsWithTimes[0]);
    });

    it('should return no conflict when slots do not overlap', async () => {
      const mockSignupsWithTimes = [
        {
          ...mockSignup,
          audition_slots: {
            slot_id: 'slot-123',
            audition_id: 'audition-123',
            start_time: '2024-01-15T10:00:00Z',
            end_time: '2024-01-15T11:00:00Z',
            location: 'Theater A',
          },
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockSignupsWithTimes, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await checkSlotConflict(
        'user-123',
        '2024-01-15T14:00:00Z',
        '2024-01-15T15:00:00Z'
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingSignup).toBeNull();
    });

    it('should return no conflict when user has no signups', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await checkSlotConflict(
        'user-123',
        '2024-01-15T10:00:00Z',
        '2024-01-15T11:00:00Z'
      );

      expect(result.hasConflict).toBe(false);
      expect(result.conflictingSignup).toBeNull();
    });
  });

  describe('getSlotSignupCount', () => {
    it('should return the count of signups for a slot', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ count: 3, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getSlotSignupCount('slot-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('slot_id', 'slot-123');
      expect(result).toBe(3);
    });

    it('should return 0 on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ 
        count: null, 
        error: { message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getSlotSignupCount('slot-123');

      expect(result).toBe(0);
    });
  });

  describe('bulkUpdateSignupStatus', () => {
    it('should update multiple signup statuses successfully', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        in: mockIn,
      });

      const signupIds = ['signup-1', 'signup-2', 'signup-3'];
      const result = await bulkUpdateSignupStatus(signupIds, 'Callback');

      expect(supabase.from).toHaveBeenCalledWith('audition_signups');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'Callback' });
      expect(mockIn).toHaveBeenCalledWith('signup_id', signupIds);
      expect(result.error).toBeNull();
    });
  });
});
