-- ═══════════════════════════════════════════════════════════════
-- Migration: allow family circle members to read shared children
-- Date: 2026-03-18
--
-- The 'children' table RLS only allowed user_id = auth.uid().
-- Family members (linked via family_members) were blocked from
-- reading children, so the dashboard showed "Set up Scout".
-- ═══════════════════════════════════════════════════════════════

-- 1. Children: family members can read shared children
drop policy if exists "Family members can read shared children" on children;

create policy "Family members can read shared children"
  on children
  for select
  using (
    exists (
      select 1
      from family_members fm
      where fm.child_id        = children.id
        and fm.member_user_id  = auth.uid()
        and fm.status          = 'active'
    )
  );

-- 2. Scout subscriptions: family members can read the subscription for a shared child
-- (needed so the trial banner renders correctly for family members)
drop policy if exists "Family members can read shared subscription" on scout_subscriptions;

create policy "Family members can read shared subscription"
  on scout_subscriptions
  for select
  using (
    exists (
      select 1
      from family_members fm
      join children c on c.id = fm.child_id
      where c.user_id          = scout_subscriptions.user_id
        and fm.member_user_id  = auth.uid()
        and fm.status          = 'active'
    )
  );
