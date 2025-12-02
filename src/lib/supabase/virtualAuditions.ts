import { supabase } from './client';
import { getAuthenticatedUser } from './auth';
import type { 
  VirtualAudition, 
  VirtualAuditionInsert, 
  VirtualAuditionUpdate,
  VirtualAuditionMedia,
  VirtualAuditionMediaInsert,
  VirtualAuditionWithDetails,
  MediaFile
} from './types';

export type { VirtualAuditionWithDetails } from './types';

/**
 * Check if user has a virtual audition for this audition
 */
export async function getUserVirtualAudition(
  auditionId: string,
  userId: string
): Promise<{ data: VirtualAudition | null; error: any }> {
  const { data, error } = await supabase
    .from('virtual_auditions')
    .select('*')
    .eq('audition_id', auditionId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user virtual audition:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Check if user can submit a virtual audition (no slot signup exists)
 */
export async function canUserSubmitVirtualAudition(
  auditionId: string,
  userId: string
): Promise<{ canSubmit: boolean; reason?: string }> {
  // Check if user has a slot signup for this audition
  // Need to join through audition_slots since audition_signups doesn't have direct audition_id
  const { data: signupData, error: signupError } = await supabase
    .from('audition_signups')
    .select('signup_id, audition_slots!inner(audition_id)')
    .eq('user_id', userId)
    .eq('audition_slots.audition_id', auditionId)
    .limit(1)
    .maybeSingle();

  if (signupError) {
    console.error('Error checking audition signups:', signupError);
    return { canSubmit: false, reason: 'Error checking signup status' };
  }

  if (signupData) {
    return { canSubmit: false, reason: 'You are already signed up for an audition slot' };
  }

  return { canSubmit: true };
}

/**
 * Get virtual audition with media files
 */
export async function getVirtualAuditionWithMedia(
  virtualAuditionId: string
): Promise<{ data: VirtualAudition & { media_files: MediaFile[] } | null; error: any }> {
  // Get virtual audition
  const { data: audition, error: auditionError } = await supabase
    .from('virtual_auditions')
    .select('*')
    .eq('virtual_audition_id', virtualAuditionId)
    .single();

  if (auditionError) {
    console.error('Error fetching virtual audition:', auditionError);
    return { data: null, error: auditionError };
  }

  // Get media files
  const { data: mediaData, error: mediaError } = await supabase
    .from('virtual_audition_media')
    .select(`
      media_order,
      media_files (*)
    `)
    .eq('virtual_audition_id', virtualAuditionId)
    .order('media_order', { ascending: true });

  if (mediaError) {
    console.error('Error fetching virtual audition media:', mediaError);
    return { data: { ...audition, media_files: [] }, error: null };
  }

  const mediaFiles = mediaData?.map((m: any) => m.media_files).filter(Boolean) || [];

  return { 
    data: { 
      ...audition, 
      media_files: mediaFiles 
    }, 
    error: null 
  };
}

/**
 * Get all virtual auditions for an audition (for production team)
 */
export async function getAuditionVirtualSubmissions(
  auditionId: string
): Promise<{ data: VirtualAuditionWithDetails[]; error: any }> {
  // Get all virtual auditions for this audition
  const { data: auditions, error: auditionsError } = await supabase
    .from('virtual_auditions')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url,
        email
      )
    `)
    .eq('audition_id', auditionId)
    .order('created_at', { ascending: false });

  if (auditionsError) {
    console.error('Error fetching virtual auditions:', auditionsError);
    return { data: [], error: auditionsError };
  }

  if (!auditions || auditions.length === 0) {
    return { data: [], error: null };
  }

  // Get media files for all virtual auditions
  const virtualAuditionIds = auditions.map(va => va.virtual_audition_id);
  
  const { data: mediaData, error: mediaError } = await supabase
    .from('virtual_audition_media')
    .select(`
      virtual_audition_id,
      media_order,
      media_files (*)
    `)
    .in('virtual_audition_id', virtualAuditionIds)
    .order('media_order', { ascending: true });

  if (mediaError) {
    console.error('Error fetching virtual audition media:', mediaError);
  }

  // Combine data
  const result: VirtualAuditionWithDetails[] = auditions.map(audition => {
    const media = mediaData
      ?.filter((m: any) => m.virtual_audition_id === audition.virtual_audition_id)
      .map((m: any) => m.media_files)
      .filter(Boolean) || [];

    return {
      ...audition,
      media_files: media
    };
  });

  return { data: result, error: null };
}

/**
 * Create or update a virtual audition submission
 */
export async function upsertVirtualAudition(
  auditionId: string,
  userId: string,
  submissionNotes: string | null,
  mediaFileIds: string[]
): Promise<{ data: VirtualAudition | null; error: any }> {
  // Verify user can submit
  const { canSubmit, reason } = await canUserSubmitVirtualAudition(auditionId, userId);
  
  if (!canSubmit) {
    return { 
      data: null, 
      error: new Error(reason || 'Cannot submit virtual audition') 
    };
  }

  // Check if virtual audition already exists
  const { data: existing } = await getUserVirtualAudition(auditionId, userId);

  let virtualAudition: VirtualAudition;

  if (existing) {
    // Update existing
    const { data: updated, error: updateError } = await supabase
      .from('virtual_auditions')
      .update({ submission_notes: submissionNotes })
      .eq('virtual_audition_id', existing.virtual_audition_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating virtual audition:', updateError);
      return { data: null, error: updateError };
    }

    virtualAudition = updated;

    // Delete existing media links
    await supabase
      .from('virtual_audition_media')
      .delete()
      .eq('virtual_audition_id', existing.virtual_audition_id);
  } else {
    // Create new
    const { data: created, error: createError } = await supabase
      .from('virtual_auditions')
      .insert({
        audition_id: auditionId,
        user_id: userId,
        submission_notes: submissionNotes
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating virtual audition:', createError);
      return { data: null, error: createError };
    }

    virtualAudition = created;
  }

  // Add media links
  if (mediaFileIds.length > 0) {
    const mediaInserts: VirtualAuditionMediaInsert[] = mediaFileIds.map((fileId, index) => ({
      virtual_audition_id: virtualAudition.virtual_audition_id,
      media_file_id: fileId,
      media_order: index
    }));

    const { error: mediaError } = await supabase
      .from('virtual_audition_media')
      .insert(mediaInserts);

    if (mediaError) {
      console.error('Error adding virtual audition media:', mediaError);
      // Don't fail the whole operation if media linking fails
    }
  }

  return { data: virtualAudition, error: null };
}

/**
 * Delete a virtual audition submission
 */
export async function deleteVirtualAudition(
  virtualAuditionId: string,
  userId: string
): Promise<{ success: boolean; error: any }> {
  // Verify ownership
  const { data: audition, error: fetchError } = await supabase
    .from('virtual_auditions')
    .select('user_id')
    .eq('virtual_audition_id', virtualAuditionId)
    .single();

  if (fetchError || !audition) {
    console.error('Error fetching virtual audition:', fetchError);
    return { success: false, error: fetchError };
  }

  if (audition.user_id !== userId) {
    return { 
      success: false, 
      error: new Error('Unauthorized: Cannot delete another user\'s virtual audition') 
    };
  }

  // Delete (media will cascade)
  const { error: deleteError } = await supabase
    .from('virtual_auditions')
    .delete()
    .eq('virtual_audition_id', virtualAuditionId);

  if (deleteError) {
    console.error('Error deleting virtual audition:', deleteError);
    return { success: false, error: deleteError };
  }

  return { success: true, error: null };
}

/**
 * Get user's video media files for virtual audition selection
 */
export async function getUserVideoFiles(
  userId: string
): Promise<{ data: MediaFile[]; error: any }> {
  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', userId)
    .ilike('file_type', 'video%')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user video files:', error);
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

/**
 * Get all auditionees for an audition (both slot signups and virtual submissions)
 * Returns a combined array with a consistent structure
 */
export async function getAllAuditionees(auditionId: string): Promise<any[]> {
  try {
    // Get slot signups
    const { data: signups, error: signupsError } = await supabase
      .from('audition_signups')
      .select(`
        signup_id,
        user_id,
        slot_id,
        created_at,
        profiles!audition_signups_user_id_fkey (
          id,
          first_name,
          last_name,
          email,
          profile_photo_url
        ),
        audition_slots!inner (
          audition_id
        )
      `)
      .eq('audition_slots.audition_id', auditionId);

    if (signupsError) {
      console.error('Error fetching audition signups:', signupsError);
    }

    // Get virtual auditions
    const { data: virtualAuditions, error: virtualError } = await getAuditionVirtualSubmissions(auditionId);

    if (virtualError) {
      console.error('Error fetching virtual auditions:', virtualError);
    }

    // Combine and normalize the data
    const slotAuditionees = (signups || []).map((signup: any) => ({
      user_id: signup.user_id,
      signup_id: signup.signup_id,
      type: 'slot' as const,
      created_at: signup.created_at,
      profiles: signup.profiles,
      full_name: signup.profiles?.first_name && signup.profiles?.last_name
        ? `${signup.profiles.first_name} ${signup.profiles.last_name}`
        : null,
      email: signup.profiles?.email || '',
      profile_photo_url: signup.profiles?.profile_photo_url || null,
    }));

    const virtualAuditionees = (virtualAuditions || []).map((va: any) => ({
      user_id: va.user_id,
      virtual_audition_id: va.virtual_audition_id,
      type: 'virtual' as const,
      created_at: va.created_at,
      profiles: va.profiles,
      full_name: va.profiles?.first_name && va.profiles?.last_name
        ? `${va.profiles.first_name} ${va.profiles.last_name}`
        : null,
      email: va.profiles?.email || '',
      profile_photo_url: va.profiles?.profile_photo_url || null,
      submission_notes: va.submission_notes,
      media_files: va.media_files,
    }));

    // Combine both arrays and remove duplicates (same user)
    const allAuditionees = [...slotAuditionees, ...virtualAuditionees];
    
    // Deduplicate by user_id (keep the first occurrence)
    const uniqueAuditionees = allAuditionees.filter(
      (auditionee, index, self) =>
        index === self.findIndex((a) => a.user_id === auditionee.user_id)
    );

    return uniqueAuditionees;
  } catch (error) {
    console.error('Error fetching all auditionees:', error);
    return [];
  }
}
