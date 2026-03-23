-- ─────────────────────────────────────────────────────────────────────────────
-- Add is_gift to scout_subscriptions
-- Distinguishes gift-funded trials from free trials so the dashboard
-- can show "Gift active until [date]" instead of a subscribe paywall.
-- ─────────────────────────────────────────────────────────────────────────────

alter table scout_subscriptions
  add column if not exists is_gift boolean not null default false;

-- Back-fill: mark any subscription whose trial_end matches a redeemed gift
update scout_subscriptions ss
set    is_gift = true
where  exists (
  select 1
  from   scout_gifts sg
  where  sg.redeemed_by = ss.user_id
    and  sg.redeemed_at is not null
);
