# Development Advisor — Product Spec

## What It Is

A personalized monthly digest + urgent alert system, tied to each child's date of birth. Parents subscribe, enter their children's birthdays and select which playbooks to follow, and Development Advisor delivers the right guidance at the right moment.

---

## Pricing

| Plan | Price | Notes |
|---|---|---|
| Monthly | $9.99/month | Covers all children on the account (up to 5) |
| Annual | $79/year | Equivalent to ~$6.58/month — save 34% |

---

## User Flow

1. Parent subscribes (Stripe checkout)
2. Adds child: name + date of birth + playbook selection
3. System calculates child's current age in weeks
4. Immediately shows current-month digest on dashboard
5. Monthly digest delivered on the 1st of each month (or child's monthly birthday)
6. Urgent alerts delivered immediately when a critical window is approaching (3–4 weeks lead time)
7. Email delivery optional (opt-in during setup)

---

## Dashboard Tab

New tab in dashboard navigation: **"Development Advisor"**

### States:
- **Not subscribed**: preview of what they'd see + subscribe CTA
- **Subscribed, no child**: prompt to add first child
- **Subscribed, 1+ children**: full digest view

### Digest view layout:
```
[Child Name] — [Age: 5 months, 2 weeks]        [+ Add Child]

⚠️  URGENT: Peanut introduction window — 6 months left
    [Alert card — full width, yellow/amber]

📋  THIS MONTH
    [To-do checklist with checkboxes]

💤  SLEEP           🥦  FEEDING         📱  SCREEN TIME
    [Section card]      [Section card]      [Section card]
    [Link to playbook]  [Link to playbook]  [Link to playbook]

─────────────────────────────────────────────────────
[Switch child: Olivia · James · + Add]
```

---

## Email Digest Format

**Subject:** `[Child Name] — Month [N] with FamilyForce`

- ⚠️ Urgent alerts (if any) at top
- 📋 This month's to-dos (3 max — keep it scannable)
- One section per selected playbook
- Each section ends with a CTA linking to the playbook
- Footer: manage preferences · unsubscribe from emails (not from subscription)

---

## Data Model (Supabase)

### New tables needed:

```sql
-- Children
children (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  dob date NOT NULL,              -- date of birth
  playbooks text[],               -- selected playbook keys
  created_at timestamptz DEFAULT now()
)

-- Subscriptions (mirrors Stripe)
subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  stripe_subscription_id text,
  stripe_customer_id text,
  plan text,                      -- 'monthly' | 'annual'
  status text,                    -- 'active' | 'cancelled' | 'past_due'
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
)

-- Alert delivery log (prevent duplicate sends)
advisor_deliveries (
  id uuid PRIMARY KEY,
  child_id uuid REFERENCES children(id),
  milestone_id text,
  delivered_at timestamptz DEFAULT now(),
  channel text                    -- 'dashboard' | 'email'
)
```

---

## Milestone Logic

1. Load `milestones.json`
2. For each child, calculate `age_weeks = (today - dob) / 7`
3. Filter milestones where `age_weeks_start <= age_weeks <= age_weeks_end`
4. Filter further by child's selected playbooks
5. Sort by urgency (critical → high → normal)
6. Check `advisor_deliveries` to avoid re-sending
7. Render or send

---

## Urgent Alert Trigger

Run daily (Supabase Edge Function or cron):
- Find milestones with `urgency = 'critical'`
- Check if child's age is 3–4 weeks *before* `age_weeks_start`
- If yes AND not yet delivered → send urgent alert
- Log to `advisor_deliveries`

---

## Build Phases

### Phase 1 — Foundation (MVP)
- [ ] Dashboard tab UI (static, no paywall yet)
- [ ] Child profile form (name + DOB + playbook selection)
- [ ] Milestone rendering engine (JS, client-side from milestones.json)
- [ ] Supabase: children table + RLS
- [ ] Show current digest on dashboard

### Phase 2 — Subscription
- [ ] Stripe integration (monthly + annual plans)
- [ ] Paywall on dashboard tab
- [ ] Subscriptions table + webhook handler
- [ ] Upgrade/downgrade/cancel flow

### Phase 3 — Email
- [ ] Email digest template
- [ ] Urgent alert template
- [ ] Delivery cron (Supabase Edge Function)
- [ ] Opt-in preference on dashboard
- [ ] Delivery log to prevent duplicates

### Phase 4 — Polish
- [ ] Multiple children switcher
- [ ] Shareable milestone cards (KOL distribution)
- [ ] Annual plan discount + billing page
- [ ] Mobile-optimized digest view
