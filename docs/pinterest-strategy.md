# FamilyForce Pinterest — Gemini Agent Operations Manual

**Product:** Scout by FamilyForce — monthly milestone emails + calendar invites, birth to age 3
**Site:** getfamilyforce.com
**Pinterest account:** to be confirmed after account creation
**Last updated:** 2026-03-25
**Maintained by:** Austin → handed to Gemini for ongoing execution

---

## 🚀 Day 1: How to Get Started

Read this first. Before touching any pin.

### Step 1 — Understand the product
Read these two files before creating anything:
- `projects/familyforce/docs/scout-product-spec.md` — what Scout is and how it works
- `projects/familyforce/docs/scout-content-priority1.md` — 217 milestone windows (your content engine)

### Step 2 — Check account status
Pinterest Business account and Postiz may or may not be set up yet. Ask jackhowdy:
> "Is the Pinterest Business account created? Is Postiz connected? What's the account URL?"

If not set up: proceed to Step 3 while jackhowdy sets up accounts. Do not wait idle.

### Step 3 — Start building pins immediately
While accounts are being set up, build the first batch of pins locally. You have everything you need:
- All fonts, node-canvas, brand constants are ready (see Environment Setup)
- Approved examples for all 4 pillars are in this document
- Use `pillar2-milestone.js` and `pillar4-explainer.js` as starting templates for new pins

Build 10 pins minimum before accounts are ready:
- 3 Pillar 1 (gift) pins
- 4 Pillar 2 (milestone) pins — one for each of 3mo, 6mo, 9mo, 12mo
- 2 Pillar 3 (humor) pins — use tagline bank below
- 1 Pillar 4 (explainer) pin

### Step 4 — Send drafts to jackhowdy for review
Use the messaging instructions below. Don't batch everything — send 2–3 at a time with a brief summary.

### Step 5 — Once accounts are live
Follow the Launch Sequence checklist at the bottom of this document.

---

## How to Communicate with jackhowdy

**Channel:** Telegram
**jackhowdy's Telegram chat ID:** `6100699624`
**Tool:** `message` action=send, channel=telegram, target=6100699624

### Sending pin drafts

Send each pin image individually with a short caption. Format:

```
[Pillar X — Pin title]
Self-review score: X/10
[One sentence on what makes it strong]
[Any open question if needed]
```

Example:
```
Pillar 2 — 9 Month Milestones
Self-review score: 9.5/10
Strong hook ("separation anxiety starts now — here's why"), full height used, all cards human copy.
Ready to lock unless you want copy changes.
```

**Never send more than 3 pins in one message burst.** Give jackhowdy space to respond before sending more.

### What needs jackhowdy's approval (always ask)
- Any pin before it goes live for the first time (new pin types, new formats)
- New board creation (name + description)
- Any copy that could be controversial, political, or medically sensitive
- Pricing or product claims (always verify against `scout-product-spec.md`)
- If a pin scores below 9/10 in your self-review but you're unsure why

### What you can do autonomously (no approval needed)
- Build and iterate on pins (as many drafts as needed)
- Generate AI photos for compositing
- Schedule approved pins in Postiz
- Run daily performance reviews and act on signals (double winners, fix underperformers)
- Create new milestone pins using the Pillar 2 template — one per milestone window
- Repin existing approved content to new boards

### How often to update jackhowdy
- **Daily (morning HKT):** Send a 2–3 line summary if anything notable happened (viral pin, underperformer, milestone hit)
- **When you have 3+ new pins ready:** Send for review
- **When blocked:** Message immediately, don't wait

### jackhowdy's timezone
HKT (UTC+8). Best time to send: 8am–10pm HKT. Do not send non-urgent messages between 10pm–8am HKT.

---

## For Gemini: What You Are Doing

You are the dedicated Pinterest operator for FamilyForce/Scout. Your job is to:

1. **Create pins** using node-canvas (exact instructions below)
2. **Schedule pins** via Postiz API
3. **Review performance** every morning (pins from 3 days ago)
4. **Act on signals** — double what works, fix or kill what doesn't
5. **Update this document** when you learn something new

Pinterest is a search engine. Every pin title, description, and board name must target keywords parents actually search. Never write for the brand — write for the searcher.

When in doubt about what to create: open `projects/familyforce/docs/scout-content-priority1.md`. That file contains 217 developmental milestone windows. Each one is a pin topic. Use the window title as the search keyword.

---

## Environment Setup

### Working directory
```
/home/node/.openclaw/workspace/
```

### node-canvas
Available at: `/app/node_modules/canvas`
Require it as:
```js
const { createCanvas, loadImage, registerFont } = require('/app/node_modules/canvas');
```

### Outfit fonts — CRITICAL
These are the **only working** Outfit TTF files. The files in `/tmp/fonts/` and `~/.local/share/fonts/` are corrupt HTML files — do not use them.

```
/tmp/Outfit-Bold.ttf       → weight 700
/tmp/Outfit-Regular.ttf    → weight 400
/tmp/Outfit-SemiBold.ttf   → weight 600
```

Register at the top of every canvas script:
```js
registerFont('/tmp/Outfit-Regular.ttf', { family: 'Outfit', weight: '400' });
registerFont('/tmp/Outfit-SemiBold.ttf', { family: 'Outfit', weight: '600' });
registerFont('/tmp/Outfit-Bold.ttf',    { family: 'Outfit', weight: '700' });
```

### Brand constants
```js
const PURPLE_DARK = '#5B3CC4';   // backgrounds, overlays
const PURPLE_MAIN = '#6E4ED6';   // accents, gradients
const WHITE       = '#ffffff';
const GOLD        = '#FFD700';   // stars only
```

