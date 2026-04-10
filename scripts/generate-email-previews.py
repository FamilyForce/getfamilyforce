#!/usr/bin/env python3
"""
generate-email-previews.py  (v3 — matches email-digest.ts v3 format)
=====================================================================
Queries Supabase for active milestone windows at each age, applies
selectAboveFold (cap 3), and renders the full email HTML for all 37
digest emails (pre-birth + months 1–36) using the new redesigned format.

Output: mockups/email-previews.html
"""

import urllib.request, json, math, re, os

SUPABASE_URL  = "https://ewjqbafaxeasyvknxmof.supabase.co"
ANON_KEY      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDUyMDMsImV4cCI6MjA4ODYyMTIwM30.5_NCJP7r5BZSFXcA_WMBiK13vs5Q2bLVdcOZkzyvsWQ"
H             = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
REST          = f"{SUPABASE_URL}/rest/v1/milestone_windows"
CHILD_NAME    = "Olivia"
DASHBOARD_URL = "https://getfamilyforce.com/scout-dashboard"
SITE_URL      = "https://getfamilyforce.com"
MAX_WINDOWS   = 3   # matches email-digest.ts v3 cap

# #3 — Editorial featured-window override (mirrors MONTH_FEATURED_SLUGS in email-digest.ts)
# Months 10, 27, 28, 29, 34 omitted — DB timing issues (see content backlog)
MONTH_FEATURED_SLUGS = {
    1:  'screening-visit-1month',
    2:  'screening-visit-2months',
    3:  'motor-head-control',
    4:  'cognitive-sleep-regression-4month',
    5:  'nutrition-solids-readiness',
    6:  'screening-visit-6months',
    7:  'safety-babyproofing',
    8:  'nutrition-egg-intro',
    9:  'screening-visit-9months',
    10: 'motor-pull-to-stand',
    11: 'motor-cruising',
    12: 'screening-visit-12months',
    13: 'motor-first-steps',
    14: 'social-joint-attention',
    15: 'screening-visit-15months',
    16: 'social-label-big-feelings',
    17: 'social-parallel-play',
    18: 'screening-visit-18months-autism',
    19: 'social-independence-me-do-it',
    20: 'language-question-asking',
    21: 'language-speech-clarity-family',
    22: 'language-vocab-200-words',
    23: 'motor-jumping-both-feet',
    24: 'screening-visit-24months-autism',
    25: 'language-3-word-sentences',
    26: 'language-names-colors',
    27: 'motor-catching-ball',
    29: 'language-counts-objects-5',
    30: 'screening-visit-30months',
    31: 'social-peer-friendships',
    32: 'language-knows-name-age',
    33: 'social-imaginary-friends',
    34: 'motor-tricycle-balance-bike',
    35: 'safety-forward-facing-transition',
    36: 'screening-visit-36months',
}

C = {
    "bg":          "#F7F5FF",
    "surface":     "#FFFFFF",
    "border":      "#E5E2EC",
    "text":        "#1D1D1F",
    "textMid":     "#5C5960",
    "textDim":     "#8A879A",
    "terra":       "#6E4ED6",
    "terraDark":   "#5B3CC4",
    "terraTint":   "#F0EBFF",
    "indigoDeep":  "#1E1248",
    "amber":       "#B45309",
    "amberBg":     "#FFFBEB",
    "amberBorder": "#FDE68A",
    "green":       "#16A34A",
    "greenBg":     "#F0FDF4",
}

# ── DB helpers ────────────────────────────────────────────────────────────────
def fetch(qs):
    req = urllib.request.Request(REST + "?" + qs, headers=H)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def get_windows_at_age(age_weeks):
    aw = int(round(age_weeks))
    return fetch(
        f"select=id,slug,title,category,urgency,open_age_weeks,close_age_weeks,priority,"
        f"why_it_matters,what_to_do"
        f"&active=eq.true&window_type=eq.milestone&prenatal=eq.false"
        f"&open_age_weeks=lte.{aw}&close_age_weeks=gte.{aw}&order=priority.asc&limit=100"
    )

def get_prebirth_windows():
    return fetch(
        "select=id,slug,title,category,urgency,open_age_weeks,close_age_weeks,priority,"
        "why_it_matters,what_to_do"
        "&active=eq.true&window_type=eq.milestone&prenatal=eq.true&order=priority.asc&limit=50"
    )

def get_ready_windows(age_weeks):
    aw = int(round(age_weeks))
    return fetch(
        f"select=id,slug,title&active=eq.true&window_type=eq.milestone&prenatal=eq.false"
        f"&open_age_weeks=gt.{aw}&open_age_weeks=lte.{aw+8}&order=open_age_weeks.asc&limit=3"
    )

def select_above_fold(windows, age_weeks, age_months=None):
    closing = sorted([w for w in windows if w["close_age_weeks"] - age_weeks <= 4], key=lambda w: w["priority"])
    opens   = sorted([w for w in windows if w["close_age_weeks"] - age_weeks > 4],  key=lambda w: w["priority"])
    top = (closing + opens)[:MAX_WINDOWS]
    # Apply editorial featured-window override (#3)
    if age_months is not None:
        featured_slug = MONTH_FEATURED_SLUGS.get(age_months)
        if featured_slug:
            idx = next((i for i, w in enumerate(top) if w["slug"] == featured_slug), -1)
            if idx > 0:
                top.insert(0, top.pop(idx))
    return top

# ── Rendering helpers (mirror email-digest.ts v3) ─────────────────────────────
def render_bullets(text):
    if not text: return ""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    out = []
    for line in lines:
        clean = re.sub(r'^(\*|-|•|\d+\.)\s*', '', line).strip()
        bolded = re.sub(r'\*\*([^*]+)\*\*', rf'<strong style="color:{C["text"]}">\1</strong>', clean)
        out.append(
            f'<p style="font-family:Arial,sans-serif;font-size:14px;color:{C["textMid"]};'
            f'margin:0 0 9px;padding-left:16px;line-height:1.65;position:relative">'
            f'<span style="position:absolute;left:0;color:{C["terra"]}">·</span>{bolded}</p>'
        )
    return "\n".join(out)

