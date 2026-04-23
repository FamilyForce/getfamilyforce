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
  jack_bridge?:      string | null   // italic one-liner below title, above why_it_matters
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
export function renderBullets(text: string): string {
  if (!text) return ''
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const items = lines.map(line => {
    // Subheader: line is pure bold (**text**) — render as section subhead, not a bullet.
    // Must check BEFORE stripping the leading * marker, otherwise **bold** → *bold** after strip.
    const subheaderMatch = line.match(/^\*?\*\*([^*]+)\*\*:?\s*$/)
    if (subheaderMatch) {
      return `<p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:${C.text};margin:10px 0 4px;line-height:1.5">${subheaderMatch[1].replace(/:$/, '')}:</p>`
    }
    // Strip leading bullet markers: *, -, •, 1., 2., etc.
    const clean = line.replace(/^(\*\*?|-|•|\d+\.)\s*/, '').trim()
    if (!clean) return ''
    // Bold any inline **text** spans remaining in the line
    const bolded = clean.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.text}">$1</strong>`)
    // Inline › with non-breaking spaces — works reliably in all email clients
    return `<p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 13px;line-height:1.65"><span style="color:${C.terra}">›&nbsp;&nbsp;</span>${bolded}</p>`
  }).filter(Boolean)
  return items.join('')
}

// ─── Window selection — exported so scout-signup-delivery can import ─────────
export function selectAboveFold(windows: DigestWindow[], ageWeeks: number): DigestWindow[] {
  const urgencyWeight: Record<string, number> = { clinical: 0, screening: 1, advisory: 2 }
  return [...windows].sort((a, b) => {
    const aClosing = a.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    const bClosing = b.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    if (aClosing !== bClosing) return aClosing - bClosing
    if (a.priority !== b.priority) return a.priority - b.priority
    return (urgencyWeight[a.urgency] ?? 2) - (urgencyWeight[b.urgency] ?? 2)
  }).slice(0, 5)
}

// ─── Window card (v4 — matches approved mockup) ───────────────────────────────
function windowCard(w: DigestWindow, ageMonths: number, dashboardUrl: string, isClosing: boolean, childGender: string | null): string {
  // Win-flag: plain colored text, no pill badge (matches mockup)
  const flagColor = isClosing ? '#c0392b' : C.terra
  const flagText  = isClosing ? '⏱ Closing this month' : '⏳ Open window'

  // Apply pronoun swap to all DB text fields so boy/neutral babies get correct copy
  const whyText   = applyPronouns(w.why_it_matters || '', childGender)
  const bridge    = w.jack_bridge ? applyPronouns(w.jack_bridge, childGender) : null
  const whatToDo  = w.what_to_do  ? applyPronouns(w.what_to_do,  childGender) : null

  return `
  <tr>
    <td style="padding-bottom:10px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid #ece8f0;border-radius:14px;overflow:hidden">
        <!-- Window inner: flag + title + why -->
        <tr>
          <td style="padding:18px 20px 12px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Win-flag (plain text, matches mockup) -->
              <tr>
                <td style="padding-bottom:6px">
                  <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:${flagColor};text-transform:uppercase;letter-spacing:.1em;margin:0">${flagText}</p>
                </td>
              </tr>
              <!-- Title (Arial bold 16px, matches mockup) -->
              <tr>
                <td style="padding-bottom:7px">
                  <p style="font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#1a0f3e;margin:0;line-height:1.3">${w.title}</p>
                </td>
              </tr>
              <!-- Jack bridge (italic gray, between title and why — matches mockup) -->
              ${bridge ? `
              <tr>
                <td style="padding-bottom:9px">
                  <p style="font-family:Arial,sans-serif;font-size:13px;color:#888;font-style:italic;margin:0;line-height:1.5">${bridge}</p>
                </td>
              </tr>` : ''}
              <!-- Why it matters (full text, no truncation) -->
              <tr>
                <td>
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0;line-height:1.65">${whyText}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- The move: separate section with deeper purple background + left border for Gmail contrast -->
        ${whatToDo ? `
        <tr>
          <td style="background:#ede8ff;border-top:1px solid #d4c8f0;border-left:3px solid ${C.terra};padding:14px 20px 16px">
            <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">The move</p>
            ${renderBullets(whatToDo)}
          </td>
        </tr>` : ''}
      </table>
    </td>
  </tr>`
}