### Output directory
All generated pins save to:
```
/home/node/.openclaw/workspace/
```
Name files descriptively: `pin-gift-registry-reality-v1.png`, `pin-milestone-4month-sleep-v1.png` etc.

### Existing assets (do not regenerate — use these)
```
workspace/pinterest-scout-gift-v5.png     → gift pillar hero pin (READY TO POST)
workspace/carousel-01.png through 06.png  → "Registry vs. Reality" carousel (READY TO POST)
workspace/photo-slide2.jpg                → tired parent, 3am phone glow
workspace/photo-slide3.jpg                → parent staring at baby monitor
workspace/photo-slide4.jpg                → parent struggling to swaddle
workspace/photo-slide5.jpg                → unused diaper bag on hook
workspace/carousel-build.js               → carousel build script (reference for new scripts)
```

---

## Pin Dimensions and Safe Zones

### Standard Pinterest pin
```
Width:  1000px
Height: 1500px (2:3 ratio)
```

### Safe text zone — MANDATORY
Pinterest crops edges in the feed. Never place text outside this zone:
```
Top boundary:    y = 150  (top 10% = no text)
Bottom boundary: y = 1200 (bottom 20% = no text)
Left/right:      x = 60 to x = 940 (30px each side minimum)
```

### Instagram carousel slide
```
Width:  1080px
Height: 1080px (square)
```

---

## Pin Design System

All pins must be consistent with the established FamilyForce visual identity. Study `pinterest-scout-gift-v5.png` as the gold standard. Here is the exact design system:

### Backgrounds
- Full canvas fill: `#5B3CC4`
- Vignette (add depth): radial gradient, center transparent, edges `rgba(20, 8, 60, 0.35)`
- Photo overlay (when using a photo): linear gradient from transparent purple → solid `#5B3CC4`, starting at 55–60% down the image

### Typography hierarchy
```
Headline / quote:    Outfit 700, 52–62px, #ffffff, shadow rgba(0,0,0,0.45) blur 12
Subheader:           Outfit 400, 24–28px, rgba(255,255,255,0.88)
Label (small caps):  Outfit 600, 14–16px, rgba(255,255,255,0.50), uppercase
Brand name "Scout":  Outfit 700, 82–108px, #ffffff
"by FamilyForce":    Outfit 400, 20–24px, rgba(255,255,255,0.58)
Price / URL:         Outfit 600, 16–18px, rgba(255,255,255,0.35–0.40)
Stars:               Outfit 400, 28–38px, #FFD700
Social proof:        Outfit 600, 17–20px, rgba(255,255,255,0.76–0.80)
```

### Standard brand footer (bottom of every pin, inside safe zone)
```
★★★★★
The gift new parents actually open
Scout  ·  by FamilyForce  ·  From $9.99
getfamilyforce.com
```
Adjust opacity and size based on available space. Always include at minimum "Scout by FamilyForce" and the URL.

### Dividers
```js
ctx.strokeStyle = 'rgba(255,255,255,0.20)';
ctx.lineWidth   = 1;
// Draw a horizontal line, typically 120–160px wide, centered
```

### Rounded card elements (registry-style boxes)
```js
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
// Fill with: ctx.fillStyle = 'rgba(255,255,255,0.09)'; ctx.fill();
```

---

## node-canvas Pin Templates

### Template A: Text-only pin (education / humor)
Use for milestone education and relatable humor pins. No photo needed.

```js
const { createCanvas, registerFont } = require('/app/node_modules/canvas');
const fs = require('fs');

registerFont('/tmp/Outfit-Regular.ttf', { family: 'Outfit', weight: '400' });
registerFont('/tmp/Outfit-SemiBold.ttf', { family: 'Outfit', weight: '600' });
registerFont('/tmp/Outfit-Bold.ttf',    { family: 'Outfit', weight: '700' });

const W = 1000, H = 1500;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// Background
ctx.fillStyle = '#5B3CC4';
ctx.fillRect(0, 0, W, H);

// Vignette
const vignette = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 900);
vignette.addColorStop(0, 'rgba(255,255,255,0)');
vignette.addColorStop(1, 'rgba(20, 8, 60, 0.35)');
ctx.fillStyle = vignette;
ctx.fillRect(0, 0, W, H);

// ── YOUR CONTENT HERE ─────────────────────────────────
// Safe zone: y=150 to y=1200, x=60 to x=940
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// Eyebrow label
ctx.font      = '600 15px Outfit';
ctx.fillStyle = 'rgba(255,255,255,0.50)';
ctx.fillText('WHAT TO EXPECT AT 4 MONTHS', W/2, 240);

// Main headline (manual line breaks — do NOT use auto-wrap)
ctx.font         = '700 58px Outfit';
ctx.fillStyle    = '#ffffff';
ctx.shadowColor  = 'rgba(0,0,0,0.45)';
ctx.shadowBlur   = 12;
ctx.shadowOffsetY = 3;
ctx.fillText('The 4-month', W/2, 420);
ctx.fillText('sleep regression', W/2, 496);
ctx.fillText('is real.', W/2, 572);
ctx.shadowColor  = 'transparent';

// Divider
ctx.strokeStyle = 'rgba(255,255,255,0.20)';
ctx.lineWidth = 1;
ctx.beginPath(); ctx.moveTo(400, 630); ctx.lineTo(600, 630); ctx.stroke();

// Body copy (manual line breaks)
ctx.font      = '400 26px Outfit';
ctx.fillStyle = 'rgba(255,255,255,0.88)';
ctx.fillText("Here's what's happening in", W/2, 700);
ctx.fillText("their brain — and what", W/2, 736);
ctx.fillText("actually helps.", W/2, 772);

// ── STANDARD BRAND FOOTER ──────────────────────────────
ctx.font      = '400 30px Outfit';
ctx.fillStyle = '#FFD700';
ctx.fillText('★★★★★', W/2, 980);

ctx.font      = '600 18px Outfit';
ctx.fillStyle = 'rgba(255,255,255,0.76)';
ctx.fillText('The gift new parents actually open', W/2, 1020);

ctx.strokeStyle = 'rgba(255,255,255,0.20)';
ctx.beginPath(); ctx.moveTo(430, 1060); ctx.lineTo(570, 1060); ctx.stroke();

ctx.font      = '700 72px Outfit';
ctx.fillStyle = '#ffffff';
ctx.fillText('Scout', W/2, 1110);

ctx.font      = '400 22px Outfit';
ctx.fillStyle = 'rgba(255,255,255,0.58)';
ctx.fillText('by FamilyForce  ·  From $9.99', W/2, 1158);

ctx.font      = '600 17px Outfit';
ctx.fillStyle = 'rgba(255,255,255,0.38)';
ctx.fillText('getfamilyforce.com', W/2, 1188);
// ─────────────────────────────────────────────────────

fs.writeFileSync('/home/node/.openclaw/workspace/pin-output.png', canvas.toBuffer('image/png'));
console.log('Saved.');
```

