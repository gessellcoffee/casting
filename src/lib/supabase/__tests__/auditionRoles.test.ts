import { supabase } from '../client';
import {
  getAuditionRole,
  getAuditionRoles,
  createAuditionRole,
  createAuditionRoles,
  updateAuditionRole,
  deleteAuditionRole,
  deleteAuditionRoles,
  auditionHasRoles,
  getAuditionRoleCount,
  copyShowRolesToAudition,
} from '../auditionRoles';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('auditionRoles', () => {
  const mockAuditionRole = {
    audition_role_id: 'audition-role-123',
    audition_id: 'audition-123',
    role_id: 'role-123',
    role_name: 'Eliza Hamilton',
    description: 'Lead female role',
    role_type: 'Principal' as const,
    gender: 'feminine' as const,
    needs_understudy: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAuditionRole', () => {
    it('should fetch a single audition role by ID', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAuditionRole, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getAuditionRole('audition-role-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_roles');
      expect(mockEq).toHaveBeenCalledWith('audition_role_id', 'audition-role-123');
      expect(result).toEqual(mockAuditionRole);
    });

    it('should return null on error', async () => {
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

      const result = await getAuditionRole('audition-role-123');

      expect(result).toBeNull();
    });
  });

  describe('getAuditionRoles', () => {
    it('should fetch all roles for an audition', async () => {
      const mockRoles = [
        mockAuditionRole,
        { ...mockAuditionRole, audition_role_id: 'audition-role-456', role_name: 'Alexander Hamilton' },
      ];
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockOrder = jest.fn().mockResolvedValue({ data: mockRoles, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        order: mockOrder,
      });

      const result = await getAuditionRoles('audition-123');

      expect(supabase.from).toHaveBeenCalledWith('audition_roles');
      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(mockOrder).toHaveBeenCalledWith('role_name', { ascending: true });
      expect(result).toEqual(mockRoles);
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

      const result = await getAuditionRoles('audition-123');

      expect(result).toEqual([]);
    });
  });

  describe('createAuditionRole', () => {
    it('should create an audition role successfully', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAuditionRole, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const roleData = {
        audition_id: 'audition-123',
        role_name: 'Eliza Hamilton',
        description: 'Lead female role',
        role_type: 'Principal' as const,
        gender: 'feminine' as const,
        needs_understudy: true,
      };

      const result = await createAuditionRole(roleData);

      expect(supabase.from).toHaveBeenCalledWith('audition_roles');
      expect(mockInsert).toHaveBeenCalledWith(roleData);
      expect(result.data).toEqual(mockAuditionRole);
      expect(result.error).toBeNull();
    });

    it('should return error on failure', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Insert failed' } 
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

      const roleData = {
        audition_id: 'audition-123',
        role_name: 'Eliza Hamilton',
      };

      const result = await createAuditionRole(roleData);

      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe('createAuditionRoles', () => {
    it('should create multiple audition roles', async () => {
      const mockRoles = [mockAuditionRole];
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({ data: mockRoles, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const rolesData = [{
        audition_id: 'audition-123',
        role_name: 'Eliza Hamilton',
      }];

      const result = await createAuditionRoles(rolesData);

      expect(mockInsert).toHaveBeenCalledWith(rolesData);
      expect(result.data).toEqual(mockRoles);
      expect(result.error).toBeNull();
    });
  });

  describe('updateAuditionRole', () => {
    it('should update an audition role successfully', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockAuditionRole, error: null });

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

      const updates = { role_name: 'Updated Name' };
      const result = await updateAuditionRole('audition-role-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('audition_role_id', 'audition-role-123');
      expect(result.data).toEqual(mockAuditionRole);
      expect(result.error).toBeNull();
    });
  });

  describe('deleteAuditionRole', () => {
    it('should delete an audition role successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteAuditionRole('audition-role-123');

      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('audition_role_id', 'audition-role-123');
      expect(result.error).toBeNull();
    });
  });

  describe('deleteAuditionRoles', () => {
    it('should delete all roles for an audition', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteAuditionRoles('audition-123');

      expect(mockEq).toHaveBeenCalledWith('audition_id', 'audition-123');
      expect(result.error).toBeNull();
    });
  });

  describe('auditionHasRoles', () => {
    it('should return true when audition has roles', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ 
        data: [{ audition_role_id: 'audition-role-123' }], 
        error: null 
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        limit: mockLimit,
      });

      const result = await auditionHasRoles('audition-123');

      expect(result).toBe(true);
    });

    it('should return false when audition has no roles', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        limit: mockLimit,
      });

      const result = await auditionHasRoles('audition-123');

      expect(result).toBe(false);
    });
  });

  describe('getAuditionRoleCount', () => {
    it('should return the count of audition roles', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getAuditionRoleCount('audition-123');

      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(result).toBe(5);
    });
  });

  describe('copyShowRolesToAudition', () => {
    it('should copy show roles to audition roles', async () => {
      const mockShowRoles = [
        {
          role_id: 'role-123',
          show_id: 'show-123',
          role_name: 'Eliza Hamilton',
          description: 'Lead female role',
          role_type: 'Principal' as const,
          gender: 'feminine' as const,
          needs_understudy: true,
        },
      ];

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: mockShowRoles, error: null });
      const mockInsert = jest.fn().mockReturnThis();
      const mockInsertSelect = jest.fn().mockResolvedValue({ 
        data: [mockAuditionRole], 
        error: null 
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'roles') {
          return {
            select: mockSelect,
          };
        } else if (table === 'audition_roles') {
          return {
            insert: mockInsert,
          };
        }
      });

      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      mockInsert.mockReturnValue({
        select: mockInsertSelect,
      });

      const result = await copyShowRolesToAudition('show-123', 'audition-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it('should return empty array when show has no roles', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: [], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await copyShowRolesToAudition('show-123', 'audition-123');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });
  });
});
