-- ═══════════════════════════════════════════════════════════════
-- Migration: fix playbook_link URLs in milestone_windows
-- Date: 2026-03-18
--
-- Issues:
--   1. "screen" keyword in PLAYBOOK_MAP matched "newborn-screening"
--      → those windows wrongly point to the screen-time playbook
--   2. All URLs missing https:// prefix and .html suffix
-- ═══════════════════════════════════════════════════════════════

-- 1. Clear incorrect screen-time links on non-screen-time windows
--    (any window whose slug contains "screen" but NOT "screen-time")
UPDATE milestone_windows
SET playbook_link = NULL
WHERE playbook_link LIKE '%screen-time%'
  AND slug NOT LIKE '%screen-time%'
  AND slug NOT LIKE '%screentime%'
  AND slug NOT LIKE '%digital%'
  AND slug NOT LIKE '%media%';

-- 2. Fix URL format: add https:// and .html where missing
UPDATE milestone_windows
SET playbook_link = 'https://getfamilyforce.com/playbook-sleep.html'
WHERE playbook_link IN (
  'getfamilyforce.com/playbook-sleep',
  '/playbook-sleep',
  '/playbook-sleep.html',
  'https://getfamilyforce.com/playbook-sleep'
);

UPDATE milestone_windows
SET playbook_link = 'https://getfamilyforce.com/playbook-potty-training.html'
WHERE playbook_link IN (
  'getfamilyforce.com/playbook-potty-training',
  '/playbook-potty-training',
  '/playbook-potty-training.html',
  'https://getfamilyforce.com/playbook-potty-training'
);

UPDATE milestone_windows
SET playbook_link = 'https://getfamilyforce.com/playbook-feeding.html'
WHERE playbook_link IN (
  'getfamilyforce.com/playbook-feeding',
  '/playbook-feeding',
  '/playbook-feeding.html',
  'https://getfamilyforce.com/playbook-feeding'
);

UPDATE milestone_windows
SET playbook_link = 'https://getfamilyforce.com/playbook-tantrum.html'
WHERE playbook_link IN (
  'getfamilyforce.com/playbook-tantrum',
  '/playbook-tantrum',
  '/playbook-tantrum.html',
  'https://getfamilyforce.com/playbook-tantrum'
);

UPDATE milestone_windows
SET playbook_link = 'https://getfamilyforce.com/playbook-screen-time.html'
WHERE playbook_link IN (
  'getfamilyforce.com/playbook-screen-time',
  '/playbook-screen-time',
  '/playbook-screen-time.html',
  'https://getfamilyforce.com/playbook-screen-time'
);

-- 3. Verify
SELECT playbook_link, COUNT(*) as windows
FROM milestone_windows
GROUP BY playbook_link
ORDER BY windows DESC;
