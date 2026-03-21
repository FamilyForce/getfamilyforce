-- ═══════════════════════════════════════════════════════════════
-- Migration: Gift delivery scheduling
-- Adds deliver_at and gift_email_sent to scout_gifts
-- Run in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- deliver_at: NULL = send immediately; future timestamp = scheduled delivery
ALTER TABLE scout_gifts
  ADD COLUMN IF NOT EXISTS deliver_at      timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gift_email_sent boolean     DEFAULT TRUE;

-- Backfill: all existing gifts were sent immediately
UPDATE scout_gifts SET gift_email_sent = TRUE WHERE gift_email_sent IS NULL;

-- Index for the daily cron scan
CREATE INDEX IF NOT EXISTS idx_scout_gifts_pending_delivery
  ON scout_gifts (deliver_at)
  WHERE gift_email_sent = FALSE AND redeemed_at IS NULL;

-- Cron: fire scout-gift-deliver daily at 08:00 UTC
-- (Requires pg_cron enabled; run this separately if pg_cron not yet set up)
-- SELECT cron.schedule(
--   'scout-gift-deliver',
--   '0 8 * * *',
--   $$
--     SELECT net.http_post(
--       url := current_setting('app.supabase_edge_function_url') || '/scout-gift-deliver',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );
