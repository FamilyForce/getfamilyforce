// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Gift Purchase Edge Function
// No auth required. Buyer purchases Scout for a recipient.
//
// POST body:
//   { buyerName, buyerEmail, recipientName, recipientEmail,
//     personalMessage?, plan, paymentMethodId }
//
// Flow:
//   1. Validate inputs
//   2. Charge buyer via Stripe PaymentIntent (one-time, not subscription)
//   3. Generate unique gift code (SCOUT-XXXX-XXXX)
//   4. Create Stripe referral promotion code for buyer (25% off)
//   5. Store gift record in scout_gifts
//   6. Send beautiful gift email to recipient
//   7. Send confirmation + referral code to buyer
//
// Deploy: supabase functions deploy scout-gift-purchase
// Secrets: STRIPE_SECRET_KEY, STRIPE_REFERRAL_COUPON_ID,
//          RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          SITE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PRICES = {
  annual:     { amount: 7999,  display: '$79.99',  label: '1-year Scout subscription',  months: 12 },
  triennial: { amount: 19999, display: '$199.99', label: '3-year Scout subscription',  months: 36 },
  monthly:   { amount:  999,  display: '$9.99',   label: '1-month Scout subscription', months: 1  },
}

// ─── Gift code generator ──────────────────────────────────────────────────────
// Format: SCOUT-XXXX-XXXX (no confusing chars: 0/O, 1/I/L)
function generateGiftCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const rand = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `SCOUT-${rand()}-${rand()}`
}

// ─── Referral code generator ──────────────────────────────────────────────────
// Format: FRIEND-XXXX (short, shareable)
function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const rand = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `FRIEND-${rand()}-${rand()}`
}

// ─── Stripe helper ────────────────────────────────────────────────────────────
async function stripeReq(key: string, method: string, path: string, body?: Record<string, unknown>) {
  const encoded = body
    ? Object.entries(body)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : undefined
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${key}`,
      ...(encoded ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: method !== 'GET' ? encoded : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe ${res.status}`)
  return data
}

// ─── Gift email to recipient ──────────────────────────────────────────────────
function buildGiftEmail(opts: {
  recipientName: string
  buyerName:     string
  plan:          'annual' | 'triennial' | 'monthly'
  personalMessage?: string
  redeemUrl:     string
  siteUrl:       string
}): string {
  const { recipientName, buyerName, plan, personalMessage, redeemUrl, siteUrl } = opts
  const planLabel = plan === 'annual' ? 'one year' : plan === 'triennial' ? 'three years' : 'one month'
  const preheader = `${buyerName} gave you ${planLabel} of FamilyForce Scout — developmental milestone tracking for your child.`

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>You have a gift from ${buyerName}</title>
  <style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr><td align="center" style="padding:24px 12px 40px">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

        <!-- Wordmark -->
        <tr><td style="padding:0 0 16px">
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
        </td></tr>

        <!-- Gift card -->
        <tr>
          <td style="background:#6E4ED6;border-radius:20px;padding:32px;text-align:center">
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase;margin:0 0 10px">A gift for you 🎁</p>
            <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#FFFFFF;margin:0 0 10px;line-height:1.3">Never miss a milestone.</h1>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.85);margin:0 0 24px;line-height:1.6">${buyerName} gave you ${planLabel} of Scout — research-backed developmental milestone tracking delivered to your inbox every month.</p>
            ${personalMessage ? `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px">
              <tr><td style="background:rgba(255,255,255,.15);border-radius:12px;padding:16px">
                <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#FFFFFF;margin:0;line-height:1.7;font-style:italic">"${personalMessage}"</p>
                <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.7);margin:8px 0 0">— ${buyerName}</p>
              </td></tr>
            </table>` : ''}
            <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${redeemUrl}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#FFFFFF"><w:anchorlock/><center style="color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;">Claim your gift →</center></v:roundrect><![endif]-->
            <!--[if !mso]><!-->
            <a href="${redeemUrl}" style="display:inline-block;background:#FFFFFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;padding:15px 32px;border-radius:100px;text-decoration:none;mso-hide:all">Claim your gift →</a>
            <!--<![endif]-->
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.6);margin:16px 0 0">No credit card needed to claim.</p>
          </td>
        </tr>
        <tr><td style="height:16px"></td></tr>

        <!-- What is Scout -->
        <tr>
          <td style="background:#FFFFFF;border-radius:16px;padding:24px">
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px">What you get every month</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:0 0 10px">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">📬</p></td>
                  <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Monthly digest email</strong> — your child's open developmental windows, the ones that matter most this month, with exactly what to do.</p></td>
                </tr></table>
              </td></tr>
              <tr><td style="padding:0 0 10px">
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">📅</p></td>
                  <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Calendar event</strong> — placed on your child's birthday every month, with a 7-day reminder before windows close.</p></td>
                </tr></table>
              </td></tr>
              <tr><td>
                <table cellpadding="0" cellspacing="0" border="0"><tr>
                  <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">🎯</p></td>
                  <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Research-backed</strong> — every window is grounded in peer-reviewed developmental science. No parenting noise. Just what matters.</p></td>
                </tr></table>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:16px"></td></tr>

        <!-- How to claim -->
        <tr>
          <td style="border-left:3px solid #6E4ED6;padding:14px 16px;background:#F9F8FD;border-radius:0 8px 8px 0">
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#3D2A9E;margin:0 0 8px">How to claim in 2 minutes:</p>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:0 0 4px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">1. Click "Claim your gift" above</p></td></tr>
              <tr><td style="padding:0 0 4px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">2. Create a free FamilyForce account</p></td></tr>
              <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">3. Enter your child's name and birthday — Scout starts immediately</p></td></tr>
            </table>
          </td>
        </tr>
        <tr><td style="height:32px"></td></tr>

        <!-- Signature -->
        <tr><td>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">Dad of two · Founder, FamilyForce</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6;font-style:italic">Got it wrong with First Son. Got it right with Second Son. Make informed parenting decisions.</p>
        </td></tr>
        <tr><td style="height:32px"></td></tr>

        <!-- Footer -->
        <tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:4px 0 0">This gift was sent to you by ${buyerName}. You were not signed up for any mailing list.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Buyer confirmation email ─────────────────────────────────────────────────
