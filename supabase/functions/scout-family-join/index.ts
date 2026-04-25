/**
 * scout-family-join
 *
 * Creates a pre-confirmed FamilyForce account for an invited family member and
 * immediately accepts their invite — all in one server-side call.
 *
 * Why this exists:
 *   The standard signUp() flow sends a confirmation email.  The confirmation link
 *   uses PKCE, which requires the same browser context as the original signUp call.
 *   On iOS Mail → Safari this always fails (different WebKit contexts), forcing the
 *   user to sign in manually after confirming — confusing and broken.
 *
 *   The invite link itself proves the user owns this email address (they clicked it
 *   from their inbox), so a second confirmation step is redundant.  This function
 *   uses the admin API to create the account already confirmed and skips the email
 *   entirely.
 *
 * POST body:
 *   { childId: string, inviteEmail: string, password: string }
 *
 * Response 200:  { ok: true, childId: string, alreadyAccepted?: true }
 * Response 409:  { error: "already_registered" }  → client should switch to sign-in mode
 * Response 4xx:  { error: "..." }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const err = (status: number, msg: string) =>
  new Response(JSON.stringify({ error: msg }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST')   return err(405, 'Method not allowed')

  let body: { childId?: string; inviteEmail?: string; password?: string }
  try { body = await req.json() } catch { return err(400, 'Invalid JSON') }

  const { childId, inviteEmail, password } = body
  if (!childId || !inviteEmail || !password)
    return err(400, 'childId, inviteEmail and password are required')
  if (password.length < 8)
    return err(400, 'Password must be at least 8 characters')

  const email = inviteEmail.toLowerCase().trim()

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // ── 1. Validate invite ─────────────────────────────────────────────────────
  const { data: invite, error: inviteErr } = await sb
    .from('family_members')
    .select('id, status, invited_at, invited_email')
    .eq('child_id', childId)
    .eq('invited_email', email)
    .maybeSingle()

  if (inviteErr || !invite)
    return err(404, 'Invite not found. Check with the person who invited you.')

  if (invite.status === 'active') {
    // Already accepted — return ok so client can sign in and go to dashboard
    return new Response(JSON.stringify({ ok: true, alreadyAccepted: true, childId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // 30-day expiry
  const invitedAt = new Date(invite.invited_at)
  if (Date.now() - invitedAt.getTime() > 30 * 24 * 60 * 60 * 1000)
    return err(410, 'This invite has expired. Ask the account owner to send a new one.')

  // ── 2. Create pre-confirmed user ───────────────────────────────────────────
  // email_confirm: true → no confirmation email sent, account is immediately active.
  // The invite link is the email proof — a second confirmation is redundant.
  const { data: userResult, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createErr) {
    const msg = createErr.message?.toLowerCase() ?? ''
    if (msg.includes('already registered') || msg.includes('already been registered') ||
        msg.includes('already exists') || msg.includes('duplicate')) {
      return err(409, 'already_registered')
    }
    return err(500, createErr.message || 'Account creation failed. Please try again.')
  }

  const userId = userResult.user.id

  // ── 3. Accept invite ───────────────────────────────────────────────────────
  const { error: acceptErr } = await sb
    .from('family_members')
    .update({
      status: 'active',
      member_user_id: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('child_id', childId)
    .eq('invited_email', email)

  if (acceptErr) {
    // User was created but invite accept failed (race condition / DB hiccup).
    // Return a flag so the client can retry via scout-family-accept after sign-in.
    return new Response(JSON.stringify({ ok: true, childId, acceptFailed: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // ── 4. Fire-and-forget: welcome digest + owner notification ───────────────
  const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

  // 4a. Welcome digest for the new family member
  // childId passed explicitly so scout-signup-delivery doesn't filter by user_id
  // (family members don't own the child row — child.user_id belongs to the primary)
  fetch(`${FUNCTIONS_URL}/scout-signup-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ userId, childId }),
  }).catch(() => { /* non-fatal */ })

  // 4b. Notify the primary account owner that someone joined
  // Fetch child name + owner email, then send the family_joined email
  ;(async () => {
    try {
      const RESEND_KEY  = Deno.env.get('RESEND_API_KEY')
      const FROM_EMAIL  = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
      const FROM_NAME   = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
      const SITE_URL    = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'
      if (!RESEND_KEY) return

      // Get child name
      const { data: childRow } = await sb.from('children').select('name, user_id').eq('id', childId).maybeSingle()
      if (!childRow) return
      const childName   = childRow.name || 'your child'
      const ownerUserId = childRow.user_id

      // Get owner email
      const ownerRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${ownerUserId}`, {
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY },
      })
      if (!ownerRes.ok) return
      const ownerData  = await ownerRes.json()
      const ownerEmail = ownerData.email as string
      if (!ownerEmail) return

      const familyUrl  = `${SITE_URL}/scout-dashboard/family.html`
      const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;color:#1C1B2E">
          <div style="text-align:center;margin-bottom:28px">
            <svg width="36" height="40" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 15 L7 1 L13 15" stroke="#6E4ED6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h2 style="color:#6E4ED6;margin:0 0 12px;font-size:22px">${email} joined ${childName}'s Family Circle 🎉</h2>
          <p style="font-size:16px;line-height:1.6;color:#3D3B52;margin:0 0 20px">
            <strong>${email}</strong> just accepted your invitation and can now see ${childName}'s Scout dashboard.
            They'll get the same monthly milestone updates you do.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${familyUrl}" style="background:#6E4ED6;color:white;padding:14px 28px;border-radius:100px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block">
              View Family Circle →
            </a>
          </div>
          <p style="font-size:13px;color:#8A879A;line-height:1.5;margin:0">
            You can manage your Family Circle at any time from your Scout dashboard settings.
          </p>
        </div>
      `

      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:     `${FROM_NAME} <${FROM_EMAIL}>`,
          to:       [ownerEmail],
          reply_to: ['support@getfamilyforce.com'],
          subject:  `${email} joined ${childName}'s Family Circle 🎉`,
          html,
          tags: [{ name: 'email_type', value: 'family_joined' }],
        }),
      })
    } catch (e) {
      console.error('[scout-family-join] owner notify error:', e)
    }
  })()

  return new Response(JSON.stringify({ ok: true, childId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