// ─── DYK card ─────────────────────────────────────────────────────────────────
function dykCard(fact: string): string {
  // Convert **bold** to <strong>
  const html = fact.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:#1a3d32">$1</strong>`)
  // Green gradient styling — matches approved mockup
  return `
  <tr>
    <td style="padding-bottom:14px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#e8f4f0 0%,#d4eee6 100%);border-radius:14px;border:1px solid #b8ddd3">
        <tr>
          <td style="padding:20px 22px">
            <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#1a7a5e;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">💡 Did you know</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#1a3d32;margin:0;line-height:1.65">${html}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Per-month editorial content ──────────────────────────────────────────────
interface MonthContent {
  theme:   string   // emoji + theme sentence shown above priority window
  dyk:     string   // "Did you know?" fact (markdown **bold** supported)
  opening: string   // opening paragraph (uses childName, pronoun vars at runtime)
  context: string   // context/subtitle line
  closing: string   // Jack's closing sentence
  subject?: string  // optional subject line override — use {{childName}} placeholder
}

// Month 0 = born newborn (first ~4 weeks of life)
// Note: expecting parents use buildPreBirthEmail(), not buildDigestEmail(),
// so MONTH_CONTENT[0] is exclusively for born children at age 0 months.
const MONTH_CONTENT: Record<number, MonthContent> = {
  0:  { theme: '🏥 This month: the 3–5 day visit, checking for jaundice, and skin-to-skin bonding.', dyk: 'In the first hour after birth, babies enter what researchers call the **quiet alert state** — the most receptive bonding window of their lives. Skin-to-skin in that first hour regulates heart rate, temperature, and blood sugar, and activates the neural pathways behind secure attachment. It doesn\'t have to happen in the delivery room — it counts whenever it starts.', opening: 'The first few days move fast. These three things are worth getting right.', context: 'Week one to two. Small windows, big impact — especially the 3–5 day checkup.', closing: 'The first days are intense. You\'re doing better than you think. Month 1 digest arrives on the four-week birthday. — Jack, Founder @ FamilyForce' },
  1:  { theme: '👶 This month: the 1-month checkup, tummy time, and something worth screening for.', dyk: 'In the first month of life, a baby\'s brain creates more than **1 million new neural connections per second** — a rate that will never be matched again. Every time you hold your baby, respond to her cries, and engage with your baby, you\'re building the architecture of her brain.', opening: 'The steepest learning curve of any parent\'s life happens in the next 30 days.', context: 'Survival mode is real. These three things are worth doing anyway.', closing: 'Month 1 is hard. You\'re doing it. Month 2 gets better. — Jack, Founder @ FamilyForce' },
  2:  { theme: '😊 This month: the 2-month checkup, the first real smile, and the habit that builds everything.', dyk: 'The social smile — the first **intentional smile in response to your face** — activates the same brain regions as adult social bonding. It\'s not reflex. It\'s the beginning of a relationship.', opening: 'Something is shifting — she\'s starting to respond to you. The one-sided relationship is ending.', context: 'The fog is lifting. And she\'s starting to know your face.', closing: 'The social smile changes things. You\'ll feel it when it happens. — Jack, Founder @ FamilyForce' },
  3:  { theme: '🧠 This month: one milestone closing, a new one emerging, and the bedtime habit to lock in now.', dyk: 'A consistent 3–4 step bedtime routine can produce **measurable sleep improvements within one week** — even in babies as young as 3 months. Same steps, same order, every night.', opening: 'Three months in, and the fourth trimester is over. The development is about to accelerate.', context: 'You made it through the fourth trimester. The development is accelerating.', closing: 'Month 3 is when it starts feeling real. You\'re watching your baby become someone. — Jack, Founder @ FamilyForce' },
  4:  { theme: '😴 This month: nobody warns you about the 4-month sleep regression. We\'re warning you.', dyk: 'The 4-month sleep regression isn\'t random — it\'s caused by the brain **permanently reorganising its sleep architecture** from newborn cycles to adult cycles. It doesn\'t go back. But it does get better.', opening: 'The 4-month sleep regression may have arrived — or it\'s coming. Here\'s what it is and what to do.', context: 'The hardest sleep phase of the first year. Understanding it helps.', closing: 'The regression passes. Your response to it shapes the next 6 months of sleep. — Jack, Founder @ FamilyForce' },
  5:  { theme: '🥄 This month: solids are almost here, iron matters now, and attachment is building.',  dyk: '**Iron deficiency is the most common nutritional deficiency in infants worldwide** — and breastfed babies are most at risk after 4 months. Iron drops are a simple fix while solid foods are being introduced.', opening: 'Solids are right around the corner — and there\'s a nutrition window closing this month that most parents miss.', context: 'The solids window is opening. The iron window is closing.', closing: 'The attachment you\'ve been building all along — it\'s real. It shows up at 12 months, and again at 3 years. — Jack, Founder @ FamilyForce' },
  6:  { theme: '🥄 This month: the 6-month checkup, first solids, and a motor milestone worth celebrating.', dyk: 'When babies sit **independently**, it frees both hands for exploration — and exploration is how the brain builds. Independent sitting isn\'t just a motor milestone. It\'s what unlocks the next 6 months of cognitive development.', opening: 'Solids are starting, the 6-month checkup is due, and she\'s sitting up on her own. A lot is happening at once.', context: 'Six months. Solids, sitting, and a whole new level of curiosity.', closing: 'Halfway through the first year. You\'ve done more right than you know. — Jack, Founder @ FamilyForce' },
  7:  { theme: '🔒 This month: babyproof before she moves, name response, and open the dairy window.', dyk: 'Babies who hear their **own name used consistently and positively** develop name response faster and show stronger early social attention. Use her name — not just nicknames — especially when you want her focus.', opening: 'Mobility is coming. The world just got more interesting — and more dangerous.', context: 'Seven months: the world is getting much more interesting. And so are the hazards.', closing: 'Seven months is when parents start babyproofing in earnest. This month, not next month. — Jack, Founder @ FamilyForce' },
  8:  { theme: '🥚 This month: allergen introductions, babbling, and tree nuts.', dyk: 'Babies who are exposed to **varied sounds and babble-back interactions** at 8–10 months have measurably larger productive vocabularies at 18 months. The babbling stage is when the foundation is literally being laid — neuron by neuron.', opening: 'Object permanence is locking in, allergen introductions are the priority, and babbling is starting to carry meaning.', context: 'Eight months: the allergen introduction window is open. Don\'t miss it.', closing: 'Eight months is when it all starts accelerating. Stay with it. — Jack, Founder @ FamilyForce' },
  9:  { theme: '🩺 This month: the first formal developmental screen, the peanut window, and sesame.', dyk: 'The **LEAP study** showed early peanut introduction (4–11 months) reduces peanut allergy risk by up to 80% in high-risk infants. This is one of the most significant findings in pediatric nutrition in decades.', opening: 'The 9-month visit is the first to use a standardised developmental screening tool — it\'s more than a checkup.', context: 'Nine months: the first formal developmental screen. Come prepared.', closing: 'Nine months is one of my favourites. She\'s communicating deliberately, moving on her own, becoming someone with opinions. — Jack, Founder @ FamilyForce' },
  10: { theme: '🧗 This month: pulling up to stand, object permanence locking in, and the safety checklist that changes when they\'re upright.', dyk: 'Peek-a-boo teaches three things simultaneously: **object permanence** (you disappear and still exist), **trust** (you always come back), and **conversational turn-taking**. It\'s one of the most cognitively rich games in early childhood — and it costs nothing.', opening: 'She\'s pulling up to stand. The whole world just got bigger — and more dangerous.', context: 'Ten months: upright and opinionated. The walking window is getting closer.', closing: 'Ten months goes fast. She\'s a communicator now — not with words yet, but with everything else. — Jack, Founder @ FamilyForce' },
  11: { theme: '🚶 This month: cruising along furniture, first words getting specific, and the first dental visit.', dyk: 'Babies say \'mama\' and \'dada\' as sounds around 9 months — but using them **specifically** (mama when looking at mum, dada when looking at dad) typically locks in by 12 months. That specificity is the milestone, not the sound.', opening: 'She\'s cruising the furniture — the last step before walking. One month to the first birthday.', context: 'Eleven months: the walk is coming. You can see it in her eyes every time she lets go.', closing: 'One month to the first birthday. It goes fast — and then it really goes fast. — Jack, Founder @ FamilyForce' },
  12: { theme: '🎂 This month: the 12-month visit, reading aloud every day, and the switch to whole milk.', dyk: 'Children read to every day from birth enter kindergarten with **a vocabulary equivalent to 1,000 additional hours of classroom instruction.** Any book. Every day. That\'s the whole prescription.', opening: 'One year. The most remarkable developmental year of any human life — and you were there for all of it.', context: 'The first year is done. One of the most remarkable developmental years of any human life.', closing: 'Happy first birthday. Year two is different. Faster in some ways, slower in others. We\'ll keep you on track. — Jack, Founder @ FamilyForce' },
  13: { theme: '👣 This month: first steps, first words, and leaving the bottle behind.', dyk: 'Baby sign language doesn\'t delay speech — it **accelerates** it. Babies who learn signs like \'more,\' \'all done,\' and \'milk\' reduce frustration and build word-concept connections faster. The sign and the word fire in the brain together.', opening: 'Walking is happening or on the way. Words are starting to land. The toddler years are beginning.', context: 'Thirteen months: a walker, a talker, and an opinion-holder — all at once.', closing: 'The second year is a completely different experience. The pace of change slows — and then the language starts to explode. — Jack, Founder @ FamilyForce' },
  14: { theme: '👉 This month: pointing and shared attention, walking as locomotion, and body parts.', dyk: 'Pointing to share interest — then looking back to check your reaction — is more important than first words as an early communication milestone. It\'s called **declarative pointing** and it\'s a key marker on the M-CHAT autism screen.', opening: 'She\'s pointing — and looking back at you after she points. That single behaviour matters more than almost any other milestone right now.', context: 'Fourteen months: a walker who points. That\'s a communicator in the making.', closing: 'When she points and looks back at you — respond every time. That\'s the lesson she\'s practising. — Jack, Founder @ FamilyForce' },
  15: { theme: '🩺 This month: the 15-month checkup, the 10-word milestone, and pretend play beginning.', dyk: 'Once a child hits **50 words**, vocabulary growth often becomes exponential — jumping from 50 to 200+ words in just a few months. The slow build from 1 to 50 words is doing the work. Every word added now accelerates what comes next.', opening: 'The 15-month visit is the first to formally check word count and walking quality — come prepared.', context: 'Fifteen months: the first real language checkpoint. Start counting words.', closing: 'The 15-month visit is worth taking seriously. Come with your word count, your walking update, and your questions. — Jack, Founder @ FamilyForce' },
  16: { theme: '😤 This month: naming big feelings, following simple instructions, and stairs.', dyk: 'Children whose parents **label their emotions** during early childhood show measurably better emotional regulation, fewer behavioural problems, and stronger peer relationships at school age. The investment is invisible in the moment and pays off for years.', opening: 'The big feelings are arriving — frustration, excitement, fury, joy. How you respond now shapes the next two years.', context: 'Sixteen months: enormous emotions, a tiny prefrontal cortex. That mismatch is the whole toddler experience.', closing: 'Labelling feelings feels awkward at first. It gets natural fast. The payoff is a child who can eventually name their own emotions. — Jack, Founder @ FamilyForce' },
  17: { theme: '🧸 This month: parallel play, the spoon, and why goodbye has to be out loud.', dyk: 'Children allowed to **self-feed with a spoon from 12–15 months** develop fine motor skills faster and have a stronger relationship with varied textures by age 2. The mess is the lesson. A splat mat costs £15.', opening: 'Separation anxiety may be peaking. It\'s hard to watch. It\'s also a healthy sign.', context: 'Seventeen months: she wants you near. That\'s not clingy — that\'s securely attached.', closing: 'Seventeen months is peak separation anxiety for many kids. Stay consistent. Stay warm. Keep the goodbye brief. — Jack, Founder @ FamilyForce' },
  18: { subject: '{{childName}} at 18 months — the most important developmental checkup of the toddler years', theme: '🩺 This month: the M-CHAT screen, two-word language, and tantrums at their peak.', dyk: 'Two-word combinations — \'more milk,\' \'daddy go,\' \'big dog\' — represent a **qualitative leap** in language, not just more words. The child is now constructing meaning, not just labelling. Once two-word phrases start, three-word sentences usually follow within months.', opening: 'The 18-month visit is the most important developmental checkpoint of the toddler years — it includes the first formal autism screening.', context: 'Eighteen months: the first autism screen, the first two-word combinations, and probably the first spectacular tantrum.', closing: 'The 18-month visit is one of the most important ones. Come prepared. Answer the M-CHAT honestly. — Jack, Founder @ FamilyForce' },
  19: { theme: '🙌 This month: the independence phase, the 50-word gate, and building the self-regulation foundation.', dyk: 'At around **50 words**, vocabulary growth often goes exponential — some children add 5–10 new words per day. The slow, patient work from 1 word to 50 words is what makes that explosion possible. Every word you name is a seed.', opening: 'The fierce independence has arrived. \'Me do it\' everywhere, about everything. This is not defiance — this is healthy.', context: 'Nineteen months: the will to do it herself is the whole point. Support it.', closing: '\'Me do it\' is the sound of a child becoming someone. Let her. — Jack, Founder @ FamilyForce' },
  20: { theme: '❓ This month: the why-question explosion, sorting by shape and color, and naming the body.', dyk: 'Research by Chouinard (2007) found that children in the question-asking phase ask up to **100 questions per hour** — and that the quality of the answers they receive significantly predicts scientific reasoning ability at age 10.', opening: 'The questions are starting. \'What\'s that?\' over and over, about everything. Answer every single one.', context: 'Twenty months: questions are the learning mechanism. The repetition is the point.', closing: 'Answer the questions. All of them. Every answered question is a word, a concept, a connection. — Jack, Founder @ FamilyForce' },
  21: { theme: '🗣️ This month: speech clarity milestone, empathy beginning, and knowing what things are for.', dyk: 'Toddlers who see adults **modelling empathic behaviour** — comforting others, asking \'are you okay?\', naming concern — develop empathy faster and show stronger prosocial behaviour at ages 4 and 5. She\'s watching everything you do.', opening: 'Speech is getting clearer — and something new is happening: she\'s starting to notice when other people feel something.', context: 'Twenty-one months: words getting clearer, and a little person who notices when you\'re sad.', closing: 'When she notices you\'re sad — that\'s not nothing. That\'s the beginning of everything that makes us human. — Jack, Founder @ FamilyForce' },
  22: { theme: '📚 This month: the 200-word target, 2-step commands, and the pronoun shift.', dyk: 'Following a **2-step command** requires holding two pieces of information in working memory and executing them in order. It\'s not just language — it\'s executive function. The same mental process underlies planning, problem-solving, and academic learning.', opening: 'Two months from the second birthday — and the 24-month language targets are in sight.', context: 'Twenty-two months: two months to the 24-month checkup. Language is the main event.', closing: 'Two months to the second birthday. Keep reading, keep narrating, keep expanding. — Jack, Founder @ FamilyForce' },
  23: { theme: '🦘 This month: jumping with both feet, pretend play getting complex, and first size concepts.', dyk: 'Complex pretend play — multi-step scenarios with characters and scripts — uses the same cognitive machinery as **narrative comprehension and writing** later in school. Children who engage in rich pretend play at 2–3 years show stronger literacy skills at age 5.', opening: 'One month from the second birthday. The motor, language, and cognitive development happening right now is accelerating fast.', context: 'Twenty-three months: the last month before the second birthday checkup.', closing: 'One month to the second birthday. The progress has been remarkable — and the pace doesn\'t slow down. — Jack, Founder @ FamilyForce' },
  24: { subject: '{{childName}} at 24 months — the second birthday checkup covers a lot. Here\'s how to prepare.', theme: '🩺 This month: the 24-month checkup + second autism screen, the milk switch, and same vs. different.', dyk: 'The AAP recommends switching to **2% milk at age 2** because after the second birthday, children no longer need the high fat content of whole milk for brain development. The brain\'s fat-intensive growth phase is winding down.', opening: 'The 24-month checkup includes the second formal autism screening. Here\'s how to come prepared.', context: 'Two years. One of the most comprehensive developmental checkpoints of the first two years.', closing: 'Happy second birthday. Two years of showing up, learning on the job. Year three is different again. — Jack, Founder @ FamilyForce' },
  25: { theme: '🗣️ This month: 3-word sentences, memory taking shape, and cooperative play beginning.', dyk: 'Asking **\'what happened?\'** after an outing does more for language development than almost any other single prompt. It exercises memory, narrative structure, vocabulary, and sentence construction simultaneously.', opening: 'Three-word sentences are arriving — and with them, the beginning of real grammar.', context: 'Twenty-five months: telegraphic speech is giving way to early grammar. Each sentence is a step forward.', closing: 'Three-word sentences are the beginning of the language explosion. The more you respond, the faster it comes. — Jack, Founder @ FamilyForce' },
  26: { theme: '❓ This month: the why-question phase, colors she can name, and counting in sequence.', dyk: 'Color naming is one of the **trickier early language concepts** — colors are not things, they\'re properties of things. \'Red\' describes the cup, the apple, and the fire engine — but \'red\' is none of those things. That abstraction is why color vocabulary arrives later than object vocabulary.', opening: 'The \'why\' questions are arriving — or they\'re coming. Up to 300 a day. Answer them seriously.', context: 'Twenty-six months: the world is suddenly explicable. She wants to know everything about why.', closing: 'Answer the \'why\' questions. Every single one. That\'s the whole job this month. — Jack, Founder @ FamilyForce' },
  27: { theme: '⚾ This month: catching a ball, potty readiness still in the picture, and speech clarity for strangers.', dyk: 'Starting potty training **before a child shows readiness signs** leads to a longer, more frustrating process with more accidents and more resistance. Waiting for the signs — rather than starting at a fixed age — is the single most reliable predictor of a faster, lower-conflict experience.', opening: 'The gross motor development happening right now — throwing, catching, kicking — is building the neural coordination for balance and sport.', context: 'Twenty-seven months: motor coordination is accelerating. The best investment is unstructured outdoor play.', closing: 'Catching a ball is harder than it looks. Let her miss it a hundred times. That\'s the training. — Jack, Founder @ FamilyForce' },
  28: { theme: '😄 This month: first jokes, understanding time, and a specific friend she wants to see.', dyk: 'A **visual daily schedule** — pictures of the sequence of events, not words — reduces toddler anxiety and improves co-operation dramatically. When she knows what comes next, transitions stop being surprise ambushes and become predictable events.', opening: 'She said something wrong on purpose, waited, and then laughed. That\'s not silliness — that\'s the first evidence of social intelligence applied to humour.', context: 'Twenty-eight months: she\'s figured out that she can surprise you. That\'s a cognitive leap.', closing: 'When she tells a joke, laugh. Every single time. You\'re reinforcing the social intelligence that will carry her through life. — Jack, Founder @ FamilyForce' },
  29: { theme: '🔢 This month: counting objects with real meaning, preschool readiness on the horizon, and balance building.', dyk: 'True counting — where each object gets exactly one number — is called **one-to-one correspondence** and is fundamentally different from reciting number sequences. It\'s one of the earliest building blocks of mathematical reasoning.', opening: 'She can recite numbers — but can she count? The difference matters more than most parents realise.', context: 'Twenty-nine months: counting with meaning is different from counting from memory. Watch for the difference.', closing: 'The \'give me 3 crackers\' game is the best math lesson available. No materials required. — Jack, Founder @ FamilyForce' },
  30: { theme: '🩺 This month: the 30-month checkup, the crib-to-bed transition, and the potty finish line.', dyk: 'Moving from crib to bed **too early** is one of the most common causes of sleep regression in the second and third years. The crib is a boundary. Keeping it until age 3 — unless she\'s climbing out — makes bedtime more predictable for everyone.', opening: 'Two and a half. The 30-month visit was added to the AAP schedule specifically because the gap to 36 months is too long.', context: 'Thirty months: the halfway point between the 2-year and 3-year checkups — and one of the most useful.', closing: 'Two and a half. The language has come so far. Come prepared to the 30-month visit. — Jack, Founder @ FamilyForce' },
  31: { theme: '👗 This month: real peer friendships, understanding what numbers mean, and getting dressed solo.', dyk: 'Children who understand **cardinality** — that \'3\' means exactly 3 things — at age 3 show consistently stronger mathematics outcomes in primary school. The \'give me 2 crackers\' game is one of the most powerful math activities available, anywhere, anytime.', opening: 'Friendships are becoming specific, real, and important. The self-help skills are expanding too.', context: 'Thirty-one months: independence is expanding on every front — social, cognitive, and physical.', closing: 'The friendships she\'s making now are the first ones she\'ll remember. Take them seriously. — Jack, Founder @ FamilyForce' },
  32: { theme: '🦷 This month: name and age, hopping on one foot, and the tooth brushing handoff.', dyk: 'Hopping on one foot is a precursor to **skipping** — which is itself a precursor to the lateral co-ordination needed for sports, dance, and smooth stair negotiation. The physical milestones build on each other in a sequence that spans years.', opening: 'Knowing and stating their full name and age is both a developmental milestone and a practical safety skill.', context: 'Thirty-two months: self-concept, physical confidence, and daily health habits.', closing: 'Teach her her full name and your name this month. It takes one week of practice. It could matter a lot. — Jack, Founder @ FamilyForce' },
  33: { theme: '🌟 This month: imaginary friends, storytelling, and following complex instructions.', dyk: 'Children who regularly **tell stories** about their own experiences show stronger reading comprehension and writing ability at age 6 and 7. Storytelling builds the narrative scaffolding that books are built on. The dinner table is the classroom.', opening: 'She may have an imaginary friend — or be on the verge of inventing one. Research shows this is a very good sign.', context: 'Thirty-three months: imagination is at full power. Harness it.', closing: 'The imaginary friend is practising social skills. Let her. — Jack, Founder @ FamilyForce' },
  34: { theme: '🚲 This month: first wheels, gratitude at the table, and the fine motor milestone building toward writing.', dyk: 'Families with regular **gratitude practices at mealtimes** — even one sentence each — show measurably higher wellbeing, more prosocial behaviour, and stronger relationship quality in children by age 10. The mechanism is habit formation through repetition. It takes about 3 weeks to feel natural.', opening: 'Two months from the 3-year checkup. The balance and co-ordination developing this month are the foundation for sport, dance, and physical confidence.', context: 'Thirty-four months: wheels, character, and the last stretch before the 3-year checkup.', closing: 'The tricycle or balance bike is one of the best investments you can make at this age. Get outside. — Jack, Founder @ FamilyForce' },
  35: { theme: '🚗 This month: car seat safety update, counting with real meaning, and the forward-facing milestone.', dyk: 'The **\'give me 3\'** game — asking a child to hand you exactly 3 objects — is one of the most reliable ways to test whether she understands what 3 means, versus just being able to recite \'1, 2, 3.\' Both matter, but understanding cardinality is the deeper skill.', opening: 'One month from the 3-year checkup — and the milestone set is nearly complete. Here\'s what to focus on in this final stretch.', context: 'Thirty-five months: the 3-year checkup is one month away. Come prepared.', closing: 'One month to the third birthday — and the 3-year checkup. Come with your observations, your concerns, and your word count. — Jack, Founder @ FamilyForce' },
  36: { theme: '🎉 This month: the 3-year checkup, full sentences, and the discipline approach that actually works.', dyk: 'By age 3, the brain has reached **80% of its adult size** — and the connections built in the first three years are the scaffolding for everything that comes after. Every conversation, every book, every patient repair after a meltdown. All of it counted.', opening: 'The 36-month visit marks the end of the most intensive developmental surveillance period. From here, visits go annual.', context: 'Three years. The intensive developmental surveillance window closes. Annual visits from here.', closing: 'Happy third birthday. Three years of showing up. The work you\'ve done is the most important work of her life. — Jack, Founder @ FamilyForce' },
}

function getMonthContent(ageMonths: number): MonthContent {
  return MONTH_CONTENT[ageMonths] ?? MONTH_CONTENT[Math.min(36, Math.max(0, ageMonths))] ?? {
    theme: '📅 This month\'s windows',
    dyk: 'Every month of early childhood brings new developmental windows — some open briefly and close. Scout makes sure you don\'t miss the ones that matter.',
    opening: `Month ${ageMonths}. Every month has something new — here\'s what to know this one.`,
    context: `${ageMonths} months old. Development is always moving.`,
    closing: 'Stay curious, stay consistent. We\'ll keep you on track. — Jack, Founder @ FamilyForce',
  }
}

