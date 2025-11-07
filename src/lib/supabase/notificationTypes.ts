/**
 * Notification type definitions
 * These must match the CHECK constraint in the notifications table
 */

export type NotificationType = 
  | 'company_approval'
  | 'user_affiliation'
  | 'casting_decision'
  | 'casting_offer'
  | 'general';

/**
 * Valid notification types array for validation
 */
export const VALID_NOTIFICATION_TYPES: NotificationType[] = [
  'company_approval',
  'user_affiliation',
  'casting_decision',
  'casting_offer',
  'general',
];
