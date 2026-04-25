-- One-time: databases that already ran the pre-isolation migrations stored objects in
-- `public`. Move them into `corpspeak` and repoint Realtime. No-op on fresh installs.

do $$
begin
  if to_regclass('public.messages') is null then
    return;
  end if;
  if to_regclass('corpspeak.messages') is not null then
    raise notice 'corpspeak.messages already exists; leaving public.messages unchanged (resolve duplicates manually if needed)';
    return;
  end if;

  create schema if not exists corpspeak;
  grant usage on schema corpspeak to postgres, anon, authenticated, service_role;

  begin
    alter publication supabase_realtime drop table public.messages;
  exception
    when undefined_object then null;
    when undefined_table then null;
  end;

  alter table public.messages set schema corpspeak;

  alter table corpspeak.messages owner to postgres;
  grant select, insert, update, delete on table corpspeak.messages to postgres, service_role;
  grant select on table corpspeak.messages to anon, authenticated;

  begin
    alter publication supabase_realtime add table corpspeak.messages;
  exception
    when duplicate_object then null;
  end;
end
$$;

-- If an old DB still has the RPC on public, remove it; corpspeak version is the source of truth below.
do $$
begin
  if to_regproc('public.prune_messages_to_limit(integer)') is not null then
    drop function public.prune_messages_to_limit(integer);
  end if;
end
$$;

create or replace function corpspeak.prune_messages_to_limit(p_keep integer default 100)
returns integer
language plpgsql
security definer
set search_path = corpspeak, pg_temp
as $$
declare
  deleted_count integer;
begin
  if p_keep is null or p_keep < 1 then
    raise exception 'p_keep must be at least 1';
  end if;

  with keepers as (
    select id
    from corpspeak.messages
    order by created_at desc, id desc
    limit p_keep
  )
  delete from corpspeak.messages m
  where not exists (select 1 from keepers k where k.id = m.id);

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function corpspeak.prune_messages_to_limit(integer) is
  'Deletes older rows so at most p_keep messages remain (newest by created_at). Call via service_role (e.g. Netlify scheduled function).';

alter function corpspeak.prune_messages_to_limit(integer) owner to postgres;

revoke all on function corpspeak.prune_messages_to_limit(integer) from public;
grant execute on function corpspeak.prune_messages_to_limit(integer) to service_role;
