# Scout Pre-Birth Onboarding Spec
**Version:** 1.0 | **Date:** 2026-03-21 | **Status:** Ready to build

---

## Overview

Baby shower gifts are given at ~30–36 weeks pregnant. Scout's value starts at birth. Without pre-birth handling, a recipient who activates during pregnancy gets an empty dashboard, loses momentum, and often forgets to re-engage when the baby arrives.

**This spec solves three problems:**
1. Dead period — useful content before the baby arrives
2. Forgetting — automated nudges to activate at birth
3. Gifter anxiety — reassurance that the gift didn't go to waste

**Non-goal:** Building a full pregnancy guide. We are not competing with BabyCenter. We're solving the activation gap, not the pregnancy content market.

---

## User Scenarios

| Scenario | Who | When | Status today |
|---|---|---|---|
| A | Gift recipient activates during pregnancy | 4–12 weeks before birth | ❌ Broken (empty dashboard) |
| B | Parent signs up directly during pregnancy | Any time | ❌ Broken (empty dashboard) |
| C | Gift recipient / parent activates after birth | Day 0+ | ✅ Works |
| D | Parent activates during pregnancy, updates birth date later | Pregnancy → birth | ❌ Broken (no update flow) |

This spec covers A, B, and D. Scenario C is unchanged.

---

## Onboarding Flow Changes

### Current flow
```
Name baby → Birth date → Gender → Dashboard
```

### New flow
```
Name baby → Born yet? [Yes / Not yet] → ...
    If Yes:  → Birth date → Gender → Dashboard (unchanged)
    If Not yet: → Due date → Gender → Expecting Dashboard
```

### "Born yet?" screen

**Copy:**
- Heading: "Has [name] arrived yet?"
- Subhead: "We'll personalise everything to the right stage."
- Option A: "Yes — born on [date picker]" → existing flow
- Option B: "Not yet — due around [month/year picker]" → pre-birth flow

**Notes:**
- Due date picker: month + year only (not full date) — parents rarely know the exact day far in advance, reduces friction
- If they pick "Not yet": set `is_expecting = true`, `due_date = first of selected month` on the `children` row
- Skip detailed date if due date is within 4 weeks — show full date picker instead (baby could arrive any day)

---

## Expecting Dashboard State

When `is_expecting = true`, the main Scout dashboard shows a pre-birth state instead of the normal digest view.

### Layout

**Header card** (replaces normal "this month's digest" card):
```
┌─────────────────────────────────────────┐
│  Getting ready for [Name]  🌱           │
│  Due around [Month Year]                │
│  [countdown: ~X weeks to go]            │
│                                         │
│  [ Baby has arrived → Update now ]      │
└─────────────────────────────────────────┘
```

**Below: 4 pre-birth action cards** (using existing content):
1. `prebirth-safe-sleep-setup` — "Set up safe sleep before the baby arrives"
2. `prebirth-pediatrician-selection` — "Choose your pediatrician before the birth"
3. `prebirth-hospital-bag` — "Pack the hospital bag"
4. `prebirth-newborn-screening` — "Understand newborn screening"

Each card shows: title, urgency badge, brief why-it-matters text, expand for full content.

**Footer note:**
> "Your personalised Scout digests start the day [Name] arrives. We'll remind you to confirm the birth date."

### "Baby has arrived" flow
Prominent button on dashboard throughout pregnancy. Tapping opens a simple modal:
- "What day did [Name] arrive?" → date picker
- Submit → sets `dob = date`, `is_expecting = false`, clears `due_date`
- Immediate: send first Scout digest (if baby ≥ 1 day old) or schedule it for tomorrow
- Trigger gifter notification email (if gift purchase on record)

---

## Email Sequence

Four emails total for expecting parents. All trigger off `is_expecting = true` + `due_date`.

### Email 1 — Welcome (immediate on activation)
**To:** Parent  
**Subject:** `Before [Name] arrives, three things to do now`  
**Preview:** `The ones that can't wait until after.`  
**Sends:** Immediately on activation with `is_expecting = true`  
**Content:**
- Welcome — "You're all set. Scout starts the moment [Name] is born."
- 3 of the 4 pre-birth windows as inline cards (safe sleep, pediatrician, hospital bag)
- CTA: "View your pre-birth checklist" → dashboard
- Reassurance: "Your gift / access doesn't expire. There's no rush."

---

### Email 2 — Pre-birth prep (T-6 weeks before due date)
**To:** Parent  
**Subject:** `[Name]'s due date is 6 weeks away — here's what to do now`  
**Preview:** `Three things you'll be glad you did before the chaos starts.`  
**Sends:** When `due_date - today = 42 days`  
**Content:**
- Hospital bag checklist (from `prebirth-hospital-bag`)
- Car seat installation reminder
- Pediatrician selection nudge (from `prebirth-pediatrician-selection`)
- CTA: "Mark these done on your dashboard"

---

### Email 3 — Due date nudge (on due date)
**To:** Parent  
**Subject:** `Is [Name] here yet? 👀`  
**Preview:** `Update your baby's birthday to start your Scout digests.`  
**Sends:** On `due_date`  
**Condition:** Only if `is_expecting` is still true (baby not yet confirmed arrived)  
**Content:**
- "Today's [Name]'s due date — babies arrive on their own schedule, but when they do, we're ready."
- Big CTA: "Baby is here — start my Scout digests →" → triggers birth date entry
- "Not yet — I'll update when they arrive" → no action, re-sends in 1 week

