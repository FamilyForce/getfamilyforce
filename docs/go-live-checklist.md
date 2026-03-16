# FamilyForce Scout — Go-Live Checklist

**Status as of March 16, 2026**
Engineering is complete. This is the full list of manual steps before Stage 1 launch.

---

## ✅ Done

- [x] DNS: SPF, DKIM, DMARC all propagated and verified
- [x] Database: all migrations run (schema v2 + gifts + webhook trigger + cron jobs)
- [x] Cron jobs: `scout-digest` (08:00), `scout-trial-end` (08:00), `scout-monitor` (09:00) — all active
- [x] Milestone content: 196 windows imported into `milestone_windows` table
- [x] All edge functions deployed

---

## 🔴 Required Before Stage 1 Launch

### 1. Stripe Live Mode Setup

Do these in order — takes ~30 minutes total.

#### A. Switch to live Stripe keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → toggle **Test mode OFF** (top-left)
2. Note your **live Secret key**: `sk_live_...`
3. Note your **live Publishable key**: `pk_live_...`

Update Supabase secrets (run each in Supabase Dashboard → SQL Editor or use CLI):
```
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

Update frontend files — replace `pk_test_...` with `pk_live_...` in:
- `scout-dashboard/settings.html` (line ~233)
- `sign-in.html` (search for `pk_test_`)
- `scout-gift.html` (search for `pk_test_`)

#### B. Create live Stripe products + prices

1. Stripe Dashboard → Products → **Add product**
   - Name: `Scout — Annual`
   - Price: `$79.99` / year / recurring
   - Note the **Price ID**: `price_live_annual_...`

2. Add another price to the same product (or new product):
   - Name: `Scout — Monthly`
   - Price: `$9.99` / month / recurring
   - Note the **Price ID**: `price_live_monthly_...`

Update Supabase secrets:
```
supabase secrets set STRIPE_PRICE_ANNUAL=price_live_annual_...
supabase secrets set STRIPE_PRICE_MONTHLY=price_live_monthly_...
```

#### C. Create the Stripe Webhook endpoint

1. Stripe Dashboard → Developers → **Webhooks** → Add endpoint
2. Endpoint URL: `https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/stripe-webhook`
3. Select these events to listen for:
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.trial_will_end`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Save → copy the **Signing secret**: `whsec_...`

Update Supabase secret:
```
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

> ⚠️ Without this secret, the webhook function rejects every Stripe event.
> This means `cancelling` → `cancelled` transitions won't happen automatically.

#### D. Create Referral Coupon (optional but recommended)

1. Stripe Dashboard → Products → **Coupons** → Create
   - Discount: 25% off
   - Duration: Once
   - Note the **Coupon ID**: e.g. `FRIEND25`

Update Supabase secret:
```
supabase secrets set STRIPE_REFERRAL_COUPON_ID=FRIEND25
```

> Without this, the referral code step in `scout-gift.html` is silently skipped.
> Gift purchases still work — buyers just don't get a referral code.

---

### 2. Update Public Keys in Frontend

After getting live Stripe keys, do a find-and-replace across the repo:

| Find | Replace with |
|---|---|
| `pk_test_51TAQTZRF5ve...` | `pk_live_...` (your live publishable key) |

Files affected: `sign-in.html`, `scout-dashboard/settings.html`, `scout-gift.html`

Commit and push → Vercel auto-deploys.

---

### 3. Verify Supabase Secrets Are Set

Run in Supabase Dashboard → SQL Editor to confirm all secrets exist:
```sql
-- This will error if a secret is missing from the vault
SELECT name FROM vault.secrets ORDER BY name;
```

Required secrets:
- `STRIPE_SECRET_KEY` ← live key
- `STRIPE_PRICE_ANNUAL`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_WEBHOOK_SECRET` ← from step 1C above
- `RESEND_API_KEY`
- `STRIPE_REFERRAL_COUPON_ID` ← optional

---

## 🟡 Nice to Have Before Launch

- [ ] **Sitemap.xml** — list all public pages, submit to Google Search Console (~20 min)
- [ ] **Real Stripe test** — do one end-to-end test with a real card in live mode before opening signups
- [ ] **Replace placeholder testimonials** — Sarah M. in trial-end email; 5 placeholders on homepage
- [ ] **Jack Hartley video** — homepage hero video slot is currently empty

---

## Stage 1 Launch Criteria (internal)

- [ ] All items in 🔴 section above complete
- [ ] One test signup → email received → dashboard opened → cancel → reactivate works end-to-end
- [ ] 20–30 gift code accounts sent to beta testers
- [ ] Telegram monitor alerts firing correctly (check `scout-monitor` cron output)

---

## Useful Links

- Supabase Dashboard: https://supabase.com/dashboard/project/ewjqbafaxeasyvknxmof
- Stripe Dashboard: https://dashboard.stripe.com
- Vercel Dashboard: https://vercel.com (FamilyForce project)
- GitHub repo: https://github.com/FamilyForce/getfamilyforce
- Edge function logs: Supabase Dashboard → Edge Functions → [function name] → Logs
- Funnel queries: `supabase/analytics/funnel-queries.sql`
