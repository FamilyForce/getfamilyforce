// FamilyForce — Stripe Webhook Edge Function
// Keeps scout_subscriptions in sync with Stripe subscription lifecycle events.
//
// Required env vars:
//   STRIPE_SECRET_KEY         sk_test_... (Stripe secret key)
//   STRIPE_WEBHOOK_SECRET     whsec_... (from Stripe Dashboard → Webhooks)
//   RESEND_API_KEY            re_... (Resend transactional email)
//   SUPABASE_URL              auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY auto-set by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

// ── Stripe REST helper (no SDK) ──────────────────────────────────
async function stripeGet(secretKey: string, path: string) {
  const res  = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { 'Authorization': `Bearer ${secretKey}` },
  })
  return res.json()
}

// ── Telegram alert helper ───────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    })
  } catch { /* non-critical */ }
}

// ── Resend email helper ─────────────────────────────────────────
async function sendEmail(resendKey: string, to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'FamilyForce <support@getfamilyforce.com>', to, bcc: ['support@getfamilyforce.com'], subject, html }),
  })
  const data = await res.json()
  if (!res.ok) console.error('[stripe-webhook] Resend error:', JSON.stringify(data))
  return data
}

// ── Stripe webhook signature verification (manual, no SDK) ──────
async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  const parts     = Object.fromEntries(sig.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const v1        = parts['v1']
  if (!timestamp || !v1) return false

  const payload   = `${timestamp}.${body}`
  const key       = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sigBytes  = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  // Constant-time comparison — prevents timing attacks on HMAC verification
  const expected  = new Uint8Array(sigBytes)
  const received  = new Uint8Array(v1.match(/.{2}/g)!.map(b => parseInt(b, 16)))
  if (expected.length !== received.length) return false
  return crypto.subtle.timingSafeEqual
    ? crypto.subtle.timingSafeEqual(expected, received)
    : expected.every((b, i) => b === received[i])  // fallback if timingSafeEqual unavailable
}

