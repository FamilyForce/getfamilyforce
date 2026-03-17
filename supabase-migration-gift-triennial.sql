-- Migration: add 'triennial' to scout_gifts plan CHECK constraint
-- Run in Supabase SQL Editor before going live with 3-year gift option

ALTER TABLE scout_gifts
  DROP CONSTRAINT IF EXISTS scout_gifts_plan_check;

ALTER TABLE scout_gifts
  ADD CONSTRAINT scout_gifts_plan_check
  CHECK (plan IN ('annual', 'triennial', 'monthly'));
