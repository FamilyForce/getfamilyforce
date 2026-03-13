// FamilyForce — Scout Subscribe Edge Function
// Uses raw Stripe REST API (no SDK) for maximum Deno compatibility.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PRICE_ID   = 'price_1TAQWtRF5ve13fCKONaDJ7Ji'
const COUPON_MAP: Record<string, string> = { 'FRIEND25': 'bermxA88' }

const CORS = {
  'Access-Control-Allow-Origin':  'https://getfamilyforce.com',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

// ── Stripe REST helper ────────────────────────────────────────
async function stripe(secretKey: string, method: string, path: string, body?: Record<string, unknown>) {
  const encoded = body
    ? Object.entries(body).flatMap(([k, v]) =>
        v === null || v === undefined ? [] :
        Array.isArray(v)
          ? v.map((item, i) => `${encodeURIComponent(k)}[${i}]=${encodeURIComponent(String(item))}`)
          : [`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`]
      ).join('&')
    : undefined

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: encoded,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe error ${res.status}`)
  return data
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return err(500, 'Stripe key not configured')

    // 1. Auth
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

    // 2. Parse body
    const { paymentMethodId, promoCode, childId } = await req.json()
    if (!paymentMethodId) return err(400, 'paymentMethodId is required')

    // 3. Find or create Stripe customer
    const search = await stripe(stripeKey, 'GET', `/customers/search?query=email:'${encodeURIComponent(user.email)}'&limit=1`)
    let customerId: string

    if (search.data?.length > 0) {
      customerId = search.data[0].id
    } else {
      const customer = await stripe(stripeKey, 'POST', '/customers', {
        email:                         user.email,
        'metadata[supabase_user_id]':  user.id,
      })
      customerId = customer.id
    }

    // 4. Attach payment method
    await stripe(stripeKey, 'POST', `/payment_methods/${paymentMethodId}/attach`, {
      customer: customerId,
    })
    await stripe(stripeKey, 'POST', `/customers/${customerId}`, {
      'invoice_settings[default_payment_method]': paymentMethodId,
    })

    // 5. Create subscription
    const normalised = (promoCode ?? '').toUpperCase().trim()
    const couponId   = COUPON_MAP[normalised] ?? null

    const subBody: Record<string, unknown> = {
      customer:            customerId,
      'items[0][price]':   PRICE_ID,
      trial_period_days:   7,
      'payment_settings[save_default_payment_method]': 'on_subscription',
      'metadata[supabase_user_id]': user.id,
      'metadata[child_id]':         childId ?? '',
    }
    if (couponId) subBody.coupon = couponId

    const subscription = await stripe(stripeKey, 'POST', '/subscriptions', subBody)

    const trialEnd  = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null
    const periodEnd = new Date(subscription.current_period_end * 1000).toISOString()
    const pricePaid = couponId ? parseFloat((79.99 * 0.75).toFixed(2)) : 79.99

    // 6. Write to scout_subscriptions
    const { error: dbErr } = await sb.from('scout_subscriptions').upsert({
      user_id:            user.id,
      status:             'trialing',
      stripe_customer_id: customerId,
      stripe_sub_id:      subscription.id,
      promo_code:         couponId ? normalised : null,
      discount_pct:       couponId ? 25 : null,
      price_paid:         pricePaid,
      trial_end:          trialEnd,
      period_end:         periodEnd,
    }, { onConflict: 'user_id' })

    if (dbErr) console.error('[scout-subscribe] DB error:', dbErr.message)

    return new Response(
      JSON.stringify({ ok: true, subscriptionId: subscription.id, trialEnd }),
      { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } }
    )

  } catch (e) {
    console.error('[scout-subscribe] Error:', e)
    return err(500, e instanceof Error ? e.message : 'Unexpected error')
  }
})
