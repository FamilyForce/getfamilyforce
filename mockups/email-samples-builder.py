#!/usr/bin/env python3
"""Generate 6 redesigned email sample HTML files (pre-birth + months 1–5).
Changes from old format:
  - 3 windows (was 5), but full bullet content up to 8 bullets per window
  - Active window count shown ("3 of N active windows")
  - Monthly theme stripe
  - "Did you know" callout card
  - Jack voice bridge line before each window card
  - "What you've tackled" section (nudge on first email / completions on subsequent)
  - "Coming next month" preview section
  - Co-parent forward prompt
  - Optimised subject line + preheader
  - All links wired (PPD -> postpartum.net, windows -> dashboard)
"""
import re, os

DASHBOARD = "https://getfamilyforce.com/scout-dashboard.html"
SITE      = "https://getfamilyforce.com"

CSS = """
  * { box-sizing: border-box; }
  body { margin:0; padding:32px 16px; background:#f0ede8; font-family:Arial,sans-serif; }
  .wrap { max-width:600px; margin:0 auto; }
  .preview-note { background:#fffbea; border:1px solid #f0d060; border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:13px; color:#7a6010; }
  .preview-note strong { color:#5a4000; }
  .nav-bar { background:#fff; border-radius:10px; padding:10px 16px; margin-bottom:14px; display:flex; justify-content:center; gap:6px; flex-wrap:wrap; border:1px solid #e8e0f4; }
  .nav-bar a { font-size:12px; color:#6E4ED6; text-decoration:none; padding:4px 12px; border:1px solid #e0d8f0; border-radius:20px; }
  .nav-bar a.active { background:#6E4ED6; color:#fff; border-color:#6E4ED6; }
  .subject-display { background:#fff; border-radius:10px; padding:16px 20px; margin-bottom:14px; border:1px solid #e0d8f0; }
  .subject-display .label { margin:0 0 4px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:.08em; font-weight:700; }
  .subject-display .subject { font-size:15px; font-weight:700; color:#1a0f3e; margin:0 0 5px; }
  .subject-display .preheader { font-size:13px; color:#666; margin:0; font-style:italic; }
  /* Hero */
  .hero { background:linear-gradient(160deg,#2d1b69 0%,#1a0f3e 100%); border-radius:16px; overflow:hidden; padding:32px 28px 24px; margin-bottom:10px; }
  .hero .logo { font-size:13px; font-weight:700; color:rgba(255,255,255,.45); letter-spacing:.15em; text-transform:uppercase; margin:0 0 18px; }
  .hero .age { font-size:34px; font-weight:700; color:#fff; margin:0 0 4px; }
  .hero .childname { font-size:15px; color:rgba(255,255,255,.55); margin:0 0 22px; }
  .hero .greeting { font-size:15px; color:rgba(255,255,255,.8); line-height:1.7; margin:0 0 10px; }
  .hero .opening { font-size:15px; color:rgba(255,255,255,.65); line-height:1.7; margin:0 0 14px; }
  .hero .context { font-size:13px; color:rgba(255,255,255,.4); font-style:italic; margin:0; border-top:1px solid rgba(255,255,255,.1); padding-top:14px; }
  /* Theme stripe */
  .theme-stripe { background:#f7f4ff; border-left:3px solid #6E4ED6; padding:12px 18px; margin-bottom:14px; border-radius:0 8px 8px 0; }
  .theme-stripe p { margin:0; font-size:13px; color:#5B3CC4; font-weight:600; }
  /* Section headers */
  .section-hdr { display:flex; align-items:baseline; justify-content:space-between; margin:20px 0 8px 4px; }
  .section-hdr .section-label { font-size:11px; font-weight:700; color:#999; text-transform:uppercase; letter-spacing:.1em; }
  .section-hdr .window-count { font-size:11px; color:#6E4ED6; font-weight:600; text-decoration:none; }
  /* Window card */
  .window { background:#fff; border-radius:14px; overflow:hidden; margin-bottom:10px; border:1px solid #ece8f0; }
  .window-inner { padding:18px 20px 12px; }
  .win-flag { font-size:10px; font-weight:700; color:#c0392b; text-transform:uppercase; letter-spacing:.1em; margin:0 0 6px; }
  .win-flag.open { color:#6E4ED6; }
  .win-title { font-size:16px; font-weight:700; color:#1a0f3e; margin:0 0 7px; line-height:1.3; }
  .jack-bridge { font-size:13px; color:#888; font-style:italic; margin:0 0 9px; }
  .win-why { font-size:14px; color:#555; line-height:1.65; margin:0; }
  .the-move { background:#faf7ff; border-top:1px solid #ece8f0; padding:14px 20px 16px; }
  .move-lbl { font-size:10px; font-weight:700; color:#6E4ED6; text-transform:uppercase; letter-spacing:.1em; margin:0 0 10px; }
  .move-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:9px; }
  .move-bullet { color:#6E4ED6; font-weight:700; font-size:14px; flex-shrink:0; margin-top:2px; }
  .move-text { font-size:14px; color:#333; line-height:1.55; margin:0; }
  .move-text strong { color:#1a0f3e; }
  .move-text em { color:#555; font-style:italic; }
  .move-subhead { font-size:13px; font-weight:700; color:#1a0f3e; margin:10px 0 4px; }
  .dash-link { margin-top:10px; font-size:12px; color:#6E4ED6; text-decoration:none; display:block; font-weight:600; }
  /* Did you know */
  .dyk { background:linear-gradient(135deg,#e8f4f0 0%,#d4eee6 100%); border-radius:14px; padding:20px 22px; margin-bottom:10px; border:1px solid #b8ddd3; }
  .dyk-lbl { font-size:10px; font-weight:700; color:#1a7a5e; text-transform:uppercase; letter-spacing:.1em; margin:0 0 8px; }
  .dyk p { font-size:14px; color:#1a3d32; line-height:1.65; margin:0; }
  /* Tackled section */
  .tackled { background:#fff; border-radius:14px; padding:18px 20px; margin-bottom:10px; border:1px solid #d4eed9; }
  .tackled-lbl { font-size:10px; font-weight:700; color:#1a7a4e; text-transform:uppercase; letter-spacing:.1em; margin:0 0 10px; }
  .tackled-item { display:flex; align-items:center; gap:10px; margin-bottom:7px; font-size:14px; color:#333; line-height:1.4; }
  .tackled-check { font-size:16px; flex-shrink:0; }
  .tackled-who { font-size:11px; color:#999; margin-left:4px; }
  .tackled-nudge { font-size:14px; color:#555; line-height:1.65; }
  .tackled-nudge a { color:#6E4ED6; font-weight:600; }
  /* Next month */
  .next-month { background:#fff; border-radius:14px; padding:18px 20px; margin-bottom:10px; border:1px solid #dde4f5; }
  .next-lbl { font-size:10px; font-weight:700; color:#2d5bb5; text-transform:uppercase; letter-spacing:.1em; margin:0 0 12px; }
  .next-item { display:flex; align-items:flex-start; gap:8px; margin-bottom:10px; }
  .next-dot { color:#6E4ED6; font-weight:700; font-size:16px; flex-shrink:0; line-height:1.5; width:14px; text-align:center; }
  .next-title { font-size:14px; color:#333; line-height:1.5; margin:0; flex:1; }
  /* Birth reminder */
  .birth-reminder { background:linear-gradient(135deg,#f3f0ff 0%,#ebe4ff 100%); border-radius:14px; padding:20px 22px; margin-bottom:10px; border:1px solid #c8b8f0; }
  .birth-reminder-lbl { font-size:10px; font-weight:700; color:#5B3CC4; text-transform:uppercase; letter-spacing:.1em; margin:0 0 8px; }
  .birth-reminder p { font-size:14px; color:#2d1b69; line-height:1.65; margin:0 0 10px; }
  .birth-reminder a { color:#6E4ED6; font-weight:700; text-decoration:none; }
  /* Co-parent */
  .coparent { text-align:center; padding:14px 0; }
  .coparent p { font-size:13px; color:#888; margin:0; }
  .coparent a { color:#6E4ED6; font-weight:600; text-decoration:none; }
  /* Closing */
  .closing-card { background:linear-gradient(160deg,#1a0f3e 0%,#0d0820 100%); border-radius:14px; padding:24px 26px; margin-bottom:10px; }
  .closing-card p { font-size:14px; color:rgba(255,255,255,.7); line-height:1.85; margin:0; font-style:italic; }
  /* CTA */
  .cta { text-align:center; padding:8px 0 24px; }
  .cta a { background:#6E4ED6; color:#fff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 36px; border-radius:100px; display:inline-block; }
  /* Footer */
  .footer { text-align:center; padding:0 0 32px; }
  .footer p { font-size:11px; color:#aaa; margin:0 0 4px; line-height:1.7; }
  .footer a { color:#aaa; }
"""

