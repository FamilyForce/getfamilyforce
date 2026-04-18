// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Family Circle Accept Edge Function
// Called from sign-in.html / auth/callback.html after the invitee signs in.
//
// POST body: { childId, inviteEmail }
// Auth: Bearer session token (the newly signed-in invitee)
//
// Security:
//   - Authenticated user's email must match inviteEmail (prevents cross-user
//     accept on shared devices via localStorage hijack)
//   - Invites expire after 30 days from invited_at
//   - Idempotent: already-active invites return ok without re-writing
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const INVITE_EXPIRY_DAYS = 30

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

    // 1. Verify session and get authenticated user
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Invalid or expired session')
    const authData = await authRes.json()
    const userId    = authData.id as string
    const userEmail = (authData.email as string || '').toLowerCase().trim()

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { childId, inviteEmail } = await req.json()
    if (!childId || !inviteEmail) return err(400, 'Missing childId or inviteEmail')

    const normalizedInviteEmail = (inviteEmail as string).toLowerCase().trim()

    // 2. Email must match — prevents cross-user accept on shared devices
    if (userEmail !== normalizedInviteEmail) {
      return err(403, `This invite was sent to ${normalizedInviteEmail}. Please sign in with that account to accept it.`)
    }

    // 3. Find invite row
    const { data: invite, error: findErr } = await sb
      .from('family_members')
      .select('id, status, invited_at')
      .eq('child_id', childId)
      .eq('invited_email', normalizedInviteEmail)
      .maybeSingle()

    if (findErr) return err(500, findErr.message)
    if (!invite)  return err(404, 'Invite not found. Please ask the owner to re-send the invite.')

    // 4. Idempotent: already active
    if (invite.status === 'active') {
      return new Response(JSON.stringify({ ok: true, alreadyAccepted: true }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // 5. Check expiry (30 days from invited_at)
    if (invite.invited_at) {
      const invitedAt  = new Date(invite.invited_at).getTime()
      const expiresAt  = invitedAt + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      if (Date.now() > expiresAt) {
        return err(410, 'This invite has expired. Please ask the owner to send a new one.')
      }
    }

    // 6. Activate: link user_id and mark active
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
