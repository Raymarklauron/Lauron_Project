-- Time records are private to the signed-in account that owns each row.

create table public.time_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint time_records_valid_range
    check (ended_at is null or ended_at >= started_at)
);

create index time_records_user_started_at_idx
  on public.time_records (user_id, started_at desc);

create unique index time_records_one_active_session_per_user_idx
  on public.time_records (user_id)
  where ended_at is null;

alter table public.time_records enable row level security;

revoke all on public.time_records from anon, authenticated;
grant select, insert, update on public.time_records to authenticated;

create policy "Owners can read their time records"
  on public.time_records
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can create their time records"
  on public.time_records
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Owners can update their time records"
  on public.time_records
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
