# Scout — Product Specification
**Version:** 1.0  
**Owner:** FamilyForce  
**Status:** Active development  
**Last updated:** March 14, 2026 (v1.4 — monthly calendar event model, free trial logic, no-CC signup, monthly + annual pricing, baby shower gift prioritised, playbook integration, active track retained)

---

## 1. Product Vision

Scout is a 12-month developmental guidance subscription for parents. It tracks every developmental window for a child from birth to age 10 and proactively delivers the right information at the right time — through email and calendar invites — so parents never miss a critical window.

**The core promise:** You don't need to remember anything. Scout remembers for you.

**The key insight:** Most parenting resources tell parents what milestones exist. Scout tells parents which milestones are open *right now* for their specific child — and warns them before any window closes.

---

## 2. Target Users

### Primary: Overwhelmed parent of infant (0–12 months)
- Sleep-deprived, time-poor, high anxiety about doing the right thing
- Not opening apps — but does check email and calendar
- Needs reassurance and specificity, not information volume
- Willing to pay for something that removes cognitive load

### Secondary: Planning parent (expecting or 0–3 months)
- In research mode, building their "system" before or early after birth
- Wants to understand the full first-year roadmap
- Will engage actively with the app if it gives them structure
- High word-of-mouth potential — will share things that help them feel prepared

### Tertiary: KOL / community parent
- Shares products with their network
- Needs a "wow moment" that's screenshottable or quotable
- Calendar invite mechanic is novel and shareable
- Completion milestones give ongoing content

---

## 3. Core Product Mechanics

### 3.1 Delivery Model

Scout operates on two tracks simultaneously:

**Passive track (default for all subscribers)**
- Monthly email digest: personalised to child's exact age, sent on the child's birthday each month (e.g. born March 14 → digest arrives the 14th of every month)
- One calendar event per month: a single `.ics` event placed on the child's next birthday, listing all developmental windows closing that month — with a 7-day alarm built in so parents are reminded before the window closes
- Closing-window alert email: sent 7 days before each monthly birthday as a companion to the calendar alarm
- No app required — everything delivered to tools parents already use

**Active track (optional, for engaged parents)**
- Dashboard: view all open, upcoming, and completed windows
- Progress logging: mark windows as addressed, in progress, or skipped
- Tailored delivery: email and calendar content updates based on logged progress
- Notes: freeform notes per window (e.g., "introduced peanuts March 14, no reaction")

The product serves both tracks. Passive parents get significant value. Active parents get a personalised system.

### 3.2 The Window Model

Every developmental milestone has:
- **Open age:** when the window becomes relevant (in weeks)
- **Peak age:** optimal action point
- **Close age:** when the window is no longer primary (though not always urgent)
- **Category:** nutrition, motor, language, cognitive, social, screening, safety
- **Urgency:** advisory / screening / clinical flag (see definitions below)
- **Missed-window protocol:** what to do if the window closes unaddressed (see Section 7)

#### Urgency tier definitions

**Advisory** — General guidance with a recommended optimal window, but missing it is not a medical concern. The action can still be taken after the window closes, just less optimally.
> *Examples: introducing texture variety by 12 months; reading aloud daily from birth; offering a sippy cup by 9 months.*

**Screening** — A medical or developmental check that should happen within a defined age range. Missing it means a potential issue goes undetected — the action is to schedule it or raise it with a pediatrician.
> *Examples: newborn hearing screen (birth week); M-CHAT developmental screen (18 months); vision check (3 years); dental visit (first tooth).*

**Clinical** — Absence of an expected developmental milestone that warrants a pediatrician conversation. Scout does not diagnose; it flags. Missing a clinical window means something may need professional evaluation, not that something is definitely wrong.
> *Examples: no babbling by 12 months; no walking by 18 months; no two-word phrases by 24 months.*

### 3.3 Calendar Invite Mechanics

Delivery via `.ics` file attachment in email. No OAuth or permissions required.

**One calendar event per month — not one per milestone.**

Each month's digest email includes a single `.ics` file. The event is placed on the child's next birthday (the start of the following month) and lists all developmental windows closing that month. The total number of calendar events across the subscription is approximately equal to the number of months subscribed — not 197.

