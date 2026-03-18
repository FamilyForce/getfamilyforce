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
export function buildTrialEndEmail(opts: {
  childName:       string
  childGender:     string | null
  ageMonths:       number
  weeksSinceJoin:  number
  allWindowCount:  number
  topWindows:      Array<{ title: string; why_it_matters: string; urgency: string }>
  annualCta:       string
  monthlyCta:      string
  siteUrl:         string
  userId:          string
}): string {
  const { childName, childGender, ageMonths, weeksSinceJoin, allWindowCount,
          topWindows, annualCta, monthlyCta, siteUrl, userId } = opts

  // Edge case: vary "you signed up X weeks ago" copy
  let joinCopy: string
  if (weeksSinceJoin <= 1) {
    joinCopy = 'You signed up last week.'
  } else if (weeksSinceJoin <= 4) {
    joinCopy = `You signed up ${weeksSinceJoin} weeks ago.`
  } else {
    joinCopy = `You signed up ${weeksSinceJoin} weeks ago.`
  }

  // Annual birthday variant (month 12)
  const isFirstBirthday = ageMonths === 12
  const openingLine = isFirstBirthday
    ? `<strong>${childName} is one year old today.</strong><br>That is worth saying twice.`
    : `<strong>${childName} is ${ageMonths} months old today.</strong>`

  const windowRows = topWindows.map(w => {
    const urgencyBg    = w.urgency === 'clinical' ? '#FEE2E2' : w.urgency === 'screening' ? '#EFF6FF' : '#F5F3FF'
    const urgencyFg    = w.urgency === 'clinical' ? '#DC2626' : w.urgency === 'screening' ? '#2563EB' : '#6E4ED6'
    const urgencyLabel = w.urgency === 'clinical' ? 'Clinical' : w.urgency === 'screening' ? 'Screening' : 'Advisory'
    const borderColor  = w.urgency === 'clinical' ? '#FECACA' : '#E5E2EC'
    return `
    <tr>
      <td style="background:#FFFFFF;border:1px solid ${borderColor};border-radius:12px;padding:18px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td><span style="display:inline-block;background:${urgencyBg};color:${urgencyFg};font-family:'Outfit',Arial,sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase">${urgencyLabel}</span></td></tr>
          <tr><td style="height:8px"></td></tr>
          <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;color:#1D1D1F;margin:0 0 6px">${w.title}</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">${w.why_it_matters}</p></td></tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:10px"></td></tr>`
  }).join('')

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  })

  const preheader = isFirstBirthday
    ? `${childName} turns 1 today. Your free trial ends today. Here is what is open right now.`
    : `${childName} turns ${ageMonths} months today. Your free trial ends today. Here is what is open right now.`

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${childName} turns ${ageMonths} months — your Scout trial ends today</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}
  </style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">

  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr>
      <td align="center" style="padding:24px 12px 40px">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <tr><td style="padding:0 0 16px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p></td></tr>

          <tr>
            <td style="background:#FFFFFF;border-radius:16px;padding:28px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">${todayStr}</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">${openingLine}</h1>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#5C5960;margin:0;line-height:1.6">Your free trial ends today.</p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          <tr>
            <td style="background:#EDE9FF;border-radius:16px;padding:20px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#3D2A9E;margin:0;line-height:1.8">${joinCopy} As part of your trial, you received <strong>one digest email</strong> and <strong>one calendar event</strong> for ${childName}'s first month. There are <strong>${allWindowCount} windows open this month</strong> — and a new digest ready to go.<br><br><strong>Your free trial ends today.</strong></p>
            </td>
          </tr>
          <tr><td style="height:16px"></td></tr>

          <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px">What is open right now for ${childName}</p></td></tr>

          ${windowRows}

          <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 24px;line-height:1.6">These windows do not wait. Neither does the next digest.</p></td></tr>

          <!-- Social proof -->
          <tr>
            <td style="background:#F9F8FD;border-radius:14px;padding:20px;margin-bottom:16px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td>
                  <p style="font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#1D1D1F;margin:0 0 10px;line-height:1.7;font-style:italic">"I had no idea there was a window for introducing allergens this early. Scout caught it at 5 months. Our pediatrician said we got it exactly right."</p>
                  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">— Sarah M., mom of two · Scout subscriber since month 4</p>
                </td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:16px"></td></tr>

          <tr><td>
            <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#1D1D1F;margin:0 0 10px">Subscribe to keep going.</h2>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.7">Scout delivers one email and one calendar event every month, on ${childName}'s birthday. The right information at the right time.</p>
          </td></tr>

          <!-- Annual plan -->
          <tr>
            <td style="background:#6E4ED6;border-radius:16px;padding:24px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td><span style="display:inline-block;background:rgba(255,255,255,.2);color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase">Best value</span></td></tr>
                <tr><td style="height:10px"></td></tr>
                <tr><td>
                  <p style="font-family:'Outfit',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin:0 0 4px">Annual — ${PRICE_ANNUAL_DISPLAY}</p>
                  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.8);margin:0 0 20px">That is ${PRICE_ANNUAL_MONTHLY}. Covers ${childName} from today through age 3. One payment.</p>
                </td></tr>
                <tr><td>
                  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${annualCta}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#FFFFFF"><w:anchorlock/><center style="color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;">Continue with Annual →</center></v:roundrect><![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${annualCta}" style="display:block;text-align:center;background:#FFFFFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px;border-radius:100px;text-decoration:none;mso-hide:all">Continue with Annual →</a>
                  <!--<![endif]-->
                </td></tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:10px"></td></tr>

          <!-- Monthly plan -->
          <tr>
            <td style="background:#FFFFFF;border:1.5px solid #E5E2EC;border-radius:16px;padding:20px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:18px;font-weight:700;color:#1D1D1F;margin:0 0 4px">Monthly — ${PRICE_MONTHLY_DISPLAY}</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 16px">Cancel any time. No commitment.</p>
              <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${monthlyCta}" style="height:40px;v-text-anchor:middle;width:220px;" arcsize="50%" stroke="t" strokecolor="#C4B5FD" fillcolor="#F0EBFF"><w:anchorlock/><center style="color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:600;">Monthly instead →</center></v:roundrect><![endif]-->
              <!--[if !mso]><!-->
              <a href="${monthlyCta}" style="display:block;text-align:center;background:#F0EBFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:600;padding:12px;border-radius:100px;text-decoration:none;mso-hide:all">Monthly instead →</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr><td style="height:20px"></td></tr>

          <!-- What you get -->
          <tr>
            <td style="border-left:3px solid #6E4ED6;padding:14px 16px;background:#F9F8FD;border-radius:0 8px 8px 0">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#3D2A9E;margin:0 0 10px">Every month on ${childName}'s birthday:</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 6px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">· One digest with the 3 to 5 windows most relevant to ${childName}'s age</p></td></tr>
                <tr><td style="padding:0 0 6px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">· One calendar event on the next birthday with a 7-day alarm</p></td></tr>
                <tr><td style="padding:0 0 6px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">· Missed window guidance if a window has already closed</p></td></tr>
                <tr><td style="padding:0"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">· Free FamilyForce Playbooks on sleep, feeding, potty training, and more</p></td></tr>
              </table>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:12px 0 0">No credit card was required to start. No trial was auto-renewed. This is a one-time decision.</p>
            </td>
          </tr>
          <tr><td style="height:24px"></td></tr>

          <tr><td>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 12px;line-height:1.7">If you decide not to continue, you will not receive another Scout email. The calendar events already in your calendar will stay there. The windows already delivered are yours to keep.</p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.7">No hard feelings. This stuff matters whether you subscribe or not.</p>
          </td></tr>
          <tr><td style="height:32px"></td></tr>

          <tr><td>
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">Dad of two · Founder, FamilyForce</p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6;font-style:italic">Got it wrong with First Son. Got it right with Second Son. Make informed parenting decisions.</p>
          </td></tr>
          <tr><td style="height:32px"></td></tr>

          <tr>
            <td style="border-top:1px solid #E5E2EC;padding-top:20px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0 0 4px">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0"><a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A;text-decoration:none">Stop receiving Scout emails</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

// ─── Build re-engagement email HTML ───────────────────────────────────────────

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
