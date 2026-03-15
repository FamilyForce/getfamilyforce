// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Trial End Edge Function
// The single most important email Scout sends.
// Fires daily at 08:00 UTC via Supabase pg_cron.
//
// Runs two jobs per invocation:
//   Job A: trial-end email (trial_end <= today, status = trialing)
//   Job B: re-engagement email (trial_end <= 30 days ago, never re-engaged)
//
// Deploy: supabase functions deploy scout-trial-end
// Schedule: see supabase/cron/scout-cron.sql
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          STRIPE_SECRET_KEY, STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Pricing — set via Supabase secrets; these are fallback defaults
const PRICE_ANNUAL_DISPLAY  = '$79.99/year'
const PRICE_ANNUAL_MONTHLY  = '$6.67/month'
const PRICE_MONTHLY_DISPLAY = '$9.99/month'

// ─── Pronoun helper ───────────────────────────────────────────────────────────
function pronoun(gender: string | null, form: 'subject' | 'object' | 'possess'): string {
  const map = {
    subject: { boy: 'he',  girl: 'she',  other: 'they' },
    object:  { boy: 'him', girl: 'her',  other: 'them' },
    possess: { boy: 'his', girl: 'her',  other: 'their' },
  }
  const g = (gender ?? 'other') as 'boy' | 'girl' | 'other'
  return map[form][g] ?? map[form].other
}

