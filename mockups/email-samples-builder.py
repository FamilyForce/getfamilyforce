#!/usr/bin/env python3
"""Generate 6 redesigned email sample HTML files (pre-birth + months 1-5)."""

import os

DASHBOARD = "https://getfamilyforce.com/scout-dashboard.html"
SITE = "https://getfamilyforce.com"

CSS = """
  body { margin:0; padding:32px 16px; background:#f0ede8; font-family:Arial,sans-serif; }
  .wrap { max-width:580px; margin:0 auto; }
  .meta { text-align:center; margin-bottom:12px; }
  .meta p { font-size:12px; color:#888; margin:0 0 4px; }
  .meta a { color:#6E4ED6; font-size:11px; }
  .card { background:#fff; border-radius:16px; overflow:hidden; margin-bottom:12px; }
  .hero { background:linear-gradient(160deg,#2d1b69 0%,#1a0f3e 100%); padding:32px 28px 24px; text-align:center; }
  .hero .logo { font-size:13px; font-weight:700; color:rgba(255,255,255,.5); letter-spacing:.15em; text-transform:uppercase; margin-bottom:20px; }
  .hero .age { font-size:32px; font-weight:700; color:#fff; margin:0 0 4px; }
  .hero .name { font-size:15px; color:rgba(255,255,255,.6); margin:0 0 24px; }
  .hero .greeting { font-size:15px; color:rgba(255,255,255,.75); line-height:1.7; margin:0 0 12px; text-align:left; }
  .hero .opening { font-size:15px; color:rgba(255,255,255,.65); line-height:1.7; margin:0 0 16px; text-align:left; }
  .hero .context { font-size:13px; color:rgba(255,255,255,.45); font-style:italic; margin:0; text-align:left; border-top:1px solid rgba(255,255,255,.1); padding-top:14px; }
  .theme-stripe { background:#f7f4ff; border-left:3px solid #6E4ED6; padding:12px 18px; margin-bottom:12px; border-radius:0 8px 8px 0; }
  .theme-stripe p { margin:0; font-size:13px; color:#5B3CC4; font-weight:600; }
  .section-label { font-size:11px; font-weight:700; color:#999; text-transform:uppercase; letter-spacing:.1em; padding:0 4px; margin:20px 0 8px; }
  .window { background:#fff; border-radius:14px; overflow:hidden; margin-bottom:10px; border:1px solid #ece8f0; }
  .window-header { padding:18px 20px 12px; }
  .window-label { font-size:10px; font-weight:700; color:#c0392b; text-transform:uppercase; letter-spacing:.1em; margin:0 0 6px; }
  .window-label.open { color:#6E4ED6; }
  .window-title { font-size:16px; font-weight:700; color:#1a0f3e; margin:0 0 8px; line-height:1.3; }
  .jack-bridge { font-size:13px; color:#888; font-style:italic; margin:0 0 10px; }
  .window-why { font-size:14px; color:#555; line-height:1.65; margin:0; }
  .the-move { background:#faf7ff; border-top:1px solid #ece8f0; padding:14px 20px 16px; }
  .move-label { font-size:10px; font-weight:700; color:#6E4ED6; text-transform:uppercase; letter-spacing:.1em; margin:0 0 10px; }
  .move-item { display:flex; align-items:flex-start; gap:10px; margin-bottom:8px; }
  .move-bullet { color:#6E4ED6; font-weight:700; font-size:14px; flex-shrink:0; margin-top:1px; }
  .move-text { font-size:14px; color:#333; line-height:1.55; margin:0; }
  .move-text strong { color:#1a0f3e; }
  .move-text em { color:#555; }
  .dashboard-link { margin-top:10px; font-size:12px; color:#6E4ED6; text-decoration:none; display:block; }
  .dyk { background:linear-gradient(135deg,#e8f4f0 0%,#d4eee6 100%); border-radius:14px; padding:20px 22px; margin-bottom:10px; border:1px solid #b8ddd3; }
  .dyk-label { font-size:10px; font-weight:700; color:#1a7a5e; text-transform:uppercase; letter-spacing:.1em; margin:0 0 8px; }
  .dyk p { font-size:14px; color:#1a3d32; line-height:1.65; margin:0; }
  .dyk strong { color:#0d2d24; }
  .closing { background:linear-gradient(160deg,#1a0f3e 0%,#0d0820 100%); border-radius:14px; padding:24px 26px; margin-bottom:10px; }
  .closing p { font-size:14px; color:rgba(255,255,255,.7); line-height:1.8; margin:0; font-style:italic; }
  .coparent { text-align:center; padding:14px; }
  .coparent p { font-size:13px; color:#888; margin:0; }
  .coparent a { color:#6E4ED6; font-weight:600; text-decoration:none; }
  .cta { text-align:center; padding:8px 0 28px; }
  .cta a { background:#6E4ED6; color:#fff; font-size:15px; font-weight:700; text-decoration:none; padding:14px 36px; border-radius:100px; display:inline-block; }
  .footer { text-align:center; padding:0 0 32px; }
  .footer p { font-size:11px; color:#aaa; margin:0 0 4px; line-height:1.6; }
  .footer a { color:#aaa; }
  .preview-note { background:#fffbea; border:1px solid #f0d060; border-radius:8px; padding:12px 16px; margin-bottom:20px; font-size:13px; color:#7a6010; }
  .preview-note strong { color:#5a4000; }
  .subject-display { background:#fff; border-radius:10px; padding:16px 20px; margin-bottom:14px; border:1px solid #e0d8f0; }
  .subject-display p { margin:0 0 4px; font-size:12px; color:#999; text-transform:uppercase; letter-spacing:.08em; font-weight:600; }
  .subject-display .subject { font-size:15px; font-weight:700; color:#1a0f3e; margin:0 0 6px; }
  .subject-display .preheader { font-size:13px; color:#666; margin:0; font-style:italic; }
  .nav-bar { background:#fff; border-radius:10px; padding:12px 20px; margin-bottom:16px; display:flex; justify-content:center; gap:8px; flex-wrap:wrap; }
  .nav-bar a { font-size:12px; color:#6E4ED6; text-decoration:none; padding:4px 10px; border:1px solid #e0d8f0; border-radius:20px; }
  .nav-bar a.active { background:#6E4ED6; color:#fff; border-color:#6E4ED6; }
"""

