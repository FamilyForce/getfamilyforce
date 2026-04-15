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
SELECT cron.unschedule('scout-trial-end')         WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-trial-end');
SELECT cron.unschedule('scout-digest')            WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-digest');
SELECT cron.unschedule('scout-monitor')           WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-monitor');
SELECT cron.unschedule('scout-prebirth-nudge')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-prebirth-nudge');
SELECT cron.unschedule('scout-expiry-reminder')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scout-expiry-reminder');

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
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
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
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 3: Pre-birth nudge emails (daily 08:00 UTC) ────────────────────────
-- Scans all expecting children and sends the right email based on proximity to due date:
--   T-42 days → prep_6wk reminder (hospital bag, pediatrician, safe sleep)
--   T=0       → "Is baby here yet?" due date nudge
--   T+7       → "Still waiting?" follow-up (final automated email)
-- Deduped via prebirth_email_log unique index — safe to run daily.
SELECT cron.schedule(
  'scout-prebirth-nudge',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-prebirth-nudge',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 4: Subscription expiry reminders (daily 08:00 UTC) ─────────────────
-- Sends 30-day and 7-day warning emails to users on DB-only free subs
-- (SCOUT1TIME, SCOUT3FREE) whose period_end is approaching.
-- Deduped via scout_events — safe to run daily.
SELECT cron.schedule(
  'scout-expiry-reminder',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-expiry-reminder',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Job 5: Daily monitoring + sanity check (daily 09:00 UTC) ────────────────
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
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
    ),
    body    := '{}'::jsonb
  );
  $$
);

-- ─── Verify jobs are scheduled ────────────────────────────────────────────────
-- REMOVED (Mar 29, 2026): scout-alert (7-day pre-digest warning email)
-- Reason: redundant — the ICS calendar invite already sends a 7-day VALARM.
-- Function deleted. email-closing-alert.ts template deleted.

SELECT jobname, schedule, active, command
FROM cron.job
WHERE jobname IN ('scout-trial-end', 'scout-digest', 'scout-monitor', 'scout-prebirth-nudge', 'scout-expiry-reminder')
ORDER BY jobname;

-- ─── Notes ───────────────────────────────────────────────────────────────────
-- To check cron run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
-- To disable a job:           SELECT cron.unschedule('scout-trial-end');
-- To check pg_net is enabled: SELECT * FROM pg_extension WHERE extname = 'pg_net';
-- pg_net is required for net.http_post() — enable at Dashboard → Extensions → pg_net
