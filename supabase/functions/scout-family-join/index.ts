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

  return new Response(JSON.stringify({ ok: true, childId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
