// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Gift Purchase Edge Function v2
// No auth required. Buyer purchases Scout for a recipient.
//
// Two-step flow (required for 3D Secure / SCA compliance):
//
//   Step 1 — POST { action: 'create-intent', buyerName, buyerEmail,
//                   recipientName, recipientEmail, plan, promoCode?,
//                   stripeDiscountPromoId? }
//     → { ok, clientSecret, intentId }
//     Frontend then calls stripe.confirmCardPayment(clientSecret) to
//     handle 3DS natively. No charge happens here.
//
//   Step 2 — POST { action: 'complete-purchase', paymentIntentId,
//                   buyerName, buyerEmail, recipientName, recipientEmail,
//                   personalMessage?, plan }
//     → { ok, giftCode, referralCode, recipientEmail, plan, amount }
//     Called after stripe.confirmCardPayment succeeds.
//     Idempotent: safe to call twice (checks PI id in scout_gifts first).
//
// Also supports:
//   POST { action: 'validate-coupon', code, plan }
//     → { ok, label, discountedDisplay, stripePromoId, ... }
//
// Deploy: supabase functions deploy scout-gift-purchase --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_REFERRAL_COUPON_ID,
//          RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          SITE_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PRICES = {
  annual:    { amount: 4999,  display: '$49.99',  label: '1-year Scout subscription',  months: 12 },
  triennial: { amount: 9999,  display: '$99.99',  label: '3-year Scout subscription',  months: 36 },
  monthly:   { amount:  999,  display: '$9.99',   label: '1-month Scout subscription', months: 1  },
}

// ─── Code generators ──────────────────────────────────────────────────────────
// No confusing chars: 0/O, 1/I/L
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateGiftCode(): string {
  const rand = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
  return `SCOUT-${rand()}-${rand()}`
}

function generateReferralCode(): string {
  const rand = () => Array.from({ length: 4 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
  return `FRIEND-${rand()}-${rand()}`
}

// ─── Stripe helper ────────────────────────────────────────────────────────────
async function stripeReq(
  key: string, method: string, path: string,
  body?: Record<string, unknown>,
  idempotencyKey?: string,
) {
  const encoded = body
    ? Object.entries(body)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : undefined
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key}`,
    ...(encoded ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
  }
  const res  = await fetch(`https://api.stripe.com/v1${path}`, {
    method, headers, body: method !== 'GET' ? encoded : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `Stripe ${res.status}`)
  return data
}

