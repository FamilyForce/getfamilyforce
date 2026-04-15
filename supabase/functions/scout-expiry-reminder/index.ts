// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Subscription Expiry Reminder
// Fires daily at 08:00 UTC via Supabase pg_cron.
//
// Targets: status=active + stripe_sub_id IS NULL + period_end approaching
// (DB-only activations: SCOUT1TIME, SCOUT3FREE, and any future free promos)
//
// Sends two reminder types:
//   30-day: "Your free year ends in 30 days"
//   7-day:  "One week left on your free year of Scout"
//
// Deduped via scout_events (expiry_reminder_30d / expiry_reminder_7d).
// Safe to run daily — does nothing unless a reminder is due.
//
// Deploy: supabase functions deploy scout-expiry-reminder
// Schedule: see supabase/cron/scout-cron.sql
//
// Secrets: RESEND_API_KEY, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: `📬 scout-expiry-reminder: ${message}` }),
    })
  } catch { /* non-critical */ }
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      from:     'FamilyForce Scout <scout@getfamilyforce.com>',
      to:       [to],
      reply_to: ['support@getfamilyforce.com'],
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

// ─── Email builders ───────────────────────────────────────────────────────────

function build30DayEmail(opts: { expiryDate: string; siteUrl: string }): string {
  const { expiryDate, siteUrl } = opts
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your free year of Scout ends in 30 days</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">Your free year of Scout ends on ${expiryDate}. Here's what to do next.&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#1D1D1F;margin:0 0 14px;line-height:1.3">Your free year ends in 30 days.</h1>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 14px;line-height:1.6">On <strong>${expiryDate}</strong>, your Scout access expires. After that, the monthly digests stop and you'll need to subscribe to keep up with your child's milestones.</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 24px;line-height:1.6">No rush — you've got a month. But when you're ready, it takes about 60 seconds.</p>

  <a href="${siteUrl}/scout-dashboard.html" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none;margin-bottom:20px">Subscribe to Scout →</a>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9F8FF;border:1.5px solid #E5E2EC;border-radius:12px;padding:16px 20px;margin-top:4px">
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0 0 6px">Annual</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;padding:0 0 6px">$49.99 / year</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0 0 6px">Monthly</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0 0 6px">$9.99 / month</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0">3-year</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0">$99.99 one-time</td>
  </tr>
  </table>
</td></tr>
<tr><td style="height:32px"></td></tr>

<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a> · <a href="mailto:support@getfamilyforce.com" style="color:#8A879A;text-decoration:none">support@getfamilyforce.com</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`
}

function build7DayEmail(opts: { expiryDate: string; siteUrl: string }): string {
  const { expiryDate, siteUrl } = opts
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>One week left on your free year of Scout</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">One week left. Your Scout access ends ${expiryDate}.&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#1D1D1F;margin:0 0 14px;line-height:1.3">One week left.</h1>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 14px;line-height:1.6">Your free year of Scout ends on <strong>${expiryDate}</strong>. After that, the monthly digests stop.</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 24px;line-height:1.6">If Scout has been useful — and we hope it has — now's a good time to subscribe. Takes about 60 seconds, and your progress stays exactly where it is.</p>

  <a href="${siteUrl}/scout-dashboard.html" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none;margin-bottom:20px">Subscribe to Scout →</a>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9F8FF;border:1.5px solid #E5E2EC;border-radius:12px;padding:16px 20px;margin-top:4px">
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0 0 6px">Annual</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;padding:0 0 6px">$49.99 / year</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0 0 6px">Monthly</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0 0 6px">$9.99 / month</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;padding:0">3-year</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0">$99.99 one-time</td>
  </tr>
  </table>
</td></tr>
<tr><td style="height:32px"></td></tr>

<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a> · <a href="mailto:support@getfamilyforce.com" style="color:#8A879A;text-decoration:none">support@getfamilyforce.com</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const siteUrl   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'

  const now      = new Date()
  const sent30   = { total: 0, skipped: 0 }
  const sent7    = { total: 0, skipped: 0 }
  const errors: string[] = []

  try {
    // ── Fetch all DB-only active subs with an upcoming period_end ─────────────
    // stripe_sub_id IS NULL: excludes paid recurring subs (Stripe handles their renewals)
    // period_end between now+5days and now+32days: covers both 7d and 30d windows
    const windowStart = new Date(now.getTime() + 5  * 24 * 60 * 60 * 1000).toISOString()
    const windowEnd   = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString()

    const { data: subs, error: subsErr } = await sb
      .from('scout_subscriptions')
      .select('id, user_id, child_id, period_end, plan')
      .eq('status', 'active')
      .is('stripe_sub_id', null)
      .not('period_end', 'is', null)
      .gte('period_end', windowStart)
      .lte('period_end', windowEnd)

    if (subsErr) throw new Error(`DB query failed: ${subsErr.message}`)
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No expiry reminders due today', sent30, sent7 }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    for (const sub of subs) {
      try {
        const periodEnd  = new Date(sub.period_end)
        const daysLeft   = Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000)
        const is30Day    = daysLeft >= 29 && daysLeft <= 31
        const is7Day     = daysLeft >= 6  && daysLeft <= 8
        if (!is30Day && !is7Day) continue

        const eventType  = is30Day ? 'expiry_reminder_30d' : 'expiry_reminder_7d'

        // Dedup check — already sent this reminder?
        const { data: existing } = await sb
          .from('scout_events')
          .select('id')
          .eq('user_id', sub.user_id)
          .eq('event_type', eventType)
          .maybeSingle()

        if (existing) {
          if (is30Day) sent30.skipped++ ; else sent7.skipped++
          continue
        }

        // Fetch user email
        const { data: userData, error: userErr } = await sb.auth.admin.getUserById(sub.user_id)
        if (userErr || !userData?.user?.email) {
          errors.push(`user_not_found: ${sub.user_id}`)
          continue
        }
        const email      = userData.user.email
        const expiryDate = formatDate(periodEnd)

        // Send email
        if (resendKey) {
          const subject = is30Day
            ? 'Your free year of Scout ends in 30 days'
            : 'One week left on your free year of Scout'
          const html = is30Day
            ? build30DayEmail({ expiryDate, siteUrl })
            : build7DayEmail({ expiryDate, siteUrl })
          await sendEmail(resendKey, email, subject, html)
        }

        // Log event
        await sb.from('scout_events').insert({
          user_id:    sub.user_id,
          child_id:   sub.child_id,
          event_type: eventType,
          properties: {
            period_end:  sub.period_end,
            days_left:   daysLeft,
            plan:        sub.plan,
            sub_id:      sub.id,
          },
        })

        if (is30Day) sent30.total++ ; else sent7.total++

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        errors.push(`sub_${sub.id}: ${msg}`)
        console.error(`[scout-expiry-reminder] Error processing sub ${sub.id}:`, msg)
      }
    }

    const summary = `30d: ${sent30.total} sent / ${sent30.skipped} skipped | 7d: ${sent7.total} sent / ${sent7.skipped} skipped`
    console.log(`[scout-expiry-reminder] ${summary}`)

    if (sent30.total > 0 || sent7.total > 0) {
      await telegramAlert(`📬 Expiry reminders sent — ${summary}`)
    }

    if (errors.length > 0) {
      await telegramAlert(`⚠️ ${errors.length} error(s): ${errors.slice(0, 3).join(', ')}`)
    }

    return new Response(JSON.stringify({ ok: true, sent30, sent7, errors }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[scout-expiry-reminder] Fatal error:', msg)
    await telegramAlert(`Fatal error: ${msg}`)
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
