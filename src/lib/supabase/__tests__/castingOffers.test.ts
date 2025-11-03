import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createCastingOffer,
  createBulkCastingOffers,
  getCastingOffer,
  getAuditionOffers,
  getUserOffers,
  getUserPendingOffers,
  acceptCastingOffer,
  declineCastingOffer,
  getOfferStats,
} from '../castingOffers';

// Mock Supabase client
vi.mock('../client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockOffer, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockOffer, error: null })),
          order: vi.fn(() => Promise.resolve({ data: [mockOffer], error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [mockOffer], error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockOffer, error: null })),
          })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
  },
}));

// Mock other dependencies
vi.mock('../notifications', () => ({
  createNotification: vi.fn(() => Promise.resolve({ data: {}, error: null })),
}));

vi.mock('../castMembers', () => ({
  createCastMember: vi.fn(() => Promise.resolve({
    data: { cast_member_id: 'test-cast-member-id' },
    error: null,
  })),
  updateCastMemberStatus: vi.fn(() => Promise.resolve({ error: null })),
}));

const mockOffer = {
  offer_id: 'test-offer-id',
  cast_member_id: 'test-cast-member-id',
  audition_id: 'test-audition-id',
  user_id: 'test-user-id',
  role_id: 'test-role-id',
  sent_by: 'test-sender-id',
  offer_message: 'Test offer message',
  offer_notes: 'Test notes',
  sent_at: new Date().toISOString(),
  responded_at: null,
  email_sent: false,
  email_sent_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('castingOffers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCastingOffer', () => {
    it('should create a casting offer successfully', async () => {
      const offerData = {
        auditionId: 'test-audition-id',
        userId: 'test-user-id',
        roleId: 'test-role-id',
        isUnderstudy: false,
        sentBy: 'test-sender-id',
        offerMessage: 'Congratulations!',
        offerNotes: 'Great audition',
      };

      const result = await createCastingOffer(offerData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });

    it('should handle ensemble offers (null role_id)', async () => {
      const offerData = {
        auditionId: 'test-audition-id',
        userId: 'test-user-id',
        roleId: null,
        isUnderstudy: false,
        sentBy: 'test-sender-id',
      };

      const result = await createCastingOffer(offerData);

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('createBulkCastingOffers', () => {
    it('should create multiple offers successfully', async () => {
      const offers = [
        {
          auditionId: 'test-audition-id',
          userId: 'user-1',
          roleId: 'role-1',
          isUnderstudy: false,
          sentBy: 'test-sender-id',
        },
        {
          auditionId: 'test-audition-id',
          userId: 'user-2',
          roleId: 'role-2',
          isUnderstudy: false,
          sentBy: 'test-sender-id',
        },
      ];

      const result = await createBulkCastingOffers(offers);

      expect(result.successCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getCastingOffer', () => {
    it('should retrieve a casting offer by ID', async () => {
      const offer = await getCastingOffer('test-offer-id');

      expect(offer).toBeDefined();
      expect(offer?.offer_id).toBe('test-offer-id');
    });
  });

  describe('getAuditionOffers', () => {
    it('should retrieve all offers for an audition', async () => {
      const offers = await getAuditionOffers('test-audition-id');

      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
    });
  });

  describe('getUserOffers', () => {
    it('should retrieve all offers for a user', async () => {
      const offers = await getUserOffers('test-user-id');

      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
    });
  });

  describe('getUserPendingOffers', () => {
    it('should retrieve pending offers for a user', async () => {
      const offers = await getUserPendingOffers('test-user-id');

      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
    });
  });

  describe('acceptCastingOffer', () => {
    it('should accept a casting offer', async () => {
      const result = await acceptCastingOffer('test-offer-id', 'test-user-id');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('declineCastingOffer', () => {
    it('should decline a casting offer', async () => {
      const result = await declineCastingOffer('test-offer-id', 'test-user-id');

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    });
  });

  describe('getOfferStats', () => {
    it('should return offer statistics', async () => {
      const stats = await getOfferStats('test-audition-id');

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.pending).toBeGreaterThanOrEqual(0);
      expect(stats.accepted).toBeGreaterThanOrEqual(0);
      expect(stats.declined).toBeGreaterThanOrEqual(0);
    });
  });
});
