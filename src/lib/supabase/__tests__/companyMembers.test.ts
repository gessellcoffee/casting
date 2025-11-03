import { 
  addCompanyMember, 
  removeCompanyMember, 
  updateCompanyMemberRole,
  getCompanyMembers,
  isCompanyMember,
  getUserRoleInCompany
} from '../companyMembers';
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

// Mock the getCompany function
jest.mock('../company', () => ({
  getCompany: jest.fn(),
}));

import { getCompany } from '../company';

describe('Company Members Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockCompanyId = 'company-789';
  const mockMemberId = 'member-101';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addCompanyMember', () => {
    it('should allow company owners to add members', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock company owned by authenticated user
      (getCompany as jest.Mock).mockResolvedValue({
        company_id: mockCompanyId,
        creator_user_id: mockAuthenticatedUserId,
        name: 'Test Company',
      });

      // Mock checking for existing member (none found)
      const mockExistingMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found error
            }),
          }),
        }),
      });

      // Mock successful insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              role: 'member',
              status: 'active'
            },
            error: null,
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockExistingMemberSelect };
          } else {
            return { insert: mockInsert };
          }
        }
      });

      const result = await addCompanyMember(mockCompanyId, mockOtherUserId);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.user_id).toBe(mockOtherUserId);
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should allow company admins to add members', async () => {
      // Mock authenticated user (not company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock company owned by different user
      (getCompany as jest.Mock).mockResolvedValue({
        company_id: mockCompanyId,
        creator_user_id: 'different-user',
        name: 'Test Company',
      });

      // Mock user is an admin
      const mockAdminCheck = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'admin' },
                error: null,
              }),
            }),
          }),
        }),
      });

      // Mock checking for existing member (none found)
      const mockExistingMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock successful insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              role: 'member',
              status: 'active'
            },
            error: null,
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockAdminCheck };
          } else if (callCount === 2) {
            return { select: mockExistingMemberSelect };
          } else {
            return { insert: mockInsert };
          }
        }
      });

      const result = await addCompanyMember(mockCompanyId, mockOtherUserId);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
    });

    it('should reject non-admin/non-owner users from adding members', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock company owned by different user
      (getCompany as jest.Mock).mockResolvedValue({
        company_id: mockCompanyId,
        creator_user_id: 'different-user',
        name: 'Test Company',
      });

      // Mock user is just a regular member
      const mockMemberCheck = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'member' },
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          return { select: mockMemberCheck };
        }
      });

      const result = await addCompanyMember(mockCompanyId, mockOtherUserId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
    });

    it('should reject unauthenticated requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await addCompanyMember(mockCompanyId, mockOtherUserId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
    });

    it('should prevent adding duplicate members', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock company owned by authenticated user
      (getCompany as jest.Mock).mockResolvedValue({
        company_id: mockCompanyId,
        creator_user_id: mockAuthenticatedUserId,
        name: 'Test Company',
      });

      // Mock existing active member
      const mockExistingMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                member_id: mockMemberId,
                status: 'active'
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          return { select: mockExistingMemberSelect };
        }
      });

      const result = await addCompanyMember(mockCompanyId, mockOtherUserId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('already a member');
      expect(result.data).toBeNull();
    });
  });

  describe('removeCompanyMember', () => {
    it('should allow company owners to remove members', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the member
      const mockMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              role: 'member',
              companies: {
                creator_user_id: mockAuthenticatedUserId
              }
            },
            error: null,
          }),
        }),
      });

      // Mock successful update (soft delete)
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockMemberSelect };
          } else {
            return { update: mockUpdate };
          }
        }
      });

      const result = await removeCompanyMember(mockMemberId);

      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should allow members to remove themselves', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the member (user removing themselves)
      const mockMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockAuthenticatedUserId, // Same as authenticated user
              role: 'member',
              companies: {
                creator_user_id: 'different-user'
              }
            },
            error: null,
          }),
        }),
      });

      // Mock successful update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockMemberSelect };
          } else {
            return { update: mockUpdate };
          }
        }
      });

      const result = await removeCompanyMember(mockMemberId);

      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent removing the last owner', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the member (who is an owner)
      const mockMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockAuthenticatedUserId,
              role: 'owner',
              companies: {
                creator_user_id: mockAuthenticatedUserId
              }
            },
            error: null,
          }),
        }),
      });

      // Mock checking for other owners (only one owner)
      const mockOwnersSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ member_id: mockMemberId }], // Only one owner
              error: null,
            }),
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockMemberSelect };
          } else {
            return { select: mockOwnersSelect };
          }
        }
      });

      const result = await removeCompanyMember(mockMemberId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('last owner');
    });
  });

  describe('updateCompanyMemberRole', () => {
    it('should allow company owners to update member roles', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the member
      const mockMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              role: 'member',
              companies: {
                creator_user_id: mockAuthenticatedUserId
              }
            },
            error: null,
          }),
        }),
      });

      // Mock successful update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                member_id: mockMemberId,
                role: 'admin'
              },
              error: null,
            }),
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockMemberSelect };
          } else {
            return { update: mockUpdate };
          }
        }
      });

      const result = await updateCompanyMemberRole(mockMemberId, 'admin');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.role).toBe('admin');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reject non-admin/non-owner users from updating roles', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the member
      const mockMemberSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              member_id: mockMemberId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              role: 'member',
              companies: {
                creator_user_id: 'different-user'
              }
            },
            error: null,
          }),
        }),
      });

      // Mock user is just a regular member
      const mockUserMembershipSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { role: 'member' },
                error: null,
              }),
            }),
          }),
        }),
      });

      let callCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_members') {
          callCount++;
          if (callCount === 1) {
            return { select: mockMemberSelect };
          } else {
            return { select: mockUserMembershipSelect };
          }
        }
      });

      const result = await updateCompanyMemberRole(mockMemberId, 'admin');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
    });
  });
});
