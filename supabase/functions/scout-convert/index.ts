// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial Conversion + Additional Child Subscription
// Converts a trialing user to a paid subscriber (child #1)
// OR adds a new paid subscription for an additional child (child #2+).
//
// POST body:
//   { paymentMethodId, plan: 'annual' | 'triennial' | 'monthly' }  ← trial conversion (child #1)
//   { paymentMethodId?, plan, childId }                              ← new child subscription
//     paymentMethodId is optional for child #2+ if user already has a Stripe customer+PM
//
// Auth: Bearer session token
//
// Triennial plan (both paths):
//   Uses PaymentIntent (one-time charge $99.99) — NOT a Stripe subscription.
//   No renewal emails, no cancellation emails from Stripe.
//   DB: status=active, period_end = 3 years from now, plan=triennial.
//   Stripe: stripe_payment_intent_id stored instead of stripe_sub_id.
//
// Trial conversion flow (child #1, annual/monthly):
//   1. Auth + verify trialing subscription exists
//   2. Find/create Stripe customer, attach PM
//   3. Create Stripe subscription (immediate billing)
//   4. Update scout_subscriptions row: status=active + child_id
//   5. Fire scout-signup-delivery (conversion digest + .ics)
//   6. Log trial_converted event
//
// Additional child flow (child #2+, annual/monthly):
//   1. Auth + validate childId belongs to user
//   2. Verify child doesn't already have an active subscription
//   3. Find existing Stripe customer (reuse from child #1 sub)
//   4. Attach PM if provided; else use customer's existing default PM
//   5. Calculate catch-up period: trial_end = nextMonthlyBirthday(childDob, today)
//      Bonus month: if first birthday ≤7 days away, extend by one more month
//   6. Create Stripe subscription with trial_end (catch-up period is free)
//   7. INSERT new scout_subscriptions row (child_id, status=trialing, trial_end)
//   8. Fire scout-signup-delivery for this child
//   9. Log child_subscription_added event
//
// Deploy: supabase functions deploy scout-convert
// Secrets: STRIPE_SECRET_KEY, STRIPE_SECRET_KEY_TEST, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY,
//          STRIPE_PRICE_ANNUAL_TEST, STRIPE_PRICE_MONTHLY_TEST,
//          STRIPE_TRIENNIAL_AMOUNT_CENTS (default 9999), STRIPE_TRIENNIAL_AMOUNT_CENTS_TEST (default 9999)
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const DEFAULT_PRICE_ANNUAL        = 'price_1TAQWtRF5ve13fCKONaDJ7Ji'
const DEFAULT_PRICE_MONTHLY       = ''    // set STRIPE_PRICE_MONTHLY in secrets
const DEFAULT_TRIENNIAL_CENTS     = 9999  // $99.99 — triennial uses PaymentIntent, not a subscription price

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

// Create + confirm a PaymentIntent for triennial (one-time charge, no subscription)
async function chargeTriennialPI(
  stripeKey: string,
  customerId: string,
  paymentMethodId: string,
  amountCents: number,
  userId: string,
) {
  const pi = await stripeReq(stripeKey, 'POST', '/payment_intents', {
    amount:               amountCents,
    currency:             'usd',
    customer:             customerId,
    payment_method:       paymentMethodId,
    confirm:              'true',
    off_session:          'true',
    'metadata[supabase_user_id]': userId,
    'metadata[plan]':     'triennial',
  })
  if (pi.status !== 'succeeded') {
    throw new Error(`Payment did not succeed: status=${pi.status}`)
  }
  return pi
}

async function sendEmail(resendKey: string, to: string, subject: string, html: string) {
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ from: 'FamilyForce <scout@getfamilyforce.com>', to: [to], subject, html }),
  })
}