# ─── helpers ────────────────────────────────────────────────────────────────

def md_to_html(text):
    """Very light markdown → inline HTML."""
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    return text

def format_bullets(what_to_do, max_bullets=999):
    """Render all bullet points from what_to_do markdown (no cap by default)."""
    if not what_to_do:
        return ""
    lines   = what_to_do.strip().split("\n")
    html    = []
    bullets = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        is_bullet  = bool(re.match(r'^[\*\-•]\s', line) or re.match(r'^\d+\.\s', line))
        is_subhead = line.startswith("**") and line.endswith("**") and not re.search(r'\*\*.*\*\*.*\*\*', line)
        if is_bullet:
            if bullets >= max_bullets:
                continue
            clean = re.sub(r'^[\*\-•]\s*', '', line)
            clean = re.sub(r'^\d+\.\s*', '', clean)
            clean = md_to_html(clean)
            html.append(
                f'<div class="move-item"><span class="move-bullet">›</span>'
                f'<p class="move-text">{clean}</p></div>'
            )
            bullets += 1
        elif is_subhead:
            label = line.strip("*").strip()
            html.append(f'<p class="move-subhead">{label}</p>')
        else:
            # Plain paragraph line (e.g. numbered intro)
            clean = re.sub(r'^\d+\.\s*', '', line)
            clean = md_to_html(clean)
            if clean:
                if bullets >= max_bullets:
                    continue
                html.append(
                    f'<div class="move-item"><span class="move-bullet">›</span>'
                    f'<p class="move-text">{clean}</p></div>'
                )
                bullets += 1
    return "\n".join(html)

def window_card(flag_text, flag_cls, title, bridge, why_excerpt, what_to_do_text):
    bullets = format_bullets(what_to_do_text)
    flag_class = "win-flag" + (" open" if flag_cls == "open" else "")
    return f"""
<div class="window">
  <div class="window-inner">
    <p class="{flag_class}">{flag_text}</p>
    <p class="win-title">{title}</p>
    <p class="jack-bridge">{bridge}</p>
    <p class="win-why">{md_to_html(why_excerpt)}</p>
  </div>
  <div class="the-move">
    <p class="move-lbl">The move</p>
    {bullets}
  </div>
</div>"""

def dyk_card(text):
    return f"""
<div class="dyk">
  <p class="dyk-lbl">💡 Did you know</p>
  <p>{md_to_html(text)}</p>
</div>"""

def tackled_section(items):
    """items = list of (title, who) tuples, or None for nudge state."""
    if not items:
        return f"""
<div class="tackled">
  <p class="tackled-lbl">✅ What you've tackled</p>
  <p class="tackled-nudge">As you work through these windows, mark them done in the <a href="{DASHBOARD}">Scout dashboard</a>. We'll celebrate your progress here each month.</p>
</div>"""
    rows = ""
    for title, who in items:
        who_html = f'<span class="tackled-who">— {who}</span>' if who else ""
        rows += f'<div class="tackled-item"><span class="tackled-check">✅</span>{md_to_html(title)}{who_html}</div>\n'
    return f"""
<div class="tackled">
  <p class="tackled-lbl">✅ What you've tackled this month</p>
  {rows}
</div>"""

def next_month_section(items):
    """items = list of title strings."""
    rows = ""
    for title in items:
        rows += f'<div class="next-item"><span class="next-dot">›</span><p class="next-title">{md_to_html(title)}</p></div>\n'
    return f"""
<div class="next-month">
  <p class="next-lbl">🔜 A few things coming next month</p>
  {rows}
</div>"""

def birth_reminder_card():
    return f"""
<div class="birth-reminder">
  <p class="birth-reminder-lbl">📅 When Olivia arrives</p>
  <p>Open Scout and update her birthday — your <strong>Month 1 digest fires automatically</strong> on her 4-week birthday. You won't need to do anything else.</p>
  <a href="{DASHBOARD}">Update in Scout →</a>
</div>"""

def section_header(label, count_shown, count_total):
    count_html = ""
    if count_total:
        count_html = f'<a class="window-count" href="{DASHBOARD}">{count_shown} of {count_total} active windows · See all</a>'
    return f'<div class="section-hdr"><span class="section-label">{label}</span>{count_html}</div>'

NAV = [
    ("Pre-birth", "month0-redesign.html"),
    ("Month 1",   "month1-redesign.html"),
    ("Month 2",   "month2-redesign.html"),
    ("Month 3",   "month3-redesign.html"),
    ("Month 4",   "month4-redesign.html"),
    ("Month 5",   "month5-redesign.html"),
    ("Month 6",   "month6-redesign.html"),
    ("Month 7",   "month7-redesign.html"),
    ("Month 8",   "month8-redesign.html"),
    ("Month 9",   "month9-redesign.html"),
    ("Month 10",  "month10-redesign.html"),
    ("Month 11",  "month11-redesign.html"),
    ("Month 12",  "month12-redesign.html"),
]

def nav_bar(active_label):
    links = ""
    for label, href in NAV:
        cls = ' class="active"' if label == active_label else ""
        links += f'<a href="{href}"{cls}>{label}</a>'
    return f'<div class="nav-bar">{links}</div>'

def page(nav_label, title_label, subject, preheader,
         hero_age, hero_name, opening, context,
         theme, total_windows,
         priority_card_html,
         dyk_html,
         supporting_cards_html,
         tackled_html,
         next_month_html,
         closing_text,
         extra_card_html=""):

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Scout · {title_label} Sample</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">

  <div class="preview-note"><strong>Redesign sample — {title_label}.</strong>
  Full bullet content (up to 8) · 3 windows · active window count · monthly theme ·
  Did you know · Jack bridges · tackled section · coming next month · co-parent prompt.</div>

  {nav_bar(nav_label)}

  <div class="subject-display">
    <p class="label">Subject line</p>
    <p class="subject">{subject}</p>
    <p class="preheader">{preheader}</p>
  </div>

  <div class="hero">
    <p class="logo">Scout</p>
    <p class="age">{hero_age}</p>
    <p class="childname">{hero_name}</p>
    <p class="greeting">Hi there,</p>
    <p class="opening">{opening}</p>
    <p class="context">{context}</p>
  </div>

  <div class="theme-stripe"><p>{theme}</p></div>

  {section_header("This month's priority", 1, total_windows)}
  {priority_card_html}
  {dyk_html}

  {section_header("Also this month", 2, total_windows)}
  {supporting_cards_html}

  {tackled_html}
  {next_month_html}
  {extra_card_html}

  <div class="coparent"><p>📩 <a href="#">Forward this to your co-parent</a> — they need it too.</p></div>

  <div class="closing-card"><p>{closing_text}</p></div>

  <div class="cta"><a href="{DASHBOARD}">Open Scout dashboard →</a></div>

  <div class="footer">
    <p><em>For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</em></p>
    <p>Developmental windows medically reviewed by Karina Sanchez Mercado, MD · April 2026</p>
    <p><a href="#">Unsubscribe</a> · FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
  </div>

</div>
</body>
</html>"""

OUT = "/home/node/.openclaw/workspace/projects/familyforce/mockups"

# ═══════════════════════════════════════════════════════════════════════════════
# PRE-BIRTH
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Pre-birth", title_label="Pre-birth",
    subject="Three things to do before the due date (one surprises almost everyone)",
    preheader="Olivia arrives in 8 weeks. One of these can't wait until after birth.",
    hero_age="8 weeks to go", hero_name="Olivia · Due in 2 months",
    opening="Your due date is getting close. This is Scout's pre-birth digest — three things worth doing before she arrives, each one easier to do now than after. Shouldn't take more than 5 minutes to read.",
    context="Everything you do before birth is infinitely easier than doing it with a newborn in the house.",
    theme="📋 Before she arrives: three things that will matter in the first 24 hours.",
    total_windows=5,
    priority_card_html=window_card(
        "⏱ Closing — do before birth", "",
        "Choose your pediatrician before the baby is born",
        "You want this one done before labor starts. Trust me.",
        "The first well child visit happens within 3 to 5 days of birth. You will be exhausted, hormonally volatile, and trying to learn to feed a human. That is not the time to be researching doctors.",
        """* Start looking at 28 to 32 weeks. Do not leave it past 35 weeks — many practices close their lists to new patients.
