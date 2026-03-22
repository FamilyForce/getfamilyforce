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

import { createClient }    from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import {
  generateScoutIcs,
  nextMonthlyBirthday,
  ageInWeeks,
  ageInMonths,
  type IcsWindow,
} from '../_shared/ics-generator.ts'
import {
  buildDigestEmail,
  buildDigestSubject,
  type DigestWindow,
} from '../_shared/email-digest.ts'

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
  prep_tip:          string | null
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
      .select('id, name, dob, due_date, is_expecting, gender')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)

    if (childErr) throw new Error(`Could not load child: ${childErr.message}`)
    if (!children || children.length === 0) throw new Error(`No child found for user ${userId}`)

    const child       = children[0]
    // Pre-birth children have dob=null and due_date set instead.
    // new Date(null) = epoch (1970) which produces absurd age values.
    const childDob    = child.is_expecting || !child.dob
      ? new Date((child.due_date ?? child.dob) + 'T00:00:00Z')
      : new Date(child.dob)
    const now         = new Date()
    const weeks       = ageInWeeks(childDob, now)
    const months      = ageInMonths(childDob, now)
    // birth_signup = true when called from scout-confirm-arrival (post-birth first digest).
    // Uses digest_type 'birth_signup' so it never collides with the pre-birth 'signup' log entry.
    const birthSignup  = record.birth_signup  === true
    const digestType   = birthSignup ? 'birth_signup' : 'signup'

    // 4. Check deduplication — per user+child+type+month
    step = 'dedup-check'
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
    const { data: existing } = await sb
      .from('scout_digest_log')
      .select('id')
      .eq('user_id', userId)
      .eq('child_id', child.id)
      .eq('digest_type', digestType)
      .eq('digest_month', currentMonth)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[scout-signup-delivery] Skipping duplicate ${digestType} digest for child ${child.id}`)
      return new Response(JSON.stringify({ ok: true, skipped: 'duplicate' }), {
        status: 200, headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // 5. Query open windows for child's age
    // Expecting parents have negative weeks (weeks before birth).
    // Prenatal windows use negative open/close_age_weeks.
    step = 'query-windows'
    const isExpecting = weeks < 0

    const { data: windows, error: winErr } = await sb
      .from('milestone_windows')
      .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
      .eq('active', true)
      .eq('window_type', 'milestone')
      .eq('prenatal', isExpecting)    // ← only prenatal windows for expecting; only post-birth for born
      .lte('open_age_weeks', weeks)
      .gte('close_age_weeks', weeks)
      .order('priority', { ascending: true })

    if (winErr) throw new Error(`Could not query windows: ${winErr.message}`)
    if (!windows || windows.length === 0) {
      console.warn(`[scout-signup-delivery] No windows found for age ${weeks}w (expecting=${isExpecting}) — sending digest anyway`)
    }

    // 5b. Query "Get Ready" windows (opening in next 8 weeks)
    const { data: readyData } = await sb
      .from('milestone_windows')
      .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
      .eq('active', true)
      .eq('window_type', 'milestone')
      .eq('prenatal', isExpecting)
      .gt('open_age_weeks', weeks)
      .lte('open_age_weeks', weeks + 8)
      .order('open_age_weeks', { ascending: true })
      .order('priority', { ascending: true })
      .limit(3)

    const getReadyWindows = (readyData ?? []) as MilestoneWindow[]

    const allWindows   = (windows ?? []) as MilestoneWindow[]
    const aboveFold    = selectAboveFold(allWindows, weeks)

    // For expecting parents: fetch total post-birth window count for the tease card
    let postBirthWindowCount = 192  // default (matches current DB count)
    if (isExpecting) {
      const { count } = await sb
        .from('milestone_windows')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .eq('prenatal', false)
      if (count !== null) postBirthWindowCount = count
    }

    // 6. Build subject line
    step = 'build-email'
    const siteUrl     = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const dashUrl     = `${siteUrl}/scout-dashboard`
    // For expecting parents (negative months), use a pre-birth subject line
    const subjectLine = isExpecting
      ? `${child.name}'s arrival is coming — here's how to prepare`
      : buildDigestSubject(child.name, months, aboveFold, weeks)
    const closingCount = aboveFold.filter(w => w.close_age_weeks - weeks <= 4).length

    // 6b. Determine the next birthday for the ICS + email footer.
    // Always use the actual next monthly birthday — no skipping.
    const nextBirthday = nextMonthlyBirthday(childDob, now)
    const nextMonths   = ageInMonths(childDob, nextBirthday)

    // 6c. Fetch parent display name
    const { data: profileData } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
    const parentName = profileData?.name?.trim() || undefined

    // 7. Build email HTML
    // For expecting parents, pass ageMonths=0 (treats as newborn-level content) +
    // isExpecting flag so the template can customise the intro copy.
    const emailHtml = buildDigestEmail({
      childName:      child.name,
      parentName,
      childGender:    child.gender,
      ageMonths:      isExpecting ? 0 : months,
      isExpecting,
      postBirthWindowCount,
      aboveFold:      aboveFold as DigestWindow[],
      getReadyWindows: getReadyWindows as DigestWindow[],
      allWindowCount: allWindows.length,
      closingCount,
      nextEventDate:  nextBirthday,
      dashboardUrl:   dashUrl,
      siteUrl,
      userId,
      digestType,
    })

    // 8. Generate .ics attachment
    step = 'build-ics'

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
    const resendKey   = Deno.env.get('RESEND_API_KEY')
    const fromEmail   = Deno.env.get('RESEND_FROM_EMAIL')  ?? 'scout@getfamilyforce.com'
    const fromName    = Deno.env.get('RESEND_FROM_NAME')   ?? 'FamilyForce'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')   ?? ''

    if (!resendKey) throw new Error('RESEND_API_KEY not configured')

    // btoa() only handles Latin1 — use TextEncoder for Unicode-safe Base64
    const icsBytes  = new TextEncoder().encode(icsString)
    const icsBase64 = btoa(icsBytes.reduce((s, b) => s + String.fromCharCode(b), ''))
    const resendBody: Record<string, unknown> = {
      from:    `${fromName} <${fromEmail}>`,
      to:      [user.email],
      subject: subjectLine,
      html:    emailHtml,
      tags:    [
        { name: 'user_id',     value: userId },
        { name: 'child_id',    value: child.id },
        { name: 'digest_type', value: digestType },
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
      digest_type:       digestType,
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

    // 12. Send to active family circle members (non-fatal)
    step = 'family-send'
    try {
      const { data: familyMembers } = await sb
        .from('family_members')
        .select('member_user_id, unsubscribe_token')
        .eq('owner_user_id', userId)
        .eq('child_id', child.id)
        .eq('status', 'active')

      for (const member of (familyMembers ?? [])) {
        try {
          const memberId = member.member_user_id
          if (!memberId) continue

          // Per-member dedup
          const { data: memberExisting } = await sb
            .from('scout_digest_log')
            .select('id')
            .eq('user_id', memberId)
            .eq('child_id', child.id)
            .eq('digest_type', digestType)
            .eq('digest_month', currentMonth)
            .limit(1)
            .maybeSingle()
          if (memberExisting) continue

          const { data: { user: memberUser } } = await sb.auth.admin.getUserById(memberId)
          if (!memberUser?.email) continue

          // Build per-member HTML with their own unsubscribe URL + family footer
          const unsubUrl   = `${supabaseUrl}/functions/v1/scout-unsubscribe?t=${member.unsubscribe_token}`
          const memberHtml = buildDigestEmail({
            childName:      child.name,
            parentName,
            childGender:    child.gender,
            ageMonths:      isExpecting ? 0 : months,
            isExpecting,
            postBirthWindowCount,
            aboveFold:      aboveFold as DigestWindow[],
            getReadyWindows: getReadyWindows as DigestWindow[],
            allWindowCount: allWindows.length,
            closingCount,
            nextEventDate:  nextBirthday,
            dashboardUrl:   dashUrl,
            siteUrl,
            userId:         memberId,
            digestType,
            unsubscribeUrl: unsubUrl,
            recipientType:  'family_member',
          })

          const memberResendBody: Record<string, unknown> = {
            from:    `${fromName} <${fromEmail}>`,
            to:      [memberUser.email],
            subject: subjectLine,
            html:    memberHtml,
            headers: {
              'List-Unsubscribe':      `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            tags: [
              { name: 'user_id',        value: memberId },
              { name: 'child_id',       value: child.id },
              { name: 'digest_type',    value: digestType },
              { name: 'month',          value: currentMonth },
              { name: 'recipient_type', value: 'family_member' },
            ],
            attachments: resendBody.attachments,
          }

          const memberRes = await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
            body:    JSON.stringify(memberResendBody),
          })
          if (!memberRes.ok) {
            console.warn(`[scout-signup-delivery] Failed to send to family member ${memberId}`)
            continue
          }
          const memberData = await memberRes.json()

          await sb.from('scout_digest_log').insert({
            user_id:           memberId,
            child_id:          child.id,
            digest_month:      currentMonth,
            child_age_months:  months,
            digest_type:       digestType,
            windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
            email_subject:     subjectLine,
            resend_message_id: memberData.id,
          })

          console.log(`[scout-signup-delivery] Sent to family member ${memberId} for child ${child.id}`)
        } catch (memberErr) {
          console.warn(`[scout-signup-delivery] Error sending to family member ${member.member_user_id}:`, memberErr)
        }
      }
    } catch (familyErr) {
      console.warn(`[scout-signup-delivery] Error loading family members for user ${userId}:`, familyErr)
    }

    // 13. Log job success
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
