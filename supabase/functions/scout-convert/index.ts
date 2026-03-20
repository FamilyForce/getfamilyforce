// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial Conversion + Additional Child Subscription
// Converts a trialing user to a paid subscriber (child #1)
// OR adds a new paid subscription for an additional child (child #2+).
//
// POST body:
//   { paymentMethodId, plan: 'annual' | 'monthly' }         ← trial conversion (child #1)
//   { paymentMethodId?, plan, childId }                      ← new child subscription
//     paymentMethodId is optional for child #2+ if user already has a Stripe customer+PM
//
// Auth: Bearer session token
//
// Trial conversion flow (child #1):
//   1. Auth + verify trialing subscription exists
//   2. Find/create Stripe customer, attach PM
//   3. Create Stripe subscription (immediate billing)
//   4. Update scout_subscriptions row: status=active + child_id
//   5. Fire scout-digest immediately
//   6. Log trial_converted event
//
// Additional child flow (child #2+):
//   1. Auth + validate childId belongs to user
//   2. Verify child doesn't already have an active subscription
//   3. Find existing Stripe customer (reuse from child #1 sub)
//   4. Attach PM if provided; else use customer's existing default PM
//   5. Calculate catch-up period: trial_end = nextMonthlyBirthday(childDob, today)
//      Bonus month: if first birthday ≤7 days away, extend by one more month
//   6. Create Stripe subscription with trial_end (catch-up period is free)
//   7. INSERT new scout_subscriptions row (child_id, status=trialing, trial_end)
//   8. Fire scout-digest for this child
//   9. Log child_subscription_added event
//
// Deploy: supabase functions deploy scout-convert
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_PRICE_ANNUAL  = 'price_1TAQWtRF5ve13fCKONaDJ7Ji'
const DEFAULT_PRICE_MONTHLY = ''  // set STRIPE_PRICE_MONTHLY in secrets

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

