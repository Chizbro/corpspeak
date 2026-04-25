-- Corpspeak: messages for Supabase Realtime (Option B)
-- Run in Supabase SQL editor or via `supabase db push` if using CLI.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'general',
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_room_created_idx on public.messages (room_id, created_at desc);

alter table public.messages enable row level security;

-- Browser uses anon key + Realtime: allow reading rows for room feeds.
-- Inserts are performed only with the service role from the SvelteKit API.
create policy "Allow anon read messages"
  on public.messages
  for select
  to anon, authenticated
  using (true);

-- No insert/update/delete for anon (service role bypasses RLS for API inserts)

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
  end;
end
$$;
