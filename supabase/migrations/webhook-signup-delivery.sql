-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — DB Webhook: scout-signup-delivery
--
-- Fires scout-signup-delivery edge function whenever a new row
-- is inserted into scout_subscriptions with status = 'trialing'.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → paste and run this file
--
-- REQUIREMENTS:
--   pg_net extension must be enabled (Dashboard → Extensions → pg_net)
--   app.service_role_key must be set:
--     ALTER DATABASE postgres SET "app.service_role_key" TO '<service_role_key>';
--
-- Re-runnable: uses CREATE OR REPLACE + DROP IF EXISTS.
-- ═══════════════════════════════════════════════════════════════

-- ─── Trigger function ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_scout_signup_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire on trialing subscriptions
  IF NEW.status = 'trialing' THEN
    PERFORM net.http_post(
      url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-signup-delivery',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
      ),
      body    := jsonb_build_object(
        'type',   TG_OP,
        'table',  TG_TABLE_NAME,
        'record', row_to_json(NEW)::jsonb
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Attach trigger to scout_subscriptions ────────────────────────────────────
DROP TRIGGER IF EXISTS scout_signup_delivery_trigger ON scout_subscriptions;

CREATE TRIGGER scout_signup_delivery_trigger
  AFTER INSERT ON scout_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_scout_signup_delivery();

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'scout_signup_delivery_trigger';
