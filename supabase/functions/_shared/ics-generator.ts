// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — .ics Calendar Event Generator
// RFC 5545 compliant. Imported by all Scout delivery functions.
//
// Usage:
//   import { generateScoutIcs } from '../_shared/ics-generator.ts'
//   const icsString = generateScoutIcs({ ... })
//
// Test matrix (must pass before shipping):
//   - Apple Calendar (iOS)
//   - Apple Calendar (macOS)
//   - Google Calendar (web)
//   - Google Calendar (Android)
//   - Outlook (Windows)
//   - Outlook (web)
// ═══════════════════════════════════════════════════════════════

export interface IcsWindow {
  slug:            string
  title:           string
  urgency:         'advisory' | 'screening' | 'clinical'
  close_age_weeks: number
  current_age_weeks: number
}

export interface GenerateIcsOptions {
  childId:         string
  childName:       string
  ageMonths:       number       // child's age at the event date
  eventDate:       Date         // the monthly birthday this event is placed on
  windows:         IcsWindow[]  // all open windows for this month
  dashboardUrl:    string       // e.g. https://getfamilyforce.com/scout-dashboard
  siteUrl:         string       // e.g. https://getfamilyforce.com
}

// ─── RFC 5545 text escaping ───────────────────────────────────────────────────
// Escape commas, semicolons, and backslashes in text properties
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

// ─── RFC 5545 line folding ────────────────────────────────────────────────────
// Lines must not exceed 75 octets (not characters).
// Folded by inserting CRLF + a single space.
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const bytes   = encoder.encode(line)

  if (bytes.length <= 75) return line

  const result: string[] = []
  let   start = 0

  while (start < bytes.length) {
    // Take up to 75 bytes (first line) or 74 bytes (continuation lines)
    const limit = start === 0 ? 75 : 74
    let   end   = start + limit

    if (end >= bytes.length) {
      result.push(new TextDecoder().decode(bytes.slice(start)))
      break
    }

    // Walk back to avoid splitting a multi-byte character
    while (end > start && (bytes[end] & 0xC0) === 0x80) end--

    result.push(new TextDecoder().decode(bytes.slice(start, end)))
    start = end
  }

  return result.join('\r\n ')
}

// ─── Format a Date as YYYYMMDD (all-day event, no time component) ─────────────
function formatDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${dd}`
}

// ─── Format a Date as YYYYMMDDTHHMMSSZ (UTC timestamp) ───────────────────────
function formatDateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

// ─── Build plain-text DESCRIPTION (Google Calendar fallback) ─────────────────
function buildDescription(
  childName:    string,
  ageMonths:    number,
  windows:      IcsWindow[],
  dashboardUrl: string
): string {
  const lines: string[] = []

  if (ageMonths === 0) {
    lines.push(`Today is ${childName}'s expected due date.`)
    lines.push('')
    lines.push(`Head to Scout to confirm your baby has arrived and unlock your`)
    lines.push(`personalised milestone plan for the first month.`)
    lines.push('')
    if (windows.length > 0) {
      lines.push(`Your first month has ${windows.length} open milestone window${windows.length === 1 ? '' : 's'}:`)
      lines.push('')
      for (const w of windows) lines.push(`  \u2022 ${w.title}`)
      lines.push('')
    }
    lines.push(`Confirm arrival: ${dashboardUrl}`)
    lines.push('')
    lines.push(`\u2014 FamilyForce Scout`)
    return lines.join('\n')
  }

  // Note: "weeks left" is intentionally omitted from the ICS — it is calculated
  // at generation time, not at event-fire time, so it would be misleading.
  const closing = windows.filter(w => w.close_age_weeks - w.current_age_weeks <= 4)
  const open    = windows.filter(w => w.close_age_weeks - w.current_age_weeks > 4)

  lines.push(`${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'} old today.`)
  lines.push('')
  lines.push(`Your Scout digest is in your inbox. Here's what's open this month:`)
  lines.push('')

  if (closing.length > 0) {
    lines.push(`Closing soon \u2014 worth doing this month:`)
    for (const w of closing) lines.push(`  \u2022 ${w.title}`)
    lines.push('')
  }

  if (open.length > 0) {
    lines.push(`Also open this month:`)
    for (const w of open.slice(0, 6)) lines.push(`  \u2022 ${w.title}`)
    if (open.length > 6) lines.push(`  \u2022 \u2026 and ${open.length - 6} more`)
    lines.push('')
  }

  lines.push(`Open Scout: ${dashboardUrl}`)
  lines.push('')
  lines.push(`\u2014 FamilyForce Scout`)
  return lines.join('\n')
}

