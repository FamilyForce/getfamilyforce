-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Gift Subscriptions Schema
-- Run in Supabase SQL Editor after supabase-schema-scout-v2.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── scout_gifts ─────────────────────────────────────────────────────────────
-- Stores gift purchase records. Each row = one gift purchase.
-- Gift code is redeemed by the recipient when they create an account.

CREATE TABLE IF NOT EXISTS scout_gifts (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Gift code — sent to recipient, used at redemption
  code                      text        UNIQUE NOT NULL,

  -- Plan details
  plan                      text        NOT NULL CHECK (plan IN ('annual', 'monthly')),
  plan_months               int         NOT NULL DEFAULT 12,  -- 12 for annual, 1 for monthly

  -- Buyer info (no account required)
  buyer_name                text,
  buyer_email               text        NOT NULL,
  personal_message          text,       -- optional message shown in gift email

  -- Recipient info
  recipient_email           text        NOT NULL,
  recipient_name            text,

  -- Stripe
  stripe_payment_intent_id  text,       -- for refund lookup
  stripe_referral_coupon_id text,       -- Stripe coupon ID (25% off, reusable)
  stripe_referral_code      text,       -- Stripe promotion code string (e.g. SCOUT-AB12-CD34)

  -- Redemption
  redeemed_by               uuid        REFERENCES auth.users(id),
  redeemed_at               timestamptz,
  child_id                  uuid        REFERENCES children(id),

  -- Expiry: unredeemed gifts expire after 1 year
  expires_at                timestamptz NOT NULL DEFAULT (now() + interval '1 year'),

  created_at                timestamptz NOT NULL DEFAULT now()
);

-- Index for code lookup (hot path — called on redemption)
CREATE INDEX IF NOT EXISTS scout_gifts_code_idx          ON scout_gifts (code);
CREATE INDEX IF NOT EXISTS scout_gifts_recipient_email   ON scout_gifts (recipient_email);
CREATE INDEX IF NOT EXISTS scout_gifts_buyer_email       ON scout_gifts (buyer_email);

-- RLS: service role only (no direct client access)
ALTER TABLE scout_gifts ENABLE ROW LEVEL SECURITY;

-- ─── Stripe referral coupons ──────────────────────────────────────────────────
-- One master coupon record per referral program.
-- In practice, we create one Stripe coupon (25% off) and generate
-- a unique promotion code per buyer that references it.

CREATE TABLE IF NOT EXISTS scout_referral_coupons (
  id                  uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id    text  UNIQUE NOT NULL,  -- e.g. coup_xxxxxxxx
  percent_off         int   NOT NULL DEFAULT 25,
  description         text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scout_referral_coupons ENABLE ROW LEVEL SECURITY;
