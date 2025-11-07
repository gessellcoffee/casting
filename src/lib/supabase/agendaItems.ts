/**
 * Agenda Items API
 * Handles CRUD operations for rehearsal agenda items and assignments
 */

import { supabase } from '@/lib/supabase/client';

/**
 * Get all agenda items for a rehearsal event
 */
export async function getAgendaItems(rehearsalEventId: string) {
  // First get the agenda items
  const { data: items, error: itemsError } = await supabase
    .from('rehearsal_agenda_items')
    .select('*')
    .eq('rehearsal_event_id', rehearsalEventId)
    .order('start_time', { ascending: true });

  if (itemsError) {
    console.error('Error fetching agenda items:', itemsError);
    return { data: null, error: itemsError };
  }

  if (!items || items.length === 0) {
    return { data: [], error: null };
  }

  // Then get assignments for each item
  const itemIds = items.map(item => item.rehearsal_agenda_items_id);
  
  const { data: assignments, error: assignmentsError } = await supabase
    .from('agenda_assignments')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      )
    `)
    .in('agenda_item_id', itemIds);

  if (assignmentsError) {
    console.error('Error fetching assignments:', assignmentsError);
    // Return items without assignments rather than failing completely
    return { data: items.map(item => ({ ...item, agenda_assignments: [] })), error: null };
  }

  // Combine items with their assignments
  const itemsWithAssignments = items.map(item => ({
    ...item,
    agenda_assignments: assignments?.filter(a => a.agenda_item_id === item.rehearsal_agenda_items_id) || []
  }));

  return { data: itemsWithAssignments, error: null };
}

/**
 * Create a new agenda item
 */
export async function createAgendaItem(item: {
  rehearsal_event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}) {
  const insertData: any = {
    rehearsal_event_id: item.rehearsal_event_id,
    title: item.title,
    start_time: item.start_time,
    end_time: item.end_time,
  };
  
  // Only add optional fields if they have values
  if (item.description) {
    insertData.description = item.description;
  }

  const { data, error } = await supabase
    .from('rehearsal_agenda_items')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Error creating agenda item:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Update an agenda item
 */
export async function updateAgendaItem(
  itemId: string,
  updates: {
    title?: string;
    description?: string;
    start_time?: string;
    end_time?: string;
  }
) {
  // Build update object, only including fields that are provided
  const updateData: any = {
    updated_at: new Date().toISOString()
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.start_time !== undefined) {
    updateData.start_time = updates.start_time;
  }
  if (updates.end_time !== undefined) {
    updateData.end_time = updates.end_time;
  }

  const { data, error } = await supabase
    .from('rehearsal_agenda_items')
    .update(updateData)
    .eq('rehearsal_agenda_items_id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agenda item:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Delete an agenda item
 */
export async function deleteAgendaItem(itemId: string) {
  const { error } = await supabase
    .from('rehearsal_agenda_items')
    .delete()
    .eq('rehearsal_agenda_items_id', itemId);

  if (error) {
    console.error('Error deleting agenda item:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Reorder agenda items by updating their start/end times
 */
export async function reorderAgendaItems(items: { id: string; start_time: string; end_time: string }[]) {
  const promises = items.map(item =>
    supabase
      .from('rehearsal_agenda_items')
      .update({ start_time: item.start_time, end_time: item.end_time })
      .eq('rehearsal_agenda_items_id', item.id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Error reordering agenda items:', errors);
    return { error: errors[0].error };
  }

  return { error: null };
}

/**
 * Assign multiple cast members to an agenda item
 */
export async function assignMultipleCastMembers(agenda_item_id: string, user_ids: string[]) {
  const { data, error } = await supabase.rpc('bulk_assign_agenda_items', {
    p_agenda_item_id: agenda_item_id,
    p_user_ids: user_ids,
  });

  if (error) {
    console.error('Error assigning multiple cast members:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Assign a cast member to an agenda item
 */
export async function assignCastMember(assignment: {
  agenda_item_id: string;
  user_id: string;
}) {
  const { data, error } = await supabase
    .from('agenda_assignments')
    .insert(assignment)
    .select()
    .single();

  if (error) {
    console.error('Error assigning cast member:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Remove a cast member assignment
 */
export async function removeAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('agenda_assignments')
    .delete()
    .eq('agenda_assignments_id', assignmentId);

  if (error) {
    console.error('Error removing assignment:', error);
    return { error };
  }

  return { error: null };
}

/**
 * Update assignment status (for cast members to accept/decline/report conflict)
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  status: 'pending' | 'accepted' | 'declined' | 'conflict'
) {
  const { data, error } = await supabase
    .from('agenda_assignments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('agenda_assignments_id', assignmentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating assignment status:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Get cast members for an audition (for assignment dropdown)
 */
export async function getCastMembers(auditionId: string) {
  const { data, error } = await supabase
    .from('cast_members')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        profile_photo_url
      ),
      audition_roles ( role_name ),
      roles ( role_name )
    `)
    .eq('audition_id', auditionId)
    .eq('status', 'Accepted')
    .order('profiles(last_name)', { ascending: true });

  if (error) {
    console.error('Error fetching cast members:', error);
    return { data: null, error };
  }

  return { data, error: null };
}
