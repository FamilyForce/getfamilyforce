-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: prenatal milestone window week values to use negative numbers
-- "Week 6 before birth" → open_age_weeks = -6
-- ageWeeks(dueDate) returns NEGATIVE for expecting parents, so windows must
-- use negative values to match.
-- Run in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE milestone_windows SET open_age_weeks = -6,  close_age_weeks = 0  WHERE slug = 'prebirth-safe-sleep-setup';
UPDATE milestone_windows SET open_age_weeks = -6,  close_age_weeks = 0  WHERE slug = 'prebirth-hospital-bag';
UPDATE milestone_windows SET open_age_weeks = -10, close_age_weeks = 0  WHERE slug = 'prebirth-pediatrician-selection';
UPDATE milestone_windows SET open_age_weeks = -4,  close_age_weeks = 1  WHERE slug = 'prebirth-newborn-screening';

-- Verify
SELECT slug, open_age_weeks, close_age_weeks, prenatal
FROM milestone_windows
WHERE prenatal = true
ORDER BY open_age_weeks;
