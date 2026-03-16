-- ═══════════════════════════════════════════════════════════════
-- FamilyForce Scout — Populate playbook_link on milestone_windows
-- Run in Supabase SQL Editor.
-- Maps windows to the most relevant FamilyForce guidebook.
-- Safe to run multiple times (uses targeted WHERE conditions).
-- ═══════════════════════════════════════════════════════════════

-- ─── Potty Training → /playbook-potty-training.html ──────────────────────────
UPDATE milestone_windows
SET playbook_link = '/playbook-potty-training.html'
WHERE playbook_link IS NULL
  AND (
    title ILIKE '%potty%'
    OR title ILIKE '%toilet%'
    OR title ILIKE '%bladder%'
    OR title ILIKE '%bowel%'
    OR title ILIKE '%diaper%'
    OR title ILIKE '%nappy%'
    OR (category = 'motor' AND open_age_weeks >= 65)   -- motor windows 15mo+
  );

-- ─── Sleep Training → /playbook-sleep.html ───────────────────────────────────
UPDATE milestone_windows
SET playbook_link = '/playbook-sleep.html'
WHERE playbook_link IS NULL
  AND (
    title ILIKE '%sleep%'
    OR title ILIKE '%bedtime%'
    OR title ILIKE '%night wak%'
    OR title ILIKE '%nap%'
    OR title ILIKE '%settle%'
    OR title ILIKE '%self-sooth%'
    OR title ILIKE '%drowsy%'
  );

-- ─── Tantrum Tamer → /playbook-tantrum.html ──────────────────────────────────
UPDATE milestone_windows
SET playbook_link = '/playbook-tantrum.html'
WHERE playbook_link IS NULL
  AND (
    title ILIKE '%tantrum%'
    OR title ILIKE '%meltdown%'
    OR title ILIKE '%emotional regulat%'
    OR title ILIKE '%temper%'
    OR title ILIKE '%frustrat%'
    OR title ILIKE '%aggress%'
    OR title ILIKE '%biting%'
    OR title ILIKE '%hitting%'
  );

-- ─── Good Eater Guide → /playbook-feeding.html ───────────────────────────────
UPDATE milestone_windows
SET playbook_link = '/playbook-feeding.html'
WHERE playbook_link IS NULL
  AND (
    category = 'nutrition'
    OR title ILIKE '%solid%'
    OR title ILIKE '%wean%'
    OR title ILIKE '%breastfeed%'
    OR title ILIKE '%formula%'
    OR title ILIKE '%picky eat%'
    OR title ILIKE '%food refus%'
    OR title ILIKE '%allerg%'
    OR title ILIKE '%peanut%'
  );

-- ─── Digital Guardian → /playbook-free-screentime.html ──────────────────────
UPDATE milestone_windows
SET playbook_link = '/playbook-free-screentime.html'
WHERE playbook_link IS NULL
  AND (
    title ILIKE '%screen%'
    OR title ILIKE '%media%'
    OR title ILIKE '%digital%'
    OR title ILIKE '%device%'
    OR title ILIKE '%television%'
    OR title ILIKE '%TV%'
    OR title ILIKE '%tablet%'
    OR title ILIKE '%phone%'
  );

-- ─── Verify results ───────────────────────────────────────────────────────────
SELECT
  playbook_link,
  COUNT(*) as window_count
FROM milestone_windows
GROUP BY playbook_link
ORDER BY window_count DESC;
