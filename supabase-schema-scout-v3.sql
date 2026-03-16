-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Schema v3 Additions
-- Run in Supabase SQL Editor after supabase-schema-scout-v2.sql
-- Adds: completion date, attribution, display names
-- ═══════════════════════════════════════════════════════════════

-- ─── window_progress additions ───────────────────────────────────────────────

-- User-specified date when the action actually happened (e.g. "this was 2 weeks ago")
ALTER TABLE window_progress
  ADD COLUMN IF NOT EXISTS completed_date date;

-- Who made the last change (for Family Circle attribution)
ALTER TABLE window_progress
  ADD COLUMN IF NOT EXISTS updated_by_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by_name    text;   -- cached display name at write time

-- ─── profiles additions ──────────────────────────────────────────────────────

-- Display name used in Family Circle attribution ("Michael", "Sandy", etc.)
-- Falls back to email prefix if not set.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS display_name text;
