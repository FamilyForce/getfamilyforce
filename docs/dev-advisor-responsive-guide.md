# Development Advisor — Responsive Adaptation Guide
**FamilyForce · dashboard.html**
_Authored: 2026-03-12_

---

## 1. Current State Audit

### What exists today
| Breakpoint | Scope |
|---|---|
| `min-width: 560px` | Modal changes from bottom-sheet → centered dialog |
| `max-width: 480px` | `adv-form-row` stacks vertically |
| `clamp(28px, 5vw, 64px)` | Page-level horizontal padding (fluid) |

**The gap:** Zero tablet-specific breakpoints for any Development Advisor content. The locked state, the digest, the milestone cards, the pricing toggle, and the share card all render identically from 320px to 1400px — only the modal presentation changes.

---

## 2. Breakpoint System

Align with the existing dashboard page conventions. Add three advisor-specific tiers:

```
320px  →  374px   Small mobile  (compact narrow)
375px  →  599px   Mobile        (standard phone)
600px  →  899px   Tablet        (the missing tier)
900px  →  ∞       Desktop
```

The page already breaks its nav at `899px`. Use that as the desktop threshold for consistency.

---

## 3. Component-by-Component Adaptations

---

### 3.1 Locked State (`.adv-locked-wrap`)

**Desktop (900px+)**
- Centred column, `max-width: 520px`, `margin-inline: auto`
- Teaser cards: **2-column grid** side by side (the 3 cards → 2 on left row + 1 centred, or 3-column if space allows)
- Icon: 48px
- Title: 24px

**Tablet (600–899px)**
- Centred column, `max-width: 480px`
- Teaser cards: **2-column grid** (cards 1+2 top row, card 3 full-width below — or wrap naturally)
- Title: 22px (current) — no change needed

**Mobile (375–599px)**
- Single column, full-width, `padding: 0 20px`
- Teaser cards: **1-column stack** (current behaviour — keep)
- Title: 20px
- CTA button: full-width (already is)

**Small mobile (320–374px)**
- Title: 18px, reduce `margin-bottom` on icon to 10px
- Teaser card title: 12px
- Ensure "No card required. Cancel anytime." text doesn't wrap awkwardly — set `white-space: nowrap` or allow graceful wrap

```css
/* LOCKED STATE RESPONSIVE */
@media (min-width: 600px) {
  .adv-locked-wrap { max-width: 480px; }
  .adv-teaser-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  /* 3rd card spans both columns on tablet */
  .adv-teaser-cards .adv-teaser-card:last-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 900px) {
  .adv-locked-wrap { max-width: 560px; }
  .adv-locked-title { font-size: 24px; }
  .adv-locked-icon { font-size: 48px; }
  .adv-teaser-cards {
    grid-template-columns: repeat(3, 1fr);
  }
  /* On desktop all 3 cards sit side by side */
  .adv-teaser-cards .adv-teaser-card:last-child {
    grid-column: auto;
  }
}

@media (max-width: 374px) {
  .adv-locked-title { font-size: 18px; }
  .adv-locked-icon { font-size: 36px; margin-bottom: 10px; }
  .adv-teaser-card-title { font-size: 12px; }
}
```

---

### 3.2 Upsell Modal (`.adv-modal-sheet`)

**Current behaviour:** Bottom sheet on mobile → centred dialog at `560px+`. No max-width constraint, so on a 900px tablet it stretches to full viewport width with modal handle — looks wrong.

**Fix:**
- Mobile: full-width bottom sheet ✅ (keep)
- Tablet (600–899px): centred, `max-width: 440px`, `border-radius: 20px`
- Desktop (900px+): centred, `max-width: 480px`

```css
@media (min-width: 560px) {
  /* Already set: align-items: center, border-radius: 20px */
  .adv-modal-sheet { max-width: 440px; width: 100%; }
}

@media (min-width: 900px) {
  .adv-modal-sheet { max-width: 480px; }
}
```

---

### 3.3 Pricing Toggle (`.adv-pricing-toggle`)

**Current:** Two buttons side by side, flex row. Each button contains price, period, and optionally a badge ("Cancel anytime" or "Save $39"). At 320px both badges wrap to 3 lines and the toggle gets cramped.

