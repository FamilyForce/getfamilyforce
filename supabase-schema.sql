-- ═══════════════════════════════════════════════════════════════
-- FamilyForce — Supabase Schema
-- Paste this into Supabase → SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. PROFILES
--    One row per user. Extends auth.users.
--    Stores display name + onboarded flag.
-- ───────────────────────────────────────────────────────────────
create table if not exists profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  name          text,
  onboarded_at  timestamptz,
  created_at    timestamptz default now()
);

-- Row-Level Security: users can only read/write their own row
alter table profiles enable row level security;

create policy "Users can manage own profile"
  on profiles
  for all
  using  ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Automatically create a profile row on new user sign-up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ───────────────────────────────────────────────────────────────
-- 2. USER_PROGRESS
--    One row per (user, course). Tracks cert, chapter count, and
--    full course state JSON for cross-device resume.
--
--    course_key values match the keys in ff_progress localStorage:
--      'screen-time' | 'sleep-training' | 'tantrum' | 'feeding' | 'potty-training'
-- ───────────────────────────────────────────────────────────────
create table if not exists user_progress (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users(id) on delete cascade not null,
  course_key          text not null,
  chapters_completed  integer default 0,
  cert_earned         boolean default false,
  cert_earned_at      timestamptz,
  state_json          jsonb,          -- full course STATE for cross-device resume
  updated_at          timestamptz default now(),
  created_at          timestamptz default now(),

  unique (user_id, course_key)
);

-- Automatically update updated_at on every write
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_progress_updated_at on user_progress;
create trigger set_user_progress_updated_at
  before update on user_progress
  for each row execute function set_updated_at();

-- Row-Level Security
alter table user_progress enable row level security;

create policy "Users can manage own progress"
  on user_progress
  for all
  using  ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- ───────────────────────────────────────────────────────────────
-- Verification: run these selects to confirm tables exist
-- ───────────────────────────────────────────────────────────────
-- select * from profiles limit 5;
-- select * from user_progress limit 5;
