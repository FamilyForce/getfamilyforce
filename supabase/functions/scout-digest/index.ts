// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Monthly Digest Edge Function
// Runs daily at 08:00 UTC. Fires for each paid subscriber whose
// child's birth day of month matches today's date.
//
// Deploy: supabase functions deploy scout-digest
// Schedule: daily 08:00 UTC via pg_cron (see supabase/cron/scout-cron.sql)
//
// Who gets it: status = 'active' only (paid subscribers)
// Dedup: scout_digest_log digest_type = 'monthly', digest_month = YYYY-MM
//
// Birthday edge cases handled:
//   - 29th/30th/31st born: fires on last day of month when month is shorter
//   - Feb 29 born: fires on Feb 28 in non-leap years
//   - Timezone: v1 uses UTC date; TODO store user timezone at signup for v1.1
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateScoutIcs,
  nextMonthlyBirthday,
  ageInWeeks,
  ageInMonths,
  type IcsWindow,
} from '../_shared/ics-generator.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface MilestoneWindow {
  id:                string
  slug:              string
  title:             string
  category:          string
  urgency:           'advisory' | 'screening' | 'clinical'
  open_age_weeks:    number
  peak_age_weeks:    number | null
  close_age_weeks:   number
  priority:          number
  why_it_matters:    string
  what_to_do:        string
  what_not_to_worry: string | null
  missed_window:     string | null
  playbook_link:     string | null
}

// ─── Birthday check ───────────────────────────────────────────────────────────
// Returns true if the child's monthly birthday falls on today (UTC).
// Handles short months: if birth day = 31 and today is the last day of a 30-day month → fires.
// Handles Feb 29 births: fires on Feb 28 in non-leap years.
function isBirthdayToday(dob: Date, today: Date): boolean {
  const birthDay    = dob.getUTCDate()
  const todayDay    = today.getUTCDate()
  const todayMonth  = today.getUTCMonth()
  const todayYear   = today.getUTCFullYear()

  // Days in today's month
  const daysInTodayMonth = new Date(Date.UTC(todayYear, todayMonth + 1, 0)).getUTCDate()

  // The effective birthday in the current month
  const effectiveBirthDay = Math.min(birthDay, daysInTodayMonth)

  return todayDay === effectiveBirthDay
}

// ─── Window selection — top N by closing urgency then priority ─────────────────
const ABOVE_FOLD_COUNT = 5

function selectAboveFold(windows: MilestoneWindow[], ageWeeks: number): MilestoneWindow[] {
  const urgencyWeight = { clinical: 0, screening: 1, advisory: 2 }
  return [...windows].sort((a, b) => {
    const aClosing = a.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    const bClosing = b.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    if (aClosing !== bClosing) return aClosing - bClosing
    if (a.priority !== b.priority) return a.priority - b.priority
    return (urgencyWeight[a.urgency] ?? 2) - (urgencyWeight[b.urgency] ?? 2)
  }).slice(0, ABOVE_FOLD_COUNT)
}

// ─── Subject line ─────────────────────────────────────────────────────────────
function buildSubjectLine(childName: string, ageMonths: number, aboveFold: MilestoneWindow[], ageWeeks: number): string {
  const closing = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  if (closing.length > 0) {
    const weeksLeft = closing[0].close_age_weeks - ageWeeks
    return `${childName} turns ${ageMonths} months — ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left on ${closing[0].title.toLowerCase()}`
  }
  return `${childName} turns ${ageMonths} months today. Here is what is open.`
}

