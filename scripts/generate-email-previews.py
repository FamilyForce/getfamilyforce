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

# ── Render: single window card ────────────────────────────────────────────────
def render_window_card(w, age_weeks):
    cfg       = urgency_cfg(w.get("urgency", "advisory"))
    exc       = excerpt(w.get("why_it_matters", ""))
    act       = action_line(w.get("what_to_do", ""))
    badge     = weeks_left_badge(w, age_weeks)
    is_closing = w["close_age_weeks"] - age_weeks <= 4
    action_html = f"""
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:{C['terraTint']};border-radius:10px">
                    <tr>
                      <td style="padding:12px 16px">
                        <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;color:{C['terra']};text-transform:uppercase;letter-spacing:.1em;margin:0 0 5px">The move</p>
                        <p style="font-family:Arial,sans-serif;font-size:14px;color:{C['text']};margin:0;line-height:1.6">{act}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>""" if act else ""
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

# ── Intro text (mirrors email-digest.ts logic) ───────────────────────────────
def get_intro(age_months, child_name, above_fold, total_count):
    his = "her"   # using female pronouns for Olivia in mockup
    mo  = f"{age_months} month{'s' if age_months != 1 else ''}"

    opening = (
        f"{child_name} is {mo} old. This is her Scout digest for the month — "
        f"a quick look at what's worth your attention right now, written to take about 5 minutes to read."
    )

    if age_months <= 2:
        context = "The first few months are a blur. You're doing better than you think."
    elif age_months <= 6:
        context = f"{age_months} months in. The fog is starting to lift — and her development is picking up fast."
    elif age_months <= 12:
        context = f"{child_name} is in one of the most active developmental stretches of the whole first year."
    else:
        context = f"Month {age_months}. Every month has something new — here's what to know this one."

    return opening, context


# ── Render: full digest email ─────────────────────────────────────────────────
def render_digest_email(age_months, above_fold, get_ready, total_count):
    age_weeks  = age_months * 4.33
    closing    = [w for w in above_fold if w["close_age_weeks"] - age_weeks <= 4]
    open_wins  = [w for w in above_fold if w["close_age_weeks"] - age_weeks > 4]

    opening_para, context_line = get_intro(age_months, CHILD_NAME, above_fold, total_count)

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

      <!-- CTA -->
      <tr><td align="center" style="padding:8px 0 32px">
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
