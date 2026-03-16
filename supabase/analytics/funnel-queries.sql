-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Analytics Funnel Queries (5C + 5D)
--
-- Run these in Supabase SQL Editor weekly.
-- All queries use the scout_events table.
-- Filter by date range: change the WHERE occurred_at filters.
--
-- Activation metric (5A): dashboard_opened
-- Definition: user opens the Scout dashboard after receiving their first digest.
-- Rationale: stronger signal than email open (they acted, not just read),
--            trackable without calendar integration, predicts active engagement.
-- ═══════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNNEL 1: Signup → Activation
-- Target: >55% email open rate, >30% dashboard open rate
-- ─────────────────────────────────────────────────────────────────────────────

-- Step-by-step funnel (last 30 days)
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'signup_completed'   THEN user_id END) AS "1_signed_up",
  COUNT(DISTINCT CASE WHEN event_type = 'first_digest_sent'  THEN user_id END) AS "2_first_digest_sent",
  COUNT(DISTINCT CASE WHEN event_type = 'email_delivered'
                      AND  properties->>'email_type' = 'signup'
                      THEN user_id END)                                         AS "3_email_delivered",
  COUNT(DISTINCT CASE WHEN event_type = 'email_opened'
                      AND  properties->>'email_type' = 'signup'
                      THEN user_id END)                                         AS "4_email_opened",
  COUNT(DISTINCT CASE WHEN event_type = 'dashboard_opened'   THEN user_id END) AS "5_dashboard_opened",
  -- Activation metric: dashboard_opened (5A)
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'dashboard_opened' THEN user_id END)
           / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'signup_completed' THEN user_id END), 0),
    1
  ) AS "activation_rate_pct"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '30 days';


-- Drop-off rates between each step
SELECT
  signups,
  ROUND(100.0 * digests     / NULLIF(signups,     0), 1) AS "signup_to_digest_pct",
  ROUND(100.0 * email_opens / NULLIF(digests,     0), 1) AS "digest_to_email_open_pct",
  ROUND(100.0 * dash_opens  / NULLIF(email_opens, 0), 1) AS "email_open_to_dashboard_pct",
  ROUND(100.0 * dash_opens  / NULLIF(signups,     0), 1) AS "overall_activation_pct"
FROM (
  SELECT
    COUNT(DISTINCT CASE WHEN event_type = 'signup_completed'  THEN user_id END) AS signups,
    COUNT(DISTINCT CASE WHEN event_type = 'first_digest_sent' THEN user_id END) AS digests,
    COUNT(DISTINCT CASE WHEN event_type = 'email_opened'
                        AND properties->>'email_type' = 'signup'
                        THEN user_id END)                                        AS email_opens,
    COUNT(DISTINCT CASE WHEN event_type = 'dashboard_opened'  THEN user_id END) AS dash_opens
  FROM scout_events
  WHERE occurred_at >= NOW() - INTERVAL '30 days'
) f;


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNNEL 2: Trial → Paid Conversion
-- Target: >40% overall trial-to-paid
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'trial_started'          THEN user_id END) AS "1_trials_started",
  COUNT(DISTINCT CASE WHEN event_type = 'trial_end_email_sent'   THEN user_id END) AS "2_trial_end_email_sent",
  COUNT(DISTINCT CASE WHEN event_type = 'email_opened'
                      AND  properties->>'email_type' = 'trial_end'
                      THEN user_id END)                                             AS "3_email_opened",
  COUNT(DISTINCT CASE WHEN event_type = 'email_clicked'
                      AND  properties->>'email_type' = 'trial_end'
                      THEN user_id END)                                             AS "4_cta_clicked",
  COUNT(DISTINCT CASE WHEN event_type = 'trial_converted'        THEN user_id END) AS "5_converted",
  COUNT(DISTINCT CASE WHEN event_type = 'trial_churned'          THEN user_id END) AS "churned",
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'trial_converted' THEN user_id END)
           / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'trial_started' THEN user_id END), 0),
    1
  ) AS "trial_to_paid_pct"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '90 days';


-- Conversion breakdown: annual vs monthly
SELECT
  properties->>'plan_type' AS plan,
  COUNT(*) AS conversions,
  ROUND(AVG((properties->>'days_in_trial')::numeric), 1) AS avg_days_in_trial
FROM scout_events
WHERE event_type = 'trial_converted'
  AND occurred_at >= NOW() - INTERVAL '90 days'
