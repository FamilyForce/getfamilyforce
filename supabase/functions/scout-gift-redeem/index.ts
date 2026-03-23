// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Gift Redemption Edge Function
// Called after recipient creates an account and enters their child's details.
//
// POST body: { code, childName, childDob, childGender }
// Auth: Bearer session token
//
// Flow:
//   1. Auth check
//   2. Validate gift code (exists, not redeemed, not expired)
//   3. Insert child record
//   4. Calculate trial_end = nextMonthlyBirthday(childDob) + plan_months
//      The catch-up period (today → next monthly birthday) is FREE.
//      The paid subscription starts from the first monthly birthday after redemption.
//      Example: John (born Jan 20) redeems March 16, annual gift:
//        - First digest fires today (March 16) via scout-signup-delivery
//        - scout-digest fires on March 20 (next monthly birthday, catch-up)
//        - trial_end = March 20 + 12 months = March 20, 2027
//        - April 20 onward = month 1 of the paid subscription
//   5. Upsert scout_subscriptions (status = 'trialing')
//   6. Mark gift as redeemed
//   7. Fire scout-signup-delivery (first digest today)
//   8. Return { ok: true, trialEnd }
//
// Deploy: supabase functions deploy scout-gift-redeem
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

// ─── Date helpers (mirrors scout-trial-start logic) ──────────────────────────

// Returns the next occurrence of the child's birth day-of-month at or after today.
// If the birth day-of-month has already passed this month, returns next month's date.
// Example: DOB Jan 20, today March 16 → returns March 20
// Example: DOB Jan 20, today March 21 → returns April 20
function nextMonthlyBirthday(dob: string, now: Date): Date {
  const dobDate  = new Date(dob + 'T00:00:00Z')
  const birthDay = dobDate.getUTCDate()

  // Try this calendar month first
  const candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), birthDay))

  // If candidate is today or in the future, use it; otherwise advance one month
  if (candidate >= now) return candidate
  return oneMonthForward(candidate)
}

// Advance a date by exactly one calendar month (handles end-of-month edge cases).
function oneMonthForward(d: Date): Date {
  const result = new Date(d)
  const day    = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + 1)
  // If the day overflowed (e.g. Jan 31 → Mar 3), snap back to end of target month
  if (result.getUTCDate() !== day) result.setUTCDate(0)
  return result
}

function normaliseGender(raw: string | null | undefined): 'girl' | 'boy' | 'other' | null {
  if (!raw) return null
  const g = raw.toLowerCase().trim()
  if (g === 'girl') return 'girl'
  if (g === 'boy')  return 'boy'
  if (g === 'other') return 'other'
  return null
}

function isValidDob(dob: string): boolean {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false
  const d = new Date(dob + 'T00:00:00Z')
  if (isNaN(d.getTime())) return false
  const now = new Date()
  const maxAge = new Date(now)
  maxAge.setFullYear(maxAge.getFullYear() - 4)
  return d <= now && d >= maxAge
}

function isValidDueDate(dob: string): boolean {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false
  const d = new Date(dob + 'T00:00:00Z')
  if (isNaN(d.getTime())) return false
  const now = new Date()
  // Must be today or in the future, and not more than ~10 months out
  const maxFuture = new Date(now)
  maxFuture.setMonth(maxFuture.getMonth() + 10)
  return d >= now && d <= maxFuture
}

