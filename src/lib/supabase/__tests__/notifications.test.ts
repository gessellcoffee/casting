import { createNotification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../notifications';
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

describe('Notifications Security Tests', () => {
  const mockAuthenticatedUserId = 'user-123';
  const mockOtherUserId = 'user-456';
  const mockNotificationId = 'notification-789';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification successfully', async () => {
      // Mock successful database insert
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { 
              notification_id: mockNotificationId,
              recipient_id: mockAuthenticatedUserId,
              type: 'company_approval',
              title: 'Test Notification',
              message: 'Test message',
              is_read: false
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const result = await createNotification({
        recipient_id: mockAuthenticatedUserId,
        type: 'company_approval',
        title: 'Test Notification',
        message: 'Test message',
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(result.data?.type).toBe('company_approval');
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should allow users to mark their own notifications as read', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: {
                  notification_id: mockNotificationId,
                  is_read: true
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await markNotificationAsRead(mockNotificationId);

      expect(result.error).toBeNull();
      expect(result.data).toBeTruthy();
      expect(mockUpdate).toHaveBeenCalled();
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

      const result = await markNotificationAsRead(mockNotificationId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(result.data).toBeNull();
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should allow users to mark all their notifications as read', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful update
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await markAllNotificationsAsRead(mockAuthenticatedUserId);

      expect(result.error).toBeNull();
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should prevent users from marking other users notifications as read', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      const mockUpdate = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        update: mockUpdate,
      });

      const result = await markAllNotificationsAsRead(mockOtherUserId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Unauthorized');
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

      const result = await markAllNotificationsAsRead(mockAuthenticatedUserId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('should allow users to delete their own notifications', async () => {
      // Mock authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: mockAuthenticatedUserId } },
        error: null,
      });

      // Mock successful delete
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await deleteNotification(mockNotificationId);

      expect(result.error).toBeNull();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should reject unauthenticated delete requests', async () => {
      // Mock no authenticated user
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const mockDelete = jest.fn();
      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await deleteNotification(mockNotificationId);

      expect(result.error).toBeTruthy();
      expect(result.error.message).toContain('Not authenticated');
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
