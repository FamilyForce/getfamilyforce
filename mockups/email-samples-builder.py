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
    subject="A window closing this month — and the habit that pays off at 6 months",
    preheader="Olivia is 3 months old. Head control closes this month. Here's what that means.",
    hero_age="Month 3", hero_name="Olivia · 13 weeks old",
    opening="Olivia is 3 months old. Three months in is when most parents feel like they've finally figured something out. Here's what's worth your attention — she's got a lot going on right now.",
    context="You made it through the fourth trimester. Three months of adjusting, recovering, and learning on the job.",
    theme="🧠 This month: one milestone to close out, one habit to lock in, and one safety setup to get right.",
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
    dyk_html=dyk_card("Children who had more serve and return interactions in infancy **score measurably higher on language tests at age 5.** No flashcards, no apps. Responding to her sounds and looks is the whole thing."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Serve and return — keep building it",
        "This is how she learns to have a conversation before she has words.",
        "The serve and return habit from last month is compounding. Every response you give to her sounds and gestures builds neural pathways for language. This is the single most evidence-backed thing you can do for her development.",
        """* Step it up: pause after you respond to see if she initiates again. You're teaching her conversation rhythm.
* Name her emotions when they're obvious: *"You're frustrated. I hear you."* Emotional vocabulary starts here.
* Books count. Point to pictures, wait for her to look, name what she's looking at.
* Move serve and return into new contexts: bath time, walks, meal prep. Narrate everything.
* You don't need a special activity or class. This happens in the margins of everyday life."""
    ) + window_card(
        "⏳ Open window", "open",
        "Room sharing without bed sharing",
        "The AAP recommendation changed. Here's what it actually says now.",
        "Room sharing — baby in your room, in their own sleep space — reduces SIDS risk by up to 50% compared to a separate room. The current AAP recommendation is at least 6 months. Bed sharing is a different thing, and increases risk.",
        """* Keep the crib or bassinet in your room through at least 6 months.
* If you're tempted to bring the baby into your bed during a night feed: set up the return to be easy — darkness, white noise, firm surface nearby.
* After 6 months, transitioning to their own room is developmentally appropriate and safe.
* The 'ideally the full first year' language was removed from the 2022 AAP update. Six months is the evidence-based minimum.
* Weighted sleep sacks, crib bumpers, and loose bedding are not safe. Firm, flat surface only."""
    ),
    tackled_html=tackled_section([
        ("2-month well child visit", "Dad"),
        ("Tummy time — 15 min/day achieved", "Both"),
        ("Social smile — seen and celebrated", "Mum"),
    ]),
    next_month_html=next_month_section([
        "The 4-month sleep regression — what it is and what to do",
        "4-month checkup — bring your sleep questions",
        "Recognizes and responds to primary caregiver",
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
        "⏱ Closing this month", "",
        "Visual tracking — smooth follow across midline",
        "When she follows a moving toy with her eyes, something significant is happening.",
        "Tracking a moving object smoothly — rather than in jerky, uncoordinated movements — is an early sign that the visual and motor systems are integrating correctly. Crossing the midline (following from one side to the other) is a milestone in itself.",
        """* Slowly move a high-contrast toy from one side to the other, about 12 inches from her face.
* Do this when she's alert and not tired — you want her best attention.
* Her eyes should follow smoothly, both together, all the way across. Jerky movement or one eye tracking slower than the other is worth flagging.
* You can also use your face — slow side-to-side movement while talking to her.
* If she's not tracking at all by 3 months, mention it at the visit."""
    ),
    tackled_html=tackled_section([
        ("Head control — steady when upright", "Dad"),
        ("Tummy time — 20 min/day", "Both"),
        ("Serve and return — daily habit", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Room sharing — the 6-month window closes soon, review your setup",
        "Primary attachment — what you're building in the first 6 months",
        "Iron supplementation — closing window for breastfed babies",
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