// ─── Apply gender pronouns to MONTH_CONTENT editorial copy ───────────────────
// MONTH_CONTENT strings default to female pronouns.
// Rules:
//   'girl'          → return unchanged (female is the source default)
//   'boy'           → swap she→he, her→his, him→him, herself→himself
//   null or 'other' → swap she→they, her→their, him→them, herself→themselves
//                     (null = gender not set; 'other' = prefer not to say — both → neutral)
// Object-pronoun 'her' (e.g. "Let her", "Teach her") is handled explicitly
// BEFORE the possessive sweep to avoid wrong "Let his" / "Let their" output.
// DB window content (what_to_do, why_it_matters, jack_bridge) must be written
// gender-neutral at source and never passed through this function.
export function applyPronouns(text: string, gender: string | null): string {
  if (gender === 'girl') return text  // female is the default — no swap needed
  // null (not set) and 'other' (prefer not to say) both → they/them/their
  const g: 'boy' | 'other' = gender === 'boy' ? 'boy' : 'other'
  const she  = pronoun(g, 'subject')   // he  / they
  const her  = pronoun(g, 'possess')   // his / their
  const obj  = pronoun(g, 'object')    // him / them
  const She  = cap(she),  Her  = cap(her)
  const self = g === 'boy' ? 'himself' : 'themselves'
  const Self = cap(self)
  // Contractions: she's → he's (boy) | they're (neutral) — NOT they's
  const shes = g === 'other' ? "they're" : `${she}'s`
  const Shes = g === 'other' ? "They're" : `${She}'s`
  // Helper: capitalise replacement when source match has capital H in 'Her/Him'
  const objFor  = (m: string) => m[m.length - 3] === 'H' ? cap(obj)  : obj
  return text
    // ── Object-pronoun 'her' patterns — MUST come before possessive sweep ──
    .replace(/\bLet [Hh]er\b/g,      m => `Let ${objFor(m)}`)
    .replace(/\bTeach [Hh]er\b/g,    m => `Teach ${objFor(m)}`)
    .replace(/\bwatching [Hh]er\b/g, m => `watching ${objFor(m)}`)
    .replace(/\bengage with [Hh]er\b/g, m => `engage with ${objFor(m)}`)
    // ── Reflexive ──────────────────────────────────────────────────────────
    .replace(/\bHerself\b/g, Self)
    .replace(/\bherself\b/g, self)
    // ── Subject + contractions ─────────────────────────────────────────────
    .replace(/\bShe's\b/g, Shes)
    .replace(/\bshe's\b/g, shes)
    .replace(/\bShe\b/g,   She)
    .replace(/\bshe\b/g,   she)
    // ── Possessive her (remaining — object patterns already handled above) ─
    .replace(/\bHer\b/g,   Her)
    .replace(/\bher\b/g,   her)
    // ── Object him ─────────────────────────────────────────────────────────
    .replace(/\bHim\b/g,   cap(obj))
    .replace(/\bhim\b/g,   obj)
}

// ─── Coming next month list ────────────────────────────────────────────────────
function comingNextSection(windows: { title: string }[]): string {
  if (!windows.length) return ''
  const items = windows.slice(0, 3).map(w =>
    `<p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 10px;line-height:1.6"><span style="color:${C.terraDark}">›&nbsp;&nbsp;</span>${w.title}</p>`
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

  // Editorial ordering is now handled upstream in scout-digest/index.ts via
  // scout_editorial_schedule table. aboveFold arrives pre-ordered: editorial picks
  // first (in slot order), algo fill for any remaining slots.

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

  // Per-month editorial content.
  // MONTH_CONTENT[0] = born newborn content (not pre-birth — expecting parents use buildPreBirthEmail).
  // buildDigestEmail is never called with isExpecting=true from live callers;
  // the isExpecting flag controls in-email conditional blocks only.
  const mc = getMonthContent(isExpecting ? 0 : ageMonths)

  const ageFull      = `${ageMonths} month${ageMonths === 1 ? '' : 's'}` // New: ageFull definition

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
    : digestType === 'signup' && ageMonths === 0
    ? `${childName} is here. The first month is one of the most intensive developmental periods of any human life — and it moves fast. Scout is here to make sure you don't miss the windows that matter. Here's what to focus on right now.`
    : digestType === 'signup'
    ? `This is ${childName}'s first Scout digest. It's the beginning of something that I wish I'd had with my first son — a monthly heads-up on exactly what's worth your attention, based on ${his} age right now.`
    : applyPronouns(mc.opening, childGender)
        .replace(/\{\{childName\}\}/g, childName)
        .replace(/\{\{ageFull\}\}/g, ageFull)
        .replace(/\{\{age\}\}/g, String(ageMonths))

  // Context line
  const contextLine = isExpecting
    ? `The preparation windows below close at birth. Most are quick — and much easier to do now than with a newborn in the room.`
    : digestType === 'birth_signup'
    ? `The first few months are a blur. You're doing better than you think — and now you've got a system.`
    : digestType === 'additional_child'
    ? `${childName}'s windows are live. Here's what's worth your attention this month.`
    : allCaughtUp
    ? `You've marked everything done this month. That's genuinely rare — and it shows.`
    : applyPronouns(mc.context, childGender)
        .replace(/\{\{childName\}\}/g, childName)
        .replace(/\{\{ageFull\}\}/g, ageFull)
        .replace(/\{\{age\}\}/g, String(ageMonths))

  // Jack closing
  const jackClosing = isExpecting
    ? `You're close now. Everything you do in the next few weeks makes the first days easier. — Jack, Founder @ FamilyForce`
    : applyPronouns(mc.closing, childGender)  // #3: runtime pronoun substitution

  // #6: Birthday hero emoji suffix
  const BIRTHDAY_EMOJI: Record<number, string> = { 1: ' 🎉', 12: ' 🎂', 24: ' 🎉', 36: ' 🎓' }
  const heroBirthdaySuffix = !isExpecting ? (BIRTHDAY_EMOJI[ageMonths] ?? '') : ''

  // #3: Birthday share prompt — appears at bottom of greeting section on milestone months
  const BIRTHDAY_SHARE: Record<number, string> = {
    1:  `📸 One month old. Take a photo today — you'll want it later.`,
    12: `🎂 One year. Take a photo and share this email with whoever was in the room when it all started.`,
    24: `🎉 Two years old. Take a photo together today.`,
    36: `🎓 Three years. Take a photo — this one's worth marking.`,
  }
  const birthdayShareBlock = (!isExpecting && BIRTHDAY_SHARE[ageMonths]) ? `
  <tr>
    <td style="padding-top:14px">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.terra};margin:0;font-weight:600">${BIRTHDAY_SHARE[ageMonths]}</p>
    </td>
  </tr>` : ''

  // #7: DYK forward prompt — plain text nudge (no mailto: link — iOS Mail ignores them when reading)
  const forwardPrompt  = !isExpecting ? `
  <tr>
    <td style="padding-bottom:16px;text-align:center">
      <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0">📩 Worth sharing with your partner? Hit forward in your mail app.</p>
    </td>
  </tr>` : ''

  // #8: Jack bridge — one-liner before first window
  const jackBridge = (!isExpecting && !allCaughtUp && topWindows.length > 0) ? `
  <tr>
    <td style="padding-bottom:16px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.7;font-style:italic">Here's what to focus on this month:</p>
    </td>
  </tr>` : ''

  // Theme stripe — light purple background, dark purple text (matches approved mockup)
  const themeStripe = (!allCaughtUp && topWindows.length > 0) ? `
    <tr>
      <td style="padding-bottom:12px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0ebff;border-radius:10px">
          <tr>
            <td style="padding:14px 16px">
              <p style="font-family:Arial,sans-serif;font-size:13px;color:#2d1b69;margin:0;line-height:1.5">${applyPronouns(mc.theme, childGender)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ''

  // Build window sections — matches approved mockup layout:
  // W1 → DYK → Forward → "Also this month" header → W2+W3
  const dykSection  = dykCard(applyPronouns(mc.dyk, childGender))
  const allWins     = [...closing, ...openWindows]
  const closingSlugs = new Set(closing.map(w => w.id))

  let windowsLayout = ''
  if (allWins.length === 0) {
    windowsLayout = ''
  } else {
    const firstWin    = allWins[0]
    const firstIsClose = closingSlugs.has(firstWin.id)
    const firstCard   = windowCard(firstWin, ageMonths, dashboardUrl, firstIsClose, childGender)
    const remaining   = allWins.slice(1)

    if (remaining.length > 0) {
      // "Also this month" header with window count link — matches mockup section-hdr
      const alsoHeader = `
      <tr>
        <td style="padding:16px 0 8px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.textDim};text-transform:uppercase;letter-spacing:.1em;margin:0">Also this month</p></td>
            <td align="right"><a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:11px;color:${C.terra};font-weight:600;text-decoration:none">${allWindowCount} active windows · See all</a></td>
          </tr></table>
        </td>
      </tr>`
      const restCards = remaining.map(w => windowCard(w, ageMonths, dashboardUrl, closingSlugs.has(w.id), childGender)).join('')
      windowsLayout = firstCard + dykSection + forwardPrompt + alsoHeader + restCards
    } else {
      windowsLayout = firstCard + dykSection + forwardPrompt
    }
  }

  // #4: filter coming-next to avoid repeating slugs already in current email
  const filteredReadyWindows = getReadyWindows.filter(w => !topWindows.some(t => t.slug === w.slug))

  // Coming next month from getReadyWindows — replaced with farewell at month 36
  const farewellHtml = (!isExpecting && ageMonths >= 36 && filteredReadyWindows.length === 0) ? `
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

  const comingNextHtml = farewellHtml || comingNextSection(filteredReadyWindows)

  const remainingCount = allCaughtUp ? 0 : Math.max(0, allWindowCount - topWindows.length - completedWindows.length)

  // "What you did" section — three buckets:
  //   alreadyClosed : window's close date has passed (close_age_weeks < ageWeeks) — use soft language
  //   closingSoon   : window still open but closing within 4 weeks — "got it done in time" is accurate
  //   regularDone   : window has plenty of time left — generic celebration
  const alreadyClosed = completedWindows.filter(w => w.close_age_weeks < ageWeeks)
  const closingSoon   = completedWindows.filter(w => w.close_age_weeks >= ageWeeks && w.close_age_weeks - ageWeeks <= 4)
  const regularDone   = completedWindows.filter(w => w.close_age_weeks - ageWeeks > 4)

  const renderWindowList = (windows: { title: string }[]) => windows.map(w => `
              <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 6px;padding-left:18px;position:relative;font-weight:600">
                <span style="position:absolute;left:0;color:${C.green}">✓</span>${w.title}
              </p>`).join('')

  const completedSection = completedWindows.length > 0 ? `
    <tr>
      <td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.greenBg};border:1px solid #BBF7D0;border-radius:12px">
          <tr>
            <td style="padding:18px 20px">
              ${alreadyClosed.length > 0 ? `
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.green};margin:0 0 4px">Marked as done</p>
              <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textMid};margin:0 0 10px;line-height:1.5">You marked ${alreadyClosed.length === 1 ? 'this' : 'these'} as done this month.</p>
              ${renderWindowList(alreadyClosed)}
              ${(closingSoon.length > 0 || regularDone.length > 0) ? `<div style="border-top:1px solid #BBF7D0;margin:14px 0"></div>` : ''}
              ` : ''}
              ${closingSoon.length > 0 ? `
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.green};margin:0 0 4px">Completed before ${closingSoon.length === 1 ? 'it closed' : 'they closed'}</p>
              <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textMid};margin:0 0 10px;line-height:1.5">${closingSoon.length === 1 ? 'This window was' : 'These windows were'} closing this month. You got ${closingSoon.length === 1 ? 'it' : 'them'} done in time.</p>
              ${renderWindowList(closingSoon)}
              ${regularDone.length > 0 ? `<div style="border-top:1px solid #BBF7D0;margin:14px 0"></div>` : ''}
              ` : ''}
              ${regularDone.length > 0 ? `
              <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.green};margin:0 0 10px">${(alreadyClosed.length > 0 || closingSoon.length > 0) ? 'Also completed' : 'What you did this month'}</p>
              ${renderWindowList(regularDone)}
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

        <!-- ═══ HEADER — matches approved mockup: Scout · Month N · child name · greeting · opening · context ═══ -->
        <tr>
          <td class="hero-pad" style="background:linear-gradient(160deg,#2d1b69 0%,#1a0f3e 100%);padding:32px 28px 24px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:0 0 18px">Scout</p>
                  <p style="font-family:Arial,sans-serif;font-size:34px;font-weight:700;color:#fff;margin:0 0 4px;line-height:1.1">${isExpecting ? `Getting ready for ${childName}` : ageMonths === 0 ? `${childName} is here! 🎉` : `Month ${ageMonths}${heroBirthdaySuffix}`}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.55);margin:0 0 22px">${childName} · ${isExpecting ? 'arriving soon' : ageMonths === 0 ? 'newborn' : `${ageMonths} month${ageMonths === 1 ? '' : 's'} old`}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.8);line-height:1.7;margin:0 0 10px">${greeting}</p>
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.65);line-height:1.7;margin:0 0 14px">${openingParagraph}</p>
                  ${contextLine ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.4);font-style:italic;margin:0;border-top:1px solid rgba(255,255,255,.1);padding-top:14px">${contextLine}</p>` : ''}
                  ${birthdayShareBlock ? `<div style="margin-top:16px">${birthdayShareBlock}</div>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
          <td class="email-body" style="background:${C.surface};padding:32px 36px">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Theme stripe -->
              ${themeStripe}

              <!-- Jack bridge line (#8) -->
              ${jackBridge}

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
                              <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:${C.terraDark};text-decoration:none;display:block;padding:12px 24px">
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
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0;line-height:1.7">${jackClosing}</p>
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
              &nbsp;<a href="${dashboardUrl}" style="color:${C.terra};text-decoration:none">Manage preferences</a>
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
  // Month-level subject override (e.g. avoid "autism screen" in months 18/24)
  const mcSubject = MONTH_CONTENT[ageMonths]?.subject
  if (mcSubject && digestType === 'monthly') {
    return mcSubject.replace('{{childName}}', childName)
  }

  // aboveFold is already ordered by editorial schedule (slot 1 first).
  // Subject line uses this pre-ordered array directly.
  const sortedFold = [...aboveFold.slice(0, 3)]
  const closing = sortedFold.filter(w => w.close_age_weeks - ageWeeks <= 4)

  if (digestType === 'birth_signup') {
    return `${childName} is here — and so is your first Scout digest 🎉`
  }

  if (digestType === 'conversion') {
    return `You're subscribed — ${childName}'s full digest is here 🎉`
  }

  if (digestType === 'additional_child') {
    return `${childName}'s Scout tracking has started 🎉`
  }

  if (digestType === 'signup' && ageMonths === 0) {
    return `${childName} is here — let's make the first month count 🎉`
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

  if (sortedFold.length === 0) {
    return `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} — you've done it all this month 🏆`
  }

  return `${childName} at ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} — ${sortedFold.length} things to know this month`
}

