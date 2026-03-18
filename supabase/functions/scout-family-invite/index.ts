// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Family Circle Invite Edge Function
// POST body: { inviteeEmail, childId, childName, inviterName }
// Auth: Bearer session token (inviter must be primary child owner)
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Validate session via Supabase auth REST API
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Invalid or expired session')
    const authData = await authRes.json()
    const userId = authData.id as string

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { inviteeEmail, childId, childName, inviterName } = await req.json()
    if (!inviteeEmail || !childId) return err(400, 'Missing inviteeEmail or childId')

    const email = inviteeEmail.toLowerCase().trim()

    // 1. Verify inviter owns this child
    const { data: child } = await sb.from('children').select('user_id').eq('id', childId).single()
    if (!child || child.user_id !== userId) return err(403, 'Permission denied')

    // 2. Check for duplicate invite (same email + child)
    const { data: existing } = await sb.from('family_members')
      .select('id, status')
      .eq('child_id', childId)
      .eq('invited_email', email)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'active') return err(409, 'This person is already a member of your Family Circle.')
      return err(409, 'An invite has already been sent to this address. Ask them to check their email.')
    }

    // 3. Create pending invite record
    const { error: insertErr } = await sb.from('family_members').insert({
      owner_user_id: userId,
      child_id:      childId,
      invited_email: email,
      status:        'pending',
      invited_at:    new Date().toISOString(),
    })
    if (insertErr) return err(500, `Could not create invite: ${insertErr.message}`)

    // 4. Send invitation email via Resend
    const siteUrl   = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const inviteUrl = `${siteUrl}/sign-in.html?invite_child=${childId}&invite_email=${encodeURIComponent(email)}`
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'
    const name      = (inviterName || '').trim() || 'Someone'

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
        <h2 style="color: #6E4ED6;">You've been invited to ${childName}'s Family Circle</h2>
        <p>${name} has invited you to view ${childName}'s Scout dashboard on FamilyForce.</p>
        <p>You'll be able to see developmental windows, track progress together, and add notes — all under one shared view.</p>
        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background: #6E4ED6; color: white; padding: 14px 24px; border-radius: 100px; text-decoration: none; font-weight: bold;">Accept Invitation →</a>
        </div>
        <p style="color: #8A879A; font-size: 13px;">Don't have a FamilyForce account? You'll be guided to create one after clicking the link above.</p>
      </div>
    `

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [email],
        subject: `${name} invited you to ${childName}'s Family Circle on Scout`,
        html:    emailHtml,
        tags:    [{ name: 'email_type', value: 'family_invite' }],
      }),
    })

    if (!emailRes.ok) {
      const emailErr = await emailRes.text()
      console.error('[scout-family-invite] Resend error:', emailErr)
      // Don't fail — invite record is created, email is best-effort
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    console.error('[scout-family-invite] Error:', e)
    return err(500, e instanceof Error ? e.message : 'Internal error')
  }
})