def excerpt(text, n=2):
    if not text: return ""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return " ".join(parts[:n]).strip()

def window_card(w, age_weeks):
    is_closing   = (w["close_age_weeks"] - age_weeks) <= 4
    weeks_left   = max(0, round(w["close_age_weeks"] - age_weeks))
    badge_text   = "Last chance" if weeks_left == 0 else f"Closing in {weeks_left}w" if is_closing else "This month"
    badge_color  = C["amber"] if is_closing else C["terraDark"]
    badge_bg     = C["amberBg"] if is_closing else C["terraTint"]
    exc          = excerpt(w.get("why_it_matters",""))
    bullets_html = render_bullets(w.get("what_to_do",""))
    bullets_sec  = f"""
              <tr>
                <td style="padding-bottom:4px;border-top:1px solid {C['border']};padding-top:14px">
                  <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:{C['terra']};text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">What to do</p>
                  {bullets_html}
                </td>
              </tr>""" if bullets_html else ""
    return f"""
  <tr>
    <td style="padding-bottom:14px">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:{C['surface']};border:1px solid {C['border']};border-radius:14px;overflow:hidden">
        <tr><td style="padding:20px 22px 18px">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:8px">
              <span style="display:inline-block;background:{badge_bg};color:{badge_color};
                font-family:Arial,sans-serif;font-size:11px;font-weight:700;
                padding:2px 10px;border-radius:100px;letter-spacing:.05em">{badge_text}</span>
            </td></tr>
            <tr><td style="padding-bottom:10px">
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:19px;
                color:{C['text']};margin:0;line-height:1.3;letter-spacing:-.01em">{w['title']}</p>
            </td></tr>
            <tr><td style="padding-bottom:14px">
              <p style="font-family:Arial,sans-serif;font-size:14px;color:{C['textMid']};
                margin:0;line-height:1.7">{exc}</p>
            </td></tr>
            {bullets_sec}
            <tr><td style="padding-top:10px;border-top:1px solid {C['border']}">
              <a href="{DASHBOARD_URL}" style="font-family:Arial,sans-serif;font-size:13px;
                color:{C['terra']};text-decoration:none;font-weight:600">Track this in your dashboard →</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>"""

def dyk_card(fact):
    html = re.sub(r'\*\*([^*]+)\*\*', rf'<strong style="color:{C["text"]}">\1</strong>', fact)
    return f"""
  <tr>
    <td style="padding-bottom:14px">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:{C['terraTint']};border-radius:12px;border-left:4px solid {C['terra']}">
        <tr><td style="padding:16px 18px">
          <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:{C['terra']};
            text-transform:uppercase;letter-spacing:.1em;margin:0 0 7px">Did you know?</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:{C['textMid']};
            margin:0;line-height:1.7">{html}</p>
        </td></tr>
      </table>
    </td>
  </tr>"""

FAREWELL_HTML = f"""
  <tr>
    <td style="padding-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px 28px;text-align:center">
          <p style="font-family:Arial,sans-serif;font-size:36px;margin:0 0 14px">🎓</p>
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;color:#fff;margin:0 0 16px;line-height:1.3">Three years done.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 14px;line-height:1.75">
            Scout is built for the first three years — the most intensive developmental period of any human life. You've been through all of it: every checkup, every window, every month.
          </p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0;line-height:1.75">
            From here, well child visits go annual — ages 4, 5, 6, 7, and 8. Keep reading every day. Keep talking. Keep being curious about who {CHILD_NAME} is becoming. The habits you've built in these three years are the foundation for everything that comes next.
          </p>
        </td></tr>
      </table>
    </td>
  </tr>"""

PREBIRTH_ON_THE_DAY = f"""
  <tr>
    <td style="padding-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px">
        <tr><td style="padding:20px 22px">
          <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16A34A;margin:0 0 4px">On the day</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#374151;margin:0 0 16px;line-height:1.6">Four things worth deciding before you go in. You won't want to Google them in the delivery room.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Skin-to-skin — ask for it immediately</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0 0 12px;line-height:1.6">Even for C-sections. Regulates temperature, heart rate, and blood sugar. Promotes breastfeeding and bonding. Tell your OB before you go in so it's already the plan.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Delayed cord clamping</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0 0 12px;line-height:1.6">Wait at least 60 seconds before clamping. Transfers roughly 80ml of extra blood and iron. Ask explicitly even if it's standard practice at your hospital.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">The golden hour</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0 0 12px;line-height:1.6">The first hour uninterrupted with your baby. Weighing, measuring, and vitamin K can usually wait. Ask the room to hold non-urgent procedures until after you've had that first hour together.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#111827;margin:0 0 2px">Rooming-in</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:#4B5563;margin:0;line-height:1.6">Keep {CHILD_NAME} in the room with you rather than the nursery. Better for feeding cues, bonding, and breastfeeding. Hospitals often default to the nursery — you have to ask to keep her close.</p>
        </td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding-bottom:32px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:12px;overflow:hidden">
        <tr><td style="padding:24px 28px">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#fff;margin:0 0 10px;line-height:1.3">When {CHILD_NAME} is born, Scout tracks 200+ developmental windows through the first three years. Get ready.</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 20px;line-height:1.7">Confirm the birth in Scout and your first full digest fires straight away.</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="background:#fff;border-radius:8px">
              <a href="{DASHBOARD_URL}" style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:{C['indigoDeep']};text-decoration:none;display:block;padding:12px 24px">Confirm birth in Scout →</a>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </td>
  </tr>"""

DEMO_COMPLETED = f"""
  <tr>
    <td style="padding-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px">
        <tr><td style="padding:18px 20px">
          <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#16A34A;margin:0 0 10px">What you did this month</p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0 0 6px;padding-left:18px;position:relative">
            <span style="position:absolute;left:0;color:#16A34A">✓</span>Example window — marked done
          </p>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#1D1D1F;margin:0;padding-left:18px;position:relative">
            <span style="position:absolute;left:0;color:#16A34A">✓</span>Another window — completed this month
          </p>
        </td></tr>
      </table>
    </td>
  </tr>"""