* Ask your OB, midwife, or trusted parents in your area for recommendations
* Narrow to 2 to 3 candidates and schedule prenatal consultations
* At the consultation, ask:
** What are your after-hours and weekend protocols?
** What hospital are you affiliated with?
** What is your approach to breastfeeding support?
** What is your vaccine policy?
** How long does it typically take to get a sick visit?

**What matters most:**
* Find someone you can call at 2am without hesitation. Bedside manner matters more than credentials on the wall.
* Confirm the practice is in your insurance network before you commit. This is the most common post-birth billing surprise."""
    ),
    dyk_html=dyk_card("Babies can hear their mother's voice in the womb from around week 18. **By birth, she already recognises you.** The moment you start talking to her in the delivery room, she knows who you are."),
    supporting_cards_html=window_card(
        "⏱ Pack before week 37", "",
        "Pack the hospital bag",
        "The one thing nobody packs that they always wish they had: a portable phone charger.",
        "A packed hospital bag at 37 weeks means one less thing to think about when labor starts. Labor can last 24 hours. Pack for that.",
        """For the birth parent:
* Insurance card and ID
* Birth preferences document — keep it to one page
* Phone charger and a portable battery pack
* Comfortable, loose clothing for labor and postpartum: a few changes, socks
* Toiletries: toothbrush, shampoo, dry shampoo, face wash, lip balm
* Nursing bra and breast pads if planning to breastfeed
* Snacks for labor: granola bars, electrolyte drinks (hospitals often restrict eating during active labor)
* Going-home outfit sized for 6 months pregnant — you won't fit into pre-pregnancy clothes yet

