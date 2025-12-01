import { supabase } from './client';

export interface SignupNote {
  signup_note_id: string;
  signup_id: string;
  author_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface SignupNoteWithAuthor extends SignupNote {
  author: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    profile_photo_url: string | null;
  };
}

/**
 * Get all notes for a signup
 */
export async function getSignupNotes(signupId: string): Promise<SignupNoteWithAuthor[]> {
  const { data, error } = await supabase
    .from('signup_notes')
    .select(`
      *,
      author:profiles!author_id (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      )
    `)
    .eq('signup_id', signupId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching signup notes:', error);
    return [];
  }

  return data as SignupNoteWithAuthor[] || [];
}

/**
 * Create a new note for a signup
 */
export async function createSignupNote(
  signupId: string,
  noteText: string,
  authorId: string
): Promise<{ data: SignupNote | null; error: any }> {
  const { data, error } = await supabase
    .from('signup_notes')
    .insert({
      signup_id: signupId,
      author_id: authorId,
      note_text: noteText,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating signup note:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an existing note
 */
export async function updateSignupNote(
  noteId: string,
  noteText: string
): Promise<{ data: SignupNote | null; error: any }> {
  const { data, error } = await supabase
    .from('signup_notes')
    .update({
      note_text: noteText,
    })
    .eq('signup_note_id', noteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating signup note:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete a note
 */
export async function deleteSignupNote(noteId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('signup_notes')
    .delete()
    .eq('signup_note_id', noteId);

  if (error) {
    console.error('Error deleting signup note:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Get notes for multiple signups (for live audition manager)
 */
export async function getNotesForSignups(signupIds: string[]): Promise<SignupNoteWithAuthor[]> {
  if (signupIds.length === 0) return [];

  const { data, error } = await supabase
    .from('signup_notes')
    .select(`
      *,
      author:profiles!author_id (
        id,
        first_name,
        last_name,
        email,
        profile_photo_url
      )
    `)
    .in('signup_id', signupIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching notes for signups:', error);
    return [];
  }

  return data as SignupNoteWithAuthor[] || [];
}
