# Scout — Sample Calendar Invite: 4-Month Birthday
**Template for:** Monthly `.ics` calendar event attached to the 3-month digest email
**Created:** March 14, 2026
**Child used in example:** Oliver (born January 14, 2026)
**Event date:** April 14, 2026 (4-month birthday)
**7-day alarm fires:** April 7, 2026

---

## The `.ics` File

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Scout by FamilyForce//EN
CALSCALE:GREGORIAN
METHOD:REQUEST

BEGIN:VEVENT
UID:scout-oliver-month4-20260414@getfamilyforce.com
DTSTART;VALUE=DATE:20260414
DTEND;VALUE=DATE:20260415
SUMMARY:Oliver's 4-month windows — act before today
DESCRIPTION:Oliver turns 4 months today. These are the developmental
 windows closing at this milestone.\n\n
 ⚠️ CLOSING NOW\n
 • Bottle introduction — breastfed babies who haven't tried a bottle
 by 4 months often refuse one entirely. Last chance for flexibility.\n
 • Swaddling — if Oliver is showing any signs of rolling\, stop
 swaddling now. A swaddled baby who rolls is a safety risk.\n\n
 ✅ CHECK IN\n
 • Tummy time — is he reaching 20 minutes a day? Month 4 is the
 baseline. Month 5 he needs it to push up.\n
 • Social smiling — is he smiling back at you responsively? If not\,
 mention it at your next pediatrician visit.\n\n
 📱 Full details + progress tracking:\n
 https://getfamilyforce.com/dashboard\n\n
 Next digest arrives May 14 — the sleep regression and solid food
 prep window open this month.
STATUS:CONFIRMED
TRANSP:TRANSPARENT
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Oliver's 4-month development windows close in 7 days
END:VALARM
END:VEVENT

END:VCALENDAR
```

---

## How It Renders

### April 7 — alarm fires (lock screen notification)

> 🔔 **Reminder**
> *Oliver's 4-month windows — act before today*
> **In 7 days · April 14**

---

### April 14 — the day (calendar grid view)

```
┌─────────────────────────────────────────────┐
│  April 14                                   │
├─────────────────────────────────────────────┤
│                                             │
│  📅  Oliver's 4-month windows               │
│      — act before today                     │
│      All day                                │
│                                             │
└─────────────────────────────────────────────┘
```

### April 14 — tapping the event opens

```
Oliver's 4-month windows — act before today

Oliver turns 4 months today. These are the
developmental windows closing at this milestone.

⚠️ CLOSING NOW

• Bottle introduction — breastfed babies who
  haven't tried a bottle by 4 months often refuse
  one entirely. Last chance for flexibility.

• Swaddling — if Oliver is showing any signs of
  rolling, stop swaddling now. A swaddled baby
  who rolls is a safety risk.

✅ CHECK IN

• Tummy time — is he reaching 20 minutes a day?
  Month 4 is the baseline. Month 5 he needs it
  to push up.

• Social smiling — is he smiling back at you
  responsively? If not, mention it at your next
  pediatrician visit.

📱 Full details: getfamilyforce.com/dashboard

Next digest arrives May 14 — the sleep regression
and solid food prep window open this month.
```

---

## Design Notes

- **One event per month** — not one per milestone. Total events = number of months subscribed (~36 for birth–3 years).
- **Event placed on the birthday** — the deadline, not the send date. The alarm on day -7 is the action trigger.
- **TRANSP:TRANSPARENT** — event shows as all-day banner, not a busy block. Doesn't interfere with the parent's work calendar.
- **Title: "act before today"** — communicates urgency at a glance in the calendar grid. Generic titles get ignored.
- **Active track personalisation:** if the parent has marked windows as completed in the app, those windows are removed from the ⚠️ CLOSING NOW section. Only unaddressed windows appear.
- **UID format:** `scout-{child_id}-month{N}-{YYYYMMDD}@getfamilyforce.com` — ensures deduplication if the invite is sent more than once.

---

## Compatibility Notes

Test every `.ics` change against:
- Apple Calendar (iOS + macOS)
- Google Calendar (web + Android)
- Outlook (Windows + web)

Calendar clients are inconsistent with DESCRIPTION line breaks. Use `\n` for line breaks within the DESCRIPTION field. Escape commas with `\,`. Keep lines under 75 characters (fold long lines with a leading space on continuation lines — RFC 5545 requirement).
