// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Digest Email Template (4A)
// Shared by scout-signup-delivery and scout-digest.
//
// Design principles (v2 — Mar 2026):
//   - Letter format, not a dashboard report
//   - Jack's voice throughout — warm, direct, dad-to-parent
//   - Warmth first, urgency earned (never leading with fear)
//   - Closing windows framed as "heads up", not alarm
//   - 600px desktop / mobile-responsive
//   - Table layout (Outlook safe), inline styles only
// ═══════════════════════════════════════════════════════════════

export interface DigestWindow {
  id:                string
  slug:              string
  title:             string
  category:          string
  urgency:           'advisory' | 'screening' | 'clinical'
  open_age_weeks:    number
  close_age_weeks:   number
  priority:          number
  why_it_matters:    string
  what_to_do:        string
  playbook_link:     string | null
  prep_tip:          string | null   // shown in "Get ready" section before window opens
}

export interface DigestEmailOptions {
  childName:       string
  parentName?:     string            // optional — shown in greeting if available
  childGender:     string | null
  ageMonths:       number
  aboveFold:       DigestWindow[]
  getReadyWindows: DigestWindow[]    // windows opening in next 4-8 weeks — shown in "Get ready" section
  completedWindows?: { title: string; close_age_weeks: number }[]  // windows completed since last digest — shown in "what you did" section
  allWindowCount:  number
  closingCount:    number
  overdueWindows?: { title: string; urgency: string }[]  // in_progress windows whose window has closed
  nextEventDate:   Date
  dashboardUrl:    string
  siteUrl:         string
  userId:              string
  digestType:          'signup' | 'monthly' | 'birth_signup' | 'conversion' | 'additional_child'
  isExpecting?:        boolean   // true = expecting parent, pre-birth digest
  postBirthWindowCount?: number  // total post-birth windows — shown in pre-birth tease copy
  unsubscribeUrl?:     string    // family member one-click unsubscribe URL (omit for account owner)
  recipientType?:      'owner' | 'family_member'  // controls footer copy
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:          '#F7F5FF',
  surface:     '#FFFFFF',
  border:      '#E5E2EC',
  text:        '#1D1D1F',
  textMid:     '#5C5960',
  textDim:     '#8A879A',
  terra:       '#6E4ED6',
  terraDark:   '#5B3CC4',
  terraTint:   '#F0EBFF',
  indigoDeep:  '#1E1248',
  green:       '#16A34A',
  greenBg:     '#F0FDF4',
  amber:       '#B45309',
  amberBg:     '#FFFBEB',
  amberBorder: '#FDE68A',
  red:         '#DC2626',
  redBg:       '#FEF2F2',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }
function pronoun(gender: string | null, form: 'subject' | 'object' | 'possess'): string {
  const map = {
    subject: { boy: 'he',  girl: 'she',  other: 'they' },
    object:  { boy: 'him', girl: 'her',  other: 'them' },
    possess: { boy: 'his', girl: 'her',  other: 'their' },
  }
  const g = (gender ?? 'other') as 'boy' | 'girl' | 'other'
  return map[form][g] ?? map[form].other
}

function urgencyConfig(u: 'clinical' | 'screening' | 'advisory') {
  if (u === 'clinical')  return { dot: C.red,   bg: C.redBg,   label: 'Time-sensitive' }
  if (u === 'screening') return { dot: C.terra, bg: C.terraTint, label: 'Screening'   }
  return                        { dot: C.textDim, bg: '#F9F8FF', label: 'This month'  }
}

// ─── Parse what_to_do bullets into HTML list items ────────────────────────────
function renderBullets(text: string): string {
  if (!text) return ''
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const items = lines.map(line => {
    // Strip leading markers: *, -, •, 1., 2., etc.
    const clean = line.replace(/^(\*|-|•|\d+\.)\s*/, '').trim()
    // Bold any **text** spans
    const bolded = clean.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.text}">$1</strong>`)
    return `<p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 9px;padding-left:16px;line-height:1.65;position:relative"><span style="position:absolute;left:0;color:${C.terra}">·</span>${bolded}</p>`
  })
  return items.join('')
}