### Template B: Photo pin (gift / humor with photo)
Use when a relatable photo is available. Copies the approach from `pinterest-scout-gift-v5.png`.

```js
const { createCanvas, loadImage, registerFont } = require('/app/node_modules/canvas');
const fs = require('fs');

registerFont('/tmp/Outfit-Regular.ttf', { family: 'Outfit', weight: '400' });
registerFont('/tmp/Outfit-SemiBold.ttf', { family: 'Outfit', weight: '600' });
registerFont('/tmp/Outfit-Bold.ttf',    { family: 'Outfit', weight: '700' });

const W = 1000, H = 1500, PHOTO_H = 1125; // photo = 75% of height
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

async function render() {
  // Background
  ctx.fillStyle = '#5B3CC4';
  ctx.fillRect(0, 0, W, H);

  // Photo (cover-fit, top-aligned)
  const img = await loadImage('/path/to/your/photo.jpg');
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, PHOTO_H); ctx.clip();
  const scale = Math.max(W / img.width, PHOTO_H / img.height);
  ctx.drawImage(img, (W - img.width * scale) / 2, 0, img.width * scale, img.height * scale);
  ctx.restore();

  // Gradient overlay — purple family, seamless blend
  const grad = ctx.createLinearGradient(0, 540, 0, PHOTO_H);
  grad.addColorStop(0,    'rgba(91, 60, 196, 0)');
  grad.addColorStop(0.48, 'rgba(70, 40, 165, 0.58)');
  grad.addColorStop(0.82, 'rgba(91, 60, 196, 0.95)');
  grad.addColorStop(1,    'rgba(91, 60, 196, 1)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 540, W, PHOTO_H - 540);

  // Quote text on photo (manual line breaks)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 58px Outfit'; ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
  ctx.fillText('"Line one of quote"', W/2, 924);
  ctx.fillText('line two of quote."', W/2, 996);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;

  // ── STANDARD BRAND FOOTER (in bottom 375px section) ──
  const B = PHOTO_H; // 1125
  ctx.font = '400 34px Outfit'; ctx.fillStyle = '#FFD700';
  ctx.fillText('★★★★★', W/2, B + 44);
  ctx.font = '600 19px Outfit'; ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('The gift new parents actually open', W/2, B + 82);
  ctx.font = '400 24px Outfit'; ctx.fillStyle = 'rgba(255,255,255,0.90)';
  ctx.fillText('Be the friend who gave them', W/2, B + 138);
  ctx.fillText('what they actually needed.', W/2, B + 170);
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(440, B + 204); ctx.lineTo(560, B + 204); ctx.stroke();
  ctx.font = '700 90px Outfit'; ctx.fillStyle = '#ffffff';
  ctx.fillText('Scout', W/2, B + 284);
  ctx.font = '400 21px Outfit'; ctx.fillStyle = 'rgba(255,255,255,0.58)';
  ctx.fillText('by FamilyForce  ·  From $9.99', W/2, B + 342);
  ctx.font = '600 16px Outfit'; ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('getfamilyforce.com', W/2, B + 374);
  // ─────────────────────────────────────────────────────

  fs.writeFileSync('/home/node/.openclaw/workspace/pin-output.png', canvas.toBuffer('image/png'));
  console.log('Saved.');
}
render().catch(console.error);
```

### Generating photos with AI (when you need a relatable parenting image)
Use the Gemini image generation tool. Describe the scene in detail — candid, warm, realistic, slightly editorial. No text in the image. Example prompt:

> *"A tired parent (gender neutral, late 20s) sitting in a dark nursery at 3am, face lit by phone glow, baby asleep in the background. Candid, realistic, warm lighting. No text."*

Save the result as a JPG and use it in Template B.

---

## Content Pillars — What to Create

### Pillar 1: Baby Shower Gift (30% of output)
**Goal:** Save from someone planning a baby shower. Gifter POV.
**CTA:** "From $9.99 · getfamilyforce.com"