def coming_next_section(windows):
    if not windows: return ""
    items = "".join(
        f'<p style="font-family:Arial,sans-serif;font-size:14px;color:{C["textMid"]};'
        f'margin:0 0 8px;padding-left:16px;position:relative;line-height:1.6">'
        f'<span style="position:absolute;left:0;color:{C["terraDark"]}">›</span>{w["title"]}</p>'
        for w in windows[:3]
    )
    return f"""
  <tr>
    <td style="padding-bottom:24px">
      <table width="100%" cellpadding="0" cellspacing="0"
             style="background:#F9F8FF;border:1px solid {C['border']};border-radius:12px">
        <tr><td style="padding:16px 18px">
          <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;
            color:{C['terraDark']};text-transform:uppercase;letter-spacing:.1em;
            margin:0 0 12px">A few things coming next month</p>
          {items}
        </td></tr>
      </table>
    </td>
  </tr>"""

# ── Per-month editorial content (mirrors MONTH_CONTENT in email-digest.ts) ───
MONTH_CONTENT = {
    0:  {"theme":"📋 This month: three things to sort before the due date.",
         "dyk":"In the first hour after birth, your baby is in what neuroscientists call the **quiet alert state** — the most receptive window for bonding. Skin-to-skin in that first hour shapes the attachment system for years.",
         "opening":"The due date is close. Most of the preparation below is far easier to do now than with a newborn in the room.",
         "context":"A few things that take an hour now and save a lot of stress later.",
         "closing":"You're close now. Everything you do in the next few weeks makes the first days easier. — Jack"},
    1:  {"theme":"👶 This month: the 1-month checkup, tummy time, and something worth screening for.",
         "dyk":"In the first month of life, a baby's brain creates more than **1 million new neural connections per second** — a rate that will never be matched again. Every time you talk to her, hold her, and respond to her cries, you're building the architecture of her brain.",
         "opening":f"{CHILD_NAME} is 1 month old. The first month is the steepest learning curve of any parent's life. Here's what actually matters right now.",
         "context":"Survival mode is real. These three things are worth doing anyway.",
         "closing":"Month 1 is hard. You're doing it. Month 2 gets better. — Jack"},
    2:  {"theme":"😊 This month: the 2-month checkup, the first real smile, and the habit that builds everything.",
         "dyk":"The social smile — the first **intentional smile in response to your face** — activates the same brain regions as adult social bonding. It's not reflex. It's the beginning of a relationship.",
         "opening":f"{CHILD_NAME} is 2 months old. Two months in. The fog is still real, but something is shifting — she's starting to respond to you.",
         "context":"The fog is lifting. And she's starting to know your face.",
         "closing":"The social smile changes things. You'll feel it when it happens. — Jack"},
    3:  {"theme":"🧠 This month: one milestone closing, a new one emerging, and the bedtime habit to lock in now.",
         "dyk":"A consistent 3–4 step bedtime routine can produce **measurable sleep improvements within one week** — even in babies as young as 3 months. Same steps, same order, every night.",
         "opening":f"{CHILD_NAME} is 3 months old. Three months in is when most parents feel like they've finally found their footing.",
         "context":"You made it through the fourth trimester. The development is accelerating.",
         "closing":"Month 3 is when it starts feeling real. You're watching her become someone. — Jack"},
    4:  {"theme":"😴 This month: nobody warns you about the 4-month sleep regression. We're warning you.",
         "dyk":"The 4-month sleep regression isn't random — it's caused by the brain **permanently reorganising its sleep architecture** from newborn cycles to adult cycles. It doesn't go back. But it does get better.",
         "opening":f"{CHILD_NAME} is 4 months old. The sleep regression may have arrived — or it's coming. Here's what it is and what to do.",
         "context":"The hardest sleep phase of the first year. Understanding it helps.",
         "closing":"The regression passes. Your response to it shapes the next 6 months of sleep. — Jack"},
    5:  {"theme":"🥄 This month: solids are almost here, iron matters now, and attachment is building.",
         "dyk":"**Iron deficiency is the most common nutritional deficiency in infants worldwide** — and breastfed babies are most at risk after 4 months. Iron drops are a simple fix while solid foods are being introduced.",
         "opening":f"{CHILD_NAME} is 5 months old. Solids are right around the corner — and there's a nutrition window closing this month that's worth knowing about.",
         "context":"The solids window is opening. The iron window is closing.",
         "closing":"The attachment you've been building all along — it's real. It shows up at 12 months, and again at 3 years. — Jack"},
    6:  {"theme":"🥄 This month: the 6-month checkup, first solids, and a motor milestone worth celebrating.",
         "dyk":"When babies sit **independently**, it frees both hands for exploration — and exploration is how the brain builds. Independent sitting isn't just a motor milestone. It's what unlocks the next 6 months of cognitive development.",
         "opening":f"{CHILD_NAME} is 6 months old. Solids are starting, the checkup is due, and she's sitting up on her own.",
         "context":"Six months. Solids, sitting, and a whole new level of curiosity.",
         "closing":"Halfway through the first year. You've done more right than you know. — Jack"},
    7:  {"theme":"🔒 This month: babyproof before she moves, name response, and open the dairy window.",
         "dyk":"Babies who hear their **own name used consistently and positively** develop name response faster and show stronger early social attention. Use her name — not just nicknames — especially when you want her focus.",
         "opening":f"{CHILD_NAME} is 7 months old. Mobility is coming — and with it, a world that suddenly needs a closer look for hazards.",
         "context":"Once she's mobile, you'll wish you'd done this last week.",
         "closing":"Seven months is when parents start babyproofing in earnest. This month, not next month. — Jack"},
    8:  {"theme":"🥚 This month: allergen introductions, babbling, and tree nuts.",
         "dyk":"Babies exposed to **varied sounds and babble-back interactions** at 8–10 months have measurably larger productive vocabularies at 18 months. The babbling stage is when the foundation is literally being laid — neuron by neuron.",
         "opening":f"{CHILD_NAME} is 8 months old. Object permanence is kicking in, allergen introductions are the priority, and babbling is starting.",
         "context":"Eight months: the allergen introduction window is open. Don't miss it.",
         "closing":"Eight months is when it all starts accelerating. Stay with it. — Jack"},
    9:  {"theme":"🩺 This month: the first formal developmental screen, the peanut window, and sesame.",
         "dyk":"The **LEAP study** showed early peanut introduction (4–11 months) reduces peanut allergy risk by up to 80% in high-risk infants. This is one of the most significant findings in pediatric nutrition in decades.",
         "opening":f"{CHILD_NAME} is 9 months old. The 9-month well child visit is the first to use a standardised developmental screening tool.",
         "context":"Nine months: the first formal developmental screen. Come prepared.",
         "closing":"Nine months is one of my favourites. She's communicating deliberately, moving on her own. — Jack"},
    10: {"theme":"🧗 This month: pulling up to stand, object permanence locking in, and the safety checklist that changes when they're upright.",
         "dyk":"Peek-a-boo teaches three things simultaneously: **object permanence** (you disappear and still exist), **trust** (you always come back), and **conversational turn-taking**. It costs nothing.",
         "opening":f"{CHILD_NAME} is 10 months old. She's pulling up to stand. The whole world just got bigger — and more dangerous. Here's what to focus on.",
         "context":"Ten months: upright and opinionated. The walking window is getting closer.",
         "closing":"Two months to the first birthday. She's a communicator now — not with words yet, but with everything else. — Jack"},
    11: {"theme":"🚶 This month: cruising along furniture, first words getting specific, and the first dental visit.",
         "dyk":"Babies say 'mama' and 'dada' as sounds around 9 months — but using them **specifically** (mama when looking at mum, dada when looking at dad) typically locks in by 12 months. That specificity is the milestone.",
         "opening":f"{CHILD_NAME} is 11 months old. She's cruising the furniture — the last step before walking.",
         "context":"Eleven months: the walk is coming. You can see it in her eyes every time she lets go.",
         "closing":"One month to the first birthday. It goes fast — and then it really goes fast. — Jack"},
    12: {"theme":"🎂 This month: the 12-month visit, reading aloud every day, and the switch to whole milk.",
         "dyk":"Children read to every day from birth enter kindergarten with **a vocabulary equivalent to 1,000 additional hours of classroom instruction.** Any book. Every day.",
         "opening":f"{CHILD_NAME} is 12 months old. One year. You did it. Here's what the 12-month visit covers and what to focus on now.",
         "context":"The first year is done. One of the most remarkable developmental years of any human life.",
         "closing":"Happy first birthday. Year two is different. Faster in some ways, slower in others. We'll keep you on track. — Jack"},
    13: {"theme":"👣 This month: first steps, first words, and leaving the bottle behind.",
         "dyk":"Baby sign language doesn't delay speech — it **accelerates** it. Babies who learn signs like 'more,' 'all done,' and 'milk' reduce frustration and build word-concept connections faster.",
         "opening":f"{CHILD_NAME} is 13 months old. Walking is happening or on the way. Words are starting to land. The toddler years are beginning.",
         "context":"Thirteen months: a walker, a talker, and an opinion-holder — all at once.",
         "closing":"The second year is a completely different experience. The language explosion is coming. — Jack"},
    14: {"theme":"👉 This month: pointing and shared attention, walking as locomotion, and body parts.",
         "dyk":"Pointing to share interest — then looking back to check your reaction — is more important than first words as an early communication milestone. It's called **declarative pointing** and it's a key M-CHAT marker.",
         "opening":f"{CHILD_NAME} is 14 months old. She's pointing — and looking back at you after she points. That's joint attention.",
         "context":"Fourteen months: a walker who points. That's a communicator in the making.",
         "closing":"When she points and looks back at you — respond every time. That's the lesson she's practising. — Jack"},
    15: {"theme":"🩺 This month: the 15-month checkup, the 10-word milestone, and pretend play beginning.",
         "dyk":"Once a child hits **50 words**, vocabulary growth often becomes exponential — jumping from 50 to 200+ words in just a few months. Every word added now accelerates what comes next.",
         "opening":f"{CHILD_NAME} is 15 months old. The 15-month visit is the first to formally check word count and walking quality.",
         "context":"Fifteen months: the first real language checkpoint. Start counting words.",
         "closing":"The 15-month visit is worth taking seriously. Come with your word count and your questions. — Jack"},
    16: {"theme":"😤 This month: naming big feelings, following simple instructions, and stairs.",
         "dyk":"Children whose parents **label their emotions** during early childhood show measurably better emotional regulation, fewer behavioural problems, and stronger peer relationships at school age.",
         "opening":f"{CHILD_NAME} is 16 months old. The big feelings are arriving — frustration, excitement, fury, joy.",
         "context":"Sixteen months: enormous emotions, a tiny prefrontal cortex. That mismatch is the whole toddler experience.",
         "closing":"Labelling feelings feels awkward at first. The payoff is a child who can eventually name their own emotions. — Jack"},
    17: {"theme":"🧸 This month: parallel play, the spoon, and why goodbye has to be out loud.",
         "dyk":"Children allowed to **self-feed with a spoon from 12–15 months** develop fine motor skills faster and have a stronger relationship with varied textures by age 2. The mess is the lesson.",
         "opening":f"{CHILD_NAME} is 17 months old. Separation anxiety may be peaking — the crying at drop-off, the reaching when you try to leave.",
         "context":"Seventeen months: she wants you near. That's not clingy — that's securely attached.",
         "closing":"Stay consistent. Stay warm. Keep the goodbye brief. — Jack"},
    18: {"theme":"🩺 This month: the M-CHAT screen, two-word language, and tantrums at their peak.",
         "dyk":"Two-word combinations — 'more milk,' 'daddy go' — represent a **qualitative leap** in language, not just more words. Once two-word phrases start, three-word sentences usually follow within months.",
         "opening":f"{CHILD_NAME} is 18 months old. The 18-month well child visit includes the first formal autism screening.",
         "context":"Eighteen months: the first autism screen, first two-word combinations, and probably the first spectacular tantrum.",
         "closing":"The 18-month visit is one of the most important ones. Come prepared. Answer the M-CHAT honestly. — Jack"},
    19: {"theme":"🙌 This month: the independence phase, the 50-word gate, and the self-regulation foundation.",
         "dyk":"At around **50 words**, vocabulary growth often goes exponential — some children add 5–10 new words per day. Every word you name is a seed.",
         "opening":f"{CHILD_NAME} is 19 months old. The fierce independence has arrived — 'me do it' is a phrase you're hearing a lot.",
         "context":"Nineteen months: the will to do it herself is the whole point. Support it.",
         "closing":"'Me do it' is the sound of a child becoming someone. Let her. — Jack"},
    20: {"theme":"❓ This month: the why-question explosion, sorting by shape and color, and naming the body.",
         "dyk":"Research found that children in the question-asking phase ask up to **100 questions per hour** — and the quality of answers significantly predicts scientific reasoning ability at age 10.",
         "opening":f"{CHILD_NAME} is 20 months old. The questions are starting — 'What's that?' over and over. Answer every single one.",
         "context":"Twenty months: questions are the learning mechanism. The repetition is the point.",
         "closing":"Answer the questions. All of them. Every answered question is a word, a concept, a connection. — Jack"},
    21: {"theme":"🗣️ This month: speech clarity milestone, empathy beginning, and knowing what things are for.",
         "dyk":"Toddlers who see adults **modelling empathic behaviour** — comforting others, asking 'are you okay?' — develop empathy faster and show stronger prosocial behaviour at ages 4 and 5.",
         "opening":f"{CHILD_NAME} is 21 months old. Her speech is getting clearer — and she's starting to notice when other people feel something.",
         "context":"Twenty-one months: words getting clearer, and a little person who notices when you're sad.",
         "closing":"When she notices you're sad — that's the beginning of everything that makes us human. — Jack"},
    22: {"theme":"📚 This month: the 200-word target, 2-step commands, and the pronoun shift.",
         "dyk":"Following a **2-step command** requires holding two pieces of information in working memory and executing them in order. The same mental process underlies planning, problem-solving, and academic learning.",
         "opening":f"{CHILD_NAME} is 22 months old. Two months from the second birthday — and the 24-month language targets are in sight.",
         "context":"Twenty-two months: two months to the 24-month checkup. Language is the main event.",
         "closing":"Two months to the second birthday. Keep reading, keep narrating, keep expanding. — Jack"},
    23: {"theme":"🦘 This month: jumping with both feet, pretend play getting complex, and first size concepts.",
         "dyk":"Complex pretend play uses the same cognitive machinery as **narrative comprehension and writing** later in school. Children who engage in rich pretend play at 2–3 years show stronger literacy skills at age 5.",
         "opening":f"{CHILD_NAME} is 23 months old. One month from the second birthday. Motor, language, and cognitive development are all accelerating.",
         "context":"Twenty-three months: the last month before the second birthday checkup.",
         "closing":"One month to the second birthday. She's come so far — and the pace doesn't slow down. — Jack"},
    24: {"theme":"🩺 This month: the 24-month checkup + second autism screen, the milk switch, and same vs. different.",
         "dyk":"The AAP recommends switching to **2% milk at age 2** because after the second birthday, children no longer need the high fat content of whole milk for brain development.",
         "opening":f"{CHILD_NAME} is 24 months old. Two years. The 24-month checkup includes the second formal autism screening.",
         "context":"Two years. One of the most comprehensive developmental checkpoints of the first two years.",
         "closing":"Happy second birthday. Two years of showing up. Year three is different again. — Jack"},
    25: {"theme":"🗣️ This month: 3-word sentences, memory taking shape, and cooperative play beginning.",
         "dyk":"Asking **'what happened?'** after an outing exercises memory, narrative structure, vocabulary, and sentence construction simultaneously — one of the most powerful language prompts available.",
         "opening":f"{CHILD_NAME} is 25 months old. Three-word sentences are arriving — and with them, the beginning of real grammar.",
         "context":"Twenty-five months: telegraphic speech is giving way to early grammar.",
         "closing":"Three-word sentences are the beginning of the language explosion. The more you respond, the faster it comes. — Jack"},
    26: {"theme":"❓ This month: the why-question phase, colors she can name, and counting in sequence.",
         "dyk":"Color naming is one of the **trickier early language concepts** — colors are properties of things, not things themselves. That abstraction is why color vocabulary arrives later than object vocabulary.",
         "opening":f"{CHILD_NAME} is 26 months old. The 'why' questions are arriving. Here's why it matters and how to handle it.",
         "context":"Twenty-six months: the world is suddenly explicable. She wants to know everything about why.",
         "closing":"Answer the 'why' questions. Every single one. That's the whole job this month. — Jack"},
    27: {"theme":"⚾ This month: catching a ball, potty readiness still in the picture, and speech clarity for strangers.",
         "dyk":"Starting potty training **before a child shows readiness signs** leads to a longer, more frustrating process. Waiting for the signs is the single most reliable predictor of a faster, lower-conflict experience.",
         "opening":f"{CHILD_NAME} is 27 months old. Parents often ask about potty training now. The answer isn't about age — it's about readiness signs.",
         "context":"Twenty-seven months: the signs matter more than the calendar.",
         "closing":"Potty training: wait for the signs. When they're there, go fast and don't look back. — Jack"},
    28: {"theme":"😄 This month: first jokes, understanding time, and a specific friend she wants to see.",
         "dyk":"A **visual daily schedule** — pictures of the sequence of events — reduces toddler anxiety and improves co-operation dramatically. Predictability is safety for toddlers.",
         "opening":f"{CHILD_NAME} is 28 months old. She said something wrong on purpose, waited, and laughed. That's the first evidence of social intelligence applied to humour.",
         "context":"Twenty-eight months: she's figured out she can surprise you. That's a cognitive leap.",
         "closing":"When she tells a joke, laugh. Every single time. You're reinforcing social intelligence that carries her through life. — Jack"},
    29: {"theme":"🔢 This month: counting objects with real meaning, preschool readiness on the horizon, and balance building.",
         "dyk":"True counting — where each object gets exactly one number — is called **one-to-one correspondence** and is fundamentally different from reciting number sequences. It's an early building block of mathematical reasoning.",
         "opening":f"{CHILD_NAME} is 29 months old. Many families are thinking about preschool now. The question isn't about colours and counting.",
         "context":"Twenty-nine months: preschool readiness is about separation, communication, and self-help — not academics.",
         "closing":"Preschool readiness is built over months of practice at home. Separation, communication, self-help. — Jack"},
    30: {"theme":"🩺 This month: the 30-month checkup, the crib-to-bed transition, and the potty finish line.",
         "dyk":"Moving from crib to bed **too early** is one of the most common causes of sleep regression in the second and third years. Keep the crib until age 3 unless she's climbing out.",
         "opening":f"{CHILD_NAME} is 30 months old. The 30-month visit was added to the AAP schedule specifically because the 24–36 month gap was too long.",
         "context":"Thirty months: the halfway point between the 2-year and 3-year checkups — and one of the most useful.",
         "closing":"Two and a half. The language has come so far. Come prepared to the 30-month visit. — Jack"},
    31: {"theme":"👗 This month: real peer friendships, understanding what numbers mean, and getting dressed solo.",
         "dyk":"Children who understand **cardinality** — that '3' means exactly 3 things — at age 3 show consistently stronger mathematics outcomes in primary school. The 'give me 2 crackers' game is one of the most powerful math activities available.",
         "opening":f"{CHILD_NAME} is 31 months old. Friendships are becoming specific, real, and important to her.",
         "context":"Thirty-one months: independence is expanding on every front — social, cognitive, and physical.",
         "closing":"The friendships she's making now are the first ones she'll remember. Take them seriously. — Jack"},
    32: {"theme":"🦷 This month: name and age, hopping on one foot, and the tooth brushing handoff.",
         "dyk":"Hopping on one foot is a precursor to **skipping** — which is itself a precursor to the lateral co-ordination needed for sports, dance, and smooth stair negotiation.",
         "opening":f"{CHILD_NAME} is 32 months old. Knowing her full name and age is both a developmental milestone and a practical safety skill.",
         "context":"Thirty-two months: self-concept, physical confidence, and daily health habits.",
         "closing":"Teach her her full name and your name this month. It takes one week of practice. It could matter a lot. — Jack"},
    33: {"theme":"🌟 This month: imaginary friends, storytelling, and following complex instructions.",
         "dyk":"Children who regularly **tell stories** about their own experiences show stronger reading comprehension and writing ability at age 6 and 7. The dinner table is the classroom.",
         "opening":f"{CHILD_NAME} is 33 months old. She may have an imaginary friend — or be on the verge of inventing one. Research shows this is a very good sign.",
         "context":"Thirty-three months: imagination is at full power. Harness it.",
         "closing":"The imaginary friend is practising social skills. Let her. — Jack"},
    34: {"theme":"🚲 This month: first wheels, gratitude at the table, and the fine motor milestone building toward writing.",
         "dyk":"Families with regular **gratitude practices at mealtimes** — even one sentence each — show measurably higher wellbeing and stronger relationship quality in children by age 10.",
         "opening":f"{CHILD_NAME} is 34 months old. She's drawing with intention now — copying a circle is a standard 3-year motor milestone and a direct precursor to writing letters.",
         "context":"Thirty-four months: fine motor, character, and wheeled independence.",
         "closing":"Draw circles together. Fine motor practice for her and a moment of stillness for you. — Jack"},
    35: {"theme":"🚗 This month: car seat safety update, counting with real meaning, and the forward-facing milestone.",
         "dyk":"The **'give me 3'** game — asking a child to hand you exactly 3 objects — is one of the most reliable ways to test whether she understands what 3 means, versus just reciting '1, 2, 3.'",
         "opening":f"{CHILD_NAME} is 35 months old. One month from the 3-year checkup — and the 3-year milestone set is nearly complete.",
         "context":"Thirty-five months: the 3-year checkup is one month away. Come prepared.",
         "closing":"One month to the third birthday. Come with your observations, your concerns, and your word count. — Jack"},
    36: {"theme":"🎉 This month: the 3-year checkup, full sentences, and the discipline approach that actually works.",
         "dyk":"By age 3, the brain has reached **80% of its adult size** — and the connections built in the first three years are the scaffolding for everything that comes after. Every conversation, every book, every patient repair after a meltdown. All of it counted.",
         "opening":f"{CHILD_NAME} is 3 years old. The 36-month well child visit marks the end of the most intensive developmental surveillance period. From here, visits go annual.",
         "context":"Three years. The intensive developmental surveillance window closes. Annual visits from here.",
         "closing":"Happy third birthday. Three years of showing up. The work you've done is the most important work of her life. — Jack"},
}