// ─── Window card (v3 — full bullets) ──────────────────────────────────────────
function windowCard(w: DigestWindow, ageMonths: number, dashboardUrl: string, isClosing: boolean): string {
  const ageWeeks  = ageMonths * 4.33
  const weeksLeft = Math.round(w.close_age_weeks - ageWeeks)

  // 2-sentence excerpt for the why
  const sentences = (w.why_it_matters || '').replace(/([.!?])\s+/g, '$1|||').split('|||')
  const excerpt   = sentences.slice(0, 2).join(' ').trim()

  const badgeText = isClosing ? `Closing in ${weeksLeft}w` : 'This month'
  const badgeColor = isClosing ? C.amber : C.terraDark
  const badgeBg    = isClosing ? C.amberBg : C.terraTint

  return `
  <tr>
    <td style="padding-bottom:14px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:20px 22px 18px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Badge -->
              <tr>
                <td style="padding-bottom:8px">
                  <span style="display:inline-block;background:${badgeBg};color:${badgeColor};font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;letter-spacing:.05em">${badgeText}</span>
                </td>
              </tr>
              <!-- Title -->
              <tr>
                <td style="padding-bottom:10px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:19px;color:${C.text};margin:0;line-height:1.3;letter-spacing:-.01em">${w.title}</p>
                </td>
              </tr>
              <!-- Why excerpt -->
              <tr>
                <td style="padding-bottom:14px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${excerpt}</p>
                </td>
              </tr>
              <!-- Full what_to_do bullets -->
              ${w.what_to_do ? `
              <tr>
                <td style="padding-bottom:4px;border-top:1px solid ${C.border};padding-top:14px">
                  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">What to do</p>
                  ${renderBullets(w.what_to_do)}
                </td>
              </tr>` : ''}
              <!-- Dashboard link -->
              <tr>
                <td style="padding-top:10px;border-top:1px solid ${C.border}">
                  <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:13px;color:${C.terra};text-decoration:none;font-weight:600">Track this in your dashboard →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── DYK card ─────────────────────────────────────────────────────────────────
function dykCard(fact: string): string {
  // Convert **bold** to <strong>
  const html = fact.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.text}">$1</strong>`)
  return `
  <tr>
    <td style="padding-bottom:14px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:12px;border-left:4px solid ${C.terra}">
        <tr>
          <td style="padding:16px 18px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 7px">Did you know?</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${html}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Per-month editorial content ──────────────────────────────────────────────
interface MonthContent {
  theme:   string  // emoji + theme sentence shown above priority window
  dyk:     string  // "Did you know?" fact (markdown **bold** supported)
  opening: string  // opening paragraph (uses childName, pronoun vars at runtime)
  context: string  // context/subtitle line
  closing: string  // Jack's closing sentence
}

// Month 0 = pre-birth; months 1-36 = baby's age
const MONTH_CONTENT: Record<number, MonthContent> = {
  0:  { theme: '📋 This month: three things to sort before the due date.', dyk: 'In the first hour after birth, your baby is in what neuroscientists call the **quiet alert state** — the most receptive window for bonding. Skin-to-skin in that first hour shapes the attachment system for years.', opening: 'The due date is close. Most of the preparation below is far easier to do now than with a newborn in the room.', context: 'A few things that take an hour now and save a lot of stress later.', closing: "You're close now. Everything you do in the next few weeks makes the first days easier. — Jack" },
  1:  { theme: '👶 This month: the 1-month checkup, tummy time, and something worth screening for.', dyk: 'In the first month of life, a baby\'s brain creates more than **1 million new neural connections per second** — a rate that will never be matched again. Every time you talk to her, hold her, and respond to her cries, you\'re building the architecture of her brain.', opening: 'The first month is the steepest learning curve of any parent\'s life. Here\'s what actually matters right now.', context: 'Survival mode is real. These three things are worth doing anyway.', closing: 'Month 1 is hard. You\'re doing it. Month 2 gets better. — Jack' },
  2:  { theme: '😊 This month: the 2-month checkup, the first real smile, and the habit that builds everything.', dyk: 'The social smile — the first **intentional smile in response to your face** — activates the same brain regions as adult social bonding. It\'s not reflex. It\'s the beginning of a relationship.', opening: 'Two months in. The fog is still real, but something is shifting — she\'s starting to respond to you. Here\'s what matters this month.', context: 'The fog is lifting. And she\'s starting to know your face.', closing: 'The social smile changes things. You\'ll feel it when it happens. — Jack' },
  3:  { theme: '🧠 This month: one milestone closing, a new one emerging, and the bedtime habit to lock in now.', dyk: 'A consistent 3–4 step bedtime routine can produce **measurable sleep improvements within one week** — even in babies as young as 3 months. Same steps, same order, every night.', opening: 'Three months in is when most parents feel like they\'ve finally found their footing. Here\'s what\'s worth your attention right now.', context: 'You made it through the fourth trimester. The development is accelerating.', closing: 'Month 3 is when it starts feeling real. You\'re watching her become someone. — Jack' },
  4:  { theme: '😴 This month: nobody warns you about the 4-month sleep regression. We\'re warning you.', dyk: 'The 4-month sleep regression isn\'t random — it\'s caused by the brain **permanently reorganising its sleep architecture** from newborn cycles to adult cycles. It doesn\'t go back. But it does get better.', opening: 'Four months. The sleep regression may have arrived — or it\'s coming. Here\'s what it is and what to do.', context: 'The hardest sleep phase of the first year. Understanding it helps.', closing: 'The regression passes. Your response to it shapes the next 6 months of sleep. — Jack' },
  5:  { theme: '🥄 This month: solids are almost here, iron matters now, and attachment is building.',  dyk: '**Iron deficiency is the most common nutritional deficiency in infants worldwide** — and breastfed babies are most at risk after 4 months. Iron drops are a simple fix while solid foods are being introduced.', opening: 'Five months. Solids are right around the corner — and there\'s a nutrition window closing this month that\'s worth knowing about.', context: 'The solids window is opening. The iron window is closing.', closing: 'The attachment you\'ve been building all along — it\'s real. It shows up at 12 months, and again at 3 years. — Jack' },
  6:  { theme: '🥄 This month: the 6-month checkup, first solids, and a motor milestone worth celebrating.', dyk: 'When babies sit **independently**, it frees both hands for exploration — and exploration is how the brain builds. Independent sitting isn\'t just a motor milestone. It\'s what unlocks the next 6 months of cognitive development.', opening: 'Six months. Solids are starting, the checkup is due, and she\'s sitting up on her own. Here\'s what matters this month.', context: 'Six months. Solids, sitting, and a whole new level of curiosity.', closing: 'Halfway through the first year. You\'ve done more right than you know. — Jack' },
  7:  { theme: '🔒 This month: babyproof before she moves, name response, and open the dairy window.', dyk: 'Babies who hear their **own name used consistently and positively** develop name response faster and show stronger early social attention. Use her name — not just nicknames — especially when you want her focus.', opening: 'Seven months. Mobility is coming — and with it, a world that suddenly needs a closer look for hazards.', context: 'Once she\'s mobile, you\'ll wish you\'d done this last week.', closing: 'Seven months is when parents start babyproofing in earnest. This month, not next month. — Jack' },
  8:  { theme: '🥚 This month: allergen introductions, babbling, and tree nuts.', dyk: 'Babies who are exposed to **varied sounds and babble-back interactions** at 8–10 months have measurably larger productive vocabularies at 18 months. The babbling stage is when the foundation is literally being laid — neuron by neuron.', opening: 'Eight months. Object permanence is kicking in, allergen introductions are the priority, and babbling is starting. Here\'s what to focus on.', context: 'Eight months: the allergen introduction window is open. Don\'t miss it.', closing: 'Eight months is when it all starts accelerating. Stay with it. — Jack' },
  9:  { theme: '🩺 This month: the first formal developmental screen, the peanut window, and sesame.', dyk: 'The **LEAP study** showed early peanut introduction (4–11 months) reduces peanut allergy risk by up to 80% in high-risk infants. This is one of the most significant findings in pediatric nutrition in decades.', opening: 'Nine months. The 9-month well child visit is the first to use a standardised developmental screening tool. It\'s more than a checkup — here\'s how to come prepared.', context: 'Nine months: the first formal developmental screen. Come prepared.', closing: 'Nine months is one of my favourites. She\'s communicating deliberately, moving on her own, becoming someone with opinions. — Jack' },
  10: { theme: '🧗 This month: pulling up to stand, object permanence locking in, and the safety checklist that changes when they\'re upright.', dyk: 'Peek-a-boo teaches three things simultaneously: **object permanence** (you disappear and still exist), **trust** (you always come back), and **conversational turn-taking**. It\'s one of the most cognitively rich games in early childhood — and it costs nothing.', opening: 'Ten months. She\'s pulling up to stand. The whole world just got bigger — and more dangerous. Here\'s what to focus on.', context: 'Ten months: upright and opinionated. The walking window is getting closer.', closing: 'Ten months goes fast. She\'s a communicator now — not with words yet, but with everything else. — Jack' },
  11: { theme: '🚶 This month: cruising along furniture, first words getting specific, and the first dental visit.', dyk: 'Babies say \'mama\' and \'dada\' as sounds around 9 months — but using them **specifically** (mama when looking at mum, dada when looking at dad) typically locks in by 12 months. That specificity is the milestone, not the sound.', opening: 'Eleven months. She\'s cruising the furniture — the last step before walking. Here\'s what matters before the first birthday.', context: 'Eleven months: the walk is coming. You can see it in her eyes every time she lets go.', closing: 'One month to the first birthday. It goes fast — and then it really goes fast. — Jack' },
  12: { theme: '🎂 This month: the 12-month visit, reading aloud every day, and the switch to whole milk.', dyk: 'Children read to every day from birth enter kindergarten with **a vocabulary equivalent to 1,000 additional hours of classroom instruction.** Any book. Every day. That\'s the whole prescription.', opening: 'Twelve months. One year. You did it. Here\'s what the 12-month visit covers and what to focus on now.', context: 'The first year is done. One of the most remarkable developmental years of any human life.', closing: 'Happy first birthday. Year two is different. Faster in some ways, slower in others. We\'ll keep you on track. — Jack' },
  13: { theme: '👣 This month: first steps, first words, and leaving the bottle behind.', dyk: 'Baby sign language doesn\'t delay speech — it **accelerates** it. Babies who learn signs like \'more,\' \'all done,\' and \'milk\' reduce frustration and build word-concept connections faster. The sign and the word fire in the brain together.', opening: 'Thirteen months. Walking is happening or on the way. Words are starting to land. The toddler years are beginning.', context: 'Thirteen months: a walker, a talker, and an opinion-holder — all at once.', closing: 'The second year is a completely different experience. The pace of change slows — and then the language starts to explode. — Jack' },
  14: { theme: '👉 This month: pointing and shared attention, walking as locomotion, and body parts.', dyk: 'Pointing to share interest — then looking back to check your reaction — is more important than first words as an early communication milestone. It\'s called **declarative pointing** and it\'s a key marker on the M-CHAT autism screen.', opening: 'Fourteen months. She\'s pointing — and looking back at you after she points. That\'s joint attention, and it matters more than almost any other milestone right now.', context: 'Fourteen months: a walker who points. That\'s a communicator in the making.', closing: 'When she points and looks back at you — respond every time. That\'s the lesson she\'s practising. — Jack' },
  15: { theme: '🩺 This month: the 15-month checkup, the 10-word milestone, and pretend play beginning.', dyk: 'Once a child hits **50 words**, vocabulary growth often becomes exponential — jumping from 50 to 200+ words in just a few months. The slow build from 1 to 50 words is doing the work. Every word added now accelerates what comes next.', opening: 'Fifteen months. The 15-month visit is the first to formally check word count and walking quality. Here\'s how to come prepared.', context: 'Fifteen months: the first real language checkpoint. Start counting words.', closing: 'The 15-month visit is worth taking seriously. Come with your word count, your walking update, and your questions. — Jack' },
  16: { theme: '😤 This month: naming big feelings, following simple instructions, and stairs.', dyk: 'Children whose parents **label their emotions** during early childhood show measurably better emotional regulation, fewer behavioural problems, and stronger peer relationships at school age. The investment is invisible in the moment and pays off for years.', opening: 'Sixteen months. The big feelings are arriving — frustration, excitement, fury, joy. Here\'s how to respond in a way that actually helps.', context: 'Sixteen months: enormous emotions, a tiny prefrontal cortex. That mismatch is the whole toddler experience.', closing: 'Labelling feelings feels awkward at first. It gets natural fast. The payoff is a child who can eventually name their own emotions. — Jack' },
  17: { theme: '🧸 This month: parallel play, the spoon, and why goodbye has to be out loud.', dyk: 'Children allowed to **self-feed with a spoon from 12–15 months** develop fine motor skills faster and have a stronger relationship with varied textures by age 2. The mess is the lesson. A splat mat costs £15.', opening: 'Seventeen months. Separation anxiety may be peaking — the crying at drop-off, the reaching when you try to leave the room. It\'s hard to watch. It\'s also a healthy sign.', context: 'Seventeen months: she wants you near. That\'s not clingy — that\'s securely attached.', closing: 'Seventeen months is peak separation anxiety for many kids. Stay consistent. Stay warm. Keep the goodbye brief. — Jack' },
  18: { theme: '🩺 This month: the M-CHAT screen, two-word language, and tantrums at their peak.', dyk: 'Two-word combinations — \'more milk,\' \'daddy go,\' \'big dog\' — represent a **qualitative leap** in language, not just more words. The child is now constructing meaning, not just labelling. Once two-word phrases start, three-word sentences usually follow within months.', opening: 'Eighteen months. The 18-month well child visit is the most important developmental checkpoint of the toddler years — it includes the first formal autism screening.', context: 'Eighteen months: the first autism screen, the first two-word combinations, and probably the first spectacular tantrum.', closing: 'The 18-month visit is one of the most important ones. Come prepared. Answer the M-CHAT honestly. — Jack' },
  19: { theme: '🙌 This month: the independence phase, the 50-word gate, and building the self-regulation foundation.', dyk: 'At around **50 words**, vocabulary growth often goes exponential — some children add 5–10 new words per day. The slow, patient work from 1 word to 50 words is what makes that explosion possible. Every word you name is a seed.', opening: 'Nineteen months. The fierce independence has arrived — \'me do it\' is a phrase you\'re hearing a lot. This is not defiance. This is healthy.', context: 'Nineteen months: the will to do it herself is the whole point. Support it.', closing: '\'Me do it\' is the sound of a child becoming someone. Let her. — Jack' },
  20: { theme: '❓ This month: the why-question explosion, sorting by shape and color, and naming the body.', dyk: 'Research by Chouinard (2007) found that children in the question-asking phase ask up to **100 questions per hour** — and that the quality of the answers they receive significantly predicts scientific reasoning ability at age 10.', opening: 'Twenty months. The questions are starting — \'What\'s that?\' over and over, about everything. Answer every single one.', context: 'Twenty months: questions are the learning mechanism. The repetition is the point.', closing: 'Answer the questions. All of them. Every answered question is a word, a concept, a connection. — Jack' },
  21: { theme: '🗣️ This month: speech clarity milestone, empathy beginning, and knowing what things are for.', dyk: 'Toddlers who see adults **modelling empathic behaviour** — comforting others, asking \'are you okay?\', naming concern — develop empathy faster and show stronger prosocial behaviour at ages 4 and 5. She\'s watching everything you do.', opening: 'Twenty-one months. Her speech is getting clearer — and something new is happening: she\'s starting to notice when other people feel something.', context: 'Twenty-one months: words getting clearer, and a little person who notices when you\'re sad.', closing: 'When she notices you\'re sad — that\'s not nothing. That\'s the beginning of everything that makes us human. — Jack' },
  22: { theme: '📚 This month: the 200-word target, 2-step commands, and the pronoun shift.', dyk: 'Following a **2-step command** requires holding two pieces of information in working memory and executing them in order. It\'s not just language — it\'s executive function. The same mental process underlies planning, problem-solving, and academic learning.', opening: 'Twenty-two months. Two months from the second birthday — and the 24-month language targets are in sight.', context: 'Twenty-two months: two months to the 24-month checkup. Language is the main event.', closing: 'Two months to the second birthday. Keep reading, keep narrating, keep expanding. — Jack' },
  23: { theme: '🦘 This month: jumping with both feet, pretend play getting complex, and first size concepts.', dyk: 'Complex pretend play — multi-step scenarios with characters and scripts — uses the same cognitive machinery as **narrative comprehension and writing** later in school. Children who engage in rich pretend play at 2–3 years show stronger literacy skills at age 5.', opening: 'Twenty-three months. One month from the second birthday. The motor, language, and cognitive development happening this month is accelerating fast.', context: 'Twenty-three months: the last month before the second birthday checkup.', closing: 'One month to the second birthday. She\'s come so far — and the pace doesn\'t slow down. — Jack' },
  24: { theme: '🩺 This month: the 24-month checkup + second autism screen, the milk switch, and same vs. different.', dyk: 'The AAP recommends switching to **2% milk at age 2** because after the second birthday, children no longer need the high fat content of whole milk for brain development. The brain\'s fat-intensive growth phase is winding down.', opening: 'Twenty-four months. Two years old. The 24-month checkup includes the second formal autism screening. Here\'s how to come prepared.', context: 'Two years. One of the most comprehensive developmental checkpoints of the first two years.', closing: 'Happy second birthday. Two years of showing up, learning on the job. Year three is different again. — Jack' },
  25: { theme: '🗣️ This month: 3-word sentences, memory taking shape, and cooperative play beginning.', dyk: 'Asking **\'what happened?\'** after an outing does more for language development than almost any other single prompt. It exercises memory, narrative structure, vocabulary, and sentence construction simultaneously.', opening: 'Twenty-five months. Three-word sentences are arriving — and with them, the beginning of real grammar. Here\'s what to watch for.', context: 'Twenty-five months: telegraphic speech is giving way to early grammar. Each sentence is a step forward.', closing: 'Three-word sentences are the beginning of the language explosion. The more you respond, the faster it comes. — Jack' },
  26: { theme: '❓ This month: the why-question phase, colors she can name, and counting in sequence.', dyk: 'Color naming is one of the **trickier early language concepts** — colors are not things, they\'re properties of things. \'Red\' describes the cup, the apple, and the fire engine — but \'red\' is none of those things. That abstraction is why color vocabulary arrives later than object vocabulary.', opening: 'Twenty-six months. The \'why\' questions are arriving — or they\'re coming. Here\'s why it matters and how to handle it.', context: 'Twenty-six months: the world is suddenly explicable. She wants to know everything about why.', closing: 'Answer the \'why\' questions. Every single one. That\'s the whole job this month. — Jack' },
  27: { theme: '⚾ This month: catching a ball, potty readiness still in the picture, and speech clarity for strangers.', dyk: 'Starting potty training **before a child shows readiness signs** leads to a longer, more frustrating process with more accidents and more resistance. Waiting for the signs — rather than starting at a fixed age — is the single most reliable predictor of a faster, lower-conflict experience.', opening: 'Twenty-seven months. The gross motor development happening right now — throwing, catching, kicking — is also building the neural coordination for balance and sport. Here\'s what to focus on.', context: 'Twenty-seven months: motor coordination is accelerating. The best investment is unstructured outdoor play.', closing: 'Catching a ball is harder than it looks. Let her miss it a hundred times. That\'s the training. — Jack' },
  28: { theme: '😄 This month: first jokes, understanding time, and a specific friend she wants to see.', dyk: 'A **visual daily schedule** — pictures of the sequence of events, not words — reduces toddler anxiety and improves co-operation dramatically. When she knows what comes next, transitions stop being surprise ambushes and become predictable events.', opening: 'Twenty-eight months. She said something wrong on purpose, waited, and then laughed. That\'s not silliness — that\'s the first evidence of social intelligence applied to humour.', context: 'Twenty-eight months: she\'s figured out that she can surprise you. That\'s a cognitive leap.', closing: 'When she tells a joke, laugh. Every single time. You\'re reinforcing the social intelligence that will carry her through life. — Jack' },
  29: { theme: '🔢 This month: counting objects with real meaning, preschool readiness on the horizon, and balance building.', dyk: 'True counting — where each object gets exactly one number — is called **one-to-one correspondence** and is fundamentally different from reciting number sequences. It\'s one of the earliest building blocks of mathematical reasoning.', opening: 'Twenty-nine months. She can recite numbers — but can she count? The difference between rote recitation and genuine understanding is one of the most important early math milestones.', context: 'Twenty-nine months: counting with meaning is different from counting from memory. Watch for the difference.', closing: 'The \'give me 3 crackers\' game is the best math lesson available. No materials required. — Jack' },
  30: { theme: '🩺 This month: the 30-month checkup, the crib-to-bed transition, and the potty finish line.', dyk: 'Moving from crib to bed **too early** is one of the most common causes of sleep regression in the second and third years. The crib is a boundary. Keeping it until age 3 — unless she\'s climbing out — makes bedtime more predictable for everyone.', opening: 'Thirty months. Two and a half years. The 30-month visit was added to the AAP schedule specifically because the gap between 24 and 36 months was too long.', context: 'Thirty months: the halfway point between the 2-year and 3-year checkups — and one of the most useful.', closing: 'Two and a half. The language has come so far. Come prepared to the 30-month visit. — Jack' },
  31: { theme: '👗 This month: real peer friendships, understanding what numbers mean, and getting dressed solo.', dyk: 'Children who understand **cardinality** — that \'3\' means exactly 3 things — at age 3 show consistently stronger mathematics outcomes in primary school. The \'give me 2 crackers\' game is one of the most powerful math activities available, anywhere, anytime.', opening: 'Thirty-one months. Friendships are becoming specific, real, and important to her. And the self-help skills are expanding. Here\'s what\'s worth supporting.', context: 'Thirty-one months: independence is expanding on every front — social, cognitive, and physical.', closing: 'The friendships she\'s making now are the first ones she\'ll remember. Take them seriously. — Jack' },
  32: { theme: '🦷 This month: name and age, hopping on one foot, and the tooth brushing handoff.', dyk: 'Hopping on one foot is a precursor to **skipping** — which is itself a precursor to the lateral co-ordination needed for sports, dance, and smooth stair negotiation. The physical milestones build on each other in a sequence that spans years.', opening: 'Thirty-two months. Knowing and stating her full name and age is both a developmental milestone and a practical safety skill. Here\'s what matters this month.', context: 'Thirty-two months: self-concept, physical confidence, and daily health habits.', closing: 'Teach her her full name and your name this month. It takes one week of practice. It could matter a lot. — Jack' },
  33: { theme: '🌟 This month: imaginary friends, storytelling, and following complex instructions.', dyk: 'Children who regularly **tell stories** about their own experiences show stronger reading comprehension and writing ability at age 6 and 7. Storytelling builds the narrative scaffolding that books are built on. The dinner table is the classroom.', opening: 'Thirty-three months. She may have an imaginary friend — or be on the verge of inventing one. Research shows this is a very good sign.', context: 'Thirty-three months: imagination is at full power. Harness it.', closing: 'The imaginary friend is practising social skills. Let her. — Jack' },
  34: { theme: '🚲 This month: first wheels, gratitude at the table, and the fine motor milestone building toward writing.', dyk: 'Families with regular **gratitude practices at mealtimes** — even one sentence each — show measurably higher wellbeing, more prosocial behaviour, and stronger relationship quality in children by age 10. The mechanism is habit formation through repetition. It takes about 3 weeks to feel natural.', opening: 'Thirty-four months. Two months from the 3-year checkup. The balance and co-ordination developing this month are the foundation for sport, dance, and physical confidence.', context: 'Thirty-four months: wheels, character, and the last stretch before the 3-year checkup.', closing: 'The tricycle or balance bike is one of the best investments you can make at this age. Get outside. — Jack' },
  35: { theme: '🚗 This month: car seat safety update, counting with real meaning, and why sharing now makes sense.', dyk: 'The **\'give me 3\'** game — asking a child to hand you exactly 3 objects — is one of the most reliable ways to test whether she understands what 3 means, versus just being able to recite \'1, 2, 3.\' Both matter, but understanding cardinality is the deeper skill.', opening: 'Thirty-five months. One month from the 3-year checkup — and the 3-year milestone set is nearly complete. Here\'s what to focus on in this final stretch.', context: 'Thirty-five months: the 3-year checkup is one month away. Come prepared.', closing: 'One month to the third birthday — and the 3-year checkup. Come with your observations, your concerns, and your word count. — Jack' },
  36: { theme: '🎉 This month: the 3-year checkup, full sentences, and the discipline approach that actually works.', dyk: 'By age 3, the brain has reached **80% of its adult size** — and the connections built in the first three years are the scaffolding for everything that comes after. Every conversation, every book, every patient repair after a meltdown. All of it counted.', opening: 'Three years old. The 36-month well child visit marks the end of the most intensive developmental surveillance period. From here, visits go annual.', context: 'Three years. The intensive developmental surveillance window closes. Annual visits from here.', closing: 'Happy third birthday. Three years of showing up. The work you\'ve done is the most important work of her life. — Jack' },
}

function getMonthContent(ageMonths: number): MonthContent {
  return MONTH_CONTENT[ageMonths] ?? MONTH_CONTENT[Math.min(36, Math.max(0, ageMonths))] ?? {
    theme: '📅 This month\'s windows',
    dyk: 'Every month of early childhood brings new developmental windows — some open briefly and close. Scout makes sure you don\'t miss the ones that matter.',
    opening: `Month ${ageMonths}. Every month has something new — here\'s what to know this one.`,
    context: `${ageMonths} months old. Development is always moving.`,
    closing: 'Stay curious, stay consistent. We\'ll keep you on track. — Jack',
  }
}

