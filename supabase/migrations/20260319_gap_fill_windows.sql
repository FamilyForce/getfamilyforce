-- Migration: Add 3 gap-fill windows to clear zero-closing months (14, 22, 33)
-- Created: 2026-03-19

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('language-receptive-vocabulary', 'Understands 50+ words — receptive language leads the way', 'language', 43, 52, 61, 'advisory', 2, 'milestone',
   'Receptive language — words a child understands — always develops ahead of expressive language — words they can say. By 14 months, most children understand 50 or more words even though they may only say 5 to 10. This gap is normal and expected. However, a child who does not appear to understand common words, names, and simple instructions by 14 months is worth monitoring, as receptive delays can be an earlier indicator of language or hearing issues than expressive delays.',
   '* Test receptive vocabulary with natural prompts: "Where is the dog?" "Can you bring me the cup?" "Show me your shoes."
* If the child looks, points, or retrieves the correct object, they understand it — even if they cannot say it
* Continue narrating daily life: every word you use builds the receptive vocabulary bank
* Read aloud daily — pointing to pictures and naming them builds word-to-object mapping');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('social-comforting-behavior', 'Comforting others — offering a hug or toy when someone seems sad', 'social', 74, 82, 95, 'advisory', 3, 'milestone',
   'Between 17 and 22 months, most toddlers begin showing early prosocial behavior: patting a crying person, offering their own comfort object to someone who appears distressed, or attempting to wipe someone''s tears. This is not yet empathy in the adult sense — it is the earliest precursor to it. The child is registering emotional states in others and responding with a behavior intended to help. It is one of the most meaningful early social milestones, and one parents often miss because it appears spontaneous and brief.',
   '* When you are mildly upset or pretend to be, name the emotion and observe the child''s response: "Oh, I bumped my knee. That hurt. I''m sad."
* If they approach or offer something, receive it warmly: "Thank you, that helped. You are so caring."
* Model comforting behavior explicitly: comfort a stuffed animal in front of them, narrate what you are doing
* Read books where characters help or comfort each other: "The Invisible String," "Llama Llama Red Pajama"');

INSERT INTO milestone_windows (slug, title, category, open_age_weeks, peak_age_weeks, close_age_weeks, urgency, priority, window_type, why_it_matters, what_to_do) VALUES
  ('self-help-daytime-dryness', 'Daytime dryness established — the finish line for potty training', 'motor', 120, 130, 143, 'advisory', 2, 'milestone',
   'Most children achieve consistent daytime dryness — fewer than one accident per day, most days — between 24 and 33 months. This is the functional endpoint of daytime potty training. Nighttime dryness comes later and is a separate milestone entirely (many children are not reliably dry at night until age 5 or 6, which is normal). By 33 months, if daytime dryness is not yet established, it is worth discussing with a pediatrician — not because something is necessarily wrong, but to review technique, readiness factors, and rule out physical contributors.',
   '* If training is complete: maintain consistency in routine, especially at transitions (leaving the house, before nap, before bed)
* If still in progress: review the readiness checklist from the potty training window. If readiness signs are present but training is stalling, try a fresh three-day intensive approach
* Accidents are normal throughout this period — respond calmly, clean up together, no shame or punishment
* Nighttime training is a separate milestone — pull-ups or training pants at night are fine indefinitely at this age');
