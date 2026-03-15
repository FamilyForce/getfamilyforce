# Scout — Email Deliverability Setup
**Status:** Pre-launch gate. Nothing ships until this is done.
**Owner:** jackhowdy (DNS) + engineer (Supabase webhook)

---

## Why This Matters

Scout is an email product. If emails land in spam, the product is dead.
SPF, DKIM, and DMARC are the three authentication layers that tell receiving mail servers
that `scout@getfamilyforce.com` is legitimate. Without them, open rates collapse and deliverability
degrades permanently.

Do this before the first test email goes out.

---

## Part 1 — Namecheap DNS Records (jackhowdy)

Log in to Namecheap → `getfamilyforce.com` → Advanced DNS

### 1A. SPF Record

Add or update the TXT record for `@`:

| Type | Host | Value | TTL |
|---|---|---|---|
| TXT | @ | `v=spf1 include:_spf.resend.com ~all` | Automatic |

If you already have an SPF record (starts with `v=spf1`), do not create a second one.
Edit the existing record and add `include:_spf.resend.com` before the `~all` at the end.

**Verify after 15 minutes:**
```
dig TXT getfamilyforce.com
```
Expected: the string above appears in results.

---

### 1B. DKIM Records (from Resend dashboard)

Resend provides three CNAME records. Get them from:
`Resend dashboard → Domains → getfamilyforce.com → DNS Records`

They look like this (your actual values will differ):

| Type | Host | Value |
|---|---|---|
| CNAME | `resend._domainkey` | `resend._domainkey.getfamilyforce.com.dkim.resend.com` |
| CNAME | `resend2._domainkey` | `resend2._domainkey.getfamilyforce.com.dkim.resend.com` |
| CNAME | `resend3._domainkey` | `resend3._domainkey.getfamilyforce.com.dkim.resend.com` |

Copy them exactly from the Resend dashboard — do not use the placeholders above.
Add all three.

**Verify in Resend dashboard:** status shows "Verified" (can take up to 24 hours).

---

### 1C. DMARC Record

Add a new TXT record:

| Type | Host | Value | TTL |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@getfamilyforce.com; sp=none; adkim=r; aspf=r` | Automatic |

**What `p=none` means:** monitor-only mode. Emails that fail DMARC are not blocked yet.
After 30 days of sending, check the DMARC reports and tighten to `p=quarantine`, then `p=reject`.

**Create the `dmarc@getfamilyforce.com` mailbox in Namecheap email** (or use an alias to your main address)
to receive the aggregate DMARC reports.

---

## Part 2 — Resend Configuration

### 2A. Verify domain in Resend

1. Log in to Resend → Domains
2. Add `getfamilyforce.com` if not already there
3. Copy the DKIM records from the Resend dashboard and add them to Namecheap (step 1B above)
4. Click "Verify Domain" in Resend — wait for green checkmarks on all three records

### 2B. Configure Resend webhook

1. Resend dashboard → Webhooks → Add Endpoint
2. URL: `https://[your-project-ref].supabase.co/functions/v1/scout-resend-webhook`
3. Events to subscribe:
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
   - `email.unsubscribed`
4. Copy the **Signing Secret** — add it to Supabase edge function secrets as `RESEND_WEBHOOK_SECRET`

### 2C. Set Supabase environment variables

In Supabase dashboard → Settings → Edge Functions → Secrets, add:

| Secret name | Value |
|---|---|
| `RESEND_API_KEY` | From Resend dashboard → API Keys |
| `RESEND_WEBHOOK_SECRET` | From Resend dashboard → Webhooks → Signing Secret |
| `RESEND_FROM_EMAIL` | `scout@getfamilyforce.com` |
| `RESEND_BCC_EMAIL` | `support@getfamilyforce.com` |
| `RESEND_FROM_NAME` | `Jack at FamilyForce` |
| `SITE_URL` | `https://getfamilyforce.com` |
| `TELEGRAM_BOT_TOKEN` | Existing (for error alerts) |
| `TELEGRAM_CHAT_ID` | Existing (for error alerts) |

---

## Part 3 — Domain Warm-up Plan

A new sending domain starts with zero reputation. Gmail and other providers
rate new senders cautiously. Warm up gradually.

| Days | Max emails/day | Notes |
|---|---|---|
| 1–3 | 20 | Internal + friends/family only |
| 4–6 | 40 | Stage 1 beta group |
| 7–9 | 80 | Stage 1 continued |
| 10–12 | 160 | Stage 2 soft launch begins |
| 13–15 | 320 | Monitor bounce rate daily |
| 16–21 | 640 | Full Stage 2 |
| 22–28 | 1,280 | Approaching full launch volume |
| 29+ | Uncapped | Stage 3 — full launch |

**Rules during warm-up:**
- Hard bounce rate must stay below 2%. If it exceeds 2% on any day, pause and investigate.
- Spam complaint rate must stay below 0.1% (Google threshold: 0.08%).
- Monitor Resend dashboard daily during the first 4 weeks.
- Do not purchase email lists. Only send to users who explicitly signed up.

---

## Part 4 — Pre-send Checklist

Complete this before the first email goes out to a real user:

- [ ] SPF record in DNS and verified
- [ ] All 3 DKIM CNAME records in DNS and verified green in Resend
- [ ] DMARC record in DNS, `dmarc@getfamilyforce.com` mailbox receiving reports
- [ ] Resend domain shows "Verified" for all records
- [ ] `scout-resend-webhook` edge function deployed and tested
- [ ] All Supabase secrets set (RESEND_API_KEY, RESEND_WEBHOOK_SECRET, etc.)
- [ ] Unsubscribe link present in every email template footer (legally required)
- [ ] Send a test digest to yourself via `mail-tester.com` — score must be 9/10 or higher
- [ ] Test email renders correctly in: Gmail (web), Apple Mail (iOS), Outlook (web)

---

## Part 5 — Post-launch Monitoring

After 30 days of sending, do the following:

- [ ] Check DMARC reports in `dmarc@getfamilyforce.com` — look for failing sources
- [ ] Tighten DMARC policy: change `p=none` to `p=quarantine`
- [ ] After another 30 days with no issues: change to `p=reject`
- [ ] Check Resend dashboard for delivery rate, open rate, bounce rate, complaint rate
- [ ] If bounce rate exceeds 2%: pause sending, audit the list, remove bad addresses