function buildSubscriptionConfirmEmail(opts: {
  userName: string; userEmail: string; plan: 'annual' | 'triennial' | 'monthly'
  amountDisplay: string; chargedNow: boolean
  subscriptionId: string; billingStartDate?: string
  nextDigestDate?: string
  purchasedAt: Date; siteUrl: string
}): string {
  const { userName, plan, amountDisplay, chargedNow, subscriptionId, billingStartDate, nextDigestDate, purchasedAt, siteUrl } = opts
  const planLabel   = plan === 'annual' ? '1-Year Scout Subscription' : plan === 'triennial' ? '3-Year Scout Subscription (Full Journey)' : 'Monthly Scout Subscription'
  const billingDesc = plan === 'annual' ? 'billed annually' : plan === 'triennial' ? 'one-time payment for 3 years' : 'billed monthly'
  const purchaseFmt = purchasedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const orderRef    = subscriptionId.replace('sub_', 'SUB-')

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Welcome to Scout</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">${chargedNow ? `You're in — your card has been charged ${amountDisplay}.` : `You're in — billing starts ${billingStartDate}.`}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<!-- Hero -->
<tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">You're in, ${userName}. 🎉</h1>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.6">${chargedNow
    ? `Your <strong>${planLabel}</strong> is now active. ${amountDisplay} has been charged to your card — keep this email as your receipt.`
    : `Your <strong>${planLabel}</strong> is set up. Your first payment of <strong>${amountDisplay}</strong> (${billingDesc}) will be charged on <strong>${billingStartDate}</strong>.`
  }</p>

  <!-- Order summary -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F9F8FF;border:1.5px solid #E5E2EC;border-radius:12px;padding:16px 20px;margin-bottom:20px">
  <tr><td colspan="2" style="padding:0 0 10px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;text-transform:uppercase;letter-spacing:.1em;margin:0">Order summary</p>
  </td></tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#1D1D1F;padding:0 0 4px">${planLabel}</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;padding:0 0 4px">${amountDisplay}</td>
  </tr>
  <tr>
    <td style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;padding:0 0 10px">Order #${orderRef}</td>
    <td align="right" style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;padding:0 0 10px">${purchaseFmt}</td>
  </tr>
  <tr><td colspan="2" style="border-top:1px solid #E5E2EC;padding-top:10px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#5C5960;margin:0">${chargedNow
      ? `✅ Thank you for your purchase. Your card has been charged <strong>${amountDisplay}</strong>.`
      : `📅 No charge today. Billing starts <strong>${billingStartDate}</strong>.`
    }</p>
  </td></tr>
  </table>

  <a href="${siteUrl}/scout-dashboard.html" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none">Open Scout dashboard →</a>
  ${nextDigestDate ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:16px 0 0">📬 Your next digest arrives <strong style="color:#5C5960">${nextDigestDate}</strong>.</p>` : ''}
</td></tr>
<tr><td style="height:32px"></td></tr>
<tr><td style="height:32px"></td></tr>

<!-- Footer -->
<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`
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
    const { paymentMethodId, plan, childId, referralCode, testMode: bodyTestMode } = body
    if (!['annual', 'monthly', 'triennial'].includes(plan)) return err(400, 'plan must be annual, monthly or triennial', step)

    const isAdditionalChild = !!childId
    const testMode = bodyTestMode === true

    // ── Price IDs ─────────────────────────────────────────────────────────────
    step = 'price-select'
    const stripeKey = testMode
      ? Deno.env.get('STRIPE_SECRET_KEY_TEST')
      : Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) return err(500, testMode ? 'Test Stripe key not configured' : 'Stripe key not configured', step)

    const priceAnnual  = (testMode ? Deno.env.get('STRIPE_PRICE_ANNUAL_TEST')  : Deno.env.get('STRIPE_PRICE_ANNUAL'))  || DEFAULT_PRICE_ANNUAL
    const priceMonthly = (testMode ? Deno.env.get('STRIPE_PRICE_MONTHLY_TEST') : Deno.env.get('STRIPE_PRICE_MONTHLY')) || DEFAULT_PRICE_MONTHLY
    if (plan === 'monthly' && !priceMonthly) return err(500, 'Monthly price ID not configured', step)
    const priceId = plan === 'annual' ? priceAnnual : priceMonthly

    // Triennial: one-time PaymentIntent — amount in cents (default $99.99)
    const triennialCents     = parseInt(
      (testMode ? Deno.env.get('STRIPE_TRIENNIAL_AMOUNT_CENTS_TEST') : Deno.env.get('STRIPE_TRIENNIAL_AMOUNT_CENTS')) ?? String(DEFAULT_TRIENNIAL_CENTS)
    )
    const triennialPeriodEnd = plan === 'triennial'
      ? new Date(Date.now() + 3 * 365.25 * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    // ── Validate referral code (non-blocking — discount is best-effort) ───────
    step = 'referral-check'
    let appliedCoupon: string | null = null
    let referrerUserId: string | null = null
    if (referralCode && typeof referralCode === 'string') {
      const cleanCode        = referralCode.trim().toUpperCase()
      const liveCouponId     = Deno.env.get('STRIPE_REFERRAL_COUPON_ID')
      const testCouponId     = Deno.env.get('STRIPE_REFERRAL_COUPON_ID_TEST')
      const activeCouponId   = testMode ? testCouponId : liveCouponId

      // Test mode: any FRIEND-* pattern is treated as a valid test referral code
      const isFriendCode = /^FRIEND-.+/.test(cleanCode)
      if (testMode && isFriendCode && testCouponId) {
        appliedCoupon = testCouponId
        console.log(`[scout-convert] Test referral code ${cleanCode} — applying test coupon ${testCouponId}`)
      } else if (activeCouponId && /^[A-Z]+-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(cleanCode)) {
        // Live: look up code in profiles table
        try {
          const { data: refOwner } = await sb
            .from('profiles')
            .select('id')
            .eq('referral_code', cleanCode)
            .neq('id', user.id)   // can't use your own code
            .maybeSingle()
          if (refOwner) {
            appliedCoupon   = activeCouponId
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

      // ── Triennial: PaymentIntent (one-time charge), no Stripe subscription ──
      if (plan === 'triennial') {
        step = 'stripe-payment-intent'
        if (!paymentMethodId) return err(400, 'paymentMethodId required for triennial', step)
        const pi = await chargeTriennialPI(stripeKey, customerId!, paymentMethodId, triennialCents, user.id)

        step = 'db-insert'
        await sb.from('scout_subscriptions').insert({
          user_id:                   user.id,
          child_id:                  childId,
          status:                    'active',
          stripe_customer_id:        customerId,
          stripe_payment_intent_id:  pi.id,
          period_end:                triennialPeriodEnd,
          plan,
        })

        step = 'log-event'
        await sb.from('scout_events').insert({
          user_id: user.id, child_id: childId,
          event_type: 'child_subscription_added',
          properties: { plan, stripe_pi_id: pi.id, amount_cents: triennialCents, period_end: triennialPeriodEnd },
        })

        await telegramAlert(`🎉 Triennial child subscription: user=${user.email}, child=${child.name}`)

        step = 'email-confirm'
        const resendKeyT = Deno.env.get('RESEND_API_KEY')
        const siteUrlT   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
        if (resendKeyT) {
          const { data: profT } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
          const nameT       = profT?.name ?? user.email.split('@')[0]
          const dobT        = new Date(child.dob + 'T00:00:00Z')
          const nextDigestT = nextMonthlyBirthday(dobT, new Date())
            .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
          await sendEmail(resendKeyT, user.email, `Your Scout subscription for ${child.name} is confirmed`,
            buildSubscriptionConfirmEmail({
              userName: nameT, userEmail: user.email, plan,
              amountDisplay: `$${(triennialCents / 100).toFixed(2)}`, chargedNow: true,
              subscriptionId: pi.id, nextDigestDate: nextDigestT,
              purchasedAt: new Date(), siteUrl: siteUrlT,
            })
          ).catch(e => console.error('[scout-convert] Triennial email failed (non-fatal):', e))
        }

        return new Response(JSON.stringify({
          ok: true, mode: 'additional_child', plan, childId,
          periodEnd: triennialPeriodEnd, paymentIntentId: pi.id,
        }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
      }

      // ── Annual / Monthly: Stripe subscription with catch-up trial period ──
      step = 'stripe-subscription'
      const trialEndUnix = Math.floor(trialEnd.getTime() / 1000)
      const subscription = await stripeReq(stripeKey, 'POST', '/subscriptions', {
        customer:                          customerId!,
        'items[0][price]':                 priceId,
        trial_end:                         trialEndUnix,
        ...(appliedCoupon ? { 'discounts[0][coupon]': appliedCoupon } : {}),
        'payment_settings[save_default_payment_method]': 'on_subscription',
        'metadata[supabase_user_id]':      user.id,
        'metadata[child_id]':              childId,
        'metadata[plan]':                  plan,
        'expand[]':                        'latest_invoice',
      })

      // INSERT new subscription row for this child
      step = 'db-insert'
      const rawPeriodEnd = subscription.current_period_end
        ?? subscription.latest_invoice?.period_end
        ?? null
      const periodEnd = rawPeriodEnd
        ? new Date(rawPeriodEnd * 1000).toISOString()
        : null

      await sb.from('scout_subscriptions').insert({
        user_id:            user.id,
        child_id:           childId,
        status:             'trialing',   // trial = catch-up period
        stripe_customer_id: customerId,
        stripe_sub_id:      subscription.id,
        trial_end:          trialEnd.toISOString(),
        period_end:         periodEnd,
        plan,
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

      await telegramAlert(`🎉 Additional child subscription: user=${user.email}, child=${child.name}, plan=${plan}, bonus=${bonusEligible}`)

      // Send confirmation email — no charge today, billing starts at trial_end
      step = 'email-confirm'
      const resendKeyA  = Deno.env.get('RESEND_API_KEY')
      const siteUrlA    = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
      const { data: profileA } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
      const userNameA   = profileA?.name ?? user.email.split('@')[0]
      const billingDate  = trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
      const nextDigestA  = billingDate  // for additional child, first real digest fires at billing date
      const planAmtA     = plan === 'annual' ? '$49.99' : '$9.99'
      if (resendKeyA) {
        try {
          await sendEmail(resendKeyA, user.email,
            `Your Scout subscription for ${child.name} is confirmed`,
            buildSubscriptionConfirmEmail({
              userName: userNameA, userEmail: user.email, plan,
              amountDisplay: planAmtA, chargedNow: false,
              subscriptionId: subscription.id,
              billingStartDate: billingDate, nextDigestDate: nextDigestA,
              purchasedAt: new Date(), siteUrl: siteUrlA,
            })
          )
        } catch (e) { console.error('[scout-convert] Confirm email failed (non-fatal):', e) }
      }

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

    // ── Triennial: PaymentIntent (one-time charge), no Stripe subscription ──
    if (plan === 'triennial') {
      step = 'stripe-payment-intent'
      const pi = await chargeTriennialPI(stripeKey, customerId!, paymentMethodId, triennialCents, user.id)

      step = 'db-update'
      await sb.from('scout_subscriptions').update({
        status:                    'active',
        stripe_customer_id:        customerId,
        stripe_payment_intent_id:  pi.id,
        period_end:                triennialPeriodEnd,
        plan,
      }).eq('id', subToConvert.id)

      // log-event, digest, email — then return early
      step = 'log-event'
      let eventChildIdT = subToConvert.child_id as string | null
      if (!eventChildIdT) {
        const { data: fc } = await sb.from('children').select('id').eq('user_id', user.id)
          .order('created_at', { ascending: true }).limit(1).maybeSingle()
        eventChildIdT = fc?.id ?? null
      }
      await sb.from('scout_events').insert({
        user_id: user.id, child_id: eventChildIdT,
        event_type: 'trial_converted',
        properties: { plan, stripe_pi_id: pi.id, amount_cents: triennialCents, period_end: triennialPeriodEnd },
      })

      // No immediate digest on conversion — next digest fires on normal monthly birthday schedule

      await telegramAlert(`💳 Triennial trial converted! user=${user.email}`)

      step = 'email-confirm'
      const resendKeyT = Deno.env.get('RESEND_API_KEY')
      const siteUrlT   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
      if (resendKeyT) {
        const { data: profT } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
        const nameT = profT?.name ?? user.email.split('@')[0]
        // Fetch child DOB for next digest date
        let nextDigestT: string | undefined
        if (eventChildIdT) {
          const { data: childT } = await sb.from('children').select('dob').eq('id', eventChildIdT).maybeSingle()
          if (childT?.dob) {
            nextDigestT = nextMonthlyBirthday(new Date(childT.dob + 'T00:00:00Z'), new Date())
              .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
          }
        }
        await sendEmail(resendKeyT, user.email, `Welcome to Scout — you're all set`,
          buildSubscriptionConfirmEmail({
            userName: nameT, userEmail: user.email, plan,
            amountDisplay: `$${(triennialCents / 100).toFixed(2)}`, chargedNow: true,
            subscriptionId: pi.id, nextDigestDate: nextDigestT,
            purchasedAt: new Date(), siteUrl: siteUrlT,
          })
        ).catch(e => console.error('[scout-convert] Triennial email failed (non-fatal):', e))
      }

      return new Response(JSON.stringify({
        ok: true, mode: 'trial_converted', plan,
        periodEnd: triennialPeriodEnd, paymentIntentId: pi.id,
      }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })
    }

    // ── Annual / Monthly: Stripe subscription, charge immediately ──
    step = 'stripe-subscription'
    const subscription = await stripeReq(stripeKey, 'POST', '/subscriptions', {
      customer:          customerId!,
      'items[0][price]': priceId,
      ...(appliedCoupon ? { 'discounts[0][coupon]': appliedCoupon } : {}),
      'payment_settings[save_default_payment_method]': 'on_subscription',
      'metadata[supabase_user_id]': user.id,
      'metadata[plan]':             plan,
      'expand[]':                   'latest_invoice',
    })

    // Update subscription row
    // current_period_end can be null for incomplete subscriptions — fall back to invoice.period_end
    step = 'db-update'
    const rawPeriodEnd = subscription.current_period_end
      ?? subscription.latest_invoice?.period_end
      ?? null
    const periodEnd = rawPeriodEnd
      ? new Date(rawPeriodEnd * 1000).toISOString()
      : null
    console.log('[scout-convert] PATH B periodEnd:', periodEnd, 'status:', subscription.status)

    await sb.from('scout_subscriptions').update({
      status:             'active',
      stripe_customer_id: customerId,
      stripe_sub_id:      subscription.id,
      period_end:         periodEnd,
      plan,
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

    // No immediate digest on conversion — next digest fires on normal monthly birthday schedule

    // Notify admin
    await telegramAlert(`💳 Trial converted! user=${user.email}, plan=${plan}`)

    // Send confirmation email — charge fired immediately; fetch invoice for exact amount
    step = 'email-confirm'
    const resendKeyB = Deno.env.get('RESEND_API_KEY')
    const siteUrlB   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    if (resendKeyB) {
      try {
        const { data: profileB } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
        const userNameB   = profileB?.name ?? user.email.split('@')[0]
        let   chargedDisplay = plan === 'annual' ? '$49.99' : '$9.99'  // fallback
        if (subscription.latest_invoice) {
          try {
            const invoice    = await stripeReq(stripeKey, 'GET', `/invoices/${subscription.latest_invoice}`)
            const amountPaid = invoice?.amount_paid ?? 0
            chargedDisplay   = `$${(amountPaid / 100).toFixed(2)}`
          } catch { /* use fallback */ }
        }
        // Fetch child DOB for next digest date
        let nextDigestB: string | undefined
        if (eventChildId) {
          const { data: childB } = await sb.from('children').select('dob').eq('id', eventChildId).maybeSingle()
          if (childB?.dob) {
            nextDigestB = nextMonthlyBirthday(new Date(childB.dob + 'T00:00:00Z'), new Date())
              .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
          }
        }
        await sendEmail(resendKeyB, user.email,
          `Welcome to Scout — you're all set`,
          buildSubscriptionConfirmEmail({
            userName: userNameB, userEmail: user.email, plan,
            amountDisplay: chargedDisplay, chargedNow: true,
            subscriptionId: subscription.id, nextDigestDate: nextDigestB,
            purchasedAt: new Date(), siteUrl: siteUrlB,
          })
        )
      } catch (e) { console.error('[scout-convert] Confirm email failed (non-fatal):', e) }
    }

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