// ─── Coming next month list ────────────────────────────────────────────────────
function comingNextSection(windows: { title: string }[]): string {
  if (!windows.length) return ''
  const items = windows.slice(0, 3).map(w =>
    `<p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 8px;padding-left:16px;position:relative;line-height:1.6"><span style="position:absolute;left:0;color:${C.terraDark}">›</span>${w.title}</p>`
  ).join('')
  return `
  <tr>
    <td style="padding-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8FF;border:1px solid ${C.border};border-radius:12px">
        <tr>
          <td style="padding:16px 18px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terraDark};text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">A few things coming next month</p>
            ${items}
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Get ready item (lighter than a card) ──────────────────────────────────
function getReadyItem(w: DigestWindow): string {
  const tip = w.prep_tip || 'No special preparation needed — just know this is on the horizon.'
  return `
  <tr>
    <td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8FF;border:1px solid ${C.border};border-radius:12px">
        <tr>
          <td style="padding:16px 20px">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:${C.text};margin:0 0 6px;line-height:1.3;font-weight:600">${w.title}</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.6">
              <strong style="color:${C.terra}">Prep:</strong> ${tip}
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function buildDigestEmail(opts: DigestEmailOptions): string {
  const {
    childName, parentName, childGender, ageMonths, aboveFold,
    getReadyWindows = [],
    completedWindows = [],
    allWindowCount, closingCount, overdueWindows = [], nextEventDate,
    dashboardUrl, siteUrl, userId, digestType, isExpecting = false,
    postBirthWindowCount = 192,
  } = opts

  // Cap at 3 windows
  const topWindows  = aboveFold.slice(0, 3)
  const allCaughtUp = topWindows.length === 0 && digestType === 'monthly'

  // #3 — Editorial featured-window override: ensure the month's priority window leads.
  // DB priority sort can be overridden by a closing window we don't want to lead.
  // Map: month → slug that should always appear first if present in top 3.
  // Months omitted = no override (DB priority determines order).
  // Note: months 10, 27, 28, 29, 34 have DB timing issues — see content backlog.
  const MONTH_FEATURED_SLUGS: Record<number, string> = {
    1:  'screening-visit-1month',
    2:  'screening-visit-2months',
    3:  'motor-head-control',
    4:  'cognitive-sleep-regression-4month',
    5:  'nutrition-solids-readiness',
    6:  'screening-visit-6months',
    7:  'safety-babyproofing',
    8:  'nutrition-egg-intro',
    9:  'screening-visit-9months',
    10: 'motor-pull-to-stand',
    11: 'motor-cruising',
    12: 'screening-visit-12months',
    13: 'motor-first-steps',
    14: 'social-joint-attention',
    15: 'screening-visit-15months',
    16: 'social-label-big-feelings',
    17: 'social-parallel-play',
    18: 'screening-visit-18months-autism',
    19: 'social-independence-me-do-it',
    20: 'language-question-asking',
    21: 'language-speech-clarity-family',
    22: 'language-vocab-200-words',
    23: 'motor-jumping-both-feet',
    24: 'screening-visit-24months-autism',
    25: 'language-3-word-sentences',
    26: 'language-names-colors',
    27: 'motor-catching-ball',
    29: 'language-counts-objects-5',
    30: 'screening-visit-30months',
    31: 'social-peer-friendships',
    32: 'language-knows-name-age',
    33: 'social-imaginary-friends',
    34: 'motor-tricycle-balance-bike',
    35: 'safety-forward-facing-transition',
    36: 'screening-visit-36months',
  }
  if (!isExpecting) {
    const featuredSlug = MONTH_FEATURED_SLUGS[ageMonths]
    if (featuredSlug) {
      const idx = topWindows.findIndex(w => w.slug === featuredSlug)
      if (idx > 0) {
        const [featured] = topWindows.splice(idx, 1)
        topWindows.unshift(featured)
      }
    }
  }

  const His = cap(pronoun(childGender, 'possess'))
  const his = pronoun(childGender, 'possess')
  const him = pronoun(childGender, 'object')

  const ageWeeks = ageMonths * 4.33

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })

  // Split the top 3 into closing vs open
  const closing     = topWindows.filter(w => w.close_age_weeks - ageWeeks <= 4)
  const openWindows = topWindows.filter(w => w.close_age_weeks - ageWeeks > 4)

  // Per-month editorial content
  const mc = getMonthContent(isExpecting ? 0 : ageMonths)

  // Greeting
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'

  // Opening paragraph
  const openingParagraph = isExpecting
    ? `Scout is designed for when your baby is born — covering every developmental milestone through the first three years. But we wanted to be helpful before ${childName} arrives too, so below are a few things worth sorting now. They're much easier to do before a newborn is in the room.`
    : digestType === 'birth_signup'
    ? `${childName} is here. And there are ${allWindowCount} developmental windows open in the first month. That can feel like a lot — and honestly, it is. But that's exactly why Scout exists. We'll make sure you don't miss any of them. Let's nail the first month together.`
    : digestType === 'conversion'
    ? `Thanks for continuing. This is ${childName}'s Scout digest for month ${ageMonths} — a monthly heads-up on exactly what's worth your attention, based on ${his} age right now. I wish I'd had this with my first son.`
    : digestType === 'additional_child'
    ? `You already know how Scout works. This is ${childName}'s first digest — the same system, tuned to exactly where ${his} is right now. Every child has their own set of windows. Here's ${childName}'s.`
    : digestType === 'signup'
    ? `This is ${childName}'s first Scout digest. It's the beginning of something that I wish I'd had with my first son — a monthly heads-up on exactly what's worth your attention, based on ${his} age right now.`
    : mc.opening

  // Context line
  const contextLine = isExpecting
    ? `The preparation windows below close at birth. Most are quick — and much easier to do now than with a newborn in the room.`
    : digestType === 'birth_signup'
    ? `The first few months are a blur. You're doing better than you think — and now you've got a system.`
    : digestType === 'additional_child'
    ? `${childName}'s windows are live. Here's what's worth your attention this month.`
    : allCaughtUp
    ? `You've marked everything done this month. That's genuinely rare — and it shows.`
    : mc.context

  // Jack closing
  const jackClosing = isExpecting
    ? `You're close now. Everything you do in the next few weeks makes the first days easier. — Jack`
    : mc.closing

  // Theme stripe
  const themeStripe = (!allCaughtUp && topWindows.length > 0) ? `
    <tr>
      <td style="padding-bottom:12px">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textMid};margin:0;line-height:1.65;font-style:italic">${mc.theme}</p>
      </td>
    </tr>` : ''

  // Build window sections
  // #6: section headers only when BOTH closing and open windows exist
  // #4: DYK after first window when all same type (no mix)
  const dykSection  = dykCard(mc.dyk)
  const showHeaders = closing.length > 0 && openWindows.length > 0

  let windowsLayout: string
  if (showHeaders) {
    // Mix: header+closing → DYK → header+open
    const closingSec = `
    <tr><td style="padding-bottom:4px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.amber};margin:0">⏱ Closing this month</p></td></tr>
    ${closing.map(w => windowCard(w, ageMonths, dashboardUrl, true)).join('')}`
    const openSec = `
    <tr><td style="padding:8px 0 4px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.textDim};margin:0">Also this month</p></td></tr>
    ${openWindows.map(w => windowCard(w, ageMonths, dashboardUrl, false)).join('')}`
    windowsLayout = closingSec + dykSection + openSec
  } else {
    // All same type (all closing or all open): DYK after window 1 for visual break
    const allWins   = [...closing, ...openWindows]
    const isClose   = closing.length > 0
    const firstCard = allWins.length > 0 ? windowCard(allWins[0], ageMonths, dashboardUrl, isClose) : ''
    const restCards = allWins.slice(1).map(w => windowCard(w, ageMonths, dashboardUrl, isClose)).join('')
    windowsLayout   = firstCard + dykSection + restCards
  }

  // Coming next month from getReadyWindows — replaced with farewell at month 36
  const farewellHtml = (!isExpecting && ageMonths >= 36 && getReadyWindows.length === 0) ? `
    <tr>
      <td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.indigoDeep};border-radius:16px;overflow:hidden">
          <tr>
            <td style="padding:32px 28px;text-align:center">
              <p style="font-family:Arial,sans-serif;font-size:36px;margin:0 0 14px">🎓</p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#fff;margin:0 0 16px;line-height:1.3">Three years done.</p>
              <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 14px;line-height:1.75">
                Scout is built for the first three years — the most intensive developmental period of any human life. You've been through all of it: every checkup, every window, every month.
              </p>
              <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0;line-height:1.75">
                From here, well child visits go annual — ages 4, 5, 6, 7, and 8. Keep reading every day. Keep talking. Keep being curious about who ${childName} is becoming. The habits you've built in these three years are the foundation for everything that comes next.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  const comingNextHtml = farewellHtml || comingNextSection(getReadyWindows)

  const remainingCount = allCaughtUp ? 0 : Math.max(0, allWindowCount - topWindows.length - completedWindows.length)

  // "What you did" section — split into closing-this-month vs everything else
  const closingDone  = completedWindows.filter(w => w.close_age_weeks - ageWeeks <= 4)
  const regularDone  = completedWindows.filter(w => w.close_age_weeks - ageWeeks > 4)

  const completedSection = completedWindows.length > 0 ? `
    <tr>
      <td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.greenBg};border:1px solid #BBF7D0;border-radius:12px">
          <tr>
            <td style="padding:18px 20px">
              ${closingDone.length > 0 ? `
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.green};margin:0 0 4px">Completed before ${closingDone.length === 1 ? 'it closed' : 'they closed'}</p>
              <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textMid};margin:0 0 10px;line-height:1.5">${closingDone.length === 1 ? 'This window was' : 'These windows were'} closing this month. You got ${closingDone.length === 1 ? 'it' : 'them'} done in time.</p>
              ${closingDone.map(w => `
              <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 6px;padding-left:18px;position:relative;font-weight:600">
                <span style="position:absolute;left:0;color:${C.green}">✓</span>${w.title}
              </p>`).join('')}
              ${regularDone.length > 0 ? `<div style="border-top:1px solid #BBF7D0;margin:14px 0"></div>` : ''}
              ` : ''}
              ${regularDone.length > 0 ? `
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.green};margin:0 0 10px">${closingDone.length > 0 ? 'Also completed' : 'What you did this month'}</p>
              ${regularDone.map(w => `
              <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 6px;padding-left:18px;position:relative">
                <span style="position:absolute;left:0;color:${C.green}">✓</span>${w.title}
              </p>`).join('')}
              ` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  // "All caught up" hero — replaces window sections when everything is done
  const allCaughtUpSection = allCaughtUp ? `
    <tr>
      <td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.greenBg};border:1px solid #BBF7D0;border-radius:14px">
          <tr>
            <td style="padding:28px 24px;text-align:center">
              <p style="font-family:Arial,sans-serif;font-size:32px;margin:0 0 8px">🏆</p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${C.text};margin:0 0 8px;font-weight:400">All caught up.</p>
              <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.65">
                ${childName} had ${allWindowCount} open window${allWindowCount === 1 ? '' : 's'} this month and you marked them all done. That's exceptional. Keep the habits going.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  // Overdue section — only shown in monthly digests when in_progress windows have closed
  const overdueSectionHtml = overdueWindows.length > 0 ? `
  <tr>
    <td style="padding-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px">
        <tr>
          <td style="padding:20px 22px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#D97706;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">Still in progress</p>
            ${overdueWindows.map(w => `
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
              <tr>
                <td style="padding:10px 14px;background:#fff;border-radius:10px;border:1px solid #FDE68A">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;font-weight:600">${w.title}</p>
                  <p style="font-family:Arial,sans-serif;font-size:12px;color:#D97706;margin:4px 0 0">This window has closed — mark it done or skip it in the dashboard.</p>
                </td>
              </tr>
            </table>`).join('')}
            <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textMid};margin:12px 0 0;line-height:1.6">These were in progress when the window closed. Head to the dashboard to mark them done or skip them.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : ''

  const dashboardCTA = remainingCount > 0 ? `
  <tr>
    <td style="padding-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:14px">
        <tr>
          <td style="padding:22px;text-align:center">
            <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 16px;line-height:1.65">
              There are <strong style="color:${C.text}">${remainingCount} more open windows</strong> for ${childName} right now — all in ${his} dashboard.
            </p>
            <a href="${dashboardUrl}" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 30px;border-radius:100px;text-decoration:none">See all of ${childName}'s windows →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : `
  <tr>
    <td style="padding-bottom:32px;text-align:center">
      <a href="${dashboardUrl}" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 32px;border-radius:100px;text-decoration:none">Open ${childName}'s dashboard →</a>
    </td>
  </tr>`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>Scout digest — ${childName}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 480px) {
      .email-wrap { padding: 0 !important; }
      .email-outer { border-radius: 0 !important; }
      .email-body  { padding: 24px 18px !important; }
      .hero-pad    { padding: 24px 20px 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">

<!-- Hidden preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
  ${isExpecting
    ? `${childName} hasn't arrived yet — ${allWindowCount} preparation window${allWindowCount !== 1 ? 's' : ''} open right now.`
    : allCaughtUp
    ? `${ageMonths === 0 ? `${childName} is here` : `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'}`} — you've marked everything done. 🏆`
    : `${ageMonths === 0 ? `${childName} is here! 🎉` : `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'}`} — ${closingCount > 0 ? `${closingCount} window${closingCount > 1 ? 's' : ''} closing this month` : `${allWindowCount} open windows`}.`
  }
  &nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${C.bg}">
  <tr>
    <td align="center" class="email-wrap" style="padding:32px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="email-outer" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td class="hero-pad" style="background:${C.indigoDeep};padding:32px 36px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px">Scout by FamilyForce</p>
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">${isExpecting ? `Getting ready for ${childName}` : ageMonths === 0 ? `${childName} is here! 🎉` : `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'}`}</p>
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0;line-height:1.6">${allCaughtUp ? `All ${allWindowCount} window${allWindowCount === 1 ? '' : 's'} completed this month 🏆` : `${allWindowCount} open developmental window${allWindowCount === 1 ? '' : 's'} &nbsp;·&nbsp; ${closingCount > 0 ? `${closingCount} closing this month` : 'none closing this month'}`}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
          <td class="email-body" style="background:${C.surface};padding:32px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Greeting -->
              <tr>
                <td style="padding-bottom:24px;border-bottom:1px solid ${C.border}">
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 14px;font-weight:600">${greeting}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 10px;line-height:1.75">${openingParagraph}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">${contextLine}</p>
                </td>
              </tr>

              <!-- Spacer -->
              <tr><td style="padding-bottom:24px"></td></tr>

              <!-- Theme stripe -->
              ${themeStripe}

              <!-- Windows (or all-caught-up hero) -->
              ${allCaughtUp ? allCaughtUpSection : windowsLayout}
              ${completedSection}

              <!-- Coming next month -->
              ${comingNextHtml}

              <!-- Overdue in_progress windows -->
              ${overdueSectionHtml}

              <!-- Dashboard CTA -->
              ${dashboardCTA}

              <!-- Calendar note -->
              <tr>
                <td style="padding-bottom:32px">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${C.terra};background:${C.terraTint};border-radius:0 10px 10px 0">
                    <tr>
                      <td style="padding:14px 18px">
                        <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textMid};margin:0;line-height:1.7">
                          📅 <strong style="color:${C.text}">Calendar invite included.</strong>
                          Accept it and you'll get a 7-day reminder before ${his} windows close. Works with Google Calendar, Apple Calendar, and Outlook.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- "On the day" birth tips — expecting parents only -->
              ${isExpecting ? `
              <tr>
                <td style="padding-bottom:32px">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px">
                    <tr>
                      <td style="padding:20px 22px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16A34A;margin:0 0 4px">On the day</p>
                        <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0 0 16px;line-height:1.6">Four things worth deciding before you go in. You won't want to Google them in the delivery room.</p>

                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding-bottom:14px">
                              <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Skin-to-skin — ask for it immediately</p>
                              <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0;line-height:1.6">Even for C-sections. Regulates ${childName}'s temperature, heart rate, and blood sugar. Promotes breastfeeding and bonding. Tell your OB or midwife before you go in so it's already the plan.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:14px">
                              <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Delayed cord clamping</p>
                              <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0;line-height:1.6">Most hospitals do this now — wait at least 60 seconds before clamping. Transfers roughly 80ml of extra blood and iron to your baby. Ask explicitly even if it's standard practice at your hospital.</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom:14px">
                              <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">The golden hour</p>
                              <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0;line-height:1.6">The first hour uninterrupted with your baby. Weighing, measuring, and vitamin K can usually wait. Ask the room to hold non-urgent procedures until after you've had that first hour together.</p>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Rooming-in</p>
                              <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0;line-height:1.6">Keep ${childName} in the room with you rather than the nursery. Better for feeding cues, bonding, and breastfeeding. Hospitals often default to the nursery — you have to ask to keep ${him} close.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ` : ''}

              <!-- Next digest teaser / birth CTA (expecting) -->
              <tr>
                <td style="padding-bottom:32px">
                  ${isExpecting ? `
                  <!-- What happens after birth — tease + CTA -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.indigoDeep};border-radius:12px;overflow:hidden">
                    <tr>
                      <td style="padding:24px 28px">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#fff;margin:0 0 10px;line-height:1.3">When ${childName} is born, we have ${postBirthWindowCount} developmental windows to work through together. Get ready.</p>
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 20px;line-height:1.7">
                          Confirm the birth in Scout and we'll send your first full digest straight away — everything worth your attention in month one, organised and ready to go.
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#fff;border-radius:8px">
                              <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:${C.indigo};text-decoration:none;display:block;padding:12px 24px">
                                Confirm birth in Scout →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  ` : `
                  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0;line-height:1.65">
                    Next digest arrives on <strong style="color:${C.textMid}">${nextMonthName}</strong> — when ${childName} turns ${ageMonths + 1} month${ageMonths + 1 === 1 ? '' : 's'}.
                  </p>
                  `}
                </td>
              </tr>

              <!-- Signature / Jack closing -->
              <tr>
                <td style="padding-top:8px;padding-bottom:8px">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.indigoDeep};border-radius:14px">
                    <tr>
                      <td style="padding:24px 26px">
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 16px;line-height:1.7">${jackClosing}</p>
                        <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.5);margin:0">Jack Hartley · Dad of two · Founder, FamilyForce</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
            <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 8px;line-height:1.6">
              FamilyForce · <a href="${siteUrl}" style="color:${C.textDim};text-decoration:none">getfamilyforce.com</a>
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0 0 6px;line-height:1.6">
              FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong
            </p>
            <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 6px;line-height:1.6">
              ${opts.recipientType === 'family_member'
                ? `You're receiving this because you were added to ${childName}'s family circle.`
                : `You're receiving this because you're a Scout member.`}
              ${opts.recipientType === 'family_member'
                ? `&nbsp;<a href="${opts.unsubscribeUrl}" style="color:${C.terra};text-decoration:none">Unsubscribe</a>`
                : `&nbsp;<a href="${siteUrl}/scout-dashboard/settings" style="color:${C.terra};text-decoration:none">Manage preferences</a>
                   &nbsp;·&nbsp;
                   <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a>`}
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0;line-height:1.6;opacity:0.8">
              For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}

