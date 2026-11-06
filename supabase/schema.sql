-- Ascent SAT & PSAT Prep: cloud accounts schema for Supabase.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to run again; it drops and recreates the policies.

create table if not exists public.student_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  constraint student_data_size check (pg_column_size(data) < 4000000)
);

alter table public.student_data enable row level security;

-- Each signed-in student can read and change ONLY their own row.
drop policy if exists "student_data select own" on public.student_data;
drop policy if exists "student_data insert own" on public.student_data;
drop policy if exists "student_data update own" on public.student_data;
drop policy if exists "student_data delete own" on public.student_data;

create policy "student_data select own" on public.student_data
  for select to authenticated using (auth.uid() = user_id);
create policy "student_data insert own" on public.student_data
  for insert to authenticated with check (auth.uid() = user_id);
create policy "student_data update own" on public.student_data
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "student_data delete own" on public.student_data
  for delete to authenticated using (auth.uid() = user_id);

-- Lets a signed-in student delete their own account and all of their data (rows cascade).
create or replace function public.delete_my_account()
returns void
language sql
security definer
set search_path = public, auth
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
