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
        who_html = f'<span class="tackled-who"> — {who}</span>' if who else ""
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


def farewell_block():
    """Graduation card for month 36 — replaces 'coming next month'."""
    return """
<div style="background:#1E1248;border-radius:14px;padding:32px 28px;text-align:center;margin-bottom:10px">
  <p style="font-family:Arial,sans-serif;font-size:36px;margin:0 0 14px">🎓</p>
  <p style="font-family:Georgia,serif;font-size:22px;color:#fff;margin:0 0 16px;line-height:1.3">Three years done.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 14px;line-height:1.75">Scout is built for the first three years — the most intensive developmental period of any human life. You've been through all of it: every checkup, every window, every month.</p>
  <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0;line-height:1.75">From here, well child visits go annual — ages 4, 5, 6, 7, and 8. Keep reading every day. Keep talking. Keep being curious about who Olivia is becoming. The habits you've built in these three years are the foundation for everything that comes next.</p>
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
    ("Month 13",  "month13-redesign.html"),
    ("Month 14",  "month14-redesign.html"),
    ("Month 15",  "month15-redesign.html"),
    ("Month 16",  "month16-redesign.html"),
    ("Month 17",  "month17-redesign.html"),
    ("Month 18",  "month18-redesign.html"),
    ("Month 19",  "month19-redesign.html"),
    ("Month 20",  "month20-redesign.html"),
    ("Month 21",  "month21-redesign.html"),
    ("Month 22",  "month22-redesign.html"),
    ("Month 23",  "month23-redesign.html"),
    ("Month 24",  "month24-redesign.html"),
    ("Month 25",  "month25-redesign.html"),
    ("Month 26",  "month26-redesign.html"),
    ("Month 27",  "month27-redesign.html"),
    ("Month 28",  "month28-redesign.html"),
    ("Month 29",  "month29-redesign.html"),
    ("Month 30",  "month30-redesign.html"),
    ("Month 31",  "month31-redesign.html"),
    ("Month 32",  "month32-redesign.html"),
    ("Month 33",  "month33-redesign.html"),
    ("Month 34",  "month34-redesign.html"),
    ("Month 35",  "month35-redesign.html"),
    ("Month 36",  "month36-redesign.html"),
]

def nav_bar(active_label):
    links = ""
    for label, href in NAV:
        cls = ' class="active"' if label == active_label else ""
        links += f'<a href="{href}"{cls}>{label}</a>'
    return f'<div class="nav-bar">{links}</div>'

CHILD_NAME = "Olivia"
# (DASHBOARD already defined at top of file)

# Forward prompt (matches email-digest.ts #7)
def forward_prompt(age_months):
    subj = f"Scout: {CHILD_NAME} at {age_months} month{'s' if age_months != 1 else ''}"
    body = f"Thought you'd want to see what Scout sent this month — {DASHBOARD}"
    import urllib.parse
    return (f'<p style="text-align:center;font-size:13px;color:#8A879A;margin:0 0 14px">'
            f'📩 Worth sharing with your partner? '
            f'<a href="mailto:?subject={urllib.parse.quote(subj)}&body={urllib.parse.quote(body)}" '
            f'style="color:#6E4ED6;font-weight:600;text-decoration:none">Forward this email →</a></p>')

# Birthday share blocks (matches email-digest.ts #3)
BIRTHDAY_SHARE = {
    1:  "📸 One month old. Take a photo today — you'll want it later.",
    12: "🎂 One year. Take a photo and share this email with whoever was in the room when it all started.",
    24: "🎉 Two years old. Take a photo together today.",
    36: "🎓 Three years. Take a photo — this one's worth marking.",
}

# Birthday hero emoji suffix (#6)
BIRTHDAY_EMOJI = {1: ' 🎉', 12: ' 🎂', 24: ' 🎉', 36: ' 🎓'}

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

    # Derive age_months from hero_age string (e.g. "Month 12" → 12, "Pre-birth" → 0)
    import re as _re
    _m = _re.search(r'Month (\d+)', hero_age)
    _age_mo = int(_m.group(1)) if _m else 0

    # Birthday share html (#3)
    _bday_share_html = (f'<p style="font-size:14px;color:#6E4ED6;font-weight:600;margin:10px 0 0">'
                        f'{BIRTHDAY_SHARE[_age_mo]}</p>') if _age_mo in BIRTHDAY_SHARE else ''

    # Birthday hero emoji suffix (#6)
    _hero_age_display = hero_age + BIRTHDAY_EMOJI.get(_age_mo, '')

    # Forward prompt (#7)
    _fwd = forward_prompt(_age_mo) if _age_mo > 0 else ''

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
  Did you know · Jack bridges · tackled section · coming next month.</div>

  {nav_bar(nav_label)}

  <div class="subject-display">
    <p class="label">Subject line</p>
    <p class="subject">{subject}</p>
    <p class="preheader">{preheader}</p>
  </div>

  <div class="hero">
    <p class="logo">Scout</p>
    <p class="age">{_hero_age_display}</p>
    <p class="childname">{hero_name}</p>
    <p class="greeting">Hi there,</p>
    <p class="opening">{opening}</p>
    <p class="context">{context}</p>
    {_bday_share_html}
  </div>

  <div class="theme-stripe"><p>{theme}</p></div>

  <p style="font-family:Georgia,serif;font-size:15px;color:#5C5960;margin:0 0 14px;font-style:italic">Here's what to focus on this month:</p>

  {priority_card_html}
  {dyk_html}
  {_fwd}

  {(section_header("Also this month", 2, total_windows) + supporting_cards_html) if supporting_cards_html.strip() else ""}

  {tackled_html}
  {next_month_html}
  {extra_card_html}


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
    closing_text="You're close now. Everything you do in the next few weeks makes the first days easier. We'll be with you from day one — your first monthly digest arrives when Olivia turns 1 month old. Until then: you're ready. — Jack, Founder @ FamilyForce",
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
    hero_age="Month 1", hero_name="Olivia · 1 month old",
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
    dyk_html=dyk_card("In the first month of life, a baby's brain creates more than **1 million new neural connections per second** — a rate that will never be matched again. Every time you talk to her, hold her, and respond to her cries, you're building the architecture of her brain."),
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
    hero_age="Month 2", hero_name="Olivia · 2 months old",
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
    hero_age="Month 3", hero_name="Olivia · 3 months old",
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
    hero_age="Month 4", hero_name="Olivia · 4 months old",
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
    hero_age="Month 5", hero_name="Olivia · 5 months old",
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
    hero_age="Month 6", hero_name="Olivia · 6 months old",
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
    hero_age="Month 7", hero_name="Olivia · 7 months old",
    opening="Olivia is 7 months old. Mobility is coming — crawling, pulling, rolling — and with it comes a world that suddenly needs a closer look for hazards. Here's what to focus on.",
    context="Seven months: the world is getting much more interesting. And so are the hazards.",
    theme="🔒 This month: babyproof before she moves, establish name response, and open the dairy window.",
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
        "⏳ Open window", "open",
        "Introduce dairy (yogurt and cheese) — early allergen",
        "No cow's milk to drink yet — but yogurt and cheese start now.",
        "While babies should not drink cow's milk as a beverage until 12 months, they can and should have dairy products like yogurt and cheese starting around 6 months. Early exposure helps prevent milk protein allergies — the same principle that changed guidance on peanut and egg introduction.",
        """* Offer plain, full-fat Greek yogurt — no added sugar. It's an excellent source of protein, fat, and calcium.
* Provide small pieces of pasteurised, mild cheese: cheddar, mozzarella, or cream cheese work well. Always confirm it's pasteurised — raw milk cheeses carry a severe infection risk for infants.
* Introduce one at a time over a few days to monitor for reactions
* Watch for skin rashes, hives, excessive spitting up, or changes in stool
* Once tolerated, offer dairy regularly — consistency is how tolerance is maintained""",
    ),
    tackled_html=tackled_section([
        ("6-month checkup — done", "Both"),
        ("First solids — purées going well", "Mum"),
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
    hero_age="Month 8", hero_name="Olivia · 8 months old",
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
    hero_age="Month 9", hero_name="Olivia · 9 months old",
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
    subject="The last allergen on the list — and she's pulling up to stand.",
    preheader="Olivia is 10 months old. Fish intro, peek-a-boo, and the beginning of upright life.",
    hero_age="Month 10", hero_name="Olivia · 10 months old",
    opening="Olivia is 10 months old. She's pulling up to stand, cruising the furniture, and making it very clear she has places to be. Here's what matters this month.",
    context="Ten months: upright and opinionated. The walking window is getting closer.",
    theme="🐟 This month: the last major allergen to introduce, peek-a-boo for the brain, and the milestone that changes your safety checklist.",
    total_windows=43,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Introduce fish — early allergen",
        "Fish is on the major allergen list. Early introduction is the protective move.",
        "Fish is a common allergen — but early introduction during the first year reduces the risk of a lifelong fish allergy. Fish also provides DHA, which is essential for brain and eye development. This rounds out the major allergen introductions that started at 6 months.",
        """* Offer well-cooked, puréed or finely flaked white fish — cod, sole, or haddock are good starting options; salmon works too
* Check absolutely for bones before offering — even a tiny bone is a choking hazard
* Introduce fish alone for 3 days before mixing with other foods, so any reaction can be identified clearly
* Watch for 20 minutes after the first introduction
* Once tolerated, keep fish in regular rotation — DHA continues to support brain development through early childhood
* Shellfish (shrimp, crab, lobster) is a separate allergen — introduce separately from fin fish""",
    ),
    dyk_html=dyk_card("Peek-a-boo teaches three things simultaneously: **object permanence** (you disappear and still exist), **trust** (you always come back), and **conversational turn-taking**. It's one of the most cognitively rich games in early childhood — and it costs nothing."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Peek-a-boo — object permanence and trust",
        "This isn't just a game. It's a cognitive and emotional workout.",
        "Peek-a-boo teaches object permanence (you disappear and reappear, you still exist), trust (you always come back), and the structure of social turn-taking. These are foundational concepts being built right now.",
        """* Use your hands, a cloth, a corner — any method of disappearing and reappearing
* Build anticipation: slow down before the reveal to create the suspense
* Let her initiate as she gets older — and follow her lead on timing
* Vary it: peek from behind a door, a pillow, a high chair tray
* Her laughter during peek-a-boo isn't just joy — it's the brain consolidating the lesson that things exist even when hidden""",
    ) + window_card(
        "⏳ Open window", "open",
        "Pulls to standing",
        "The moment she pulls up, your safety checklist changes.",
        "Pulling to standing is the beginning of the transition from floor life to upright life. It requires significant leg and grip strength, and once she can do it, she can reach things on low tables and counters that were previously safe. This is when furniture anchoring becomes urgent if it isn't already done.",
        """* **Lower the crib mattress to the lowest setting immediately** — she can now pull up in the crib and could fall over the rail
