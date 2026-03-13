// FamilyForce — Scout Subscribe Edge Function
// Creates a Stripe customer + 7-day trial subscription, then writes to scout_subscriptions.
//
// Required env vars (Supabase Dashboard → Edge Functions → scout-subscribe → Secrets):
//   STRIPE_SECRET_KEY        = sk_test_51TAQTZ... (your Stripe secret key)
//   SUPABASE_URL             = set automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY = set automatically by Supabase

import Stripe from 'https://esm.sh/stripe@13?target=deno&no-check=true'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Stripe initialised inside handler to catch env var errors at runtime

// ── Stripe config ──────────────────────────────────────────────
const PRICE_ID = 'price_1TAQWtRF5ve13fCKONaDJ7Ji'  // FamilyForce Scout $79.99/yr

// Maps frontend promo codes → Stripe Coupon IDs
const COUPON_MAP: Record<string, string> = {
  'FRIEND25': 'bermxA88',
}

// ── CORS headers ───────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  'https://getfamilyforce.com',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (req.method !== 'POST') {
    return err(405, 'Method not allowed')
  }

  try {
    // Initialise Stripe inside handler so missing env var is caught cleanly
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return err(500, 'Stripe key not configured')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' })

    // 1. Authenticate: verify Supabase JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return err(401, 'Missing auth token')

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await sb.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) return err(401, 'Invalid or expired session')
    if (!user.email)      return err(400, 'User has no email address')

    // 2. Parse request body
    const { paymentMethodId, promoCode, childId } = await req.json() as {
      paymentMethodId: string
      promoCode?: string
      childId?: string
    }
    if (!paymentMethodId) return err(400, 'paymentMethodId is required')

    // 3. Create or retrieve Stripe customer for this email
    const existing = await stripe.customers.list({ email: user.email, limit: 1 })
    let customer    = existing.data[0]
    if (!customer) {
      customer = await stripe.customers.create({
        email:    user.email,
        metadata: { supabase_user_id: user.id },
      })
    }

    // 4. Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id })
    await stripe.customers.update(customer.id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // 5. Build subscription params
    const subParams: Stripe.SubscriptionCreateParams = {
      customer:         customer.id,
      items:            [{ price: PRICE_ID }],
      trial_period_days: 7,
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata:         { supabase_user_id: user.id, child_id: childId ?? '' },
    }

    // 6. Apply coupon if valid promo code
    const normalised = (promoCode ?? '').toUpperCase().trim()
    const couponId   = COUPON_MAP[normalised]
    if (normalised && couponId) {
      subParams.coupon = couponId
    } else if (normalised && !couponId) {
      // Code was entered but not valid — still proceed without discount
      console.warn(`[scout-subscribe] Unknown promo code: ${normalised}`)
    }

    // 7. Create subscription
    const subscription = await stripe.subscriptions.create(subParams)

    const trialEnd   = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null
    const periodEnd  = new Date(subscription.current_period_end * 1000).toISOString()
    const discountPct = couponId ? 25 : null
    const pricePaid   = couponId ? parseFloat((79.99 * 0.75).toFixed(2)) : 79.99

    // 8. Write to scout_subscriptions (service role bypasses RLS)
    const { error: dbErr } = await sb.from('scout_subscriptions').upsert({
      user_id:            user.id,
      status:             'trialing',
      stripe_customer_id: customer.id,
      stripe_sub_id:      subscription.id,
      promo_code:         couponId ? normalised : null,
      discount_pct:       discountPct,
      price_paid:         pricePaid,
      trial_end:          trialEnd,
      period_end:         periodEnd,
    }, { onConflict: 'user_id' })

    if (dbErr) {
      console.error('[scout-subscribe] DB write error:', dbErr.message)
      // Don't fail the request — Stripe subscription was created successfully.
      // Webhook will sync the DB state if this write fails.
    }

    return new Response(
      JSON.stringify({ ok: true, subscriptionId: subscription.id, trialEnd }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    console.error('[scout-subscribe] Unhandled error:', e)
    return err(500, e instanceof Error ? e.message : 'Unexpected error')
  }
})

function err(status: number, msg: string) {
  return new Response(
    JSON.stringify({ ok: false, error: msg }),
    { status, headers: { ...CORS, 'Content-Type': 'application/json' } }
  )
}
