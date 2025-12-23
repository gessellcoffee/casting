import { supabase } from './client';
import { getAuthenticatedUser } from './auth';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return { url: null, error };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, error: null };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: any }> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  // Verify the authenticated user matches the userId
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { url: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only upload to their own folder
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only upload files to your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { url: null, error: unauthorizedError };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `profile-photo-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/profile-photos/${fileName}`;

  return uploadFile('profiles', filePath, file);
}

export async function uploadPdfBrandingLogo(
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { url: null, error: authError || new Error('Not authenticated') };
  }

  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only upload files to your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { url: null, error: unauthorizedError };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `pdf-branding-logo-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/pdf-branding/${fileName}`;

  return uploadFile('profiles', filePath, file);
}

/**
 * Upload resume document
 */
export async function uploadResume(
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  // Verify the authenticated user matches the userId
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { url: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only upload to their own folder
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only upload files to your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { url: null, error: unauthorizedError };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `resume-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/resumes/${fileName}`;

  return uploadFile('profiles', filePath, file);
}

/**
 * Upload image to gallery
 */
export async function uploadGalleryImage(
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  // Verify the authenticated user matches the userId
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { url: null, error: authError || new Error('Not authenticated') };
  }

  // Authorization check: user can only upload to their own folder
  if (user.id !== userId) {
    const unauthorizedError = new Error('Unauthorized: You can only upload files to your own profile');
    console.error('Authorization failed:', { authenticatedUserId: user.id, requestedUserId: userId });
    return { url: null, error: unauthorizedError };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `gallery-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/gallery/${fileName}`;

  return uploadFile('profiles', filePath, file);
}

/**
 * Upload audition media (images or videos)
 * Authorization: Only production team members and audition owners can upload
 */
export async function uploadAuditionMedia(
  auditionId: string,
  signupId: string,
  file: File
): Promise<{ url: string | null; path: string | null; error: any }> {
  // Get authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { url: null, path: null, error: authError || new Error('Not authenticated') };
  }

  // Create unique file path
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = `${signupId}-${timestamp}.${fileExt}`;
  const filePath = `auditions/${auditionId}/signups/${signupId}/${fileName}`;

  // Upload to audition-media bucket
  const { data, error } = await supabase.storage
    .from('audition-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Error uploading audition media:', error);
    return { url: null, path: null, error };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('audition-media')
    .getPublicUrl(data.path);

  return { url: urlData.publicUrl, path: data.path, error: null };
}

/**
 * Delete audition media file
 */
export async function deleteAuditionMedia(
  filePath: string
): Promise<{ error: any }> {
  // Get authenticated user
  const { user, error: authError } = await getAuthenticatedUser();
  
  if (authError || !user) {
    console.error('Error getting authenticated user:', authError);
    return { error: authError || new Error('Not authenticated') };
  }

  const { error } = await supabase.storage
    .from('audition-media')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting audition media:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get file URL from path
 */
export function getFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
