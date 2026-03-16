// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Digest Email Template (4A)
// Shared by scout-signup-delivery and scout-digest.
//
// Design spec:
//   - 600px desktop / 375px mobile (media query in <style> block)
//   - Sections: Header → Closing Soon → This Month → Dashboard CTA
//               → Calendar note → Jack signature → Footer
//   - Urgency: clinical=red border, screening=blue border, advisory=grey
//   - All styles inline for email client compatibility
//   - Table-based layout (Outlook safe)
//
// Test matrix:
//   Gmail web · Gmail mobile iOS/Android · Apple Mail iOS/macOS
//   Outlook Windows/web · Dark mode
// ═══════════════════════════════════════════════════════════════

// ─── Types ───────────────────────────────────────────────────────────────────
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
}

export interface DigestEmailOptions {
  childName:       string
  childGender:     string | null
  ageMonths:       number
  aboveFold:       DigestWindow[]
  allWindowCount:  number
  closingCount:    number           // windows closing within 4 weeks
  nextEventDate:   Date             // next monthly birthday
  dashboardUrl:    string
  siteUrl:         string
  userId:          string           // for unsubscribe link
  digestType:      'signup' | 'monthly'
}

// ─── Colour palette (inline-safe) ────────────────────────────────────────────
const C = {
  bg:          '#FAFAFA',
  surface:     '#FFFFFF',
  border:      '#E5E2EC',
  text:        '#1D1D1F',
  textMid:     '#5C5960',
  textDim:     '#8A879A',
  terra:       '#6E4ED6',
  terraDark:   '#5B3CC4',
  terraTint:   '#F0EBFF',
  indigoDeep:  '#1E1248',
  // urgency
  clinical:    '#DC2626',
  clinicalBg:  '#FEF2F2',
  clinicalBdr: '#FCA5A5',
  screening:   '#2563EB',
  screeningBg: '#EFF6FF',
  screeningBdr:'#93C5FD',
  advisory:    '#5C5960',
  advisoryBg:  '#F9F8FF',
  advisoryBdr: '#E5E2EC',
}

// ─── Urgency config ───────────────────────────────────────────────────────────
function urgencyConfig(u: 'clinical' | 'screening' | 'advisory') {
  if (u === 'clinical')  return { border: C.clinical,  bg: C.clinicalBg,  badge: C.clinical,  label: 'Important' }
  if (u === 'screening') return { border: C.screening, bg: C.screeningBg, badge: C.screening, label: 'Check in'  }
  return                        { border: C.advisory,  bg: C.advisoryBg,  badge: C.advisory,  label: 'Advisory'  }
}

// ─── Pronoun helper ───────────────────────────────────────────────────────────
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

