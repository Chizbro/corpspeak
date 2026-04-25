/**
 * Idempotent DDL for the corpspeak schema, matching supabase/migrations.
 * Executed at runtime when SUPABASE_DB_URL is set (see ensureCorpspeakSchema.ts).
 */
export const CORPSPEAK_BOOTSTRAP_SQL = `
create schema if not exists corpspeak;

grant usage on schema corpspeak to postgres, anon, authenticated, service_role;

create table if not exists corpspeak.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'general',
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

alter table corpspeak.messages owner to postgres;

grant select, insert, update, delete on table corpspeak.messages to postgres, service_role;
grant select on table corpspeak.messages to anon, authenticated;

alter default privileges in schema corpspeak grant all on tables to postgres;
alter default privileges in schema corpspeak grant all on tables to service_role;
alter default privileges in schema corpspeak grant select on tables to anon, authenticated;

create index if not exists messages_room_created_idx on corpspeak.messages (room_id, created_at desc);

alter table corpspeak.messages enable row level security;

drop policy if exists "Allow anon read messages" on corpspeak.messages;
create policy "Allow anon read messages"
  on corpspeak.messages
  for select
  to anon, authenticated
  using (true);

do $$
begin
  begin
    alter publication supabase_realtime add table corpspeak.messages;
  exception
    when duplicate_object then null;
  end;
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

-- Ask PostgREST to reload the schema cache (no-op on platforms that ignore it).
select pg_notify('pgrst', 'reload schema');
`;
