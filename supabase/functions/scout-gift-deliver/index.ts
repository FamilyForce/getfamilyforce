// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Scheduled Gift Delivery
// Runs daily at 08:00 UTC via Supabase cron.
//
// Scans scout_gifts where:
//   - gift_email_sent = FALSE
//   - deliver_at <= NOW()   (delivery time has passed)
//   - redeemed_at IS NULL   (not yet redeemed — still active)
//
// For each pending gift: sends the gift email to the recipient
// and marks gift_email_sent = TRUE.
//
// Deploy: supabase functions deploy scout-gift-deliver
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

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
  <!-- Purple accent strip at top -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#6E4ED6;padding:14px 32px">
    <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:rgba(255,255,255,.85);letter-spacing:.1em;text-transform:uppercase;margin:0;text-align:center">A gift for you 🎁</p>
  </td></tr></table>
  <!-- White card body -->
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const RESEND_KEY    = Deno.env.get('RESEND_API_KEY')!
  const FROM_EMAIL    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const FROM_NAME     = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
  const SITE_URL      = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE)
  const now = new Date()

  // Find all gifts due for delivery
  const { data: gifts, error } = await sb
    .from('scout_gifts')
    .select('id, code, plan, buyer_name, buyer_email, recipient_name, recipient_email, personal_message, expires_at')
    .eq('gift_email_sent', false)
    .lte('deliver_at', now.toISOString())
    .is('redeemed_at', null)
    .limit(50)

  if (error) {
    console.error('[scout-gift-deliver] DB error:', error.message)
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  if (!gifts || gifts.length === 0) {
    return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
  }

  let sent = 0
  let failed = 0

  for (const gift of gifts) {
    try {
      const redeemUrl = `${SITE_URL}/scout-gift-checkout.html?redeem=${gift.code}`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      [gift.recipient_email],
          subject: `${gift.buyer_name} gave you a gift — FamilyForce Scout 🎁`,
          html:    buildGiftEmail({
            recipientName: gift.recipient_name,
            buyerName:     gift.buyer_name,
            plan:          gift.plan,
            personalMessage: gift.personal_message ?? undefined,
            redeemUrl,
            expiresAt:     gift.expires_at,
          }),
          tags: [{ name: 'email_type', value: 'gift_recipient_scheduled' }],
        }),
      })

      await sb.from('scout_gifts').update({ gift_email_sent: true }).eq('id', gift.id)
      sent++
    } catch (e) {
      console.error(`[scout-gift-deliver] Failed for gift ${gift.id}:`, e)
      failed++
    }
  }

  console.log(`[scout-gift-deliver] Done: sent=${sent}, failed=${failed}`)
  return new Response(JSON.stringify({ ok: true, sent, failed }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
})
