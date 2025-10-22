import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { supabase } from '../client';
import {
  getRole,
  getShowRoles,
  createRole,
  createRoles,
  updateRole,
  deleteRole,
  deleteShowRoles,
  showHasRoles,
  getShowRoleCount,
} from '../roles';
import type { Role } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Roles Functions', () => {
  const mockRole: Role = {
    role_id: 'role-123',
    show_id: 'show-123',
    role_name: 'Eliza Hamilton',
    description: 'Female lead role',
    role_type: 'Principal',
    gender: 'feminine',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRole', () => {
    it('should fetch a role by ID successfully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockRole, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await getRole('role-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result).toEqual(mockRole);
    });

    it('should return null when role is not found', async () => {
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

      const result = await getRole('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getShowRoles', () => {
    it('should fetch all roles for a show', async () => {
      const mockRoles = [
        mockRole,
        { ...mockRole, role_id: 'role-456', role_name: 'Alexander Hamilton' },
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

      const result = await getShowRoles('show-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
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

      const result = await getShowRoles('show-123');

      expect(result).toEqual([]);
    });
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: mockRole, error: null });

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
        show_id: 'show-123',
        role_name: 'Eliza Hamilton',
        description: 'Female lead role',
        role_type: 'Principal' as const,
        gender: 'feminine' as const,
      };

      const result = await createRole(roleData);

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockInsert).toHaveBeenCalledWith(roleData);
      expect(result.data).toEqual(mockRole);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
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

      const result = await createRole({ show_id: 'show-123', role_name: 'Test Role' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('createRoles', () => {
    it('should create multiple roles successfully', async () => {
      const mockRoles = [
        mockRole,
        { ...mockRole, role_id: 'role-456', role_name: 'Alexander Hamilton' },
      ];
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({ data: mockRoles, error: null });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const rolesData = [
        { show_id: 'show-123', role_name: 'Eliza Hamilton' },
        { show_id: 'show-123', role_name: 'Alexander Hamilton' },
      ];

      const result = await createRoles(rolesData);

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockInsert).toHaveBeenCalledWith(rolesData);
      expect(result.data).toEqual(mockRoles);
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });

      const result = await createRoles([{ show_id: 'show-123', role_name: 'Test' }]);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully', async () => {
      const updatedRole = { ...mockRole, role_name: 'Updated Name' };
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ data: updatedRole, error: null });

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

      const result = await updateRole('role-123', { role_name: 'Updated Name' });

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockUpdate).toHaveBeenCalledWith({ role_name: 'Updated Name' });
      expect(mockEq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result.data?.role_name).toBe('Updated Name');
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

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

      const result = await updateRole('role-123', { role_name: 'Updated' });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteRole('role-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockEq).toHaveBeenCalledWith('role_id', 'role-123');
      expect(result.error).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: { message: 'Delete error' } });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteRole('role-123');

      expect(result.error).toBeDefined();
    });
  });

  describe('deleteShowRoles', () => {
    it('should delete all roles for a show successfully', async () => {
      const mockDelete = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });
      mockDelete.mockReturnValue({
        eq: mockEq,
      });

      const result = await deleteShowRoles('show-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
      expect(result.error).toBeNull();
    });
  });

  describe('showHasRoles', () => {
    it('should return true when show has roles', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ data: [{ role_id: 'role-123' }], error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        limit: mockLimit,
      });

      const result = await showHasRoles('show-123');

      expect(result).toBe(true);
    });

    it('should return false when show has no roles', async () => {
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

      const result = await showHasRoles('show-123');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockLimit = jest.fn().mockResolvedValue({ 
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
        limit: mockLimit,
      });

      const result = await showHasRoles('show-123');

      expect(result).toBe(false);
    });
  });

  describe('getShowRoleCount', () => {
    it('should return the count of roles for a show', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ count: 5, error: null });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });

      const result = await getShowRoleCount('show-123');

      expect(supabase.from).toHaveBeenCalledWith('roles');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
      expect(mockEq).toHaveBeenCalledWith('show_id', 'show-123');
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

      const result = await getShowRoleCount('show-123');

      expect(result).toBe(0);
    });
  });
});