// ─── Email: gift to recipient ─────────────────────────────────────────────────
function buildGiftEmail(opts: {
  recipientName: string; buyerName: string
  plan: 'annual' | 'triennial' | 'monthly'
  personalMessage?: string; redeemUrl: string
  siteUrl: string; expiresAt: Date
}): string {
  const { recipientName, buyerName, plan, personalMessage, redeemUrl, siteUrl, expiresAt } = opts
  const planLabel = plan === 'annual' ? 'one year' : plan === 'triennial' ? 'three years (birth to age 3)' : 'one month'
  const expiryFmt = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const preheader = `${buyerName} gave you ${planLabel} of FamilyForce Scout — developmental milestone tracking for your child.`

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You have a gift from ${buyerName}</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<!-- Hero card -->
<tr><td style="background:#6E4ED6;border-radius:20px;padding:32px;text-align:center">
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
  <a href="${redeemUrl}" style="display:inline-block;background:#FFFFFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;padding:15px 32px;border-radius:100px;text-decoration:none">Claim your gift →</a>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:rgba(255,255,255,.6);margin:16px 0 0">No credit card needed to claim.</p>
</td></tr>
<tr><td style="height:16px"></td></tr>

<!-- What is Scout -->
<tr><td style="background:#FFFFFF;border-radius:16px;padding:24px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 14px">What you get every month</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0 0 10px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">📬</p></td>
      <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Monthly digest email</strong> — your child's open developmental windows, the ones that matter most, with exactly what to do.</p></td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:0 0 10px">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">📅</p></td>
      <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Calendar reminder</strong> — placed on your child's birthday every month, with a 7-day heads-up before any windows close.</p></td>
    </tr></table>
  </td></tr>
  <tr><td>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:20px;vertical-align:top;padding-top:2px"><p style="font-size:14px;margin:0">🎯</p></td>
      <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.6"><strong>Research-backed</strong> — every window is grounded in peer-reviewed developmental science. No noise. Just what matters.</p></td>
    </tr></table>
  </td></tr>
  </table>
</td></tr>
<tr><td style="height:16px"></td></tr>

<!-- How to claim -->
<tr><td style="border-left:3px solid #6E4ED6;padding:14px 16px;background:#F9F8FD;border-radius:0 8px 8px 0">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#3D2A9E;margin:0 0 8px">How to claim in 2 minutes:</p>
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:0 0 4px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">1. Click "Claim your gift" above</p></td></tr>
  <tr><td style="padding:0 0 4px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">2. Create a free FamilyForce account</p></td></tr>
  <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0">3. Enter your child's name and birthday — Scout starts immediately</p></td></tr>
  </table>
</td></tr>
<tr><td style="height:16px"></td></tr>

<!-- Expiry notice -->
<tr><td style="background:#FFFBEB;border:1px solid #F5D97A;border-radius:10px;padding:12px 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7A5A00;margin:0;line-height:1.6">⏰ <strong>Claim before ${expiryFmt}.</strong> Baby not here yet? No problem — hold on to this email and activate once they arrive. The code is valid for one year from today.</p>
</td></tr>
<tr><td style="height:32px"></td></tr>

<!-- Sig -->
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

</table></td></tr></table>
</body></html>`
}

// ─── Email: confirmation to buyer ─────────────────────────────────────────────
function buildConfirmEmail(opts: {
  buyerName: string; recipientName: string; recipientEmail: string
  plan: 'annual' | 'triennial' | 'monthly'
  referralCode: string; giftCode: string
  printCardUrl: string; siteUrl: string; expiresAt: Date
}): string {
  const { buyerName, recipientName, recipientEmail, plan, referralCode, giftCode, printCardUrl, siteUrl, expiresAt } = opts
  const planLabel = plan === 'annual' ? '1-year' : plan === 'triennial' ? '3-year (Full Journey)' : '1-month'
  const expiryFmt = expiresAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your Scout gift is on its way</title>
<style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">Your Scout gift for ${recipientName} is confirmed. Gift code inside.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

<tr><td style="padding:0 0 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
</td></tr>

<!-- Confirmation -->
<tr><td style="background:#FFFFFF;border-radius:16px;padding:28px">
  <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">Your gift is on its way, ${buyerName}.</h1>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.6">A ${planLabel} Scout subscription has been sent to <strong>${recipientName}</strong> at ${recipientEmail}.</p>

  <!-- Gift code box -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px">
  <tr><td style="background:#F0EBFF;border:1.5px solid rgba(110,78,214,.2);border-radius:12px;padding:16px 20px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#6E4ED6;text-transform:uppercase;letter-spacing:.1em;margin:0 0 6px">Gift code</p>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:22px;font-weight:800;color:#3B1FA8;letter-spacing:.12em;margin:0 0 8px">${giftCode}</p>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#5C5960;margin:0 0 6px">Keep this code. If ${recipientName} doesn't receive the email, they can redeem at <a href="${siteUrl}/scout-gift-checkout.html?redeem=${giftCode}" style="color:#6E4ED6;text-decoration:none">getfamilyforce.com/gift</a></p>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">📮 <strong>Wrong email?</strong> Reply to this email with the correct address and we'll resend the gift right away.</p>
  </td></tr></table>

  <!-- Expiry notice -->
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0;line-height:1.6">⏰ Code expires <strong style="color:#1D1D1F">${expiryFmt}</strong>. If ${recipientName} is expecting, they can activate once the baby arrives.</p>
</td></tr>
<tr><td style="height:12px"></td></tr>

<!-- Printable card -->
<tr><td style="background:#FFFFFF;border-radius:16px;padding:22px 28px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;margin:0 0 6px">🖨️ Want to give it in person?</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0 0 14px;line-height:1.6">Download a printable gift card — print it, pop it in an envelope, and hand it over.</p>
  <a href="${printCardUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none">Download printable card →</a>
</td></tr>
<tr><td style="height:12px"></td></tr>

<!-- Referral -->
<tr><td style="background:#6E4ED6;border-radius:16px;padding:24px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">Your referral code</p>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#FFFFFF;letter-spacing:.08em;margin:0 0 8px">${referralCode}</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.8);margin:0 0 16px;line-height:1.6">Share with anyone — they get <strong style="color:#fff">25% off</strong> their first Scout payment. Works for yourself too.</p>
  <a href="${siteUrl}/sign-in.html?promo=${referralCode}" style="display:inline-block;background:#FFFFFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:100px;text-decoration:none">Use your code →</a>
</td></tr>
<tr><td style="height:32px"></td></tr>

<!-- Sig -->
<tr><td>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0">Dad of two · Founder, FamilyForce</p>
</td></tr>
<tr><td style="height:32px"></td></tr>

<!-- Footer -->
<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`
}

