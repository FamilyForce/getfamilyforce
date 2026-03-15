# Scout Dashboard — Design Spec
**Version:** 1.0
**Status:** Draft — awaiting review
**Last updated:** March 14, 2026
**Relationship to plan:** Expands task 4E in `scout-implementation-plan.md`

---

## 1. Philosophy

The dashboard is an action tracker, not a reference library.

The email delivers the information. The dashboard is where you do something with it. A parent who never opens the dashboard still gets full value from Scout via email alone. A parent who does open it gets a tracker that shows what they have done, what is still open, and what is closing.

Two rules that flow from this:
- Every screen has a default action. No screen should leave the parent wondering what to do next.
- The dashboard never replaces the email. It extends it.

---

## 2. Screen Map

```
/scout-dashboard           → Home (current month's windows)
/scout-dashboard#window-[id]   → Window detail (modal overlay on home)
/scout-dashboard/history   → Past months
/scout-dashboard/child     → Child profile (add or edit)
/scout-dashboard/settings  → Account, email prefs, subscription
/scout-dashboard/family    → Family Circle (invite / manage partner)
```

All screens live under `/scout-dashboard` to clearly separate Scout from the existing FamilyForce account dashboard at `/dashboard`. The existing `/dashboard` covers playbook progress and certificates. Scout is its own product and gets its own URL namespace.

---

## 3. Navigation

### Desktop (900px and above)
Fixed sidebar, 240px wide.

```
┌──────────────────┐
│  🔭 Scout        │  ← logo + product name
│  ─────────────   │
│  [child name ▾]  │  ← child selector dropdown
│  ─────────────   │
│  ● Home          │  ← active state: filled dot, purple text
│    History       │
│    Settings      │
│  ─────────────   │
│  Family Circle   │
│  ─────────────   │
│  [trial banner]  │  ← if trial active (see section 10)
└──────────────────┘
```

### Mobile (below 900px)
Bottom tab bar, 4 items.

```
[ Home ]  [ History ]  [ Family ]  [ Settings ]
```

Bottom tab bar uses `position: fixed; bottom: 0`. Padding bottom respects `env(safe-area-inset-bottom)`. Active tab uses `--terra` fill.

### Child selector
- Shown in sidebar (desktop) and as a pill in the page header (mobile)
- Dropdown: lists all children for this account + "Add a child" option
- Selecting a child reloads the home screen for that child's windows
- Stored in `localStorage` as `scout_active_child_id` so selection persists across sessions
- If only one child: no dropdown, just the child's name as a label

---

## 4. Home Screen

### URL: `/scout-dashboard`

### Page header
```
[Child name] is [N] months old
[Progress bar: X of Y windows addressed this month]
Next digest: [date] — [N] days
```

- Child name uses `font-family: var(--serif)` at 28px / 32px
- "X months old" uses `--text-mid`
- Progress bar: thin (6px), `--terra` fill, `--border` track, `--radius-pill`
- "X of Y windows addressed" in small text below bar (`--text-dim`, 13px)
- "Next digest" line links to `/scout-dashboard/history` — clicking shows what was in the last digest
- On first login (no windows actioned yet): hide progress bar, show welcome state instead (see section 4.1)

### Window sections

Three sections, rendered in this order:

#### ⚠️ CLOSING SOON
Windows where `close_age_weeks` is within 4 weeks of the child's current age. These are the ones that cannot wait.

Header: `⚠️ Closing soon` — red-orange badge, Outfit 600, 13px uppercase

If empty: section is hidden entirely.

#### THIS MONTH
Windows currently in peak zone (`open_age_weeks` ≤ current age ≤ `close_age_weeks`, not in Closing Soon). These are active right now.

Header: `This month` — `--text-mid`, Outfit 500, 13px uppercase

If empty: "All windows for this age are either complete or coming up."

#### COMING UP
Windows opening in the next 4 to 8 weeks. Preview only — read-only, no action controls.

