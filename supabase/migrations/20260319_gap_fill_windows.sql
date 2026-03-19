-- Migration: Add 3 gap-fill windows to clear zero-closing months (14, 22, 33)
-- Created: 2026-03-19

INSERT INTO milestone_windows (slug, title, open_age_weeks, peak_age_weeks, close_age_weeks, urgency_tier, priority, window_type) VALUES
  ('language-receptive-vocabulary', 'Understands 50+ words — receptive language leads the way', 43, 52, 61, 'advisory', 2, 'milestone'),
  ('social-comforting-behavior', 'Comforting others — offering a hug or toy when someone seems sad', 74, 82, 95, 'advisory', 3, 'milestone'),
  ('self-help-daytime-dryness', 'Daytime dryness established — the finish line for potty training', 120, 130, 143, 'advisory', 2, 'milestone');
