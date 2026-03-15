// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Resend Webhook Handler
// Handles all inbound Resend email events → logs to scout_events
// Handles bounces and complaints with auto-suppression
//
// Deploy: supabase functions deploy scout-resend-webhook
// Trigger: Resend dashboard → Webhooks (all email.* events)
// Secrets: RESEND_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Resend webhook event types we care about
const HANDLED_EVENTS = new Set([
  'email.delivered',
  'email.opened',
  'email.clicked',
  'email.bounced',
  'email.complained',
  'email.unsubscribed',
])

// Map Resend event types → scout_events event_type values
const EVENT_MAP: Record<string, string> = {
  'email.delivered':    'email_delivered',
  'email.opened':       'email_opened',
  'email.clicked':      'email_clicked',
  'email.bounced':      'email_bounced',
  'email.complained':   'email_complained',
  'email.unsubscribed': 'email_unsubscribed',
}

// ─── Svix webhook signature verification ─────────────────────────────────────
// Resend uses Svix to sign webhook payloads.
// See: https://docs.svix.com/receiving/verifying-payloads/how-manual
async function verifyWebhookSignature(
  req: Request,
  body: string,
  secret: string
): Promise<boolean> {
  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) return false

  // Reject payloads older than 5 minutes (replay attack protection)
  const ts = parseInt(svixTimestamp, 10)
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

  const toSign = `${svixId}.${svixTimestamp}.${body}`

  // Import the secret (Svix secrets are base64-encoded with a 'whsec_' prefix)
  const rawSecret = secret.startsWith('whsec_')
    ? secret.slice(6)
    : secret
  const keyBytes   = Uint8Array.from(atob(rawSecret), c => c.charCodeAt(0))
  const cryptoKey  = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(toSign))
  const computed       = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

  // svix-signature header may contain multiple signatures (v1,<sig> v1,<sig>)
  const signatures = svixSignature.split(' ').map(s => s.replace(/^v\d+,/, ''))
  return signatures.some(sig => sig === computed)
}

// ─── Alert via Telegram on critical errors ───────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-resend-webhook: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  const body = await req.text()

  // 1. Verify webhook signature
  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? ''
  if (webhookSecret) {
    const valid = await verifyWebhookSignature(req, body, webhookSecret)
    if (!valid) {
      console.warn('[scout-resend-webhook] Invalid signature — rejecting')
      return new Response(JSON.stringify({ ok: false, error: 'Invalid signature' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  const eventType  = payload.type as string
  const data       = (payload.data ?? {}) as Record<string, unknown>
  const tags       = (data.tags ?? {}) as Record<string, string>
  const emailId    = data.email_id as string | undefined
  const bounceType = (data.bounce as Record<string, string> | undefined)?.type

  // Ignore events we don't handle
  if (!HANDLED_EVENTS.has(eventType)) {
    return new Response(JSON.stringify({ ok: true, skipped: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const scoutEventType = EVENT_MAP[eventType] ?? eventType
  const userId         = tags.user_id ?? null
  const childId        = tags.child_id ?? null

  // 2. Log to scout_events
  const { error: logErr } = await sb.from('scout_events').insert({
    user_id:    userId,
    child_id:   childId,
    event_type: scoutEventType,
    properties: {
      email_id:    emailId,
      email_type:  tags.digest_type ?? null,
      month:       tags.month       ?? null,
      link_target: (data as Record<string, string>).click?.link ?? null,
      bounce_type: bounceType ?? null,
    },
    occurred_at: new Date().toISOString(),
  })

  if (logErr) {
    console.error('[scout-resend-webhook] Failed to log event:', logErr.message)
    await telegramAlert(`Failed to log ${scoutEventType} event: ${logErr.message}`)
  }

  // 3. Hard bounce handling — suppress address immediately
  if (eventType === 'email.bounced' && bounceType === 'hard') {
    const toAddresses = (data.to as string[] | undefined) ?? []
    if (toAddresses.length > 0 && userId) {
      // Suppress the user from future Scout emails
      // We do this by logging a suppression event and setting a flag on the subscription
      const { error: suppressErr } = await sb
        .from('scout_subscriptions')
        .update({ status: 'expired' })
        .eq('user_id', userId)

      if (suppressErr) {
        console.error('[scout-resend-webhook] Failed to suppress bounced address:', suppressErr.message)
      } else {
        console.log(`[scout-resend-webhook] Hard bounce — suppressed user ${userId}`)
        await telegramAlert(
          `Hard bounce for user ${userId} (${toAddresses[0]}). Subscription set to expired.`
        )
      }
    }
  }

  // 4. Spam complaint handling — unsubscribe immediately
  if (eventType === 'email.complained' && userId) {
    const { error: complainErr } = await sb
      .from('scout_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)

    if (complainErr) {
      console.error('[scout-resend-webhook] Failed to cancel complained user:', complainErr.message)
    } else {
      console.log(`[scout-resend-webhook] Spam complaint — cancelled subscription for user ${userId}`)
      await telegramAlert(`Spam complaint from user ${userId}. Subscription cancelled.`)
    }
  }

  // 5. Manual unsubscribe handling
  if (eventType === 'email.unsubscribed' && userId) {
    await sb
      .from('scout_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
})
