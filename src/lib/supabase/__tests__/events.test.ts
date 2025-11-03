import { createEvent, updateEvent, getEvents, deleteEvent } from '../events';
import { supabase } from '../client';
import type { EventFormData } from '../types';

// Mock the supabase client
jest.mock('../client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Events Module', () => {
  const mockUserId = 'test-user-id';
  const mockEventId = 'test-event-id';
  const mockRecurrenceRuleId = 'test-recurrence-rule-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create a non-recurring event', async () => {
      const formData: EventFormData = {
        title: 'Test Event',
        description: 'Test Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Test Location',
        color: '#3b82f6',
        isRecurring: false,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          byDay: [],
          byMonthDay: [],
          byMonth: [],
          endType: 'never',
          endDate: '',
          occurrences: 10,
        },
      };

      const mockEventData = {
        id: mockEventId,
        user_id: mockUserId,
        title: formData.title,
        description: formData.description,
        start_time: formData.start,
        end_time: formData.end,
        all_day: formData.allDay,
        location: formData.location,
        color: formData.color,
        recurrence_rule_id: null,
      };

      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockEventData,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await createEvent(formData, mockUserId);

      expect(result).toBeDefined();
      expect(result?.title).toBe(formData.title);
      expect(result?.isRecurring).toBe(false);
      expect(mockFrom).toHaveBeenCalledWith('events');
    });

    it('should create a recurring event with recurrence rule', async () => {
      const formData: EventFormData = {
        title: 'Recurring Event',
        description: 'Test Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Test Location',
        color: '#3b82f6',
        isRecurring: true,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          byDay: ['MO', 'WE', 'FR'],
          byMonthDay: [],
          byMonth: [],
          endType: 'after',
          endDate: '',
          occurrences: 10,
        },
      };

      const mockRecurrenceData = {
        id: mockRecurrenceRuleId,
        frequency: 'WEEKLY',
        interval: 1,
        by_day: ['MO', 'WE', 'FR'],
        count: 10,
      };

      const mockEventData = {
        id: mockEventId,
        user_id: mockUserId,
        title: formData.title,
        description: formData.description,
        start_time: formData.start,
        end_time: formData.end,
        all_day: formData.allDay,
        location: formData.location,
        color: formData.color,
        recurrence_rule_id: mockRecurrenceRuleId,
        recurrence_rules: mockRecurrenceData,
      };

      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation((table: string) => {
        callCount++;
        if (table === 'recurrence_rules') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockRecurrenceData,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'events') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockEventData,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await createEvent(formData, mockUserId);

      expect(result).toBeDefined();
      expect(result?.title).toBe(formData.title);
      expect(result?.isRecurring).toBe(true);
      expect(result?.recurrenceRule).toBeDefined();
      expect(result?.recurrenceRule?.frequency).toBe('WEEKLY');
      expect(mockFrom).toHaveBeenCalledWith('recurrence_rules');
      expect(mockFrom).toHaveBeenCalledWith('events');
    });

    it('should create a recurring event with CUSTOM frequency type', async () => {
      const formData: EventFormData = {
        title: 'Custom Recurring Event',
        description: 'Test Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Test Location',
        color: '#3b82f6',
        isRecurring: true,
        recurrence: {
          frequency: 'CUSTOM',
          customFrequencyType: 'MONTHLY',
          interval: 2,
          byDay: ['MO', 'WE'],
          byMonthDay: [],
          byMonth: [],
          endType: 'never',
          endDate: '',
          occurrences: 10,
        },
      };

      const mockRecurrenceData = {
        id: mockRecurrenceRuleId,
        frequency: 'MONTHLY', // Should use customFrequencyType
        interval: 2,
        by_day: ['MO', 'WE'],
      };

      const mockEventData = {
        id: mockEventId,
        user_id: mockUserId,
        title: formData.title,
        description: formData.description,
        start_time: formData.start,
        end_time: formData.end,
        all_day: formData.allDay,
        location: formData.location,
        color: formData.color,
        recurrence_rule_id: mockRecurrenceRuleId,
        recurrence_rules: mockRecurrenceData,
      };

      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation((table: string) => {
        callCount++;
        if (table === 'recurrence_rules') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockRecurrenceData,
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'events') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockEventData,
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await createEvent(formData, mockUserId);

      expect(result).toBeDefined();
      expect(result?.title).toBe(formData.title);
      expect(result?.isRecurring).toBe(true);
      expect(result?.recurrenceRule).toBeDefined();
      expect(result?.recurrenceRule?.frequency).toBe('MONTHLY'); // Should be MONTHLY, not CUSTOM
    });

    it('should handle errors when creating recurrence rule fails', async () => {
      const formData: EventFormData = {
        title: 'Recurring Event',
        description: 'Test Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Test Location',
        color: '#3b82f6',
        isRecurring: true,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          byDay: ['MO'],
          byMonthDay: [],
          byMonth: [],
          endType: 'never',
          endDate: '',
          occurrences: 10,
        },
      };

      const mockError = { message: 'Database error', code: '42501' };

      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock) = mockFrom;

      await expect(createEvent(formData, mockUserId)).rejects.toEqual(mockError);
    });
  });

  describe('updateEvent', () => {
    it('should update a non-recurring event', async () => {
      const formData: EventFormData = {
        title: 'Updated Event',
        description: 'Updated Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Updated Location',
        color: '#ff0000',
        isRecurring: false,
        recurrence: {
          frequency: 'WEEKLY',
          interval: 1,
          byDay: [],
          byMonthDay: [],
          byMonth: [],
          endType: 'never',
          endDate: '',
          occurrences: 10,
        },
      };

      const mockCurrentEvent = {
        recurrence_rule_id: null,
      };

      const mockUpdatedEvent = {
        id: mockEventId,
        user_id: mockUserId,
        title: formData.title,
        description: formData.description,
        start_time: formData.start,
        end_time: formData.end,
        all_day: formData.allDay,
        location: formData.location,
        color: formData.color,
        recurrence_rule_id: null,
      };

      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // First call to fetch current event
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockCurrentEvent,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else {
          // Second call to update event
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockUpdatedEvent,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await updateEvent(mockEventId, formData, mockUserId);

      expect(result).toBeDefined();
      expect(result?.title).toBe(formData.title);
      expect(result?.isRecurring).toBe(false);
    });

    it('should add recurrence to a non-recurring event', async () => {
      const formData: EventFormData = {
        title: 'Event with New Recurrence',
        description: 'Test Description',
        start: '2024-01-01T10:00:00',
        end: '2024-01-01T11:00:00',
        allDay: false,
        location: 'Test Location',
        color: '#3b82f6',
        isRecurring: true,
        recurrence: {
          frequency: 'DAILY',
          interval: 1,
          byDay: [],
          byMonthDay: [],
          byMonth: [],
          endType: 'after',
          endDate: '',
          occurrences: 5,
        },
      };

      const mockCurrentEvent = {
        recurrence_rule_id: null,
      };

      const mockRecurrenceData = {
        id: mockRecurrenceRuleId,
        frequency: 'DAILY',
        interval: 1,
        count: 5,
      };

      const mockUpdatedEvent = {
        id: mockEventId,
        user_id: mockUserId,
        title: formData.title,
        recurrence_rule_id: mockRecurrenceRuleId,
        recurrence_rules: mockRecurrenceData,
      };

      let callCount = 0;
      const mockFrom = jest.fn().mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          // Fetch current event
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockCurrentEvent,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        } else if (table === 'recurrence_rules') {
          // Create recurrence rule
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockRecurrenceData,
                  error: null,
                }),
              }),
            }),
          };
        } else {
          // Update event
          return {
            update: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockUpdatedEvent,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await updateEvent(mockEventId, formData, mockUserId);

      expect(result).toBeDefined();
      expect(result?.isRecurring).toBe(true);
      expect(result?.recurrenceRule?.frequency).toBe('DAILY');
    });
  });

  describe('getEvents', () => {
    it('should fetch events with recurrence rules', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents = [
        {
          id: 'event-1',
          user_id: mockUserId,
          title: 'Event 1',
          start_time: '2024-01-05T10:00:00',
          end_time: '2024-01-05T11:00:00',
          recurrence_rule_id: null,
        },
        {
          id: 'event-2',
          user_id: mockUserId,
          title: 'Event 2',
          start_time: '2024-01-10T14:00:00',
          end_time: '2024-01-10T15:00:00',
          recurrence_rule_id: mockRecurrenceRuleId,
          recurrence_rules: {
            id: mockRecurrenceRuleId,
            frequency: 'WEEKLY',
            interval: 1,
            by_day: ['MO'],
          },
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            gte: jest.fn().mockReturnValue({
              lte: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({
                  data: mockEvents,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await getEvents(startDate, endDate, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].isRecurring).toBe(false);
      expect(result[1].isRecurring).toBe(true);
      expect(result[1].recurrenceRule?.frequency).toBe('WEEKLY');
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock) = mockFrom;

      const result = await deleteEvent(mockEventId, mockUserId);

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('events');
    });

    it('should handle errors when deleting an event', async () => {
      const mockError = { message: 'Delete failed', code: '42501' };

      const mockFrom = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              error: mockError,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock) = mockFrom;

      await expect(deleteEvent(mockEventId, mockUserId)).rejects.toEqual(mockError);
    });
  });
});
