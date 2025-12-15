import { supabase } from '@/lib/supabase/client';

export async function getUserAssignedProductionEvents(userId: string) {
  const { data, error } = await supabase
    .from('production_event_assignments')
    .select(`
      production_event_id,
      production_events (
        *,
        production_event_types (*),
        auditions (
          audition_id,
          shows (*),
          companies (name)
        )
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user assigned production events:', error);
    return [];
  }

  return (data || [])
    .map((row: any) => row.production_events)
    .filter(Boolean);
}

export async function getProductionEventsByAuditionIds(auditionIds: string[]) {
  if (auditionIds.length === 0) return [];

  const { data, error } = await supabase
    .from('production_events')
    .select(`
      *,
      production_event_types (*),
      production_event_assignments (user_id),
      auditions (
        audition_id,
        shows (*),
        companies (name)
      )
    `)
    .in('audition_id', auditionIds)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching production events by audition IDs:', error);
    return [];
  }

  return data || [];
}