def window_card(label_text, label_class, title, bridge, why_excerpt, bullets, link_text, link_href, is_closing=True):
    label_cls = "" if is_closing else " open"
    flag = "⏱ Closing this month" if is_closing else "⏳ Open window"
    bullets_html = ""
    for b in bullets:
        bullets_html += f'<div class="move-item"><span class="move-bullet">›</span><p class="move-text">{b}</p></div>\n'
    return f"""
  <div class="window">
    <div class="window-header">
      <p class="window-label{label_cls}">{flag}</p>
      <p class="window-title">{title}</p>
      <p class="jack-bridge">{bridge}</p>
      <p class="window-why">{why_excerpt}</p>
    </div>
    <div class="the-move">
      <p class="move-label">The move</p>
      {bullets_html}
      <a class="dashboard-link" href="{link_href}">{link_text} →</a>
    </div>
  </div>"""

def dyk_card(text):
    return f"""
  <div class="dyk">
    <p class="dyk-label">💡 Did you know</p>
    <p>{text}</p>
  </div>"""

def page(title, subject, preheader, hero_age, hero_name, opening, context,
         theme, priority_card, dyk, supporting_cards, closing_text, nav_links=None, active_nav=None):
    nav_html = ""
    active = active_nav or TITLE_TO_NAV.get(title, title)
    for label, href in (nav_links or NAV):
        cls = ' class="active"' if label == active else ''
        nav_html += f'<a href="{href}"{cls}>{label}</a>'

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Scout · {title} Sample</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
  <div class="preview-note"><strong>Redesign sample — {title}.</strong> Format: 3 windows · 3-bullet max · monthly theme · Did you know · Jack bridges · co-parent prompt.</div>
  <div class="nav-bar">{nav_html}</div>
  <div class="subject-display">
    <p>Subject line</p>
    <p class="subject">{subject}</p>
    <p class="preheader">{preheader}</p>
  </div>
  <div class="card">
    <div class="hero">
      <p class="logo">Scout</p>
      <p class="age">{hero_age}</p>
      <p class="name">{hero_name}</p>
      <p class="greeting">Hi there,</p>
      <p class="opening">{opening}</p>
      <p class="context">{context}</p>
    </div>
  </div>
  <div class="theme-stripe"><p>{theme}</p></div>
  <p class="section-label">This month's priority</p>
  {priority_card}
  {dyk}
  <p class="section-label">Also this month</p>
  {''.join(supporting_cards)}
  <div class="coparent"><p>📩 <a href="#">Forward this to your co-parent</a> — they need it too.</p></div>
  <div class="closing"><p>{closing_text}</p></div>
  <div class="cta"><a href="{DASHBOARD}">Open Scout dashboard →</a></div>
  <div class="footer">
    <p><em>For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</em></p>
    <p>Developmental windows medically reviewed by Karina Sanchez Mercado, MD · April 2026</p>
    <p><a href="#">Unsubscribe</a> · FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
  </div>