// ─── Subject line ─────────────────────────────────────────────────────────────
export function buildDigestSubject(
  childName:  string,
  ageMonths:  number,
  aboveFold:  DigestWindow[],
  ageWeeks:   number,
  digestType: 'signup' | 'birth_signup' | 'monthly' | 'conversion' | 'additional_child' = 'monthly'
): string {
  const closing = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)

  if (digestType === 'birth_signup') {
    return `${childName} is here — and so is your first Scout digest 🎉`
  }

  if (digestType === 'conversion') {
    return `You're subscribed — ${childName}'s full digest is here 🎉`
  }

  if (digestType === 'additional_child') {
    return `${childName}'s Scout tracking has started 🎉`
  }

  if (digestType === 'signup') {
    return `${childName}'s first Scout digest is here 🎉`
  }

  if (closing.length > 0) {
    const w        = closing[0]
    const daysLeft = Math.round((w.close_age_weeks - ageWeeks) * 7)
    // Express as days when < 14 days, weeks otherwise
    let timeLeft: string
    if (daysLeft <= 0) {
      timeLeft = 'closing now'
    } else if (daysLeft < 14) {
      timeLeft = daysLeft === 1 ? '1 day left' : `${daysLeft} days left`
    } else {
      const weeksLeft = Math.round(daysLeft / 7)
      timeLeft = weeksLeft === 1 ? '1 week left' : `${weeksLeft} weeks left`
    }
    return `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} — ${timeLeft} on ${w.title.toLowerCase()}`
  }

  if (aboveFold.length === 0) {
    return `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} — you've done it all this month 🏆`
  }

  return `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} — ${aboveFold.length} things to know this month`
}

