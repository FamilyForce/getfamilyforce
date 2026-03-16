-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Supabase pg_cron Scheduled Jobs
--
-- HOW TO INSTALL:
--   1. Supabase Dashboard → SQL Editor → paste and run this file
--   2. Verify at: Supabase → Database → Extensions → pg_cron
--
-- REQUIREMENTS:
--   pg_cron extension must be enabled:
--   Dashboard → Database → Extensions → search "cron" → enable
--
-- All jobs run at 08:00 UTC daily. Supabase's vault.secret() is
-- used for the service role key — set it first:
--   SELECT vault.create_secret('service_role_key', '<your_key>', 'service_role_key');
-- Or just hardcode the URL and key below if vault is not needed.
-- ═══════════════════════════════════════════════════════════════

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ─── Remove existing Scout jobs (safe to re-run) ─────────────────────────────
SELECT cron.unschedule('scout-trial-end')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-trial-end');
SELECT cron.unschedule('scout-digest')      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-digest');
SELECT cron.unschedule('scout-alert')       WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-alert');
SELECT cron.unschedule('scout-monitor')     WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-monitor');

-- ─── Job 1: Trial-end emails + re-engagement (daily 08:00 UTC) ───────────────
-- Sends trial-end email on the day trial_end is reached.
-- Also sends re-engagement email 30 days after trial end for non-converters.
SELECT cron.schedule(
  'scout-trial-end',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-trial-end',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 2: Monthly digest (daily 08:00 UTC — fires only on child's birthday) ──
-- The edge function checks internally whether today is the child's birthday.
-- Running it daily is cheap — it does nothing on non-birthday days.
SELECT cron.schedule(
  'scout-digest',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 3: 7-day closing window alert (daily 08:00 UTC) ─────────────────────
-- Fires 7 days before child's next birthday when closing windows exist.
-- Restored (Mar 16, 2026) — complements .ics VALARM for users who didn't accept calendar.
SELECT cron.unschedule('scout-alert') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-alert');
SELECT cron.schedule(
  'scout-alert',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-alert',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- ─── Job 4: Daily monitoring + sanity check (daily 09:00 UTC) ────────────────
-- Runs 1 hour after the main jobs (08:00 UTC) to verify they all fired.
-- Sends a daily Telegram report: subscriber counts, digests sent, bounce rate.
-- Alerts immediately on: job failures, zero digests, bounce rate > 2%.
SELECT cron.schedule(
  'scout-monitor',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-monitor',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Verify jobs are scheduled ────────────────────────────────────────────────
SELECT jobname, schedule, active, command
FROM cron.job
WHERE jobname IN ('scout-trial-end', 'scout-digest', 'scout-monitor')
ORDER BY jobname;

-- ─── Notes ───────────────────────────────────────────────────────────────────
-- To check cron run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- To disable a job:           SELECT cron.unschedule('scout-trial-end');
-- To check pg_net is enabled: SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- pg_net is required for net.http_post() — enable at Dashboard → Extensions → pg_net
