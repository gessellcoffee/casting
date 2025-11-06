import { searchUsers, getAllSkills, getAllLocations } from '../userSearch';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('User Search Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should search users with text query', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
          skills: ['Acting', 'Singing'],
          location: 'New York',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          range: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
              count: 1,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await searchUsers({ query: 'john' });

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(1);
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
    });

    it('should filter users by skills', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'actor1',
          skills: ['Acting', 'Dancing'],
          location: 'Los Angeles',
        },
      ];

      const mockOverlaps = jest.fn().mockReturnValue({
        range: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 1,
          }),
        }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        overlaps: mockOverlaps,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await searchUsers({ skills: ['Acting'] });

      expect(result.users).toEqual(mockUsers);
      expect(mockOverlaps).toHaveBeenCalledWith('skills', ['Acting']);
    });

    it('should filter users by location', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'actor1',
          location: 'Chicago',
        },
      ];

      const mockIlike = jest.fn().mockReturnValue({
        range: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockUsers,
            error: null,
            count: 1,
          }),
        }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        ilike: mockIlike,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await searchUsers({ location: 'Chicago' });

      expect(result.users).toEqual(mockUsers);
      expect(mockIlike).toHaveBeenCalledWith('location', '%Chicago%');
    });

    it('should handle pagination', async () => {
      const mockRange = jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      });

      const mockSelect = jest.fn().mockReturnValue({
        range: mockRange,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      await searchUsers({ limit: 10, offset: 20 });

      expect(mockRange).toHaveBeenCalledWith(20, 29);
    });

    it('should return empty result on error', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        range: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
            count: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await searchUsers({ query: 'test' });

      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getAllSkills', () => {
    it('should return unique skills from all users', async () => {
      const mockProfiles = [
        { skills: ['Acting', 'Singing'] },
        { skills: ['Acting', 'Dancing'] },
        { skills: ['Directing'] },
      ];

      const mockNot = jest.fn().mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllSkills();

      expect(result).toEqual(['Acting', 'Dancing', 'Directing', 'Singing']);
      expect(mockSelect).toHaveBeenCalledWith('skills');
      expect(mockNot).toHaveBeenCalledWith('skills', 'is', null);
    });

    it('should handle null and empty skills arrays', async () => {
      const mockProfiles = [
        { skills: ['Acting'] },
        { skills: null },
        { skills: [] },
      ];

      const mockNot = jest.fn().mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllSkills();

      expect(result).toEqual(['Acting']);
    });

    it('should return empty array on error', async () => {
      const mockNot = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllSkills();

      expect(result).toEqual([]);
    });
  });

  describe('getAllLocations', () => {
    it('should return unique locations from all users', async () => {
      const mockProfiles = [
        { location: 'New York' },
        { location: 'Los Angeles' },
        { location: 'New York' },
        { location: 'Chicago' },
      ];

      const mockNot = jest.fn().mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllLocations();

      expect(result).toEqual(['Chicago', 'Los Angeles', 'New York']);
      expect(mockSelect).toHaveBeenCalledWith('location');
      expect(mockNot).toHaveBeenCalledWith('location', 'is', null);
    });

    it('should handle null locations', async () => {
      const mockProfiles = [
        { location: 'Boston' },
        { location: null },
        { location: 'Seattle' },
      ];

      const mockNot = jest.fn().mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllLocations();

      expect(result).toEqual(['Boston', 'Seattle']);
    });

    it('should return empty array on error', async () => {
      const mockNot = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const mockSelect = jest.fn().mockReturnValue({
        not: mockNot,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getAllLocations();

      expect(result).toEqual([]);
    });
  });
});
