// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Signup Delivery Edge Function
// Fires on new scout_subscriptions row (status = 'trialing').
// Sends: first digest email + .ics calendar event for next birthday.
//
// Deploy: supabase functions deploy scout-signup-delivery
// Trigger: Supabase DB webhook on scout_subscriptions INSERT
//   → filter: status = 'trialing'
//   → HTTP POST to this function
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateScoutIcs,
  nextMonthlyBirthday,
  ageInWeeks,
  ageInMonths,
  type IcsWindow,
} from '../_shared/ics-generator.ts'
import {
  buildDigestEmail,
  buildDigestSubject,
  type DigestWindow,
} from '../_shared/email-digest.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Window selection ────────────────────────────────────────────────────────
// Selects the top N windows for above-the-fold email content.
// Priority score (1 = highest) drives selection, with urgency as tiebreaker.
// Decision #5 (urgency weighting) is still open — using priority-only for now.
const ABOVE_FOLD_COUNT = 5

interface MilestoneWindow {
  id:                uuid
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

type uuid = string

function selectAboveFold(windows: MilestoneWindow[], ageWeeks: number): MilestoneWindow[] {
  // Sort: closing soon first (within 4 weeks), then by priority ASC
  const urgencyWeight = { clinical: 0, screening: 1, advisory: 2 }

  return [...windows].sort((a, b) => {
    const aClosing = a.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    const bClosing = b.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    if (aClosing !== bClosing) return aClosing - bClosing
    if (a.priority !== b.priority) return a.priority - b.priority
    return urgencyWeight[a.urgency] - urgencyWeight[b.urgency]
  }).slice(0, ABOVE_FOLD_COUNT)
}

// ─── Pronoun helper ───────────────────────────────────────────────────────────
// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-signup-delivery: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  const jobStart = Date.now()
  let   userId   = 'unknown'
  let   step     = 'init'

