// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Family Circle Invite Edge Function
// Sends an invitation email to a partner/co-parent.
//
// POST body: { inviteeEmail, childId, childName, inviterName }
// Auth: Bearer session token (inviter must be primary child owner)
//
// Flow:
//   1. Auth & permission check
//   2. Create pending family_members record
//   3. Send invitation email via Resend
//   4. Return { ok: true }
//
// Deploy: supabase functions deploy scout-family-invite
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
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

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authErr } = await sb.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authErr || !user) return err(401, 'Invalid session')

    const { inviteeEmail, childId, childName, inviterName } = await req.json()
    if (!inviteeEmail || !childId) return err(400, 'Missing inviteeEmail or childId')

    // 1. Verify inviter is the primary owner of this child
    const { data: child } = await sb.from('children').select('user_id').eq('id', childId).single()
    if (!child || child.user_id !== user.id) return err(403, 'Permission denied')

    // 2. Check if already a member or pending
    const { data: existing } = await sb.from('family_members')
      .select('id')
      .eq('child_id', childId)
      .eq('invited_email', inviteeEmail.toLowerCase().trim())
      .maybeSingle()

    if (existing) return err(409, 'This person has already been invited or is a member.')

    // 3. Create pending record
    await sb.from('family_members').insert({
      child_id:      childId,
      invited_email: inviteeEmail.toLowerCase().trim(),
      status:        'pending',
      invited_at:    new Date().toISOString(),
    })

    // 4. Send email
    const siteUrl  = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const inviteUrl = `${siteUrl}/sign-in.html?invite_child=${childId}&invite_email=${encodeURIComponent(inviteeEmail)}`
    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; padding: 20px;">
        <h2 style="color: #6E4ED6;">You're invited to join ${childName}'s Family Circle</h2>
        <p>${inviterName} has invited you to access ${childName}'s Scout dashboard on FamilyForce.</p>
        <p>As a member, you'll be able to see developmental milestones, track progress, and add notes alongside the rest of the family.</p>
        <div style="margin: 32px 0;">
          <a href="${inviteUrl}" style="background: #6E4ED6; color: white; padding: 14px 24px; border-radius: 100px; text-decoration: none; font-weight: bold;">Accept Invitation →</a>
        </div>
        <p style="color: #8A879A; font-size: 13px;">If you don't have a FamilyForce account yet, you'll be asked to create one after clicking the link.</p>
      </div>
    `

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:    `${fromName} <${fromEmail}>`,
        to:      [inviteeEmail],
        subject: `Invite: Join ${childName}'s Family Circle on Scout`,
        html:    emailHtml,
        tags:    [{ name: 'email_type', value: 'family_invite' }],
      }),
    })

    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' } 
    })

  } catch (e) {
    return err(500, e instanceof Error ? e.message : 'Internal error')
  }
})
