import {
  getProductionTeamMembers,
  getProductionTeamMember,
  addProductionTeamMember,
  inviteProductionTeamMember,
  updateProductionTeamMember,
  removeProductionTeamMember,
  searchUsersForProductionTeam,
  acceptProductionTeamInvitation,
  getProductionTeamInvitationsByEmail,
  isUserProductionMember,
} from '../productionTeamMembers';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Production Team Members', () => {
  const mockAuditionId = 'audition-123';
  const mockMemberId = 'member-123';
  const mockUserId = 'user-123';
  const mockInvitedBy = 'inviter-123';
  const mockEmail = 'test@example.com';
  const mockRoleTitle = 'Director';

  const mockMember = {
    production_team_member_id: mockMemberId,
    audition_id: mockAuditionId,
    user_id: mockUserId,
    role_title: mockRoleTitle,
    invited_email: null,
    status: 'active' as const,
    invited_by: mockInvitedBy,
    invited_at: '2024-01-01T00:00:00Z',
    joined_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    profiles: {
      id: mockUserId,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      profile_photo_url: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProductionTeamMembers', () => {
    it('should fetch all production team members for an audition', async () => {
      const mockData = [mockMember];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockData, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getProductionTeamMembers(mockAuditionId);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockEq).toHaveBeenCalledWith('audition_id', mockAuditionId);
      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toEqual(mockData);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getProductionTeamMembers(mockAuditionId);

      expect(result).toEqual([]);
    });
  });

  describe('getProductionTeamMember', () => {
    it('should fetch a single production team member by ID', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockMember, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getProductionTeamMember(mockMemberId);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockEq).toHaveBeenCalledWith('production_team_member_id', mockMemberId);
      expect(result).toEqual(mockMember);
    });

    it('should return null on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: new Error('Not found') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getProductionTeamMember(mockMemberId);

      expect(result).toBeNull();
    });
  });

  describe('addProductionTeamMember', () => {
    it('should add a production team member with existing user', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockMember, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await addProductionTeamMember(
        mockAuditionId,
        mockUserId,
        mockRoleTitle,
        mockInvitedBy
      );

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          audition_id: mockAuditionId,
          user_id: mockUserId,
          role_title: mockRoleTitle,
          status: 'active',
          invited_by: mockInvitedBy,
        })
      );
      expect(result.data).toEqual(mockMember);
      expect(result.error).toBeNull();
    });

    it('should return error when insert fails', async () => {
      const mockError = new Error('Insert failed');
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: mockError });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await addProductionTeamMember(
        mockAuditionId,
        mockUserId,
        mockRoleTitle,
        mockInvitedBy
      );

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('inviteProductionTeamMember', () => {
    it('should invite a production team member by email', async () => {
      const mockInvitation = {
        ...mockMember,
        user_id: null,
        invited_email: mockEmail,
        status: 'pending' as const,
      };

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockInvitation, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await inviteProductionTeamMember(
        mockAuditionId,
        mockEmail,
        mockRoleTitle,
        mockInvitedBy
      );

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          audition_id: mockAuditionId,
          invited_email: mockEmail,
          role_title: mockRoleTitle,
          status: 'pending',
          invited_by: mockInvitedBy,
        })
      );
      expect(result.data).toEqual(mockInvitation);
      expect(result.error).toBeNull();
    });
  });

  describe('updateProductionTeamMember', () => {
    it('should update a production team member', async () => {
      const updates = { role_title: 'Stage Manager' };
      const updatedMember = { ...mockMember, ...updates };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedMember, error: null });

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

      const result = await updateProductionTeamMember(mockMemberId, updates);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('production_team_member_id', mockMemberId);
      expect(result.data).toEqual(updatedMember);
      expect(result.error).toBeNull();
    });
  });

  describe('removeProductionTeamMember', () => {
    it('should remove a production team member', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await removeProductionTeamMember(mockMemberId);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('production_team_member_id', mockMemberId);
      expect(result.error).toBeNull();
    });

    it('should return error when delete fails', async () => {
      const mockError = new Error('Delete failed');
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: mockError });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await removeProductionTeamMember(mockMemberId);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('searchUsersForProductionTeam', () => {
    it('should search for users by query', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          profile_photo_url: null,
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: mockUsers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        or: mockOr,
      });
      mockOr.mockReturnValue({
        limit: mockLimit,
      });

      const result = await searchUsersForProductionTeam('john');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockOr = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: null, error: new Error('Search failed') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        or: mockOr,
      });
      mockOr.mockReturnValue({
        limit: mockLimit,
      });

      const result = await searchUsersForProductionTeam('john');

      expect(result).toEqual([]);
    });
  });

  describe('acceptProductionTeamInvitation', () => {
    it('should accept a production team invitation', async () => {
      const acceptedMember = {
        ...mockMember,
        status: 'active' as const,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: acceptedMember, error: null });

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

      const result = await acceptProductionTeamInvitation(mockMemberId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          status: 'active',
        })
      );
      expect(mockEq).toHaveBeenCalledWith('production_team_member_id', mockMemberId);
      expect(result.data).toEqual(acceptedMember);
      expect(result.error).toBeNull();
    });
  });

  describe('getProductionTeamInvitationsByEmail', () => {
    it('should fetch pending invitations by email', async () => {
      const mockInvitations = [
        {
          ...mockMember,
          user_id: null,
          invited_email: mockEmail,
          status: 'pending' as const,
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({ data: mockInvitations, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });

      const result = await getProductionTeamInvitationsByEmail(mockEmail);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockEq1).toHaveBeenCalledWith('invited_email', mockEmail);
      expect(mockEq2).toHaveBeenCalledWith('status', 'pending');
      expect(result).toEqual(mockInvitations);
    });

    it('should return empty array on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({ data: null, error: new Error('Fetch failed') });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });

      const result = await getProductionTeamInvitationsByEmail(mockEmail);

      expect(result).toEqual([]);
    });
  });

  describe('isUserProductionMember', () => {
    it('should return true when user is an active production member', async () => {
      const mockData = {
        production_team_member_id: mockMemberId,
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: mockData, error: null });

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
        eq: mockEq3,
      });
      mockEq3.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const result = await isUserProductionMember(mockAuditionId, mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('production_team_members');
      expect(mockEq1).toHaveBeenCalledWith('audition_id', mockAuditionId);
      expect(mockEq2).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockEq3).toHaveBeenCalledWith('status', 'active');
      expect(result).toBe(true);
    });

    it('should return false when user is not a production member', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

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
        eq: mockEq3,
      });
      mockEq3.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const result = await isUserProductionMember(mockAuditionId, mockUserId);

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockEq3 = jest.fn().mockReturnThis();
      const mockMaybeSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
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
        eq: mockEq3,
      });
      mockEq3.mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });

      const result = await isUserProductionMember(mockAuditionId, mockUserId);

      expect(result).toBe(false);
    });
  });
});