**Tablet (600px+):** No change needed — the toggle fits cleanly.

**Mobile (375–599px):** Keep side-by-side. Reduce price font to 14px if needed.

**Small mobile (320–374px):** Stack the toggle vertically (column direction) so each plan gets full width. This is cleaner than squeezing two panels at 140px each.

```css
@media (max-width: 374px) {
  .adv-pricing-toggle { flex-direction: column; gap: 8px; }
  .adv-pricing-opt { width: 100%; }
  .adv-price-amount { font-size: 18px; }
}
```

---

### 3.4 Active Digest — Child Hero (`.adv-child-hero`)

**Current:** Flex row — name/age/phase label on left, emoji on right. Font sizes: name 20px, age 13px.

**Tablet:** No change needed.

**Mobile (375–599px):** Fine as-is.

**Small mobile (320–374px):** Emoji crowds the name. Reduce emoji to 30px and name to 17px so the row doesn't force a line break on long names.

```css
@media (max-width: 374px) {
  .adv-hero-name { font-size: 17px; }
  .adv-hero-emoji { font-size: 30px; }
  .adv-child-hero { padding: 13px 14px; }
}
```

---

### 3.5 Milestone Cards (`.adv-milestone-card`)

**Current:** Single column, full width, `padding: 18px`, `border-radius: 14px`. This works well on all screen sizes — no stacking or layout change needed.

**Tablet (600–899px):** Cards can breathe more. Slightly increase padding and line-height for comfortable reading.

**Desktop (900px+):** Consider a max-width constraint on the digest container so milestone cards don't stretch to 900px+ line lengths (readability degrades past ~680px).

```css
@media (min-width: 600px) {
  .adv-milestone-card { padding: 20px 22px; }
  .adv-milestone-body { font-size: 13.5px; line-height: 1.65; }
}

@media (min-width: 900px) {
  /* Constrain digest reading width */
  #adv-digest { max-width: 680px; }
  .adv-milestone-title { font-size: 16px; }
}
```

---

### 3.6 Card Footer (`.adv-card-footer`)

**Current:** Flex row — "Read the playbook →" on left, dismiss/share on right. At 320–360px this row gets very tight, especially if the playbook link is long (e.g. "Read the Sleep Training playbook →").

**Fix:** On small mobile, wrap the footer to two rows — link on top, actions below.

```css
@media (max-width: 420px) {
  .adv-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 14px;
  }
  .adv-card-footer > :last-child { align-self: flex-end; }
}
```

---

### 3.7 Urgent Banner (`.adv-urgent-banner`)

**Current:** Flex row — icon + text block. Clean on all sizes.

**Small mobile (320–374px):** Reduce icon size slightly and body font to 12px to prevent text overflow.

```css
@media (max-width: 374px) {
  .adv-ub-icon { font-size: 16px; }
  .adv-ub-text { font-size: 12px; }
}
```

---

### 3.8 Child Switcher Pill Row (`.adv-child-switcher`)

**Current:** Flex row with `flex-wrap: wrap`. Works correctly across all sizes — pills wrap to next line. ✅ No change needed.

---

### 3.9 Share Card Modal (`.adv-share-modal-card`)

**Current:** Fixed `margin: 18px` inside modal. The referral row (`.adv-smc-referral-row`) is flex — QR placeholder (52×52) + text side by side.

**Tablet:** The share card should respect the same `max-width: 440px` constraint of the modal sheet — already handled by modal fix above. ✅

**Small mobile (320–374px):** The QR + text row gets tight. Stack them vertically.

```css
@media (max-width: 374px) {
  .adv-share-modal-card { margin: 12px; }
  .adv-smc-referral-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .adv-smc-emoji { font-size: 36px; }
  .adv-smc-milestone { font-size: 16px; }
}
```

---

### 3.10 Settings Modal — Child Management Rows (`.adv-child-mgmt-row`)

**Current:** Flex row — emoji | name+age | action buttons. On small mobile the two action buttons ("Edit" + "Remove") can push past the row width.

