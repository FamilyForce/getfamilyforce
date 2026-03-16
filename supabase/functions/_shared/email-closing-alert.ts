// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Closing-Window Alert Email Template (4C)
// Shared by scout-alert edge function.
//
// Fires 7 days before child's next birthday when closing windows exist.
// Short, urgent — scannable in 10 seconds on mobile.
//
// Design:
//   - Red alarm card header with ⚠️ "Act this week"
//   - Closing window list with urgency badges + weeks left
//   - Single CTA: open dashboard
//   - Outlook VML button
// ═══════════════════════════════════════════════════════════════

export type AlertWindow = {
  title:             string
  urgency:           string
  close_age_weeks:   number
  current_age_weeks: number
}

export function buildAlertEmail(opts: {
  childName:     string
  ageMonths:     number        // age they'll turn in 7 days
  closingWindows: Array<{ title: string; urgency: string; close_age_weeks: number; current_age_weeks: number }>
  dashboardUrl:  string
  siteUrl:       string
  userId:        string
}): string {
  const { childName, ageMonths, closingWindows, dashboardUrl, siteUrl, userId } = opts

  const urgencyColors = { clinical: '#DC2626', screening: '#2563EB', advisory: '#6B7280' }
  const urgencyLabels = { clinical: 'Clinical', screening: 'Screening', advisory: 'Advisory' }

  const preheader = `${closingWindows.length} window${closingWindows.length === 1 ? '' : 's'} close when ${childName} turns ${ageMonths} months in 7 days. Here is what to do before then.`

  const windowRows = closingWindows.map(w => {
    const urgencyBg  = { clinical: '#FEE2E2', screening: '#EFF6FF', advisory: '#F5F3FF' }
    const urgencyFg  = { clinical: '#DC2626', screening: '#2563EB', advisory: '#6E4ED6' }
    const urgencyLbl = { clinical: 'Clinical', screening: 'Screening', advisory: 'Advisory' }
    const bg  = urgencyBg[w.urgency as keyof typeof urgencyBg]  ?? '#F5F3FF'
    const fg  = urgencyFg[w.urgency as keyof typeof urgencyFg]  ?? '#6E4ED6'
    const lbl = urgencyLbl[w.urgency as keyof typeof urgencyLbl] ?? 'Advisory'
    const weeksLeft  = w.close_age_weeks - w.current_age_weeks
    const borderColor = w.urgency === 'clinical' ? '#FECACA' : '#E5E2EC'

    const urgencyNote = w.urgency === 'clinical'
      ? '<p style="font-family:\'Outfit\',Arial,sans-serif;font-size:12px;color:#DC2626;font-weight:600;margin:4px 0 0">See your pediatrician if this has not happened yet.</p>'
      : w.urgency === 'screening'
      ? '<p style="font-family:\'Outfit\',Arial,sans-serif;font-size:12px;color:#2563EB;font-weight:600;margin:4px 0 0">Schedule the screening this week.</p>'
      : ''

    return `
    <tr>
      <td style="background:#FFFFFF;border:1px solid ${borderColor};border-radius:12px;padding:16px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td><span style="display:inline-block;background:${bg};color:${fg};font-family:'Outfit',Arial,sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase">${lbl} · ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left</span></td>
          </tr>
          <tr><td style="height:6px"></td></tr>
          <tr>
            <td>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;color:#1D1D1F;margin:0">${w.title}</p>
              ${urgencyNote}
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:8px"></td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${childName} turns ${ageMonths} months in 7 days</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}
  </style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">

  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr>
      <td align="center" style="padding:24px 12px 40px">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <!-- Wordmark -->
          <tr>
            <td style="padding:0 0 16px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p></td>
                  <td align="right"><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">7-day alert</p></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero — alarm card -->
          <tr>
            <td style="background:#FFF5F5;border:1.5px solid #FECACA;border-radius:16px;padding:24px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#DC2626;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">⚠️ Act this week</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">${childName} turns ${ageMonths} months in 7 days.</h1>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">${closingWindows.length} developmental window${closingWindows.length === 1 ? '' : 's'} close${closingWindows.length === 1 ? 's' : ''} this month. Once a window closes, it is gone.</p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          <!-- Closing windows -->
          <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 12px">Closing this month</p></td></tr>
          ${windowRows}
          <tr><td style="height:8px"></td></tr>

          <!-- CTA -->
          <tr>
            <td align="center">
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                href="${dashboardUrl}"
                style="height:44px;v-text-anchor:middle;width:280px;" arcsize="50%"
                stroke="f" fillcolor="#6E4ED6">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;">See what to do for each window →</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;text-decoration:none;mso-hide:all">
                See what to do for each window →
              </a>
              <!--<![endif]-->
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;text-align:center;margin:12px 0 0">Your ${ageMonths}-month digest arrives in 7 days on ${childName}'s birthday.</p>
            </td>
          </tr>
          <tr><td style="height:32px"></td></tr>

          <!-- Signature -->
          <tr>
            <td>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">Dad of two · Founder, FamilyForce</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6;font-style:italic">Got it wrong with First Son. Got it right with Second Son. Make informed parenting decisions.</p>
            </td>
          </tr>
          <tr><td style="height:32px"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #E5E2EC;padding-top:20px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0 0 4px">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0"><a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A;text-decoration:none">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