// ── Email templates ─────────────────────────────────────────────
function trialEndingSoonEmail(email: string, daysLeft: number): string {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F0FC;padding:40px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%">
        <tr>
          <td align="center" style="background-color:#6E4ED6;border-radius:16px 16px 0 0;padding:28px 40px">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:10px;vertical-align:middle">
                <svg width="28" height="32" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 15L7 1L13 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
              <td style="vertical-align:middle">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Family<span style="color:#D4C4FF">Force</span></span>
              </td>
            </tr></table>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:40px 40px 36px;border-radius:0 0 16px 16px">
            <p style="font-size:36px;margin:0 0 16px">🌱</p>
            <h1 style="font-size:24px;font-weight:800;color:#1A1523;margin:0 0 12px;letter-spacing:-0.02em">Your free year ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}</h1>
            <p style="font-size:15px;color:#4A4560;line-height:1.6;margin:0 0 24px">You've been using Scout to track every developmental window for your child. We hope it's made the year a little clearer.</p>
            <p style="font-size:15px;color:#4A4560;line-height:1.6;margin:0 0 32px">To keep going, add a payment method before your free year ends. Scout renews at <strong>$79.99/year</strong> — less than $7/month.</p>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
              <tr>
                <td align="center" style="background-color:#6E4ED6;border-radius:100px;padding:14px 32px">
                  <a href="https://getfamilyforce.com/dashboard" style="font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;display:block;white-space:nowrap">Add payment method →</a>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #EDEBF2;padding-top:24px">
              <tr><td>
                <p style="font-size:13px;color:#8A879A;line-height:1.6;margin:0">Questions? Just reply to this email and we'll get back to you within one business day.</p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 40px 0">
            <p style="font-size:12px;color:#8A879A;margin:0;line-height:1.6">You received this because you have a FamilyForce Scout subscription.</p>
            <p style="font-size:12px;color:#8A879A;margin:8px 0 0">© 2026 FamilyForce Inc. · <a href="https://getfamilyforce.com" style="color:#6E4ED6;text-decoration:none">getfamilyforce.com</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const secret    = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const resendKey = Deno.env.get('RESEND_API_KEY')

  if (!stripeKey || !secret) return new Response('Missing Stripe config', { status: 500 })

  const sig  = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  const valid = await verifyStripeSignature(body, sig, secret)
  if (!valid) {
    console.error('[stripe-webhook] Signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(body)
  const sb    = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const STATUS_MAP: Record<string, string> = {
    trialing:           'trialing',
    active:             'active',
    canceled:           'cancelled',
    cancelled:          'cancelled',
    past_due:           'past_due',
    unpaid:             'past_due',
    incomplete:         'past_due',
    incomplete_expired: 'expired',
  }

  try {
    switch (event.type) {

      // ── Subscription updated ────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object

        // If Stripe status is 'active' but cancel_at_period_end=true,
        // keep our 'cancelling' status — don't overwrite it.
        let dbStatus = STATUS_MAP[sub.status] ?? sub.status
        if (sub.status === 'active' && sub.cancel_at_period_end === true) {
          dbStatus = 'cancelling'
        }

        // Derive plan from Stripe price metadata if available
        const planFromStripe = sub.metadata?.plan
          ?? (sub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly')

        await sb.from('scout_subscriptions').update({
          status:               dbStatus,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          plan:                 planFromStripe,
          trial_end:            sub.trial_end  ? new Date(sub.trial_end  * 1000).toISOString() : null,
          period_end:           sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          updated_at:           new Date().toISOString(),
        }).eq('stripe_sub_id', sub.id)
        break
      }

      // ── Trial ending soon ────────────────────────────────────
      // Stripe fires this 3 days before trial_end by default.
      // For free-year subscriptions (no default payment method), send
      // a FamilyForce-branded renewal email instead of Stripe's default.
      case 'customer.subscription.trial_will_end': {
        const sub      = event.data.object
        const customer = await stripeGet(stripeKey, `/customers/${sub.customer}`)
        const email    = customer.email

        // Check if there's a default payment method
        const hasCard  = !!(
          sub.default_payment_method ||
          customer.invoice_settings?.default_payment_method
        )

        if (!hasCard && email && resendKey) {
          const daysLeft = Math.ceil((sub.trial_end * 1000 - Date.now()) / 86400000)
          await sendEmail(
            resendKey,
            email,
            `Your free Scout year ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
            trialEndingSoonEmail(email, Math.max(1, daysLeft))
          )
          console.log(`[stripe-webhook] Renewal email sent to ${email} (${daysLeft} days left)`)
        }

        // Also update DB status
        await sb.from('scout_subscriptions').update({
          trial_end:  sub.trial_end  ? new Date(sub.trial_end  * 1000).toISOString() : null,
          period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
        }).eq('stripe_sub_id', sub.id)
        break
      }

      // ── Subscription cancelled ──────────────────────────────
      // Fires when cancel_at_period_end=true period finally ends,
      // or when cancelled immediately via Stripe Dashboard.
      case 'customer.subscription.deleted': {
        const sub = event.data.object

        const { data: dbSub } = await sb
          .from('scout_subscriptions')
          .update({
            status:               'cancelled',
            cancel_at_period_end: false,
            period_end:           sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            updated_at:           new Date().toISOString(),
          })
          .eq('stripe_sub_id', sub.id)
          .select('user_id, child_id, plan')
          .maybeSingle()

        // Log event + admin alert
        if (dbSub) {
          await sb.from('scout_events').insert({
            user_id:    dbSub.user_id,
            child_id:   dbSub.child_id,
            event_type: 'subscription_ended',
            properties: { plan: dbSub.plan, source: 'stripe_webhook' },
          }).catch(() => {})
          await telegramAlert(`😢 Subscription cancelled · sub=${sub.id} · plan=${dbSub.plan}`)
        }
        break
      }

      // ── Payment failed ──────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        if (!invoice.subscription) break
        await sb.from('scout_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', invoice.subscription)
        break
      }

      // ── Payment succeeded ───────────────────────────────────
      // On first payment after trial conversion: update status + fire digest immediately.
      // On renewal: update period_end so settings page shows correct next billing date.
      case 'invoice.paid': {
        const invoice = event.data.object
        if (!invoice.subscription) break
        if ((invoice.amount_paid ?? 0) > 0) {
          // Fetch Stripe subscription to get current_period_end
          const stripeSub = await stripeGet(stripeKey, `/subscriptions/${invoice.subscription}`)
          const newPeriodEnd = stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000).toISOString()
            : null

          // Update status to active + refresh period_end
          const { data: updatedSub } = await sb
            .from('scout_subscriptions')
            .update({
              status:               'active',
              cancel_at_period_end: false,
              period_end:           newPeriodEnd,
              updated_at:           new Date().toISOString(),
            })
            .eq('stripe_sub_id', invoice.subscription)
            .select('user_id, status')
            .maybeSingle()

          // If this looks like a first payment (billing_reason = subscription_create),
          // fire the digest immediately so the user gets their first paid email right away.
          if (updatedSub && invoice.billing_reason === 'subscription_create') {
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

            // Log trial_converted if not already logged (safety net for cases where
            // scout-convert didn't fire — e.g., direct Stripe dashboard payment)
            const { count } = await sb
              .from('scout_events')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', updatedSub.user_id)
              .eq('event_type', 'trial_converted')

            if ((count ?? 0) === 0) {
              await sb.from('scout_events').insert({
                user_id:    updatedSub.user_id,
                event_type: 'trial_converted',
                properties: {
                  stripe_sub_id: invoice.subscription,
                  source:        'stripe_webhook',
                  amount_paid:   invoice.amount_paid,
                },
              })
            }

            // Fire digest in background (scout-digest deduplicates via scout_digest_log
            // so a double-fire from scout-convert is safe — second call is a no-op)
            fetch(`${supabaseUrl}/functions/v1/scout-digest`, {
              method:  'POST',
              headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${serviceKey}`,
              },
              body: JSON.stringify({}),
            }).catch(e => console.error('[stripe-webhook] Failed to trigger digest:', e.message))

            // Notify admin — webhook-path conversion (scout-convert may have already alerted;
            // this fires only when billing_reason = subscription_create and count was 0)
            if ((count ?? 0) === 0) {
              const amountFmt = ((invoice.amount_paid ?? 0) / 100).toFixed(2)
              await telegramAlert(`💳 Payment confirmed (webhook)! $${amountFmt} · sub=${invoice.subscription}`)
            }
          } else if (updatedSub && invoice.billing_reason === 'subscription_cycle') {
            // Renewal payment — notify admin
            const amountFmt = ((invoice.amount_paid ?? 0) / 100).toFixed(2)
            await telegramAlert(`🔄 Renewal payment received! $${amountFmt} · sub=${invoice.subscription}`)
          }
        }
        break
      }

      default:
        break
    }

  } catch (e) {
    console.error('[stripe-webhook] Handler error:', e)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
