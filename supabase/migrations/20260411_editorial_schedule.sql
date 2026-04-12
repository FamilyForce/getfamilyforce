-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Editorial schedule system
-- Date: 2026-04-11
--
-- 1. Deploy screening-visit-1month (content existed in update-windows-v3.sql but was never applied)
-- 2. Create cognitive-sleep-regression-4month (new window, approved)
-- 3. Create self-help-daytime-dryness (new window, approved)
-- 4. Create social-sharing-scaffolding (new window, approved)
-- 5. Merge social smile duplicates: keep language-social-smile, remove social-social-smile-appears
-- 6. Create scout_editorial_schedule table
-- 7. Populate all 36 months × 3 slots
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. screening-visit-1month ────────────────────────────────────────────────
INSERT INTO milestone_windows (
  slug, title, category, urgency,
  open_age_weeks, peak_age_weeks, close_age_weeks,
  priority, window_type, why_it_matters, what_to_do,
  what_not_to_worry, missed_window, source_citation,
  prenatal, active
) VALUES (
  'screening-visit-1month',
  '1-month well-child visit',
  'screening',
  'screening',
  1, 4, 6,
  1, 'milestone',
  'The 1-month visit is the first well-child check after the newborn visit at 3 to 5 days. Most parents don''t realize it exists — it''s not as well publicized as the 2-month visit — but it''s on the AAP Periodicity Schedule for good reason. Your baby should be back to birth weight by now, feeding is either established or struggling, and postpartum depression in the primary caregiver is at or near its peak. This visit catches problems early, before they compound.',
  '* Schedule this visit before you leave the hospital — it should happen at 3 to 5 weeks of age
* Bring a list of feeding questions: how often, how long, how much weight gained since discharge
* The pediatrician will ask about your mood. Answer honestly. This is not a judgment — it''s a screen for postpartum depression, which is treatable and common.
* Vaccine given at this visit: Hepatitis B (dose 2, if not already given at the newborn visit)
* What to watch for before this visit: baby not back to birth weight by week 2 to 3, feeding taking more than 45 minutes per session, any yellowing of skin or eyes persisting past 2 weeks',
  'The social smile hasn''t arrived yet for most babies at 1 month — it typically emerges around 6 to 8 weeks. Your pediatrician will look for early signs but won''t flag its absence at this visit.',
  'If the 1-month visit didn''t happen, flag any concerns about feeding, weight gain, or postpartum mood at the 2-month visit. Don''t wait.',
  'AAP Bright Futures Periodicity Schedule (2023); AAP Clinical Report on Incorporating Recognition and Management of Perinatal Depression Into Pediatric Practice (2019); CDC Immunization Schedule (2024)',
  false, true
)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  urgency           = EXCLUDED.urgency,
  open_age_weeks    = EXCLUDED.open_age_weeks,
  peak_age_weeks    = EXCLUDED.peak_age_weeks,
  close_age_weeks   = EXCLUDED.close_age_weeks,
  priority          = EXCLUDED.priority,
  why_it_matters    = EXCLUDED.why_it_matters,
  what_to_do        = EXCLUDED.what_to_do,
  what_not_to_worry = EXCLUDED.what_not_to_worry,
  missed_window     = EXCLUDED.missed_window,
  source_citation   = EXCLUDED.source_citation,
  active            = EXCLUDED.active,
  updated_at        = NOW();