Header: `Coming up` — `--text-dim`, Outfit 500, 13px uppercase

If empty: section hidden.

#### DONE THIS MONTH (collapsed by default)
Windows marked as done or skipped. Shown as a collapsed accordion at the bottom.

Header: `✓ Done this month (X)` — `--text-dim`, small, collapsed by default
Expand to show muted cards with completion state.

### 4.1 Welcome state (first login)
Shown instead of progress bar when no windows have been actioned.

```
┌────────────────────────────────────────────────┐
│  Welcome to Scout.                             │
│                                                │
│  [Name] has [N] open windows right now.        │
│  Start with the ones marked ⚠️ Closing soon.   │
└────────────────────────────────────────────────┘
```

Background: `--terra-tint` (#F0EBFF). Border-left: 3px `--terra`. `--radius-card`. Dismissed permanently after first interaction.

---

## 5. Window Card

Each window in the Home screen is a card. Cards are the primary UI unit of Scout.

### Card anatomy (default / open state)

```
┌────────────────────────────────────────────────────┐
│  [URGENCY BADGE]  [CATEGORY BADGE]        [↗ icon] │
│                                                    │
│  Title of the window                               │
│  One-line hook (why it matters, 15 words max)      │
│                                                    │
│  [✓ Done]  [▶ In progress]  [– Skip]              │
│  [📝 Add note]                                     │
└────────────────────────────────────────────────────┘
```

**Urgency badge:**
- `advisory` → grey pill, `--text-dim` text: "Advisory"
- `screening` → blue pill: "Screening"
- `clinical` → red-orange pill: "Clinical"
- All pills: `--radius-pill`, 11px, Outfit 600 uppercase, 4px vertical padding

**Category badge:**
- Small grey pill: "Nutrition" / "Motor" / "Language" etc.
- Same pill style, `--border` background, `--text-mid` text

**Expand icon (↗):**
- Top right corner, 20px
- Tapping opens the Window Detail modal
- `--text-dim` default, `--terra` on hover

**Title:**
- Outfit 600, 17px
- `--text` colour
- Two lines max before truncation

**Hook:**
- First sentence of "Why it matters" from the content file, truncated to 15 words
- Outfit 400, 14px, `--text-mid`

**Action buttons (three pill buttons):**

| Button | Default state | Active state |
|---|---|---|
| ✓ Done | Outlined, `--border` | Filled green (#22C55E), white text |
| ▶ In progress | Outlined, `--border` | Filled amber (#F59E0B), white text |
| – Skip | Outlined, `--border` | Filled `--text-dim`, white text |

- Pill shape, `--radius-pill`
- 32px height, 12px horizontal padding
- Tapping an active state toggles it back to open
- Only one state active at a time per window
- State persists to `window_progress` table via `scout-progress` edge function

**Note button:**
- Below action buttons
- `📝 Add note` when empty; `📝 Note` with a purple dot when a note exists
- Tapping opens the note inline (see section 7)
- Outfit 400, 13px, `--text-mid`

### Card states

| State | Visual treatment |
|---|---|
| Open (default) | White card, `--border`, standard shadow |
| In progress | Left border: 3px amber, card background `#FFFBEB` |
| Done | Muted: `--text-dim` text, moved to "Done this month" |
| Skipped | Muted: `--text-ghost` text, moved to bottom of section |
| Coming up (preview) | No action buttons, card slightly dimmed, `--border-light` |
| Missed (clinical only) | Red-orange left border, header "Window has closed" in small red text |

**Missed window state:**
Only shown for `urgency: clinical` windows where `close_age_weeks` < current age and no `completed` status in `window_progress`.

Additional text below title: "This window has closed. Here is what to do now."
The "missed window guidance" content field from the database is shown inline.

### Card layout at breakpoints
- Desktop (900px+): 2-column grid, `--space-grid-gap` between cards
- Tablet / compact (480px to 899px): 1-column, full width
- Mobile (below 480px): 1-column, reduced horizontal padding (`--space-card-x: 16px`)

---

## 6. Window Detail Modal

Opened by tapping the ↗ icon on any card, or tapping the card title.

### Modal behaviour
- Slides up from bottom on mobile (sheet pattern)
- Centred overlay on desktop, max-width 600px, max-height 80vh, scrollable
- `inert` attribute on background content (existing pattern from FamilyForce production file)
- Close: X button top right, tap outside, or swipe down (mobile)
- URL fragment: `#window-[window_id]` — shareable and browser-back-able

### Modal content

```
┌───────────────────────────────────────────────────────┐
│  [URGENCY]  [CATEGORY]                           [✕]  │
│                                                       │
│  Window title                                         │
│  Age: weeks N to N (months X to X)                   │
│                                                       │
│  ── Why it matters ────────────────────────────────── │
│  [Full why_it_matters content]                        │
│                                                       │
│  ── What to do ────────────────────────────────────── │
│  [Full what_to_do content]                            │
│                                                       │
│  ── What not to worry about ───────────────────────── │
│  [what_not_to_worry content]                          │
│                                                       │
│  ── If you have missed this window ────────────────── │
│  [missed_window content — shown only if applicable]   │
│                                                       │
│  Source: [source_citation]                            │
│  [Playbook link if applicable]                        │
│                                                       │
│  ── Progress ──────────────────────────────────────── │
│  [✓ Done]  [▶ In progress]  [– Skip]                 │
│                                                       │
│  ── Your note ─────────────────────────────────────── │
│  [Note textarea or existing note + edit button]       │
└───────────────────────────────────────────────────────┘
```

**Typography in modal:**
- Section headers ("Why it matters" etc.): Outfit 500, 12px, uppercase, `--text-dim`, with a hairline rule
- Body content: Outfit 400, 15px, `--text`, line-height 1.7
- Source citation: Outfit 400, 12px, `--text-dim`

**Playbook link:**
- Only shown if `playbook_link` field is set in the database
- Format: "Free guide: [Playbook name] →" linking to the relevant playbook page
- `--terra` colour, Outfit 500

**Age display:**
- "Ages 4 to 6 months (weeks 17 to 26)" — human-readable conversion using the age-to-weeks reference
- Uses `--text-dim`, 13px

---

## 7. Notes System

Notes are private per-window text entries. One note per window per child. Not social. Not shared outside the Family Circle.

### Inline note (on card)

When the user taps "📝 Add note" on a card:
1. A `<textarea>` expands inline below the action buttons
2. Placeholder: "e.g. Tried peanuts today — no reaction. Will repeat next week."
3. Character limit: 500 characters. Counter shown at bottom right: "0 / 500"
4. Auto-saves on blur (focus leaving the textarea)
5. Saving state: brief spinner, then "Saved" for 1.5 seconds
6. Error state: "Could not save. Tap to retry."

### Note on modal

Shown in the "Your note" section at the bottom of the Window Detail modal.
- If no note: textarea, same behaviour as above
- If note exists: displays the note text in a light grey box (`--elevated` background), with an "Edit" button
- Tap Edit: textarea replaces the display, same auto-save behaviour
- Family Circle members see others' notes as read-only with attribution: "Jack's note: ..."

### Note in email

Notes do not appear in the monthly digest email. They are dashboard-only. This keeps the email focused.

Exception: the History screen (section 9) shows notes alongside past window entries.

---

## 8. Progress Interaction Model

### State machine per window

```
open → in_progress → completed
open → skipped
in_progress → completed
in_progress → open  (undo)
completed → open    (undo)
skipped → open      (undo)
```

Any state can be undone by tapping the active button again or tapping a different action.

### What progress does to the digest

For subscribers who have actioned at least one window in the current month:
- `completed` windows are excluded from the above-fold selection in the next email
- They appear in a "What you have done" section at the bottom of the digest (✅ list)
- `in_progress` and `skipped` windows still appear in the email as normal
- `window_progress` is checked by `scout-digest` edge function before generating each email (task 3I)

This is the key personalisation benefit of the active track. The email learns from the dashboard.

### Progress bar calculation

```
addressed = count of windows with status in (completed, skipped)
total = count of all windows where open_age_weeks ≤ current_age ≤ close_age_weeks
progress = addressed / total
```

"Addressed" includes both done and skipped. The goal is to show forward motion, not guilt.

---

## 9. History Screen

### URL: `/scout-dashboard/history`

Shows all past months as an accordion list. Most recent first.

### Month row (collapsed)

```
[Month name, year]   [Child age]   [N windows]   [X done]   [▾]
```

- "March 2026" — Outfit 600, 16px
- "Oliver at 3 months" — `--text-mid`, 14px
- Window count and done count — `--text-dim`, 13px
- Tap to expand

### Month row (expanded)

Shows the full window list for that month as compact read-only cards.

Each card shows:
- Title
- Final status (done / skipped / open / missed)
- Note preview (first 60 chars, "Read more" to expand)

No action buttons — history is read-only. Allows undo only within the current month.

### Use cases
- "When did we introduce peanuts?" — search history for the note
- "What did the 6-month digest say?" — review past digest content
- "Did we do the 9-month visit?" — check screening window completion

### Search
- Simple text search field at top of history page
- Searches window titles and note content
- No date filtering required at launch — chronological list is sufficient

---

## 10. Trial Banner and Paywall States

### Active trial (status = `free_trial`)

A persistent banner at the top of every Scout dashboard screen:

```
┌─────────────────────────────────────────────────────────────┐
│  Free trial · ends [date] ([N] days)  ·  Subscribe →        │
└─────────────────────────────────────────────────────────────┘
```

- Background: `--terra-tint` (#F0EBFF)
- Text: Outfit 400, 14px, `--terra-dark`
- "Subscribe →" is a link, same colour, Outfit 600
- Banner is sticky (not fixed — scrolls with content but stays at top of the page body, below the nav)
- Dismiss button (✕): hides the banner for the current session only — not permanently

### Expired trial (status = `free_trial`, trial_end_date in the past)

Current month's windows remain fully accessible. Next month is locked.

At the top of the home screen, below the page header, a paywall card replaces the "Coming up" section:

```
┌───────────────────────────────────────────────────────────────┐
│  [Name]'s [N+1]-month windows are ready.                      │
│                                                               │
│  [blurred preview of top 2 window titles]                     │
│                                                               │
│  Subscribe to continue.                                       │
│                                                               │
│  [Annual — $79.99/year  ← recommended]                        │
│  [Monthly — $9.99/month]                                       │
└───────────────────────────────────────────────────────────────┘
```

- Card background: `--surface`, border: `--border`, `--radius-card`
- Blurred preview: two window title pills at reduced opacity (0.3) with `filter: blur(4px)`
- "Subscribe to continue" — Outfit 600, 18px, `--text`
- Annual CTA: filled `--terra` button, white text, "Recommended" badge
- Monthly CTA: outlined button, `--terra` text and border
- Annual pre-selected visually (heavier visual weight, badge)

### Post-payment (status transitions to `active`)

Paywall card is replaced immediately with the unlocked next month preview.
No page reload required — update DOM on Stripe webhook confirmation.
A one-time toast: "You're subscribed. [Name]'s [N+1]-month windows are ready."

---

## 11. Settings Screen

### URL: `/scout-dashboard/settings`

Three sections:

### 11.1 Email preferences
- Toggle: "Monthly digest" (on by default — cannot turn off without cancelling)
- Toggle: "7-day closing window alert" (on by default, can turn off)
- Digest delivery day: shown as read-only — "Delivered on the [N]th of each month ([Name]'s birthday)" — not editable
- Link: "Update email address" → account settings

### 11.2 Subscription
- Plan type: Monthly / Annual
- Status: Active / Free trial / Cancelled
- Next billing date (if paid): "Next charge: [date] — $[amount]"
- Trial end date (if trial): "Free trial ends: [date]"
- "Manage subscription" → Stripe customer portal (external link)
- "Cancel subscription" → Stripe portal (no custom cancellation flow at launch)

### 11.3 Account
- Name, email (read-only display, link to edit)
- "Sign out"
- "Delete account" (destructive — confirmation dialog required, `inert` pattern, red confirm button)
- Delete account immediately cancels subscription via Stripe, deletes all `window_progress` and `scout_digest_log` records, anonymises the user

---

## 12. Family Circle

### URL: `/scout-dashboard/family`

Family Circle allows a second adult (partner, co-parent, involved grandparent) to access the same child's Scout dashboard with full read and write access.

### Ships at launch

**Invite flow:**
1. Primary account holder enters an email address
2. Invite email sent: "[Name] has invited you to Scout for [Child name]"
3. Recipient clicks link → creates account or signs in → child is added to their Scout automatically
4. Invite expires after 7 days

**Shared access model:**
- Partner sees the same window list, same progress states, same notes
- Partner can mark windows and add or edit notes
- Notes show author attribution: "Jack's note" / "Sarah's note"
- One subscription covers both accounts for the same child (subscription is on the child, not the individual)
- Primary account holder controls the subscription and billing

**Permissions:**
- Partner cannot cancel the subscription
- Partner cannot remove the primary account holder
- Partner can leave the Family Circle from their own settings

**UI indicator:**
- Partner's avatar or initials shown on windows they have actioned
- On cards: small avatar bubble bottom-right corner if partner has actioned or noted this window
- Tooltip on hover: "Sarah marked this done"

---

## 13. Child Profile Screen

### URL: `/scout-dashboard/child`

Shown on first login (no child yet) and accessible from the child selector dropdown ("Edit child" or "Add a child").

### Fields

**Child's name** (required)
- Text input, free form
- Placeholder: "First name"
- Used in all email subject lines, dashboard headers, and calendar event titles
- 50 character limit

**Date of birth** (required)
- Date picker (native `<input type="date">` on mobile for best UX; custom styled on desktop)
- Cannot be in the future
- Cannot be more than 3 years in the past (Scout covers birth to 36 months — show a message if the child is older)
- Used to calculate age in weeks for all window queries

**Gender** (required)
- Three-option pill selector, not a dropdown — all options visible at once:

```
[ Boy ]   [ Girl ]   [ Prefer not to say ]
```

- One option selected at a time, pill highlights `--terra` on selection
- Maps to pronouns used throughout the product (see pronoun table below)
- Label above: "We use this to personalise your emails"
- Small helper text below: "You can change this any time in Settings"

### Pronoun mapping

| Selection | DB value | Pronouns used in copy |
|---|---|---|
| Boy | `'boy'` | he / him / his |
| Girl | `'girl'` | she / her / her |
| Prefer not to say | `'other'` | they / them / their |
| Not set (null) | `null` | they / them / their |

### Where pronouns appear
- Email subject line examples: "He's almost ready for solid food" / "She turns 6 months today"
- Email digest body: "your baby" is used in the window content itself (content is gender-neutral) but the intro and sign-off lines use the child's name and pronoun
- Dashboard header: "[Name] is [N] months old" — no pronoun here, name only
- Trial-end email: "[Name]'s [N]-month windows are ready" — name only, no pronoun needed
- Calendar event title: "[Name]'s [N]-month windows" — name only

### Saving
- "Save" button: filled `--terra`, full width, Outfit 600
- On save: redirect to `/scout-dashboard` (home)
- Supabase upsert to `children` table — insert on first save, update on edit

### Editing an existing child
- Accessible from child selector dropdown: "Edit [Name]"
- Same form pre-filled with existing values
- Name and DOB changes take effect immediately on all future digests
- Gender change updates pronoun usage in all future emails (historical emails are not retroactively updated)

---

## 14. Design System Reuse

Everything in the Scout dashboard inherits from the existing FamilyForce design system. No new tokens. No new fonts.

### Reused directly from `dashboard.html` and `index.html`
- All CSS custom properties (`:root` token block) — copy verbatim
- Reset and base styles
- Navigation patterns (sticky nav, mobile bottom bar)
- Card component (border, shadow, radius, padding)
- Button styles (primary filled, secondary outlined, pill shape)
- Modal/overlay pattern (`inert` attribute on background, slide-up on mobile)
- Form inputs and textareas
- Toast notifications (brief, auto-dismiss)
- Safe area insets (`env(safe-area-inset-*)`)
- Reduced motion media query
- Focus ring style

### New components needed (build once, use across Scout)
- Progress bar component (thin, `--terra` fill)
- Urgency badge pill (advisory / screening / clinical)
- Category badge pill
- Three-state action button group (Done / In Progress / Skip)
- Accordion component (for History month rows and Done section)
- Note textarea with character counter and auto-save
- Paywall blur card

### File structure
```
/scout-dashboard.html           ← home screen (static shell)
/scout-dashboard/history.html   ← history screen
/scout-dashboard/settings.html  ← settings screen
/scout-dashboard/family.html    ← Family Circle
/assets/scout-dashboard.css     ← Scout-specific styles (imports root tokens)
/assets/scout-dashboard.js      ← data fetching, state management, interactions
```

All Supabase data fetched client-side via `@supabase/supabase-js` (already used in existing pages). No server-side rendering.

---

## 15. Performance and Accessibility

### Performance
- First contentful paint target: under 1.5 seconds on mobile (4G)
- Window list: render the top 6 cards on load, lazy-render the rest using IntersectionObserver (same pattern as `index.html`)
- Note auto-save: debounce 800ms, single Supabase upsert call
- Progress button: optimistic UI update (update DOM immediately, confirm with server in background, revert on error)

### Accessibility
- All action buttons have `aria-label` attributes: e.g. `aria-label="Mark tummy time as done"`
- Modal uses `role="dialog"` with `aria-labelledby` pointing to the window title
- Progress state communicated to screen readers via `aria-pressed` on toggle buttons
- Focus trap inside modal (tab cycles within modal, not behind it)
- Reduced motion: progress bar fills without animation when `prefers-reduced-motion` is set
- Colour is never the only indicator of state (urgency badges include text labels, not just colour)

---

## 16. Edge Cases and Empty States

### No child added yet
On first login with no child profile: redirect to `/scout-dashboard/child` with prompt to add child's name, date of birth, and gender. Cannot access home screen until at least one child is added.

### Child is over 36 months
Scout covers birth to 36 months. If a child has passed this threshold:
- Dashboard home shows: "Scout covers birth to 3 years. [Name] has reached the end of the window set."
- History remains accessible
- Subscription shows a cancel option with a note: "Your Scout subscription covers ages 0 to 3."
- No new digests are sent after the 36-month digest

### No open windows for current age
Rare but possible if all windows have been completed early or the child is between peak zones.
Show: "All windows for this age are addressed. [Name]'s next windows open in [N] weeks."

### Offline state
If the device has no connection:
- Show cached data from `localStorage` (last known state)
- Disable action buttons with a muted state
- Banner: "You are offline. Changes will sync when you reconnect."
- Queue progress updates locally, flush on reconnect

---

*This spec is authoritative for task 4E. Update this file when product decisions change. Do not make breaking changes to the design system tokens without updating `dashboard.html`, `index.html`, and all Scout files in the same commit.*