</div>
</body>
</html>"""

NAV = [
    ("Pre-birth", "month0-redesign.html"),
    ("Month 1",   "month1-redesign.html"),
    ("Month 2",   "month2-redesign.html"),
    ("Month 3",   "month3-redesign.html"),
    ("Month 4",   "month4-redesign.html"),
    ("Month 5",   "month5-redesign.html"),
]

# Map page title → nav label
TITLE_TO_NAV = {
    "Pre-birth": "Pre-birth",
    "Month 2": "Month 2",
    "Month 3": "Month 3",
    "Month 4": "Month 4",
    "Month 5": "Month 5",
}

OUT = "/home/node/.openclaw/workspace/projects/familyforce/mockups"

# ── PRE-BIRTH ─────────────────────────────────────────────────────────────────
p0 = page(
    title="Pre-birth",
    subject="Three things to do before the due date (one surprises almost everyone)",
    preheader="Olivia arrives in 8 weeks. One of these can't wait until after birth.",
    hero_age="8 weeks to go",
    hero_name="Olivia · Due in 2 months",
    opening="Your due date is getting close. This is Scout's pre-birth digest — three things worth doing before she arrives, each one easier to do now than after. Shouldn't take more than 5 minutes to read.",
    context="Everything you do before birth is infinitely easier than doing it with a newborn in the house.",
    theme="📋 Before she arrives: three things that will matter in the first 24 hours.",
    priority_card=window_card(
        "closing", "", "Choose your pediatrician before the baby is born",
        "You want this one done before labor starts. Trust me.",
        "The first well child visit happens within 3 to 5 days of birth. You'll be exhausted and trying to learn to feed a human. That is not the time to be researching doctors.",
        [
            "Start looking at 28–32 weeks. Don't leave it past 35 weeks — many pediatricians close their lists.",
            "Schedule a prenatal consultation with 2–3 candidates. Key questions: after-hours protocol, hospital affiliation, vaccine policy.",
            "Confirm the practice is in your insurance network <em>before</em> you commit. This is the most common post-birth billing surprise.",
        ],
        "Full question list for the consult", DASHBOARD,
    ),
    dyk=dyk_card("Babies can hear their mother's voice in the womb from around week 18. <strong>By birth, she already recognizes you.</strong> The moment you start talking to her in the delivery room, she knows who you are."),
    supporting_cards=[
        window_card(
            "closing", "", "Pack the hospital bag",
            "The one thing nobody packs that they always wish they had: a portable phone charger.",
            "A packed bag at 37 weeks means one less thing to think about when labor starts — and means you won't end up in the hospital without the things that actually matter.",
            [
                "<strong>Birth parent:</strong> ID and insurance card, birth preferences (one page), phone charger, loose comfortable clothing, toiletries, nursing bra if breastfeeding.",
                "<strong>Baby:</strong> car seat (installed and inspected before you leave), going-home outfit (size newborn and size 0–3 months), one swaddle blanket.",
                "<strong>Partner/support:</strong> snacks, change of clothes, phone charger. Labor can take 24 hours. Pack for that.",
            ],
            "Full hospital bag checklist", DASHBOARD,
        ),
        window_card(
            "closing", "open", "Understand newborn screening before the birth",
            "Three tests will happen before you leave the hospital. Know what they are so you're not caught off guard.",
            "Newborn screening tests for dozens of rare but serious conditions — metabolic disorders, hearing loss, critical heart defects. Most conditions are invisible at birth. Early detection changes outcomes.",
            [
                "<strong>Blood spot test (heel prick):</strong> 24–48 hours after birth, tests for 60+ conditions. Results in 1–2 weeks.",
                "<strong>Hearing screen:</strong> before discharge, painless, a small probe in the ear. A refer result means re-test, not a diagnosis.",
                "<strong>Critical congenital heart disease screen:</strong> pulse oximetry on hands and feet before discharge. Takes 5 minutes.",
            ],
            "What to do if a result needs follow-up", DASHBOARD,
            is_closing=False,
        ),
    ],
    closing_text="You're close now. Everything you do in the next few weeks makes the first days easier. We'll be with you from day one — your first monthly digest arrives when Olivia turns 1 month old. Until then: you're ready. — Jack",
)
with open(f"{OUT}/month0-redesign.html", "w") as f:
    f.write(p0)
print("Written: month0-redesign.html")

# ── MONTH 2 ──────────────────────────────────────────────────────────────────
p2 = page(
    title="Month 2",
    subject="The smile that changes everything — and what to do before Thursday",
    preheader="Olivia is 2 months old. One vaccine visit, one milestone to watch for.",
    hero_age="Month 2",
    hero_name="Olivia · 9 weeks old",
    opening="Olivia is 2 months old. The hard edge of the newborn phase is starting to soften. She's more awake, more alert, and more interested in you. Here's what to focus on this month.",
    context="Something shifts around 6–8 weeks. If you haven't seen the first real smile yet — it's close.",
    theme="😊 This month: one appointment to book, one milestone to watch for, and one habit worth starting now.",
    priority_card=window_card(
        "closing", "", "2-month well child visit",
        "The most vaccine-heavy visit of the first year. You can prepare for that.",
        "The 2-month visit kicks off the vaccination schedule. Vaccines: DTaP, Hib, PCV, rotavirus, polio, Hepatitis B, and RSV immunization. Expect fussiness and a low fever for 24–48 hours after — that's the immune system working.",
        [
            "Schedule on time. Vaccines are timed to the immune system's development — delays matter.",
            "For fever: infant acetaminophen is appropriate after 2 months. Ask your pediatrician about dosing before the visit. A rectal temperature of 100.4°F (38°C) or higher in a baby under 3 months requires a call.",
            "Bring your tummy time questions. Your pediatrician will ask about progress and tell you what to expect before month 4.",
        ],
        "What to expect at the 2-month visit", DASHBOARD,
    ),
    dyk=dyk_card("The social smile requires your baby to recognize your face, remember past interactions, and coordinate a voluntary muscle response — all at once. <strong>It's one of the most cognitively complex things she'll do in her first year.</strong> When it comes, you'll understand why people do this twice."),
    supporting_cards=[
        window_card(
            "closing", "", "The social smile — her first intentional interaction",
            "When it comes, it will stop you cold. Nothing prepares you for it.",
            "The social smile — in direct response to your face and voice, not gas — typically appears around 6 weeks. It's the first sign your baby is engaging with the social world on purpose. Absent by 3 months is a flag worth raising.",
            [
                "Get close. Babies can only focus clearly at 8–12 inches. Your face needs to be in range.",
                "Smile, talk, and wait. Give her time to respond. The social smile takes a beat.",
                "Respond every time: smile back, say something. This is her first conversation.",
            ],
            "What the social smile means developmentally", DASHBOARD,
        ),
        window_card(
            "open", "open", "Serve and return — the foundation of language",
            "The most researched interaction in early childhood. You're already doing it.",
            "Harvard's Center on the Developing Child calls serve and return 'the most important thing parents can do for brain development.' Your baby makes a sound or gesture — you respond. Back and forth. That's it. That's the whole thing.",
            [
                "Narrate everything: <em>'I'm changing your diaper now. Left leg first.'</em> She's building vocabulary before she can speak.",
                "When she coos, coo back. When she looks at something, look at it and name it.",
                "Put the phone down during face-to-face time. Your face is the most interesting thing in her world right now.",
            ],
            "Why serve and return matters for language", DASHBOARD,
            is_closing=False,
        ),
    ],
    closing_text="Two months down. That first real smile — if it's happened, you already know why people do this twice. If it hasn't, watch for it this week. When it comes, it changes the whole thing. See you next month. — Jack",
)
with open(f"{OUT}/month2-redesign.html", "w") as f:
    f.write(p2)
print("Written: month2-redesign.html")

# ── MONTH 3 ──────────────────────────────────────────────────────────────────
p3 = page(
    title="Month 3",
    subject="A window closing this month — and the habit that changes everything at 6 months",
    preheader="Olivia is 3 months old. Head control closes this month. Here's what that means.",
    hero_age="Month 3",
    hero_name="Olivia · 13 weeks old",
    opening="Olivia is 3 months old. Three months in is when most parents feel like they've finally figured something out. Here's what's worth your attention — she's got a lot going on right now.",
    context="You made it through the fourth trimester. Three months of adjusting, recovering, and learning on the job.",
    theme="🧠 This month: one milestone to close out, one habit to lock in, and one safety setup to check.",
    priority_card=window_card(
        "closing", "", "Head control — holds head steady when upright",
        "This window closes this month. Don't let it slip by.",
        "Steady head control by 4 months is one of the foundational gross motor milestones. It signals the neck muscles and upper spine are developing correctly — and it's a prerequisite for solid food readiness later.",
        [
            "Tummy time is the main driver. The work happens there — keep building toward 15–30 minutes per day.",
            "Hold her upright in your arms facing outward during waking hours. A baby carrier works well for this.",
            "Your pediatrician will assess head control at the 4-month visit. If it's not there yet, that's the time to raise it.",
        ],
        "Head control milestone details", DASHBOARD,
    ),
    dyk=dyk_card("Kids who had more serve and return interactions in their first year <strong>score measurably higher on language tests at age 5.</strong> You don't need flashcards or apps — responding to her sounds and looks is the whole thing."),
    supporting_cards=[
        window_card(
            "open", "open", "Serve and return — keep building it",
            "This is how she learns to have a conversation before she has words.",
            "The serve and return habit you started last month is compounding. Every response you give to her sounds and gestures builds neural pathways for language. This is the most evidence-backed thing you can do for her development.",
            [
                "Step it up: start pausing after you respond to see if she initiates again. You're teaching her conversation rhythm.",
                "Name her emotions when they're obvious: <em>'You're frustrated. I hear you.'</em> Emotional vocabulary starts here.",
                "Books count as serve and return. Point to pictures, wait for her to look, name what she's looking at.",
            ],
            "Serve and return — full guide", DASHBOARD,
            is_closing=False,
        ),
        window_card(
            "open", "open", "Room sharing — the 6-month window",
            "The AAP recommendation changed. Here's what it actually says.",
            "Room sharing — baby in your room, in their own sleep space — reduces SIDS risk by up to 50% compared to a separate room. The recommendation is at least 6 months. Bed sharing is different and increases risk.",
            [
                "Keep the crib or bassinet in your room through 6 months.",
                "If you're tempted to bring the baby into your bed during a night feed: make transfer back easy — darkness, white noise, firm surface nearby.",
                "After 6 months, transitioning to their own room is developmentally appropriate and safe.",
            ],
            "Safe sleep setup — full guide", DASHBOARD,
            is_closing=False,
        ),
    ],
    closing_text="Month 3 is when it starts feeling real. You're not just keeping her alive — you're watching her become someone. Month 4 is full of new things. We'll make sure you're ready. — Jack",
)
with open(f"{OUT}/month3-redesign.html", "w") as f:
    f.write(p3)
print("Written: month3-redesign.html")

# ── MONTH 4 ──────────────────────────────────────────────────────────────────
p4 = page(
    title="Month 4",
    subject="Nobody warns you about this. We're warning you.",
    preheader="Olivia is 4 months old. Sleep is about to change — and that's a good sign.",
    hero_age="Month 4",
    hero_name="Olivia · 17 weeks old",
    opening="Olivia is 4 months old. Month 4 is one of the most developmentally active stretches of the first year — and the one that catches most parents off guard. Here's what to know.",
    context="Four months is when development accelerates. Sleep often gets harder before it gets easier. Both are normal.",
    theme="😴 This month: the sleep change nobody warns you about, the visit to bring your questions to, and what her eyes are telling you.",
    priority_card=window_card(
        "closing", "", "The 4-month sleep regression — what it is and what to do",
        "This is the one nobody warns you about until you're in it.",
        "Around 15–18 weeks, the brain permanently restructures how it sleeps. Sleep cycles lengthen to match adult patterns. This is not a phase — it's a permanent change. The adjustment period, when she learns to connect cycles independently, takes 2–6 weeks.",
        [
            "If she suddenly starts waking every 45 minutes after sleeping well — this is it. Not illness, not hunger, not teething.",
            "Watch your sleep associations. If you nurse or rock to full sleep at every wake, you'll need to do it each time she rouses. Consider putting down drowsy but awake.",
            "You can start formal sleep training after 4 months. Most pediatric sleep specialists set this as the earliest window. Not required — but it's open.",
        ],
        "4-month sleep regression — full guide", DASHBOARD,
    ),
    dyk=dyk_card("Babies who are put down <strong>drowsy but awake</strong> from early on learn to fall asleep independently — which means they also learn to <em>re</em>-fall asleep independently between sleep cycles. That's the whole secret to longer stretches."),
    supporting_cards=[
        window_card(
            "closing", "", "4-month well child visit",
            "Bring your sleep questions. The timing is not a coincidence.",
            "The 4-month visit covers head control, rolling readiness, and iron supplementation for breastfed babies. Vaccines: DTaP (dose 2), Hib (dose 2), PCV (dose 2), rotavirus (dose 2), polio (dose 2).",
            [
                "Ask specifically about iron supplementation if you're breastfeeding — it's easy to miss.",
                "Bring your sleep regression questions. Your pediatrician has seen this a thousand times.",
                "Ask what solid food readiness signs to watch for — you'll be looking for them next month.",
            ],
            "What to ask at the 4-month visit", DASHBOARD,
        ),
        window_card(
            "closing", "", "Visual tracking — smooth follow across midline",
            "When she follows a moving toy with her eyes, something significant is happening.",
            "Tracking a moving object smoothly — rather than in jerky, uncoordinated movements — is an early sign that the visual and motor systems are integrating correctly. Crossing the midline is a milestone in itself.",
            [
                "Slowly move a high-contrast toy from one side to the other, about 12 inches from her face.",
                "Do this when she's alert and not tired — you want her best attention.",
                "Her eyes should follow smoothly, both together, all the way across. Jerky or one-eye-only tracking is worth flagging.",
            ],
            "Visual development milestones", DASHBOARD,
        ),
    ],
    closing_text="Month 4 is a lot. If sleep just got worse — that's the regression and it means her brain is doing exactly what it should. Hang in there. Back next month. — Jack",
)
with open(f"{OUT}/month4-redesign.html", "w") as f:
    f.write(p4)
print("Written: month4-redesign.html")

# ── MONTH 5 ──────────────────────────────────────────────────────────────────
p5 = page(
    title="Month 5",
    subject="She's eyeing your food. Here's what to watch for.",
    preheader="Olivia is 5 months old. Solids are one month away — if the signs are right.",
    hero_age="Month 5",
    hero_name="Olivia · 22 weeks old",
    opening="Olivia is 5 months old. She's not a newborn anymore — she's an active, curious baby who wants to explore everything in reach. Here's what's worth your attention this month.",
    context="Five months is full of firsts. Grabbing, batting, reaching — and starting to eye what you're eating.",
    theme="🥄 This month: watch for solids readiness, check in on iron, and understand what you're building every day.",
    priority_card=window_card(
        "closing", "", "Watch for solid food readiness signs",
        "Don't rush it — and don't wait too long. Here's how to know when she's ready.",
        "Starting solids is about developmental readiness, not a calendar date. Most babies are ready around 6 months. Starting too early (before 4 months) is linked to digestive issues. Starting too late (after 7 months) can affect acceptance of texture and iron intake.",
        [
            "Signs she's ready: sitting with minimal support, good head control, and reaching for your food when you eat.",
            "Watch for the loss of the tongue thrust reflex — when she stops pushing objects out of her mouth with her tongue automatically.",
            "If she's grabbing for your fork and can hold her head steady: she's likely ready. Book the 6-month visit and start the conversation.",
        ],
        "Starting solids — full readiness guide", DASHBOARD,
    ),
    dyk=dyk_card("<strong>Readiness is more reliable than age.</strong> A 5-month-old with all the signs is more ready than a 6-month-old without them. Watch her behavior at mealtimes — it tells you more than the calendar."),
    supporting_cards=[
        window_card(
            "closing", "", "Iron supplementation for breastfed babies",
            "Breast milk is near-perfect nutrition — except for this one thing.",
            "Most babies are born with iron stores that last 4–6 months. After that, breast milk alone isn't enough. Iron deficiency in infancy affects brain development and is largely preventable.",
            [
                "At the 4-month visit (or now if you missed it): ask your pediatrician about liquid iron drops. The AAP recommends 1 mg/kg/day for exclusively breastfed infants.",
                "Continue drops until she's regularly eating iron-rich foods: pureed meats, iron-fortified cereals, tofu, beans.",
                "Formula-fed babies get iron from formula — no supplement needed unless your pediatrician recommends it.",
            ],
            "Iron supplementation — full guide", DASHBOARD,
        ),
        window_card(
            "open", "open", "Primary attachment — what you're building right now",
            "Everything you're doing right now is building the foundation she'll stand on for the rest of her life.",
            "Secure attachment in the first 6 months predicts better emotional regulation, stronger relationships, and higher academic achievement years later. It's built through consistency, not perfection.",
            [
                "Respond to cries consistently and promptly. Research is unambiguous: you cannot spoil an infant.",
                "Be present during waking hours — face-to-face time, physical closeness, eye contact.",
                "Regulate yourself. A calm parent creates a calm baby. The nervous system is contagious.",
            ],
            "Attachment theory — what the research says", DASHBOARD,
            is_closing=False,
        ),
    ],
    closing_text="Five months goes fast. She's a different baby than she was four weeks ago — and she'll be different again in four more. Enjoy this stretch. We'll be back. — Jack",
)
with open(f"{OUT}/month5-redesign.html", "w") as f:
    f.write(p5)
print("Written: month5-redesign.html")

# Fix month1 links
import re
m1_path = f"{OUT}/month1-redesign.html"
with open(m1_path) as f:
    html = f.read()
html = html.replace('href="https://postpartum.net/get-help"', 'href="https://postpartum.net/get-help"')  # already correct if set
# Update the dashboard links and PPD link
html = html.replace('href="#">See full checklist in Scout →', f'href="{DASHBOARD}">See full checklist in Scout →')
html = html.replace('href="#">See full tummy time guide →', f'href="{DASHBOARD}">See full tummy time guide →')
html = html.replace('href="#">What to do if you screen positive →', 'href="https://postpartum.net/get-help">What to do if you screen positive →')
html = html.replace('href="{DASHBOARD}">Open Scout dashboard →', f'href="{DASHBOARD}">Open Scout dashboard →')
# Add nav to month1
nav_parts = []
for l, h in NAV:
    cls = ' class="active"' if l == "Month 1" else ""
    nav_parts.append(f'<a href="{h}"{cls}>{l}</a>')
nav_html = ''.join(nav_parts)
if 'nav-bar' not in html:
    html = html.replace('<div class="preview-note">', f'<div class="nav-bar">{nav_html}</div>\n  <div class="preview-note">', 1)
with open(m1_path, "w") as f:
    f.write(html)
print("Updated: month1-redesign.html (links + nav)")

print("\nAll done.")
