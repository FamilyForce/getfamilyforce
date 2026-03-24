// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Scheduled Gift Delivery
// Runs hourly via Supabase cron (0 * * * *).
//
// Scans scout_gifts where:
//   - gift_email_sent = FALSE
//   - deliver_at <= NOW()   (delivery time has passed)
//   - delivery_attempts < MAX_ATTEMPTS (not permanently failed)
//
// NOTE: redeemed_at IS NOT filtered — a scheduled gift email
//   should always go out on the chosen date regardless of whether
//   the recipient redeemed the code early.
//
// For each pending gift:
//   - Sends gift email to recipient
//   - On success: marks gift_email_sent = TRUE, logs resend_message_id
//   - On failure: increments delivery_attempts, logs last_delivery_error
//   - After MAX_ATTEMPTS failures: emails buyer to notify them
//
// Alerts: Telegram alert fired when any delivery fails.
//
// Deploy: supabase functions deploy scout-gift-deliver
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const MAX_ATTEMPTS = 5

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const PLAN_LABELS: Record<string, string> = {
  monthly:   'one month',
  annual:    'one year',
  triennial: 'three years (birth to age 3)',
}

// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: `🎁 scout-gift-deliver: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Gift recipient email ──────────────────────────────────────────────────────
function buildGiftEmail(opts: {
  recipientName: string; buyerName: string
  plan: string; personalMessage?: string
  redeemUrl: string; expiresAt: string
}): string {
  const { recipientName, buyerName, plan, personalMessage, redeemUrl, expiresAt } = opts
  const planLabel = PLAN_LABELS[plan] ?? plan
  const expiryFmt = new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const preheader = `${buyerName} gave you ${planLabel} of FamilyForce Scout.`

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>You have a gift from ${buyerName}</title>
<style>body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">
<div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 0 16px"><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p></td></tr>
<tr><td style="background:#FFFFFF;border-radius:20px;padding:0;overflow:hidden;border:1px solid #E5E2EC">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#6E4ED6;padding:14px 32px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:.1em;text-transform:uppercase;margin:0;text-align:center">A gift for you 🎁</p>
  </td></tr></table>
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:28px 32px 32px;text-align:center">
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1A1033;margin:0 0 12px;line-height:1.3">Never miss a milestone.</h1>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#4A4458;margin:0 0 24px;line-height:1.6">${buyerName} gave you ${planLabel} of Scout — research-backed developmental milestone tracking delivered to your inbox every month.</p>
    ${personalMessage ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px"><tr><td style="background:#F5F3FF;border-radius:12px;padding:16px;border-left:3px solid #6E4ED6"><p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#2D1F5E;margin:0;line-height:1.7;font-style:italic">"${personalMessage}"</p><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#6E4ED6;margin:8px 0 0">— ${buyerName}</p></td></tr></table>` : ''}
    <a href="${redeemUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;padding:15px 32px;border-radius:100px;text-decoration:none">Claim your gift →</a>
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:14px 0 0">No credit card needed to claim.</p>
  </td></tr></table>
</td></tr>
<tr><td style="height:16px"></td></tr>
<tr><td style="background:#FFFBEB;border:1px solid #F5D97A;border-radius:10px;padding:12px 16px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#7A5A00;margin:0;line-height:1.6">⏰ <strong>Claim before ${expiryFmt}.</strong> Baby not here yet? No problem — hold on to this email and activate once they arrive.</p>
</td></tr>
<tr><td style="height:32px"></td></tr>
<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · getfamilyforce.com</p>
  <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:4px 0 0">This gift was sent to you by ${buyerName}. You were not signed up for any mailing list.</p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

// ─── Buyer failure notification email ─────────────────────────────────────────
function buildBuyerFailureEmail(opts: {
  buyerName: string; recipientName: string; recipientEmail: string
  giftCode: string; supportEmail: string
}): string {
  const { buyerName, recipientName, recipientEmail, giftCode, supportEmail } = opts
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gift delivery issue</title>
</head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
<tr><td align="center" style="padding:24px 12px 40px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 0 16px"><p style="font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p></td></tr>
<tr><td style="background:#FFFFFF;border-radius:20px;padding:32px;border:1px solid #E5E2EC">
  <h2 style="font-size:20px;color:#1A1033;margin:0 0 12px">We had trouble delivering your gift</h2>
  <p style="font-size:15px;color:#4A4458;line-height:1.6;margin:0 0 16px">Hi ${buyerName}, we weren't able to deliver your Scout gift email to <strong>${recipientName}</strong> (${recipientEmail}) after several attempts.</p>
  <p style="font-size:15px;color:#4A4458;line-height:1.6;margin:0 0 24px">The gift is still active — your recipient can still claim it using this code:</p>
  <div style="background:#F5F3FF;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px">
    <p style="font-size:11px;font-weight:700;color:#6E4ED6;letter-spacing:.1em;text-transform:uppercase;margin:0 0 6px">Gift Code</p>
    <p style="font-size:22px;font-weight:800;color:#1A1033;margin:0;letter-spacing:.06em">${giftCode}</p>
  </div>
  <p style="font-size:14px;color:#4A4458;line-height:1.6;margin:0 0 8px">You can share this code or the link below directly with ${recipientName}:</p>
  <p style="font-size:13px;color:#6E4ED6;margin:0 0 24px;word-break:break-all">https://getfamilyforce.com/scout-gift-checkout.html?redeem=${giftCode}</p>
  <p style="font-size:13px;color:#8A879A;margin:0">Questions? Reply to this email or contact <a href="mailto:${supportEmail}" style="color:#6E4ED6">${supportEmail}</a>.</p>
</td></tr>
<tr><td style="height:32px"></td></tr>
<tr><td style="border-top:1px solid #E5E2EC;padding-top:20px">
  <p style="font-size:11px;color:#8A879A;margin:0">FamilyForce Scout · getfamilyforce.com</p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_KEY    = Deno.env.get('RESEND_API_KEY')!
  const FROM_EMAIL    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const FROM_NAME     = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
  const SITE_URL      = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'
  const SUPPORT_EMAIL = 'support@getfamilyforce.com'

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE)
  const now = new Date()

  // Find all gifts due for delivery that haven't exhausted retry attempts.
  // NOTE: redeemed_at is intentionally NOT filtered — a scheduled gift email
  // should fire on the chosen date even if the recipient already redeemed early.
  const { data: gifts, error } = await sb
    .from('scout_gifts')
    .select('id, code, plan, buyer_name, buyer_email, recipient_name, recipient_email, personal_message, expires_at, delivery_attempts')
    .eq('gift_email_sent', false)
    .lte('deliver_at', now.toISOString())
    .lt('delivery_attempts', MAX_ATTEMPTS)
    .limit(50)

  if (error) {
    const msg = `DB query failed: ${error.message}`
    console.error('[scout-gift-deliver]', msg)
    await telegramAlert(`🚨 DB error — ${msg}`)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  if (!gifts || gifts.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  let sent = 0
  let failed = 0

  for (const gift of gifts) {
    const attempts = (gift.delivery_attempts ?? 0) + 1

    try {
      const redeemUrl = `${SITE_URL}/scout-gift-checkout.html?redeem=${gift.code}`

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:     `${FROM_NAME} <${FROM_EMAIL}>`,
          to:       [gift.recipient_email],
          reply_to: [SUPPORT_EMAIL],
          subject:  `${gift.buyer_name} gave you a gift — FamilyForce Scout 🎁`,
          html:     buildGiftEmail({
            recipientName:   gift.recipient_name,
            buyerName:       gift.buyer_name,
            plan:            gift.plan,
            personalMessage: gift.personal_message ?? undefined,
            redeemUrl,
            expiresAt:       gift.expires_at,
          }),
          tags: [{ name: 'email_type', value: 'gift_recipient_scheduled' }],
        }),
      })

      if (!resendRes.ok) {
        const errBody = await resendRes.text()
        const errMsg = `Resend ${resendRes.status}: ${errBody}`
        console.error(`[scout-gift-deliver] Failed gift ${gift.id} (attempt ${attempts}): ${errMsg}`)

        // Update attempt count + error
        await sb.from('scout_gifts').update({
          delivery_attempts:   attempts,
          last_delivery_error: errMsg,
        }).eq('id', gift.id)

        // If this was the final attempt, notify the buyer
        if (attempts >= MAX_ATTEMPTS) {
          await notifyBuyerOfFailure(gift, { FROM_NAME, FROM_EMAIL, RESEND_KEY, SUPPORT_EMAIL })
          await telegramAlert(`❌ Gift ${gift.code} permanently failed after ${MAX_ATTEMPTS} attempts. Buyer (${gift.buyer_email}) notified. Recipient: ${gift.recipient_email}. Last error: ${resendRes.status}`)
        } else {
          await telegramAlert(`⚠️ Gift ${gift.code} delivery failed (attempt ${attempts}/${MAX_ATTEMPTS}). Recipient: ${gift.recipient_email}. Error: ${resendRes.status}`)
        }

        failed++
        continue
      }

      // Success — log message ID and mark sent
      const resendData = await resendRes.json().catch(() => ({}))
      const messageId = resendData?.id ?? null

      await sb.from('scout_gifts').update({
        gift_email_sent:     true,
        delivery_attempts:   attempts,
        resend_message_id:   messageId,
        last_delivery_error: null,
      }).eq('id', gift.id)

      console.log(`[scout-gift-deliver] Sent gift ${gift.id} (${gift.code}) to ${gift.recipient_email} — Resend ID: ${messageId}`)
      sent++

    } catch (e: any) {
      const errMsg = e?.message ?? String(e)
      console.error(`[scout-gift-deliver] Exception for gift ${gift.id} (attempt ${attempts}):`, errMsg)

      await sb.from('scout_gifts').update({
        delivery_attempts:   attempts,
        last_delivery_error: errMsg,
      }).eq('id', gift.id)

      if (attempts >= MAX_ATTEMPTS) {
        await notifyBuyerOfFailure(gift, { FROM_NAME, FROM_EMAIL, RESEND_KEY, SUPPORT_EMAIL })
        await telegramAlert(`❌ Gift ${gift.code} permanently failed (exception) after ${MAX_ATTEMPTS} attempts. Buyer (${gift.buyer_email}) notified.`)
      } else {
        await telegramAlert(`⚠️ Gift ${gift.code} exception (attempt ${attempts}/${MAX_ATTEMPTS}): ${errMsg}`)
      }

      failed++
    }
  }

  console.log(`[scout-gift-deliver] Done: sent=${sent}, failed=${failed}`)

  if (failed > 0) {
    await telegramAlert(`📊 Run complete — sent: ${sent}, failed: ${failed}`)
  }

  return new Response(JSON.stringify({ ok: true, sent, failed }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})

// ─── Helper: notify buyer of permanent failure ─────────────────────────────────
async function notifyBuyerOfFailure(
  gift: { id: string; code: string; buyer_name: string; buyer_email: string; recipient_name: string; recipient_email: string },
  cfg: { FROM_NAME: string; FROM_EMAIL: string; RESEND_KEY: string; SUPPORT_EMAIL: string }
): Promise<void> {
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cfg.RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     `${cfg.FROM_NAME} <${cfg.FROM_EMAIL}>`,
        to:       [gift.buyer_email],
        reply_to: [cfg.SUPPORT_EMAIL],
        subject:  `Action needed: your Scout gift couldn't be delivered`,
        html:     buildBuyerFailureEmail({
          buyerName:      gift.buyer_name,
          recipientName:  gift.recipient_name,
          recipientEmail: gift.recipient_email,
          giftCode:       gift.code,
          supportEmail:   cfg.SUPPORT_EMAIL,
        }),
        tags: [{ name: 'email_type', value: 'gift_delivery_failure_buyer' }],
      }),
    })
  } catch (e) {
    console.error(`[scout-gift-deliver] Failed to notify buyer ${gift.buyer_email}:`, e)
  }
}
