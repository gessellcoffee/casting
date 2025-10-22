import { createCompany, updateCompany, deleteCompany, getCompany } from '../company';
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

describe('Company Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockCompanyId = 'company-789';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should allow authenticated users to create a company', async () => {
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
              company_id: mockCompanyId, 
              creator_user_id: mockAuthenticatedUserId,
              name: 'Test Company' 
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createCompany({
        name: 'Test Company',
        description: 'A test company',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.creator_user_id).toBe(mockAuthenticatedUserId);
      expect(mockInsert).toHaveBeenCalled();
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

      const result = await createCompany({
        name: 'Test Company',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('updateCompany', () => {
    it('should allow users to update their own company', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getCompany to return a company owned by the user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              company_id: mockCompanyId,
              creator_user_id: mockAuthenticatedUserId,
              name: 'Old Name' 
            },
            error: null,
          }),
        }),
      });

      // Mock successful database update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { 
                company_id: mockCompanyId,
                creator_user_id: mockAuthenticatedUserId,
                name: 'New Name' 
              },
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const result = await updateCompany(mockCompanyId, {
        name: 'New Name',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent users from updating other users companies', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getCompany to return a company owned by another user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              company_id: mockCompanyId,
              creator_user_id: mockOtherUserId,
              name: 'Other User Company' 
            },
            error: null,
          }),
        }),
      });

      const mockUpdate = jest.fn();
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const result = await updateCompany(mockCompanyId, {
        name: 'Malicious Name',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await updateCompany(mockCompanyId, {
        name: 'New Name',
      });

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteCompany', () => {
    it('should allow users to delete their own company', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getCompany to return a company owned by the user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              company_id: mockCompanyId,
              creator_user_id: mockAuthenticatedUserId,
              name: 'Test Company' 
            },
            error: null,
          }),
        }),
      });

      // Mock successful database delete
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
      });

      const result = await deleteCompany(mockCompanyId);

      expect(result.error).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should prevent users from deleting other users companies', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock getCompany to return a company owned by another user
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              company_id: mockCompanyId,
              creator_user_id: mockOtherUserId,
              name: 'Other User Company' 
            },
            error: null,
          }),
        }),
      });

      const mockDelete = jest.fn();
      
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'companies') {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
      });

      const result = await deleteCompany(mockCompanyId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockDelete = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await deleteCompany(mockCompanyId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
