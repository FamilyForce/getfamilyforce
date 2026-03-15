# Scout — Implementation Plan
**Owner:** FamilyForce
**Status:** Active
**Created:** March 14, 2026
**Last updated:** March 14, 2026 (v1.1 — added analytics stream, staged rollout, email deliverability, error monitoring, conversion flow spec, birthday edge cases, task owners, decision deadlines)

---

## How to Read This Plan

Work is split into five parallel streams:

- **Stream 1: Content** — writing the milestone windows (the biggest single task)
- **Stream 2: Database** — schema, tables, data population
- **Stream 3: Engineering** — edge functions, jobs, signup flow, error handling
- **Stream 4: Design** — email templates, gift page, dashboard UI
- **Stream 5: Analytics** — instrumentation, funnel tracking, monitoring

Each stream has an owner. Each phase has a gate: what must be true before moving forward.

---

## Team & Owners

| Stream | Owner | Notes |
|---|---|---|
| Stream 1: Content | jackhowdy | With AI assist. Pediatric consultant TBD. |
| Stream 2: Database | Engineer | Requires Stream 1 complete for 2E |
| Stream 3: Engineering | Engineer | Requires Stream 2A–2B before starting |
| Stream 4: Design | Designer / jackhowdy | Email templates can start immediately |
| Stream 5: Analytics | Engineer | Runs alongside Stream 3 |
| Open decisions | jackhowdy | All resolved before Week 1 ends |

---

## Open Decisions — Resolve Before Week 1 Ends

| Decision | Why it blocks | Owner | Needed by |
|---|---|---|---|
| Exact pricing: monthly and annual amounts | Trial-end email, paywall UI, gift page | jackhowdy | End of Week 1 |
| Content: write in-house or bring in a pediatric consultant? | Determines Stream 1 timeline | jackhowdy | End of Week 1 |
| Baby shower gift price — same as annual or gift-specific? | Gift page design and Stripe setup | jackhowdy | End of Week 1 |
| Pre-birth mode at launch or post-launch? | Affects signup flow scope in Stream 3 | jackhowdy | End of Week 1 |
| Top 3–5 selection logic — purely by priority score, or weight by urgency tier? | Digest generation logic in 3C/3D | jackhowdy | End of Week 2 |

---

## Stream 1: Content
*Longest lead-time work. Start immediately. Run in parallel with all other streams.*
**Owner: jackhowdy**

### 1A — Define the milestone set
- [ ] Audit existing `milestones.json` and `comprehensive-milestones.md` against the 197-window target
- [ ] Identify gaps — known missing: iron supplementation (4mo), 30-month well-child visit, sensory milestones
- [ ] Assign each window: category, urgency tier, open/peak/close age in weeks
- [ ] Set priority score (1–5) per window — drives the top 3–5 selection in the email

