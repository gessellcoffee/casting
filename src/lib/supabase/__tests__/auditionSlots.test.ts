import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getAuditionSlot,
  getAuditionSlots,
  getAuditionSlotsWithSignupCount,
  createAuditionSlot,
  createAuditionSlots,
  updateAuditionSlot,
  deleteAuditionSlot,
  deleteAuditionSlots,
  isSlotFull,
  getAvailableSlots,
  getAuditionSlotCount,
  getSlotsByDateRange,
} from '../auditionSlots';
import type { AuditionSlot } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Audition Slots Functions', () => {
  const mockSlot: AuditionSlot = {
    slot_id: 'slot-123',
    audition_id: 'audition-123',
    start_time: '2024-03-01T10:00:00Z',
    end_time: '2024-03-01T10:30:00Z',
    location: 'Studio A',
    max_signups: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditionSlot', () => {
    it('should fetch an audition slot by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn<() => Promise<{ data: AuditionSlot; error: null }>>()
        .mockResolvedValue({ data: mockSlot, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAuditionSlot('slot-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('slot_id', 'slot-123');
      expect(result).toEqual(mockSlot);
    });

    it('should return null when slot is not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn<() => Promise<{ data: AuditionSlot | null; error: any }>>()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAuditionSlot('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAuditionSlots', () => {
    it('should fetch all slots for an audition', async () => {
      const mockSlots = [
        mockSlot,
        { ...mockSlot, slot_id: 'slot-456', start_time: '2024-03-01T11:00:00Z' },
      ];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn<() => Promise<{ data: AuditionSlot[]; error: any }>>()
        .mockResolvedValue({ data: mockSlots, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAuditionSlots('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockOrder).toHaveBeenCalledWith('start_time', { ascending: true });
      expect(result).toEqual(mockSlots);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn<() => Promise<{ data: AuditionSlot[]; error: any }>>()
        .mockResolvedValue({ data: null, error: { message: 'Database error' } });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAuditionSlots('audition-123');

      expect(result).toEqual([]);
    });
  });

  describe('getAuditionSlotsWithSignupCount', () => {
    it('should fetch slots with signup count', async () => {
      const mockSlotsWithCount = [
        { ...mockSlot, audition_signups: { count: 1 } },
      ];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn<() => Promise<{ data: AuditionSlot[]; error: any }>>()
        .mockResolvedValue({ data: mockSlotsWithCount, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAuditionSlotsWithSignupCount('audition-123');

      expect(result).toEqual(mockSlotsWithCount);
    });
  });

  describe('createAuditionSlot', () => {
    it('should create an audition slot successfully', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockSlot, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const slotData = {
        audition_id: 'audition-123',
        start_time: '2024-03-01T10:00:00Z',
        end_time: '2024-03-01T10:30:00Z',
        location: 'Studio A',
        max_signups: 1,
      };

      const result = await createAuditionSlot(slotData);

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockInsert).toHaveBeenCalledWith(slotData);
      expect(result.data).toEqual(mockSlot);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error'  } 
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

      const result = await createAuditionSlot({
        audition_id: 'audition-123',
        start_time: '2024-03-01T10:00:00Z',
        end_time: '2024-03-01T10:30:00Z',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('createAuditionSlots', () => {
    it('should create multiple audition slots successfully', async () => {
      const mockSlots = [
        mockSlot,
        { ...mockSlot, slot_id: 'slot-456', start_time: '2024-03-01T11:00:00Z' },
      ];
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({ data: mockSlots, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const slotsData = [
        {
          audition_id: 'audition-123',
          start_time: '2024-03-01T10:00:00Z',
          end_time: '2024-03-01T10:30:00Z',
        },
        {
          audition_id: 'audition-123',
          start_time: '2024-03-01T11:00:00Z',
          end_time: '2024-03-01T11:30:00Z',
        },
      ];

      const result = await createAuditionSlots(slotsData);

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockInsert).toHaveBeenCalledWith(slotsData);
      expect(result.data).toEqual(mockSlots);
      expect(result.error).toBeNull();
    });
  });

  describe('updateAuditionSlot', () => {
    it('should update an audition slot successfully', async () => {
      const updatedSlot = { ...mockSlot, location: 'Studio B' };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedSlot, error: null });

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

      const result = await updateAuditionSlot('slot-123', { location: 'Studio B' });

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockUpdate).toHaveBeenCalledWith({ location: 'Studio B' });
      expect(mockEq).toHaveBeenCalledWith('slot_id', 'slot-123');
      expect(result.data?.location).toBe('Studio B');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteAuditionSlot', () => {
    it('should delete an audition slot successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteAuditionSlot('slot-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockEq).toHaveBeenCalledWith('slot_id', 'slot-123');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteAuditionSlots', () => {
    it('should delete all slots for an audition successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteAuditionSlots('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result.error).toBeNull();
    });
  });

  describe('isSlotFull', () => {
    it('should return false when slot is not full', async () => {
      // Mock getAuditionSlot
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockSlot, error: null });

      // Mock count query
      const mockSelectForCount = jest.fn().mockReturnThis();
      const mockEqForCount = jest.fn().mockResolvedValue({ count: 0, error: null });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mockSelectForGet,
          };
        } else {
          return {
            select: mockSelectForCount,
          };
        }
      });

      mockSelectForGet.mockReturnValue({
        eq: mockEqForGet,
      });
      mockEqForGet.mockReturnValue({
        single: mockSingleForGet,
      });

      mockSelectForCount.mockReturnValue({
        eq: mockEqForCount,
      });

      const result = await isSlotFull('slot-123');

      expect(result).toBe(false);
    });

    it('should return true when slot is full', async () => {
      const mockSelectForGet = jest.fn().mockReturnThis();
      const mockEqForGet = jest.fn().mockReturnThis();
      const mockSingleForGet = jest.fn().mockResolvedValue({ data: mockSlot, error: null });

      const mockSelectForCount = jest.fn().mockReturnThis();
      const mockEqForCount = jest.fn().mockResolvedValue({ count: 1, error: null });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: mockSelectForGet,
          };
        } else {
          return {
            select: mockSelectForCount,
          };
        }
      });

      mockSelectForGet.mockReturnValue({
        eq: mockEqForGet,
      });
      mockEqForGet.mockReturnValue({
        single: mockSingleForGet,
      });

      mockSelectForCount.mockReturnValue({
        eq: mockEqForCount,
      });

      const result = await isSlotFull('slot-123');

      expect(result).toBe(true);
    });

    it('should return true when slot does not exist', async () => {
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

      const result = await isSlotFull('nonexistent');

      expect(result).toBe(true);
    });
  });

  describe('getAuditionSlotCount', () => {
    it('should return the count of slots for an audition', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getAuditionSlotCount('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_slots');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result).toBe(5);
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

      const result = await getAuditionSlotCount('audition-123');

      expect(result).toBe(0);
    });
  });

  describe('getSlotsByDateRange', () => {
    it('should fetch slots within a date range', async () => {
      const mockSlots = [mockSlot];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockGte = jest.fn().mockReturnThis();
      const mockLte = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockSlots, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        gte: mockGte,
      });
      mockGte.mockReturnValue({
        lte: mockLte,
      });
      mockLte.mockReturnValue({
        order: mockOrder,
      });

      const result = await getSlotsByDateRange(
        'audition-123',
        '2024-03-01T00:00:00Z',
        '2024-03-31T23:59:59Z'
      );

      expect(mockGte).toHaveBeenCalledWith('start_time', '2024-03-01T00:00:00Z');
      expect(mockLte).toHaveBeenCalledWith('start_time', '2024-03-31T23:59:59Z');
      expect(result).toEqual(mockSlots);
    });
  });
});