// ─── Pre-birth email ──────────────────────────────────────────────────────────
export interface PreBirthEmailOptions {
  childName:        string
  childGender:      string | null   // girl / boy / other / null
  dueDate:          Date
  daysLeft:         number          // negative = overdue
  windows:          DigestWindow[]
  dashboardUrl:     string
  siteUrl:          string
  userId:           string
  unsubscribeUrl?:  string
  nextMonthWindows?: Array<{ title: string }>   // month 0 editorial windows for "What you'll get right after birth"
  allWindowCount?:  number                      // total active prenatal windows (for section header)
}

// Evergreen fallback cards — only used if editorial schedule is empty
const PREBIRTH_FALLBACK_CARDS = [
  {
    title:      'Choose your pediatrician',
    excerpt:    'Many pediatric practices require you to register before delivery. Your baby will have their first visit within 2–5 days of birth — you need a doctor lined up before that.',
    actionLine: 'Research practices near you now, schedule a meet-the-doctor visit, and confirm they accept your insurance.',
  },
  {
    title:      'Pack your hospital bag',
    excerpt:    'Packing after labor begins is stressful. Having a bag ready by week 36 means one less thing to think about when the real countdown starts.',
    actionLine: 'Include: insurance card, ID, phone charger, going-home outfit for baby (0–3 months), and comfortable clothing for yourself.',
  },
  {
    title:      'Understand newborn screening',
    excerpt:    'Three tests happen automatically before you leave the hospital. Knowing what they are means you won\'t be caught off guard.',
    actionLine: 'Blood spot test (heel prick), hearing screen, and CCHD pulse oximetry — all done before discharge. Ask your nurse to walk you through each one.',
  },
]

