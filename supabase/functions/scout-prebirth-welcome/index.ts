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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.3'

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


// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F5FF', surface: '#FFFFFF', border: '#E5E2EC',
  text: '#1D1D1F', textMid: '#5C5960', textDim: '#8A879A',
  terra: '#6E4ED6', terraTint: '#F0EBFF', indigoDeep: '#1E1248',
  amber: '#B45309', amberBg: '#FFFBEB', amberBorder: '#FDE68A',
}

// ─── Email HTML (v2) ──────────────────────────────────────────────────────────
function buildWelcomeEmail(opts: {
  childName:    string
  parentName?:  string
  dueDate:      Date
  daysLeft:     number
  windows:      Array<{ title: string; why_it_matters: string; what_to_do?: string; urgency: string }>
  dashboardUrl: string
  siteUrl:      string
  userId:       string
}): string {
  const { childName, parentName, dueDate, daysLeft, windows, dashboardUrl, siteUrl, userId } = opts

  const dueFmt  = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'

  const windowCards = windows.map(w => {
    const sentences = w.why_it_matters.replace(/([.!?])\s+/g, '$1|||').split('|||')
    const excerpt   = sentences.slice(0, 2).join(' ').trim()
    const move      = w.what_to_do ? w.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim() : ''
    return `
    <tr><td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px">
        <tr><td style="padding:20px 22px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:8px"><p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:${C.text};margin:0;line-height:1.3">${w.title}</p></td></tr>
            <tr><td style="padding-bottom:14px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7">${excerpt}</p></td></tr>
            ${move ? `<tr><td><table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px"><tr><td style="padding:12px 16px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">${move}</p></td></tr></table></td></tr>` : ''}
          </table>
        </td></tr>
      </table>
    </td></tr>`
  }).join('')

  const noWindowNote = windows.length === 0
    ? `<tr><td style="padding-bottom:24px"><p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.75">Your prep windows open as the due date gets closer. We'll check in again as ${childName}'s arrival approaches.</p></td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>Scout — ${childName} arrives in ${daysLeft} days</title>
  <style>
    body{margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif}
    @media only screen and (max-width:480px){.email-body{padding:24px 18px!important}.hero-pad{padding:24px 20px 28px!important}}
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">
  ${childName} arrives in ${daysLeft} days. Here are your prep windows and what happens when the baby arrives.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
</div>

<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

<!-- HEADER -->
<tr><td class="hero-pad" style="background:${C.indigoDeep};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">${childName} arrives in ${daysLeft} days.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">Due ${dueFmt} &nbsp;·&nbsp; ${windows.length > 0 ? `${windows.length} prep window${windows.length > 1 ? 's' : ''} open` : 'Prep windows open soon'}</p>
</td></tr>

<!-- BODY -->
<tr><td class="email-body" style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<!-- Greeting -->
<tr><td style="padding-bottom:24px;border-bottom:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 14px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 10px;line-height:1.75">Welcome to Scout. ${childName} arrives in ${daysLeft} days — which means there are a few things worth doing now, before you're too tired to think straight.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">I got a lot of this wrong with my first son because nobody told me what actually mattered in advance. Here's the short list.</p>
</td></tr>
<tr><td style="padding-bottom:24px"></td></tr>

${windows.length > 0 ? `<tr><td style="padding-bottom:10px"><p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${C.textDim};margin:0">Do before ${dueFmt}</p></td></tr>` : ''}
${noWindowNote}
${windowCards}

<!-- What happens after birth -->
<tr><td style="padding-bottom:32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:14px">
    <tr><td style="padding:22px">
      <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 14px">When ${childName} arrives</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:10px 0;border-top:1px solid #D4C8F8">
          <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.65"><strong>1.</strong> Come back to Scout and confirm your baby arrived. 196 developmental windows open immediately.</p>
        </td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid #D4C8F8">
          <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.65"><strong>2.</strong> Your first month is free — no card needed. Your first digest email arrives automatically.</p>
        </td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid #D4C8F8">
          <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.65"><strong>3.</strong> Every month after that, on your baby's birthday, a new digest lands in your inbox.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- CTA -->
<tr><td style="padding-bottom:32px;text-align:center">
  <a href="${dashboardUrl}" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 32px;border-radius:100px;text-decoration:none">View your prep checklist →</a>
</td></tr>

<!-- Signature -->
<tr><td style="border-top:1px solid ${C.border};padding-top:28px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 3px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0 0 16px">Dad of two · Founder, FamilyForce</p>
  <table cellpadding="0" cellspacing="0" style="border-left:3px solid ${C.border}">
    <tr><td style="padding:6px 0 6px 14px">
      <p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${C.textMid};margin:0;line-height:1.7;font-style:italic">"I got it wrong with my first son. Got it right with my second — because I finally knew what to watch for. That's what Scout is."</p>
    </td></tr>
  </table>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 6px">FamilyForce · getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0">
    You're receiving this because you signed up for Scout.
    &nbsp;<a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a>
  </p>
</td></tr>

</table></td></tr></table>
</body></html>`
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
  const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
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

  // 6. Fetch parent display name
  const { data: profileData } = await sb.from('profiles').select('name').eq('id', user.id).maybeSingle()
  const parentName = profileData?.name?.trim() || undefined

  // 7. Build + send email
  const daysStr = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`
  const subject = `${child.name} arrives ${daysStr} — your Scout prep list`

  const html = buildWelcomeEmail({
    childName:    child.name,
    parentName,
    dueDate:      due,
    daysLeft,
    windows:      (windows ?? []) as Array<{ title: string; why_it_matters: string; what_to_do?: string; urgency: string }>,
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
      resendBody.reply_to = ['support@getfamilyforce.com']

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

  // Also log to prebirth_email_log so scout-prebirth-nudge can detect same-day sends
  // (guards against double-send when user registers on their due date)
  await sb.from('prebirth_email_log').insert({
    user_id:    user.id,
    child_id:   childId,
    email_type: 'welcome',
  }).then(() => {})  // non-critical; ignore conflict

  console.log(`[scout-prebirth-welcome] Sent welcome for ${child.name} (user ${user.id}, ${daysLeft} days to due)`)

  return new Response(JSON.stringify({ ok: true, messageId: resendData.id }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
