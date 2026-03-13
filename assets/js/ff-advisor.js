/**
 * FamilyForce — Development Advisor
 * ff-advisor.js v5.0
 *
 * ~150 milestones. Voice: Jack — research-backed, down-to-earth, no shame.
 * Sources: AAP Bright Futures 4th Ed, CDC 2022, WHO MGRS, LEAP Study (NEJM 2015),
 * Blum et al. 2003, Diamond & Lee 2011, Manning 2019, M-CHAT-R/F (Robins 2014),
 * AASM, AAPD, AOA, NSF, Denver II, and all 5 FamilyForce playbooks.
 *
 * Fields:
 *   ageStart / ageEnd  — inclusive week range from birth (negative = before birth)
 *   urgency            — 'critical' | 'high' | 'normal'
 *   familyMoment       — one warm sentence for the parent
 *   redFlag            — true = persists in digest until checked off
 *   prenatal           — true = show in Before-Baby-Arrives section
 *
 * All guidelines assume a typically developing child born at full term.
 */

(function () {
'use strict';

/* ═══════════════════════════════════════════════════════════
   MILESTONE DATABASE
   ═══════════════════════════════════════════════════════════ */
/* ─── Milestone data ────────────────────────────────────────────
   MILESTONES_FALLBACK is the hardcoded array shipped with the JS.
   MILESTONES is the live reference — starts as the fallback, then
   gets replaced by loadMilestonesFromSupabase() if Supabase is
   available. All internal functions reference MILESTONES so they
   automatically pick up live data after the async load.
   ────────────────────────────────────────────────────────────── */
const MILESTONES_FALLBACK = [

  /* ─── BEFORE BABY ARRIVES ─── */
  {
    id: 'prenatal-pediatrician',
    ageStart: 0, ageEnd: 2, prenatal: true,
    urgency: 'high', icon: '🩺', section: 'Before Baby Arrives',
    title: 'Choose your pediatrician before the birth',
    body: 'Schedule a prenatal visit with your chosen pediatrician before your due date. You want to have this relationship established before you\'re exhausted, holding a newborn, and Googling "is this normal at 3am."',
    familyMoment: 'Finding the right pediatrician feels small. It\'s not.',
    todos: ['Research pediatricians in your area who take your insurance', 'Schedule a prenatal meet-and-greet visit', 'Bring your questions — they expect this'],
    playbookKey: null,
  },
  {
    id: 'prenatal-cpr',
    ageStart: 0, ageEnd: 3, prenatal: true,
    urgency: 'high', icon: '🫀', section: 'Before Baby Arrives',
    title: 'Take an infant CPR class — before the birth',
    body: 'Thirty minutes of training. A lifetime of confidence. The Red Cross and most hospitals offer courses. This is the one thing on this list that can make a measurable difference in the worst-case scenario.',
    familyMoment: 'Most parents never use it. All parents are glad they know it.',
    todos: ['Book an infant CPR class before your due date', 'Red Cross and local hospitals both offer them'],
    playbookKey: null,
  },
  {
    id: 'prenatal-carseat',
    ageStart: 0, ageEnd: 2, prenatal: true,
    urgency: 'high', icon: '🚗', section: 'Before Baby Arrives',
    title: 'Install the car seat before you go to the hospital',
    body: 'The hospital won\'t discharge you without one installed. More importantly: 72% of car seats are installed incorrectly. Many fire stations and certified technicians offer free inspections.',
    familyMoment: 'That first drive home, ten miles per hour under the speed limit, is one you\'ll remember.',
    todos: ['Install rear-facing car seat before your due date', 'Get it inspected by a certified technician (free at many fire stations)', 'Never place rear-facing seat in front of an active airbag'],
    playbookKey: null,
  },
  {
    id: 'prenatal-supplies',
    ageStart: 0, ageEnd: 2, prenatal: true,
    urgency: 'normal', icon: '🧺', section: 'Before Baby Arrives',
    title: 'Stock the specific newborn essentials',
    body: 'Three things most parents forget before leaving the hospital: a rectal thermometer (the only accurate option for newborns), Vitamin D drops for breastfed babies (start day one), and a nasal aspirator. Everything else can wait.',
    familyMoment: 'You don\'t need everything on the list. You need the right three things.',
    todos: ['Buy a rectal thermometer', 'Buy Vitamin D drops (400 IU)', 'Buy a NoseFrida or similar nasal aspirator'],
    playbookKey: null,
  },
  {
    id: 'prenatal-peanut-prep',
    ageStart: 0, ageEnd: 4, prenatal: true,
    urgency: 'normal', icon: '🥜', section: 'Before Baby Arrives',
    title: 'Learn about the peanut introduction window now',
    body: 'There\'s a biological window between 4 and 11 months to introduce peanuts that cuts allergy risk by up to 86% (LEAP Study, NEJM 2015). Most parents miss it simply because nobody told them it existed. Now you know.',
    familyMoment: 'One of the most important things you do in year one is add peanut butter to a puree.',
    todos: ['Read the peanut window milestone when your baby turns 4 months', 'If family allergy history: ask your pediatrician about timing now'],
    playbookKey: 'feeding',
  },

  /* ─── NEWBORN (WEEKS 0–4) ─── */
  {
    id: 'fever-newborn',
    ageStart: 0, ageEnd: 12,
    urgency: 'critical', icon: '🌡️', section: 'Health',
    title: '🚨 Fever under 3 months = go to the ER',
    body: 'Any fever ≥100.4°F (38°C) in a baby under 3 months is a go-to-the-ER situation — not a wait-until-morning call. A newborn\'s immune system can\'t contain bacterial infections the way an older child\'s can.',
    familyMoment: 'You\'ll probably never need this one. Keep it anyway.',
    todos: ['Know this threshold cold: 100.4°F (38°C) in under-3-months = ER now', 'Own a rectal thermometer — it\'s the only accurate option at this age', 'Don\'t give fever reducers before going to the ER'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'nb-safe-sleep',
    ageStart: 0, ageEnd: 26,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: 'Safe sleep: back, alone, flat',
    body: 'Every sleep, every time: back to sleep on a firm flat surface, nothing else in the crib. Room-sharing on a separate surface for 6 months cuts SIDS risk by about half. The evidence on this one is about as strong as it gets.',
    familyMoment: 'Watching them sleep. Just that.',
    todos: ['Back to sleep — every nap, every night, no exceptions', 'Empty sleep surface: no toys, no bumpers, no pillows', 'Room-share on a separate surface for at least 6 months'],
    playbookKey: 'sleep',
  },
  {
    id: 'nb-hearing',
    ageStart: 0, ageEnd: 3,
    urgency: 'high', icon: '👂', section: 'Health',
    title: 'Newborn hearing screening — did it happen?',
    body: '1 to 3 in every 1,000 newborns has significant hearing loss. Language intervention before 6 months changes outcomes dramatically. The hospital usually handles this before discharge.',
    familyMoment: 'The moment you realized they could hear you talking.',
    todos: ['Confirm the hearing screen was completed before discharge', 'If it was missed: request it at the 3–5 day visit'],
    playbookKey: null,
  },
  {
    id: 'nb-jaundice',
    ageStart: 0, ageEnd: 2,
    urgency: 'high', icon: '🟡', section: 'Health',
    title: 'Jaundice watch: days 2–7',
    body: 'Most newborns go a little yellow from bilirubin buildup — it peaks around day 3–5 and usually clears with frequent feeding. Severe untreated jaundice can affect the brain. Frequent feeds help flush it.',
    familyMoment: 'The yellow tint that made you call the hospital at 2am. You were right to call.',
    todos: ['Watch for yellowing of skin and the whites of eyes', 'Feed frequently — this helps excrete bilirubin', 'Call your doctor if jaundice appears before 24 hours or gets worse after day 5'],
    playbookKey: null,
  },
  {
    id: 'nb-weight-regain',
    ageStart: 0, ageEnd: 3,
    urgency: 'high', icon: '⚖️', section: 'Health',
    title: 'Back to birth weight by day 10–14',
    body: 'Newborns lose 5–10% of their birth weight in the first few days. This is normal. They should be back at or above birth weight within 10–14 days — a key early milestone your pediatrician tracks closely.',
    familyMoment: 'Watching those tiny numbers on the scale creep back up.',
    todos: ['Track weight at your 3–5 day well-child visit', 'Feed every 2–3 hours to support regain'],
    playbookKey: 'feeding',
  },
  {
    id: 'nb-vitamin-d',
    ageStart: 0, ageEnd: 52,
    urgency: 'high', icon: '☀️', section: 'Health',
    title: 'Vitamin D drops — start this week if breastfeeding',
    body: 'Breast milk doesn\'t provide enough Vitamin D. The AAP recommends 400 IU/day starting in the first days of life. It\'s a small thing with a real impact. Formula-fed babies drinking 32oz+/day don\'t need the drops.',
    familyMoment: 'One drop. Every morning. That\'s it.',
    todos: ['Pick up Vitamin D drops (400 IU) at the pharmacy', 'Start within the first few days if breastfeeding'],
    playbookKey: null,
  },
  {
    id: 'cpr-training',
    ageStart: 0, ageEnd: 8,
    urgency: 'high', icon: '🫀', section: 'Health',
    title: 'Infant CPR — take the class before sleep training age',
    body: 'Two hours of training, once. The Red Cross and most hospitals offer it. Most parents who take it never use it. All of them are glad they know it.',
    familyMoment: 'The confidence that comes from knowing what to do if the worst happens.',
    todos: ['Book an infant CPR class if you haven\'t already'],
    playbookKey: null,
  },
  {
    id: 'car-seat-rear',
    ageStart: 0, ageEnd: 104,
    urgency: 'high', icon: '🚗', section: 'Health',
    title: 'Keep them rear-facing until the seat\'s limits — not just age 2',
    body: 'AAP: Rear-facing until your child reaches the maximum height or weight for their specific seat. A child is 5 times safer rear-facing than forward-facing in a frontal crash. Age 2 is a floor, not a ceiling.',
    familyMoment: 'Every drive is a safe drive when you got this right.',
    todos: ['Keep rear-facing until the seat\'s height and weight limit is reached', 'Never place rear-facing seat in front of an active airbag', 'Free car seat inspection: nhtsa.gov/campaign/safercarseat'],
    playbookKey: null,
  },
  {
    id: 'sunscreen-caution',
    ageStart: 0, ageEnd: 26,
    urgency: 'normal', icon: '☀️', section: 'Health',
    title: 'No sunscreen under 6 months',
    body: 'AAP: Keep babies under 6 months out of direct sunlight. Use shade, hats, and protective clothing instead. Sunscreen chemicals absorb through immature skin. After 6 months, mineral sunscreen is fine.',
    familyMoment: 'That little hat. The one they immediately pull off.',
    todos: ['Use hats, shade, and protective clothing for sun protection', 'Save the sunscreen for after 6 months'],
    playbookKey: null,
  },
  {
    id: 'pacifier-sids',
    ageStart: 0, ageEnd: 26,
    urgency: 'normal', icon: '🍬', section: 'Sleep',
    title: 'Pacifier at sleep onset reduces SIDS risk',
    body: 'AAP recommends offering a pacifier when putting baby down for sleep in the first 6 months — it reduces SIDS risk by up to 90%. If they don\'t want it, don\'t force it. If you\'re breastfeeding, wait until the latch is established (3–4 weeks) before introducing.',
    familyMoment: 'The sound of a baby contentedly sucking on a pacifier is one of the best sounds in the world.',
    todos: ['Offer pacifier at sleep onset', 'Don\'t force it if baby refuses', 'Breastfeeding: wait 3–4 weeks until latch is established first'],
    playbookKey: 'sleep',
  },
  {
    id: 'breastfeeding-2yr',
    ageStart: 0, ageEnd: 104,
    urgency: 'normal', icon: '🤱', section: 'Feeding',
    title: 'Breastfeeding: the AAP raised its recommendation to 2 years',
    body: 'In 2022, the AAP extended its recommendation from 1 year to 2 years or beyond — as long as it\'s working for both of you. Breast milk continues to provide immune and nutritional benefits through the second year.',
    familyMoment: 'However long you go, every feed you gave them mattered.',
    todos: ['Breastfeed as long as it\'s working for both of you — there\'s no upper limit', 'Don\'t let anyone rush this decision in either direction'],
    playbookKey: 'feeding',
  },
  {
    id: 'nb-rooting-reflex',
    ageStart: 0, ageEnd: 16,
    urgency: 'normal', icon: '🍼', section: 'Reflexes',
    title: 'Rooting reflex — use it',
    body: 'Stroke your baby\'s cheek and they turn toward the nipple. This is how feeding finds its way. It fades around 4 months as voluntary feeding takes over. It\'s there to help you right now.',
    familyMoment: 'That tiny head turning toward you. Built-in instinct.',
    todos: ['Use the reflex to help with latch — stroke the cheek toward the breast or bottle'],
    playbookKey: 'feeding',
  },
  {
    id: 'nb-moro-reflex',
    ageStart: 0, ageEnd: 8,
    urgency: 'normal', icon: '😲', section: 'Reflexes',
    title: 'Moro (startle) reflex — swaddling helps',
    body: 'A sudden noise or sensation triggers arms flying out, then pulling back. It peaks in month one and fades by month two. Swaddling keeps it from waking them up.',
    familyMoment: 'That full-body startle that made you gasp the first time you saw it.',
    todos: ['Swaddle to dampen the reflex during sleep', 'Move slowly and deliberately when laying baby down'],
    playbookKey: 'sleep',
  },
  {
    id: 'nb-palmar-grasp',
    ageStart: 0, ageEnd: 20,
    urgency: 'normal', icon: '✊', section: 'Reflexes',
    title: 'Palmar grasp reflex',
    body: 'Touch the palm and they grip your finger with surprising strength. It fades around month 5 and gives way to reaching and grabbing on purpose.',
    familyMoment: 'Your finger in their hand for the first time.',
    todos: ['Let them grip your finger — it\'s calming for both of you'],
    playbookKey: null,
  },
  {
    id: 'nb-visual-8in',
    ageStart: 0, ageEnd: 6,
    urgency: 'normal', icon: '👁️', section: 'Sensory',
    title: 'They can see you — at exactly 8–12 inches',
    body: 'Newborns focus best at 8–12 inches — the exact distance to your face when you\'re holding them. High-contrast patterns and faces are what catch their eye. Get close when you talk to them.',
    familyMoment: 'The moment you realized they were actually looking at YOU.',
    todos: ['Get close when talking — 8 to 12 inches', 'High-contrast black/white patterns fascinate them right now'],
    playbookKey: null,
  },
  {
    id: 'nb-tummy-time',
    ageStart: 0, ageEnd: 20,
    urgency: 'high', icon: '💪', section: 'Motor',
    title: 'Tummy time — every single day from day one',
    body: 'Back-to-sleep saves lives. Tummy time builds the strength to roll, sit, crawl, and walk. They\'re connected. Start with 2 minutes after each diaper change and build to 30 minutes total per day by month 4.',
    familyMoment: 'That look on their face when they figure out how to push up. Pure surprise.',
    todos: ['Start today — 2–3 minutes after each diaper change', 'Build to 30 min/day total by 4 months', 'A rolled towel under the chest helps newborns who resist it'],
    playbookKey: null,
  },

  /* ─── WEEKS 5–8 ─── */
  {
    id: 'nb-social-smile',
    ageStart: 5, ageEnd: 10,
    urgency: 'high', icon: '😊', section: 'Social',
    title: 'The social smile (6–8 weeks)',
    body: 'The first intentional smile back at you. Not gas. This is your baby saying: I know you. It\'s the beginning of serve-and-return communication — the back-and-forth that literally builds brain architecture.',
    familyMoment: 'You will remember exactly where you were the first time this happens.',
    todos: ['Smile at your baby all the time — they\'re learning from your face', 'Respond to every coo and smile — they\'re practicing', 'Worth mentioning at next visit if no social smile by 10 weeks'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'nb-cooing',
    ageStart: 5, ageEnd: 12,
    urgency: 'normal', icon: '🎶', section: 'Language',
    title: 'Cooing — their first attempt at conversation',
    body: 'Around 6 weeks, "ooh" and "aah" sounds start. This isn\'t random. They\'re trying to respond to you. Imitate back. Pause. They\'ll try again. That back-and-forth is how language gets built.',
    familyMoment: 'The first time they made a sound that sounded like they meant it.',
    todos: ['Coo back at them', 'Pause after you make a sound — they need a turn'],
    playbookKey: null,
  },
  {
    id: 'nb-smooth-tracking',
    ageStart: 6, ageEnd: 12,
    urgency: 'normal', icon: '👁️', section: 'Sensory',
    title: 'Eyes starting to track smoothly',
    body: 'Eyes now follow a moving object smoothly across their field of vision. Color vision is just beginning. Worth mentioning at next visit if eyes consistently cross after 4 months.',
    familyMoment: 'Watching their eyes follow your face across the room.',
    todos: ['Slowly move a colorful toy — watch the eyes follow', 'Worth mentioning at next visit if eyes consistently cross after 4 months'],
    playbookKey: null,
  },
  {
    id: 'nb-head-45',
    ageStart: 6, ageEnd: 12,
    urgency: 'normal', icon: '💪', section: 'Motor',
    title: 'Lifting head 45° during tummy time',
    body: 'A clear sign of growing neck strength. They\'ll work up to 90 degrees by month 4. Every inch up takes real effort.',
    familyMoment: 'That wobbly little head, straining up to see the world.',
    todos: ['Keep up daily tummy time', 'A mirror placed in front motivates them to hold the position longer'],
    playbookKey: null,
  },

  /* ─── WEEKS 9–12 ─── */
  {
    id: 'nb-laughing',
    ageStart: 10, ageEnd: 18,
    urgency: 'normal', icon: '😂', section: 'Social',
    title: 'First real laugh',
    body: 'Around 3–4 months, real laughter arrives. It requires coordinated breath and vocal control. It also requires a reason — which means they\'re reading your face and finding you funny.',
    familyMoment: 'The first belly laugh. The one that made you do it again for an hour.',
    todos: ['Peek-a-boo, funny faces, silly sounds — this is now officially a game'],
    playbookKey: null,
  },
  {
    id: 'nb-head-steady',
    ageStart: 10, ageEnd: 16,
    urgency: 'normal', icon: '👶', section: 'Motor',
    title: 'Head stays steady when held upright',
    body: 'By 10–12 weeks, the head no longer bobs back. They can hold it upright and look around.',
    familyMoment: 'The moment you could finally hold them outward-facing on your chest.',
    todos: ['Hold them upright on your shoulder more — they love the new perspective'],
    playbookKey: null,
  },
  {
    id: 'nb-propping',
    ageStart: 10, ageEnd: 16,
    urgency: 'normal', icon: '🏋️', section: 'Motor',
    title: 'Propping up on elbows',
    body: 'From lifting the head to lifting the whole chest on two elbows. This is the tummy time payoff.',
    familyMoment: 'That look of concentration as they figure out what their arms can do.',
    todos: ['Place a mirror or bright toy in front — it motivates them to hold the position'],
    playbookKey: null,
  },

  /* ─── 4 MONTHS ─── */
  {
    id: 'iron-supplement-4m',
    ageStart: 16, ageEnd: 26,
    urgency: 'high', icon: '💊', section: 'Feeding',
    title: 'Iron drops for breastfed babies — starts at 4 months',
    body: 'Breast milk is low in iron. Natural stores run out around month 4. The AAP recommends 1 mg/kg of daily oral iron until iron-rich foods are established. Ask about this at the 4-month visit.',
    familyMoment: 'One small thing that protects the brain development you can\'t see happening.',
    todos: ['Ask about iron drops at the 4-month visit', 'Continue until iron-rich solid foods are a regular part of meals'],
    playbookKey: 'feeding',
  },
  {
    id: 'sleep-regression-4m',
    ageStart: 14, ageEnd: 22,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: 'The 4-month sleep regression — it\'s real, and it\'s permanent',
    body: 'Sleep architecture changes permanently around month 4. More night wakings, shorter naps. This isn\'t a phase that passes — it\'s a new normal that you learn to work with. The trap: creating new dependencies now (rocking to sleep, feeding to sleep) that you\'ll need to undo later.',
    familyMoment: 'The night you realized you were up four times and started Googling at 3am. That\'s this.',
    todos: ['Expect disruption — this is real, and it\'s not your fault', 'Avoid introducing rocking or feeding-to-sleep habits right now', 'Start thinking seriously about your sleep training approach'],
    playbookKey: 'sleep',
  },
  {
    id: 'batting-at-objects',
    ageStart: 14, ageEnd: 20,
    urgency: 'normal', icon: '🎯', section: 'Motor',
    title: 'Batting at things — first cause and effect',
    body: 'They\'re not just watching anymore. That swipe at a hanging toy is your baby discovering: I move, things move. Their first experiment in cause and effect.',
    familyMoment: 'Watch their face when they make something swing. That look of surprise at themselves.',
    todos: ['Hang a soft toy within reach during floor time', 'Baby gyms earn their keep during this window'],
    playbookKey: null,
  },
  {
    id: 'vaccines-4m',
    ageStart: 16, ageEnd: 19,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 4-month well-child visit',
    body: 'Vaccines: DTaP, Hib, IPV, PCV, Rotavirus. Developmental check covers rolling, head control, and social smiling. Ask about the 4-month sleep regression while you\'re there.',
    familyMoment: 'They cried. Then they were fine. Then they smiled at the nurse.',
    todos: ['Schedule the 4-month visit', 'Ask about the sleep regression', 'Ask about iron drops if breastfeeding'],
    playbookKey: null,
  },

  /* ─── 4–6 MONTHS ─── */
  {
    id: 'peanut-window',
    ageStart: 17, ageEnd: 48,
    urgency: 'critical', icon: '🥜', section: 'Feeding',
    title: '⚠️ Peanut introduction window: 4–11 months',
    body: 'The LEAP Study (NEJM, 2015) showed that introducing peanuts in this window reduces allergy risk by up to 86% in high-risk infants. For ALL infants, early introduction is now recommended. HIGH-RISK (severe eczema or egg allergy): see your pediatrician first. EVERYONE ELSE: mix 1/4 tsp smooth peanut butter into a puree this week.',
    familyMoment: 'One spoonful of peanut butter in a puree. Possibly a lifetime without a peanut allergy.',
    todos: ['HIGH-RISK (severe eczema or egg allergy): consult pediatrician before introducing', 'LOW-RISK: mix 1/4 tsp smooth peanut butter into fruit or veg puree', 'Watch for 20 minutes after first intro — hives, swelling, or vomiting = call immediately', 'Continue 3×/week to maintain tolerance'],
    playbookKey: 'feeding',
  },
  {
    id: 'first-foods',
    ageStart: 17, ageEnd: 26,
    urgency: 'high', icon: '🥄', section: 'Feeding',
    title: 'Starting solids (4–6 months)',
    body: 'Look for three readiness signs: head steady, showing interest in food, tongue-thrust reflex fading. Start with iron-rich foods — pureed meats or iron-fortified single-grain cereal. The order of vegetables vs. fruits vs. proteins doesn\'t matter clinically. Start one new food every 3–4 days.',
    familyMoment: 'The face they make the first time food isn\'t milk. The confusion is priceless.',
    todos: ['Wait for the three readiness signs', 'Start with iron-rich purees', 'One new food every 3–4 days'],
    playbookKey: 'feeding',
  },
  {
    id: 'feet-discovery',
    ageStart: 14, ageEnd: 22,
    urgency: 'normal', icon: '🦶', section: 'Motor',
    title: 'Feet discovery: the best toys they\'ll ever have',
    body: 'Around 4 months, babies find their feet and are completely fascinated. They\'ll grab them, pull them to their mouth, and chew on them. This isn\'t random — it\'s core strength, hip flexibility, body awareness, and sensory exploration all happening at once. No batteries required.',
    familyMoment: 'The moment they grab their feet for the first time and their face says: wait, these were mine the whole time?',
    todos: ['Let them go barefoot during floor time so feet are easy to grab', 'Try holding a toy near their feet to encourage reaching across the midline'],
    playbookKey: null,
  },
  {
    id: 'four-month-sleep-regression',
    ageStart: 14, ageEnd: 20,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: 'The 4-month sleep regression — it\'s real, and it\'s biology',
    body: 'Around 3–4 months, your baby\'s sleep architecture permanently changes to cycle through light and deep sleep like adults do. The naps that used to last 2 hours are now 30–45 minutes. Night wake-ups increase. This isn\'t a regression — it\'s a maturation. It doesn\'t mean you did anything wrong, and it doesn\'t last forever. Consistent bedtime routine + full feeds during the day help the most.',
    familyMoment: 'Every parent hits this wall and thinks they broke something. You didn\'t. Your baby is just growing a grown-up brain.',
    todos: ['Establish a short, consistent bedtime routine (bath → feed → song → sleep)', 'Aim for full daytime feeds to prevent hunger-driven night waking', 'Consider wake windows: at 4 months, 1.5–2 hours awake is usually the limit before overtiredness'],
    playbookKey: 'sleep',
  },
  {
    id: 'rolling',
    ageStart: 24, ageEnd: 34,
    urgency: 'normal', icon: '🤸', section: 'Motor',
    title: 'Rolling (CDC 2022: benchmark at 6 months)',
    body: 'The CDC 2022 update moved the rolling benchmark to 6 months (previously 4). Most babies roll tummy-to-back first. Once rolling starts: no more unattended time on elevated surfaces.',
    familyMoment: 'The first time they rolled and couldn\'t figure out how to get back.',
    todos: ['Encourage rolling by placing toys to one side', 'Remove from changing table and sofa once rolling begins'],
    playbookKey: null,
  },
  {
    id: 'hearing-localization',
    ageStart: 24, ageEnd: 32,
    urgency: 'normal', icon: '👂', section: 'Sensory',
    title: 'Turning toward sounds (6 months)',
    body: 'Baby should now reliably turn their head to find where a sound is coming from. This is maturing auditory processing.',
    familyMoment: 'Calling their name from across the room and watching them find you.',
    todos: ['Call their name or shake a toy from out of sight — watch them locate it'],
    playbookKey: null,
  },
  {
    id: 'depth-perception',
    ageStart: 26, ageEnd: 40,
    urgency: 'normal', icon: '👁️', section: 'Sensory',
    title: 'Depth perception develops as crawling begins',
    body: 'Around the time crawling starts, the brain begins processing three-dimensional space. Eyes coordinate to judge distances. This is why babies freeze at the edge of the visual cliff — they see the drop.',
    familyMoment: 'Watching them stop and peer over the edge of the play mat, deciding whether to proceed.',
    todos: ['Place toys just out of reach to encourage reaching and crawling'],
    playbookKey: null,
  },
  {
    id: 'hand-to-hand-transfer',
    ageStart: 22, ageEnd: 30,
    urgency: 'normal', icon: '🤲', section: 'Motor',
    title: 'Passing objects hand to hand',
    body: 'Handing a toy from one hand to the other is a significant moment in bilateral coordination — both sides of the brain working together.',
    familyMoment: 'The deliberate pass from left hand to right. They look so serious about it.',
    todos: ['Offer blocks and rings — watch them move things between hands'],
    playbookKey: null,
  },

  /* ─── 6 MONTHS ─── */
  {
    id: 'sleep-training-window',
    ageStart: 24, ageEnd: 39,
    urgency: 'high', icon: '🌙', section: 'Sleep',
    title: 'Sleep training window: 6–9 months',
    body: 'Old enough to self-soothe. Young enough that habits haven\'t hardened. Waiting past 9 months doesn\'t make it easier — it makes it harder. Multiple methods work (Ferber, Fading, Chair, Pick-Up-Put-Down). The research shows they\'re all roughly equivalent. Pick one. Be consistent.',
    familyMoment: 'The first night they put themselves to sleep. You\'ll cry in the hallway.',
    todos: ['Choose your method — then commit to it for at least 2 weeks', 'Target bedtime: 7–8pm (earlier than you think)', 'Get aligned with your partner first', 'Pick a window with no travel or schedule disruptions'],
    playbookKey: 'sleep',
  },
  {
    id: 'water-intro',
    ageStart: 24, ageEnd: 52,
    urgency: 'normal', icon: '💧', section: 'Feeding',
    title: 'Water: small amounts starting at 6 months',
    body: 'Before 6 months, no water at all — even small amounts can cause dangerously low sodium (hyponatremia) in infants. After 6 months, 1–2 oz of water with solid meals is fine. It\'s practice more than hydration.',
    familyMoment: 'That expression of offense when they expected milk and got water.',
    todos: ['Offer 1–2 oz of water in a cup with solid meals starting at 6 months', 'No water before 6 months — not even a sip'],
    playbookKey: 'feeding',
  },
  {
    id: 'allergen-sweep',
    ageStart: 24, ageEnd: 39,
    urgency: 'high', icon: '🥚', section: 'Feeding',
    title: 'Introduce all 9 major allergens (6–9 months)',
    body: 'Introduce peanuts, eggs, tree nuts, dairy, wheat, soy, fish, shellfish, and sesame now, one at a time, 3–4 days apart. The immune system is primed to accept new proteins at this age.',
    familyMoment: 'The first bite of salmon puree. The total confusion on their face.',
    todos: ['Eggs: well-cooked scrambled', 'Tree nuts: almond or cashew butter thinned in puree', 'Fish: pureed salmon or cod', 'Dairy: yogurt or cheese (cow\'s milk as a drink comes later)', 'Keep a food diary during this window'],
    playbookKey: 'feeding',
  },
  {
    id: 'texture-progression',
    ageStart: 26, ageEnd: 39,
    urgency: 'high', icon: '🥣', section: 'Feeding',
    title: 'Lumpy and mashed textures: the window closes at 9 months',
    body: 'Research shows a real window here: introduce lumpy, mashed textures before 9 months. Delaying beyond this is linked to long-term feeding difficulties and increased pickiness. They don\'t need teeth — gums do the work.',
    familyMoment: 'Watching them figure out what to do with something that\'s not smooth. The determination.',
    todos: ['Move from smooth purees to mashed textures now', 'Fork-mashed banana or avocado is a good start', 'Add soft lumps to familiar purees'],
    playbookKey: 'feeding',
  },
  {
    id: 'independent-sitting',
    ageStart: 26, ageEnd: 35,
    urgency: 'normal', icon: '🪑', section: 'Motor',
    title: 'Sitting independently (7–8 months)',
    body: 'Sitting without support frees up both hands to explore objects — a cognitive leap as big as the motor one.',
    familyMoment: 'The day they sat up and just... looked around. Seeing everything from a new angle.',
    todos: ['Practice on a play mat with pillows for the inevitable topples'],
    playbookKey: null,
  },
  {
    id: 'babbling-consonants',
    ageStart: 24, ageEnd: 36,
    urgency: 'normal', icon: '🗣️', section: 'Language',
    title: 'Babbling with consonants',
    body: 'Around 6–7 months, "ba-ba," "da-da," "ma-ma" start appearing. These aren\'t words yet — they\'re practice. The more you talk back, the more material they have to work with.',
    familyMoment: 'The first time they said "dada" and your partner burst into tears.',
    todos: ['Imitate their babble back to them', 'Take turns — pause after you respond and let them "answer"'],
    playbookKey: null,
  },
  {
    id: 'first-tooth',
    ageStart: 22, ageEnd: 36,
    urgency: 'high', icon: '🦷', section: 'Dental',
    title: 'First tooth → first dentist visit',
    body: 'Lower central incisors usually show up around month 6. Book the first dental visit at or before the first birthday (AAPD). Start brushing immediately — a rice-grain smear of fluoride toothpaste on whatever tooth is there.',
    familyMoment: 'That tiny white edge of the first tooth. Reaching in to feel it.',
    todos: ['Book the first dental visit by age 1', 'Brush twice daily with a rice-grain smear of fluoride toothpaste', 'No bottle in bed — the single biggest cause of early childhood cavities'],
    playbookKey: null,
  },
  {
    id: 'sippy-cup',
    ageStart: 24, ageEnd: 34,
    urgency: 'normal', icon: '🥛', section: 'Feeding',
    title: 'Introduce a cup — practice for bottle weaning at 12 months',
    body: 'Start with 1–2 oz of water in a soft-spout or open cup. This is motor practice, not hydration. The goal is to make the 12-month bottle transition feel familiar rather than sudden.',
    familyMoment: 'Water going everywhere except in their mouth. This is the phase.',
    todos: ['Offer a small cup at mealtimes starting at 6 months', 'No juice before 12 months'],
    playbookKey: 'feeding',
  },
  {
    id: 'vaccines-6m',
    ageStart: 24, ageEnd: 28,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 6-month well-child visit + first flu vaccine',
    body: 'Vaccines: DTaP, Hib, IPV, PCV, HepB. First annual flu vaccine. If it\'s their very first flu shot, they need two doses 4 weeks apart.',
    familyMoment: 'Six months. You\'ve kept a human being alive for six months.',
    todos: ['Schedule the 6-month visit', 'First flu vaccine — two doses if first time ever', 'Ask about iron levels'],
    playbookKey: null,
  },

  /* ─── 7–9 MONTHS ─── */
  {
    id: 'finger-foods-start',
    ageStart: 30, ageEnd: 40,
    urgency: 'high', icon: '🫐', section: 'Feeding',
    title: 'Soft finger foods: the fun begins (7–9 months)',
    body: 'Once they can sit unassisted and bring objects to their mouth, they\'re ready. Soft, dissolvable foods only. No teeth needed — gums do more than you think.',
    familyMoment: 'Watching them pick up a blueberry for the first time, concentrating like it\'s surgery.',
    todos: ['Start with 1/4-inch pieces of banana, avocado, or well-cooked sweet potato', 'Always sit with them while they eat — this is still a new skill'],
    playbookKey: 'feeding',
  },
  {
    id: 'stranger-anxiety',
    ageStart: 32, ageEnd: 52,
    urgency: 'normal', icon: '👶', section: 'Social',
    title: 'Stranger anxiety — a sign of secure attachment',
    body: 'The baby who smiled at everyone now cries when Grandma picks them up. This isn\'t a problem — it\'s a milestone. It means they know who their people are.',
    familyMoment: 'Grandma will understand. Eventually.',
    todos: ['Warn relatives to wait and let baby come to them on their own terms', 'Stay close — you\'re the secure base they\'re operating from'],
    playbookKey: null,
  },
  {
    id: 'object-permanence',
    ageStart: 32, ageEnd: 52,
    urgency: 'normal', icon: '🧸', section: 'Cognitive',
    title: 'Object permanence — and why separation got harder',
    body: 'Baby now understands things exist when out of sight. This explains two things happening at once: why peek-a-boo is suddenly hilarious, and why they cry when you leave the room.',
    familyMoment: 'The moment you realized the peek-a-boo was actually funny to them, not just to you.',
    todos: ['Play hiding games with toys', 'Narrate separations: "I\'m going to the kitchen. I\'ll be right back."'],
    playbookKey: null,
  },
  {
    id: 'responds-to-name',
    ageStart: 30, ageEnd: 44,
    urgency: 'high', icon: '🔔', section: 'Language',
    title: 'Responding to their name (8–9 months)',
    body: 'By 8–9 months, baby should reliably turn toward you when you say their name. This is both a language and attention milestone.',
    familyMoment: 'Saying their name and watching them find your face.',
    todos: ['Test from across the room — say their name without moving', 'Worth mentioning at next visit if no reliable response by 9 months'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'pincer-grasp',
    ageStart: 36, ageEnd: 46,
    urgency: 'normal', icon: '🤏', section: 'Motor',
    title: 'Pincer grasp — and now they can pick up everything on the floor',
    body: 'The transition from raking at objects to using thumb and index finger takes place around 9 months. Once it arrives, assume anything small on the floor is fair game. Re-check baby-proofing.',
    familyMoment: 'The intense concentration of picking up a single puff.',
    todos: ['Offer puffs or cooked peas for practice', 'Scan the floor for coins, buttons, and batteries'],
    playbookKey: 'feeding',
  },
  {
    id: 'nap-3to2',
    ageStart: 35, ageEnd: 44,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: '3-to-2 nap transition',
    body: 'Signs it\'s time: the third nap gets refused consistently, or bedtime gets pushed past 8:30pm. Extend wake windows by 15 minutes at a time. Takes 2–4 weeks to stabilize.',
    familyMoment: 'The long afternoon window that appears when the third nap drops. Strange and glorious.',
    todos: ['Shift gradually — no cold turkey', 'Protect the morning nap (it\'s the last to go)'],
    playbookKey: 'sleep',
  },
  {
    id: 'crawling',
    ageStart: 32, ageEnd: 48,
    urgency: 'normal', icon: '🚗', section: 'Motor',
    title: 'Crawling (with one important asterisk)',
    body: 'Most babies crawl between 7–10 months. Important note: about 4% of healthy children skip crawling entirely and go straight to walking. WHO data confirms this is within normal range.',
    familyMoment: 'First day of real crawling: you need to look at every corner of the house from 8 inches off the ground.',
    todos: ['Create open floor space for exploration', 'Baby-proof at ground level: cords, sharp furniture edges, stairs'],
    playbookKey: null,
  },
  {
    id: 'pulling-to-stand',
    ageStart: 36, ageEnd: 52,
    urgency: 'normal', icon: '🧍', section: 'Motor',
    title: 'Pulling to stand',
    body: 'Using furniture for support to pull themselves upright. This is the last precursor to walking. Make sure heavy furniture is wall-anchored now.',
    familyMoment: 'Standing at the coffee table, looking so proud of themselves.',
    todos: ['Clear low shelves they might grab', 'Wall-anchor bookshelves and dressers now — they will pull on them'],
    playbookKey: null,
  },
  {
    id: 'lead-screening',
    ageStart: 38, ageEnd: 55,
    urgency: 'normal', icon: '🧪', section: 'Health',
    title: 'Lead risk screening (9–12 months)',
    body: 'The AAP recommends a lead risk assessment for all children from 6 months to 6 years. Blood lead testing at 12 and 24 months for children in pre-1978 housing or with specific risk factors.',
    familyMoment: 'A simple question at a routine visit that can make a real difference.',
    todos: ['Ask your pediatrician about lead risk at the 9 or 12-month visit', 'Pre-1978 housing: request a blood lead test'],
    playbookKey: null,
  },
  {
    id: 'vaccines-9m',
    ageStart: 38, ageEnd: 42,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 9-month well-child visit',
    body: 'No vaccines this round — just a developmental check. Language: varied babbling. Confirm allergens have been introduced.',
    familyMoment: 'Nine months. They\'ve been outside as long as they were inside.',
    todos: ['Schedule the 9-month visit', 'Confirm allergen introduction is complete'],
    playbookKey: null,
  },

  /* ─── 11 MONTHS ─── */
  {
    id: 'peanut-closing',
    ageStart: 44, ageEnd: 49,
    urgency: 'critical', icon: '🥜', section: 'Feeding',
    title: '🚨 Peanut introduction window is closing',
    body: 'The 4–11 month early introduction window closes soon. If peanuts haven\'t been introduced yet: this week, not next week.',
    familyMoment: 'A small thing done now. A potentially large thing avoided later.',
    todos: ['Introduce peanut butter this week if not yet done', 'Mix 1/4 tsp smooth peanut butter into any food they already like'],
    playbookKey: 'feeding',
  },

  /* ─── 12 MONTHS ─── */
  {
    id: 'honey-warning',
    ageStart: 0, ageEnd: 52,
    urgency: 'critical', icon: '🍯', section: 'Feeding',
    title: '⚠️ No honey before age 1 — any form',
    body: 'The main risk is raw or unpasteurized honey: it can contain Clostridium botulinum spores that an infant\'s gut cannot neutralize. The AAP takes a conservative position and advises avoiding all honey products before the first birthday.',
    familyMoment: 'One hard rule with a clear end date. First birthday: honey is fine.',
    todos: ['No honey in any form before the first birthday', 'After age 1: all clear'],
    playbookKey: 'feeding',
  },
  {
    id: 'bottle-weaning',
    ageStart: 50, ageEnd: 78,
    urgency: 'high', icon: '🍼', section: 'Feeding',
    title: 'Wean from the bottle by 12–18 months',
    body: 'Prolonged bottle use is the leading cause of early childhood dental cavities and contributes to iron deficiency by displacing iron-rich solid foods. This is a harder transition than most parents expect — start it at 12 months, not 18.',
    familyMoment: 'They\'ll forget the bottle faster than you think they will.',
    todos: ['Start offering milk in a cup at 12 months', 'Drop one bottle feeding per week', 'Never put baby to bed with a bottle — milk pools around teeth during sleep'],
    playbookKey: 'feeding',
  },
  {
    id: 'first-steps',
    ageStart: 46, ageEnd: 68,
    urgency: 'high', icon: '👣', section: 'Motor',
    title: 'First steps (9–15 months)',
    body: 'CDC 2022 benchmark is 15 months (75th percentile). WHO data puts the full normal range at 8.2–17.6 months. Wide stance and arms out are normal. Barefoot indoors is better than shoes for building balance and foot strength.',
    familyMoment: 'The first real step across open floor, then sitting down hard and looking up at you.',
    todos: ['Barefoot indoors as much as possible', 'Worth mentioning at next visit if not walking by 18 months'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'cows-milk',
    ageStart: 50, ageEnd: 56,
    urgency: 'high', icon: '🥛', section: 'Feeding',
    title: 'Switch to whole cow\'s milk at 12 months',
    body: 'The fat in whole milk is needed for brain development until age 2. Before 12 months, cow\'s milk causes iron deficiency and is too hard on infant kidneys. After 12: whole milk only, capped at 24 oz/day (more than that pushes out iron-rich foods).',
    familyMoment: 'The official end of the formula chapter.',
    todos: ['Transition to whole milk after the first birthday', 'No skim or 1% until after age 2', 'Cap at 24 oz/day to leave room for solid foods'],
    playbookKey: 'feeding',
  },
  {
    id: 'self-feeding-hands',
    ageStart: 39, ageEnd: 52,
    urgency: 'normal', icon: '🖐️', section: 'Feeding',
    title: 'Self-feeding with fingers',
    body: 'By 12 months, they should be feeding themselves a variety of finger foods independently. Messy is not a problem — it\'s the point.',
    familyMoment: 'The highchair tray that takes 10 minutes to clean. Worth every second.',
    todos: ['Let them feed themselves — resist the urge to clean up mid-meal'],
    playbookKey: 'feeding',
  },
  {
    id: 'choking-hazards-active',
    ageStart: 26, ageEnd: 208,
    urgency: 'high', icon: '🍎', section: 'Feeding',
    title: 'Choking hazard rules (until age 4)',
    body: 'Children under 4 don\'t have the oral motor coordination to safely chew certain shapes and textures. Grapes and cherry tomatoes must be cut lengthwise into small slivers. Hot dogs in rounds are a documented cause of death. No whole nuts, popcorn, or raw carrot sticks.',
    familyMoment: 'The 20 extra seconds it takes to cut grapes properly.',
    todos: ['Cut grapes and cherry tomatoes lengthwise into small pieces', 'Cut hot dogs into lengthwise strips, not round slices', 'No whole nuts, popcorn, or raw carrot sticks under age 4'],
    playbookKey: 'feeding',
  },
  {
    id: 'first-words',
    ageStart: 46, ageEnd: 62,
    urgency: 'high', icon: '🗣️', section: 'Language',
    title: 'First real words (12–15 months)',
    body: 'Beyond "mama/dada," look for words tied to specific meaning. At 15 months, 10–15 words are expected. Reading aloud every day is the single highest-return language investment you can make.',
    familyMoment: 'The first time they said a word and clearly meant it.',
    todos: ['Read aloud every day — no other single thing moves vocabulary faster', 'Worth mentioning at next visit if no words by 16 months'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'gestures-12m',
    ageStart: 46, ageEnd: 58,
    urgency: 'normal', icon: '👋', section: 'Language',
    title: 'Pointing, waving, shaking head',
    body: 'Pointing to SHARE interest — not just to ask for something — is one of the most significant 12-month milestones and one of the earliest autism red flags when absent.',
    familyMoment: 'The first time they pointed at a dog, not to get it, but to show you it.',
    todos: ['Model pointing and waving constantly', 'Worth mentioning at next visit if no pointing by 12 months'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'vaccines-12m',
    ageStart: 50, ageEnd: 55,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 12-month well-child visit',
    body: 'Vaccines: MMR, Varicella, HepA dose 1, Hib booster, PCV booster. Discuss the milk transition and bottle weaning plan.',
    familyMoment: 'One year. You did that.',
    todos: ['Schedule the 12-month visit', 'Vaccines: MMR, Varicella, HepA, Hib, PCV'],
    playbookKey: null,
  },

  /* ─── 15–18 MONTHS ─── */
  {
    id: 'spoon-attempt',
    ageStart: 43, ageEnd: 78,
    urgency: 'normal', icon: '🥄', section: 'Feeding',
    title: 'First spoon attempts',
    body: 'Around 10–18 months, the spoon appears. It will be chaotic until around 18–24 months. Messy mealtimes are developmental progress.',
    familyMoment: 'Yogurt on the ceiling. On the ceiling.',
    todos: ['Offer a spoon and let them practice', 'Pre-load it for them and let them bring it to their mouth'],
    playbookKey: 'feeding',
  },
  {
    id: 'cup-transition',
    ageStart: 52, ageEnd: 78,
    urgency: 'normal', icon: '🥤', section: 'Feeding',
    title: 'Transition to an open cup',
    body: 'By 15–18 months, children can start drinking from an open cup with light assistance. It\'s messier than a sippy. It\'s also better for dental and oral motor development.',
    familyMoment: 'The first time they handled the cup themselves without spilling.',
    todos: ['Practice with a small amount of water in a small open cup'],
    playbookKey: 'feeding',
  },
  {
    id: 'autism-screen-18m',
    ageStart: 74, ageEnd: 82,
    urgency: 'critical', icon: '🧩', section: 'Health',
    title: '⚠️ Autism screening at 18 months (M-CHAT-R/F)',
    body: 'The AAP requires this at 18 AND 24 months. The M-CHAT-R/F takes 5 minutes and catches most cases early. Earlier diagnosis means dramatically better outcomes. If your pediatrician doesn\'t offer it: ask.',
    familyMoment: 'Five minutes that can change the trajectory of a child\'s life.',
    todos: ['Confirm the M-CHAT-R/F screen happens at the 18-month visit', 'Any skill REGRESSION at any age = call immediately — don\'t wait for the next visit'],
    playbookKey: null,
  },
  {
    id: 'nap-2to1',
    ageStart: 60, ageEnd: 78,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: '2-to-1 nap transition (15–18 months)',
    body: 'One of the trickiest transitions. Move to one midday nap and temporarily push bedtime earlier (6:30pm) to avoid overtiredness during the adjustment period.',
    familyMoment: 'The morning nap you thought you\'d never give up.',
    todos: ['Watch for morning nap refusal two+ weeks in a row', 'Shift to one midday nap (aim for 11:30am–noon)', 'Move bedtime to 6:30pm until it settles'],
    playbookKey: 'sleep',
  },
  {
    id: 'kicking-ball',
    ageStart: 60, ageEnd: 80,
    urgency: 'normal', icon: '⚽', section: 'Athletic',
    title: 'Kicking a ball forward (15 months)',
    body: 'To kick forward you have to stand on one leg while swinging the other. More balance than it looks.',
    familyMoment: 'The kick that missed entirely. The kick after that one that didn\'t.',
    todos: ['Provide a soft ball and model kicking — they\'ll imitate immediately'],
    playbookKey: null,
  },
  {
    id: 'running-stiff',
    ageStart: 74, ageEnd: 95,
    urgency: 'normal', icon: '🏃', section: 'Athletic',
    title: 'Running — stiff, fast, and directionless',
    body: 'Around 18 months, they discover they can move faster. Arms up, wide stance, limited steering. Falls are part of the curriculum.',
    familyMoment: 'Watching them run toward you at full speed.',
    todos: ['Give them open space to run', 'Falls are normal and good — resist catching every one'],
    playbookKey: null,
  },
  {
    id: 'scribbling',
    ageStart: 74, ageEnd: 96,
    urgency: 'normal', icon: '✏️', section: 'Fine Motor',
    title: 'Scribbling (15–18 months)',
    body: 'Around 15–18 months, they make their first marks — fisted grip on the crayon, wild strokes. This is fine motor development and creative expression in the same moment.',
    familyMoment: 'Their first piece of art. Frame it.',
    todos: ['Provide big crayons and large paper', 'Don\'t correct the grip yet — let them explore'],
    playbookKey: null,
  },
  {
    id: 'parallel-play',
    ageStart: 78, ageEnd: 130,
    urgency: 'normal', icon: '🧸', section: 'Social',
    title: 'Parallel play — next to each other, not with each other',
    body: 'Playing beside another child rather than with them. This is not antisocial — it\'s the bridge before cooperative play. They\'re studying each other.',
    familyMoment: 'Two kids at the same toy box, each in their own world, occasionally glancing sideways.',
    todos: ['Arrange playdates with open space and plenty of toys', 'Don\'t force sharing — parallel play comes before sharing'],
    playbookKey: null,
  },
  {
    id: 'tantrum-peak',
    ageStart: 78, ageEnd: 130,
    urgency: 'high', icon: '⚡', section: 'Tantrums',
    title: 'Tantrum peak: 18 months to 3 years',
    body: '87% of toddlers have tantrums. This isn\'t bad parenting — it\'s an underdeveloped prefrontal cortex combined with big feelings and limited vocabulary. The language gap makes it worse: toddlers who talk later have nearly twice the tantrum risk (Manning, 2019).',
    familyMoment: 'The tantrum about the wrong colored cup. They don\'t remember it. You won\'t forget it.',
    todos: ['Learn the two phases: anger first, then distress — they need different responses', 'Never give in during a tantrum — it teaches the tantrum works (Mo et al., 2023)', 'Address hunger and tiredness proactively — they\'re the biggest triggers'],
    playbookKey: 'tantrum',
  },
  {
    id: 'picky-eating-phase',
    ageStart: 52, ageEnd: 312,
    urgency: 'normal', icon: '🥦', section: 'Feeding',
    title: 'Picky eating is normal — and temporary',
    body: 'Fear of new foods (neophobia) typically begins around 12–18 months and peaks between 2 and 6 years. It can take 15–20 exposures before a child accepts a new food. The research is clear: keep offering, without pressure.',
    familyMoment: 'The broccoli you\'ve put on their plate 14 consecutive times.',
    todos: ['Offer without force — the "one bite" rule only', 'Keep putting the rejected food on the plate — exposure is the mechanism', 'Eat the same food yourself — they watch you more than you know'],
    playbookKey: 'feeding',
  },
  {
    id: 'no-screens-18m',
    ageStart: 78, ageEnd: 104,
    urgency: 'normal', icon: '📱', section: 'Screen Time',
    title: 'Limited screens: now OK with conditions',
    body: 'AAP allows up to 1 hour/day of high-quality content from 18–24 months. But toddlers can\'t transfer screen content to real life without a parent bridging the gap. Solo screen time at this age doesn\'t teach — it just plays.',
    familyMoment: 'Watching them watch Ms. Rachel and then immediately go find their own toys to play with.',
    todos: ['Co-view and talk about what you\'re watching', 'Quality: Ms. Rachel, Sesame Street, Daniel Tiger', 'No autoplay', 'Screens off 60 min before bed'],
    playbookKey: 'screen-time',
  },
  {
    id: 'potty-ready',
    ageStart: 78, ageEnd: 130,
    urgency: 'high', icon: '🚽', section: 'Potty Training',
    title: 'Potty training readiness — watch for the signs',
    body: 'Readiness signs emerge around 18–24 months. But starting intensive training before 27 months takes significantly longer — an average of 13–14 months vs. under 10 months for children who start after 27 months (Blum et al., Pediatrics 2003). Watch for the signs. Wait for the window.',
    familyMoment: 'The first time they told you before they went instead of after.',
    todos: ['Watch for readiness: staying dry for 2+ hours, showing interest in the toilet', 'Read the Potty Training Playbook before committing to the intensive weekend'],
    playbookKey: 'potty-training',
  },
  {
    id: 'vaccines-18m',
    ageStart: 77, ageEnd: 82,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 18-month well-child visit',
    body: 'Vaccines: DTaP booster, HepA dose 2. Autism screen: M-CHAT-R/F. Language check.',
    familyMoment: 'A year and a half. The face in the waiting room isn\'t the face from month one.',
    todos: ['Schedule the 18-month visit', 'Confirm the M-CHAT autism screen is completed'],
    playbookKey: null,
  },

  /* ─── 2 YEARS ─── */
  {
    id: 'no-added-sugar',
    ageStart: 0, ageEnd: 104,
    urgency: 'high', icon: '🍭', section: 'Feeding',
    title: 'No added sugar before age 2',
    body: 'The AAP recommendation is zero added sugar for children under 2. Not because a bite of birthday cake will cause harm — but because taste preferences are being established right now. Whole fruit only for sweetness.',
    familyMoment: 'The face they make when they taste something genuinely sweet for the first time.',
    todos: ['Avoid added sugars and sweeteners', 'Whole fruit is the right answer for sweetness at this age'],
    playbookKey: 'feeding',
  },
  {
    id: 'fork-spoon-proficient',
    ageStart: 78, ageEnd: 130,
    urgency: 'normal', icon: '🍴', section: 'Feeding',
    title: 'Fork and spoon proficiency (around age 2)',
    body: 'By age 2, they should be handling a spoon and fork well enough to feed themselves most of the meal.',
    familyMoment: 'The first meal where you realized you didn\'t have to help at all.',
    todos: ['Encourage self-feeding at every meal', 'Provide child-sized utensils'],
    playbookKey: 'feeding',
  },
  {
    id: 'autism-screen-24m',
    ageStart: 103, ageEnd: 108,
    urgency: 'high', icon: '🧩', section: 'Health',
    title: 'Autism screening at 24 months',
    body: 'The second AAP-required screen. Children who screen negative at 18 months but show concerns at 24 months represent a real subgroup. This one matters.',
    familyMoment: 'Five minutes that catches what might otherwise take years to notice.',
    todos: ['Request the M-CHAT-R/F at the 2-year visit'],
    playbookKey: null,
  },
  {
    id: 'language-2yr',
    ageStart: 103, ageEnd: 108,
    urgency: 'high', icon: '🗣️', section: 'Language',
    title: '2-year language check: combining words',
    body: 'By 2, they should be combining 2+ words: "Want milk," "Daddy go," "More please." Children with fewer than 50 words at this age have nearly twice the risk of severe tantrums — because language is still the fastest-developing behavior-management tool they have (Manning, 2019).',
    familyMoment: 'The first sentence. Small words. Enormous moment.',
    todos: ['Is child combining 2+ words? If not: request a speech evaluation', 'Bilingual families: count words across BOTH languages combined — that\'s the clinical measure'],
    playbookKey: 'tantrum',
    redFlag: true,
  },
  {
    id: 'language-30m',
    ageStart: 125, ageEnd: 135,
    urgency: 'high', icon: '🗣️', section: 'Language',
    title: '30-month language: 50+ words',
    body: 'CDC 2022 moved this benchmark from 18 months to 30 months (75th percentile). If under 50 words at 30 months: request a speech evaluation — early intervention is free and it works.',
    familyMoment: 'The week you stopped counting and realized you\'d lost track because there were too many.',
    todos: ['Count current vocabulary — aim for 50+', 'Bilingual families: words across both languages combined is the number that matters'],
    playbookKey: 'tantrum',
    redFlag: true,
  },
  {
    id: 'well-child-30m',
    ageStart: 128, ageEnd: 135,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 30-month well-child visit',
    body: 'AAP added this visit specifically for developmental and language surveillance. Don\'t skip it.',
    familyMoment: 'Two and a half. They have opinions about everything now.',
    todos: ['Schedule the 30-month visit'],
    playbookKey: null,
  },
  {
    id: 'jumping-both-feet',
    ageStart: 100, ageEnd: 125,
    urgency: 'high', icon: '🐰', section: 'Athletic',
    title: 'Jumping with both feet (around 2 years)',
    body: 'Both feet leaving the ground simultaneously. More coordinated than it sounds.',
    familyMoment: 'The pure joy of discovering you can become briefly airborne.',
    todos: ['Jump like bunnies or frogs — they love having a reason'],
    playbookKey: null,
  },
  {
    id: 'stacking-blocks',
    ageStart: 100, ageEnd: 130,
    urgency: 'normal', icon: '🧱', section: 'Fine Motor',
    title: 'Stacking 6+ blocks',
    body: 'Stacking requires fine motor precision and the beginning of spatial reasoning.',
    familyMoment: 'The moment just before the tower falls — the whole room holds its breath.',
    todos: ['Build towers and let them knock them down', 'Duplo or Mega Bloks are perfect for this stage'],
    playbookKey: null,
  },
  {
    id: 'theory-of-mind',
    ageStart: 100, ageEnd: 180,
    urgency: 'normal', icon: '🧠', section: 'Social',
    title: 'Empathy emerging — they\'re starting to notice you',
    body: 'Around age 2, children begin to understand that other people have their own separate feelings. They might bring you a toy when you seem sad. They might comfort another crying child.',
    familyMoment: 'The first time they brought you something when you were upset. Without being asked.',
    todos: ['Label emotions — theirs and yours: "I\'m feeling frustrated. I need a minute."', 'Praise kind behavior specifically: "That was kind of you to share that."'],
    playbookKey: 'tantrum',
  },
  {
    id: 'milk-2yr',
    ageStart: 103, ageEnd: 112,
    urgency: 'normal', icon: '🥛', section: 'Feeding',
    title: 'Switch from whole to 2% milk at 2 years',
    body: 'Whole milk\'s fat content is specifically needed for brain development in the first two years. After 2, ask your pediatrician about switching to 2%.',
    familyMoment: 'The last of the whole milk chapter.',
    todos: ['Discuss at the 2-year visit'],
    playbookKey: 'feeding',
  },
  {
    id: 'handwashing-solo',
    ageStart: 120, ageEnd: 180,
    urgency: 'normal', icon: '🧼', section: 'Self-Care',
    title: 'Learning to wash hands',
    body: 'They can learn the steps around age 2. They\'ll need help with temperature and thoroughness for a while longer.',
    familyMoment: 'The pride on their face when they do it by themselves.',
    todos: ['Practice before meals and after every bathroom trip'],
    playbookKey: null,
  },
  {
    id: 'vaccines-24m',
    ageStart: 103, ageEnd: 108,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 2-year well-child visit',
    body: 'Developmental and autism screens. Second autism screen (M-CHAT). 2-year molars may be coming in.',
    familyMoment: 'Two years. The person they\'re becoming is starting to be visible.',
    todos: ['Schedule the 2-year visit', 'Second autism screen', 'Language check: 2-word combinations?'],
    playbookKey: null,
  },

  /* ─── 3 YEARS ─── */
  {
    id: 'nap-1to0',
    ageStart: 156, ageEnd: 260,
    urgency: 'high', icon: '😴', section: 'Sleep',
    title: 'Dropping the last nap (average age: 3.5 years)',
    body: 'At age 3, 91% of kids still nap. At age 4, 60%. At age 5, 30%. Signs they\'re ready: taking 60+ minutes to fall asleep at nap, or bedtime getting pushed later. Replace with "Quiet Time" — one hour alone in their room. They rest. You breathe.',
    familyMoment: 'The first Quiet Time where you heard nothing for an hour and wondered what was wrong.',
    todos: ['Watch for consistent nap resistance before making the change', 'Replace nap with 1 hour of quiet time in their room', 'Move bedtime earlier to compensate during the transition'],
    playbookKey: 'sleep',
  },
  {
    id: 'nighttime-fears',
    ageStart: 156, ageEnd: 312,
    urgency: 'normal', icon: '👻', section: 'Sleep',
    title: 'Nighttime fears and nightmares',
    body: 'Imagination explodes at age 3–4. Night terrors (screaming while still asleep, no memory next day) differ from nightmares (they wake up, remember the dream). Both are normal. Night terrors: don\'t wake them — just stay nearby and ensure safety.',
    familyMoment: 'Sneaking in to check on them and finding them completely fine.',
    todos: ['A small nightlight does more than you\'d expect', 'Consistent bedtime routine is the single best protection against nighttime fears', 'Night terrors: stay close, don\'t wake, it passes in minutes'],
    playbookKey: 'sleep',
  },
  {
    id: 'tantrum-decline',
    ageStart: 155, ageEnd: 195,
    urgency: 'normal', icon: '⚡', section: 'Tantrums',
    title: 'Tantrums should start declining now',
    body: 'Self-regulation is finally developing. "I\'m mad" should start replacing the full meltdown. If frequency is NOT declining by 3.5 years — or if tantrums are lasting more than 25 minutes or happening more than 5 times a day — mention it at the next visit.',
    familyMoment: 'The first time they used words instead of falling on the floor. A small miracle.',
    todos: ['Teach emotion vocabulary: mad, sad, frustrated, scared', 'Worth mentioning at next visit if not declining by 3.5 years'],
    playbookKey: 'tantrum',
  },
  {
    id: 'primary-teeth-complete',
    ageStart: 130, ageEnd: 170,
    urgency: 'normal', icon: '🦷', section: 'Dental',
    title: 'All 20 baby teeth present',
    body: 'Typically complete by age 3, including the 2-year molars in the back.',
    familyMoment: 'A full set of tiny teeth. Take a photo before they start falling out.',
    todos: ['Confirm all 20 baby teeth are in', 'Continue twice-daily supervised brushing'],
    playbookKey: null,
  },
  {
    id: 'fluoride-3yr',
    ageStart: 156, ageEnd: 175,
    urgency: 'normal', icon: '🦷', section: 'Dental',
    title: 'Switch to pea-sized fluoride toothpaste at 3',
    body: 'Increase from rice-grain to pea-sized amount at age 3. Still supervise — they don\'t have the dexterity to do this well on their own until age 8.',
    familyMoment: 'The negotiation over the toothpaste flavor. Every night.',
    todos: ['Pea-sized amount starting at age 3', 'Let them "go first" then finish for them'],
    playbookKey: null,
  },
  {
    id: 'pacifier-wean',
    ageStart: 104, ageEnd: 182,
    urgency: 'normal', icon: '🍬', section: 'Health',
    title: 'Wean from the pacifier by age 2–3',
    body: 'Prolonged pacifier use past age 2–3 can cause dental malocclusion and may interfere with speech development. The longer you wait, the harder the wean. Limit to sleep-only after 18 months, then remove entirely before age 3.',
    familyMoment: 'The "Paci Fairy" visit. The absolute belief in magic.',
    todos: ['Limit pacifier to sleep only after 18 months', 'Plan the full wean before age 3'],
    playbookKey: null,
  },
  {
    id: 'tricycle',
    ageStart: 150, ageEnd: 190,
    urgency: 'normal', icon: '🛺', section: 'Athletic',
    title: 'Pedaling a tricycle',
    body: 'Alternating legs in rhythm while steering — more coordination than it looks. Most kids get this around age 3.',
    familyMoment: 'The first time they made it all the way around the block.',
    todos: ['A properly-sized tricycle or balance bike makes this much easier'],
    playbookKey: null,
  },
  {
    id: 'alternating-stairs',
    ageStart: 150, ageEnd: 190,
    urgency: 'normal', icon: '🪜', section: 'Athletic',
    title: 'Alternating feet on stairs',
    body: 'Moving from "both feet per step" to one foot per step — a real balance and leg strength milestone.',
    familyMoment: 'Counting the steps as you go up. Doing it again on the way down.',
    todos: ['Practice together holding hands', 'Count the steps — they love counting things'],
    playbookKey: null,
  },
  {
    id: 'catching-large',
    ageStart: 156, ageEnd: 200,
    urgency: 'normal', icon: '🏀', section: 'Athletic',
    title: 'Catching a large ball',
    body: 'Using arms and chest to secure a large tossed ball from short range.',
    familyMoment: 'The celebration after the first catch. Arms wide, enormous grin.',
    todos: ['Toss a large soft ball from 3–4 feet away — close range builds confidence first'],
    playbookKey: null,
  },
  {
    id: 'jumping-forward',
    ageStart: 156, ageEnd: 200,
    urgency: 'normal', icon: '📏', section: 'Athletic',
    title: 'Jumping forward (10–24 inches)',
    body: 'By age 3, jumping becomes directional. They can now jump OVER things.',
    familyMoment: 'Every crack in the sidewalk is now a challenge.',
    todos: ['Place a stick on the grass and jump over it together'],
    playbookKey: null,
  },
  {
    id: 'counting-to-3',
    ageStart: 156, ageEnd: 180,
    urgency: 'normal', icon: '🔢', section: 'Cognitive',
    title: 'Counting to 3 with understanding',
    body: 'Not just reciting numbers — actually matching one number to one object. This is the foundation of mathematical thinking.',
    familyMoment: '"Can you bring me three crackers?" When they get it right, it\'s genuinely exciting.',
    todos: ['Count real objects together — fruit, crackers, blocks', 'Ask "can you give me THREE of those?" and watch them count out loud'],
    playbookKey: null,
  },
  {
    id: 'drawing-circle',
    ageStart: 156, ageEnd: 190,
    urgency: 'normal', icon: '⭕', section: 'Fine Motor',
    title: 'Drawing a circle',
    body: 'After seeing a model, a 3-year-old can reproduce a rough circle. Circles become suns, faces, and wheels.',
    familyMoment: 'The first self-portrait. The circle head with lines sticking out.',
    todos: ['Draw circles together — then ask what they see in it'],
    playbookKey: null,
  },
  {
    id: 'understanding-time',
    ageStart: 156, ageEnd: 208,
    urgency: 'normal', icon: '⏰', section: 'Cognitive',
    title: 'Yesterday, today, tomorrow',
    body: 'Concept of time starts to form around age 3. They begin using time words correctly, even if "yesterday" means "any time before right now."',
    familyMoment: '"Yesterday we went to the park." Two weeks ago. But they mean it.',
    todos: ['Talk about what you did yesterday and what\'s happening tomorrow'],
    playbookKey: null,
  },
  {
    id: 'vision-screen',
    ageStart: 156, ageEnd: 182,
    urgency: 'high', icon: '👁️', section: 'Health',
    title: 'Vision screening for amblyopia (age 3–5)',
    body: 'Amblyopia (lazy eye) affects 2–3% of children and is completely silent — no squinting, no complaints, nothing visible. Treatment before age 7 works. After age 7, it plateaus. This screening is not optional.',
    familyMoment: 'A 5-minute screening that can save a child\'s vision.',
    todos: ['Request a vision screen at the 3-year well-child visit', 'Worth mentioning before the visit if you notice squinting, head tilting, or one eye turning'],
    playbookKey: null,
  },
  {
    id: 'self-dressing-simple',
    ageStart: 156, ageEnd: 210,
    urgency: 'normal', icon: '👕', section: 'Self-Care',
    title: 'Putting on simple clothes (age 3)',
    body: 'Can pull up pants and put on a loose shirt with minimal help. Buttons and zippers still need assistance.',
    familyMoment: 'The outfit they chose themselves. The one that doesn\'t match at all.',
    todos: ['Offer choices: "This one or that one?" — not "whatever you want"', 'Allow extra time so they can try before you help'],
    playbookKey: null,
  },
  {
    id: 'toilet-wiping-solo',
    ageStart: 130, ageEnd: 208,
    urgency: 'normal', icon: '🧻', section: 'Self-Care',
    title: 'Learning to wipe independently',
    body: 'A key milestone for preschool and school readiness. Front-to-back is the technique. Supervision and a "finish" by the adult until they\'re consistently clean.',
    familyMoment: 'The milestone nobody puts on the announcement card.',
    todos: ['Practice front-to-back together', 'Supervise and finish for them until they\'re reliably clean'],
    playbookKey: 'potty-training',
  },
  {
    id: 'vaccines-3yr',
    ageStart: 155, ageEnd: 165,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 3-year well-child visit',
    body: 'Vision screen for amblyopia. Language check: strangers should understand about 75% of speech. Annual visits begin.',
    familyMoment: 'Three years old. They have a personality now.',
    todos: ['Schedule the 3-year visit', 'Vision screen for amblyopia'],
    playbookKey: null,
  },

  /* ─── 4–5 YEARS ─── */
  {
    id: 'hopping-one-foot',
    ageStart: 208, ageEnd: 250,
    urgency: 'normal', icon: '🦩', section: 'Athletic',
    title: 'Hopping on one foot (age 4)',
    body: 'Three to five hops on one foot, with control. A meaningful balance and leg strength milestone.',
    familyMoment: 'Hopscotch is now a real game.',
    todos: ['Play hopscotch', 'Practice hopping to a target'],
    playbookKey: null,
  },
  {
    id: 'throwing-overhand',
    ageStart: 208, ageEnd: 270,
    urgency: 'normal', icon: '⚾', section: 'Athletic',
    title: 'Throwing overhand with aim (age 4)',
    body: 'The shoulder rotation of a real overhand throw starts appearing, with developing accuracy.',
    familyMoment: 'The throw that actually made it to where they aimed.',
    todos: ['Target practice: soft ball into a laundry basket from 6 feet'],
    playbookKey: null,
  },
  {
    id: 'skipping-uneven',
    ageStart: 208, ageEnd: 260,
    urgency: 'normal', icon: '👟', section: 'Athletic',
    title: 'Skipping — uneven gallop (age 4)',
    body: 'Skipping starts as an uneven gallop. Full smooth skipping comes together around age 5.',
    familyMoment: 'The skipping that\'s really more of a hop-hop.',
    todos: ['Model skipping on walks — they\'ll imitate'],
    playbookKey: null,
  },
  {
    id: 'riding-bike',
    ageStart: 208, ageEnd: 365,
    urgency: 'normal', icon: '🚲', section: 'Athletic',
    title: 'Riding a bike (ages 4–7)',
    body: 'Start with a balance bike — no pedals, just balance. Children who learn this way transition to pedaling much faster. No specific target age: whenever they\'re ready.',
    familyMoment: 'The moment they realized you\'d let go and they were doing it alone.',
    todos: ['Start with a balance bike — no training wheels', 'A properly-fitted helmet, always'],
    playbookKey: null,
  },
  {
    id: 'car-seat-forward',
    ageStart: 104, ageEnd: 312,
    urgency: 'normal', icon: '🚗', section: 'Health',
    title: 'Car seat: forward-facing with 5-point harness',
    body: 'When child outgrows the rear-facing height or weight limit for their seat, transition to a forward-facing seat with a 5-point harness. Keep in this seat as long as possible — it\'s much safer than a booster.',
    familyMoment: 'The first time they could see out the front window properly.',
    todos: ['Transition when rear-facing height/weight limit is reached — not before', 'Keep in the 5-point harness until they outgrow it too'],
    playbookKey: null,
  },
  {
    id: 'k-readiness',
    ageStart: 208, ageEnd: 252,
    urgency: 'high', icon: '🏫', section: 'Academic',
    title: 'Kindergarten readiness',
    body: 'Social-emotional readiness predicts Grade 1 performance better than any academic knowledge. What kindergartners actually need: follow 2-step directions, sit for 10 minutes, take turns, tolerate frustration. "Knowing the alphabet" is secondary.',
    familyMoment: 'The wave at the classroom door on the first day.',
    todos: ['Practice 2-step directions: "First do X, then do Y"', 'Sit and listen to a full picture book without wiggling', 'Practice turn-taking games', 'Know full name, age, and parents\' names'],
    playbookKey: null,
  },
  {
    id: 'counting-to-10',
    ageStart: 208, ageEnd: 240,
    urgency: 'normal', icon: '🔢', section: 'Cognitive',
    title: 'Counting 10 objects with understanding (age 4)',
    body: 'Understanding that counting maps to real objects — not just reciting the numbers. This is early number sense.',
    familyMoment: 'The counting that takes twice as long as it should because they want to do it themselves.',
    todos: ['Count everything: stairs, blueberries, cars in the parking lot'],
    playbookKey: null,
  },
  {
    id: 'writing-name',
    ageStart: 230, ageEnd: 280,
    urgency: 'normal', icon: '✏️', section: 'Academic',
    title: 'Writing their own name (ages 4–5)',
    body: 'At 4: can copy capital letters. At 5: can write first name from memory. Handedness is usually established by age 4.',
    familyMoment: 'The first time their name appeared in their own handwriting.',
    todos: ['Practice starting with the first letter of their name', 'Use fat crayons or sidewalk chalk — fine motor builds gradually'],
    playbookKey: null,
  },
  {
    id: 'scissors-4yr',
    ageStart: 208, ageEnd: 260,
    urgency: 'normal', icon: '✂️', section: 'Fine Motor',
    title: 'Cutting with scissors (age 4)',
    body: 'By age 4, can cut along a thick line and cut out simple shapes. Safety scissors are enough — the skill is in the coordination, not the blade.',
    familyMoment: 'The first successful clean cut. The look of pure satisfaction.',
    todos: ['Provide child-safe scissors and scrap paper', 'Cut pictures out of old magazines together'],
    playbookKey: null,
  },
  {
    id: 'body-safety',
    ageStart: 208, ageEnd: 260,
    urgency: 'high', icon: '🛡️', section: 'Social',
    title: 'Body safety education (ages 4–5)',
    body: 'Children with body safety knowledge are significantly less vulnerable and significantly more likely to report inappropriate contact. Start the conversation early, in calm everyday moments, not as a scary talk.',
    familyMoment: 'A calm, matter-of-fact conversation that protects them for life.',
    todos: ['Use correct anatomical terms — always', '"No one touches your private parts except a doctor with a parent present"', '"If it ever happens — tell me. I will always believe you."'],
    playbookKey: null,
  },
  {
    id: 'imaginative-play',
    ageStart: 208, ageEnd: 312,
    urgency: 'normal', icon: '🎭', section: 'Cognitive',
    title: 'Peak imaginative play (ages 4–6)',
    body: 'Complex scenario play lasting 20+ minutes builds executive function — a stronger predictor of life outcomes than IQ (Diamond & Lee, Science 2011). This is not a waste of time. This is the work.',
    familyMoment: 'The elaborate universe they built out of couch cushions and a cardboard box.',
    todos: ['Protect this time in the schedule', 'Open-ended toys: blocks, cardboard boxes, scarves, dolls', 'Limit screens during this window — they replace this play, not supplement it'],
    playbookKey: 'screen-time',
  },
  {
    id: 'attention-span-awareness',
    ageStart: 208, ageEnd: 416,
    urgency: 'normal', icon: '🧠', section: 'Cognitive',
    title: 'Attention span: know what\'s normal',
    body: 'A rough rule: children can focus on a chosen task for 2–5 minutes per year of age (a 4-year-old: 8–20 minutes). ADHD cannot be reliably diagnosed before age 4. Hyperactivity and inattention concerns are best discussed at the 4-year and 5-year visits.',
    familyMoment: 'The concentration on their face during a puzzle they chose themselves.',
    todos: ['Discuss attention concerns with your pediatrician at the 4-year or 5-year visit', 'Screen content moves much faster than real life — some "attention" difference after screens is normal'],
    playbookKey: null,
  },
  {
    id: 'amblyopia-last-call',
    ageStart: 208, ageEnd: 365,
    urgency: 'critical', icon: '👁️', section: 'Health',
    title: '⚠️ Amblyopia treatment window: before age 7',
    body: 'The visual cortex is plastic until about age 7. Treatment — patching, glasses, atropine drops — must begin before then. After age 7, effectiveness drops significantly. If a screening flagged anything: this is not the referral to sit on.',
    familyMoment: 'A small intervention now. Normal vision for life.',
    todos: ['Act on any vision referral immediately', 'Annual eye exams from age 5 onward (American Optometric Association)'],
    playbookKey: null,
  },
  {
    id: 'vaccines-4yr',
    ageStart: 208, ageEnd: 224,
    urgency: 'normal', icon: '🩺', section: 'Health',
    title: '📅 4-year well-child visit + school-entry vaccines',
    body: 'Boosters: DTaP, IPV, MMR, Varicella. Required for school entry in most places. Vision and hearing screen.',
    familyMoment: 'Four years old. The last visit before school starts.',
    todos: ['Schedule the 4-year visit', 'Vaccines: DTaP, IPV, MMR, Varicella boosters'],
    playbookKey: null,
  },
  {
    id: 'hopping-mature',
    ageStart: 260, ageEnd: 320,
    urgency: 'normal', icon: '🦩', section: 'Athletic',
    title: 'Hopping 10 times on each foot (age 5)',
    body: 'Controlled, sustained hopping — forward, backward, and switching feet.',
    familyMoment: 'The focused determination of a 5-year-old trying to beat their own record.',
    todos: ['Count hops together', 'Hop-race to the car'],
    playbookKey: null,
  },
  {
    id: 'skipping-mature',
    ageStart: 260, ageEnd: 330,
    urgency: 'normal', icon: '👟', section: 'Athletic',
    title: 'Skipping — smooth rhythm (age 5)',
    body: 'The gallop becomes a smooth, fluid skip.',
    familyMoment: 'Skipping down a sidewalk together.',
    todos: ['Skip everywhere — it\'s actually good exercise for both of you'],
    playbookKey: null,
  },
  {
    id: 'catching-small',
    ageStart: 260, ageEnd: 320,
    urgency: 'normal', icon: '🎾', section: 'Athletic',
    title: 'Catching a small ball with hands (age 5)',
    body: 'Using hands only — not arms and chest — to catch a tennis-sized ball. Real hand-eye coordination.',
    familyMoment: 'The first clean catch. The disbelief on both your faces.',
    todos: ['Build up: start with beanbags, then larger balls, then smaller ones'],
    playbookKey: null,
  },
  {
    id: 'jumping-180',
    ageStart: 260, ageEnd: 320,
    urgency: 'normal', icon: '🔄', section: 'Athletic',
    title: 'Jumping and turning 180° in the air (age 5)',
    body: 'Mid-air body awareness — rotating and landing facing the opposite direction.',
    familyMoment: '"Jump and face me" — when they actually pull it off.',
    todos: ['Challenge: "Can you jump and turn all the way around?"'],
    playbookKey: null,
  },
  {
    id: 'baby-teeth-shedding',
    ageStart: 260, ageEnd: 416,
    urgency: 'normal', icon: '🦷', section: 'Dental',
    title: 'Losing baby teeth (ages 5–8)',
    body: 'First baby teeth usually fall out between age 5–7, starting with the lower central incisors. Permanent teeth push up from below. Some kids start as early as 4 — that\'s fine.',
    familyMoment: 'The loose tooth they kept wiggling for two weeks before it finally came out.',
    todos: ['Let it fall out naturally — no forced pulling', 'See dentist if a permanent tooth erupts BEFORE the baby tooth falls out — that one needs attention'],
    playbookKey: null,
  },
  {
    id: 'self-dressing-full',
    ageStart: 210, ageEnd: 280,
    urgency: 'normal', icon: '👞', section: 'Self-Care',
    title: 'Dressing independently (ages 4–5)',
    body: 'Can dress fully, including socks and shoes. Complex fasteners still need help.',
    familyMoment: 'Coming downstairs fully dressed for school. Without being asked.',
    todos: ['Let them choose and put on their own clothes — even on the days when it matters'],
    playbookKey: null,
  },

  /* ─── 6–8 YEARS ─── */
  {
    id: 'reading-to-learn',
    ageStart: 312, ageEnd: 390,
    urgency: 'high', icon: '📚', section: 'Academic',
    title: 'Learning to read → reading to learn',
    body: 'Grades 1–2 are the "learning to read" window. By Grade 2, children shift to "reading to learn" — everything else depends on this skill. Phonological awareness is the strongest predictor. Keep reading aloud even after they can read themselves — it exposes them to vocabulary two grades above their reading level.',
    familyMoment: 'The first time they picked up a book and read it to you.',
    todos: ['Keep reading aloud — it matters even more now', 'Play rhyming and word-sound games', 'Worth mentioning at next visit if significant decoding struggle at end of Grade 1'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: '6yr-molars',
    ageStart: 312, ageEnd: 365,
    urgency: 'high', icon: '🦷', section: 'Dental',
    title: '6-year molars: the most important teeth they\'ll ever have',
    body: 'First permanent molars arrive behind the baby teeth — they don\'t replace anything. These are the foundation of the adult bite. Sealants now protect them from decay for years. Ask about this at the 6-year visit.',
    familyMoment: 'The molar they didn\'t know they had until the dentist pointed to it.',
    todos: ['Ask the dentist about sealants for the 6-year molars', 'These teeth are hard to reach — keep helping them brush the back until age 8'],
    playbookKey: null,
  },
  {
    id: 'run-kick-combo',
    ageStart: 312, ageEnd: 400,
    urgency: 'normal', icon: '🏃', section: 'Athletic',
    title: 'Running and kicking in combination (age 6)',
    body: 'Combining two motor skills: running at full speed and kicking a moving ball without stopping to reset.',
    familyMoment: 'The first real soccer play. Running, kicking, celebrating.',
    todos: ['Play soccer', 'Practice kicking a rolling ball — not a stationary one'],
    playbookKey: null,
  },
  {
    id: 'jump-rope',
    ageStart: 312, ageEnd: 365,
    urgency: 'normal', icon: '➰', section: 'Athletic',
    title: 'Jumping rope (age 6)',
    body: 'Timing, bilateral coordination, and rhythm — all simultaneously. One of the more complex athletic milestones. Start with the rope stationary before it swings.',
    familyMoment: 'Twenty minutes of practice for five consecutive jumps. Worth every second of it.',
    todos: ['Start: rope on the ground, jumping over it stationary', 'Build: slowly swing once-around while they time the jump'],
    playbookKey: null,
  },
  {
    id: 'swimming-basics',
    ageStart: 156, ageEnd: 416,
    urgency: 'high', icon: '🏊', section: 'Athletic',
    title: 'Water competency — essential safety skill',
    body: 'Drowning is the #1 cause of accidental death in children ages 1–4. Swim lessons from age 3–4 significantly reduce risk. By age 6–7, every child should be able to float on their back independently. Note: swimming ability reduces risk — it doesn\'t replace supervision.',
    familyMoment: 'The moment they stopped needing you in the water.',
    todos: ['Enroll in swim lessons by age 3–4', 'Practice floating on back until they can hold it without help'],
    playbookKey: null,
  },
  {
    id: 'shoe-tying',
    ageStart: 280, ageEnd: 390,
    urgency: 'normal', icon: '👟', section: 'Fine Motor',
    title: 'Tying shoelaces (ages 5–7)',
    body: 'Bilateral coordination and sequencing — many children don\'t master this until 6–7. The bunny-ears method is genuinely easier to learn than the traditional method.',
    familyMoment: 'The first self-tied knot that held through the whole school day.',
    todos: ['Teach the bunny-ears method — it\'s easier to learn', 'Practice with a spare shoe when there\'s no time pressure'],
    playbookKey: null,
  },
  {
    id: 'conservation-piaget',
    ageStart: 364, ageEnd: 468,
    urgency: 'normal', icon: '🥛', section: 'Cognitive',
    title: 'Understanding conservation (age 7)',
    body: 'Piaget\'s Concrete Operational stage: the same amount of water in a tall narrow glass and a short wide bowl is still the same amount. This reasoning was beyond them before age 7. Now it\'s obvious.',
    familyMoment: 'The pour-between-glasses experiment. Watching their brain make the connection.',
    todos: ['Try it: pour water between a tall glass and a wide bowl — "Is it the same amount?"'],
    playbookKey: null,
  },
  {
    id: 'executive-function',
    ageStart: 312, ageEnd: 416,
    urgency: 'normal', icon: '🧠', section: 'Cognitive',
    title: 'Executive function development (ages 6–8)',
    body: 'Working memory, inhibitory control, and cognitive flexibility. These skills predict academic achievement, mental health, and economic success more consistently than IQ (Diamond, Science 2013). Built through strategy games, music, and any activity that requires planning.',
    familyMoment: 'Watching them beat you at Checkers and act like they knew they would.',
    todos: ['Strategy games: Checkers, Uno, Battleship', 'Music lessons (any instrument improves working memory)', 'Let them struggle — tolerating frustration IS executive function, not just a path to it'],
    playbookKey: null,
  },
  {
    id: 'best-friends',
    ageStart: 312, ageEnd: 416,
    urgency: 'normal', icon: '👫', section: 'Social',
    title: '"Best friends" emerge (ages 6–8)',
    body: 'Friendships shift from whoever-is-nearby to genuine preference. Strong friendships at this age are central to identity and self-esteem.',
    familyMoment: 'The friend whose name you hear every single day.',
    todos: ['Know who their friends are', 'Invite them over — your home is now a safe base for their social world'],
    playbookKey: null,
  },
  {
    id: 'brushing-needs-help',
    ageStart: 0, ageEnd: 416,
    urgency: 'normal', icon: '🪥', section: 'Dental',
    title: 'Supervise brushing until age 8',
    body: 'Children don\'t have the fine motor control to brush their own teeth thoroughly until age 8. Let them go first, then you finish. Every dentist says this. Not enough parents do it.',
    familyMoment: 'The two-minute song you play every night.',
    todos: ['Brush for them or after them until the 8th birthday', 'Electric toothbrush makes the finish much easier'],
    playbookKey: null,
  },

  /* ─── 9–10 YEARS ─── */
  {
    id: 'agility-golden-window',
    ageStart: 400, ageEnd: 500,
    urgency: 'normal', icon: '⚡', section: 'Athletic',
    title: 'The Golden Window for athleticism (ages 8–10)',
    body: 'Peak time for developing speed, agility, balance, and coordination. The research is consistent: children who try multiple sports before age 12 develop better long-term athleticism than early specializers.',
    familyMoment: 'Watching them discover what their body can do.',
    todos: ['Encourage different sports each season', 'Avoid single-sport specialization before age 12 — the evidence for this is strong'],
    playbookKey: null,
  },
  {
    id: 'peer-influence',
    ageStart: 468, ageEnd: 520,
    urgency: 'normal', icon: '🤝', section: 'Social',
    title: 'Peer influence exceeds parental influence (age 9+)',
    body: 'This shift is normal, healthy, and necessary for developing autonomy. Your job changes: from director to available. Listen more than you talk. Home should be where they can still be honest.',
    familyMoment: 'When you realized they were telling their friends things they weren\'t telling you.',
    todos: ['Know their friends and their friends\' parents', 'Privacy matters to them now — respect it, stay available', 'Talk about digital safety before they\'re fully online'],
    playbookKey: null,
  },
  {
    id: 'social-media-awareness',
    ageStart: 400, ageEnd: 520,
    urgency: 'normal', icon: '📲', section: 'Screen Time',
    title: 'Social media conversation — before the pressure starts',
    body: 'No major social platform allows users under 13 (COPPA). But peer pressure to join starts around 8–10. Research consistently links early social media use to anxiety and depression. Have the conversation now, calmly, before the ask is urgent.',
    familyMoment: '"All my friends have it." The sentence you\'re preparing for.',
    todos: ['"We\'ll revisit this together at 13" — and mean it', 'Establish family digital rules (no devices in bedrooms at night)', 'Have the conversation before they have an account, not after'],
    playbookKey: 'screen-time',
  },
  {
    id: 'adrenarche',
    ageStart: 468, ageEnd: 520,
    urgency: 'normal', icon: '🌱', section: 'Health',
    title: 'Pre-puberty signs may begin (ages 8–10)',
    body: 'Adrenarche — early puberty hormones — can begin as early as age 8 in girls and 9 in boys. Signs: body odor, light body hair. Start the conversation before they hear about it from someone else.',
    familyMoment: 'A calm, early conversation that makes the bigger one easier later.',
    todos: ['Introduce deodorant if body odor appears', 'Start the puberty conversation early — before they need it'],
    playbookKey: null,
  },
  {
    id: 'car-seat-booster',
    ageStart: 312, ageEnd: 520,
    urgency: 'normal', icon: '🚗', section: 'Health',
    title: 'Car seat: booster seat transition',
    body: 'When child outgrows the 5-point harness weight or height limit, move to a belt-positioning booster. Stay in the booster until the vehicle seat belt fits correctly across the upper thigh and chest — typically around 4\'9" tall, often ages 8–12.',
    familyMoment: 'The moment the seat belt actually fits properly. Took longer than anyone expected.',
    todos: ['Transition when the 5-point harness limit is reached — not before', 'Seat belt fits when lap belt sits on upper thighs, shoulder belt on chest'],
    playbookKey: null,
  },
  {
    id: 'endurance-10yr',
    ageStart: 490, ageEnd: 530,
    urgency: 'normal', icon: '🔋', section: 'Athletic',
    title: 'Building endurance and physical conditioning (age 10)',
    body: 'By age 10, children are capable of sustained physical conditioning — long bike rides, distance running, sustained team sport play. Their aerobic capacity is expanding. Keep it fun, not a chore.',
    familyMoment: 'Going for a real run or bike ride together where you actually have to keep up.',
    todos: ['Family hikes or bike rides of increasing duration', 'Celebrate fitness accomplishments'],
    playbookKey: null,
  },

  /* ══════════════════════════════════════
     UNIVERSAL — ALL AGES
  ══════════════════════════════════════ */
  {
    id: 'read-aloud',
    ageStart: 0, ageEnd: 520,
    urgency: 'normal', icon: '📖', section: 'Language',
    title: 'Read aloud every day — highest ROI parenting activity',
    body: 'Reading aloud closes socioeconomic vocabulary gaps and builds language, sequencing, and attention. The research says reading aloud exposes them to vocabulary 2–3 grades above their reading level. Continue even after they can read independently.',
    familyMoment: 'The 20 minutes at the end of the day when everything else stops.',
    todos: ['10–20 minutes daily', 'Ask "What happens next?" to build comprehension', 'Choose books they pick, not just ones you think they should read'],
    playbookKey: null,
  },
  {
    id: 'screens-off-bed',
    ageStart: 0, ageEnd: 520,
    urgency: 'normal', icon: '🌙', section: 'Sleep',
    title: 'Screens off 60 min before bed — all ages',
    body: 'The issue is nervous system arousal, not just blue light. Any screen activates the brain in ways that delay sleep onset. Only a clear time window fixes it.',
    familyMoment: 'The quiet hour before bed. Books and low lights.',
    todos: ['Set a screens-off alarm 60 min before bedtime', 'Fill the window: bath, books, quiet play', 'Charge devices outside the bedroom'],
    playbookKey: 'sleep',
  },
  {
    id: 'outdoor-time-myopia',
    ageStart: 0, ageEnd: 520,
    urgency: 'normal', icon: '🌳', section: 'Health',
    title: '60–120 min outdoor time daily — prevents myopia',
    body: 'Taiwan\'s "Tian-Tian 120" study cut preschool myopia rates in half with outdoor time. Daylight above 1,000 lux triggers dopamine in the retina that stops eye elongation. 60 min shows benefit; 120 min is the target.',
    familyMoment: 'Getting them outside in any weather. They don\'t mind the rain as much as we do.',
    todos: ['Target 1–2 hours outdoor time daily', 'Apply 20-20-20 rule during screen use (every 20 min, look 20 feet away for 20 seconds)'],
    playbookKey: 'screen-time',
  },
  {
    id: 'annual-flu',
    ageStart: 24, ageEnd: 520,
    urgency: 'normal', icon: '💉', section: 'Health',
    title: 'Annual flu vaccine — every child 6 months+',
    body: 'CDC: annual flu vaccine for all children 6 months and older. Under-5s are the highest risk group. First-ever flu vaccine requires two doses, 4 weeks apart.',
    familyMoment: 'One quick prick. One winter protected.',
    todos: ['Schedule annually in September–November'],
    playbookKey: null,
  },
  {
    id: 'physical-activity',
    ageStart: 156, ageEnd: 520,
    urgency: 'high', icon: '🏃', section: 'Health',
    title: '60 minutes of active play every day (age 3–10)',
    body: 'WHO/AAP: at least 60 min of moderate-to-vigorous physical activity daily. Improves sleep, mood, and attention. Unstructured outdoor play is just as valuable as organized sports.',
    familyMoment: 'Watching them run until they finally run out of batteries.',
    todos: ['Target 60 min/day of active movement — running, climbing, sports, free play', 'Break it up: three 20-min bursts counts the same as one continuous session', 'Unstructured outdoor play is just as valuable as organized sport'],
    playbookKey: null,
  },
  {
    id: 'structured-meals',
    ageStart: 52, ageEnd: 416,
    urgency: 'normal', icon: '🍽️', section: 'Feeding',
    title: 'Structured meals beat grazing',
    body: '3 meals + 2–3 snacks daily for toddlers. Grazing blurs hunger signals and increases picky eating. Satter Division of Responsibility: you decide what/when/where; child decides whether/how much.',
    familyMoment: 'Sitting down together. No screens. Just food and conversation.',
    todos: ['Set consistent meal and snack times', 'Don\'t leave food out between scheduled times', 'Offer what you\'re having — no short-order cooking'],
    playbookKey: 'feeding',
  },

  /* ═══════════════════════════════════════════════════════════
     EXPANDED MILESTONE SET — v5.2 ADDITIONS
     Sources: AAP 2022, CDC Zubler et al. 2022, Feldman/Stanford 2019,
     StatPearls Peer Play, WhatToExpect.com, WHO Motor Standards
     ═══════════════════════════════════════════════════════════ */

  /* ─── PRENATAL — additional ─── */
  {
    id: 'prenatal-newborn-class',
    ageStart: 0, ageEnd: 4, prenatal: true,
    urgency: 'normal', icon: '🎓', section: 'Before Baby Arrives',
    title: 'Take a newborn care class (30–34 weeks)',
    body: 'Beyond infant CPR, there\'s a whole set of basics most new parents had to learn on the fly: swaddling, bathing, umbilical cord care, diaper technique, soothing strategies. Most hospitals offer a class. Most parents who take it say they wish they\'d taken it sooner.',
    familyMoment: 'You\'ll remember being in that classroom, looking around at the other terrified couples, and feeling marginally less alone.',
    todos: ['Search your hospital or local community center for newborn care classes', 'Book before your due date — many fill up in the third trimester', 'Your partner should come too'],
    playbookKey: null,
  },
  {
    id: 'prenatal-feeding-plan',
    ageStart: 0, ageEnd: 4, prenatal: true,
    urgency: 'normal', icon: '🤱', section: 'Before Baby Arrives',
    title: 'Decide your feeding plan before the birth',
    body: 'Breast, formula, or combination. Each is a legitimate choice. The decision you want to make in advance is which one — because making it at 3am, exhausted, with a screaming newborn, leads to choices made from desperation rather than intention. Know your plan. Know your backup plan.',
    familyMoment: 'Whatever you choose: a fed baby is the right baby.',
    todos: ['Research the pros and cons of breast, formula, and combination feeding', 'If planning to breastfeed: line up a lactation consultant now, not after problems start', 'If planning formula: choose your brand and have it stocked before the birth'],
    playbookKey: 'feeding',
  },

  /* ─── 2–3 MONTHS ─── */
  {
    id: 'face-recognition',
    ageStart: 8, ageEnd: 14,
    urgency: 'normal', icon: '👀', section: 'Social',
    title: 'Recognises your face — specifically yours',
    body: 'By 2 months, babies don\'t just see faces — they prefer yours. They\'ve been cataloguing you since birth: your voice, your smell, your face. The preference for familiar faces over strangers is visible and measurable by week 8. Talk to them. Let them look at you.',
    familyMoment: 'The moment you realized they were looking at you, not just toward you.',
    todos: ['Get your face close when you talk — within 8 to 12 inches', 'Narrate your day out loud — it\'s language input and face time combined'],
    playbookKey: null,
  },
  {
    id: 'colour-vision',
    ageStart: 10, ageEnd: 18,
    urgency: 'normal', icon: '🌈', section: 'Sensory',
    title: 'Colour vision comes online (3–4 months)',
    body: 'Newborns see high-contrast patterns first. By month 3–4, colour discrimination is fully developing — especially reds and greens. They may start showing clear preferences for specific colours. This is also when depth perception starts to form as both eyes begin working together.',
    familyMoment: 'Watching them stare at something bright like it\'s the most interesting thing in the world. It is, to them.',
    todos: ['Introduce colourful toys and books — contrast still helps but colour works now too', 'Let them look at their surroundings — visual input is brain input'],
    playbookKey: null,
  },

  /* ─── 4–6 MONTHS ─── */
  {
    id: 'weight-bearing-legs',
    ageStart: 16, ageEnd: 26,
    urgency: 'normal', icon: '🦵', section: 'Motor',
    title: 'Bears weight on legs when held standing',
    body: 'Hold them upright with feet touching a firm surface and they push down. Half of babies do this by 4 months. This isn\'t walking practice — it\'s muscle development and nerve maturation. The reflex that drives it will fade and return later as real leg strength.',
    familyMoment: 'That look of concentrated effort on their face as they push against your hands.',
    todos: ['Let them "stand" on your lap during awake time', 'This is play, not training — don\'t force it if they resist'],
    playbookKey: null,
  },
  {
    id: 'social-referencing',
    ageStart: 18, ageEnd: 30,
    urgency: 'normal', icon: '🔍', section: 'Social',
    title: 'Social referencing — they\'re reading your face',
    body: 'Around 5–6 months, a baby encountering something unfamiliar will look at your face first for a signal: is this okay? Your expression becomes their emotional compass. Show them calm and curiosity and that\'s what they\'ll model. This is the earliest form of emotional intelligence.',
    familyMoment: 'They looked at you before they touched the dog. Your face told them yes.',
    todos: ['Model calm curiosity when they encounter new things', 'Smile at new people before expecting your baby to warm up to them'],
    playbookKey: null,
  },
  {
    id: 'intentional-reaching',
    ageStart: 16, ageEnd: 24,
    urgency: 'normal', icon: '🖐️', section: 'Motor',
    title: 'Reaching with intention — not reflex',
    body: 'Before this: batting at objects was chance. Now they see something, decide they want it, and reach for it with both arms. That\'s not motor development. That\'s a decision. Hand-eye coordination, motor planning, and object desire all wiring up together.',
    familyMoment: 'The moment they reached for your face — not a toy, your face — and you understood exactly what they meant.',
    todos: ['Hold toys 6–8 inches away and let them reach', 'Tummy time helps build the shoulder strength for reaching — keep going'],
    playbookKey: null,
  },

  /* ─── 6–9 MONTHS ─── */
  {
    id: 'separation-anxiety',
    ageStart: 32, ageEnd: 52,
    urgency: 'normal', icon: '💔', section: 'Social',
    title: 'Separation anxiety begins (8–10 months)',
    body: 'Stranger anxiety is about unfamiliar people. Separation anxiety is about YOU leaving. They\'ve bonded. They know you exist. And now they understand that you can leave — and they can\'t make you stay. The crying when you walk out of the room is evidence of a secure attachment. It is a milestone, not a problem.',
    familyMoment: 'Every parent has felt guilty walking out the door. The research says: you can. You should.',
    todos: ['Practice short separations and consistent returns — this builds trust', 'Don\'t sneak out — say goodbye calmly and leave. A tearful departure is fine. Sneaking out is worse.', 'This peaks around 10–18 months and then fades'],
    playbookKey: 'sleep',
  },
  {
    id: 'sleep-regression-9m',
    ageStart: 35, ageEnd: 47,
    urgency: 'normal', icon: '🌙', section: 'Sleep',
    title: 'The 9-month sleep regression',
    body: 'Often the most disruptive one. Your baby is learning to pull to stand, cruise, maybe crawl — and the brain cannot do all that and sleep well at the same time. Night wakings return, naps go sideways, and parents who sleep-trained feel betrayed. The method didn\'t fail. Development is just noisy.',
    familyMoment: 'The weeks you wondered if the good sleep was a fluke. It wasn\'t.',
    todos: ['Stay consistent — don\'t abandon your sleep habits because of a regression', 'Regressions typically last 2–6 weeks', 'More tummy time and active play during the day can help burn off the developmental energy'],
    playbookKey: 'sleep',
  },
  {
    id: 'waves-bye-bye',
    ageStart: 35, ageEnd: 46,
    urgency: 'normal', icon: '👋', section: 'Language',
    title: 'Waves bye-bye (9–10 months)',
    body: 'The wave is their first social ritual. It\'s also a CDC 2022 benchmark at the 9-month visit. More than a cute party trick: it\'s intentional communication using a culturally learned gesture. That\'s a significant cognitive step.',
    familyMoment: 'The first time they waved back at you. With their whole arm.',
    todos: ['Wave at them constantly — they learn by imitation', 'Worth mentioning at next visit if no waving or gesturing by 12 months'],
    playbookKey: null,
  },
  {
    id: 'straw-drinking',
    ageStart: 36, ageEnd: 54,
    urgency: 'normal', icon: '🥤', section: 'Feeding',
    title: 'Introduce a straw cup (9–12 months)',
    body: 'Sippy cups are convenient but they train a sucking motion that doesn\'t match how we actually drink as adults. Straw cups require a different oral muscle pattern — one that better supports speech development. The AAP quietly prefers straw cups or open cups over sippy cups. Worth knowing.',
    familyMoment: 'The first successful sip where they figured out the straw. The look of surprise every single time.',
    todos: ['Try a straw cup alongside or instead of a sippy cup', 'Munchkin 360 or similar open-top cups are also excellent options', 'Transition to an open cup by 12–18 months'],
    playbookKey: 'feeding',
  },
  {
    id: 'clapping',
    ageStart: 32, ageEnd: 46,
    urgency: 'normal', icon: '👏', section: 'Social',
    title: 'Claps hands (8–10 months)',
    body: 'Another CDC 2022 benchmark at the 9-month visit. Clapping is an early imitation skill — they\'re copying what they\'ve seen you do. It\'s also cause and effect (I move, noise happens), social (I clap, people react), and motor all at once.',
    familyMoment: 'They clap for themselves after doing something they\'re proud of. That never gets old.',
    todos: ['Clap during songs and games — they\'ll copy', 'Worth mentioning at next visit if no clapping or imitation of gestures by 12 months'],
    playbookKey: null,
  },

  /* ─── 9–12 MONTHS ─── */
  {
    id: 'cruising',
    ageStart: 36, ageEnd: 54,
    urgency: 'normal', icon: '🚶', section: 'Motor',
    title: 'Cruising — walking along furniture',
    body: 'Between pulling to stand and independent walking, there\'s cruising: using the couch, coffee table, and anything solid as a handrail. This phase builds lateral balance and hip strength. It\'s not a precursor to walking — it IS the last stage of learning to walk.',
    familyMoment: 'Watching them make their way around the entire room without touching the floor. Methodical. Determined.',
    todos: ['Create a safe cruising circuit — push light furniture together if needed', 'Low stable surfaces are better than chairs that tip', 'Baby-proof at their new reach height — they can grab everything now'],
    playbookKey: null,
  },
  {
    id: 'peekaboo-intentional',
    ageStart: 39, ageEnd: 52,
    urgency: 'normal', icon: '🙈', section: 'Social',
    title: 'Plays peek-a-boo on purpose',
    body: 'Early peek-a-boo: you hid, you appeared, they reacted. Now they\'re initiating. They cover their own face. They pull the blanket down and wait for your surprise. This is object permanence, social turn-taking, and humour all arriving at once. It\'s one of the most cognitively rich games at this age.',
    familyMoment: 'When they started covering their face with their hands instead of their blanket — using their own body to hide.',
    todos: ['Play peek-a-boo often — it\'s not just entertainment, it\'s cognitive exercise', 'Let them lead sometimes — follow their initiations'],
    playbookKey: null,
  },
  {
    id: 'vaccines-15m',
    ageStart: 63, ageEnd: 67,
    urgency: 'high', icon: '🩺', section: 'Health',
    title: '📅 15-month well-child visit',
    body: 'The AAP added the 15-month visit to the well-child schedule in 2022. Many parents don\'t know it exists. At this visit: DTaP booster, Hib, PCV, Varicella. Developmental screen covers walking, vocabulary (should have at least 5 words), pointing, and the M-CHAT autism screen if not yet done.',
    familyMoment: 'One more chance to sit with your pediatrician before the toddler years really get going.',
    todos: ['Schedule the 15-month visit — it\'s new on the AAP schedule since 2022', 'Ask about vocabulary development: 5 words minimum at 12 months, 10 by 15 months', 'Get DTaP booster, Hib, PCV, and Varicella vaccines at this visit'],
    playbookKey: null,
  },

  /* ─── 12–18 MONTHS ─── */
  {
    id: 'walking-backward',
    ageStart: 58, ageEnd: 78,
    urgency: 'normal', icon: '🔄', section: 'Motor',
    title: 'Walking backward (~15 months)',
    body: 'Forward walking comes first. Backward walking follows a few months later and signals a new level of spatial awareness and motor planning. They have to think about where they\'ve already been to move away from where they are. It\'s small. It\'s a real milestone.',
    familyMoment: 'The first time they backed up on purpose and didn\'t fall.',
    todos: ['Play games that encourage backing up — rolling a ball toward them works well', 'No action needed — it\'s a natural progression'],
    playbookKey: null,
  },
  {
    id: 'pretend-play-early',
    ageStart: 52, ageEnd: 78,
    urgency: 'normal', icon: '🧸', section: 'Cognitive',
    title: 'Pretend play begins — feeds doll, puts teddy to sleep',
    body: 'The earliest pretend play isn\'t imaginative in the creative sense — it\'s representational. They feed their doll with a spoon because that\'s what feeding is. They lay teddy down because that\'s what sleeping looks like. They\'re running simulations of the real world. That\'s a cognitive leap.',
    familyMoment: 'Watching them tuck a stuffed animal in with complete seriousness and sincerity.',
    todos: ['Offer simple props: a doll, a toy cup, a blanket', 'Narrate what they\'re doing: "You\'re feeding the bear — that\'s so kind"'],
    playbookKey: null,
  },
  {
    id: 'body-parts-pointing',
    ageStart: 60, ageEnd: 78,
    urgency: 'normal', icon: '👃', section: 'Language',
    title: 'Points to body parts when named (15–18 months)',
    body: '"Where\'s your nose?" And they point to it. This is a CDC 2022 benchmark at the 15-month visit. It separates understanding from production — they know the word even before they can say it. Receptive vocabulary is running weeks ahead of expressive vocabulary at this age.',
    familyMoment: 'Every parent has played "where\'s your belly button?" about eight thousand times. It doesn\'t get old.',
    todos: ['Play body-part games daily — nose, eyes, ears, mouth, belly, feet', 'Worth mentioning at next visit if not responding to simple one-step directions by 15 months'],
    playbookKey: null,
  },
  {
    id: 'vocab-12-to-15m',
    ageStart: 50, ageEnd: 67,
    urgency: 'high', icon: '💬', section: 'Language',
    title: 'Vocabulary: 5 words at 12 months, 10 by 15',
    body: 'The CDC revised these benchmarks upward in 2022, moving from 50th to 75th percentile standards. By 12 months: at least 5 words beyond "mama" and "dada." By 15 months: at least 10. These aren\'t just nice-to-haves — they\'re early red flag windows for language delay. Better caught now than at 24 months.',
    familyMoment: 'The word that didn\'t sound like the word but you knew exactly what they meant.',
    todos: ['Count their words at 12 months: do they have 5?', 'Recount at 15 months: do they have 10?', 'Request a speech evaluation if not — earlier is always better'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'sleep-regression-18m',
    ageStart: 75, ageEnd: 86,
    urgency: 'normal', icon: '🌙', section: 'Sleep',
    title: 'The 18-month sleep regression',
    body: 'Language is exploding. Awareness is expanding. And the cognitive load of all of that makes sleep harder. The 18-month regression is often misread as sleep training failure or teething. It\'s not. It\'s development. The response is the same as any regression: stay consistent, wait it out.',
    familyMoment: 'The night they woke up four times and you thought you were back at square one. You weren\'t.',
    todos: ['Maintain the bedtime routine — consistency is the anchor', 'Regressions at 18 months typically last 2–6 weeks', 'This often coincides with the 2-to-1 nap transition — don\'t attempt both at once'],
    playbookKey: 'sleep',
  },
  {
    id: 'mirror-self-recognition',
    ageStart: 69, ageEnd: 104,
    urgency: 'normal', icon: '🪞', section: 'Cognitive',
    title: 'Self-recognition in the mirror (16–24 months)',
    body: 'The rouge test: put a dot on their nose, hold them up to a mirror. Before 16 months: they see a baby. After: they see themselves, and reach for their own nose. This is the emergence of self-concept — the awareness that there is a "me" that is separate from the world. Only a handful of species pass this test.',
    familyMoment: 'The day they looked in the mirror and smiled at themselves with full recognition. You\'ll know when it happens.',
    todos: ['You don\'t need to run the rouge test — just watch their relationship with mirrors change', 'By 18 months most children point to themselves in photos and name themselves'],
    playbookKey: null,
  },

  /* ─── 18–24 MONTHS ─── */
  {
    id: 'two-word-combos',
    ageStart: 78, ageEnd: 104,
    urgency: 'high', icon: '🔗', section: 'Language',
    title: 'Two-word combinations begin (18–24 months)',
    body: '"More milk." "Daddy go." "Bye-bye dog." Single words become a string, and suddenly language has structure. This transition should happen by 24 months. The 2-year language check in your list catches the absence — this milestone marks the window when it should begin. Absent by 24 months is a referral.',
    familyMoment: 'The first two-word sentence. Written down in no baby book. Remembered forever.',
    todos: ['Expand their single words: if they say "milk," say "more milk? okay, more milk"', 'Request a speech evaluation if no two-word combinations by 24 months'],
    playbookKey: null,
    redFlag: true,
  },
  {
    id: 'sorting-shapes-colours',
    ageStart: 78, ageEnd: 110,
    urgency: 'normal', icon: '🔷', section: 'Cognitive',
    title: 'Sorts objects by shape and colour (18–24 months)',
    body: 'Putting all the red blocks together. Fitting shapes into the right holes. This is categorisation — the brain\'s first filing system. It appears between 18 and 24 months and is a direct signal that abstract thinking is coming online.',
    familyMoment: 'The focused concentration of a toddler working a shape sorter. Nothing else in the world exists.',
    todos: ['Shape sorters, simple puzzles, and stacking rings are ideal right now', 'Name the colours and shapes as they sort: "that\'s the red circle"'],
    playbookKey: null,
  },
  {
    id: 'stairs-one-step',
    ageStart: 78, ageEnd: 100,
    urgency: 'normal', icon: '🪜', section: 'Motor',
    title: 'Walks up stairs — one foot at a time, holding the rail',
    body: 'The first stair climbing is slow: same foot up, bring the other to meet it, hold the railing or your hand. This is different from alternating feet, which comes around age 3. Both feet on every step is still a real milestone — the first time they navigated an obstacle that used to be a barrier.',
    familyMoment: 'The pride on their face at the top of the stairs.',
    todos: ['Supervise all stair access — they can go up before they can safely go down', 'Teach "down on your belly, feet first" for descending — safer than walking down'],
    playbookKey: null,
  },
  {
    id: 'climbing-down',
    ageStart: 78, ageEnd: 110,
    urgency: 'normal', icon: '⬇️', section: 'Motor',
    title: 'Climbing down from furniture safely (18–24 months)',
    body: 'Climbing UP is instinctive. Climbing DOWN requires judgment — understanding that you\'re high, and planning a safe route to the floor. Most parents baby-proof for the climbing up phase and miss the equally important climbing down phase. Teach them to turn around and lower themselves feet-first.',
    familyMoment: 'The moment they figured out on their own that turning around was the move.',
    todos: ['Teach: "turn around, feet first, lower yourself slowly"', 'Practice with low surfaces before they encounter high ones', 'A child who can climb up can always climb somewhere higher than you expect — stay alert'],
    playbookKey: null,
  },

  /* ─── 2–3 YEARS ─── */
  {
    id: 'symbolic-play',
    ageStart: 100, ageEnd: 156,
    urgency: 'normal', icon: '🍌', section: 'Cognitive',
    title: 'Symbolic play — one thing becomes another',
    body: 'The banana becomes a phone. The block becomes a car. The stick becomes a sword. This is symbolic play: using one object to represent another. It requires abstract thinking — holding two realities in mind at the same time. This is the leap that separates pretend play from imagination.',
    familyMoment: 'The first time they picked up a random object and it became something else entirely. You could see it on their face.',
    todos: ['Unstructured play with open-ended objects (blocks, sticks, boxes) enables this more than toys with one purpose', 'Join their games on their terms — ask "what\'s that?" and go with whatever they say'],
    playbookKey: null,
  },
  {
    id: 'draw-person',
    ageStart: 143, ageEnd: 170,
    urgency: 'normal', icon: '✏️', section: 'Cognitive',
    title: 'Draws a person: head with limbs (around age 3)',
    body: '"Tadpole drawings" — a circle with sticks extending directly from it. No body, but the intent is clearly a person. This is the first representational art: a symbol for something real. Researchers use it as a cognitive development indicator. Don\'t correct them. The anatomy is wrong. The achievement is real.',
    familyMoment: 'The crayon drawing they handed you that was supposed to be you. You kept it.',
    todos: ['Offer crayons and paper without instruction — let them lead', 'Ask "tell me about your drawing" instead of "what is that?"'],
    playbookKey: null,
  },
  {
    id: 'states-full-name',
    ageStart: 100, ageEnd: 156,
    urgency: 'normal', icon: '🏷️', section: 'Language',
    title: 'Tells their full name when asked (age 2–3)',
    body: 'Not just their first name — their full name. A CDC 2022 benchmark. This is also the beginning of self-concept language: there is a specific person with a specific name and I am them. It also happens to be a basic safety skill.',
    familyMoment: 'The first time they said their full name clearly. It sounded different coming from them.',
    todos: ['Practice asking "What\'s your name?" and "What\'s your full name?"', 'Celebrate when they get it — it\'s more meaningful to them than it looks'],
    playbookKey: null,
  },
  {
    id: 'anemia-screen',
    ageStart: 39, ageEnd: 108,
    urgency: 'normal', icon: '🧪', section: 'Health',
    title: 'Anemia screening (12–24 months)',
    body: 'The AAP recommends iron deficiency screening for exclusively breastfed babies at 12 months, and for high-risk toddlers at 24 months. Iron deficiency is the most common nutritional deficiency in the US — and the effects on brain development are real and lasting. A simple blood test.',
    familyMoment: 'The things you can fix before they become problems.',
    todos: ['Ask your pediatrician about iron screening at the 12-month visit, especially if breastfeeding', 'High-risk factors: premature birth, low birth weight, cow\'s milk before 12 months, low-iron diet'],
    playbookKey: 'feeding',
  },
  {
    id: 'sleep-regression-2yr',
    ageStart: 100, ageEnd: 116,
    urgency: 'normal', icon: '🌙', section: 'Sleep',
    title: 'The 2-year sleep regression',
    body: 'The fourth regression parents encounter. It\'s driven by three things usually hitting at once: toddler-bed transition, potty training stress, and the language explosion. Each one alone disrupts sleep. All three together can be brutal. The good news: you\'ve survived three regressions already.',
    familyMoment: 'By the fourth regression, you handle it differently. More tired. More experienced. Calmer about it.',
    todos: ['Don\'t transition to toddler bed AND start potty training at the same time if you can help it', 'Stay consistent with bedtime routines — toddlers need predictability more than ever now', 'Expect 2–6 weeks of disruption'],
    playbookKey: 'sleep',
  },

  /* ─── 3–4 YEARS ─── */
  {
    id: 'false-belief-tom',
    ageStart: 156, ageEnd: 208,
    urgency: 'normal', icon: '🧩', section: 'Cognitive',
    title: 'Theory of mind: they understand what you don\'t know',
    body: 'Around age 3–4, something remarkable happens: your child begins to understand that other people have their own beliefs, and those beliefs can be different from reality. The classic test: Sally puts a ball in a basket and leaves. Anne moves it to a box. Where will Sally look for the ball? Under 4: the box (where it actually is). Over 4: the basket (where Sally believes it is). This is the beginning of true empathy.',
    familyMoment: 'The first time they kept a secret because they understood someone else didn\'t know what they knew.',
    todos: ['Read books with characters who want, think, and feel differently from the main character', 'Talk about what characters in stories "think" or "know" — it builds this skill directly'],
    playbookKey: null,
  },
  {
    id: 'phonemic-awareness',
    ageStart: 143, ageEnd: 182,
    urgency: 'high', icon: '🔤', section: 'Academic',
    title: 'Phonemic awareness — the single best predictor of reading',
    body: 'Rhyming. Syllables. Noticing that "cat" and "bat" share a sound. This is phonemic awareness, and it\'s the strongest predictor of reading ability we have — outperforming IQ, socioeconomic status, and every other variable. It develops through play, songs, and books. It doesn\'t require flashcards.',
    familyMoment: 'The day they started making up nonsense rhymes and thought they were hilarious. They were.',
    todos: ['Sing nursery rhymes — they\'re engineered specifically for phonemic awareness', 'Play rhyming games: "what rhymes with cat?" Accept silly answers', 'Dr. Seuss books are genuinely excellent for this'],
    playbookKey: null,
  },
  {
    id: 'cooperative-play',
    ageStart: 156, ageEnd: 234,
    urgency: 'normal', icon: '🤝', section: 'Social',
    title: 'Cooperative play — playing WITH, not just next to',
    body: 'Parallel play (already in your list) means playing alongside each other. Cooperative play means a shared goal, shared rules, shared imagination. "Let\'s build a castle." This typically appears around age 3–4. It\'s the foundation of teamwork, negotiation, and friendship. It also involves a lot of disagreement. That\'s part of it.',
    familyMoment: 'The first time two children agreed on what the game was and played it together. Not for long, but together.',
    todos: ['Play dates with same-age peers — this skill only develops through practice', 'Model negotiation: "you can be the driver, I\'ll be the passenger. Then we switch."'],
    playbookKey: null,
  },
  {
    id: 'gender-identity',
    ageStart: 120, ageEnd: 165,
    urgency: 'normal', icon: '🧒', section: 'Social',
    title: 'Gender identity awareness (age 2.5–3)',
    body: 'Around age 3, children know their own gender and begin noticing it in others. They start sorting the world partly by gender: "that\'s a boy name," "only girls do that." This is developmentally normal. It\'s also when parental modelling of gender flexibility matters most — what you show them expands or limits what they think is possible.',
    familyMoment: 'The definitive announcement of what they are. Said with absolute authority.',
    todos: ['Answer their gender questions honestly and simply', 'Model that capabilities aren\'t gendered — through your own behaviour, not lectures'],
    playbookKey: null,
  },

  /* ─── 4–5 YEARS ─── */
  {
    id: 'knows-home-address',
    ageStart: 182, ageEnd: 260,
    urgency: 'high', icon: '🏠', section: 'Health',
    title: 'Knows their home address (age 4–5)',
    body: 'A child who can state their name, address, and a parent\'s phone number has materially better outcomes if they ever become separated from a caregiver. This is a safety skill that can be taught as a game. Most 4-year-olds can memorize it in a week if you practice daily.',
    familyMoment: 'The day they said the address perfectly, unprompted. Pride in their eyes. Relief in yours.',
    todos: ['Teach: full name, home address, one parent\'s phone number', 'Make it a game: "what\'s your address?" at random moments', 'Also teach: "if you\'re lost, find a police officer or a parent with children"'],
    playbookKey: null,
  },
  {
    id: 'road-safety',
    ageStart: 182, ageEnd: 260,
    urgency: 'high', icon: '🚦', section: 'Health',
    title: 'Road safety basics: stop at the kerb, look both ways',
    body: 'Pedestrian injury is a leading cause of child death. Children under 9 have genuine difficulty judging vehicle speed and distance — it\'s a perceptual limitation, not carelessness. Teach the habit long before they need it independently: stop at every kerb, look left-right-left, and always hold a hand. Habits formed at 4 survive to 8.',
    familyMoment: 'The automatic stop at every kerb. You trained that.',
    todos: ['Teach: stop at the kerb, look left-right-left, wait for clear', 'Hold hands in all traffic situations until at least age 7–8', 'Never let them run ahead toward a road, even in familiar areas'],
    playbookKey: null,
  },
  {
    id: 'board-games-turn-taking',
    ageStart: 156, ageEnd: 234,
    urgency: 'normal', icon: '🎲', section: 'Social',
    title: 'Simple board games — rules, turns, and losing (age 3–5)',
    body: 'The first games with actual rules teach three things at once: delayed gratification (wait your turn), rule-following, and losing gracefully. Losing gracefully is not innate. It\'s practiced. And the place to practice it is a low-stakes board game at home, not a championship soccer match at age 8.',
    familyMoment: 'The first game they played without crying when they lost. It was a big day.',
    todos: ['Start with Chutes & Ladders, Candy Land, Go Fish — simple, chance-based, fast', 'Let them lose. Without rescuing them. Every time. It\'s the whole point.', 'Narrate good losing: "oh, I didn\'t win that one. Let\'s play again"'],
    playbookKey: null,
  },

  /* ─── 5–7 YEARS ─── */
  {
    id: 'chapter-books',
    ageStart: 364, ageEnd: 468,
    urgency: 'normal', icon: '📖', section: 'Academic',
    title: 'Reading chapter books independently (age 7–8)',
    body: 'Learning to read (decoding words) transitions into reading to learn (understanding sustained narrative). Chapter books without pictures require a child to hold story, character, and plot in working memory across multiple sessions. It\'s a qualitative shift in cognitive demand — and one of the strongest predictors of academic trajectory.',
    familyMoment: 'The first time they stayed up past bedtime reading. You knew not to stop them.',
    todos: ['Keep reading ALOUD even after they can read alone — up to age 12', 'Choose books one level above where they read independently', 'Magic Tree House, Diary of a Wimpy Kid, Captain Underpants — all excellent entry points'],
    playbookKey: null,
  },
  {
    id: 'telling-time',
    ageStart: 286, ageEnd: 390,
    urgency: 'normal', icon: '🕐', section: 'Cognitive',
    title: 'Telling time on a clock (age 5.5–7)',
    body: 'Analogue clock reading combines number sense, spatial reasoning, and understanding of cycles. It arrives around age 6–7 and is expected at school entry for year 2. Digital is easier, analogue is more cognitively rich. Both are useful.',
    familyMoment: 'The first time they told you what time it was without asking.',
    todos: ['Put an analogue clock somewhere they can see it and refer to it', 'Practice at daily transition points: "what time does the clock say? that\'s when we leave"', 'Teach hour hand first, then minute hand — in separate stages'],
    playbookKey: null,
  },
  {
    id: 'money-concepts',
    ageStart: 260, ageEnd: 390,
    urgency: 'normal', icon: '💰', section: 'Cognitive',
    title: 'Understanding coins and basic money (age 5–7)',
    body: 'Value is abstract. A $1 bill and a 10-cent coin don\'t signal their relative worth the way physical size might imply. Understanding that a small silver coin is worth more than a large copper one is genuinely counterintuitive. Most children crack it between 5 and 7. It\'s the precursor to allowance, saving, and financial literacy.',
    familyMoment: 'The first time they counted change correctly. Quietly delighted.',
    todos: ['Give them coins to sort and count', 'Practice small real transactions — letting them hand over money and receive change', 'Introduce the concept of a piggy bank before the concept of a bank account'],
    playbookKey: null,
  },
  {
    id: 'washing-hair-solo',
    ageStart: 286, ageEnd: 390,
    urgency: 'normal', icon: '🚿', section: 'Health',
    title: 'Washing hair independently (age 6–7)',
    body: 'A self-care independence milestone that most parents handle until suddenly they don\'t and then feel like they should have stopped sooner. Around age 6–7 most children have the motor control, patience, and self-direction to wash their own hair — rinsing included. Brushing still needs supervision until around 8.',
    familyMoment: 'The bath where you realized you hadn\'t done anything — they\'d handled it.',
    todos: ['Break it into steps: wet, shampoo, scrub (30 seconds), rinse completely', 'A shower mirror helps them check their own rinsing', 'Supervise a few solo attempts before stepping back fully'],
    playbookKey: null,
  },

  /* ─── 7–10 YEARS ─── */
  {
    id: 'sarcasm-nonliteral',
    ageStart: 364, ageEnd: 468,
    urgency: 'normal', icon: '😏', section: 'Cognitive',
    title: 'Understanding sarcasm and non-literal language (age 7–9)',
    body: '"Oh great, another Monday." Young children take this literally. Around age 7–9, the brain starts handling non-literal language: sarcasm, irony, idioms ("it\'s raining cats and dogs"), and figures of speech. This is a significant leap in social cognition — it requires simultaneous understanding of what was said AND what was meant.',
    familyMoment: 'The first time they used sarcasm correctly and both of you knew it.',
    todos: ['Explain sarcasm and idioms when you use them — don\'t assume they\'ll absorb it all', 'Reading fiction accelerates non-literal language understanding — characters think one thing and say another'],
    playbookKey: null,
  },
  {
    id: 'allowance',
    ageStart: 312, ageEnd: 468,
    urgency: 'normal', icon: '🪙', section: 'Cognitive',
    title: 'Managing a simple allowance (age 6–8)',
    body: 'Research from the University of Cambridge suggests that money habits form by age 7. An allowance — earned or given — is the training ground: earning, saving, spending, and regretting. The dollar amount doesn\'t matter. The decisions do. A child who practices money decisions at age 7 has a meaningful head start.',
    familyMoment: 'Watching them carefully weigh a decision at the toy store with their own money. Completely different calculation than when it\'s yours.',
    todos: ['Start a simple system: weekly allowance, three jars or envelopes (spend / save / give)', 'Let them make bad spending decisions — that\'s the whole point', 'Match their savings toward a specific goal to teach delayed gratification'],
    playbookKey: null,
  },
  {
    id: 'household-chores',
    ageStart: 312, ageEnd: 468,
    urgency: 'normal', icon: '🧹', section: 'Social',
    title: 'Assigned household chores (age 6–8)',
    body: 'A Harvard study tracking adults over 75 years found that the single strongest predictor of adult work ethic and career success was participation in household chores — starting before age 7. Not tutoring. Not sports. Chores. The contribution to the family, and the responsibility attached, builds something that\'s very hard to teach later.',
    familyMoment: 'The first time they did it without being asked. You almost cried.',
    todos: ['Start simple: make bed, clear dishes, put away laundry', 'Age-appropriate, consistent, expected — not optional', 'Don\'t pay for essential household chores — it changes the relationship from responsibility to transaction'],
    playbookKey: null,
  },

];

// Live reference — replaced by Supabase data when available
let MILESTONES = MILESTONES_FALLBACK;

/* ─── Supabase milestone loader ─────────────────────────────────
   Fetches active milestones from the `milestones` table and caches
   them in localStorage for 1 hour. Falls back to MILESTONES_FALLBACK
   silently if Supabase is unavailable or the user is offline.
   ────────────────────────────────────────────────────────────── */
const MILESTONES_CACHE_KEY = 'ff_adv_milestones_cache';
const MILESTONES_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function loadMilestonesFromSupabase() {
  // 1 — Serve from fresh cache if available
  try {
    const cached = JSON.parse(localStorage.getItem(MILESTONES_CACHE_KEY) || 'null');
    if (cached && Array.isArray(cached.data) && cached.data.length > 0
        && (Date.now() - (cached.fetchedAt || 0)) < MILESTONES_CACHE_TTL) {
      MILESTONES = cached.data;
      return;
    }
  } catch(_) {}

  // 2 — Fetch from Supabase
  try {
    const sb = window._supabaseClient;
    if (!sb) return; // no client — stay on fallback
    const { data, error } = await sb
      .from('milestones')
      .select('id,age_start,age_end,urgency,icon,section,title,body,family_moment,todos,playbook_key,prenatal')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return;

    // Map snake_case → camelCase to match the rest of the codebase
    const mapped = data.map(m => ({
      id:           m.id,
      ageStart:     m.age_start,
      ageEnd:       m.age_end,
      urgency:      m.urgency,
      icon:         m.icon,
      section:      m.section,
      title:        m.title,
      body:         m.body,
      familyMoment: m.family_moment  || null,
      todos:        Array.isArray(m.todos) ? m.todos : [],
      playbookKey:  m.playbook_key   || null,
      prenatal:     m.prenatal       || false,
    }));

    MILESTONES = mapped;
    localStorage.setItem(MILESTONES_CACHE_KEY, JSON.stringify({ data: mapped, fetchedAt: Date.now() }));

    // Re-render digest if the advisor is already showing
    if (window.ffRefreshAdvisor) window.ffRefreshAdvisor();
  } catch(e) {
    console.warn('[Advisor] Supabase milestone fetch failed — using built-in data:', e.message);
  }
}

/* Force-clear the cache and reload from Supabase (call from admin/dev tools) */
function invalidateMilestonesCache() {
  localStorage.removeItem(MILESTONES_CACHE_KEY);
  return loadMilestonesFromSupabase();
}

/* ════════════════════════════════════════════════════════════
   STORAGE & DISMISSAL
   ════════════════════════════════════════════════════════════ */
const CHILDREN_KEY = 'ff_children';
const DISMISSED_KEY = 'ff_dismissed_milestones';
const MAX_CHILDREN = 3;

function loadChildren() {
  try { return JSON.parse(localStorage.getItem(CHILDREN_KEY) || '[]'); } catch (_) { return []; }
}
function saveChildren(children) {
  localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
}
function loadDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}'); } catch (_) { return {}; }
}
function dismissMilestone(childId, milestoneId) {
  const dismissed = loadDismissed();
  if (!dismissed[childId]) dismissed[childId] = [];
  if (!dismissed[childId].includes(milestoneId)) dismissed[childId].push(milestoneId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
}
function restoreMilestone(childId, milestoneId) {
  const dismissed = loadDismissed();
  if (dismissed[childId]) {
    dismissed[childId] = dismissed[childId].filter(id => id !== milestoneId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
  }
}

/* ─── Completed store ─── */
/* ─── Completed store ───────────────────────────────────────
   Structure: { childId: { milestoneId: { by, date } } }
   ────────────────────────────────────────────────────────── */
const COMPLETED_KEY = 'ff_adv_completed';
function loadCompleted() {
  try { return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '{}'); } catch (_) { return {}; }
}
function getCompletedIds(childId) {
  const store = loadCompleted();
  if (!store[childId]) return [];
  if (Array.isArray(store[childId])) return store[childId]; // backward compat with old format
  return Object.keys(store[childId]);
}
function getCompletionMeta(childId, milestoneId) {
  const store = loadCompleted();
  return (store[childId] && store[childId][milestoneId]) ? store[childId][milestoneId] : null;
}
function markComplete(childId, milestoneId, completedBy, completedDate) {
  const store = loadCompleted();
  // Migrate old array format → new object format
  if (!store[childId] || Array.isArray(store[childId])) store[childId] = {};
  store[childId][milestoneId] = {
    by:   completedBy  || '',
    date: completedDate || new Date().toISOString().split('T')[0],
  };
  localStorage.setItem(COMPLETED_KEY, JSON.stringify(store));
  if (window.ffRefreshAdvisor) window.ffRefreshAdvisor();
}
function unmarkComplete(childId, milestoneId) {
  const store = loadCompleted();
  if (store[childId]) {
    delete store[childId][milestoneId];
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(store));
  }
  if (window.ffRefreshAdvisor) window.ffRefreshAdvisor();
}
function formatCompletionDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch(_) { return dateStr; }
}
function getMilestoneById(id) {
  return MILESTONES.find(m => m.id === id) || null;
}

/* ─── Last Visit Tracking ─────────────────────────────────────
   Store: { childId: { ageWeeks, ts } }
   ─────────────────────────────────────────────────────────── */
const LAST_VISIT_KEY = 'ff_adv_last_visit';
function loadLastVisit(childId) {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_VISIT_KEY) || '{}');
    return store[childId] || null;
  } catch(_) { return null; }
}
function saveLastVisit(childId, ageWeeks) {
  try {
    const store = JSON.parse(localStorage.getItem(LAST_VISIT_KEY) || '{}');
    store[childId] = { ageWeeks, ts: Date.now() };
    localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(store));
  } catch(_) {}
}
function countNewSinceLastVisit(child, lastVisit) {
  if (!lastVisit) return 0;
  const ageWeeks     = getAgeWeeks(child.dob);
  const lastAgeWeeks = lastVisit.ageWeeks || 0;
  if (ageWeeks <= lastAgeWeeks) return 0;
  const completedIds = getCompletedIds(child.id);
  const dismissed    = loadDismissed()[child.id] || [];
  return MILESTONES.filter(m => {
    if (m.prenatal)     return false;
    if (m.ageEnd > 500) return false;
    if (completedIds.includes(m.id)) return false;
    if (dismissed.includes(m.id))   return false;
    return m.ageStart > lastAgeWeeks && m.ageStart <= ageWeeks;
  }).length;
}
function getNextMilestoneDate(child) {
  const ageWeeks     = getAgeWeeks(child.dob);
  const completedIds = getCompletedIds(child.id);
  const dismissed    = loadDismissed()[child.id] || [];
  const upcoming = MILESTONES
    .filter(m => {
      if (m.prenatal)     return false;
      if (m.ageEnd > 500) return false;
      if (completedIds.includes(m.id)) return false;
      if (dismissed.includes(m.id))   return false;
      return m.ageStart > ageWeeks;
    })
    .sort((a, b) => a.ageStart - b.ageStart);
  if (upcoming.length === 0) return null;
  const next = upcoming[0];
  try {
    const dob      = new Date(child.dob + 'T00:00:00');
    const nextDate = new Date(dob.getTime() + next.ageStart * 7 * 24 * 60 * 60 * 1000);
    const daysUntil = Math.max(0, Math.round((nextDate - Date.now()) / (24 * 60 * 60 * 1000)));
    return {
      dateStr:  nextDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
      daysUntil,
    };
  } catch(_) { return null; }
}

function addChild(name, dob, emoji, gender) {
  const children = loadChildren();
  if (children.length >= MAX_CHILDREN) return { error: 'Maximum 3 children allowed.' };
  const child = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random(),
    name: name.trim(), dob,
    emoji: emoji || '👶',
    gender: gender || null,   // 'boy' | 'girl' | null
  };
  children.push(child);
  saveChildren(children);
  return { child };
}
function removeChild(id) {
  saveChildren(loadChildren().filter(c => c.id !== id));
}
function updateChildName(id, name) {
  saveChildren(loadChildren().map(c => c.id === id ? { ...c, name } : c));
}
function updateChildGender(id, gender) {
  saveChildren(loadChildren().map(c => c.id === id ? { ...c, gender } : c));
}
function updateChild(id, fields) {
  // Merge any subset of { name, dob, gender, emoji } onto the child
  saveChildren(loadChildren().map(c => c.id === id ? { ...c, ...fields } : c));
}

/* ════════════════════════════════════════════════════════════
   AGE CALCULATION
   ════════════════════════════════════════════════════════════ */
function getAgeWeeks(dob) {
  return Math.floor((new Date() - new Date(dob)) / (7 * 24 * 60 * 60 * 1000));
}
function formatAge(dob) {
  const birth = new Date(dob), today = new Date();
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months--;
  const weeks = Math.floor(((today - birth) / (7 * 24 * 60 * 60 * 1000)) % 4.33);
  if (months < 3) {
    const w = Math.floor((today - birth) / (7 * 24 * 60 * 60 * 1000));
    if (w < 0) return 'Arriving soon';
    return w + (w === 1 ? ' week old' : ' weeks old');
  }
  const y = Math.floor(months / 12), m = months % 12;
  let s = y > 0 ? y + (y === 1 ? ' year' : ' years') : '';
  if (y > 0 && m > 0) s += ', ';
  if (m > 0) s += m + (m === 1 ? ' month' : ' months');
  if (weeks > 0 && y === 0) s += ', ' + weeks + (weeks === 1 ? ' week' : ' weeks');
  return s + ' old';
}

/* ════════════════════════════════════════════════════════════
   MILESTONE ENGINE
   ════════════════════════════════════════════════════════════ */
function getMilestonesForChild(child) {
  const ageWeeks      = getAgeWeeks(child.dob);
  const dismissed     = loadDismissed()[child.id] || [];
  const completedIds  = getCompletedIds(child.id);
  const ORDER         = { critical: 0, high: 1, normal: 2 };

  return MILESTONES
    .filter(m => {
      if (dismissed.includes(m.id))    return false;
      if (completedIds.includes(m.id)) return false;
      if (m.prenatal && ageWeeks < 4)  return true;
      return ageWeeks >= m.ageStart && ageWeeks <= m.ageEnd;
    })
    .sort((a, b) => ORDER[a.urgency] - ORDER[b.urgency]);
}

function getWinsForChild(child) {
  const completedIds = getCompletedIds(child.id);
  if (completedIds.length === 0) return [];
  return MILESTONES
    .filter(m => completedIds.includes(m.id))
    .map(m => ({ ...m, _completion: getCompletionMeta(child.id, m.id) }));
}

function getProgressForChild(child) {
  const ageWeeks     = getAgeWeeks(child.dob);
  const completedIds = getCompletedIds(child.id);
  // Before birth: count prenatal milestones as the current window
  const windowMilestones = ageWeeks < 0
    ? MILESTONES.filter(m => m.prenatal)
    : MILESTONES.filter(m => {
        if (m.prenatal)     return false;
        if (m.ageEnd > 500) return false;
        return m.ageStart <= ageWeeks && m.ageEnd >= (ageWeeks - 8);
      });
  const total = windowMilestones.length;
  const done  = windowMilestones.filter(m => completedIds.includes(m.id)).length;
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}

/* ════════════════════════════════════════════════════════════
   RENDERING
   ════════════════════════════════════════════════════════════ */
const PLAYBOOK_LINKS = {
  'feeding':        'course-feeding.html',
  'sleep':          'course-sleep.html',
  'potty-training': 'course-potty.html',
  'tantrum':        'course-tantrum.html',
  'screen-time':    'course-screentime.html',
};
const URGENCY_STYLE = {
  critical: { bg: '#FFF4F0', border: '#FFCBB8', dot: '#E8490F', label: 'Urgent' },
  high:     { bg: '#FFFBF0', border: '#FFE5A0', dot: '#D48F00', label: 'Next Step' },
  normal:   { bg: '#F8F7FF', border: '#E4E0F8', dot: '#6E4ED6', label: null },
};

function _e(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
}
function renderTodos(todos, childId) {
  const storageKey = childId ? `ff_adv_todos_${childId}` : null;
  let checked = [];
  if (storageKey) {
    try { checked = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch(_) {}
  }
  return todos.map(t => {
    const isChecked = checked.includes(t);
    const persist = storageKey
      ? `data-key="${_e(storageKey)}" data-text="${_e(t)}" onchange="window._ffSaveTodo(this)"`
      : '';
    return `<label class="adv-todo"><input type="checkbox" class="adv-todo-check"${isChecked ? ' checked' : ''} ${persist}><span>${_e(t)}</span></label>`;
  }).join('');
}
function renderCard(m, childId, isWin = false) {
  const s = URGENCY_STYLE[m.urgency];
  const link = m.playbookKey ? PLAYBOOK_LINKS[m.playbookKey] : null;
  const badge = s.label ? `<span class="adv-urgency-badge" style="background:${s.dot};color:#fff">${_e(s.label)}</span>` : '';
  
  // Share button — used on win cards and high/normal milestone cards
  const shareCall = m.familyMoment
    ? `advShowShareCard('${m.icon}','${_e(childId ? (window.ffAdvisor.loadChildren().find(c=>c.id===childId)||{name:''}).name : '')} · ${_e(window.ffAdvisor.formatAge ? '' : '')}','${m.title.replace(/'/g,"\\'").replace(/"/g,'\\"')}','${(m.familyMoment||'').replace(/'/g,"\\'").replace(/"/g,'\\"')}')`
    : '';

  const winShareBtn = isWin && m.familyMoment
    ? `<button class="adv-win-share-btn" onclick="${shareCall}">📸 Share this win</button>`
    : '';

  const markDoneBtn = !isWin
    ? `<button class="adv-mark-done-btn" onclick="advShowCompleteModal('${_e(childId)}','${_e(m.id)}')">✓ Mark as done</button>`
    : '';

  const completionMeta = isWin && m._completion
    ? `<div class="adv-completion-meta">
        Completed by <strong>${_e(m._completion.by || 'Unknown')}</strong>${m._completion.date ? ` · ${formatCompletionDate(m._completion.date)}` : ''}
        <button class="adv-completion-edit" onclick="advShowCompleteModal('${_e(childId)}','${_e(m.id)}',true)">Edit</button>
       </div>`
    : '';

  const undoBtn = isWin
    ? `<button class="adv-not-yet-btn" onclick="window.ffAdvisor.unmarkComplete('${_e(childId)}','${_e(m.id)}')">↩ Not done yet</button>`
    : '';

  const highShareBtn = !isWin && m.urgency === 'high' && m.familyMoment
    ? `<button class="adv-share-btn" onclick="${shareCall}">↑ Share</button>`
    : '';

  return `<div class="adv-milestone-card" data-milestone-id="${_e(m.id)}" style="background:${isWin ? '#F0FFF4' : s.bg};border-color:${isWin ? '#C6F6D5' : s.border}">
    <div class="adv-card-inner">
      <div class="adv-milestone-head">
        <span class="adv-milestone-section">${m.icon} ${_e(m.section)}</span>
        ${isWin ? '<span class="adv-urgency-badge" style="background:#38A169;color:#fff">Mastered! 🎉</span>' : badge}
      </div>
      <h4 class="adv-milestone-title">${_e(m.title)}</h4>
      <p class="adv-milestone-body">${_e(m.body)}</p>
      ${m.familyMoment ? `<div class="adv-family-moment"><div class="adv-family-moment-label">Family Moment</div><div class="adv-family-moment-text">${_e(m.familyMoment)}</div></div>` : ''}
      ${!isWin && m.todos && m.todos.length > 0 ? `<div class="adv-todos">${renderTodos(m.todos, childId)}</div><div class="adv-todos-hint">Tap to mark done. Progress saves automatically.</div>` : ''}
      ${completionMeta}
      ${winShareBtn}
      ${markDoneBtn}
      ${undoBtn}
    </div>
    <div class="adv-card-footer">
      ${link ? `<a href="${_e(link)}" class="adv-playbook-link">Open ${_e(m.section)} Playbook →</a>` : '<span></span>'}
      <span style="display:flex;gap:8px;align-items:center">
        ${highShareBtn}
        ${!isWin && m.urgency === 'normal' ? `<button class="adv-dismiss-btn" onclick="window.ffAdvisor.dismiss('${_e(childId)}', '${_e(m.id)}')">Dismiss</button>` : ''}
        ${!isWin && m.prenatal ? `<button class="adv-skip-btn" onclick="window.ffAdvisor.dismiss('${_e(childId)}', '${_e(m.id)}')">Already done · Skip ✓</button>` : ''}
      </span>
    </div>
  </div>`;
}

function renderDigest(child, newCount = 0) {
  const ageWeeks   = getAgeWeeks(child.dob);
  const milestones = getMilestonesForChild(child);
  const wins       = getWinsForChild(child);

  const prenatal = milestones.filter(m => m.prenatal);
  const active   = milestones.filter(m => !m.prenatal);
  const critical = active.filter(m => m.urgency === 'critical');
  const high     = active.filter(m => m.urgency === 'high');
  const normal   = active.filter(m => m.urgency === 'normal');

  const progress = getProgressForChild(child);

  let html = `
    <div class="adv-age-line">${_e(child.name)} is <strong>${formatAge(child.dob)}</strong></div>
    <div class="adv-progress-wrap">
      <div class="adv-progress-header">
        <span>Current window</span>
        <span><strong>${progress.done}</strong> / ${progress.total} milestones complete</span>
      </div>
      <div class="adv-progress-bar">
        <div class="adv-progress-fill" style="width:${progress.pct}%"></div>
      </div>
      ${progress.done > 0 && progress.done === progress.total
        ? `<div class="adv-progress-complete">🎉 All current milestones done. Check back as ${_e(child.name)} grows.</div>`
        : ''}
    </div>
    <p class="adv-disclaimer">* Guidelines assume a typically developing child born at full term. Correct for age if premature.</p>
    ${newCount > 0 ? `<div class="adv-new-banner">👋 <strong>${newCount} new ${newCount === 1 ? 'milestone' : 'milestones'}</strong> since your last visit</div>` : ''}`;

  /* ── Before Baby Arrives ── */
  if (prenatal.length > 0 && ageWeeks < 4) {
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">🤰</span>Before Baby Arrives<em class="adv-sec-count">${prenatal.length}</em>
      </summary>
      <div class="adv-section-body">
        <div class="adv-prenatal-intro">Get these foundational pieces in place before you're in the thick of it.</div>
        ${prenatal.map(m => renderCard(m, child.id)).join('')}
      </div>
    </details>`;
  }

  /* ── Critical ── always shown, even if zero */
  if (critical.length === 0) {
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">🚨</span><span class="urgent">Critical</span><em class="adv-sec-count">0</em>
      </summary>
      <div class="adv-section-body">
        <div class="adv-zero-state">Nothing critical right now. You're on top of it.</div>
      </div>
    </details>`;
  } else {
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">🚨</span><span class="urgent">Critical</span><em class="adv-sec-count">${critical.length}</em>
      </summary>
      <div class="adv-section-body">${critical.map(m => renderCard(m, child.id)).join('')}</div>
    </details>`;
  }

  /* ── High Priority ── */
  if (high.length > 0) {
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">🔶</span>High Priority<em class="adv-sec-count">${high.length}</em>
      </summary>
      <div class="adv-section-body">${high.map(m => renderCard(m, child.id)).join('')}</div>
    </details>`;
  }

  /* ── Regular Priority ── */
  if (normal.length > 0) {
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">📌</span>Regular Priority<em class="adv-sec-count">${normal.length}</em>
      </summary>
      <div class="adv-section-body">${normal.map(m => renderCard(m, child.id)).join('')}</div>
    </details>`;
  }

  /* ── Wins ── always shown */
  html += `<details class="adv-section-details">
    <summary class="adv-section-summary">
      <span class="adv-sec-icon">🏆</span>Wins<em class="adv-sec-count">${wins.length}</em>
    </summary>
    <div class="adv-section-body">
      ${wins.length === 0
        ? `<div class="adv-zero-state">No wins yet — tap "✓ Mark as done" on any milestone to record it here.</div>`
        : `<div class="adv-wins-intro">Milestones you've confirmed as done. Tap "↩ Not done yet" to move one back.</div>${wins.map(m => renderCard(m, child.id, true)).join('')}`
      }
    </div>
  </details>`;

  /* ── Skipped / Dismissed ── always shown */
  try {
    const dismissed = loadDismissed()[child.id] || [];
    const pills = dismissed.map(id => {
      const m = MILESTONES.find(x => x.id === id);
      const label = m ? m.icon + ' ' + m.title.split(':')[0].substring(0, 40) : id;
      return `<span class="adv-dismissed-pill">${_e(label)} <button class="adv-restore-btn" onclick="window.ffAdvisor.restore('${_e(child.id)}','${_e(id)}')">Restore</button></span>`;
    }).join('');
    html += `<details class="adv-section-details">
      <summary class="adv-section-summary">
        <span class="adv-sec-icon">📂</span>Skipped<em class="adv-sec-count">${dismissed.length}</em>
      </summary>
      <div class="adv-section-body">
        ${dismissed.length === 0
          ? `<div class="adv-zero-state" style="color:var(--text-dim);background:var(--elevated);border-color:var(--border-light)">Nothing skipped yet. Dismissed items will appear here.</div>`
          : `<div style="font-size:11.5px;color:var(--text-dim);margin-bottom:8px">Items you dismissed. Restore any time.</div>${pills}`
        }
      </div>
    </details>`;
  } catch(e) {}

  /* ── Next Milestone footer ── */
  const nextDate = getNextMilestoneDate(child);
  if (nextDate) {
    // Only show the day count if it's close — large numbers are alarming, not helpful
    const dayLabel = nextDate.daysUntil <= 30
      ? ` · ${nextDate.daysUntil} day${nextDate.daysUntil === 1 ? '' : 's'} from now`
      : '';
    const subText = nextDate.daysUntil <= 30
      ? `Check back then for ${_e(child.name)}'s next updates.`
      : `You're well set for now. New milestones open around ${nextDate.dateStr} — we'll have them ready.`;
    html += `<div class="adv-next-milestone">
        <span class="adv-next-icon">📅</span>
        <div>
          <div class="adv-next-label">Next milestone window</div>
          <div class="adv-next-date">Around ${nextDate.dateStr}${dayLabel}</div>
          <div class="adv-next-sub">${subText}</div>
        </div>
      </div>`;
  } else {
    html += `<div class="adv-next-milestone" style="text-align:center">
        <div class="adv-next-label">🎓 You're all caught up</div>
        <div class="adv-next-sub">No upcoming milestones in the database — keep doing what you're doing.</div>
      </div>`;
  }

  return html;
}

/* ════════════════════════════════════════════════════════════
   PUBLIC API
   ════════════════════════════════════════════════════════════ */
window.ffAdvisor = {
  loadChildren, saveChildren, addChild, removeChild, updateChildName, updateChildGender,
  updateChild,
  markComplete, unmarkComplete, getCompletionMeta, getMilestoneById,
  loadLastVisit, saveLastVisit, countNewSinceLastVisit, getNextMilestoneDate,
  loadMilestonesFromSupabase, invalidateMilestonesCache,
  getAgeWeeks, formatAge, getMilestonesForChild, getProgressForChild, renderDigest,
  dismiss: (childId, milestoneId) => {
    dismissMilestone(childId, milestoneId);
    if (window.ffRefreshAdvisor) window.ffRefreshAdvisor();
  },
  restore: (childId, milestoneId) => {
    restoreMilestone(childId, milestoneId);
    if (window.ffRefreshAdvisor) window.ffRefreshAdvisor();
  }
};

})();
