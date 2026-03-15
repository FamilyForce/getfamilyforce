// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Signup Delivery Edge Function
// Fires on new scout_subscriptions row (status = 'trialing').
// Sends: first digest email + .ics calendar event for next birthday.
//
// Deploy: supabase functions deploy scout-signup-delivery
// Trigger: Supabase DB webhook on scout_subscriptions INSERT
//   → filter: status = 'trialing'
//   → HTTP POST to this function
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2'
import {
  generateScoutIcs,
  nextMonthlyBirthday,
  ageInWeeks,
  ageInMonths,
  type IcsWindow,
} from '../_shared/ics-generator.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ─── Window selection ────────────────────────────────────────────────────────
// Selects the top N windows for above-the-fold email content.
// Priority score (1 = highest) drives selection, with urgency as tiebreaker.
// Decision #5 (urgency weighting) is still open — using priority-only for now.
const ABOVE_FOLD_COUNT = 5

interface MilestoneWindow {
  id:                uuid
  slug:              string
  title:             string
  category:          string
  urgency:           'advisory' | 'screening' | 'clinical'
  open_age_weeks:    number
  peak_age_weeks:    number | null
  close_age_weeks:   number
  priority:          number
  why_it_matters:    string
  what_to_do:        string
  what_not_to_worry: string | null
  missed_window:     string | null
  playbook_link:     string | null
}

type uuid = string

function selectAboveFold(windows: MilestoneWindow[], ageWeeks: number): MilestoneWindow[] {
  // Sort: closing soon first (within 4 weeks), then by priority ASC
  const urgencyWeight = { clinical: 0, screening: 1, advisory: 2 }

  return [...windows].sort((a, b) => {
    const aClosing = a.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    const bClosing = b.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    if (aClosing !== bClosing) return aClosing - bClosing
    if (a.priority !== b.priority) return a.priority - b.priority
    return urgencyWeight[a.urgency] - urgencyWeight[b.urgency]
  }).slice(0, ABOVE_FOLD_COUNT)
}

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

