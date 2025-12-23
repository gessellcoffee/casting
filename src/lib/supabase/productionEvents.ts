import { supabase } from '@/lib/supabase/client';

export type ProductionEventTypeRow = {
  production_event_type_id: string;
  owner_user_id: string | null;
  name: string;
  color: string;
  created_at: string;
};

export type ProductionEventRow = {
  production_event_id: string;
  audition_id: string;
  production_event_type_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductionEventAssignmentRow = {
  production_event_assignment_id: string;
  production_event_id: string;
  user_id: string;
  created_at: string;
};

export async function getProductionEventTypes(): Promise<ProductionEventTypeRow[]> {
  const { data, error } = await supabase
    .from('production_event_types')
    .select('*')
    .order('owner_user_id', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching production event types:', error);
    return [];
  }

  return data || [];
}

export async function createProductionEventType(input: {
  name: string;
  color: string;
}): Promise<{ data: ProductionEventTypeRow | null; error: any }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('production_event_types')
    .insert({
      owner_user_id: authData.user.id,
      name: input.name,
      color: input.color,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating production event type:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function createProductionEvents(input: {
  audition_id: string;
  production_event_type_id: string;
  dates: string[];
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  notes?: string | null;
}): Promise<{ data: ProductionEventRow[] | null; error: any }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const rows = input.dates.map(date => ({
    audition_id: input.audition_id,
    production_event_type_id: input.production_event_type_id,
    date,
    start_time: input.start_time || null,
    end_time: input.end_time || null,
    location: input.location || null,
    notes: input.notes || null,
    created_by: authData.user.id,
  }));

  const { data, error } = await supabase
    .from('production_events')
    .insert(rows)
    .select('*');

  if (error) {
    console.error('Error creating production events:', error);
    return { data: null, error };
  }

  return { data: (data as any) || [], error: null };
}

export async function getProductionEvents(auditionId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('production_events')
    .select(`
      *,
      production_event_types (*),
      production_event_assignments (
        production_event_assignment_id,
        user_id,
        profiles (
          id,
          first_name,
          last_name,
          profile_photo_url
        )
      )
    `)
    .eq('audition_id', auditionId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching production events:', error);
    return [];
  }

  return data || [];
}

export async function createProductionEvent(input: {
  audition_id: string;
  production_event_type_id: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  notes?: string | null;
}): Promise<{ data: ProductionEventRow | null; error: any }> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { data: null, error: authError || new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('production_events')
    .insert({
      audition_id: input.audition_id,
      production_event_type_id: input.production_event_type_id,
      date: input.date,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      location: input.location || null,
      notes: input.notes || null,
      created_by: authData.user.id,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating production event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function updateProductionEvent(
  productionEventId: string,
  updates: {
    production_event_type_id?: string;
    date?: string;
    start_time?: string | null;
    end_time?: string | null;
    location?: string | null;
    notes?: string | null;
  }
): Promise<{ data: ProductionEventRow | null; error: any }> {
  const { data, error } = await supabase
    .from('production_events')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('production_event_id', productionEventId)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating production event:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function deleteProductionEvent(productionEventId: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from('production_events')
    .delete()
    .eq('production_event_id', productionEventId);

  if (error) {
    console.error('Error deleting production event:', error);
    return { error };
  }

  return { error: null };
}

export async function setProductionEventAssignments(
  productionEventId: string,
  userIds: string[]
): Promise<{ error: any }> {
  const { error: deleteError } = await supabase
    .from('production_event_assignments')
    .delete()
    .eq('production_event_id', productionEventId);

  if (deleteError) {
    console.error('Error clearing production event assignments:', deleteError);
    return { error: deleteError };
  }

  if (userIds.length === 0) {
    return { error: null };
  }

  // Remove duplicates and filter out null/undefined values
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return { error: null };
  }

  const { error: insertError } = await supabase
    .from('production_event_assignments')
    .insert(uniqueUserIds.map(user_id => ({ production_event_id: productionEventId, user_id })));

  if (insertError) {
    console.error('Error creating production event assignments:', insertError);
    return { error: insertError };
  }

  return { error: null };
}
