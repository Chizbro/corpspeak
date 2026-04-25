-- Corpspeak: messages for Supabase Realtime (Option B)
-- All objects live in schema `corpspeak` to isolate from other apps on a shared database.

create schema if not exists corpspeak;

-- PostgREST / Supabase client access (RLS still applies per table)
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

-- Browser uses anon key + Realtime: allow reading rows for room feeds.
-- Inserts are performed only with the service role from the SvelteKit API.
drop policy if exists "Allow anon read messages" on corpspeak.messages;
create policy "Allow anon read messages"
  on corpspeak.messages
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete for anon (service role bypasses RLS for API inserts)

do $$
begin
  begin
    alter publication supabase_realtime add table corpspeak.messages;
  exception
    when duplicate_object then null;
  end;
end
$$;