For the baby:
* Car seat — installed and inspected before you leave home (many hospitals won't discharge without it)
* Going-home outfit in both newborn and 0–3 months sizes
* One swaddle blanket

For the partner or support person:
* Snacks, change of clothes, phone charger
* A pillow from home — hospital pillows are thin"""
    ) + window_card(
        "ℹ️ Know before you go", "open",
        "Understand newborn screening before the birth",
        "Three tests will happen before you leave the hospital. Know what they are so you're not caught off guard.",
        "Newborn screening is one of the most important public health programs in existence. Most conditions it catches are invisible at birth. Early detection changes outcomes.",
        """Three screens happen automatically before you leave the hospital. Know what they are:

1. **Blood spot test (heel prick):** Done at 24 to 48 hours after birth. A few drops of blood from the baby's heel, tested for up to 60+ conditions depending on your state or country. Results typically come back within 1 to 2 weeks. Your pediatrician will contact you if anything requires follow-up.
2. **Hearing screen:** Done before discharge. A small probe in the ear, painless, takes a few minutes. If the result is "refer," it means re-test — not diagnosis. Many babies refer due to fluid in the ear canal from birth.
3. **Critical congenital heart disease (CCHD) screen:** Pulse oximetry on the baby's hands and feet before discharge. Takes about 5 minutes. Screens for heart defects that aren't visible on examination.

**What to do if a result needs follow-up:**
* Don't panic. Most follow-up results are false positives.
* Call your pediatrician — they will guide next steps.
* The screen exists because catching these conditions early changes the outcome. A follow-up call is the system working."""
    ),
    tackled_html=tackled_section(None),  # first email — nudge state
    next_month_html=next_month_section([
        "Tummy time — building to 15–30 minutes per day (closes month 1)",
        "Screen for postpartum depression — the 1-month visit includes this",
        "Responds to sounds, startles, calms to your voice",
    ]),
    extra_card_html=birth_reminder_card(),
    closing_text="You're close now. Everything you do in the next few weeks makes the first days easier. We'll be with you from day one — your first monthly digest arrives when Olivia turns 1 month old. Until then: you're ready. — Jack",
)
with open(f"{OUT}/month0-redesign.html", "w") as f: f.write(html)
print("Written: month0-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 1
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 1", title_label="Month 1",
    subject="The visit you didn't know to book — and three things that matter right now",
    preheader="Olivia is 1 month old. One appointment saves you weeks of worry.",
    hero_age="Month 1", hero_name="Olivia · 4 weeks old",
    opening="Olivia is 1 month old. You've kept a human alive for a whole month — and she's growing. This is Scout's first monthly digest: a look at what's worth your attention right now, no more than 5 minutes.",
    context="The first month is survival mode. You're doing it right.",
    theme="🗓 This month: one appointment to book, one habit to start, and one question to answer honestly.",
    total_windows=29,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "The 1-month well child visit",
        "Most parents don't know this visit exists. Book it before you leave the hospital — ask for the 4-week appointment on the way out.",
        "The 1-month visit is the first well child check after the newborn visit at 3 to 5 days. Most parents don't realise it exists — it's not as well publicised as the 2-month visit — but it's on the AAP Periodicity Schedule for good reason. Your baby should be back to birth weight by now, and your pediatrician will screen you for postpartum depression at the same time.",
        """* Schedule this visit before you leave the hospital — it should happen at 3 to 5 weeks of age
* Bring a list of feeding questions: how often, how long, how much weight gained since discharge
* The pediatrician will ask about your mood. Answer honestly. This is not a judgment — it's a screen for postpartum depression, which is treatable and common.
* Vaccine given at this visit: Hepatitis B (dose 2, if not already given at the newborn visit)

**What to watch for before this visit:**
* Baby not back to birth weight by week 2 to 3 — flag this early
* Feeding taking more than 45 minutes per session, or baby seeming exhausted during feeds
* Any yellowing of skin or eyes persisting past 2 weeks"""
    ),
    dyk_html=dyk_card("Tummy time is one of the **strongest predictors of motor milestones through age 2.** Babies who do consistent daily tummy time crawl earlier, stand earlier, and walk earlier. You don't need equipment or a schedule — a few minutes on your chest counts."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Tummy time — build to 15–30 minutes per day by week 7",
        "This is the single highest-impact physical habit you can start right now.",
        "The AAP recommends working up to 15–30 minutes of tummy time per day by 7 weeks of age — not all at once, but spread across the day. Most babies who build tummy time consistently go on to roll somewhere between 3 and 5 months.",
        """* Build gradually: add 1–2 minutes per week starting from wherever you are
* Break it into sessions: 4–5 sessions of 4–5 minutes each is as good as one long session
* Start on your chest if she hates it on the floor — chest tummy time counts
* Toys, mirrors, and siblings make it more tolerable
* Try a rolled towel under the chest for support on a flat surface
* If she cries immediately: pick her up, wait, try again in 30 minutes. Short sessions with no crying build the habit better than long sessions with distress."""
    ) + window_card(
        "⏱ Closing this month", "",
        "Screen for postpartum depression — both of you",
        "This one's for you, not for Olivia.",
        "Postpartum depression affects 1 in 5 mothers and 1 in 10 fathers. It is one of the most common and most undertreated complications of childbirth. Untreated postpartum depression affects not just the parent but the child — studies consistently show that infant language development, attachment, and emotional regulation are all affected.",
        """* The Edinburgh Postnatal Depression Scale (EPDS) is the standard screening tool. The AAP recommends screening at the 1-, 2-, 4-, and 6-month well-child visits — not just once.
* If your provider doesn't offer it, ask: *"Can we do the postpartum depression screen today?"*
* Partners should also screen. Paternal postpartum depression is real, underdiagnosed, and treatable.
* A high score is not a diagnosis. It's a flag that starts a conversation with your doctor.
* Treatment is effective. Therapy, medication, and support groups all have strong evidence. Most people improve significantly within 3 months of starting treatment."""
    ),
    tackled_html=tackled_section(None),  # first email — nudge state
    next_month_html=next_month_section([
        "Tummy time — a different window opens (building daily minutes)",
        "The social smile — her first intentional interaction, watch for it around week 6",
        "Head control — holds her head steady when upright",
    ]),
    closing_text="You're one month in. The hardest stretch — the absolute chaos of week one through four — is behind you. She's easier to read than she was, and she'll be easier still next month. We'll be back. — Jack",
)
with open(f"{OUT}/month1-redesign.html", "w") as f: f.write(html)
print("Written: month1-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 2
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 2", title_label="Month 2",
    subject="The smile that changes everything — and what to do before Thursday",
    preheader="Olivia is 2 months old. One vaccine visit, one milestone to watch for.",
    hero_age="Month 2", hero_name="Olivia · 9 weeks old",
    opening="Olivia is 2 months old. The hard edge of the newborn phase is starting to soften. She's more awake, more alert, and more interested in you. Here's what to focus on this month.",
    context="Something shifts around 6–8 weeks. If you haven't seen the first real smile yet — it's close.",
    theme="😊 This month: one appointment to book, one milestone to watch for, and one habit worth locking in.",
    total_windows=25,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "2-month well child visit",
        "The most vaccine-heavy visit of the first year. You can prepare for that.",
        "The 2-month visit kicks off the vaccination schedule in earnest. Vaccines given: DTaP, Hib, PCV15 or PCV20, rotavirus, polio, Hepatitis B (dose 2 if not given at 1 month), and RSV immunization (Nirsevimab/Beyfortus). Expect fussiness and a low fever for 24–48 hours after — that's the immune system responding, not something wrong.",
        """* Schedule on time. Vaccines are timed to the immune system's development — delays matter.
* For fever post-vaccine: infant acetaminophen is appropriate after 2 months. Ask your pediatrician about dosing at the visit. A rectal temperature of 100.4°F (38°C) or higher in a baby under 3 months requires a call regardless of vaccine status.
* Bring your tummy time progress update. Your pediatrician will ask and tell you what to expect before the 4-month visit.
* Ask about the social smile — whether you've seen it, and what to do if you haven't by 3 months."""
    ),
    dyk_html=dyk_card("The social smile requires your baby to recognise your face, recall past interactions, and coordinate a voluntary muscle response — all at once. **It's one of the most cognitively complex things she'll do in her entire first year.** When it comes, you'll understand why people do this twice."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "The social smile — her first intentional interaction",
        "When it comes, it will stop you cold. Nothing prepares you for it.",
        "The social smile — a smile in direct response to your face and voice, not gas — typically appears around 6 weeks. It is the first sign that your baby is engaging with the social world on purpose. Absence of a social smile by 3 months is a flag worth raising at your pediatrician visit.",
        """* Get close. Babies can only focus clearly at 8–12 inches. Your face needs to be in range.
* Smile, talk, and wait. Give her time to respond. The social smile takes a beat — it's not instant.
* Respond to every smile: smile back, say something, make it a two-way exchange.
* Try different expressions and tones. Some babies respond more to high-pitched voices. Some respond more to animated faces.
* Not there yet at 8 weeks? Keep trying. The range is 6–12 weeks. If it's absent at 3 months, flag it."""
    ) + window_card(
        "⏳ Open window", "open",
        "Serve and return — the foundation of language",
        "The most researched interaction in early childhood. You're already doing it.",
        "Harvard's Center on the Developing Child calls serve and return 'the most important thing parents can do for brain development.' Your baby makes a sound, a gesture, or a facial expression — you respond. Back and forth. That's it. That's the whole thing.",
        """* Narrate everything you do: *"I'm changing your diaper now. Left leg first."*
* When your baby coos, coo back. When they look at something, look at it too and name it.
* Put the phone down during feeding and face-to-face time. Your face is the most interesting thing in their world right now.
* Pause after responding to see if she initiates again. You're teaching her the rhythm of conversation.
* Books count as serve and return: point at pictures, wait for her to look, name what she sees."""
    ),
    tackled_html=tackled_section([
        ("1-month well child visit", "Mum"),
        ("Tummy time — building the habit", "Both"),
    ]),
    next_month_html=next_month_section([
        "Head control — closes next month, last chance to build it",
        "Serve and return — the language habit that compounds",
        "Room sharing — the 6-month safety window, check your setup",
    ]),
    closing_text="Two months down. That first real smile — if it's happened, you already know why people do this twice. If it hasn't, watch for it this week. When it comes, it changes the whole thing. See you next month. — Jack",
)
with open(f"{OUT}/month2-redesign.html", "w") as f: f.write(html)
print("Written: month2-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 3
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 3", title_label="Month 3",
    subject="A window closing this month — and the routine that changes everything at bedtime",
    preheader="Olivia is 3 months old. Head control closes this month. Plus: the bedtime habit worth starting now.",
    hero_age="Month 3", hero_name="Olivia · 13 weeks old",
    opening="Olivia is 3 months old. Three months in is when most parents feel like they've finally figured something out. Here's what's worth your attention — she's got a lot going on right now.",
    context="You made it through the fourth trimester. Three months of adjusting, recovering, and learning on the job.",
    theme="🧠 This month: one milestone to close out, a new one just emerging, and a bedtime habit to lock in now.",
    total_windows=26,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "Head control — holds head steady when upright",
        "This window closes this month. Don't let it slip by.",
        "Steady head control by 4 months is one of the foundational gross motor milestones. It signals that the neck muscles and upper spine are developing correctly. It's also a prerequisite for solid food readiness later.",
        """* Tummy time is the main driver — the work happens there. Keep building toward 15–30 minutes per day.
* Hold her in supported upright positions during waking hours: facing outward in your arms, or in a baby carrier.
* At the 4-month well child visit, your pediatrician will assess this directly.
* If head control isn't there by 4 months: flag it at the visit. There's a wide range, but it's worth checking.
* Practice "airplane" hold: face-down on your forearm, hand supporting the chest — builds neck and core simultaneously."""
    ),
    dyk_html=dyk_card("A consistent 3–4 step bedtime routine can produce **measurable sleep improvements within one week** — even in babies as young as 3 months. The routine doesn't have to be elaborate. It just has to be the same, every night."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Laughs out loud",
        "The first real laugh is one of the best moments of the first year. It's also a milestone.",
        "Social laughter — a real, responsive laugh at something funny or playful — typically emerges between 2 and 5 months. It signals that the social brain is online: she's reading your expressions, anticipating what comes next, and responding with joy.",
        """* Make silly faces, do gentle raspberries on the belly, play peekaboo — she's primed to find these funny right now
* Pause after each attempt and watch her face. The anticipation is half the fun for her.
* Respond to every laugh with genuine delight. You're reinforcing her social engagement — and this is serve and return in action.
* If you haven't heard a real laugh by 5 months, mention it at the 4-month visit."""
    ) + window_card(
        "⏳ Open window", "open",
        "Consistent bedtime routine builds emotional security",
        "Three months is the right time to start. Even a short, simple routine pays off fast.",
        "A predictable bedtime routine reduces cortisol levels in children before sleep, shortens the time it takes to fall asleep, and improves sleep quality. Research by Mindell et al. found measurable sleep improvements within one week of starting a 3–4 step routine. The routine signals safety: what happens next is predictable, and predictability is the foundation of emotional security.",
        """* Choose 3 to 4 steps that work for your family and do them in the same order every night
* Classic sequence: bath → massage → feed → song → bed
* Keep it under 30 minutes — longer routines lead to overtiredness, which makes sleep harder
* Both parents should be able to run the same routine — you don't want a dependency on one person
* Consistency matters more than perfection. A routine done most nights is far better than a perfect routine done sometimes."""
    ),
    tackled_html=tackled_section([
        ("2-month well child visit", "Dad"),
        ("Tummy time — 15 min/day achieved", "Both"),
        ("Social smile — seen and celebrated", "Mum"),
    ]),
    next_month_html=next_month_section([
        "The 4-month sleep regression — what it is and what to do",
        "4-month checkup — bring your sleep questions",
        "Rolls tummy to back — first intentional movement",
    ]),
    closing_text="Month 3 is when it starts feeling real. You're not just keeping her alive — you're watching her become someone. Month 4 is full of new things. We'll make sure you're ready. — Jack",
)
with open(f"{OUT}/month3-redesign.html", "w") as f: f.write(html)
print("Written: month3-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 4
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 4", title_label="Month 4",
    subject="Nobody warns you about this. We're warning you.",
    preheader="Olivia is 4 months old. Sleep is about to change — and that's a good sign.",
    hero_age="Month 4", hero_name="Olivia · 17 weeks old",
    opening="Olivia is 4 months old. Month 4 is one of the most developmentally active stretches of the first year — and the one that catches most parents off guard. Here's what to know.",
    context="Four months is when development accelerates. Sleep often gets harder before it gets easier. Both are normal.",
    theme="😴 This month: the sleep change nobody warns you about, the visit to bring your questions to, and what her eyes are telling you.",
    total_windows=44,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "The 4-month sleep regression — what it is and what to do",
        "This is the one nobody warns you about until you're in it.",
        "Around 15–18 weeks, the brain permanently restructures how it sleeps. Sleep cycles lengthen to match adult patterns — roughly 45–50 minutes each. This is not a phase that passes. It's a permanent neurological change. The adjustment period, when she learns to connect sleep cycles independently, takes 2–6 weeks.",
        """1. **Expect it between weeks 14 and 20.** If your baby suddenly starts waking every 45 minutes after sleeping well — this is it. Not illness, not a feeding problem, not teething.

2. **Don't panic and don't assume something went wrong.** The brain is developing normally. This is evidence of that.

3. **Watch your sleep associations.** If you nurse or rock to full sleep at every wake, you'll need to do it each time she rouses between cycles. Consider putting down drowsy but awake if you want to avoid building that dependency.

4. **You can start formal sleep training after 4 months.** Most pediatric sleep specialists set 4 months as the earliest window. Not required — but if you want to try a method, the window is open.

5. **It gets better.** Most babies stabilise within 4–6 weeks. Sleep usually improves once they learn to connect cycles on their own."""
    ),
    dyk_html=dyk_card("Babies put down **drowsy but awake** learn to fall asleep independently — which means they also learn to *re*-fall asleep independently between sleep cycles. That's the whole secret to longer stretches. It's a skill, not a personality trait."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "4-month checkup",
        "Bring your sleep questions. The timing with the regression is not a coincidence.",
        "The 4-month visit covers head control, rolling readiness, and iron supplementation for breastfed babies. Vaccines: DTaP (dose 2), Hib (dose 2), PCV (dose 2), rotavirus (dose 2), polio (dose 2).",
        """* Ask specifically about iron supplementation if you're breastfeeding — it's easy to miss and important.
* Bring your sleep regression questions. Your pediatrician has seen this a thousand times.
* Ask about solid food readiness signs to watch for over the next month.
* Bring up anything you've been meaning to ask for weeks. That 'is this normal?' question you've been googling at 3am — ask it now."""
    ) + window_card(
        "⏳ Open window", "open",
        "Rolls tummy to back — first intentional movement",
        "Often happens by accident at first. Then they figure out they did it on purpose.",
        "Rolling from tummy to back usually happens first, often accidentally during tummy time as the baby pushes up. It's a sign of increasing core and neck strength — and the very beginning of independent mobility. Most babies achieve this between 2 and 5 months.",
        """* Provide plenty of floor time during tummy time — the rolling usually happens there
* Place a toy just out of reach to encourage twisting and reaching, which primes the roll
* When it happens, cheer — positive reinforcement encourages them to try again
* Don't be alarmed if they get stuck on their tummy after rolling there from their back: that direction usually comes later
* If she hasn't rolled either direction by 5 months, mention it at the next visit"""
    ),
    tackled_html=tackled_section([
        ("Head control — steady when upright", "Dad"),
        ("Tummy time — 20 min/day", "Both"),
        ("Bedtime routine — started this month", "Both"),
    ]),
    next_month_html=next_month_section([
        "Solids readiness signs — one month away, know what to watch for",
        "Iron supplement — closing window for breastfed babies",
        "Primary attachment — what you've been building all along",
    ]),
    closing_text="Month 4 is a lot. If sleep just got worse — that's the regression and it means her brain is doing exactly what it should. Hang in there. Back next month. — Jack",
)
with open(f"{OUT}/month4-redesign.html", "w") as f: f.write(html)
print("Written: month4-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 5
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 5", title_label="Month 5",
    subject="She's eyeing your food. Here's what to watch for.",
    preheader="Olivia is 5 months old. Solids are one month away — if the signs are right.",
    hero_age="Month 5", hero_name="Olivia · 22 weeks old",
    opening="Olivia is 5 months old. She's not a newborn anymore — she's an active, curious baby who wants to explore everything in reach. Here's what's worth your attention this month.",
    context="Five months is full of firsts. Grabbing, batting, reaching — and starting to eye what you're eating.",
    theme="🥄 This month: watch for solids readiness, check in on iron, and understand what you're building every day.",
    total_windows=41,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "Watch for solid food readiness signs",
        "Don't rush it — and don't wait too long. Here's how to know when she's ready.",
        "Starting solids is about developmental readiness, not a calendar date. Most babies are ready around 6 months. Starting too early (before 4 months) is linked to obesity and digestive issues. Starting too late (after 7 months) can affect acceptance of texture and iron intake.",
        """* Look for: sitting with little support, good head control, and interest in what you are eating
* Watch for the loss of the tongue thrust reflex — when baby stops pushing objects out of their mouth with their tongue automatically
* If baby reaches for your food and can hold their head steady, they are likely ready
* Never put infant cereal in a bottle to try to help your baby sleep — it is a choking hazard, it does not actually improve sleep, and it bypasses your baby's natural ability to regulate how much they eat
* Start with single-ingredient purées or soft mashable foods. Baby-led weaning (soft finger foods from the start) is also evidence-supported — discuss with your pediatrician.
* Introduce allergenic foods early. The research has reversed on this — early introduction of peanut, egg, tree nut, and fish reduces allergy risk."""
    ),
    dyk_html=dyk_card("**Readiness signs are more reliable than age.** A 5-month-old with all three signs — sitting support, head control, and interest in food — is more ready than a 6-month-old without them. Watch her behaviour at mealtimes. It tells you more than the calendar."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Iron supplementation for breastfed babies",
        "Breast milk is near-perfect nutrition — except for this one thing.",
        "Most babies are born with iron stores that last 4–6 months. After that, breast milk alone isn't enough. Iron deficiency in infancy affects brain development and is largely preventable with a simple supplement.",
        """* At the 4-month visit (or now if you missed it): ask your pediatrician about liquid iron drops
* The AAP recommends 1 mg/kg/day for exclusively or predominantly breastfed infants
* Continue drops until your baby is regularly eating iron-rich foods: iron-fortified cereals, pureed meats, tofu, or beans. For most babies this aligns with 6 to 7 months, but the transition should be based on actual intake, not age alone.
* If your baby was born prematurely or with a low birth weight, their iron protocol may differ — discuss with your pediatrician
* Formula-fed babies get iron from formula — no supplement needed unless your pediatrician recommends it"""
    ) + window_card(
        "⏳ Open window", "open",
        "Primary attachment — what you're building right now",
        "Everything you're doing right now is building the foundation she'll stand on for the rest of her life.",
        "Attachment theory, developed by Bowlby and extended by Ainsworth, is one of the most robust bodies of research in developmental psychology. Secure attachment in the first 6 months predicts better emotional regulation, stronger relationships, and higher academic achievement years later.",
        """* Respond to cries consistently and promptly. Research is unambiguous: you cannot spoil an infant.
* Be present during waking hours: face-to-face time, physical closeness, eye contact.
* Regulate yourself. A calm parent creates a calm baby. The nervous system is contagious.
* Attachment is built through thousands of ordinary moments, not grand gestures. The diaper change, the feeding, the eye contact — that's it.
* You don't need to be perfect. Repair after moments of disconnection actually *strengthens* attachment. 'Rupture and repair' is part of the model."""
    ),
    tackled_html=tackled_section([
        ("4-month sleep regression — handled", "Both"),
        ("4-month checkup", "Mum"),
        ("Iron drops started", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Serve and return — continues to build language pathways",
        "Room sharing review — 6 months is the minimum safe room-sharing window",
        "Primary attachment — the 6-month foundation closes",
    ]),
    closing_text="Five months goes fast. She's a different baby than she was four weeks ago — and she'll be different again in four more. Enjoy this stretch. We'll be back. — Jack",
)
with open(f"{OUT}/month5-redesign.html", "w") as f: f.write(html)
print("Written: month5-redesign.html")

