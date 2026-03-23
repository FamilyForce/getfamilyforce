// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Cancel Subscription (Option B in-app cancel)
//
// POST /scout-cancel
// Auth: Bearer user session token
// Body: { childId: string }
//
// Sets cancel_at_period_end = true on Stripe (access continues until period_end).
// Updates scout_subscriptions: status = 'cancelling', cancel_at_period_end = true
// Returns: { ok: true, access_until: ISO string, plan: string }
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

async function sendCancellationEmail(opts: {
  resendKey: string; toEmail: string; userName: string
  plan: string; accessUntil: string | null; siteUrl: string
}) {
  const { resendKey, toEmail, userName, plan, accessUntil, siteUrl } = opts
  const planLabel = plan === 'annual' ? 'Annual ($49.99/year)'
    : plan === 'triennial' ? 'Full Journey — 3 Years ($99.99)'
    : plan === 'monthly'   ? 'Monthly ($9.99/month)'
    : plan
  const accessLine = accessUntil
    ? `Your access continues until <strong>${new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</strong>. Scout will keep sending your monthly digest emails until then.`
    : `Your Scout access has ended.`

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Subscription cancelled</title>
<style>body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">Your Scout subscription has been cancelled. ${accessUntil ? 'Your access continues until the end of your billing period.' : ''}&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">Subscription cancelled, ${userName}.</h1>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.6">${accessLine}</p>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9F8FF;border:1.5px solid #E5E2EC;border-radius:12px;padding:16px 20px;margin-bottom:20px">
  <tr><td colspan="2" style="padding:0 0 10px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;text-transform:uppercase;letter-spacing:.1em;margin:0">Subscription details</p>
  </td></tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;padding:0 0 6px">Plan</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0 0 6px">${planLabel}</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;padding:0 0 6px">Status</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0 0 6px">Cancelled</td>
  </tr>
  ${accessUntil ? `<tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;padding:0">Access until</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;padding:0">${new Date(accessUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
  </tr>` : ''}
  </table>

  ${accessUntil ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 20px;line-height:1.6">Changed your mind? You can reactivate anytime before your access ends.</p>` : ''}
  <a href="${siteUrl}/scout-dashboard/settings.html" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none">${accessUntil ? 'Reactivate subscription →' : 'Go to dashboard →'}</a>
</td></tr>
<tr><td style="height:32px"></td></tr>

<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`

  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ from: 'FamilyForce <scout@getfamilyforce.com>', to: [toEmail], subject: 'Your Scout subscription has been cancelled', html }),
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  let step = 'init'
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    step = 'auth'
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return err(401, 'Missing auth token')

    const sbUrl     = Deno.env.get('SUPABASE_URL')!
    const sbService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sbAnon    = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify user via their JWT
    const sbUser = createClient(sbUrl, sbAnon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await sbUser.auth.getUser()
    if (authErr || !user) return err(401, 'Invalid session')

    // Service client for DB writes
    const sb = createClient(sbUrl, sbService)

    // ── Parse body — single read ────────────────────────────────────────────
    step = 'parse'
    const body     = await req.json().catch(() => ({}))
    const childId  = body.childId as string | undefined
    const testMode = body.testMode === true
    if (!childId) return err(400, 'childId required')

    const stripeKey = (testMode ? Deno.env.get('STRIPE_SECRET_KEY_TEST') : Deno.env.get('STRIPE_SECRET_KEY'))!
    if (!stripeKey) return err(500, testMode ? 'Test Stripe key not configured' : 'Stripe key not configured', step)

    // ── Fetch subscription ──────────────────────────────────────────────────
    // Try exact child_id match first; fall back to null child_id (legacy trial-converted rows)
    step = 'fetch-sub'
    let sub: Record<string, unknown> | null = null
    const { data: subExact } = await sb
      .from('scout_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('child_id', childId)
      .maybeSingle()
    if (subExact) {
      sub = subExact
    } else {
      const { data: subFallback } = await sb
        .from('scout_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .is('child_id', null)
        .in('status', ['active', 'cancelling'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      sub = subFallback
    }

    if (!sub) return err(404, 'No subscription found')
    if (sub.status === 'trialing') return err(400, 'Trial subscriptions cannot be cancelled here — they expire automatically')
    if (sub.status === 'cancelled') return err(400, 'Subscription is already cancelled')
    if (sub.status === 'cancelling') return err(400, 'Subscription is already set to cancel')

    // ── Load user email + name for confirmation email ────────────────────────
    const resendKey   = Deno.env.get('RESEND_API_KEY')
    const siteUrl     = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const { data: { user: authUser } } = await sb.auth.admin.getUserById(user.id)
    const userEmail   = authUser?.email ?? user.email
    const { data: profile } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
    const userName    = profile?.name ?? userEmail.split('@')[0]

    // ── Triennial: no Stripe subscription — just update DB ───────────────────
    if (sub.plan === 'triennial' || !sub.stripe_sub_id) {
      const accessUntil = sub.period_end as string | null
      await sb.from('scout_subscriptions').update({
        status:               'cancelling',
        cancel_at_period_end: true,
        updated_at:           new Date().toISOString(),
      }).eq('id', sub.id)
      await sb.from('scout_events').insert({
        user_id: user.id, child_id: childId,
        event_type: 'subscription_cancelled',
        properties: { plan: sub.plan, access_until: accessUntil, source: 'in_app' },
      }).catch(() => {})
      if (resendKey) sendCancellationEmail({ resendKey, toEmail: userEmail, userName,
        plan: sub.plan as string, accessUntil, siteUrl }).catch(() => {})
      return new Response(JSON.stringify({
        ok: true, access_until: accessUntil, plan: sub.plan,
      }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // ── Annual / Monthly: cancel on Stripe ───────────────────────────────────
    step = 'stripe-cancel'
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${sub.stripe_sub_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: 'cancel_at_period_end=true',
      }
    )
    const stripeSub = await stripeRes.json()
    if (!stripeRes.ok) {
      const stripeMsg = stripeSub?.error?.message ?? ''
      // Subscription doesn't exist in Stripe (deleted/stale) — cancel in DB only
      if (stripeMsg.toLowerCase().includes('no such subscription')) {
        const accessUntil = sub.period_end as string | null
        await sb.from('scout_subscriptions').update({
          status: 'cancelling', cancel_at_period_end: true, updated_at: new Date().toISOString(),
        }).eq('id', sub.id)
        if (resendKey) sendCancellationEmail({ resendKey, toEmail: userEmail, userName,
          plan: sub.plan as string, accessUntil, siteUrl }).catch(() => {})
        return new Response(JSON.stringify({ ok: true, access_until: accessUntil, plan: sub.plan }),
          { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
      }
      return err(502, stripeMsg || 'Stripe error', step)
    }

    // Derive plan from Stripe price metadata if not in DB
    const planFromStripe = stripeSub.metadata?.plan
      ?? (stripeSub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly')

    const accessUntil = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : sub.period_end as string | null

    // ── Update DB ───────────────────────────────────────────────────────────
    step = 'update-db'
    await sb.from('scout_subscriptions').update({
      status:               'cancelling',
      cancel_at_period_end: true,
      plan:                 sub.plan ?? planFromStripe,
      period_end:           accessUntil,
      updated_at:           new Date().toISOString(),
    }).eq('id', sub.id)

    // ── Log event ───────────────────────────────────────────────────────────
    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   childId,
      event_type: 'subscription_cancelled',
      properties: { plan: sub.plan ?? planFromStripe, access_until: accessUntil },
    }).catch(() => {})

    // ── Send cancellation confirmation email ─────────────────────────────────
    if (resendKey) sendCancellationEmail({ resendKey, toEmail: userEmail, userName,
      plan: (sub.plan ?? planFromStripe) as string, accessUntil, siteUrl }).catch(() => {})

    return new Response(JSON.stringify({
      ok: true,
      access_until: accessUntil,
      plan: sub.plan ?? planFromStripe,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-cancel] Error at step=${step}:`, msg)
    return err(500, msg, step)
  }
})
