-- ─────────────────────────────────────────────────────────────────
-- Seed 001: FamilyForce Milestones (153 records)
-- Generated from ff-advisor.js — 2026-03-12
-- Run AFTER migration 002_create_milestones.sql
-- Uses ON CONFLICT DO UPDATE so it is safe to re-run.
-- ─────────────────────────────────────────────────────────────────

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'prenatal-pediatrician',
  0, 2,
  'high',
  '🩺',
  'Before Baby Arrives',
  'Choose your pediatrician before the birth',
  'Schedule a prenatal visit with your chosen pediatrician before your due date. You want to have this relationship established before you''re exhausted, holding a newborn, and Googling "is this normal at 3am."',
  'Finding the right pediatrician feels small. It''s not.',
  '["Research pediatricians in your area who take your insurance","Schedule a prenatal meet-and-greet visit","Bring your questions — they expect this"]'::jsonb,
  NULL,
  TRUE,
  0
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'prenatal-cpr',
  0, 3,
  'high',
  '🫀',
  'Before Baby Arrives',
  'Take an infant CPR class — before the birth',
  'Thirty minutes of training. A lifetime of confidence. The Red Cross and most hospitals offer courses. This is the one thing on this list that can make a measurable difference in the worst-case scenario.',
  'Most parents never use it. All parents are glad they know it.',
  '["Book an infant CPR class before your due date","Red Cross and local hospitals both offer them"]'::jsonb,
  NULL,
  TRUE,
  1
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'prenatal-carseat',
  0, 2,
  'high',
  '🚗',
  'Before Baby Arrives',
  'Install the car seat before you go to the hospital',
  'The hospital won''t discharge you without one installed. More importantly: 72% of car seats are installed incorrectly. Many fire stations and certified technicians offer free inspections.',
  'That first drive home, ten miles per hour under the speed limit, is one you''ll remember.',
  '["Install rear-facing car seat before your due date","Get it inspected by a certified technician (free at many fire stations)","Never place rear-facing seat in front of an active airbag"]'::jsonb,
  NULL,
  TRUE,
  2
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'prenatal-supplies',
  0, 2,
  'normal',
  '🧺',
  'Before Baby Arrives',
  'Stock the specific newborn essentials',
  'Three things most parents forget before leaving the hospital: a rectal thermometer (the only accurate option for newborns), Vitamin D drops for breastfed babies (start day one), and a nasal aspirator. Everything else can wait.',
  'You don''t need everything on the list. You need the right three things.',
  '["Buy a rectal thermometer","Buy Vitamin D drops (400 IU)","Buy a NoseFrida or similar nasal aspirator"]'::jsonb,
  NULL,
  TRUE,
  3
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'prenatal-peanut-prep',
  0, 4,
  'normal',
  '🥜',
  'Before Baby Arrives',
  'Learn about the peanut introduction window now',
  'There''s a biological window between 4 and 11 months to introduce peanuts that cuts allergy risk by up to 86% (LEAP Study, NEJM 2015). Most parents miss it simply because nobody told them it existed. Now you know.',
  'One of the most important things you do in year one is add peanut butter to a puree.',
  '["Read the peanut window milestone when your baby turns 4 months","If family allergy history: ask your pediatrician about timing now"]'::jsonb,
  'feeding',
  TRUE,
  4
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'fever-newborn',
  0, 12,
  'critical',
  '🌡️',
  'Health',
  '🚨 Fever under 3 months = go to the ER',
  'Any fever ≥100.4°F (38°C) in a baby under 3 months is a go-to-the-ER situation — not a wait-until-morning call. A newborn''s immune system can''t contain bacterial infections the way an older child''s can.',
  'You''ll probably never need this one. Keep it anyway.',
  '["Know this threshold cold: 100.4°F (38°C) in under-3-months = ER now","Own a rectal thermometer — it''s the only accurate option at this age","Don''t give fever reducers before going to the ER"]'::jsonb,
  NULL,
  FALSE,
  5
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-safe-sleep',
  0, 26,
  'high',
  '😴',
  'Sleep',
  'Safe sleep: back, alone, flat',
  'Every sleep, every time: back to sleep on a firm flat surface, nothing else in the crib. Room-sharing on a separate surface for 6 months cuts SIDS risk by about half. The evidence on this one is about as strong as it gets.',
  'Watching them sleep. Just that.',
  '["Back to sleep — every nap, every night, no exceptions","Empty sleep surface: no toys, no bumpers, no pillows","Room-share on a separate surface for at least 6 months"]'::jsonb,
  'sleep',
  FALSE,
  6
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-hearing',
  0, 3,
  'high',
  '👂',
  'Health',
  'Newborn hearing screening — did it happen?',
  '1 to 3 in every 1,000 newborns has significant hearing loss. Language intervention before 6 months changes outcomes dramatically. The hospital usually handles this before discharge.',
  'The moment you realized they could hear you talking.',
  '["Confirm the hearing screen was completed before discharge","If it was missed: request it at the 3–5 day visit"]'::jsonb,
  NULL,
  FALSE,
  7
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-jaundice',
  0, 2,
  'high',
  '🟡',
  'Health',
  'Jaundice watch: days 2–7',
  'Most newborns go a little yellow from bilirubin buildup — it peaks around day 3–5 and usually clears with frequent feeding. Severe untreated jaundice can affect the brain. Frequent feeds help flush it.',
  'The yellow tint that made you call the hospital at 2am. You were right to call.',
  '["Watch for yellowing of skin and the whites of eyes","Feed frequently — this helps excrete bilirubin","Call your doctor if jaundice appears before 24 hours or gets worse after day 5"]'::jsonb,
  NULL,
  FALSE,
  8
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-weight-regain',
  0, 3,
  'high',
  '⚖️',
  'Health',
  'Back to birth weight by day 10–14',
  'Newborns lose 5–10% of their birth weight in the first few days. This is normal. They should be back at or above birth weight within 10–14 days — a key early milestone your pediatrician tracks closely.',
  'Watching those tiny numbers on the scale creep back up.',
  '["Track weight at your 3–5 day well-child visit","Feed every 2–3 hours to support regain"]'::jsonb,
  'feeding',
  FALSE,
  9
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-vitamin-d',
  0, 52,
  'high',
  '☀️',
  'Health',
  'Vitamin D drops — start this week if breastfeeding',
  'Breast milk doesn''t provide enough Vitamin D. The AAP recommends 400 IU/day starting in the first days of life. It''s a small thing with a real impact. Formula-fed babies drinking 32oz+/day don''t need the drops.',
  'One drop. Every morning. That''s it.',
  '["Pick up Vitamin D drops (400 IU) at the pharmacy","Start within the first few days if breastfeeding"]'::jsonb,
  NULL,
  FALSE,
  10
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'cpr-training',
  0, 8,
  'high',
  '🫀',
  'Health',
  'Infant CPR — take the class before sleep training age',
  'Two hours of training, once. The Red Cross and most hospitals offer it. Most parents who take it never use it. All of them are glad they know it.',
  'The confidence that comes from knowing what to do if the worst happens.',
  '["Book an infant CPR class if you haven''t already"]'::jsonb,
  NULL,
  FALSE,
  11
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'car-seat-rear',
  0, 104,
  'high',
  '🚗',
  'Health',
  'Keep them rear-facing until the seat''s limits — not just age 2',
  'AAP: Rear-facing until your child reaches the maximum height or weight for their specific seat. A child is 5 times safer rear-facing than forward-facing in a frontal crash. Age 2 is a floor, not a ceiling.',
  'Every drive is a safe drive when you got this right.',
  '["Keep rear-facing until the seat''s height and weight limit is reached","Never place rear-facing seat in front of an active airbag","Free car seat inspection: nhtsa.gov/campaign/safercarseat"]'::jsonb,
  NULL,
  FALSE,
  12
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'sunscreen-caution',
  0, 26,
  'normal',
  '☀️',
  'Health',
  'No sunscreen under 6 months',
  'AAP: Keep babies under 6 months out of direct sunlight. Use shade, hats, and protective clothing instead. Sunscreen chemicals absorb through immature skin. After 6 months, mineral sunscreen is fine.',
  'That little hat. The one they immediately pull off.',
  '["Use hats, shade, and protective clothing for sun protection","Save the sunscreen for after 6 months"]'::jsonb,
  NULL,
  FALSE,
  13
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'pacifier-sids',
  0, 26,
  'normal',
  '🍬',
  'Sleep',
  'Pacifier at sleep onset reduces SIDS risk',
  'AAP recommends offering a pacifier when putting baby down for sleep in the first 6 months — it reduces SIDS risk by up to 90%. If they don''t want it, don''t force it. If you''re breastfeeding, wait until the latch is established (3–4 weeks) before introducing.',
  'The sound of a baby contentedly sucking on a pacifier is one of the best sounds in the world.',
  '["Offer pacifier at sleep onset","Don''t force it if baby refuses","Breastfeeding: wait 3–4 weeks until latch is established first"]'::jsonb,
  'sleep',
  FALSE,
  14
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'breastfeeding-2yr',
  0, 104,
  'normal',
  '🤱',
  'Feeding',
  'Breastfeeding: the AAP raised its recommendation to 2 years',
  'In 2022, the AAP extended its recommendation from 1 year to 2 years or beyond — as long as it''s working for both of you. Breast milk continues to provide immune and nutritional benefits through the second year.',
  'However long you go, every feed you gave them mattered.',
  '["Breastfeed as long as it''s working for both of you — there''s no upper limit","Don''t let anyone rush this decision in either direction"]'::jsonb,
  'feeding',
  FALSE,
  15
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-rooting-reflex',
  0, 16,
  'normal',
  '🍼',
  'Reflexes',
  'Rooting reflex — use it',
  'Stroke your baby''s cheek and they turn toward the nipple. This is how feeding finds its way. It fades around 4 months as voluntary feeding takes over. It''s there to help you right now.',
  'That tiny head turning toward you. Built-in instinct.',
  '["Use the reflex to help with latch — stroke the cheek toward the breast or bottle"]'::jsonb,
  'feeding',
  FALSE,
  16
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-moro-reflex',
  0, 8,
  'normal',
  '😲',
  'Reflexes',
  'Moro (startle) reflex — swaddling helps',
  'A sudden noise or sensation triggers arms flying out, then pulling back. It peaks in month one and fades by month two. Swaddling keeps it from waking them up.',
  'That full-body startle that made you gasp the first time you saw it.',
  '["Swaddle to dampen the reflex during sleep","Move slowly and deliberately when laying baby down"]'::jsonb,
  'sleep',
  FALSE,
  17
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-palmar-grasp',
  0, 20,
  'normal',
  '✊',
  'Reflexes',
  'Palmar grasp reflex',
  'Touch the palm and they grip your finger with surprising strength. It fades around month 5 and gives way to reaching and grabbing on purpose.',
  'Your finger in their hand for the first time.',
  '["Let them grip your finger — it''s calming for both of you"]'::jsonb,
  NULL,
  FALSE,
  18
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-visual-8in',
  0, 6,
  'normal',
  '👁️',
  'Sensory',
  'They can see you — at exactly 8–12 inches',
  'Newborns focus best at 8–12 inches — the exact distance to your face when you''re holding them. High-contrast patterns and faces are what catch their eye. Get close when you talk to them.',
  'The moment you realized they were actually looking at YOU.',
  '["Get close when talking — 8 to 12 inches","High-contrast black/white patterns fascinate them right now"]'::jsonb,
  NULL,
  FALSE,
  19
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-tummy-time',
  0, 20,
  'high',
  '💪',
  'Motor',
  'Tummy time — every single day from day one',
  'Back-to-sleep saves lives. Tummy time builds the strength to roll, sit, crawl, and walk. They''re connected. Start with 2 minutes after each diaper change and build to 30 minutes total per day by month 4.',
  'That look on their face when they figure out how to push up. Pure surprise.',
  '["Start today — 2–3 minutes after each diaper change","Build to 30 min/day total by 4 months","A rolled towel under the chest helps newborns who resist it"]'::jsonb,
  NULL,
  FALSE,
  20
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-social-smile',
  5, 10,
  'high',
  '😊',
  'Social',
  'The social smile (6–8 weeks)',
  'The first intentional smile back at you. Not gas. This is your baby saying: I know you. It''s the beginning of serve-and-return communication — the back-and-forth that literally builds brain architecture.',
  'You will remember exactly where you were the first time this happens.',
  '["Smile at your baby all the time — they''re learning from your face","Respond to every coo and smile — they''re practicing","Worth mentioning at next visit if no social smile by 10 weeks"]'::jsonb,
  NULL,
  FALSE,
  21
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-cooing',
  5, 12,
  'normal',
  '🎶',
  'Language',
  'Cooing — their first attempt at conversation',
  'Around 6 weeks, "ooh" and "aah" sounds start. This isn''t random. They''re trying to respond to you. Imitate back. Pause. They''ll try again. That back-and-forth is how language gets built.',
  'The first time they made a sound that sounded like they meant it.',
  '["Coo back at them","Pause after you make a sound — they need a turn"]'::jsonb,
  NULL,
  FALSE,
  22
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-smooth-tracking',
  6, 12,
  'normal',
  '👁️',
  'Sensory',
  'Eyes starting to track smoothly',
  'Eyes now follow a moving object smoothly across their field of vision. Color vision is just beginning. Worth mentioning at next visit if eyes consistently cross after 4 months.',
  'Watching their eyes follow your face across the room.',
  '["Slowly move a colorful toy — watch the eyes follow","Worth mentioning at next visit if eyes consistently cross after 4 months"]'::jsonb,
  NULL,
  FALSE,
  23
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-head-45',
  6, 12,
  'normal',
  '💪',
  'Motor',
  'Lifting head 45° during tummy time',
  'A clear sign of growing neck strength. They''ll work up to 90 degrees by month 4. Every inch up takes real effort.',
  'That wobbly little head, straining up to see the world.',
  '["Keep up daily tummy time","A mirror placed in front motivates them to hold the position longer"]'::jsonb,
  NULL,
  FALSE,
  24
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-laughing',
  10, 18,
  'normal',
  '😂',
  'Social',
  'First real laugh',
  'Around 3–4 months, real laughter arrives. It requires coordinated breath and vocal control. It also requires a reason — which means they''re reading your face and finding you funny.',
  'The first belly laugh. The one that made you do it again for an hour.',
  '["Peek-a-boo, funny faces, silly sounds — this is now officially a game"]'::jsonb,
  NULL,
  FALSE,
  25
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-head-steady',
  10, 16,
  'normal',
  '👶',
  'Motor',
  'Head stays steady when held upright',
  'By 10–12 weeks, the head no longer bobs back. They can hold it upright and look around.',
  'The moment you could finally hold them outward-facing on your chest.',
  '["Hold them upright on your shoulder more — they love the new perspective"]'::jsonb,
  NULL,
  FALSE,
  26
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nb-propping',
  10, 16,
  'normal',
  '🏋️',
  'Motor',
  'Propping up on elbows',
  'From lifting the head to lifting the whole chest on two elbows. This is the tummy time payoff.',
  'That look of concentration as they figure out what their arms can do.',
  '["Place a mirror or bright toy in front — it motivates them to hold the position"]'::jsonb,
  NULL,
  FALSE,
  27
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'iron-supplement-4m',
  16, 26,
  'high',
  '💊',
  'Feeding',
  'Iron drops for breastfed babies — starts at 4 months',
  'Breast milk is low in iron. Natural stores run out around month 4. The AAP recommends 1 mg/kg of daily oral iron until iron-rich foods are established. Ask about this at the 4-month visit.',
  'One small thing that protects the brain development you can''t see happening.',
  '["Ask about iron drops at the 4-month visit","Continue until iron-rich solid foods are a regular part of meals"]'::jsonb,
  'feeding',
  FALSE,
  28
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'sleep-regression-4m',
  14, 22,
  'high',
  '😴',
  'Sleep',
  'The 4-month sleep regression — it''s real, and it''s permanent',
  'Sleep architecture changes permanently around month 4. More night wakings, shorter naps. This isn''t a phase that passes — it''s a new normal that you learn to work with. The trap: creating new dependencies now (rocking to sleep, feeding to sleep) that you''ll need to undo later.',
  'The night you realized you were up four times and started Googling at 3am. That''s this.',
  '["Expect disruption — this is real, and it''s not your fault","Avoid introducing rocking or feeding-to-sleep habits right now","Start thinking seriously about your sleep training approach"]'::jsonb,
  'sleep',
  FALSE,
  29
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'batting-at-objects',
  14, 20,
  'normal',
  '🎯',
  'Motor',
  'Batting at things — first cause and effect',
  'They''re not just watching anymore. That swipe at a hanging toy is your baby discovering: I move, things move. Their first experiment in cause and effect.',
  'Watch their face when they make something swing. That look of surprise at themselves.',
  '["Hang a soft toy within reach during floor time","Baby gyms earn their keep during this window"]'::jsonb,
  NULL,
  FALSE,
  30
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-4m',
  16, 19,
  'normal',
  '🩺',
  'Health',
  '📅 4-month well-child visit',
  'Vaccines: DTaP, Hib, IPV, PCV, Rotavirus. Developmental check covers rolling, head control, and social smiling. Ask about the 4-month sleep regression while you''re there.',
  'They cried. Then they were fine. Then they smiled at the nurse.',
  '["Schedule the 4-month visit","Ask about the sleep regression","Ask about iron drops if breastfeeding"]'::jsonb,
  NULL,
  FALSE,
  31
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'peanut-window',
  17, 48,
  'critical',
  '🥜',
  'Feeding',
  '⚠️ Peanut introduction window: 4–11 months',
  'The LEAP Study (NEJM, 2015) showed that introducing peanuts in this window reduces allergy risk by up to 86% in high-risk infants. For ALL infants, early introduction is now recommended. HIGH-RISK (severe eczema or egg allergy): see your pediatrician first. EVERYONE ELSE: mix 1/4 tsp smooth peanut butter into a puree this week.',
  'One spoonful of peanut butter in a puree. Possibly a lifetime without a peanut allergy.',
  '["HIGH-RISK (severe eczema or egg allergy): consult pediatrician before introducing","LOW-RISK: mix 1/4 tsp smooth peanut butter into fruit or veg puree","Watch for 20 minutes after first intro — hives, swelling, or vomiting = call immediately","Continue 3×/week to maintain tolerance"]'::jsonb,
  'feeding',
  FALSE,
  32
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'first-foods',
  17, 26,
  'high',
  '🥄',
  'Feeding',
  'Starting solids (4–6 months)',
  'Look for three readiness signs: head steady, showing interest in food, tongue-thrust reflex fading. Start with iron-rich foods — pureed meats or iron-fortified single-grain cereal. The order of vegetables vs. fruits vs. proteins doesn''t matter clinically. Start one new food every 3–4 days.',
  'The face they make the first time food isn''t milk. The confusion is priceless.',
  '["Wait for the three readiness signs","Start with iron-rich purees","One new food every 3–4 days"]'::jsonb,
  'feeding',
  FALSE,
  33
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'feet-discovery',
  14, 22,
  'normal',
  '🦶',
  'Motor',
  'Feet discovery: the best toys they''ll ever have',
  'Around 4 months, babies find their feet and are completely fascinated. They''ll grab them, pull them to their mouth, and chew on them. This isn''t random — it''s core strength, hip flexibility, body awareness, and sensory exploration all happening at once. No batteries required.',
  'The moment they grab their feet for the first time and their face says: wait, these were mine the whole time?',
  '["Let them go barefoot during floor time so feet are easy to grab","Try holding a toy near their feet to encourage reaching across the midline"]'::jsonb,
  NULL,
  FALSE,
  34
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'four-month-sleep-regression',
  14, 20,
  'high',
  '😴',
  'Sleep',
  'The 4-month sleep regression — it''s real, and it''s biology',
  'Around 3–4 months, your baby''s sleep architecture permanently changes to cycle through light and deep sleep like adults do. The naps that used to last 2 hours are now 30–45 minutes. Night wake-ups increase. This isn''t a regression — it''s a maturation. It doesn''t mean you did anything wrong, and it doesn''t last forever. Consistent bedtime routine + full feeds during the day help the most.',
  'Every parent hits this wall and thinks they broke something. You didn''t. Your baby is just growing a grown-up brain.',
  '["Establish a short, consistent bedtime routine (bath → feed → song → sleep)","Aim for full daytime feeds to prevent hunger-driven night waking","Consider wake windows: at 4 months, 1.5–2 hours awake is usually the limit before overtiredness"]'::jsonb,
  'sleep',
  FALSE,
  35
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'rolling',
  24, 34,
  'normal',
  '🤸',
  'Motor',
  'Rolling (CDC 2022: benchmark at 6 months)',
  'The CDC 2022 update moved the rolling benchmark to 6 months (previously 4). Most babies roll tummy-to-back first. Once rolling starts: no more unattended time on elevated surfaces.',
  'The first time they rolled and couldn''t figure out how to get back.',
  '["Encourage rolling by placing toys to one side","Remove from changing table and sofa once rolling begins"]'::jsonb,
  NULL,
  FALSE,
  36
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'hearing-localization',
  24, 32,
  'normal',
  '👂',
  'Sensory',
  'Turning toward sounds (6 months)',
  'Baby should now reliably turn their head to find where a sound is coming from. This is maturing auditory processing.',
  'Calling their name from across the room and watching them find you.',
  '["Call their name or shake a toy from out of sight — watch them locate it"]'::jsonb,
  NULL,
  FALSE,
  37
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'depth-perception',
  26, 40,
  'normal',
  '👁️',
  'Sensory',
  'Depth perception develops as crawling begins',
  'Around the time crawling starts, the brain begins processing three-dimensional space. Eyes coordinate to judge distances. This is why babies freeze at the edge of the visual cliff — they see the drop.',
  'Watching them stop and peer over the edge of the play mat, deciding whether to proceed.',
  '["Place toys just out of reach to encourage reaching and crawling"]'::jsonb,
  NULL,
  FALSE,
  38
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'hand-to-hand-transfer',
  22, 30,
  'normal',
  '🤲',
  'Motor',
  'Passing objects hand to hand',
  'Handing a toy from one hand to the other is a significant moment in bilateral coordination — both sides of the brain working together.',
  'The deliberate pass from left hand to right. They look so serious about it.',
  '["Offer blocks and rings — watch them move things between hands"]'::jsonb,
  NULL,
  FALSE,
  39
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'sleep-training-window',
  24, 39,
  'high',
  '🌙',
  'Sleep',
  'Sleep training window: 6–9 months',
  'Old enough to self-soothe. Young enough that habits haven''t hardened. Waiting past 9 months doesn''t make it easier — it makes it harder. Multiple methods work (Ferber, Fading, Chair, Pick-Up-Put-Down). The research shows they''re all roughly equivalent. Pick one. Be consistent.',
  'The first night they put themselves to sleep. You''ll cry in the hallway.',
  '["Choose your method — then commit to it for at least 2 weeks","Target bedtime: 7–8pm (earlier than you think)","Get aligned with your partner first","Pick a window with no travel or schedule disruptions"]'::jsonb,
  'sleep',
  FALSE,
  40
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'water-intro',
  24, 52,
  'normal',
  '💧',
  'Feeding',
  'Water: small amounts starting at 6 months',
  'Before 6 months, no water at all — even small amounts can cause dangerously low sodium (hyponatremia) in infants. After 6 months, 1–2 oz of water with solid meals is fine. It''s practice more than hydration.',
  'That expression of offense when they expected milk and got water.',
  '["Offer 1–2 oz of water in a cup with solid meals starting at 6 months","No water before 6 months — not even a sip"]'::jsonb,
  'feeding',
  FALSE,
  41
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'allergen-sweep',
  24, 39,
  'high',
  '🥚',
  'Feeding',
  'Introduce all 9 major allergens (6–9 months)',
  'Introduce peanuts, eggs, tree nuts, dairy, wheat, soy, fish, shellfish, and sesame now, one at a time, 3–4 days apart. The immune system is primed to accept new proteins at this age.',
  'The first bite of salmon puree. The total confusion on their face.',
  '["Eggs: well-cooked scrambled","Tree nuts: almond or cashew butter thinned in puree","Fish: pureed salmon or cod","Dairy: yogurt or cheese (cow''s milk as a drink comes later)","Keep a food diary during this window"]'::jsonb,
  'feeding',
  FALSE,
  42
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'texture-progression',
  26, 39,
  'high',
  '🥣',
  'Feeding',
  'Lumpy and mashed textures: the window closes at 9 months',
  'Research shows a real window here: introduce lumpy, mashed textures before 9 months. Delaying beyond this is linked to long-term feeding difficulties and increased pickiness. They don''t need teeth — gums do the work.',
  'Watching them figure out what to do with something that''s not smooth. The determination.',
  '["Move from smooth purees to mashed textures now","Fork-mashed banana or avocado is a good start","Add soft lumps to familiar purees"]'::jsonb,
  'feeding',
  FALSE,
  43
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'independent-sitting',
  26, 35,
  'normal',
  '🪑',
  'Motor',
  'Sitting independently (7–8 months)',
  'Sitting without support frees up both hands to explore objects — a cognitive leap as big as the motor one.',
  'The day they sat up and just... looked around. Seeing everything from a new angle.',
  '["Practice on a play mat with pillows for the inevitable topples"]'::jsonb,
  NULL,
  FALSE,
  44
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'babbling-consonants',
  24, 36,
  'normal',
  '🗣️',
  'Language',
  'Babbling with consonants',
  'Around 6–7 months, "ba-ba," "da-da," "ma-ma" start appearing. These aren''t words yet — they''re practice. The more you talk back, the more material they have to work with.',
  'The first time they said "dada" and your partner burst into tears.',
  '["Imitate their babble back to them","Take turns — pause after you respond and let them \"answer\""]'::jsonb,
  NULL,
  FALSE,
  45
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'first-tooth',
  22, 36,
  'high',
  '🦷',
  'Dental',
  'First tooth → first dentist visit',
  'Lower central incisors usually show up around month 6. Book the first dental visit at or before the first birthday (AAPD). Start brushing immediately — a rice-grain smear of fluoride toothpaste on whatever tooth is there.',
  'That tiny white edge of the first tooth. Reaching in to feel it.',
  '["Book the first dental visit by age 1","Brush twice daily with a rice-grain smear of fluoride toothpaste","No bottle in bed — the single biggest cause of early childhood cavities"]'::jsonb,
  NULL,
  FALSE,
  46
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'sippy-cup',
  24, 34,
  'normal',
  '🥛',
  'Feeding',
  'Introduce a cup — practice for bottle weaning at 12 months',
  'Start with 1–2 oz of water in a soft-spout or open cup. This is motor practice, not hydration. The goal is to make the 12-month bottle transition feel familiar rather than sudden.',
  'Water going everywhere except in their mouth. This is the phase.',
  '["Offer a small cup at mealtimes starting at 6 months","No juice before 12 months"]'::jsonb,
  'feeding',
  FALSE,
  47
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-6m',
  24, 28,
  'normal',
  '🩺',
  'Health',
  '📅 6-month well-child visit + first flu vaccine',
  'Vaccines: DTaP, Hib, IPV, PCV, HepB. First annual flu vaccine. If it''s their very first flu shot, they need two doses 4 weeks apart.',
  'Six months. You''ve kept a human being alive for six months.',
  '["Schedule the 6-month visit","First flu vaccine — two doses if first time ever","Ask about iron levels"]'::jsonb,
  NULL,
  FALSE,
  48
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'finger-foods-start',
  30, 40,
  'high',
  '🫐',
  'Feeding',
  'Soft finger foods: the fun begins (7–9 months)',
  'Once they can sit unassisted and bring objects to their mouth, they''re ready. Soft, dissolvable foods only. No teeth needed — gums do more than you think.',
  'Watching them pick up a blueberry for the first time, concentrating like it''s surgery.',
  '["Start with 1/4-inch pieces of banana, avocado, or well-cooked sweet potato","Always sit with them while they eat — this is still a new skill"]'::jsonb,
  'feeding',
  FALSE,
  49
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'stranger-anxiety',
  32, 52,
  'normal',
  '👶',
  'Social',
  'Stranger anxiety — a sign of secure attachment',
  'The baby who smiled at everyone now cries when Grandma picks them up. This isn''t a problem — it''s a milestone. It means they know who their people are.',
  'Grandma will understand. Eventually.',
  '["Warn relatives to wait and let baby come to them on their own terms","Stay close — you''re the secure base they''re operating from"]'::jsonb,
  NULL,
  FALSE,
  50
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'object-permanence',
  32, 52,
  'normal',
  '🧸',
  'Cognitive',
  'Object permanence — and why separation got harder',
  'Baby now understands things exist when out of sight. This explains two things happening at once: why peek-a-boo is suddenly hilarious, and why they cry when you leave the room.',
  'The moment you realized the peek-a-boo was actually funny to them, not just to you.',
  '["Play hiding games with toys","Narrate separations: \"I''m going to the kitchen. I''ll be right back.\""]'::jsonb,
  NULL,
  FALSE,
  51
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'responds-to-name',
  30, 44,
  'high',
  '🔔',
  'Language',
  'Responding to their name (8–9 months)',
  'By 8–9 months, baby should reliably turn toward you when you say their name. This is both a language and attention milestone.',
  'Saying their name and watching them find your face.',
  '["Test from across the room — say their name without moving","Worth mentioning at next visit if no reliable response by 9 months"]'::jsonb,
  NULL,
  FALSE,
  52
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'pincer-grasp',
  36, 46,
  'normal',
  '🤏',
  'Motor',
  'Pincer grasp — and now they can pick up everything on the floor',
  'The transition from raking at objects to using thumb and index finger takes place around 9 months. Once it arrives, assume anything small on the floor is fair game. Re-check baby-proofing.',
  'The intense concentration of picking up a single puff.',
  '["Offer puffs or cooked peas for practice","Scan the floor for coins, buttons, and batteries"]'::jsonb,
  'feeding',
  FALSE,
  53
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nap-3to2',
  35, 44,
  'high',
  '😴',
  'Sleep',
  '3-to-2 nap transition',
  'Signs it''s time: the third nap gets refused consistently, or bedtime gets pushed past 8:30pm. Extend wake windows by 15 minutes at a time. Takes 2–4 weeks to stabilize.',
  'The long afternoon window that appears when the third nap drops. Strange and glorious.',
  '["Shift gradually — no cold turkey","Protect the morning nap (it''s the last to go)"]'::jsonb,
  'sleep',
  FALSE,
  54
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'crawling',
  32, 48,
  'normal',
  '🚗',
  'Motor',
  'Crawling (with one important asterisk)',
  'Most babies crawl between 7–10 months. Important note: about 4% of healthy children skip crawling entirely and go straight to walking. WHO data confirms this is within normal range.',
  'First day of real crawling: you need to look at every corner of the house from 8 inches off the ground.',
  '["Create open floor space for exploration","Baby-proof at ground level: cords, sharp furniture edges, stairs"]'::jsonb,
  NULL,
  FALSE,
  55
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'pulling-to-stand',
  36, 52,
  'normal',
  '🧍',
  'Motor',
  'Pulling to stand',
  'Using furniture for support to pull themselves upright. This is the last precursor to walking. Make sure heavy furniture is wall-anchored now.',
  'Standing at the coffee table, looking so proud of themselves.',
  '["Clear low shelves they might grab","Wall-anchor bookshelves and dressers now — they will pull on them"]'::jsonb,
  NULL,
  FALSE,
  56
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'lead-screening',
  38, 55,
  'normal',
  '🧪',
  'Health',
  'Lead risk screening (9–12 months)',
  'The AAP recommends a lead risk assessment for all children from 6 months to 6 years. Blood lead testing at 12 and 24 months for children in pre-1978 housing or with specific risk factors.',
  'A simple question at a routine visit that can make a real difference.',
  '["Ask your pediatrician about lead risk at the 9 or 12-month visit","Pre-1978 housing: request a blood lead test"]'::jsonb,
  NULL,
  FALSE,
  57
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-9m',
  38, 42,
  'normal',
  '🩺',
  'Health',
  '📅 9-month well-child visit',
  'No vaccines this round — just a developmental check. Language: varied babbling. Confirm allergens have been introduced.',
  'Nine months. They''ve been outside as long as they were inside.',
  '["Schedule the 9-month visit","Confirm allergen introduction is complete"]'::jsonb,
  NULL,
  FALSE,
  58
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'peanut-closing',
  44, 49,
  'critical',
  '🥜',
  'Feeding',
  '🚨 Peanut introduction window is closing',
  'The 4–11 month early introduction window closes soon. If peanuts haven''t been introduced yet: this week, not next week.',
  'A small thing done now. A potentially large thing avoided later.',
  '["Introduce peanut butter this week if not yet done","Mix 1/4 tsp smooth peanut butter into any food they already like"]'::jsonb,
  'feeding',
  FALSE,
  59
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'honey-warning',
  0, 52,
  'critical',
  '🍯',
  'Feeding',
  '⚠️ No honey before age 1 — any form',
  'The main risk is raw or unpasteurized honey: it can contain Clostridium botulinum spores that an infant''s gut cannot neutralize. The AAP takes a conservative position and advises avoiding all honey products before the first birthday.',
  'One hard rule with a clear end date. First birthday: honey is fine.',
  '["No honey in any form before the first birthday","After age 1: all clear"]'::jsonb,
  'feeding',
  FALSE,
  60
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'bottle-weaning',
  50, 78,
  'high',
  '🍼',
  'Feeding',
  'Wean from the bottle by 12–18 months',
  'Prolonged bottle use is the leading cause of early childhood dental cavities and contributes to iron deficiency by displacing iron-rich solid foods. This is a harder transition than most parents expect — start it at 12 months, not 18.',
  'They''ll forget the bottle faster than you think they will.',
  '["Start offering milk in a cup at 12 months","Drop one bottle feeding per week","Never put baby to bed with a bottle — milk pools around teeth during sleep"]'::jsonb,
  'feeding',
  FALSE,
  61
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'first-steps',
  46, 68,
  'high',
  '👣',
  'Motor',
  'First steps (9–15 months)',
  'CDC 2022 benchmark is 15 months (75th percentile). WHO data puts the full normal range at 8.2–17.6 months. Wide stance and arms out are normal. Barefoot indoors is better than shoes for building balance and foot strength.',
  'The first real step across open floor, then sitting down hard and looking up at you.',
  '["Barefoot indoors as much as possible","Worth mentioning at next visit if not walking by 18 months"]'::jsonb,
  NULL,
  FALSE,
  62
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'cows-milk',
  50, 56,
  'high',
  '🥛',
  'Feeding',
  'Switch to whole cow''s milk at 12 months',
  'The fat in whole milk is needed for brain development until age 2. Before 12 months, cow''s milk causes iron deficiency and is too hard on infant kidneys. After 12: whole milk only, capped at 24 oz/day (more than that pushes out iron-rich foods).',
  'The official end of the formula chapter.',
  '["Transition to whole milk after the first birthday","No skim or 1% until after age 2","Cap at 24 oz/day to leave room for solid foods"]'::jsonb,
  'feeding',
  FALSE,
  63
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'self-feeding-hands',
  39, 52,
  'normal',
  '🖐️',
  'Feeding',
  'Self-feeding with fingers',
  'By 12 months, they should be feeding themselves a variety of finger foods independently. Messy is not a problem — it''s the point.',
  'The highchair tray that takes 10 minutes to clean. Worth every second.',
  '["Let them feed themselves — resist the urge to clean up mid-meal"]'::jsonb,
  'feeding',
  FALSE,
  64
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'choking-hazards-active',
  26, 208,
  'high',
  '🍎',
  'Feeding',
  'Choking hazard rules (until age 4)',
  'Children under 4 don''t have the oral motor coordination to safely chew certain shapes and textures. Grapes and cherry tomatoes must be cut lengthwise into small slivers. Hot dogs in rounds are a documented cause of death. No whole nuts, popcorn, or raw carrot sticks.',
  'The 20 extra seconds it takes to cut grapes properly.',
  '["Cut grapes and cherry tomatoes lengthwise into small pieces","Cut hot dogs into lengthwise strips, not round slices","No whole nuts, popcorn, or raw carrot sticks under age 4"]'::jsonb,
  'feeding',
  FALSE,
  65
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'first-words',
  46, 62,
  'high',
  '🗣️',
  'Language',
  'First real words (12–15 months)',
  'Beyond "mama/dada," look for words tied to specific meaning. At 15 months, 10–15 words are expected. Reading aloud every day is the single highest-return language investment you can make.',
  'The first time they said a word and clearly meant it.',
  '["Read aloud every day — no other single thing moves vocabulary faster","Worth mentioning at next visit if no words by 16 months"]'::jsonb,
  NULL,
  FALSE,
  66
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'gestures-12m',
  46, 58,
  'normal',
  '👋',
  'Language',
  'Pointing, waving, shaking head',
  'Pointing to SHARE interest — not just to ask for something — is one of the most significant 12-month milestones and one of the earliest autism red flags when absent.',
  'The first time they pointed at a dog, not to get it, but to show you it.',
  '["Model pointing and waving constantly","Worth mentioning at next visit if no pointing by 12 months"]'::jsonb,
  NULL,
  FALSE,
  67
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-12m',
  50, 55,
  'normal',
  '🩺',
  'Health',
  '📅 12-month well-child visit',
  'Vaccines: MMR, Varicella, HepA dose 1, Hib booster, PCV booster. Discuss the milk transition and bottle weaning plan.',
  'One year. You did that.',
  '["Schedule the 12-month visit","Vaccines: MMR, Varicella, HepA, Hib, PCV"]'::jsonb,
  NULL,
  FALSE,
  68
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'spoon-attempt',
  43, 78,
  'normal',
  '🥄',
  'Feeding',
  'First spoon attempts',
  'Around 10–18 months, the spoon appears. It will be chaotic until around 18–24 months. Messy mealtimes are developmental progress.',
  'Yogurt on the ceiling. On the ceiling.',
  '["Offer a spoon and let them practice","Pre-load it for them and let them bring it to their mouth"]'::jsonb,
  'feeding',
  FALSE,
  69
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'cup-transition',
  52, 78,
  'normal',
  '🥤',
  'Feeding',
  'Transition to an open cup',
  'By 15–18 months, children can start drinking from an open cup with light assistance. It''s messier than a sippy. It''s also better for dental and oral motor development.',
  'The first time they handled the cup themselves without spilling.',
  '["Practice with a small amount of water in a small open cup"]'::jsonb,
  'feeding',
  FALSE,
  70
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'autism-screen-18m',
  74, 82,
  'critical',
  '🧩',
  'Health',
  '⚠️ Autism screening at 18 months (M-CHAT-R/F)',
  'The AAP requires this at 18 AND 24 months. The M-CHAT-R/F takes 5 minutes and catches most cases early. Earlier diagnosis means dramatically better outcomes. If your pediatrician doesn''t offer it: ask.',
  'Five minutes that can change the trajectory of a child''s life.',
  '["Confirm the M-CHAT-R/F screen happens at the 18-month visit","Any skill REGRESSION at any age = call immediately — don''t wait for the next visit"]'::jsonb,
  NULL,
  FALSE,
  71
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nap-2to1',
  60, 78,
  'high',
  '😴',
  'Sleep',
  '2-to-1 nap transition (15–18 months)',
  'One of the trickiest transitions. Move to one midday nap and temporarily push bedtime earlier (6:30pm) to avoid overtiredness during the adjustment period.',
  'The morning nap you thought you''d never give up.',
  '["Watch for morning nap refusal two+ weeks in a row","Shift to one midday nap (aim for 11:30am–noon)","Move bedtime to 6:30pm until it settles"]'::jsonb,
  'sleep',
  FALSE,
  72
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'kicking-ball',
  60, 80,
  'normal',
  '⚽',
  'Athletic',
  'Kicking a ball forward (15 months)',
  'To kick forward you have to stand on one leg while swinging the other. More balance than it looks.',
  'The kick that missed entirely. The kick after that one that didn''t.',
  '["Provide a soft ball and model kicking — they''ll imitate immediately"]'::jsonb,
  NULL,
  FALSE,
  73
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'running-stiff',
  74, 95,
  'normal',
  '🏃',
  'Athletic',
  'Running — stiff, fast, and directionless',
  'Around 18 months, they discover they can move faster. Arms up, wide stance, limited steering. Falls are part of the curriculum.',
  'Watching them run toward you at full speed.',
  '["Give them open space to run","Falls are normal and good — resist catching every one"]'::jsonb,
  NULL,
  FALSE,
  74
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'scribbling',
  74, 96,
  'normal',
  '✏️',
  'Fine Motor',
  'Scribbling (15–18 months)',
  'Around 15–18 months, they make their first marks — fisted grip on the crayon, wild strokes. This is fine motor development and creative expression in the same moment.',
  'Their first piece of art. Frame it.',
  '["Provide big crayons and large paper","Don''t correct the grip yet — let them explore"]'::jsonb,
  NULL,
  FALSE,
  75
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'parallel-play',
  78, 130,
  'normal',
  '🧸',
  'Social',
  'Parallel play — next to each other, not with each other',
  'Playing beside another child rather than with them. This is not antisocial — it''s the bridge before cooperative play. They''re studying each other.',
  'Two kids at the same toy box, each in their own world, occasionally glancing sideways.',
  '["Arrange playdates with open space and plenty of toys","Don''t force sharing — parallel play comes before sharing"]'::jsonb,
  NULL,
  FALSE,
  76
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'tantrum-peak',
  78, 130,
  'high',
  '⚡',
  'Tantrums',
  'Tantrum peak: 18 months to 3 years',
  '87% of toddlers have tantrums. This isn''t bad parenting — it''s an underdeveloped prefrontal cortex combined with big feelings and limited vocabulary. The language gap makes it worse: toddlers who talk later have nearly twice the tantrum risk (Manning, 2019).',
  'The tantrum about the wrong colored cup. They don''t remember it. You won''t forget it.',
  '["Learn the two phases: anger first, then distress — they need different responses","Never give in during a tantrum — it teaches the tantrum works (Mo et al., 2023)","Address hunger and tiredness proactively — they''re the biggest triggers"]'::jsonb,
  'tantrum',
  FALSE,
  77
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'picky-eating-phase',
  52, 312,
  'normal',
  '🥦',
  'Feeding',
  'Picky eating is normal — and temporary',
  'Fear of new foods (neophobia) typically begins around 12–18 months and peaks between 2 and 6 years. It can take 15–20 exposures before a child accepts a new food. The research is clear: keep offering, without pressure.',
  'The broccoli you''ve put on their plate 14 consecutive times.',
  '["Offer without force — the \"one bite\" rule only","Keep putting the rejected food on the plate — exposure is the mechanism","Eat the same food yourself — they watch you more than you know"]'::jsonb,
  'feeding',
  FALSE,
  78
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'no-screens-18m',
  78, 104,
  'normal',
  '📱',
  'Screen Time',
  'Limited screens: now OK with conditions',
  'AAP allows up to 1 hour/day of high-quality content from 18–24 months. But toddlers can''t transfer screen content to real life without a parent bridging the gap. Solo screen time at this age doesn''t teach — it just plays.',
  'Watching them watch Ms. Rachel and then immediately go find their own toys to play with.',
  '["Co-view and talk about what you''re watching","Quality: Ms. Rachel, Sesame Street, Daniel Tiger","No autoplay","Screens off 60 min before bed"]'::jsonb,
  'screen-time',
  FALSE,
  79
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'potty-ready',
  78, 130,
  'high',
  '🚽',
  'Potty Training',
  'Potty training readiness — watch for the signs',
  'Readiness signs emerge around 18–24 months. But starting intensive training before 27 months takes significantly longer — an average of 13–14 months vs. under 10 months for children who start after 27 months (Blum et al., Pediatrics 2003). Watch for the signs. Wait for the window.',
  'The first time they told you before they went instead of after.',
  '["Watch for readiness: staying dry for 2+ hours, showing interest in the toilet","Read the Potty Training Playbook before committing to the intensive weekend"]'::jsonb,
  'potty-training',
  FALSE,
  80
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-18m',
  77, 82,
  'normal',
  '🩺',
  'Health',
  '📅 18-month well-child visit',
  'Vaccines: DTaP booster, HepA dose 2. Autism screen: M-CHAT-R/F. Language check.',
  'A year and a half. The face in the waiting room isn''t the face from month one.',
  '["Schedule the 18-month visit","Confirm the M-CHAT autism screen is completed"]'::jsonb,
  NULL,
  FALSE,
  81
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'no-added-sugar',
  0, 104,
  'high',
  '🍭',
  'Feeding',
  'No added sugar before age 2',
  'The AAP recommendation is zero added sugar for children under 2. Not because a bite of birthday cake will cause harm — but because taste preferences are being established right now. Whole fruit only for sweetness.',
  'The face they make when they taste something genuinely sweet for the first time.',
  '["Avoid added sugars and sweeteners","Whole fruit is the right answer for sweetness at this age"]'::jsonb,
  'feeding',
  FALSE,
  82
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'fork-spoon-proficient',
  78, 130,
  'normal',
  '🍴',
  'Feeding',
  'Fork and spoon proficiency (around age 2)',
  'By age 2, they should be handling a spoon and fork well enough to feed themselves most of the meal.',
  'The first meal where you realized you didn''t have to help at all.',
  '["Encourage self-feeding at every meal","Provide child-sized utensils"]'::jsonb,
  'feeding',
  FALSE,
  83
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'autism-screen-24m',
  103, 108,
  'high',
  '🧩',
  'Health',
  'Autism screening at 24 months',
  'The second AAP-required screen. Children who screen negative at 18 months but show concerns at 24 months represent a real subgroup. This one matters.',
  'Five minutes that catches what might otherwise take years to notice.',
  '["Request the M-CHAT-R/F at the 2-year visit"]'::jsonb,
  NULL,
  FALSE,
  84
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'language-2yr',
  103, 108,
  'high',
  '🗣️',
  'Language',
  '2-year language check: combining words',
  'By 2, they should be combining 2+ words: "Want milk," "Daddy go," "More please." Children with fewer than 50 words at this age have nearly twice the risk of severe tantrums — because language is still the fastest-developing behavior-management tool they have (Manning, 2019).',
  'The first sentence. Small words. Enormous moment.',
  '["Is child combining 2+ words? If not: request a speech evaluation","Bilingual families: count words across BOTH languages combined — that''s the clinical measure"]'::jsonb,
  'tantrum',
  FALSE,
  85
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'language-30m',
  125, 135,
  'high',
  '🗣️',
  'Language',
  '30-month language: 50+ words',
  'CDC 2022 moved this benchmark from 18 months to 30 months (75th percentile). If under 50 words at 30 months: request a speech evaluation — early intervention is free and it works.',
  'The week you stopped counting and realized you''d lost track because there were too many.',
  '["Count current vocabulary — aim for 50+","Bilingual families: words across both languages combined is the number that matters"]'::jsonb,
  'tantrum',
  FALSE,
  86
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'well-child-30m',
  128, 135,
  'normal',
  '🩺',
  'Health',
  '📅 30-month well-child visit',
  'AAP added this visit specifically for developmental and language surveillance. Don''t skip it.',
  'Two and a half. They have opinions about everything now.',
  '["Schedule the 30-month visit"]'::jsonb,
  NULL,
  FALSE,
  87
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'jumping-both-feet',
  100, 125,
  'high',
  '🐰',
  'Athletic',
  'Jumping with both feet (around 2 years)',
  'Both feet leaving the ground simultaneously. More coordinated than it sounds.',
  'The pure joy of discovering you can become briefly airborne.',
  '["Jump like bunnies or frogs — they love having a reason"]'::jsonb,
  NULL,
  FALSE,
  88
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'stacking-blocks',
  100, 130,
  'normal',
  '🧱',
  'Fine Motor',
  'Stacking 6+ blocks',
  'Stacking requires fine motor precision and the beginning of spatial reasoning.',
  'The moment just before the tower falls — the whole room holds its breath.',
  '["Build towers and let them knock them down","Duplo or Mega Bloks are perfect for this stage"]'::jsonb,
  NULL,
  FALSE,
  89
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'theory-of-mind',
  100, 180,
  'normal',
  '🧠',
  'Social',
  'Empathy emerging — they''re starting to notice you',
  'Around age 2, children begin to understand that other people have their own separate feelings. They might bring you a toy when you seem sad. They might comfort another crying child.',
  'The first time they brought you something when you were upset. Without being asked.',
  '["Label emotions — theirs and yours: \"I''m feeling frustrated. I need a minute.\"","Praise kind behavior specifically: \"That was kind of you to share that.\""]'::jsonb,
  'tantrum',
  FALSE,
  90
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'milk-2yr',
  103, 112,
  'normal',
  '🥛',
  'Feeding',
  'Switch from whole to 2% milk at 2 years',
  'Whole milk''s fat content is specifically needed for brain development in the first two years. After 2, ask your pediatrician about switching to 2%.',
  'The last of the whole milk chapter.',
  '["Discuss at the 2-year visit"]'::jsonb,
  'feeding',
  FALSE,
  91
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'handwashing-solo',
  120, 180,
  'normal',
  '🧼',
  'Self-Care',
  'Learning to wash hands',
  'They can learn the steps around age 2. They''ll need help with temperature and thoroughness for a while longer.',
  'The pride on their face when they do it by themselves.',
  '["Practice before meals and after every bathroom trip"]'::jsonb,
  NULL,
  FALSE,
  92
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-24m',
  103, 108,
  'normal',
  '🩺',
  'Health',
  '📅 2-year well-child visit',
  'Developmental and autism screens. Second autism screen (M-CHAT). 2-year molars may be coming in.',
  'Two years. The person they''re becoming is starting to be visible.',
  '["Schedule the 2-year visit","Second autism screen","Language check: 2-word combinations?"]'::jsonb,
  NULL,
  FALSE,
  93
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nap-1to0',
  156, 260,
  'high',
  '😴',
  'Sleep',
  'Dropping the last nap (average age: 3.5 years)',
  'At age 3, 91% of kids still nap. At age 4, 60%. At age 5, 30%. Signs they''re ready: taking 60+ minutes to fall asleep at nap, or bedtime getting pushed later. Replace with "Quiet Time" — one hour alone in their room. They rest. You breathe.',
  'The first Quiet Time where you heard nothing for an hour and wondered what was wrong.',
  '["Watch for consistent nap resistance before making the change","Replace nap with 1 hour of quiet time in their room","Move bedtime earlier to compensate during the transition"]'::jsonb,
  'sleep',
  FALSE,
  94
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'nighttime-fears',
  156, 312,
  'normal',
  '👻',
  'Sleep',
  'Nighttime fears and nightmares',
  'Imagination explodes at age 3–4. Night terrors (screaming while still asleep, no memory next day) differ from nightmares (they wake up, remember the dream). Both are normal. Night terrors: don''t wake them — just stay nearby and ensure safety.',
  'Sneaking in to check on them and finding them completely fine.',
  '["A small nightlight does more than you''d expect","Consistent bedtime routine is the single best protection against nighttime fears","Night terrors: stay close, don''t wake, it passes in minutes"]'::jsonb,
  'sleep',
  FALSE,
  95
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'tantrum-decline',
  155, 195,
  'normal',
  '⚡',
  'Tantrums',
  'Tantrums should start declining now',
  'Self-regulation is finally developing. "I''m mad" should start replacing the full meltdown. If frequency is NOT declining by 3.5 years — or if tantrums are lasting more than 25 minutes or happening more than 5 times a day — mention it at the next visit.',
  'The first time they used words instead of falling on the floor. A small miracle.',
  '["Teach emotion vocabulary: mad, sad, frustrated, scared","Worth mentioning at next visit if not declining by 3.5 years"]'::jsonb,
  'tantrum',
  FALSE,
  96
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'primary-teeth-complete',
  130, 170,
  'normal',
  '🦷',
  'Dental',
  'All 20 baby teeth present',
  'Typically complete by age 3, including the 2-year molars in the back.',
  'A full set of tiny teeth. Take a photo before they start falling out.',
  '["Confirm all 20 baby teeth are in","Continue twice-daily supervised brushing"]'::jsonb,
  NULL,
  FALSE,
  97
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'fluoride-3yr',
  156, 175,
  'normal',
  '🦷',
  'Dental',
  'Switch to pea-sized fluoride toothpaste at 3',
  'Increase from rice-grain to pea-sized amount at age 3. Still supervise — they don''t have the dexterity to do this well on their own until age 8.',
  'The negotiation over the toothpaste flavor. Every night.',
  '["Pea-sized amount starting at age 3","Let them \"go first\" then finish for them"]'::jsonb,
  NULL,
  FALSE,
  98
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'pacifier-wean',
  104, 182,
  'normal',
  '🍬',
  'Health',
  'Wean from the pacifier by age 2–3',
  'Prolonged pacifier use past age 2–3 can cause dental malocclusion and may interfere with speech development. The longer you wait, the harder the wean. Limit to sleep-only after 18 months, then remove entirely before age 3.',
  'The "Paci Fairy" visit. The absolute belief in magic.',
  '["Limit pacifier to sleep only after 18 months","Plan the full wean before age 3"]'::jsonb,
  NULL,
  FALSE,
  99
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'tricycle',
  150, 190,
  'normal',
  '🛺',
  'Athletic',
  'Pedaling a tricycle',
  'Alternating legs in rhythm while steering — more coordination than it looks. Most kids get this around age 3.',
  'The first time they made it all the way around the block.',
  '["A properly-sized tricycle or balance bike makes this much easier"]'::jsonb,
  NULL,
  FALSE,
  100
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'alternating-stairs',
  150, 190,
  'normal',
  '🪜',
  'Athletic',
  'Alternating feet on stairs',
  'Moving from "both feet per step" to one foot per step — a real balance and leg strength milestone.',
  'Counting the steps as you go up. Doing it again on the way down.',
  '["Practice together holding hands","Count the steps — they love counting things"]'::jsonb,
  NULL,
  FALSE,
  101
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'catching-large',
  156, 200,
  'normal',
  '🏀',
  'Athletic',
  'Catching a large ball',
  'Using arms and chest to secure a large tossed ball from short range.',
  'The celebration after the first catch. Arms wide, enormous grin.',
  '["Toss a large soft ball from 3–4 feet away — close range builds confidence first"]'::jsonb,
  NULL,
  FALSE,
  102
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'jumping-forward',
  156, 200,
  'normal',
  '📏',
  'Athletic',
  'Jumping forward (10–24 inches)',
  'By age 3, jumping becomes directional. They can now jump OVER things.',
  'Every crack in the sidewalk is now a challenge.',
  '["Place a stick on the grass and jump over it together"]'::jsonb,
  NULL,
  FALSE,
  103
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'counting-to-3',
  156, 180,
  'normal',
  '🔢',
  'Cognitive',
  'Counting to 3 with understanding',
  'Not just reciting numbers — actually matching one number to one object. This is the foundation of mathematical thinking.',
  '"Can you bring me three crackers?" When they get it right, it''s genuinely exciting.',
  '["Count real objects together — fruit, crackers, blocks","Ask \"can you give me THREE of those?\" and watch them count out loud"]'::jsonb,
  NULL,
  FALSE,
  104
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'drawing-circle',
  156, 190,
  'normal',
  '⭕',
  'Fine Motor',
  'Drawing a circle',
  'After seeing a model, a 3-year-old can reproduce a rough circle. Circles become suns, faces, and wheels.',
  'The first self-portrait. The circle head with lines sticking out.',
  '["Draw circles together — then ask what they see in it"]'::jsonb,
  NULL,
  FALSE,
  105
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'understanding-time',
  156, 208,
  'normal',
  '⏰',
  'Cognitive',
  'Yesterday, today, tomorrow',
  'Concept of time starts to form around age 3. They begin using time words correctly, even if "yesterday" means "any time before right now."',
  '"Yesterday we went to the park." Two weeks ago. But they mean it.',
  '["Talk about what you did yesterday and what''s happening tomorrow"]'::jsonb,
  NULL,
  FALSE,
  106
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vision-screen',
  156, 182,
  'high',
  '👁️',
  'Health',
  'Vision screening for amblyopia (age 3–5)',
  'Amblyopia (lazy eye) affects 2–3% of children and is completely silent — no squinting, no complaints, nothing visible. Treatment before age 7 works. After age 7, it plateaus. This screening is not optional.',
  'A 5-minute screening that can save a child''s vision.',
  '["Request a vision screen at the 3-year well-child visit","Worth mentioning before the visit if you notice squinting, head tilting, or one eye turning"]'::jsonb,
  NULL,
  FALSE,
  107
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'self-dressing-simple',
  156, 210,
  'normal',
  '👕',
  'Self-Care',
  'Putting on simple clothes (age 3)',
  'Can pull up pants and put on a loose shirt with minimal help. Buttons and zippers still need assistance.',
  'The outfit they chose themselves. The one that doesn''t match at all.',
  '["Offer choices: \"This one or that one?\" — not \"whatever you want\"","Allow extra time so they can try before you help"]'::jsonb,
  NULL,
  FALSE,
  108
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'toilet-wiping-solo',
  130, 208,
  'normal',
  '🧻',
  'Self-Care',
  'Learning to wipe independently',
  'A key milestone for preschool and school readiness. Front-to-back is the technique. Supervision and a "finish" by the adult until they''re consistently clean.',
  'The milestone nobody puts on the announcement card.',
  '["Practice front-to-back together","Supervise and finish for them until they''re reliably clean"]'::jsonb,
  'potty-training',
  FALSE,
  109
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-3yr',
  155, 165,
  'normal',
  '🩺',
  'Health',
  '📅 3-year well-child visit',
  'Vision screen for amblyopia. Language check: strangers should understand about 75% of speech. Annual visits begin.',
  'Three years old. They have a personality now.',
  '["Schedule the 3-year visit","Vision screen for amblyopia"]'::jsonb,
  NULL,
  FALSE,
  110
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'hopping-one-foot',
  208, 250,
  'normal',
  '🦩',
  'Athletic',
  'Hopping on one foot (age 4)',
  'Three to five hops on one foot, with control. A meaningful balance and leg strength milestone.',
  'Hopscotch is now a real game.',
  '["Play hopscotch","Practice hopping to a target"]'::jsonb,
  NULL,
  FALSE,
  111
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'throwing-overhand',
  208, 270,
  'normal',
  '⚾',
  'Athletic',
  'Throwing overhand with aim (age 4)',
  'The shoulder rotation of a real overhand throw starts appearing, with developing accuracy.',
  'The throw that actually made it to where they aimed.',
  '["Target practice: soft ball into a laundry basket from 6 feet"]'::jsonb,
  NULL,
  FALSE,
  112
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'skipping-uneven',
  208, 260,
  'normal',
  '👟',
  'Athletic',
  'Skipping — uneven gallop (age 4)',
  'Skipping starts as an uneven gallop. Full smooth skipping comes together around age 5.',
  'The skipping that''s really more of a hop-hop.',
  '["Model skipping on walks — they''ll imitate"]'::jsonb,
  NULL,
  FALSE,
  113
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'riding-bike',
  208, 365,
  'normal',
  '🚲',
  'Athletic',
  'Riding a bike (ages 4–7)',
  'Start with a balance bike — no pedals, just balance. Children who learn this way transition to pedaling much faster. No specific target age: whenever they''re ready.',
  'The moment they realized you''d let go and they were doing it alone.',
  '["Start with a balance bike — no training wheels","A properly-fitted helmet, always"]'::jsonb,
  NULL,
  FALSE,
  114
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'car-seat-forward',
  104, 312,
  'normal',
  '🚗',
  'Health',
  'Car seat: forward-facing with 5-point harness',
  'When child outgrows the rear-facing height or weight limit for their seat, transition to a forward-facing seat with a 5-point harness. Keep in this seat as long as possible — it''s much safer than a booster.',
  'The first time they could see out the front window properly.',
  '["Transition when rear-facing height/weight limit is reached — not before","Keep in the 5-point harness until they outgrow it too"]'::jsonb,
  NULL,
  FALSE,
  115
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'k-readiness',
  208, 252,
  'high',
  '🏫',
  'Academic',
  'Kindergarten readiness',
  'Social-emotional readiness predicts Grade 1 performance better than any academic knowledge. What kindergartners actually need: follow 2-step directions, sit for 10 minutes, take turns, tolerate frustration. "Knowing the alphabet" is secondary.',
  'The wave at the classroom door on the first day.',
  '["Practice 2-step directions: \"First do X, then do Y\"","Sit and listen to a full picture book without wiggling","Practice turn-taking games","Know full name, age, and parents'' names"]'::jsonb,
  NULL,
  FALSE,
  116
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'counting-to-10',
  208, 240,
  'normal',
  '🔢',
  'Cognitive',
  'Counting 10 objects with understanding (age 4)',
  'Understanding that counting maps to real objects — not just reciting the numbers. This is early number sense.',
  'The counting that takes twice as long as it should because they want to do it themselves.',
  '["Count everything: stairs, blueberries, cars in the parking lot"]'::jsonb,
  NULL,
  FALSE,
  117
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'writing-name',
  230, 280,
  'normal',
  '✏️',
  'Academic',
  'Writing their own name (ages 4–5)',
  'At 4: can copy capital letters. At 5: can write first name from memory. Handedness is usually established by age 4.',
  'The first time their name appeared in their own handwriting.',
  '["Practice starting with the first letter of their name","Use fat crayons or sidewalk chalk — fine motor builds gradually"]'::jsonb,
  NULL,
  FALSE,
  118
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'scissors-4yr',
  208, 260,
  'normal',
  '✂️',
  'Fine Motor',
  'Cutting with scissors (age 4)',
  'By age 4, can cut along a thick line and cut out simple shapes. Safety scissors are enough — the skill is in the coordination, not the blade.',
  'The first successful clean cut. The look of pure satisfaction.',
  '["Provide child-safe scissors and scrap paper","Cut pictures out of old magazines together"]'::jsonb,
  NULL,
  FALSE,
  119
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'body-safety',
  208, 260,
  'high',
  '🛡️',
  'Social',
  'Body safety education (ages 4–5)',
  'Children with body safety knowledge are significantly less vulnerable and significantly more likely to report inappropriate contact. Start the conversation early, in calm everyday moments, not as a scary talk.',
  'A calm, matter-of-fact conversation that protects them for life.',
  '["Use correct anatomical terms — always","\"No one touches your private parts except a doctor with a parent present\"","\"If it ever happens — tell me. I will always believe you.\""]'::jsonb,
  NULL,
  FALSE,
  120
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'imaginative-play',
  208, 312,
  'normal',
  '🎭',
  'Cognitive',
  'Peak imaginative play (ages 4–6)',
  'Complex scenario play lasting 20+ minutes builds executive function — a stronger predictor of life outcomes than IQ (Diamond & Lee, Science 2011). This is not a waste of time. This is the work.',
  'The elaborate universe they built out of couch cushions and a cardboard box.',
  '["Protect this time in the schedule","Open-ended toys: blocks, cardboard boxes, scarves, dolls","Limit screens during this window — they replace this play, not supplement it"]'::jsonb,
  'screen-time',
  FALSE,
  121
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'attention-span-awareness',
  208, 416,
  'normal',
  '🧠',
  'Cognitive',
  'Attention span: know what''s normal',
  'A rough rule: children can focus on a chosen task for 2–5 minutes per year of age (a 4-year-old: 8–20 minutes). ADHD cannot be reliably diagnosed before age 4. Hyperactivity and inattention concerns are best discussed at the 4-year and 5-year visits.',
  'The concentration on their face during a puzzle they chose themselves.',
  '["Discuss attention concerns with your pediatrician at the 4-year or 5-year visit","Screen content moves much faster than real life — some \"attention\" difference after screens is normal"]'::jsonb,
  NULL,
  FALSE,
  122
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'amblyopia-last-call',
  208, 365,
  'critical',
  '👁️',
  'Health',
  '⚠️ Amblyopia treatment window: before age 7',
  'The visual cortex is plastic until about age 7. Treatment — patching, glasses, atropine drops — must begin before then. After age 7, effectiveness drops significantly. If a screening flagged anything: this is not the referral to sit on.',
  'A small intervention now. Normal vision for life.',
  '["Act on any vision referral immediately","Annual eye exams from age 5 onward (American Optometric Association)"]'::jsonb,
  NULL,
  FALSE,
  123
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'vaccines-4yr',
  208, 224,
  'normal',
  '🩺',
  'Health',
  '📅 4-year well-child visit + school-entry vaccines',
  'Boosters: DTaP, IPV, MMR, Varicella. Required for school entry in most places. Vision and hearing screen.',
  'Four years old. The last visit before school starts.',
  '["Schedule the 4-year visit","Vaccines: DTaP, IPV, MMR, Varicella boosters"]'::jsonb,
  NULL,
  FALSE,
  124
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'hopping-mature',
  260, 320,
  'normal',
  '🦩',
  'Athletic',
  'Hopping 10 times on each foot (age 5)',
  'Controlled, sustained hopping — forward, backward, and switching feet.',
  'The focused determination of a 5-year-old trying to beat their own record.',
  '["Count hops together","Hop-race to the car"]'::jsonb,
  NULL,
  FALSE,
  125
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'skipping-mature',
  260, 330,
  'normal',
  '👟',
  'Athletic',
  'Skipping — smooth rhythm (age 5)',
  'The gallop becomes a smooth, fluid skip.',
  'Skipping down a sidewalk together.',
  '["Skip everywhere — it''s actually good exercise for both of you"]'::jsonb,
  NULL,
  FALSE,
  126
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'catching-small',
  260, 320,
  'normal',
  '🎾',
  'Athletic',
  'Catching a small ball with hands (age 5)',
  'Using hands only — not arms and chest — to catch a tennis-sized ball. Real hand-eye coordination.',
  'The first clean catch. The disbelief on both your faces.',
  '["Build up: start with beanbags, then larger balls, then smaller ones"]'::jsonb,
  NULL,
  FALSE,
  127
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'jumping-180',
  260, 320,
  'normal',
  '🔄',
  'Athletic',
  'Jumping and turning 180° in the air (age 5)',
  'Mid-air body awareness — rotating and landing facing the opposite direction.',
  '"Jump and face me" — when they actually pull it off.',
  '["Challenge: \"Can you jump and turn all the way around?\""]'::jsonb,
  NULL,
  FALSE,
  128
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'baby-teeth-shedding',
  260, 416,
  'normal',
  '🦷',
  'Dental',
  'Losing baby teeth (ages 5–8)',
  'First baby teeth usually fall out between age 5–7, starting with the lower central incisors. Permanent teeth push up from below. Some kids start as early as 4 — that''s fine.',
  'The loose tooth they kept wiggling for two weeks before it finally came out.',
  '["Let it fall out naturally — no forced pulling","See dentist if a permanent tooth erupts BEFORE the baby tooth falls out — that one needs attention"]'::jsonb,
  NULL,
  FALSE,
  129
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'self-dressing-full',
  210, 280,
  'normal',
  '👞',
  'Self-Care',
  'Dressing independently (ages 4–5)',
  'Can dress fully, including socks and shoes. Complex fasteners still need help.',
  'Coming downstairs fully dressed for school. Without being asked.',
  '["Let them choose and put on their own clothes — even on the days when it matters"]'::jsonb,
  NULL,
  FALSE,
  130
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'reading-to-learn',
  312, 390,
  'high',
  '📚',
  'Academic',
  'Learning to read → reading to learn',
  'Grades 1–2 are the "learning to read" window. By Grade 2, children shift to "reading to learn" — everything else depends on this skill. Phonological awareness is the strongest predictor. Keep reading aloud even after they can read themselves — it exposes them to vocabulary two grades above their reading level.',
  'The first time they picked up a book and read it to you.',
  '["Keep reading aloud — it matters even more now","Play rhyming and word-sound games","Worth mentioning at next visit if significant decoding struggle at end of Grade 1"]'::jsonb,
  NULL,
  FALSE,
  131
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  '6yr-molars',
  312, 365,
  'high',
  '🦷',
  'Dental',
  '6-year molars: the most important teeth they''ll ever have',
  'First permanent molars arrive behind the baby teeth — they don''t replace anything. These are the foundation of the adult bite. Sealants now protect them from decay for years. Ask about this at the 6-year visit.',
  'The molar they didn''t know they had until the dentist pointed to it.',
  '["Ask the dentist about sealants for the 6-year molars","These teeth are hard to reach — keep helping them brush the back until age 8"]'::jsonb,
  NULL,
  FALSE,
  132
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'run-kick-combo',
  312, 400,
  'normal',
  '🏃',
  'Athletic',
  'Running and kicking in combination (age 6)',
  'Combining two motor skills: running at full speed and kicking a moving ball without stopping to reset.',
  'The first real soccer play. Running, kicking, celebrating.',
  '["Play soccer","Practice kicking a rolling ball — not a stationary one"]'::jsonb,
  NULL,
  FALSE,
  133
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'jump-rope',
  312, 365,
  'normal',
  '➰',
  'Athletic',
  'Jumping rope (age 6)',
  'Timing, bilateral coordination, and rhythm — all simultaneously. One of the more complex athletic milestones. Start with the rope stationary before it swings.',
  'Twenty minutes of practice for five consecutive jumps. Worth every second of it.',
  '["Start: rope on the ground, jumping over it stationary","Build: slowly swing once-around while they time the jump"]'::jsonb,
  NULL,
  FALSE,
  134
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'swimming-basics',
  156, 416,
  'high',
  '🏊',
  'Athletic',
  'Water competency — essential safety skill',
  'Drowning is the #1 cause of accidental death in children ages 1–4. Swim lessons from age 3–4 significantly reduce risk. By age 6–7, every child should be able to float on their back independently. Note: swimming ability reduces risk — it doesn''t replace supervision.',
  'The moment they stopped needing you in the water.',
  '["Enroll in swim lessons by age 3–4","Practice floating on back until they can hold it without help"]'::jsonb,
  NULL,
  FALSE,
  135
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'shoe-tying',
  280, 390,
  'normal',
  '👟',
  'Fine Motor',
  'Tying shoelaces (ages 5–7)',
  'Bilateral coordination and sequencing — many children don''t master this until 6–7. The bunny-ears method is genuinely easier to learn than the traditional method.',
  'The first self-tied knot that held through the whole school day.',
  '["Teach the bunny-ears method — it''s easier to learn","Practice with a spare shoe when there''s no time pressure"]'::jsonb,
  NULL,
  FALSE,
  136
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'conservation-piaget',
  364, 468,
  'normal',
  '🥛',
  'Cognitive',
  'Understanding conservation (age 7)',
  'Piaget''s Concrete Operational stage: the same amount of water in a tall narrow glass and a short wide bowl is still the same amount. This reasoning was beyond them before age 7. Now it''s obvious.',
  'The pour-between-glasses experiment. Watching their brain make the connection.',
  '["Try it: pour water between a tall glass and a wide bowl — \"Is it the same amount?\""]'::jsonb,
  NULL,
  FALSE,
  137
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'executive-function',
  312, 416,
  'normal',
  '🧠',
  'Cognitive',
  'Executive function development (ages 6–8)',
  'Working memory, inhibitory control, and cognitive flexibility. These skills predict academic achievement, mental health, and economic success more consistently than IQ (Diamond, Science 2013). Built through strategy games, music, and any activity that requires planning.',
  'Watching them beat you at Checkers and act like they knew they would.',
  '["Strategy games: Checkers, Uno, Battleship","Music lessons (any instrument improves working memory)","Let them struggle — tolerating frustration IS executive function, not just a path to it"]'::jsonb,
  NULL,
  FALSE,
  138
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'best-friends',
  312, 416,
  'normal',
  '👫',
  'Social',
  '"Best friends" emerge (ages 6–8)',
  'Friendships shift from whoever-is-nearby to genuine preference. Strong friendships at this age are central to identity and self-esteem.',
  'The friend whose name you hear every single day.',
  '["Know who their friends are","Invite them over — your home is now a safe base for their social world"]'::jsonb,
  NULL,
  FALSE,
  139
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'brushing-needs-help',
  0, 416,
  'normal',
  '🪥',
  'Dental',
  'Supervise brushing until age 8',
  'Children don''t have the fine motor control to brush their own teeth thoroughly until age 8. Let them go first, then you finish. Every dentist says this. Not enough parents do it.',
  'The two-minute song you play every night.',
  '["Brush for them or after them until the 8th birthday","Electric toothbrush makes the finish much easier"]'::jsonb,
  NULL,
  FALSE,
  140
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'agility-golden-window',
  400, 500,
  'normal',
  '⚡',
  'Athletic',
  'The Golden Window for athleticism (ages 8–10)',
  'Peak time for developing speed, agility, balance, and coordination. The research is consistent: children who try multiple sports before age 12 develop better long-term athleticism than early specializers.',
  'Watching them discover what their body can do.',
  '["Encourage different sports each season","Avoid single-sport specialization before age 12 — the evidence for this is strong"]'::jsonb,
  NULL,
  FALSE,
  141
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'peer-influence',
  468, 520,
  'normal',
  '🤝',
  'Social',
  'Peer influence exceeds parental influence (age 9+)',
  'This shift is normal, healthy, and necessary for developing autonomy. Your job changes: from director to available. Listen more than you talk. Home should be where they can still be honest.',
  'When you realized they were telling their friends things they weren''t telling you.',
  '["Know their friends and their friends'' parents","Privacy matters to them now — respect it, stay available","Talk about digital safety before they''re fully online"]'::jsonb,
  NULL,
  FALSE,
  142
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'social-media-awareness',
  400, 520,
  'normal',
  '📲',
  'Screen Time',
  'Social media conversation — before the pressure starts',
  'No major social platform allows users under 13 (COPPA). But peer pressure to join starts around 8–10. Research consistently links early social media use to anxiety and depression. Have the conversation now, calmly, before the ask is urgent.',
  '"All my friends have it." The sentence you''re preparing for.',
  '["\"We''ll revisit this together at 13\" — and mean it","Establish family digital rules (no devices in bedrooms at night)","Have the conversation before they have an account, not after"]'::jsonb,
  'screen-time',
  FALSE,
  143
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'adrenarche',
  468, 520,
  'normal',
  '🌱',
  'Health',
  'Pre-puberty signs may begin (ages 8–10)',
  'Adrenarche — early puberty hormones — can begin as early as age 8 in girls and 9 in boys. Signs: body odor, light body hair. Start the conversation before they hear about it from someone else.',
  'A calm, early conversation that makes the bigger one easier later.',
  '["Introduce deodorant if body odor appears","Start the puberty conversation early — before they need it"]'::jsonb,
  NULL,
  FALSE,
  144
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'car-seat-booster',
  312, 520,
  'normal',
  '🚗',
  'Health',
  'Car seat: booster seat transition',
  'When child outgrows the 5-point harness weight or height limit, move to a belt-positioning booster. Stay in the booster until the vehicle seat belt fits correctly across the upper thigh and chest — typically around 4''9" tall, often ages 8–12.',
  'The moment the seat belt actually fits properly. Took longer than anyone expected.',
  '["Transition when the 5-point harness limit is reached — not before","Seat belt fits when lap belt sits on upper thighs, shoulder belt on chest"]'::jsonb,
  NULL,
  FALSE,
  145
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'endurance-10yr',
  490, 530,
  'normal',
  '🔋',
  'Athletic',
  'Building endurance and physical conditioning (age 10)',
  'By age 10, children are capable of sustained physical conditioning — long bike rides, distance running, sustained team sport play. Their aerobic capacity is expanding. Keep it fun, not a chore.',
  'Going for a real run or bike ride together where you actually have to keep up.',
  '["Family hikes or bike rides of increasing duration","Celebrate fitness accomplishments"]'::jsonb,
  NULL,
  FALSE,
  146
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'read-aloud',
  0, 520,
  'normal',
  '📖',
  'Language',
  'Read aloud every day — highest ROI parenting activity',
  'Reading aloud closes socioeconomic vocabulary gaps and builds language, sequencing, and attention. The research says reading aloud exposes them to vocabulary 2–3 grades above their reading level. Continue even after they can read independently.',
  'The 20 minutes at the end of the day when everything else stops.',
  '["10–20 minutes daily","Ask \"What happens next?\" to build comprehension","Choose books they pick, not just ones you think they should read"]'::jsonb,
  NULL,
  FALSE,
  147
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'screens-off-bed',
  0, 520,
  'normal',
  '🌙',
  'Sleep',
  'Screens off 60 min before bed — all ages',
  'The issue is nervous system arousal, not just blue light. Any screen activates the brain in ways that delay sleep onset. Only a clear time window fixes it.',
  'The quiet hour before bed. Books and low lights.',
  '["Set a screens-off alarm 60 min before bedtime","Fill the window: bath, books, quiet play","Charge devices outside the bedroom"]'::jsonb,
  'sleep',
  FALSE,
  148
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'outdoor-time-myopia',
  0, 520,
  'normal',
  '🌳',
  'Health',
  '60–120 min outdoor time daily — prevents myopia',
  'Taiwan''s "Tian-Tian 120" study cut preschool myopia rates in half with outdoor time. Daylight above 1,000 lux triggers dopamine in the retina that stops eye elongation. 60 min shows benefit; 120 min is the target.',
  'Getting them outside in any weather. They don''t mind the rain as much as we do.',
  '["Target 1–2 hours outdoor time daily","Apply 20-20-20 rule during screen use (every 20 min, look 20 feet away for 20 seconds)"]'::jsonb,
  'screen-time',
  FALSE,
  149
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'annual-flu',
  24, 520,
  'normal',
  '💉',
  'Health',
  'Annual flu vaccine — every child 6 months+',
  'CDC: annual flu vaccine for all children 6 months and older. Under-5s are the highest risk group. First-ever flu vaccine requires two doses, 4 weeks apart.',
  'One quick prick. One winter protected.',
  '["Schedule annually in September–November"]'::jsonb,
  NULL,
  FALSE,
  150
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'physical-activity',
  156, 520,
  'high',
  '🏃',
  'Health',
  '60 minutes of active play every day (age 3–10)',
  'WHO/AAP: at least 60 min of moderate-to-vigorous physical activity daily. Improves sleep, mood, and attention. Unstructured outdoor play is just as valuable as organized sports.',
  'Watching them run until they finally run out of batteries.',
  '["Target 60 min/day of active movement — running, climbing, sports, free play","Break it up: three 20-min bursts counts the same as one continuous session","Unstructured outdoor play is just as valuable as organized sport"]'::jsonb,
  NULL,
  FALSE,
  151
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

