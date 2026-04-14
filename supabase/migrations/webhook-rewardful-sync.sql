-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — DB Webhook: scout-rewardful-sync
--
-- Fires scout-rewardful-sync edge function whenever a profile's
-- referral_code is set for the first time (NULL → value).
--
-- WHY UPDATE not INSERT:
--   auth.users insert → creates profiles row with just id (no email,
--   no referral_code). sign-in.html then upserts the referral_code
--   via a separate call — this is the UPDATE we care about.
--
-- WHY JOIN auth.users:
--   profiles table has no email column. We fetch it from auth.users
--   so scout-rewardful-sync gets the required { id, email, referral_code }.
--
-- Re-runnable: uses CREATE OR REPLACE + DROP IF EXISTS.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_scout_rewardful_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Only fire when referral_code transitions from null/empty → a real value
  IF (OLD.referral_code IS NULL OR OLD.referral_code = '')
     AND NEW.referral_code IS NOT NULL
     AND NEW.referral_code != ''
  THEN
    -- Fetch email from auth.users (profiles has no email column)
    SELECT email INTO v_email FROM auth.users WHERE id = NEW.id;

    PERFORM net.http_post(
      url     := 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-rewardful-sync',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA0NTIwMywiZXhwIjoyMDg4NjIxMjAzfQ.oOJrcEBdhzRjhkhGNOS4nLcPmhj7lWXUpr21K2aGNUw'
      ),
      body    := jsonb_build_object(
        'type',   'INSERT',
        'table',  TG_TABLE_NAME,
        'record', jsonb_build_object(
          'id',            NEW.id,
          'email',         v_email,
          'referral_code', NEW.referral_code
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ─── Attach trigger to profiles (AFTER UPDATE) ────────────────────────────────
DROP TRIGGER IF EXISTS scout_rewardful_sync_trigger ON profiles;

CREATE TRIGGER scout_rewardful_sync_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_scout_rewardful_sync();

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'scout_rewardful_sync_trigger';