// ─── Pre-birth email ──────────────────────────────────────────────────────────
export interface PreBirthEmailOptions {
  childName:      string
  dueDate:        Date
  daysLeft:       number      // negative = overdue
  windows:        DigestWindow[]
  dashboardUrl:   string
  siteUrl:        string
  userId:         string
  unsubscribeUrl?: string     // one-click unsubscribe
}

// Evergreen fallback cards shown when no prenatal windows match gestational age
const PREBIRTH_FALLBACK_CARDS = [
  {
    title:      'Choose your pediatrician',
    excerpt:    'Many pediatric practices require you to register before delivery. Your baby will have their first visit within 2–5 days of birth — you need a doctor lined up before that.',
    actionLine: 'Research practices near you now, schedule a meet-the-doctor visit, and confirm they accept your insurance. Don\'t wait until after birth.',
  },
  {
    title:      'Pack your hospital bag',
    excerpt:    'Packing after labor begins is stressful. Having a bag ready by week 36 means one less thing to think about when the real countdown starts.',
    actionLine: 'Include: insurance card, ID, birth plan (if any), phone charger, going-home outfit for baby (0–3 months), and a few days of comfortable clothing for yourself.',
  },
  {
    title:      'Set up the sleep space',
    excerpt:    'A safe sleep environment reduces the risk of SIDS and accidental suffocation. The AAP recommends a firm, flat surface with no soft bedding, bumpers, or positioners — nothing else in the crib.',
    actionLine: 'Set up the bassinet or crib before birth with a firm mattress and fitted sheet only. Practice snapping it together at 2pm, not 2am.',
  },
]

