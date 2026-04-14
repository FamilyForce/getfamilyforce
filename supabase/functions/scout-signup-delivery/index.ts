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
  buildPreBirthEmail,
  selectAboveFold,
  type DigestWindow,
  type PreBirthEmailOptions,
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

// selectAboveFold imported from _shared/email-digest.ts

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
    // 1. Parse payload — two supported shapes:
    //    a) Supabase DB webhook: { type, table, record: { user_id, status, ... } }
    //    b) Direct call from scout-convert: { userId, childId?, is_conversion?, birth_signup?, additional_child? }
    step = 'parse'
    const payload = await req.json()

    let record: Record<string, unknown>
    let directCall = false

    if (payload.record) {
      // Shape A — DB webhook
      record = payload.record as Record<string, unknown>
    } else if (payload.userId) {
      // Shape B — direct call from scout-convert / scout-confirm-arrival / scout-child-trial-start
      directCall = true
      record = {
        user_id:          payload.userId,
        child_id:         payload.childId ?? null,
        is_conversion:    payload.is_conversion    ?? false,
        birth_signup:     payload.birth_signup     ?? false,
        additional_child: payload.additional_child ?? false,
        status:           'trialing',  // bypass status guard below
      }
    } else {
      throw new Error('No record in payload')
    }

    userId = record.user_id as string
    if (!userId) throw new Error('No user_id in record')

    // Only process trialing subscriptions (DB webhook path only — direct calls always proceed)
    if (!directCall && record.status !== 'trialing') {
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

    // 3. Load child record — use child_id from record/direct-call if available
    step = 'load-child'
    const targetChildId = (record.child_id ?? null) as string | null
    let childQuery = sb
      .from('children')
      .select('id, name, dob, due_date, is_expecting, gender')
      .eq('user_id', userId)
    if (targetChildId) {
      childQuery = childQuery.eq('id', targetChildId).limit(1)
    } else {
      childQuery = childQuery.order('created_at', { ascending: true }).limit(1)
    }
    const { data: children, error: childErr } = await childQuery

    if (childErr) throw new Error(`Could not load child: ${childErr.message}`)
    if (!children || children.length === 0) throw new Error(`No child found for user ${userId}`)

    const child       = children[0]
    // Pre-birth children have dob=null and due_date set instead.
    // new Date(null) = epoch (1970) which produces absurd age values.
    const dobStr      = child.is_expecting || !child.dob ? child.due_date : child.dob
    if (!dobStr) throw new Error(`Child ${child.id} has no dob or due_date — cannot compute age`)
    const childDob    = new Date(dobStr + 'T00:00:00Z')
    const now         = new Date()
    const weeks       = ageInWeeks(childDob, now)
    const months      = ageInMonths(childDob, now)
    // birth_signup = true when called from scout-confirm-arrival (post-birth first digest).
    // Uses digest_type 'birth_signup' so it never collides with the pre-birth 'signup' log entry.
    // conversion = true when called from scout-convert after trial-to-paid upgrade.
    // Uses digest_type 'conversion' so it doesn't collide with the trial 'signup' log entry.
    // additional_child = true when called from scout-child-trial-start (2nd+ child added to account).
    // Uses digest_type 'additional_child' so it doesn't collide with the first child's 'signup' log entry.
    const birthSignup       = record.birth_signup       === true
    const isConversion      = record.is_conversion      === true
    const isAdditionalChild = record.additional_child   === true
    const digestType        = birthSignup       ? 'birth_signup'
                            : isConversion      ? 'conversion'
                            : isAdditionalChild ? 'additional_child'
                            : 'signup'

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

    // 5. Window query + email build — forks for expecting vs born
    step = 'query-windows'
    const isExpecting = child.is_expecting || weeks < 0

    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://getfamilyforce.com'
    const dashUrl = `${siteUrl}/scout-dashboard`

    const { data: profileData } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
    const parentName = profileData?.name?.trim() || undefined

    let emailHtml: string
    let subjectLine: string
    let icsString: string

    if (isExpecting) {
      // ── Expecting parent path ─────────────────────────────────────────────
      // Pre-birth slugs are hardcoded here (not queried from editorial schedule).
      // Month 0 in scout_editorial_schedule is reserved for born newborns.
      // The check constraint on that table prevents month values outside 0–36,
      // so pre-birth editorial cannot use a separate month slot.
      step = 'query-windows-prebirth'
      const PREBIRTH_SLUGS = [
        'prebirth-pediatrician-selection',
        'prebirth-hospital-bag',
        'prebirth-newborn-screening',
      ]
      const preBirthSlots = PREBIRTH_SLUGS.map((slug, i) => ({ slot: i + 1, slug }))

      let preBirthWindows: DigestWindow[] = []
      if (preBirthSlots?.length) {
        const pbSlugs = (preBirthSlots as { slug: string }[]).map(s => s.slug)
        const { data: pbWindowData } = await sb
          .from('milestone_windows')
          .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip, jack_bridge')
          .in('slug', pbSlugs)
        if (pbWindowData) {
          const pbMap = new Map((pbWindowData as DigestWindow[]).map(w => [w.slug, w]))
          preBirthWindows = pbSlugs.map(s => pbMap.get(s)).filter(Boolean) as DigestWindow[]
        }
      }

      // Month 1 editorial for "coming next month" section
      const { data: m1Slots } = await sb
        .from('scout_editorial_schedule')
        .select('slot, slug')
        .eq('month', 1)
        .order('slot', { ascending: true })
      let nextMonthWindows: Array<{ title: string }> = []
      if (m1Slots?.length) {
        const m1Slugs = (m1Slots as { slug: string }[]).map(s => s.slug)
        const { data: m1Data } = await sb
          .from('milestone_windows')
          .select('slug, title')
          .in('slug', m1Slugs)
        if (m1Data) {
          const m1Map = new Map((m1Data as { slug: string; title: string }[]).map(w => [w.slug, w.title]))
          nextMonthWindows = m1Slugs.map(s => ({ title: m1Map.get(s) ?? '' })).filter(w => w.title)
        }
      }

      // Total active prenatal windows for section header
      const { count: prenatalCount } = await sb
        .from('milestone_windows')
        .select('id', { count: 'exact', head: true })
        .eq('active', true)
        .eq('prenatal', true)

      const due = new Date(child.due_date + 'T00:00:00Z')
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000)

      step = 'build-email'
      subjectLine = daysLeft > 14
        ? `Three things to do before ${child.name}'s due date`
        : daysLeft > 0
          ? `${child.name} arrives in ${daysLeft} days — your prep checklist`
          : `Is ${child.name} here? Confirm their arrival to start Scout.`

      emailHtml = buildPreBirthEmail({
        childName:        child.name,
        childGender:      child.gender ?? null,
        dueDate:          due,
        daysLeft,
        windows:          preBirthWindows,
        nextMonthWindows,
        allWindowCount:   prenatalCount ?? 0,
        dashboardUrl:     dashUrl,
        siteUrl,
        userId,
      })

      // Due-date ICS — reminder to confirm baby's arrival
      step = 'build-ics'
      const dateStr   = due.toISOString().split('T')[0].replace(/-/g, '')
      const safeName  = child.name.replace(/[\\,;]/g, '')
      icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FamilyForce//Scout//EN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Scout by FamilyForce',
        'BEGIN:VEVENT',
        `UID:scout-due-${safeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${dateStr}@getfamilyforce.com`,
        `DTSTART;VALUE=DATE:${dateStr}`,
        `DTEND;VALUE=DATE:${dateStr}`,
        `SUMMARY:${safeName}'s due date — open Scout to confirm their arrival`,
        `DESCRIPTION:When ${safeName} arrives\\, open Scout and update their birthday.\\nMonth 1 digest fires automatically.\\n\\n${dashUrl}`,
        `URL:${dashUrl}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Reminder',
        'TRIGGER:-P7D',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n')

    } else {
      // ── Born child path ───────────────────────────────────────────────────

      // 5a. Age-filter window query (all open windows for this age)
      const { data: windows, error: winErr } = await sb
        .from('milestone_windows')
        .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
        .eq('active', true)
        .eq('window_type', 'milestone')
        .eq('prenatal', false)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })

      if (winErr) throw new Error(`Could not query windows: ${winErr.message}`)
      if (!windows || windows.length === 0) {
        console.warn(`[scout-signup-delivery] No windows found for age ${weeks}w — sending digest anyway`)
      }

      const allWindows = (windows ?? []) as MilestoneWindow[]

      // 5b. Editorial-first aboveFold — same logic as monthly digest
      const urgencyWeight: Record<string, number> = { clinical: 0, screening: 1, advisory: 2 }
      const { data: signupEditorialSlots } = await sb
        .from('scout_editorial_schedule')
        .select('slot, slug')
        .eq('month', months)
        .order('slot', { ascending: true })

      let aboveFold: MilestoneWindow[]
      if (signupEditorialSlots?.length) {
        const editSlugs = (signupEditorialSlots as { slug: string }[]).map(s => s.slug)
        const editMap   = new Map(allWindows.map(w => [w.slug, w]))
        const editPicks = editSlugs.map(s => editMap.get(s)).filter(Boolean) as MilestoneWindow[]
        const editPickIds = new Set(editPicks.map(w => w.id))
        const algoPool  = allWindows
          .filter(w => !editPickIds.has(w.id))
          .sort((a, b) => {
            const aC = a.close_age_weeks - weeks <= 4 ? 0 : 1
            const bC = b.close_age_weeks - weeks <= 4 ? 0 : 1
            if (aC !== bC) return aC - bC
            if (a.priority !== b.priority) return a.priority - b.priority
            return (urgencyWeight[a.urgency] ?? 2) - (urgencyWeight[b.urgency] ?? 2)
          })
        aboveFold = [...editPicks, ...algoPool].slice(0, ABOVE_FOLD_COUNT)
      } else {
        aboveFold = selectAboveFold(allWindows, weeks)
      }

      // 5c. "Get Ready" windows — editorial schedule for month+1
      let getReadyWindows: MilestoneWindow[] = []
      if (months < 36) {
        const { data: readySlots } = await sb
          .from('scout_editorial_schedule')
          .select('slug')
          .eq('month', months + 1)
          .order('slot', { ascending: true })
          .limit(3)
        if (readySlots?.length) {
          const readySlugs = (readySlots as { slug: string }[]).map(s => s.slug)
          const { data: readyData } = await sb
            .from('milestone_windows')
            .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
            .in('slug', readySlugs)
          if (readyData) {
            const order = new Map(readySlugs.map((s, i) => [s, i]))
            getReadyWindows = (readyData as MilestoneWindow[]).sort((a, b) =>
              (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99)
            )
          }
        }
      }

      // Count missed clinical windows
      let missedClinicalCount = 0
      if (weeks > 0) {
        const { count: mc } = await sb
          .from('milestone_windows')
          .select('id', { count: 'exact', head: true })
          .eq('active', true)
          .eq('window_type', 'milestone')
          .eq('prenatal', false)
          .eq('urgency', 'clinical')
          .lt('close_age_weeks', weeks)
          .lte('open_age_weeks', weeks)
        missedClinicalCount = mc ?? 0
      }

      step = 'build-email'
      subjectLine = buildDigestSubject(child.name, months, aboveFold as DigestWindow[], weeks, digestType)
      const closingCount = aboveFold.filter(w => w.close_age_weeks - weeks <= 4).length

      const nextBirthday = nextMonthlyBirthday(childDob, now)
      const nextMonths   = ageInMonths(childDob, nextBirthday)

      emailHtml = buildDigestEmail({
        childName:       child.name,
        parentName,
        childGender:     child.gender,
        ageMonths:       months,
        isExpecting:     false,
        postBirthWindowCount: 0,
        aboveFold:       aboveFold as DigestWindow[],
        getReadyWindows: getReadyWindows as DigestWindow[],
        allWindowCount:  allWindows.length + missedClinicalCount,
        closingCount,
        nextEventDate:   nextBirthday,
        dashboardUrl:    dashUrl,
        siteUrl,
        userId,
        digestType,
      })

      // Birthday ICS
      step = 'build-ics'
      const icsWindows: IcsWindow[] = allWindows.map(w => ({
        slug:              w.slug,
        title:             w.title,
        urgency:           w.urgency,
        close_age_weeks:   w.close_age_weeks,
        current_age_weeks: weeks,
      }))
      icsString = generateScoutIcs({
        childId:      child.id,
        childName:    child.name,
        ageMonths:    nextMonths,
        eventDate:    nextBirthday,
        windows:      icsWindows,
        dashboardUrl: dashUrl,
        siteUrl,
      })
    }

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
        filename:    isExpecting
          ? `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-due-date.ics`
          : `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-month${months}.ics`,
        content:     icsBase64,
        content_type: 'text/calendar',
      }],
    }

    if (bccEmail) resendBody.bcc = [bccEmail]
      resendBody.reply_to = ['support@getfamilyforce.com']

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
      child_age_months:  isExpecting ? -1 : months,
      digest_type:       digestType,
      windows_included:  [],  // aboveFold only defined in born-child branch
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
        is_expecting:     isExpecting,
        child_age_months: months,
        child_age_weeks:  weeks,
        resend_message_id: resendMessageId,
        duration_ms:      Date.now() - jobStart,
      },
    })

    // 12. Send to active family circle members (non-fatal)
    // 12. Family circle — skip for expecting parents (pre-birth email is parent-specific)
    step = 'family-send'
    if (!isExpecting) {
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

            const { data: memberProfile } = await sb.from('profiles').select('name').eq('id', memberId).maybeSingle()
            const memberGreetName = memberProfile?.name?.trim() || undefined
            const unsubUrl   = `${supabaseUrl}/functions/v1/scout-unsubscribe?t=${member.unsubscribe_token}`

            // Reuse parent's editorial-first aboveFold + getReadyWindows — all recipients see identical content
            const mClosing  = aboveFold.filter(w => w.close_age_weeks - weeks <= 4).length
            const mNextBday = nextMonthlyBirthday(childDob, now)

            const memberHtml = buildDigestEmail({
              childName:           child.name,
              parentName:          memberGreetName,
              childGender:         child.gender,
              ageMonths:           months,
              isExpecting:         false,
              postBirthWindowCount: 0,
              aboveFold:           aboveFold as DigestWindow[],
              getReadyWindows:     getReadyWindows as DigestWindow[],
              allWindowCount:      allWindows.length,
              closingCount:        mClosing,
              nextEventDate:       mNextBday,
              dashboardUrl:        dashUrl,
              siteUrl,
              userId:              memberId,
              digestType,
              unsubscribeUrl:      unsubUrl,
              recipientType:       'family_member',
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
              windows_included:  [],
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
