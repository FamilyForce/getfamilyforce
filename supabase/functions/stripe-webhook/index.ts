// FamilyForce — Stripe Webhook Edge Function
// Keeps scout_subscriptions in sync with Stripe subscription lifecycle events.
//
// Required env vars (Supabase Dashboard → Edge Functions → stripe-webhook → Secrets):
//   STRIPE_SECRET_KEY        = sk_test_51TAQTZ... (your Stripe secret key)
//   STRIPE_WEBHOOK_SECRET    = whsec_... (from Stripe Dashboard → Webhooks → signing secret)
//   SUPABASE_URL             = set automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY = set automatically by Supabase
//
// Stripe events to register (Dashboard → Developers → Webhooks → Add endpoint):
//   customer.subscription.updated
//   customer.subscription.deleted
//   customer.subscription.trial_will_end
//   invoice.payment_failed
//   invoice.paid

import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

Deno.serve(async (req: Request) => {
  const sig     = req.headers.get('stripe-signature')
  const secret  = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!sig || !secret) {
    return new Response('Missing stripe-signature or webhook secret', { status: 400 })
  }

  // Verify webhook signature — prevents spoofed events
  let event: Stripe.Event
  try {
    const body = await req.text()
    event = await stripe.webhooks.constructEventAsync(body, sig, secret)
  } catch (e) {
    console.error('[stripe-webhook] Signature verification failed:', e)
    return new Response('Invalid signature', { status: 400 })
  }

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Status map: Stripe status → our status ───────────────────
  const STATUS_MAP: Record<string, string> = {
    trialing:  'trialing',
    active:    'active',
    canceled:  'cancelled',
    cancelled: 'cancelled',
    past_due:  'past_due',
    unpaid:    'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
  }

  try {
    switch (event.type) {

      // ── Subscription created, updated, or trial converted ────
      case 'customer.subscription.updated':
      case 'customer.subscription.trial_will_end': {
        const sub = event.data.object as Stripe.Subscription
        const { error } = await sb.from('scout_subscriptions')
          .update({
            status:     STATUS_MAP[sub.status] ?? sub.status,
            trial_end:  sub.trial_end  ? new Date(sub.trial_end  * 1000).toISOString() : null,
            period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_sub_id', sub.id)
        if (error) console.error('[stripe-webhook] Update error:', error.message)
        break
      }

      // ── Subscription cancelled ────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const { error } = await sb.from('scout_subscriptions')
          .update({
            status:     'cancelled',
            period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_sub_id', sub.id)
        if (error) console.error('[stripe-webhook] Cancel error:', error.message)
        break
      }

      // ── Payment failed ────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break
        const { error } = await sb.from('scout_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_sub_id', invoice.subscription as string)
        if (error) console.error('[stripe-webhook] Payment failed error:', error.message)
        break
      }

      // ── Payment succeeded (trial → active conversion) ─────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break
        // Only update if it's a real charge (not $0 trial invoices)
        if ((invoice.amount_paid ?? 0) > 0) {
          const { error } = await sb.from('scout_subscriptions')
            .update({ status: 'active' })
            .eq('stripe_sub_id', invoice.subscription as string)
          if (error) console.error('[stripe-webhook] Paid error:', error.message)
        }
        break
      }

      default:
        // Ignore unregistered events
        break
    }

  } catch (e) {
    console.error('[stripe-webhook] Handler error:', e)
    return new Response('Handler error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
