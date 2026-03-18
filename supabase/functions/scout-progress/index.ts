// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Window Progress Edge Function (3H)
// Called from the dashboard on user action (mark done / in progress / skip).
// Optimistic UI: dashboard updates immediately, this confirms server-side.
//
// POST body:
//   { windowId, childId, status, notes?, completedDate? }
//   status:        'open' | 'in_progress' | 'completed' | 'skipped'
//   notes:         optional string, max 500 chars
//   completedDate: optional 'YYYY-MM-DD' — user-specified date (defaults to today)
//
// Auth: Bearer session token
//
// Deploy: supabase functions deploy scout-progress
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_STATUSES = new Set(['open', 'in_progress', 'completed', 'skipped'])

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  try {
    // 1. Auth — official Supabase edge function pattern:
    //    user client with the request's token for auth validation,
    //    separate admin client (service role) for DB operations.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return err(401, 'Missing auth token')

    // DEBUG: log token prefix to verify what's being sent
    const tokenPreview = authHeader.replace('Bearer ', '').slice(0, 20)
    console.log('[scout-progress] Auth header token prefix:', tokenPreview)

    const SUPABASE_URL           = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')!
    const SUPABASE_SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // User-scoped client — validates the session token
    const userSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await userSb.auth.getUser()
    console.log('[scout-progress] getUser result — user:', user?.id ?? 'null', '| error:', authErr?.message ?? 'none')
    if (authErr || !user) return err(401, `Invalid or expired session: ${authErr?.message ?? 'no user'}`)

    // Admin client — used for all DB reads/writes (bypasses RLS where needed)
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    // 2. Parse and validate body
    const body = await req.json()
    const { windowId, childId, status, notes, completedDate } = body

    if (!windowId)  return err(400, 'windowId is required')
    if (!childId)   return err(400, 'childId is required')
    // status is optional for note-only saves; if provided it must be valid
    if (status !== undefined && !VALID_STATUSES.has(status)) {
      return err(400, `status must be one of: ${[...VALID_STATUSES].join(', ')}`)
    }
    if (notes && notes.length > 500)  return err(400, 'notes must be 500 characters or fewer')

    // Validate completedDate if provided
    let resolvedDate: string | null = null
    if (status === 'completed' || status === 'in_progress') {
      if (completedDate && /^\d{4}-\d{2}-\d{2}$/.test(completedDate)) {
        const d = new Date(completedDate + 'T00:00:00Z')
        if (!isNaN(d.getTime()) && d <= new Date()) {
          resolvedDate = completedDate
        }
      }
      if (!resolvedDate) {
        // Default to today
        resolvedDate = new Date().toISOString().split('T')[0]
      }
    }

    // 3. Verify the child belongs to this user (or user has family access)
    const { data: child } = await sb
      .from('children')
      .select('id, user_id')
      .eq('id', childId)
      .maybeSingle()

    if (!child) return err(404, 'Child not found')

    if (child.user_id !== user.id) {
      // family_members links owner_user_id → member_user_id (no child_id column)
      const { data: familyAccess } = await sb
        .from('family_members')
        .select('member_user_id')
        .eq('owner_user_id', child.user_id)
        .eq('member_user_id', user.id)
        .maybeSingle()

      if (!familyAccess) return err(403, 'You do not have access to this child\'s records')
    }

    // 4. Resolve display name for attribution
    // Prefer profiles.name → fall back to email prefix
    const { data: profile } = await sb
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()

    const displayName = profile?.name?.trim() ||
      (user.email ? user.email.split('@')[0] : 'Unknown')

    // 5. Verify the window exists
    const { data: window } = await sb
      .from('milestone_windows')
      .select('id, title, urgency, category')
      .eq('id', windowId)
      .maybeSingle()

    if (!window) return err(404, 'Window not found')

    // 6. Build upsert payload
    const payload: Record<string, unknown> = {
      user_id:              user.id,
      child_id:             childId,
      window_id:            windowId,
      updated_at:           new Date().toISOString(),
      updated_by_user_id:   user.id,
      updated_by_name:      displayName,
    }

    // Only include status if provided (note-only saves should not overwrite existing status)
    if (status !== undefined) payload.status = status

    // Only set notes if provided (don't overwrite existing note when just updating status)
    if (notes !== undefined) payload.notes = notes ?? null

    // Set completed_date for active states; clear it when reverting to open
    if (resolvedDate)      payload.completed_date = resolvedDate
    if (status === 'open') payload.completed_date = null

    // 7. Upsert window_progress
    const { error: upsertErr } = await sb
      .from('window_progress')
      .upsert(payload, { onConflict: 'child_id,window_id' })

    if (upsertErr) {
      console.error('[scout-progress] Upsert error:', upsertErr.message)
      return err(500, `Failed to save progress: ${upsertErr.message}`)
    }

    // 8. Log to scout_events (fire and forget)
    sb.from('scout_events').insert({
      user_id:    user.id,
      child_id:   childId,
      event_type: 'window_progress_updated',
      properties: {
        window_id:      windowId,
        window_title:   window.title,
        urgency_tier:   window.urgency,
        category:       window.category,
        status,
        completed_date: resolvedDate,
        updated_by:     displayName,
        has_notes:      !!notes,
      },
    }).then().catch(e => console.error('[scout-progress] Event log error:', e.message))

    return new Response(JSON.stringify({
      ok:             true,
      status,
      completedDate:  resolvedDate,
      updatedByName:  displayName,
    }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[scout-progress] Error:', msg)
    return err(500, msg)
  }
})
