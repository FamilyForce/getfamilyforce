-- ═══════════════════════════════════════════════════════════════
-- Migration: go-free
-- Date: 2026-04-20
--
-- Converts all trialing subscriptions to active free plan.
-- Existing paid active subscriptions are left untouched.
-- New signups will receive status='active', plan='free' via
-- updated scout-trial-start edge function.
-- ═══════════════════════════════════════════════════════════════

UPDATE scout_subscriptions
SET
  status    = 'active',
  plan      = 'free',
  trial_end = NULL,
  updated_at = NOW()
WHERE status = 'trialing';