export function buildPreBirthEmail(opts: PreBirthEmailOptions): string {
  const {
    childName, childGender, dueDate, daysLeft, windows,
    dashboardUrl, siteUrl, userId, unsubscribeUrl,
    nextMonthWindows = [], allWindowCount = 0,
  } = opts

  const isOverdue   = daysLeft <= 0
  const weeksToGo   = daysLeft > 0 ? Math.round(daysLeft / 7) : 0
  const monthsToGo  = daysLeft > 0 ? Math.round(daysLeft / 30) : 0
  const dueDateStr  = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })

  // ── Header display ───────────────────────────────────────────────────────
  const ageDisplay = isOverdue
    ? 'Your due date has passed'
    : weeksToGo <= 1
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} to go`
      : `${weeksToGo} week${weeksToGo === 1 ? '' : 's'} to go`

  const childnameSub = isOverdue
    ? `${childName} · Due date has passed`
    : monthsToGo <= 1
      ? `${childName} · Due in ${weeksToGo} week${weeksToGo === 1 ? '' : 's'}`
      : `${childName} · Due in ${monthsToGo} month${monthsToGo === 1 ? '' : 's'}`

  // ── Editorial text (pronouns applied) ───────────────────────────────────
  const opening = applyPronouns(
    `Your due date is getting close. This is Scout's pre-birth digest — three things worth doing before she arrives, each one easier to do now than after. Shouldn't take more than 5 minutes to read.`,
    childGender
  )
  const context = `Everything you do before birth is infinitely easier than doing it with a newborn in the house.`

  const theme = applyPronouns(
    `📋 Before she arrives: three things that will matter in the first 24 hours.`,
    childGender
  )

  const dykRaw = applyPronouns(
    `Babies can hear their mother's voice in the womb from around week 18. **By birth, she already recognises you.** The moment you start talking to her in the delivery room, she knows who you are.`,
    childGender
  )
  const dykHtml = dykRaw.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:#1a3d32">$1</strong>`)

  const closingText = `You're close now. Everything you do in the next few weeks makes the first days easier. When ${childName} arrives, confirm the birth in Scout — your newborn digest fires instantly, then monthly from there. Until then: you're ready. — Jack, Founder @ FamilyForce`

  // ── Overdue state ────────────────────────────────────────────────────────
  if (isOverdue) {
    const preheaderText = `Your due date has passed. Let us know ${childName} is here to start full Scout tracking.`
    const unsubLine = unsubscribeUrl
      ? `<a href="${unsubscribeUrl}" style="color:#8A879A;text-decoration:none">Unsubscribe</a>`
      : `<a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A;text-decoration:none">Unsubscribe</a>`
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Is ${childName} here?</title></head>
<body style="margin:0;padding:0;background:#F7F5FF;font-family:Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheaderText}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF">
<tr><td align="center" style="padding:32px 16px 48px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="background:#1a0f3e;border-radius:16px;padding:32px 28px 28px">
  <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:0 0 18px">Scout by FamilyForce</p>
  <p style="font-family:Arial,sans-serif;font-size:28px;font-weight:700;color:#fff;margin:0 0 6px">Is ${childName} here?</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.55);margin:0 0 24px">${childName} · Due date: ${dueDateStr}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.8);margin:0 0 14px;line-height:1.7">Hi there,</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.65);margin:0;line-height:1.7">Your due date has passed. When your baby arrives, open Scout and confirm their birthday — your newborn digest fires immediately, then monthly from the 4-week birthday.</p>