**Monthly calendar event format:**
- Title: "[Child name]'s development windows — [Month] [Year]"
- Description: all windows closing before the child's next birthday, grouped by category
- Date: child's next birthday (e.g. born Jan 2 → event on April 2, May 2, June 2, etc.)
- Duration: all-day event
- Alarm: **7-day reminder built into the `.ics` file** — fires 7 days before the birthday, prompting the parent to check on open windows before they close

**Example (child born Jan 2, signed up March 14):**
- First email sent: March 14 (signup day)
- First calendar event: placed on April 2 (3-month birthday), listing all windows closing before May 2
- 7-day alarm fires: March 26 (7 days before April 2)
- Second calendar event: placed on May 2, listing windows closing before June 2
- And so on, one event per month

**At signup:** The first email digest and first calendar invite are sent immediately on the day of signup, regardless of where the parent is in the monthly cycle. The calendar event is placed on the *next* birthday — not today.

---

## 4. User Flow

### 4.1 Signup (new subscriber)

**No credit card required to sign up.** The parent gets full access to Scout immediately. The free trial runs until the child's next birthday — at which point Scout emails them and asks them to subscribe to continue.

```
Sign up → Enter email + create account (no payment)
         ↓
         Enter child name + DOB + sex
         ↓
         "Emma has [X] developmental windows open right now,
          and [Y] closing before she turns [N] months on [date]."
         [show count broken down by category]
         ↓
         Success: first email digest + calendar invite sent immediately
         ↓
         → Dashboard (shows current windows, trial end date)
```

**First communication (sent immediately on signup day):**
- Email digest: all currently-open windows for the child's exact age, bucketed into Ending soon / Right now / Upcoming
- Calendar invite (`.ics`): one event placed on the child's next birthday, listing all windows closing before the birthday after that — with a 7-day alarm