-- ─── 2. cognitive-sleep-regression-4month ────────────────────────────────────
INSERT INTO milestone_windows (
  slug, title, category, urgency,
  open_age_weeks, peak_age_weeks, close_age_weeks,
  priority, window_type, why_it_matters, what_to_do,
  what_not_to_worry, missed_window, source_citation,
  prenatal, active
) VALUES (
  'cognitive-sleep-regression-4month',
  'The 4-month sleep regression — what it is and what to do',
  'cognitive',
  'advisory',
  14, 17, 22,
  2, 'milestone',
  'Around 3.5 to 5 months, most babies who were previously sleeping well suddenly start waking more frequently. This is not a setback — it is the brain permanently reorganizing its sleep architecture. Until now, babies fell directly into deep sleep. At 4 months, the brain restructures sleep cycling: infants begin alternating between light and deep sleep every 45 to 50 minutes, the same pattern adults use. At each light-sleep transition, they briefly surface. Babies who were nursed or rocked to sleep in the past now can''t reconnect to sleep on their own at these partial arousals — and wake fully instead. This is developmental progress wearing the costume of a problem. The regression does not reverse. The architecture change is permanent.',
  '* Establish a consistent, short pre-sleep routine now if you haven''t: bath, feed, song, put down — in the same order every time. The routine signals sleep without becoming a prop.
* Practice drowsy-but-awake: put the baby down while still drowsy, before they''re fully asleep. This gives them the chance to practise falling asleep in the cot, in the dark, without being held.
* Audit your current sleep associations: if your baby only falls asleep nursing, rocking, or being held, this is the moment that association becomes a problem — at every 45-minute arousal, they''ll need the same thing to return to sleep.
* Night feeds are still normal and expected at 4 months. The goal is not to eliminate feeds — it''s to reduce the need for active parental intervention at every single waking.
* If you''re not ready to change anything yet, that''s okay. Knowing what''s happening is still useful.',
  'The word "regression" implies going backward. This is actually forward — sleep architecture is maturing. Babies who never seemed to have a 4-month regression either had their sleep disrupted early enough that no one noticed the change, or were naturally flexible sleepers. More frequent waking in months 3 to 5 is developmentally normal, not a sign anything is wrong.',
  'If the regression has come and gone and sleep is still disrupted, this is now a sleep association issue, not a developmental phase. The brain has already restructured — what remains is a learned pattern. A consistent bedtime routine, drowsy-but-awake practice, and gradual reduction of parental props will address it. A pediatric sleep consultant can help if needed.',
  'Anders & Keener (1985), Infant Sleep-Wake State Development; Mindell et al. (2010), Behavioral Treatment of Bedtime Problems and Night Wakings; Henderson et al. (2010), Sleeping Through the Night; AAP Safe Sleep Guidelines (2022)',
  false, true
)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  urgency           = EXCLUDED.urgency,
  open_age_weeks    = EXCLUDED.open_age_weeks,
  peak_age_weeks    = EXCLUDED.peak_age_weeks,
  close_age_weeks   = EXCLUDED.close_age_weeks,
  priority          = EXCLUDED.priority,
  why_it_matters    = EXCLUDED.why_it_matters,
  what_to_do        = EXCLUDED.what_to_do,
  what_not_to_worry = EXCLUDED.what_not_to_worry,
  missed_window     = EXCLUDED.missed_window,
  source_citation   = EXCLUDED.source_citation,
  active            = EXCLUDED.active,
  updated_at        = NOW();

-- ─── 3. self-help-daytime-dryness ────────────────────────────────────────────
INSERT INTO milestone_windows (
  slug, title, category, urgency,
  open_age_weeks, peak_age_weeks, close_age_weeks,
  priority, window_type, why_it_matters, what_to_do,
  what_not_to_worry, missed_window, source_citation,
  prenatal, active
) VALUES (
  'self-help-daytime-dryness',
  'Daytime dryness — the potty training finish line',
  'motor',
  'advisory',
  117, 130, 156,
  2, 'milestone',
  'After learning the mechanics of the potty, the real milestone is reliable daytime dryness: the child recognises urgency in time, can hold for a reasonable period, communicates the need (or handles it independently), and stays dry across normal daily activities. This is different from potty training initiation — it is the finish line. Research by Schum et al. (2002), tracking 267 healthy children, found the median age for reliable daytime dryness was 32.5 months in girls and 35 months in boys. Accidents are developmentally normal through age 3.5. Pressure to be dry before the child''s bladder and cortical control are ready produces anxiety, not dryness.',
  '* Build in regular, low-pressure bathroom stops every 90 to 120 minutes during waking hours — before leaving the house, before meals, before naps. These become habits.
* Dress the child in clothing they can manage independently: elastic waistbands, no overalls, no buttons at the waist. Self-sufficiency reduces accidents.
* When accidents happen, respond matter-of-factly: help them change, no commentary, move on. Shame extends the timeline — it doesn''t shorten it.
* Celebrate dry stretches, not individual successes. "You stayed dry all morning" lands better than constant potty praise, which creates performance anxiety.
* Drop pull-ups during daytime if you haven''t already — they absorb accidents without consequence, which removes the feedback loop the child needs to learn.',
  'Occasional accidents after reliable dryness is achieved are normal through age 4, especially during excitement, fatigue, or transitions. A regression to accidents after a new sibling, a house move, or starting preschool is common and usually resolves within a few weeks. It is not a sign of a medical or developmental problem unless it persists beyond 6 weeks or the child also begins wetting at night after previously being dry.',
  'If your child is past 3.5 years and still having regular daytime accidents, raise it at the 36-month well-child visit. Persistent daytime wetting can occasionally indicate bladder urgency, urinary tract infection, or developmental factors worth ruling out. Most cases resolve with routine and time; a small number benefit from specialist input.',
  'Schum et al. (2002), Sequential Acquisition of Toilet-Training Skills; Brazelton (1962), A Child-Oriented Approach to Toilet Training; American Academy of Pediatrics Toilet Training Guidelines (2023); Stadtler et al. (1999), Toilet Training Methods, Clinical Interventions and Recommendations',
  false, true
)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  urgency           = EXCLUDED.urgency,
  open_age_weeks    = EXCLUDED.open_age_weeks,
  peak_age_weeks    = EXCLUDED.peak_age_weeks,
  close_age_weeks   = EXCLUDED.close_age_weeks,
  priority          = EXCLUDED.priority,
  why_it_matters    = EXCLUDED.why_it_matters,
  what_to_do        = EXCLUDED.what_to_do,
  what_not_to_worry = EXCLUDED.what_not_to_worry,
  missed_window     = EXCLUDED.missed_window,
  source_citation   = EXCLUDED.source_citation,
  active            = EXCLUDED.active,
  updated_at        = NOW();