```css
@media (max-width: 420px) {
  .adv-child-mgmt-row { flex-wrap: wrap; }
  .adv-cmr-actions {
    flex-basis: 100%;
    padding-top: 8px;
    border-top: 1px solid var(--border-light);
    margin-top: 4px;
  }
}
```

---

### 3.11 Onboarding Modal — Emoji Grid (`.adv-emoji-grid`)

**Current:** `flex-wrap: wrap`, `gap: 8px`. 10 emoji buttons at 36px each. On mobile this wraps to 2 rows of 5 — fine. On small mobile at 320px they may squeeze to 3 rows.

**Small mobile:** Increase button hit target but reduce font size so 5 per row still fits.

```css
@media (max-width: 374px) {
  .adv-emoji-opt { width: 38px; height: 38px; font-size: 18px; }
}
```

---

### 3.12 Wins Section (`.adv-win-card`)

**Current:** Full-width cards with green border. Fine on all sizes.

**Tablet (600px+):** Could display wins in a 2-column grid if there are ≥ 2 wins, since each win card is short (emoji + milestone name + share button).

```css
@media (min-width: 600px) {
  .adv-wins-section .adv-win-card-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  /* Requires wrapping win cards in a .adv-win-card-grid div in JS render */
}
```

> ⚠️ **Note:** This requires a JS change in `ff-advisor.js` where wins are rendered — wrap the win cards in a `<div class="adv-win-card-grid">` container.

---

## 4. Touch & Interaction

| Element | Issue | Fix |
|---|---|---|
| `.adv-unlock-btn` | 44px height ✅ | No change |
| `.adv-pricing-opt` | Minimum 44px touch target needed — currently padding-only | Add `min-height: 64px` |
| `.adv-dismiss-btn` | Text-only button, likely <44px hit area | Add `padding: 10px 12px` |
| `.adv-emoji-opt` | 36×36 — slightly below 44px minimum | Increase to 40×40 |
| `.adv-modal-close` | Close button size | Ensure `min-width: 44px; min-height: 44px` |
| `.adv-gift-input` | Font size must be 16px on iOS or keyboard zooms | Already `font-size: 14px` — **bump to 16px** |
| `.adv-ob-input` | Same as above — zoom risk on iOS | Bump to `font-size: 16px` on mobile |

```css
/* Touch target fixes */
.adv-pricing-opt { min-height: 64px; }
.adv-dismiss-btn { padding: 10px 12px; }
.adv-emoji-opt { width: 40px; height: 40px; }
.adv-modal-close { min-width: 44px; min-height: 44px; }

@media (max-width: 599px) {
  .adv-gift-input,
  .adv-ob-input { font-size: 16px; } /* Prevent iOS zoom */
}
```

---

## 5. Typography Scale Summary

| Element | Desktop | Tablet | Mobile | Small Mobile |
|---|---|---|---|---|
| Locked title | 24px | 22px | 20px | 18px |
| Upsell h1 | 20px | 19px | 19px | 17px |
| Milestone title | 16px | 15px | 14px | 13px |
| Milestone body | 13.5px | 13.5px | 13px | 12.5px |
| Child hero name | 20px | 20px | 20px | 17px |
| Teaser card title | 13px | 13px | 13px | 12px |

---

## 6. Complete CSS Block (Add to dashboard.html)

Place this block at the end of the `DEVELOPMENT ADVISOR TAB` CSS section (after line ~2176):