**Example — child born Jan 2, 2026. Parent signs up March 14, 2026.**
- Child is ~10 weeks / ~2.5 months old
- First email sent: March 14 — showing all currently-open windows
- First calendar event: placed on **April 2** (3-month birthday), listing all windows closing before May 2
- 7-day alarm fires: March 26
- Free trial ends: **April 2** (the child's next birthday)
- On April 2: Scout emails the parent — "Emma's next month is ready. Subscribe to see the milestones closing before May 2."

**Free trial end email (sent on the birthday that ends the trial):**
> Subject: "Emma's 3-month milestone windows are ready"
> "Your free month with Scout is complete. Emma's next developmental windows — closing before she turns 4 months on May 2 — are ready. Subscribe to keep getting Scout."
> [Start monthly — $X/month] [Start annual — $X/year (best value)]

The trial length varies naturally based on when the parent signs up relative to the child's birthday. A parent who signs up the day before the birthday gets ~1 day free; a parent who signs up the day after gets ~30 days free. This is intentional — the product proves its value with the first delivery, and the trial end is tied to a natural milestone moment (the next birthday) rather than an arbitrary countdown.

**Gift code redemption:** Skip the payment screen; proceed directly to dashboard. Gift duration determines when (if ever) the paywall appears.

### 4.2 Monthly rhythm (paid subscribers)

```
Birthday day of each month (e.g. the 2nd):
  → Email digest sent
  → .ics calendar event attached: placed on next birthday, listing all closing windows + 7-day alarm
  → Dashboard updated with new windows

7 days before next birthday:
  → Closing-window alert email sent (passive + active users)
  → Calendar alarm fires independently (no action needed)

End of month (active users only):
  → Any unaddressed closed windows trigger missed-window protocol (see Section 7)
  → Passive users: no missed-window communication
```

### 4.3 Free trial → paid conversion

```
On the child's first birthday after signup:
  → If not yet subscribed:
      → Send trial-end email: "Emma's next month is ready. Subscribe to continue."
      → Dashboard shows paywall for next month's content
      → Current month's content remains visible (no content removal)
  → If already subscribed:
      → Normal monthly digest as above
```

The dashboard makes it easy to subscribe at any point during the trial — the paywall is visible but not aggressive. The trial-end email is the conversion moment.

### 4.4 Pre-birth mode (expecting parents)

For parents who sign up before their due date:
- Enter due date instead of DOB
- Receive "preparation windows" during pregnancy:
  - Safe sleep setup (36 weeks)
  - Hospital bag checklist (37 weeks)
  - First pediatrician visit scheduling (38 weeks)
  - Newborn screening awareness (birth week)
- Full developmental windows activate at birth (DOB entered or due date reached)

---

## 5. Content Architecture

### 5.1 Window categories and volume (estimated)

| Category | Windows | Notes |
|---|---|---|
| Nutrition | 35 | Peanut intro, solids, textures, self-feeding |
| Motor | 28 | Tummy time, crawling, walking, fine motor |
| Language | 42 | Babbling, first words, sentences, reading aloud |
| Cognitive | 31 | Object permanence, problem solving, play types |
| Social/Emotional | 27 | Attachment, stranger anxiety, empathy |
| Screening | 18 | Vision, hearing, developmental, dental |
| Safety | 16 | Car seat transitions, sleep safety, poison control |
| **Total** | **197** | |

### 5.2 Content per window

Each window entry contains:
- Title (plain language, no jargon)
- Why it matters (2–3 sentences, evidence-based)
- What to do (specific, actionable, 1–3 steps)
- What not to worry about (normalises variation)
- Sources (AAP / CDC / WHO citation)
- Urgency tier (advisory / screening / clinical)
- Missed-window guidance (pre-written for all windows)
- **Playbook link (optional):** where a FamilyForce Playbook covers the topic in depth, include a free link — e.g. the sleep training windows link to the Sleep Training Playbook; potty training windows link to the Potty Training Playbook. All playbooks are free. This is informational, not an upsell.

### 5.3 Email digest format

**Subject line:** "[Child name]'s Scout digest — [Month Year]"

**Structure:**
1. Header: child name + current age
2. **"Ending soon"** — windows closing within 30 days (highest urgency, shown first)
3. **"Right now"** — all windows currently open for this child's exact age
4. **"Upcoming"** — windows opening in the next 30–60 days
5. Calendar invite attachment (.ics) — summarises all sections above
6. Footer: "Questions? Reply to this email."

All windows in the active time range are included — no artificial cap. If 10 milestones are open at month 1, all 10 appear. The calendar event is the summary; the email is the full picture.

Total reading time target: under 5 minutes.

---

## 6. Family Circle Integration

### 6.1 Subscription model

**Scout is priced per child.** One subscription = one child. A family with 3 children needs 3 subscriptions.

Each child has their own dedicated subscription, their own monthly digest, and their own calendar invite. Digests are sent separately — one email per child per month.

**Pricing (exact amounts TBD — indicative):**

| Plan | Price | Notes |
|---|---|---|
| Monthly | ~$9.99/month | Full access, cancel anytime |
| Annual | ~$79.99/year | ~33% savings vs monthly; pre-selected at checkout |
| 2nd child onward | Discounted rate | Exact % TBD |

Both options presented at conversion. Annual pre-selected as "Best value." No credit card required for the free trial — payment details collected only at the trial-end paywall.

**Adding a second child:** One-click "Add another child" from the dashboard. Creates a new Stripe subscription at the discounted rate. No separate checkout flow.

Family Circle members (partner, grandparents, nanny) can view any child they have been granted access to, at no extra charge. The subscription belongs to the parent who paid; circle access is an add-on layer.

### 6.2 Family Circle access mechanics

A parent invites their partner, parents, nanny — everyone in their circle sees the same child's windows and digest.

### 6.3 Onboarding flow (first-class step)

After payment success:
```
Step 1: Your child is set up ✓
Step 2: Invite your partner (send link or enter email)
Step 3: Your first digest arrives [date]
```

Step 2 is not optional-looking. It is presented as part of the setup sequence.

### 6.4 Why this matters

- Each invited family member is a FamilyForce account
- Each account is a potential Playbook buyer
- Word of mouth is built into the product architecture
- Track "families with 2+ members" as a core growth metric

---

## 7. Missed-Window Protocol

### Who this applies to

**Active track users only.** Missed-window communications are only sent to parents who have logged progress in the app. If a window closes and the parent has marked it as completed or skipped, no alert is sent. If a window closes and the parent has logged progress but not completed it, Scout follows the protocol below.

**Passive track users:** Scout has no visibility into whether a passive parent acted on a window. No missed-window communication is sent. Scout does not assume a window was missed — it simply cannot know.

### Principle
Windows close, not children. Missing a window is not a failure — it is common and normal. Scout's response to a missed window must always be forward-facing, non-judgmental, and specific.

### Response by urgency tier

**Advisory windows** (e.g., introducing texture variety by 12 months)
> "The optimal window has passed, but this is still worth doing. Here's how to approach it now."
Action: adjusted guidance for the child's current age. No alarm.

**Screening windows** (e.g., speech screening at 18 months)
> "This screening window has closed. Bring it up at your next pediatrician visit — here are the exact words to use."
Action: provide a 1–2 sentence script for the pediatrician conversation. Remove friction.

**Clinical flags** (e.g., no walking by 18 months)
> "We recommend discussing this with your pediatrician at your next visit."
Action: escalate cleanly, no hedging, no diagnosis, no alarm beyond what's warranted. Scout is not a diagnostic tool.

### Tone

Never: "You missed this."  
Always: "Here's what's next."

Missed-window email subject: "[Child name] — a quick note on [window name]"  
Not: "You missed [window name]"

---

## 8. Technical Architecture

### 8.1 Data model

**`children` table** (exists)
- user_id, name, dob, gender, created_at

**`scout_subscriptions` table** (exists — update needed)
- user_id, status (`free_trial` / `active` / `cancelled`), trial_end_date (= child's first birthday after signup), period_end, stripe_customer_id, stripe_sub_id
- `trial_end_date` is set at account creation to the child's next birthday; no Stripe record created until the parent subscribes

**`scout_digest_log` table** (to build)
- user_id, child_id, month (YYYY-MM), sent_at, windows_included (JSON array of window IDs)
- Purpose: deduplication, open tracking, support queries

**`window_progress` table** (to build)
- user_id, child_id, window_id, status (open / in_progress / completed / skipped), notes, updated_at
- Purpose: active track progress, personalises digest content

### 8.2 Signup delivery job

**Trigger:** Fires immediately when a new Scout account is created (webhook from account creation).

**Logic:**
1. Calculate child's exact age in weeks as of today
2. Query milestone data, bucketed into three groups (Ending soon / Right now / Upcoming)
3. Generate first email digest
4. Generate one `.ics` calendar event placed on the child's *next* birthday (e.g. child born Jan 2, signup March 14 → event on April 2), listing all windows closing before the birthday after that. Include a 7-day alarm.
5. Send both via Resend immediately
6. Log signup delivery to `scout_digest_log`
7. Store `trial_end_date` = child's next birthday

### 8.3 Monthly digest job

**Trigger:** Supabase scheduled function, runs daily at 8:00 AM UTC. Checks each *paid* subscription and sends a digest if today's date matches the child's birth day of the month.

**Logic:**
1. Query all paid Scout subscriptions (status = active)
2. For each: check if today matches birth day of month
3. Calculate child's exact age in weeks
4. Query milestone data: Ending soon / Right now / Upcoming buckets
5. Apply progress filter: exclude completed windows for active-track users
6. Generate personalised email HTML
7. Generate one `.ics` event placed on the *next* birthday, listing all windows closing in the coming month. Include 7-day alarm.
8. Send via Resend with `.ics` attachment
9. Log to `scout_digest_log`

### 8.4 Trial-end job

**Trigger:** Runs daily. Checks all accounts where `trial_end_date` = today and status = free (not yet subscribed).

**Logic:**
1. Send trial-end email:
   - Subject: "[Child name]'s [N]-month milestone windows are ready"
   - Body: "Your free month with Scout is complete. [Child name]'s next developmental windows are ready. Subscribe to continue."
   - Two CTAs: [Monthly — $X/month] and [Annual — $X/year (best value)]
2. Dashboard shows paywall for next month's content (current month remains accessible)
3. Do not delete or hide the first month's content

### 8.5 Closing-window alert job

Separate scheduled function, runs daily at 8:00 AM UTC. Fires 7 days before the child's next birthday for all users (free trial and paid). Sends a reminder email listing all windows closing in the next 7 days. This is a companion to the calendar alarm — both fire on the same day.

### 8.6 Missed-window job

Runs daily. Checks active-track users only (those with `window_progress` records). If a window has closed and the user has not logged it as completed or skipped, triggers the missed-window protocol (Section 7). Does not fire for passive-track users.

### 8.7 Edge functions (current and planned)

| Function | Status | Purpose |
|---|---|---|
| `scout-subscribe` | Live | Stripe subscription creation |
| `stripe-webhook` | Live | Subscription lifecycle sync + renewal email |
| `scout-signup-delivery` | To build | First email + calendar invite on account creation |
| `scout-digest` | To build | Monthly email + calendar invite (paid subscribers) |
| `scout-trial-end` | To build | Trial-end email + paywall trigger |
| `scout-alert` | To build | Closing-window 7-day alert emails |
| `scout-progress` | To build | Log window progress from dashboard |

### 8.8 Email infrastructure

Provider: Resend  
From: `Scout by FamilyForce <scout@getfamilyforce.com>`  
BCC on all transactional: `support@getfamilyforce.com`  
Calendar attachment: `.ics` generated inline (no external library needed)

---

## 9. Dashboard (Active Track)

### 9.1 Current state

The Scout tab in `dashboard.html` currently shows:
- Trial status banner
- Child name and age
- Milestone digest (rendered from `ff-advisor.js`)
- Child switcher

### 9.2 Required additions

**Window progress controls**
- Each window card: "Mark as done" / "In progress" / "Skip"
- Completed windows move to a collapsible "Done" section
- Progress persists to `window_progress` table (Supabase)

**Monthly summary header**
- "You have [X] open windows this month"
- Progress bar: X of Y addressed
- "Next digest arrives [date]"

**Milestone count on signup/empty state**
- "Your child has [X] developmental windows in the next 12 months"
- Broken down by category (nutrition, language, motor, etc.)
- Shown at the top of the Scout tab on first login

**Missed-window section**
- Collapsible section at the bottom of the Scout tab
- Lists closed windows with their missed-window guidance
- Never shown above the fold

---

## 10. Metrics and Success Criteria

### Launch metrics (first 90 days)
| Metric | Target |
|---|---|
| Trial to paid conversion | >40% |
| Month 1 email open rate | >55% |
| Calendar invite add rate | >30% of email recipients |
| Families with 2+ circle members | >25% of subscribers |
| Support queries per subscriber | <0.1 per month |

### Retention metrics (months 3–12)
| Metric | Target |
|---|---|
| Month 3 active subscriber rate | >75% |
| Month 6 active subscriber rate | >60% |
| Annual renewal rate (year 2) | >50% |
| Active track engagement (logs progress ≥1x/month) | >30% of subscribers |

### Growth metrics
| Metric | Target |
|---|---|
| Referral code redemption rate | >15% of new subscribers |
| KOL-attributed signups | track via referral codes |
| Baby shower gift code redemptions | track separately |

---

## 11. Launch Phases

### Phase 1 — Foundation (current)
✅ Signup flow (email + Google OAuth)  
✅ Stripe payment infrastructure  
✅ Supabase persistence (children + scout_subscriptions)  
✅ Scout dashboard (basic — trial banner, child data, milestone digest)  
✅ Referral code system  
✅ BABYSHOWER100 gift code (100% off, no card)  
✅ Renewal email via Resend (for free-year subscribers)  
- [ ] Update signup to no-CC flow: account creation → first delivery → trial_end_date set to next birthday  
- [ ] Update scout_subscriptions: add `free_trial` status + `trial_end_date` field  
- [ ] Milestone count shown on signup dashboard ("Emma has X open windows right now")

### Phase 2 — Delivery engine + Gift page (next sprint)
- [ ] Signup delivery job: first email + single `.ics` event on account creation
- [ ] Monthly digest job (paid subscribers only, fires on birth day each month)
- [ ] Monthly `.ics` calendar event generation: one event per month, all closing windows, 7-day alarm
- [ ] Trial-end job: fires on trial_end_date, sends conversion email + paywall
- [ ] Closing-window alert email (7 days before birthday, all users)
- [ ] scout_digest_log table
- [ ] **Baby shower gift page** — standalone page, gift buyer pays, recipient redeems; no app account required to purchase as a gift

### Phase 3 — Active track
- [ ] Window progress logging (mark done / in progress / skip / add notes)
- [ ] window_progress table
- [ ] Personalised digest (filters out completed windows for active-track users)
- [ ] Progress bar on dashboard ("X of Y windows addressed this month")
- [ ] Missed-window section on dashboard (active-track users only)
- [ ] Missed-window job (server-side, active-track only)

### Phase 4 — Growth mechanics
- [ ] Family invite as first-class onboarding step (partner, grandparents, nanny)
- [ ] Pre-birth mode (due date entry + preparation windows)
- [ ] Referral cashback program (TBD — Stripe credit vs Connect)
- [ ] Referral activity feed (dashboard Earn section — live data)
- [ ] KOL gift pack (shareable landing page + BABYSHOWER100 bulk issuance)

### Phase 5 — Retention and trust
- [ ] "Window completed" celebration moment
- [ ] Year-in-review email (sent 30 days before annual renewal — is the conversion tool for year 2)
- [ ] Social proof: beta family stories + specific quotes
- [ ] School readiness track (ages 3–5) — retention story for year 2+ subscribers

---

## 12. Open Questions

### Resolved
| Question | Decision |
|---|---|
| Monthly pricing option? | Yes — monthly (~$9.99/mo) and annual (~$79.99/yr) both available. Annual pre-selected. Exact prices TBD. |
| Windows per digest — fixed count or all? | All windows in the active time range, no cap. Three sections: Ending soon / Right now / Upcoming. |
| Timezone for digest delivery? | 8:00 AM UTC trigger; digest aligns to birth day of month. |
| Multi-child digest — one email or separate? | Separate email per child. One subscription per child. |
| Age range for v1? | Birth to 3 years. Expand to age 5, then 10 in later phases. |
| Per-child or per-family pricing? | Per child. $79.99/yr per child. Family Circle access included at no extra charge. |
| Adding a second child? | One-click "Add another child" from dashboard — creates a new Stripe subscription. No separate checkout flow. |
| Existing test subscribers? | Reset. No migration needed. |
| Family discount? | Yes — discount applies from the 2nd child onward. Exact percentage TBD. |
| When is the first email sent? | Immediately at signup — same day, no credit card required. |
| Calendar event model? | One event per month, placed on the child's next birthday. Lists all windows closing that month. Includes a 7-day alarm. Not one event per milestone. |
| Digest delivery date? | Birth day of month (e.g. born March 14 → digest every 14th). Paid subscribers only. |
| Missed-window alerts for passive users? | No. Missed-window protocol applies to active-track users only. |
| Free trial model? | No credit card required. Trial runs from signup to the child's next birthday. Trial-end email asks parent to subscribe to continue. |
| Credit card at signup? | No. Collected only at trial-end conversion. |
| Playbooks in Scout? | Yes — free links in relevant window content (e.g. sleep training windows link to Sleep Training Playbook). No paywall. |
| Baby shower gift page? | Phase 2 — prioritised, standalone page, purchaser pays, recipient redeems. |

### Pending
| Question | Owner | Priority |
|---|---|---|
| Referral cashback — Option A (Stripe credit) or Option B (real cash via Connect)? | jackhowdy | Medium (Phase 4) |
| Family discount exact amount — e.g., 10% off 2nd child, 20% off 3rd+? | jackhowdy | Medium |

---

## 13. What Scout Is Not

- Not a diagnostic tool. Scout never suggests a diagnosis. Clinical flags escalate to "talk to your pediatrician."
- Not a judgement system. Missed windows are handled with grace, not alarm.
- Not an app that requires daily engagement. The passive track delivers full value with zero app opens.
- Not a replacement for a pediatrician, books, family, or community. Scout is an additional layer — not a substitute.

---

*This document is a living spec. Update as decisions are made and phases complete.*
