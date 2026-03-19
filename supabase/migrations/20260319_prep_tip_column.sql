-- Migration: Add prep_tip column to milestone_windows
-- Created: 2026-03-19
-- prep_tip: 2-3 sentence guidance for the parent BEFORE this window opens
-- Shown in "Get ready" section of email digest and "coming up" dashboard cards

ALTER TABLE milestone_windows ADD COLUMN IF NOT EXISTS prep_tip TEXT;
