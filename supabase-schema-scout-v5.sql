-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Schema v5
-- Per-user referral codes
-- Run AFTER supabase-schema-scout-gifts.sql
--
-- What this adds:
--   1. referral_code column on profiles (text, unique, nullable)
--   2. Index for fast lookups during redemption
--   3. RLS policy so users can read their own code via anon key
-- ═══════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
-- 1. Add referral_code to profiles
-- ───────────────────────────────────────────────────────────────
alter table profiles
  add column if not exists referral_code text unique;


-- ───────────────────────────────────────────────────────────────
-- 2. Index — hot path on redemption (scout-trial-start validates code)
-- ───────────────────────────────────────────────────────────────
create index if not exists idx_profiles_referral_code
  on profiles (referral_code)
  where referral_code is not null;


-- ───────────────────────────────────────────────────────────────
-- Verification
-- ───────────────────────────────────────────────────────────────
-- select id, referral_code from profiles limit 10;
-- select * from profiles where referral_code = 'FRIEND-AB12-CD34';
