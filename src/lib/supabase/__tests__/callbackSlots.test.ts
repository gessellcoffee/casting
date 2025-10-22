import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCallbackSlot,
  getCallbackSlots,
  getCallbackSlotsWithInvitationCount,
  getCallbackSlotsWithInvitations,
  createCallbackSlot,
  createCallbackSlots,
  updateCallbackSlot,
  deleteCallbackSlot,
  deleteCallbackSlots,
  isCallbackSlotFull,
  getAvailableCallbackSlots,
  getCallbackSlotCount,
  getCallbackSlotsByDateRange,
} from '../callbackSlots';
import { supabase } from '../client';

// Mock the Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe('callbackSlots', () => {
  const mockCallbackSlot = {
    callback_slot_id: 'slot-123',
    audition_id: 'audition-123',
    start_time: '2025-11-01T10:00:00Z',
    end_time: '2025-11-01T11:00:00Z',
    location: 'Studio A',
    max_signups: 5,
    notes: 'Bring sheet music',
    created_at: '2025-10-22T00:00:00Z',
    updated_at: '2025-10-22T00:00:00Z',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCallbackSlot', () => {
    it('should fetch a callback slot by ID', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCallbackSlot, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getCallbackSlot('slot-123');

      expect(supabase.from).toHaveBeenCalledWith('callback_slots');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('callback_slot_id', 'slot-123');
      expect(result).toEqual(mockCallbackSlot);
    });

    it('should return null on error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getCallbackSlot('slot-123');

      expect(result).toBeNull();
    });
  });

  describe('getCallbackSlots', () => {
    it('should fetch all callback slots for an audition', async () => {
      const mockSlots = [mockCallbackSlot, { ...mockCallbackSlot, callback_slot_id: 'slot-456' }];
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSlots, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getCallbackSlots('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('callback_slots');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockOrder).toHaveBeenCalledWith('start_time', { ascending: true });
      expect(result).toEqual(mockSlots);
    });

    it('should return empty array on error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: null, error: new Error('Error') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getCallbackSlots('audition-123');

      expect(result).toEqual([]);
    });
  });

  describe('createCallbackSlot', () => {
    it('should create a callback slot when user owns the audition', async () => {
      const slotData = {
        audition_id: 'audition-123',
        start_time: '2025-11-01T10:00:00Z',
        end_time: '2025-11-01T11:00:00Z',
        location: 'Studio A',
      };

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null,
      });
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelectAfterInsert = vi.fn().mockReturnThis();
      const mockSingleAfterInsert = vi.fn().mockResolvedValue({
        data: mockCallbackSlot,
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'auditions') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'callback_slots') {
          return {
            insert: mockInsert,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockInsert.mockReturnValue({
        select: mockSelectAfterInsert,
      });
      mockSelectAfterInsert.mockReturnValue({
        single: mockSingleAfterInsert,
      });

      const result = await createCallbackSlot(slotData);

      expect(result.data).toEqual(mockCallbackSlot);
      expect(result.error).toBeNull();
    });

    it('should return error when user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const slotData = {
        audition_id: 'audition-123',
        start_time: '2025-11-01T10:00:00Z',
        end_time: '2025-11-01T11:00:00Z',
      };

      const result = await createCallbackSlot(slotData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('should return error when user does not own the audition', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { user_id: 'different-user' },
        error: null,
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

      const slotData = {
        audition_id: 'audition-123',
        start_time: '2025-11-01T10:00:00Z',
        end_time: '2025-11-01T11:00:00Z',
      };

      const result = await createCallbackSlot(slotData);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('createCallbackSlots', () => {
    it('should create multiple callback slots', async () => {
      const slotsData = [
        {
          audition_id: 'audition-123',
          start_time: '2025-11-01T10:00:00Z',
          end_time: '2025-11-01T11:00:00Z',
        },
        {
          audition_id: 'audition-123',
          start_time: '2025-11-01T11:00:00Z',
          end_time: '2025-11-01T12:00:00Z',
        },
      ];

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { user_id: 'user-123' },
        error: null,
      });
      const mockInsert = vi.fn().mockReturnThis();
      const mockSelectAfterInsert = vi.fn().mockResolvedValue({
        data: [mockCallbackSlot, { ...mockCallbackSlot, callback_slot_id: 'slot-456' }],
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'auditions') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'callback_slots') {
          return {
            insert: mockInsert,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockInsert.mockReturnValue({
        select: mockSelectAfterInsert,
      });

      const result = await createCallbackSlots(slotsData);

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it('should return empty array when no slots provided', async () => {
      const result = await createCallbackSlots([]);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('updateCallbackSlot', () => {
    it('should update a callback slot', async () => {
      const updates = { location: 'Studio B' };
      const updatedSlot = { ...mockCallbackSlot, location: 'Studio B' };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedSlot, error: null });

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

      const result = await updateCallbackSlot('slot-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('callback_slot_id', 'slot-123');
      expect(result.data).toEqual(updatedSlot);
      expect(result.error).toBeNull();
    });
  });

  describe('deleteCallbackSlot', () => {
    it('should delete a callback slot', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteCallbackSlot('slot-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('callback_slot_id', 'slot-123');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteCallbackSlots', () => {
    it('should delete all callback slots for an audition', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteCallbackSlots('audition-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result.error).toBeNull();
    });
  });

  describe('isCallbackSlotFull', () => {
    it('should return false when slot is not full', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCallbackSlot, error: null });
      const mockSelectCount = vi.fn().mockReturnThis();
      const mockEqCount = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({ count: 2, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'callback_slots') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'callback_invitations') {
          return {
            select: mockSelectCount,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSelectCount.mockReturnValue({
        eq: mockEqCount,
      });
      mockEqCount.mockReturnValue({
        eq: mockEqStatus,
      });

      const result = await isCallbackSlotFull('slot-123');

      expect(result).toBe(false);
    });

    it('should return true when slot is full', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockCallbackSlot, error: null });
      const mockSelectCount = vi.fn().mockReturnThis();
      const mockEqCount = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({ count: 5, error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'callback_slots') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'callback_invitations') {
          return {
            select: mockSelectCount,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockSelectCount.mockReturnValue({
        eq: mockEqCount,
      });
      mockEqCount.mockReturnValue({
        eq: mockEqStatus,
      });

      const result = await isCallbackSlotFull('slot-123');

      expect(result).toBe(true);
    });

    it('should return true when slot does not exist', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await isCallbackSlotFull('slot-123');

      expect(result).toBe(true);
    });
  });

  describe('getCallbackSlotCount', () => {
    it('should return the count of callback slots for an audition', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ count: 3, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getCallbackSlotCount('audition-123');

      expect(result).toBe(3);
    });

    it('should return 0 on error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ count: null, error: new Error('Error') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getCallbackSlotCount('audition-123');

      expect(result).toBe(0);
    });
  });

  describe('getCallbackSlotsByDateRange', () => {
    it('should fetch callback slots within a date range', async () => {
      const mockSlots = [mockCallbackSlot];
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockSlots, error: null });

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

      const result = await getCallbackSlotsByDateRange(
        'audition-123',
        '2025-11-01T00:00:00Z',
        '2025-11-30T23:59:59Z'
      );

      expect(result).toEqual(mockSlots);
      expect(mockGte).toHaveBeenCalledWith('start_time', '2025-11-01T00:00:00Z');
      expect(mockLte).toHaveBeenCalledWith('start_time', '2025-11-30T23:59:59Z');
    });
  });
});
