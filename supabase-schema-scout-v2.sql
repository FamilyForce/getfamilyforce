-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Schema v2
-- Run AFTER supabase-schema.sql, supabase-schema-family.sql,
--   and supabase-schema-scout.sql
--
-- What this adds:
--   1. Migration: expand children.gender constraint
--   2. milestone_windows table
--   3. scout_digest_log table
--   4. window_progress table (active track)
--   5. scout_events table (analytics)
--   6. Helper functions: get_child_pronoun, get_windows_for_age
--   7. Performance indexes
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. MIGRATION — expand children.gender constraint
--    Adds 'other' → they/them pronouns
--    Existing rows with null or 'girl'/'boy' are unaffected
-- ───────────────────────────────────────────────────────────────
alter table children
  drop constraint if exists children_gender_check;

alter table children
  add constraint children_gender_check
  check (gender in ('girl', 'boy', 'other', null));

-- Note on status values in scout_subscriptions (already correct):
--   'trialing'  → free trial, access while trial_end > now()
--   'active'    → paid, access while period_end > now()
--   'cancelled' → cancelled, access until period_end
--   'expired'   → past period_end, no access
--   'past_due'  → payment failed
-- Do NOT rename 'trialing' to 'free_trial' — existing edge functions use 'trialing'.


-- ───────────────────────────────────────────────────────────────
-- 2. MILESTONE WINDOWS TABLE
--    One row per developmental window.
--    Edited via Supabase table editor (v1) or /admin/milestones (v1.1).
--    Queried by edge functions to build monthly digests.
-- ───────────────────────────────────────────────────────────────
create table if not exists milestone_windows (
  id                uuid    default gen_random_uuid() primary key,
  slug              text    not null unique,  -- e.g. 'nutrition-peanut-intro' — stable external ID
  title             text    not null,
  category          text    not null
                    check (category in (
                      'nutrition', 'motor', 'language', 'cognitive',
                      'social', 'screening', 'safety', 'prebirth'
                    )),
  urgency           text    not null
                    check (urgency in ('advisory', 'screening', 'clinical')),
  open_age_weeks    integer not null,   -- negative for prenatal (e.g. -6 = 34 weeks gestation)
  peak_age_weeks    integer,            -- null = no distinct peak
  close_age_weeks   integer not null,
  priority          integer not null default 3
                    check (priority between 1 and 5),
                    -- 1 = highest (above fold in email) — 5 = lowest (dashboard only)
  why_it_matters    text    not null,
  what_to_do        text    not null,
  what_not_to_worry text,
  missed_window     text,               -- guidance when window has closed
  source_citation   text,
  playbook_link     text,               -- e.g. 'getfamilyforce.com/playbook-sleep'
  prenatal          boolean not null default false,
  active            boolean not null default true,  -- soft delete — never hard delete
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- updated_at trigger (reuses set_updated_at from supabase-schema.sql)
drop trigger if exists set_milestone_windows_updated_at on milestone_windows;
create trigger set_milestone_windows_updated_at
  before update on milestone_windows
  for each row execute function set_updated_at();

-- RLS: milestone_windows is read-only for all authenticated users
-- Only service role can insert/update (via import script or admin editor)
alter table milestone_windows enable row level security;

drop policy if exists "Authenticated users can read milestone windows" on milestone_windows;
create policy "Authenticated users can read milestone windows"
  on milestone_windows for select
  using (auth.role() = 'authenticated');

drop policy if exists "Service role manages milestone windows" on milestone_windows;
create policy "Service role manages milestone windows"
  on milestone_windows for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Performance indexes — primary query pattern:
--   WHERE active = true AND open_age_weeks <= $age AND close_age_weeks >= $age
--   ORDER BY priority ASC
create index if not exists idx_milestone_windows_age_active
  on milestone_windows (active, open_age_weeks, close_age_weeks);

create index if not exists idx_milestone_windows_priority
  on milestone_windows (priority);

create index if not exists idx_milestone_windows_category
  on milestone_windows (category);

create index if not exists idx_milestone_windows_slug
  on milestone_windows (slug);


-- ───────────────────────────────────────────────────────────────
-- 3. SCOUT DIGEST LOG TABLE
--    One row per digest email sent.
--    Used for: deduplication, debugging, delivery tracking.
--    Retention: keep forever (analytics baseline).
-- ───────────────────────────────────────────────────────────────
create table if not exists scout_digest_log (
  id                uuid    default gen_random_uuid() primary key,
  user_id           uuid    references auth.users(id) on delete cascade not null,
  child_id          uuid    references children(id) on delete cascade not null,
  digest_month      text    not null,   -- 'YYYY-MM' — the calendar month of the digest
  child_age_months  integer not null,   -- child's age in months at send time
  digest_type       text    not null
                    check (digest_type in (
                      'signup',            -- first digest on account creation
                      'monthly',           -- regular monthly digest
                      'trial_end',         -- trial expiry email
                      'alert',             -- 7-day closing window alert
                      'reengagement',      -- 30-day post-trial lapse email
                      'prebirth_reminder'  -- monthly reminder for expecting parents
                    )),
  windows_included  jsonb,             -- [{id, slug, title, urgency, priority}]
  email_subject     text,
  resend_message_id text,              -- Resend message ID for delivery tracking
  sent_at           timestamptz default now(),

  -- Deduplication: one digest per type per child per month
  unique (child_id, digest_type, digest_month)
);

alter table scout_digest_log enable row level security;

-- Users can read their own digest log (useful for debugging and history screen)
drop policy if exists "Users can read own digest log" on scout_digest_log;
create policy "Users can read own digest log"
  on scout_digest_log for select
  using (auth.uid() = user_id);

-- Only service role can insert/update
drop policy if exists "Service role manages digest log" on scout_digest_log;
create policy "Service role manages digest log"
  on scout_digest_log for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists idx_scout_digest_log_user_child
  on scout_digest_log (user_id, child_id);

create index if not exists idx_scout_digest_log_sent_at
  on scout_digest_log (sent_at desc);


-- ───────────────────────────────────────────────────────────────
-- 4. WINDOW PROGRESS TABLE
--    One row per (user, child, window).
--    Tracks done/in_progress/skipped status + personal note.
--    Family Circle members each get their own row for the same
--    child — attributed separately in the UI.
-- ───────────────────────────────────────────────────────────────
create table if not exists window_progress (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  child_id    uuid references children(id) on delete cascade not null,
  window_id   uuid references milestone_windows(id) on delete cascade not null,
  status      text not null default 'open'
              check (status in ('open', 'in_progress', 'completed', 'skipped')),
  notes       text check (length(notes) <= 500),   -- 500 char limit (enforced in UI + DB)
  updated_at  timestamptz default now(),
  created_at  timestamptz default now(),

  -- One progress record per user per child per window
  unique (user_id, child_id, window_id)
);

drop trigger if exists set_window_progress_updated_at on window_progress;
create trigger set_window_progress_updated_at
  before update on window_progress
  for each row execute function set_updated_at();

alter table window_progress enable row level security;

-- Users can manage their own progress records
drop policy if exists "Users can manage own window progress" on window_progress;
create policy "Users can manage own window progress"
  on window_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Family Circle: members can read progress for children they have shared access to.
-- A member has shared access if they are in the same family as the child's owner
-- (via family_members: owner = child owner, member = current user).
drop policy if exists "Family members can read shared child progress" on window_progress;
create policy "Family members can read shared child progress"
  on window_progress for select
  using (
    exists (
      select 1 from family_members fm
      join children c on c.user_id = fm.owner_user_id
      where c.id = window_progress.child_id
        and fm.member_user_id = auth.uid()
    )
  );

create index if not exists idx_window_progress_child
  on window_progress (child_id);

create index if not exists idx_window_progress_user_child
  on window_progress (user_id, child_id);

create index if not exists idx_window_progress_window
  on window_progress (window_id);

create index if not exists idx_window_progress_status
  on window_progress (status);


-- ───────────────────────────────────────────────────────────────
-- 5. SCOUT EVENTS TABLE
--    Append-only analytics log.
--    See scout-implementation-plan.md Stream 5 for full taxonomy.
--    Do not delete rows — archive to cold storage after 12 months
--    if volume becomes a concern.
-- ───────────────────────────────────────────────────────────────
create table if not exists scout_events (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete set null,
  child_id    uuid,                -- no FK — child may be deleted, keep event history
  event_type  text not null,       -- see Stream 5 taxonomy in implementation plan
  properties  jsonb,               -- flexible event-specific data
  occurred_at timestamptz default now()
);

alter table scout_events enable row level security;

-- Users can read their own events (useful for debugging)
drop policy if exists "Users can read own events" on scout_events;
create policy "Users can read own events"
  on scout_events for select
  using (auth.uid() = user_id);

-- Only service role can insert
drop policy if exists "Service role inserts events" on scout_events;
create policy "Service role inserts events"
  on scout_events for insert
  with check (auth.role() = 'service_role');

-- Partial indexes on the most common query patterns (funnel analysis)
create index if not exists idx_scout_events_user_type
  on scout_events (user_id, event_type);

create index if not exists idx_scout_events_type_time
  on scout_events (event_type, occurred_at desc);

create index if not exists idx_scout_events_occurred_at
  on scout_events (occurred_at desc);


-- ───────────────────────────────────────────────────────────────
-- 6. HELPER FUNCTIONS
-- ───────────────────────────────────────────────────────────────

-- 6A. get_child_pronoun(gender text, form text)
--     Returns the correct pronoun for use in email/dashboard copy.
--     form: 'subject' → he/she/they
--            'object'  → him/her/them
--            'possess' → his/her/their
--
--     Usage: get_child_pronoun('boy', 'subject') → 'he'
--            get_child_pronoun('girl', 'object')  → 'her'
--            get_child_pronoun(null, 'possess')   → 'their'
create or replace function get_child_pronoun(
  p_gender text,
  p_form   text default 'subject'
)
returns text language plpgsql immutable as $$
begin
  if p_form = 'subject' then
    return case p_gender
      when 'boy'  then 'he'
      when 'girl' then 'she'
      else 'they'
    end;
  elsif p_form = 'object' then
    return case p_gender
      when 'boy'  then 'him'
      when 'girl' then 'her'
      else 'them'
    end;
  elsif p_form = 'possess' then
    return case p_gender
      when 'boy'  then 'his'
      when 'girl' then 'her'
      else 'their'
    end;
  else
    return 'they';  -- safe fallback for unknown form
  end if;
end;
$$;


-- 6B. get_windows_for_age(age_weeks, limit_n)
--     Returns open milestone windows for a given age, ordered by priority.
--     Used by digest edge functions to select above-fold content.
--
--     Usage: select * from get_windows_for_age(26, 10);
create or replace function get_windows_for_age(
  p_age_weeks integer,
  p_limit     integer default 20
)
returns setof milestone_windows language plpgsql stable security definer as $$
begin
  return query
  select *
  from milestone_windows
  where active = true
    and open_age_weeks  <= p_age_weeks
    and close_age_weeks >= p_age_weeks
  order by priority asc, urgency desc
  limit p_limit;
end;
$$;


-- 6C. get_closing_windows(age_weeks, weeks_ahead)
--     Returns windows that close within `weeks_ahead` weeks.
--     Used by the 7-day alert job to identify urgent windows.
--
--     Usage: select * from get_closing_windows(24, 4);
create or replace function get_closing_windows(
  p_age_weeks   integer,
  p_weeks_ahead integer default 4
)
returns setof milestone_windows language plpgsql stable security definer as $$
begin
  return query
  select *
  from milestone_windows
  where active = true
    and open_age_weeks  <= p_age_weeks
    and close_age_weeks >= p_age_weeks
    and close_age_weeks <= p_age_weeks + p_weeks_ahead
  order by close_age_weeks asc, priority asc;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- 7. VERIFICATION QUERIES
--    Run these after applying the migration to confirm everything
--    is in place. Expected results noted in comments.
-- ───────────────────────────────────────────────────────────────

-- Confirm all 5 tables exist:
-- select table_name from information_schema.tables
-- where table_schema = 'public'
-- and table_name in (
--   'children', 'scout_subscriptions', 'milestone_windows',
--   'scout_digest_log', 'window_progress', 'scout_events'
-- );
-- Expected: 6 rows

-- Confirm gender constraint is correct:
-- select pg_get_constraintdef(oid) from pg_constraint
-- where conname = 'children_gender_check';
-- Expected: CHECK ((gender = ANY (ARRAY['girl', 'boy', 'other', NULL::text])))

-- Test pronoun helper:
-- select get_child_pronoun('boy', 'subject');    → 'he'
-- select get_child_pronoun('girl', 'possess');   → 'her'
-- select get_child_pronoun(null, 'object');      → 'them'

-- Test window query (run after 2F import):
-- select slug, title, priority, urgency from get_windows_for_age(26, 5);
-- Expected: 5 highest-priority windows open at 26 weeks (6 months)


-- ───────────────────────────────────────────────────────────────
-- MIGRATION v2.0 — Add prebirth_reminder to digest_type constraint
--    Run this before deploying scout-digest with pre-birth support.
-- ───────────────────────────────────────────────────────────────

alter table scout_digest_log
  drop constraint if exists scout_digest_log_digest_type_check;

alter table scout_digest_log
  add constraint scout_digest_log_digest_type_check
  check (digest_type in (
    'signup',
    'monthly',
    'trial_end',
    'alert',
    'reengagement',
    'prebirth_reminder'
  ));

-- Verification:
-- select pg_get_constraintdef(oid) from pg_constraint
-- where conname = 'scout_digest_log_digest_type_check';
-- Expected: CHECK ((digest_type = ANY (ARRAY[..., 'prebirth_reminder'::text])))

-- ───────────────────────────────────────────────────────────────
-- MIGRATION v2.1 — Pre-birth mode support
--    Adds due_date and is_expecting to the children table.
--    Run this migration ONCE on existing databases.
--
-- is_expecting: true while baby has not yet arrived.
--               Set to false when arrival is confirmed.
-- due_date:     Expected date of birth (populated when is_expecting = true).
--               Retained after arrival for reference.
--
-- Trial timing: for expecting parents, the trial clock starts on
-- arrival confirmation (dob set to real birthdate, is_expecting → false).
-- The monthly-birthday catch-up logic runs from the real dob as usual.
--
-- Email digest behaviour (implement in scout-monthly-digest edge fn):
--   if is_expecting = true → send "Is your baby here yet?" reminder
--   instead of (or in addition to) the normal pre-birth window digest.
-- ───────────────────────────────────────────────────────────────

alter table children
  add column if not exists due_date    date    default null,
  add column if not exists is_expecting boolean not null default false;

-- Index for quickly finding all expecting parents (used by digest edge fn)
create index if not exists children_is_expecting_idx
  on children (is_expecting)
  where is_expecting = true;

-- Verification:
-- select id, name, dob, due_date, is_expecting from children limit 5;
-- Expected: due_date and is_expecting columns present, all existing rows have is_expecting = false
