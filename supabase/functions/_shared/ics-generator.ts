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

// ─── Build the DESCRIPTION field ─────────────────────────────────────────────
function buildDescription(
  childName:    string,
  ageMonths:    number,
  windows:      IcsWindow[],
  dashboardUrl: string
): string {
  const closing = windows.filter(
    w => w.close_age_weeks - w.current_age_weeks <= 4
  )
  const checkIn = windows.filter(
    w => w.close_age_weeks - w.current_age_weeks > 4
  )

  const lines: string[] = []

  lines.push(`${childName}'s ${ageMonths}-month developmental windows`)
  lines.push('')

  if (closing.length > 0) {
    lines.push('\u26a0\ufe0f CLOSING SOON — act this month:')
    for (const w of closing) {
      const weeksLeft = w.close_age_weeks - w.current_age_weeks
      const label     = w.urgency === 'clinical' ? ' [important]' : ''
      lines.push(`  \u2022 ${w.title}${label} (${weeksLeft}w left)`)
    }
    lines.push('')
  }

  if (checkIn.length > 0) {
    lines.push('\u2705 CHECK IN THIS MONTH:')
    for (const w of checkIn.slice(0, 8)) {  // cap at 8 for readability
      lines.push(`  \u2022 ${w.title}`)
    }
    if (checkIn.length > 8) {
      lines.push(`  ...and ${checkIn.length - 8} more in your dashboard`)
    }
    lines.push('')
  }

  lines.push(`Open your Scout dashboard:`)
  lines.push(dashboardUrl)

  return lines.join('\n')
}

// ─── Build the SUMMARY (event title) ─────────────────────────────────────────
function buildSummary(childName: string, ageMonths: number): string {
  return `${childName}'s ${ageMonths}-month windows \u2014 act before today`
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

  // Build the description text
  const description = buildDescription(childName, ageMonths, windows, dashboardUrl)
  const summary     = buildSummary(childName, ageMonths)

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
    `URL:${dashboardUrl}`,
    'TRANSP:TRANSPARENT',  // all-day, does not block time
    'STATUS:CONFIRMED',
    `ORGANIZER;CN=FamilyForce Scout:mailto:scout@getfamilyforce.com`,
    // ─── VALARM: 7-day advance reminder ───────────────────────────
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`${childName}'s milestone windows close in 7 days. Open Scout to review.`)}`,
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