INSERT INTO milestones
  (id, age_start, age_end, urgency, icon, section, title, body, family_moment, todos, playbook_key, prenatal, sort_order)
VALUES (
  'structured-meals',
  52, 416,
  'normal',
  '🍽️',
  'Feeding',
  'Structured meals beat grazing',
  '3 meals + 2–3 snacks daily for toddlers. Grazing blurs hunger signals and increases picky eating. Satter Division of Responsibility: you decide what/when/where; child decides whether/how much.',
  'Sitting down together. No screens. Just food and conversation.',
  '["Set consistent meal and snack times","Don''t leave food out between scheduled times","Offer what you''re having — no short-order cooking"]'::jsonb,
  'feeding',
  FALSE,
  152
)
ON CONFLICT (id) DO UPDATE SET
  age_start    = EXCLUDED.age_start,
  age_end      = EXCLUDED.age_end,
  urgency      = EXCLUDED.urgency,
  icon         = EXCLUDED.icon,
  section      = EXCLUDED.section,
  title        = EXCLUDED.title,
  body         = EXCLUDED.body,
  family_moment = EXCLUDED.family_moment,
  todos        = EXCLUDED.todos,
  playbook_key = EXCLUDED.playbook_key,
  prenatal     = EXCLUDED.prenatal,
  sort_order   = EXCLUDED.sort_order,
  updated_at   = NOW();

-- Total: 153 milestones seeded.