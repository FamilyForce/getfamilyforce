-- ═══════════════════════════════════════════════════════════════
-- FamilyForce — Family Feature Schema
-- Paste into Supabase → SQL Editor → New Query → Run
-- Run AFTER supabase-schema.sql
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. ADD FAMILY COLUMNS TO PROFILES
-- ───────────────────────────────────────────────────────────────
alter table profiles
  add column if not exists circle_code   text unique,
  add column if not exists circle_name   text,
  add column if not exists children_json text;  -- Development Advisor: stores child DOB/name as JSON


-- ───────────────────────────────────────────────────────────────
-- 2. CIRCLE CODE GENERATOR
--    Produces codes like FF-A3K9. Retries on collision.
-- ───────────────────────────────────────────────────────────────
create or replace function generate_unique_circle_code()
returns text language plpgsql as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  text;
  taken boolean;
begin
  loop
    code := 'FF-';
    for i in 1..4 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    select exists(select 1 from profiles where circle_code = code) into taken;
    exit when not taken;
  end loop;
  return code;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- 3. AUTO-ASSIGN CIRCLE CODE ON SIGNUP
--    Updates the existing handle_new_user trigger.
-- ───────────────────────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, circle_code)
  values (new.id, generate_unique_circle_code())
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- 4. BACKFILL EXISTING USERS — assign codes to anyone who has none
-- ───────────────────────────────────────────────────────────────
do $$
declare
  rec record;
begin
  for rec in select id from profiles where circle_code is null loop
    update profiles
    set circle_code = generate_unique_circle_code()
    where id = rec.id;
  end loop;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- 5. FAMILY_MEMBERS TABLE
--    Tracks who has joined whose family.
--    owner_user_id = the person whose code was entered
--    member_user_id = the person who entered the code
-- ───────────────────────────────────────────────────────────────
create table if not exists family_members (
  id              uuid default gen_random_uuid() primary key,
  owner_user_id   uuid references auth.users(id) on delete cascade not null,
  member_user_id  uuid references auth.users(id) on delete cascade not null,
  joined_at       timestamptz default now(),
  unique (owner_user_id, member_user_id)
);

alter table family_members enable row level security;

-- Owner: full control over their family
create policy "Owner manages family"
  on family_members for all
  using  (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

-- Members: can join (insert own row), see families they're in, leave (delete own row)
create policy "Member can join a family"
  on family_members for insert
  with check (auth.uid() = member_user_id);

create policy "Member can view memberships"
  on family_members for select
  using (auth.uid() = member_user_id);

create policy "Member can leave family"
  on family_members for delete
  using (auth.uid() = member_user_id);


-- ───────────────────────────────────────────────────────────────
-- 6. OPEN UP PROFILES + USER_PROGRESS FOR FAMILY READS
--    Family members need to read each other's names + certs.
--    Circle code and name are intentionally public identifiers.
-- ───────────────────────────────────────────────────────────────
create policy "Authenticated users can read any profile"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can read progress"
  on user_progress for select
  using (auth.role() = 'authenticated');


-- ───────────────────────────────────────────────────────────────
-- 7. SAFE LOOKUP FUNCTION — find family owner by circle code
--    SECURITY DEFINER so it bypasses RLS safely.
--    Only returns id + name (never email or sensitive data).
-- ───────────────────────────────────────────────────────────────
create or replace function lookup_family_by_code(code text)
returns table(owner_id uuid, owner_name text, family_name text)
language plpgsql security definer as $$
begin
  return query
  select p.id, p.name, p.circle_name
  from profiles p
  where upper(p.circle_code) = upper(code)
    and p.id != auth.uid()  -- can't join your own family
  limit 1;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- Verification
-- ───────────────────────────────────────────────────────────────
-- select id, circle_code, circle_name from profiles limit 5;
-- select * from family_members limit 5;
