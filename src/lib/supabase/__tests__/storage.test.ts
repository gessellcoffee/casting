import { uploadProfilePhoto, uploadResume, uploadGalleryImage } from '../storage';
import { supabase } from '../client';

// Mock the Supabase client
jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('Storage Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadProfilePhoto', () => {
    it('should allow users to upload to their own profile folder', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock storage upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test.jpg' },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const result = await uploadProfilePhoto(mockAuthenticatedUserId, mockFile);

      expect(result.error).toBeNull();
      expect(result.url).toBeTruthy();
      expect(mockUpload).toHaveBeenCalled();
    });

    it('should prevent users from uploading to other users folders', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpload = jest.fn();
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      // Attempt to upload to another user's folder
      const result = await uploadProfilePhoto(mockOtherUserId, mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.url).toBeNull();
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated upload requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockUpload = jest.fn();
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      const result = await uploadProfilePhoto(mockAuthenticatedUserId, mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.url).toBeNull();
      expect(mockUpload).not.toHaveBeenCalled();
    });
  });

  describe('uploadResume', () => {
    it('should allow users to upload resume to their own folder', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/resume.pdf' },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const result = await uploadResume(mockAuthenticatedUserId, mockFile);

      expect(result.error).toBeNull();
      expect(result.url).toBeTruthy();
    });

    it('should prevent users from uploading resume to other users folders', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpload = jest.fn();
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      const result = await uploadResume(mockOtherUserId, mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.url).toBeNull();
      expect(mockUpload).not.toHaveBeenCalled();
    });
  });

  describe('uploadGalleryImage', () => {
    it('should allow users to upload gallery images to their own folder', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'test-path' },
        error: null,
      });

      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/gallery.jpg' },
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      const result = await uploadGalleryImage(mockAuthenticatedUserId, mockFile);

      expect(result.error).toBeNull();
      expect(result.url).toBeTruthy();
    });

    it('should prevent users from uploading gallery images to other users folders', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpload = jest.fn();
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
      });

      const result = await uploadGalleryImage(mockOtherUserId, mockFile);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
      expect(result.url).toBeNull();
      expect(mockUpload).not.toHaveBeenCalled();
    });
  });
});
