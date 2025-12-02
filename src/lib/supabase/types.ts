// ============= PROFILE TYPES =============

export interface UserPreferences {
  dark_mode?: boolean;
  show_casting_history?: boolean;
  tooltips?: {
    dismissed?: string[];
  };
}

export interface TooltipPreferences {
  dismissed?: string[];
}

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  description: string | null;
  profile_photo_url: string | null;
  resume_url: string | null;
  image_gallery: string[] | null;
  video_gallery: string[] | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  preferences: UserPreferences | null;
  skills: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  email?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  description?: string;
  profile_photo_url?: string;
  resume_url?: string;
  image_gallery?: string[];
  video_gallery?: string[];
  location?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  preferences?: UserPreferences;
  skills?: string[];
}

export interface ProfileInsert {
  id: string;
  email: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  description?: string;
  profile_photo_url?: string;
  resume_url?: string;
  image_gallery?: string[];
  video_gallery?: string[];
  location?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  preferences?: UserPreferences;
}

// ============= MEDIA MANAGEMENT TYPES =============

export interface MediaFolder {
  media_folder_id: string;
  user_id: string;
  folder_name: string;
  parent_folder_id: string | null;
  folder_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaFolderInsert {
  user_id: string;
  folder_name: string;
  parent_folder_id?: string | null;
  folder_order?: number;
}

export interface MediaFolderUpdate {
  folder_name?: string;
  parent_folder_id?: string | null;
  folder_order?: number;
}

export interface MediaFile {
  media_file_id: string;
  user_id: string;
  folder_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description: string | null;
  file_order: number;
  created_at: string;
  updated_at: string;
}

export interface MediaFileInsert {
  user_id: string;
  folder_id: string | null;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  description?: string | null;
  file_order?: number;
}

export interface MediaFileUpdate {
  folder_id?: string | null;
  file_name?: string;
  description?: string | null;
  file_order?: number;
}

export interface MediaFolderWithFiles extends MediaFolder {
  files: MediaFile[];
  subfolders: MediaFolderWithFiles[];
}

// ============= COMPANY TYPES =============

export interface Company {
  company_id: string;
  creator_user_id: string;
  name: string;
  description: string | null;
  address: string | null;
  vision: string | null;
  mission: string | null;
  values: string | null;
  image_gallery: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyInsert {
  name: string;
  description?: string | null;
  address?: string | null;
  vision?: string | null;
  mission?: string | null;
  values?: string | null;
  image_gallery?: string[] | null;
}

export interface CompanyUpdate {
  name?: string;
  description?: string | null;
  address?: string | null;
  vision?: string | null;
  mission?: string | null;
  values?: string | null;
  image_gallery?: string[] | null;
}

// ============= CASTING OFFER TYPES =============

export interface CastingOffer {
  offer_id: string;
  cast_member_id: string;
  audition_id: string;
  user_id: string;
  role_id: string | null;
  sent_by: string;
  offer_message: string | null;
  offer_notes: string | null;
  sent_at: string;
  responded_at: string | null;
  email_sent: boolean;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CastingOfferInsert {
  cast_member_id: string;
  audition_id: string;
  user_id: string;
  role_id?: string | null;
  sent_by: string;
  offer_message?: string | null;
  offer_notes?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
}

export interface CastingOfferUpdate {
  offer_message?: string | null;
  offer_notes?: string | null;
  responded_at?: string | null;
  email_sent?: boolean;
  email_sent_at?: string | null;
}

export interface CastingOfferWithDetails extends CastingOffer {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    profile_photo_url: string | null;
  };
  roles?: {
    role_id: string;
    role_name: string;
    description: string | null;
  } | null;
  auditions: {
    audition_id: string;
    shows: {
      show_id: string;
      title: string;
      author: string | null;
    } | null;
  };
  cast_members: {
    cast_member_id: string;
    status: string;
    is_understudy: boolean;
  };
}

// ============= AUDITION TYPES =============

export type EquityStatus = 'Equity' | 'Non-Equity' | 'Hybrid';

// ============= VIRTUAL AUDITION TYPES =============

export interface VirtualAudition {
  virtual_audition_id: string;
  audition_id: string;
  user_id: string;
  submission_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VirtualAuditionInsert {
  audition_id: string;
  user_id: string;
  submission_notes?: string | null;
}

export interface VirtualAuditionUpdate {
  submission_notes?: string | null;
}

export interface VirtualAuditionMedia {
  virtual_audition_media_id: string;
  virtual_audition_id: string;
  media_file_id: string;
  media_order: number;
  created_at: string;
}

export interface VirtualAuditionMediaInsert {
  virtual_audition_id: string;
  media_file_id: string;
  media_order?: number;
}

export interface VirtualAuditionWithMedia extends VirtualAudition {
  media_files: MediaFile[];
}

export interface VirtualAuditionWithDetails extends VirtualAudition {
  media_files: MediaFile[];
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_photo_url: string | null;
    email: string;
  };
}

// ============= SHOW TYPES =============

export interface Show {
  show_id: string;
  creator_user_id: string;
  title: string;
  author: string | null;
  description: string | null;
  genre: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShowInsert {
  creator_user_id?: string;
  title: string;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
}

export interface ShowUpdate {
  title?: string;
  author?: string | null;
  description?: string | null;
  genre?: string | null;
}

// ============= ROLE TYPES =============

export type RoleType = 'Principal' | 'Ensemble' | 'Understudy' | 'Crew' | 'Other';
export type RoleGender = 'masculine' | 'feminine' | 'ungendered';

export interface Role {
  role_id: string;
  show_id: string;
  role_name: string;
  description: string | null;
  vocal_range: string | null;
  role_type: string | null;
  gender: string | null;
  needs_understudy: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleInsert {
  show_id: string;
  role_name: string;
  description?: string | null;
  vocal_range?: string | null;
  needs_understudy?: boolean;
  role_type?: string | null;
  gender?: string | null;
}

export interface RoleUpdate {
  role_name?: string;
  description?: string | null;
  vocal_range?: string | null;
  needs_understudy?: boolean;
  role_type?: string | null;
  gender?: string | null;
}

// ============= AUDITION ROLE TYPES =============

export interface AuditionRole {
  audition_role_id: string;
  audition_id: string;
  role_id: string | null;
  role_name: string;
  description: string | null;
  vocal_range: string | null;
  role_type: string | null;
  gender: string | null;
  needs_understudy: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditionRoleInsert {
  audition_id: string;
  role_id?: string | null;
  role_name: string;
  description?: string | null;
  vocal_range?: string | null;
  needs_understudy?: boolean;
  role_type?: string | null;
  gender?: string | null;
}

export interface AuditionRoleUpdate {
  role_name?: string;
  description?: string | null;
  vocal_range?: string | null;
  needs_understudy?: boolean;
  role_type?: string | null;
  gender?: string | null;
}

// ============= AUDITION TYPES (EXTENDED) =============

export interface Audition {
  audition_id: string;
  user_id: string;
  show_id: string;
  company_id: string | null;
  audition_dates: string[] | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  equity_status: EquityStatus | null;
  pay_rate: string | null;
  pay_type: string | null;
  additional_pay_info: string | null;
  workflow_status: string;
  submission_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditionInsert {
  user_id?: string;
  show_id: string;
  company_id?: string | null;
  audition_dates?: string[] | null;
  location?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  rehearsal_dates?: string | null;
  rehearsal_location?: string | null;
  performance_dates?: string | null;
  performance_location?: string | null;
  ensemble_size?: number | null;
  equity_status?: EquityStatus | null;
  is_paid?: boolean;
  pay_range?: string | null;
  pay_comments?: string | null;
  pay_rate?: string | null;
  pay_type?: string | null;
  additional_pay_info?: string | null;
  workflow_status?: string;
  submission_deadline?: string | null;
}

export interface AuditionUpdate {
  show_id?: string;
  company_id?: string | null;
  audition_dates?: string[] | null;
  location?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  equity_status?: EquityStatus | null;
  pay_rate?: string | null;
  pay_type?: string | null;
  additional_pay_info?: string | null;
  workflow_status?: string;
  submission_deadline?: string | null;
  show_filled_slots?: boolean;
}

// ============= AUDITION SLOT TYPES =============

export interface AuditionSlot {
  slot_id: string;
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_signups: number;
  signup_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditionSlotInsert {
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  max_signups?: number;
  signup_count?: number;
}

export interface AuditionSlotUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  max_signups?: number;
  signup_count?: number;
}

// ============= AUDITION SIGNUP TYPES =============

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface AuditionSignup {
  signup_id: string;
  audition_id: string;
  slot_id: string | null;
  user_id: string;
  notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditionSignupInsert {
  audition_id: string;
  slot_id?: string | null;
  user_id: string;
  notes?: string | null;
  status?: string | null;
}

export interface AuditionSignupUpdate {
  slot_id?: string | null;
  notes?: string | null;
  status?: string | null;
}

export interface AuditionSignupWithDetails extends AuditionSignup {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  };
  auditions: {
    audition_id: string;
    show_id: string;
    shows: {
      show_id: string;
      title: string;
      author: string | null;
    } | null;
  };
}

export interface UserSignupsWithDetails {
  signup_id: string;
  audition_id: string;
  slot_id: string | null;
  user_id: string;
  notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  auditions: {
    audition_id: string;
    show_id: string;
    location: string | null;
    audition_dates: string[] | null;
    shows: {
      title: string;
      author: string | null;
    } | null;
  };
  audition_slots: {
    slot_id: string;
    date: string;
    start_time: string;
    end_time: string;
  } | null;
}

// ============= CALLBACK SLOT TYPES =============

export interface CallbackSlot {
  callback_slot_id: string;
  audition_id: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  max_signups: number | null;
  created_at: string;
  updated_at: string;
}

export interface CallbackSlotInsert {
  audition_id: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  notes?: string | null;
  max_signups?: number | null;
}

export interface CallbackSlotUpdate {
  start_time?: string;
  end_time?: string;
  location?: string | null;
  notes?: string | null;
  max_signups?: number | null;
}

// ============= CALLBACK INVITATION TYPES =============

export type CallbackInvitationStatus = 'pending' | 'accepted' | 'declined' | 'conflict';

export interface CallbackInvitation {
  invitation_id: string;
  callback_slot_id: string;
  signup_id: string;
  user_id: string;
  audition_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  actor_comment: string | null;
  casting_notes: string | null;
  invited_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CallbackInvitationInsert {
  callback_slot_id: string;
  signup_id: string;
  user_id: string;
  audition_id: string;
  status?: 'pending' | 'accepted' | 'rejected';
  actor_comment?: string | null;
  casting_notes?: string | null;
}

export interface CallbackInvitationUpdate {
  status?: 'pending' | 'accepted' | 'rejected';
  actor_comment?: string | null;
  casting_notes?: string | null;
  responded_at?: string | null;
}

// ============= CAST MEMBER TYPES =============

export type CastStatus = 'Offered' | 'Accepted' | 'Declined' | 'Cast';

export interface CastMember {
  cast_member_id: string;
  audition_id: string;
  user_id: string;
  role_id: string | null;
  audition_role_id: string | null;
  is_understudy: boolean;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CastMemberInsert {
  audition_id: string;
  user_id: string;
  role_id?: string | null;
  audition_role_id?: string | null;
  is_understudy?: boolean;
  status?: string;
  notes?: string | null;
}

export interface CastMemberUpdate {
  role_id?: string | null;
  audition_role_id?: string | null;
  is_understudy?: boolean;
  status?: string;
  notes?: string | null;
}

// ============= COMPANY MEMBER TYPES =============

export type CompanyMemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export interface CompanyMember {
  company_member_id: string;
  company_id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyMemberInsert {
  company_id: string;
  user_id: string;
  role?: string;
  status?: string;
}

export interface CompanyMemberUpdate {
  role?: string;
  status?: string;
}

export interface CompanyMemberWithProfile extends CompanyMember {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  };
}

// ============= COMPANY APPROVAL TYPES =============

export interface CompanyApproval {
  approval_id: string;
  company_id: string;
  user_id: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyApprovalInsert {
  company_id: string;
  user_id: string;
  status?: string;
}

export interface CompanyApprovalUpdate {
  status?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

// Aliases for compatibility
export type CompanyApprovalRequest = CompanyApproval;
export type CompanyApprovalRequestInsert = CompanyApprovalInsert;
export type CompanyApprovalRequestUpdate = CompanyApprovalUpdate;

// ============= PRODUCTION TEAM MEMBER TYPES =============

export interface ProductionTeamMember {
  production_team_member_id: string;
  audition_id: string;
  user_id: string | null;
  role_title: string;
  invited_email: string | null;
  status: 'pending' | 'active' | 'declined';
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductionTeamMemberInsert {
  audition_id: string;
  user_id?: string | null;
  role_title: string;
  invited_email?: string | null;
  status?: 'pending' | 'active' | 'declined';
  invited_by?: string | null;
}

export interface ProductionTeamMemberUpdate {
  role_title?: string;
  status?: 'pending' | 'active' | 'declined';
  joined_at?: string | null;
}

export interface ProductionTeamMemberWithProfile extends ProductionTeamMember {
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  } | null;
}

// ============= NOTIFICATION TYPES =============

export interface Notification {
  notification_id: string;
  user_id: string;
  recipient_id: string;
  sender_id: string | null;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  action_url: string | null;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  recipient_id: string;
  sender_id?: string | null;
  type: string;
  title: string;
  message: string;
  link_url?: string | null;
  action_url?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  read?: boolean;
}

export interface NotificationUpdate {
  read?: boolean;
}

// ============= REHEARSAL EVENT TYPES =============

export interface RehearsalEvent {
  rehearsal_events_id: string;
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RehearsalEventInsert {
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  notes?: string | null;
}

export interface RehearsalEventUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string | null;
  notes?: string | null;
}

// ============= PERFORMANCE EVENT TYPES =============

export interface PerformanceEvent {
  performance_event_id: string;
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PerformanceEventInsert {
  audition_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string | null;
  notes?: string | null;
}

export interface PerformanceEventUpdate {
  date?: string;
  start_time?: string;
  end_time?: string;
  location?: string | null;
  notes?: string | null;
}

// ============= CALENDAR EVENT TYPES =============

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  color: string | null;
  recurrence_rule_id: string | null;
  is_recurring: boolean;
  created_at: string;
  updated_at: string;
  // Legacy/computed fields for compatibility
  event_id?: string;
  date?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  isRecurring?: boolean;
  recurrenceRule?: {
    frequency: string;
    interval: number;
    byDay: string[];
    byMonthDay: number[];
    byMonth: number[];
    until: string | null;
    count: number | null;
  } | null;
  _isInstance?: boolean;
  _originalEventId?: string;
}

export interface CalendarEventInsert {
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  all_day?: boolean;
  location?: string | null;
  color?: string | null;
  recurrence_rule_id?: string | null;
}

export interface CalendarEventUpdate {
  title?: string;
  description?: string | null;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  location?: string | null;
  color?: string | null;
  recurrence_rule_id?: string | null;
}

export interface EventFormData {
  title: string;
  description?: string | null;
  date: string;
  start?: string | null;
  start_time?: string | null;
  end?: string | null;
  end_time?: string | null;
  location?: string | null;
  allDay?: boolean;
  color?: string | null;
  isRecurring?: boolean;
  recurrence: {
    enabled: boolean;
    frequency: string;
    customFrequencyType?: string;
    interval: number;
    byDay: string[];
    byMonthDay: number[];
    byMonth: number[];
    endType: 'never' | 'on' | 'after';
    endDate?: string;
    occurrences?: number;
  };
}

// ============= USER RESUME TYPES =============

export type ResumeSource = 'manual' | 'imported' | 'company_approved';

export interface UserResume {
  user_resume_id: string;
  resume_entry_id: string;
  user_id: string;
  resume_data: any;
  show_name?: string | null;
  role?: string | null;
  company_name?: string | null;
  company_id?: string | null;
  date_of_production?: string | null;
  source?: ResumeSource | null;
  company_approved?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface UserResumeInsert {
  user_id: string;
  resume_data: any;
  company_id?: string | null;
  company_name?: string | null;
  show_name?: string | null;
  role?: string | null;
  date_of_production?: string | null;
  source?: ResumeSource | null;
  company_approved?: boolean | null;
}

export interface UserResumeUpdate {
  resume_data?: any;
  company_id?: string | null;
  company_name?: string | null;
  source?: ResumeSource | null;
  company_approved?: boolean | null;
}

// ============= DATABASE TYPE =============

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      shows: {
        Row: Show;
        Insert: ShowInsert;
        Update: ShowUpdate;
      };
      roles: {
        Row: Role;
        Insert: RoleInsert;
        Update: RoleUpdate;
      };
      auditions: {
        Row: Audition;
        Insert: AuditionInsert;
        Update: AuditionUpdate;
      };
      audition_roles: {
        Row: AuditionRole;
        Insert: AuditionRoleInsert;
        Update: AuditionRoleUpdate;
      };
      audition_slots: {
        Row: AuditionSlot;
        Insert: AuditionSlotInsert;
        Update: AuditionSlotUpdate;
      };
      audition_signups: {
        Row: AuditionSignup;
        Insert: AuditionSignupInsert;
        Update: AuditionSignupUpdate;
      };
      callback_slots: {
        Row: CallbackSlot;
        Insert: CallbackSlotInsert;
        Update: CallbackSlotUpdate;
      };
      callback_invitations: {
        Row: CallbackInvitation;
        Insert: CallbackInvitationInsert;
        Update: CallbackInvitationUpdate;
      };
      cast_members: {
        Row: CastMember;
        Insert: CastMemberInsert;
        Update: CastMemberUpdate;
      };
      companies: {
        Row: Company;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      company_members: {
        Row: CompanyMember;
        Insert: CompanyMemberInsert;
        Update: CompanyMemberUpdate;
      };
      company_approvals: {
        Row: CompanyApproval;
        Insert: CompanyApprovalInsert;
        Update: CompanyApprovalUpdate;
      };
      production_team_members: {
        Row: ProductionTeamMember;
        Insert: ProductionTeamMemberInsert;
        Update: ProductionTeamMemberUpdate;
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
      };
      casting_offers: {
        Row: CastingOffer;
        Insert: CastingOfferInsert;
        Update: CastingOfferUpdate;
      };
      rehearsal_events: {
        Row: RehearsalEvent;
        Insert: RehearsalEventInsert;
        Update: RehearsalEventUpdate;
      };
      performance_events: {
        Row: PerformanceEvent;
        Insert: PerformanceEventInsert;
        Update: PerformanceEventUpdate;
      };
      events: {
        Row: CalendarEvent;
        Insert: CalendarEventInsert;
        Update: CalendarEventUpdate;
      };
      user_resume: {
        Row: UserResume;
        Insert: UserResumeInsert;
        Update: UserResumeUpdate;
      };
      virtual_auditions: {
        Row: VirtualAudition;
        Insert: VirtualAuditionInsert;
        Update: VirtualAuditionUpdate;
      };
      virtual_audition_media: {
        Row: VirtualAuditionMedia;
        Insert: VirtualAuditionMediaInsert;
        Update: {};
      };
      media_folders: {
        Row: MediaFolder;
        Insert: MediaFolderInsert;
        Update: MediaFolderUpdate;
      };
      media_files: {
        Row: MediaFile;
        Insert: MediaFileInsert;
        Update: MediaFileUpdate;
      };
    };
  };
}
