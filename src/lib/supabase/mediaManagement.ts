import { supabase } from './index';
import type {
  MediaFolder,
  MediaFolderInsert,
  MediaFolderUpdate,
  MediaFile,
  MediaFileInsert,
  MediaFileUpdate,
  MediaFolderWithFiles,
} from './types';

// ============= FOLDER OPERATIONS =============

/**
 * Get all folders for a user with hierarchical structure
 */
export async function getUserMediaFolders(
  userId: string
): Promise<{ data: MediaFolderWithFiles[] | null; error: any }> {
  try {
    // Get all folders
    const { data: folders, error: foldersError } = await supabase
      .from('media_folders')
      .select('*')
      .eq('user_id', userId)
      .order('folder_order', { ascending: true });

    if (foldersError) {
      console.error('Error fetching folders:', foldersError);
      return { data: null, error: foldersError };
    }

    // Get all files
    const { data: files, error: filesError } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('file_order', { ascending: true });

    if (filesError) {
      console.error('Error fetching files:', filesError);
      return { data: null, error: filesError };
    }

    // Build hierarchical structure
    const folderMap = new Map<string, MediaFolderWithFiles>();
    const rootFolders: MediaFolderWithFiles[] = [];

    // Initialize all folders - force type assertion
    (folders as unknown as MediaFolder[] | null)?.forEach((folder) => {
      folderMap.set(folder.media_folder_id, {
        ...folder,
        files: [],
        subfolders: [],
      });
    });

    // Assign files to folders - force type assertion
    (files as unknown as MediaFile[] | null)?.forEach((file) => {
      if (file.folder_id && folderMap.has(file.folder_id)) {
        folderMap.get(file.folder_id)!.files.push(file);
      }
    });

    // Build hierarchy - force type assertion
    (folders as unknown as MediaFolder[] | null)?.forEach((folder) => {
      const folderWithFiles = folderMap.get(folder.media_folder_id)!;
      if (folder.parent_folder_id && folderMap.has(folder.parent_folder_id)) {
        folderMap.get(folder.parent_folder_id)!.subfolders.push(folderWithFiles);
      } else {
        rootFolders.push(folderWithFiles);
      }
    });

    return { data: rootFolders, error: null };
  } catch (error) {
    console.error('Error in getUserMediaFolders:', error);
    return { data: null, error };
  }
}

/**
 * Create a new folder
 */
export async function createMediaFolder(
  folderData: MediaFolderInsert
): Promise<{ data: MediaFolder | null; error: any }> {
  try {
    // Verify authenticated user matches folder owner
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== folderData.user_id) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const { data, error } = await supabase
      .from('media_folders')
      .insert(folderData)
      .select()
      .single();

    if (error) {
      console.error('Error creating folder:', error);
      return { data: null, error };
    }

    return { data: data as unknown as MediaFolder, error: null };
  } catch (error) {
    console.error('Error in createMediaFolder:', error);
    return { data: null, error };
  }
}

/**
 * Update a folder
 */
export async function updateMediaFolder(
  folderId: string,
  updates: MediaFolderUpdate
): Promise<{ data: MediaFolder | null; error: any }> {
  try {
    // Verify user owns the folder
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const { data: folder, error: fetchError } = await supabase
      .from('media_folders')
      .select('user_id')
      .eq('media_folder_id', folderId)
      .single();

    if (fetchError || !folder || folder.user_id !== user.id) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const { data, error } = await supabase
      .from('media_folders')
      .update(updates)
      .eq('media_folder_id', folderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating folder:', error);
      return { data: null, error };
    }

    return { data: data as unknown as MediaFolder, error: null };
  } catch (error) {
    console.error('Error in updateMediaFolder:', error);
    return { data: null, error };
  }
}

/**
 * Delete a folder (and all its contents via CASCADE)
 */
export async function deleteMediaFolder(
  folderId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Verify user owns the folder
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: new Error('Unauthorized') };
    }

    const { data: folder, error: fetchError } = await supabase
      .from('media_folders')
      .select('user_id')
      .eq('media_folder_id', folderId)
      .single();

    if (fetchError || !folder || folder.user_id !== user.id) {
      return { success: false, error: new Error('Unauthorized') };
    }

    // Get all files in this folder and subfolders to delete from storage
    const { data: files } = await supabase
      .from('media_files')
      .select('file_url')
      .eq('folder_id', folderId);

    // Delete the folder (CASCADE will handle subfolders and file records)
    const { error } = await supabase
      .from('media_folders')
      .delete()
      .eq('media_folder_id', folderId);

    if (error) {
      console.error('Error deleting folder:', error);
      return { success: false, error };
    }

    // Delete files from storage
    if (files && files.length > 0) {
      for (const file of files) {
        const filePath = file.file_url.split('/').slice(-2).join('/');
        await supabase.storage.from('media-files').remove([filePath]);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteMediaFolder:', error);
    return { success: false, error };
  }
}

