-- Retention: keep the N newest messages (global cap across all rooms).

create or replace function public.prune_messages_to_limit(p_keep integer default 100)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if p_keep is null or p_keep < 1 then
    raise exception 'p_keep must be at least 1';
  end if;

  with keepers as (
    select id
    from public.messages
    order by created_at desc, id desc
    limit p_keep
  )
  delete from public.messages m
  where not exists (select 1 from keepers k where k.id = m.id);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.prune_messages_to_limit(integer) is
  'Deletes older rows so at most p_keep messages remain (newest by created_at). Call via service_role (e.g. Netlify scheduled function).';

revoke all on function public.prune_messages_to_limit(integer) from public;
grant execute on function public.prune_messages_to_limit(integer) to service_role;
