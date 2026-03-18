// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial-End & Re-engagement Email Templates (4B)
// Shared by scout-trial-end edge function.
//
// Emails:
//   buildTrialEndEmail  — fires on trial_end date (annual pre-selected)
//   buildReengagementEmail — fires 30 days after trial_end (one window teaser)
//
// Design spec:
//   - 600px desktop / responsive mobile
//   - Annual plan: purple card (highlighted, "Best value")
//   - Monthly plan: white card (secondary)
//   - Social proof: one testimonial placeholder (replace at launch)
//   - Outlook VML buttons for MSO clients
//   - Preheader text, light-mode forced
// ═══════════════════════════════════════════════════════════════

export type TrialEndWindow = { title: string; why_it_matters: string; urgency: string }
export type ReengagementWindow = { title: string; why_it_matters: string; what_to_do: string }

const PRICE_ANNUAL_DISPLAY  = '$79.99/year'
const PRICE_ANNUAL_MONTHLY  = '$6.67/month'
const PRICE_MONTHLY_DISPLAY = '$9.99/month'

// ─── Pronoun helper ───────────────────────────────────────────────────────────
function pronoun(gender: string | null, form: 'subject' | 'object' | 'possess'): string {
  const map = {
    subject: { boy: 'he',  girl: 'she',  other: 'they' },
    object:  { boy: 'him', girl: 'her',  other: 'them' },
    possess: { boy: 'his', girl: 'her',  other: 'their' },
  }
  const g = (gender ?? 'other') as 'boy' | 'girl' | 'other'
  return map[form][g] ?? map[form].other
}

