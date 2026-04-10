#!/usr/bin/env python3
"""
update-windows-v3.py
====================
Parses scout-content-priority1-v3.md and generates SQL to bring
the Supabase milestone_windows table in sync with v3 content.

What this script does:
  1. Parses every window in v3 (slug, timing, prose sections)
  2. Generates UPDATE statements for all existing windows
  3. Generates an INSERT for the new screening-visit-1month window
  4. Soft-deletes the two removed duplicate windows:
       - motor-swaddle-stop       (content now lives in safety-swaddle-transition)
       - language-joint-attention-pointing  (content now lives in social-joint-attention)

Output:
  scripts/output/update-windows-v3.sql   → paste into Supabase SQL editor

Usage:
  python3 update-windows-v3.py

Run order:
  1. Run this script
  2. Review the output SQL (spot-check a few windows)
  3. Paste into Supabase SQL Editor → Run
  4. Verify: SELECT slug, updated_at FROM milestone_windows ORDER BY updated_at DESC LIMIT 20;
"""

import re
import os
from pathlib import Path
from datetime import datetime

# ─── Paths ────────────────────────────────────────────────────────────────────
WORKSPACE    = Path(__file__).parent.parent
V3_FILE      = WORKSPACE / "docs" / "scout-content-priority1-v3.md"
OUTPUT_DIR   = Path(__file__).parent / "output"
OUTPUT_SQL   = OUTPUT_DIR / "update-windows-v3.sql"

OUTPUT_DIR.mkdir(exist_ok=True)

# ─── Windows to soft-delete (removed as duplicates in v3) ────────────────────
SOFT_DELETE_SLUGS = {
    "motor-swaddle-stop",
    "language-joint-attention-pointing",
}

# ─── New windows to INSERT (not previously in DB) ────────────────────────────
NEW_SLUGS = {
    "screening-visit-1month",
}

# ─── Category map ─────────────────────────────────────────────────────────────
CATEGORY_MAP = {
    "nutrition":  "nutrition",
    "motor":      "motor",
    "language":   "language",
    "cognitive":  "cognitive",
    "social":     "social",
    "screening":  "screening",
    "safety":     "safety",
    "prebirth":   "prebirth",
    "self":       "social",   # self-help windows → social category
}


# ─── Helpers ──────────────────────────────────────────────────────────────────
def escape_sql(s):
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def slug_to_category(slug):
    prefix = slug.split("-")[0]
    return CATEGORY_MAP.get(prefix, "safety")


def extract_section(body, start_header, end_headers):
    """
    Extract text between **start_header:** and the next **end_header:** marker.
    end_headers is a list of possible next section names.
    """
    end_pattern = "|".join(re.escape(h) for h in end_headers)
    pattern = re.compile(
        r'\*\*' + re.escape(start_header) + r':\*\*\s*(.*?)\s*(?=\*\*(?:' + end_pattern + r'):\*\*|\Z)',
        re.DOTALL
    )
    match = pattern.search(body)
    if match:
        raw = match.group(1).strip()
        return raw if raw else None
    return None


def extract_timing(body, field):
    """Extract week number from timing metadata line."""
    patterns = {
        "open":  r'\*\*Starts around:\*\*\s*Week\s+(-?\d+)',
        "peak":  r'\*\*Peak:\*\*\s*Week\s+(-?\d+)',
        "close": r'\*\*Typically wraps up by:\*\*\s*Week\s+(-?\d+)',
    }
    match = re.search(patterns[field], body)
    return int(match.group(1)) if match else None


def extract_field(body, pattern):
    match = re.search(pattern, body, re.DOTALL)
    return match.group(1).strip() if match else None