// ─── Age helpers ──────────────────────────────────────────────────────────────
function ageInWeeks(dob: Date, asOf: Date): number {
  return Math.floor((asOf.getTime() - dob.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

function ageInMonths(dob: Date, asOf: Date): number {
  const months =
    (asOf.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - dob.getUTCMonth())
  return asOf.getUTCDate() >= dob.getUTCDate() ? months : months - 1
}

// ─── Weeks since signup ───────────────────────────────────────────────────────
function weeksSince(fromDate: Date, toDate: Date): number {
  return Math.round((toDate.getTime() - fromDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
}

// ─── Build trial-end email HTML ───────────────────────────────────────────────
function buildTrialEndEmail(opts: {
  childName:      string
  childGender:    string | null
  ageMonths:      number
  weeksSinceJoin: number
  digestCount:    number
  calendarCount:  number
  topWindows:     Array<{ title: string; why_it_matters: string; urgency: string }>
  annualCta:      string
  monthlyCta:     string
  siteUrl:        string
  userId:         string
}): string {
  const { childName, childGender, ageMonths, weeksSinceJoin, digestCount,
          calendarCount, topWindows, annualCta, monthlyCta, siteUrl, userId } = opts

  // Edge case: vary "you signed up X weeks ago" copy
  let joinCopy: string
  if (weeksSinceJoin <= 1) {
    joinCopy = 'You signed up last week.'
  } else if (weeksSinceJoin <= 4) {
    joinCopy = `You signed up ${weeksSinceJoin} weeks ago.`
  } else {
    joinCopy = `You signed up ${weeksSinceJoin} weeks ago.`
  }

  const digestWord   = digestCount   === 1 ? 'email'  : 'emails'
  const calendarWord = calendarCount === 1 ? 'event'  : 'events'

  // Annual birthday variant (month 12)
  const isFirstBirthday = ageMonths === 12
  const openingLine = isFirstBirthday
    ? `<strong>${childName} is one year old today.</strong><br>That is worth saying twice.`
    : `<strong>${childName} is ${ageMonths} months old today.</strong>`

  const windowRows = topWindows.map(w => {
    const urgencyColor = w.urgency === 'clinical' ? '#DC2626' : w.urgency === 'screening' ? '#2563EB' : '#6B7280'
    const urgencyLabel = w.urgency === 'clinical' ? 'Clinical' : w.urgency === 'screening' ? 'Screening' : 'Advisory'
    return `
    <tr>
      <td style="background:#FFFFFF;border:1px solid #E5E2EC;border-radius:12px;padding:18px;margin-bottom:10px;display:block;">
        <span style="display:inline-block;background:${urgencyColor}1A;color:${urgencyColor};font-size:11px;font-weight:600;padding:2px 8px;border-radius:100px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">${urgencyLabel}</span>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:600;color:#1D1D1F;margin:0 0 6px">${w.title}</p>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">${w.why_it_matters.split('. ').slice(0, 2).join('. ')}.</p>
      </td>
    </tr>
    <tr><td style="height:10px"></td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${childName} turns ${ageMonths} months — Scout trial ending</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:'Outfit',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-size:13px;color:#8A879A;margin:0 0 8px">FamilyForce Scout</p>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#1D1D1F;margin:0 0 8px;line-height:1.3">
          ${openingLine}
        </h1>
      </td>
    </tr>
  </table>

  <!-- Trial summary -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td style="background:#F0EBFF;border-radius:12px;padding:18px">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#3D2A9E;margin:0;line-height:1.7">
          ${joinCopy} Since then, you have received <strong>${digestCount} digest ${digestWord}</strong> and <strong>${calendarCount} calendar ${calendarWord}</strong> with ${childName}'s closing developmental windows.<br><br>
          <strong>Your free trial ends today.</strong>
        </p>
      </td>
    </tr>
  </table>

  <!-- Open windows -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
    <tr>
      <td>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;color:#8A879A;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px">What is open right now for ${childName}</p>
      </td>
    </tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
    ${windowRows}
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">
          These windows do not wait. Neither does the next digest.
        </p>
      </td>
    </tr>
  </table>

  <!-- Subscribe to keep going -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td>
        <h2 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#1D1D1F;margin:0 0 12px">Subscribe to keep going.</h2>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.7">
          Scout delivers one email and one calendar event every month, on ${childName}'s birthday. No app to check. No notifications to manage. Just the right information at the right time.
        </p>
      </td>
    </tr>
  </table>

  <!-- Pricing options -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <!-- Annual (recommended) -->
    <tr>
      <td style="background:#6E4ED6;border-radius:12px;padding:20px;margin-bottom:12px;display:block">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="display:inline-block;background:rgba(255,255,255,.2);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px">Best value</span>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:18px;font-weight:700;color:#fff;margin:0 0 2px">Annual — ${PRICE_ANNUAL_DISPLAY}</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.75);margin:0 0 16px">That is ${PRICE_ANNUAL_MONTHLY}. Covers ${childName} from today through age 3. One payment.</p>
              <a href="${annualCta}" style="display:block;text-align:center;background:#fff;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px;border-radius:100px;text-decoration:none">
                Continue with Annual →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height:10px"></td></tr>
    <!-- Monthly -->
    <tr>
      <td style="background:#FFFFFF;border:1.5px solid #E5E2EC;border-radius:12px;padding:20px;display:block">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:600;color:#1D1D1F;margin:0 0 2px">Monthly — ${PRICE_MONTHLY_DISPLAY}</p>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 14px">Cancel any time.</p>
        <a href="${monthlyCta}" style="display:block;text-align:center;background:#F0EBFF;color:#5B3CC4;font-family:'Outfit',Arial,sans-serif;font-size:14px;font-weight:600;padding:12px;border-radius:100px;text-decoration:none">
          Monthly instead →
        </a>
      </td>
    </tr>
  </table>

  <!-- What you get -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td style="border-left:3px solid #6E4ED6;padding:14px 16px;background:#F9F8FD">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:600;color:#3D2A9E;margin:0 0 10px">Every month on ${childName}'s birthday:</p>
        <ul style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;padding:0 0 0 18px;line-height:1.8">
          <li>One digest with the 3 to 5 windows most relevant to ${childName}'s age</li>
          <li>One calendar event on the next birthday with a 7 day alarm</li>
          <li>Missed window guidance if a window has already closed</li>
          <li>Links to free FamilyForce Playbooks on sleep, feeding, potty training, and more</li>
        </ul>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:12px 0 0">No credit card was required to start. No trial was auto-renewed. This is a one-time decision.</p>
      </td>
    </tr>
  </table>

  <!-- If you decide not to continue -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.7">
          If you decide not to continue, you will not receive another Scout email. The calendar events already in your calendar will stay there. The windows already delivered are yours to keep.<br><br>
          No hard feelings. This stuff matters whether you subscribe or not.
        </p>
      </td>
    </tr>
  </table>

  <!-- Signature -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-size:15px;color:#1D1D1F;margin:0 0 2px">Jack</p>
        <p style="font-size:13px;color:#8A879A;margin:0">FamilyForce</p>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-top:1px solid #E5E2EC;padding-top:20px">
        <p style="font-size:12px;color:#8A879A;margin:0 0 4px">
          FamilyForce · <a href="${siteUrl}" style="color:#8A879A">${siteUrl.replace('https://', '')}</a>
        </p>
        <p style="font-size:12px;color:#8A879A;margin:0">
          <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A">Stop receiving Scout emails</a>
        </p>
      </td>
    </tr>
  </table>

</div>
</body>
</html>`
}

// ─── Build re-engagement email HTML ───────────────────────────────────────────
function buildReengagementEmail(opts: {
  childName:    string
  ageMonths:    number
  topWindow:    { title: string; why_it_matters: string; what_to_do: string } | null
  subscribeCta: string
  siteUrl:      string
  userId:       string
}): string {
  const { childName, ageMonths, topWindow, subscribeCta, siteUrl, userId } = opts
  const nextMonth = ageMonths + 1

  const windowBlock = topWindow
    ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td style="background:#FFFFFF;border:1px solid #E5E2EC;border-radius:12px;padding:20px">
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:600;color:#1D1D1F;margin:0 0 8px">${topWindow.title}</p>
          <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.7">${topWindow.why_it_matters}</p>
          ${topWindow.what_to_do ? `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:12px 0 0;line-height:1.7">${topWindow.what_to_do.split('\n').slice(0, 3).join(' ')}</p>` : ''}
        </td>
      </tr>
    </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${childName} is ${nextMonth} months</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:'Outfit',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
    <tr>
      <td>
        <p style="font-size:13px;color:#8A879A;margin:0 0 8px">FamilyForce Scout</p>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1D1D1F;margin:0 0 16px;line-height:1.3">
          ${childName} turned ${ageMonths} months a month ago.
        </h1>
        <p style="font-size:14px;color:#5C5960;margin:0;line-height:1.7">
          You did not subscribe to Scout after the trial.<br>That is completely fine.
        </p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
    <tr>
      <td>
        <p style="font-size:14px;color:#5C5960;margin:0;line-height:1.7">
          One thing I want to flag before ${nextMonth} months passes:
        </p>
      </td>
    </tr>
  </table>

  ${windowBlock}

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px">
    <tr>
      <td>
        <p style="font-size:14px;color:#5C5960;margin:0 0 20px;line-height:1.7">
          If you want the rest of ${childName}'s windows for this month, they are waiting.
        </p>
        <a href="${subscribeCta}" style="display:block;text-align:center;background:#6E4ED6;color:#fff;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:14px;border-radius:100px;text-decoration:none;max-width:320px;margin:0 auto">
          See ${childName}'s ${nextMonth}-month windows →
        </a>
        <p style="font-size:12px;color:#8A879A;text-align:center;margin:12px 0 0">
          ${PRICE_MONTHLY_DISPLAY} or ${PRICE_ANNUAL_DISPLAY}. Annual is better value. Monthly is more flexible.
        </p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
    <tr>
      <td>
        <p style="font-size:14px;color:#5C5960;margin:0;line-height:1.7">
          If now is not the right time, no more emails from Scout.
        </p>
        <p style="font-size:15px;color:#1D1D1F;margin:16px 0 2px">Jack</p>
        <p style="font-size:13px;color:#8A879A;margin:0">FamilyForce</p>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-top:1px solid #E5E2EC;padding-top:16px">
        <p style="font-size:12px;color:#8A879A;margin:0">
          <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A">Stop all Scout emails</a>
        </p>
      </td>
    </tr>
  </table>

</div>
</body>
</html>`
}

// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-trial-end: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Send one email via Resend ────────────────────────────────────────────────
async function sendEmail(opts: {
  to:          string
  subject:     string
  html:        string
  tags:        Array<{ name: string; value: string }>
  resendKey:   string
  fromEmail:   string
  fromName:    string
  bccEmail:    string
}): Promise<string> {
  const body: Record<string, unknown> = {
    from:    `${opts.fromName} <${opts.fromEmail}>`,
    to:      [opts.to],
    subject: opts.subject,
    html:    opts.html,
    tags:    opts.tags,
  }
  if (opts.bccEmail) body.bcc = [opts.bccEmail]

  const res  = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${opts.resendKey}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`)
  return data.id as string
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const jobStart  = Date.now()
  const now       = new Date()
  const todayUTC  = now.toISOString().split('T')[0]  // YYYY-MM-DD

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey  = Deno.env.get('RESEND_API_KEY')!
  const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL')  ?? 'scout@getfamilyforce.com'
  const fromName   = Deno.env.get('RESEND_FROM_NAME')   ?? 'Jack at FamilyForce'
  const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')   ?? ''
  const siteUrl    = Deno.env.get('SITE_URL')            ?? 'https://getfamilyforce.com'

  const results = { trialEnd: { sent: 0, skipped: 0, errors: 0 }, reengagement: { sent: 0, skipped: 0, errors: 0 } }

  // ═══════════════════════════════════════════════════════════════
  // JOB A — Trial-end emails
  // ═══════════════════════════════════════════════════════════════
  console.log(`[scout-trial-end] Job A starting — ${todayUTC}`)

  const { data: trialingSubs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, trial_end, created_at')
    .eq('status', 'trialing')
    .lte('trial_end', now.toISOString())

  if (subErr) {
    await telegramAlert(`Job A failed — could not query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  console.log(`[scout-trial-end] Job A — ${trialingSubs?.length ?? 0} trialing subscriptions found`)

  for (const sub of (trialingSubs ?? [])) {
    try {
      const userId = sub.user_id

      // 1. Dedup check — never send trial-end email twice
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('user_id', userId)
        .eq('digest_type', 'trial_end')
        .limit(1)
        .maybeSingle()

      if (existing) {
        results.trialEnd.skipped++
        continue
      }

      // 2. Load user email
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.trialEnd.skipped++; continue }

      // 3. Load child
      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.trialEnd.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')
      const weeks    = ageInWeeks(childDob, now)
      const months   = ageInMonths(childDob, now)

      // Skip if child is past 36 months (nothing to sell)
      if (months > 36) { results.trialEnd.skipped++; continue }

      // 4. Count digests sent during trial
      const { count: digestCount } = await sb
        .from('scout_digest_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('digest_type', ['signup', 'monthly'])

      // 5. Count calendar events (approximation: one per digest)
      const calendarCount = digestCount ?? 1

      // 6. Query top 3 open windows
      const { data: windows } = await sb
        .from('milestone_windows')
        .select('title, why_it_matters, urgency')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })
        .limit(3)

      // 7. Weeks since signup
      const signupDate = new Date(sub.created_at)
      const wks        = weeksSince(signupDate, now)

      // 8. Build CTA URLs — go to sign-in.html with plan pre-selected
      const annualCta  = `${siteUrl}/sign-in.html?intent=subscribe&plan=annual`
      const monthlyCta = `${siteUrl}/sign-in.html?intent=subscribe&plan=monthly`

      // 9. Build email
      const subject  = months === 12
        ? `${child.name} turns 1 today. Two things.`
        : `${child.name} turns ${months} months today. Here is what comes next.`
      const preview  = 'Your trial ends today. The next digest is ready when you are.'
      const html     = buildTrialEndEmail({
        childName:      child.name,
        childGender:    child.gender,
        ageMonths:      months,
        weeksSinceJoin: wks,
        digestCount:    digestCount ?? 1,
        calendarCount,
        topWindows:     windows ?? [],
        annualCta,
        monthlyCta,
        siteUrl,
        userId,
      })

      // 10. Send
      const messageId = await sendEmail({
        to:        user.email,
        subject:   `${subject} — ${preview}`,
        html,
        tags:      [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'trial_end' },
          { name: 'month',       value: currentMonth },
        ],
        resendKey,
        fromEmail,
        fromName,
        bccEmail,
      })

      // 11. Log to scout_digest_log
      await sb.from('scout_digest_log').insert({
        user_id:           userId,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  months,
        digest_type:       'trial_end',
        windows_included:  (windows ?? []).map(w => ({ title: w.title, urgency: w.urgency })),
        email_subject:     subject,
        resend_message_id: messageId,
      })

      // 12. Log to scout_events
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'trial_end_email_sent',
        properties: { months, weeks, messageId, digest_count: digestCount, calendar_count: calendarCount },
      })

      results.trialEnd.sent++
      console.log(`[scout-trial-end] Trial-end email sent for user ${userId} (${months}mo)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-trial-end] Error for user ${sub.user_id}:`, msg)
      await telegramAlert(`Trial-end email failed for user ${sub.user_id}: ${msg}`)
      results.trialEnd.errors++
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // JOB B — Re-engagement emails (30 days past trial_end, non-converters)
  // ═══════════════════════════════════════════════════════════════
  console.log(`[scout-trial-end] Job B starting — re-engagement`)

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: lapsedSubs } = await sb
    .from('scout_subscriptions')
    .select('user_id, trial_end')
    .eq('status', 'trialing')
    .lte('trial_end', thirtyDaysAgo)

  for (const sub of (lapsedSubs ?? [])) {
    try {
      const userId = sub.user_id

      // Check: never re-engaged before
      const { data: priorReengagement } = await sb
        .from('scout_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'reengagement_sent')
        .limit(1)
        .maybeSingle()

      if (priorReengagement) { results.reengagement.skipped++; continue }

      // Load user + child
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.reengagement.skipped++; continue }

      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.reengagement.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')
      const months   = ageInMonths(childDob, now)
      const weeks    = ageInWeeks(childDob, now)

      // Suppress if child is past 36 months
      if (months > 36) { results.reengagement.skipped++; continue }

      // Get single most urgent open window
      const { data: windows } = await sb
        .from('milestone_windows')
        .select('title, why_it_matters, what_to_do, urgency')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })
        .limit(1)

      const topWindow = windows?.[0] ?? null

      const subscribeCta = `${siteUrl}/sign-in.html?intent=subscribe&plan=annual`
      const html         = buildReengagementEmail({
        childName: child.name,
        ageMonths: months,
        topWindow,
        subscribeCta,
        siteUrl,
        userId,
      })

      const subject = `${child.name} is ${months + 1} months. One window you might want to know about.`

      const messageId = await sendEmail({
        to:      user.email,
        subject,
        html,
        tags:    [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'reengagement' },
          { name: 'month',       value: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}` },
        ],
        resendKey,
        fromEmail,
        fromName,
        bccEmail,
      })

      // Log — one-time guard
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'reengagement_sent',
        properties: { months, weeks, messageId, top_window: topWindow?.title ?? null },
      })

      results.reengagement.sent++
      console.log(`[scout-trial-end] Re-engagement sent for user ${userId} (${months}mo)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-trial-end] Re-engagement error for ${sub.user_id}:`, msg)
      results.reengagement.errors++
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Summary log
  // ═══════════════════════════════════════════════════════════════
  const duration = Date.now() - jobStart
  console.log(`[scout-trial-end] Done in ${duration}ms`, results)

  if (results.trialEnd.errors > 0 || results.reengagement.errors > 0) {
    await telegramAlert(
      `Job complete with errors. Trial-end: ${results.trialEnd.sent} sent, ${results.trialEnd.errors} errors. Re-engagement: ${results.reengagement.sent} sent, ${results.reengagement.errors} errors.`
    )
  }

  return new Response(JSON.stringify({ ok: true, results, duration_ms: duration }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
