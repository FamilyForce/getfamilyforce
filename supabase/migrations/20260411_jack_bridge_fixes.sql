-- ─── jack_bridge fixes — 5 must-fix + 4 polish ──────────────────────────────
-- Approved by jackhowdy 2026-04-11

-- 🔴 Must fix

-- 1. screening-visit-1month — duplicate opening, rewritten
UPDATE milestone_windows SET jack_bridge = 'The 1-month visit is the AAP''s first post-discharge checkpoint — it''s not optional.'
  WHERE slug = 'screening-visit-1month';

-- 2. motor-walking-independent — factual error ("cruising" → "walking")
UPDATE milestone_windows SET jack_bridge = 'The clinical red flag is 18 months — a child not yet walking at 15 months is still developing normally.'
  WHERE slug = 'motor-walking-independent';

-- 3. cognitive-counts-to-10 — near-duplicate + confusing ending
UPDATE milestone_windows SET jack_bridge = 'Reciting 1 to 10 is sequence memory — understanding one-to-one correspondence comes much later.'
  WHERE slug = 'cognitive-counts-to-10';

-- 4. language-counts-to-3 — near-duplicate, differentiated
UPDATE milestone_windows SET jack_bridge = 'Counting to 3 with one-to-one correspondence is a different skill than reciting numbers — and this is when it first appears.'
  WHERE slug = 'language-counts-to-3';

-- 5. social-named-friendships — near-duplicate of social-peer-friendships
UPDATE milestone_windows SET jack_bridge = 'By this age, friendship is mutual — they know who they want, and that child knows them back.'
  WHERE slug = 'social-named-friendships';

-- ⚠️ Polish

-- 6. social-skin-to-skin — tone: less hyperbolic
UPDATE milestone_windows SET jack_bridge = 'The first hour after birth is when skin-to-skin contact has its highest physiological impact.'
  WHERE slug = 'social-skin-to-skin';

-- 7. safety-water-supervision — names drowning explicitly
UPDATE milestone_windows SET jack_bridge = 'Drowning is the leading cause of death for children ages 1–4 — and two inches of water is enough.'
  WHERE slug = 'safety-water-supervision';

-- 8. language-asks-why — corrected stat (300/day vs 100/hr)
UPDATE milestone_windows SET jack_bridge = 'Up to 300 questions a day — and the quality of your answers predicts their scientific reasoning.'
  WHERE slug = 'language-asks-why';

-- 9. social-caregiver-transition — "handoff" replaced with clearer framing
UPDATE milestone_windows SET jack_bridge = 'Your calm at the first drop-off sets the tone for every one after it.'
  WHERE slug = 'social-caregiver-transition';