# ─── Parse v3 ─────────────────────────────────────────────────────────────────
def parse_v3(path):
    print(f"Parsing {path.name}...")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split on window headers: ## `slug`
    blocks = re.split(r'\n## `([^`]+)`\n', content)
    # blocks = [preamble, slug1, body1, slug2, body2, ...]

    windows = {}
    for i in range(1, len(blocks), 2):
        slug = blocks[i].strip()
        body = blocks[i + 1] if i + 1 < len(blocks) else ""

        # Skip section-level headers that got caught (shouldn't happen but guard)
        if not slug or " " in slug:
            continue

        window = {
            "slug":     slug,
            "category": slug_to_category(slug),
        }

        # Title
        window["title"] = extract_field(body, r'\*\*Title:\*\*\s*(.+?)(?=\n)')

        # Timing
        window["open_age_weeks"]  = extract_timing(body, "open")
        window["peak_age_weeks"]  = extract_timing(body, "peak")
        window["close_age_weeks"] = extract_timing(body, "close")

        # Urgency and priority
        urg = extract_field(body, r'\*\*Urgency:\*\*\s*(\w+)')
        pri = extract_field(body, r'\*\*Priority:\*\*\s*(\d)')
        window["urgency"]  = urg.lower() if urg else "advisory"
        window["priority"] = int(pri) if pri else 3

        # Prose sections — all possible next-section names as terminators
        all_sections = [
            "Why it matters", "What to do", "What not to worry about",
            "If you're past this stage", "What to discuss with pediatrician",
            "Questions to ask", "Prep tip", "Source", "Playbook link"
        ]

        def next_sections(current):
            idx = all_sections.index(current)
            return all_sections[idx + 1:]

        window["why_it_matters"]    = extract_section(body, "Why it matters",    next_sections("Why it matters"))
        window["what_to_do"]        = extract_section(body, "What to do",         next_sections("What to do"))
        window["what_not_to_worry"] = extract_section(body, "What not to worry about", next_sections("What not to worry about"))

        # missed_window = "If you're past this stage" + "What to discuss with pediatrician" combined
        past  = extract_section(body, "If you're past this stage",          next_sections("If you're past this stage"))
        discuss = extract_section(body, "What to discuss with pediatrician", next_sections("What to discuss with pediatrician"))
        questions = extract_section(body, "Questions to ask",                next_sections("Questions to ask"))

        missed_parts = []
        if past:     missed_parts.append(past)
        if discuss:  missed_parts.append(discuss)
        if questions: missed_parts.append(questions)
        window["missed_window"] = "\n\n".join(missed_parts) if missed_parts else None

        # Source
        window["source_citation"] = extract_field(body, r'\*\*Source:\*\*\s*(.+?)(?=\n\n|\n---|\Z)')

        # Prenatal flag
        window["prenatal"] = slug.startswith("prebirth")

        windows[slug] = window

    print(f"  Parsed {len(windows)} windows")
    return windows