export function buildPreBirthEmail(opts: PreBirthEmailOptions): string {
  const { childName, dueDate, daysLeft, windows, dashboardUrl, siteUrl, userId, unsubscribeUrl } = opts

  const dueDateStr  = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
  const isOverdue   = daysLeft <= 0
  const showWindows = !isOverdue

  const headline = isOverdue
    ? `Is ${childName} here?`
    : daysLeft === 1
      ? `${childName} arrives tomorrow.`
      : `${childName} arrives in ${daysLeft} days.`

  const subhead = isOverdue
    ? `Your due date (${dueDateStr}) has passed. When your baby arrives, confirm their birth in Scout to start full milestone tracking.`
    : `Your due date is ${dueDateStr}. Here's what to have ready before they arrive.`

  // Preheader text (hidden, shown as email preview)
  const preheaderText = isOverdue
    ? `Your due date has passed. Confirm ${childName}'s arrival to start full Scout tracking.`
    : daysLeft === 1
      ? `${childName} arrives tomorrow. Three things to have ready.`
      : `${childName} arrives in ${daysLeft} days. Here's your prep checklist.`

  // Use DB windows if available, otherwise evergreen fallback
  const cardsToRender = windows.length > 0
    ? windows.map(w => ({
        title:      w.title,
        excerpt:    (w.why_it_matters || '').replace(/([.!?])\s+/g, '$1|||').split('|||').slice(0, 2).join(' ').trim(),
        actionLine: (w.what_to_do || '').split('\n')[0].replace(/^[-•·]\s*/, '').trim(),
      }))
    : PREBIRTH_FALLBACK_CARDS

  const windowCards = cardsToRender.map(card => `
  <tr>
    <td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:20px 22px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:8px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3">${card.title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${card.excerpt}</p>
                </td>
              </tr>
              ${card.actionLine ? `
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
                    <tr>
                      <td style="padding:12px 16px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${card.actionLine}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`).join('')

  const unsubLine = unsubscribeUrl
    ? `<a href="${unsubscribeUrl}" style="color:${C.textDim}">Unsubscribe</a>`
    : `<a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.textDim}">Unsubscribe</a>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${headline}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased">

<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:${C.bg};line-height:1px">${preheaderText}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
  <tr>
    <td align="center" style="padding:32px 16px 48px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:28px">
            <a href="${siteUrl}" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none">
              <span style="font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:${C.text}">Family<span style="color:${C.terra}">Force</span></span>
            </a>
          </td>
        </tr>

        <!-- Header card -->
        <tr>
          <td style="padding-bottom:24px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.indigoDeep};border-radius:20px">
              <tr>
                <td style="padding:36px 32px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#fff;margin:0 0 12px;line-height:1.2;font-style:italic">${headline}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.7);margin:0;line-height:1.7">${subhead}</p>
                  ${isOverdue ? `
                  <table cellpadding="0" cellspacing="0" style="margin-top:24px">
                    <tr>
                      <td style="background:${C.terra};border-radius:100px;padding:12px 24px">
                        <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;text-decoration:none">Confirm arrival in Scout →</a>
                      </td>
                    </tr>
                  </table>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${showWindows ? `
        <!-- Section label -->
        <tr>
          <td style="padding-bottom:16px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.terra};margin:0">Before ${childName} arrives</p>
          </td>
        </tr>

        <!-- Window / fallback cards -->
        ${windowCards}

        <!-- Dashboard CTA -->
        <tr>
          <td align="center" style="padding-top:8px;padding-bottom:32px">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:${C.terra};border-radius:100px;padding:14px 32px">
                  <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none">Open your Scout dashboard →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : `
        <!-- Overdue encouragement -->
        <tr>
          <td style="padding-bottom:32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:14px">
              <tr>
                <td style="padding:24px 28px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.7">Once you confirm ${childName}'s arrival, Scout will send your first milestone digest — timed to their exact birth date, with everything that matters in the first weeks and months ahead.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`}

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid ${C.border};padding-top:24px">
            <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 6px;line-height:1.6;text-align:center">
              Scout by FamilyForce · <a href="${siteUrl}" style="color:${C.textDim}">getfamilyforce.com</a>
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0 0 6px;line-height:1.6;text-align:center">
              FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0 0 6px;line-height:1.6;text-align:center">
              You're receiving this because you're a Scout member.
              &nbsp;·&nbsp;${unsubLine}
            </p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0;line-height:1.6;text-align:center;opacity:0.8">
              For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
