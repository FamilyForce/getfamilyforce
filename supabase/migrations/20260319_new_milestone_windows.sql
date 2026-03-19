-- Migration: Add 18 new milestone windows to fill content gaps (months 14-35)
-- Created: 2026-03-19
-- Purpose: Fill thin months in toddler period (months 14-17, 19-23, 26-29, 31-35)

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type) VALUES
  ('self-help-open-cup',                'Transition off the sippy cup to an open cup',                              'self_help',  57,  69,  74,  'advisory', 3, 'milestone'),
  ('cognitive-cause-effect-exploration','Cause and effect play — switches, buttons, containers',                    'cognitive',  61,  69,  82,  'advisory', 3, 'milestone'),
  ('motor-stairs-descending',           'Walking downstairs with support',                                          'motor',      66,  70,  78,  'advisory', 3, 'milestone'),
  ('self-help-self-dressing-assist',    'Helping with getting dressed — arms through sleeves, pulling up pants',    'self_help',  70,  78,  86,  'advisory', 3, 'milestone'),
  ('self-help-potty-readiness',         'Potty training readiness — signs to watch for before you start',          'self_help',  79,  95, 113,  'advisory', 2, 'milestone'),
  ('language-question-asking',          'The question explosion — "What''s that?" and "Why?"',                     'language',   83,  92, 100,  'advisory', 3, 'milestone'),
  ('motor-throw-overarm',               'Overarm throwing develops',                                                'motor',      92,  96, 108,  'advisory', 3, 'milestone'),
  ('cognitive-draw-copy-lines',         'Drawing and copying lines and circles',                                    'cognitive',  92, 100, 109,  'advisory', 3, 'milestone'),
  ('cognitive-humor-jokes',             'Using humor intentionally — first jokes and silly words',                  'cognitive', 109, 117, 121,  'advisory', 3, 'milestone'),
  ('motor-tricycle-balance-bike',       'Tricycle or balance bike — first wheeled independence',                    'motor',     113, 121, 126,  'advisory', 3, 'milestone'),
  ('self-help-undressing-independently','Undressing independently — socks, shoes, and loose pants',                'self_help', 113, 121, 126,  'advisory', 3, 'milestone'),
  ('self-help-tooth-brushing',          'Tooth brushing — child takes a turn',                                     'self_help', 117, 130, 139,  'advisory', 3, 'milestone'),
  ('motor-handedness-emerging',         'Dominant hand solidifies — and why you should not try to change it',      'motor',     113, 130, 139,  'advisory', 3, 'milestone'),
  ('social-named-friendships',          'Named friendships — "I want to play with Ella"',                          'social',    131, 139, 147,  'advisory', 3, 'milestone'),
  ('motor-balance-one-foot',            'Balancing on one foot for 2 seconds',                                     'motor',     131, 143, 152,  'advisory', 3, 'milestone'),
  ('cognitive-preschool-readiness',     'Preschool readiness — what to look for before the first day',             'cognitive', 135, 143, 147,  'advisory', 2, 'milestone'),
  ('self-help-dressing-simple-clothes', 'Dressing independently with simple clothes',                              'self_help', 135, 147, 152,  'advisory', 3, 'milestone'),
  ('cognitive-number-quantity',         'Understanding that numbers mean quantities — give me two blocks',         'cognitive', 135, 147, 152,  'advisory', 3, 'milestone');