-- ─── 4. social-sharing-scaffolding ───────────────────────────────────────────
INSERT INTO milestone_windows (
  slug, title, category, urgency,
  open_age_weeks, peak_age_weeks, close_age_weeks,
  priority, window_type, why_it_matters, what_to_do,
  what_not_to_worry, missed_window, source_citation,
  prenatal, active
) VALUES (
  'social-sharing-scaffolding',
  'Sharing is developmentally appropriate now — gentle scaffolding',
  'social',
  'advisory',
  130, 152, 182,
  3, 'milestone',
  'Genuine voluntary sharing — giving up something you want, when you don''t have to — is cognitively complex. It requires theory of mind (understanding the other child wants the thing), impulse control (overriding the desire to keep it), and trust (believing the thing will come back, or that giving earns social goodwill). Brownell et al. (2009) found that truly prosocial sharing — initiated voluntarily without adult pressure — does not emerge consistently until age 3 to 3.5. Before this window, demanding that a child share produces compliance-under-duress, not prosocial behaviour. After it, you can scaffold the real thing. The distinction matters because children who are forced to share before they''re ready learn that adults override their autonomy when others want their possessions — which erodes trust without teaching empathy.',
  '* Name it explicitly when you see it happen naturally: "You gave Mia the red crayon. That was kind." Labelling the behaviour reinforces it more than praise.
* Model it yourself, narrating: "I''m going to share my water with you. Here — take some."
* Set up structured turn-taking games before expecting spontaneous sharing: "Your turn, then Luca''s turn, then your turn again." Turn-taking is easier than pure sharing because the child gets it back.
* When sharing is hard, validate the feeling first: "You really love that truck. It''s hard to share something you love." Then scaffold: "Can Luca have it for two minutes, and then it comes back to you?"
* Avoid forced sharing. "Give that to your sister right now" teaches hierarchy, not empathy.',
  'A 2-year-old who refuses to share is not selfish — they are 2. Possessiveness at this age is developmentally appropriate; the concept of "mine" appears around 18 to 24 months, and "yours" comes later. By age 4, most children share willingly with friends (though not always with siblings — sibling dynamics operate differently and sibling sharing conflicts are normal through school age).',
  'If a child past 4.5 years consistently refuses to share, snatches others'' belongings, or has significant difficulty in peer play around possession, mention it at the next well-child visit. It can occasionally indicate social-emotional development patterns worth monitoring, but in most cases is a family dynamics or parenting approach question.',
  'Brownell et al. (2009), Socialization of Early Prosocial Behaviour; Hay & Murray (1982), Giving and Requesting: Social Facilitation of Infants'' Offers to Adults; Warneken & Tomasello (2009), The Roots of Human Altruism; AAP Developmental Milestones (2024)',
  false, true
)
ON CONFLICT (slug) DO UPDATE SET
  title             = EXCLUDED.title,
  urgency           = EXCLUDED.urgency,
  open_age_weeks    = EXCLUDED.open_age_weeks,
  peak_age_weeks    = EXCLUDED.peak_age_weeks,
  close_age_weeks   = EXCLUDED.close_age_weeks,
  priority          = EXCLUDED.priority,
  why_it_matters    = EXCLUDED.why_it_matters,
  what_to_do        = EXCLUDED.what_to_do,
  what_not_to_worry = EXCLUDED.what_not_to_worry,
  missed_window     = EXCLUDED.missed_window,
  source_citation   = EXCLUDED.source_citation,
  active            = EXCLUDED.active,
  updated_at        = NOW();