```css
/* ─────────────────────────────────────────────
   DEVELOPMENT ADVISOR — RESPONSIVE
   Tablet: 600–899px  |  Small mobile: ≤374px
   ───────────────────────────────────────────── */

/* Modal max-width constraint (tablet + desktop) */
@media (min-width: 560px) {
  .adv-modal-sheet { max-width: 440px; width: 100%; }
}
@media (min-width: 900px) {
  .adv-modal-sheet { max-width: 480px; }
}

/* Locked state: 2-column teaser cards on tablet */
@media (min-width: 600px) {
  .adv-locked-wrap { max-width: 480px; }
  .adv-teaser-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .adv-teaser-cards .adv-teaser-card:last-child {
    grid-column: 1 / -1;
  }
}

/* Locked state: 3-column teaser cards on desktop */
@media (min-width: 900px) {
  .adv-locked-wrap { max-width: 560px; }
  .adv-locked-title { font-size: 24px; }
  .adv-locked-icon { font-size: 48px; }
  .adv-teaser-cards { grid-template-columns: repeat(3, 1fr); }
  .adv-teaser-cards .adv-teaser-card:last-child { grid-column: auto; }
}

/* Digest max reading width on desktop */
@media (min-width: 900px) {
  #adv-digest { max-width: 680px; }
  .adv-milestone-title { font-size: 16px; }
}

/* Milestone cards — more breathing room on tablet+ */
@media (min-width: 600px) {
  .adv-milestone-card { padding: 20px 22px; }
  .adv-milestone-body { font-size: 13.5px; line-height: 1.65; }
}

/* Pricing min-height for touch target */
.adv-pricing-opt { min-height: 64px; }

/* Touch target fixes */
.adv-dismiss-btn { padding: 10px 12px; }
.adv-emoji-opt { width: 40px; height: 40px; }
.adv-modal-close { min-width: 44px; min-height: 44px; }

/* iOS input zoom prevention */
@media (max-width: 599px) {
  .adv-gift-input,
  .adv-ob-input { font-size: 16px; }
}

/* Card footer: stack on small screens */
@media (max-width: 420px) {
  .adv-card-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 11px 14px;
  }
  .adv-card-footer > :last-child { align-self: flex-end; }
}

/* Settings: child row wraps on small screens */
@media (max-width: 420px) {
  .adv-child-mgmt-row { flex-wrap: wrap; }
  .adv-cmr-actions {
    flex-basis: 100%;
    padding-top: 8px;
    border-top: 1px solid var(--border-light);
    margin-top: 4px;
  }
}

/* Small mobile: 320–374px */
@media (max-width: 374px) {
  .adv-locked-title { font-size: 18px; }
  .adv-locked-icon { font-size: 36px; margin-bottom: 10px; }
  .adv-teaser-card-title { font-size: 12px; }

  .adv-pricing-toggle { flex-direction: column; gap: 8px; }
  .adv-pricing-opt { width: 100%; }
  .adv-price-amount { font-size: 18px; }

  .adv-hero-name { font-size: 17px; }
  .adv-hero-emoji { font-size: 30px; }
  .adv-child-hero { padding: 13px 14px; }

  .adv-ub-icon { font-size: 16px; }
  .adv-ub-text { font-size: 12px; }

  .adv-share-modal-card { margin: 12px; }
  .adv-smc-referral-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .adv-smc-emoji { font-size: 36px; }
  .adv-smc-milestone { font-size: 16px; }

  .adv-emoji-opt { width: 38px; height: 38px; font-size: 18px; }
}
```

---

## 7. JS Change Required (Wins Grid)

In `ff-advisor.js`, find the section that renders win cards. Wrap the rendered wins in a grid container:

```js
// Before (current):
wins.forEach(win => { container.appendChild(renderWinCard(win)); });

// After:
const winGrid = document.createElement('div');
winGrid.className = 'adv-win-card-grid';
wins.forEach(win => { winGrid.appendChild(renderWinCard(win)); });
container.appendChild(winGrid);
```

---

## 8. Priority Order for Implementation

| Priority | Item | Effort |
|---|---|---|
| P0 | iOS input zoom fix (`font-size: 16px`) | 2 lines |
| P0 | Modal `max-width` constraint on tablet | 4 lines |
| P0 | Touch target fixes (pricing, close btn, dismiss) | 6 lines |
| P1 | Teaser cards 2-col grid on tablet | 10 lines |
| P1 | Card footer stack on small mobile | 8 lines |
| P1 | Digest `max-width` on desktop | 3 lines |
| P2 | Pricing toggle stack on 320px | 5 lines |
| P2 | Child hero font scale at 320px | 4 lines |
| P2 | Settings child row wrap | 6 lines |
| P3 | Wins 2-column grid (requires JS change) | 15 lines + JS |

---

_All CSS additions are additive — zero risk of regressions to existing desktop layout._
