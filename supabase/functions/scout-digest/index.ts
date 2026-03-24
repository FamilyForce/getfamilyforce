// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Monthly Digest Edge Function
// Runs daily at 08:00 UTC. Fires for each paid subscriber whose
// child's birth day of month matches today's date.
//
// Deploy: supabase functions deploy scout-digest
// Schedule: daily 08:00 UTC via pg_cron (see supabase/cron/scout-cron.sql)
//
// Who gets it: status = 'active' only (paid subscribers)
// Dedup: scout_digest_log digest_type = 'monthly', digest_month = YYYY-MM
//
// Birthday edge cases handled:
//   - 29th/30th/31st born: fires on last day of month when month is shorter
//   - Feb 29 born: fires on Feb 28 in non-leap years
//   - Timezone: v1 uses UTC date; TODO store user timezone at signup for v1.1
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL, RESEND_FROM_NAME,
//          RESEND_BCC_EMAIL, SITE_URL,
//          SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2.99.3'
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface MilestoneWindow {
  id:                string
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

// ─── Birthday check ───────────────────────────────────────────────────────────
// Returns true if the child's monthly birthday falls on today (UTC).
// Handles short months: if birth day = 31 and today is the last day of a 30-day month → fires.
// Handles Feb 29 births: fires on Feb 28 in non-leap years.
function isBirthdayToday(dob: Date, today: Date): boolean {
  const birthDay    = dob.getUTCDate()
  const todayDay    = today.getUTCDate()
  const todayMonth  = today.getUTCMonth()
  const todayYear   = today.getUTCFullYear()

  // Days in today's month
  const daysInTodayMonth = new Date(Date.UTC(todayYear, todayMonth + 1, 0)).getUTCDate()

  // The effective birthday in the current month
  const effectiveBirthDay = Math.min(birthDay, daysInTodayMonth)

  return todayDay === effectiveBirthDay
}

// ─── Window selection — top N by closing urgency then priority ─────────────────
const ABOVE_FOLD_COUNT = 5

function selectAboveFold(windows: MilestoneWindow[], ageWeeks: number): MilestoneWindow[] {
  const urgencyWeight = { clinical: 0, screening: 1, advisory: 2 }
  return [...windows].sort((a, b) => {
    const aClosing = a.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    const bClosing = b.close_age_weeks - ageWeeks <= 4 ? 0 : 1
    if (aClosing !== bClosing) return aClosing - bClosing
    if (a.priority !== b.priority) return a.priority - b.priority
    return (urgencyWeight[a.urgency] ?? 2) - (urgencyWeight[b.urgency] ?? 2)
  }).slice(0, ABOVE_FOLD_COUNT)
}

// ─── Subject line ─────────────────────────────────────────────────────────────
// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🚨 scout-digest: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST')    return new Response('Method not allowed', { status: 405 })

  const jobStart = Date.now()
  const now      = new Date()

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const resendKey   = Deno.env.get('RESEND_API_KEY')!
  const fromEmail   = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const fromName    = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const bccEmail  = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
  const siteUrl   = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
  const dashUrl   = `${siteUrl}/scout-dashboard`

  const results = { sent: 0, skipped: 0, not_birthday: 0, errors: 0 }

  console.log(`[scout-digest] Starting — ${now.toISOString()}`)

  // 1. Load all active subscriptions
  const { data: activeSubs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, created_at')
    .eq('status', 'active')

  if (subErr) {
    await telegramAlert(`Failed to query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  const subs = activeSubs ?? []
  console.log(`[scout-digest] ${subs.length} active subscriptions to check`)

  // ── Step 2: Load expecting users ──────────────────────────────────────────
  const { data: expectingChildren } = await sb
    .from('children')
    .select('id, name, dob, due_date, is_expecting, gender, user_id')
    .eq('is_expecting', true)

  console.log(`[scout-digest] ${expectingChildren?.length ?? 0} expecting children to check`)

  for (const sub of (subs ?? [])) {
    try {
      const userId = sub.user_id

      // 2. Load child
      const { data: children } = await sb
        .from('children')
        .select('id, name, dob, due_date, is_expecting, gender')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (!children?.length) { results.skipped++; continue }
      const child    = children[0]
      const childDob = new Date(child.dob + 'T00:00:00Z')

      // 3. Birthday check — is today this child's birth day of month?
      if (!isBirthdayToday(childDob, now)) { results.not_birthday++; continue }

      const weeks  = ageInWeeks(childDob, now)
      const months = ageInMonths(childDob, now)

      // Skip if past 36 months — no more windows
      if (months > 36) { results.skipped++; continue }

      // 4. Dedup check — per user (family members each get their own log entry)
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('user_id', userId)
        .eq('child_id', child.id)
        .eq('digest_type', 'monthly')
        .eq('digest_month', currentMonth)
        .limit(1)
        .maybeSingle()

      if (existing) {
        console.log(`[scout-digest] Skipping duplicate for child ${child.id} (${currentMonth})`)
        results.skipped++
        continue
      }

      // 5. Query open windows for this age
      const { data: windows, error: winErr } = await sb
        .from('milestone_windows')
        .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
        .eq('active', true)
        .eq('window_type', 'milestone')
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })

      if (winErr) throw new Error(`Window query failed: ${winErr.message}`)

      // 5b. Query "Get Ready" windows (opening in next 8 weeks)
      const { data: readyData } = await sb
        .from('milestone_windows')
        .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link, prep_tip')
        .eq('active', true)
        .eq('window_type', 'milestone')
        .gt('open_age_weeks', weeks)
        .lte('open_age_weeks', weeks + 8)
        .order('open_age_weeks', { ascending: true })
        .order('priority', { ascending: true })
        .limit(3)

      const getReadyWindows = (readyData ?? []) as MilestoneWindow[]

      // 3I — Active track: fetch all progress for this child (shared across family)
      const { data: progressRows } = await sb
        .from('window_progress')
        .select('window_id, status, updated_at')
        .eq('child_id', child.id)
        .in('status', ['completed', 'skipped'])

      const completedWindowIds = new Set(
        (progressRows ?? []).map(p => p.window_id)
      )

      // 3I — "What you've done" section: only windows completed SINCE the last digest
      // Get last digest date for this child (any type) to use as the cutoff
      const { data: lastDigestRow } = await sb
        .from('scout_digest_log')
        .select('created_at')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastDigestDate = lastDigestRow?.created_at ? new Date(lastDigestRow.created_at) : null

      // Build a map of window_id → most recent updated_at across all family members
      const progressByWindow: Record<string, Date> = {}
      for (const p of (progressRows ?? [])) {
        const t = new Date(p.updated_at)
        if (!progressByWindow[p.window_id] || t > progressByWindow[p.window_id]) {
          progressByWindow[p.window_id] = t
        }
      }

      const completedWindows = (windows ?? [])
        .filter(w => {
          if (!completedWindowIds.has(w.id)) return false
          if (!lastDigestDate) return true   // first digest ever — show all completed
          const completedAt = progressByWindow[w.id]
          return completedAt && completedAt >= lastDigestDate
        })
        .map(w => ({ title: w.title, close_age_weeks: w.close_age_weeks }))

      const isActiveTrack = completedWindowIds.size > 0

      // 3I — Exclude completed/skipped from above-fold selection
      const allWindows  = (windows ?? []) as MilestoneWindow[]
      const openWindows = allWindows.filter(w => !completedWindowIds.has(w.id))
      // No fallback — if everything is done, aboveFold is empty and email shows "all caught up"
      const aboveFold   = selectAboveFold(openWindows, weeks)

      if (allWindows.length === 0) {
        console.log(`[scout-digest] No windows for child ${child.id} at ${weeks}w — skipping`)
        results.skipped++
        continue
      }

      // 3J — Overdue in_progress: windows still marked in_progress but already closed
      // Step 1: get window_ids the child has marked in_progress
      const { data: inProgressRows } = await sb
        .from('window_progress')
        .select('window_id')
        .eq('child_id', child.id)
        .eq('status', 'in_progress')

      const inProgressIds = (inProgressRows ?? []).map((r: { window_id: string }) => r.window_id)

      // Step 2: of those, find any whose developmental window has already closed
      let overdueWindows: { title: string; urgency: string }[] = []
      if (inProgressIds.length > 0) {
        const { data: overdueData } = await sb
          .from('milestone_windows')
          .select('id, title, urgency')
          .in('id', inProgressIds)
          .lt('close_age_weeks', weeks)   // window has already closed for this child's age
        overdueWindows = (overdueData ?? []).map(w => ({ title: w.title, urgency: w.urgency }))
      }

      // 6. Build subject line
      const subjectLine  = buildDigestSubject(child.name, months, aboveFold, weeks, 'monthly')
      const closingCount = aboveFold.filter((w: MilestoneWindow) => w.close_age_weeks - weeks <= 4).length

      // 6b. Fetch parent display name + active family circle members
      const [profileRes, familyRes] = await Promise.all([
        sb.from('profiles').select('name').eq('id', userId).maybeSingle(),
        sb.from('family_members')
          .select('member_user_id')
          .eq('owner_user_id', userId)
          .eq('child_id', child.id)
          .eq('status', 'active'),
      ])
      const ownerName = profileRes.data?.name?.trim() || null
      const memberIds = (familyRes.data || []).map((m: { member_user_id: string }) => m.member_user_id).filter(Boolean)
      let parentName = ownerName
      if (memberIds.length > 0) {
        const { data: memberProfiles } = await sb.from('profiles').select('name').in('id', memberIds)
        const memberNames = (memberProfiles || []).map((p: { name: string }) => p.name?.trim()).filter(Boolean)
        if (memberNames.length > 0 && ownerName) {
          parentName = ownerName + ' and ' + memberNames[0]
        }
      }

      // 7. Build email HTML
      const nextBirthday = nextMonthlyBirthday(childDob, now)
      const html = buildDigestEmail({
        childName:       child.name,
        parentName:      parentName || undefined,
        childGender:     child.gender,
        ageMonths:       months,
        aboveFold:       aboveFold as DigestWindow[],
        getReadyWindows: getReadyWindows as DigestWindow[],
        completedWindows,
        allWindowCount:  allWindows.length,
        closingCount,
        overdueWindows,
        nextEventDate:   nextBirthday,
        dashboardUrl:    dashUrl,
        siteUrl,
        userId,
        digestType:      'monthly',
      })

      // 8. Generate .ics for next birthday
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

      // 9. Load user email
      const { data: { user } } = await sb.auth.admin.getUserById(userId)
      if (!user?.email) { results.skipped++; continue }

      // 10. Send via Resend
      const resendBody: Record<string, unknown> = {
        from:    `${fromName} <${fromEmail}>`,
        to:      [user.email],
        subject: subjectLine,
        html,
        tags:    [
          { name: 'user_id',     value: userId },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'monthly' },
          { name: 'month',       value: currentMonth },
        ],
        attachments: [{
          filename:     `scout-${child.name.toLowerCase().replace(/\s+/g, '-')}-month${months}.ics`,
          content:      btoa(new TextEncoder().encode(icsString).reduce((s, b) => s + String.fromCharCode(b), '')),
          content_type: 'text/calendar',
        }],
      }
      if (bccEmail) resendBody.bcc = [bccEmail]
      resendBody.reply_to = ['support@getfamilyforce.com']

      const resendRes  = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(resendBody),
      })
      const resendData = await resendRes.json()
      if (!resendRes.ok) throw new Error(`Resend error: ${JSON.stringify(resendData)}`)
      const messageId = resendData.id as string

      // 11. Log to scout_digest_log
      await sb.from('scout_digest_log').insert({
        user_id:           userId,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  months,
        digest_type:       'monthly',
        windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
        email_subject:     subjectLine,
        resend_message_id: messageId,
      })

      // 12. Log to scout_events
      await sb.from('scout_events').insert({
        user_id:    userId,
        child_id:   child.id,
        event_type: 'monthly_digest_sent',
        properties: {
          child_age_months:     months,
          child_age_weeks:      weeks,
          windows_count:        allWindows.length,
          above_fold_count:     aboveFold.length,
          completed_count:      completedWindows.length,
          personalisation_track: isActiveTrack ? 'active' : 'passive',
          resend_message_id:    messageId,
          duration_ms:          Date.now() - jobStart,
        },
      })

      results.sent++
      console.log(`[scout-digest] Sent monthly digest for ${child.name} (user ${userId}, ${months}mo, ${weeks}w)`)

      // 13. Send to active family circle members
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
              .eq('digest_type', 'monthly')
              .eq('digest_month', currentMonth)
              .limit(1)
              .maybeSingle()
            if (memberExisting) continue

            const { data: { user: memberUser } } = await sb.auth.admin.getUserById(memberId)
            if (!memberUser?.email) continue

            // Greet the family member by their own name, not the account owner's
            const { data: memberProfile } = await sb.from('profiles').select('name').eq('id', memberId).maybeSingle()
            const memberGreetName = memberProfile?.name?.trim() || undefined

            // Build per-member HTML with their own unsubscribe URL + family footer
            const unsubUrl     = `${supabaseUrl}/functions/v1/scout-unsubscribe?t=${member.unsubscribe_token}`
            const memberHtml   = buildDigestEmail({
              childName:       child.name,
              parentName:      memberGreetName,
              childGender:     child.gender,
              ageMonths:       months,
              aboveFold:       aboveFold as DigestWindow[],
              getReadyWindows: getReadyWindows as DigestWindow[],
              completedWindows,
              allWindowCount:  allWindows.length,
              closingCount,
              overdueWindows,
              nextEventDate:   nextBirthday,
              dashboardUrl:    dashUrl,
              siteUrl,
              userId:          memberId,
              digestType:      'monthly',
              unsubscribeUrl:  unsubUrl,
              recipientType:   'family_member',
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
                { name: 'digest_type',    value: 'monthly' },
                { name: 'month',          value: currentMonth },
                { name: 'recipient_type', value: 'family_member' },
              ],
              attachments: resendBody.attachments,
            }

            const memberRes  = await fetch('https://api.resend.com/emails', {
              method:  'POST',
              headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
              body:    JSON.stringify(memberResendBody),
            })
            if (!memberRes.ok) {
              console.warn(`[scout-digest] Failed to send to family member ${memberId}`)
              continue
            }
            const memberData = await memberRes.json()

            await sb.from('scout_digest_log').insert({
              user_id:           memberId,
              child_id:          child.id,
              digest_month:      currentMonth,
              child_age_months:  months,
              digest_type:       'monthly',
              windows_included:  aboveFold.map(w => ({ id: w.id, slug: w.slug, title: w.title, urgency: w.urgency, priority: w.priority })),
              email_subject:     subjectLine,
              resend_message_id: memberData.id,
            })

            console.log(`[scout-digest] Sent to family member ${memberId} for child ${child.id}`)
          } catch (memberErr) {
            console.warn(`[scout-digest] Error sending to family member ${member.member_user_id}:`, memberErr)
          }
        }
      } catch (familyErr) {
        console.warn(`[scout-digest] Error loading family members for user ${userId}:`, familyErr)
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-digest] Error for user ${sub.user_id}:`, msg)
      await telegramAlert(`Monthly digest failed for user ${sub.user_id}: ${msg}`)
      results.errors++
    }
  }

  // ── Step 3 & 4: Pre-birth reminder loop ──────────────────────────────────
  for (const child of (expectingChildren ?? [])) {
    try {
      const due     = new Date(child.due_date + 'T00:00:00Z')
      const daysLeft = Math.ceil((due.getTime() - now.getTime()) / 86400000)

      // Cadence: fire on the day-of-month matching the due date
      // e.g. due April 16 → reminder fires on the 16th of each month
      const reminderDay = due.getUTCDate()
      if (now.getUTCDate() !== reminderDay) { results.not_birthday++; continue }

      // Dedup: one prebirth_reminder per calendar month per child
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existingPre } = await sb
        .from('scout_digest_log')
        .select('id')
        .eq('child_id', child.id)
        .eq('digest_type', 'prebirth_reminder')
        .eq('digest_month', currentMonth)
        .limit(1)
        .maybeSingle()

      if (existingPre) { results.skipped++; continue }

      // Load open pre-birth windows for this gestational age
      const ageWeeks = Math.floor((now.getTime() - due.getTime()) / (7 * 24 * 3600 * 1000)) // negative
      const { data: preBirthWindows } = await sb
        .from('milestone_windows')
        .select('id, slug, title, urgency, why_it_matters, what_to_do, what_not_to_worry, open_age_weeks, close_age_weeks, priority, playbook_link, missed_window')
        .eq('prenatal', true)
        .eq('window_type', 'milestone')
        .lte('open_age_weeks', ageWeeks)
        .gte('close_age_weeks', ageWeeks)
        .order('priority', { ascending: true })

      const { data: { user } } = await sb.auth.admin.getUserById(child.user_id)
      if (!user?.email) { results.skipped++; continue }

      const subject = daysLeft > 0
        ? `${child.name} arrives in ${daysLeft} day${daysLeft === 1 ? '' : 's'} — your prep checklist`
        : `Is ${child.name} here? Confirm their arrival to start Scout.`

      const html = buildPreBirthEmail({
        childName:    child.name,
        dueDate:      due,
        daysLeft,
        windows:      (preBirthWindows ?? []) as MilestoneWindow[],
        dashboardUrl: dashUrl,
        siteUrl,
        userId:       child.user_id,
      })

      const preheader = daysLeft > 0
        ? `${child.name} arrives in ${daysLeft} days. Here's what to prepare before they arrive.`
        : `Your due date has passed. Let us know ${child.name} is here to start full Scout tracking.`

      const resendBodyPre: Record<string, unknown> = {
        from:    `${fromName} <${fromEmail}>`,
        to:      [user.email],
        subject,
        html,
        tags: [
          { name: 'user_id',     value: child.user_id },
          { name: 'child_id',    value: child.id },
          { name: 'digest_type', value: 'prebirth_reminder' },
          { name: 'month',       value: currentMonth },
        ],
      }
      if (bccEmail) resendBodyPre.bcc = [bccEmail]
      resendBodyPre.reply_to = ['support@getfamilyforce.com']

      const resendResPre  = await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(resendBodyPre),
      })
      const resendDataPre = await resendResPre.json()
      if (!resendResPre.ok) throw new Error(`Resend error (prebirth): ${JSON.stringify(resendDataPre)}`)

      await sb.from('scout_digest_log').insert({
        user_id:           child.user_id,
        child_id:          child.id,
        digest_month:      currentMonth,
        child_age_months:  -1,  // sentinel: pre-birth
        digest_type:       'prebirth_reminder',
        windows_included:  (preBirthWindows ?? []).map(w => ({ id: w.id, slug: w.slug, title: w.title })),
        email_subject:     subject,
        resend_message_id: resendDataPre.id as string,
      })

      await sb.from('scout_events').insert({
        user_id:    child.user_id,
        child_id:   child.id,
        event_type: 'prebirth_reminder_sent',
        properties: {
          days_until_due:    daysLeft,
          windows_count:     preBirthWindows?.length ?? 0,
          resend_message_id: resendDataPre.id,
          duration_ms:       Date.now() - jobStart,
        },
      })

      results.sent++
      console.log(`[scout-digest] Sent pre-birth reminder for ${child.name} (user ${child.user_id}, ${daysLeft} days to due)`)

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[scout-digest] Error (prebirth) for child ${child.id}:`, msg)
      await telegramAlert(`Pre-birth reminder failed for child ${child.id}: ${msg}`)
      results.errors++
    }
  }

  // ─── Job summary ──────────────────────────────────────────────────────────
  const duration = Date.now() - jobStart
  console.log(`[scout-digest] Done in ${duration}ms`, results)

  // Only alert if there were actual errors (not_birthday skips are normal)
  if (results.errors > 0) {
    await telegramAlert(`Done with ${results.errors} error(s). Sent: ${results.sent}, skipped: ${results.skipped}, non-birthday: ${results.not_birthday}`)
  }

  return new Response(JSON.stringify({ ok: true, results, duration_ms: duration }), {
    status:  200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
})
