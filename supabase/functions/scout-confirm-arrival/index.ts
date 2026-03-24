// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Confirm Arrival
// Called when an expecting parent confirms their baby has arrived.
//
// POST body: { childId: string, realDob: string (YYYY-MM-DD) }
// Auth: Bearer session token (Supabase)
//
// Actions:
//   1. Auth check
//   2. Load child — must be is_expecting = true and belong to user
//   3. Validate realDob (past, within reasonable window of due_date)
//   4. Update child: dob = realDob, is_expecting = false (due_date kept for reference)
//   5. Reset trial_end = baby's next monthly birthday (Option A: trial clock resets at birth)
//   6. Upsert scout_subscriptions with new trial_end (status stays trialing)
//   7. Log birth_confirmed to scout_events
//   8. Fire scout-signup-delivery async — sends first real post-birth digest
//   9. Return { ok: true, trialEnd, childId }
//
// Deploy: supabase functions deploy scout-confirm-arrival
//
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//          TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
// ═══════════════════════════════════════════════════════════════

import { createClient }         from 'https://esm.sh/@supabase/supabase-js@2.99.3'
import { nextMonthlyBirthday }  from '../_shared/ics-generator.ts'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function err(status: number, msg: string, step = '') {
  return new Response(JSON.stringify({ ok: false, error: msg, step }), {
    status, headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// ─── Advance one monthly birthday forward ─────────────────────────────────────

// ─── Telegram alert ───────────────────────────────────────────────────────────
async function telegramAlert(message: string): Promise<void> {
  const token  = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID')
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: `🍼 scout-confirm-arrival: ${message}` }),
    })
  } catch { /* non-critical */ }
}