def get_mc(age_months):
    return MONTH_CONTENT.get(age_months, {
        "theme": f"📅 Month {age_months} windows",
        "dyk": "Every month of early childhood brings new developmental windows. Scout makes sure you don't miss the ones that matter.",
        "opening": f"{CHILD_NAME} is {age_months} months old. Here's what's worth your attention this month.",
        "context": f"Month {age_months}. Development is always moving.",
        "closing": "Stay curious, stay consistent. We'll keep you on track. — Jack",
    })

# ── Full email renderer ────────────────────────────────────────────────────────
def render_email(age_months, above_fold, get_ready, total_count, is_prebirth=False):
    age_weeks = age_months * 4.33
    mc        = get_mc(0 if is_prebirth else age_months)

    closing_wins = [w for w in above_fold if w["close_age_weeks"] - age_weeks <= 4]
    open_wins    = [w for w in above_fold if w["close_age_weeks"] - age_weeks > 4]

    # Theme stripe
    theme_stripe = f"""
      <tr><td style="padding-bottom:12px">
        <p style="font-family:Arial,sans-serif;font-size:13px;color:{C['textMid']};
          margin:0;line-height:1.65;font-style:italic">{mc['theme']}</p>
      </td></tr>""" if above_fold else ""

    # Window layout (#4: DYK after window 1 when no mix; #6: headers only with mix)
    dyk_html    = dyk_card(mc["dyk"])
    show_headers = bool(closing_wins) and bool(open_wins)

    if show_headers:
        # Mix: header+closing → DYK → header+open
        closing_sec = (
            f'\n      <tr><td style="padding-bottom:4px">'
            f'<p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;'
            f'letter-spacing:.12em;text-transform:uppercase;color:{C["amber"]};margin:0">'
            f'⏱ Closing this month</p></td></tr>\n'
        ) + "".join(window_card(w, age_weeks) for w in closing_wins)
        open_sec = (
            f'\n      <tr><td style="padding:8px 0 4px">'
            f'<p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;'
            f'letter-spacing:.12em;text-transform:uppercase;color:{C["textDim"]};margin:0">'
            f'Also this month</p></td></tr>\n'
        ) + "".join(window_card(w, age_weeks) for w in open_wins)
        windows_layout = closing_sec + dyk_html + open_sec
    else:
        # All same type — DYK after first window
        all_wins  = closing_wins + open_wins
        is_close  = bool(closing_wins)
        first_win = window_card(all_wins[0], age_weeks) if all_wins else ""
        rest_wins = "".join(window_card(w, age_weeks) for w in all_wins[1:])
        windows_layout = first_win + dyk_html + rest_wins

    # Coming next / farewell / pre-birth confirm
    if is_prebirth:
        coming_next = PREBIRTH_ON_THE_DAY
    elif age_months >= 36 and not get_ready:
        coming_next = FAREWELL_HTML
    else:
        coming_next = coming_next_section(get_ready)

    # Demo completions (months 2+ — first month has nothing to complete yet)
    completed_demo = DEMO_COMPLETED if (not is_prebirth and age_months >= 2) else ""

    # Remaining count (subtract 2 demo completions for months 2+)
    remaining = total_count - len(above_fold) - (2 if age_months >= 2 else 0)
    remaining = max(0, remaining)

    # Header label
    if is_prebirth:
        hero_label = "Pre-birth"
        hero_title = f"{CHILD_NAME} arrives in 18 days"
        window_badge = f"{len(above_fold)} prenatal windows"
    elif age_months == 0:
        hero_label = "Newborn"
        hero_title = f"{CHILD_NAME} is here! 🎉"
        window_badge = f"{total_count} open windows"
    else:
        mo = f"{age_months} month{'s' if age_months != 1 else ''}"
        hero_label = mo
        hero_title = f"{CHILD_NAME} at {mo} old"
        window_badge = f"{len(above_fold)} of {total_count} active windows · See all"

    # remaining already computed above; remaining_html:
    remaining_html = (
        f"<p style='font-family:Arial,sans-serif;font-size:14px;color:{C['textMid']};"
        f"margin:0 0 16px;line-height:1.65'>There are "
        f"<strong style='color:{C['text']}'>{remaining} more open windows</strong> "
        f"for {CHILD_NAME} right now — all in the dashboard.</p>"
    ) if remaining > 0 else ""

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>{hero_label} — Scout</title></head>
<body style="margin:0;padding:0;background:{C['bg']}">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{C['bg']}">
<tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-radius:20px;overflow:hidden;border:1px solid {C['border']}">

  <!-- HEADER -->
  <tr><td style="background:{C['indigoDeep']};padding:32px 36px 36px">
    <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.16em;
      text-transform:uppercase;color:rgba(255,255,255,.4);margin:0 0 24px">Scout by FamilyForce</p>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:400;
      color:#fff;margin:0 0 10px;line-height:1.15;letter-spacing:-.02em">{hero_title}</p>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);
      margin:0;line-height:1.6">{window_badge}</p>
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:{C['surface']};padding:32px 36px">
    <table width="100%" cellpadding="0" cellspacing="0">

      <!-- Greeting + opening -->
      <tr><td style="padding-bottom:24px;border-bottom:1px solid {C['border']}">
        <p style="font-family:Arial,sans-serif;font-size:15px;color:{C['text']};margin:0 0 14px;font-weight:600">Hi there,</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:{C['textMid']};margin:0 0 10px;line-height:1.75">{mc['opening']}</p>
        <p style="font-family:Arial,sans-serif;font-size:15px;color:{C['textMid']};margin:0;line-height:1.75;font-style:italic">{mc['context']}</p>
      </td></tr>

      <tr><td style="padding-bottom:24px"></td></tr>

      <!-- Theme + windows -->
      {theme_stripe}
      {windows_layout}

      <!-- Completed this month (demo) -->
      {completed_demo}

      <!-- Coming next month / farewell / prebirth confirm -->
      {coming_next}

      <!-- Dashboard CTA -->
      <tr><td style="padding-bottom:32px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['terraTint']};border-radius:14px">
          <tr><td style="padding:22px;text-align:center">
            {remaining_html}
            <a href="{DASHBOARD_URL}" style="display:inline-block;background:{C['terra']};color:#fff;
              font-family:Arial,sans-serif;font-size:14px;font-weight:700;
              padding:13px 30px;border-radius:100px;text-decoration:none">Open {CHILD_NAME}'s dashboard →</a>
          </td></tr>
        </table>
      </td></tr>

      <!-- Jack closing -->
      <tr><td style="padding-bottom:8px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:14px">
          <tr><td style="padding:24px 26px">
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);
              margin:0 0 16px;line-height:1.7">{mc['closing']}</p>
            <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,.5);margin:0">Jack Hartley · Dad of two · Founder, FamilyForce</p>
          </td></tr>
        </table>
      </td></tr>

    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:{C['bg']};padding:20px 36px;border-top:1px solid {C['border']}">
    <p style="font-family:Arial,sans-serif;font-size:12px;color:{C['textDim']};margin:0 0 6px;line-height:1.6">
      FamilyForce · <a href="{SITE_URL}" style="color:{C['textDim']};text-decoration:none">getfamilyforce.com</a>
    </p>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0 0 6px;line-height:1.6">
      FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong
    </p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:{C['textDim']};margin:0 0 6px;line-height:1.6">
      You're receiving this because you're a Scout member.
      &nbsp;<a href="#" style="color:{C['terra']};text-decoration:none">Manage preferences</a>
      &nbsp;·&nbsp;<a href="#" style="color:{C['terra']};text-decoration:none">Unsubscribe</a>
    </p>
    <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0;line-height:1.6;opacity:.8">
      For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""

