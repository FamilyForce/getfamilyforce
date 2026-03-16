// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Child Trial Start (additional children)
// Starts a free trial subscription for a child added to an
// existing Scout account. Mirrors scout-trial-start logic but
// for authenticated users who already have at least one child.
//
// POST body: { childId: string }
// Auth: Bearer session token
//
// Flow:
//   1. Auth + validate childId belongs to user
//   2. Check no active subscription already exists for this child
//   3. Calculate trial_end = nextMonthlyBirthday(childDob, today)
//   4. Bonus month: if first birthday ≤7 days away, extend by one month
//   5. INSERT scout_subscriptions row (child_id, trialing, trial_end)
//   6. Log scout_events: trial_start + trial_bonus_eligible if applicable
//   7. Return { ok, trialEnd, bonusEligible }
//
// Deploy: supabase functions deploy scout-child-trial-start
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

function nextMonthlyBirthday(dob: Date, fromDate: Date): Date {
  const bd = new Date(Date.UTC(
    fromDate.getUTCFullYear(),
    fromDate.getUTCMonth(),
    dob.getUTCDate()
  ))
  if (bd <= fromDate) bd.setUTCMonth(bd.getUTCMonth() + 1)
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

    // 2. Parse + validate child
    step = 'validate-child'
    const { childId } = await req.json()
    if (!childId) return err(400, 'childId is required', step)

    const { data: child, error: childErr } = await sb
      .from('children')
      .select('id, name, dob, user_id')
      .eq('id', childId)
      .eq('user_id', user.id)
      .single()

    if (childErr || !child) return err(404, 'Child not found or does not belong to this user', step)

    // 3. Check no existing subscription for this child
    step = 'check-existing'
    const { data: existing } = await sb
      .from('scout_subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('child_id', childId)
      .maybeSingle()

    if (existing && (existing.status === 'active' || existing.status === 'trialing')) {
      return err(409, 'This child already has an active subscription', step)
    }

    // 4. Calculate trial_end
    step = 'trial-end'
    const today  = new Date()
    const dob    = new Date(child.dob + 'T00:00:00Z')
    let trialEnd = nextMonthlyBirthday(dob, today)
    const daysUntil = Math.ceil((trialEnd.getTime() - today.getTime()) / 86400000)
    const bonusEligible = daysUntil <= 7
    if (bonusEligible) trialEnd = oneMonthForward(trialEnd)

    // 5. Insert subscription row
    step = 'db-insert'
    await sb.from('scout_subscriptions').insert({
      user_id:   user.id,
      child_id:  childId,
      status:    'trialing',
      trial_end: trialEnd.toISOString(),
    })

    // 6. Log events
    step = 'log-events'
    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   childId,
      event_type: 'trial_start',
      properties: {
        trial_end:           trialEnd.toISOString(),
        days_until_birthday: daysUntil,
        bonus_eligible:      bonusEligible,
        additional_child:    true,
      },
    })

    if (bonusEligible) {
      await sb.from('scout_events').insert({
        user_id:    user.id,
        child_id:   childId,
        event_type: 'trial_bonus_eligible',
        properties: {
          bonus_birthday:      trialEnd.toISOString().split('T')[0],
          days_until_birthday: daysUntil,
        },
      })
    }

    console.log(`[scout-child-trial-start] Trial started: user=${user.id}, child=${childId}, trialEnd=${trialEnd.toISOString()}, bonus=${bonusEligible}`)

    return new Response(JSON.stringify({
      ok:             true,
      trialEnd:       trialEnd.toISOString(),
      bonusEligible,
      daysUntilBirthday: daysUntil,
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-child-trial-start] Error at step=${step}:`, msg)
    return err(500, msg, step)
  }
})
