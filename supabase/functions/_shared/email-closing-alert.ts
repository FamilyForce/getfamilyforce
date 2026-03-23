// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Closing-Window Alert Email Template (4C) v2
// Shared by scout-alert edge function.
//
// Fires 7 days before child's next birthday when closing windows exist.
// Short, warm — one window card + soft "digest lands next week" close.
//
// Design v2:
//   - Dark indigo header (matches digest + pre-birth welcome)
//   - Amber "Heads up:" banner (no red, no fear triggers)
//   - Window card(s) with "The move" action boxes
//   - Single CTA: "Open Scout →"
//   - Jack's blockquote signature
// ═══════════════════════════════════════════════════════════════

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F5FF', surface: '#FFFFFF', border: '#E5E2EC',
  text: '#1D1D1F', textMid: '#5C5960', textDim: '#8A879A',
  terra: '#6E4ED6', terraTint: '#F0EBFF', indigoDeep: '#1E1248',
  amber: '#B45309', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
}

export type AlertWindow = {
  title:             string
  urgency:           string
  why_it_matters?:   string
  what_to_do?:       string
  close_age_weeks:   number
  current_age_weeks: number
}

export function buildAlertEmail(opts: {
  childName:      string
  parentName?:    string
  ageMonths:      number        // age they'll turn in 7 days
  closingWindows: AlertWindow[]
  dashboardUrl:   string
  siteUrl:        string
  userId:         string
}): string {
  const { childName, parentName, ageMonths, closingWindows, dashboardUrl, siteUrl, userId } = opts

  const greeting  = parentName ? `Hi ${parentName},` : 'Hi there,'
  const windowCount = closingWindows.length
  const subCount  = `${windowCount} window${windowCount === 1 ? '' : 's'} closing`

  const preheader = `${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'} in 7 days. ${windowCount} window${windowCount === 1 ? '' : 's'} ${windowCount === 1 ? 'is' : 'are'} worth doing this week.`

  const windowCards = closingWindows.map(w => {
    const weeksLeft   = w.close_age_weeks - w.current_age_weeks
    const badgeLabel  = `${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left`
    const borderColor = w.urgency === 'clinical' ? C.amberBorder : C.border
    const bodyText    = w.why_it_matters
      ? w.why_it_matters.replace(/([.!?])\s+/g, '$1|||').split('|||').slice(0, 2).join(' ').trim()
      : `This window closes when ${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'}.`
    const move = w.what_to_do
      ? w.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim()
      : `Check this window in your Scout dashboard before ${childName}'s birthday next week.`

    // Clinical windows get a stronger nudge in "The move"
    const clinicalNote = w.urgency === 'clinical'
      ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:${C.amber};font-weight:600;margin:10px 0 0;line-height:1.5">If this hasn't happened yet, mention it at your next pediatrician visit.</p>`
      : ''

    return `
    <tr><td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${borderColor};border-radius:14px">
        <tr><td style="padding:20px 22px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:8px">
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3">${w.title}
                <span style="display:inline-block;background:${C.amberBg};color:${C.amber};border:1px solid ${C.amberBorder};font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;margin-left:8px">${badgeLabel}</span>
              </p>
            </td></tr>
            <tr><td style="padding-bottom:14px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${bodyText}</p></td></tr>
            <tr><td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
                <tr><td style="padding:12px 16px">
                  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${move}</p>
                </td></tr>
              </table>
              ${clinicalNote}
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
  <title>${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'} in 7 days</title>
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
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'} in 7 days.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">${subCount} &nbsp;&middot;&nbsp; digest arrives next week</p>
</td></tr>

<!-- BODY -->
<tr><td class="email-body" style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Greeting -->
<tr><td style="padding-bottom:24px;border-bottom:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 14px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">${childName}'s ${ageMonths}-month digest arrives next week. Before it does, ${windowCount === 1 ? 'there\'s one window' : `there are ${windowCount} windows`} worth doing this week.</p>
</td></tr>
<tr><td style="padding-bottom:16px"></td></tr>

<!-- Heads up banner -->
<tr><td style="padding-bottom:8px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.amberBg};border:1px solid ${C.amberBorder};border-radius:10px">
    <tr><td style="padding:12px 16px">
      <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.amber};margin:0;line-height:1.6">
        <strong>Heads up:</strong> ${windowCount === 1 ? 'This window closes' : 'These windows close'} when ${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'}. Worth a head start before the digest lands.
      </p>
    </td></tr>
  </table>
</td></tr>
<tr><td style="padding-bottom:8px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.amber};margin:0">Closing this month</p></td></tr>

${windowCards}

<!-- CTA -->
<tr><td style="padding-top:8px;padding-bottom:32px;text-align:center">
  <a href="${dashboardUrl}" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 32px;border-radius:100px;text-decoration:none">Open Scout &rarr;</a>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};text-align:center;margin:12px 0 0">Your full ${ageMonths}-month digest arrives on ${childName}'s birthday.</p>
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
    You're receiving this as a Scout subscriber.
    &nbsp;<a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a>
  </p>
</td></tr>

</table></td></tr></table>
</body></html>`
}