# ── Navigator page ─────────────────────────────────────────────────────────────
def build_navigator(emails):
    nav = "".join(
        f'<li><a href="#e{i}" class="n" data-i="{i}">{e["label"]}</a></li>'
        for i, e in enumerate(emails)
    )
    panels = ""
    for i, e in enumerate(emails):
        chips = "".join(
            f'<span style="display:inline-block;background:#F0EBFF;color:#5B3CC4;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;margin:2px 3px 2px 0">{w["title"]}</span>'
            for w in e.get("above_fold", [])
        )
        escaped = e['html'].replace('"', '&quot;').replace("'", "&#39;")
    af_count = len(e.get("above_fold", []))
    panels += f"""<div class="ep" id="e{i}">
  <div class="ph">
    <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:6px">
      <span style="font-size:18px;font-weight:700;color:#1E1248">{e["label"]}</span>
      <span style="font-size:12px;color:#8A879A">{e["window_count"]} active · {af_count} in email</span>
    </div>
    <div style="font-size:13px;color:#5C5960;margin-bottom:8px">📧 {e["subject"]}</div>
    <div>{chips}</div>
  </div>
  <div class="ef"><iframe srcdoc="{escaped}" frameborder="0" scrolling="yes"></iframe></div>
</div>"""

    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scout — All 37 Digest Emails (v3)</title>
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f2fb;color:#1D1D1F}}
.layout{{display:flex;height:100vh;overflow:hidden}}
.sb{{width:220px;flex-shrink:0;background:#1E1248;overflow-y:auto;padding:16px 0}}
.sb-title{{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.35);padding:0 16px 12px}}
.sb ul{{list-style:none}}
.n{{display:block;padding:9px 16px;font-size:13px;font-weight:500;color:rgba(255,255,255,.55);text-decoration:none;transition:background .15s,color .15s}}
.n:hover,.n.active{{background:rgba(110,78,214,.3);color:#fff}}
.main{{flex:1;overflow-y:auto;padding:24px}}
.ep{{margin-bottom:48px}}
.ph{{background:#fff;border:1px solid #E5E2EC;border-radius:12px 12px 0 0;padding:20px 24px}}
.ef{{border:1px solid #E5E2EC;border-top:none;border-radius:0 0 12px 12px;overflow:hidden;background:#fff}}
.ef iframe{{width:100%;height:700px;display:block;border:none}}
</style></head><body>
<div class="layout">
<nav class="sb"><div class="sb-title">37 Digest Emails v3</div><ul>{nav}</ul></nav>
<main class="main">{panels}</main>
</div>
<script>
const ps=document.querySelectorAll('.ep'),ns=document.querySelectorAll('.n'),m=document.querySelector('.main');
m.addEventListener('scroll',()=>{{let a=0;ps.forEach((p,i)=>{{if(p.offsetTop-m.scrollTop<=100)a=i;}});ns.forEach((n,i)=>n.classList.toggle('active',i===a));}});
ns.forEach(n=>n.addEventListener('click',e=>{{e.preventDefault();ps[+n.dataset.i].scrollIntoView({{behavior:'smooth'}})}}));
</script></body></html>"""

# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("Querying Supabase (v3 format, 3-window cap)...")
    emails = []

    # Pre-birth
    print("  Pre-birth...")
    pb = get_prebirth_windows()
    af = pb[:MAX_WINDOWS]
    mc = get_mc(0)
    emails.append({
        "label": "Pre-birth",
        "subject": f"{CHILD_NAME} arrives soon — your pre-birth checklist",
        "html": render_email(0, af, [], len(pb), is_prebirth=True),
        "window_count": len(pb),
        "above_fold": af,
    })

    # Months 1–36
    for mo in range(1, 37):
        age_w = mo * 4.33
        print(f"  Month {mo} ({age_w:.1f}w)...")
        wins = get_windows_at_age(age_w)
        af   = select_above_fold(wins, age_w, age_months=mo)
        try:
            gr = get_ready_windows(age_w)
        except:
            gr = []

        closing = [w for w in af if w["close_age_weeks"] - age_w <= 4]
        if closing:
            wl = round((closing[0]["close_age_weeks"] - age_w) * 7)
            tl = "closing now" if wl <= 0 else (f"{wl}d left" if wl < 14 else f"{round(wl/7)}w left")
            subj = f"{CHILD_NAME} at {mo}mo — {tl} on {closing[0]['title'].lower()}"
        elif not af:
            subj = f"{CHILD_NAME} at {mo}mo — all caught up this month 🏆"
        else:
            subj = get_mc(mo)["theme"]

        emails.append({
            "label": f"Month {mo}",
            "subject": subj,
            "html": render_email(mo, af, gr, len(wins)),
            "window_count": len(wins),
            "above_fold": af,
        })

    out = os.path.join(os.path.dirname(__file__), "../mockups/email-previews.html")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        f.write(build_navigator(emails))
    print(f"\nDone → {os.path.abspath(out)}")
    print(f"Total emails: {len(emails)}")

if __name__ == "__main__":
    main()