# ─── Generate SQL ─────────────────────────────────────────────────────────────
def generate_sql(windows):
    lines = []
    lines.append("-- ============================================================")
    lines.append("-- Scout milestone_windows — v3 update")
    lines.append(f"-- Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("-- Source: scout-content-priority1-v3.md")
    lines.append("--")
    lines.append("-- Run in Supabase SQL Editor.")
    lines.append("-- Verify after: SELECT slug, updated_at FROM milestone_windows")
    lines.append("--               ORDER BY updated_at DESC LIMIT 30;")
    lines.append("-- ============================================================")
    lines.append("")

    # 1. Soft-delete removed duplicates
    lines.append("-- ── 1. Soft-delete removed duplicate windows ─────────────────")
    for slug in sorted(SOFT_DELETE_SLUGS):
        lines.append(f"UPDATE milestone_windows SET active = false, updated_at = now()")
        lines.append(f"  WHERE slug = '{slug}';")
    lines.append("")

    # 2. UPDATE existing windows
    lines.append("-- ── 2. Update existing windows ───────────────────────────────")
    skipped = []
    updated = []

    for slug, w in sorted(windows.items()):
        if slug in NEW_SLUGS:
            continue  # handled in INSERT section

        # Build SET clause — only include fields that have values
        sets = []

        if w.get("title"):
            sets.append(f"  title             = {escape_sql(w['title'])}")
        if w.get("urgency"):
            sets.append(f"  urgency           = {escape_sql(w['urgency'])}")
        if w.get("priority") is not None:
            sets.append(f"  priority          = {w['priority']}")
        if w.get("open_age_weeks") is not None:
            sets.append(f"  open_age_weeks    = {w['open_age_weeks']}")
        if w.get("peak_age_weeks") is not None:
            sets.append(f"  peak_age_weeks    = {w['peak_age_weeks']}")
        if w.get("close_age_weeks") is not None:
            sets.append(f"  close_age_weeks   = {w['close_age_weeks']}")
        if w.get("why_it_matters"):
            sets.append(f"  why_it_matters    = {escape_sql(w['why_it_matters'])}")
        if w.get("what_to_do"):
            sets.append(f"  what_to_do        = {escape_sql(w['what_to_do'])}")
        if w.get("what_not_to_worry"):
            sets.append(f"  what_not_to_worry = {escape_sql(w['what_not_to_worry'])}")
        if w.get("missed_window"):
            sets.append(f"  missed_window     = {escape_sql(w['missed_window'])}")
        if w.get("source_citation"):
            sets.append(f"  source_citation   = {escape_sql(w['source_citation'])}")
        sets.append(f"  updated_at        = now()")

        if len(sets) < 3:
            skipped.append(slug)
            continue

        lines.append(f"-- {slug}")
        lines.append(f"UPDATE milestone_windows SET")
        lines.append(",\n".join(sets))
        lines.append(f"  WHERE slug = '{slug}';")
        lines.append("")
        updated.append(slug)

    # 3. INSERT new windows
    lines.append("-- ── 3. Insert new windows ────────────────────────────────────")
    for slug in sorted(NEW_SLUGS):
        w = windows.get(slug)
        if not w:
            lines.append(f"-- WARNING: {slug} not found in v3 — skipped")
            continue

        lines.append(f"-- INSERT: {slug}")
        lines.append("INSERT INTO milestone_windows (")
        lines.append("  slug, title, category, urgency, priority,")
        lines.append("  open_age_weeks, peak_age_weeks, close_age_weeks,")
        lines.append("  why_it_matters, what_to_do, what_not_to_worry,")
        lines.append("  missed_window, source_citation, prenatal, active")
        lines.append(") VALUES (")
        lines.append(f"  {escape_sql(slug)},")
        lines.append(f"  {escape_sql(w.get('title'))},")
        lines.append(f"  {escape_sql(w.get('category'))},")
        lines.append(f"  {escape_sql(w.get('urgency', 'advisory'))},")
        lines.append(f"  {w.get('priority', 1)},")
        lines.append(f"  {w.get('open_age_weeks', 4)},")
        peak = w.get('peak_age_weeks')
        lines.append(f"  {peak if peak is not None else 'NULL'},")
        lines.append(f"  {w.get('close_age_weeks', 8)},")
        lines.append(f"  {escape_sql(w.get('why_it_matters'))},")
        lines.append(f"  {escape_sql(w.get('what_to_do'))},")
        lines.append(f"  {escape_sql(w.get('what_not_to_worry'))},")
        lines.append(f"  {escape_sql(w.get('missed_window'))},")
        lines.append(f"  {escape_sql(w.get('source_citation'))},")
        lines.append(f"  {str(w.get('prenatal', False)).lower()},")
        lines.append(f"  true")
        lines.append(") ON CONFLICT (slug) DO UPDATE SET")
        lines.append(f"  title             = EXCLUDED.title,")
        lines.append(f"  why_it_matters    = EXCLUDED.why_it_matters,")
        lines.append(f"  what_to_do        = EXCLUDED.what_to_do,")
        lines.append(f"  what_not_to_worry = EXCLUDED.what_not_to_worry,")
        lines.append(f"  missed_window     = EXCLUDED.missed_window,")
        lines.append(f"  source_citation   = EXCLUDED.source_citation,")
        lines.append(f"  open_age_weeks    = EXCLUDED.open_age_weeks,")
        lines.append(f"  peak_age_weeks    = EXCLUDED.peak_age_weeks,")
        lines.append(f"  close_age_weeks   = EXCLUDED.close_age_weeks,")
        lines.append(f"  updated_at        = now();")
        lines.append("")

    # Summary comment
    lines.append("-- ── Summary ───────────────────────────────────────────────────")
    lines.append(f"-- Windows updated:      {len(updated)}")
    lines.append(f"-- Windows inserted:     {len(NEW_SLUGS)}")
    lines.append(f"-- Windows soft-deleted: {len(SOFT_DELETE_SLUGS)}")
    if skipped:
        lines.append(f"-- Windows skipped (insufficient data): {', '.join(skipped)}")
    lines.append("")
    lines.append("-- Verify:")
    lines.append("-- SELECT slug, title, open_age_weeks, close_age_weeks, updated_at")
    lines.append("-- FROM milestone_windows")
    lines.append("-- WHERE updated_at > now() - interval '1 hour'")
    lines.append("-- ORDER BY updated_at DESC;")

    return "\n".join(lines), len(updated), skipped


# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    windows = parse_v3(V3_FILE)
    sql, n_updated, skipped = generate_sql(windows)

    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write(sql)

    print(f"\n✅ SQL written to: {OUTPUT_SQL}")
    print(f"   Windows to update:       {n_updated}")
    print(f"   Windows to insert:       {len(NEW_SLUGS)}")
    print(f"   Windows to soft-delete:  {len(SOFT_DELETE_SLUGS)}")
    if skipped:
        print(f"   Skipped (no data):       {', '.join(skipped)}")
    print(f"\nNext steps:")
    print(f"  1. Open: scripts/output/update-windows-v3.sql")
    print(f"  2. Spot-check a few UPDATE blocks")
    print(f"  3. Paste into Supabase SQL Editor → Run")
    print(f"  4. Verify: SELECT slug, updated_at FROM milestone_windows ORDER BY updated_at DESC LIMIT 30;")
