import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCallbackInvitation,
  getCallbackInvitationWithDetails,
  getSlotInvitations,
  getUserInvitations,
  getAuditionInvitations,
  getInvitationsByStatus,
  createCallbackInvitation,
  createCallbackInvitations,
  sendCallbackInvitations,
  updateCallbackInvitation,
  respondToCallbackInvitation,
  deleteCallbackInvitation,
  deleteCallbackInvitations,
  hasUserBeenInvited,
  getPendingInvitationsCount,
  getAcceptedCallbacks,
} from '../callbackInvitations';
import { supabase } from '../client';
import * as notifications from '../notifications';

// Mock the Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

// Mock notifications
vi.mock('../notifications', () => ({
  createNotification: vi.fn(),
}));

describe('callbackInvitations', () => {
  const mockInvitation = {
    invitation_id: 'invitation-123',
    callback_slot_id: 'slot-123',
    signup_id: 'signup-123',
    user_id: 'user-123',
    audition_id: 'audition-123',
    status: 'pending' as const,
    actor_comment: null,
    casting_notes: null,
    invited_at: '2025-10-22T00:00:00Z',
    responded_at: null,
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

  describe('getCallbackInvitation', () => {
    it('should fetch a callback invitation by ID', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockInvitation, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getCallbackInvitation('invitation-123');

      expect(supabase.from).toHaveBeenCalledWith('callback_invitations');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('invitation_id', 'invitation-123');
      expect(result).toEqual(mockInvitation);
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

      const result = await getCallbackInvitation('invitation-123');

      expect(result).toBeNull();
    });
  });

  describe('getSlotInvitations', () => {
    it('should fetch all invitations for a callback slot', async () => {
      const mockInvitations = [mockInvitation, { ...mockInvitation, invitation_id: 'invitation-456' }];
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockInvitations, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getSlotInvitations('slot-123');

      expect(mockEq).toHaveBeenCalledWith('callback_slot_id', 'slot-123');
      expect(mockOrder).toHaveBeenCalledWith('invited_at', { ascending: true });
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('getUserInvitations', () => {
    it('should fetch all invitations for a user', async () => {
      const mockInvitations = [mockInvitation];
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockInvitations, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getUserInvitations('user-123');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('getAuditionInvitations', () => {
    it('should fetch all invitations for an audition', async () => {
      const mockInvitations = [mockInvitation];
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: mockInvitations, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAuditionInvitations('audition-123');

      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result).toEqual(mockInvitations);
    });
  });

  describe('getInvitationsByStatus', () => {
    it('should fetch invitations by status', async () => {
      const acceptedInvitation = { ...mockInvitation, status: 'accepted' as const };
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [acceptedInvitation], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqStatus,
      });
      mockEqStatus.mockReturnValue({
        order: mockOrder,
      });

      const result = await getInvitationsByStatus('audition-123', 'accepted');

      expect(result).toEqual([acceptedInvitation]);
    });
  });

  describe('createCallbackInvitation', () => {
    it('should create a callback invitation', async () => {
      const invitationData = {
        callback_slot_id: 'slot-123',
        signup_id: 'signup-123',
        user_id: 'user-123',
        audition_id: 'audition-123',
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockInvitation, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await createCallbackInvitation(invitationData);

      expect(mockInsert).toHaveBeenCalledWith(invitationData);
      expect(result.data).toEqual(mockInvitation);
      expect(result.error).toBeNull();
    });
  });

  describe('createCallbackInvitations', () => {
    it('should create multiple callback invitations', async () => {
      const invitationsData = [
        {
          callback_slot_id: 'slot-123',
          signup_id: 'signup-123',
          user_id: 'user-123',
          audition_id: 'audition-123',
        },
        {
          callback_slot_id: 'slot-123',
          signup_id: 'signup-456',
          user_id: 'user-456',
          audition_id: 'audition-123',
        },
      ];

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({
        data: [mockInvitation, { ...mockInvitation, invitation_id: 'invitation-456' }],
        error: null,
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const result = await createCallbackInvitations(invitationsData);

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it('should return empty array when no invitations provided', async () => {
      const result = await createCallbackInvitations([]);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });

  describe('sendCallbackInvitations', () => {
    it('should create invitations and send notifications', async () => {
      const invitationsData = [
        {
          callback_slot_id: 'slot-123',
          signup_id: 'signup-123',
          user_id: 'user-123',
          audition_id: 'audition-123',
        },
      ];

      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = vi.fn().mockReturnThis();
      const mockSelect = vi.fn();
      const mockEq = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({
        data: [
          {
            callback_slot_id: 'slot-123',
            start_time: '2025-11-01T10:00:00Z',
            end_time: '2025-11-01T11:00:00Z',
            location: 'Studio A',
          },
        ],
        error: null,
      });
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          audition_id: 'audition-123',
          shows: { title: 'Test Show' },
        },
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'callback_invitations') {
          return {
            insert: mockInsert,
          };
        }
        if (table === 'callback_slots') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'auditions') {
          return {
            select: mockSelect,
          };
        }
      });

      mockInsert.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [mockInvitation],
          error: null,
        }),
      });

      mockSelect.mockReturnValue({
        in: mockIn,
        eq: mockEq,
      });

      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await sendCallbackInvitations(invitationsData);

      expect(result.data).toHaveLength(1);
      expect(result.error).toBeNull();
      expect(notifications.createNotification).toHaveBeenCalled();
    });
  });

  describe('updateCallbackInvitation', () => {
    it('should update a callback invitation', async () => {
      const updates = { status: 'accepted' as const };
      const updatedInvitation = { ...mockInvitation, status: 'accepted' as const };

      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: updatedInvitation, error: null });

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

      const result = await updateCallbackInvitation('invitation-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('invitation_id', 'invitation-123');
      expect(result.data).toEqual(updatedInvitation);
      expect(result.error).toBeNull();
    });
  });

  describe('respondToCallbackInvitation', () => {
    it('should allow actor to accept invitation', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn();
      const mockUpdate = vi.fn().mockReturnThis();
      const mockSelectAfterUpdate = vi.fn().mockReturnThis();
      const mockSingleAfterUpdate = vi.fn().mockResolvedValue({
        data: { ...mockInvitation, status: 'accepted' },
        error: null,
      });

      // Mock getCallbackInvitation
      mockSingle.mockResolvedValueOnce({ data: mockInvitation, error: null });

      // Mock audition query
      mockSingle.mockResolvedValueOnce({
        data: {
          audition_id: 'audition-123',
          user_id: 'creator-123',
          shows: { title: 'Test Show' },
        },
        error: null,
      });

      // Mock profile query
      mockSingle.mockResolvedValueOnce({
        data: { first_name: 'John', last_name: 'Doe' },
        error: null,
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'callback_invitations') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'auditions') {
          return {
            select: mockSelect,
          };
        }
        if (table === 'profiles') {
          return {
            select: mockSelect,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelectAfterUpdate,
      });
      mockSelectAfterUpdate.mockReturnValue({
        single: mockSingleAfterUpdate,
      });

      const result = await respondToCallbackInvitation('invitation-123', 'accepted', 'Looking forward to it!');

      expect(result.data?.status).toBe('accepted');
      expect(result.error).toBeNull();
      expect(notifications.createNotification).toHaveBeenCalled();
    });

    it('should return error when user does not own the invitation', async () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'different-user', email: 'other@example.com' } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSingle = vi.fn().mockResolvedValue({ data: mockInvitation, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await respondToCallbackInvitation('invitation-123', 'accepted');

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('deleteCallbackInvitation', () => {
    it('should delete a callback invitation', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteCallbackInvitation('invitation-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('invitation_id', 'invitation-123');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteCallbackInvitations', () => {
    it('should delete multiple callback invitations', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockIn = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        in: mockIn,
      });

      const result = await deleteCallbackInvitations(['invitation-123', 'invitation-456']);

      expect(mockDelete).toHaveBeenCalled();
      expect(mockIn).toHaveBeenCalledWith('invitation_id', ['invitation-123', 'invitation-456']);
      expect(result.error).toBeNull();
    });
  });

  describe('hasUserBeenInvited', () => {
    it('should return true when user has been invited', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqAudition = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: [{ invitation_id: 'invitation-123' }], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqAudition,
      });
      mockEqAudition.mockReturnValue({
        limit: mockLimit,
      });

      const result = await hasUserBeenInvited('user-123', 'audition-123');

      expect(result).toBe(true);
    });

    it('should return false when user has not been invited', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqAudition = vi.fn().mockReturnThis();
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqAudition,
      });
      mockEqAudition.mockReturnValue({
        limit: mockLimit,
      });

      const result = await hasUserBeenInvited('user-123', 'audition-123');

      expect(result).toBe(false);
    });
  });

  describe('getPendingInvitationsCount', () => {
    it('should return the count of pending invitations', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({ count: 3, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqStatus,
      });

      const result = await getPendingInvitationsCount('user-123');

      expect(result).toBe(3);
    });

    it('should return 0 on error', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockResolvedValue({ count: null, error: new Error('Error') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqStatus,
      });

      const result = await getPendingInvitationsCount('user-123');

      expect(result).toBe(0);
    });
  });

  describe('getAcceptedCallbacks', () => {
    it('should return accepted callback invitations', async () => {
      const acceptedInvitation = { ...mockInvitation, status: 'accepted' as const };
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockEqStatus = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockResolvedValue({ data: [acceptedInvitation], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        eq: mockEqStatus,
      });
      mockEqStatus.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAcceptedCallbacks('audition-123');

      expect(result).toEqual([acceptedInvitation]);
    });
  });
});
