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
//
// Notifications:
//   - On successful accept, sends email to the invite owner (fire-and-forget)
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

// Fire-and-forget: notify the invite owner that their family member joined
async function notifyOwner(opts: {
  supabaseUrl:  string
  serviceRole:  string
  ownerUserId:  string
  memberEmail:  string
  childName:    string
  childId:      string
}) {
  try {
    const { supabaseUrl, serviceRole, ownerUserId, memberEmail, childName, childId } = opts

    const resendKey = Deno.env.get('RESEND_API_KEY')
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
    const siteUrl   = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'
    if (!resendKey) return

    // Fetch owner's email from auth
    const ownerRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${ownerUserId}`, {
      headers: { 'Authorization': `Bearer ${serviceRole}`, 'apikey': serviceRole },
    })
    if (!ownerRes.ok) return
    const owner = await ownerRes.json()
    const ownerEmail = owner.email as string
    if (!ownerEmail) return

    // Friendly member name: use the part before @ if no display name
    const memberName = memberEmail.split('@')[0]

    const familyUrl = `${siteUrl}/scout-dashboard/family.html`

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #1C1B2E;">
        <div style="text-align: center; margin-bottom: 28px;">
          <svg width="36" height="40" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 15 L7 1 L13 15" stroke="#6E4ED6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 style="color: #6E4ED6; margin: 0 0 12px; font-size: 22px;">
          ${memberEmail} joined ${childName}'s Family Circle 🎉
        </h2>
        <p style="font-size: 16px; line-height: 1.6; color: #3D3B52; margin: 0 0 20px;">
          Great news — <strong>${memberEmail}</strong> just accepted your invitation and can now see
          ${childName}'s Scout dashboard. They'll get the same monthly milestone updates you do.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${familyUrl}"
             style="background: #6E4ED6; color: white; padding: 14px 28px; border-radius: 100px;
                    text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
            View Family Circle →
          </a>
        </div>
        <p style="font-size: 13px; color: #8A879A; line-height: 1.5; margin: 0;">
          You can manage your Family Circle at any time from your Scout dashboard settings.
        </p>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     `${fromName} <${fromEmail}>`,
        to:       [ownerEmail],
        reply_to: ['support@getfamilyforce.com'],
        subject:  `${memberEmail} joined ${childName}'s Family Circle 🎉`,
        html,
        tags: [{ name: 'email_type', value: 'family_joined' }],
      }),
    })
  } catch (e) {
    // Fire-and-forget — log but never block the accept response
    console.error('[scout-family-accept] notify owner error:', e)
  }
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

    // 3. Find invite row (include owner_user_id for notification)
    const { data: invite, error: findErr } = await sb
      .from('family_members')
      .select('id, status, invited_at, owner_user_id')
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
      const invitedAt = new Date(invite.invited_at).getTime()
      const expiresAt = invitedAt + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      if (Date.now() > expiresAt) {
        return err(410, 'This invite has expired. Please ask the owner to send a new one.')
      }
    }

    // 6. Fetch child name for notification (non-blocking if missing)
    const { data: child } = await sb
      .from('children')
      .select('name')
      .eq('id', childId)
      .maybeSingle()
    const childName = (child?.name as string) || 'your child'

    // 7. Activate: link user_id and mark active
    const { error: updateErr } = await sb
      .from('family_members')
      .update({
        member_user_id: userId,
        status:         'active',
        accepted_at:    new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateErr) return err(500, updateErr.message)

    // 8. Notify owner — fire-and-forget, does not affect response
    if (invite.owner_user_id) {
      notifyOwner({
        supabaseUrl:  SUPABASE_URL,
        serviceRole:  SERVICE_ROLE,
        ownerUserId:  invite.owner_user_id,
        memberEmail:  normalizedInviteEmail,
        childName,
        childId,
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return err(500, e instanceof Error ? e.message : 'Internal error')
  }
})
