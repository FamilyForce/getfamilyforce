// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Pre-birth Nudge Emails (Emails 2, 3, 4)
//
// Runs daily at 08:00 UTC via pg_cron.
// Scans all expecting children and sends the right email
// based on proximity to due date.
//
// Email 2 — prep_6wk:    T-42 days  → "6 weeks away, here's your list"
// Email 3 — due_date:    T=0        → "Is [name] here yet?"
// Email 4 — followup_7d: T+7 days   → "Still waiting? You're not alone"
//
// Dedup: prebirth_email_log (unique index on child_id + email_type)
// Safe to run multiple times — ON CONFLICT DO NOTHING.
//
// Deploy:   supabase functions deploy scout-prebirth-nudge
// Schedule: daily 08:00 UTC — add to scout-cron.sql
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

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F7F5FF', surface: '#FFFFFF', border: '#E5E2EC',
  text: '#1D1D1F', textMid: '#5C5960', textDim: '#8A879A',
  terra: '#6E4ED6', terraTint: '#F0EBFF', indigoDeep: '#1E1248',
  green: '#2D9B6F', greenTint: '#E6FAF8',
}

// ─── Email builders ──────────────────────────────────────────────────────────

function buildPrep6wkEmail(opts: {
  childName: string; parentName?: string; daysLeft: number
  dueFmt: string; dashboardUrl: string; siteUrl: string; userId: string
}): { subject: string; html: string } {
  const { childName, parentName, daysLeft, dueFmt, dashboardUrl, siteUrl, userId } = opts
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'
  const subject  = `${childName} arrives in ${daysLeft} days — three things to do now`

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>body{margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Six weeks out. Here's what to do before everything gets hectic.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

<!-- HEADER -->
<tr><td style="background:${C.indigoDeep};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 20px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,serif;font-size:30px;color:#fff;margin:0 0 10px;line-height:1.2">${childName} arrives in ${daysLeft} days.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">Due ${dueFmt} &nbsp;·&nbsp; Six weeks to go</p>
</td></tr>

<!-- BODY -->
<tr><td style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<tr><td style="padding-bottom:24px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 12px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">Six weeks sounds like a lot of time. It isn't. Between now and the birth, you'll have fewer clear-headed hours than you think. Here are three things worth doing this week.</p>
</td></tr>

<!-- Action 1: Hospital bag -->
<tr><td style="padding-bottom:16px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="font-family:Georgia,serif;font-size:17px;color:${C.text};margin:0 0 8px">Pack the hospital bag</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 12px;line-height:1.65">A packed bag at 37 weeks means one less thing to think about when labour starts. Don't leave it later — early arrivals happen.</p>
    <table cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
    <tr><td style="padding:12px 16px">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">This week: pack your bag and install the car seat. View the full checklist in your Scout dashboard.</p>
    </td></tr></table>
  </td></tr></table>
</td></tr>

<!-- Action 2: Pediatrician -->
<tr><td style="padding-bottom:16px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="font-family:Georgia,serif;font-size:17px;color:${C.text};margin:0 0 8px">Choose your pediatrician</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 12px;line-height:1.65">The first well-child visit happens 3–5 days after birth. You'll be exhausted and leaking. That's not the time to be researching doctors.</p>
    <table cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
    <tr><td style="padding:12px 16px">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">Call 2–3 practices this week. Book a prenatal meet-and-greet (most offer them, often free).</p>
    </td></tr></table>
  </td></tr></table>
</td></tr>

<!-- Action 3: Safe sleep -->
<tr><td style="padding-bottom:28px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.surface};border:1px solid ${C.border};border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="font-family:Georgia,serif;font-size:17px;color:${C.text};margin:0 0 8px">Set up safe sleep now</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.textMid};margin:0 0 12px;line-height:1.65">Set this up before the baby arrives — not at 3am on night two when you're not thinking straight. ABCs: Alone, Back, Crib.</p>
    <table cellpadding="0" cellspacing="0" style="background:${C.terraTint};border-radius:10px">
    <tr><td style="padding:12px 16px">
      <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:${C.terra};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6">Firm crib, fitted sheet, sleep sack. No blankets, bumpers, or positioners. Done.</p>
    </td></tr></table>
  </td></tr></table>
</td></tr>

<!-- CTA -->
<tr><td style="padding-bottom:32px;text-align:center">
  <a href="${dashboardUrl}" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;padding:13px 32px;border-radius:100px;text-decoration:none">View your prep checklist →</a>
</td></tr>

<!-- Sig -->
<tr><td style="border-top:1px solid ${C.border};padding-top:24px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 2px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0">Dad of two · Founder, FamilyForce</p>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 4px">FamilyForce · getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0">You're receiving this because you signed up for Scout. <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a></p>
</td></tr>

</table></td></tr></table>
</body></html>`

  return { subject, html }
}

function buildDueDateEmail(opts: {
  childName: string; parentName?: string; dashboardUrl: string; siteUrl: string; userId: string
}): { subject: string; html: string } {
  const { childName, parentName, dashboardUrl, siteUrl, userId } = opts
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'
  const subject  = `Is ${childName} here yet? 👀`

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>body{margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Update your baby's birthday to start your Scout digests.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

<!-- HEADER -->
<tr><td style="background:${C.terra};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 20px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,serif;font-size:30px;color:#fff;margin:0 0 10px;line-height:1.2">Today is ${childName}'s due date. 🎉</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.65);margin:0">Babies arrive on their own schedule — but when they do, we're ready.</p>
</td></tr>

<!-- BODY -->
<tr><td style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<tr><td style="padding-bottom:28px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 12px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 12px;line-height:1.75">Today is ${childName}'s estimated due date. If they've arrived — congratulations. Take a breath, then tell us they're here.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">If not — no stress. Babies rarely read their own due dates. We'll be here whenever they show up.</p>
</td></tr>

<!-- CTA — big and clear -->
<tr><td style="padding-bottom:12px;text-align:center">
  <a href="${dashboardUrl}?arrived=1" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:16px 36px;border-radius:100px;text-decoration:none">Baby is here — start my Scout digests →</a>
</td></tr>
<tr><td style="padding-bottom:32px;text-align:center">
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0">Not yet? No action needed — we'll follow up in a week.</p>
</td></tr>

<!-- What happens next -->
<tr><td style="padding-bottom:32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${C.greenTint};border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:${C.green};text-transform:uppercase;letter-spacing:.1em;margin:0 0 14px">What happens when you confirm</p>
    <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0;border-top:1px solid rgba(45,155,111,.2)">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6"><strong>1.</strong> 196 developmental windows open for ${childName}'s exact age.</p>
    </td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid rgba(45,155,111,.2)">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6"><strong>2.</strong> First month is free — no card needed.</p>
    </td></tr>
    <tr><td style="padding:8px 0;border-top:1px solid rgba(45,155,111,.2)">
      <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0;line-height:1.6"><strong>3.</strong> Your first digest arrives on ${childName}'s monthly birthday.</p>
    </td></tr>
    </table>
  </td></tr></table>
</td></tr>

<!-- Sig -->
<tr><td style="border-top:1px solid ${C.border};padding-top:24px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 2px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0">Dad of two · Founder, FamilyForce</p>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 4px">FamilyForce · getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0">You're receiving this because you signed up for Scout. <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`

  return { subject, html }
}

function buildFollowup7dEmail(opts: {
  childName: string; parentName?: string; daysOverdue: number
  dashboardUrl: string; siteUrl: string; userId: string
}): { subject: string; html: string } {
  const { childName, parentName, daysOverdue, dashboardUrl, siteUrl, userId } = opts
  const greeting = parentName ? `Hi ${parentName},` : 'Hi there,'
  const subject  = `Still waiting on ${childName}? You're not alone 😅`

  const html = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title>
<style>body{margin:0;padding:0;background:${C.bg};font-family:Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">Update ${childName}'s birthday whenever you're ready — Scout is waiting.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid ${C.border}">

<!-- HEADER -->
<tr><td style="background:${C.indigoDeep};padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 20px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,serif;font-size:28px;color:#fff;margin:0 0 10px;line-height:1.2">${daysOverdue} days past the due date.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0">Late babies are just building suspense.</p>
</td></tr>

<!-- BODY -->
<tr><td style="background:${C.surface};padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">

<tr><td style="padding-bottom:28px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.text};margin:0 0 12px;font-weight:600">${greeting}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 12px;line-height:1.75">About 80% of babies arrive between 38 and 42 weeks. If ${childName} is still making their entrance, that's completely normal.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0 0 12px;line-height:1.75">If they've already arrived and you just haven't had a spare moment — no judgment, that's exactly what newborn week looks like. Update whenever you're ready.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:${C.textMid};margin:0;line-height:1.75">Either way, tap below to confirm ${childName}'s birthday and start your Scout digests.</p>
</td></tr>

<!-- CTA -->
<tr><td style="padding-bottom:32px;text-align:center">
  <a href="${dashboardUrl}?arrived=1" style="display:inline-block;background:${C.terra};color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:16px 36px;border-radius:100px;text-decoration:none">${childName} has arrived — update now →</a>
</td></tr>

<!-- Sig -->
<tr><td style="border-top:1px solid ${C.border};padding-top:24px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:${C.text};margin:0 0 2px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:0">Dad of two · Founder, FamilyForce</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:${C.textDim};margin:6px 0 0;font-style:italic">P.S. This is the last automated nudge — we won't keep emailing. Update whenever the time is right. 🙏</p>
</td></tr>

</table></td></tr>

<!-- FOOTER -->
<tr><td style="background:${C.bg};padding:20px 36px;border-top:1px solid ${C.border}">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0 0 4px">FamilyForce · getfamilyforce.com</p>
  <p style="font-family:Arial,sans-serif;font-size:12px;color:${C.textDim};margin:0">You're receiving this because you signed up for Scout. <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:${C.terra};text-decoration:none">Unsubscribe</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`

  return { subject, html }
}

// ─── Send via Resend ──────────────────────────────────────────────────────────
async function sendEmail(opts: {
  resendKey: string; from: string; to: string; bcc?: string
  subject: string; html: string
  tags?: Array<{ name: string; value: string }>
}): Promise<string | null> {
  const body: Record<string, unknown> = {
    from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html,
  }
  if (opts.bcc)  body.bcc  = [opts.bcc]
  if (opts.tags) body.tags = opts.tags

  const res  = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${opts.resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) { console.error('[prebirth-nudge] Resend error:', JSON.stringify(data)); return null }
  return data.id as string
}

// ─── Log to prebirth_email_log (dedup) ───────────────────────────────────────
async function logEmail(sb: ReturnType<typeof createClient>, opts: {
  userId: string; childId: string; emailType: string
}): Promise<boolean> {
  const { error } = await sb.from('prebirth_email_log').insert({
    user_id: opts.userId, child_id: opts.childId, email_type: opts.emailType,
  })
  // If unique constraint fires (already sent), error.code = '23505'
  if (error && error.code !== '23505') {
    console.error('[prebirth-nudge] log error:', error.message)
  }
  return !error || error.code === '23505'
}

async function alreadySent(sb: ReturnType<typeof createClient>, childId: string, emailType: string): Promise<boolean> {
  const { data } = await sb.from('prebirth_email_log')
    .select('id').eq('child_id', childId).eq('email_type', emailType).maybeSingle()
  return !!data
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const resendKey    = Deno.env.get('RESEND_API_KEY')!
  const fromEmail    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const fromName     = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
  const bccEmail     = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
  const siteUrl      = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
  const dashUrl      = `${siteUrl}/scout-dashboard`
  const from         = `${fromName} <${fromEmail}>`

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

  const today    = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // Load all expecting children with their parent email + name
  const { data: children, error: childErr } = await sb
    .from('children')
    .select(`
      id, name, due_date, user_id,
      profiles:user_id ( name )
    `)
    .eq('is_expecting', true)
    .not('due_date', 'is', null)

  if (childErr || !children) {
    console.error('[prebirth-nudge] Failed to load expecting children:', childErr?.message)
    return new Response(JSON.stringify({ ok: false, error: childErr?.message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  // Load auth user emails in bulk
  const userIds = [...new Set(children.map(c => c.user_id))]
  const { data: authUsers } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const emailMap: Record<string, string> = {}
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (u.email) emailMap[u.id] = u.email
    }
  }

  const results = { prep_6wk: 0, due_date: 0, followup_7d: 0, skipped: 0, errors: 0 }

  for (const child of children) {
    const due      = new Date(child.due_date + 'T00:00:00Z')
    const diffMs   = due.getTime() - today.getTime()
    const diffDays = Math.round(diffMs / 86400000)  // positive = days until due, negative = days overdue

    const userEmail  = emailMap[child.user_id]
    if (!userEmail) { results.skipped++; continue }

    // @ts-ignore — join type
    const parentName = child.profiles?.name?.trim() || undefined
    const dueFmt     = due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

    // ── Email 2: T-42 days window (6 weeks out) ───────────────────
    // Window is 35–42 days out so late registrations (e.g. signed up at T-30)
    // still get the prep email on their first morning after registration.
    if (diffDays >= 35 && diffDays <= 42) {
      if (await alreadySent(sb, child.id, 'prep_6wk')) { results.skipped++; continue }
      const { subject, html } = buildPrep6wkEmail({
        childName: child.name, parentName, daysLeft: diffDays,
        dueFmt, dashboardUrl: dashUrl, siteUrl, userId: child.user_id,
      })
      const msgId = await sendEmail({
        resendKey, from, to: userEmail, bcc: bccEmail || undefined,
        subject, html,
        tags: [
          { name: 'user_id', value: child.user_id },
          { name: 'child_id', value: child.id },
          { name: 'email_type', value: 'prebirth_prep_6wk' },
        ],
      })
      if (msgId) {
        await logEmail(sb, { userId: child.user_id, childId: child.id, emailType: 'prep_6wk' })
        await sb.from('scout_events').insert({
          user_id: child.user_id, child_id: child.id,
          event_type: 'prebirth_prep_6wk_sent',
          properties: { days_until_due: diffDays, resend_id: msgId },
        })
        results.prep_6wk++
      } else { results.errors++ }
    }

    // ── Email 3: Due date (T=0) ────────────────────────────────────
    // Guard: skip if welcome (Email 1) was sent within the last 24h to avoid
    // double-sending on the same day a user registers on their due date.
    else if (diffDays === 0) {
      if (await alreadySent(sb, child.id, 'due_date')) { results.skipped++; continue }

      // Check if welcome was sent today (within ~24h)
      const { data: recentWelcome } = await sb
        .from('prebirth_email_log')
        .select('sent_at')
        .eq('child_id', child.id)
        .eq('email_type', 'welcome')
        .maybeSingle()
      if (recentWelcome?.sent_at) {
        const welcomeAge = Date.now() - new Date(recentWelcome.sent_at).getTime()
        if (welcomeAge < 86400000) { // < 24h
          console.log(`[prebirth-nudge] Skipping due_date email for ${child.id} — welcome sent < 24h ago`)
          results.skipped++
          continue
        }
      }
      const { subject, html } = buildDueDateEmail({
        childName: child.name, parentName,
        dashboardUrl: dashUrl, siteUrl, userId: child.user_id,
      })
      const msgId = await sendEmail({
        resendKey, from, to: userEmail, bcc: bccEmail || undefined,
        subject, html,
        tags: [
          { name: 'user_id', value: child.user_id },
          { name: 'child_id', value: child.id },
          { name: 'email_type', value: 'prebirth_due_date' },
        ],
      })
      if (msgId) {
        await logEmail(sb, { userId: child.user_id, childId: child.id, emailType: 'due_date' })
        await sb.from('scout_events').insert({
          user_id: child.user_id, child_id: child.id,
          event_type: 'prebirth_due_date_sent',
          properties: { resend_id: msgId },
        })
        results.due_date++
      } else { results.errors++ }
    }

    // ── Email 4: T+7 follow-up ─────────────────────────────────────
    else if (diffDays === -7) {
      if (await alreadySent(sb, child.id, 'followup_7d')) { results.skipped++; continue }
      const { subject, html } = buildFollowup7dEmail({
        childName: child.name, parentName, daysOverdue: 7,
        dashboardUrl: dashUrl, siteUrl, userId: child.user_id,
      })
      const msgId = await sendEmail({
        resendKey, from, to: userEmail, bcc: bccEmail || undefined,
        subject, html,
        tags: [
          { name: 'user_id', value: child.user_id },
          { name: 'child_id', value: child.id },
          { name: 'email_type', value: 'prebirth_followup_7d' },
        ],
      })
      if (msgId) {
        await logEmail(sb, { userId: child.user_id, childId: child.id, emailType: 'followup_7d' })
        await sb.from('scout_events').insert({
          user_id: child.user_id, child_id: child.id,
          event_type: 'prebirth_followup_7d_sent',
          properties: { days_overdue: 7, resend_id: msgId },
        })
        results.followup_7d++
      } else { results.errors++ }
    }
  }

  console.log(`[scout-prebirth-nudge] Done. prep_6wk=${results.prep_6wk} due_date=${results.due_date} followup_7d=${results.followup_7d} skipped=${results.skipped} errors=${results.errors}`)

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