GROUP BY 1
ORDER BY 2 DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNNEL 3: Monthly Engagement (paid subscribers)
-- Target: >55% email open rate, >25% dashboard rate per digest
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  DATE_TRUNC('month', occurred_at) AS month,
  COUNT(DISTINCT CASE WHEN event_type = 'first_digest_sent'
                      OR  (event_type = 'job_succeeded' AND properties->>'job_type' = 'scout-digest')
                      THEN user_id END) AS digests_sent,
  COUNT(DISTINCT CASE WHEN event_type = 'email_opened'
                      AND properties->>'email_type' IN ('monthly', 'signup')
                      THEN user_id END) AS emails_opened,
  COUNT(DISTINCT CASE WHEN event_type = 'dashboard_opened' THEN user_id END) AS dashboard_opens,
  COUNT(DISTINCT CASE WHEN event_type = 'window_progress_updated' THEN user_id END) AS windows_actioned,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'email_opened'
                                AND properties->>'email_type' IN ('monthly', 'signup')
                                THEN user_id END)
           / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'first_digest_sent'
                                        OR (event_type = 'job_succeeded'
                                            AND properties->>'job_type' = 'scout-digest')
                                        THEN user_id END), 0),
    1
  ) AS "email_open_rate_%"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1 DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- FUNNEL 4: Gift funnel
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  COUNT(CASE WHEN event_type = 'gift_purchased' THEN 1 END) AS gifts_purchased,
  COUNT(CASE WHEN event_type = 'gift_redeemed'  THEN 1 END) AS gifts_redeemed,
  ROUND(
    100.0 * COUNT(CASE WHEN event_type = 'gift_redeemed'  THEN 1 END)
           / NULLIF(COUNT(CASE WHEN event_type = 'gift_purchased' THEN 1 END), 0),
    1
  ) AS "redemption_rate_%"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '90 days';


-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTING: Email health (5D)
-- Target: delivery >98%, bounce <2%
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  DATE_TRUNC('week', occurred_at) AS week,
  COUNT(CASE WHEN event_type = 'email_delivered'    THEN 1 END) AS delivered,
  COUNT(CASE WHEN event_type = 'email_opened'       THEN 1 END) AS opened,
  COUNT(CASE WHEN event_type = 'email_clicked'      THEN 1 END) AS clicked,
  COUNT(CASE WHEN event_type = 'email_bounced'      THEN 1 END) AS bounced,
  COUNT(CASE WHEN event_type = 'email_complained'   THEN 1 END) AS complaints,
  COUNT(CASE WHEN event_type = 'email_unsubscribed' THEN 1 END) AS unsubscribes,
  ROUND(
    100.0 * COUNT(CASE WHEN event_type = 'email_opened'   THEN 1 END)
           / NULLIF(COUNT(CASE WHEN event_type = 'email_delivered' THEN 1 END), 0),
    1
  ) AS "open_rate_%",
  ROUND(
    100.0 * COUNT(CASE WHEN event_type = 'email_bounced'  THEN 1 END)
           / NULLIF(COUNT(CASE WHEN event_type = 'email_delivered' THEN 1 END), 0),
    2
  ) AS "bounce_rate_%"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '12 weeks'
GROUP BY 1
ORDER BY 1 DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTING: Job health
-- Target: zero job_failed events
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  properties->>'job_type' AS job,
  COUNT(CASE WHEN event_type = 'job_succeeded' THEN 1 END) AS succeeded,
  COUNT(CASE WHEN event_type = 'job_failed'    THEN 1 END) AS failed,
  ROUND(AVG(CASE WHEN event_type = 'job_succeeded'
                 THEN (properties->>'duration_ms')::numeric END), 0) AS avg_duration_ms
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '30 days'
  AND event_type IN ('job_succeeded', 'job_failed')
GROUP BY 1
ORDER BY failed DESC, succeeded DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTING: Paywall shown → conversion rate
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'paywall_shown'    THEN user_id END) AS saw_paywall,
  COUNT(DISTINCT CASE WHEN event_type = 'trial_converted'  THEN user_id END) AS converted,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN event_type = 'trial_converted' THEN user_id END)
           / NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'paywall_shown' THEN user_id END), 0),
    1
  ) AS "paywall_conversion_%"
FROM scout_events
WHERE occurred_at >= NOW() - INTERVAL '90 days';


-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTING: Active track engagement (window progress)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  properties->>'status'       AS status,
  properties->>'urgency_tier' AS urgency,
  COUNT(*)                    AS updates
FROM scout_events
WHERE event_type = 'window_progress_updated'
  AND occurred_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 3 DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- SNAPSHOT: High-level weekly summary (paste into Telegram/Slack)
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  'This week' AS period,
  COUNT(DISTINCT CASE WHEN event_type = 'signup_completed'  THEN user_id END) AS new_signups,
  COUNT(DISTINCT CASE WHEN event_type = 'trial_converted'   THEN user_id END) AS conversions,
  COUNT(CASE WHEN event_type = 'email_delivered'            THEN 1 END)       AS emails_sent,
  COUNT(CASE WHEN event_type = 'job_failed'                 THEN 1 END)       AS job_failures,
  COUNT(CASE WHEN event_type = 'email_bounced'              THEN 1 END)       AS bounces,
  COUNT(CASE WHEN event_type = 'email_complained'           THEN 1 END)       AS complaints
FROM scout_events
WHERE occurred_at >= DATE_TRUNC('week', NOW());