// Extend a date by N calendar months
function addMonths(d: Date, months: number): Date {
  const result = new Date(d)
  const day = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + months)
  if (result.getUTCDate() !== day) result.setUTCDate(0)
  return result
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

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Invalid or expired session', step)
    const authData = await authRes.json()
    const userId = authData.id as string
    if (!userId) return err(401, 'Invalid or expired session', step)

    // 2. Parse body
    step = 'parse'
    const body = await req.json()
    const { code, childName, childDob, childGender, isPrebirth } = body

    if (!code)              return err(400, 'code is required', step)
    if (!childName?.trim()) return err(400, 'childName is required', step)

    if (isPrebirth) {
      if (!isValidDueDate(childDob))
        return err(400, 'Please enter a valid expected due date (today or up to 10 months from now).', step)
    } else {
      if (!isValidDob(childDob))
        return err(400, 'childDob must be a valid YYYY-MM-DD date (baby must be between 0–4 years old).', step)
    }

    // 3. Validate gift code
    step = 'validate-code'
    const { data: gift } = await sb
      .from('scout_gifts')
      .select('id, plan, plan_months, redeemed_at, expires_at, recipient_email')
      .eq('code', code.toUpperCase().trim())
      .maybeSingle()

    if (!gift)             return err(404, 'Gift code not found. Please check the code and try again.', step)
    if (gift.redeemed_at)  return err(409, 'This gift has already been redeemed.', step)
    if (new Date(gift.expires_at) < new Date()) {
      return err(410, 'This gift code has expired.', step)
    }

    // 4. Check if user already has an active/trialing subscription → extend instead of error
    const { data: existingSub } = await sb
      .from('scout_subscriptions')
      .select('status, trial_end')
      .eq('user_id', userId)
      .maybeSingle()

    const hasActiveSub = existingSub && (existingSub.status === 'active' || existingSub.status === 'trialing')

    // 5. Insert/update child record
    step = 'insert-child'
    const name   = childName.trim().slice(0, 50)
    const gender = normaliseGender(childGender)

    let childId: string

    if (isPrebirth) {
      // Pre-birth: dob is null, store due_date and mark expecting
      const { data: newChild, error: childErr } = await sb
        .from('children')
        .insert({ user_id: userId, name, dob: null, due_date: childDob, is_expecting: true, gender })
        .select('id')
        .single()
      if (childErr || !newChild) throw new Error(`Failed to create pre-birth child: ${childErr?.message}`)
      childId = newChild.id
    } else {
      const dob = childDob as string
      const { data: existingChild } = await sb
        .from('children')
        .select('id')
        .eq('user_id', userId)
        .eq('dob', dob)
        .limit(1)
        .maybeSingle()

      if (existingChild) {
        childId = existingChild.id
        await sb.from('children').update({ name, gender }).eq('id', childId)
      } else {
        const { data: newChild, error: childErr } = await sb
          .from('children')
          .insert({ user_id: userId, name, dob, gender })
          .select('id')
          .single()
        if (childErr || !newChild) throw new Error(`Failed to create child: ${childErr?.message}`)
        childId = newChild.id
      }
    }

    // 6. Calculate trial_end
    step = 'calculate-trial-end'
    const now      = new Date()
    const planMos  = gift.plan_months ?? 12
    let trialEnd: Date

    if (hasActiveSub && existingSub!.trial_end) {
      // EXTEND existing subscription: add plan_months to current trial_end
      const currentEnd = new Date(existingSub!.trial_end)
      const baseDate   = currentEnd > now ? currentEnd : now
      trialEnd = addMonths(baseDate, planMos)
    } else if (isPrebirth) {
      // Pre-birth: trial_end = due_date + plan_months (subscription starts at birth)
      const dueDate = new Date(childDob + 'T00:00:00Z')
      trialEnd = addMonths(dueDate, planMos)
    } else {
      // Normal: trial_end = nextMonthlyBirthday + plan_months
      const dob           = childDob as string
      const firstBirthday = nextMonthlyBirthday(dob, now)
      trialEnd = new Date(firstBirthday)
      for (let i = 0; i < planMos; i++) {
        const next = oneMonthForward(trialEnd)
        trialEnd.setTime(next.getTime())
      }
    }

    // 7. Upsert scout_subscriptions
    step = 'upsert-subscription'
    await sb.from('scout_subscriptions').upsert({
      user_id:   userId,
      status:    'trialing',
      trial_end: trialEnd.toISOString(),
      is_gift:   true,
    }, { onConflict: 'user_id' })

    // 8. Mark gift as redeemed
    step = 'mark-redeemed'
    await sb.from('scout_gifts').update({
      redeemed_by:  userId,
      redeemed_at:  new Date().toISOString(),
      child_id:     childId,
    }).eq('id', gift.id)

    // 9. Log to scout_events
    await sb.from('scout_events').insert({
      user_id:    userId,
      child_id:   childId,
      event_type: 'gift_redeemed',
      properties: {
        gift_id:     gift.id,
        plan:        gift.plan,
        plan_months: gift.plan_months,
        trial_end:   trialEnd.toISOString(),
      },
    })

    // 10. Fire signup delivery (first digest + calendar event)
    step = 'trigger-delivery'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    fetch(`${supabaseUrl}/functions/v1/scout-signup-delivery`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body:    JSON.stringify({
        type: 'INSERT', table: 'scout_subscriptions',
        record: { user_id: userId, status: 'trialing', trial_end: trialEnd.toISOString() },
      }),
    }).catch(e => console.error('[scout-gift-redeem] Delivery trigger failed:', e.message))

    return new Response(JSON.stringify({
      ok:        true,
      plan:      gift.plan,
      isPrebirth: isPrebirth ?? false,
      extended:  hasActiveSub ?? false,
      trialEnd:          trialEnd.toISOString(),
      trialEndFormatted: trialEnd.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }),
    }), { status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-gift-redeem] Error at step=${step}:`, msg)
    return err(500, msg, step)
  }
})
