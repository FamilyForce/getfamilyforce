-- ═══════════════════════════════════════════════════════════════
-- Scout — Error Log Queries
-- Run these in Supabase SQL Editor to debug issues.
-- ═══════════════════════════════════════════════════════════════

-- ─── All job failures (last 7 days) ──────────────────────────────────────────
SELECT
  occurred_at,
  user_id,
  properties->>'job_type'   AS job,
  properties->>'step'       AS step,
  properties->>'error'      AS error,
  (properties->>'duration_ms')::int AS duration_ms
FROM scout_events
WHERE event_type = 'job_failed'
  AND occurred_at >= NOW() - INTERVAL '7 days'
ORDER BY occurred_at DESC;

-- ─── Digest log — last 30 days ───────────────────────────────────────────────
SELECT
  digest_type,
  digest_month,
  child_age_months,
  email_subject,
  created_at
FROM scout_digest_log
ORDER BY created_at DESC
LIMIT 50;

-- ─── Bounce + complaint events (last 30 days) ────────────────────────────────
SELECT
  event_type,
  user_id,
  properties->>'email_type'  AS email_type,
  properties->>'bounce_type' AS bounce_type,
  occurred_at
FROM scout_events
WHERE event_type IN ('email_bounced', 'email_complained')
  AND occurred_at >= NOW() - INTERVAL '30 days'
ORDER BY occurred_at DESC;

-- ─── Funnel: trial started → converted (all time) ────────────────────────────
SELECT
  event_type,
  COUNT(*) AS count
FROM scout_events
WHERE event_type IN (
  'trial_started',
  'trial_end_email_sent',
  'trial_converted',
  'trial_churned',
  'reengagement_sent'
)
GROUP BY event_type
ORDER BY count DESC;

-- ─── Active + trialing subscriber counts ─────────────────────────────────────
SELECT status, COUNT(*) AS count
FROM scout_subscriptions
GROUP BY status
ORDER BY count DESC;

-- ─── Digests sent by type and month ──────────────────────────────────────────
SELECT
  digest_type,
  digest_month,
  COUNT(*) AS count
FROM scout_digest_log
GROUP BY digest_type, digest_month
ORDER BY digest_month DESC, digest_type;

-- ─── Users with suppressed/cancelled subscriptions (bounces/complaints) ──────
SELECT
  user_id,
  status,
  updated_at
FROM scout_subscriptions
WHERE status IN ('expired', 'cancelled')
ORDER BY updated_at DESC
LIMIT 20;