---

### Email 4 — Post-due-date follow-up (T+7 days)
**To:** Parent  
**Subject:** `Still waiting on [Name]? You're not alone 😅`  
**Preview:** `Update your baby's birthday whenever you're ready.`  
**Sends:** `due_date + 7 days` if `is_expecting` still true  
**Content:**
- Warm, light tone — "Late babies are just building suspense."
- Simple single CTA: "Update [Name]'s birthday → start my digests"
- Note: no further automated follow-up after this — don't become spam

---

### Email 5 — Gifter notification (triggered by recipient activation)
**To:** Original gift purchaser  
**Subject:** `[Name] has arrived — your Scout gift just activated 🎉`  
**Preview:** `[Recipient name] said thank you.`  
**Sends:** When `is_expecting` flips to false (birth date confirmed)  
**Condition:** Only if a `scout_gifts` record links this subscription to a gift purchase  
**Content:**
- "[Recipient name]'s baby [Name] arrived on [date]"
- "Your gift of [1 Year / Full Journey] of Scout is now active."
- Share prompt: "Share the news →" → generates giver shareable image
- No upsell on this email — this is a feel-good moment only

---

## Database Changes

### `children` table — already partially there
```sql
-- These columns exist per supabase-schema-scout-v2.sql migrations:
-- due_date    date    default null
-- is_expecting boolean not null default false

-- No new columns needed on children.
```

### `scout_digest_log` — no changes needed
Pre-birth reminder emails use the existing `prebirth_reminder` digest_type (already in constraint).

### New: `prebirth_email_log` — track which pre-birth emails have sent
```sql
create table if not exists public.prebirth_email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  email_type  text not null,  -- 'welcome' | 'prep_6wk' | 'due_date' | 'followup_7d' | 'gifter_notify'
  sent_at     timestamptz not null default now(),
  constraint prebirth_email_log_type_check
    check (email_type in ('welcome','prep_6wk','due_date','followup_7d','gifter_notify'))
);
create unique index prebirth_email_dedup
  on public.prebirth_email_log (child_id, email_type);
```
The unique index prevents duplicate sends if a cron fires twice.

---

## Edge Cases

| Scenario | Handling |
|---|---|
| Baby arrives before due date | Parent taps "Baby is here" on dashboard → normal flow |
| Baby arrives significantly early (<34 wks) | Same — birth date entry triggers normal digest from day 1 |
| Parent never updates birth date | Emails 3 + 4 nudge. After email 4, no more automated sends. Dashboard always shows "Baby arrived?" CTA |
| Parent enters wrong due date | No consequence — emails are approximate. Real dates enter at birth confirmation |
| Gift code expires | It doesn't. Gift codes have no expiry (noted on gift page). Pre-birth period doesn't consume the subscription duration |
| Parent enters due date in the past | Treat as "baby might already be here" → show born? prompt immediately |
| Multiple children, one expecting | `is_expecting` is per `children` row — each child tracked independently |
| Parent skips due date entry | `due_date = null`, `is_expecting = true` — show pre-birth dashboard, but no timed emails (no date to trigger off). Show "Add your due date" prompt on dashboard. |

---

## What This Is NOT

- **Not a weekly pregnancy email** — 40 weeks of gestation content competes with BabyCenter, The Bump, Ovia. We have 4 pre-birth windows. That's enough.
- **Not a pregnancy tracker** — no weight logging, symptom tracking, or kick counters
- **Not a replacement for a midwife or OB** — pre-birth content is preparation and screening information, not medical advice

---

## Build Order

| # | Task | Effort | Dependency |
|---|---|---|---|
| 1 | Onboarding flow: add "Born yet?" screen | S | None |
| 2 | `children` table: confirm `due_date` + `is_expecting` migrations are applied | XS | None |
| 3 | Expecting dashboard state (pre-birth cards, "Baby arrived" CTA) | M | 1, 2 |
| 4 | "Baby arrived" modal + birth date update flow | S | 3 |
| 5 | Email 1: Welcome (edge function, triggers on activation) | S | 2 |
| 6 | `prebirth_email_log` table | XS | None |
| 7 | Email 2: Prep at 6 weeks (cron job, daily check) | S | 6 |
| 8 | Email 3: Due date nudge (cron job) | S | 6 |
| 9 | Email 4: T+7 follow-up (cron job) | XS | 8 |
| 10 | Email 5: Gifter notification (trigger on is_expecting flip) | S | 4, gift flow |

**MVP (ship first):** Tasks 1–5. Expecting dashboard + welcome email covers the core use case.  
**Full:** All 10 tasks. Estimated 3–4 days of focused build time.

---

## Success Metrics

| Metric | Target |
|---|---|
| Pre-birth activation rate (gift recipients) | >60% activate before birth |
| Birth date update rate (within 7 days of due date) | >70% |
| First digest open rate (post-birth) | >55% |
| Gift forgetting rate (never activated) | <15% |