  try {
    // 1. Parse the DB webhook payload
    step = 'parse'
    const payload = await req.json()
    // Supabase DB webhook sends: { type: 'INSERT', table: 'scout_subscriptions', record: {...} }
    const record = payload.record as Record<string, unknown>
    if (!record) throw new Error('No record in payload')

    userId = record.user_id as string
    if (!userId) throw new Error('No user_id in record')

    // Only process trialing subscriptions
    if (record.status !== 'trialing') {
      return new Response(JSON.stringify({ ok: true, skipped: 'not trialing' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 2. Load user email
    step = 'load-user'
    const { data: { user }, error: userErr } = await sb.auth.admin.getUserById(userId)
    if (userErr || !user?.email) throw new Error(`Could not load user: ${userErr?.message}`)

    // 3. Load child record
    step = 'load-child'
    const { data: children, error: childErr } = await sb
      .from('children')
      .select('id, name, dob, gender')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (childErr) throw new Error(`Could not load child: ${childErr.message}`)
    if (!children || children.length === 0) throw new Error(`No child found for user ${userId}`)

    const child     = children[0]
    const childDob  = new Date(child.dob)
    const now       = new Date()
    const weeks     = ageInWeeks(childDob, now)
    const months    = ageInMonths(childDob, now)

    // 4. Check deduplication — never send two signup digests to the same child
    step = 'dedup-check'
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const { data: existing } = await sb
      .from('scout_digest_log')
      .select('id')
      .eq('child_id', child.id)
      .eq('digest_type', 'signup')
      .eq('digest_month', currentMonth)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[scout-signup-delivery] Skipping duplicate signup digest for child ${child.id}`)
      return new Response(JSON.stringify({ ok: true, skipped: 'duplicate' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // 5. Query open windows for child's age
    step = 'query-windows'
    const { data: windows, error: winErr } = await sb
      .from('milestone_windows')
      .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link')
      .eq('active', true)
      .lte('open_age_weeks', weeks)
      .gte('close_age_weeks', weeks)
      .order('priority', { ascending: true })

    if (winErr) throw new Error(`Could not query windows: ${winErr.message}`)
    if (!windows || windows.length === 0) {
      console.warn(`[scout-signup-delivery] No windows found for age ${weeks}w — sending empty digest`)
    }

    const allWindows   = (windows ?? []) as MilestoneWindow[]
    const aboveFold    = selectAboveFold(allWindows, weeks)

    // 6. Build subject line
    step = 'build-email'
    const siteUrl     = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const dashUrl     = `${siteUrl}/scout-dashboard`
    const subjectLine = buildDigestSubject(child.name, months, aboveFold, weeks)
    const closingCount = aboveFold.filter(w => w.close_age_weeks - weeks <= 4).length

    // 7. Build email HTML
    const emailHtml = buildDigestEmail({
      childName:      child.name,
      childGender:    child.gender,
      ageMonths:      months,
      aboveFold:      aboveFold as DigestWindow[],
      allWindowCount: allWindows.length,
      closingCount,
      nextEventDate:  nextMonthlyBirthday(childDob, now),
      dashboardUrl:   dashUrl,
      siteUrl,
      userId,
      digestType:     'signup',
    })

    // 8. Generate .ics attachment
    step = 'build-ics'
    const nextBirthday = nextMonthlyBirthday(childDob, now)
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

    // 9. Send via Resend
    step = 'send-email'
    const resendKey  = Deno.env.get('RESEND_API_KEY')
    const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL')  ?? 'scout@getfamilyforce.com'
    const fromName   = Deno.env.get('RESEND_FROM_NAME')   ?? 'Jack at FamilyForce'
    const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')   ?? ''

    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    // btoa() only handles Latin1 — use TextEncoder for Unicode-safe Base64
    const icsBytes  = new TextEncoder().encode(icsString)
    const icsBase64 = btoa(icsBytes.reduce((s, b) => s + String.fromCharCode(b), ''))
    const resendBody: Record<string, unknown> = {
      from:    `${fromName} <${fromEmail}>`,
      to:      [user.email],
      subject: subjectLine,
      html:    emailHtml,
      tags:    [
        { name: 'user_id',     value: userId },
        { name: 'child_id',    value: child.id },
        { name: 'digest_type', value: 'signup' },
        { name: 'month',       value: currentMonth },
      ],
      attachments: [{
        filename:    `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-month${months}.ics`,
        content:     icsBase64,
        content_type: 'text/calendar',
      }],
    }

    if (bccEmail) resendBody.bcc = [bccEmail]

    const resendRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(resendBody),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    const resendMessageId = resendData.id as string

    // 10. Log to scout_digest_log
    step = 'log-digest'
    await sb.from('scout_digest_log').insert({
      user_id:           userId,
      child_id:          child.id,
      digest_month:      currentMonth,
      child_age_months:  months,
      digest_type:       'signup',
      windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
      email_subject:     subjectLine,
      resend_message_id: resendMessageId,
    })

    // 11. Log to scout_events
    step = 'log-event'
    await sb.from('scout_events').insert({
      user_id:    userId,
      child_id:   child.id,
      event_type: 'first_digest_sent',
      properties: {
        child_age_months: months,
        child_age_weeks:  weeks,
        windows_count:    allWindows.length,
        above_fold_count: aboveFold.length,
        resend_message_id: resendMessageId,
        duration_ms:      Date.now() - jobStart,
      },
    })

    // 12. Log job success
    await sb.from('scout_events').insert({
      user_id:    userId,
      event_type: 'job_succeeded',
      properties: { job_type: 'scout-signup-delivery', duration_ms: Date.now() - jobStart },
    })

    console.log(`[scout-signup-delivery] Success for user ${userId} (${months}mo, ${weeks}w) in ${Date.now() - jobStart}ms`)

    return new Response(JSON.stringify({ ok: true, resendMessageId }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-signup-delivery] Error at step=${step}, user=${userId}:`, msg)

    // Log failure to scout_events
    try {
      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await sb.from('scout_events').insert({
        user_id:    userId === 'unknown' ? null : userId,
        event_type: 'job_failed',
        properties: {
          job_type:    'scout-signup-delivery',
          step,
          error:       msg,
          duration_ms: Date.now() - jobStart,
        },
      })
    } catch { /* log failure itself failed — move on */ }

    await telegramAlert(`Failed at step=${step} for user=${userId}: ${msg}`)

    return new Response(JSON.stringify({ ok: false, error: msg, step }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
