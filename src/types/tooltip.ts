/**
 * Tooltip system types for managing dismissible tips throughout the app
 */

export type TooltipId = 
  | 'profile-photo-tip'
  | 'role-understudy-tip'
  | 'audition-dates-tip'
  | 'callback-bulk-actions-tip'
  | 'casting-offer-tip'
  | 'search-debounce-tip'
  | 'company-roles-tip'
  | 'slot-scheduler-tip';

export interface TooltipPreferences {
  dismissed: TooltipId[];
}

export interface TooltipConfig {
  id: TooltipId;
  title?: string;
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}