* Ensure all heavy furniture — bookshelves, dressers, TVs — is anchored to the wall. Tip-over accidents are a leading cause of child injury.
* Provide sturdy surfaces for practice: a heavy coffee table, a sofa edge, or a low windowsill
* She may not be able to get back down yet — that's normal. Show her how to bend her knees and sit safely.
* If she's not attempting to pull up by 12 months, flag it at the 12-month visit""",
    ),
    tackled_html=tackled_section([
        ("9-month checkup — developmental screen passed", "Both"),
        ("Peanut intro — started, offering 3x/week", "Mum"),
        ("Sesame introduced — no reaction", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Cruising along furniture — the last step before walking",
        "'Mama' and 'dada' used specifically — the 12-month visit will ask",
        "First dental visit — at first tooth or by 12 months",
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
    hero_age="Month 11", hero_name="Olivia · 11 months old",
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
    hero_age="Month 12", hero_name="Olivia · 12 months old",
    opening="Olivia is 12 months old. One year. You did it. The first year of life is one of the most developmentally dense periods of any human life — and you navigated all of it. Here's what the 12-month visit covers and what to focus on now.",
    context="The first year is done. One of the most remarkable developmental years of any human life — and you were there for all of it.",
    theme="🎂 This month: the 12-month visit, reading aloud every day, and the switch to whole milk.",
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
        "Switch to whole cow's milk at 12 months",
        "Formula and exclusive breast milk give way to whole milk. Here's how to do it right.",
        "At one year, most babies can digest the proteins in cow's milk and no longer need formula. Whole milk provides the specific fats needed for brain development through age two. Do not switch before 12 months — infant kidneys cannot handle the protein load of cow's milk before that point.",
        """* Transition gradually: mix ¼ whole milk with ¾ formula for a few days, then ½ and ½, then all milk
* Use full-fat (whole) milk — not 2% or skim. The brain needs those fats through age two.
* Cap intake at 16–24 oz per day. More than 24 oz/day displaces solid food and can cause iron-deficiency anaemia.
* If breastfeeding, you can continue alongside cow's milk — no need to stop if it's working
* If there's a family history of dairy allergy, consult your pediatrician before the switch
* Transition to a straw cup or open cup at the same time — milk in a bottle past 15–18 months causes dental decay""",
    ),
    tackled_html=tackled_section([
        ("Cruising — furniture laps every day", "Both"),
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

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 13
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 13", title_label="Month 13",
    subject="The first steps. The first words. The beginning of everything.",
    preheader="Olivia is 13 months old. Walking, words, and getting off the bottle — here's what to know.",
    hero_age="Month 13", hero_name="Olivia · 13 months old",
    opening="Olivia is 13 months old. The first birthday is behind you, and the toddler years are beginning. Walking is happening or on the way. Words are starting to land. And the bottle is ready to go. Here's what to focus on.",
    context="Thirteen months: a walker, a talker, and an opinion-holder — all at once.",
    theme="👣 This month: first steps, first words, and leaving the bottle behind.",
    total_windows=52,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "First steps",
        "Walking is normal anytime from 9 to 18 months. If it's happening — here's how to support it.",
        "First independent steps typically appear between 10 and 15 months. Updated CDC 2022 guidance moved the expected milestone from 12 to 15 months — so if she's not walking yet at 13 months, that's well within normal range. Walking isn't a milestone to rush. It's one to support.",
        """* Create safe floor space: remove rugs that slip, soft landing surfaces nearby
* Encourage cruising (furniture walking) — it continues building the balance and strength needed for independent steps
* Do not use baby walkers with wheels — they delay walking development and the AAP calls for a ban on their sale due to severe injury risk
* Barefoot on hard floors is better than shoes — toes provide the grip and feedback the brain uses for balance
* Let her fall safely and get back up. The falls are how the balance system learns.
* If not walking by 18 months, the 18-month visit is the clinical checkpoint — mention it there""",
    ),
    dyk_html=dyk_card("Baby sign language doesn't delay speech — it **accelerates** it. Babies who learn signs like 'more,' 'all done,' and 'milk' reduce frustration and build word-concept connections faster. The sign and the word fire in the brain together."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "First words beyond mama and dada",
        "A consistent label for anything counts. 'Ba' for ball counts. Signing counts.",
        "Beyond 'mama' and 'dada,' most children produce their first true words — consistent labels for people, objects, or actions — between 11 and 14 months. 'Ball,' 'dog,' 'more,' 'up' all count. Sign language counts. Any consistent, intentional communication counts.",
        """* Label everything, constantly: "That's a cup. Cup." "Here's your ball. Ball."
* Read aloud daily — pointing to pictures and naming them builds the word-object connection
* Baby sign language: 'more,' 'all done,' 'milk,' 'please' — signs count as words for developmental assessment
* When she says a word, expand it: she says "dog," you say "yes, big dog." This is called expansion and it accelerates acquisition.
* Target: 1–3 words with intent by 12 months, 10 words by 15 months, 50 words by 24 months
* If no words at all by 15 months, flag it at the 15-month visit""",
    ) + window_card(
        "⏱ Closing this month", "",
        "Wean off the bottle — transition fully to a cup",
        "The AAP recommends fully off the bottle by 15–18 months. Starting now makes it easier.",
        "Prolonged bottle use is a leading cause of tooth decay and can interfere with solid food intake and speech development. The bottle is a comfort object at this age — so the transition takes patience, but starting earlier makes it much easier.",
        """* Drop midday bottles first, replacing with a cup of milk or water at meals
* Drop the morning bottle next
* The before-bed bottle is usually the hardest and should be the last to go
* Replace the bedtime bottle ritual with another routine: a book, a song, a snuggle — the comfort is the routine, not the bottle
* Never put a toddler to sleep with a bottle — even milk causes significant tooth decay overnight
* Goal: fully off bottles by 15–18 months. After 18 months, the habit becomes much harder to break.""",
    ),
    tackled_html=tackled_section([
        ("12-month checkup — done", "Both"),
        ("Whole cow's milk — switched", "Both"),
        ("First dental visit — complete", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Joint attention and pointing — shared interest is early language",
        "Walking independently — from steps to full locomotion",
        "Identifies own body parts — nose, ears, belly on request",
    ]),
    closing_text="The second year is a completely different experience. The pace of change slows a little — and then the language starts to explode. Stay with us. — Jack",
)
with open(f"{OUT}/month13-redesign.html", "w") as f: f.write(html)
print("Written: month13-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 14
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 14", title_label="Month 14",
    subject="She's pointing at things. That's language — even without words.",
    preheader="Olivia is 14 months old. Joint attention, walking, and body parts — here's what they mean.",
    hero_age="Month 14", hero_name="Olivia · 14 months old",
    opening="Olivia is 14 months old. She's pointing. She's looking back at you after she points, checking to see if you saw what she saw. That's joint attention — and it's one of the most important communication milestones of the whole first two years.",
    context="Fourteen months: a walker who points. That's a communicator in the making.",
    theme="👉 This month: pointing and shared attention, walking as a full mode of travel, and body part identification.",
    total_windows=48,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Pointing and joint attention",
        "Pointing to share interest — then looking back at you — is more important than first words.",
        "Joint attention — pointing at something to share interest, then looking back to check your reaction — emerges around 9–14 months and is one of the most important developmental milestones of the first two years. It shows theory of mind in its earliest form: she understands that you have a separate perspective, and she wants to share hers. It's a key marker on the M-CHAT autism screen.",
        """* Point at things yourself, constantly: "Look, a dog." Then look at her to see if she follows your point.
* When she points, respond immediately — name what she's pointing at and share the moment: "Yes! A bird!"
* Make a habit of looking where she looks, not just at her face. Joint attention requires both of you attending to the same thing.
* She should be pointing to share interest (declarative pointing) by 15–18 months. Pointing to request something (imperative pointing) is slightly different — both matter.
* Absent pointing by 18 months is a clinical flag on the M-CHAT. This will be checked at the 15-month and 18-month visits.""",
    ),
    dyk_html=dyk_card("Children who walk **barefoot on varied surfaces** — grass, sand, carpet, hardwood — develop stronger foot muscles, better balance, and more refined proprioception than those kept in shoes. Reserve shoes for outdoors and cold floors."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Walking independently — from first steps to full locomotion",
        "Walking well and walking confidently are two different milestones. This month is about the second.",
        "Independent walking typically establishes between 12 and 15 months. By 15 months, most children are using walking as their primary mode of locomotion. The 15-month visit is the checkpoint — if she's not walking well by then, your pediatrician will assess.",
        """* Barefoot or soft-sole shoes on hard floors — stiff shoes interfere with balance development
* Limit time in bouncers, ride-on toys, and carriers when indoors — walking practice is the goal
* Let her navigate uneven terrain: grass, small inclines, different floor textures build the balance system
* If walking hasn't started by 15 months, mention it at the 15-month visit. The clinical red flag is 18 months.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Identifies own body parts when asked",
        "Touch your nose. Touch your ear. This is vocabulary, comprehension, and instruction-following all at once.",
        "Pointing to their nose, eyes, ears, or belly when asked shows vocabulary comprehension, body self-awareness, and the ability to follow simple instructions without gesture. It's a standard checkpoint at the 15-month and 18-month visits.",
        """* Make it a daily game: "Touch your nose!" while you touch yours — then wait for her to copy
* Bath time is a natural opportunity: "Let's wash your ears. Where are your ears?"
* Songs like Head, Shoulders, Knees and Toes make this memorable and repeatable
* By 18 months, she should reliably identify at least 2–3 body parts on request
* Use correct anatomical words — children learn what they're taught, and correct vocabulary costs nothing""",
    ),
    tackled_html=tackled_section([
        ("First steps — happening!", "Both"),
        ("First words — 3 consistent words", "Mum"),
        ("Bottle — down to bedtime only", "Both"),
    ]),
    next_month_html=next_month_section([
        "15-month checkup + M-CHAT — walking, words, and social engagement all assessed",
        "Vocabulary: 10 words — the first language milestone checkpoint",
        "Pretend play emerging — feeding a stuffed animal, toy phone",
    ]),
    closing_text="Joint attention is the bridge between pointing and talking. When she points and looks back at you — respond every time. That's the lesson she's practicing. — Jack",
)
with open(f"{OUT}/month14-redesign.html", "w") as f: f.write(html)
print("Written: month14-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 15
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 15", title_label="Month 15",
    subject="The 15-month visit checks 10 things. Here's how to come prepared.",
    preheader="Olivia is 15 months old. Walking, 10 words, and pretend play — all on the list.",
    hero_age="Month 15", hero_name="Olivia · 15 months old",
    opening="Olivia is 15 months old. The 15-month well child visit is one of the more important developmental checkpoints of the second year — it's the first visit that specifically checks word count, walking quality, and the beginnings of social play. Here's how to come prepared.",
    context="Fifteen months: the first real language checkpoint. Start counting words.",
    theme="🩺 This month: the 15-month checkup, the 10-word milestone, and pretend play beginning.",
    total_windows=45,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "15-month well child visit",
        "Count her words before you go. The pediatrician will ask.",
        "The 15-month visit assesses walking, word count (target: 10+ words), pointing, and social engagement. It's the first visit to formally check language development as a primary concern. Vaccines: DTaP (dose 4), Hib (dose 4), PCV (dose 4 if not given at 12 months), varicella (dose 1 if not given at 12 months), influenza (annual).",
        """* Count words before the visit: consistent, intentional labels for people, objects, or actions in any form — signs count, approximations count, any language counts
* Note whether she's walking independently — 15 months is the expected age, 18 months is the clinical red flag per CDC 2022
* Mention any regression: if she had words and lost them, or had skills and lost them, say so immediately
* Ask about speech therapy referrals if you have any concerns — early is always better
* Ask about fluoride: if your tap water isn't fluoridated, a supplement is recommended from 6 months""",
    ),
    dyk_html=dyk_card("Once a child hits **50 words**, vocabulary growth often becomes exponential — jumping from 50 to 200+ words in just a few months. The slow build from 1 to 50 words is doing the work. Every word added now accelerates what comes next."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Vocabulary: 10 words",
        "Ten consistent, intentional words — in any form, including signs. That's the bar at 15 months.",
        "A vocabulary of 10 words by 15–18 months is the standard developmental checkpoint. 'Ten perfect words' is not the measure — 10 consistent, intentional labels for people, objects, or actions, in any form including approximations and signs, is what counts.",
        """* Keep a rough mental count of consistent words — ones she uses reliably, not just once
* Signs count: 'more,' 'all done,' 'milk,' 'please' are words for developmental assessment
* Approximations count: 'ba' for ball, 'wawa' for water — consistent use and consistent meaning is the standard
* Read aloud with pointing: "Where's the dog? There's the dog." This is the highest-leverage vocabulary builder
* If she has fewer than 10 words at 15 months, flag it. If no words at all, ask for a speech referral today.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Pretend play emerging — feeding a stuffed animal, toy phone",
        "When she pretends to drink from an empty cup, something important is happening in the brain.",
        "Early pretend play — feeding a stuffed animal, pretending to drink from an empty cup, talking into a toy phone — shows the child can hold a mental representation of an action separate from the real thing. This is symbolic thinking, and it's the cognitive foundation of language, reading, and mathematics.",
        """* Provide simple props: a toy phone, a stuffed animal, a small bowl and spoon, a toy cup
* Model pretend actions: pretend to drink from the empty cup, then offer it to her
* Follow her lead — if she feeds the stuffed animal, feed yours too. Join her world.
* Don't correct the pretend. If the banana is a phone, the banana is a phone.
* By 18 months, most children are engaging in simple pretend sequences. By 24 months, multi-step scenarios.""",
    ),
    tackled_html=tackled_section([
        ("Bottle — fully weaned", "Both"),
        ("Walking — independent and confident", "Both"),
        ("Pointing — sharing interest with a look back", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Label big feelings out loud — naming emotions builds regulation",
        "Follows 1-step commands without gesture — comprehension milestone",
        "Stair climbing with support — up and down, step by step",
    ]),
    closing_text="The 15-month visit is one of the most useful ones of the second year. Come with your word count, your walking update, and your questions. — Jack",
)
with open(f"{OUT}/month15-redesign.html", "w") as f: f.write(html)
print("Written: month15-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 16
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 16", title_label="Month 16",
    subject="The meltdown is not the problem. Your response is the lesson.",
    preheader="Olivia is 16 months old. Big feelings, first instructions, and stairs.",
    hero_age="Month 16", hero_name="Olivia · 16 months old",
    opening="Olivia is 16 months old. The big feelings are arriving. Frustration, excitement, fury, joy — she has all of them and very few tools to manage any of them. That's completely normal. Here's how to respond in a way that helps.",
    context="Sixteen months: enormous emotions, a tiny prefrontal cortex. That mismatch is the whole toddler experience.",
    theme="😤 This month: naming big feelings, following simple instructions, and navigating stairs.",
    total_windows=42,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Label big feelings out loud",
        "Naming the emotion during the meltdown is not just compassionate — it's neuroscience.",
        "Naming emotions is one of the most important things a parent can do during the toddler years. When you say 'you are so frustrated right now' during a meltdown, you are not just describing the situation — you are helping the brain process it. Research by Dr. Dan Siegel shows that labeling feelings activates the prefrontal cortex and calms the amygdala. 'Name it to tame it' is not a platitude — it's physiology.",
        """* Name the emotion before you redirect or problem-solve: "I can see you're really angry. You wanted that toy."
* Use precise words: angry, frustrated, disappointed, excited, nervous — not just "upset"
* You don't need to fix the feeling. You need to acknowledge it. "That's so frustrating. I get it."
* Label your own emotions too: "I'm feeling frustrated right now. I'm going to take a breath." You're the model.
* Read books with emotional vocabulary: picture books where characters feel things and name them
* The goal is not to stop the meltdown immediately — it's to build the skill of emotional recognition over months and years""",
    ),
    dyk_html=dyk_card("Children whose parents label their emotions during early childhood show **measurably better emotional regulation, fewer behavioral problems, and stronger peer relationships at school age.** The investment is invisible in the moment and pays off for years."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Follows 1-step commands without gesture",
        "'Get your shoe' — without pointing at it. That's the bar. Here's how to practice it.",
        "Following a one-step command without a gesture shows that language comprehension has moved beyond simple word recognition. The brain is now processing the instruction as a meaningful directive. This is a key step toward following more complex instructions at 18 and 24 months.",
        """* Give single-step instructions using clear, simple words: "Sit down," "Bring it here," "Wave bye"
* Resist pointing or adding gestures — the goal is to test and build word comprehension alone
* Praise compliance immediately: "You did it! You got your cup." Positive reinforcement locks the skill in.
* If she doesn't follow: show her once, then try again later. Don't repeat the instruction multiple times — it teaches her to wait for the third ask.
* By 18 months, most children reliably follow 1-step commands. By 24 months, 2-step commands.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Stair climbing with support",
        "Up is easier than down. Going down is the harder skill — and it comes later.",
        "Climbing stairs with support — one step at a time, holding a railing or a hand — typically develops around 13 to 15 months alongside walking consolidation. It requires balance, coordination, and enough leg strength to lift body weight in a controlled way. Going down stairs is a separate and later-developing skill.",
        """* Let her try stairs with your hand or a railing for support
* Go up together, step by step, narrating: "Up, up, up."
* Don't carry her past stairs if she wants to try — the practice builds the skill
* Keep gates at the top of all stairs until she can descend safely and independently (typically 24–30 months)
* Going down: teach sitting and scooting first, then controlled step-by-step descent — feet first, facing the stairs
* Supervise always. Most stair accidents happen in the brief unsupervised moment.""",
    ),
    tackled_html=tackled_section([
        ("15-month checkup — done", "Both"),
        ("10 words — count confirmed", "Both"),
        ("Pretend play — feeding the stuffed animal", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Parallel play — plays alongside other children (not yet with them)",
        "Spoon self-feeding — messy, important, let them try",
        "Separation anxiety — normal at this age, here's how to handle it",
    ]),
    closing_text="Labeling feelings feels awkward at first. It gets natural fast. And the payoff — a child who can eventually name their own emotions — is one of the most useful things you can give. — Jack",
)
with open(f"{OUT}/month16-redesign.html", "w") as f: f.write(html)
print("Written: month16-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 17
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 17", title_label="Month 17",
    subject="She cries when you leave. That means something good.",
    preheader="Olivia is 17 months old. Separation anxiety, spoons, and playing next to other kids.",
    hero_age="Month 17", hero_name="Olivia · 17 months old",
    opening="Olivia is 17 months old. Separation anxiety may be peaking — the crying at daycare drop-off, the reaching for you when you try to leave the room. It's hard to watch. It's also a healthy sign. Here's what's actually happening.",
    context="Seventeen months: she wants you near. That's not clingy — that's securely attached.",
    theme="🧸 This month: parallel play, the spoon, and why goodbye has to be out loud.",
    total_windows=40,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Separation anxiety — normal and how to handle it",
        "The crying at drop-off is not a problem to fix. It's a developmental phase to understand.",
        "For most children, separation anxiety peaks between 9 and 18 months. It reflects two things working correctly: she understands that you exist when you leave (object permanence), and she has formed a strong enough attachment to miss you. Both are signs of healthy development, not signs that something is wrong.",
        """* **Always say goodbye — never sneak out.** Sneaking out increases anxiety long-term because it makes your absence unpredictable. The goodbye is the safety signal.
* Keep goodbyes brief and confident. Your tone communicates safety: "I love you. I'll be back after lunch." Then go.
* Practice short separations at home so she learns the pattern: you leave, you come back.
* Ask the caregiver to report back honestly — most toddlers stop crying within 5 minutes of drop-off.
* If drop-off distress is severe and lasting more than 20–30 minutes consistently, mention it at the 18-month visit.
* This phase softens naturally through the second year as language develops and she can hold your return in mind.""",
    ),
    dyk_html=dyk_card("Children allowed to **self-feed with a spoon from 12–15 months** develop fine motor skills faster and have a stronger relationship with varied textures by age 2. The mess is the lesson. A splat mat costs $15."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Spoon self-feeding — let them try",
        "Loading the spoon and handing it over is the move. Full independence comes later.",
        "Most children begin spoon self-feeding around 12 to 15 months. It is messy, inefficient, and completely developmentally appropriate. The fine motor coordination required to scoop and bring a spoon to the mouth without tipping it is a skill that takes months to build — but it has to be practiced to develop.",
        """* Load the spoon and hand it to her — she manages the transport. This is the scaffold phase.
* Use a wide, shallow spoon designed for toddlers — the geometry matters
* Accept the mess. A splat mat under the chair makes cleanup a non-event.
* Let her use her hands too — finger feeding alongside spoon practice is fine
* By 18–24 months, most children can load their own spoon. Full independent spoon use is typically 24 months.
* If she's not attempting to use a spoon at all by 18 months, mention it at the visit""",
    ) + window_card(
        "⏳ Open window", "open",
        "Parallel play — plays alongside other children",
        "Playing next to another child, not with them, is exactly right at this age.",
        "Parallel play — playing near other children, doing similar activities independently, without direct interaction — is the developmentally normal form of social play from age 1 to 3. It is not antisocial. It is the scaffolding for cooperative play that comes later.",
        """* Arrange playdates or park time with children of similar age — proximity is the work
* Do not force interaction. Let them play near each other without expectation.
* Narrate what other children are doing: "Oscar is building a tower. What are you building?"
* Sharing is not developmentally realistic before age 3. Do not expect it or enforce it.
* Conflict over toys is normal — model turn-taking rather than forcing it. "First you have a turn. Then she gets a turn."
* Cooperative play — actually playing together, taking roles — emerges around age 3–4""",
    ),
    tackled_html=tackled_section([
        ("Big feelings — naming them at meltdown time", "Both"),
        ("1-step commands — she's following them", "Both"),
        ("Stairs — up with support, down still learning", "Dad"),
    ]),
    next_month_html=next_month_section([
        "18-month checkup + M-CHAT autism screen — the most important toddler visit",
        "Two-word combinations — 'more milk,' 'daddy go'",
        "Tantrums peak — the response strategy that matters",
    ]),
    closing_text="Seventeen months is peak separation anxiety for many kids. It's hard at drop-off. It almost always passes quickly once you're gone. Stay consistent. Stay warm. Keep the goodbye brief. — Jack",
)
with open(f"{OUT}/month17-redesign.html", "w") as f: f.write(html)
print("Written: month17-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 18
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 18", title_label="Month 18",
    subject="The 18-month visit includes the first autism screen. Here's how to prepare.",
    preheader="Olivia is 18 months old. M-CHAT, two-word combinations, and the tantrums.",
    hero_age="Month 18", hero_name="Olivia · 18 months old",
    opening="Olivia is 18 months old. A year and a half. The 18-month well child visit is the most important developmental checkpoint of the toddler years — it includes the first formal autism screening. Here's how to come prepared.",
    context="Eighteen months: the first autism screen, the first two-word combinations, and probably the first spectacular tantrum.",
    theme="🩺 This month: the M-CHAT screen, two-word language, and tantrums at their peak.",
    total_windows=38,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "18-month well child visit + M-CHAT autism screen",
        "Answer the M-CHAT honestly. Not what you hope is true — what you actually observe.",
        "The 18-month visit is the first formal autism screening, using the M-CHAT-R/F or an equivalent standardized tool. It also assesses vocabulary (target: 10+ words, ideally building toward 50), walking, pointing, and social engagement. Vaccines: influenza (annual), Hepatitis A (dose 1 if not yet given).",
        """* Complete the M-CHAT questionnaire honestly — answer what you actually observe, not what you wish were true
* Know your answers to: Does she point to share interest? Does she respond to her name? Does she make eye contact and social smiles? Does she show interest in other children?
* Count her words before the visit: target 10+ words at 18 months, on the way to 50 by 24 months
* If the M-CHAT flags concerns: this does not mean a diagnosis. It means follow-up. Follow up promptly — waiting months for reassurance is not the right move.
* If you have your own concerns that the M-CHAT doesn't capture: say them out loud at this visit. The clinician can only respond to what you raise.
* A second M-CHAT is done at 24 months — the two together give a much fuller picture""",
    ),
    dyk_html=dyk_card("Two-word combinations — 'more milk,' 'daddy go,' 'big dog' — represent a **qualitative leap** in language, not just more words. The child is now constructing meaning, not just labeling. Once two-word phrases start, three-word sentences usually follow within months."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Two-word combinations — 'more milk,' 'daddy go'",
        "The first time she combines two words is a bigger deal than it looks.",
        "Two-word combinations represent a qualitative leap in language development. The child is no longer just labeling things — they're constructing meaning. 'More milk' means 'I want more milk.' 'Daddy go' means 'daddy is leaving.' Most children reach this milestone between 18 and 24 months. Absence at 24 months is a clinical flag.",
        """* Model two-word utterances naturally: when she says "milk," expand: "more milk" or "cold milk"
* Don't correct — expand. Corrections discourage output. Expansions model without punishing.
* Narrate your own actions in two-word phrases: "Mummy sit." "Daddy eat." This is the target form.
* If not combining words at all by 24 months, ask for a speech evaluation — early intervention has the highest impact window
* Signs count: if she signs 'more' + 'milk' together, that's a two-word combination for developmental purposes""",
    ) + window_card(
        "⏳ Open window", "open",
        "Tantrums peak — your response strategy is the lesson",
        "The tantrum is not the problem. How you respond is what she's learning.",
        "Most children hit their peak tantrum behavior somewhere between 18 months and 3 years. This is not a discipline problem — it's a brain development problem. The prefrontal cortex, which governs emotional regulation, is years away from maturity. She literally cannot regulate the emotion on her own yet. That's your job for now.",
        """* During a tantrum: stay physically present, stay calm, say very little. You're a co-regulator, not a negotiator.
* Never negotiate during a tantrum — it teaches that tantrums are effective tools for getting what she wants
* Don't try to reason or explain during a tantrum. Wait for the window of calm, then talk.
* Physical co-regulation works: sit near her, speak quietly, breathe slowly. Your nervous system is contagious.
* After she calms: "That was really hard. You were so frustrated." Name it without judgment.
* Consistency matters more than perfection. Every time you stay calm, you're modeling what calm looks like.""",
    ),
    tackled_html=tackled_section([
        ("Separation anxiety — better at drop-off", "Both"),
        ("Spoon — getting more food in, less on the floor", "Both"),
        ("Parallel play — at the park with other kids", "Dad"),
    ]),
    next_month_html=next_month_section([
        "The 'me do it' independence phase — support it safely",
        "Vocabulary: 50 words — the gate that opens everything",
        "Self-regulation — it starts with co-regulation from you",
    ]),
    closing_text="The 18-month visit is one of the most important ones. Come prepared. Answer the M-CHAT honestly. Ask your questions. — Jack",
)
with open(f"{OUT}/month18-redesign.html", "w") as f: f.write(html)
print("Written: month18-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 19
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 19", title_label="Month 19",
    subject="'Me do it.' The two most important words of the toddler years.",
    preheader="Olivia is 19 months old. Independence, 50 words, and emotional self-regulation.",
    hero_age="Month 19", hero_name="Olivia · 19 months old",
    opening="Olivia is 19 months old. The fierce independence has arrived — 'me do it' is a phrase you'll be hearing a lot. This is not defiance. This is the emergence of autonomy, and it's one of the most important developmental forces of the second year.",
    context="Nineteen months: the will to do it herself is the whole point. Support it.",
    theme="🙌 This month: the independence phase, the 50-word gate, and building the self-regulation foundation.",
    total_windows=36,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Supporting the 'me do it' independence phase",
        "The insistence on doing it herself is not defiance. It's a healthy developmental drive.",
        "The fierce insistence on doing things independently — 'me do it!' — that peaks around 18 to 24 months is not defiance. It's the emergence of autonomy, which is a healthy and necessary developmental drive. Suppressing it consistently creates learned helplessness. Supporting it builds confidence, competence, and self-efficacy.",
        """* Build extra time into routines so she can try things herself: putting on shoes, carrying her cup, opening the door
* Offer limited choices to support autonomy: "Do you want the red shirt or the blue one?" — both are acceptable to you
* When she fails, resist rescuing immediately. Give her time to problem-solve. The struggle is the learning.
* When she succeeds after trying: "You did it! You put your shoe on." The pride is the fuel.
* Redirect rather than prohibit: instead of "don't touch that," give her something she can do independently nearby
* The goal is not compliance — it's a child who believes she's capable. That belief starts here.""",
    ),
    dyk_html=dyk_card("At around **50 words**, vocabulary growth often goes exponential — some children add 5–10 new words per day. The slow, patient work from 1 word to 50 words is what makes that explosion possible. Every word you name is a seed."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Vocabulary: 50 words — the gate that opens everything",
        "Fifty words is the inflection point where language starts to compound.",
        "Research consistently shows that once a child has approximately 50 words, two things happen: vocabulary grows exponentially, and two-word combinations begin. The slow build from 1 to 50 words is doing the work — every word now accelerates the next.",
        """* Keep reading aloud — this is the single highest-leverage language intervention, full stop
* Expand what she says: if she says "dog," you say "big dog" or "brown dog running" — this is called expansion, and it works
* Narrate daily activities: "Now we're washing your hands. Soap, water, rub rub rub."
* Name emotions as well as objects: "you look frustrated," "that made you happy" — emotional vocabulary counts
* Target: 50 words by 24 months. If fewer than 50 words at 24 months, ask for a speech evaluation.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Self-regulation — co-regulation comes first",
        "She can't regulate her own emotions yet. That's your job — and it's also the teaching.",
        "Self-regulation — the ability to manage emotions and behavior — does not develop in isolation. It develops through co-regulation first: a calm adult repeatedly helping a dysregulated child return to baseline. Over thousands of these experiences, the child internalises the regulatory system. Your calm is the template.",
        """* Stay calm during meltdowns — your nervous system is the co-regulator. She literally borrows yours.
* Use physical co-regulation: hold her, sit with her, speak slowly and quietly
* After she calms, name what happened: "That was really hard. You were so angry. And then you calmed down. I'm proud of you."
* Consistent response matters more than perfect response — every calm repair teaches the pattern
* You don't need to be perfect. The repair after losing your own cool models recovery, which is itself a regulation skill.""",
    ),
    tackled_html=tackled_section([
        ("18-month checkup + M-CHAT — done, all clear", "Both"),
        ("Two-word combinations — 'more please,' 'daddy go'", "Both"),
        ("Tantrums — riding them out calmly", "Both"),
    ]),
    next_month_html=next_month_section([
        "The 'why' question explosion — answer every single one",
        "Matches shapes and colors — first classification skills",
        "Names 5 body parts — nose, ears, belly, eyes, feet",
    ]),
    closing_text="'Me do it' is the sound of a child becoming someone. Let her. — Jack",
)
with open(f"{OUT}/month19-redesign.html", "w") as f: f.write(html)
print("Written: month19-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 20
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 20", title_label="Month 20",
    subject="'Why?' is the best question she'll ever ask. Answer it every time.",
    preheader="Olivia is 20 months old. The question explosion, matching skills, and body parts.",
    hero_age="Month 20", hero_name="Olivia · 20 months old",
    opening="Olivia is 20 months old. The questions are starting — 'What's that?' over and over, about everything. This is not noise. This is one of the most productive cognitive strategies a toddler has for building vocabulary. Answer every single one.",
    context="Twenty months: questions are the learning mechanism. The repetition is the point.",
    theme="❓ This month: the question explosion, sorting by shape and color, and naming the body.",
    total_windows=35,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "The question explosion — 'What's that?' and 'Why?'",
        "The repetitive questions are not annoying. They're one of the most efficient learning strategies the brain has.",
        "Most toddlers begin asking 'What's that?' constantly around 20 to 24 months — this is a deliberate vocabulary-building strategy. True 'Why?' questions, which require understanding cause and effect, typically emerge around 24 to 30 months. Both represent significant cognitive milestones.",
        """* Answer every question, even the obvious ones: "That's a mailbox. The mail carrier puts letters in it."
* Resist the urge to answer with a question back — "What do you think it is?" — at this stage, she genuinely doesn't know. Give her the answer first.
* Expand the answer: she asks "What's that?" about a garbage truck, you say: "That's a garbage truck. It picks up our rubbish and takes it away so our street stays clean."
* When 'Why?' arrives: take it seriously. She's asking about causation. Give real answers, simply.
* Never mock or minimize the questions. Toddlers who get engaged answers ask more questions — and questioning is the engine of all future learning.""",
    ),
    dyk_html=dyk_card("Sorting and matching games aren't just fun — they're building the **logical classification skills** the brain will use for reading, mathematics, and science. When she sorts shapes, she's doing early logic. When she matches colors, she's building categorical reasoning."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Matches shapes and colors",
        "Sorting by shape and color is early mathematics. It's also a great rainy day activity.",
        "Sorting and matching by shape and color is an early classification skill. It shows the child can identify a shared property between objects and use it to group them. This is the foundation of logical thinking, and it's building right now through play.",
        """* Use simple shape sorters and color-sorting games — the classics exist for a reason
* Describe what you're doing as you sort: "This one is round — it goes with the other round ones"
* Don't turn it into a drill. Make it playful. "Can you find all the red ones?" is a game, not a test.
* Everyday sorting counts: separating socks by color, putting big blocks with big blocks
* Praise the process, not just the outcome: "You're really looking carefully" reinforces the habit of attention""",
    ) + window_card(
        "⏳ Open window", "open",
        "Names 5 body parts",
        "Nose, ears, belly, eyes, feet. Name them. Ask for them. Make it a game.",
        "Pointing to or naming body parts on request is a sign of growing vocabulary and object identification. It also shows the child can follow instructions and understands that things have labels. By 24 months, most children can identify 5 or more body parts.",
        """* Make it a game during bath time: "Where's your nose? Where's your belly?"
* Read books with pictures of faces and bodies, point to the parts
* Use the correct anatomical words — children learn what they're taught, and correct vocabulary costs nothing
* Songs make it memorable: Head, Shoulders, Knees and Toes covers four at once
* By 24 months: target 5 reliable body parts. By 36 months: most children know significantly more.""",
    ),
    tackled_html=tackled_section([
        ("'Me do it' — we're building in the extra time", "Both"),
        ("50 words — getting close, counting carefully", "Mum"),
        ("Meltdowns — staying calmer on our end", "Both"),
    ]),
    next_month_html=next_month_section([
        "Family understands 75% of speech — the comprehension checkpoint",
        "Empathy emerging — shows concern when others are upset",
        "Understands function of common objects — spoon for eating, brush for hair",
    ]),
    closing_text="Answer the questions. All of them. Every answered question is a word, a concept, a connection. — Jack",
)
with open(f"{OUT}/month20-redesign.html", "w") as f: f.write(html)
print("Written: month20-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 21
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 21", title_label="Month 21",
    subject="If you can understand 75% of what she says, the speech is on track.",
    preheader="Olivia is 21 months old. Speech clarity, empathy, and understanding how things work.",
    hero_age="Month 21", hero_name="Olivia · 21 months old",
    opening="Olivia is 21 months old. Her speech is getting clearer — most of what she says should be understandable to the people who know her best. And something new is happening too: she's starting to notice when other people feel something.",
    context="Twenty-one months: words getting clearer, and a little person who notices when you're sad.",
    theme="🗣️ This month: speech clarity milestone, empathy beginning, and knowing what things are for.",
    total_windows=33,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Family understands 75% or more of speech",
        "You should be able to understand most of what she says, most of the time.",
        "By around 24 months, children should be understood by the people who know them best the majority of the time. If even familiar adults struggle to interpret her speech — guessing from context more than understanding words — it's worth flagging at the 24-month visit.",
        """* Pay attention honestly: how much do you actually understand versus how much do you guess from context and gesture?
* Ask your partner or other regular caregivers — they're a useful second data point
* Strangers understanding speech is a later milestone: 50% by 24 months, 75% by 36 months
* At the 24-month visit: report your honest estimate of how understandable her speech is
* If you're struggling to understand more than 50% of her speech, flag it now — don't wait for the visit
* Speech clarity improves rapidly with language expansion — the more words, the clearer the articulation""",
    ),
    dyk_html=dyk_card("Toddlers who see adults **modeling empathic behavior** — comforting others, asking 'are you okay?', naming concern — develop empathy faster and show stronger prosocial behavior at age 4 and 5. She's watching everything you do."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Empathy emerging — shows concern when others are upset",
        "When she pats your arm because you look sad, that's one of the most important milestones of the second year.",
        "Most children begin to show genuine concern for others who are distressed around 18 to 24 months: offering a toy to a crying child, patting a parent who looks sad, looking worried when someone gets hurt. This is early empathy — the beginning of a social-emotional skill that underlies almost all human relationships.",
        """* Acknowledge and respond to her empathic behavior: "You gave your teddy to the baby. That was so kind."
* Label the emotions of people in books and real life: "The boy in the story is crying because he lost his dog. He feels sad."
* Model empathic behavior yourself: show concern when others are upset, and name what you're doing
* Don't force empathy — toddlers who are pressured to comfort others often resist. Let it emerge naturally.
* When she's upset herself: name it and stay with her. You're showing her what being comforted looks like.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Understands function of common objects",
        "Spoons are for eating. Cups are for drinking. Brushes are for hair. She knows.",
        "By around 18 to 24 months, most children understand that common objects have specific functions. This is called functional knowledge, and it shows the child is building a mental model of the world — not just identifying things by name, but understanding what they're for.",
        """* Name objects and their function during daily routines: "This is a brush. We use it to brush hair."
* During pretend play, follow her lead — if she hands you the toy phone, answer it. She's showing you she knows what it's for.
* Simple object-function books work well: "what do you do with a cup?" as a game
* If she's using objects in clearly wrong ways consistently (brushing with a spoon, drinking from a block) past 24 months, mention it at the 24-month visit""",
    ),
    tackled_html=tackled_section([
        ("Questions — answering every 'What's that?'", "Both"),
        ("Sorting — shapes and colors at home", "Dad"),
        ("Body parts — she knows 6 now", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Vocabulary: 200+ words — the 24-month target",
        "Follows 2-step commands — working memory milestone",
        "Uses pronouns — I, me, you",
    ]),
    closing_text="When she notices you're sad — that's not nothing. That's the beginning of everything that makes us human. — Jack",
)
with open(f"{OUT}/month21-redesign.html", "w") as f: f.write(html)
print("Written: month21-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 22
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 22", title_label="Month 22",
    subject="200 words by 24 months. Here's where you are — and what to do.",
    preheader="Olivia is 22 months old. The 200-word target, 2-step commands, and pronouns.",
    hero_age="Month 22", hero_name="Olivia · 22 months old",
    opening="Olivia is 22 months old. Two months from the second birthday — and the 24-month language targets are in sight. Here's where things should be, and what to watch for.",
    context="Twenty-two months: two months to the 24-month checkup. Language is the main event.",
    theme="📚 This month: the 200-word target, 2-step commands, and the pronoun shift.",
    total_windows=31,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Vocabulary: 200+ words",
        "Two hundred words by 24 months. The range is wide — what matters more is growth.",
        "By 24 months, most children have approximately 200 words, though the range is genuinely wide. What matters more than the exact count is that language is growing rapidly and that two-word combinations are present. A child with 100 words and rapid growth is in a different position than a child with 100 words and a plateau.",
        """* Continue daily reading, narrating daily activities, and expanding their utterances — these are the highest-leverage inputs
* Name emotions as well as objects: "you look frustrated," "that made you happy" — emotional vocabulary counts toward the total
* Introduce new vocabulary in context: at the playground, name the equipment. In the kitchen, name the ingredients.
* If she's not at 50 words by 24 months, ask for a speech evaluation — don't wait for 'catching up on her own'
* Two-word combinations (more milk, daddy go, big dog) should be present by 24 months — absence at this point is a flag""",
    ),
    dyk_html=dyk_card("Following a **2-step command** requires holding two pieces of information in working memory and executing them in order. It's not just language — it's executive function. The same mental process underlies planning, problem-solving, and academic learning."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Follows 2-step commands",
        "'Get your cup and put it on the table.' Without repeating it. That's the milestone.",
        "Following a two-step command without prompts — 'Get your shoes and bring them to me' — requires holding two pieces of information in working memory and executing them in sequence. This represents a significant cognitive step beyond single-step commands.",
        """* Start with two steps that are naturally connected: "Go get your cup and put it on the table"
* Give the instruction once and wait — do not repeat immediately. You're building the habit of listening the first time.
* If she forgets the second step, gently prompt: "And now?" rather than repeating the full instruction
* Praise two-step completion: "You did it — you got your shoes AND brought them to me!"
* By 36 months, most children follow multi-step instructions reliably. Absent two-step compliance at 24 months is worth flagging.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Uses pronouns — I, me, you",
        "Getting pronouns right requires understanding that perspective shifts depending on who's speaking.",
        "Using pronouns correctly requires understanding that 'I' changes based on who's speaking — which is a genuinely sophisticated cognitive operation. Most children begin using pronouns between 18 and 30 months, but errors are normal for much longer.",
        """* Model pronoun use constantly: "I am eating. You are eating. We are eating."
* Do not correct errors directly — expand and rephrase. If she says "Emma want cookie," say "You want a cookie? Here you go."
* Point out pronouns in books: "He's running. She's laughing. They're playing together."
* Errors like "me do it" (instead of "I do it") are completely normal through age 3 — the cognitive mapping is still being built
* If she's still referring to herself exclusively by name (never 'I' or 'me') past 30 months, mention it at the next visit""",
    ),
    tackled_html=tackled_section([
        ("Speech — family understanding 75%+", "Both"),
        ("Empathy — she pats your arm when you're tired", "Mum"),
        ("Object function — using things correctly", "Both"),
    ]),
    next_month_html=next_month_section([
        "Jumping in place — both feet leave the ground",
        "Complex pretend play — multi-step scenarios, characters, scripts",
        "Understands big vs. little — first size comparisons",
    ]),
    closing_text="Two months to the second birthday. The language targets are in sight. Keep reading, keep narrating, keep expanding. — Jack",
)
with open(f"{OUT}/month22-redesign.html", "w") as f: f.write(html)
print("Written: month22-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 23
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 23", title_label="Month 23",
    subject="She's jumping. Both feet. That's a bigger deal than it looks.",
    preheader="Olivia is 23 months old. Jumping, complex pretend play, and big vs. little.",
    hero_age="Month 23", hero_name="Olivia · 23 months old",
    opening="Olivia is 23 months old. One month from the second birthday. The motor, language, and cognitive development happening this month is accelerating fast. Here's what's worth watching.",
    context="Twenty-three months: the last month before the second birthday checkup.",
    theme="🦘 This month: jumping with both feet, pretend play getting complex, and first size concepts.",
    total_windows=29,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Jumping in place — both feet leave the ground",
        "Jumping requires coordinating both sides of the body at once. That's harder than it looks.",
        "Jumping in place — with both feet leaving the ground simultaneously — requires significant leg power and the ability to coordinate both sides of the body at the same moment. It's a major milestone for physical confidence and bilateral coordination. Most children achieve this between 20 and 30 months.",
        """* Practice jumping off a very small height — a 2-inch curb onto grass — to build confidence
* Model it: "Look, I jump!" Toddlers learn motor skills by watching and imitating.
* Use a mini-trampoline with a handle, or a soft mat for landing practice
* Make it playful: jump over a rope on the ground, jump between two cushions
* If she's not attempting to jump at all by 30 months, mention it at the 30-month visit""",
    ),
    dyk_html=dyk_card("Complex pretend play — multi-step scenarios with characters and scripts — uses the same cognitive machinery as **narrative comprehension and writing** later in school. Children who engage in rich pretend play at 2–3 years show stronger literacy skills at age 5."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Complex pretend play — multi-step scenarios",
        "From feeding a stuffed animal to cooking dinner for the whole family: the complexity is growing fast.",
        "Complex pretend play — multi-step scenarios like cooking dinner for dolls, taking toys on a trip, acting out a doctor visit — shows advanced symbolic thinking, narrative construction, and social understanding. This is a direct precursor to literacy, mathematical thinking, and social cognition.",
        """* Set up simple play scenarios: a play kitchen, a pretend doctor kit, stuffed animals as characters
* Join the play and follow her script — do not take over the narrative. Let her be the director.
* Introduce new elements to extend the scenario: "Oh no, the baby is hungry. What should we feed her?"
* Ask open-ended questions to develop the story: "Where are we going?" "What happens next?"
* Complex pretend play peaks between ages 3 and 5 — what she's doing now is the foundation.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Understands big vs. little",
        "Size comparison is the foundation of early mathematics. It builds from play.",
        "Size comparison — big and little, more and less, long and short — is an early mathematical concept. It emerges around 21 to 27 months through repeated comparison and labeling. It is foundational for counting, measurement, and later mathematical reasoning.",
        """* Compare sizes explicitly in daily life: "This is the big spoon. That's the little spoon."
* Sort objects by size and narrate: "The big blocks go here. The little blocks go there."
* Books with size concepts: 'Too Big, Too Small, Just Right' types make it concrete
* Use size language in context: "You need the big cup today" or "That's a tiny piece of apple"
* Once 'big' and 'little' are solid, introduce 'bigger,' 'biggest,' 'smaller,' 'smallest'""",
    ),
    tackled_html=tackled_section([
        ("200 words — she's there", "Both"),
        ("2-step commands — following reliably", "Both"),
        ("Pronouns — 'me do it' slowly becoming 'I do it'", "Both"),
    ]),
    next_month_html=next_month_section([
        "24-month checkup + second autism screen — prepare your observations",
        "Switch to 2% milk at age 2 — confirm at the visit",
        "Understands same and different — matching and classification",
    ]),
    closing_text="One month to the second birthday. She's come so far — and the pace doesn't slow down. — Jack",
)
with open(f"{OUT}/month23-redesign.html", "w") as f: f.write(html)
print("Written: month23-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 24
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 24", title_label="Month 24",
    subject="Two years. The second autism screen is at this visit — here's how to prepare.",
    preheader="Olivia is 24 months old. M-CHAT-R/F, 2% milk, same and different.",
    hero_age="Month 24", hero_name="Olivia · 24 months old",
    opening="Olivia is 24 months old. Two years old. The 24-month checkup includes the second formal autism screening — two years after you started. Here's how to come prepared and what to expect.",
    context="Two years. The second birthday. One of the most important developmental checkpoints of the whole first two years.",
    theme="🩺 This month: the 24-month checkup + second autism screen, the milk switch, and same vs. different.",
    total_windows=44,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "24-month well child visit + second autism screen",
        "The M-CHAT at 18 months and the M-CHAT at 24 months together give a much fuller picture than either alone.",
        "The 24-month visit includes a second autism screen (M-CHAT-R/F or equivalent). It also assesses vocabulary (target: 50+ words), two-word combinations, social play, and tantrum patterns. This is one of the most comprehensive developmental assessments of the first two years.",
        """* Complete the developmental questionnaire accurately — answer what you actually observe, not what you hope is true
* Be direct about any concerns — this is not the time to minimize. If it's been on your mind, say it.
* If there are language or social concerns: ask for a speech evaluation referral today. Early intervention has the highest impact window and there are often waiting lists.
* Know your language stats: approximate word count, whether two-word combinations are present, and how much of her speech is understood by strangers
* If the M-CHAT flags something: follow up immediately. A flag is not a diagnosis — it's an instruction to investigate.""",
    ),
    dyk_html=dyk_card("The AAP recommends switching to **2% milk at age 2** because after the second birthday, children no longer need the high fat content of whole milk for brain development. The brain's fat-intensive growth phase is winding down. 2% supports continued development without excess saturated fat."),
    supporting_cards_html=window_card(
        "⏱ Closing this month", "",
        "Switch from whole to 2% milk at age 2",
        "One switch, at the pediatrician's confirmation. Most children don't notice the difference.",
        "Whole milk is recommended from 12 to 24 months because the fat content supports brain development. After age 2, the AAP recommends switching to 2% reduced-fat milk — unless the child's growth trajectory or family history of cardiovascular disease suggests otherwise.",
        """* At the 24-month visit, confirm the switch is appropriate for her growth trajectory
* Simply buy 2% from the next shop — most children do not notice the difference in taste
* If there's a strong family history of high cholesterol or early heart disease, mention it — your pediatrician may recommend continuing whole milk or moving to 1%
* Cap milk intake at 16–20 oz/day. More than that displaces iron-rich solid food.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Understands same and different",
        "Same and different is the foundation of sorting, matching, reading, and mathematics.",
        "The concept of same and different is a foundational logical operation. It's required for sorting, matching, classifying, and eventually reading (these two letters are the same; these are different) and mathematics. It emerges around 21 to 27 months through repeated comparison.",
        """* Play matching games: "Find the one that looks the same as this"
* Narrate sameness and difference in daily life: "You have the same shoes as your friend"
* Simple memory card matching games develop this directly and are also excellent for attention
* Use the language constantly: "These are the same color. These are different."
* Once solid, extend to: "What's the same about an apple and an orange?" (both are round, both are fruit)""",
    ),
    tackled_html=tackled_section([
        ("Jumping — both feet, consistent", "Both"),
        ("Complex pretend play — full scripts with characters", "Mum"),
        ("Big and little — sorting by size", "Dad"),
    ]),
    next_month_html=next_month_section([
        "3-word sentences — 'I want more milk'",
        "Recalls recent events — memory becoming narrative",
        "Cooperative play begins — playing with, not just beside",
    ]),
    closing_text="Happy second birthday to Olivia — and to you. Two years in, and you know exactly what you're doing. The third year is different again. We'll keep you on track. — Jack",
)
with open(f"{OUT}/month24-redesign.html", "w") as f: f.write(html)
print("Written: month24-redesign.html")

print("\nMonths 13-24 done.")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 25
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 25", title_label="Month 25",
    subject="Three words together. That's a sentence. That's everything.",
    preheader="Olivia is 25 months old. 3-word sentences, memory, and playing with other kids.",
    hero_age="Month 25", hero_name="Olivia · 25 months old",
    opening="Olivia is 25 months old. The language is accelerating. Three-word sentences are arriving — 'I want milk,' 'daddy come here,' 'no more nap' — and with them, the beginning of real communication. Here's what to watch for.",
    context="Twenty-five months: telegraphic speech is giving way to early grammar. Each sentence is a step forward.",
    theme="🗣️ This month: 3-word sentences, memory taking shape, and true cooperative play beginning.",
    total_windows=30,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "3-word sentences — 'I want milk,' 'daddy come here'",
        "Three words strung together is when language stops being labels and starts being grammar.",
        "Three-word sentences — 'I want milk,' 'daddy come here,' 'no more nap' — mark the transition from telegraphic speech to early grammar. They typically appear between 24 and 30 months. By 30 months, most children are using 3-word sentences regularly — and the 30-month visit checks for them specifically.",
        """* Model slightly longer speech than what she produces: if she uses 2-word combos, you use 3-word sentences in response
* Ask open-ended questions: "What happened?" rather than "Did you like it?" — open questions demand more language
* Avoid finishing her sentences — give her time to complete the thought. The pause is part of the learning.
* Read books with simple storylines — narrative structure builds sentence structure
* Target: 3-word sentences consistently by 30 months. If absent at 30 months, flag it at the visit.""",
    ),
    dyk_html=dyk_card("Asking **'what happened?'** after an outing does more for language development than almost any other single prompt. It exercises memory, narrative structure, vocabulary, and sentence construction simultaneously — and the answer tells you a lot about where her language is."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Memory — recalls recent events",
        "When she tells you what happened at the park, she's doing something cognitively remarkable.",
        "The ability to recall and describe a past event — not just respond to immediate stimuli — reflects the development of episodic memory and narrative thought. It is also one of the most powerful language development prompts available: 'what did we do today?' is a full workout for vocabulary, grammar, and memory all at once.",
        """* Ask open-ended recall questions: "What did we have for lunch?" "Who did you see at the park?"
* Use photos as memory prompts — scrolling through recent photos and narrating them together is excellent language practice
* Model recall yourself: "Today we went to the shop. We bought apples. I remember you picked the green ones."
* Bedtime is a natural recall moment: "Tell me one thing that happened today." Make it a ritual.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Cooperative play — playing with other children",
        "From playing next to kids to playing with them: a major social leap.",
        "Cooperative play — taking turns, following shared rules, working toward a common goal — emerges around 2.5 to 3 years. It requires theory of mind (understanding that others have their own thoughts and intentions) and enough self-regulation to take turns. It's a significant predictor of school readiness.",
        """* Arrange regular play with the same children — familiarity accelerates cooperative play
* Simple structured games scaffold the turn-taking concept: rolling a ball back and forth, simple board games with clear rules
* Narrate turns: "Now it's Ella's turn. Now it's your turn."
* When conflict happens, coach rather than referee: "How could you both play with it?" Then step back.
* Don't expect consistent cooperative play before 3 — parallel play is still normal and healthy alongside it""",
    ),
    tackled_html=tackled_section([
        ("24-month checkup + M-CHAT — done, all clear", "Both"),
        ("Switched to 2% milk", "Both"),
        ("Same and different — sorting games at home", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Names 2+ colors — red, blue, yellow, green",
        "Asks 'why' — the question explosion is coming",
        "Counts to 10 — rote sequence, building toward meaning",
    ]),
    closing_text="Three-word sentences are the beginning of the language explosion. The more you respond, the faster it comes. — Jack",
)
with open(f"{OUT}/month25-redesign.html", "w") as f: f.write(html)
print("Written: month25-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 26
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 26", title_label="Month 26",
    subject="'Why?' The question that means her brain is working perfectly.",
    preheader="Olivia is 26 months old. Colors, counting, and the why-question explosion.",
    hero_age="Month 26", hero_name="Olivia · 26 months old",
    opening="Olivia is 26 months old. The 'why' questions are arriving — or they're coming. Research found that children in this phase ask up to 100 questions per hour. That's not an exaggeration. Here's why it matters and how to handle it.",
    context="Twenty-six months: the world is suddenly explicable. She wants to know everything about why.",
    theme="❓ This month: the why-question phase, colors she can name, and counting in sequence.",
    total_windows=29,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Asks 'why' — engage it fully",
        "Up to 100 questions per hour. The quality of your answers predicts her scientific reasoning at age 10.",
        "The 'why' question phase — typically beginning around 27 to 30 months and peaking between 3 and 4 years — represents a massive cognitive leap. The child has discovered that the world is explicable, that things have causes, and that you know things they don't. Research by Chouinard (2007) found that the quality of answers children receive significantly predicts scientific reasoning ability later.",
        """* Answer 'why' questions genuinely and simply: "Because water is heavier than oil."
* If you don't know the answer: "I don't know — let's find out." Then find out. This models intellectual humility and curiosity.
* Use the question as a conversation opener rather than a one-shot answer: "Why do you think the sky is blue?"
* Resist the urge to deflect with "because I said so" — reserve that for behavioral limits, not factual questions
* The repetitive 'why after why' chain is normal: she's testing whether causes have causes. They do. Go as deep as you can.
* Never shame the question. A child who stops asking 'why' has learned that curiosity is unwelcome.""",
    ),
    dyk_html=dyk_card("Color naming is one of the **trickier early language concepts** — colors are not things, they're properties of things. 'Red' describes the cup, the apple, and the fire engine, but 'red' is none of those things. That abstraction is why color vocabulary arrives later than object vocabulary."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Names at least 2 colors",
        "Red, blue, yellow, green — in any combination of two. That's the 30-month bar.",
        "Color naming is a cognitive and language milestone that most children reach around 24 to 30 months. It requires learning abstract category labels — colors are properties of things, not things themselves — which is a more complex linguistic concept than naming objects.",
        """* Name colors in daily life constantly: "Here's your red cup." "Look at the blue car." "Want the yellow banana?"
* Use simple color sorting games with blocks or toys
* Read books that feature color concepts — Eric Carle's work is ideal
* Don't test colors as drills — embed color language in everything you already say
* By 36 months, most children can reliably name 4+ colors""",
    ) + window_card(
        "⏳ Open window", "open",
        "Counts to 10 — rote sequence",
        "Reciting 1 to 10 by age 3. The sequence comes before understanding what the numbers mean.",
        "Reciting numbers in sequence to 10 by age 3 is an early numeracy milestone. At this stage, it reflects the ability to memorize and reproduce a sequence — a precursor to true counting with one-to-one correspondence, which comes later.",
        """* Count everything in daily life: stairs going up, crackers on the plate, shoes by the door
* Songs encode the sequence musically: "One, Two, Three, Four, Five, Once I Caught a Fish Alive"
* Counting books reinforce the sequence with visual anchors
* Don't worry if the sequence is imperfect — skipping 4 or repeating 6 is developmentally normal at this age
* True understanding that '3' means exactly 3 objects typically arrives around 30 to 35 months""",
    ),
    tackled_html=tackled_section([
        ("3-word sentences — consistent now", "Both"),
        ("Memory — telling us about her day", "Both"),
        ("Cooperative play — starting to play with other kids", "Mum"),
    ]),
    next_month_html=next_month_section([
        "Potty training readiness signs — watch for them this month",
        "Catches a large ball — visual-motor milestone",
        "Strangers understand 75% of speech — the 3-year speech clarity target",
    ]),
    closing_text="Answer the 'why' questions. Every single one. That's the whole job this month. — Jack",
)
with open(f"{OUT}/month26-redesign.html", "w") as f: f.write(html)
print("Written: month26-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 27
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 27", title_label="Month 27",
    subject="Is she ready for potty training? Here's the checklist.",
    preheader="Olivia is 27 months old. Readiness signs, catching a ball, and speech clarity.",
    hero_age="Month 27", hero_name="Olivia · 27 months old",
    opening="Olivia is 27 months old. Parents often ask about potty training around this age. The answer isn't about age — it's about readiness signs. Here's what to look for before you start.",
    context="Twenty-seven months: potty training readiness varies widely. The signs matter more than the calendar.",
    theme="🚽 This month: potty readiness signs, catching a ball, and the 3-year speech clarity benchmark.",
    total_windows=27,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Potty training readiness — signs to watch for before you start",
        "Starting before she's ready makes it longer and harder. Waiting for the signs makes it faster.",
        "Most children show readiness signs between 18 and 36 months. Starting before a child is ready leads to a longer, more frustrating process with more accidents and more resistance. Waiting for readiness signs — rather than starting at a fixed age — is the single most reliable predictor of a faster, lower-conflict potty training experience.",
        """* **Stay dry for 2+ hours:** this shows bladder capacity and some control
* **Shows awareness of going:** tells you before, during, or just after — any awareness is a good sign
* **Interest in the toilet or underwear:** if she wants to sit on the potty, that's your opening
* **Can follow 2-step instructions:** "Go to the toilet and sit down" requires the same working memory as training
* **Can pull pants up and down independently:** this is a practical necessity for self-initiated toilet use
* Do not start if she cannot yet signal need — early training without signaling is toilet timing, not potty training
* Buy a floor potty and leave it out without pressure now — familiarity reduces fear when training begins""",
    ),
    dyk_html=dyk_card("Catching a ball isn't just a sports skill — it's **visual-motor integration**: anticipating a moving object's path, timing a movement, and adjusting for error in real time. These same skills underpin reading (tracking a moving line of text) and writing (anticipating where the pen needs to go)."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Catches a large ball",
        "Arms out, trap it against the body. That's the 30-month bar — a beach ball from close range.",
        "Most children develop the ability to catch a large ball around 30 to 36 months. It requires anticipating the ball's trajectory, timing the arm movement, and adjusting for errors in real time — visual-motor integration skills that also underpin reading and writing.",
        """* Use a large, soft ball (beach-ball size) — smaller balls require more precision than toddlers have
* Throw gently and directly to her outstretched arms from close range
* Celebrate any contact with the ball, not just a clean catch — the attempt is the learning
* Once catching is consistent: step back a little, or switch to a slightly smaller ball
* Kicking, throwing overarm, and catching all develop around this window — outdoor play time is the practice""",
    ) + window_card(
        "⏳ Open window", "open",
        "Strangers understand 75% of speech",
        "By age 3, unfamiliar adults should understand most of what she says. Here's how to gauge it.",
        "Most children are understood by strangers approximately 75% of the time by around 36 months. This is the benchmark used by speech-language pathologists for evaluating speech clarity at age 3. Below this threshold often indicates a speech sound disorder that benefits from early therapy.",
        """* Note how often you have to translate for her in interactions with unfamiliar adults
* At the 36-month visit, your pediatrician will assess speech intelligibility — come with an honest estimate
* Family members who know her well may understand 90%+ — what matters here is strangers
* If unclear to strangers less than 50% of the time by 36 months, ask for a speech-language pathology evaluation
* Early speech therapy has a much higher success rate than intervention started at school age""",
    ),
    tackled_html=tackled_section([
        ("Colors — knows red, blue, and yellow", "Both"),
        ("Counts to 10 — in sequence with some gaps", "Dad"),
        ("Why questions — answering every one", "Both"),
    ]),
    next_month_html=next_month_section([
        "First jokes — using humor intentionally",
        "Time concepts — morning, afternoon, yesterday, tomorrow",
        "Named friendships — 'I want to play with Ella'",
    ]),
    closing_text="Potty training: wait for the signs. When they're there, go fast and don't look back. When they're not, wait. — Jack",
)
with open(f"{OUT}/month27-redesign.html", "w") as f: f.write(html)
print("Written: month27-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 28
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 28", title_label="Month 28",
    subject="She made a joke on purpose. That's theory of mind.",
    preheader="Olivia is 28 months old. First jokes, time concepts, and a best friend named Ella.",
    hero_age="Month 28", hero_name="Olivia · 28 months old",
    opening="Olivia is 28 months old. Something happened recently — she said something wrong on purpose, waited, and then laughed. That's not silliness. That's the first evidence of social intelligence applied to humor. Here's what it means.",
    context="Twenty-eight months: she's figured out that she can surprise you. That's a cognitive leap.",
    theme="😄 This month: first jokes, understanding time, and a specific friend she wants to see.",
    total_windows=25,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "First jokes — using humor intentionally",
        "Calling a dog a cat on purpose and watching for your reaction is theory of mind in action.",
        "Most children begin using humor deliberately around 25 to 28 months — saying the wrong word on purpose, making a funny face to get a reaction, turning a routine into a game with a punchline. This is one of the most significant markers of emerging theory of mind: she understands that you have expectations, and she can subvert those expectations for effect.",
        """* Play along immediately. When she calls a dog a cat on purpose and waits for your reaction, give her the laugh. That is exactly what she's going for.
* Introduce simple silly games: "Is your nose your elbow? Nooooo!" — let her take the joke role next
* Read silly books together: Mo Willems' Pigeon books, Julia Donaldson's works. Toddler humor literature is its own genre.
* Laugh at her jokes, including the ones that make no sense. The intent is what matters, not the execution.
* A child who jokes is a child who understands the social contract well enough to play with it. That's a good sign.""",
    ),
    dyk_html=dyk_card("A visual daily schedule — pictures of the sequence of events, not words — reduces toddler anxiety and improves cooperation dramatically. When she knows what comes next, 'no more park' stops being a surprise ambush and becomes a predictable transition. **Predictability is safety** for toddlers."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Time concepts — morning, afternoon, yesterday, tomorrow",
        "Abstract time language helps her anticipate the day and reduces transition anxiety.",
        "Most children develop understanding of basic time language between 24 and 30 months. 'We will go to the park this afternoon' only works as communication if the child has a concept of afternoon. Time language reduces anxiety: the day becomes a predictable structure rather than a series of surprises.",
        """* Use time language consistently in daily narration: "Good morning," "This afternoon we're going to the park," "We'll do that tomorrow"
* A visual daily schedule — pictures of the sequence of events — makes abstract time concepts concrete
* Don't expect accuracy: a toddler who says "yesterday" for any past event is completely on track
* Future-orient with her: "After lunch, we're going to the park." This builds the habit of temporal thinking.
* The concept of 'tomorrow' is harder than 'this afternoon' — it requires understanding that a full sleep cycle separates now from then""",
    ) + window_card(
        "⏳ Open window", "open",
        "Named friendships — 'I want to play with Ella'",
        "When she asks for a specific child by name, that's not preference — that's the beginning of friendship.",
        "Most children begin to form specific social preferences around 30 to 34 months — requesting particular children by name, showing excitement when they know a certain friend will be present. This is the emergence of selective social bonding beyond the family. It is one of the earliest signs of social intelligence that will drive peer relationships throughout childhood.",
        """* Take the preference seriously. If she asks for Ella, try to arrange it.
* Keep playdates short (60–90 minutes), small (one friend is enough), and low-key
* Stay nearby but let them navigate the social dynamic themselves — resist the urge to direct the play
* Debrief naturally afterward: "Did you have fun with Ella? What did you play?"
* Conflict is part of friendship learning — resist rescuing too quickly when they disagree""",
    ),
    tackled_html=tackled_section([
        ("Potty — showing readiness signs", "Both"),
        ("Ball catching — getting there with a big soft ball", "Dad"),
        ("Speech — strangers understanding more", "Both"),
    ]),
    next_month_html=next_month_section([
        "Preschool readiness — what the first day actually requires",
        "Balances on one foot for 2 seconds — the flamingo game",
        "Counts objects 1–5 — one-to-one correspondence starting",
    ]),
    closing_text="When she tells a joke, laugh. Every single time. You're not indulging silliness — you're reinforcing the social intelligence that will carry her through life. — Jack",
)
with open(f"{OUT}/month28-redesign.html", "w") as f: f.write(html)
print("Written: month28-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 29
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 29", title_label="Month 29",
    subject="Preschool readiness: it's not about colors and counting. It's about this.",
    preheader="Olivia is 29 months old. What preschool readiness actually means, plus balance and counting.",
    hero_age="Month 29", hero_name="Olivia · 29 months old",
    opening="Olivia is 29 months old. Many families are starting to think about preschool around now. The question isn't 'does she know her colors?' It's a different set of questions — and they matter more than most parents realize.",
    context="Twenty-nine months: preschool readiness is about separation, communication, and self-help skills — not academics.",
    theme="🏫 This month: what preschool readiness really means, the flamingo balance, and counting 1–5 with meaning.",
    total_windows=24,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Preschool readiness — what to look for before the first day",
        "Readiness isn't about knowing colors or counting. It's about functioning in a group.",
        "Preschool readiness is not about academics. It's about the skills that allow a child to function in a group setting: separating from parents without extended distress, following basic two-step instructions, communicating her needs verbally, and managing basic self-help tasks. A child who isn't ready won't have a faster start — just a harder one.",
        """* **Separation:** can she separate without extended distress? Practice in low-stakes settings: grandparent visits, playdates without parents
* **Communication:** can she tell an unfamiliar adult she needs the toilet or is hungry? This is the practical communication bar
* **Instructions:** can she follow a 2-step instruction from a teacher she's just met?
* **Self-help:** can she pull her pants up and down? Wash hands? Handle a snack independently?
* **Visit the preschool before the first day** — familiarity dramatically reduces first-day anxiety
* Read books about starting school: *The Kissing Hand*, *Wemberly Worried*, *First Day Jitters*
* A child who meets these criteria is ready. A child who doesn't yet — isn't, and that's information, not failure.""",
    ),
    dyk_html=dyk_card("True counting — where each object gets exactly one number — is called **one-to-one correspondence** and is fundamentally different from reciting number sequences. It's one of the earliest building blocks of mathematical reasoning, and children who have it at this age show consistently stronger math outcomes in primary school."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Balances on one foot for 2 seconds — the flamingo game",
        "Standing on one foot briefly is a demanding vestibular task. And it's the gateway to hopping.",
        "Most children develop the ability to stand briefly on one foot around 30 to 35 months. It requires shifting the center of gravity over a single support point while the raised leg is controlled — a demanding vestibular and proprioceptive task. It's the direct precursor to hopping, skipping, and stair climbing with alternating feet.",
        """* Make it a game: "Can you stand on one foot like a flamingo?"
* Hold her hand at first and gradually reduce support as she improves
* Count out loud while she balances — it makes it concrete and motivating: "1... 2... 3!"
* Practice during normal routines: standing on one foot to put on a sock is a real-world application
* By 36 months, most children can balance 2+ seconds. By 48 months, 4–8 seconds.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Counts objects 1–5 with one-to-one correspondence",
        "Touching each object once and assigning it a number — that's real counting. Different from reciting.",
        "True counting — touching each object once and assigning it a number word in sequence — is different from reciting numbers. One-to-one correspondence is a foundational math skill: the understanding that each item gets exactly one number. Most children develop this between 30 and 36 months.",
        """* Count small groups of physical objects together: "One cracker, two crackers, three crackers — three total"
* Move each item as you count it — the physical movement reinforces the one-to-one mapping
* Correct gently when she skips an object or counts one twice: "Let's count again — touch each one"
* Make it tactile: counting grapes onto a plate, counting steps onto the bus
* By 36 months, most children can accurately count 5 objects with one-to-one correspondence""",
    ),
    tackled_html=tackled_section([
        ("Jokes — she's hilarious and knows it", "Both"),
        ("Time concepts — using 'this afternoon' correctly", "Both"),
        ("Named friendships — regular playdates with Ella", "Mum"),
    ]),
    next_month_html=next_month_section([
        "30-month checkup — language, play, and behavior all assessed",
        "Crib to bed transition — timing and how to do it right",
        "Daytime dryness — the potty training finish line",
    ]),
    closing_text="Preschool readiness is built over months of practice at home. Separation, communication, self-help. That's the curriculum — and you're already teaching it. — Jack",
)
with open(f"{OUT}/month29-redesign.html", "w") as f: f.write(html)
print("Written: month29-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 30
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 30", title_label="Month 30",
    subject="The 30-month visit was added to the schedule specifically to catch language delays.",
    preheader="Olivia is 30 months old. The checkup, the crib transition, and the potty finish line.",
    hero_age="Month 30", hero_name="Olivia · 30 months old",
    opening="Olivia is 30 months old. Two and a half years. The 30-month well child visit is relatively new to the AAP schedule — it was added specifically because the gap between 24 and 36 months was too long, and language delays were becoming entrenched before anyone caught them. Here's what it covers.",
    context="Thirty months: the halfway point between the 2-year and 3-year checkups — and one of the most useful.",
    theme="🩺 This month: the 30-month checkup, the crib-to-bed transition, and the potty training finish line.",
    total_windows=22,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "30-month well child visit",
        "Specifically added to catch language delays while intervention is still most effective.",
        "The 30-month visit was added to the AAP schedule specifically for developmental surveillance. It assesses 3-word sentences, cooperative play, comprehension, and behavior. The gap between 24 months and 36 months is long enough that language delays can become significantly entrenched — this visit catches issues while intervention is still highly effective.",
        """* Note sentence length before the visit: most 30-month-olds use 3-word sentences regularly
* Note social behavior: does she play with other children (cooperative play), or still just alongside them (parallel play)?
* Bring concerns about behavior, tantrums, sleep, or language — this visit is designed specifically for them
* 3-word sentences absent at 30 months: ask for a speech evaluation referral today, not at 36 months
* Ask about potty training if it's in progress — your pediatrician has practical guidance""",
    ),
    dyk_html=dyk_card("Moving from crib to bed **too early** is one of the most common causes of sleep regression in the second and third years. The crib is a boundary. Keeping it in place until age 3 — unless there's a safety reason — makes bedtime more predictable and sleep more reliable for everyone."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Crib to bed transition — timing matters",
        "Most sleep experts say 3 years, unless she's climbing out. Here's the full guidance.",
        "Moving from crib to toddler bed too early is one of the most common causes of sleep regression. Most sleep experts recommend keeping children in a crib until age 3 unless there is a safety reason (climbing out consistently). The crib is a sleep boundary — keeping it in place makes bedtime more predictable.",
        """* If she's climbing out: lower the mattress first, use a sleep sack to limit leg range, then transition if climbing continues
* Transition around age 3 when she can understand and follow the boundary of staying in bed
* Transition when she reaches 35 inches in height, or when the crib rail is less than ¾ of her height — whichever comes first, regardless of age
* Involve her in choosing her new bed — buy-in matters
* The transition may mean earlier wake times and more bedtime curtain calls for a few weeks. It passes.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Daytime dryness — the potty training finish line",
        "Fewer than one accident per day, most days. That's the milestone.",
        "Most children achieve consistent daytime dryness — fewer than one accident per day on most days — between 24 and 33 months. This is the functional endpoint of daytime potty training. Nighttime dryness is a completely separate milestone — many children are not reliably dry at night until age 5 or 6, which is normal.",
        """* If training is complete: maintain consistency at transitions — leaving the house, before nap, before bed
* If still in progress: review the readiness checklist. If readiness signs are present but training is stalling, try a fresh 3-day intensive approach
* Respond to accidents calmly — clean up together, no shame, no punishment
* Nighttime training is separate. Pull-ups or training pants at night are fine indefinitely at this age.
* By 33 months, if daytime dryness is not established, mention it at the 30-month visit. Not because something is necessarily wrong — but to rule out physical factors.""",
    ),
    tackled_html=tackled_section([
        ("Preschool visit — done, she loved it", "Both"),
        ("Counting 1–5 — touching each object", "Dad"),
        ("Balance on one foot — 2 seconds in the flamingo game", "Both"),
    ]),
    next_month_html=next_month_section([
        "Peer friendships forming — consistent, named relationships",
        "Number-quantity concept — '2' means exactly 2 things",
        "Getting dressed independently — simple clothes, elastic and velcro",
    ]),
    closing_text="Two and a half. The language has come so far. The 30-month visit is worth taking seriously — come prepared. — Jack",
)
with open(f"{OUT}/month30-redesign.html", "w") as f: f.write(html)
print("Written: month30-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 31
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 31", title_label="Month 31",
    subject="She has a best friend. And she can get dressed by herself.",
    preheader="Olivia is 31 months old. Peer friendships, number concepts, and dressing independently.",
    hero_age="Month 31", hero_name="Olivia · 31 months old",
    opening="Olivia is 31 months old. Friendships are becoming specific, real, and important to her. And the self-help skills are expanding — getting dressed, managing the bathroom, navigating snacks. Here's what's worth supporting.",
    context="Thirty-one months: independence is expanding on every front — social, cognitive, and physical.",
    theme="👗 This month: real peer friendships, understanding what numbers mean, and getting dressed solo.",
    total_windows=21,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Peer friendship formation begins",
        "Consistent preference for a specific child, seeking them out, joy at reunion — that's friendship.",
        "True peer friendships — consistent preference for a specific other child, seeking them out, showing joy at reunion — begin to emerge around age 3. They're different from general sociability. These friendships are important for language development, theory of mind, conflict resolution skills, and emotional wellbeing.",
        """* Facilitate regular time with the same small group of children — familiarity is what deepens into friendship
* Help her learn to enter play: "You could ask if you can play too" — give her the words
* Take her social preferences seriously: if she keeps talking about one child, make that friendship a priority
* Coach conflict rather than referee: when there's a disagreement, ask "What could you do?" before stepping in
* Friendships at this age are fragile but real — the child who doesn't want to share today may be her best friend by 4""",
    ),
    dyk_html=dyk_card("Children who understand **cardinality** — that '3' means exactly 3 things, not just a word in a sequence — at age 3 show consistently stronger mathematics outcomes in primary school. The 'give me' game (give me 2 crackers) is one of the most powerful math activities you can do, anywhere, anytime."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Number-quantity concept — '2' means exactly 2 things",
        "Rote counting and real counting are different. This is when real counting clicks.",
        "Many children can rote count to 10 without understanding that numbers represent quantities. Most children develop cardinal number understanding — knowing that '2' means exactly 2 objects — around 30 to 35 months. It's one of the earliest building blocks of mathematical reasoning.",
        """* Play 'give me' games: "Can you give me 2 crackers? Can you give me 1 more?"
* Count objects together by pointing to each one, then announce the total: "One, two, three — three bears!"
* Avoid drilling. Embed counting in normal activities: setting the table, getting socks out of the drawer
* Books like Eric Carle's *The Very Hungry Caterpillar* reinforce this naturally
* The goal is for her to understand that the last number said is the total — called the 'cardinal principle'""",
    ) + window_card(
        "⏳ Open window", "open",
        "Gets dressed independently — simple clothes",
        "Elastic waist, velcro shoes, no buttons. That's the dressing curriculum at 31 months.",
        "Between 31 and 35 months, most children can put on simple clothing independently: a shirt pulled over the head, pants with an elastic waist, socks, and velcro shoes. This is a significant independence milestone and a preschool readiness requirement.",
        """* Start with the easiest items: loose pants and socks. Let her try while you narrate.
* Teach front-from-back with a simple cue: "Tag goes in the back"
* Put out tomorrow's clothes the night before and let her get dressed independently in the morning — this removes time pressure
* Avoid buttons, snaps, and laces during the learning phase. Elastic and velcro only.
* By 36 months, most children can dress themselves in simple clothes. By 48 months, buttons and zippers.""",
    ),
    tackled_html=tackled_section([
        ("30-month checkup — 3-word sentences confirmed", "Both"),
        ("Crib — still in it, one more year", "Both"),
        ("Potty — daytime dry most days", "Both"),
    ]),
    next_month_html=next_month_section([
        "Knows full name and age — a practical safety milestone",
        "Hops on one foot — bunny jumps, hopscotch",
        "Tooth brushing — child takes a turn, parent finishes",
    ]),
    closing_text="The friendships she's making now are the first ones she'll remember. Take them seriously. — Jack",
)
with open(f"{OUT}/month31-redesign.html", "w") as f: f.write(html)
print("Written: month31-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 32
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 32", title_label="Month 32",
    subject="She should know her full name. Here's why — and what else matters this month.",
    preheader="Olivia is 32 months old. Name and age, hopping, and tooth brushing independence.",
    hero_age="Month 32", hero_name="Olivia · 32 months old",
    opening="Olivia is 32 months old. Knowing and stating her full first name and age is both a developmental milestone and a practical safety skill. If she were ever lost, that information is the first thing a stranger would need. Here's what matters this month.",
    context="Thirty-two months: self-concept, physical confidence, and daily health habits.",
    theme="🦷 This month: name and age, hopping on one foot, and the tooth brushing handoff.",
    total_windows=20,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Knows full first name and age",
        "This is a developmental milestone and a safety skill — both matter.",
        "Knowing and stating their full first name and age by age 3 shows autobiographical memory, self-concept, and language integration. It's also a practical safety milestone: a child who can state their name is better equipped to communicate with an adult if lost.",
        """* Practice at home in a fun, low-stakes way: "What's your name?" "How old are you?"
* Celebrate birthday awareness: "You're 2 years old now! You'll be 3 on your birthday."
* Teach first and last name for safety purposes as soon as she can manage it — ideally before age 3
* Make it part of games: puppets asking her name, role-playing scenarios
* By age 3, she should also know the full names of her parents — another safety milestone worth practicing""",
    ),
    dyk_html=dyk_card("Hopping on one foot is a precursor to **skipping** — which is itself a precursor to the lateral coordination needed for sports, dance, and smooth stair negotiation. The physical milestones build on each other in a sequence that spans years."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Hops on one foot",
        "Multiple consecutive hops on the same foot. Harder than it looks — and a 3-year milestone.",
        "Hopping on one foot — taking multiple consecutive hops on the same foot — is a milestone around age 3 to 3.5. It requires single-leg balance, dynamic stability, and rhythmic motor planning. It's a precursor to skipping and is commonly assessed at the 4-year visit.",
        """* Demonstrate hopping and make it a game: "Hop like a bunny!"
* Hopscotch (even a rough chalk version) is excellent practice
* Try the "hot lava" game — hopping between cushions on the floor
* Don't push the milestone — it develops on its own timeline. Encouragement and play are enough.
* By 36 months, most children can take 2+ consecutive hops. By 48 months, 10+ on each foot.""",
    ) + window_card(
        "⏳ Open window", "open",
        "Tooth brushing — child takes a turn, parent finishes",
        "The handoff: she brushes first, you brush second. Her technique alone isn't sufficient yet.",
        "The AAPD recommends brushing from the first tooth. Most children are ready to hold the brush and take a turn around 27 to 32 months. This is not just oral hygiene — it's a lifelong habit being formed. Children who brush independently (with adult follow-through) from this age have significantly better dental outcomes.",
        """* Let her brush first — this honors her autonomy and makes cooperation much easier
* Then the parent does a thorough second pass — non-negotiable. Her technique alone is not sufficient.
* Let her pick her toothbrush (character brushes work) and her toothpaste flavor
* Make it a routine, not a battle: same time, same sequence, every day
* Electric toothbrushes are fine and often more effective than manual at this age
* If she's resisting: try brushing teeth on a stuffed animal first, or let her 'brush' your teeth""",
    ),
    tackled_html=tackled_section([
        ("Peer friendships — 2 regular playdates per week", "Both"),
        ("Getting dressed — elastic waist, mostly solo", "Both"),
        ("Number-quantity — knows 2 means exactly 2", "Dad"),
    ]),
    next_month_html=next_month_section([
        "Imaginary friends — healthy, normal, and worth engaging",
        "Tells stories about recent events — narrative skill",
        "Follows complex multi-step instructions",
    ]),
    closing_text="Teach her her full name and your name this month. It takes one week of practice. It could matter a lot. — Jack",
)
with open(f"{OUT}/month32-redesign.html", "w") as f: f.write(html)
print("Written: month32-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 33
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 33", title_label="Month 33",
    subject="She has an imaginary friend. That's a very good sign.",
    preheader="Olivia is 33 months old. Imaginary friends, telling stories, and multi-step instructions.",
    hero_age="Month 33", hero_name="Olivia · 33 months old",
    opening="Olivia is 33 months old. She may have an imaginary friend — or be on the verge of inventing one. Research by Marjorie Taylor found that children with imaginary friends are not confused, lonely, or concerning. They're often the most socially skilled kids in the room.",
    context="Thirty-three months: imagination is at full power. Harness it.",
    theme="🌟 This month: imaginary friends, storytelling, and following complex instructions.",
    total_windows=19,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Imaginary friends — healthy and normal",
        "25 to 65% of children have imaginary friends. The ones who do are often more socially skilled than those who don't.",
        "Imaginary companions are a common and healthy feature of social development in 25 to 65% of children between ages 2.5 and 7. Research by Marjorie Taylor shows that children with imaginary friends are not lonely or confused about reality — they are often more socially skilled, better at perspective-taking, and more creative than peers without them. The imaginary friend is a safe space to practice social interaction.",
        """* Engage with the imaginary friend playfully: "Should we set a place at the table for them?"
* Do not dismiss or ridicule the imaginary companion — it shuts down the imaginative play immediately
* Do not reinforce any genuinely confusing reality/fantasy blending — gently clarify when needed
* Take it as a positive sign: evidence of active imagination, strong narrative capacity, and social rehearsal
* Imaginary friends often disappear naturally as real friendships deepen. That's also a positive sign.""",
    ),
    dyk_html=dyk_card("Children who regularly **tell stories** about their own experiences — even simple ones — show stronger reading comprehension and writing ability at age 6 and 7. Storytelling builds the narrative scaffolding that books are built on. The dinner table is the classroom."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Tells stories — describes a recent event",
        "'We went to the park. I saw a dog. The dog was big.' That's a story. That's remarkable.",
        "Telling a story — even a simple one — requires narrative structure, memory retrieval, and connected sentence production. It is one of the most advanced language milestones in the early childhood window and a predictor of reading comprehension and academic success.",
        """* After outings, ask open-ended questions: "What happened at the park?" rather than "Did you have fun?"
* Build the narrative with her: "You told me about the dog — what did the dog do?"
* Use photos from recent events as prompts for storytelling practice
* Model storytelling yourself: "Today at work, something funny happened. I was walking to my desk and I..."
* Story-rich read-alouds — books with clear narrative arcs — provide the template""",
    ) + window_card(
        "⏳ Open window", "open",
        "Follows complex multi-step instructions",
        "'Go to your room, get your shoes, and bring them here.' All three steps. That's the target.",
        "Following a 3 to 4 step instruction without prompting is a school readiness skill. It requires working memory, sustained attention, and language comprehension all working together. Children who can follow complex instructions transition more smoothly into structured classroom environments.",
        """* Practice with daily routines: "Go to your room, put your shoes by the door, and come back here"
* Break tasks into verbal steps instead of doing them for her — the independence is the practice
* If she loses track, ask "What comes next?" rather than restating the whole instruction
* Use multi-step instructions at mealtimes, getting ready for outings, and bedtime routines — these are the natural contexts
* The school-readiness bar: 3-step instructions followed reliably by age 3""",
    ),
    tackled_html=tackled_section([
        ("Name and age — knows her full name", "Both"),
        ("Hopping — two or three in a row", "Both"),
        ("Tooth brushing — she goes first now", "Both"),
    ]),
    next_month_html=next_month_section([
        "Copies a circle — letter readiness milestone",
        "Gratitude and empathy practice at the table",
        "Tricycle or balance bike — wheeled independence",
    ]),
    closing_text="The imaginary friend is practicing social skills. Let her. — Jack",
)
with open(f"{OUT}/month33-redesign.html", "w") as f: f.write(html)
print("Written: month33-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 34
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 34", title_label="Month 34",
    subject="She drew a circle. That's closer to writing than it looks.",
    preheader="Olivia is 34 months old. Drawing, gratitude practice, and the balance bike.",
    hero_age="Month 34", hero_name="Olivia · 34 months old",
    opening="Olivia is 34 months old. She's drawing with intention now — not just scribbling. Copying a circle is a standard 3-year motor milestone, and it's a direct precursor to writing letters. Here's what else is happening.",
    context="Thirty-four months: fine motor, character, and wheeled independence.",
    theme="✏️ This month: copies a circle, gratitude at the table, and the first wheels.",
    total_windows=18,
    priority_card_html=window_card(
        "⏳ Open window", "open",
        "Copies a circle — letter readiness milestone",
        "A closed, approximately circular shape. That's enough. The wrist rotation is what matters.",
        "Copying a circle — drawing a closed, approximately circular shape after seeing one drawn — is a standard motor milestone around 30 months. It requires more wrist rotation and planning than a straight line. It's a direct letter readiness skill and a common item on developmental screening tests at age 3.",
        """* Draw a circle slowly in front of her and invite her to copy it: "Can you draw one like mine?"
* Accept any closed or approximately circular shape — perfection is not the milestone
* Practice with finger painting, tracing circles in sand or on fogged glass, drawing on a whiteboard
* Next in sequence: copying a cross (vertical + horizontal lines), then a square, then a triangle
* Drawing on vertical surfaces (an easel or whiteboard) builds different wrist and shoulder strength than drawing flat""",
    ),
    dyk_html=dyk_card("Families with regular **gratitude practices at mealtimes** — even one sentence each — show measurably higher wellbeing, more prosocial behavior, and stronger relationship quality in children by age 10. The mechanism is habit formation through repetition. It takes about 3 weeks to feel natural."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Gratitude and empathy practice at the table",
        "One sentence each at dinner. That's the whole intervention. The research is clear.",
        "Gratitude and empathy are teachable through repeated practice in low-stakes, everyday contexts. Mealtime provides a consistent, captive setting. Research by Robert Emmons and others shows that children in families with regular gratitude practices show measurably higher wellbeing, prosocial behavior, and relationship quality by age 10.",
        """* Introduce a simple mealtime ritual: one thing each person is grateful for today — including you
* Name emotions at the table: "You look frustrated — what happened today?"
* Express genuine appreciation for the meal and for each other in simple terms: "Thank you for making dinner"
* When she says something ungrateful or unkind: name it neutrally and model the alternative
* Consistency matters far more than depth — 30 seconds every dinner is more powerful than an occasional 10-minute conversation""",
    ) + window_card(
        "⏳ Open window", "open",
        "Tricycle or balance bike — first wheeled independence",
        "Balance bike first if starting from scratch. Pedaling comes later — around 36 months.",
        "Most children can propel and steer a balance bike or walk a tricycle around 26 to 29 months. True pedaling — coordinating the reciprocal leg motion to drive a tricycle forward — typically arrives closer to 36 months. This is a major gross motor milestone and one of the most motivating forms of independent movement available to toddlers.",
        """* **Balance bike first** if introducing from scratch: no pedals, child propels by walking then lifts feet to glide. This builds balance and makes the later transition to a pedal bike much easier.
* For tricycles: position the seat so legs have a slight bend at the bottom of the pedal stroke
* Start on a flat, smooth surface — grass is too hard, slopes are dangerous
* Helmet from day one, always. It builds the habit before speed makes it necessary.
* Children who start on balance bikes typically skip training wheels entirely when they transition to a pedal bike""",
    ),
    tackled_html=tackled_section([
        ("Imaginary friend — fully engaged with her", "Both"),
        ("Storytelling — telling us about her day", "Both"),
        ("3-step instructions — following reliably", "Both"),
    ]),
    next_month_html=next_month_section([
        "Car seat forward-facing transition — when it's time to move",
        "Counts to 3 with meaning — not just reciting",
        "Sharing is developmentally appropriate now — gentle scaffolding",
    ]),
    closing_text="Draw circles together. It's fine motor practice for her and a moment of stillness for you. — Jack",
)
with open(f"{OUT}/month34-redesign.html", "w") as f: f.write(html)
print("Written: month34-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 35
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 35", title_label="Month 35",
    subject="One month to the 3-year checkup. Here's what to bring.",
    preheader="Olivia is 35 months old. Car seat transition, counting with meaning, and sharing finally makes sense.",
    hero_age="Month 35", hero_name="Olivia · 35 months old",
    opening="Olivia is 35 months old. One month from the 3-year checkup — and the 3-year milestone set is nearly complete. Here's what to focus on in this final stretch.",
    context="Thirty-five months: the 3-year checkup is one month away. Come prepared.",
    theme="🚗 This month: car seat safety update, counting with real meaning, and the forward-facing milestone.",
    total_windows=17,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "Car seat forward-facing transition",
        "This isn't an age milestone — it's a size milestone. Check the seat, not the calendar.",
        "When a child has outgrown the rear-facing limits of their seat — by height or weight, not by age — they transition to a forward-facing harness seat. Forward-facing is still significantly safer than a booster. The forward-facing harness should be used until the child outgrows it too.",
        """* Check your seat's rear-facing limit: if her head is within 1 inch of the top of the seat back, she's outgrown it
* Check the weight limit: most convertible seats rear-face to 40–50 lbs; check your specific seat's manual
* Move to a forward-facing convertible seat with a 5-point harness — not a booster. Boosters come much later.
* In forward-facing mode: ensure the harness straps are at or above shoulder level
* Many children can safely stay rear-facing well past age 2 — don't rush it if the seat limits haven't been reached
* Weight and height limits vary by country and seat — check your specific seat's manual and your local road safety guidelines""",
    ),
    dyk_html=dyk_card("The '**give me 3**' game — asking a child to hand you exactly 3 objects — is one of the most reliable ways to test whether she understands what 3 means, versus just being able to recite '1, 2, 3.' Both matter, but understanding cardinality is the deeper skill."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Counts to 3 with meaning",
        "'1, 2, 3 — three!' She knows 3 is the total, not just the third word in a sequence.",
        "Counting to 3 by age 3 is an early numeracy milestone. Note the distinction: reciting '1, 2, 3' is a sequence. Knowing that '3' means exactly 3 objects is cardinality. Both are building — and at this age, cardinality for small numbers (1, 2, 3) should be solid.",
        """* Count everything: stairs, crackers, fingers, steps to the car
* Use fingers to show the count alongside the word — the visual anchor reinforces the meaning
* Test cardinality: "Give me 3 crackers" — not "count to 3." Counting is reciting. Giving 3 requires understanding.
* Books and songs with counting sequences reinforce both the sequence and the meaning
* By 36 months: counts to 10 in sequence, understands cardinality for numbers 1–3""",
    ) + window_card(
        "⏳ Open window", "open",
        "Sharing is developmentally appropriate now — gentle scaffolding",
        "Before age 3, forcing sharing doesn't work. After age 3, it can be taught. This is that moment.",
        "True sharing requires theory of mind (understanding that another person wants something you have) and enough impulse control to override the desire to keep it. Research by Dacher Keltner and others is consistent: forcing sharing before these capacities are in place teaches that adults take things arbitrarily. Around age 3, both capacities are beginning to arrive.",
        """* Shift from 'forced sharing' to scaffolded turn-taking: "When you're done with the truck, it's Finn's turn"
* Validate ownership first: "That is your truck. You decide when you're done."
* Model generosity explicitly: "I have two pieces of apple. I'll give one to you."
* Narrate the social contract: "She waited so patiently for her turn. That made her feel happy."
* Don't force immediate sharing — but do hold the expectation that a turn will come, and follow through""",
    ),
    tackled_html=tackled_section([
        ("Circle drawing — closed shapes, some quite round", "Both"),
        ("Gratitude at dinner — everyone shares one thing", "Both"),
        ("Balance bike — she's gliding!", "Dad"),
    ]),
    next_month_html=next_month_section([
        "36-month checkup — the end of the intensive developmental surveillance period",
        "Full sentences (4+ words) — the 3-year language milestone",
        "Consistent, calm discipline — the approach that actually works",
    ]),
    closing_text="One month to the third birthday — and the 3-year checkup. Come with your observations, your concerns, and your word count. — Jack",
)
with open(f"{OUT}/month35-redesign.html", "w") as f: f.write(html)
print("Written: month35-redesign.html")

