-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Schema v4
-- Multi-child subscription support
-- Run AFTER supabase-schema-scout.sql (and v2, v3)
--
-- What this adds:
--   1. Drop unique constraint on scout_subscriptions(user_id)
--      so each user can have one subscription per child
--   2. Add child_id column to scout_subscriptions
--   3. Unique indexes: (user_id, child_id) for named rows;
--      (user_id) WHERE child_id IS NULL for legacy rows
--   4. Index on child_id for fast lookups
--   5. Update user_has_scout_access() to accept optional child_id
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. Drop old single-user unique constraint
-- ───────────────────────────────────────────────────────────────
alter table scout_subscriptions
  drop constraint if exists scout_subscriptions_user_id_key;


-- ───────────────────────────────────────────────────────────────
-- 2. Add child_id column (nullable for backward compat)
-- ───────────────────────────────────────────────────────────────
alter table scout_subscriptions
  add column if not exists child_id uuid references children(id) on delete cascade;


-- ───────────────────────────────────────────────────────────────
-- 3. Unique indexes
--    a) One subscription per (user, child) when child_id is set
--    b) One subscription per user when child_id is null (legacy rows)
-- ───────────────────────────────────────────────────────────────
create unique index if not exists scout_sub_user_child_unique
  on scout_subscriptions(user_id, child_id)
  where child_id is not null;

create unique index if not exists scout_sub_user_null_child_unique
  on scout_subscriptions(user_id)
  where child_id is null;


-- ───────────────────────────────────────────────────────────────
-- 4. Performance index
-- ───────────────────────────────────────────────────────────────
create index if not exists idx_scout_sub_child_id
  on scout_subscriptions(child_id);


-- ───────────────────────────────────────────────────────────────
-- 5. Update user_has_scout_access() — now accepts optional child_id
--    Prefers exact child match; falls back to null child_id (legacy)
-- ───────────────────────────────────────────────────────────────
create or replace function user_has_scout_access(
  p_user_id  uuid,
  p_child_id uuid default null
)
returns boolean language plpgsql security definer as $$
declare
  rec scout_subscriptions%rowtype;
begin
  -- Try exact child match first, then fall back to legacy (null child_id) row
  select * into rec
  from scout_subscriptions
  where user_id = p_user_id
    and (
      (p_child_id is not null and child_id = p_child_id)
      or
      (p_child_id is null     and child_id is null)
      or
      child_id is null   -- legacy rows always qualify as fallback
    )
  order by
    case when child_id = p_child_id then 0 else 1 end
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
-- select id, user_id, child_id, status, trial_end, period_end
--   from scout_subscriptions limit 10;
-- select user_has_scout_access('<user-uuid>', '<child-uuid>');