// ─── Email HTML builder ───────────────────────────────────────────────────────
// Functional template — will be replaced by the final 4A design.
// Uses inline styles for email client compatibility.
function buildDigestEmail(opts: {
  childName:       string
  childGender:     string | null
  ageMonths:       number
  aboveFold:       MilestoneWindow[]
  allWindowCount:  number
  nextEventDate:   Date
  dashboardUrl:    string
  siteUrl:         string
  subjectLine:     string
}): string {
  const { childName, childGender, ageMonths, aboveFold, allWindowCount,
          nextEventDate, dashboardUrl, siteUrl } = opts

  const He = pronoun(childGender, 'subject')
  He.charAt(0).toUpperCase() + He.slice(1)  // capitalised
  const His = pronoun(childGender, 'possess')
  His.charAt(0).toUpperCase() + His.slice(1)

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })

  const urgencyColors = {
    clinical:  '#DC2626',
    screening: '#2563EB',
    advisory:  '#6B7280',
  }
  const urgencyLabels = {
    clinical:  'Clinical',
    screening: 'Screening',
    advisory:  'Advisory',
  }

  const windowRows = aboveFold.map(w => {
    const isClosing = w.close_age_weeks - (ageMonths * 4.33) <= 4
    const badge     = `
      <span style="
        display: inline-block;
        background: ${urgencyColors[w.urgency]}1A;
        color: ${urgencyColors[w.urgency]};
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 100px;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 6px;
      ">${urgencyLabels[w.urgency]}${isClosing ? ' · Closing soon' : ''}</span>`

    const playbook = w.playbook_link
      ? `<p style="margin: 8px 0 0; font-size: 13px; color: #6E4ED6;">
           Free guide: <a href="https://${w.playbook_link}" style="color: #6E4ED6;">${w.playbook_link.split('/').pop()?.replace(/-/g, ' ')}</a> →
         </p>`
      : ''

    return `
    <tr>
      <td style="
        background: #FFFFFF;
        border: 1px solid #E5E2EC;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 12px;
        display: block;
      ">
        ${badge}
        <h3 style="
          font-family: 'Outfit', Arial, sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1D1D1F;
          margin: 0 0 8px;
        ">${w.title}</h3>
        <p style="
          font-family: 'Outfit', Arial, sans-serif;
          font-size: 14px;
          color: #5C5960;
          margin: 0;
          line-height: 1.6;
        ">${w.why_it_matters.split('. ').slice(0, 2).join('. ')}.</p>
        ${playbook}
        <p style="margin: 12px 0 0;">
          <a href="${dashboardUrl}" style="
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 13px;
            color: #6E4ED6;
            font-weight: 500;
          ">Read what to do →</a>
        </p>
      </td>
    </tr>
    <tr><td style="height: 12px;"></td></tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${childName} turns ${ageMonths} months</title>
</head>
<body style="margin: 0; padding: 0; background: #FAFAFA; font-family: 'Outfit', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td>
          <p style="font-size: 13px; color: #8A879A; margin: 0 0 8px;">FamilyForce Scout</p>
          <h1 style="
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 28px;
            font-weight: 400;
            color: #1D1D1F;
            margin: 0 0 8px;
            line-height: 1.3;
          ">${childName} turns ${ageMonths} months today.</h1>
          <p style="font-size: 15px; color: #5C5960; margin: 0;">
            ${allWindowCount} developmental windows are open right now.
            Here are the ${aboveFold.length} you need to know about this month.
          </p>
        </td>
      </tr>
    </table>

    <!-- Windows -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      ${windowRows}
    </table>

    <!-- All windows CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="text-align: center; padding: 20px; background: #F0EBFF; border-radius: 12px;">
          <p style="
            font-size: 14px;
            color: #5C5960;
            margin: 0 0 12px;
          ">
            ${allWindowCount - aboveFold.length} more windows are open this month.
          </p>
          <a href="${dashboardUrl}" style="
            display: inline-block;
            background: #6E4ED6;
            color: #FFFFFF;
            font-family: 'Outfit', Arial, sans-serif;
            font-size: 15px;
            font-weight: 600;
            padding: 12px 28px;
            border-radius: 100px;
            text-decoration: none;
          ">See all ${childName}'s windows →</a>
        </td>
      </tr>
    </table>

    <!-- Calendar note -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td style="
          border-left: 3px solid #6E4ED6;
          padding: 12px 16px;
          background: #F9F8FD;
        ">
          <p style="font-size: 14px; color: #5C5960; margin: 0; line-height: 1.6;">
            📅 A calendar event for ${nextMonthName} is attached to this email.
            Accept it and a 7-day alarm will fire before ${childName}'s next windows close.
          </p>
        </td>
      </tr>
    </table>

    <!-- Signature -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 32px;">
      <tr>
        <td>
          <p style="font-size: 15px; color: #1D1D1F; margin: 0 0 4px;">Jack</p>
          <p style="font-size: 13px; color: #8A879A; margin: 0;">FamilyForce</p>
        </td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-top: 1px solid #E5E2EC; padding-top: 20px;">
          <p style="font-size: 12px; color: #8A879A; margin: 0 0 4px;">
            FamilyForce · <a href="${siteUrl}" style="color: #8A879A;">${siteUrl.replace('https://', '')}</a>
          </p>
          <p style="font-size: 12px; color: #8A879A; margin: 0;">
            You're receiving this because you signed up for Scout.
            <a href="${siteUrl}/scout-dashboard/settings" style="color: #8A879A;">Manage preferences</a>
            · <a href="${siteUrl}/unsubscribe?user={{USER_ID}}" style="color: #8A879A;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>

  </div>
</body>
</html>`
}

// ─── Subject line builder ─────────────────────────────────────────────────────
function buildSubjectLine(
  childName:    string,
  ageMonths:    number,
  aboveFold:    MilestoneWindow[],
  ageWeeks:     number
): string {
  // Find the most urgent closing window for the subject line
  const closing = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)

  if (closing.length > 0) {
    const urgent = closing[0]
    const weeksLeft = urgent.close_age_weeks - ageWeeks
    return `${childName} turns ${ageMonths} months — ${weeksLeft} weeks left on ${urgent.title.toLowerCase()}`
  }

  return `${childName} turns ${ageMonths} months today. Here is what's open.`
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
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-signup-delivery: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }

  const jobStart = Date.now()
  let   userId   = 'unknown'
  let   step     = 'init'

  try {
    // 1. Parse the DB webhook payload
    step = 'parse'
    const payload = await req.json()
    // Supabase DB webhook sends: { type: 'INSERT', table: 'scout_subscriptions', record: {...} }
    const record = payload.record as Record<string, unknown>
    if (!record) throw new Error('No record in payload')

    userId = record.user_id as string
    if (!userId) throw new Error('No user_id in record')

    // Only process trialing subscriptions
    if (record.status !== 'trialing') {
      return new Response(JSON.stringify({ ok: true, skipped: 'not trialing' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // 2. Load user email
    step = 'load-user'
    const { data: { user }, error: userErr } = await sb.auth.admin.getUserById(userId)
    if (userErr || !user?.email) throw new Error(`Could not load user: ${userErr?.message}`)

    // 3. Load child record
    step = 'load-child'
    const { data: children, error: childErr } = await sb
      .from('children')
      .select('id, name, dob, gender')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (childErr) throw new Error(`Could not load child: ${childErr.message}`)
    if (!children || children.length === 0) throw new Error(`No child found for user ${userId}`)

    const child     = children[0]
    const childDob  = new Date(child.dob)
    const now       = new Date()
    const weeks     = ageInWeeks(childDob, now)
    const months    = ageInMonths(childDob, now)

    // 4. Check deduplication — never send two signup digests to the same child
    step = 'dedup-check'
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const { data: existing } = await sb
      .from('scout_digest_log')
      .select('id')
      .eq('child_id', child.id)
      .eq('digest_type', 'signup')
      .eq('digest_month', currentMonth)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[scout-signup-delivery] Skipping duplicate signup digest for child ${child.id}`)
      return new Response(JSON.stringify({ ok: true, skipped: 'duplicate' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // 5. Query open windows for child's age
    step = 'query-windows'
    const { data: windows, error: winErr } = await sb
      .from('milestone_windows')
      .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link')
      .eq('active', true)
      .lte('open_age_weeks', weeks)
      .gte('close_age_weeks', weeks)
      .order('priority', { ascending: true })

    if (winErr) throw new Error(`Could not query windows: ${winErr.message}`)
    if (!windows || windows.length === 0) {
      console.warn(`[scout-signup-delivery] No windows found for age ${weeks}w — sending empty digest`)
    }

    const allWindows   = (windows ?? []) as MilestoneWindow[]
    const aboveFold    = selectAboveFold(allWindows, weeks)

    // 6. Build subject line
    step = 'build-email'
    const siteUrl     = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const dashUrl     = `${siteUrl}/scout-dashboard`
    const subjectLine = buildSubjectLine(child.name, months, aboveFold, weeks)

    // 7. Build email HTML
    const emailHtml = buildDigestEmail({
      childName:      child.name,
      childGender:    child.gender,
      ageMonths:      months,
      aboveFold,
      allWindowCount: allWindows.length,
      nextEventDate:  nextMonthlyBirthday(childDob, now),
      dashboardUrl:   dashUrl,
      siteUrl,
      subjectLine,
    })

    // 8. Generate .ics attachment
    step = 'build-ics'
    const nextBirthday = nextMonthlyBirthday(childDob, now)
    const nextMonths   = ageInMonths(childDob, nextBirthday)

    const icsWindows: IcsWindow[] = allWindows.map(w => ({
      slug:              w.slug,
      title:             w.title,
      urgency:           w.urgency,
      close_age_weeks:   w.close_age_weeks,
      current_age_weeks: weeks,
    }))

    const icsString = generateScoutIcs({
      childId:      child.id,
      childName:    child.name,
      ageMonths:    nextMonths,
      eventDate:    nextBirthday,
      windows:      icsWindows,
      dashboardUrl: dashUrl,
      siteUrl,
    })

    // 9. Send via Resend
    step = 'send-email'
    const resendKey  = Deno.env.get('RESEND_API_KEY')
    const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL')  ?? 'scout@getfamilyforce.com'
    const fromName   = Deno.env.get('RESEND_FROM_NAME')   ?? 'Jack at FamilyForce'
    const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')   ?? ''

    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    const icsBase64  = btoa(icsString)
    const resendBody: Record<string, unknown> = {
      from:    `${fromName} <${fromEmail}>`,
      to:      [user.email],
      subject: subjectLine,
      html:    emailHtml,
      tags:    [
        { name: 'user_id',     value: userId },
        { name: 'child_id',    value: child.id },
        { name: 'digest_type', value: 'signup' },
        { name: 'month',       value: currentMonth },
      ],
      attachments: [{
        filename:    `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-month${months}.ics`,
        content:     icsBase64,
        content_type: 'text/calendar',
      }],
    }

    if (bccEmail) resendBody.bcc = [bccEmail]

    const resendRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(resendBody),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(resendData)}`)
    }

    const resendMessageId = resendData.id as string

    // 10. Log to scout_digest_log
    step = 'log-digest'
    await sb.from('scout_digest_log').insert({
      user_id:           userId,
      child_id:          child.id,
      digest_month:      currentMonth,
      child_age_months:  months,
      digest_type:       'signup',
      windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
      email_subject:     subjectLine,
      resend_message_id: resendMessageId,
    })

    // 11. Log to scout_events
    step = 'log-event'
    await sb.from('scout_events').insert({
      user_id:    userId,
      child_id:   child.id,
      event_type: 'first_digest_sent',
      properties: {
        child_age_months: months,
        child_age_weeks:  weeks,
        windows_count:    allWindows.length,
        above_fold_count: aboveFold.length,
        resend_message_id: resendMessageId,
        duration_ms:      Date.now() - jobStart,
      },
    })

    // 12. Log job success
    await sb.from('scout_events').insert({
      user_id:    userId,
      event_type: 'job_succeeded',
      properties: { job_type: 'scout-signup-delivery', duration_ms: Date.now() - jobStart },
    })

    console.log(`[scout-signup-delivery] Success for user ${userId} (${months}mo, ${weeks}w) in ${Date.now() - jobStart}ms`)

    return new Response(JSON.stringify({ ok: true, resendMessageId }), {
      status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-signup-delivery] Error at step=${step}, user=${userId}:`, msg)

    // Log failure to scout_events
    try {
      const sb = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await sb.from('scout_events').insert({
        user_id:    userId === 'unknown' ? null : userId,
        event_type: 'job_failed',
        properties: {
          job_type:    'scout-signup-delivery',
          step,
          error:       msg,
          duration_ms: Date.now() - jobStart,
        },
      })
    } catch { /* log failure itself failed — move on */ }

    await telegramAlert(`Failed at step=${step} for user=${userId}: ${msg}`)

    return new Response(JSON.stringify({ ok: false, error: msg, step }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    })
  }
})
