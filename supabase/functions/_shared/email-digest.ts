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

// ─── Window card (redesigned) ─────────────────────────────────────────────────
function windowCard(w: DigestWindow, ageMonths: number, dashboardUrl: string, isClosing: boolean): string {
  const cfg      = urgencyConfig(w.urgency)
  const ageWeeks = ageMonths * 4.33
  const weeksLeft = Math.round(w.close_age_weeks - ageWeeks)

  // Trim to 2 sentences
  const sentences = (w.why_it_matters || '').replace(/([.!?])\s+/g, '$1|||').split('|||')
  const excerpt   = sentences.slice(0, 2).join(' ').trim()

  // First action — only rendered if content exists
  const actionLine = (w.what_to_do || '').split('\n')[0].replace(/^[-•·]\s*/, '').trim()

  const closingBadge = isClosing
    ? `<span style="display:inline-block;background:${C.amberBg};color:${C.amber};border:1px solid ${C.amberBorder};font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;margin-left:8px;letter-spacing:.02em">Closes in ${weeksLeft}w</span>`
    : ''

  const guideLink = w.playbook_link
    ? `<tr><td style="padding-top:12px"><a href="${dashboardUrl}" style="font-size:13px;color:${C.terra};text-decoration:none;font-weight:600">Read the free guide →</a></td></tr>`
    : ''

  return `
  <tr>
    <td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:20px 22px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <!-- Title row -->
              <tr>
                <td style="padding-bottom:8px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3;letter-spacing:-.01em">${w.title}${closingBadge}</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding-bottom:14px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${excerpt}</p>
                </td>
              </tr>
              <!-- Action box — only shown when what_to_do is populated -->
              ${actionLine ? `
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
                    <tr>
                      <td style="padding:12px 16px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${actionLine}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>` : ''}
              ${guideLink}
            </table>
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

  const allCaughtUp = aboveFold.length === 0 && digestType === 'monthly'

  const His = cap(pronoun(childGender, 'possess'))
  const his = pronoun(childGender, 'possess')
  const him = pronoun(childGender, 'object')

  const ageWeeks = ageMonths * 4.33

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })

  // Split windows
  const closing     = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  const openWindows = aboveFold.filter(w => w.close_age_weeks - ageWeeks > 4)

  // Greeting
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'

  // Opening paragraph varies by digest type / expecting status
  const openingParagraph = isExpecting
    ? `Scout is designed for when your baby is born — covering every developmental milestone through the first three years. The ${postBirthWindowCount} windows we track all start at birth. But we wanted to be helpful before ${childName} arrives too, so below are a few things worth sorting now. It's not an exhaustive list — just the things that are genuinely easier to do before a newborn is in the room.`
    : digestType === 'birth_signup'
    ? `${childName} is here. And there are ${allWindowCount} developmental windows open in the first month. That can feel like a lot — and honestly, it is. But that's exactly why Scout exists. We'll make sure you don't miss any of them. Let's nail the first month together.`
    : digestType === 'conversion'
    ? `Thanks for continuing. This is ${childName}'s Scout digest for month ${ageMonths} — a monthly heads-up on exactly what's worth your attention, based on ${his} age right now. I wish I'd had this with my first son.`
    : digestType === 'additional_child'
    ? `You already know how Scout works. This is ${childName}'s first digest — the same system, tuned to exactly where ${his} is right now. Every child has their own set of windows. Here's ${childName}'s.`
    : digestType === 'signup'
    ? `This is ${childName}'s first Scout digest. It's the beginning of something that I wish I'd had with my first son — a monthly heads-up on exactly what's worth your attention, based on ${his} age right now.`
    : `${childName} is ${ageMonths} ${ageMonths === 1 ? 'month' : 'months'} old. This is ${his} Scout digest for the month — a quick look at what's worth your attention right now, written to take about 5 minutes to read.`

  // Milestone context line (warm, not alarming)
  const contextLine = isExpecting
    ? `The preparation windows below close at birth. Most of them are quick — and much easier to do now than with a newborn in the room.`
    : digestType === 'birth_signup'
    ? `The first few months are a blur. You're doing better than you think — and now you've got a system.`
    : digestType === 'additional_child'
    ? `${childName}'s windows are live. Here's what's worth your attention this month.`
    : allCaughtUp
    ? `You've marked everything done this month. That's genuinely rare — and it shows. Here's a look back at what you covered, and a heads-up on what's coming next.`
    : ageMonths <= 2
    ? `The first few months are a blur. You're doing better than you think.`
    : ageMonths <= 6
    ? `${ageMonths} months in. The fog is starting to lift — and ${his} development is picking up fast.`
    : ageMonths <= 12
    ? `${childName} is in one of the most active developmental stretches of the whole first year.`
    : `Month ${ageMonths}. Every month has something new — here's what to know this one.`

  // Build sections
  const closingSection = closing.length > 0 ? `
    <!-- Priority section -->
    <tr>
      <td style="padding-bottom:8px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:10px">
          <tr>
            <td style="padding:12px 16px">
              <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.amber};margin:0;line-height:1.6">
                <strong>Heads up:</strong> ${closing.length === 1 ? 'One window' : `${closing.length} windows`} close${closing.length === 1 ? 's' : ''} this month — meaning the natural developmental timing is ending. These are worth doing first.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="padding-bottom:4px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.amber};margin:0">This month's priority</p></td></tr>
    ${closing.map(w => windowCard(w, ageMonths, dashboardUrl, true)).join('')}` : ''

  const openSection = openWindows.length > 0 ? `
    <tr><td style="padding:${closing.length > 0 ? '8px' : '0'} 0 8px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.textDim};margin:0">Also worth knowing this month</p></td></tr>
    ${openWindows.map(w => windowCard(w, ageMonths, dashboardUrl, false)).join('')}` : ''

  const getReadySection = getReadyWindows.length > 0 ? `
    <tr><td style="padding:16px 0 8px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.terra};margin:0">Get ready for next month</p></td></tr>
    ${getReadyWindows.map(w => getReadyItem(w)).join('')}` : ''

  const remainingCount = allCaughtUp ? 0 : allWindowCount - aboveFold.length

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

              <!-- Windows (or all-caught-up hero) -->
              ${allCaughtUp ? allCaughtUpSection : closingSection + openSection}
              ${completedSection}
              ${getReadySection}

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

              <!-- Signature -->
              <tr>
                <td style="border-top:1px solid ${C.border};padding-top:28px;padding-bottom:8px">
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 3px;font-weight:600">Jack Hartley</p>
                  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0 0 16px">Dad of two · Founder, FamilyForce</p>
                  <table cellpadding="0" cellspacing="0" style="border-left:3px solid ${C.border}">
                    <tr>
                      <td style="padding:6px 0 6px 14px">
                        <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7;font-style:italic">
                          "I got it wrong with my first son. Got it right with my second — because I finally knew what to watch for. That's what Scout is."
                        </p>
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
            <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 8px;line-height:1.6">
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
  childName:    string
  dueDate:      Date
  daysLeft:     number      // negative = overdue
  windows:      DigestWindow[]
  dashboardUrl: string
  siteUrl:      string
  userId:       string
}

