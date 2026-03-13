-- FamilyForce — Referral Code Schema
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add referral_code to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Index for fast lookup at checkout
CREATE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON public.profiles (referral_code);

-- 2. Referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code    TEXT        NOT NULL,
  discount_pct     INT         DEFAULT 25,
  status           TEXT        DEFAULT 'pending',   -- pending | credited | cancelled
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can read their own referral rows (as referrer)
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer can read own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Service role bypasses RLS (edge function writes referrals)
