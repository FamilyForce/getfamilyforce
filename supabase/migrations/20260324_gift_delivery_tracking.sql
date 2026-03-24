-- Gift delivery tracking columns
-- Adds delivery_attempts, last_delivery_error, resend_message_id to scout_gifts

ALTER TABLE scout_gifts
  ADD COLUMN IF NOT EXISTS delivery_attempts   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_delivery_error text,
  ADD COLUMN IF NOT EXISTS resend_message_id   text;
