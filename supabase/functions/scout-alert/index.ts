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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { buildAlertEmail, type AlertWindow } from '../_shared/email-closing-alert.ts'

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
  const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
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
        .eq('window_type', 'milestone')
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

      // 7. Fetch parent display name
      const { data: profileData } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
      const parentName = profileData?.name?.trim() || undefined

      // 8. Build and send email
      const windowWord = windows.length === 1 ? 'window' : 'windows'
      const subject = `${child.name} turns ${monthsAtBirthday} month${monthsAtBirthday === 1 ? '' : 's'} in 7 days — ${windows.length} ${windowWord} worth doing this week`
      const html    = buildAlertEmail({
        childName:      child.name,
        parentName,
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
          reply_to: ['support@getfamilyforce.com'],
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