async function stripeReq(
  secretKey: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
) {
  const encoded = body
    ? Object.entries(body)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : undefined

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      ...(encoded ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method !== 'GET' ? encoded : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe ${res.status}: ${JSON.stringify(data)}`)
  return data
}

async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-convert: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// Returns the next monthly birthday on or after fromDate
// e.g. child born Jan 15, fromDate = Mar 3 → Mar 15
function nextMonthlyBirthday(dob: Date, fromDate: Date): Date {
  const bd = new Date(Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    dob.getUTCDate()
  ))
  if (bd <= fromDate) {
    bd.setUTCMonth(bd.getUTCMonth() + 1)
  }
  return bd
}

function oneMonthForward(d: Date): Date {
  const r = new Date(d)
  r.setUTCMonth(r.getUTCMonth() + 1)
  return r
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  let step = 'init'

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    step = 'auth'
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return err(401, 'Missing auth token', step)

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return err(401, 'Invalid or expired session', step)
    if (!user.email)      return err(400, 'User has no email address', step)

    // ── Parse body ────────────────────────────────────────────────────────────
    step = 'parse'
    const body = await req.json()
    const { paymentMethodId, plan, childId, referralCode } = body
    if (plan !== 'annual' && plan !== 'monthly') return err(400, 'plan must be annual or monthly', step)

    const isAdditionalChild = !!childId

    // ── Price IDs ─────────────────────────────────────────────────────────────
    step = 'price-select'
    const stripeKey    = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return err(500, 'Stripe key not configured', step)

    const priceAnnual  = Deno.env.get('STRIPE_PRICE_ANNUAL')  || DEFAULT_PRICE_ANNUAL
    const priceMonthly = Deno.env.get('STRIPE_PRICE_MONTHLY') || DEFAULT_PRICE_MONTHLY
    if (plan === 'monthly' && !priceMonthly) {
      return err(500, 'Monthly price ID not configured. Set STRIPE_PRICE_MONTHLY in Supabase secrets.', step)
    }
    const priceId = plan === 'annual' ? priceAnnual : priceMonthly

    // ── Validate referral code (non-blocking — discount is best-effort) ───────
    step = 'referral-check'
    let appliedCoupon: string | null = null
    let referrerUserId: string | null = null
    if (referralCode && typeof referralCode === 'string') {
      const cleanCode = referralCode.trim().toUpperCase()
      const referralCouponId = Deno.env.get('STRIPE_REFERRAL_COUPON_ID')
      if (referralCouponId && /^[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanCode)) {
        try {
          const { data: refOwner } = await sb
            .from('profiles')
            .select('id')
            .eq('referral_code', cleanCode)
            .neq('id', user.id)   // can't use your own code
            .maybeSingle()
          if (refOwner) {
            appliedCoupon   = referralCouponId
            referrerUserId  = refOwner.id
            console.log(`[scout-convert] Referral code ${cleanCode} valid — applying coupon ${appliedCoupon}`)
          } else {
            console.log(`[scout-convert] Referral code ${cleanCode} not found or self-referral`)
          }
        } catch (e) {
          console.error('[scout-convert] Referral lookup failed (non-blocking):', e)
        }
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PATH A — Additional child subscription (child #2+)
    // ══════════════════════════════════════════════════════════════════════════
    if (isAdditionalChild) {
      step = 'validate-child'
      const { data: child, error: childErr } = await sb
        .from('children')
        .select('id, name, dob, user_id')
        .eq('id', childId)
        .eq('user_id', user.id)
        .single()

      if (childErr || !child) return err(404, 'Child not found or does not belong to this user', step)

      // Check child doesn't already have an active subscription
      step = 'check-existing-sub'
      const { data: existingSub } = await sb
        .from('scout_subscriptions')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('child_id', childId)
        .maybeSingle()

      if (existingSub && (existingSub.status === 'active' || existingSub.status === 'trialing')) {
        return err(409, 'This child already has an active subscription', step)
      }

      // Get user's existing Stripe customer from their first subscription
      step = 'get-existing-customer'
      const { data: primarySub } = await sb
        .from('scout_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .not('stripe_customer_id', 'is', null)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      let customerId = primarySub?.stripe_customer_id as string | null

      if (!customerId) {
        // No customer yet — create one (edge case: user never converted child #1)
        const search = await stripeReq(stripeKey, 'GET',
          `/customers/search?query=email:'${encodeURIComponent(user.email)}'&limit=1`)
        if (search.data?.length > 0) {
          customerId = search.data[0].id
        } else {
          const customer = await stripeReq(stripeKey, 'POST', '/customers', {
            email:                        user.email,
            'metadata[supabase_user_id]': user.id,
          })
          customerId = customer.id
        }
      }

      // Attach new PM if provided; otherwise use customer's existing default
      if (paymentMethodId) {
        step = 'pm-attach'
        await stripeReq(stripeKey, 'POST', `/payment_methods/${paymentMethodId}/attach`, {
          customer: customerId,
        })
        step = 'pm-set-default'
        await stripeReq(stripeKey, 'POST', `/customers/${customerId!}`, {
          'invoice_settings[default_payment_method]': paymentMethodId,
        })
      }

      // Calculate catch-up period (same logic as scout-trial-start)
      step = 'catchup-period'
      const today  = new Date()
      const dob    = new Date(child.dob + 'T00:00:00Z')
      let   trialEnd = nextMonthlyBirthday(dob, today)
      const daysUntilBirthday = Math.ceil((trialEnd.getTime() - today.getTime()) / 86400000)
      const bonusEligible = daysUntilBirthday <= 7
      if (bonusEligible) {
        trialEnd = oneMonthForward(trialEnd)
      }

      // Create Stripe subscription — trial period = catch-up window (no charge until trialEnd)
      step = 'stripe-subscription'
      const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)
      const subscription = await stripeReq(stripeKey, 'POST', '/subscriptions', {
        customer:                          customerId!,
        'items[0][price]':                 priceId,
        trial_end:                         trialEndUnix,
        ...(appliedCoupon ? { coupon: appliedCoupon } : {}),
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'metadata[supabase_user_id]':      user.id,
        'metadata[child_id]':              childId,
        'metadata[plan]':                  plan,
      })

      // INSERT new subscription row for this child
      step = 'db-insert'
      const periodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null

      await sb.from('scout_subscriptions').insert({
        user_id:            user.id,
        child_id:           childId,
        status:             'trialing',   // trial = catch-up period
        stripe_customer_id: customerId,
        stripe_sub_id:      subscription.id,
        trial_end:          trialEnd.toISOString(),
        period_end:         periodEnd,
      })

      // Log event
      step = 'log-event'
      await sb.from('scout_events').insert({
        user_id:    user.id,
        child_id:   childId,
        event_type: 'child_subscription_added',
        properties: {
          plan,
          stripe_sub_id:        subscription.id,
          price_id:              priceId,
          trial_end:             trialEnd.toISOString(),
          bonus_eligible:        bonusEligible,
          days_until_birthday:   daysUntilBirthday,
          referral_code:         referralCode ?? null,
          coupon_applied:        appliedCoupon ?? null,
        },
      })

      if (bonusEligible) {
        await sb.from('scout_events').insert({
          user_id:    user.id,
          child_id:   childId,
          event_type: 'trial_bonus_eligible',
          properties: {
            bonus_birthday:        trialEnd.toISOString().split('T')[0],
            days_until_birthday:   daysUntilBirthday,
          },
        })
      }

      if (appliedCoupon && referrerUserId && referralCode) {
        await sb.from('scout_events').insert({
          user_id:    user.id,
          child_id:   childId,
          event_type: 'referral_attributed',
          properties: {
            referral_code:    referralCode.trim().toUpperCase(),
            referrer_user_id: referrerUserId,
            coupon_id:        appliedCoupon,
            plan,
          },
        }).catch(() => { /* non-blocking */ })
      }

      // Fire digest for this child
      step = 'trigger-digest'
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      fetch(`${supabaseUrl}/functions/v1/scout-digest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
        body: JSON.stringify({ userId: user.id, childId }),
      }).catch(e => console.error('[scout-convert] digest trigger failed:', e.message))

      await telegramAlert(`🎉 Additional child subscription: user=${user.email}, child=${child.name}, plan=${plan}, bonus=${bonusEligible}`)

      console.log(`[scout-convert] Added child subscription: user=${user.id}, child=${childId}, plan=${plan}`)

      return new Response(JSON.stringify({
        ok:             true,
        mode:           'additional_child',
        plan,
        childId,
        trialEnd:       trialEnd.toISOString(),
        bonusEligible,
        subscriptionId: subscription.id,
      }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PATH B — Trial conversion (child #1)
    // ══════════════════════════════════════════════════════════════════════════

    if (!paymentMethodId) return err(400, 'paymentMethodId is required', 'parse')

    // Verify user has a trialing subscription
    step = 'verify-trial'
    const { data: sub } = await sb
      .from('scout_subscriptions')
      .select('id, status, stripe_customer_id, child_id')
      .eq('user_id', user.id)
      .is('child_id', null)          // prefer legacy/null-child row first
      .maybeSingle()

    // Fallback: find any trialing row for this user
    const subToConvert = sub ?? (await sb
      .from('scout_subscriptions')
      .select('id, status, stripe_customer_id, child_id')
      .eq('user_id', user.id)
      .eq('status', 'trialing')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    ).data

    if (!subToConvert) return err(404, 'No Scout subscription found for this user', step)
    if (subToConvert.status === 'active') return err(409, 'Subscription is already active', step)

    // Find or create Stripe customer
    step = 'stripe-customer'
    let customerId = subToConvert.stripe_customer_id as string | null

    if (!customerId) {
      const search = await stripeReq(stripeKey, 'GET',
        `/customers/search?query=email:'${encodeURIComponent(user.email)}'&limit=1`)
      if (search.data?.length > 0) {
        customerId = search.data[0].id
      } else {
        const customer = await stripeReq(stripeKey, 'POST', '/customers', {
          email:                        user.email,
          'metadata[supabase_user_id]': user.id,
        })
        customerId = customer.id
      }
    }

    // Attach PM
    step = 'pm-attach'
    await stripeReq(stripeKey, 'POST', `/payment_methods/${paymentMethodId}/attach`, {
      customer: customerId,
    })
    step = 'pm-set-default'
    await stripeReq(stripeKey, 'POST', `/customers/${customerId!}`, {
      'invoice_settings[default_payment_method]': paymentMethodId,
    })

    // Create Stripe subscription — no trial, charge immediately
    step = 'stripe-subscription'
    const subscription = await stripeReq(stripeKey, 'POST', '/subscriptions', {
      customer:          customerId!,
      'items[0][price]': priceId,
      ...(appliedCoupon ? { coupon: appliedCoupon } : {}),
      'payment_settings[save_default_payment_method]': 'on_subscription',
      'metadata[supabase_user_id]': user.id,
      'metadata[plan]':             plan,
    })

    // Update subscription row
    step = 'db-update'
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

    await sb.from('scout_subscriptions').update({
      status:             'active',
      stripe_customer_id: customerId,
      stripe_sub_id:      subscription.id,
      period_end:         periodEnd,
    }).eq('id', subToConvert.id)

    // Determine child_id for event logging
    step = 'log-event'
    let eventChildId = subToConvert.child_id as string | null
    if (!eventChildId) {
      const { data: firstChild } = await sb
        .from('children')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      eventChildId = firstChild?.id ?? null
    }

    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   eventChildId,
      event_type: 'trial_converted',
      properties: {
        plan,
        stripe_sub_id:  subscription.id,
        price_id:       priceId,
        period_end:     periodEnd,
        referral_code:  referralCode ?? null,
        coupon_applied: appliedCoupon ?? null,
      },
    })

    // Log referral attribution if a valid code was used
    if (appliedCoupon && referrerUserId && referralCode) {
      await sb.from('scout_events').insert({
        user_id:    user.id,
        child_id:   eventChildId,
        event_type: 'referral_attributed',
        properties: {
          referral_code:    referralCode.trim().toUpperCase(),
          referrer_user_id: referrerUserId,
          coupon_id:        appliedCoupon,
          plan,
        },
      }).catch(() => { /* non-blocking */ })
    }

    // Fire digest immediately (scout-digest has monthly dedup so double-fire from
    // invoice.paid webhook is safe — second call will be a no-op)
    step = 'trigger-digest'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    fetch(`${supabaseUrl}/functions/v1/scout-digest`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({}),
    }).catch(e => console.error('[scout-convert] digest trigger failed:', e.message))

    // Notify admin
    await telegramAlert(`💳 Trial converted! user=${user.email}, plan=${plan}`)

    console.log(`[scout-convert] Converted user ${user.id} to ${plan} plan`)

    return new Response(JSON.stringify({
      ok:             true,
      mode:           'trial_conversion',
      plan,
      subscriptionId: subscription.id,
      periodEnd,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-convert] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)

    // If Stripe subscription was already created but our DB write failed,
    // give the user a reassuring message — payment went through, they just need to refresh.
    const postChargeSteps = ['db-update', 'db-insert', 'log-event', 'trigger-digest']
    if (postChargeSteps.includes(step)) {
      return err(500, 'Your payment was received — please refresh the page in a moment and your access will be active.', step)
    }
    return err(500, msg, step)
  }
})
