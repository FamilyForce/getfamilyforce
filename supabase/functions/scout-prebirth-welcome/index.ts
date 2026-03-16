// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Pre-birth Welcome Email
// Fires immediately when an expecting parent saves their due date.
// Called client-side from scout-dashboard/child.html after a
// successful child INSERT with is_expecting = true.
//
// POST body: { childId: string }
// Auth: Bearer session token
//
// Flow:
//   1. Auth + validate childId belongs to user
//   2. Load child (name, due_date) + open pre-birth windows
//   3. Send welcome email via Resend
//   4. Log to scout_digest_log (digest_type = 'signup') + scout_events
//
// Deploy: supabase functions deploy scout-prebirth-welcome
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ─── Email HTML ───────────────────────────────────────────────────────────────
function buildWelcomeEmail(opts: {
  childName:    string
  dueDate:      Date
  daysLeft:     number
  windows:      Array<{ title: string; why_it_matters: string; urgency: string }>
  dashboardUrl: string
  siteUrl:      string
  userId:       string
}): string {
  const { childName, dueDate, daysLeft, windows, dashboardUrl, siteUrl, userId } = opts

  const dueFmt  = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  const windowItems = windows.map(w => {
    const badgeBg = w.urgency === 'clinical' ? '#FEE2E2' : w.urgency === 'screening' ? '#EFF6FF' : '#F5F3FF'
    const badgeFg = w.urgency === 'clinical' ? '#DC2626' : w.urgency === 'screening' ? '#2563EB' : '#6E4ED6'
    const lbl     = w.urgency === 'clinical' ? 'Clinical' : w.urgency === 'screening' ? 'Screening' : 'Advisory'
    return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px">
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E5E2EC;border-radius:12px;padding:18px">
          <span style="display:inline-block;background:${badgeBg};color:${badgeFg};font-family:'Outfit',Arial,sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">${lbl}</span>
          <h3 style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;color:#1D1D1F;margin:0 0 6px">${w.title}</h3>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6">${w.why_it_matters}</p>
          <a href="${dashboardUrl}" style="display:inline-block;margin-top:10px;font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#6E4ED6;font-weight:600;text-decoration:none">See this in your tracker →</a>
        </td>
      </tr>
    </table>`
  }).join('')

  const noWindowsMsg = windows.length === 0
    ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 16px;line-height:1.6">Your prep windows will open as your due date gets closer. We'll email you on the ${dueDate.getUTCDate()}th of each month with what's ready.</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Welcome to Scout — ${childName} arrives in ${daysLeft} days</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}
  </style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">

  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${childName} arrives in ${daysLeft} days. Here are your preparation windows — and what happens when the baby arrives.&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr>
      <td align="center" style="padding:24px 12px 40px">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <!-- Wordmark -->
          <tr>
            <td style="padding:0 0 16px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;padding:28px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">${todayStr}</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">${childName} arrives in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</h1>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#5C5960;margin:0;line-height:1.6">You're in the right place. Scout tracks developmental windows from birth to 3 years — and before birth, it helps you prepare. Here's what's open right now.</p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          ${windows.length > 0 ? `
          <!-- Prep windows -->
          <tr>
            <td style="background:#F9F8FD;border:1.5px solid #E5E2EC;border-radius:16px;padding:20px 20px 10px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 16px">Your preparation windows</p>
              ${windowItems}
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>` : ''}

          ${noWindowsMsg ? `<tr><td style="background:#F9F8FD;border-radius:12px;padding:18px">${noWindowsMsg}</td></tr><tr><td style="height:12px"></td></tr>` : ''}

          <!-- What happens at birth -->
          <tr>
            <td style="background:#EDE9FF;border-radius:16px;padding:24px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#6E4ED6;letter-spacing:.1em;text-transform:uppercase;margin:0 0 12px">When ${childName} arrives</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:8px 0;border-top:1px solid #D4C8F8">
                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#3D2A9E;margin:0;line-height:1.6"><strong>1.</strong> Open the Scout dashboard and confirm your baby arrived.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-top:1px solid #D4C8F8">
                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#3D2A9E;margin:0;line-height:1.6"><strong>2.</strong> Your first month of Scout is free — no card needed.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-top:1px solid #D4C8F8">
                    <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#3D2A9E;margin:0;line-height:1.6"><strong>3.</strong> At the end of the first month, you choose a plan to keep going.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          <!-- CTA -->
          <tr>
            <td style="background:#F0EBFF;border-radius:16px;padding:24px;text-align:center">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 16px">View your prep checklist and mark windows as you go.</p>
              <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none">Open Scout dashboard →</a>
            </td>
          </tr>
          <tr><td style="height:32px"></td></tr>

          <!-- Signature -->
          <tr>
            <td>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:17px;color:#1D1D1F;margin:0 0 2px">Jack Hartley</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">Dad of two · Founder, FamilyForce</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6;font-style:italic">Got it wrong with First Son. Got it right with Second Son. Make informed parenting decisions.</p>
            </td>
          </tr>
          <tr><td style="height:32px"></td></tr>

          <!-- Footer -->
          <tr>
            <td style="border-top:1px solid #E5E2EC;padding-top:20px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0 0 4px">FamilyForce Scout · <a href="${siteUrl}" style="color:#8A879A;text-decoration:none">${siteUrl.replace('https://', '')}</a></p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">You're receiving this because you signed up for Scout. · <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A;text-decoration:none">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey = Deno.env.get('RESEND_API_KEY')!
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'
  const bccEmail  = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
  const siteUrl   = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
  const dashUrl   = `${siteUrl}/scout-dashboard`

  // 1. Auth
  const authHeader = req.headers.get('Authorization') ?? ''
  const token      = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) return err(401, 'Unauthorized')

  // 2. Parse body
  let body: { childId?: string }
  try { body = await req.json() } catch { return err(400, 'Invalid JSON') }
  const { childId } = body
  if (!childId) return err(400, 'childId required')

  // 3. Load child — verify ownership
  const { data: child, error: childErr } = await sb
    .from('children')
    .select('id, name, due_date, is_expecting, user_id')
    .eq('id', childId)
    .eq('user_id', user.id)
    .single()

  if (childErr || !child) return err(404, 'Child not found')
  if (!child.is_expecting || !child.due_date) return err(400, 'Child is not in expecting mode')

  // 4. Dedup — only send once (check digest_type = 'signup' for this child)
  const { data: existing } = await sb
    .from('scout_digest_log')
    .select('id')
    .eq('child_id', childId)
    .eq('digest_type', 'signup')
    .limit(1)
    .maybeSingle()

  if (existing) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'already_sent' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // 5. Load currently-open pre-birth windows
  const now      = new Date()
  const due      = new Date(child.due_date + 'T00:00:00Z')
  const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000)
  const ageWeeks = Math.floor((now.getTime() - due.getTime()) / (7 * 24 * 3600 * 1000)) // negative

  const { data: windows } = await sb
    .from('milestone_windows')
    .select('id, slug, title, urgency, why_it_matters, open_age_weeks, close_age_weeks, priority')
    .eq('prenatal', true)
    .lte('open_age_weeks', ageWeeks)
    .gte('close_age_weeks', ageWeeks)
    .order('priority', { ascending: true })

  // 6. Build + send email
  const subject = `Welcome to Scout — ${child.name} arrives in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`

  const html = buildWelcomeEmail({
    childName:    child.name,
    dueDate:      due,
    daysLeft,
    windows:      (windows ?? []) as Array<{ title: string; why_it_matters: string; urgency: string }>,
    dashboardUrl: dashUrl,
    siteUrl,
    userId:       user.id,
  })

  const resendBody: Record<string, unknown> = {
    from:    `${fromName} <${fromEmail}>`,
    to:      [user.email!],
    subject,
    html,
    tags: [
      { name: 'user_id',     value: user.id },
      { name: 'child_id',    value: childId },
      { name: 'digest_type', value: 'signup' },
      { name: 'type',        value: 'prebirth_welcome' },
    ],
  }
  if (bccEmail) resendBody.bcc = [bccEmail]

  const resendRes  = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(resendBody),
  })
  const resendData = await resendRes.json()
  if (!resendRes.ok) {
    console.error('[scout-prebirth-welcome] Resend error:', JSON.stringify(resendData))
    return err(500, `Email send failed: ${resendData?.message ?? 'unknown error'}`)
  }

  // 7. Log to scout_digest_log + scout_events
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  await sb.from('scout_digest_log').insert({
    user_id:           user.id,
    child_id:          childId,
    digest_month:      currentMonth,
    child_age_months:  -1,  // sentinel: pre-birth
    digest_type:       'signup',
    windows_included:  (windows ?? []).map(w => ({ id: w.id, slug: w.slug, title: w.title })),
    email_subject:     subject,
    resend_message_id: resendData.id as string,
  })

  await sb.from('scout_events').insert({
    user_id:    user.id,
    child_id:   childId,
    event_type: 'prebirth_welcome_sent',
    properties: {
      days_until_due: daysLeft,
      windows_count:  windows?.length ?? 0,
      resend_id:      resendData.id,
    },
  })

  console.log(`[scout-prebirth-welcome] Sent welcome for ${child.name} (user ${user.id}, ${daysLeft} days to due)`)

  return new Response(JSON.stringify({ ok: true, messageId: resendData.id }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