Pin ideas (create these):
- "Best baby shower gifts 2026" — roundup format
- "Nobody puts this on the registry" — use existing `pinterest-scout-gift-v5.png`
- "Baby shower gift under $50 that actually gets used"
- "Digital baby shower gift — delivered instantly"
- "Last minute baby shower gift idea"
- "What new parents actually need (hint: it's not on the registry)"
- "The baby shower gift that works for 3 years"

Target search keywords:
`baby shower gift ideas` · `unique baby shower gifts` · `best baby shower gifts 2026`
`baby shower gifts for new mom` · `thoughtful baby shower gifts` · `digital baby shower gift`
`last minute baby shower gift` · `baby shower gift under $50`

---

### ✅ APPROVED EXAMPLE — Pillar 1 Carousel: "Registry vs. Reality"

> **This is the canonical Pillar 1 format. All future Pillar 1 carousels must follow these rules.**

**Files:**
- Build script: `pinterest-pillar1.js`
- Output: `p1-slide-01.png` through `p1-slide-05.png`
- Photos: `photo-cover-b4.jpg` (cover), `photo-slide2.jpg` (white noise), `photo-slide4.jpg` (swaddle), `photo-slide3-v6.jpg` (monitor)

**Format:** Pinterest carousel, 5 slides, 1000×1500px

**Slide structure:**
| Slide | Content | Photo |
|-------|---------|-------|
| 1 | Cover hook: "What's on every baby registry…" | Exhausted parent, 3am, newborn on chest, nightlight glow |
| 2 | ON THE REGISTRY: White Noise Machine → REALITY: "Still Googling 'why won't my 4-month-old sleep' at 3am." | 3am phone glow |
| 3 | ON THE REGISTRY: Organic Swaddle Set → REALITY: "Didn't know swaddling stops working at 8 weeks. Nobody told them." | Swaddle scene |
| 4 | ON THE REGISTRY: Video Baby Monitor → REALITY: "Watched it for 45 minutes. Convinced the baby stopped breathing. (They were fine.)" | Parent face lit by monitor glow, side profile |
| 5 | Scout CTA — "What they actually needed." | Purple only, no photo |

**⚠️ MANDATORY DESIGN RULES (learned from review):**

1. **Photo = 75% of graphic, always.** `PHOTO_H = Math.round(H * 0.75)` = 1125px on 1500px canvas. Never less.

2. **Gradient must start at 82% of PHOTO_H**, not earlier. `fadeStart = Math.round(PHOTO_H * 0.82)` = ~923px. If the gradient starts too early, the photo visually reads as smaller than 75% and jackhowdy will flag it.
   ```js
   const fadeStart = Math.round(PHOTO_H * 0.82);
   const botGrad = ctx.createLinearGradient(0, fadeStart, 0, PHOTO_H);
   ```

3. **Font sizes must be large enough to read on a phone.** Minimum sizes:
   - Punchline/hero text: `700 56px+`
   - Registry item name: `700 46px+`
   - Body/descriptor: `400 34px+`
   - Labels/eyebrows: `600 16px+`
   - Never use anything below 16px

4. **CTA slide (slide 5) must fill the full 1500px height.** Do not cluster text in the middle. Start content at y≈180, end at y≈1150, brand mark at y≈1450.

5. **Gifter POV always.** Copy talks to the person buying the gift, not the parent receiving it.

6. **Cover photo: exhausted parent, real moment, no props.** Avoid AI-looking elements (lampshades, glowing orbs, decorative objects). Simple = better. Nightlight on wall > table lamp.

7. **Baby monitor photo rule:** You cannot show both the screen facing the viewer AND the parent looking at it simultaneously. Use a side-profile shot with the monitor glow lighting the parent's face. Do not attempt a front-facing monitor with front-facing parent — it never works.

8. **Photo review before compositing.** Always verify the raw photo before building the slide. Send raw photo to jackhowdy if anything is ambiguous (e.g. "is this swaddling?").

**Pinterest copy for this carousel:**

```
TITLE:
What Every Baby Registry Gets Wrong (And What New Parents Actually Needed)

DESCRIPTION:
Everyone buys the baby gear. Nobody buys the thing that actually helps. Scout sends new parents a monthly email + calendar invite timed to their baby's exact developmental stage — so they're never caught off guard. From birth to age 3. The baby shower gift that works from day one.

Baby shower gift ideas · unique baby gifts · new parent gift · baby milestone tracker · developmental milestones baby · what to get a new mom · practical baby shower gifts · best baby gifts 2026

BOARD: Baby Shower Gift Ideas
URL: https://getfamilyforce.com/scout?utm_source=pinterest&utm_medium=pin&utm_campaign=gift&utm_content=registry-vs-reality
```

---

### Pillar 2: Milestone Education (35% of output)
**Goal:** Reach and authority. Soft CTA only.
**CTA:** "Scout sends you this before it happens. getfamilyforce.com"

**How to generate content from Scout's milestone data:**
1. Open `projects/familyforce/docs/scout-content-priority1.md`
2. Pick any milestone window — use the title as the search keyword
3. Use `why_it_matters` as the hook, `what_to_do` as the value
4. Design a text-only pin (Template A) with that content

Pin ideas (repeatable series):
- "What to expect at [X] months" — create one for every month 1–36
- "The [X]-month sleep regression — what's happening and what helps"
- "When does swaddling stop working?" — 8-week transition
- "Baby led weaning — when to start and what to offer first"
- "12-month milestone checklist — is your baby on track?"
- "Separation anxiety at 9 months — why it happens and what to do"
- "The language explosion — what to expect at 18 months"

Target search keywords (examples):
`4 month sleep regression` · `when does swaddling stop working` · `6 month milestones`
`baby development month by month` · `12 month milestones` · `newborn sleep schedule`
`when do babies start talking` · `tummy time tips` · `baby led weaning`