// ─── Window card ─────────────────────────────────────────────────────────────
function windowCard(w: DigestWindow, ageMonths: number, dashboardUrl: string): string {
  const cfg        = urgencyConfig(w.urgency)
  const ageWeeks   = ageMonths * 4.33
  const isClosing  = w.close_age_weeks - ageWeeks <= 4
  const weeksLeft  = Math.round(w.close_age_weeks - ageWeeks)
  const closingTag = isClosing
    ? `<span style="display:inline-block;background:#FEF3C7;color:#92400E;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:2px 8px;border-radius:100px;margin-left:6px">Closes in ${weeksLeft}w</span>`
    : ''

  // Trim why_it_matters to 2 sentences
  const sentences  = w.why_it_matters.replace(/([.!?])\s+/g, '$1|').split('|')
  const excerpt    = sentences.slice(0, 2).join(' ').trim()

  // What to do — first action only
  const actionLine = w.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim()

  const playbookRow = w.playbook_link
    ? `<tr><td style="padding-top:10px">
        <a href="${dashboardUrl}" style="font-size:12px;color:${C.terra};text-decoration:none;font-weight:600">
          📖 Free guide available →
        </a>
       </td></tr>`
    : ''

  return `
  <tr>
    <td style="padding-bottom:12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="
        background:${cfg.bg};
        border:1px solid ${cfg.border};
        border-left:4px solid ${cfg.border};
        border-radius:12px;
        overflow:hidden;
      ">
        <tr>
          <td style="padding:18px 20px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="display:inline-block;background:${cfg.badge}1A;color:${cfg.badge};font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;border-radius:100px">${cfg.label}</span>${closingTag}
                </td>
              </tr>
              <tr>
                <td style="padding-top:10px">
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:400;color:${C.text};margin:0;line-height:1.3;letter-spacing:-.01em">${w.title}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:8px">
                  <p style="font-size:13px;color:${C.textMid};margin:0;line-height:1.65">${excerpt}</p>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px">
                  <table cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:8px">
                    <tr>
                      <td style="padding:10px 14px">
                        <p style="font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 3px">What to do</p>
                        <p style="font-size:13px;color:${C.text};margin:0;line-height:1.5">${actionLine}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${playbookRow}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ─── Section divider ──────────────────────────────────────────────────────────
function sectionLabel(icon: string, text: string, color = C.textDim): string {
  return `
  <tr>
    <td style="padding:20px 0 12px">
      <p style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${color};margin:0">${icon}&nbsp; ${text}</p>
    </td>
  </tr>`
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function buildDigestEmail(opts: DigestEmailOptions): string {
  const {
    childName, childGender, ageMonths, aboveFold, allWindowCount,
    closingCount, nextEventDate, dashboardUrl, siteUrl, userId, digestType,
  } = opts

  const His = cap(pronoun(childGender, 'possess'))
  const him = pronoun(childGender, 'object')

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })
  const nextMonthShort = nextEventDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC'
  })

  // Split windows: closing soon (≤4w) vs open
  const ageWeeks    = ageMonths * 4.33
  const closing     = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  const openWindows = aboveFold.filter(w => w.close_age_weeks - ageWeeks > 4)

  // Build window rows
  const closingRows = closing.map(w => windowCard(w, ageMonths, dashboardUrl)).join('')
  const openRows    = openWindows.map(w => windowCard(w, ageMonths, dashboardUrl)).join('')

  const closingSection = closing.length > 0 ? `
    ${sectionLabel('⚠️', `Closing soon — act this month`, C.clinical)}
    ${closingRows}` : ''

  const openSection = openWindows.length > 0 ? `
    ${sectionLabel('✅', `This month`, C.terra)}
    ${openRows}` : ''

  const remainingCount = allWindowCount - aboveFold.length
  const remainingRow = remainingCount > 0 ? `
  <tr>
    <td style="padding-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:14px">
        <tr>
          <td style="padding:20px;text-align:center">
            <p style="font-size:14px;color:${C.textMid};margin:0 0 14px;line-height:1.6">
              <strong style="color:${C.text}">${remainingCount} more windows</strong> are open for ${childName} this month.
            </p>
            <a href="${dashboardUrl}" style="
              display:inline-block;background:${C.terra};color:#fff;
              font-family:Arial,sans-serif;font-size:14px;font-weight:700;
              padding:12px 28px;border-radius:100px;text-decoration:none;
              letter-spacing:-.01em
            ">See all ${childName}'s windows →</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>` : `
  <tr>
    <td style="padding-bottom:32px;text-align:center">
      <a href="${dashboardUrl}" style="
        display:inline-block;background:${C.terra};color:#fff;
        font-family:Arial,sans-serif;font-size:14px;font-weight:700;
        padding:13px 32px;border-radius:100px;text-decoration:none
      ">Open ${childName}'s dashboard →</a>
    </td>
  </tr>`

  const introLine = digestType === 'signup'
    ? `${childName} is ${ageMonths} months old. ${His} first window digest is ready.`
    : `${childName} turns ${ageMonths} months today. Here's what's open.`

  const subCount = closingCount > 0
    ? `${closingCount} window${closingCount > 1 ? 's' : ''} closing this month · ${allWindowCount} open total`
    : `${allWindowCount} developmental windows open right now`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${childName} — Scout digest</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 480px) {
      .email-wrap { padding: 12px 8px !important; }
      .email-body { padding: 20px 16px !important; }
      .hero-name  { font-size: 24px !important; }
    }
    /* Force light mode — prevent Gmail dark mode inversion */
    [data-ogsc] .force-light { background: ${C.surface} !important; color: ${C.text} !important; }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">

<!-- Preheader (hidden preview text) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
  ${introLine} ${subCount}.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
</div>

<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${C.bg}">
  <tr>
    <td align="center" class="email-wrap" style="padding:24px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td style="background:${C.indigoDeep};border-radius:16px 16px 0 0;padding:24px 32px 28px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <!-- Logo -->
                  <p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.45);margin:0 0 20px">FamilyForce Scout</p>
                  <!-- Child name + age -->
                  <p class="hero-name" style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:400;color:#fff;margin:0 0 6px;line-height:1.15;letter-spacing:-.02em">${introLine}</p>
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.55);margin:0">${subCount}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
          <td class="email-body" style="background:${C.surface};padding:28px 32px;border:1px solid ${C.border};border-top:none">
            <table width="100%" cellpadding="0" cellspacing="0">

              ${closingSection}
              ${openSection}
              ${remainingRow}

              <!-- ═══ CALENDAR NOTE ═══ -->
              <tr>
                <td style="padding-bottom:32px">
                  <table width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid ${C.terra};background:#F9F8FD;border-radius:0 10px 10px 0">
                    <tr>
                      <td style="padding:14px 18px">
                        <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textMid};margin:0;line-height:1.65">
                          📅 <strong style="color:${C.text}">Calendar invite attached.</strong>
                          Accept it and you'll get a 7-day reminder before ${childName}'s windows close.
                          It works with Google Calendar, Apple Calendar, and Outlook.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- ═══ SIGNATURE ═══ -->
              <tr>
                <td style="padding-bottom:32px;border-top:1px solid ${C.border};padding-top:24px">
                  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 2px;font-weight:500">Jack</p>
                  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0 0 10px">Dad of two · FamilyForce</p>
                  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textMid};margin:0;line-height:1.65;font-style:italic">
                    "I got it wrong with my first son. Got it right with my second — because I finally knew what to watch for. That's what Scout is."
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td style="background:${C.bg};border-radius:0 0 16px 16px;padding:20px 32px;border:1px solid ${C.border};border-top:none">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 6px;line-height:1.6">
                    FamilyForce · <a href="${siteUrl}" style="color:${C.textDim};text-decoration:none">${siteUrl.replace('https://', '')}</a>
                  </p>
                  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0;line-height:1.6">
                    You're receiving this because you signed up for Scout.
                    <a href="${siteUrl}/scout-dashboard/settings" style="color:${C.terra};text-decoration:none">Manage preferences</a>
                    &nbsp;·&nbsp;
                    <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`
}

// ─── Subject line builder ─────────────────────────────────────────────────────
export function buildDigestSubject(
  childName:  string,
  ageMonths:  number,
  aboveFold:  DigestWindow[],
  ageWeeks:   number
): string {
  const closing = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  if (closing.length > 0) {
    const w         = closing[0]
    const weeksLeft = Math.round(w.close_age_weeks - ageWeeks)
    return `${childName} · ${weeksLeft} weeks left on ${w.title.toLowerCase()}`
  }
  return `${childName} turns ${ageMonths} months — ${aboveFold.length} windows open`
}