// ─── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), {
      status: 405, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }

  const jobStart = Date.now()
  let   step     = 'init'

  try {
    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)

    // 1. Auth via REST API (service role + getUser SDK unreliable)
    step = 'auth'
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return err(401, 'Missing auth token', step)
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    })
    if (!authRes.ok) return err(401, 'Unauthorized', step)
    const authData = await authRes.json()
    const userId = authData.id as string
    if (!userId) return err(401, 'Unauthorized', step)

    // 2. Parse body
    step = 'parse'
    let body: { childId?: string; realDob?: string }
    try { body = await req.json() } catch { return err(400, 'Invalid JSON', step) }

    const { childId, realDob } = body
    if (!childId)  return err(400, 'childId is required', step)
    if (!realDob)  return err(400, 'realDob is required (YYYY-MM-DD)', step)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(realDob)) return err(400, 'realDob must be YYYY-MM-DD', step)

    const realDobDate = new Date(realDob + 'T00:00:00Z')
    if (isNaN(realDobDate.getTime())) return err(400, 'realDob is not a valid date', step)

    const now = new Date()
    if (realDobDate > now) return err(400, 'realDob must be in the past — baby must already be born', step)

    // 3. Load child — verify ownership (or family member access) and expecting status
    step = 'load-child'
    let child: { id: string; name: string; dob: string | null; due_date: string | null; is_expecting: boolean; gender: string | null; user_id: string } | null = null

    // 3a. Try direct ownership first
    const { data: ownedChild, error: ownedErr } = await sb
      .from('children')
      .select('id, name, dob, due_date, is_expecting, gender, user_id')
      .eq('id', childId)
      .eq('user_id', userId)
      .single()

    if (!ownedErr && ownedChild) {
      child = ownedChild
    } else {
      // 3b. Check if caller is an active family member with access to this child
      step = 'load-child-family'
      const { data: familyRow } = await sb
        .from('family_members')
        .select('owner_user_id')
        .eq('member_user_id', userId)
        .eq('status', 'active')
        .limit(20)

      if (familyRow && familyRow.length > 0) {
        const ownerIds = familyRow.map((r: { owner_user_id: string }) => r.owner_user_id)

        const { data: sharedChild } = await sb
          .from('children')
          .select('id, name, dob, due_date, is_expecting, gender, user_id')
          .eq('id', childId)
          .in('user_id', ownerIds)
          .single()

        if (sharedChild) child = sharedChild
      }
    }

    if (!child) return err(404, 'Child not found', step)
    if (!child.is_expecting) return err(400, 'Child is not in expecting mode — arrival already confirmed', step)
    if (!child.due_date)     return err(400, 'Child has no due date on record', step)

    // All DB writes use the child's owner user_id, not the caller's (matters for family members)
    const ownerUserId = child.user_id

    // 4. Validate realDob is plausible relative to due date
    //    Allow up to 17 weeks early (matches UI date picker: 120 days) and up to 4 weeks late
    step = 'validate-dob'
    const dueDate         = new Date(child.due_date + 'T00:00:00Z')
    const earliestAllowed = new Date(dueDate.getTime() - 120 * 24 * 3600 * 1000)     // 120 days before due
    const latestAllowed   = new Date(dueDate.getTime() +   4 * 7 * 24 * 3600 * 1000) // 4 weeks after due

    if (realDobDate < earliestAllowed || realDobDate > latestAllowed) {
      return err(400, `realDob is outside the expected window (10 weeks before to 4 weeks after due date)`, step)
    }

    // 5. Update child record
    step = 'update-child'
    const { error: updateErr } = await sb
      .from('children')
      .update({
        dob:          realDob,
        is_expecting: false,
        // due_date is intentionally kept for historical reference
        updated_at:   now.toISOString(),
      })
      .eq('id', childId)
      .eq('user_id', ownerUserId)

    if (updateErr) throw new Error(`Failed to update child: ${updateErr.message}`)

    // 6. Reset trial_end to baby's next monthly birthday (Option A — trial clock resets at birth)
    step = 'calculate-trial-end'
    const nextBday     = nextMonthlyBirthday(realDobDate, now)
    const daysUntilEnd = Math.floor((nextBday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const trialEnd     = nextBday

    // 7. Upsert scout_subscriptions — preserve gift trial_end if it's further in the future
    step = 'upsert-subscription'

    // Load existing subscription to check for active gift
    const { data: existingSub } = await sb
      .from('scout_subscriptions')
      .select('status, trial_end, is_gift')
      .eq('user_id', ownerUserId)
      .maybeSingle()

    const existingTrialEnd = existingSub?.trial_end ? new Date(existingSub.trial_end) : null
    // If the existing trial_end is further out than the recalculated one, it's a gift — keep it
    const finalTrialEnd = (existingTrialEnd && existingTrialEnd > trialEnd) ? existingTrialEnd : trialEnd
    const isGift        = existingSub?.is_gift      ?? false
    const planMonths    = existingSub?.plan_months  ?? null

    const { error: subErr } = await sb
      .from('scout_subscriptions')
      .upsert({
        user_id:     ownerUserId,
        status:      'trialing',
        trial_end:   finalTrialEnd.toISOString(),
        is_gift:     isGift,
        plan_months: planMonths,
      }, { onConflict: 'user_id' })

    if (subErr) throw new Error(`Failed to update subscription: ${subErr.message}`)

    // Use finalTrialEnd everywhere below so logging/response reflect the preserved gift date
    const trialEndForLogging = finalTrialEnd

    // 8. Log birth_confirmed to scout_events
    step = 'log-event'
    try {
      await sb.from('scout_events').insert({
        user_id:    ownerUserId,
        child_id:   childId,
        event_type: 'birth_confirmed',
        properties: {
          real_dob:                  realDob,
          due_date:                  child.due_date,
          days_from_due:             Math.round((realDobDate.getTime() - dueDate.getTime()) / 86400000),
          trial_end:                 finalTrialEnd.toISOString(),
          days_until_first_birthday: daysUntilEnd,
          duration_ms:               Date.now() - jobStart,
          ...(userId !== ownerUserId ? { confirmed_by_family_member: userId } : {}),
        },
      })
    } catch (logErr) {
      console.warn('[scout-confirm-arrival] scout_events insert failed:', logErr)
    }

    // 9. Fire scout-signup-delivery async — first real post-birth digest
    //    Uses digest_type = 'birth_signup' to avoid dedup collision with pre-birth 'signup' log
    step = 'trigger-delivery'
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const deliveryPayload = {
      type:   'INSERT',
      table:  'scout_subscriptions',
      record: {
        user_id:      ownerUserId,
        status:       'trialing',
        trial_end:    finalTrialEnd.toISOString(),
        birth_signup: true,           // tells signup-delivery to use digest_type 'birth_signup'
      },
    }

    fetch(`${supabaseUrl}/functions/v1/scout-signup-delivery`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(deliveryPayload),
    }).catch(e => {
      console.error('[scout-confirm-arrival] Failed to trigger signup delivery:', e.message)
      telegramAlert(`Failed to trigger post-birth digest for user ${ownerUserId}: ${e.message}`)
    })

    // 10. Gifter notification — if a scout_gift was redeemed for this child, notify the buyer
    step = 'gifter-notify'
    try {
      const { data: gift } = await sb
        .from('scout_gifts')
        .select('id, buyer_name, buyer_email, recipient_name, plan')
        .eq('child_id', childId)
        .not('buyer_email', 'is', null)
        .maybeSingle()

      if (gift?.buyer_email) {
        const resendKey  = Deno.env.get('RESEND_API_KEY')!
        const fromEmail  = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
        const fromName   = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce'
        const siteUrl    = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
        const bccEmail   = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
        const planLabel  = gift.plan === 'triennial' ? 'Full Journey (3 Years)' : gift.plan === 'annual' ? '1 Year of Scout' : '1 Month of Scout'
        const dobFmt     = realDobDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        const recipName  = gift.recipient_name || 'the family'
        const buyerGreet = gift.buyer_name ? `Hi ${gift.buyer_name},` : 'Hi there,'

        const giftHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${child.name} has arrived — your Scout gift just activated</title>
<style>body{margin:0;padding:0;background:#F7F5FF;font-family:Arial,sans-serif}</style>
</head>
<body style="margin:0;padding:0;background:#F7F5FF">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${recipName} confirmed their baby arrived. Your gift is now active.&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid #E5E2EC">
<tr><td style="background:#2D9B6F;padding:32px 36px 36px">
  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 20px">Scout by FamilyForce</p>
  <p style="font-family:Georgia,serif;font-size:30px;color:#fff;margin:0 0 10px;line-height:1.2">${child.name} has arrived. 🎉</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.65);margin:0">Your Scout gift just activated.</p>
</td></tr>
<tr><td style="background:#FFFFFF;padding:32px 36px">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding-bottom:24px">
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#1D1D1F;margin:0 0 12px;font-weight:600">${buyerGreet}</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0 0 10px;line-height:1.75">${recipName}'s baby <strong>${child.name}</strong> arrived on <strong>${dobFmt}</strong>. Your gift of <strong>${planLabel}</strong> is now active.</p>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0;line-height:1.75">They'll receive their first personalised Scout digest on ${child.name}'s monthly birthday. What a gift.</p>
</td></tr>
<tr><td style="padding-bottom:32px">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#E6FAF8;border-radius:14px">
  <tr><td style="padding:20px 22px">
    <p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#2D9B6F;text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">What happens next</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;line-height:1.7">Scout will send <strong>${recipName}</strong> a personalised monthly guide on ${child.name}'s birthday each month — what matters developmentally right now, what's coming next, and exactly what to do.</p>
  </td></tr></table>
</td></tr>
<tr><td style="border-top:1px solid #E5E2EC;padding-top:24px">
  <p style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0 0 2px;font-weight:600">Jack Hartley</p>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#8A879A;margin:0">Dad of two · Founder, FamilyForce</p>
</td></tr>
</table></td></tr>
<tr><td style="background:#F7F5FF;padding:20px 36px;border-top:1px solid #E5E2EC">
  <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">FamilyForce · ${siteUrl}</p>
</td></tr>
</table></td></tr></table>
</body></html>`

        const notifyBody: Record<string, unknown> = {
          from:    `${fromName} <${fromEmail}>`,
          to:      [gift.buyer_email],
          subject: `${child.name} has arrived — your Scout gift just activated 🎉`,
          html:    giftHtml,
          tags: [
            { name: 'type',     value: 'gifter_notify' },
            { name: 'gift_id',  value: gift.id },
            { name: 'child_id', value: childId },
          ],
        }
        if (bccEmail) notifyBody.bcc = [bccEmail]
        notifyBody.reply_to = ['support@getfamilyforce.com']

        const notifyRes = await fetch('https://api.resend.com/emails', {
          method:  'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body:    JSON.stringify(notifyBody),
        })
        if (notifyRes.ok) {
          const notifyData = await notifyRes.json()
          await sb.from('prebirth_email_log').insert({
            user_id: ownerUserId, child_id: childId, email_type: 'gifter_notify',
          }).then(() => {})  // ignore if already exists
          console.log(`[scout-confirm-arrival] Gifter notification sent to ${gift.buyer_email} (msg ${notifyData.id})`)
        } else {
          const notifyErr = await notifyRes.json()
          console.warn('[scout-confirm-arrival] Gifter notification failed:', JSON.stringify(notifyErr))
        }
      }
    } catch (giftErr) {
      // Non-critical — don't fail the whole arrival confirmation
      console.warn('[scout-confirm-arrival] Gifter notify error (non-fatal):', giftErr)
    }

    // 11. Notify active family circle members that baby has arrived
    step = 'family-notify'
    try {
      const { data: familyMembers } = await sb
        .from('family_members')
        .select('member_user_id')
        .eq('owner_user_id', ownerUserId)
        .eq('child_id', childId)
        .eq('status', 'active')

      if (familyMembers && familyMembers.length > 0) {
        const resendApiKey = Deno.env.get('RESEND_API_KEY')!
        const fromName     = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce Scout'
        const fromEmail    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
        const siteUrl      = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'
        const dashUrl      = `${siteUrl}/scout-dashboard.html`
        const dobFmt       = new Date(realDob + 'T00:00:00Z').toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
        })

        // Use the confirmer's name (family member who triggered confirmation, or the owner if self-confirmed)
        const confirmerProfileId = userId !== ownerUserId ? userId : ownerUserId
        const { data: confirmerProfile } = await sb.from('profiles').select('name').eq('id', confirmerProfileId).maybeSingle()
        const ownerName = confirmerProfile?.name?.trim() || 'Your family'

        for (const member of familyMembers) {
          try {
            const memberId = member.member_user_id
            if (!memberId) continue
            if (memberId === userId) continue  // skip whoever confirmed — they already know

            const { data: { user: memberUser } } = await sb.auth.admin.getUserById(memberId)
            if (!memberUser?.email) continue

            const { data: memberProfile } = await sb.from('profiles').select('name').eq('id', memberId).maybeSingle()
            const memberName = memberProfile?.name?.trim() || null
            const memberGreet = memberName ? `Hi ${memberName},` : 'Hi there,'

            const familyHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#F7F5FF;font-family:Arial,sans-serif}</style>
</head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;border:1px solid #E8E4F5">
      <tr><td style="background:#2D1B69;padding:32px 36px 28px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 16px">Scout by FamilyForce</p>
        <p style="font-family:Georgia,serif;font-size:30px;color:#fff;margin:0 0 8px;line-height:1.2">${child.name} has arrived. 🎉</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.65);margin:0">Born ${dobFmt}</p>
      </td></tr>
      <tr><td style="background:#fff;padding:28px 36px 32px">
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#1D1D1F;margin:0 0 12px;font-weight:600">${memberGreet}</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0 0 16px;line-height:1.75"><strong>${ownerName}</strong> confirmed that <strong>${child.name}</strong> arrived on <strong>${dobFmt}</strong>. Scout is now tracking ${child.name}'s development.</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0 0 24px;line-height:1.75">You'll receive monthly Scout digests for ${child.name} starting on ${child.name}'s first monthly birthday.</p>
        <a href="${dashUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;text-decoration:none">View Dashboard →</a>
      </td></tr>
      <tr><td style="background:#F7F5FF;padding:20px 36px;text-align:center">
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">FamilyForce · ${siteUrl}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

            await fetch('https://api.resend.com/emails', {
              method:  'POST',
              headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from:    `${fromName} <${fromEmail}>`,
                to:      [memberUser.email],
                reply_to: ['support@getfamilyforce.com'],
                subject: `${child.name} has arrived! 🎉`,
                html:    familyHtml,
                tags:    [
                  { name: 'type',     value: 'family_birth_notify' },
                  { name: 'child_id', value: childId },
                ],
              }),
            })
            console.log(`[scout-confirm-arrival] Birth notification sent to family member ${memberId}`)
          } catch (memberErr) {
            console.warn(`[scout-confirm-arrival] Failed to notify family member ${member.member_user_id}:`, memberErr)
          }
        }
      }
    } catch (familyErr) {
      // Non-critical — don't fail the whole arrival confirmation
      console.warn('[scout-confirm-arrival] Family notify error (non-fatal):', familyErr)
    }

    // 12. Notify the account owner when a family member confirmed (owner wasn't in the loop above)
    if (userId !== ownerUserId) {
      step = 'owner-notify'
      try {
        const { data: { user: ownerUser } } = await sb.auth.admin.getUserById(ownerUserId)
        if (ownerUser?.email) {
          const resendApiKey = Deno.env.get('RESEND_API_KEY')!
          const fromName     = Deno.env.get('RESEND_FROM_NAME')  ?? 'FamilyForce Scout'
          const fromEmail    = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
          const siteUrl      = Deno.env.get('SITE_URL')          ?? 'https://getfamilyforce.com'
          const dashUrl      = `${siteUrl}/scout-dashboard.html`
          const dobFmt       = new Date(realDob + 'T00:00:00Z').toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
          })

          const { data: ownerProfile }     = await sb.from('profiles').select('name').eq('id', ownerUserId).maybeSingle()
          const { data: confirmerProfile } = await sb.from('profiles').select('name').eq('id', userId).maybeSingle()
          const ownerGreet     = ownerProfile?.name?.trim() ? `Hi ${ownerProfile.name.trim()},` : 'Hi there,'
          const confirmerLabel = confirmerProfile?.name?.trim() || 'A family member'

          const ownerHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;background:#F7F5FF;font-family:Arial,sans-serif}</style>
</head><body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5FF;padding:32px 16px">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-radius:20px;overflow:hidden;border:1px solid #E8E4F5">
      <tr><td style="background:#2D1B69;padding:32px 36px 28px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5);margin:0 0 16px">Scout by FamilyForce</p>
        <p style="font-family:Georgia,serif;font-size:30px;color:#fff;margin:0 0 8px;line-height:1.2">${child.name} has arrived. 🎉</p>
        <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.65);margin:0">Born ${dobFmt}</p>
      </td></tr>
      <tr><td style="background:#fff;padding:28px 36px 32px">
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#1D1D1F;margin:0 0 12px;font-weight:600">${ownerGreet}</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0 0 16px;line-height:1.75"><strong>${confirmerLabel}</strong> confirmed that <strong>${child.name}</strong> arrived on <strong>${dobFmt}</strong>. Scout is now tracking ${child.name}'s development.</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:#5C5960;margin:0 0 24px;line-height:1.75">You'll receive your first monthly Scout digest on ${child.name}'s first monthly birthday.</p>
        <a href="${dashUrl}" style="display:inline-block;background:#6E4ED6;color:#fff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;padding:14px 28px;border-radius:100px;text-decoration:none">View Dashboard →</a>
      </td></tr>
      <tr><td style="background:#F7F5FF;padding:20px 36px;text-align:center">
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">FamilyForce · ${siteUrl}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

          await fetch('https://api.resend.com/emails', {
            method:  'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from:    `${fromName} <${fromEmail}>`,
              to:      [ownerUser.email],
              reply_to: ['support@getfamilyforce.com'],
              subject: `${child.name} has arrived! 🎉`,
              html:    ownerHtml,
              tags:    [
                { name: 'type',     value: 'owner_birth_notify' },
                { name: 'child_id', value: childId },
              ],
            }),
          })
          console.log(`[scout-confirm-arrival] Owner notified at ${ownerUser.email} — confirmed by family member ${userId}`)
        }
      } catch (ownerNotifyErr) {
        // Non-critical
        console.warn('[scout-confirm-arrival] Owner notify error (non-fatal):', ownerNotifyErr)
      }
    }

    const confirmedByNote = userId !== ownerUserId ? ` (confirmed by family member ${userId})` : ''
    console.log(`[scout-confirm-arrival] Birth confirmed for user ${ownerUserId}, child ${childId} (dob=${realDob}, trialEnd=${finalTrialEnd.toISOString().split('T')[0]})${confirmedByNote}`)
    await telegramAlert(`🍼 Birth confirmed — user ${ownerUserId}, ${child.name} born ${realDob} (due ${child.due_date})${confirmedByNote}`)

    return new Response(JSON.stringify({
      ok:           true,
      childId,
      trialEnd:     finalTrialEnd.toISOString(),
      trialEndFormatted: finalTrialEnd.toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
      }),
    }), {
      status:  200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[scout-confirm-arrival] Error at step=${step}:`, msg)
    await telegramAlert(`Error at step=${step}: ${msg}`)
    return err(500, msg, step)
  }
})