---

### ✅ APPROVED EXAMPLE — Pillar 2 Single Pin: "12 Month Milestones"

**File:** `p2-milestone-12mo.png`
**Build script:** `pillar2-milestone.js`
**Format:** Single static pin, 1000×1500px, text-only (no photo)

**Design:** Purple background, full-height layout, 5 milestone cards + teaser row.

**⚠️ MANDATORY DESIGN RULES for Pillar 2 (learned from review):**

1. **Fill the full 1500px height.** No dead space at top or bottom. Start content at y≈58, end at y≈1466. Leaving empty canvas = wasted visual impact in the feed.

2. **Subtitle must be charged and specific, not generic.** Use this pattern:
   *"[X] things your baby should be doing at [age] — and what to do if not"*
   Never: "What to expect at X months" (too passive, won't get saved).

3. **Card body copy must be human and reassuring, not clinical.**
   - ❌ "Walking independently peaks 10–15 months."
   - ✅ "Most babies walk between 10–15 months. Earlier or later is both normal."
   Parents save things that sound like advice from a knowledgeable friend.

4. **CTA line is the money line — make it dominant.**
   - Font: `700 38px+`, white, with shadow
   - "Scout sends you this before it happens." — bold, centered, unmissable
   - Add a second line below in lighter weight: "Monthly emails timed to your baby's age."

5. **Hexicon bullets:** Draw with canvas path, not emoji. Use `drawHex(ctx, cx, cy, r, fill, stroke)`.
   - Filled hex: `rgba(255,255,255,0.18)` fill + `rgba(255,255,255,0.60)` stroke
   - Outline-only hex (teaser row): no fill + `rgba(255,255,255,0.42)` stroke

6. **"+X more milestones happening this month"** teaser row at the bottom of the list.
   - Dashed border: `ctx.setLineDash([7, 5])`
   - Lighter text: `rgba(255,255,255,0.58)`
   - Drives curiosity — implies more value than shown

7. **No photos needed.** Pillar 2 is text-only. Purple background with depth gradient only.

8. **Content source:** Always pull real data from `projects/familyforce/docs/scout-content-priority1.md`. Use `why_it_matters` for the card body. Rewrite in human voice — never copy raw text directly.

**Pinterest copy:**

```
TITLE:
12 Month Baby Milestones — What to Expect When Your Baby Turns 1

DESCRIPTION:
Is your baby hitting these milestones? At 12 months, most babies are taking first steps, pointing to share interest, using "mama" and "dada" on purpose, and saying their first real words. Here's what to watch for — and what to do if you're not seeing it yet. Scout sends parents a monthly email timed to their baby's exact age so you always know what's coming before it arrives.

12 month baby milestones · baby development 12 months · what should my baby be doing at 1 year · first birthday milestones · baby milestone checklist · 1 year old development · when do babies walk · baby first words · developmental milestones month by month

BOARD: Baby Development Month by Month
URL: https://getfamilyforce.com/scout?utm_source=pinterest&utm_medium=pin&utm_campaign=milestone&utm_content=12-month-milestones
```

---

### Pillar 3: Relatable Humor (20% of output)
**Goal:** Saves. Brand awareness. No hard sell.
**CTA:** Brand mark only — "Scout by FamilyForce"

Pin ideas:
- Variations on the tantrum pin (`pinterest-scout-gift-v5.png` approach)
- "Things nobody tells you about month [X]" text card series
- "Month 3 of parenthood. Nobody prepared them." — dark purple, white bold text
- Quote cards: real, honest parenting observations
- "Before the baby shower vs. after" contrast cards
- Use AI-generated photos from `photo-slide2.jpg` through `photo-slide5.jpg`

Design: same templates as above but no URL or price — just "Scout by FamilyForce" watermark.

---

### ✅ APPROVED EXAMPLE — Pillar 3 Single Pin: "Nobody put this on the registry."

**File:** `pinterest-scout-gift-v5.png`
**Format:** Single static pin, 1000×1500px

**Design:** Tantrum baby photo (top 75%) + purple brand section (bottom 25%).
- Hook: "Nobody put this on the registry."
- Subheader: "Be the friend who gave them what they actually needed."
- Social proof bar: "The gift new parents actually open"
- Attribution: "by FamilyForce · From $9.99 · getfamilyforce.com"

**Note:** jackhowdy chose to keep the tantrum photo over a softer benefit-focused image. The raw, real moment is intentional.

**Pinterest copy:**

```
TITLE:
Nobody Put This on the Baby Registry

DESCRIPTION:
The white noise machine didn't cut it at 3am. The swaddle stopped working at 8 weeks. Nobody told them. Scout sends new parents a monthly email + calendar invite timed to their baby's exact developmental stage — so they know what's coming before it arrives. The gift that actually gets used, from birth to age 3.

unique baby shower gift · baby shower gift ideas · new parent gift · baby developmental stages · what new parents actually need · funny parenting · relatable mom · honest parenting

BOARD: Real Parenting Moments
URL: https://getfamilyforce.com/scout?utm_source=pinterest&utm_medium=pin&utm_campaign=humor&utm_content=nobody-put-this-on-registry
```

---

### 📋 APPROVED TAGLINE BANK — Pillar 3

Use these as the primary text/hook for future Pillar 3 pins. Pick one per pin.

**Punchy / Funny**
1. "Nobody put this on the registry." ✅ *(used in v5)*
2. "The onesie was a gift. The meltdown was not."
3. "Congrats on the baby shower. This is also coming."
4. "47 gifts. None of them were for this."

**Honest / Knowing**
5. "Every parent meets this moment. The good ones are ready."
6. "The cute photos are real. So is this."
7. "This moment doesn't care about your sleep schedule."

**Wry / Dry**
8. "He had big feelings. She had a flight to catch."
9. "It's not a phase. It's a Tuesday."
10. "You can't Amazon Prime your way out of this one."

**How to use this bank:**
- Pick a tagline → generate a matching AI photo (real, raw parenting moment)
- Composite using Template B (photo pin) from the Templates section
- Photo = 75% of graphic. Gradient starts at 82% of PHOTO_H. Fonts 56px+ for hero text.
- CTA = brand mark only ("Scout by FamilyForce") — NO price, NO URL on Pillar 3 pins
- Board: "Real Parenting Moments" or "Honest Parenting"

---

### Pillar 4: Product Explainer (15% of output)
**Goal:** Convert followers into signups.
**CTA:** "Try Scout Free · getfamilyforce.com"

Pin ideas:
- "What is Scout?" — 3-step graphic: (1) signup, (2) monthly email, (3) calendar invite
- "One email. One calendar invite. Three years covered." — text pin
- "How Scout works" — simple flow diagram
- Testimonial quote cards
- "Scout knows what month your baby is at. Always." — bold statement pin

---

### ✅ APPROVED EXAMPLE — Pillar 4 Single Pin: "How Scout Works"

**File:** `p4-explainer.png`
**Build script:** `pillar4-explainer.js`
**Format:** Single static pin, 1000×1500px, text-only (no photo)

**Design:** Purple background, problem hook → timeline 3-step flow → CTA.

**⚠️ MANDATORY DESIGN RULES for Pillar 4 (learned from review):**

1. **Open with a problem, not the product name.** The hook must hit a felt pain before mentioning Scout.
   - ✅ *"By the time you Google it, the window has already closed."*
   - ❌ *"Scout — Monthly milestone emails. Birth to age 3."* (no one cares yet)

2. **Pivot line immediately after the hook.** One short sentence that bridges problem → solution.
   - *"Scout changes that."* — 3 words. Do not elaborate here.

3. **Use a timeline layout for the 3 steps**, not 3 disconnected cards.
   - Vertical line runs down TIMELINE_X connecting all cards
   - Hexicon badges sit ON the line at each card's midpoint
   - Arrow at bottom of line pointing into card 3
   - This makes it read as a journey, not a list.

4. **URL appears exactly once.** Put it in the CTA section ("From $9.99 · getfamilyforce.com"). Brand mark at the bottom should be text-only: "Scout by FamilyForce" — no URL.

5. **CTA section must be 3 lines deep** to fill vertical space:
   - Line 1: "Try Scout Free" — `700 52px`, dominant
   - Line 2: "No credit card required." — `400 30px`, reassurance
   - Line 3: "Monthly emails. Birth to age 3." — `400 28px`, value reminder
   - Then divider → "From $9.99 · getfamilyforce.com"

6. **Full 1500px height used.** No dead space. Steps should end at ~y=1130 so CTA has ~350px.

7. **No photos needed.** Pillar 4 is text-only like Pillar 2.

**Pinterest copy:**

```
TITLE:
How Scout Works — Monthly Baby Milestone Emails That Know Your Baby's Exact Age

DESCRIPTION:
By the time you Google what's happening with your baby, the window has already closed. Scout changes that. Sign up with your baby's birthday, get a monthly email timed to their exact developmental stage, and know what's coming before it arrives — every month, from birth to age 3. Try it free. No credit card required.

baby milestone tracker · baby development app · new parent must haves · baby milestone emails · what is scout familyforce · baby developmental stages month by month · newborn baby app · best apps for new parents · baby milestone gift

BOARD: New Parent Must-Haves
URL: https://getfamilyforce.com/scout?utm_source=pinterest&utm_medium=pin&utm_campaign=explainer&utm_content=how-scout-works
```

---

## ⚠️ MANDATORY: Self-Review Before Every Submission

**This is not optional. Every single pin must go through this process before jackhowdy sees it.**

### Step 1 — Build the draft

### Step 2 — Run the senior marketer critique

After building, ask yourself — in the voice of a senior Pinterest marketer who has worked with many leading brands:

> *"You're a senior Pinterest marketer who has worked with many leading brands. What is your honest feedback on this pin? Will this work?"*

Answer honestly and in full. Do not skip this step. Do not tell yourself it's "good enough." Give the same level of critical feedback you would give to a major brand client paying for your expertise.

### Step 3 — Incorporate ALL feedback

Take every issue you identified and fix it. Rebuild. Then re-run the critique on the new version.

### Step 4 — Submit only when score is 9.5/10 or 10/10

**Do not submit anything below 9.5/10 to jackhowdy. Ever.**

If your honest senior marketer score is 7/10 or 8/10 — rebuild. If it's 8.5/10 — identify the exact gaps and fix them before submitting. Only submit at 9.5 or above.

This is not about perfectionism. It's about respecting jackhowdy's time. Every submission should be ready to publish, not a work-in-progress.

---

### Self-review checklist (run on every pin):

1. **Does it stop the scroll?** Would this pin make someone pause in a busy Pinterest feed? If not, the hook is wrong.
2. **Does it open with a problem, not a product?** Cold audiences don't care about Scout. They care about their problem first.
3. **Is the photo 75% of the graphic?** (Photo pins only.) Gradient starts at 82% of PHOTO_H, not earlier.
4. **Are all fonts large enough to read on a phone?** Hero text: 56px+. Body: 28px+. Labels: 16px+. Nothing smaller.
5. **Is the full 1500px height used?** No dead space at top or bottom. Content starts at y≈55, ends at y≈1460.
6. **Is the CTA the visual anchor?** It must be the boldest non-hero text on the pin. Never let it sit quietly.
7. **Is the copy human and emotional?** Not clinical. Not generic. Not like a product brochure. Like a knowledgeable friend.
8. **Would a parent save this?** Pinterest is save-driven. If someone wouldn't save it, it won't perform.
9. **Does the design follow all pillar rules?** Check the approved example for this pillar before building.
10. **Would you be proud to show this to a leading brand?** If not, rebuild.
11. **Is there any dead space?** Any gap larger than ~60px with no content is dead space. Fill it or compress it.
12. **Does the URL appear more than once?** It should appear exactly once. Fix duplication.

**The bar is 9.5/10 or 10/10. Nothing below that reaches jackhowdy.**

---

## Daily Operations

### Every morning — 20-minute review

Pull analytics from Postiz for pins published **exactly 3 days ago**. Pins need ~72 hours to surface in search and accumulate early signals.

For each pin from 3 days ago, check:

| Metric | What it means | Action threshold |
|--------|--------------|-----------------|
| Impressions | Is Pinterest surfacing it? | <50 in 3 days = rewrite title + description |
| Save rate | Saves ÷ impressions | <1% = redesign; >5% = make 2 variations today |
| Clicks | Traffic to getfamilyforce.com | Any clicks = working; 0 clicks on gift pin after 3 days = fix CTA |

**Daily actions based on review:**
- **Top performer (save rate >5%)** → create 2 variations today. Same concept, different image or different headline angle.
- **Mid performer (1–5% save rate)** → leave it. Check again in 3 more days.
- **Low performer (<1% save rate, decent impressions)** → redesign: new image or new copy angle. Repin to a more relevant board.
- **Zero impressions** → rewrite the title and description entirely. Use stronger, more specific keywords. Move to a better-matched board.

### Every day — 30-minute interaction

Do this to signal to Pinterest that the account is active:

1. Save 10–15 high-quality parenting pins to FamilyForce boards (not competitors)
2. Leave 5–10 genuine comments on trending pins in the parenting/baby category
3. Respond to every comment on FamilyForce pins
4. Follow 5–10 relevant accounts (new parent bloggers, baby product accounts, gift accounts)

### Weekly (Monday — 2 hours)

1. Pull top 10 pins from the past 7 days in Postiz (by saves)
2. Identify the pattern — what pillar, what format, what angle performed best?
3. Plan the week around that signal — lean into what's working
4. Create 35 pins for the week (5 fresh/day):
   - 10–11 gift pillar
   - 12 milestone pillar
   - 7–8 humor pillar
   - 4–5 explainer pillar
5. Schedule all 35 in Postiz, spread evenly Mon–Sun
6. Also schedule 5 repins/day (curated content — schedule in Postiz)

### Monthly (1st of each month — 2 hours)

1. Review save rate trend by pillar — which is strongest?
2. Kill any content format that hasn't produced a >2% save rate in 4+ weeks
3. Double volume on the top-performing pillar
4. Introduce one new experiment (new image style, new topic, new CTA angle)
5. Pull UTM data from GA — which pins drove signups? What's the Pinterest→signup conversion?
6. Update this document with learnings

---

## Posting Schedule (Postiz)

### Setup
- Connect Pinterest Business account to Postiz
- Configure UTM template for all pins:
  ```
  ?utm_source=pinterest&utm_medium=pin&utm_campaign=[pillar]&utm_content=[slug]
  ```
  Pillar values: `gift` · `milestone` · `humor` · `explainer`

- Example full URL:
  ```
  https://getfamilyforce.com/?utm_source=pinterest&utm_medium=pin&utm_campaign=gift&utm_content=nobody-put-this-registry
  ```

### Volume targets by phase

| Phase | Fresh pins/day | Repins/day | Total |
|-------|---------------|------------|-------|
| Weeks 1–4 | 5 | 5 | 10/day |
| Months 2–3 | 8–10 | 5 | 13–15/day |
| Month 4+ | 10–15 | 5 | 15–20/day |

### Best posting times (Pinterest)
- 8–11pm local time (wherever audience is — US-centric: EST)
- Saturdays and Sundays highest engagement for gift content
- Weekdays 7–9am for milestone/education content (morning scroll)
- Spread pins throughout the day, not all at once

---

## Boards — Create These First

Create all 10 boards before posting any pins. Each board needs a keyword-rich description.

| Board name | Primary keyword | Pin pillars |
|-----------|----------------|-------------|
| Baby Shower Gift Ideas 2026 | baby shower gift ideas | Gift |
| Baby Milestone Tracker Month by Month | baby milestones | Milestone |
| New Mom Tips and Survival Guide | new mom tips | Humor + Milestone |
| Funny Parenting Moments | funny parenting | Humor |
| Baby Development First Year | baby development | Milestone |
| Sleep Training and Sleep Regressions | sleep regression | Milestone |
| Baby Feeding and Starting Solids | baby led weaning | Milestone |
| Toddler Development Year 2 and 3 | toddler milestones | Milestone |
| Best Gifts for New Parents | gifts for new parents | Gift |
| Scout by FamilyForce | Scout FamilyForce | Explainer |

Sample board description (use this pattern for all):
> *"The best baby shower gift ideas for 2026 — unique, practical, and thoughtful gifts new parents will actually use. From newborn essentials to digital gifts that keep working from birth to age 3. Scout by FamilyForce · getfamilyforce.com"*

---

## Pin SEO — Title and Description Formula

### Title (100 char max)
```
[Primary search keyword] — [Benefit or angle] | Scout by FamilyForce
```
Example:
`Baby Shower Gift Ideas 2026 — The One Gift New Parents Actually Open | Scout by FamilyForce`

### Description (500 char max)
```
[Lead with the keyword naturally] + [what it is / why it helps] + [soft or hard CTA] + [3–5 hashtags]
```
Example:
> Looking for unique baby shower gift ideas? Scout by FamilyForce sends new parents a monthly milestone email + calendar invite — timed to their baby's exact age. They'll know what's coming before it happens, from birth to age 3. From $9.99 at getfamilyforce.com #babyshowergift #newmom #babymilestones #firsttimemom #uniquebabyshowergift

Always end descriptions with 3–5 hashtags. Mix high-volume (`#babyshower`, `#newmom`) with specific (`#babymilestones`, `#scoutbyfamilyforce`).

---

## What Success Looks Like

| Milestone | Target |
|-----------|--------|
| Week 1 | 20 pins live, 5 boards active, Postiz configured |
| Month 1 | 5,000+ monthly views, first pins with 10+ saves |
| Month 3 | 25,000+ monthly views, 50+ saves on top pins |
| Month 6 | 100,000+ monthly views, Pinterest in top 3 referral sources in GA |
| Month 12 | 500,000+ monthly views, 50+ signups/month attributed to Pinterest |

**A pin breaking 10,000 impressions** is the milestone event. When it happens: immediately create 5 variations and increase that pillar's volume by 50%.

---

## What Failure Looks Like — Diagnosis + Fix

| Signal | Diagnosis | Fix |
|--------|-----------|-----|
| <500 monthly views after 4 weeks | Pins not indexed — SEO problem | Rewrite all titles + descriptions with exact search queries. Rename boards. |
| Impressions but save rate <1% | Content not resonating | New image, new copy angle, stronger emotional hook |
| Good saves, no clicks | CTA not driving action | Stronger CTA copy, test landing page, add price to pin |
| Month 3 growth plateau | Content fatigue | Introduce Idea Pins (video format). New topic angle. Check seasonal trends. |
| Gift pillar not converting | Wrong keyword intent | Try price-anchored keywords: "under $30", "under $50". Check if "digital gift" search intent matches. |
| Posting gaps >2 days | Execution gap | Batch 2 weeks ahead. Pinterest penalizes inactive accounts. |

---

## Launch Sequence

Do these in order before posting anything:

- [ ] Pinterest Business account created
- [ ] Profile: purple chevron FamilyForce logo, keyword bio, getfamilyforce.com verified
- [ ] All 10 boards created with keyword-rich names + descriptions
- [ ] Postiz connected to Pinterest account
- [ ] UTM template configured in Postiz
- [ ] GA4 UTM tracking confirmed (verify a test click reaches GA with correct params)
- [ ] First 30 pins created (10 gift, 12 milestone, 5 humor, 3 explainer)
- [ ] First 7 days scheduled in Postiz (5 fresh + 5 repins/day)
- [ ] `pinterest-scout-gift-v5.png` scheduled as Day 1 pin (gift pillar, board: Baby Shower Gift Ideas 2026)
- [ ] "Registry vs. Reality" carousel (`carousel-01` through `06`) scheduled for Day 3
- [ ] Daily review cadence established (20 min every morning, reviewing 3-days-ago pins)

---

## Reference Files

### Content source files
| File | Purpose |
|------|---------|
| `projects/familyforce/docs/scout-content-priority1.md` | 217 milestone windows — use for ALL Pillar 2 pin content |
| `projects/familyforce/docs/scout-product-spec.md` | Full Scout product spec — verify all product claims here |

### Approved pin files (do not regenerate — use as-is or adapt)
| File | Purpose |
|------|---------|
| `p1-slide-01.png` through `p1-slide-05.png` | Approved Pillar 1 carousel — "Registry vs. Reality" |
| `p2-milestone-12mo.png` | Approved Pillar 2 pin — 12 Month Milestones |
| `pinterest-scout-gift-v5.png` | Approved Pillar 3 pin — "Nobody put this on the registry" |
| `p4-explainer.png` | Approved Pillar 4 pin — "How Scout Works" |

### Build scripts (copy and adapt for new pins)
| File | Purpose |
|------|---------|
| `pillar2-milestone.js` | Template for all Pillar 2 text-only pins — adapt for any age |
| `pillar4-explainer.js` | Template for Pillar 4 explainer pins |
| `pinterest-pillar1.js` | Template for Pillar 1 photo carousel pins |
| `carousel-build.js` | Original carousel build script — reference |
| `pinterest-canvas.js` | Original photo pin script — reference |

### AI photo assets (ready to composite)
| File | Description |
|------|-------------|
| `photo-cover-b4.jpg` | Exhausted parent, 3am, newborn, nightlight — cover photo |
| `photo-slide2.jpg` | Parent at 3am on phone — white noise machine scene |
| `photo-slide3-v6.jpg` | Parent watching baby monitor, face lit by screen glow |
| `photo-slide4.jpg` | Swaddle scene |
| `photo-slide5.jpg` | Unused diaper bag scene |

### Fonts (do not use any other paths — these are the only working TTFs)
```
/tmp/Outfit-Bold.ttf
/tmp/Outfit-Regular.ttf
/tmp/Outfit-SemiBold.ttf
```

---

*Update this document after every monthly review or when strategy changes. It is the single source of truth for the FamilyForce Pinterest operation.*
*Last updated: 2026-03-26*