// ─── Telegram ─────────────────────────────────────────────────────────────────
async function telegramAlert(msg: string, testMode = false) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chat  = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chat) return
  const prefix = testMode ? '🧪 [TEST] scout-gift-purchase' : '🎁 scout-gift-purchase'
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text: `${prefix}: ${msg}` }),
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

  let step     = 'init'
  let testMode = false   // hoisted so catch block can reference it safely

  try {
    step = 'parse'
    const body   = await req.json()
    const action = body.action ?? 'complete-purchase'

    testMode        = body?.testMode === true
    const stripeKey = testMode
      ? Deno.env.get('STRIPE_SECRET_KEY_TEST')!
      : Deno.env.get('STRIPE_SECRET_KEY')!
    const siteUrl   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const sb        = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // ════════════════════════════════════════════════════════════
    // ACTION: validate-coupon
    // ════════════════════════════════════════════════════════════
    if (action === 'validate-coupon') {
      const { code, plan: vPlan } = body
      if (!code || !vPlan) return err(400, 'code and plan required', 'validate-coupon')
      if (!stripeKey) return err(500, 'Stripe not configured', 'validate-coupon')

      // ── Test-mode bypass: fixed test codes, no Stripe required ───────────
      // Stripe test + live environments have separate promo code databases.
      // These codes short-circuit in test mode so the full checkout flow can be tested.
      const TEST_CODES: Record<string, { pct: number; label: string }> = {
        'FRIEND-TEST-100': { pct: 100, label: '100% off (test)' },
        'FRIEND-TEST-25':  { pct: 25,  label: '25% off (test)'  },
      }
      // Also accept any FRIEND-XXXX-XXXX pattern as 100% off for generated codes
      const testEntry = TEST_CODES[code.toUpperCase()]
        ?? (/^FRIEND-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code) ? { pct: 100, label: '100% off (test)' } : null)

      if (testMode && testEntry) {
        const base = PRICES[vPlan as 'annual' | 'triennial' | 'monthly']
        if (!base) return err(400, 'invalid plan', 'validate-coupon')
        const discountedAmount = Math.round(base.amount * (1 - testEntry.pct / 100))
        return new Response(JSON.stringify({
          ok: true, label: testEntry.label,
          originalAmount: base.amount, discountedAmount,
          originalDisplay: base.display,
          discountedDisplay: '$' + (discountedAmount / 100).toFixed(2),
          stripePromoId: 'test_promo_bypass',
        }), { headers: { 'Content-Type': 'application/json', ...CORS }, status: 200 })
      }

      try {
        const params = new URLSearchParams({ code, active: 'true' })
        const res    = await stripeReq(stripeKey, 'GET', `/promotion_codes?${params}`)
        const promos = res.data ?? []
        if (!promos.length || !promos[0].coupon) {
          return new Response(JSON.stringify({ ok: false, error: 'Invalid or expired promo code.' }), {
            headers: { 'Content-Type': 'application/json', ...CORS }, status: 200
          })
        }
        const coupon  = promos[0].coupon
        const pct     = coupon.percent_off ?? 0
        const fixed   = coupon.amount_off  ?? 0
        const base    = PRICES[vPlan as 'annual' | 'triennial' | 'monthly']
        if (!base) return err(400, 'invalid plan', 'validate-coupon')
        const discountedAmount = fixed
          ? Math.max(0, base.amount - fixed)
          : Math.round(base.amount * (1 - pct / 100))
        const label = pct ? `${pct}% off` : `$${(fixed / 100).toFixed(2)} off`
        return new Response(JSON.stringify({
          ok: true, label,
          originalAmount: base.amount, discountedAmount,
          originalDisplay: base.display,
          discountedDisplay: '$' + (discountedAmount / 100).toFixed(2),
          stripePromoId: promos[0].id,
        }), { headers: { 'Content-Type': 'application/json', ...CORS }, status: 200 })
      } catch (_e) {
        return err(500, 'Could not validate code.', 'validate-coupon')
      }
    }

    // ════════════════════════════════════════════════════════════
    // ACTION: create-intent  (Step 1 of 3DS-safe purchase flow)
    // Validates inputs, applies promo, creates PaymentIntent.
    // Returns client_secret for frontend stripe.confirmCardPayment().
    // ════════════════════════════════════════════════════════════
    if (action === 'create-intent') {
      step = 'validate-create-intent'
      const { buyerName, buyerEmail, recipientName, recipientEmail,
              plan, stripeDiscountPromoId } = body

      if (!buyerName || !buyerEmail)         return err(400, 'buyerName and buyerEmail are required', step)
      if (!recipientName || !recipientEmail) return err(400, 'recipientName and recipientEmail are required', step)
      if (!['annual','triennial','monthly'].includes(plan))
        return err(400, 'plan must be annual, triennial or monthly', step)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))
        return err(400, 'Invalid buyer email address', step)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))
        return err(400, 'Invalid recipient email address', step)

      const priceInfo = PRICES[plan as 'annual' | 'triennial' | 'monthly']

      // Find or create Stripe customer for buyer
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

      // Server-side re-validate promo (prevent tampered discount amounts)
      let appliedAmount = priceInfo.amount
      if (stripeDiscountPromoId) {
        try {
          const reCheck = await stripeReq(stripeKey, 'GET', `/promotion_codes/${stripeDiscountPromoId}`)
          if (reCheck.id && reCheck.active && reCheck.coupon) {
            const pct   = reCheck.coupon.percent_off ?? 0
            const fixed = reCheck.coupon.amount_off  ?? 0
            appliedAmount = fixed
              ? Math.max(0, priceInfo.amount - fixed)
              : Math.round(priceInfo.amount * (1 - pct / 100))
          }
        } catch (_e) { /* ignore — charge full price */ }
      }

      // Create PaymentIntent (unconfirmed — card not charged yet)
      // Idempotency key: stable per buyer+plan+recipient so retries reuse the same intent
      step = 'stripe-create-intent'
      const idempotencyKey = `gift-intent-${buyerEmail}-${plan}-${recipientEmail}`.replace(/[^a-zA-Z0-9-]/g, '-')
      const pi = await stripeReq(stripeKey, 'POST', '/payment_intents', {
        amount:      appliedAmount,
        currency:    'usd',
        customer:    customerId,
        description: `Scout gift — ${priceInfo.label} for ${recipientEmail}`,
        'automatic_payment_methods[enabled]': 'true',
        'metadata[type]':            'scout_gift',
        'metadata[plan]':            plan,
        'metadata[buyer_email]':     buyerEmail,
        'metadata[recipient_email]': recipientEmail,
      }, idempotencyKey)

      return new Response(JSON.stringify({
        ok: true, clientSecret: pi.client_secret, intentId: pi.id,
      }), { headers: { 'Content-Type': 'application/json', ...CORS } })
    }

    // ════════════════════════════════════════════════════════════
    // ACTION: complete-purchase  (Step 2 — after stripe.confirmCardPayment succeeds)
    // Idempotent: checks for existing gift with same paymentIntentId first.
    // ════════════════════════════════════════════════════════════
    step = 'validate-complete'
    const { paymentIntentId, freeOrder, buyerName, buyerEmail, recipientName,
            recipientEmail, personalMessage, plan, deliverAt } = body

    if (!freeOrder && !paymentIntentId) return err(400, 'paymentIntentId is required', step)
    if (!buyerName || !buyerEmail || !recipientName || !recipientEmail || !plan)
      return err(400, 'Missing required fields', step)

    // Parse scheduled delivery (optional ISO timestamp)
    const deliverAtDate  = deliverAt ? new Date(deliverAt) : null
    const isDeferred     = !!(deliverAtDate && deliverAtDate > new Date())

    // Free order (100% promo) — skip Stripe verification entirely
    if (freeOrder) {
      if (!testMode) return err(400, 'Free orders only allowed in test mode', step)
      // Fall through — no idempotency check or PI verification needed
    } else {
      // Idempotency: if this PI was already processed, return the existing gift
      step = 'idempotency-check'
      const { data: existingGift } = await sb
        .from('scout_gifts')
        .select('code, stripe_referral_code')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .maybeSingle()

      if (existingGift) {
        console.log(`[scout-gift-purchase] Idempotent: PI ${paymentIntentId} already processed`)
        const priceInfo = PRICES[plan as 'annual' | 'triennial' | 'monthly']
        return new Response(JSON.stringify({
          ok: true, giftCode: existingGift.code,
          referralCode: existingGift.stripe_referral_code ?? '',
          recipientEmail, plan, amount: priceInfo.display,
        }), { headers: { 'Content-Type': 'application/json', ...CORS } })
      }

      // Verify the PaymentIntent is actually succeeded (trust-but-verify)
      step = 'verify-payment'
      const pi = await stripeReq(stripeKey, 'GET', `/payment_intents/${paymentIntentId}`)
      if (pi.status !== 'succeeded') {
        return err(402, `Payment not confirmed: ${pi.status}. Please complete payment first.`, step)
      }
    }

    const priceInfo = PRICES[plan as 'annual' | 'triennial' | 'monthly']

    // Generate unique gift code
    step = 'gift-code'
    let giftCode = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateGiftCode()
      const { data: existing } = await sb
        .from('scout_gifts').select('id').eq('code', candidate).maybeSingle()
      if (!existing) { giftCode = candidate; break }
    }
    if (!giftCode) throw new Error('Failed to generate unique gift code after 5 attempts')

    // Create referral promotion code for buyer
    step = 'stripe-referral'
    const referralCouponId = Deno.env.get('STRIPE_REFERRAL_COUPON_ID')
    let referralCode          = ''
    let referralStripePromoId = ''   // fixed: separate var from the discount promo

    if (referralCouponId) {
      const promoCodeStr = generateReferralCode()
      const referralPromo = await stripeReq(stripeKey, 'POST', '/promotion_codes', {
        coupon:                  referralCouponId,
        code:                    promoCodeStr,
        'metadata[buyer_email]': buyerEmail,
        'metadata[buyer_name]':  buyerName,
      }).catch(() => null)
      if (referralPromo?.code) {
        referralCode          = referralPromo.code
        referralStripePromoId = referralPromo.id
      }
    }
    // No fallback — only show a referral code if it was actually created in Stripe.
    // A random string with no Stripe backing looks real but fails on use.

    // Store gift record
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
      stripe_payment_intent_id: freeOrder ? null : (pi as any).id,
      stripe_referral_code:     referralCode,
      stripe_referral_coupon_id: referralStripePromoId || null,
      expires_at:               expiresAt.toISOString(),
      deliver_at:               isDeferred ? deliverAtDate!.toISOString() : null,
      gift_email_sent:          !isDeferred, // if deferred, scout-gift-deliver sends it later
    })

    // Build print card URL (pre-populated for buyer email)
    const printCardUrl = `${siteUrl}/scout-gift-print.html` +
      `?code=${encodeURIComponent(giftCode)}` +
      `&tier=${plan}` +
      `&recipient=${encodeURIComponent(recipientName)}` +
      `&buyer=${encodeURIComponent(buyerName)}` +
      `&msg=${encodeURIComponent(personalMessage ?? '')}` +
      `&price=${encodeURIComponent(priceInfo.display)}`

    // Send gift email to recipient (skip if delivery is scheduled for later)
    step = 'email-recipient'
    const redeemUrl  = `${siteUrl}/scout-gift-checkout.html?redeem=${giftCode}&re=${encodeURIComponent(recipientEmail)}`
    const resendKey  = Deno.env.get('RESEND_API_KEY')!
    const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName   = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
    const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''

    if (!isDeferred) {
      const giftEmailBody: Record<string, unknown> = {
        from:    `${fromName} <${fromEmail}>`,
        to:      [recipientEmail],
        subject: `${buyerName} gave you a gift — FamilyForce Scout 🎁`,
        html:    buildGiftEmail({ recipientName, buyerName, plan,
          personalMessage: personalMessage ?? undefined,
          redeemUrl, siteUrl, expiresAt }),
        tags:    [{ name: 'email_type', value: 'gift_recipient' }],
      }
      if (bccEmail) giftEmailBody.bcc = [bccEmail]

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(giftEmailBody),
        })
      } catch (e) {
        // Gift code is already saved — log and continue so the purchase succeeds
        console.error('[scout-gift-purchase] Recipient email failed (non-fatal):', e)
        await telegramAlert(`⚠️ Recipient email failed for ${giftCode} — ${recipientEmail}: ${e}`, testMode)
      }
    }

    // Send confirmation email to buyer (includes gift code + print link)
    step = 'email-buyer'
    const confirmEmailBody: Record<string, unknown> = {
      from:    `${fromName} <${fromEmail}>`,
      to:      [buyerEmail],
      subject: `Your Scout gift for ${recipientName} is on its way`,
      html:    buildConfirmEmail({
        buyerName, recipientName, recipientEmail, plan,
        referralCode, giftCode, printCardUrl, siteUrl, expiresAt,
      }),
      tags:    [{ name: 'email_type', value: 'gift_buyer_confirm' }],
    }
    if (bccEmail) confirmEmailBody.bcc = [bccEmail]

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmEmailBody),
      })
    } catch (e) {
      console.error('[scout-gift-purchase] Buyer email failed (non-fatal):', e)
      await telegramAlert(`⚠️ Buyer email failed for ${giftCode} — ${buyerEmail}: ${e}`, testMode)
    }

    await telegramAlert(`Gift sold: ${plan} — ${buyerEmail} → ${recipientEmail} — code ${giftCode} — ${priceInfo.display}`, testMode)

    try {
      await sb.from('scout_events').insert({
        user_id: null, event_type: 'gift_purchased',
        properties: { plan, amount: priceInfo.amount, buyer_email: buyerEmail },
      })
    } catch (_) { /* non-critical — don't fail the purchase */ }

    return new Response(JSON.stringify({
      ok: true, giftCode, referralCode,
      buyerEmail, recipientEmail, plan, amount: priceInfo.display,
      isDeferred, deliverAt: isDeferred ? deliverAtDate!.toISOString() : null,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-gift-purchase] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`, testMode)
    return err(500, msg, step)
  }
})
