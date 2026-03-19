-- Fix: prevent duplicate digest sends caused by race condition in scout-signup-delivery
-- Two concurrent calls could both pass the app-level dedup check before either logged.
-- This unique constraint ensures only one digest per child/type/month can ever be inserted.
-- Applied: 2026-03-19

ALTER TABLE scout_digest_log
ADD CONSTRAINT scout_digest_log_child_type_month_unique
UNIQUE (child_id, digest_type, digest_month);
