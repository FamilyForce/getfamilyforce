-- ═══════════════════════════════════════════════════════════════
-- FamilyForce — Scout Schema
-- Paste into Supabase → SQL Editor → New Query → Run
-- Run AFTER supabase-schema.sql and supabase-schema-family.sql
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. CHILDREN TABLE
--    One row per child. A user can have multiple children.
--    Used by Scout to calculate age-specific developmental windows.
-- ───────────────────────────────────────────────────────────────
create table if not exists children (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  dob         date not null,
  gender      text check (gender in ('girl', 'boy', null)),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Auto-update updated_at on every write
drop trigger if exists set_children_updated_at on children;
create trigger set_children_updated_at
  before update on children
  for each row execute function set_updated_at();
-- Note: set_updated_at() function is created in supabase-schema.sql

-- Row-Level Security: users can only read/write their own children
alter table children enable row level security;

create policy "Users can manage own children"
  on children
  for all
  using  ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );


-- ───────────────────────────────────────────────────────────────
-- 2. SCOUT SUBSCRIPTIONS TABLE
--    Tracks trial and paid Scout subscriptions per user.
--    Stripe webhook will update status + period_end.
--
--    status values:
--      'trialing'   — within 7-day free trial
--      'active'     — paid, subscription current
--      'cancelled'  — cancelled, access until period_end
--      'expired'    — past period_end, no access
--      'past_due'   — payment failed
-- ───────────────────────────────────────────────────────────────
create table if not exists scout_subscriptions (
  id                  uuid default gen_random_uuid() primary key,
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  status              text not null default 'trialing'
                        check (status in ('trialing','active','cancelled','expired','past_due')),
  stripe_customer_id  text,
  stripe_sub_id       text,
  promo_code          text,                    -- code applied at signup (e.g. FRIEND25)
  discount_pct        integer,                 -- e.g. 25 for 25% off
  price_paid          numeric(8,2),            -- actual amount after discount
  trial_end           timestamptz,
  period_end          timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

drop trigger if exists set_scout_sub_updated_at on scout_subscriptions;
create trigger set_scout_sub_updated_at
  before update on scout_subscriptions
  for each row execute function set_updated_at();

alter table scout_subscriptions enable row level security;

create policy "Users can read own subscription"
  on scout_subscriptions
  for select
  using ( auth.uid() = user_id );

-- Only service role (Stripe webhook backend) can insert/update subscriptions
-- Users cannot write their own subscription status
create policy "Service role manages subscriptions"
  on scout_subscriptions
  for all
  using ( auth.role() = 'service_role' )
  with check ( auth.role() = 'service_role' );


-- ───────────────────────────────────────────────────────────────
-- 3. HELPER FUNCTION — check if user has active Scout access
--    Returns true if status is 'trialing' or 'active'
--    and period/trial has not expired.
-- ───────────────────────────────────────────────────────────────
create or replace function user_has_scout_access(p_user_id uuid)
returns boolean language plpgsql security definer as $$
declare
  rec scout_subscriptions%rowtype;
begin
  select * into rec
  from scout_subscriptions
  where user_id = p_user_id
  limit 1;

  if not found then return false; end if;

  if rec.status = 'trialing' and rec.trial_end > now() then
    return true;
  end if;

  if rec.status = 'active' and rec.period_end > now() then
    return true;
  end if;

  return false;
end;
$$;


-- ───────────────────────────────────────────────────────────────
-- Verification
-- ───────────────────────────────────────────────────────────────
-- select * from children limit 5;
-- select * from scout_subscriptions limit 5;
-- select user_has_scout_access('<paste-user-uuid>');
