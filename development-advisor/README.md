# Development Advisor
### FamilyForce Premium Feature — $9.99/month (or $79/year)

A personalized, age-based guidance system that tracks each child's developmental timeline and delivers the right information at exactly the right moment — before the window closes.

---

## The Core Idea

Parents miss critical developmental windows not because they don't care — but because no one told them at the right time. Development Advisor fixes this. You enter your child's birthday, select which playbooks to include, and we handle the rest. Monthly digests + time-sensitive alerts delivered to the dashboard and optionally by email.

---

## Key Decisions (locked)

| Decision | Choice |
|---|---|
| Delivery cadence | Monthly digest + separate urgent alerts |
| Delivery channels | Dashboard (primary) + Email (opt-in) |
| Max children per account | 5 |
| Subscription covers | All children on the account |
| Pricing | $9.99/month or $79/year |
| Paywall | Yes — must subscribe to access |
| Playbook selection | Parent opts in per child (all or select) |
| Alert lead time | 3–4 weeks before a window opens |

---

## Playbook Coverage

| Playbook | Key alert windows |
|---|---|
| Feeding | 4–6 months (solids), 4–11 months (allergen/peanut), 6–9 months (all allergens), 12 months (cow's milk) |
| Sleep | 4 months (regression), 6 months (training window), 8–10 months (2-nap transition), 15–18 months (1-nap transition) |
| Potty Training | 18–24 months (readiness window), 2–3 years (completion) |
| Tantrums | 18 months (peak begins), 2–3 years (peak, language explosion) |
| Screen Time | 0–18 months (zero screens), 18–24 months (transition), 2+ years (habit formation) |

---

## The 3 Customer Segments

1. **KOLs / Influencers** — affiliate channel, shareable content cards
2. **New parents (0–6 months in)** — relief buyers, price-insensitive, need radical simplicity
3. **Expecting parents** — planners, highest LTV, convert on the full timeline preview

---

## Folder Structure

```
development-advisor/
├── README.md               ← this file
├── SPEC.md                 ← full product spec
├── data/
│   ├── milestones.json     ← master milestone database (age → content)
│   └── playbook-map.json   ← which milestones link to which playbook
├── emails/
│   ├── monthly-digest.html ← email template
│   └── urgent-alert.html   ← time-sensitive alert template
└── ui/
    └── dashboard-tab.html  ← dashboard tab mockup/spec
```

---

## Status

- [x] Concept validated
- [x] Pricing decided ($9.99/month / $79/year)
- [x] Customer segments defined
- [ ] Milestone database built (`data/milestones.json`)
- [ ] Email templates designed
- [ ] Dashboard tab designed
- [ ] Supabase schema (children table, subscriptions table)
- [ ] Stripe integration
- [ ] Launch