# ═══════════════════════════════════════════════════════════════════════════════
# MONTH 36
# ═══════════════════════════════════════════════════════════════════════════════
html = page(
    nav_label="Month 36", title_label="Month 36",
    subject="Three years. The most intensive developmental period of any human life is complete.",
    preheader="Olivia is 3 years old. The 36-month checkup, full sentences, and consistent discipline.",
    hero_age="Month 36", hero_name="Olivia · 36 months old",
    opening="Olivia is 3 years old. Three years. The 36-month well child visit marks the end of the most intensive developmental surveillance period in medicine. From here, visits go annual. You've made it through all of it.",
    context="Three years. The intensive developmental surveillance window closes. Annual visits from here.",
    theme="🎉 This month: the 3-year checkup, full sentences, and the discipline approach that actually works.",
    total_windows=25,
    priority_card_html=window_card(
        "⏱ Closing this month", "",
        "36-month well child visit",
        "This is the last visit in the intensive surveillance schedule. Come prepared — it covers a lot.",
        "The 36-month visit marks the end of the most intensive developmental surveillance period. It assesses full sentences (4+ words), imaginative play, social skills, potty training progress, and school readiness. From age 3, well child visits go annual. Vaccines: DTaP (dose 5), MMR (dose 2), varicella (dose 2), IPV (dose 4), influenza (annual).",
        """* Note speech clarity: strangers should understand approximately 75% of her speech by now
* Count sentence length: 4+ word sentences should be consistent ("I want to go to the park")
* Note potty status: daytime dryness is the 3-year target; nighttime is a separate, later milestone
* Discuss preschool if applicable — the 3-year visit is the right moment to ask school-readiness questions
* Ask about anything that's been on your mind. Annual visits means the next opportunity is 12 months away.
* The M-CHAT autism screen at 18 and 24 months has now been completed — if any concerns were raised, ask for the follow-up status""",
    ),
    dyk_html=dyk_card("By age 3, the brain has reached **80% of its adult size** — and the connections built in the first three years are the scaffolding for everything that comes after. You have been building the most important architecture of her life. Every conversation, every book, every patient repair after a meltdown. All of it counted."),
    supporting_cards_html=window_card(
        "⏳ Open window", "open",
        "Full sentences — 4+ words, consistent",
        "'I want to go to the park.' That's a sentence. That's language doing its job.",
        "By 36 months, most children are speaking in sentences of 4 or more words and can be understood by unfamiliar adults roughly 75% of the time. Full sentences mark the point at which language is a reliable communication tool — not just labels and requests, but narrative, explanation, and emotional expression. Absent 4-word sentences by 36 months is a significant language flag.",
        """* Have real conversations: ask about her day, her feelings, what she noticed. Give her space to answer fully.
* Read books with storylines, not just picture books — narrative structure builds sentence structure
* Limit screens at this age: screen time still primarily displaces conversation, and conversation is the input
* If 4-word sentences are not consistent by 36 months, ask for a speech-language pathology evaluation at this visit
* The next language milestones: complex questions, storytelling with sequence, explaining her reasoning — all building now""",
    ) + window_card(
        "⏳ Open window", "open",
        "Consistent, calm discipline — the approach that actually works",
        "The approach matters less than the consistency. Pick one. Apply it every time.",
        "Consistency is the single most important variable in discipline effectiveness. The specific approach — time-outs, natural consequences, redirection, positive reinforcement — matters less than whether it's applied consistently. A child who receives the same response to a behavior every time learns quickly. Unpredictable responses teach that limits are negotiable.",
        """* Agree on the approach with your co-parent and apply it the same way every time
* State the limit clearly and calmly before enforcing it: "If you throw the food again, we will leave the table"
* Follow through. Every single time. One exception teaches her that persistence pays off.
* Calm is non-negotiable: a parent who loses their temper unpredictably creates anxiety, not compliance
* Natural consequences are often the most effective teacher: if she won't put her shoes on, she gets cold feet
* Praise the behavior you want to see, specifically: "Thank you for using your words when you were angry. That was mature."
* You don't have to be perfect — but you do have to be consistent. That's the whole thing.""",
    ),
    tackled_html=tackled_section([
        ("Car seat — forward-facing with 5-point harness", "Both"),
        ("Counting with meaning — gives you exactly 3", "Dad"),
        ("Turn-taking — sharing is starting to click", "Both"),
    ]),
    next_month_html=farewell_block(),
    closing_text="Happy third birthday to Olivia — and to you. Three years of showing up. Three years of learning on the job. The work you've done in these first three years is the most important work of her life. From here, the visits go annual. Scout will keep sending these monthly — because development doesn't stop at 3. We'll see you next month. — Jack",
)
with open(f"{OUT}/month36-redesign.html", "w") as f: f.write(html)
print("Written: month36-redesign.html")

print("\nMonths 25-36 done. All 37 emails complete (pre-birth + months 1-36).")
