// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Reactivate Subscription
//
// POST /scout-reactivate
// Auth: Bearer user session token
// Body: { childId: string }
//
// Removes cancel_at_period_end from Stripe (subscription continues).
// Updates scout_subscriptions: status = 'active', cancel_at_period_end = false
// Returns: { ok: true, next_billing: ISO string, plan: string }
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!

    const sbUser = createClient(sbUrl, sbAnon, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await sbUser.auth.getUser()
    if (authErr || !user) return err(401, 'Invalid session')

    const sb = createClient(sbUrl, sbService)

    // ── Parse body ──────────────────────────────────────────────────────────
    step = 'parse'
    const body    = await req.json().catch(() => ({}))
    const childId = body.childId as string | undefined
    if (!childId) return err(400, 'childId required')

    // ── Fetch subscription ──────────────────────────────────────────────────
    step = 'fetch-sub'
    const { data: sub, error: subErr } = await sb
      .from('scout_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('child_id', childId)
      .single()

    if (subErr || !sub) return err(404, 'No subscription found')
    if (!sub.stripe_sub_id) return err(400, 'No Stripe subscription ID on record')
    if (sub.status !== 'cancelling') return err(400, 'Subscription is not scheduled to cancel')

    // ── Reactivate on Stripe ────────────────────────────────────────────────
    step = 'stripe-reactivate'
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${sub.stripe_sub_id}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type':  'application/x-www-form-urlencoded',
        },
        body: 'cancel_at_period_end=false',
      }
    )
    const stripeSub = await stripeRes.json()
    if (!stripeRes.ok) return err(502, stripeSub?.error?.message ?? 'Stripe error', step)

    const nextBilling = stripeSub.current_period_end
      ? new Date(stripeSub.current_period_end * 1000).toISOString()
      : sub.period_end

    // ── Update DB ───────────────────────────────────────────────────────────
    step = 'update-db'
    await sb.from('scout_subscriptions').update({
      status:               'active',
      cancel_at_period_end: false,
      period_end:           nextBilling,
      updated_at:           new Date().toISOString(),
    }).eq('id', sub.id)

    // ── Log event ───────────────────────────────────────────────────────────
    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   childId,
      event_type: 'subscription_reactivated',
      properties: { plan: sub.plan, next_billing: nextBilling },
    }).catch(() => {})

    return new Response(JSON.stringify({
      ok: true,
      next_billing: nextBilling,
      plan: sub.plan,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-reactivate] Error at step=${step}:`, msg)
    return err(500, msg, step)
  }
})