// ─── Age helpers ──────────────────────────────────────────────────────────────
function ageInWeeks(dob: Date, asOf: Date): number {
  return Math.floor((asOf.getTime() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

function ageInMonths(dob: Date, asOf: Date): number {
  const months =
    (asOf.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - dob.getUTCMonth())
  return asOf.getUTCDate() >= dob.getUTCDate() ? months : months - 1
}

// ─── Weeks since signup ───────────────────────────────────────────────────────
function weeksSince(fromDate: Date, toDate: Date): number {
  return Math.round((toDate.getTime() - fromDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

// ─── Build trial-end email HTML ───────────────────────────────────────────────

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F5FF', surface: '#FFFFFF', border: '#E5E2EC',
  text: '#1D1D1F', textMid: '#5C5960', textDim: '#8A879A',
  terra: '#6E4ED6', terraTint: '#F0EBFF', indigoDeep: '#1E1248',
  amber: '#B45309', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
}

// ─── Build trial-end email HTML (v2) ──────────────────────────────────────────
export function buildTrialEndEmail(opts: {
  childName:       string
  parentName?:     string
  childGender:     string | null
  ageMonths:       number
  weeksSinceJoin:  number
  allWindowCount:  number
  topWindows:      Array<{ title: string; why_it_matters: string; what_to_do?: string; urgency: string }>
  annualCta:       string
  monthlyCta:      string
  siteUrl:         string
  userId:          string
}): string {
  const { childName, parentName, ageMonths, weeksSinceJoin,
          allWindowCount, topWindows, annualCta, monthlyCta, siteUrl, userId } = opts

  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'
  const isFirstBirthday = ageMonths === 12

  const heroLine = isFirstBirthday
    ? `${childName} is one year old today.`
    : `${childName} is ${ageMonths} month${ageMonths === 1 ? '' : 's'} old today.`

  const heroSub = `Your free trial ends today &nbsp;&middot;&nbsp; ${allWindowCount} windows open`

  const joinCopy = weeksSinceJoin <= 1
    ? 'You signed up last week.'
    : `You signed up ${weeksSinceJoin} weeks ago.`

  const preheader = isFirstBirthday
    ? `${childName} turns 1 today. Your trial ends today. Here's what's open right now.`
    : `${childName} turns ${ageMonths} months today. Your trial ends today. Here's what's open right now.`

  const windowCards = topWindows.map(w => {
    const bodyText = w.why_it_matters.replace(/([.!?])\s+/g, '$1|||').split('|||').slice(0, 2).join(' ').trim()
    const move     = w.what_to_do
      ? w.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim()
      : `Open Scout to mark this window for ${childName}.`
    return `
    <tr><td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px">
        <tr><td style="padding:20px 22px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:8px"><p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3">${w.title}</p></td></tr>
            <tr><td style="padding-bottom:14px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${bodyText}</p></td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
                <tr><td style="padding:12px 16px">
                  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${move}</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${childName} turns ${ageMonths} months — Scout trial ends today</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif}
    @media only screen and (max-width:480px){.email-body{padding:24px 18px!important}.hero-pad{padding:24px 20px 28px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
  ${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

<!-- HEADER -->
<tr><td class="hero-pad" style="background:${C.indigoDeep};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">${heroLine}</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">${heroSub}</p>
</td></tr>

<!-- BODY -->
<tr><td class="email-body" style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Greeting -->
<tr><td style="padding-bottom:24px;border-bottom:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 14px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 10px;line-height:1.75">${joinCopy} As part of the trial, you received one digest email and one calendar event for ${childName}'s first month. There are ${allWindowCount} windows open this month -- and a new digest ready to go.</p>
</td></tr>
<tr><td style="padding-bottom:16px"></td></tr>

<!-- Heads up banner -->
<tr><td style="padding-bottom:8px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:10px">
    <tr><td style="padding:12px 16px">
      <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.amber};margin:0;line-height:1.6"><strong>Heads up:</strong> Your trial ends today. The windows below are still open -- they don't close with the trial.</p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding-bottom:10px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.textDim};margin:0">Still open this month</p></td></tr>

${windowCards}

<tr><td style="padding-bottom:32px"></td></tr>

<!-- Keep going -->
<tr><td style="padding-bottom:12px">
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${C.text};margin:0 0 8px;line-height:1.3">Keep going with Scout.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">One email and one calendar event every month, on ${childName}'s birthday. The right information at the right time.</p>
</td></tr>
<tr><td style="padding-bottom:10px"></td></tr>

<!-- Annual -->
<tr><td style="padding-bottom:10px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terra};border-radius:16px">
    <tr><td style="padding:24px">
      <span style="display:inline-block;background:rgba(255,255,255,.2);color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase">Best value</span>
      <p style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin:12px 0 4px">Annual -- ${PRICE_ANNUAL_DISPLAY}</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.8);margin:0 0 20px">That's ${PRICE_ANNUAL_MONTHLY}. Covers ${childName} from today through the next 12 months. One payment.</p>
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${annualCta}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#FFFFFF"><w:anchorlock/><center style="color:#5B3CC4;font-family:Arial,sans-serif;font-size:15px;font-weight:700;">Continue with Annual &rarr;</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="${annualCta}" style="display:block;text-align:center;background:#fff;color:#5B3CC4;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px;border-radius:100px;text-decoration:none;mso-hide:all">Continue with Annual &rarr;</a>
      <!--<![endif]-->
    </td></tr>
  </table>
</td></tr>

<!-- Monthly -->
<tr><td style="padding-bottom:32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1.5px solid ${C.border};border-radius:14px">
    <tr><td style="padding:20px">
      <p style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:${C.text};margin:0 0 4px">Monthly -- ${PRICE_MONTHLY_DISPLAY}</p>
      <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0 0 16px">Cancel any time.</p>
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${monthlyCta}" style="height:40px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="t" strokecolor="#C4B5FD" fillcolor="#F0EBFF"><w:anchorlock/><center style="color:#5B3CC4;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">Monthly instead &rarr;</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="${monthlyCta}" style="display:block;text-align:center;background:${C.terraTint};color:#5B3CC4;font-family:Arial,sans-serif;font-size:14px;font-weight:600;padding:12px;border-radius:100px;text-decoration:none;mso-hide:all">Monthly instead &rarr;</a>
      <!--<![endif]-->
    </td></tr>
  </table>
</td></tr>

<!-- No hard feelings -->
<tr><td style="padding-bottom:32px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.75">If you decide not to continue, you won't receive another Scout email. The calendar events already in your calendar stay there. The windows already delivered are yours to keep.</p>
</td></tr>

<!-- Signature -->
<tr><td style="border-top:1px solid ${C.border};padding-top:28px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 3px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0 0 16px">Dad of two &middot; Founder, FamilyForce</p>
  <table cellpadding="0" cellspacing="0" style="border-left:3px solid ${C.border}">
    <tr><td style="padding:6px 0 6px 14px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7;font-style:italic">&ldquo;I got it wrong with my first son. Got it right with my second &mdash; because I finally knew what to watch for. That&rsquo;s what Scout is.&rdquo;</p>
    </td></tr>
  </table>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 6px">FamilyForce &middot; getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0">
    <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Stop receiving Scout emails</a>
  </p>
</td></tr>

</table></td></tr></table>
</body></html>`
}


// ─── Palette (re-engagement shares the v2 palette) ────────────────────────────
const C_RE = {
  bg: '#F7F5FF', surface: '#FFFFFF', border: '#E5E2EC',
  text: '#1D1D1F', textMid: '#5C5960', textDim: '#8A879A',
  terra: '#6E4ED6', terraTint: '#F0EBFF', indigoDeep: '#1E1248',
}

// ─── Build re-engagement email HTML (v2) ──────────────────────────────────────
export function buildReengagementEmail(opts: {
  childName:    string
  parentName?:  string
  ageMonths:    number
  topWindow:    { title: string; why_it_matters: string; what_to_do: string } | null
  subscribeCta: string
  siteUrl:      string
  userId:       string
}): string {
  const { childName, parentName, ageMonths, topWindow, subscribeCta, siteUrl, userId } = opts
  const nextMonth = ageMonths + 1
  const greeting  = parentName ? `Hi ${parentName},` : 'Hi there,'

  const preheader = `${childName} turned ${ageMonths} months a month ago. One window I want to flag before ${nextMonth} months passes.`

  const bodyText = topWindow
    ? topWindow.why_it_matters.replace(/([.!?])\s+/g, '$1|||').split('|||').slice(0, 2).join(' ').trim()
    : `There are still open windows for ${childName} at ${ageMonths} months.`

  const move = topWindow?.what_to_do
    ? topWindow.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim()
    : `Open Scout to see ${childName}'s open windows for this month.`

  const windowCard = topWindow ? `
  <tr><td style="padding-bottom:28px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${C_RE.surface};border:1px solid ${C_RE.border};border-radius:14px">
      <tr><td style="padding:20px 22px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding-bottom:8px"><p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C_RE.text};margin:0;line-height:1.3">${topWindow.title}</p></td></tr>
          <tr><td style="padding-bottom:14px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C_RE.textMid};margin:0;line-height:1.7">${bodyText}</p></td></tr>
          <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:${C_RE.terraTint};border-radius:10px">
              <tr><td style="padding:12px 16px">
                <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C_RE.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                <p style="font-family:Arial,sans-serif;font-size:14px;color:${C_RE.text};margin:0;line-height:1.6">${move}</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </td></tr>` : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light only">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${childName} turned ${ageMonths} months a month ago</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0;padding:0;background:${C_RE.bg};font-family:Arial,sans-serif}
    @media only screen and (max-width:480px){.email-body{padding:24px 18px!important}.hero-pad{padding:24px 20px 28px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${C_RE.bg}">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
  ${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:${C_RE.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C_RE.border}">

<!-- HEADER -->
<tr><td class="hero-pad" style="background:${C_RE.indigoDeep};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">${childName} is ${ageMonths} months old.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">One window before you go.</p>
</td></tr>

<!-- BODY -->
<tr><td class="email-body" style="background:${C_RE.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Greeting -->
<tr><td style="padding-bottom:24px;border-bottom:1px solid ${C_RE.border}">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C_RE.text};margin:0 0 14px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C_RE.textMid};margin:0 0 10px;line-height:1.75">You didn't subscribe to Scout after the trial -- which is completely fine.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C_RE.textMid};margin:0;line-height:1.75">Before I go, one window I'd flag for ${ageMonths} months.</p>
</td></tr>
<tr><td style="padding-bottom:24px"></td></tr>

${windowCard}

<!-- CTA -->
<tr><td style="padding-bottom:32px;text-align:center">
  <a href="${subscribeCta}" style="display:inline-block;background:${C_RE.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 30px;border-radius:100px;text-decoration:none">See ${childName}'s ${nextMonth}-month windows &rarr;</a>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C_RE.textDim};margin:10px 0 0">$9.99/month or $79.99/year. Annual saves 33%.</p>
</td></tr>

<!-- Sign-off -->
<tr><td style="padding-bottom:32px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C_RE.textMid};margin:0;line-height:1.75">If now isn't the right time, this is the last email from Scout.</p>
</td></tr>

<!-- Signature -->
<tr><td style="border-top:1px solid ${C_RE.border};padding-top:28px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C_RE.text};margin:0 0 3px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C_RE.textDim};margin:0 0 16px">Dad of two &middot; Founder, FamilyForce</p>
  <table cellpadding="0" cellspacing="0" style="border-left:3px solid ${C_RE.border}">
    <tr><td style="padding:6px 0 6px 14px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${C_RE.textMid};margin:0;line-height:1.7;font-style:italic">&ldquo;I got it wrong with my first son. Got it right with my second &mdash; because I finally knew what to watch for. That&rsquo;s what Scout is.&rdquo;</p>
    </td></tr>
  </table>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C_RE.bg};padding:20px 36px;border-top:1px solid ${C_RE.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C_RE.textDim};margin:0 0 6px">FamilyForce &middot; getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C_RE.textDim};margin:0">
    <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C_RE.terra};text-decoration:none">Stop all Scout emails</a>
  </p>
</td></tr>

</table></td></tr></table>
</body></html>`
}
