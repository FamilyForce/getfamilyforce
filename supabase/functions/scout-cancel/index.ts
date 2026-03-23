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
    const body0      = await req.clone().json().catch(() => ({}))
    const testMode0  = body0.testMode === true
    const stripeKey  = (testMode0 ? Deno.env.get('STRIPE_SECRET_KEY_TEST') : Deno.env.get('STRIPE_SECRET_KEY'))!

    // Verify user via their JWT
    const sbUser = createClient(sbUrl, sbAnon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await sbUser.auth.getUser()
    if (authErr || !user) return err(401, 'Invalid session')

    // Service client for DB writes
    const sb = createClient(sbUrl, sbService)

    // ── Parse body ──────────────────────────────────────────────────────────
    step = 'parse'
    const body     = await req.json().catch(() => ({}))
    const childId  = body.childId as string | undefined
    if (!childId) return err(400, 'childId required')

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
