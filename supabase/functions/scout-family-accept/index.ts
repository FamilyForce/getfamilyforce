// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Family Circle Accept Edge Function
// Called from auth/callback.html after the invitee signs in.
//
// POST body: { childId, inviteEmail }
// Auth: Bearer session token (the newly signed-in invitee)
//
// Flow:
//   1. Verify session
//   2. Find pending family_members row for (child_id + invited_email)
//   3. Update row: set member_user_id = user.id, status = 'active'
//   4. Ensure user has access to the child's subscription (read-only via family_members)
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' }
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return err(405, 'Method not allowed')

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return err(401, 'Missing auth token')

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Invalid or expired session')
    const authData = await authRes.json()
    const userId = authData.id as string

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { childId, inviteEmail } = await req.json()
    if (!childId || !inviteEmail) return err(400, 'Missing childId or inviteEmail')

    // Find pending invite row
    const { data: invite, error: findErr } = await sb
      .from('family_members')
      .select('id, status')
      .eq('child_id', childId)
      .eq('invited_email', inviteEmail.toLowerCase().trim())
      .maybeSingle()

    if (findErr) return err(500, findErr.message)
    if (!invite) return err(404, 'Invite not found. Please ask the owner to re-send the invite.')
    if (invite.status === 'active') {
      // Already accepted — just return ok (idempotent)
      return new Response(JSON.stringify({ ok: true, alreadyAccepted: true }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // Activate: link user_id and mark active
    const { error: updateErr } = await sb
      .from('family_members')
      .update({
        member_user_id: userId,
        status:         'active',
        accepted_at:    new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateErr) return err(500, updateErr.message)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return err(500, e instanceof Error ? e.message : 'Internal error')
  }
})