export function buildPreBirthEmail(opts: PreBirthEmailOptions): string {
  const { childName, dueDate, daysLeft, windows, dashboardUrl, siteUrl } = opts

  const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' })
  const isOverdue  = daysLeft <= 0

  const headline = isOverdue
    ? `Is ${childName} here?`
    : daysLeft === 1
      ? `${childName} arrives tomorrow.`
      : `${childName} arrives in ${daysLeft} days.`

  const subhead = isOverdue
    ? `Your due date (${dueDateStr}) has passed. When your baby arrives, confirm their birth in Scout to start full milestone tracking.`
    : `Your due date is ${dueDateStr}. Here's what to have ready before they arrive.`

  const windowCards = windows.length > 0
    ? windows.map(w => {
        const excerpt    = (w.why_it_matters || '').replace(/([.!?])\s+/g, '$1|||').split('|||').slice(0, 2).join(' ').trim()
        const actionLine = (w.what_to_do || '').split('\n')[0].replace(/^[-•·]\s*/, '').trim()
        return `
  <tr>
    <td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:20px 22px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-bottom:8px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3">${w.title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom:14px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${excerpt}</p>
                </td>
              </tr>
              ${actionLine ? `
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
                    <tr>
                      <td style="padding:12px 16px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${actionLine}</p>
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
  </tr>`
      }).join('')
    : `<tr><td style="padding-bottom:16px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};line-height:1.7">No active prep windows right now — you're all caught up before arrival.</p></td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${headline}</title></head>
<body style="margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif;-webkit-font-smoothing:antialiased">
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

        ${!isOverdue && windows.length > 0 ? `
        <!-- Section label -->
        <tr>
          <td style="padding-bottom:16px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:${C.terra};margin:0">Before ${childName} arrives</p>
          </td>
        </tr>

        <!-- Window cards -->
        ${windowCards}` : ''}

        ${isOverdue ? `
        <!-- Overdue encouragement -->
        <tr>
          <td style="padding-bottom:24px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:14px">
              <tr>
                <td style="padding:24px 28px">
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.7">Once you confirm ${childName}'s arrival, Scout will send your first milestone digest — timed to their exact birth date, with everything that matters in the first weeks and months ahead.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : `
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
        </tr>`}

        <!-- Footer -->
        <tr>
          <td style="border-top:1px solid ${C.border};padding-top:24px">
            <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 8px;line-height:1.6;text-align:center">Scout by FamilyForce · <a href="${siteUrl}" style="color:${C.textDim}">getfamilyforce.com</a></p>
            <p style="font-family:Arial,sans-serif;font-size:11px;color:${C.textDim};margin:0;line-height:1.6;text-align:center">For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
