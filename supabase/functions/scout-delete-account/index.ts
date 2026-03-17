// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Account Deletion Edge Function
// Handles destructive account removal and subscription cleanup.
//
// POST /scout-delete-account
// Auth: Bearer session token
//
// Flow:
//   1. Identify user
//   2. Cancel Stripe subscription if active
//   3. Delete window_progress, scout_digest_log, scout_events
//   4. Delete children records (triggers family_members cascade)
//   5. Delete user profile
//   6. Note: Auth record deletion usually requires Admin SDK/Service Role.
//      We delete the user's data from public schema; auth cleanup follows.
//
// Deploy: supabase functions deploy scout-delete-account
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

// ─── Stripe helper ────────────────────────────────────────────────────────────
async function stripeReq(key: string, method: string, path: string) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${key}` },
  })
  return res.json()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return err(401, 'Missing auth token')

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await sb.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return err(401, 'Invalid session')

    // 1. Stripe Cleanup
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeKey) {
      const { data: sub } = await sb.from('scout_subscriptions').select('stripe_subscription_id').eq('user_id', user.id).maybeSingle()
      if (sub?.stripe_subscription_id) {
        // Cancel at period end or immediately? For deletion, we do immediately.
        await stripeReq(stripeKey, 'DELETE', `/subscriptions/${sub.stripe_subscription_id}`)
      }
    }

    // 2. Cascade Delete in DB
    // Get child IDs first (needed to null out scout_gifts)
    const { data: userChildren } = await sb.from('children').select('id').eq('user_id', user.id)
    const childIds = (userChildren || []).map((c: { id: string }) => c.id)

    // Non-cascading tables — clear first to avoid FK constraint errors
    if (childIds.length > 0) {
      // scout_gifts.child_id has ON DELETE NO ACTION — null it out (gift records stay for accounting)
      try { await sb.from('scout_gifts').update({ child_id: null }).in('child_id', childIds) } catch (_) {}
      // user_progress (legacy table, may not have all rows)
      try { await sb.from('user_progress').delete().eq('user_id', user.id) } catch (_) {}
    }

    // user-level deletes (non-fatal — cascade from children handles most)
    try { await sb.from('window_progress').delete().eq('user_id', user.id) } catch (_) {}
    try { await sb.from('scout_digest_log').delete().eq('user_id', user.id) } catch (_) {}
    try { await sb.from('scout_events').delete().eq('user_id', user.id) } catch (_) {}
    try { await sb.from('scout_subscriptions').delete().eq('user_id', user.id) } catch (_) {}

    // Delete children — cascades to family_members, window_progress (child_id), scout_digest_log (child_id)
    await sb.from('children').delete().eq('user_id', user.id)

    // 3. Delete Profile
    try { await sb.from('profiles').delete().eq('id', user.id) } catch (_) {}

    // 4. Delete Auth User (Service Role required)
    const { error: delErr } = await sb.auth.admin.deleteUser(user.id)
    if (delErr) throw delErr

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } 
    })

  } catch (e) {
    console.error('[scout-delete-account] Error:', e)
    return err(500, e instanceof Error ? e.message : 'Internal error during deletion')
  }
})