</td></tr>
<tr><td style="background:#fff;border-radius:14px;padding:28px;margin-top:10px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#1D1D1F;margin:0 0 20px;line-height:1.7">Once you confirm the birth, Scout sends your newborn digest immediately — then resets the monthly clock to the 4-week birthday. No action needed beyond confirming the arrival.</p>
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:100px;text-decoration:none">Confirm arrival in Scout →</a>
  </td></tr></table>
</td></tr>
<tr><td style="padding-top:20px;border-top:1px solid rgba(255,255,255,.1)">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0 0 6px;line-height:1.6">FamilyForce · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">getfamilyforce.com</a></p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A879A;margin:0 0 6px;line-height:1.6">FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0 0 6px;line-height:1.6">You're receiving this because you're a Scout member. &nbsp;<a href="${dashboardUrl}" style="color:#6E4ED6;text-decoration:none">Manage preferences</a></p>
  <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A879A;margin:0;line-height:1.6;opacity:0.8"><em>For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</em></p>
</td></tr>
</table></td></tr></table>
</body></html>`
  }

  // ── Build window cards ───────────────────────────────────────────────────
  const cardData = windows.length > 0
    ? windows.map((w, i) => ({
        flagText:   i === 0 ? '⏱ Closing — do before birth'
                  : i === 1 ? '⏱ Do before birth'
                  : 'ℹ️ Know before you go',
        flagColor:  i >= 2 ? '#6E4ED6' : '#c0392b',
        title:      w.title,
        jackBridge: w.jack_bridge ? applyPronouns(w.jack_bridge, childGender) : null,
        excerpt:     applyPronouns(w.why_it_matters || '', childGender),  // full text — no 2-sentence truncation for pre-birth
        bulletsHtml: renderBullets(applyPronouns(w.what_to_do || '', childGender)),
      }))
    : PREBIRTH_FALLBACK_CARDS.map((c, i) => ({
        flagText:    i >= 2 ? 'ℹ️ Know before you go' : '⏱ Do before birth',
        flagColor:   i >= 2 ? '#6E4ED6' : '#c0392b',
        title:       c.title,
        jackBridge:  null,
        excerpt:     c.excerpt,
        bulletsHtml: renderBullets(c.actionLine),
      }))

  function windowCardHtml(card: typeof cardData[0]): string {
    return `