// ============= FILE OPERATIONS =============

/**
 * Get all files for a user (optionally filtered by folder)
 */
export async function getUserMediaFiles(
  userId: string,
  folderId?: string
): Promise<{ data: MediaFile[] | null; error: any }> {
  try {
    let query = supabase
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('file_order', { ascending: true });

    if (folderId !== undefined) {
      query = query.eq('folder_id', folderId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching files:', error);
      return { data: null, error };
    }

    return { data: data as unknown as MediaFile[], error: null };
  } catch (error) {
    console.error('Error in getUserMediaFiles:', error);
    return { data: null, error };
  }
}

/**
 * Upload a video file to storage and create database record
 */
export async function uploadMediaFile(
  userId: string,
  file: File,
  folderId: string | null,
  description?: string
): Promise<{ data: MediaFile | null; error: any }> {
  try {
    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return { data: null, error: new Error('Unauthorized') };
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return { data: null, error: uploadError };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-files')
      .getPublicUrl(filePath);

    // Create database record
    const fileData: MediaFileInsert = {
      user_id: userId,
      folder_id: folderId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      description: description || null,
    };

    const { data, error } = await supabase
      .from('media_files')
      .insert(fileData)
      .select()
      .single();

    if (error) {
      console.error('Error creating file record:', error);
      // Try to clean up uploaded file
      await supabase.storage.from('media-files').remove([filePath]);
      return { data: null, error };
    }

    return { data: data as unknown as MediaFile, error: null };
  } catch (error) {
    console.error('Error in uploadMediaFile:', error);
    return { data: null, error };
  }
}

/**
 * Update a file's metadata
 */
export async function updateMediaFile(
  fileId: string,
  updates: MediaFileUpdate
): Promise<{ data: MediaFile | null; error: any }> {
  try {
    // Verify user owns the file
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const { data: file, error: fetchError } = await supabase
      .from('media_files')
      .select('user_id')
      .eq('media_file_id', fileId)
      .single();

    if (fetchError || !file || file.user_id !== user.id) {
      return { data: null, error: new Error('Unauthorized') };
    }

    const { data, error } = await supabase
      .from('media_files')
      .update(updates)
      .eq('media_file_id', fileId)
      .select()
      .single();

    if (error) {
      console.error('Error updating file:', error);
      return { data: null, error };
    }

    return { data: data as unknown as MediaFile, error: null };
  } catch (error) {
    console.error('Error in updateMediaFile:', error);
    return { data: null, error };
  }
}

/**
 * Delete a file from database and storage
 */
export async function deleteMediaFile(
  fileId: string
): Promise<{ success: boolean; error: any }> {
  try {
    // Verify user owns the file
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: new Error('Unauthorized') };
    }

    const { data: file, error: fetchError } = await supabase
      .from('media_files')
      .select('user_id, file_url')
      .eq('media_file_id', fileId)
      .single();

    if (fetchError || !file || file.user_id !== user.id) {
      return { success: false, error: new Error('Unauthorized') };
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('media_files')
      .delete()
      .eq('media_file_id', fileId);

    if (dbError) {
      console.error('Error deleting file record:', dbError);
      return { success: false, error: dbError };
    }

    // Delete from storage
    const filePath = file.file_url.split('/').slice(-2).join('/');
    const { error: storageError } = await supabase.storage
      .from('media-files')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
      // File record already deleted, so we continue
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in deleteMediaFile:', error);
    return { success: false, error };
  }
}

/**
 * Move a file to a different folder
 */
export async function moveMediaFile(
  fileId: string,
  newFolderId: string | null
): Promise<{ data: MediaFile | null; error: any }> {
  return updateMediaFile(fileId, { folder_id: newFolderId });
}

/**
 * Move a folder to a different parent folder
 */
export async function moveMediaFolder(
  folderId: string,
  newParentFolderId: string | null
): Promise<{ data: MediaFolder | null; error: any }> {
  return updateMediaFolder(folderId, { parent_folder_id: newParentFolderId });
}
