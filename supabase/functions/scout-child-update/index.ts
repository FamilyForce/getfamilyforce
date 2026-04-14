// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Child Update (protected)
// Handles child profile edits with DOB change protection.
//
// DOB rules:
//   - Before trial starts: DOB can be changed freely
//   - After trial starts: DOB can only be changed ONCE
//   - New DOB must be within ±4 months of the original DOB
//   - Every DOB change is logged to scout_events
//   - Attempting a second change after trial returns a lock error
//
// POST body: { childId, name?, dob?, gender? }
// Auth: Bearer session token
//
// Returns:
//   { ok: true, dobLocked: bool }            — success
//   { ok: false, error: string, code: string } — failure
//     codes: UNAUTHORIZED, NOT_FOUND, DOB_LOCKED, DOB_OUT_OF_RANGE, INVALID
//
// Deploy: supabase functions deploy scout-child-update
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function res(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const DOB_RANGE_MONTHS = 4   // new DOB must be within ±4 months of original
const MAX_DOB_CHANGES  = 1   // after trial starts, only 1 change allowed

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return res({ ok: false, error: 'Method not allowed', code: 'INVALID' }, 405)
  try {

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // 1. Auth
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) return res({ ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401)

  // 2. Parse body
  let body: { childId?: string; name?: string; dob?: string; gender?: string }
  try { body = await req.json() } catch { return res({ ok: false, error: 'Invalid JSON', code: 'INVALID' }, 400) }

  const { childId, name, dob: newDob, gender } = body
  if (!childId) return res({ ok: false, error: 'childId required', code: 'INVALID' }, 400)

  // 3. Load child — verify ownership
  const { data: child, error: childErr } = await sb
    .from('children')
    .select('id, name, dob, gender, user_id, dob_changed_count, dob_original')
    .eq('id', childId)
    .eq('user_id', user.id)
    .single()

  if (childErr || !child) return res({ ok: false, error: 'Only the account owner can edit child details. Please sign in to the owner account to make changes.', code: 'NOT_FOUND' }, 404)

  const originalDob = child.dob
  const dobChanging = newDob && newDob !== originalDob

  // 4. DOB change protection
  if (dobChanging) {
    // 4a. Check if trial has started for this user.
    // Subscriptions are user-level (child_id is null), so query by user_id, not child_id.
    const { data: sub } = await sb
      .from('scout_subscriptions')
      .select('id, status, created_at')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const trialStarted = !!sub

    if (trialStarted) {
      // 4b. Range check: new DOB must be within ±4 months of original
      const origDate = new Date(originalDob + 'T00:00:00Z')
      const newDate  = new Date(newDob       + 'T00:00:00Z')
      const diffMs   = Math.abs(newDate.getTime() - origDate.getTime())
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      const maxDays  = DOB_RANGE_MONTHS * 31  // ~124 days

      if (diffDays > maxDays) {
        return res({
          ok:    false,
          error: `Date of birth can only be changed within ${DOB_RANGE_MONTHS} months of the original. Contact support@getfamilyforce.com for help.`,
          code:  'DOB_OUT_OF_RANGE',
        }, 400)
      }

      // 4c. Count prior DOB changes since trial started
      const { count } = await sb
        .from('scout_events')
        .select('id', { count: 'exact', head: true })
        .eq('child_id', childId)
        .eq('event_type', 'dob_changed')

      if ((count ?? 0) >= MAX_DOB_CHANGES) {
        return res({
          ok:    false,
          error: `Date of birth has already been changed once. Contact support@getfamilyforce.com to make further changes.`,
          code:  'DOB_LOCKED',
        }, 403)
      }
    }

    // 4d. New DOB must not be in the future (unless expecting mode — handled separately)
    const newDate = new Date(newDob + 'T00:00:00Z')
    if (newDate > new Date()) {
      return res({ ok: false, error: 'Date of birth cannot be in the future.', code: 'INVALID' }, 400)
    }
  }

  // 5. Build update payload (only include provided fields)
  const update: Record<string, string | number | null> = {}
  if (name)   update.name   = name
  if (newDob) update.dob    = newDob
  if (gender) update.gender = gender

  if (dobChanging) {
    const currentCount = (child as any).dob_changed_count ?? 0
    update.dob_changed_count = currentCount + 1
    update.dob_changed_at    = new Date().toISOString()
    // Preserve the very first DOB as the baseline for range checks
    if (!(child as any).dob_original) update.dob_original = originalDob
  }

  if (Object.keys(update).length === 0) {
    return res({ ok: false, error: 'No fields to update', code: 'INVALID' }, 400)
  }

  // 6. Save
  const { error: updateErr } = await sb
    .from('children')
    .update(update)
    .eq('id', childId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[scout-child-update] Update failed:', updateErr.message)
    return res({ ok: false, error: 'Could not save. Please try again.', code: 'INVALID' }, 500)
  }

  // 7. Audit log for DOB changes
  if (dobChanging) {
    await sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   childId,
      event_type: 'dob_changed',
      properties: {
        dob_before: originalDob,
        dob_after:  newDob,
        diff_days:  Math.round(
          Math.abs(new Date(newDob + 'T00:00:00Z').getTime() - new Date(originalDob + 'T00:00:00Z').getTime())
          / (1000 * 60 * 60 * 24)
        ),
      },
    })
    console.log(`[scout-child-update] DOB changed for child ${childId}: ${originalDob} → ${newDob}`)
  }

  // 8. Check post-update lock state for UI response
  // dobLocked = true if trial started AND changes exhausted
  let dobLocked = false
  if (dobChanging) {
    // We just used the one allowed change — it's now locked
    const { data: postSub } = await sb
      .from('scout_subscriptions')
      .select('id')
      .eq('child_id', childId)
      .limit(1)
      .maybeSingle()
    dobLocked = !!postSub
  }

  const newCount = dobChanging ? ((child as any).dob_changed_count ?? 0) + 1 : ((child as any).dob_changed_count ?? 0)
  return res({ ok: true, dobLocked, dobChangedCount: newCount })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[scout-child-update] Unhandled error:', msg)
    return res({ ok: false, error: 'Server error: ' + msg, code: 'SERVER_ERROR' }, 500)
  }
})
