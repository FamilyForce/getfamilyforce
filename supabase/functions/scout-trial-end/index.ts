// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial End Edge Function
// The single most important email Scout sends.
// Fires daily at 08:00 UTC via Supabase pg_cron.
//
// Runs two jobs per invocation:
//   Job A: trial-end email (trial_end <= today, status = trialing)
//   Job B: re-engagement email (trial_end <= 30 days ago, never re-engaged)
//
// Deploy: supabase functions deploy scout-trial-end
// Schedule: see supabase/cron/scout-cron.sql
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          STRIPE_SECRET_KEY, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import {
  buildTrialEndEmail,
  buildReengagementEmail,
} from '../_shared/email-trial-end.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Pricing — set via Supabase secrets; these are fallback defaults
// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-trial-end: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Send one email via Resend ────────────────────────────────────────────────
async function sendEmail(opts: {
  to:          string
  subject:     string
  html:        string
  tags:        Array<{ name: string; value: string }>
  resendKey:   string
  fromEmail:   string
  fromName:    string
  bccEmail:    string
}): Promise<string> {
  const body: Record<string, unknown> = {
    from:    `${opts.fromName} <${opts.fromEmail}>`,
    to:      [opts.to],
    subject: opts.subject,
    html:    opts.html,
    tags:    opts.tags,
  }
  if (opts.bccEmail) body.bcc = [opts.bccEmail]

  const res  = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${opts.resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`)
  return data.id as string
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const jobStart  = Date.now()
  const now       = new Date()
  const todayUTC  = now.toISOString().split('T')[0]  // YYYY-MM-DD

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey  = Deno.env.get('RESEND_API_KEY')!
  const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL')  ?? 'scout@getfamilyforce.com'
  const fromName   = Deno.env.get('RESEND_FROM_NAME')   ?? 'FamilyForce'
  const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')   ?? ''
  const siteUrl    = Deno.env.get('SITE_URL')            ?? 'https://getfamilyforce.com'

  const results = { trialEnd: { sent: 0, skipped: 0, errors: 0 }, reengagement: { sent: 0, skipped: 0, errors: 0 } }

  // ═══════════════════════════════════════════════════════════════
  // JOB A — Trial-end emails
  // ═══════════════════════════════════════════════════════════════
  console.log(`[scout-trial-end] Job A starting — ${todayUTC}`)

  const { data: trialingSubs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, trial_end, created_at')
    .eq('status', 'trialing')
    .lte('trial_end', now.toISOString())

  if (subErr) {
    await telegramAlert(`Job A failed — could not query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  console.log(`[scout-trial-end] Job A — ${trialingSubs?.length ?? 0} trialing subscriptions found`)

  for (const sub of (trialingSubs ?? [])) {
    try {
      const userId = sub.user_id

      // 1. Dedup check — never send trial-end email twice
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('user_id', userId)
        .eq('digest_type', 'trial_end')
        .limit(1)
        .maybeSingle()

      if (existing) {
        results.trialEnd.skipped++
        continue
      }

      // 2. Load user email
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.trialEnd.skipped++; continue }

      // 3. Load child
      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.trialEnd.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')
      const weeks    = ageInWeeks(childDob, now)
      const months   = ageInMonths(childDob, now)

      // Skip if child is past 36 months (nothing to sell)
      if (months > 36) { results.trialEnd.skipped++; continue }

      // 4. Query all open windows for this age (for count + top 3)
      const { data: windows } = await sb
        .from('milestone_windows')
        .select('title, why_it_matters, urgency')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })

      const allWindowCount = windows?.length ?? 0
      const topWindows     = (windows ?? []).slice(0, 3)

      // 7. Weeks since signup
      const signupDate = new Date(sub.created_at)
      const wks        = weeksSince(signupDate, now)

      // 8. Build CTA URLs — go to sign-in.html with plan pre-selected
      const annualCta    = `${siteUrl}/sign-in.html?intent=subscribe&plan=annual`
      const triennialCta = `${siteUrl}/sign-in.html?intent=subscribe&plan=triennial`
      const monthlyCta   = `${siteUrl}/sign-in.html?intent=subscribe&plan=monthly`

      // 9. Build email
      const { data: teProfileData } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
      const parentName = teProfileData?.name?.trim() || undefined

      const subject = months === 12
        ? `${child.name} turns 1 today -- your Scout trial ends today`
        : `${child.name} turns ${months} month${months === 1 ? '' : 's'} today -- your Scout trial ends today`
      const html     = buildTrialEndEmail({
        childName:      child.name,
        parentName,
        childGender:    child.gender,
        ageMonths:      months,
        weeksSinceJoin: wks,
        allWindowCount,
        topWindows,
        annualCta,
        triennialCta,
        monthlyCta,
        siteUrl,
        userId,
      })

      // 10. Send
      const messageId = await sendEmail({
        to:        user.email,
        subject:   `${subject} — ${preview}`,
        html,
        tags:      [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'trial_end' },
          { name: 'month',       value: currentMonth },
        ],
        resendKey,
        fromEmail,
        fromName,
        bccEmail,
      })

      // 11. Log to scout_digest_log
      await sb.from('scout_digest_log').insert({
        user_id:           userId,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  months,
        digest_type:       'trial_end',
        windows_included:  (windows ?? []).map(w => ({ title: w.title, urgency: w.urgency })),
        email_subject:     subject,
        resend_message_id: messageId,
      })

      // 12. Log to scout_events
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'trial_end_email_sent',
        properties: { months, weeks, messageId, digest_count: digestCount, calendar_count: calendarCount },
      })

      results.trialEnd.sent++
      console.log(`[scout-trial-end] Trial-end email sent for user ${userId} (${months}mo)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-trial-end] Error for user ${sub.user_id}:`, msg)
      await telegramAlert(`Trial-end email failed for user ${sub.user_id}: ${msg}`)
      results.trialEnd.errors++
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // JOB B — Re-engagement emails (30 days past trial_end, non-converters)
  // ═══════════════════════════════════════════════════════════════
  console.log(`[scout-trial-end] Job B starting — re-engagement`)

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: lapsedSubs } = await sb
    .from('scout_subscriptions')
    .select('user_id, trial_end')
    .eq('status', 'trialing')
    .lte('trial_end', thirtyDaysAgo)

  for (const sub of (lapsedSubs ?? [])) {
    try {
      const userId = sub.user_id

      // Check: never re-engaged before
      const { data: priorReengagement } = await sb
        .from('scout_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'reengagement_sent')
        .limit(1)
        .maybeSingle()

      if (priorReengagement) { results.reengagement.skipped++; continue }

      // Load user + child
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.reengagement.skipped++; continue }

      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.reengagement.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')
      const months   = ageInMonths(childDob, now)
      const weeks    = ageInWeeks(childDob, now)

      // Suppress if child is past 36 months
      if (months > 36) { results.reengagement.skipped++; continue }

      // Get single most urgent open window
      const { data: windows } = await sb
        .from('milestone_windows')
        .select('title, why_it_matters, what_to_do, urgency')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })
        .limit(1)

      const topWindow = windows?.[0] ?? null

      const { data: reProfileData } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
      const parentName = reProfileData?.name?.trim() || undefined

      const subscribeCta = `${siteUrl}/sign-in.html?intent=subscribe&plan=annual`
      const html         = buildReengagementEmail({
        childName: child.name,
        parentName,
        ageMonths: months,
        topWindow,
        subscribeCta,
        siteUrl,
        userId,
      })

      const subject = `${child.name} is ${months} months -- one window before you go`

      const messageId = await sendEmail({
        to:      user.email,
        subject,
        html,
        tags:    [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'reengagement' },
          { name: 'month',       value: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}` },
        ],
        resendKey,
        fromEmail,
        fromName,
        bccEmail,
      })

      // Log — one-time guard
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'reengagement_sent',
        properties: { months, weeks, messageId, top_window: topWindow?.title ?? null },
      })

      // Also log trial_churned — 30 days past trial_end without converting = churned
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'trial_churned',
        properties: { months, days_since_trial_end: 30 },
      })

      results.reengagement.sent++
      console.log(`[scout-trial-end] Re-engagement sent for user ${userId} (${months}mo)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-trial-end] Re-engagement error for ${sub.user_id}:`, msg)
      results.reengagement.errors++
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary log
  // ═══════════════════════════════════════════════════════════════
  const duration = Date.now() - jobStart
  console.log(`[scout-trial-end] Done in ${duration}ms`, results)

  if (results.trialEnd.errors > 0 || results.reengagement.errors > 0) {
    await telegramAlert(
      `Job complete with errors. Trial-end: ${results.trialEnd.sent} sent, ${results.trialEnd.errors} errors. Re-engagement: ${results.reengagement.sent} sent, ${results.reengagement.errors} errors.`
    )
  }

  return new Response(JSON.stringify({ ok: true, results, duration_ms: duration }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
