// ============= PROFILE TYPES =============

export interface UserPreferences {
  dark_mode?: boolean;
  show_casting_history?: boolean;
  tooltips?: {
    dismissed?: string[];
  };
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
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  preferences: UserPreferences | null;
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
  location?: string;
  location_lat?: number | null;
  location_lng?: number | null;
  preferences?: UserPreferences;
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
