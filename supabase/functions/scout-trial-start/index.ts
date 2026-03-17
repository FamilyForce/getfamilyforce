// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial Start Edge Function
// No credit card required. Sets up free trial to child's next birthday.
//
// POST body: { childName, childDob, childGender }
// Auth: Bearer session token (Supabase)
//
// Actions:
//   1. Auth check
//   2. Insert child into children table
//   3. Calculate trial_end = child's next birthday
//   4. Upsert scout_subscriptions (status = 'trialing')
//   5. Fire scout-signup-delivery (async, no await)
//   6. Return { ok: true, trialEnd, childId }
//
// Deploy: supabase functions deploy scout-trial-start
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
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

// ─── Calculate child's next MONTHLY birthday from a given date ───────────────
// Returns the next occurrence of the birth day-of-month in any month.
// e.g. born Jan 22, today = March 5 → returns March 22
// e.g. born Jan 22, today = March 22 → returns April 22
// Handles short months: born 31st in a 30-day month → last day of month
function nextMonthlyBirthday(dob: Date, fromDate: Date): Date {
  const birthDay = dob.getUTCDate()
  const year     = fromDate.getUTCFullYear()
  const month    = fromDate.getUTCMonth()

  // Try this month
  const daysThisMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const dayThisMonth  = Math.min(birthDay, daysThisMonth)
  const thisMonth     = new Date(Date.UTC(year, month, dayThisMonth))
  if (thisMonth > fromDate) return thisMonth

  // Next month
  const nextMonth     = month === 11 ? 0 : month + 1
  const nextYear      = month === 11 ? year + 1 : year
  const daysNextMonth = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate()
  const dayNextMonth  = Math.min(birthDay, daysNextMonth)
  return new Date(Date.UTC(nextYear, nextMonth, dayNextMonth))
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

// ─── Validate date of birth ───────────────────────────────────────────────────
function isValidDob(dob: string): boolean {
  if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false
  const d = new Date(dob + 'T00:00:00Z')
  if (isNaN(d.getTime())) return false
  const now = new Date()
  // Must be in the past, and not more than 4 years ago (Scout covers 0-36 months)
  const maxAge = new Date(now)
  maxAge.setFullYear(maxAge.getFullYear() - 4)
  return d <= now && d >= maxAge
}

// ─── Validate gender ──────────────────────────────────────────────────────────
function normaliseGender(raw: string | null | undefined): 'girl' | 'boy' | 'other' | null {
  if (!raw) return null
  const g = raw.toLowerCase().trim()
  if (g === 'girl')  return 'girl'
  if (g === 'boy')   return 'boy'
  if (g === 'other') return 'other'
  return null
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
      body:    JSON.stringify({ chat_id: chatId, text: `🚨 scout-trial-start: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return err(405, 'Method not allowed')

  const jobStart = Date.now()
  let   step     = 'init'

  try {
    // 1. Auth — validate session token
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
    if (!user.email)      return err(400, 'User has no email address', step)

    // 2. Parse and validate body
    step = 'parse'
    const body = await req.json()
    const { childName, childDob, childGender, isExpecting, dueDate } = body

    if (!childName || typeof childName !== 'string' || childName.trim().length < 1) {
      return err(400, 'childName is required', step)
    }

    // For expecting parents: validate due date (future), skip DOB validation
    // For standard: validate DOB (past, ≤4 years)
    if (isExpecting) {
      if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return err(400, 'dueDate is required for expecting parents (YYYY-MM-DD)', step)
      }
      const due = new Date(dueDate + 'T00:00:00Z')
      if (isNaN(due.getTime()) || due <= new Date()) {
        return err(400, 'dueDate must be a future date', step)
      }
    } else {
      if (!isValidDob(childDob)) {
        return err(400, 'childDob must be a valid date in YYYY-MM-DD format, not in the future, not more than 4 years ago', step)
      }
    }

    const name   = childName.trim().slice(0, 50)
    const gender = normaliseGender(childGender)
    // For expecting: use dueDate as placeholder DOB; real DOB set at arrival
    const dob    = isExpecting ? (dueDate as string) : (childDob as string)

    // 3. Insert child record
    // Dedup by name + dob (not dob alone) to support twins with the same birthday
    step = 'insert-child'
    const { data: existingChild } = await sb
      .from('children')
      .select('id')
      .eq('user_id', user.id)
      .eq('name',    name)
      .eq('dob',     dob)
      .limit(1)
      .maybeSingle()

    let childId: string

    if (existingChild) {
      // Update existing record
      childId = existingChild.id
      await sb
        .from('children')
        .update({
          name, gender,
          ...(isExpecting ? { is_expecting: true, due_date: dueDate } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', childId)
    } else {
      // Insert new child
      const childRow: Record<string, unknown> = { user_id: user.id, name, dob, gender }
      if (isExpecting) {
        childRow.is_expecting = true
        childRow.due_date     = dueDate
      }
      const { data: newChild, error: childErr } = await sb
        .from('children')
        .insert(childRow)
        .select('id')
        .single()

      if (childErr || !newChild) {
        throw new Error(`Failed to create child record: ${childErr?.message}`)
      }
      childId = newChild.id
    }

    // 4. Calculate trial_end = child's next MONTHLY birthday
    step = 'calculate-trial-end'
    const dobDate      = new Date(dob + 'T00:00:00Z')
    const now          = new Date()
    const birthDay     = dobDate.getUTCDate()
    const nextBday     = nextMonthlyBirthday(dobDate, now)
    const daysUntilEnd = Math.floor((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Bonus month: if next birthday is within 7 days, extend trial by one extra month
    // so the user gets 2 digests instead of 1 during their trial
    const bonusMonth = daysUntilEnd <= 7
    const trialEnd   = bonusMonth ? oneMonthForward(nextBday, birthDay) : nextBday

    // 5. Upsert scout_subscriptions
    step = 'upsert-subscription'
    const { error: subErr } = await sb
      .from('scout_subscriptions')
      .upsert({
        user_id:   user.id,
        status:    'trialing',
        trial_end: trialEnd.toISOString(),
      }, { onConflict: 'user_id' })

    if (subErr) throw new Error(`Failed to create subscription: ${subErr.message}`)

    // 6. Log to scout_events (non-fatal — table may not exist yet in all environments)
    step = 'log-event'
    try {
      await sb.from('scout_events').insert({
        user_id:    user.id,
        child_id:   childId,
        event_type: 'trial_started',
        properties: {
          child_name:    name,
          child_dob:     dob,
          child_gender:  gender,
          trial_end:     trialEnd.toISOString(),
          days_until_first_birthday: daysUntilEnd,
          bonus_month:   bonusMonth,
          duration_ms:   Date.now() - jobStart,
        },
      })
    } catch (logErr) {
      // Non-fatal: event logging must never block trial creation
      console.warn('[scout-trial-start] scout_events insert failed (table may not exist):', logErr)
    }

    // 6b. If bonus month: log trial_bonus_eligible so scout-digest knows to fire
    //     for this user on the intermediate birthday (nextBday)
    if (bonusMonth) {
      try {
        await sb.from('scout_events').insert({
          user_id:    user.id,
          child_id:   childId,
          event_type: 'trial_bonus_eligible',
          properties: {
            bonus_birthday:      nextBday.toISOString().split('T')[0],  // YYYY-MM-DD
            days_until_birthday: daysUntilEnd,
          },
        })
      } catch (logErr) {
        console.warn('[scout-trial-start] trial_bonus_eligible insert failed:', logErr)
      }
      console.log(`[scout-trial-start] Bonus month granted for user ${user.id} — next birthday ${nextBday.toISOString().split('T')[0]} in ${daysUntilEnd} days`)
    }

    // 7. Fire scout-signup-delivery (async — do not await, don't block the response)
    step = 'trigger-delivery'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Simulate a DB webhook payload that scout-signup-delivery expects
    const deliveryPayload = {
      type:   'INSERT',
      table:  'scout_subscriptions',
      record: { user_id: user.id, status: 'trialing', trial_end: trialEnd.toISOString() },
    }

    fetch(`${supabaseUrl}/functions/v1/scout-signup-delivery`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(deliveryPayload),
    }).catch(e => {
      console.error('[scout-trial-start] Failed to trigger delivery:', e.message)
      telegramAlert(`Failed to trigger signup delivery for user ${user.id}: ${e.message}`)
    })

    // Return immediately — delivery happens in the background
    return new Response(JSON.stringify({
      ok:         true,
      childId,
      trialEnd:   trialEnd.toISOString(),
      trialEndFormatted: trialEnd.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
      }),
      bonusMonth,
    }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-trial-start] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)
    return err(500, msg, step)
  }
})