### 1B — Write every window entry
*Each of the 197 windows needs:*
- [ ] Title (plain language, no jargon)
- [ ] Why it matters (2–3 sentences, evidence-based, Jack's voice)
- [ ] What to do (1–3 specific steps)
- [ ] What not to worry about (one reassuring sentence)
- [ ] Missed-window guidance (tier-appropriate: advisory / screening / clinical)
- [ ] Source citation (AAP / CDC / WHO)
- [ ] Playbook link where applicable (free — potty, sleep, feeding, tantrum, screen time)

**Priority order:** birth–6 months first. Months 7–36 follow. Nothing ships until birth–6 months is complete and QA'd.

### 1C — Write the pre-birth window set *(if pre-birth mode ships at launch)*
- [ ] Safe sleep setup (36 weeks)
- [ ] Hospital bag / prep (37 weeks)
- [ ] First pediatrician selection (38 weeks)
- [ ] Newborn screening awareness (birth week)

### 1D — Write personalised subject line templates
- [ ] One template per month (month 1 through 36)
- [ ] Rule: subject = most urgent closing window for that month — never a generic digest label
- [ ] Examples: *"Oliver's peanut window closes in 14 days"* / *"3 things before Mia turns 6 months"*

### 1E — Write the trial-end email copy
- [ ] Subject line, preview text, full body, two CTAs (monthly / annual)
- [ ] Tone: warm, factual, no pressure — let the first month's value do the work
- [ ] One placeholder social proof line (replace with real testimonial when available)

---

## Stream 2: Database
*Pre-requisite for all engineering work.*
**Owner: Engineer**

### 2A — Create `milestone_windows` table *(blocks Stream 3)*
```sql
CREATE TABLE milestone_windows (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  category           TEXT NOT NULL,         -- nutrition/motor/language/cognitive/social/screening/safety
  urgency            TEXT NOT NULL,         -- advisory/screening/clinical
  open_age_weeks     INTEGER NOT NULL,
  peak_age_weeks     INTEGER,
  close_age_weeks    INTEGER NOT NULL,
  why_it_matters     TEXT NOT NULL,
  what_to_do         TEXT NOT NULL,
  what_not_to_worry  TEXT,
  missed_window      TEXT,
  source_citation    TEXT,
  playbook_link      TEXT,
  prenatal           BOOLEAN DEFAULT FALSE,
  active             BOOLEAN DEFAULT TRUE,
  priority           INTEGER DEFAULT 3,     -- 1=highest, 5=lowest
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
```

### 2B — Update `scout_subscriptions` and `children` tables *(blocks Stream 3)*
**Note:** `scout_subscriptions` already has the correct schema. No changes needed to status values or trial fields.
- The trial status is `'trialing'` (not `'free_trial'`). Do not rename — existing edge functions use `'trialing'`.
- `trial_end` is already a `timestamptz` column. Do not add a separate `trial_end_date`.
- All status values already exist: `trialing`, `active`, `cancelled`, `expired`, `past_due`.
- [x] `children.gender` constraint expanded to `('girl', 'boy', 'other', null)` — applied in `supabase-schema-scout-v2.sql`

### 2C — Create `scout_digest_log` table
```sql
CREATE TABLE scout_digest_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users,
  child_id          UUID,
  month             TEXT,                   -- YYYY-MM
  digest_type       TEXT,                   -- signup/monthly/alert/trial_end
  sent_at           TIMESTAMPTZ DEFAULT NOW(),
  windows_included  JSONB,                  -- array of window IDs
  email_subject     TEXT,
  resend_message_id TEXT                    -- for delivery tracking
);
```
*Purpose: deduplication, debugging, delivery confirmation, open-rate tracking.*

### 2D — Create `window_progress` table *(active track — Phase 3)*
```sql
CREATE TABLE window_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users,
  child_id    UUID,
  window_id   UUID REFERENCES milestone_windows(id),
  status      TEXT DEFAULT 'open',          -- open/in_progress/completed/skipped
  notes       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2E — Create `scout_events` table *(analytics — see Stream 5)*
```sql
CREATE TABLE scout_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users,
  child_id     UUID,
  event_type   TEXT NOT NULL,               -- see Stream 5 for event taxonomy
  properties   JSONB,
  occurred_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2F — Populate `milestone_windows` with content
- [ ] Import from Stream 1 output — CSV or direct SQL insert
- [ ] QA pass: verify age ranges, check for duplicates, confirm priority scores
- [ ] Must be complete (birth–6 months minimum) before any delivery job goes live

---

## Stream 3: Engineering
*Depends on 2A–2B being complete. Deploy to staging first, production second.*
**Owner: Engineer**

### 3A — Email deliverability setup *(must complete before sending any email)*
- [ ] Configure SPF record on `getfamilyforce.com` DNS
- [ ] Configure DKIM via Resend (add DKIM TXT record to DNS)
- [ ] Configure DMARC policy (`p=none` to start, monitor, tighten after 30 days)
- [ ] Configure Resend webhook: delivery, bounce, complaint, unsubscribe events → `scout_events` table
- [ ] Hard bounce handling: auto-suppress bounced addresses immediately (no retry)
- [ ] Complaint handling: auto-unsubscribe on spam complaint
- [ ] Domain warm-up plan: start at 20 emails/day, double every 3 days until full volume
- [ ] Verify unsubscribe link is present in every email template (legally required)
- [ ] Test deliverability via mail-tester.com before sending to real users

### 3B — Update signup flow
- [ ] Remove Stripe from signup — no credit card collected at signup
- [ ] Signup collects: child's first name, date of birth, gender (Boy / Girl / Prefer not to say) — all required
- [ ] Gender maps to pronouns in all email and dashboard copy: boy → he/him, girl → she/her, other/null → they/them
- [ ] On account creation: calculate child's next birthday → set as `trial_end` in `scout_subscriptions`
- [ ] Handle edge cases in birthday calculation (see 3D edge cases)
- [ ] Set `scout_subscriptions.status` = `trialing` on new account (existing enum value — do not change)
- [ ] Update success screen: *"Your first Scout digest is on its way"*
- [ ] Dashboard: trial banner — *"Free trial · ends [date]"*
- [ ] Dashboard: milestone count on first login — *"[Name] has X open windows right now"*
- [ ] Log `signup_completed` event to `scout_events` (include `child_gender` property)

### 3C — Build `.ics` generator utility
*Shared by all email jobs — build and test this before any job logic.*
- [ ] Input: child name, child age in months, event date (next birthday), list of window objects
- [ ] Output: valid `.ics` string, RFC 5545 compliant
- [ ] Event: all-day (DTSTART;VALUE=DATE), TRANSP:TRANSPARENT
- [ ] VALARM: TRIGGER:-P7D, ACTION:DISPLAY
- [ ] UID format: `scout-{child_id}-month{N}-{YYYYMMDD}@getfamilyforce.com`
- [ ] Description sections: ⚠️ CLOSING NOW + ✅ CHECK IN + dashboard link + next month teaser
- [ ] Line folding: fold at 75 chars with leading space on continuation (RFC 5545 requirement)
- [ ] Escape commas and semicolons in DESCRIPTION with backslash
- [ ] **Test matrix — must pass all before shipping:**
  - [ ] Apple Calendar (iOS)
  - [ ] Apple Calendar (macOS)
  - [ ] Google Calendar (web)
  - [ ] Google Calendar (Android)
  - [ ] Outlook (Windows)
  - [ ] Outlook (web)

### 3D — Build `scout-signup-delivery` edge function
- [ ] Trigger: Supabase webhook on new `scout_subscriptions` insert with status = `trialing`
- [ ] Logic:
  1. Calculate child's exact age in weeks
  2. Query `milestone_windows`: active windows where `open_age_weeks` ≤ age ≤ `close_age_weeks`
  3. Sort by priority, bucket into Ending Soon / Right Now / Upcoming
  4. Select top 3–5 above-the-fold (by priority score + urgency weighting per open decision)
  5. Generate digest email HTML
  6. Generate `.ics` for next birthday, listing closing windows
  7. Send via Resend with `.ics` attachment
  8. Log to `scout_digest_log` (digest_type = `signup`)
  9. Log `first_digest_sent` to `scout_events`
- [ ] Error handling: if Resend call fails, retry once after 60 seconds; log failure to `scout_events` with error detail; alert via Telegram if retry also fails

### 3E — Build `scout-digest` edge function *(paid subscribers)*
- [ ] Trigger: Supabase cron, daily at 08:00 UTC
- [ ] Logic:
  1. Query `scout_subscriptions` where status = `active`
  2. For each: check if today = child's birth day of month (see edge cases below)
  3. If yes: calculate age in weeks, query windows, bucket, select top 3–5
  4. Apply progress filter: exclude `completed` windows for active-track users
  5. Generate personalised subject line (most urgent closing window for this month)
  6. Generate email HTML + `.ics`
  7. Send via Resend; log to `scout_digest_log` and `scout_events`
- [ ] **Birthday edge cases — handle explicitly:**
  - Child born on the **29th, 30th, or 31st**: if current month doesn't have that date (e.g. Feb has no 29th in non-leap years), fire on the last day of the month instead
  - Child born on **February 29** (leap year): fire on Feb 28 in non-leap years
  - **Timezone**: cron fires at 08:00 UTC. Parents in UTC+8 (HKT) see this as 16:00 their time. Store user timezone at signup; check if "today in user's timezone" = birth day, not UTC date
  - **Duplicate guard**: check `scout_digest_log` — never send two digests of the same `digest_type` + `month` to the same child
- [ ] Error handling: same retry + alert pattern as 3D

### 3F — Build `scout-trial-end` edge function + conversion flow
*The most important moment in the product. Treat accordingly.*

**Trial-end email (fires on trial_end):**
- [ ] Trigger: Supabase cron, daily at 08:00 UTC
- [ ] Query: `scout_subscriptions` where status = `trialing` AND `trial_end` <= now() (in user's timezone)
- [ ] For each: send trial-end email (see 4B for template)
- [ ] Subject: *"[Child name]'s [N]-month milestone windows are ready"*
- [ ] Body: personalised — reference the child's name + what's opening next month
- [ ] Two CTAs: [Monthly — $X/month] and [Annual — $X/year · best value]
- [ ] Annual pre-selected / visually emphasised
- [ ] Log `trial_end_email_sent` to `scout_events`
- [ ] Do NOT send if user has already converted (check status before sending)

**Paywall (dashboard state):**
- [ ] When trial_end <= now() and status = `trialing`: blur next month's content
- [ ] Current month's content remains fully accessible — never remove content
- [ ] Paywall shows: pricing, two plan options, annual pre-selected, one social proof line
- [ ] Log `paywall_shown` to `scout_events`

**On payment:**
- [ ] Create Stripe subscription, update status to `active`
- [ ] Immediately trigger digest for next month (don't wait for cron)
- [ ] Log `trial_converted` to `scout_events` with plan type (monthly/annual)

**Conversion instrumentation (see Stream 5):**
- [ ] Track: trial_end_email_sent → email_opened → cta_clicked → plan_selected → payment_completed → subscription_active
- [ ] Every drop-off point is a potential optimisation

**Future variant (post-launch):**
- [ ] After 90 days, test a second trial-end email variant: different subject line, different pricing emphasis
- [ ] Compare conversion rate between variants

### 3G — Build `scout-alert` edge function
- [ ] Trigger: Supabase cron, daily at 08:00 UTC
- [ ] Logic: check if child's next birthday is exactly 7 days away (in user's timezone)
- [ ] If yes: send closing-window alert email — short and urgent, lists only windows closing in 7 days
- [ ] Duplicate guard: check `scout_digest_log` — don't send if already sent this window cycle
- [ ] Log `alert_sent` to `scout_events`
- [ ] Error handling: retry + alert pattern

### 3H — Build `scout-progress` edge function *(active track — Phase 3)*
- [ ] Trigger: called from dashboard on user action
- [ ] Upsert to `window_progress` with new status + optional notes
- [ ] Fire-and-forget (dashboard updates optimistically)
- [ ] Log `window_progress_updated` to `scout_events` with status value

### 3I — Update digest for active-track personalisation *(Phase 3)*
- [ ] Query `window_progress` for child before generating digest
- [ ] Exclude `completed` windows from above-the-fold selection and `.ics` description
- [ ] Add "what you've done this month" section to email (completed windows as ✅)
- [ ] Log personalisation applied (active vs passive track) to `scout_events`

### 3J — Implement paywall on dashboard *(depends on 3F)*
- [ ] Blurred content state when trial expired and not yet converted
- [ ] On payment success: Stripe → webhook → update status → trigger next month's digest immediately
- [ ] Log all paywall interactions to `scout_events`

### 3K — Error monitoring and alerting
- [ ] Supabase edge function error alerts: any uncaught exception → Telegram notification to jackhowdy
- [ ] Daily digest sanity check: cron at 09:00 UTC — count digests sent today; if count = 0 and active subscribers > 0, alert immediately
- [ ] Resend delivery failure rate: if bounce rate exceeds 2% in a 24-hour window, alert
- [ ] `scout_events` error log dashboard: simple query showing failed jobs by type and date
- [ ] All edge functions: log start, success, and failure to `scout_events` with duration

---

## Stream 4: Design & Templates
**Owner: Designer / jackhowdy**

### 4A — Digest email template
- [ ] HTML, responsive (600px desktop / 375px mobile)
- [ ] Sections: header (child name + age) → Ending Soon → Right Now → Upcoming → Don't Worry About This → Dashboard CTA → Calendar invite note → Jack's signature → footer
- [ ] Above-the-fold: 3–5 windows only, with urgency badges
- [ ] Below fold: "See all X windows in the app" link
- [ ] **Test matrix:**
  - [ ] Gmail (web, desktop)
  - [ ] Gmail (mobile, iOS + Android)
  - [ ] Apple Mail (iOS + macOS)
  - [ ] Outlook (Windows + web)
  - [ ] Dark mode rendering check

### 4B — Trial-end email template
- [ ] Single-focus: one message, two CTAs
- [ ] Monthly vs annual clearly shown, annual pre-selected visually
- [ ] Personalised first line referencing child's name and next month's content
- [ ] One social proof placeholder (replace at launch with real testimonial)
- [ ] Same test matrix as 4A

### 4C — Closing-window alert template
- [ ] Short, urgent — not a digest, an alarm
- [ ] Windows closing in 7 days + what to do
- [ ] Single CTA: open dashboard
- [ ] Must be scannable in 10 seconds on mobile

### 4D — Baby shower gift page
- [ ] Standalone page — no FamilyForce account required to purchase
- [ ] Hero: *"Give the gift of never missing a milestone"*
- [ ] Pricing: 1 year of Scout for one child (price TBD per open decisions)
- [ ] Purchase flow: Stripe checkout, buyer enters recipient's email
- [ ] On purchase: generate gift code → send gift email to recipient (beautiful design, not transactional)
- [ ] Redemption flow: recipient clicks link → creates account → enters child DOB → Scout activates immediately
- [ ] Buyer confirmation: thank-you email with their own referral code
- [ ] Conversion goal: define before building (e.g. "gift page visit → purchase > 8%")

### 4E — Scout Dashboard (Action Tracker)
*Full spec: `docs/scout-dashboard-spec.md` — read before building anything in this task.*

**Philosophy:** The dashboard is an action tracker, not a reference library. The email delivers information. The dashboard is where parents do something with it. Parents who never open the dashboard still get full email value. Parents who do open it get a progress tracker that personalises their future emails.

**Screens to build:**
- [ ] `/scout-dashboard` — Home: current month's windows, progress bar, child header
- [ ] `/scout-dashboard#window-[id]` — Window detail modal (slide-up mobile / centred desktop)
- [ ] `/scout-dashboard/history` — Past months accordion, searchable notes
- [ ] `/scout-dashboard/child` — Add / edit child profile
- [ ] `/scout-dashboard/settings` — Email prefs, subscription, account
- [ ] `/scout-dashboard/family` — Family Circle invite and management

**Window card (core UI unit):**
- [ ] Urgency badge (advisory grey / screening blue / clinical red-orange)
- [ ] Category badge
- [ ] Title + 15-word hook from `why_it_matters`
- [ ] Three-state action group: Done (green) / In Progress (amber) / Skip (muted)
- [ ] Note button: "Add note" → inline textarea, auto-save, 500 char limit
- [ ] Expand icon → opens Window Detail modal
- [ ] Card states: open / in-progress (amber left border) / done (muted, moves to Done section) / skipped / missed (clinical only, red-orange border)

**Home screen sections:**
- [ ] ⚠️ Closing soon — windows within 4 weeks of closing
- [ ] This month — active peak windows
- [ ] Coming up — opening in next 4–8 weeks (read-only preview)
- [ ] Done this month — collapsed accordion at bottom
- [ ] Welcome card on first login (replaces progress bar until first action)
- [ ] 2-column grid desktop, 1-column mobile

**Progress model:**
- [ ] State machine: open → in_progress / completed / skipped, all reversible
- [ ] `completed` windows excluded from above-fold in next digest email (fed to 3I)
- [ ] Progress bar: addressed (done + skipped) / total open windows this month
- [ ] Optimistic UI — update DOM immediately, confirm server-side in background

**Trial and paywall states:**
- [ ] Trial banner: "Free trial · ends [date] ([N] days) · Subscribe →" in `--terra-tint` strip
- [ ] Expired trial: current month stays fully accessible, "Coming up" replaced by paywall card
- [ ] Paywall card: blurred preview of top 2 next-month window titles, Annual CTA (filled, primary) + Monthly CTA (outlined, secondary), annual pre-selected
- [ ] Post-payment: paywall replaced immediately on Stripe webhook, one-time toast confirmation

**Design system:**
- [ ] All CSS tokens copied verbatim from `dashboard.html` — no new tokens
- [ ] New components to build once and reuse: progress bar, urgency/category badges, three-state action group, accordion, note textarea with auto-save, paywall blur card
- [ ] File: `scout-dashboard.html` + `assets/scout-dashboard.css` + `assets/scout-dashboard.js`
- [ ] Vanilla HTML/CSS/JS, zero dependencies — same as all existing FamilyForce pages
- [ ] Breakpoints: 900px (compact) and 480px (compact narrow) — same as production

**Accessibility and performance:**
- [ ] `aria-label` on all action buttons, `role="dialog"` on modal, `aria-pressed` on toggle states
- [ ] Focus trap inside modal, `inert` on background (existing pattern)
- [ ] IntersectionObserver lazy-render for window cards below fold
- [ ] Offline: cached `localStorage` state, queue progress updates, flush on reconnect

### 4F — Admin milestone editor *(post-launch — Supabase table editor is sufficient until needed)*
- [ ] Password-protected `/admin/milestones`
- [ ] Table view: all windows, sortable by category / urgency / age
- [ ] Edit modal: all fields editable, saves to `milestone_windows`
- [ ] Add new window button
- [ ] Active/inactive toggle (soft delete — never hard delete)

---

## Stream 5: Analytics
*Runs alongside Stream 3. Instrumentation is not optional — build it with the feature, not after.*
**Owner: Engineer**

### 5A — Define the activation metric
The single event that predicts a free trial user will convert to paid. Candidates:
- First email opened
- Dashboard opened after receiving first email
- Calendar event accepted (hard to track — use dashboard link click as proxy)
- Window marked as done (active track)

**Decision needed:** pick one activation metric before 3D ships. Everything in the funnel is measured relative to this event.

### 5B — Event taxonomy
Every meaningful user action logs to `scout_events`:

| Event | Trigger | Key properties |
|---|---|---|
| `signup_completed` | Account created | child_dob, child_age_weeks |
| `first_digest_sent` | 3D fires | child_age_months, windows_count |
| `email_delivered` | Resend webhook | email_type, resend_message_id |
| `email_opened` | Resend webhook | email_type, month_number |
| `email_clicked` | Resend webhook | email_type, link_target |
| `email_unsubscribed` | Resend webhook | email_type |
| `email_bounced` | Resend webhook | bounce_type (hard/soft) |
| `email_complained` | Resend webhook | — |
| `calendar_link_clicked` | Dashboard link | — (proxy for calendar accept) |
| `dashboard_opened` | Dashboard load | source (email/direct) |
| `paywall_shown` | Trial expired | days_since_signup |
| `trial_end_email_sent` | 3F fires | — |
| `trial_end_email_opened` | Resend webhook | — |
| `trial_cta_clicked` | Resend webhook | plan_type (monthly/annual) |
| `trial_converted` | Stripe webhook | plan_type, days_in_trial |
| `trial_churned` | 30 days post trial_end, not converted | — |
| `window_progress_updated` | 3H fires | status, urgency_tier |
| `gift_page_viewed` | Gift page load | — |
| `gift_purchased` | Stripe webhook | — |
| `gift_redeemed` | Redemption flow | — |
| `job_started` | Each edge function | job_type |
| `job_succeeded` | Each edge function | job_type, duration_ms |
| `job_failed` | Each edge function | job_type, error_message |

### 5C — Core funnels to track from day one

**Signup → Activation funnel:**
```
Account created
  → First digest sent (target: 100% — this should never fail)
  → Email delivered (target: >98%)
  → Email opened (target: >55%)
  → Dashboard opened (target: >30%)
  → [Activation event] (target: TBD)
```

**Trial → Paid conversion funnel:**
```
Trial end reached
  → Trial-end email sent (target: 100%)
  → Trial-end email opened (target: >50%)
  → CTA clicked (target: >30% of openers)
  → Payment completed (target: >60% of CTA clickers)
  → Overall trial-to-paid: target >40%
```

**Monthly engagement funnel (paid subscribers):**
```
Monthly digest sent
  → Email delivered
  → Email opened (target: >55%)
  → Dashboard opened (target: >25% of openers)
  → Window actioned — active track only (target: >1 action per opener)
```

### 5D — Minimum viable reporting
- [ ] Simple SQL queries against `scout_events` for each funnel above — run weekly
- [ ] No external analytics tool required at launch (Supabase SQL is sufficient)
- [ ] Add Resend webhook handler: delivery / open / click / bounce / complaint events → `scout_events`
- [ ] Monthly review: pull funnel metrics, identify biggest drop-off point, address in next sprint

---

## Staged Rollout Plan
*Nothing goes from 0% to 100% in one step.*

### Stage 1 — Internal / Friends & Family (Week 4)
- 20–30 hand-picked parents: personal network, beta testers
- All subscriptions free (gift codes)
- Goal: validate end-to-end delivery, `.ics` compatibility across devices, email rendering
- Exit criteria: zero `.ics` errors reported, email open rate >40%, no critical bugs

### Stage 2 — Soft Launch (Week 5–6)
- Open signups but no paid marketing
- Goal: validate trial-end conversion flow with real payment intent
- 50–100 users
- Exit criteria: trial-to-paid conversion >25% (below target but directionally positive), email deliverability score >90, no job failures

### Stage 3 — Full Launch (Week 7+)
- Paid acquisition, gift page promoted, KOL outreach
- All instrumentation live and confirmed working before this stage
- Exit criteria for Stage 2 must be met

---

## Launch Gate: What Must Be True Before Going Live

**Non-negotiable (blocks Stage 1):**
- [ ] 2A–2F: database ready; birth–6 months content populated and QA'd
- [ ] 3A: email deliverability configured (SPF / DKIM / DMARC / warm-up plan)
- [ ] 3B: signup flow updated (no CC), trial_end logic correct
- [ ] 3C: `.ics` generator passes all 6 calendar client tests
- [ ] 3D: signup delivery job live and tested
- [ ] 3E: monthly digest job live and tested
- [ ] 3F: trial-end job + conversion flow live and tested
- [ ] 3G: closing-window alert job live
- [ ] 3K: error monitoring and alerting live
- [ ] 4A–4C: all three email templates designed and tested across clients
- [ ] 5B–5C: event logging live and funnel queries confirmed working

**Required before Stage 3 (full launch):**
- [ ] 4D: baby shower gift page live
- [ ] Stage 1 + Stage 2 exit criteria met
- [ ] Activation metric defined and being tracked (5A)

**Can ship after full launch:**
- [ ] 3H–3I + 4E: active track (progress logging and personalisation)
- [ ] 4F: admin milestone editor
- [ ] Pre-birth mode (spec section 4.4)
- [ ] Family Circle onboarding prompt (surface invite during signup, not just from settings)
- [ ] Referral cashback program
- [ ] Trial-end email variant test

---

## Suggested Order of Attack

**Week 1 — Decisions + foundations:**
- Resolve all five open decisions (jackhowdy)
- Start content writing: birth–6 months (jackhowdy)
- Database schema: 2A–2E (engineer)
- Email deliverability setup: 3A (engineer) — must be done before any email sends

**Week 2 — Build the core:**
- `.ics` generator: 3C — build and test against all 6 calendar clients
- Email templates: 4A–4C — design and test across all email clients
- Analytics event taxonomy: 5B — define and wire up Resend webhook handler

**Week 3 — Wire it together:**
- Signup flow update: 3B
- Signup delivery job: 3D
- Trial-end job + conversion flow: 3F (highest priority engineering task)
- Error monitoring: 3K
- Funnel queries: 5C–5D

**Week 4 — Stage 1 rollout:**
- Monthly digest job: 3E
- Closing-window alert: 3G
- Stage 1 internal launch: 20–30 gift code accounts
- Observe, fix bugs, validate `.ics` across real devices

**Week 5–6 — Stage 2 + gift page:**
- Baby shower gift page: 4D
- Stage 2 soft launch: open signups, no paid marketing
- Monitor trial-end conversion funnel closely

**Week 7+ — Full launch:**
- Paid acquisition, KOL outreach, gift page promotion
- Begin active track development (Phase 3)
- First trial-end email variant test planned (90 days post-launch)

---

## Critical Path

**Content is the critical path.** All engineering can be built while milestone windows are being written — but nothing ships until birth–6 months content is complete, imported, and QA'd.

**Email deliverability is the pre-launch gate.** SPF / DKIM / DMARC must be configured and the domain warm-up plan started before a single email is sent. A deliverability problem on launch day is a potentially fatal product event.

**Trial-end conversion is the most important product moment.** It gets the most engineering scrutiny, the most design attention, and the most instrumentation. If the funnel data after Stage 2 shows conversion below 25%, stop and fix it before Stage 3.

---

*This document is a living plan. Update as tasks complete, decisions are made, and metrics come in.*

---

## v1.1 Backlog

*Items deliberately deferred from v1 launch. Do not start until Stage 3 is live and stable, and at least 4 weeks of post-launch data exists. Priority order within each section is top-down.*

---

### Content (Stream 1)

**Sleep windows — 8 to 10 windows**
The original `milestones.json` included sleep-specific windows not yet written as Scout content. Sleep is covered at launch via the Sleep Training Playbook link, which is sufficient for v1. The full window set should be written and imported in v1.1.

Estimated windows:
* Sleep environment setup (birth to 4 months)
* Establishing a sleep schedule (6 to 12 weeks)
* Swaddle transition timing (already cross-referenced in motor and safety — expand the sleep entry)
* Night waking expectations by age (2, 4, 6, 9, 12 months)
* Sleep regression periods (4 months, 8 to 10 months, 18 months)
* Dropping the third nap (6 to 8 months)
* Dropping the second nap (15 to 18 months)
* Nap to quiet time transition (3 years)

Action: write 8 to 10 sleep windows using the same format as `scout-content-priority1.md`, assign priority scores, add to `milestone_windows` via a v1.1 import.

---

**Sensory milestone windows — estimated 6 to 8 windows**
Sensory development (tactile, vestibular, proprioceptive, auditory, visual integration) is a meaningful gap in the current content set. Ages 0 to 24 months have the most relevant windows.

Candidates:
* Tactile tolerance (textures, messy play) — 6 to 18 months
* Vestibular development (spinning, swinging) — 6 to 18 months
* Proprioceptive awareness (body position sense) — 12 to 24 months
* Auditory discrimination (recognising familiar vs unfamiliar sounds) — 0 to 6 months
* Visual motor integration (eye-hand coordination for reaching and later drawing) — 4 to 24 months

Action: define windows in the milestone set, write content, assign to a new `sensory` category or distribute across existing categories.

---

**Post-v1 age windows — 5 windows (ages 6 to 10 years)**
Five windows were defined but excluded from v1 scope:
* `cognitive-conservation` — conservation concept (ages 5 to 7)
* `cognitive-logical-reasoning` — logical reasoning, multiple perspectives (ages 7 to 10)
* Three additional windows pending definition

These are out of scope for Scout v1 (birth to 3 years). Revisit if Scout expands to cover preschool and early school age.

---

**30-month well-child visit — screening content**
The 30-month visit content was written but the screening window details can be expanded. Review after v1 launch to confirm coverage matches current AAP Bright Futures guidance.

---

### Engineering (Stream 3)

**Active track — progress logging and personalisation**
Tasks 3H and 3I: `scout-progress` edge function and personalised digest generation based on `window_progress` status. Dashboard progress controls are in scope for v1 (UI only, storing to DB), but the email personalisation that uses those records is deferred.

Prerequisite: at least 30 days of post-launch data to understand how many users actually engage with progress tracking before building the personalisation layer.

---

**Pre-birth mode**
Signup flow for parents who sign up before the baby arrives (negative-week windows, pre-birth digest, trial starts at birth). Decision was pending at v1. Revisit after launch based on signup data — if a meaningful percentage of signups are pre-birth (expected: yes, via baby shower gift flow), prioritise this.

---

**Trial-end email A/B variant**
Second variant of the trial-end email to test after 90 days of data. Different subject line framing, different pricing emphasis. Run as a 50/50 split, measure conversion rate over 30 days, keep the winner.

---

**Family Circle onboarding prompt**
Surface the Family Circle invite as an explicit step during the signup flow (currently accessible from the dashboard only). Add as a post-signup screen: "Invite your partner to Scout — they will see the same windows and can mark things done."

---

**Referral cashback program**
Existing Supabase schema (`supabase-schema-referrals.sql`) is already in the codebase. Wire referral codes into the Scout subscription flow. Details TBD — defer until trial-to-paid conversion is validated and predictable.

---

### Design (Stream 4)

**Admin milestone editor (task 4F)**
Password-protected `/admin/milestones` for editing `milestone_windows` content without a code deploy. Supabase table editor is a sufficient workaround until content edit frequency justifies a custom UI.

---

**Dashboard personalisation indicators**
Visual indicators on window cards showing what the email selected for this month's digest vs what was available. Helps parents understand why they saw certain windows in their email. Low priority — add only if user research surfaces confusion about the selection logic.

---

### Analytics (Stream 5)

**Activation metric definition (task 5A)**
Must be decided before v1.1 work begins. Candidates: first email opened, dashboard opened after receiving first email, window marked as done. Pick one, track against it from v1 launch, confirm or revise at the 4-week review.

---

### Content QA

**Pediatric consultant review**
If in-house content is used at launch (no consultant), schedule a formal review pass with a pediatrician or developmental specialist at v1.1. Focus on priority-1 clinical windows first. This is a quality gate, not a blocker — the content is research-cited and sourced to AAP/CDC/WHO throughout.

---

*v1.1 target: 60 to 90 days post-launch. Do not start earlier. Build on validated data, not assumptions.*
