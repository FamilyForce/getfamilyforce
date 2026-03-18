// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Confirm Arrival
// Called when an expecting parent confirms their baby has arrived.
//
// POST body: { childId: string, realDob: string (YYYY-MM-DD) }
// Auth: Bearer session token (Supabase)
//
// Actions:
//   1. Auth check
//   2. Load child — must be is_expecting = true and belong to user
//   3. Validate realDob (past, within reasonable window of due_date)
//   4. Update child: dob = realDob, is_expecting = false (due_date kept for reference)
//   5. Reset trial_end = baby's next monthly birthday (Option A: trial clock resets at birth)
//      Early signup rule: if next birthday ≤7 days away, extend by one month
//   6. Upsert scout_subscriptions with new trial_end (status stays trialing)
//   7. Log birth_confirmed to scout_events
//   8. Fire scout-signup-delivery async — sends first real post-birth digest
//   9. Return { ok: true, trialEnd, childId, earlySignup }
//
// Deploy: supabase functions deploy scout-confirm-arrival
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }         from 'https://esm.sh/@supabase/supabase-js@2'
import { nextMonthlyBirthday }  from '../_shared/ics-generator.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ─── Advance one monthly birthday forward ─────────────────────────────────────
function oneMonthForward(date: Date, birthDay: number): Date {
  const month = date.getUTCMonth()
  const year  = date.getUTCFullYear()
  const nextM = month === 11 ? 0 : month + 1
  const nextY = month === 11 ? year + 1 : year
  const days  = new Date(Date.UTC(nextY, nextM + 1, 0)).getUTCDate()
  return new Date(Date.UTC(nextY, nextM, Math.min(birthDay, days)))
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
      body:    JSON.stringify({ chat_id: chatId, text: `🍼 scout-confirm-arrival: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const jobStart = Date.now()
  let   step     = 'init'

  try {
    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 1. Auth via REST API (service role + getUser SDK unreliable)
    step = 'auth'
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return err(401, 'Missing auth token', step)
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Unauthorized', step)
    const authData = await authRes.json()
    const userId = authData.id as string
    if (!userId) return err(401, 'Unauthorized', step)

    // 2. Parse body
    step = 'parse'
    let body: { childId?: string; realDob?: string }
    try { body = await req.json() } catch { return err(400, 'Invalid JSON', step) }

    const { childId, realDob } = body
    if (!childId)  return err(400, 'childId is required', step)
    if (!realDob)  return err(400, 'realDob is required (YYYY-MM-DD)', step)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(realDob)) return err(400, 'realDob must be YYYY-MM-DD', step)

    const realDobDate = new Date(realDob + 'T00:00:00Z')
    if (isNaN(realDobDate.getTime())) return err(400, 'realDob is not a valid date', step)

    const now = new Date()
    if (realDobDate > now) return err(400, 'realDob must be in the past — baby must already be born', step)

    // 3. Load child — verify ownership and expecting status
    step = 'load-child'
    const { data: child, error: childErr } = await sb
      .from('children')
      .select('id, name, dob, due_date, is_expecting, gender, user_id')
      .eq('id', childId)
      .eq('user_id', userId)
      .single()

    if (childErr || !child) return err(404, 'Child not found', step)
    if (!child.is_expecting) return err(400, 'Child is not in expecting mode — arrival already confirmed', step)
    if (!child.due_date)     return err(400, 'Child has no due date on record', step)

    // 4. Validate realDob is plausible relative to due date
    //    Allow up to 10 weeks early (extreme preemie) and up to 4 weeks late
    step = 'validate-dob'
    const dueDate         = new Date(child.due_date + 'T00:00:00Z')
    const earliestAllowed = new Date(dueDate.getTime() - 10 * 7 * 24 * 3600 * 1000)  // 10 weeks before due
    const latestAllowed   = new Date(dueDate.getTime() +  4 * 7 * 24 * 3600 * 1000)  // 4 weeks after due

    if (realDobDate < earliestAllowed || realDobDate > latestAllowed) {
      return err(400, `realDob is outside the expected window (10 weeks before to 4 weeks after due date)`, step)
    }

    // 5. Update child record
    step = 'update-child'
    const { error: updateErr } = await sb
      .from('children')
      .update({
        dob:          realDob,
        is_expecting: false,
        // due_date is intentionally kept for historical reference
        updated_at:   now.toISOString(),
      })
      .eq('id', childId)
      .eq('user_id', userId)

    if (updateErr) throw new Error(`Failed to update child: ${updateErr.message}`)

    // 6. Reset trial_end to baby's next monthly birthday (Option A — trial clock resets at birth)
    //    Apply early signup rule: if next birthday ≤7 days away, extend by one extra month
    step = 'calculate-trial-end'
    const birthDay     = realDobDate.getUTCDate()
    const nextBday     = nextMonthlyBirthday(realDobDate, now)
    const daysUntilEnd = Math.floor((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const earlySignup  = daysUntilEnd <= 7
    const trialEnd     = earlySignup ? oneMonthForward(nextBday, birthDay) : nextBday

    // 7. Upsert scout_subscriptions with new trial_end (status stays trialing)
    step = 'upsert-subscription'
    const { error: subErr } = await sb
      .from('scout_subscriptions')
      .upsert({
        user_id:   userId,
        status:    'trialing',
        trial_end: trialEnd.toISOString(),
      }, { onConflict: 'user_id' })

    if (subErr) throw new Error(`Failed to update subscription: ${subErr.message}`)

    // 8. Log birth_confirmed to scout_events
    step = 'log-event'
    try {
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   childId,
        event_type: 'birth_confirmed',
        properties: {
          real_dob:                  realDob,
          due_date:                  child.due_date,
          days_from_due:             Math.round((realDobDate.getTime() - dueDate.getTime()) / 86400000),
          trial_end:                 trialEnd.toISOString(),
          days_until_first_birthday: daysUntilEnd,
          early_signup:              earlySignup,
          duration_ms:               Date.now() - jobStart,
        },
      })
    } catch (logErr) {
      console.warn('[scout-confirm-arrival] scout_events insert failed:', logErr)
    }

    // 9. Fire scout-signup-delivery async — first real post-birth digest
    //    Uses digest_type = 'birth_signup' to avoid dedup collision with pre-birth 'signup' log
    step = 'trigger-delivery'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const deliveryPayload = {
      type:   'INSERT',
      table:  'scout_subscriptions',
      record: {
        user_id:      userId,
        status:       'trialing',
        trial_end:    trialEnd.toISOString(),
        early_signup: earlySignup,   // ICS + footer point to trialEnd date if birthday is close
        birth_signup: true,          // tells signup-delivery to use digest_type 'birth_signup'
      },
    }

    fetch(`${supabaseUrl}/functions/v1/scout-signup-delivery`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(deliveryPayload),
    }).catch(e => {
      console.error('[scout-confirm-arrival] Failed to trigger signup delivery:', e.message)
      telegramAlert(`Failed to trigger post-birth digest for user ${userId}: ${e.message}`)
    })

    console.log(`[scout-confirm-arrival] Birth confirmed for user ${userId}, child ${childId} (dob=${realDob}, trialEnd=${trialEnd.toISOString().split('T')[0]}, early=${earlySignup})`)
    await telegramAlert(`🍼 Birth confirmed — user ${userId}, ${child.name} born ${realDob} (due ${child.due_date})`)

    return new Response(JSON.stringify({
      ok:           true,
      childId,
      trialEnd:     trialEnd.toISOString(),
      trialEndFormatted: trialEnd.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }),
      earlySignup,
    }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-confirm-arrival] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)
    return err(500, msg, step)
  }
})
