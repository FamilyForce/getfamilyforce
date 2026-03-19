-- Add window_type to milestone_windows
-- milestone = time-bound action (shows in email + app)
-- reminder  = ongoing habit (app only, collapsible section)
-- Applied: 2026-03-19

ALTER TABLE milestone_windows
ADD COLUMN IF NOT EXISTS window_type text NOT NULL DEFAULT 'milestone'
CHECK (window_type IN ('milestone', 'reminder'));

-- Tag the 17 reminder-type windows
UPDATE milestone_windows SET window_type = 'reminder' WHERE slug IN (
  'safety-choking-awareness',
  'nutrition-choking-hazards',
  'language-screen-time-displacement',
  'social-self-regulation',
  'screening-hearing-rescreen',
  'safety-rear-facing-as-long-as-possible',
  'nutrition-juice-limit',
  'nutrition-iron-rich-ongoing',
  'language-bilingual-note',
  'language-narrate-meals',
  'language-books-in-home',
  'cognitive-attention-span',
  'cognitive-outdoor-exploration',
  'cognitive-music-rhythm',
  'social-imaginary-friends',
  'social-gratitude-empathy-practice',
  'cognitive-block-play'
);
