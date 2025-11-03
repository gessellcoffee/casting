import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getCastMember,
  getCastMemberWithDetails,
  getAuditionCastMembers,
  getRoleCastMembers,
  getUserCastMemberships,
  createCastMember,
  createCastMembers,
  updateCastMember,
  updateCastMemberStatus,
  deleteCastMember,
  isUserCastInRole,
  getCastMembersByStatus,
  getAcceptedCastMembers,
  getPendingOffers,
  getCastMemberCount,
  getAcceptedCastCount,
  isRoleFilled,
  bulkUpdateCastMemberStatus,
  getEnsembleMembers,
  getEnsembleMemberCount,
  isUserInEnsemble,
  getUserRolesInAudition,
} from '../castMembers';
import type { CastMember } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Cast Members Functions', () => {
  const mockCastMember: CastMember = {
    cast_member_id: 'cast-123',
    audition_id: 'audition-123',
    user_id: 'user-123',
    role_id: 'role-123',
    status: 'Offered',
    is_understudy: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCastMember', () => {
    it('should fetch a cast member by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCastMember, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getCastMember('cast-123');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('cast_member_id', 'cast-123');
      expect(result).toEqual(mockCastMember);
    });

    it('should return null when cast member is not found', async () => {
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

      const result = await getCastMember('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAuditionCastMembers', () => {
    it('should fetch all cast members for an audition', async () => {
      const mockCastMembers = [mockCastMember];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockCastMembers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getAuditionCastMembers('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result).toEqual(mockCastMembers);
    });
  });

  describe('getRoleCastMembers', () => {
    it('should fetch all cast members for a role', async () => {
      const mockCastMembers = [mockCastMember];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockCastMembers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getRoleCastMembers('role-123');

      expect(mockEq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result).toEqual(mockCastMembers);
    });
  });

  describe('getUserCastMemberships', () => {
    it('should fetch all cast memberships for a user', async () => {
      const mockMemberships = [
        {
          ...mockCastMember,
          auditions: {
            audition_id: 'audition-123',
            show_id: 'show-123',
            shows: { show_id: 'show-123', title: 'Hamilton', author: 'Lin-Manuel Miranda' },
          },
          roles: { role_id: 'role-123', role_name: 'Alexander Hamilton', description: 'Lead role' },
        },
      ];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockMemberships, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getUserCastMemberships('user-123');

      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual(mockMemberships);
    });
  });

  describe('createCastMember', () => {
    it('should create a cast member successfully', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockCastMember, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const castMemberData = {
        audition_id: 'audition-123',
        user_id: 'user-123',
        role_id: 'role-123',
        status: 'Offered' as const,
      };

      const result = await createCastMember(castMemberData);

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockInsert).toHaveBeenCalledWith(castMemberData);
      expect(result.data).toEqual(mockCastMember);
      expect(result.error).toBeNull();
    });
  });

  describe('createCastMembers', () => {
    it('should create multiple cast members successfully', async () => {
      const mockCastMembers = [
        mockCastMember,
        { ...mockCastMember, cast_member_id: 'cast-456', user_id: 'user-456' },
      ];
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({ data: mockCastMembers, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const castMembersData = [
        { audition_id: 'audition-123', user_id: 'user-123', role_id: 'role-123' },
        { audition_id: 'audition-123', user_id: 'user-456', role_id: 'role-456' },
      ];

      const result = await createCastMembers(castMembersData);

      expect(result.data).toEqual(mockCastMembers);
      expect(result.error).toBeNull();
    });
  });

  describe('updateCastMember', () => {
    it('should update a cast member successfully', async () => {
      const updatedCastMember = { ...mockCastMember, status: 'Accepted' as const };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedCastMember, error: null });

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

      const result = await updateCastMember('cast-123', { status: 'Accepted' });

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'Accepted' });
      expect(mockEq).toHaveBeenCalledWith('cast_member_id', 'cast-123');
      expect(result.data?.status).toBe('Accepted');
      expect(result.error).toBeNull();
    });
  });

  describe('updateCastMemberStatus', () => {
    it('should update cast member status successfully', async () => {
      const updatedCastMember = { ...mockCastMember, status: 'Declined' as const };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedCastMember, error: null });

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

      const result = await updateCastMemberStatus('cast-123', 'Declined');

      expect(result.data?.status).toBe('Declined');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteCastMember', () => {
    it('should delete a cast member successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteCastMember('cast-123');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockEq).toHaveBeenCalledWith('cast_member_id', 'cast-123');
      expect(result.error).toBeNull();
    });
  });

  describe('isUserCastInRole', () => {
    it('should return true when user is cast in role', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [{ cast_member_id: 'cast-123' }], error: null });

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

      const result = await isUserCastInRole('user-123', 'role-123');

      expect(result).toBe(true);
    });

    it('should return false when user is not cast in role', async () => {
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

      const result = await isUserCastInRole('user-123', 'role-123');

      expect(result).toBe(false);
    });
  });

  describe('getAcceptedCastMembers', () => {
    it('should fetch accepted cast members for an audition', async () => {
      const mockMembers = [{ ...mockCastMember, status: 'Accepted' as const }];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({ data: mockMembers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });

      const result = await getAcceptedCastMembers('audition-123');

      expect(result).toEqual(mockMembers);
    });
  });

  describe('getPendingOffers', () => {
    it('should fetch pending offers for an audition', async () => {
      const mockOffers = [mockCastMember];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({ data: mockOffers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });

      const result = await getPendingOffers('audition-123');

      expect(result).toEqual(mockOffers);
    });
  });

  describe('getCastMemberCount', () => {
    it('should return the count of cast members for an audition', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getCastMemberCount('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result).toBe(5);
    });
  });

  describe('getAcceptedCastCount', () => {
    it('should return the count of accepted cast members', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockResolvedValue({ count: 3, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        eq: mockEq2,
      });

      const result = await getAcceptedCastCount('audition-123');

      expect(mockEq2).toHaveBeenCalledWith('status', 'Accepted');
      expect(result).toBe(3);
    });
  });

  describe('isRoleFilled', () => {
    it('should return true when role is filled', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [{ cast_member_id: 'cast-123' }], error: null });

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

      const result = await isRoleFilled('role-123');

      expect(result).toBe(true);
    });

    it('should return false when role is not filled', async () => {
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

      const result = await isRoleFilled('role-123');

      expect(result).toBe(false);
    });
  });

  describe('bulkUpdateCastMemberStatus', () => {
    it('should update multiple cast member statuses successfully', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockIn = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        in: mockIn,
      });

      const castMemberIds = ['cast-1', 'cast-2', 'cast-3'];
      const result = await bulkUpdateCastMemberStatus(castMemberIds, 'Accepted');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'Accepted' });
      expect(mockIn).toHaveBeenCalledWith('cast_member_id', castMemberIds);
      expect(result.error).toBeNull();
    });
  });

  describe('getEnsembleMembers', () => {
    it('should fetch ensemble members for an audition', async () => {
      const mockEnsembleMember = { ...mockCastMember, role_id: null };
      const mockMembers = [mockEnsembleMember];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockResolvedValue({ data: mockMembers, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        is: mockIs,
      });

      const result = await getEnsembleMembers('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('cast_members');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockIs).toHaveBeenCalledWith('role_id', null);
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getEnsembleMemberCount', () => {
    it('should return the count of ensemble members', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockResolvedValue({ count: 8, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        is: mockIs,
      });

      const result = await getEnsembleMemberCount('audition-123');

      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockIs).toHaveBeenCalledWith('role_id', null);
      expect(result).toBe(8);
    });
  });

  describe('isUserInEnsemble', () => {
    it('should return true when user is in ensemble', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [{ cast_member_id: 'cast-123' }], error: null });

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
        is: mockIs,
      });
      mockIs.mockReturnValue({
        limit: mockLimit,
      });

      const result = await isUserInEnsemble('user-123', 'audition-123');

      expect(result).toBe(true);
    });

    it('should return false when user is not in ensemble', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockReturnThis();
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
        is: mockIs,
      });
      mockIs.mockReturnValue({
        limit: mockLimit,
      });

      const result = await isUserInEnsemble('user-123', 'audition-123');

      expect(result).toBe(false);
    });
  });

  describe('getUserRolesInAudition', () => {
    it('should fetch all roles a user is cast in for an audition', async () => {
      const mockRoles = [
        {
          ...mockCastMember,
          roles: { role_id: 'role-123', role_name: 'Lead', description: 'Main character', role_type: 'Principal' },
        },
      ];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockEq2 = jest.fn().mockReturnThis();
      const mockNot = jest.fn().mockResolvedValue({ data: mockRoles, error: null });

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
        not: mockNot,
      });

      const result = await getUserRolesInAudition('user-123', 'audition-123');

      expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockEq2).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockNot).toHaveBeenCalledWith('role_id', 'is', null);
      expect(result).toEqual(mockRoles);
    });
  });
});