-- ─── 5. Social smile: only one slug exists in DB (social-social-smile-appears)
-- No merge needed — language-social-smile was never deployed to production.
-- No-op placeholder kept for migration log clarity.

-- ─── 6. Create scout_editorial_schedule table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS scout_editorial_schedule (
  month  integer NOT NULL CHECK (month BETWEEN 0 AND 36),
  slot   integer NOT NULL CHECK (slot BETWEEN 1 AND 3),
  slug   text    NOT NULL,
  PRIMARY KEY (month, slot),
  CONSTRAINT fk_editorial_slug
    FOREIGN KEY (slug) REFERENCES milestone_windows(slug)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

COMMENT ON TABLE scout_editorial_schedule IS
  'Defines 3 editorially-curated windows per month (0–36). The digest shows these first, '
  'in slot order, regardless of open/close timing. Completed windows are skipped and the '
  'algorithm fills remaining slots.';

-- RLS: readable by all authenticated users (digest function uses service role)
ALTER TABLE scout_editorial_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editorial schedule is publicly readable"
  ON scout_editorial_schedule FOR SELECT
  USING (true);

-- ─── 7. Populate editorial schedule (months 1–36) ────────────────────────────
-- Upsert so migration is re-runnable
INSERT INTO scout_editorial_schedule (month, slot, slug) VALUES
  -- Month 1
  (1,  1, 'screening-visit-1month'),
  (1,  2, 'motor-tummy-time-build'),
  (1,  3, 'social-parent-depression-screening'),
  -- Month 2
  (2,  1, 'screening-visit-2months'),
  (2,  2, 'social-social-smile-appears'),
  (2,  3, 'language-serve-return'),
  -- Month 3
  (3,  1, 'motor-head-control'),
  (3,  2, 'language-laughing'),
  (3,  3, 'social-bedtime-routine-security'),
  -- Month 4
  (4,  1, 'cognitive-sleep-regression-4month'),
  (4,  2, 'screening-visit-4months'),
  (4,  3, 'motor-roll-tummy-to-back'),
  -- Month 5
  (5,  1, 'nutrition-solids-readiness'),
  (5,  2, 'nutrition-iron-supplement-breastfed'),
  (5,  3, 'social-primary-attachment'),
  -- Month 6
  (6,  1, 'screening-visit-6months'),
  (6,  2, 'nutrition-first-purees'),
  (6,  3, 'motor-sitting-unsupported'),
  -- Month 7
  (7,  1, 'safety-babyproofing'),
  (7,  2, 'language-responds-to-name'),
  (7,  3, 'nutrition-dairy-intro'),
  -- Month 8
  (8,  1, 'nutrition-egg-intro'),
  (8,  2, 'language-babbling'),
  (8,  3, 'nutrition-tree-nut-intro'),
  -- Month 9
  (9,  1, 'screening-visit-9months'),
  (9,  2, 'nutrition-peanut-intro'),
  (9,  3, 'nutrition-sesame-intro'),
  -- Month 10
  (10, 1, 'nutrition-fish-intro'),
  (10, 2, 'social-peek-a-boo'),
  (10, 3, 'motor-pull-to-stand'),
  -- Month 11
  (11, 1, 'motor-cruising'),
  (11, 2, 'language-mama-dada-specific'),
  (11, 3, 'screening-dental-first-visit'),
  -- Month 12
  (12, 1, 'screening-visit-12months'),
  (12, 2, 'language-read-aloud-daily'),
  (12, 3, 'nutrition-cows-milk-switch'),
  -- Month 13
  (13, 1, 'motor-first-steps'),
  (13, 2, 'language-first-words'),
  (13, 3, 'nutrition-bottle-weaning'),
  -- Month 14
  (14, 1, 'language-joint-attention-pointing'),
  (14, 2, 'motor-walking-independent'),
  (14, 3, 'cognitive-identifies-body-parts'),
  -- Month 15
  (15, 1, 'screening-visit-15months'),
  (15, 2, 'language-vocab-10-words'),
  (15, 3, 'cognitive-pretend-play-emerging'),
  -- Month 16
  (16, 1, 'social-label-big-feelings'),
  (16, 2, 'language-1step-commands'),
  (16, 3, 'motor-stair-climbing'),
  -- Month 17
  (17, 1, 'social-separation-anxiety'),
  (17, 2, 'nutrition-spoon-self-feeding'),
  (17, 3, 'social-parallel-play'),
  -- Month 18
  (18, 1, 'screening-visit-18months-autism'),
  (18, 2, 'language-2-word-combinations'),
  (18, 3, 'social-tantrums-peak'),
  -- Month 19
  (19, 1, 'social-independence-me-do-it'),
  (19, 2, 'language-vocab-50-words'),
  (19, 3, 'social-self-regulation'),
  -- Month 20
  (20, 1, 'language-question-asking'),
  (20, 2, 'cognitive-matches-shapes-colors'),
  (20, 3, 'language-body-parts-5'),
  -- Month 21
  (21, 1, 'language-speech-clarity-family'),
  (21, 2, 'social-empathy-emerging'),
  (21, 3, 'cognitive-function-of-objects'),
  -- Month 22
  (22, 1, 'language-vocab-200-words'),
  (22, 2, 'language-2step-commands'),
  (22, 3, 'language-pronouns'),
  -- Month 23
  (23, 1, 'motor-jumping-both-feet'),
  (23, 2, 'cognitive-pretend-play-complex'),
  (23, 3, 'cognitive-big-little'),
  -- Month 24
  (24, 1, 'screening-visit-24months-autism'),
  (24, 2, 'nutrition-2pct-milk-switch'),
  (24, 3, 'cognitive-same-different'),
  -- Month 25
  (25, 1, 'language-3-word-sentences'),
  (25, 2, 'cognitive-memory-recalls-events'),
  (25, 3, 'social-cooperative-play'),
  -- Month 26 (slot 1 = language-stranger-understands-50pct: clinical, closing at 117w)
  (26, 1, 'language-stranger-understands-50pct'),
  (26, 2, 'language-names-colors'),
  (26, 3, 'cognitive-counts-to-10'),
  -- Month 27
  (27, 1, 'self-help-potty-readiness'),
  (27, 2, 'motor-catching-ball'),
  (27, 3, 'language-stranger-understands-75pct'),
  -- Month 28
  (28, 1, 'cognitive-humor-jokes'),
  (28, 2, 'cognitive-time-concepts'),
  (28, 3, 'social-named-friendships'),
  -- Month 29
  (29, 1, 'cognitive-preschool-readiness'),
  (29, 2, 'motor-balance-one-foot'),
  (29, 3, 'language-counts-objects-5'),
  -- Month 30
  (30, 1, 'screening-visit-30months'),
  (30, 2, 'safety-crib-to-bed-transition'),
  (30, 3, 'self-help-daytime-dryness'),
  -- Month 31
  (31, 1, 'social-peer-friendships'),
  (31, 2, 'cognitive-number-quantity'),
  (31, 3, 'self-help-dressing-simple-clothes'),
  -- Month 32
  (32, 1, 'language-knows-name-age'),
  (32, 2, 'motor-hopping-one-foot'),
  (32, 3, 'self-help-tooth-brushing'),
  -- Month 33
  (33, 1, 'social-imaginary-friends'),
  (33, 2, 'language-tells-stories'),
  (33, 3, 'language-complex-instructions'),
  -- Month 34
  (34, 1, 'motor-drawing-circle'),
  (34, 2, 'social-gratitude-empathy-practice'),
  (34, 3, 'motor-tricycle-balance-bike'),
  -- Month 35
  (35, 1, 'safety-forward-facing-transition'),
  (35, 2, 'language-counts-to-3'),
  (35, 3, 'social-sharing-scaffolding'),
  -- Month 36
  (36, 1, 'screening-visit-36months'),
  (36, 2, 'language-full-sentences'),
  (36, 3, 'social-consistent-discipline')
ON CONFLICT (month, slot) DO UPDATE SET
  slug = EXCLUDED.slug;

-- ─── Verify ───────────────────────────────────────────────────────────────────
SELECT COUNT(*) AS editorial_rows FROM scout_editorial_schedule;
-- Expected: 108 (36 months × 3 slots)

SELECT slug FROM milestone_windows WHERE slug IN (
  'screening-visit-1month',
  'cognitive-sleep-regression-4month',
  'self-help-daytime-dryness',
  'social-sharing-scaffolding'
);
-- Expected: 4 rows

SELECT COUNT(*) AS social_smile_duplicates
FROM milestone_windows
WHERE slug = 'social-social-smile-appears';
-- Expected: 0
