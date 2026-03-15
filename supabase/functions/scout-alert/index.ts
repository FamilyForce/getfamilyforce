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

  const windowRows = closingWindows.map(w => {
    const color = urgencyColors[w.urgency as keyof typeof urgencyColors] ?? urgencyColors.advisory
    const label = urgencyLabels[w.urgency as keyof typeof urgencyLabels] ?? 'Advisory'
    const weeksLeft = w.close_age_weeks - w.current_age_weeks
    const urgencyNote = w.urgency === 'clinical'
      ? ' — see your pediatrician if this has not happened yet'
      : w.urgency === 'screening'
      ? ' — schedule the screening this week'
      : ''

    return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #F0EDF9">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display:inline-block;background:${color}1A;color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:5px">${label}</span>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:600;color:#1D1D1F;margin:0 0 3px">${w.title}</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0">${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left${urgencyNote}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${childName} turns ${ageMonths} months in 7 days</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:'Outfit',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
    <tr>
      <td>
        <p style="font-size:13px;color:#8A879A;margin:0 0 8px">FamilyForce Scout — 7-day alert</p>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1D1D1F;margin:0;line-height:1.3">
          ${childName} turns ${ageMonths} months in 7 days.
        </h1>
      </td>
    </tr>
  </table>

  <!-- Alert summary -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
    <tr>
      <td style="background:#FEF3C7;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:14px 16px">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#92400E;margin:0;font-weight:500">
          ${closingWindows.length} developmental window${closingWindows.length === 1 ? '' : 's'} close${closingWindows.length === 1 ? 's' : ''} this month.
          Once the window closes, it is gone.
        </p>
      </td>
    </tr>
  </table>

  <!-- Closing windows list -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    ${windowRows}
  </table>

  <!-- CTA -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td style="text-align:center">
        <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 32px;border-radius:100px;text-decoration:none">
          See what to do for each window →
        </a>
        <p style="font-size:12px;color:#8A879A;margin:12px 0 0">
          Your ${ageMonths}-month digest arrives in 7 days on ${childName}'s birthday.
        </p>
      </td>
    </tr>
  </table>

  <!-- Signature -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td>
        <p style="font-size:15px;color:#1D1D1F;margin:0 0 2px">Jack</p>
        <p style="font-size:13px;color:#8A879A;margin:0">FamilyForce</p>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-top:1px solid #E5E2EC;padding-top:16px">
        <p style="font-size:12px;color:#8A879A;margin:0">
          FamilyForce · <a href="${siteUrl}" style="color:#8A879A">${siteUrl.replace('https://', '')}</a>
          · <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>

</div>
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
