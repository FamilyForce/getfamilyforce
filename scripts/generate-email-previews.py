#!/usr/bin/env python3
"""
generate-email-previews.py
===========================
Queries Supabase for active milestone windows at each age, applies
the same selectAboveFold logic as scout-digest, and renders the full
email HTML for all 37 digest emails (pre-birth + months 1–36).

Output: mockups/email-previews.html

Usage:
  cd projects/familyforce
  python3 scripts/generate-email-previews.py
"""

import urllib.request
import urllib.parse
import json
import math
import re
import os

SUPABASE_URL  = "https://ewjqbafaxeasyvknxmof.supabase.co"
ANON_KEY      = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDUyMDMsImV4cCI6MjA4ODYyMTIwM30.5_NCJP7r5BZSFXcA_WMBiK13vs5Q2bLVdcOZkzyvsWQ"
HEADERS       = {"apikey": ANON_KEY, "Authorization": f"Bearer {ANON_KEY}"}
REST_URL      = f"{SUPABASE_URL}/rest/v1/milestone_windows"
ABOVE_FOLD_N  = 5
CHILD_NAME    = "Olivia"
SITE_URL      = "https://getfamilyforce.com"
DASHBOARD_URL = "https://getfamilyforce.com/scout-dashboard"

# ── Colour palette (matches email-digest.ts) ─────────────────────────────────
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
    "red":         "#DC2626",
    "redBg":       "#FEF2F2",
}

# ── Helpers ───────────────────────────────────────────────────────────────────
def excerpt(text, sentences=2):
    if not text:
        return ""
    parts = re.split(r'(?<=[.!?])\s+', text.strip())
    return " ".join(parts[:sentences]).strip()

def action_line(text):
    if not text:
        return ""
    line = text.strip().split("\n")[0]
    return re.sub(r'^[-•·]\s*', '', line).strip()

def urgency_cfg(u):
    if u == "clinical":
        return {"dot": C["red"],     "bg": C["redBg"],   "label": "Time-sensitive"}
    if u == "screening":
        return {"dot": C["terra"],   "bg": C["terraTint"], "label": "Screening"}
    return     {"dot": C["textDim"], "bg": "#F9F8FF",    "label": "This month"}

def weeks_left_badge(w, age_weeks):
    wl = round(w["close_age_weeks"] - age_weeks)
    if wl <= 0:
        return '<span style="display:inline-block;background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;margin-left:8px">Closing now</span>'
    if wl <= 4:
        return f'<span style="display:inline-block;background:#FFFBEB;color:#B45309;border:1px solid #FDE68A;font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;margin-left:8px">Closes in {wl}w</span>'
    return ""

