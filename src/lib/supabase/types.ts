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
