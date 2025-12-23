create or replace function bulk_assign_agenda_items(p_agenda_item_id uuid, p_user_ids uuid[])
returns void as $$
begin
  insert into public.agenda_assignments (agenda_item_id, user_id, status)
  select p_agenda_item_id, user_id, 'assigned'
  from unnest(p_user_ids) as t(user_id)
  on conflict (agenda_item_id, user_id) do nothing;
end;
$$ language plpgsql security definer;
