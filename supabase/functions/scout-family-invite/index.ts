// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Family Circle Invite Edge Function
// POST body: { inviteeEmail, childId }
// Auth: Bearer session token (inviter must be primary child owner)
//
// Display name: derived server-side from auth (user_metadata.name →
// local part of email → full email). Never trusted from client payload.
// Child name: fetched from DB, never trusted from client payload.
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

/** Derive a friendly display name from auth data.
 *  Priority: user_metadata.full_name → user_metadata.name → local part of email → full email */
function displayName(authData: Record<string, unknown>): string {
  const meta = (authData.user_metadata ?? {}) as Record<string, string>
  const full = (meta.full_name || meta.name || '').trim()
  if (full) return full
  const email = (authData.email as string ?? '').trim()
  // Use the part before @ (strip + aliases like foo+test@gmail.com → foo)
  const local = email.split('@')[0]?.replace(/\+.*$/, '').replace(/[._-]/g, ' ').trim()
  return local || email
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
    const userId    = authData.id    as string
    const userEmail = (authData.email as string ?? '').toLowerCase().trim()
    const inviterDisplay = displayName(authData)

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    const { inviteeEmail, childId } = await req.json()
    if (!inviteeEmail || !childId) return err(400, 'Missing inviteeEmail or childId')

    const email = inviteeEmail.toLowerCase().trim()

    // 0. Prevent self-invite
    if (email === userEmail) return err(400, 'You cannot invite yourself to your own Family Circle.')

    // 1. Verify inviter owns this child + fetch child name from DB
    const { data: child } = await sb.from('children').select('user_id, name').eq('id', childId).single()
    if (!child || child.user_id !== userId) return err(403, 'Permission denied')
    const childName = (child.name || '').trim() || 'your child'

    // 2a. Enforce 5-member limit (counts all pending + active members)
    const { count: memberCount } = await sb.from('family_members')
      .select('id', { count: 'exact', head: true })
      .eq('child_id', childId)
    if ((memberCount ?? 0) >= 5) {
      return err(403, 'Your Family Circle has reached the maximum of 5 members. Remove an existing member to invite someone new.')
    }

    // 2b. Check for duplicate invite (same email + child)
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

    // 4. Generate a Supabase magic link for the invitee via Admin API
    //    This makes the invite email itself the authentication link — one click
    //    in the email → verified session → invite accepted → dashboard.
    //    Falls back to a plain sign-in URL if generation fails.
    const siteUrl     = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const landingUrl  = `${siteUrl}/sign-in.html?invite_child=${childId}&invite_email=${encodeURIComponent(email)}`

    let inviteUrl = landingUrl  // fallback
    try {
      const { data: linkData, error: linkErr } = await sb.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: landingUrl },
      })
      if (!linkErr && linkData?.properties?.action_link) {
        inviteUrl = linkData.properties.action_link
      } else if (linkErr) {
        console.warn('[scout-family-invite] generateLink failed, using fallback URL:', linkErr.message)
      }
    } catch (e) {
      console.warn('[scout-family-invite] generateLink threw, using fallback URL:', e)
    }

    const resendKey = Deno.env.get('RESEND_API_KEY')!
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
    const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You've been invited to ${childName}'s Family Circle</title>
</head>
<body style="margin:0;padding:0;background-color:#F0EDFB;font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="display:none;font-size:1px;color:#F0EDFB;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${inviterDisplay} has invited you to ${childName}'s Family Circle on Scout.&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0EDFB;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 24px rgba(110,78,214,0.10);">

        <!-- Purple header -->
        <tr><td style="background-color:#6E4ED6;padding:28px 40px 24px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="padding-right:10px;vertical-align:middle;">
              <img src="https://www.getfamilyforce.com/assets/ff-logo.png" width="32" height="32" alt="" style="display:block;border:0;">
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">FamilyForce</span>
            </td>
          </tr></table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 32px;">

          <!-- Icon -->
          <div style="width:56px;height:56px;background-color:#F0EDFB;border-radius:16px;margin-bottom:20px;display:inline-block;text-align:center;line-height:56px;font-size:26px;">&#128106;</div>

          <!-- Heading -->
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D0820;letter-spacing:-0.4px;line-height:1.3;">
            You're invited to ${childName}'s Family Circle
          </p>

          <!-- Body text -->
          <p style="margin:0 0 8px;font-size:15px;color:#4A4560;line-height:1.7;">
            <strong style="color:#0D0820;">${inviterDisplay}</strong> has invited you to view ${childName}'s Scout dashboard on FamilyForce.
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#4A4560;line-height:1.7;">
            You'll be able to see developmental windows, track progress together, and add notes — all in one shared view.
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;"><tr>
            <td style="background-color:#6E4ED6;border-radius:100px;">
              <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.1px;">
                Accept Invitation &#8594;
              </a>
            </td>
          </tr></table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
            <tr><td style="border-top:1px solid #EDE9FB;font-size:0;">&nbsp;</td></tr>
          </table>

          <!-- Footer note -->
          <p style="margin:0;font-size:13px;color:#8B85A8;line-height:1.65;">
            This link signs you in automatically — no password needed. It expires in 24 hours.
          </p>

        </td></tr>

        <!-- Card footer -->
        <tr><td style="background-color:#F8F7FF;padding:20px 40px;border-top:1px solid #EDE9FB;">
          <p style="margin:0;font-size:12px;color:#8B85A8;line-height:1.6;">
            You're receiving this because ${inviterDisplay} sent you a Family Circle invite via
            <a href="https://getfamilyforce.com" style="color:#6E4ED6;text-decoration:none;">getfamilyforce.com</a>.
          </p>
        </td></tr>

      </table>
      <p style="margin:20px 0 0;font-size:12px;color:#8B85A8;text-align:center;">
        &#169; 2026 FamilyForce &middot; Research-backed parenting guides
      </p>
    </td></tr>
  </table>
</body>
</html>`

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from:     `${fromName} <${fromEmail}>`,
        to:       [email],
        reply_to: ['support@getfamilyforce.com'],
        subject:  `You've been invited to ${childName}'s Family Circle on Scout`,
        html:     emailHtml,
        tags:     [{ name: 'email_type', value: 'family_invite' }],
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
