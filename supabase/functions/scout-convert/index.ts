// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial Conversion Edge Function
// Converts a trialing user to a paid subscriber.
// Called from the paywall CTA when the user enters card details.
//
// POST body: { paymentMethodId, plan: 'annual' | 'monthly' }
// Auth: Bearer session token
//
// Flow:
//   1. Auth check + verify user has a trialing subscription
//   2. Find or create Stripe customer
//   3. Attach payment method
//   4. Create Stripe subscription (no trial — immediate billing)
//   5. Update scout_subscriptions: status = 'active', stripe IDs
//   6. Fire scout-digest immediately (no wait for cron)
//   7. Log trial_converted to scout_events
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

// Default price IDs — override via env vars when Stripe prices are created
const DEFAULT_PRICE_ANNUAL  = 'price_1TAQWtRF5ve13fCKONaDJ7Ji'  // existing annual price
const DEFAULT_PRICE_MONTHLY = ''                                   // set STRIPE_PRICE_MONTHLY in secrets

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  let step = 'init'

  try {
    // 1. Auth
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

    // 2. Parse body
    step = 'parse'
    const body = await req.json()
    const { paymentMethodId, plan } = body
    if (!paymentMethodId)                    return err(400, 'paymentMethodId is required', step)
    if (plan !== 'annual' && plan !== 'monthly') return err(400, 'plan must be annual or monthly', step)

    // 3. Verify user has a trialing subscription (not already active)
    step = 'verify-trial'
    const { data: sub } = await sb
      .from('scout_subscriptions')
      .select('status, stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!sub) return err(404, 'No Scout subscription found for this user', step)
    if (sub.status === 'active') return err(409, 'Subscription is already active', step)

    // 4. Stripe: find or create customer
    step = 'stripe-customer'
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return err(500, 'Stripe key not configured', step)

    let customerId = sub.stripe_customer_id as string | null

    if (!customerId) {
      const search = await stripeReq(stripeKey, 'GET',
        `/customers/search?query=email:'${encodeURIComponent(user.email)}'&limit=1`)
      if (search.data?.length > 0) {
        customerId = search.data[0].id
      } else {
        const customer = await stripeReq(stripeKey, 'POST', '/customers', {
          email:                      user.email,
          'metadata[supabase_user_id]': user.id,
        })
        customerId = customer.id
      }
    }

    // 5. Attach payment method
    step = 'pm-attach'
    await stripeReq(stripeKey, 'POST', `/payment_methods/${paymentMethodId}/attach`, {
      customer: customerId,
    })

    step = 'pm-set-default'
    await stripeReq(stripeKey, 'POST', `/customers/${customerId!}`, {
      'invoice_settings[default_payment_method]': paymentMethodId,
    })

    // 6. Select price ID
    step = 'price-select'
    const priceAnnual  = Deno.env.get('STRIPE_PRICE_ANNUAL')  || DEFAULT_PRICE_ANNUAL
    const priceMonthly = Deno.env.get('STRIPE_PRICE_MONTHLY') || DEFAULT_PRICE_MONTHLY

    if (plan === 'monthly' && !priceMonthly) {
      return err(500, 'Monthly price ID not configured. Set STRIPE_PRICE_MONTHLY in Supabase secrets.', step)
    }

    const priceId = plan === 'annual' ? priceAnnual : priceMonthly

    // 7. Create Stripe subscription — no trial, charge immediately
    step = 'stripe-subscription'
    const subscription = await stripeReq(stripeKey, 'POST', '/subscriptions', {
      customer:          customerId!,
      'items[0][price]': priceId,
      'payment_settings[save_default_payment_method]': 'on_subscription',
      'metadata[supabase_user_id]': user.id,
      'metadata[plan]':             plan,
    })

    // 8. Update scout_subscriptions
    step = 'db-update'
    const periodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

    await sb.from('scout_subscriptions').update({
      status:             'active',
      stripe_customer_id: customerId,
      stripe_sub_id:      subscription.id,
      period_end:         periodEnd,
    }).eq('user_id', user.id)

    // 9. Log trial_converted to scout_events
    step = 'log-event'
    const { data: child } = await sb
      .from('children')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   child?.id ?? null,
      event_type: 'trial_converted',
      properties: {
        plan,
        stripe_sub_id: subscription.id,
        price_id:      priceId,
        period_end:    periodEnd,
      },
    })

    // 10. Fire scout-digest immediately — don't make them wait until next cron
    step = 'trigger-digest'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    fetch(`${supabaseUrl}/functions/v1/scout-digest`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({}),
    }).catch(e => {
      console.error('[scout-convert] Failed to trigger digest:', e.message)
    })

    console.log(`[scout-convert] Converted user ${user.id} to ${plan} plan`)

    return new Response(JSON.stringify({
      ok:             true,
      plan,
      subscriptionId: subscription.id,
      periodEnd,
    }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-convert] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)
    return err(500, msg, step)
  }
})
