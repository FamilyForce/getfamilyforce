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

import { createClient }  from 'https://esm.sh/@supabase/supabase-js@2'
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
function buildSubjectLine(childName: string, ageMonths: number, aboveFold: MilestoneWindow[], ageWeeks: number): string {
  const closing = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  if (closing.length > 0) {
    const weeksLeft = closing[0].close_age_weeks - ageWeeks
    return `${childName} turns ${ageMonths} months — ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} left on ${closing[0].title.toLowerCase()}`
  }
  return `${childName} turns ${ageMonths} months today. Here is what is open.`
}

// ─── Email HTML helpers ───────────────────────────────────────────────────────
function windowCard(w: MilestoneWindow, ageWeeks: number, dashboardUrl: string, cardBg: string, borderColor: string): string {
  const closingWeeksLeft = w.close_age_weeks - ageWeeks
  const isClosing        = closingWeeksLeft <= 4
  const urgencyBg  = { clinical: '#FEE2E2', screening: '#EFF6FF', advisory: '#F5F3FF' }
  const urgencyFg  = { clinical: '#DC2626', screening: '#2563EB', advisory: '#6E4ED6' }
  const urgencyLbl = { clinical: 'Clinical', screening: 'Screening', advisory: 'Advisory' }
  const bg  = urgencyBg[w.urgency]  ?? '#F5F3FF'
  const fg  = urgencyFg[w.urgency]  ?? '#6E4ED6'
  const lbl = urgencyLbl[w.urgency] ?? 'Advisory'
  const badge = isClosing
    ? `${lbl} · ${closingWeeksLeft} week${closingWeeksLeft === 1 ? '' : 's'} left`
    : lbl

  const whatToDo = w.what_to_do
    ? `<tr><td style="height:10px"></td></tr>
       <tr><td><p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;font-weight:700;color:#1D1D1F;margin:0 0 4px">What to do this week</p>
       <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6">${w.what_to_do}</p></td></tr>`
    : ''

  const playbook = w.playbook_link
    ? `<tr><td style="height:8px"></td></tr>
       <tr><td><a href="${dashboardUrl}" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#6E4ED6;font-weight:600;text-decoration:none">See full guide →</a></td></tr>`
    : `<tr><td style="height:8px"></td></tr>
       <tr><td><a href="${dashboardUrl}" style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#6E4ED6;font-weight:600;text-decoration:none">See this window in your tracker →</a></td></tr>`

  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px">
    <tr>
      <td style="background:${cardBg};border:1px solid ${borderColor};border-radius:12px;padding:18px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;background:${bg};color:${fg};font-family:'Outfit',Arial,sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;letter-spacing:.06em;text-transform:uppercase">${badge}</span>
            </td>
          </tr>
          <tr><td style="height:8px"></td></tr>
          <tr>
            <td>
              <h3 style="font-family:'Outfit',Arial,sans-serif;font-size:16px;font-weight:700;color:#1D1D1F;margin:0 0 6px">${w.title}</h3>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0;line-height:1.6">${w.why_it_matters}</p>
            </td>
          </tr>
          ${whatToDo}
          ${playbook}
        </table>
      </td>
    </tr>
  </table>`
}

// ─── Email HTML ───────────────────────────────────────────────────────────────
function buildDigestEmail(opts: {
  childName:        string
  childGender:      string | null
  ageMonths:        number
  aboveFold:        MilestoneWindow[]
  allWindowCount:   number
  completedWindows: Array<{ title: string }>
  nextEventDate:    Date
  dashboardUrl:     string
  siteUrl:          string
  userId:           string
  ageWeeks:         number
  bonusMonth?:      boolean   // true = extra month granted because signup was within 7 days of birthday
}): string {
  const { childName, ageMonths, aboveFold, allWindowCount, completedWindows,
          nextEventDate, dashboardUrl, siteUrl, userId, ageWeeks, bonusMonth } = opts

  const nextMonthName = nextEventDate.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC'
  })

  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  })

  // Section split: closing soon (<= 4 weeks), this month, coming up (not yet open but within 8 wks)
  const closingSoon  = aboveFold.filter(w => w.close_age_weeks - ageWeeks <= 4)
  const thisMonth    = aboveFold.filter(w => w.close_age_weeks - ageWeeks > 4)

  // Preheader text
  const preheader = closingSoon.length > 0
    ? `${childName} turns ${ageMonths} months. ${closingSoon[0].close_age_weeks - ageWeeks} weeks left on ${closingSoon[0].title.toLowerCase()}. ${allWindowCount} open windows this month.`
    : `${childName} turns ${ageMonths} months. ${allWindowCount} developmental windows are open right now.`

  // Collect "don't worry" items from windows that have them
  const dontWorryItems = aboveFold
    .filter(w => w.what_not_to_worry)
    .map(w => `<tr>
      <td style="padding:10px 0;border-top:1px solid #EEECF5">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6">${w.what_not_to_worry}</p>
      </td>
    </tr>`)
    .slice(0, 2)

  const closingSoonSection = closingSoon.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr>
      <td style="background:#FFF5F5;border:1.5px solid #FECACA;border-radius:16px;padding:20px 20px 10px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
          <tr>
            <td>
              <span style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#DC2626;letter-spacing:.1em;text-transform:uppercase">⚠️ Closing soon</span>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:2px 0 0">These windows close in the next few weeks. Do not wait.</p>
            </td>
          </tr>
        </table>
        ${closingSoon.map(w => windowCard(w, ageWeeks, dashboardUrl, '#FFFFFF', '#FECACA')).join('')}
      </td>
    </tr>
  </table>` : ''

  const thisMonthSection = thisMonth.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr>
      <td style="background:#FFFFFF;border:1.5px solid #E5E2EC;border-radius:16px;padding:20px 20px 10px">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px">
          <tr>
            <td>
              <span style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:600;color:#5C5960;letter-spacing:.1em;text-transform:uppercase">This month</span>
            </td>
          </tr>
        </table>
        ${thisMonth.map(w => windowCard(w, ageWeeks, dashboardUrl, '#FAFAFA', '#E5E2EC')).join('')}
      </td>
    </tr>
  </table>` : ''

  const dontWorrySection = dontWorryItems.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr>
      <td style="background:#F9F8FD;border:1.5px solid #E5E2EC;border-radius:16px;padding:20px">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 0">Don't worry about this</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${dontWorryItems.join('')}
        </table>
      </td>
    </tr>
  </table>` : ''

  const completedSection = completedWindows.length > 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr>
      <td style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:16px;padding:18px">
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#166534;letter-spacing:.1em;text-transform:uppercase;margin:0 0 12px">What you marked done last month</p>
        ${completedWindows.map(w => `<p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#166534;margin:0 0 6px">✅ ${w.title}</p>`).join('')}
      </td>
    </tr>
  </table>` : ''

  const remainingCount = allWindowCount - aboveFold.length
  const ctaText = remainingCount > 0
    ? `${remainingCount} more window${remainingCount === 1 ? '' : 's'} are open this month.`
    : `See all of ${childName}'s open windows.`

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="x-apple-disable-message-reformatting">
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>${childName} turns ${ageMonths} months</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
    body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}
    @media (prefers-color-scheme:dark){
      body,.email-bg{background:#1A1A2E!important}
      .email-card{background:#22223B!important;border-color:#3A3A5C!important}
      .text-dark{color:#F0EEF8!important}
      .text-mid{color:#B0AECC!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">

  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#F5F3FF;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <table class="email-bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F5F3FF">
    <tr>
      <td align="center" style="padding:24px 12px 40px">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

          <!-- Wordmark -->
          <tr>
            <td style="padding:0 0 16px">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;font-weight:700;color:#6E4ED6;letter-spacing:.12em;text-transform:uppercase;margin:0">FamilyForce Scout</p></td>
                  <td align="right"><p style="font-family:'Outfit',Arial,sans-serif;font-size:12px;color:#8A879A;margin:0">Month ${ageMonths}</p></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#FFFFFF;border-radius:16px;padding:28px;margin-bottom:12px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">${todayStr}</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">${childName} turns ${ageMonths} months today.</h1>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#5C5960;margin:0;line-height:1.6">${allWindowCount} developmental windows are open. Here are the ${aboveFold.length} to focus on this month.</p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          ${bonusMonth ? `
          <!-- Bonus month note -->
          <tr>
            <td style="background:#EDE9FF;border-radius:12px;padding:16px 18px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#3D2A9E;margin:0;line-height:1.6">
                🎁 <strong>Bonus month.</strong> You signed up within a week of ${childName}'s birthday, so we're including this month as a bonus. Starting next month, a subscription keeps Scout going.
              </p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>` : ''}

          <!-- Window sections -->
          <tr><td>${closingSoonSection}</td></tr>
          <tr><td>${thisMonthSection}</td></tr>
          <tr><td>${dontWorrySection}</td></tr>

          <!-- Dashboard CTA -->
          <tr>
            <td style="background:#F0EBFF;border-radius:16px;padding:24px;text-align:center">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0 0 6px">${ctaText}</p>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0 0 16px">Mark windows done. Add notes. Personalise your next email.</p>
              <!--[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${dashboardUrl}" style="height:44px;v-text-anchor:middle;width:260px;" arcsize="50%" stroke="f" fillcolor="#6E4ED6">
                <w:anchorlock/>
                <center style="color:#ffffff;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;">See all ${childName}'s windows →</center>
              </v:roundrect>
              <![endif]-->
              <!--[if !mso]><!-->
              <a href="${dashboardUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none;mso-hide:all">See all ${childName}'s windows →</a>
              <!--<![endif]-->
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          <!-- Completed windows (active track) -->
          <tr><td>${completedSection}</td></tr>
          ${completedWindows.length > 0 ? '<tr><td style="height:12px"></td></tr>' : ''}

          <!-- Calendar note -->
          <tr>
            <td style="border-left:3px solid #6E4ED6;padding:12px 16px;background:#F9F8FD;border-radius:0 8px 8px 0">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#5C5960;margin:0;line-height:1.6">📅 A calendar event for ${nextMonthName} is attached. Accept it and a 7-day alarm will fire before ${childName}'s next windows close.</p>
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
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;color:#8A879A;margin:0">You're receiving this because you signed up for Scout. · <a href="${siteUrl}/scout-dashboard/settings" style="color:#8A879A;text-decoration:none">Email preferences</a> · <a href="${siteUrl}/unsubscribe?user=${userId}" style="color:#8A879A;text-decoration:none">Unsubscribe</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

// ─── Pre-birth reminder email ─────────────────────────────────────────────────
function buildPreBirthEmail(opts: {
  childName:    string
  dueDate:      Date
  daysLeft:     number
  windows:      MilestoneWindow[]
  dashboardUrl: string
  siteUrl:      string
  userId:       string
}): string {
  const { childName, dueDate, daysLeft, windows, dashboardUrl, siteUrl, userId } = opts

  const dueFmt = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

  const heroText = daysLeft > 0
    ? `${childName} arrives in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong> — ${dueFmt}.`
    : `Your due date has passed. Is ${childName} here?`

  const heroSub = daysLeft > 0
    ? `Here are your open preparation windows. Do these before the hospital bag is packed.`
    : `Confirm their arrival on your Scout dashboard to start full developmental tracking.`

  const windowCards = windows.length > 0
    ? windows.map(w => windowCard(w, /* ageWeeks = */ -Math.ceil(daysLeft / 7), dashboardUrl, '#FFFFFF', '#E5E2EC')).join('')
    : `<p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#5C5960;margin:0">No preparation windows are open right now — check back closer to your due date.</p>`

  const arrivedSection = daysLeft <= 0 ? `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px">
    <tr>
      <td style="background:#EDF7F2;border:1.5px solid #86C9A8;border-radius:16px;padding:24px;text-align:center">
        <h2 style="font-family:'Outfit',Arial,sans-serif;font-size:18px;font-weight:700;color:#1A4731;margin:0 0 8px">🎉 Is ${childName} here?</h2>
        <p style="font-family:'Outfit',Arial,sans-serif;font-size:14px;color:#2E7D5E;margin:0 0 18px;line-height:1.6">Confirm their arrival so Scout can start tracking developmental windows from day one.</p>
        <a href="${dashboardUrl}?arrived=1" style="display:inline-block;background:#2E7D5E;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none">Confirm arrival →</a>
      </td>
    </tr>
  </table>` : ''

  const ctaUrl = daysLeft <= 0 ? `${dashboardUrl}?arrived=1` : dashboardUrl
  const ctaLabel = daysLeft <= 0 ? `Confirm ${childName}'s arrival →` : `View your prep checklist →`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${daysLeft > 0 ? `${childName} arrives in ${daysLeft} days` : `Is ${childName} here?`}</title>
  <style>
    body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
    body{margin:0;padding:0;background:#F5F3FF;font-family:'Outfit',Arial,sans-serif}
  </style>
</head>
<body style="margin:0;padding:0;background:#F5F3FF">

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
            <td style="background:#FFFFFF;border-radius:16px;padding:28px;margin-bottom:12px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:13px;color:#8A879A;margin:0 0 6px">${todayStr}</p>
              <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;color:#1D1D1F;margin:0 0 10px;line-height:1.3">${heroText}</h1>
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:15px;color:#5C5960;margin:0;line-height:1.6">${heroSub}</p>
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>

          ${arrivedSection}

          ${windows.length > 0 ? `
          <!-- Prep windows -->
          <tr>
            <td style="background:#FFFFFF;border:1.5px solid #E5E2EC;border-radius:16px;padding:20px 20px 10px">
              <p style="font-family:'Outfit',Arial,sans-serif;font-size:11px;font-weight:700;color:#8A879A;letter-spacing:.1em;text-transform:uppercase;margin:0 0 16px">Prepare now</p>
              ${windowCards}
            </td>
          </tr>
          <tr><td style="height:12px"></td></tr>` : ''}

          <!-- CTA -->
          <tr>
            <td style="background:#F0EBFF;border-radius:16px;padding:24px;text-align:center">
              <a href="${ctaUrl}" style="display:inline-block;background:#6E4ED6;color:#FFFFFF;font-family:'Outfit',Arial,sans-serif;font-size:15px;font-weight:700;padding:12px 28px;border-radius:100px;text-decoration:none">${ctaLabel}</a>
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

  const resendKey = Deno.env.get('RESEND_API_KEY')!
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') ?? 'scout@getfamilyforce.com'
  const fromName  = Deno.env.get('RESEND_FROM_NAME')  ?? 'Jack at FamilyForce'
  const bccEmail  = Deno.env.get('RESEND_BCC_EMAIL')  ?? ''
  const siteUrl   = Deno.env.get('SITE_URL')           ?? 'https://getfamilyforce.com'
  const dashUrl   = `${siteUrl}/scout-dashboard`

  const results = { sent: 0, skipped: 0, not_birthday: 0, errors: 0 }

  console.log(`[scout-digest] Starting — ${now.toISOString()}`)

  // 1. Load all active subscriptions + trialing bonus-eligible users
  const todayStr = now.toISOString().split('T')[0]  // YYYY-MM-DD

  const { data: activeSubs, error: subErr } = await sb
    .from('scout_subscriptions')
    .select('user_id, created_at')
    .eq('status', 'active')

  if (subErr) {
    await telegramAlert(`Failed to query subscriptions: ${subErr.message}`)
    return new Response(JSON.stringify({ ok: false, error: subErr.message }), { status: 500 })
  }

  // Also load trialing users who have a bonus_birthday = today
  // These users signed up within 7 days of their child's birthday and get a bonus digest
  const { data: bonusEvents } = await sb
    .from('scout_events')
    .select('user_id')
    .eq('event_type', 'trial_bonus_eligible')
    .eq('properties->>bonus_birthday', todayStr)

  const bonusUserIds = new Set((bonusEvents ?? []).map(e => e.user_id))

  // Merge: active subs + bonus trialing users (deduplicated)
  const activeSets  = new Set((activeSubs ?? []).map(s => s.user_id))
  const allUserIds  = [
    ...(activeSubs ?? []),
    ...(bonusEvents ?? [])
      .filter(e => !activeSets.has(e.user_id))  // don't double-add active users
      .map(e => ({ user_id: e.user_id, created_at: now.toISOString() })),
  ]

  const subs = allUserIds
  console.log(`[scout-digest] ${activeSubs?.length ?? 0} active + ${bonusUserIds.size} bonus trialing to check`)

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

      // 4. Dedup check
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
      const { data: existing } = await sb
        .from('scout_digest_log')
        .select('id')
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
        .select('id, slug, title, category, urgency, open_age_weeks, peak_age_weeks, close_age_weeks, priority, why_it_matters, what_to_do, what_not_to_worry, missed_window, playbook_link')
        .eq('active', true)
        .lte('open_age_weeks', weeks)
        .gte('close_age_weeks', weeks)
        .order('priority', { ascending: true })

      if (winErr) throw new Error(`Window query failed: ${winErr.message}`)

      // 3I — Active track: fetch user's completed windows for this child
      const { data: progressRows } = await sb
        .from('window_progress')
        .select('window_id, status')
        .eq('user_id', userId)
        .eq('child_id', child.id)
        .in('status', ['completed', 'skipped'])

      const completedWindowIds = new Set(
        (progressRows ?? [])
          .filter(p => p.status === 'completed' || p.status === 'skipped')
          .map(p => p.window_id)
      )

      // 3I — "What you've done" section: completed windows from last month
      const completedWindows = (windows ?? [])
        .filter(w => completedWindowIds.has(w.id))
        .map(w => ({ title: w.title }))

      const isActiveTrack = completedWindowIds.size > 0

      // 3I — Exclude completed/skipped from above-fold selection
      const allWindows = (windows ?? []) as MilestoneWindow[]
      const openWindows = allWindows.filter(w => !completedWindowIds.has(w.id))
      const aboveFold  = selectAboveFold(openWindows.length > 0 ? openWindows : allWindows, weeks)

      if (allWindows.length === 0) {
        console.log(`[scout-digest] No windows for child ${child.id} at ${weeks}w — skipping`)
        results.skipped++
        continue
      }

      // 6. Build subject line
      const subjectLine = buildSubjectLine(child.name, months, aboveFold, weeks)

      // 7. Build email HTML
      const nextBirthday = nextMonthlyBirthday(childDob, now)
      const html = buildDigestEmail({
        childName:        child.name,
        childGender:      child.gender,
        ageMonths:        months,
        aboveFold,
        allWindowCount:   openWindows.length > 0 ? openWindows.length : allWindows.length,
        completedWindows,
        nextEventDate:    nextBirthday,
        dashboardUrl:     dashUrl,
        siteUrl,
        userId,
        ageWeeks:         weeks,
        bonusMonth:       bonusUserIds.has(userId),
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
          content:      btoa(icsString),
          content_type: 'text/calendar',
        }],
      }
      if (bccEmail) resendBody.bcc = [bccEmail]

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