print("\nAll 6 samples written.")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 6
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 6", title_label="Month 6",
    subject="Six months: the checkup, the first real food, and a milestone worth celebrating",
    preheader="Olivia is 6 months old. Solids start now, sitting is happening — here's what to know.",
    hero_age="Month 6", hero_name="Olivia · 26 weeks old",
    opening="Olivia is 6 months old. Six months is a turning point — solids are starting, she's sitting up on her own, and she's starting to look less like a baby and more like a little person with opinions. Here's what matters this month.",
    context="Six months. Solids, sitting, and a whole new level of curiosity about the world.",
    theme="🥄 This month: the 6-month checkup, first real foods, and a motor milestone that changes everything.",
    total_windows=56,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "6-month well child visit",
        "This is the green light for solids — and the first flu shot.",
        "The 6-month visit assesses sitting with support, babbling, hand-to-hand transfer, and object permanence emerging. It's also the official green light for solid food introduction and the first flu vaccine. Vaccines: DTaP (dose 3), Hib (dose 3), PCV (dose 3), polio (dose 3), rotavirus (dose 3 if applicable), influenza (first of the annual series), hepatitis B (dose 3).",
        """* Bring your solid food questions — this is the right visit to ask about purée progression and allergen introduction
* Ask about the peanut protocol specifically: your pediatrician should walk you through it based on your baby's eczema history and family allergy history
* Ask about iron: if you're breastfeeding, iron supplementation may still be needed alongside iron-rich first foods
* Note whether she's sitting with support and reaching for objects — both are developmental markers this visit covers
* If you have any concerns about hearing, vision, or social engagement, raise them now""",
    ),
    dyk_html=dyk_card("When babies sit **independently**, it frees both hands for exploration — and exploration is how the brain builds. Independent sitting isn't just a motor milestone. It's what unlocks the next 6 months of cognitive development."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "First solids — single-ingredient purées",
        "The goal at this stage is exposure, not nutrition. Food is practice.",
        "The goal of first solids is exposure and safety — breast milk or formula is still the primary nutrition. Single-ingredient purées let you identify any reactions clearly. Most babies are ready around 6 months: they can hold their head steady, sit with support, and show interest in food.",
        """* Start with smooth purées of vegetables or fruits: sweet potato, avocado, peas, banana
* Offer a small amount (1–2 teaspoons) once a day to start — this is about learning, not volume
* When introducing highly allergenic foods (egg, peanut, dairy, tree nuts, sesame, fish, wheat, soy): introduce one at a time, 3–4 days apart, to isolate any reactions
* For low-risk foods (most vegetables, fruits, grains): no need to space them — variety is the goal
* Watch for rashes, vomiting, or diarrhoea after each new food and stop if a reaction occurs
* Never add cereal to a bottle — it poses a choking risk and displaces the nutrition balance""",
    ) + window_card(
        "⏳ Open window", "open",
        "Sits without support",
        "When the tripod sit becomes a steady sit, a whole new world opens up.",
        "Independent sitting is a major milestone. It frees up both hands for play and exploration, and is a key safety marker for moving to a high chair and progressing to more varied solid food textures. Most babies achieve this between 5 and 7 months.",
        """* Practice on a flat, firm surface — remove the pillows propped around her and let her build the core strength to balance
* Place toys in front of her to keep her attention focused while she holds position
* Stay close — she will topple, and the landing should be soft
* Once she's steady, add reaching while sitting: grabbing a toy slightly to one side builds the rotational core control she'll need for crawling
* If she's not sitting independently by 9 months, flag it at the 9-month visit""",
    ),
    tackled_html=tackled_section([
        ("4-month sleep regression — survived", "Both"),
        ("Bedtime routine — locked in", "Both"),
        ("First laugh — heard it", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Babyproof before crawling begins — once she's mobile, you'll wish you'd done this",
        "Responds to own name — a key language and social milestone",
        "Introduce dairy — yogurt and cheese, early allergen window open",
    ]),
    closing_text="Halfway through the first year. You've done more right than you know. Month 7 is where it gets mobile — we'll walk you through it. — Jack",
)
with open(f"{OUT}/month6-redesign.html", "w") as f: f.write(html)
print("Written: month6-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 7
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 7", title_label="Month 7",
    subject="Mobility is coming. Is your home ready?",
    preheader="Olivia is 7 months old. Babyproofing closes this month — here's the checklist.",
    hero_age="Month 7", hero_name="Olivia · 30 weeks old",
    opening="Olivia is 7 months old. Mobility is coming — crawling, pulling, rolling — and with it comes a world that suddenly needs a closer look for hazards. Here's what to focus on.",
    context="Seven months: the world is getting much more interesting. And so are the hazards.",
    theme="🔒 This month: babyproof before she moves, establish name response, and close out the iron window.",
    total_windows=50,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "Babyproof the home — before crawling begins",
        "Once she's mobile, you'll wish you'd done this last week.",
        "The window between birth and crawling is the time to babyproof. Mobility happens faster than almost all first-time parents expect — often overnight. The goal is to make your home safe before she can reach hazards independently.",
        """* Get on your hands and knees and look at your home from baby's height — this reveals hazards invisible from standing
* **Stairs:** hardware-mounted gates at the top, drilled into the wall. Pressure-mounted gates are only safe at the bottom or between rooms — never at the top of stairs.
* **Outlet covers:** plug all unused outlets
* **Cabinet locks:** cleaning products, medications, and anything under the sink
* **Furniture anchoring:** bookshelves, dressers, and TVs to the wall. Tip-over accidents kill children every year.
* **Blind cord safety:** loop or secure all window blind cords out of reach
* **Small objects:** anything that fits through a toilet paper tube is a choking hazard — do a sweep of the floor
* **Sharp edges:** coffee table corners, hearth edges
* **Water:** never leave water in a bucket or bathtub unattended, even an inch""",
    ),
    dyk_html=dyk_card("Babies who hear their **own name used consistently and positively** develop name response faster and show stronger early social attention. Use her name — not just nicknames — especially when you want her focus."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Responds to own name",
        "This is more than a party trick — it's a key social-cognitive milestone.",
        "Reliable name response — turning specifically toward her own name rather than any voice or sound — typically develops between 5 and 7 months. It signals that the brain has formed a stable representation of self and that language processing is advancing.",
        """* Use her name frequently and consistently, not just nicknames
* Test when she's not looking at you: call her name from across the room and see if she turns
* Make name calling a positive event: say the name, she turns, you smile and engage
* If reliable name response isn't there by 9 months, flag it at the next well visit — it's a developmental marker on the M-CHAT""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Introduce iron-fortified foods with first solids",
        "Breast milk is excellent nutrition — but iron stores run out around now.",
        "Around 6 months, a baby's natural iron stores are nearly gone. Iron is non-negotiable for brain development. Iron-fortified cereals or pureed meats are the easiest way to close the gap.",
        """* Choose iron-fortified infant cereals like oat or barley — mix with breast milk or formula to increase acceptance
* Pureed meats (beef, chicken, turkey) are excellent natural sources of iron and zinc
* Offer iron-rich foods at most meals — consistency matters more than quantity at this stage
* Continue iron drops if still predominantly breastfeeding and not yet eating consistent iron-rich foods
* Pair iron-rich foods with vitamin C (pureed sweet potato, peas) to increase iron absorption""",
    ),
    tackled_html=tackled_section([
        ("Room sharing transition — done", "Both"),
        ("First solids — iron-fortified foods started", "Mum"),
        ("Babyproofing — in progress", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Introduce eggs — one of the most common allergens, early is better",
        "Babbling — consonant sounds (ba, da, ma) starting around now",
        "Introduce tree nuts — another key early allergen window",
    ]),
    closing_text="Seven months is when parents start babyproofing in earnest. If you haven't started, this month is the time — not next month. — Jack",
)
with open(f"{OUT}/month7-redesign.html", "w") as f: f.write(html)
print("Written: month7-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 8
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 8", title_label="Month 8",
    subject="Allergen introductions: the window is open and the science is clear",
    preheader="Olivia is 8 months old. Eggs, tree nuts, dairy — here's how to do it right.",
    hero_age="Month 8", hero_name="Olivia · 35 weeks old",
    opening="Olivia is 8 months old. Object permanence is kicking in — she knows things exist even when she can't see them. This month is also peak allergen introduction time. Here's what to focus on.",
    context="Eight months: things that disappear are suddenly the end of the world. That's object permanence — it means her brain is working.",
    theme="🥚 This month: three allergens to introduce, and one language milestone building under the surface.",
    total_windows=48,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "Introduce eggs — early allergen",
        "The research reversed on this. Early introduction reduces allergy risk significantly.",
        "Egg is the second most common food allergy in children after peanut. The same early introduction research that changed peanut guidelines also applies to eggs: introducing eggs during the first year reduces allergy risk. Waiting increases it.",
        """* Introduce well-cooked egg (scrambled or hard-boiled) first — raw or undercooked egg carries salmonella risk
* Mix a small amount into purée on day one; give alone on day two and three to isolate any reaction
* Watch for 20 minutes after first introduction
* A mild rash around the mouth can occur as a contact reaction — monitor closely. If it spreads, worsens, or is accompanied by hives, vomiting, or breathing changes, call your pediatrician.
* Once tolerated, keep offering eggs regularly — regular exposure maintains tolerance
* Scrambled eggs are often the easiest first form; hard-boiled egg yolk mashed is also good""",
    ),
    dyk_html=dyk_card("Babies who are exposed to **varied sounds and babble-back interactions** at 8–10 months have measurably larger productive vocabularies at 18 months. The babbling stage is when the foundation is literally being laid — neuron by neuron."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Babbling — consonant sounds (ba, da, ma)",
        "This is the bridge between cooing and first words. It's not random noise.",
        "Babbling — repeating consonant-vowel combinations — is the bridge between cooing and first words. It typically emerges between 6 and 9 months. Absent or significantly limited babbling by 9 months is a developmental flag.",
        """* Babble back. If she says "ba ba," say "ba ba" back, then add to it: *"ba ba, ball."*
* Use simple, slow speech — infant-directed speech (what used to be called 'baby talk') genuinely accelerates language acquisition. The research is clear on this.
* Minimize background TV and audio. Language learning requires conversation, not noise.
* Respond to babble as if it's communication — because it is. She's practicing the sounds she'll use as words.""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Introduce tree nuts — early allergen",
        "One at a time, 3–4 days apart. Don't rush — but don't skip this.",
        "Tree nut allergies — cashew, almond, walnut, pistachio — are among the most common causes of severe allergic reactions in children, and they tend to be lifelong. Like peanut and egg, early introduction reduces risk.",
        """* Introduce as a thinned nut butter (almond or cashew butter thinned with water or purée) — never whole nuts, which are a choking hazard
* Introduce one tree nut at a time, 3–4 days apart, so reactions can be traced
* Watch for 20 minutes after each first introduction
* Don't rush: you don't need to introduce all tree nuts in one week
* Once tolerated, keep offering regularly — this is how tolerance is maintained""",
    ),
    tackled_html=tackled_section([
        ("Babyproofing — complete", "Dad"),
        ("Name response — she turns when called", "Both"),
        ("Eggs introduced — no reaction", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Babbling continues — canonical babbling should be consistent by month 9",
        "Tree nut introduction — if not yet completed",
        "9-month checkup — first formal developmental screening",
    ]),
    closing_text="Eight months is the start of a lot of big things — object permanence, allergen introductions, separation anxiety. All normal. All good. — Jack",
)
with open(f"{OUT}/month8-redesign.html", "w") as f: f.write(html)
print("Written: month8-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 9
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 9", title_label="Month 9",
    subject="The 9-month checkup is the first real developmental screen — here's what to expect",
    preheader="Olivia is 9 months old. Plus: the peanut window and two more allergens.",
    hero_age="Month 9", hero_name="Olivia · 39 weeks old",
    opening="Olivia is 9 months old. This is one of the biggest developmental months of the whole first year — crawling, pulling up, pointing, and early communication are all happening at once. Here's what to watch.",
    context="Nine months is a surge. Gross motor, language, and social development are all firing at the same time.",
    theme="🩺 This month: the first formal developmental screening, the peanut window, and sesame.",
    total_windows=51,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "9-month well child visit — first formal developmental screening",
        "This is the first visit that uses a standardized developmental screening tool. It's more than a checkup.",
        "The 9-month visit is the first to include formal developmental screening using a standardized tool (ASQ or similar). It assesses sitting independently, pulling to stand, babbling, responding to name, and early social engagement. What the pediatrician finds here shapes what happens next.",
        """* Complete any pre-visit developmental questionnaire the practice sends — the ASQ-3 is common. Answer accurately, not optimistically.
* Bring specific behavioral observations: does she respond to her name? Point at things? Babble with consonant sounds?
* Know her approximate word-sound inventory: how many distinct sounds does she make? Any consistent sound-meaning pairs?
* Ask specifically about crawling or alternative locomotion — some babies bottom-shuffle or roll instead of crawl, and both are developmentally acceptable
* If anything was flagged at a previous visit, bring it up again and ask for follow-up""",
    ),
    dyk_html=dyk_card("The **peanut introduction window** (4–11 months) is one of the most important in early childhood nutrition. The LEAP study showed early introduction reduces peanut allergy risk by **up to 80%** in high-risk infants. This month is in the window."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "⚠️ Peanut introduction window",
        "The research on this is unambiguous. Early introduction is protective.",
        "The LEAP study (NEJM, 2015) showed introducing peanuts between 4 and 11 months reduces peanut allergy risk by up to 80% in high-risk infants. This is one of the most significant findings in pediatric nutrition in decades.",
        """* **No eczema, no known food allergies:** introduce at home, no doctor visit required
* **Mild to moderate eczema:** introduce at home around 6 months. The older recommendation to consult a doctor first was updated.
* **Severe eczema or existing egg allergy:** consult your pediatrician first — allergy testing may be recommended before introduction
* Method: small tip-of-the-spoon taste of smooth peanut butter thinned with water or purée. Wait 10 minutes. If no reaction, offer more.
* Never give whole peanuts or chunky peanut butter — choking hazard
* Once tolerated: offer peanut-containing foods 3 times per week to maintain tolerance. Irregular exposure is not enough.""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Introduce sesame — early allergen",
        "Sesame was recently added to the major allergen list. The window is the same.",
        "Sesame was added to the list of major allergens because reactions can be severe. Like other allergens, early introduction during the first year is the protective approach.",
        """* Hummus or tahini thinned with water or purée is the easiest way to introduce sesame
* Do not give whole sesame seeds — they are a choking hazard
* Monitor for 20 minutes after the first few exposures
* Once tolerated, offer regularly to maintain tolerance""",
    ),
    tackled_html=tackled_section([
        ("Babbling — consistent consonant sounds", "Both"),
        ("Tree nuts introduced — no reaction", "Mum"),
        ("Dairy introduced — tolerating well", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Peanut introduction — if not yet done, this is the closing window",
        "Peek-a-boo play — object permanence and trust building",
        "Crawling or alternative locomotion — watch for consistent movement",
    ]),
    closing_text="Nine months is one of my favorites. She's communicating more deliberately, moving on her own, and becoming someone with opinions. A lot happens between now and 12 months. — Jack",
)
with open(f"{OUT}/month9-redesign.html", "w") as f: f.write(html)
print("Written: month9-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 10
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 10", title_label="Month 10",
    subject="She knows you come back. That's the whole thing.",
    preheader="Olivia is 10 months old. Object permanence, stranger anxiety, and the peanut window closing.",
    hero_age="Month 10", hero_name="Olivia · 43 weeks old",
    opening="Olivia is 10 months old. She's getting more intentional — pointing, gesturing, looking at you when something interests her. That's joint attention, and it's one of the most important things happening right now.",
    context="Ten months: watch for pointing and shared looks. That's communication, even without words.",
    theme="🧸 This month: the peanut window closes, peek-a-boo matters more than you think, and stranger anxiety is healthy.",
    total_windows=43,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "⚠️ Peanut introduction — closing window",
        "If this hasn't happened yet, this month is the last of the high-benefit window.",
        "The LEAP study showed early peanut introduction (4–11 months) reduces allergy risk by up to 80%. Month 11 is outside the primary window. If you haven't introduced peanuts yet, this month matters.",
        """* If your child has no eczema and no known food allergies: introduce at home today, no doctor visit required
* Method: small tip-of-the-spoon taste of smooth peanut butter thinned with water or purée — never whole peanuts (choking hazard)
* Wait 10 minutes after the first taste. If no reaction, continue offering.
* Once tolerated: offer peanut-containing foods 3 times per week. Irregular exposure is not sufficient to maintain tolerance.
* If you have any concerns: call your pediatrician. The worst outcome is delaying unnecessarily.""",
    ),
    dyk_html=dyk_card("Peek-a-boo teaches three things simultaneously: **object permanence** (you disappear and still exist), **trust** (you always come back), and **conversational turn-taking**. It's one of the most cognitively rich games in early childhood — and it costs nothing."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Peek-a-boo — object permanence and trust",
        "This isn't just a game. It's a cognitive and emotional workout.",
        "Peek-a-boo teaches object permanence (you disappear and reappear, you still exist), trust (you always come back), and the structure of social turn-taking. These are foundational concepts being built right now.",
        """* Use your hands, a cloth, a corner — any method of disappearing and reappearing
* Build anticipation: slow down before the reveal to create the suspense
* Let her initiate as she gets older — and follow her lead on timing
* Vary it: peek from behind a door, a pillow, a high chair tray""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Stranger anxiety — this is healthy",
        "When she cries at grandma, it's not rudeness. It's a sign of secure attachment.",
        "Stranger anxiety — wariness or distress around unfamiliar people — is something most babies develop between 6 and 10 months. It's a sign of healthy attachment: she has formed a clear primary bond and can now distinguish between safe and unfamiliar.",
        """* Do not force interaction with strangers or unfamiliar relatives — this backfires
* Stay in sight when introducing a new person. Your presence is the safety signal.
* Give her time to warm up on her own terms. Most babies do, given space.
* Brief the grandparents: *"Give her a few minutes. Don't push for hugs. Let her come to you."*
* This phase typically peaks at 8–10 months and softens through the second year""",
    ),
    tackled_html=tackled_section([
        ("9-month checkup — developmental screen passed", "Both"),
        ("Peanut intro — started", "Mum"),
        ("Sesame introduced — no reaction", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Infant CPR training — know what to do in an emergency",
        "Back to sleep — review safe sleep practices as she becomes more mobile",
        "Read aloud every day — the habit that builds school readiness",
    ]),
    closing_text="Ten months goes fast. She's a communicator now — not with words yet, but with everything else. Two months to the first birthday. — Jack",
)
with open(f"{OUT}/month10-redesign.html", "w") as f: f.write(html)
print("Written: month10-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 11
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 11", title_label="Month 11",
    subject="Almost one. She's cruising the furniture — here's what that means.",
    preheader="Olivia is 11 months old. First words, first dental visit, and the last step before walking.",
    hero_age="Month 11", hero_name="Olivia · 48 weeks old",
    opening="Olivia is 11 months old. Almost one. She's pulling up, holding on, and moving sideways along anything she can grip. That's cruising — and it's the last bridge before independent walking. Here's what to watch for this month.",
    context="Eleven months: the walk is coming. You can see it in her eyes every time she lets go for half a second.",
    theme="🚶 This month: cruising along furniture, first words getting specific, and the first dental visit.",
    total_windows=42,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Cruises along furniture — the last step before walking",
        "Sideways walking while holding on is how the brain and body train for independent steps.",
        "Cruising — walking sideways while holding onto furniture — develops the lateral balance and hip strength needed for independent walking. It typically begins between 8 and 12 months. Most babies cruise for several weeks before they let go and take their first unsupported steps.",
        """* Arrange furniture to create a safe continuous path — sofa to coffee table to chair — so she can cruise laps
* Go barefoot as much as possible indoors: toes provide essential grip and proprioceptive feedback for balance development
* Never use baby walkers with wheels — the AAP has called for a ban on their manufacture due to high risk of severe head trauma, skull fractures, and stair falls. They also delay proper walking development.
* Soft-soled shoes or socks with grip are fine when outdoors or on cold floors, but bare feet are always best for skill development
* Encourage her to reach slightly further than comfortable — controlled instability is how balance improves
* If she's not cruising by 12 months, mention it at the 12-month visit""",
    ),
    dyk_html=dyk_card("Babies say 'mama' and 'dada' as sounds around 9 months — but using them **specifically** (mama when looking at mum, dada when looking at dad) typically locks in by 12 months. That specificity is the milestone, not the sound."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Uses 'mama' and 'dada' specifically",
        "This is one of the clearest early language milestones — and the 12-month visit will ask about it.",
        "Many babies say 'mama' and 'dada' as sounds by around 9 months, without attaching specific meaning. Using them specifically — 'mama' when looking at mum, 'dada' when looking at dad — is a key 12-month milestone.",
        """* Use 'mama' and 'dada' in self-referential sentences: *"Mama is right here." "Dada is coming."*
* Point to each parent when saying the word — connect the sound to the face
* Respond enthusiastically when she uses the words correctly. Positive reinforcement locks it in.
* At the 12-month visit, your pediatrician will ask about this directly. Note whether she's using the words with intent.""",
    ) + window_card(
        "⏱ Closing this month", "",
        "First dental visit — at first tooth, or by 12 months",
        "Baby teeth matter. Tooth decay in baby teeth affects the permanent teeth growing beneath them.",
        "The AAPD recommends the first dental visit when the first tooth appears or by 12 months, whichever comes first. Most parents assume baby teeth don't matter much. They do — they hold space for permanent teeth, and tooth decay in baby teeth affects the adult teeth growing beneath them.",
        """* Schedule when the first tooth appears — don't wait until 12 months if teeth arrive early
* Before teeth: wipe gums with a soft damp cloth after feeds
* Once the first tooth erupts: switch to a soft-bristled infant toothbrush immediately
* Use a rice-grain smear of fluoride toothpaste from the first tooth — fluoride is safe and recommended from day one of brushing. Increase to a pea-sized amount at age 3.
* Never put a baby to sleep with a bottle of milk or juice — this causes 'bottle rot,' severe early childhood tooth decay""",
    ),
    tackled_html=tackled_section([
        ("Peanut introduction — complete, offering 3x/week", "Both"),
        ("Babbling — consonant sounds consistent", "Both"),
        ("First dental visit — booked", "Mum"),
    ]),
    next_month_html=next_month_section([
        "12-month well child visit — walking, first words, and social engagement all assessed",
        "Read aloud every day — build the habit now, it compounds for years",
        "Switch to whole cow's milk — at 12 months, the transition begins",
    ]),
    closing_text="One month to the first birthday. It goes fast — and then it really goes fast. The 12-month digest is a big one. — Jack",
)
with open(f"{OUT}/month11-redesign.html", "w") as f: f.write(html)
print("Written: month11-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 12
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 12", title_label="Month 12",
    subject="One year. Here's what the 12-month visit actually covers.",
    preheader="Olivia is 12 months old. Walking, first words, whole milk — all of it, explained.",
    hero_age="Month 12", hero_name="Olivia · 52 weeks old",
    opening="Olivia is 12 months old. One year. You did it. The first year of life is one of the most developmentally dense periods of any human life — and you navigated all of it. Here's what the 12-month visit covers and what to focus on now.",
    context="The first year is done. One of the most remarkable developmental years of any human life — and you were there for all of it.",
    theme="🎂 This month: the 12-month visit, reading aloud every day, and transitioning to a cup.",
    total_windows=56,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "12-month well child visit",
        "This is one of the most important visits of the first year. Come prepared.",
        "The 12-month visit assesses walking, first words, pointing, social engagement, and the transition to whole cow's milk. Vaccines: MMR, Varicella, Hep A (dose 1), PCV (dose 4), and flu vaccine if not yet given this season.",
        """* Track words before the visit: how many specific, consistent words does she have? (Target: 1–3 words with intent by 12 months)
* Note pointing behavior — pointing to share interest (declarative pointing) is a key milestone at this visit
* Discuss the transition to whole cow's milk: 16–24 oz/day is the target range; more than 24 oz/day displaces solid food intake
* Ask about walking: walking is normal anytime from 9 to 18 months — this visit will assess the trajectory
* Questions to bring: sleep, diet, any behavioral concerns, fluoride supplement if your water isn't fluoridated""",
    ),
    dyk_html=dyk_card("Children read to every day from birth enter kindergarten with **a vocabulary equivalent to 1,000 additional hours of classroom instruction.** The habit you build now pays off for years. Any book. Every day. That's the whole prescription."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Read aloud every day — build the habit",
        "This is the single highest-impact habit you can build in the first year.",
        "Reading aloud from birth is one of the highest-impact things a parent can do for language development, school readiness, and the parent-child relationship. The AAP recommends reading aloud as part of every well child visit discussion.",
        """* Start now regardless of age — they benefit from the voice, rhythm, and closeness from day one
* Any book counts. Board books, picture books, library books, whatever's available.
* Make it a daily routine: before the first nap, at bedtime, during a quiet feed
* Point at pictures and name them. Wait for her to look. This is serve and return through books.
* Reading for 15 minutes per day adds up to roughly 90 hours per year. At age 5, that's 450 hours of language-rich interaction on top of everything else you do.""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Sippy or straw cup introduction",
        "Start the transition now. Bottle dependence past 18 months causes dental and speech issues.",
        "Learning to use a cup is a motor skill that prevents dental and speech problems associated with long-term bottle use. Starting at 6 months with small sips of water builds the skill early. By 12–15 months, aim to phase out bottles entirely.",
        """* Offer a straw cup or open cup with a tiny amount of water at meal times
* Weighted straw cups are often easier for babies to learn than traditional sippy cups with valves
* Be patient: it takes weeks of practice before they swallow more than they spill
* By 12–15 months: start reducing bottle use at meals, keeping it only for sleep feeds if needed
* Goal: fully off bottles by 15–18 months. The longer bottle use continues past that, the harder the transition.""",
    ),
    tackled_html=tackled_section([
        ("CPR training — done", "Both"),
        ("First dental visit — complete", "Mum"),
        ("'Mama' and 'dada' — specific and consistent", "Both"),
    ]),
    next_month_html=next_month_section([
        "Container play — in and out, fills a key cognitive window",
        "Water safety — never leave unattended near water, even the bath",
        "Joint attention and pointing — key toddler communication milestone",
    ]),
    closing_text="Happy first birthday to Olivia — and to you. Year two is different. Faster in some ways, slower in others. We'll keep you on track every month. — Jack",
)
with open(f"{OUT}/month12-redesign.html", "w") as f: f.write(html)
print("Written: month12-redesign.html")

print("\nMonths 6-12 done.")
