// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — 7-Day Closing Window Alert
// Short, urgent email. Fires 7 days before the child's next birthday.
// Lists only the windows that are about to close.
//
// Deploy: supabase functions deploy scout-alert
// Schedule: daily 08:00 UTC via pg_cron (see supabase/cron/scout-cron.sql)
//
// Who gets it: status = 'trialing' OR 'active', not cancelled/expired
// Dedup: scout_digest_log digest_type = 'alert', digest_month = YYYY-MM
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

// ─── Next monthly birthday from a given date ──────────────────────────────────
// Returns the next date that matches the child's birth day of month.
function nextMonthlyBirthday(dob: Date, fromDate: Date): Date {
  const birthDay = dob.getUTCDate()
  let year  = fromDate.getUTCFullYear()
  let month = fromDate.getUTCMonth()

  for (let attempt = 0; attempt < 24; attempt++) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const day         = Math.min(birthDay, daysInMonth)
    const candidate   = new Date(Date.UTC(year, month, day))
    if (candidate > fromDate) return candidate
    month++
    if (month > 11) { month = 0; year++ }
  }
  return new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, birthDay))
}

// ─── Is a date exactly N days from now? ──────────────────────────────────────
function isDaysAway(targetDate: Date, fromDate: Date, days: number): boolean {
  const targetDay = Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate())
  const fromDay   = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate())
  const diff      = Math.round((targetDay - fromDay) / (24 * 60 * 60 * 1000))
  return diff === days
}

// ─── Build alert email HTML ───────────────────────────────────────────────────
function buildAlertEmail(opts: {
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

// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: `🚨 scout-alert: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const jobStart = Date.now()
  const now      = new Date()

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey = Deno.env.get('RESEND_API_KEY')!
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'
  const bccEmail  = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
  const siteUrl   = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
  const dashUrl   = `${siteUrl}/scout-dashboard`

  const results = { sent: 0, skipped: 0, no_windows: 0, errors: 0 }

  console.log(`[scout-alert] Starting — ${now.toISOString()}`)

  // 1. Load all active + trialing subscriptions
  const { data: subs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, status')
    .in('status', ['active', 'trialing'])

  if (subErr) {
    await telegramAlert(`Failed to query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  console.log(`[scout-alert] ${subs?.length ?? 0} active/trialing subscriptions`)

  for (const sub of (subs ?? [])) {
    try {
      const userId = sub.user_id

      // 2. Load child
      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')

      // 3. Check: is the child's next birthday exactly 7 days from today?
      const nextBirthday = nextMonthlyBirthday(childDob, now)
      if (!isDaysAway(nextBirthday, now, 7)) { results.skipped++; continue }

      // Child's age IN 7 days (at the birthday)
      const weeksAtBirthday  = ageInWeeks(childDob, nextBirthday)
      const monthsAtBirthday = ageInMonths(childDob, nextBirthday)
      const currentWeeks     = ageInWeeks(childDob, now)

      // Skip if past 36 months
      if (monthsAtBirthday > 36) { results.skipped++; continue }

      // 4. Dedup check — one alert per child per month
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('user_id', userId)
        .eq('digest_type', 'alert')
        .eq('digest_month', currentMonth)
        .limit(1)
        .maybeSingle()

      if (existing) { results.skipped++; continue }

      // 5. Find windows closing within 2 weeks of the birthday
      //    (close_age_weeks <= weeksAtBirthday + 1)
      const { data: windows } = await sb
        .from('milestone_windows')
        .select('id, slug, title, urgency, close_age_weeks')
        .eq('active', true)
        .lte('open_age_weeks', currentWeeks)
        .lte('close_age_weeks', weeksAtBirthday + 1)
        .gte('close_age_weeks', currentWeeks)       // still open right now
        .order('urgency', { ascending: false })      // clinical first
        .order('close_age_weeks', { ascending: true })

      if (!windows?.length) { results.no_windows++; continue }

      // Annotate with current age for weeks-left calculation
      const annotated = windows.map(w => ({ ...w, current_age_weeks: currentWeeks }))

      // 6. Load user email
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.skipped++; continue }

      // 7. Build and send email
      const subject = `${child.name} turns ${monthsAtBirthday} months in 7 days. ${windows.length} window${windows.length === 1 ? '' : 's'} closing.`
      const html    = buildAlertEmail({
        childName:      child.name,
        ageMonths:      monthsAtBirthday,
        closingWindows: annotated,
        dashboardUrl:   dashUrl,
        siteUrl,
        userId,
      })

      const resendRes = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          from:    `${fromName} <${fromEmail}>`,
          to:      [user.email],
          ...(bccEmail ? { bcc: [bccEmail] } : {}),
          subject,
          html,
          tags:    [
            { name: 'user_id',     value: userId },
            { name: 'child_id',    value: child.id },
            { name: 'digest_type', value: 'alert' },
            { name: 'month',       value: currentMonth },
          ],
        }),
      })

      const resendData = await resendRes.json()
      if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
      const messageId = resendData.id as string

      // 8. Log to scout_digest_log
      await sb.from('scout_digest_log').insert({
        user_id:           userId,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  monthsAtBirthday,
        digest_type:       'alert',
        windows_included:  annotated.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency })),
        email_subject:     subject,
        resend_message_id: messageId,
      })

      // 9. Log to scout_events
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'alert_sent',
        properties: {
          months_at_birthday:  monthsAtBirthday,
          weeks_at_birthday:   weeksAtBirthday,
          closing_windows:     windows.length,
          messageId,
        },
      })

      results.sent++
      console.log(`[scout-alert] Alert sent for user ${userId} — ${child.name} turns ${monthsAtBirthday}mo in 7 days, ${windows.length} closing window(s)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-alert] Error for user ${sub.user_id}:`, msg)
      await telegramAlert(`Alert failed for user ${sub.user_id}: ${msg}`)
      results.errors++
    }
  }

  const duration = Date.now() - jobStart
  console.log(`[scout-alert] Done in ${duration}ms`, results)

  if (results.errors > 0) {
    await telegramAlert(`Done with ${results.errors} error(s). Sent: ${results.sent}, skipped: ${results.skipped}, no windows: ${results.no_windows}`)
  }

  return new Response(JSON.stringify({ ok: true, results, duration_ms: duration }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