// ─── Build rich HTML description (Apple Calendar + Outlook via X-ALT-DESC) ───
function buildHtmlDescription(
  childName:    string,
  ageMonths:    number,
  windows:      IcsWindow[],
  dashboardUrl: string
): string {
  const purple  = '#6E4ED6'
  const text    = '#1A0F3A'
  const dimText = '#6B7280'
  const amber   = '#B45309'
  const amberBg = '#FFFBEB'
  const amberBorder = '#FDE68A'

  const closing = windows.filter(w => w.close_age_weeks - w.current_age_weeks <= 4)
  const open    = windows.filter(w => w.close_age_weeks - w.current_age_weeks > 4)

  const windowRow = (title: string) =>
    `<tr><td style="padding:4px 0 4px 12px;color:${text};font-size:14px;line-height:1.5">${title}</td></tr>`

  let windowsHtml = ''

  if (ageMonths > 0) {
    if (closing.length > 0) {
      windowsHtml += `
        <tr><td style="padding:16px 0 6px">
          <div style="background:${amberBg};border:1px solid ${amberBorder};border-radius:8px;padding:10px 14px">
            <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${amber}">Closing soon</p>
            <table width="100%" cellpadding="0" cellspacing="0">${closing.map(w => windowRow(w.title)).join('')}</table>
          </div>
        </td></tr>`
    }
    if (open.length > 0) {
      const shown = open.slice(0, 6)
      const more  = open.length - 6
      windowsHtml += `
        <tr><td style="padding:12px 0 0">
          <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${dimText}">Also open this month</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${shown.map(w => windowRow(w.title)).join('')}
            ${more > 0 ? `<tr><td style="padding:4px 0 4px 12px;color:${dimText};font-size:13px;font-style:italic">…and ${more} more in your dashboard</td></tr>` : ''}
          </table>
        </td></tr>`
    }
  }

  const headline = ageMonths === 0
    ? `Today is ${childName}'s expected due date.`
    : `${childName} turns ${ageMonths} month${ageMonths === 1 ? '' : 's'} old today.`

  const prebithWindowsHtml = windows.length > 0
    ? `<div style="margin-top:14px">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${dimText}">Ready when baby arrives</p>
        <table width="100%" cellpadding="0" cellspacing="0">${windows.map(w => windowRow(w.title)).join('')}</table>
       </div>`
    : ''

  const body = ageMonths === 0
    ? `<p style="margin:0 0 4px;font-size:15px;color:${text};line-height:1.6">Head to Scout to confirm your baby has arrived and unlock your personalised milestone plan.</p>${prebithWindowsHtml}`
    : `<p style="margin:0;font-size:15px;color:${text};line-height:1.6">Your Scout digest is in your inbox with everything open this month.</p>`

  const ctaLabel = ageMonths === 0 ? 'Confirm arrival in Scout' : 'Open Scout'

  return `<html><body>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;color:${text}">
  <div style="border-left:3px solid ${purple};padding-left:14px;margin-bottom:20px">
    <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${purple}">FamilyForce Scout</p>
    <h2 style="margin:0;font-size:20px;font-weight:700;color:${text};line-height:1.3">${headline}</h2>
  </div>
  ${body}
  <table width="100%" cellpadding="0" cellspacing="0">${windowsHtml}</table>
  <table cellpadding="0" cellspacing="0" style="margin-top:20px">
    <tr><td style="background:${purple};border-radius:8px;padding:10px 20px">
      <a href="${dashboardUrl}" style="color:#fff;font-size:14px;font-weight:600;text-decoration:none">${ctaLabel} &rarr;</a>
    </td></tr>
  </table>
  <p style="margin:20px 0 0;font-size:12px;color:${dimText}">FamilyForce &mdash; getfamilyforce.com</p>
</div>
</body></html>`
}

