import { createApprovalRequest, updateApprovalRequest, getUserPendingApprovalRequests } from '../companyApprovals';
import { supabase } from '../client';
import { getCompany } from '../company';

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

describe('Company Approval Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockCompanyId = 'company-789';
  const mockResumeEntryId = 'resume-abc';
  const mockRequestId = 'request-xyz';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createApprovalRequest', () => {
    it('should allow users to create approval requests for themselves', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful database insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              request_id: mockRequestId,
              resume_entry_id: mockResumeEntryId,
              company_id: mockCompanyId,
              user_id: mockAuthenticatedUserId,
              status: 'pending'
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createApprovalRequest(
        mockResumeEntryId,
        mockCompanyId,
        mockAuthenticatedUserId
      );

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.status).toBe('pending');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should prevent users from creating approval requests for other users', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockInsert = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createApprovalRequest(
        mockResumeEntryId,
        mockCompanyId,
        mockOtherUserId // Different user
      );

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

      const result = await createApprovalRequest(
        mockResumeEntryId,
        mockCompanyId,
        mockAuthenticatedUserId
      );

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('updateApprovalRequest', () => {
    it('should allow company owners to approve requests', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the approval request
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              request_id: mockRequestId,
              resume_entry_id: mockResumeEntryId,
              company_id: mockCompanyId,
              user_id: mockOtherUserId,
              status: 'pending',
              companies: {
                creator_user_id: mockAuthenticatedUserId // User owns the company
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
                request_id: mockRequestId,
                status: 'approved'
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_approval_requests') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'user_resume') {
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
      });

      const result = await updateApprovalRequest(mockRequestId, 'approved');

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.status).toBe('approved');
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent non-owners from approving requests', async () => {
      // Mock authenticated user (NOT company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the approval request
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              request_id: mockRequestId,
              companies: {
                creator_user_id: mockOtherUserId // Different user owns the company
              }
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn();

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_approval_requests') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const result = await updateApprovalRequest(mockRequestId, 'approved');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated approval attempts', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateApprovalRequest(mockRequestId, 'approved');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should update resume entry when request is approved', async () => {
      // Mock authenticated user (company owner)
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching the approval request
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              request_id: mockRequestId,
              resume_entry_id: mockResumeEntryId,
              companies: {
                creator_user_id: mockAuthenticatedUserId
              }
            },
            error: null,
          }),
        }),
      });

      // Mock successful update of approval request
      const mockApprovalUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                request_id: mockRequestId,
                resume_entry_id: mockResumeEntryId,
                status: 'approved'
              },
              error: null,
            }),
          }),
        }),
      });

      // Mock successful update of resume entry
      const mockResumeUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'company_approval_requests') {
          return {
            select: mockSelect,
            update: mockApprovalUpdate,
          };
        }
        if (table === 'user_resume') {
          return {
            update: mockResumeUpdate,
          };
        }
      });

      const result = await updateApprovalRequest(mockRequestId, 'approved');

      expect(result.error).toBeNull();
      expect(mockResumeUpdate).toHaveBeenCalled();
    });
  });

  describe('getUserPendingApprovalRequests', () => {
    it('should return pending requests for companies owned by user', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock fetching user's companies
      const mockCompaniesSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [
            { company_id: mockCompanyId },
            { company_id: 'company-2' }
          ],
          error: null,
        }),
      });

      // Mock fetching approval requests
      const mockRequestsSelect = jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [
                {
                  request_id: mockRequestId,
                  company_id: mockCompanyId,
                  status: 'pending'
                }
              ],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'companies') {
          return { select: mockCompaniesSelect };
        }
        if (table === 'company_approval_requests') {
          return { select: mockRequestsSelect };
        }
      });

      const result = await getUserPendingApprovalRequests();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('should return empty array for unauthenticated users', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getUserPendingApprovalRequests();

      expect(result).toEqual([]);
    });
  });
});
