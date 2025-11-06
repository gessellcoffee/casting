import {
  getUserSkills,
  getUniqueSkills,
  addSkill,
  removeSkill,
} from '../skills';
import { getProfile, updateProfile } from '../profile';
import { supabase } from '../client';

// Mock the profile module
jest.mock('../profile', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('Skills Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';

  const mockProfile = {
    id: mockAuthenticatedUserId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'johndoe',
    skills: ['Acting', 'Singing', 'Dancing'],
    profile_photo_url: null,
    description: null,
    resume_url: null,
    image_gallery: null,
    video_gallery: null,
    education: null,
    preferences: null,
    created_at: '2024-01-01T00:00:00Z',
    middle_name: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserSkills', () => {
    it('should fetch all skills for a user', async () => {
      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await getUserSkills(mockAuthenticatedUserId);

      expect(result).toEqual(['Acting', 'Dancing', 'Singing']);
      expect(getProfile).toHaveBeenCalledWith(mockAuthenticatedUserId);
    });

    it('should return empty array if profile has no skills', async () => {
      (getProfile as jest.Mock).mockResolvedValue({ ...mockProfile, skills: null });

      const result = await getUserSkills(mockAuthenticatedUserId);

      expect(result).toEqual([]);
    });

    it('should return empty array if profile not found', async () => {
      (getProfile as jest.Mock).mockResolvedValue(null);

      const result = await getUserSkills(mockAuthenticatedUserId);

      expect(result).toEqual([]);
    });
  });

  describe('getUniqueSkills', () => {
    it('should fetch unique skills with usage count from all profiles', async () => {
      const mockProfiles = [
        { skills: ['Acting', 'Singing'] },
        { skills: ['Acting', 'Dancing'] },
        { skills: ['Singing'] },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        not: jest.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getUniqueSkills();

      expect(result).toEqual([
        { skill_name: 'Acting', usage_count: 2 },
        { skill_name: 'Singing', usage_count: 2 },
        { skill_name: 'Dancing', usage_count: 1 },
      ]);
    });

    it('should filter skills by search term', async () => {
      const mockProfiles = [
        { skills: ['Acting', 'Singing', 'Dancing'] },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        not: jest.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const result = await getUniqueSkills('act');

      expect(result).toEqual([{ skill_name: 'Acting', usage_count: 1 }]);
    });
  });

  describe('addSkill', () => {
    it('should add a skill to user profile', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue({
        data: { ...mockProfile, skills: ['Acting', 'Dancing', 'Singing', 'Voice Acting'] },
        error: null,
      });

      const result = await addSkill(mockAuthenticatedUserId, 'Voice Acting');

      expect(result.error).toBeNull();
      expect(result.data).toContain('Voice Acting');
      expect(updateProfile).toHaveBeenCalledWith(mockAuthenticatedUserId, {
        skills: ['Acting', 'Dancing', 'Singing', 'Voice Acting'],
      });
    });

    it('should prevent adding duplicate skills', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      (getProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await addSkill(mockAuthenticatedUserId, 'Acting');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('already exists');
      expect(updateProfile).not.toHaveBeenCalled();
    });

    it('should prevent users from adding skills to other profiles', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const result = await addSkill(mockOtherUserId, 'Acting');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
    });
  });

  describe('removeSkill', () => {
    it('should remove a skill from user profile', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      (getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (updateProfile as jest.Mock).mockResolvedValue({
        data: { ...mockProfile, skills: ['Acting', 'Singing'] },
        error: null,
      });

      const result = await removeSkill(mockAuthenticatedUserId, 'Dancing');

      expect(result.error).toBeNull();
      expect(result.success).toBe(true);
      expect(updateProfile).toHaveBeenCalledWith(mockAuthenticatedUserId, {
        skills: ['Acting', 'Singing'],
      });
    });

    it('should prevent users from removing skills from other profiles', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const result = await removeSkill(mockOtherUserId, 'Acting');

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
    });
  });
});