// ─── Build the SUMMARY (event title) ─────────────────────────────────────────
function buildSummary(childName: string, ageMonths: number): string {
  if (ageMonths === 0) return `${childName}'s due date \u2014 confirm arrival in Scout`
  if (ageMonths === 1) return `${childName} turns 1 month \u2014 Scout digest ready`
  return `${childName} turns ${ageMonths} months \u2014 Scout digest ready`
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function generateScoutIcs(options: GenerateIcsOptions): string {
  const {
    childId,
    childName,
    ageMonths,
    eventDate,
    windows,
    dashboardUrl,
    siteUrl,
  } = options

  // DTSTART = the monthly birthday (all-day)
  const dtStart = formatDate(eventDate)

  // DTEND = next day (RFC 5545: all-day DTEND is exclusive)
  const nextDay = new Date(eventDate)
  nextDay.setUTCDate(nextDay.getUTCDate() + 1)
  const dtEnd = formatDate(nextDay)

  // DTSTAMP = now (UTC, required by RFC 5545)
  const dtStamp = formatDateTime(new Date())

  // UID = stable, reproducible, unique per child per month
  const uid = `scout-${childId}-month${ageMonths}-${dtStart}@getfamilyforce.com`

  // Build descriptions
  const description     = buildDescription(childName, ageMonths, windows, dashboardUrl)
  const htmlDescription = buildHtmlDescription(childName, ageMonths, windows, dashboardUrl)
  const summary         = buildSummary(childName, ageMonths)

  // Assemble the .ics lines
  const rawLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//FamilyForce//Scout v1//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    // X-ALT-DESC: rich HTML for Apple Calendar + Outlook (ignored by Google Calendar)
    `X-ALT-DESC;FMTTYPE=text/html:${escapeText(htmlDescription)}`,
    `URL:${dashboardUrl}`,
    'TRANSP:TRANSPARENT',  // all-day, does not block time
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=FamilyForce Scout:mailto:scout@getfamilyforce.com`,
    // ─── VALARM: 7-day advance reminder ───────────────────────────
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`Heads up — one of ${childName}'s developmental windows closes in 7 days. Worth a quick look in Scout.`)}`,
    'TRIGGER:-P7D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  // Apply RFC 5545 line folding and join with CRLF
  return rawLines.map(foldLine).join('\r\n') + '\r\n'
}

// ─── Helper: next monthly birthday ───────────────────────────────────────────
// Returns the next date that matches the child's birth day of month.
// Handles short months: if birth day = 31 and month has 30 days, uses last day of month.
// Handles Feb 29 babies: uses Feb 28 in non-leap years.
export function nextMonthlyBirthday(dob: Date, fromDate: Date): Date {
  const birthDay = dob.getUTCDate()

  let year  = fromDate.getUTCFullYear()
  let month = fromDate.getUTCMonth()  // 0-indexed

  // Try the birth day this month first, then next month
  for (let attempt = 0; attempt < 24; attempt++) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    const day         = Math.min(birthDay, daysInMonth)
    const candidate   = new Date(Date.UTC(year, month, day))

    // Must be strictly after fromDate
    if (candidate > fromDate) return candidate

    // Advance one month
    month++
    if (month > 11) { month = 0; year++ }
  }

  // Fallback: should never reach here
  return new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, birthDay))
}

// ─── Helper: child age in weeks ──────────────────────────────────────────────
export function ageInWeeks(dob: Date, asOf: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  return Math.floor((asOf.getTime() - dob.getTime()) / msPerWeek)
}

// ─── Helper: child age in months (whole months) ──────────────────────────────
export function ageInMonths(dob: Date, asOf: Date): number {
  const months =
    (asOf.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
    (asOf.getUTCMonth() - dob.getUTCMonth())
  // Subtract 1 if the day of month hasn't been reached yet this month
  return asOf.getUTCDate() >= dob.getUTCDate() ? months : months - 1
}
