// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Daily Monitoring + Sanity Check
// Runs at 09:00 UTC (1 hour after main jobs fire at 08:00 UTC).
//
// Checks:
//   1. Job failures in the last 2 hours → alert immediately
//   2. Zero digests sent when active subscribers exist → alert
//   3. Bounce rate > 2% in last 24 hours → alert
//   4. Summary report (counts + health status) → Telegram daily
//
// Deploy: supabase functions deploy scout-monitor
// Schedule: daily 09:00 UTC via pg_cron (see supabase/cron/scout-cron.sql)
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Telegram send ────────────────────────────────────────────────────────────
async function telegram(message: string, urgent = false): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  const prefix = urgent ? '🚨 ' : '📊 '
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id:    chatId,
        text:       `${prefix}Scout Monitor: ${message}`,
        parse_mode: 'HTML',
      }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const now          = new Date()
  const twoHoursAgo  = new Date(now.getTime() - 2  * 60 * 60 * 1000).toISOString()
  const twentyFourHA = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const todayStart   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const alerts: string[]  = []
  const report:  string[] = []
  let   hasUrgent = false

  // ─── Check 1: Job failures in last 2 hours ─────────────────────────────────
  const { data: failures, error: failErr } = await sb
    .from('scout_events')
    .select('event_type, properties, occurred_at')
    .eq('event_type', 'job_failed')
    .gte('occurred_at', twoHoursAgo)
    .order('occurred_at', { ascending: false })

  if (failErr) {
    alerts.push(`Could not query job failures: ${failErr.message}`)
    hasUrgent = true
  } else if (failures && failures.length > 0) {
    hasUrgent = true
    const summary = failures.map(f => {
      const p = f.properties as Record<string, string>
      return `• ${p.job_type ?? 'unknown'} at step=${p.step ?? '?'}: ${p.error ?? '?'}`
    }).join('\n')
    alerts.push(`${failures.length} job failure(s) in last 2 hours:\n${summary}`)
  }

  // ─── Check 2: Digest sanity — active/trialing subscribers with zero digests today ───
  const { count: activeCount } = await sb
    .from('scout_subscriptions')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: trialingCount } = await sb
    .from('scout_subscriptions')
    .select('user_id', { count: 'exact', head: true })
    .eq('status', 'trialing')

  const totalSubscribers = (activeCount ?? 0) + (trialingCount ?? 0)

  // Count all digest types sent today (monthly + signup + birth_signup)
  const { count: digestsToday } = await sb
    .from('scout_digest_log')
    .select('id', { count: 'exact', head: true })
    .in('digest_type', ['monthly', 'signup', 'birth_signup'])
    .gte('sent_at', todayStart)

  const { count: monthlyDigestsToday } = await sb
    .from('scout_digest_log')
    .select('id', { count: 'exact', head: true })
    .eq('digest_type', 'monthly')
    .gte('sent_at', todayStart)

  const { count: signupDigestsToday } = await sb
    .from('scout_digest_log')
    .select('id', { count: 'exact', head: true })
    .in('digest_type', ['signup', 'birth_signup'])
    .gte('sent_at', todayStart)

  // Alert if any subscribers exist but zero digests of any kind sent today
  if (totalSubscribers >= 1 && (digestsToday ?? 0) === 0) {
    alerts.push(`Digest sanity: ${totalSubscribers} subscribers (${activeCount ?? 0} active, ${trialingCount ?? 0} trialing) but 0 digests sent today. Check if scout-digest cron fired.`)
    hasUrgent = true
  }

  // ─── Check 3: Bounce rate in last 24 hours ─────────────────────────────────
  const { count: deliveredCount } = await sb
    .from('scout_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'email_delivered')
    .gte('occurred_at', twentyFourHA)

  const { count: bounceCount } = await sb
    .from('scout_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'email_bounced')
    .gte('occurred_at', twentyFourHA)

  const total       = (deliveredCount ?? 0) + (bounceCount ?? 0)
  const bounceRate  = total > 0 ? (bounceCount ?? 0) / total : 0

  if (total >= 10 && bounceRate > 0.02) {
    const pct = (bounceRate * 100).toFixed(1)
    alerts.push(`Bounce rate alert: ${pct}% (${bounceCount}/${total} emails in last 24h). Threshold is 2%. Check Resend dashboard immediately.`)
    hasUrgent = true
  }

  // ─── Check 4: Trial-end emails sent today ──────────────────────────────────
  const { count: trialEndToday } = await sb
    .from('scout_digest_log')
    .select('id', { count: 'exact', head: true })
    .eq('digest_type', 'trial_end')
    .gte('sent_at', todayStart)

  // ─── Check 5: Reengagement emails sent (all time) ─────────────────────────
  const { count: reengagementTotal } = await sb
    .from('scout_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'reengagement_sent')

  // ─── Check 6: New trials started today ────────────────────────────────────
  const { count: newTrialsToday } = await sb
    .from('scout_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'trial_started')
    .gte('occurred_at', todayStart)

  // ─── Check 7: Conversions today ───────────────────────────────────────────
  const { count: conversionsToday } = await sb
    .from('scout_events')
    .select('id', { count: 'exact', head: true })
    .eq('event_type', 'trial_converted')
    .gte('occurred_at', todayStart)

  // ─── Build daily report ────────────────────────────────────────────────────
  const todayStr   = now.toISOString().split('T')[0]
  const bounceStr  = total >= 10
    ? `${(bounceRate * 100).toFixed(1)}% (${bounceCount}/${total})`
    : total > 0
    ? `${bounceCount}/${total} (low volume)`
    : 'n/a (no sends yet)'

  report.push(`<b>Scout Daily Report — ${todayStr}</b>`)
  report.push('')
  report.push(`Subscribers`)
  report.push(`  Active (paid): ${activeCount ?? 0}`)
  report.push(`  Trialing: ${trialingCount ?? 0}`)
  report.push(`  New trials today: ${newTrialsToday ?? 0}`)
  report.push(`  Conversions today: ${conversionsToday ?? 0}`)
  report.push('')
  report.push(`Emails today`)
  report.push(`  Monthly digests: ${monthlyDigestsToday ?? 0}`)
  report.push(`  Signup digests: ${signupDigestsToday ?? 0}`)
  report.push(`  Trial-end emails: ${trialEndToday ?? 0}`)
  report.push(`  Re-engagement (all time): ${reengagementTotal ?? 0}`)
  report.push('')
  report.push(`Deliverability (24h)`)
  report.push(`  Bounce rate: ${bounceStr}`)
  report.push(`  Job failures: ${failures?.length ?? 0}`)
  report.push('')
  report.push(hasUrgent ? '⚠️ Alerts sent above.' : '✅ All checks passed.')

  // ─── Send urgent alerts first ──────────────────────────────────────────────
  for (const alert of alerts) {
    await telegram(alert, true)
  }

  // ─── Send daily report ─────────────────────────────────────────────────────
  await telegram(report.join('\n'), false)

  console.log(`[scout-monitor] Done. Alerts: ${alerts.length}, urgent: ${hasUrgent}`)

  return new Response(JSON.stringify({
    ok:      true,
    alerts:  alerts.length,
    urgent:  hasUrgent,
    report:  { activeCount, trialingCount, totalSubscribers, monthlyDigestsToday, signupDigestsToday, trialEndToday, newTrialsToday, conversionsToday, bounceRate, failures: failures?.length ?? 0 },
  }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