// ─── Email HTML ───────────────────────────────────────────────────────────────
function buildDigestEmail(opts: {
  childName:        string
  childGender:      string | null
  ageMonths:        number
  aboveFold:        MilestoneWindow[]
  allWindowCount:   number
  completedWindows: Array<{ title: string }>   // 3I: "what you've done" section
  nextEventDate:    Date
  dashboardUrl:     string
  siteUrl:          string
  userId:           string
}): string {
  const { childName, ageMonths, aboveFold, allWindowCount, completedWindows,
          nextEventDate, dashboardUrl, siteUrl, userId } = opts

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })

  const urgencyColors = { clinical: '#DC2626', screening: '#2563EB', advisory: '#6B7280' }
  const urgencyLabels = { clinical: 'Clinical', screening: 'Screening', advisory: 'Advisory' }

  const windowRows = aboveFold.map(w => {
    const ageWeeks  = Math.round((w.open_age_weeks + w.close_age_weeks) / 2)
    const isClosing = w.close_age_weeks - ageWeeks <= 4
    const color     = urgencyColors[w.urgency] ?? urgencyColors.advisory
    const label     = urgencyLabels[w.urgency] ?? 'Advisory'

    const playbook = w.playbook_link
      ? `<p style="margin:8px 0 0;font-size:13px;color:#6E4ED6">Free guide: <a href="https://${w.playbook_link}" style="color:#6E4ED6">${w.playbook_link.split('/').pop()?.replace(/-/g, ' ')}</a> →</p>`
      : ''

    return `
    <tr>
      <td style="background:#FFFFFF;border:1px solid #E5E2EC;border-radius:12px;padding:20px;margin-bottom:12px;display:block">
        <span style="display:inline-block;background:${color}1A;color:${color};font-size:11px;font-weight:600;padding:2px 8px;border-radius:100px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px">${label}${isClosing ? ' · Closing soon' : ''}</span>
        <h3 style="font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:600;color:#1D1D1F;margin:0 0 8px">${w.title}</h3>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">${w.why_it_matters.split('. ').slice(0, 2).join('. ')}.</p>
        ${playbook}
        <p style="margin:12px 0 0"><a href="${dashboardUrl}" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#6E4ED6;font-weight:500">Read what to do →</a></p>
      </td>
    </tr>
    <tr><td style="height:12px"></td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${childName} turns ${ageMonths} months</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:'Outfit',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-size:13px;color:#8A879A;margin:0 0 8px">FamilyForce Scout</p>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1D1D1F;margin:0 0 8px;line-height:1.3">${childName} turns ${ageMonths} months today.</h1>
        <p style="font-size:15px;color:#5C5960;margin:0">${allWindowCount} developmental windows are open right now. Here are the ${aboveFold.length} you need to know about this month.</p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    ${windowRows}
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td style="text-align:center;padding:20px;background:#F0EBFF;border-radius:12px">
        <p style="font-size:14px;color:#5C5960;margin:0 0 12px">${allWindowCount - aboveFold.length} more windows are open this month.</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:600;padding:12px 28px;border-radius:100px;text-decoration:none">See all ${childName}'s windows →</a>
      </td>
    </tr>
  </table>

  ${completedWindows.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td style="background:#F0FDF4;border-radius:12px;padding:18px">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;color:#166534;letter-spacing:.06em;text-transform:uppercase;margin:0 0 10px">What you marked done last month</p>
        ${completedWindows.map(w => `
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#166534;margin:0 0 6px">
          ✅ ${w.title}
        </p>`).join('')}
      </td>
    </tr>
  </table>` : ''}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td style="border-left:3px solid #6E4ED6;padding:12px 16px;background:#F9F8FD">
        <p style="font-size:14px;color:#5C5960;margin:0;line-height:1.6">📅 A calendar event for ${nextMonthName} is attached. Accept it and a 7-day alarm will fire before ${childName}'s next windows close.</p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-size:15px;color:#1D1D1F;margin:0 0 4px">Jack</p>
        <p style="font-size:13px;color:#8A879A;margin:0">FamilyForce</p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-top:1px solid #E5E2EC;padding-top:20px">
        <p style="font-size:12px;color:#8A879A;margin:0 0 4px">FamilyForce · <a href="${siteUrl}" style="color:#8A879A">${siteUrl.replace('https://', '')}</a></p>
        <p style="font-size:12px;color:#8A879A;margin:0">
          <a href="${siteUrl}/scout-dashboard/settings" style="color:#8A879A">Manage preferences</a>
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-digest: ${message}` }),
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

  const results = { sent: 0, skipped: 0, not_birthday: 0, errors: 0 }

  console.log(`[scout-digest] Starting — ${now.toISOString()}`)

  // 1. Load all active subscriptions
  const { data: subs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, created_at')
    .eq('status', 'active')

  if (subErr) {
    await telegramAlert(`Failed to query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  console.log(`[scout-digest] ${subs?.length ?? 0} active subscriptions to check`)

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

      // 3. Birthday check — is today this child's birth day of month?
      if (!isBirthdayToday(childDob, now)) { results.not_birthday++; continue }

      const weeks  = ageInWeeks(childDob, now)
      const months = ageInMonths(childDob, now)

      // Skip if past 36 months — no more windows
      if (months > 36) { results.skipped++; continue }

      // 4. Dedup check
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('child_id', child.id)
        .eq('digest_type', 'monthly')
        .eq('digest_month', currentMonth)
        .limit(1)
        .maybeSingle()

      if (existing) {
        console.log(`[scout-digest] Skipping duplicate for child ${child.id} (${currentMonth})`)
        results.skipped++
        continue
      }

      // 5. Query open windows for this age
      const { data: windows, error: winErr } = await sb
        .from('milestone_windows')
        .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })

      if (winErr) throw new Error(`Window query failed: ${winErr.message}`)

      // 3I — Active track: fetch user's completed windows for this child
      const { data: progressRows } = await sb
        .from('window_progress')
        .select('window_id, status')
        .eq('user_id', userId)
        .eq('child_id', child.id)
        .in('status', ['completed', 'skipped'])

      const completedWindowIds = new Set(
        (progressRows ?? [])
          .filter(p => p.status === 'completed' || p.status === 'skipped')
          .map(p => p.window_id)
      )

      // 3I — "What you've done" section: completed windows from last month
      const completedWindows = (windows ?? [])
        .filter(w => completedWindowIds.has(w.id))
        .map(w => ({ title: w.title }))

      const isActiveTrack = completedWindowIds.size > 0

      // 3I — Exclude completed/skipped from above-fold selection
      const allWindows = (windows ?? []) as MilestoneWindow[]
      const openWindows = allWindows.filter(w => !completedWindowIds.has(w.id))
      const aboveFold  = selectAboveFold(openWindows.length > 0 ? openWindows : allWindows, weeks)

      if (allWindows.length === 0) {
        console.log(`[scout-digest] No windows for child ${child.id} at ${weeks}w — skipping`)
        results.skipped++
        continue
      }

      // 6. Build subject line
      const subjectLine = buildSubjectLine(child.name, months, aboveFold, weeks)

      // 7. Build email HTML
      const nextBirthday = nextMonthlyBirthday(childDob, now)
      const html = buildDigestEmail({
        childName:        child.name,
        childGender:      child.gender,
        ageMonths:        months,
        aboveFold,
        allWindowCount:   openWindows.length > 0 ? openWindows.length : allWindows.length,
        completedWindows,
        nextEventDate:    nextBirthday,
        dashboardUrl:     dashUrl,
        siteUrl,
        userId,
      })

      // 8. Generate .ics for next birthday
      const nextMonths   = ageInMonths(childDob, nextBirthday)
      const icsWindows: IcsWindow[] = allWindows.map(w => ({
        slug:              w.slug,
        title:             w.title,
        urgency:           w.urgency,
        close_age_weeks:   w.close_age_weeks,
        current_age_weeks: weeks,
      }))

      const icsString = generateScoutIcs({
        childId:      child.id,
        childName:    child.name,
        ageMonths:    nextMonths,
        eventDate:    nextBirthday,
        windows:      icsWindows,
        dashboardUrl: dashUrl,
        siteUrl,
      })

      // 9. Load user email
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.skipped++; continue }

      // 10. Send via Resend
      const resendBody: Record<string, unknown> = {
        from:    `${fromName} <${fromEmail}>`,
        to:      [user.email],
        subject: subjectLine,
        html,
        tags:    [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'monthly' },
          { name: 'month',       value: currentMonth },
        ],
        attachments: [{
          filename:     `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-month${months}.ics`,
          content:      btoa(icsString),
          content_type: 'text/calendar',
        }],
      }
      if (bccEmail) resendBody.bcc = [bccEmail]

      const resendRes  = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(resendBody),
      })
      const resendData = await resendRes.json()
      if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
      const messageId = resendData.id as string

      // 11. Log to scout_digest_log
      await sb.from('scout_digest_log').insert({
        user_id:           userId,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  months,
        digest_type:       'monthly',
        windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
        email_subject:     subjectLine,
        resend_message_id: messageId,
      })

      // 12. Log to scout_events
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'monthly_digest_sent',
        properties: {
          child_age_months:     months,
          child_age_weeks:      weeks,
          windows_count:        allWindows.length,
          above_fold_count:     aboveFold.length,
          completed_count:      completedWindows.length,
          personalisation_track: isActiveTrack ? 'active' : 'passive',
          resend_message_id:    messageId,
          duration_ms:          Date.now() - jobStart,
        },
      })

      results.sent++
      console.log(`[scout-digest] Sent monthly digest for ${child.name} (user ${userId}, ${months}mo, ${weeks}w)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-digest] Error for user ${sub.user_id}:`, msg)
      await telegramAlert(`Monthly digest failed for user ${sub.user_id}: ${msg}`)
      results.errors++
    }
  }

  // ─── Job summary ──────────────────────────────────────────────────────────
  const duration = Date.now() - jobStart
  console.log(`[scout-digest] Done in ${duration}ms`, results)

  // Only alert if there were actual errors (not_birthday skips are normal)
  if (results.errors > 0) {
    await telegramAlert(`Done with ${results.errors} error(s). Sent: ${results.sent}, skipped: ${results.skipped}, non-birthday: ${results.not_birthday}`)
  }

  return new Response(JSON.stringify({ ok: true, results, duration_ms: duration }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