<tr><td style="padding-bottom:10px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #ece8f0;border-radius:14px;overflow:hidden">
    <tr><td style="padding:18px 20px 12px">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:${card.flagColor};text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px">${card.flagText}</p>
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:#1a0f3e;margin:0 0 7px;line-height:1.3">${card.title}</p>
      ${card.jackBridge ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#888;font-style:italic;margin:0 0 9px;line-height:1.6">${card.jackBridge}</p>` : ''}
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0;line-height:1.65">${card.excerpt}</p>
    </td></tr>
    ${card.bulletsHtml ? `
    <tr><td style="background:#ede8ff;border-top:1px solid #d4c8f0;border-left:3px solid #6E4ED6;padding:14px 20px 16px">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#6E4ED6;text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">The move</p>
      ${card.bulletsHtml}
    </td></tr>` : ''}
  </table>
</td></tr>`
  }

  const firstCard      = cardData[0]
  const remainingCards = cardData.slice(1)

  // ── Preheader ────────────────────────────────────────────────────────────
  const preheaderText = weeksToGo <= 1
    ? `${childName} arrives in ${daysLeft} days. One of these can't wait until after birth.`
    : `${childName} arrives in ${weeksToGo} weeks. One of these can't wait until after birth.`

  // ── Tackled section ─────────────────────────────────────────────────────
  const tackledSection = `
<tr><td style="padding-bottom:10px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #d4eed9;border-radius:14px">
    <tr><td style="padding:18px 20px">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#1a7a4e;text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">✅ What you've tackled</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;margin:0;line-height:1.65">As you work through these windows, mark them done in the <a href="${dashboardUrl}" style="color:#6E4ED6;font-weight:600;text-decoration:none">Scout dashboard</a>. We'll celebrate your progress here each month.</p>
    </td></tr>
  </table>
</td></tr>`

  // ── Coming next month ────────────────────────────────────────────────────
  const nextMonthSection = nextMonthWindows.length > 0 ? `
<tr><td style="padding-bottom:10px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #dde4f5;border-radius:14px">
    <tr><td style="padding:18px 20px">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#2d5bb5;text-transform:uppercase;letter-spacing:.1em;margin:0 0 12px">👶 What you'll get right after birth</p>
      ${nextMonthWindows.map(w => `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px"><tr>
        <td style="width:16px;vertical-align:top;padding-top:2px"><span style="color:#6E4ED6;font-weight:700;font-size:14px">›</span></td>
        <td><p style="font-family:Arial,sans-serif;font-size:14px;color:#333;margin:0;line-height:1.5">${w.title}</p></td>
      </tr></table>`).join('')}
    </td></tr>
  </table>
</td></tr>` : ''

  // ── Birth reminder CTA ───────────────────────────────────────────────────
  const birthReminderSection = `
<tr><td style="padding-bottom:10px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ebe4ff;border:1px solid #c8b8f0;border-radius:14px">
    <tr><td style="padding:20px 22px">
      <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#5B3CC4;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">📅 When ${childName} arrives</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:#2d1b69;margin:0 0 12px;line-height:1.65">Open Scout and confirm ${applyPronouns('her', childGender)} arrival — your <strong>newborn digest fires immediately</strong>, then monthly from the 4-week birthday. You won't need to do anything else.</p>
      <a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:14px;color:#6E4ED6;font-weight:700;text-decoration:none">Update in Scout →</a>
    </td></tr>
  </table>
</td></tr>`

  // ── Section header between card 1 and cards 2+ ─────────────────────────
  const remainingCount  = remainingCards.length
  const sectionHeader = remainingCount > 0 ? `
<tr><td style="padding:20px 0 8px 4px">
  <table width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.1em;margin:0">Also this month</p></td>
    ${allWindowCount > 0 ? `<td align="right"><a href="${dashboardUrl}" style="font-family:Arial,sans-serif;font-size:11px;color:#6E4ED6;font-weight:600;text-decoration:none">${remainingCount} of ${allWindowCount} active windows · See all</a></td>` : ''}
  </tr></table>
</td></tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${ageDisplay}</title>
</head>
<body style="margin:0;padding:0;background:#F7F5FF;font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#F7F5FF;line-height:1px">${preheaderText}&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;&nbsp;&#847;</div>
<!-- uid:${userId}-prebirth-${Date.now()} -->

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF">
  <tr><td align="center" style="padding:32px 16px 48px">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

      <!-- HERO -->
      <tr><td style="background:#1a0f3e;border-radius:16px;padding:32px 28px 24px;margin-bottom:10px">
        <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:0 0 18px">Scout</p>
        <p style="font-family:Arial,sans-serif;font-size:34px;font-weight:700;color:#fff;margin:0 0 4px;line-height:1.1">${ageDisplay}</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.55);margin:0 0 24px">${childnameSub}</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.8);margin:0 0 12px;line-height:1.7">Hi there,</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.65);margin:0 0 16px;line-height:1.7">${opening}</p>
        <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.4);font-style:italic;margin:0;line-height:1.7;border-top:1px solid rgba(255,255,255,.1);padding-top:14px">${context}</p>
      </td></tr>

      <tr><td style="height:10px"></td></tr>

      <!-- THEME STRIPE -->
      <tr><td style="background:#f7f4ff;border-left:3px solid #6E4ED6;padding:12px 18px;border-radius:0 8px 8px 0;margin-bottom:14px">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:#5B3CC4;font-weight:600;margin:0">${theme}</p>
      </td></tr>

      <tr><td style="padding:14px 0 8px">
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#5C5960;font-style:italic;margin:0">Here's what to focus on this month:</p>
      </td></tr>

      <!-- FIRST WINDOW (featured) -->
      ${firstCard ? windowCardHtml(firstCard) : ''}

      <!-- DYK — after first window -->
      <tr><td style="padding-bottom:10px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f4f0;border:1px solid #b8ddd3;border-radius:14px">
          <tr><td style="padding:20px 22px">
            <p style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:#1a7a5e;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">💡 Did you know</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:#1a3d32;margin:0;line-height:1.65">${dykHtml}</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- SECTION HEADER + REMAINING WINDOWS -->
      ${sectionHeader}
      ${remainingCards.map(c => windowCardHtml(c)).join('')}

      <!-- TACKLED -->
      ${tackledSection}

      <!-- COMING NEXT MONTH -->
      ${nextMonthSection}

      <!-- BIRTH REMINDER CTA -->
      ${birthReminderSection}

      <!-- CLOSING CARD -->
      <tr><td style="padding-bottom:10px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a0f3e;border-radius:14px">
          <tr><td style="padding:24px 26px">
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);line-height:1.85;font-style:italic;margin:0">${closingText}</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA BUTTON -->
      <tr><td style="padding:8px 0 24px;text-align:center">
        <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 36px;border-radius:100px;text-decoration:none">Open Scout dashboard →</a>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding-top:20px;padding-bottom:32px;border-top:1px solid #ece8f0">
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0 0 8px;line-height:1.6">FamilyForce · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">getfamilyforce.com</a></p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A879A;margin:0 0 6px;line-height:1.6">FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0 0 6px;line-height:1.6">You're receiving this because you're a Scout member. &nbsp;<a href="${dashboardUrl}" style="color:#6E4ED6;text-decoration:none">Manage preferences</a></p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#8A879A;margin:0;line-height:1.6;opacity:0.8"><em>For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</em></p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}