# ── Query helpers ─────────────────────────────────────────────────────────────
def query_windows(params):
    # Build query string manually — Supabase REST rejects URL-encoded filter values
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = REST_URL + "?" + qs
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get_windows_at_age(age_weeks):
    """Active milestone windows open at this age. Uses integer weeks (DB stores integers)."""
    aw = int(round(age_weeks))
    qs = (f"select=id,slug,title,category,urgency,open_age_weeks,close_age_weeks,priority,"
          f"why_it_matters,what_to_do,playbook_link,prep_tip"
          f"&active=eq.true&window_type=eq.milestone&prenatal=eq.false"
          f"&open_age_weeks=lte.{aw}&close_age_weeks=gte.{aw}&order=priority.asc&limit=100")
    req = urllib.request.Request(REST_URL + "?" + qs, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get_prebirth_windows():
    """Prenatal milestone windows."""
    qs = ("select=id,slug,title,category,urgency,open_age_weeks,close_age_weeks,priority,"
          "why_it_matters,what_to_do,playbook_link,prep_tip"
          "&active=eq.true&window_type=eq.milestone&prenatal=eq.true&order=priority.asc&limit=50")
    req = urllib.request.Request(REST_URL + "?" + qs, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

def get_ready_windows(age_weeks):
    """Windows opening in next 1–8 weeks (not yet open)."""
    aw    = int(round(age_weeks))
    max_w = aw + 8
    qs = (f"select=id,slug,title,category,urgency,open_age_weeks,close_age_weeks,priority,prep_tip"
          f"&active=eq.true&window_type=eq.milestone&prenatal=eq.false"
          f"&open_age_weeks=gt.{aw}&open_age_weeks=lte.{max_w}&order=open_age_weeks.asc&limit=3")
    req = urllib.request.Request(REST_URL + "?" + qs, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# ── selectAboveFold (mirrors scout-digest logic) ─────────────────────────────
def select_above_fold(windows, age_weeks, n=ABOVE_FOLD_N):
    closing = [w for w in windows if w["close_age_weeks"] - age_weeks <= 4]
    open_w  = [w for w in windows if w["close_age_weeks"] - age_weeks > 4]
    closing.sort(key=lambda w: w["priority"])
    open_w.sort(key=lambda w: w["priority"])
    return (closing + open_w)[:n]

# ── Format what_to_do for digest cards (max 4 bullets) ───────────────────────
def format_what_to_do_digest(text, max_bullets=4):
    """Render up to max_bullets lines from what_to_do for a monthly window card."""
    if not text:
        return ""
    lines   = text.strip().split("\n")
    terra   = C["terra"]
    textMid = C["textMid"]
    textStr = C["text"]
    html    = []
    bullets = 0
    for line in lines:
        line = line.strip()
        if not line:
            continue
        line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
        if line.startswith(("*", "-", "•")) or re.match(r'^\d+\.', line):
            if bullets >= max_bullets:
                continue
            clean = re.sub(r'^[\*\-•]\s*', '', line)
            clean = re.sub(r'^\d+\.\s*', '', clean)
            html.append(
                f'<tr><td style="padding:3px 0 3px 0">'
                f'<p style="font-family:Arial,sans-serif;font-size:13px;color:{textMid};margin:0;line-height:1.6">'
                f'<span style="color:{terra};font-weight:700;margin-right:6px">›</span>{clean}'
                f'</p></td></tr>'
            )
            bullets += 1
        else:
            # Section header or plain sentence — show as bold label
            html.append(
                f'<tr><td style="padding:6px 0 2px">'
                f'<p style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:{textStr};margin:0">{line}</p>'
                f'</td></tr>'
            )
    return "\n".join(html)


# ── Render: single window card ────────────────────────────────────────────────
def render_window_card(w, age_weeks):
    cfg        = urgency_cfg(w.get("urgency", "advisory"))
    exc        = excerpt(w.get("why_it_matters", ""))
    what_html  = format_what_to_do_digest(w.get("what_to_do", ""), max_bullets=8)
    badge      = weeks_left_badge(w, age_weeks)
    action_html = f"""
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['terraTint']};border-radius:10px">
                    <tr>
                      <td style="padding:14px 16px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:{C['terra']};text-transform:uppercase;letter-spacing:.1em;margin:0 0 8px">The move</p>
                        <table width="100%" cellpadding="0" cellspacing="0">{what_html}</table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>""" if what_html else ""
    return f"""
  <tr>
    <td style="padding-bottom:16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['surface']};border:1px solid {C['border']};border-radius:14px;overflow:hidden">
        <tr>
          <td style="padding:20px 22px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding-bottom:4px">
                <span style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;color:{cfg['dot']};text-transform:uppercase;letter-spacing:.1em">{cfg['label']}</span>
              </td></tr>
              <tr><td style="padding-bottom:8px">
                <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:{C['text']};margin:0;line-height:1.3">{w['title']}{badge}</p>
              </td></tr>
              <tr><td style="padding-bottom:14px">
                <p style="font-family:Arial,sans-serif;font-size:14px;color:{C['textMid']};margin:0;line-height:1.7">{exc}</p>
              </td></tr>
              {action_html}
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>"""

# ── Render: get-ready item ────────────────────────────────────────────────────
def render_get_ready(w):
    tip = w.get("prep_tip") or "Coming up soon — watch for this milestone."
    return f"""
  <tr>
    <td style="padding-bottom:12px">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F8FF;border:1px solid {C['border']};border-radius:12px">
        <tr><td style="padding:14px 18px">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:{C['text']};margin:0 0 5px;line-height:1.3">{w['title']}</p>
          <p style="font-family:Arial,sans-serif;font-size:13px;color:{C['textMid']};margin:0;line-height:1.6"><strong style="color:{C['terra']}">Prep:</strong> {tip}</p>
        </td></tr>
      </table>
    </td>
  </tr>"""

# ── Per-month unique copy ────────────────────────────────────────────────────
MONTH_COPY = {
    1:  {
        "opening": "{n} is 1 month old. You've kept a human alive for a whole month — and she's growing. This is Scout's first monthly digest: a look at what's worth your attention right now, no more than 5 minutes.",
        "context": "The first month is survival mode. You're doing it right.",
        "closing": "You're one month in. The hardest stretch — the absolute chaos of week one through four — is behind you. She's easier to read than she was, and she'll be easier still next month. We'll be back. — Jack",
    },
    2:  {
        "opening": "{n} is 2 months old. The hard edge of the newborn phase is starting to soften. She's more awake, more alert, and more interested in you. Here's what to focus on this month.",
        "context": "Something shifts around 6–8 weeks. If you haven't seen the first real smile yet — it's close.",
        "closing": "Two months down. That first real smile — if it's happened, you already know why people do this twice. If it hasn't, watch for it this week. It changes the whole thing. See you next month. — Jack",
    },
    3:  {
        "opening": "{n} is 3 months old. Three months in is often when parents feel like they've finally figured something out. Here's what's worth your attention — she's got a lot going on right now.",
        "context": "You made it through the fourth trimester. Three months of adjusting, recovering, and learning on the job — that's no small thing.",
        "closing": "Month 3 is when it starts feeling real. You're not just keeping her alive — you're watching her become someone. Month 4 is full of new things. We'll make sure you're ready. — Jack",
    },
    4:  {
        "opening": "{n} is 4 months old. Month 4 is one of the most developmentally active stretches of the first year — and the one that catches most parents off guard. Here's what to know.",
        "context": "Four months is when development accelerates. Sleep often gets harder before it gets easier. Both are normal.",
        "closing": "Month 4 is a lot. If sleep just got worse — that's the 4-month sleep regression and it means her brain is doing exactly what it should. Hang in there. Back next month. — Jack",
    },
    5:  {
        "opening": "{n} is 5 months old. She's not a newborn anymore — she's an active, curious baby who wants to explore everything in reach. Here's what's worth your attention this month.",
        "context": "Five months is full of firsts. Grabbing, batting, babbling — it's all picking up at once.",
        "closing": "Five months goes fast. She's a different baby than she was four weeks ago — and she'll be different again in four more. Enjoy this stretch. We'll be back. — Jack",
    },
    6:  {
        "opening": "{n} is 6 months old. Six months is a turning point — solids are starting, she's sitting with support, and she's starting to look less like a baby and more like a little person. Here's what matters this month.",
        "context": "Six months. Solids, sitting, and a whole new level of curiosity about the world.",
        "closing": "Halfway through the first year. You've done more right than you know. Month 7 is where it gets mobile — we'll walk you through it. — Jack",
    },
    7:  {
        "opening": "{n} is 7 months old. Mobility is coming — crawling, pulling, rolling — and with it comes a world that suddenly needs a closer look for hazards. Here's what to focus on.",
        "context": "Seven months: the world is getting much more interesting. And so are the hazards.",
        "closing": "Seven months is when parents start babyproofing in earnest. If you haven't started, this month is the time. We'll cover it next month too. — Jack",
    },
    8:  {
        "opening": "{n} is 8 months old. Object permanence is kicking in — she now knows things exist even when she can't see them. That's a huge cognitive shift. Here's what it means for this month.",
        "context": "Eight months: things that disappear are suddenly the end of the world. That's object permanence. It means her brain is working.",
        "closing": "Eight months is the start of a lot of big things — object permanence, separation anxiety, more deliberate communication. All normal. All good. — Jack",
    },
    9:  {
        "opening": "{n} is 9 months old. This is one of the biggest developmental months of the whole first year — crawling, pulling up, pointing, and early communication are all happening at once. Here's what to watch.",
        "context": "Nine months is a surge. Gross motor, language, and social development are all firing at the same time.",
        "closing": "Nine months is one of my favorites. She's communicating more deliberately, moving on her own, and becoming someone with opinions. A lot happens between now and 12 months. — Jack",
    },
    10: {
        "opening": "{n} is 10 months old. She's getting more intentional — pointing, gesturing, looking at you when something interests her. That's joint attention, and it's one of the most important things happening right now.",
        "context": "Ten months: watch for pointing and shared looks. That's communication, even without words.",
        "closing": "Two months to the first birthday. She's changing fast. The 12-month well visit is a big one — we'll prep you for it next month. — Jack",
    },
    11: {
        "opening": "{n} is 11 months old. Almost one. Some babies are walking at 11 months. Most aren't. Both are completely fine — the walking window runs through 18 months. Here's what actually matters right now.",
        "context": "Eleven months: walking isn't required yet. What matters is that she's pulling up, cruising, and curious.",
        "closing": "One month to the first birthday. It goes fast — and then it really goes fast. The 12-month digest is a big one. — Jack",
    },
    12: {
        "opening": "{n} is 12 months old. One year. You did it. The first year of life is one of the most developmentally dense periods of any human life — and you navigated all of it. Here's what the 12-month well visit covers and what to focus on now.",
        "context": "The first year is done. One of the most remarkable developmental years of any human life — and you were there for all of it.",
        "closing": "Happy first birthday to Olivia — and to you. Year two is different. Faster in some ways, slower in others. We'll keep you on track every month. — Jack",
    },
    13: {
        "opening": "{n} is 13 months old. The toddler era has officially started. Language is about to take off, independence is the new theme, and the word 'no' is going to become very familiar. Here's what to focus on.",
        "context": "Thirteen months: the toddler phase begins. Language is building fast beneath the surface.",
        "closing": "Welcome to toddlerhood. It's chaotic and wonderful. The language explosion you're about to see over the next few months is one of the most amazing things to watch. — Jack",
    },
    14: {
        "opening": "{n} is 14 months old. Walking is getting more confident, and with mobility comes a new level of curiosity — and risk. Here's what's worth your attention this month.",
        "context": "Fourteen months: everything is an obstacle course, and she knows it.",
        "closing": "Fourteen months is busy. Keep talking to her — every word you say is going in, even when it doesn't look like it. — Jack",
    },
    15: {
        "opening": "{n} is 15 months old. This is a big developmental checkpoint — the 15-month well visit includes the M-CHAT autism screen. It's also when language development is most closely watched. Here's what to know going in.",
        "context": "Fifteen months is a significant milestone check. Don't skip the well visit.",
        "closing": "The 15-month visit is worth taking seriously. It's one of the most informative checkups of the toddler years. Come back and tell us how it went. — Jack",
    },
    16: {
        "opening": "{n} is 16 months old. Vocabulary is building — some kids have 10 words, some have 50, both are within range at this age. The more you talk to her, the faster it grows. Here's what to focus on.",
        "context": "Sixteen months: vocabulary is growing. Narrate your day. It works.",
        "closing": "Sixteen months is a great time to just talk. Constantly. About everything. It sounds simple because it is — and it's one of the most powerful things you can do. — Jack",
    },
    17: {
        "opening": "{n} is 17 months old. Tantrums may be arriving — if they haven't already. This isn't bad behavior. It's a sign that she understands more than she can express, and the frustration is real. Here's how to handle it.",
        "context": "Seventeen months: big feelings, limited words. That gap is what tantrums are.",
        "closing": "Tantrums are exhausting. They're also completely normal and actually a sign of good cognitive development. Naming her feelings out loud helps more than you'd think. — Jack",
    },
    18: {
        "opening": "{n} is 18 months old. Another major milestone check — the 18-month well visit covers language, walking, and social development in detail. It's also when the second M-CHAT screen happens. Here's what to know.",
        "context": "Eighteen months: language, walking, and social development are all under the spotlight this month.",
        "closing": "Eighteen months is one of the most important checkups of the toddler years. If anything at the visit raised a flag, follow up quickly — early intervention makes a significant difference. — Jack",
    },
    19: {
        "opening": "{n} is 19 months old. Pretend play is starting — feeding a doll, talking into a toy phone, pretending a block is a car. It's not just cute. It's cognition, language, and social development happening in real time.",
        "context": "Nineteen months: pretend play begins. It's cognitive development in action.",
        "closing": "Get down on the floor and play pretend with her. It's one of the best investments you can make at this age — and it's fun. — Jack",
    },
    20: {
        "opening": "{n} is 20 months old. Two-word combinations are starting to emerge — 'more juice,' 'big dog,' 'daddy go.' Simple, but they mean something important is clicking in her language development.",
        "context": "Twenty months: two-word combinations. Simple phrases that signal a big shift.",
        "closing": "Two-word phrases are a sign that language is taking off. By 24 months, most kids have sentences. You're almost there. — Jack",
    },
    21: {
        "opening": "{n} is 21 months old. Defiance is real at this age, and it's actually healthy — she's learning what she can and can't control. Here's how to work with it rather than against it.",
        "context": "Twenty-one months: the will is strong. That's a feature, not a bug.",
        "closing": "The defiance of a 21-month-old is one of the more exhausting things in parenting. It also means she's developing exactly as she should. Pick your battles. — Jack",
    },
    22: {
        "opening": "{n} is 22 months old. The vocabulary explosion is in full force — words are coming in fast now. The gap between what she understands and what she can say is finally starting to close.",
        "context": "Twenty-two months: the words are coming. The vocabulary explosion is real.",
        "closing": "The difference between 22 months and 24 months in terms of language is striking. Enjoy watching this unfold. — Jack",
    },
    23: {
        "opening": "{n} is 23 months old. One month to the second birthday — and the 24-month well visit, which is one of the most comprehensive developmental checkups of the first two years. Here's how to prepare.",
        "context": "Twenty-three months: almost two. The 24-month well visit is one of the most important of the early years.",
        "closing": "The second birthday is a milestone worth celebrating — for her and for you. Two years of showing up, every single day. — Jack",
    },
    24: {
        "opening": "{n} is 24 months old. Two years. The second year transforms a baby into a kid — walking, talking, and a personality that's fully formed. Here's what the 24-month visit covers and what to focus on going into year three.",
        "context": "Two years. The second year is wild. You made it.",
        "closing": "Happy second birthday to Olivia. Year three is where the conversations start. She'll surprise you. — Jack",
    },
    25: {
        "opening": "{n} is 25 months old. Sentences are getting longer and questions are starting. 'Why' is coming — possibly a lot of it. Here's what's worth your attention this month.",
        "context": "Twenty-five months: sentences are forming. 'Why' is coming. Brace yourself.",
        "closing": "Answer the 'why' questions. Even the relentless ones. It builds exactly the kind of thinking you want her to have. — Jack",
    },
    26: {
        "opening": "{n} is 26 months old. Social play is evolving — she's shifting from playing beside other kids to playing with them. That's a meaningful developmental step. Here's what it looks like.",
        "context": "Twenty-six months: other kids are interesting now, not just present.",
        "closing": "Playdates matter more now than they did six months ago. The social practice is real. — Jack",
    },
    27: {
        "opening": "{n} is 27 months old. Fine motor skills are getting precise — crayons, puzzles, turning pages, opening containers. She wants to do things herself. Here's how to support that.",
        "context": "Twenty-seven months: the hands are getting precise. Let her try things, even the slow way.",
        "closing": "Resist the urge to do it for her. The struggle with the puzzle piece or the jacket zipper is the whole point. — Jack",
    },
    28: {
        "opening": "{n} is 28 months old. Memory is consolidating in a meaningful way — she remembers things you've said, places you've been, people she likes. Here's what that means for this stage.",
        "context": "Twenty-eight months: she remembers things now. Act accordingly.",
        "closing": "The things you do consistently now are being stored. Routines, rituals, the way you say goodnight — it all goes in. — Jack",
    },
    29: {
        "opening": "{n} is 29 months old. Narrative play is in full swing — she's creating stories, assigning roles, making rules for games she invented. Imagination is running and it's worth nurturing.",
        "context": "Twenty-nine months: the stories she tells are more complex than they look.",
        "closing": "Follow her lead in pretend play. She's the director — your job is to be a good supporting character. — Jack",
    },
    30: {
        "opening": "{n} is 30 months old. The 30-month well visit is coming — it's a key checkpoint for speech clarity and social development. Here's what typically gets evaluated and what to watch for.",
        "context": "Thirty months: speech and social development are closely evaluated at the well visit.",
        "closing": "The 30-month visit is a good one to prepare for. If speech has been a question mark, now is the time to bring it up directly. — Jack",
    },
    31: {
        "opening": "{n} is 31 months old. Emotional regulation is a work in progress — she's learning to manage big feelings with tools that are still developing. Here's what helps and what doesn't.",
        "context": "Thirty-one months: emotional regulation is a skill that takes years. You're in the thick of teaching it.",
        "closing": "Stay calm when she can't. Your regulation is the model for hers. It's a long game. — Jack",
    },
    32: {
        "opening": "{n} is 32 months old. Literacy foundations are being built right now — not through drills, but through stories, conversations, and books read together every day. Here's what the research actually says.",
        "context": "Thirty-two months: every book you read together is building neural pathways for reading.",
        "closing": "If you only do one thing consistently at this age, make it reading together at bedtime. The payoff runs for years. — Jack",
    },
    33: {
        "opening": "{n} is 33 months old. Friendships are forming in a real way — she's noticing who she likes to be around, and those preferences matter. Here's what social development looks like at this stage.",
        "context": "Thirty-three months: friendships are becoming real. She knows who she likes.",
        "closing": "The social world matters more every month now. Make space for it. — Jack",
    },
    34: {
        "opening": "{n} is 34 months old. Independence is the theme of this stretch — she wants to do things herself, make her own choices, and push back on yours. Here's how to channel that productively.",
        "context": "Thirty-four months: independence is the mission. Work with it, not against it.",
        "closing": "Give her real choices. Not unlimited ones — two or three. It's a small thing that makes a big difference in cooperation. — Jack",
    },
    35: {
        "opening": "{n} is 35 months old. The 36-month well visit is one month away — it covers speech, cognition, and social development in depth. Here's how to prepare and what questions to bring.",
        "context": "Thirty-five months: the 3-year well visit is coming. It's one of the most thorough checkups of the toddler years.",
        "closing": "Write down your questions before the 36-month visit. The things you've been wondering about for six months are worth asking directly. — Jack",
    },
    36: {
        "opening": "{n} is 36 months old. Three years. The third year of life transforms a baby into a kid — a person with opinions, stories, fears, jokes, and a clear sense of self. Here's what the 3-year checkup covers and where to focus now.",
        "context": "Three years. You made it through the most intense developmental stretch of a human life. She's a kid now.",
        "closing": "Three years of monthly digests. You showed up for every one of them. That consistency is part of why she's doing as well as she is. Onwards. — Jack",
    },
}

def get_intro(age_months, child_name, above_fold, total_count):
    copy = MONTH_COPY.get(age_months, {})
    opening = copy.get("opening", f"{child_name} is {age_months} months old. Here's what's worth your attention this month.").replace("{n}", child_name)
    context = copy.get("context", f"Month {age_months}. Every month has something new.")
    return opening, context

def get_closing(age_months, child_name):
    copy = MONTH_COPY.get(age_months, {})
    return copy.get("closing", f"See you next month. — Jack").replace("{n}", child_name)


# ── Render: full digest email ─────────────────────────────────────────────────
def render_digest_email(age_months, above_fold, get_ready, total_count):
    age_weeks  = age_months * 4.33
    closing    = [w for w in above_fold if w["close_age_weeks"] - age_weeks <= 4]
    open_wins  = [w for w in above_fold if w["close_age_weeks"] - age_weeks > 4]

    opening_para, context_line = get_intro(age_months, CHILD_NAME, above_fold, total_count)
    closing_text = get_closing(age_months, CHILD_NAME)

    # Subject line
    if closing:
        wl    = round((closing[0]["close_age_weeks"] - age_weeks) * 7)
        if wl <= 0:   time_left = "closing now"
        elif wl < 14: time_left = f"{wl} day{'s' if wl != 1 else ''} left"
        else:         time_left = f"{round(wl/7)} week{'s' if round(wl/7) != 1 else ''} left"
        subject = f"{CHILD_NAME} at {age_months} month{'s' if age_months != 1 else ''} — {time_left} on {closing[0]['title'].lower()}"
    elif not above_fold:
        subject = f"{CHILD_NAME} at {age_months} month{'s' if age_months != 1 else ''} — you've done it all this month 🏆"
    else:
        subject = f"{CHILD_NAME} at {age_months} month{'s' if age_months != 1 else ''} — {len(above_fold)} things to know this month"

    # Closing-priority amber banner
    closing_banner = f"""
      <tr><td style="padding-bottom:8px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['amberBg']};border:1px solid {C['amberBorder']};border-radius:10px">
          <tr><td style="padding:12px 16px">
            <p style="font-family:Arial,sans-serif;font-size:13px;color:{C['amber']};margin:0;line-height:1.6">
              <strong>Heads up:</strong> {"One window closes" if len(closing)==1 else f"{len(closing)} windows close"} this month — meaning the natural developmental timing is ending. {"This is" if len(closing)==1 else "These are"} worth doing first.
            </p>
          </td></tr>
        </table>
      </td></tr>""" if closing else ""

    # Priority section (closing windows)
    priority_section = f"""
      <tr><td style="padding-bottom:4px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{C['amber']};margin:0">This month's priority</p>
      </td></tr>
      {"".join(render_window_card(w, age_weeks) for w in closing)}""" if closing else ""

    # Open windows section
    open_section = f"""
      <tr><td style="padding:{'8px' if closing else '0'} 0 8px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{C['textDim']};margin:0">Also worth knowing this month</p>
      </td></tr>
      {"".join(render_window_card(w, age_weeks) for w in open_wins)}""" if open_wins else ""

    # Get ready section
    gr_html = "".join(render_get_ready(w) for w in get_ready[:3])
    get_ready_section = f"""
      <tr><td style="padding:16px 0 8px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{C['terra']};margin:0">Get ready for next month</p>
      </td></tr>
      {gr_html}""" if gr_html else ""

    empty_msg = f"""<tr><td style="padding:24px 0;text-align:center">
      <p style="font-family:Arial,sans-serif;font-size:15px;color:{C['textMid']};margin:0">Nothing closing this month — {CHILD_NAME} is right on track 🏆</p>
    </td></tr>""" if not above_fold else ""

    mo = f"{age_months} month{'s' if age_months != 1 else ''}"

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8">
<title>Month {age_months} — {subject}</title></head>
<body style="margin:0;padding:0;background:{C['bg']};font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{C['bg']}">
  <tr><td align="center" style="padding:32px 16px 48px">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

      <!-- Logo -->
      <tr><td align="center" style="padding-bottom:28px">
        <span style="font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:{C['text']}">Family<span style="color:{C['terra']}">Force</span></span>
      </td></tr>

      <!-- Hero -->
      <tr><td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:20px">
          <tr><td style="padding:36px 32px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.12em;margin:0 0 10px">Scout · {mo} old</p>
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#fff;margin:0 0 16px;line-height:1.2;font-style:italic">{CHILD_NAME} at {mo} old.</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.75);margin:0 0 12px;line-height:1.7">Hi there,</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.65);margin:0 0 12px;line-height:1.7">{opening_para}</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.5);margin:0;line-height:1.7;font-style:italic">{context_line}</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- Window count -->
      {"<tr><td style='padding-bottom:16px'><p style='font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:" + C['terra'] + ";margin:0'>This month — " + str(len(above_fold)) + " of " + str(total_count) + " active windows</p></td></tr>" if above_fold else ""}

      <!-- Closing banner -->
      {closing_banner}

      <!-- Priority windows (closing) -->
      {priority_section}

      <!-- Open windows -->
      {open_section}

      {empty_msg}

      <!-- Get ready -->
      {get_ready_section}

      <!-- Warm closing -->
      <tr><td style="padding-top:8px;padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:16px">
          <tr><td style="padding:24px 28px">
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0;line-height:1.8;font-style:italic">{closing_text}</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:0 0 32px">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:{C['terra']};border-radius:100px;padding:14px 32px">
            <a href="{DASHBOARD_URL}" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none">Open Scout dashboard →</a>
          </td>
        </tr></table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="border-top:1px solid {C['border']};padding-top:20px;text-align:center">
        <p style="font-family:Arial,sans-serif;font-size:12px;color:{C['textDim']};margin:0 0 6px">Scout by FamilyForce · getfamilyforce.com</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0 0 6px">FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0 0 6px">You're receiving this because you're a Scout member. &nbsp;·&nbsp; <a href="#" style="color:{C['textDim']}">Unsubscribe</a></p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0;opacity:.8">For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>"""

# ── Render: pre-birth email ───────────────────────────────────────────────────
FALLBACK_PREBIRTH = [
    {"title": "Choose your pediatrician",
     "why_it_matters": "Many pediatric practices require you to register before delivery. Your baby will have their first visit within 2–5 days of birth — you need a doctor lined up before that.",
     "what_to_do": "Research practices near you, schedule a meet-the-doctor visit, and confirm they accept your insurance.",
     "urgency": "advisory"},
    {"title": "Pack your hospital bag",
     "why_it_matters": "Packing after labor begins is stressful. Having a bag ready by week 36 means one less thing to think about when the real countdown starts.",
     "what_to_do": "Include: insurance card, ID, phone charger, going-home outfit for baby (0–3 months), and comfortable clothing for yourself.",
     "urgency": "advisory"},
    {"title": "Set up the sleep space",
     "why_it_matters": "A safe sleep environment reduces the risk of SIDS and accidental suffocation. The AAP recommends a firm, flat surface with no soft bedding, bumpers, or positioners.",
     "what_to_do": "Set up the bassinet or crib before birth: firm mattress, fitted sheet, nothing else inside.",
     "urgency": "advisory"},
]

def format_what_to_do(text):
    """Convert markdown-ish what_to_do text to inline-style HTML for email."""
    if not text:
        return ""
    lines = text.strip().split("\n")
    html_lines = []
    for line in lines:
        line = line.strip()
        if not line:
            html_lines.append('<tr><td style="height:8px"></td></tr>')
            continue
        # Bold: **text** → <strong>
        line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
        # Section header (no leading bullet, ends with :)
        if not line.startswith(("*", "-", "•", "1.", "2.", "3.", "4.", "5.")):
            html_lines.append(
                f'<tr><td style="padding:6px 0 2px">'
                f'<p style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:{C["text"]};margin:0;line-height:1.5">{line}</p>'
                f'</td></tr>'
            )
        else:
            # Bullet or numbered item
            clean = re.sub(r'^[\*\-•]\s*', '', line)
            clean = re.sub(r'^\d+\.\s*', '', clean)
            terra = C["terra"]
            textMid = C["textMid"]
            html_lines.append(
                f'<tr><td style="padding:3px 0 3px 12px">'
                f'<p style="font-family:Arial,sans-serif;font-size:13px;color:{textMid};margin:0;line-height:1.6">'
                f'<span style="color:{terra};font-weight:700;margin-right:6px">›</span>{clean}'
                f'</p></td></tr>'
            )
    return "\n".join(html_lines)


def render_prebirth_email(windows):
    cards_src  = windows if windows else FALLBACK_PREBIRTH
    cards_html = ""
    for w in cards_src[:5]:
        exc      = excerpt(w.get("why_it_matters",""))
        what_html = format_what_to_do(w.get("what_to_do",""))
        act_section = f"""
              <tr><td style="padding-top:4px">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['terraTint']};border-radius:10px">
                  <tr><td style="padding:14px 18px">
                    <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:{C['terra']};text-transform:uppercase;letter-spacing:.1em;margin:0 0 10px">The move</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      {what_html}
                    </table>
                  </td></tr>
                </table>
              </td></tr>""" if what_html else ""
        cards_html += f"""
  <tr><td style="padding-bottom:16px">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['surface']};border:1px solid {C['border']};border-radius:14px">
      <tr><td style="padding:20px 22px">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding-bottom:8px"><p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:{C['text']};margin:0;line-height:1.3">{w['title']}</p></td></tr>
          <tr><td style="padding-bottom:14px"><p style="font-family:Arial,sans-serif;font-size:14px;color:{C['textMid']};margin:0;line-height:1.7">{exc}</p></td></tr>
          {act_section}
        </table>
      </td></tr>
    </table>
  </td></tr>"""

    label = "Using fallback evergreen content (no prenatal windows matched)" if not windows else f"{len(windows)} prenatal window(s) active"

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Pre-birth email</title></head>
<body style="margin:0;padding:0;background:{C['bg']};font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:{C['bg']}">
  <tr><td align="center" style="padding:32px 16px 48px">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">

      <tr><td align="center" style="padding-bottom:28px">
        <span style="font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:{C['text']}">Family<span style="color:{C['terra']}">Force</span></span>
      </td></tr>

      <tr><td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:20px">
          <tr><td style="padding:36px 32px">
            <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.12em;margin:0 0 10px">Scout · Pre-birth</p>
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:28px;color:#fff;margin:0 0 16px;line-height:1.2;font-style:italic">{CHILD_NAME} arrives in 18 days.</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.75);margin:0 0 12px;line-height:1.7">Hi there,</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.65);margin:0 0 12px;line-height:1.7">Scout is designed for when your baby is born — covering every developmental milestone through the first three years. The 200+ windows we track all start at birth. But we wanted to be helpful before {CHILD_NAME} arrives too, so below are a few things worth sorting now. It's not an exhaustive list — just the things that are genuinely easier to do before a newborn is in the room.</p>
            <p style="font-family:Arial,sans-serif;font-size:15px;color:rgba(255,255,255,.5);margin:0;line-height:1.7;font-style:italic">The preparation windows below close at birth. Most of them are quick — and much easier to do now than with a newborn in the room.</p>
          </td></tr>
        </table>
      </td></tr>

      <tr><td style="padding-bottom:16px">
        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:{C['terra']};margin:0">Before {CHILD_NAME} arrives — {label}</p>
      </td></tr>

      {cards_html}

      <!-- Warm closing -->
      <tr><td style="padding-bottom:24px">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['indigoDeep']};border-radius:16px">
          <tr><td style="padding:28px 32px">
            <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;color:#fff;margin:0 0 14px;line-height:1.3;font-style:italic">When {CHILD_NAME} arrives, come back and tell us.</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 10px;line-height:1.7">It takes 30 seconds — just confirm the birth date in Scout and we'll immediately start sending you monthly digests timed to exactly where {CHILD_NAME} is developmentally. Everything shifts from prep mode to real-time tracking.</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.7);margin:0 0 16px;line-height:1.7">This is one of the biggest things that will ever happen to you. Lots of ups, some lows, and more excitement than you'll know what to do with. We're in this together — and we'll help you stay on track every step of the way.</p>
            <p style="font-family:Arial,sans-serif;font-size:14px;color:rgba(255,255,255,.5);margin:0;line-height:1.7;font-style:italic">— Jack</p>
          </td></tr>
        </table>
      </td></tr>

      <!-- CTA -->
      <tr><td align="center" style="padding:0 0 32px">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:{C['terra']};border-radius:100px;padding:14px 32px">
            <a href="{DASHBOARD_URL}" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;text-decoration:none">Open your Scout dashboard →</a>
          </td>
        </tr></table>
      </td></tr>

      <tr><td style="border-top:1px solid {C['border']};padding-top:20px;text-align:center">
        <p style="font-family:Arial,sans-serif;font-size:12px;color:{C['textDim']};margin:0 0 6px">Scout by FamilyForce · getfamilyforce.com</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0 0 6px">FamilyForce, 6th Floor, 12P Smithfield, Kennedy Town, Hong Kong</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0 0 6px">You're receiving this because you're a Scout member. · <a href="#" style="color:{C['textDim']}">Unsubscribe</a></p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:{C['textDim']};margin:0;opacity:.8">For educational purposes only. Every child develops at their own pace. Consult your pediatrician with any concerns.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>"""

# ── Build navigator page ──────────────────────────────────────────────────────
def build_navigator(emails):
    # emails: list of {"label": str, "subject": str, "html": str, "window_count": int, "above_fold": list}
    nav_items = ""
    for i, e in enumerate(emails):
        nav_items += f'<li><a href="#email-{i}" class="nav-item" data-idx="{i}">{e["label"]}</a></li>\n'

    panels = ""
    for i, e in enumerate(emails):
        window_list = ""
        for w in e.get("above_fold", []):
            window_list += f'<span style="display:inline-block;background:#F0EBFF;color:#5B3CC4;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;margin:2px 3px 2px 0">{w["title"]}</span>'

        panels += f"""
<div class="email-panel" id="email-{i}">
  <div class="panel-header">
    <div class="panel-meta">
      <span class="panel-label">{e["label"]}</span>
      <span class="panel-count">{e["window_count"]} active windows · {len(e.get("above_fold",[]))} shown in email</span>
    </div>
    <div class="panel-subject">📧 Subject: <strong>{e["subject"]}</strong></div>
    <div class="panel-windows">{window_list}</div>
  </div>
  <div class="email-frame">
    <iframe srcdoc="{e['html'].replace(chr(34), '&quot;').replace(chr(39), '&#39;')}" frameborder="0" scrolling="yes"></iframe>
  </div>
</div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Scout Email Review — All 37 Digests</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f2fb; color: #1D1D1F; }}

  .layout {{ display: flex; height: 100vh; overflow: hidden; }}

  /* Sidebar */
  .sidebar {{ width: 220px; flex-shrink: 0; background: #1E1248; overflow-y: auto; padding: 16px 0; }}
  .sidebar-title {{ font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.35); padding: 0 16px 12px; }}
  .sidebar ul {{ list-style: none; }}
  .nav-item {{ display: block; padding: 9px 16px; font-size: 13px; font-weight: 500; color: rgba(255,255,255,.55); text-decoration: none; transition: background .15s, color .15s; border-radius: 0; }}
  .nav-item:hover, .nav-item.active {{ background: rgba(110,78,214,.3); color: #fff; }}

  /* Main */
  .main {{ flex: 1; overflow-y: auto; padding: 24px; }}

  .email-panel {{ margin-bottom: 48px; }}
  .panel-header {{ background: #fff; border: 1px solid #E5E2EC; border-radius: 12px 12px 0 0; padding: 20px 24px; }}
  .panel-meta {{ display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }}
  .panel-label {{ font-size: 18px; font-weight: 700; color: #1E1248; }}
  .panel-count {{ font-size: 12px; color: #8A879A; }}
  .panel-subject {{ font-size: 13px; color: #5C5960; margin-bottom: 10px; }}
  .panel-windows {{ line-height: 1.8; }}

  .email-frame {{ border: 1px solid #E5E2EC; border-top: none; border-radius: 0 0 12px 12px; overflow: hidden; background: #fff; }}
  .email-frame iframe {{ width: 100%; height: 700px; display: block; border: none; }}
</style>
</head>
<body>
<div class="layout">

  <nav class="sidebar">
    <div class="sidebar-title">37 Digest Emails</div>
    <ul>{nav_items}</ul>
  </nav>

  <main class="main">
    {panels}
  </main>

</div>
<script>
  // Highlight active nav item based on scroll position
  const panels = document.querySelectorAll('.email-panel');
  const navItems = document.querySelectorAll('.nav-item');
  const main = document.querySelector('.main');
  main.addEventListener('scroll', () => {{
    let active = 0;
    panels.forEach((p, i) => {{
      if (p.offsetTop - main.scrollTop <= 100) active = i;
    }});
    navItems.forEach((n, i) => n.classList.toggle('active', i === active));
  }});
  navItems.forEach(n => n.addEventListener('click', e => {{
    e.preventDefault();
    const idx = parseInt(n.dataset.idx);
    panels[idx].scrollIntoView({{ behavior: 'smooth' }});
  }}));
</script>
</body>
</html>"""

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    print("Querying Supabase...")
    emails = []

    # ── Pre-birth ──────────────────────────────────────────────────────────────
    print("  Pre-birth...")
    pb_windows = get_prebirth_windows()
    pb_above   = pb_windows[:5]
    emails.append({
        "label":        "Pre-birth",
        "subject":      f"{CHILD_NAME} arrives in 18 days — your prep checklist",
        "html":         render_prebirth_email(pb_windows),
        "window_count": len(pb_windows),
        "above_fold":   pb_above,
    })

    # ── Months 1–36 ────────────────────────────────────────────────────────────
    for month in range(1, 37):
        age_weeks = month * 4.33
        print(f"  Month {month} ({age_weeks:.1f} weeks)...")
        windows     = get_windows_at_age(age_weeks)
        above_fold  = select_above_fold(windows, age_weeks)

        # Get-ready windows (opening in next 1–8 weeks)
        try:
            open_soon = get_ready_windows(age_weeks)
        except:
            open_soon = []

        # Subject
        closing = [w for w in above_fold if w["close_age_weeks"] - age_weeks <= 4]
        if closing:
            wl = round((closing[0]["close_age_weeks"] - age_weeks) * 7)
            if wl <= 0:   time_left = "closing now"
            elif wl < 14: time_left = f"{wl} day{'s' if wl!=1 else ''} left"
            else:         time_left = f"{round(wl/7)} week{'s' if round(wl/7)!=1 else ''} left"
            subject = f"{CHILD_NAME} at {month} month{'s' if month!=1 else ''} — {time_left} on {closing[0]['title'].lower()}"
        elif not above_fold:
            subject = f"{CHILD_NAME} at {month} month{'s' if month!=1 else ''} — you've done it all this month 🏆"
        else:
            subject = f"{CHILD_NAME} at {month} month{'s' if month!=1 else ''} — {len(above_fold)} things to know this month"

        emails.append({
            "label":        f"Month {month}",
            "subject":      subject,
            "html":         render_digest_email(month, above_fold, open_soon, len(windows)),
            "window_count": len(windows),
            "above_fold":   above_fold,
        })

    print("Generating HTML...")
    out_path = os.path.join(os.path.dirname(__file__), "../mockups/email-previews.html")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(build_navigator(emails))

    print(f"Done → {os.path.abspath(out_path)}")

if __name__ == "__main__":
    main()