function buildConfirmEmail(opts: {
  buyerName:      string
  recipientName:  string
  recipientEmail: string
  plan:           'annual' | 'triennial' | 'monthly'
  referralCode:   string
  siteUrl:        string
}): string {
  const { buyerName, recipientName, recipientEmail, plan, referralCode, siteUrl } = opts
  const planLabel = plan === 'annual' ? '1-year' : plan === 'triennial' ? '3-year' : '1-month'
  const discount  = '25%'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Scout gift is on its way</title>
  <style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">Your Scout gift for ${recipientName} is confirmed. Here is your personal referral code.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr><td align="center" style="padding:24px 12px 40px">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

        <tr><td style="padding:0 0 16px">
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
        </td></tr>

        <tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">Your gift is on its way, ${buyerName}.</h1>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">A ${planLabel} Scout subscription has been sent to <strong>${recipientName}</strong> at ${recipientEmail}. They will receive an email with a link to claim it.</p>
        </td></tr>
        <tr><td style="height:12px"></td></tr>

        <!-- Referral code -->
        <tr>
          <td style="background:#6E4ED6;border-radius:16px;padding:24px">
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">Your referral code</p>
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#FFFFFF;letter-spacing:.08em;margin:0 0 8px">${referralCode}</p>
            <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.8);margin:0 0 16px;line-height:1.6">Share this code with anyone — they get <strong style="color:#FFFFFF">${discount} off</strong> their first Scout payment. Use it yourself too if you want to subscribe.</p>
            <a href="${siteUrl}/sign-in.html?promo=${referralCode}" style="display:inline-block;background:#FFFFFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none">Use your code →</a>
          </td>
        </tr>
        <tr><td style="height:32px"></td></tr>

        <tr><td>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">Dad of two · Founder, FamilyForce</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6;font-style:italic">Got it wrong with First Son. Got it right with Second Son. Make informed parenting decisions.</p>
        </td></tr>
        <tr><td style="height:32px"></td></tr>

        <tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(msg: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chat  = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chat) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: `🎁 scout-gift-purchase: ${msg}` }),
  }).catch(() => {})
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  let step = 'init'

  try {
    step = 'parse'
    const body = await req.json()
    const { buyerName, buyerEmail, recipientName, recipientEmail,
            personalMessage, plan, paymentMethodId } = body

    if (!buyerName || !buyerEmail)        return err(400, 'buyerName and buyerEmail are required', step)
    if (!recipientName || !recipientEmail) return err(400, 'recipientName and recipientEmail are required', step)
    if (!['annual','triennial','monthly'].includes(plan)) return err(400, 'plan must be annual, triennial or monthly', step)
    if (!paymentMethodId)                  return err(400, 'paymentMethodId is required', step)

    const priceInfo = PRICES[plan as 'annual' | 'triennial' | 'monthly']
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const siteUrl   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 1. Create/find Stripe customer for buyer
    step = 'stripe-customer'
    const search = await stripeReq(stripeKey, 'GET',
      `/customers/search?query=email:'${encodeURIComponent(buyerEmail)}'&limit=1`)
    let customerId: string
    if (search.data?.length > 0) {
      customerId = search.data[0].id
    } else {
      const customer = await stripeReq(stripeKey, 'POST', '/customers', {
        email: buyerEmail, name: buyerName,
        'metadata[type]': 'gift_buyer',
      })
      customerId = customer.id
    }

    // 2. Attach payment method
    step = 'stripe-pm'
    await stripeReq(stripeKey, 'POST', `/payment_methods/${paymentMethodId}/attach`, { customer: customerId })
    await stripeReq(stripeKey, 'POST', `/customers/${customerId}`, {
      'invoice_settings[default_payment_method]': paymentMethodId,
    })

    // 3. Create PaymentIntent (one-time charge — not a subscription)
    step = 'stripe-payment'
    const pi = await stripeReq(stripeKey, 'POST', '/payment_intents', {
      amount:         priceInfo.amount,
      currency:       'usd',
      customer:       customerId,
      payment_method: paymentMethodId,
      confirm:        'true',
      description:    `Scout gift — ${priceInfo.label} for ${recipientEmail}`,
      'metadata[type]':            'scout_gift',
      'metadata[plan]':            plan,
      'metadata[buyer_email]':     buyerEmail,
      'metadata[recipient_email]': recipientEmail,
    })

    if (pi.status !== 'succeeded') {
      return err(402, `Payment not completed: ${pi.status}`, step)
    }

    // 4. Generate gift code (retry up to 5 times for uniqueness)
    step = 'gift-code'
    let giftCode = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateGiftCode()
      const { data: existing } = await sb
        .from('scout_gifts').select('id').eq('code', candidate).maybeSingle()
      if (!existing) { giftCode = candidate; break }
    }
    if (!giftCode) throw new Error('Failed to generate unique gift code after 5 attempts')

    // 5. Create Stripe referral promotion code for buyer
    step = 'stripe-referral'
    const referralCouponId = Deno.env.get('STRIPE_REFERRAL_COUPON_ID')
    let referralCode = ''
    let stripePromoId = ''

    if (referralCouponId) {
      const promoCodeStr = generateReferralCode()
      const promo = await stripeReq(stripeKey, 'POST', '/promotion_codes', {
        coupon:           referralCouponId,
        code:             promoCodeStr,
        'metadata[buyer_email]': buyerEmail,
        'metadata[buyer_name]':  buyerName,
      }).catch(() => null)
      if (promo?.code) {
        referralCode  = promo.code
        stripePromoId = promo.id
      }
    }

    // Fallback: generate a code even if Stripe promo fails
    if (!referralCode) referralCode = generateReferralCode()

    // 6. Store in scout_gifts
    step = 'db-insert'
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    await sb.from('scout_gifts').insert({
      code:                     giftCode,
      plan,
      plan_months:              priceInfo.months,
      buyer_name:               buyerName,
      buyer_email:              buyerEmail,
      recipient_email:          recipientEmail,
      recipient_name:           recipientName,
      personal_message:         personalMessage ?? null,
      stripe_payment_intent_id: pi.id,
      stripe_referral_code:     referralCode,
      expires_at:               expiresAt.toISOString(),
    })

    // 7. Send gift email to recipient
    step = 'email-recipient'
    const redeemUrl    = `${siteUrl}/scout-gift.html?redeem=${giftCode}`
    const resendKey    = Deno.env.get('RESEND_API_KEY')!
    const fromEmail    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName     = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'

    const giftHtml = buildGiftEmail({
      recipientName, buyerName, plan,
      personalMessage: personalMessage ?? undefined,
      redeemUrl, siteUrl,
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [recipientEmail],
        subject: `${buyerName} gave you a gift — FamilyForce Scout 🎁`,
        html:    giftHtml,
        tags:    [{ name: 'email_type', value: 'gift_recipient' }],
      }),
    })

    // 8. Send confirmation email to buyer
    step = 'email-buyer'
    const confirmHtml = buildConfirmEmail({
      buyerName, recipientName, recipientEmail, plan, referralCode, siteUrl,
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [buyerEmail],
        subject: `Your Scout gift for ${recipientName} is on its way`,
        html:    confirmHtml,
        tags:    [{ name: 'email_type', value: 'gift_buyer_confirm' }],
      }),
    })

    await telegramAlert(`Gift sold: ${plan} plan — ${buyerEmail} → ${recipientEmail} — code ${giftCode}`)

    // Log gift_purchased event (no user_id — anonymous buyer)
    await sb.from('scout_events').insert({
      user_id:    null,
      event_type: 'gift_purchased',
      properties: { plan, amount: priceInfo.amount, buyer_email: buyerEmail },
    }).catch(() => {})

    return new Response(JSON.stringify({
      ok: true, giftCode, referralCode,
      recipientEmail, plan,
      amount: priceInfo.display,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-gift-purchase] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)
    return err(500, msg, step)
  }
})
