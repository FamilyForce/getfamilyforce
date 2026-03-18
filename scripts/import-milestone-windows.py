#!/usr/bin/env python3
"""
import-milestone-windows.py
===========================
Parses scout-milestone-set-v1.md (structured data) and
scout-content-priority1.md (prose content), joins them on slug,
and generates:
  - milestone_windows_import.sql  → INSERT statements for Supabase
  - milestone_windows_import.json → JSON array for programmatic use
  - import-report.txt             → summary + any rows with missing fields

Usage:
  python3 import-milestone-windows.py

Output files written to: projects/familyforce/scripts/output/

Dependencies: none (stdlib only)

Run order:
  1. Apply supabase-schema-scout-v2.sql first
  2. Run this script
  3. Paste milestone_windows_import.sql into Supabase SQL Editor → Run
  4. Verify with: select count(*) from milestone_windows;
     Expected: ~196 rows (192 standard + 4 prebirth)
"""

import re
import json
import os
import sys
from pathlib import Path

# ─── Paths ───────────────────────────────────────────────────────────────────
WORKSPACE = Path(__file__).parent.parent
MILESTONE_SET  = WORKSPACE / "docs" / "scout-milestone-set-v1.md"
CONTENT_FILE   = WORKSPACE / "docs" / "scout-content-priority1.md"
OUTPUT_DIR     = Path(__file__).parent / "output"
OUTPUT_SQL     = OUTPUT_DIR / "milestone_windows_import.sql"
OUTPUT_JSON    = OUTPUT_DIR / "milestone_windows_import.json"
OUTPUT_REPORT  = OUTPUT_DIR / "import-report.txt"

# ─── Category map: slug prefix → DB category value ────────────────────────────
CATEGORY_MAP = {
    "nutrition":  "nutrition",
    "motor":      "motor",
    "language":   "language",
    "cognitive":  "cognitive",
    "social":     "social",
    "screening":  "screening",
    "safety":     "safety",
    "prebirth":   "prebirth",
}

# ─── Post-v1 slugs: exclude from import (marked 🔜 in milestone set) ──────────
POST_V1_SLUGS = {
    "cognitive-conservation",
    "cognitive-logical-reasoning",
    "safety-helmet-use",
    "safety-booster-seat",
    "social-school-readiness-social",
}

# ─── Cross-reference map: secondary slug → primary slug ───────────────────────
# Content is written once under the primary slug.
# The secondary slug gets a copy of the same content at import time.
CROSS_REFS = {
    "social-social-smile-appears":   "language-social-smile",
    "social-joint-attention":        "language-joint-attention-pointing",
    "safety-swaddle-transition":     "motor-swaddle-stop",
}

# ─── Pre-birth slugs: in content file (from Task 1C) but not in milestone set ─
# This is expected — suppress the "not in milestone set" warning for these.
PREBIRTH_SLUGS = {
    "prebirth-safe-sleep-setup",
    "prebirth-hospital-bag",
    "prebirth-pediatrician-selection",
    "prebirth-newborn-screening",
}

# ─── Playbook link map: keywords in slug → playbook URL ───────────────────────
PLAYBOOK_MAP = {
    "sleep":        "https://getfamilyforce.com/playbook-sleep.html",
    "potty":        "https://getfamilyforce.com/playbook-potty-training.html",
    "feeding":      "https://getfamilyforce.com/playbook-feeding.html",
    "tantrum":      "https://getfamilyforce.com/playbook-tantrum.html",
    "screen-time":  "https://getfamilyforce.com/playbook-screen-time.html",  # use 'screen-time' not 'screen' to avoid matching 'newborn-screening'
    "breastfeed":   "https://getfamilyforce.com/playbook-feeding.html",
}


def escape_sql(s):
    """Escape single quotes for SQL string literals."""
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def slug_to_category(slug):
    """Extract category from slug prefix."""
    prefix = slug.split("-")[0]
    return CATEGORY_MAP.get(prefix, "safety")  # fallback to safety


def slug_to_playbook(slug):
    """Return playbook link if the slug implies one, else None."""
    for keyword, url in PLAYBOOK_MAP.items():
        if keyword in slug:
            return url
    return None


# ─── Step 1: Parse milestone set for structured fields ────────────────────────
def parse_milestone_set(path):
    """
    Parse scout-milestone-set-v1.md table rows.
    Returns dict: {slug: {open, peak, close, urgency, priority, title}}
    
    Table format (from file):
    | row | `slug` | Title | open | peak | close | urgency | priority |
    """
    print(f"Parsing milestone set: {path}")
    windows = {}
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Match table rows: | N | `slug` | Title | open | peak | close | urgency | priority |
    # Handle optional 🔜 suffix on slug
    row_pattern = re.compile(
        r'\|\s*\d+\s*\|\s*`([^`]+)`[^|]*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*(\w+)\s*\|\s*(\d)\s*\|'
    )
    
    for match in row_pattern.finditer(content):
        slug, title, open_w, peak_w, close_w, urgency, priority = match.groups()
        slug = slug.strip()
        # Skip post-v1 rows (contain 🔜 — already filtered by regex but double-check)
        windows[slug] = {
            "slug":            slug,
            "title":           title.strip(),
            "open_age_weeks":  int(open_w),
            "peak_age_weeks":  int(peak_w) if peak_w != "0" else None,
            "close_age_weeks": int(close_w),
            "urgency":         urgency.strip().lower(),
            "priority":        int(priority),
        }
    
    print(f"  Found {len(windows)} windows in milestone set")
    return windows


# ─── Step 2: Parse content file for prose fields ──────────────────────────────
def parse_content_file(path):
    """
    Parse scout-content-priority1.md.
    Returns dict: {slug: {why_it_matters, what_to_do, what_not_to_worry,
                          missed_window, source_citation}}
    
    Window blocks are delimited by: ## `slug`
    Sections within each block are marked with **Section name:**
    """
    print(f"Parsing content file: {path}")
    windows = {}
    
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Split on window headers: ## `slug`
    blocks = re.split(r'\n## `([^`]+)`\n', content)
    # blocks = [preamble, slug1, content1, slug2, content2, ...]
    
    for i in range(1, len(blocks), 2):
        slug = blocks[i].strip()
        body = blocks[i + 1] if i + 1 < len(blocks) else ""
        
        window = {"slug": slug}
        
        # Extract each prose section
        window["title"]           = extract_field(body, r'\*\*Title:\*\*\s*(.+?)(?=\n|\*\*)')
        window["why_it_matters"]  = extract_section(body, "Why it matters",  "What to do")
        window["what_to_do"]      = extract_section(body, "What to do",       "What not to worry about")
        window["what_not_to_worry"] = extract_section(body, "What not to worry about",
                                                        "Missed window guidance")
        window["missed_window"]   = extract_section(body, "Missed window guidance", "Source")
        window["source_citation"] = extract_field(body, r'\*\*Source:\*\*\s*(.+?)(?=\n\n|\n---|\Z)')
        
        # Extract urgency and priority from metadata line (fallback if not in set)
        urgency_match = re.search(r'\*\*Urgency:\*\*\s*(\w+)', body)
        priority_match = re.search(r'\*\*Priority:\*\*\s*(\d)', body)
        if urgency_match:
            window["urgency"] = urgency_match.group(1).strip().lower()
        if priority_match:
            window["priority"] = int(priority_match.group(1))
        
        # Extract open/peak/close from metadata line (fallback)
        open_match  = re.search(r'\*\*Open:\*\*\s*Week\s+(-?\d+)', body)
        peak_match  = re.search(r'\*\*Peak:\*\*\s*Week\s+(-?\d+)', body)
        close_match = re.search(r'\*\*Close:\*\*\s*Week\s+(-?\d+)', body)
        if open_match:
            window["open_age_weeks"] = int(open_match.group(1))
        if peak_match:
            window["peak_age_weeks"] = int(peak_match.group(1))
        if close_match:
            window["close_age_weeks"] = int(close_match.group(1))
        
        windows[slug] = window
    
    print(f"  Found {len(windows)} windows in content file")
    return windows


def extract_field(text, pattern):
    """Extract a single-line field using a regex pattern."""
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return None


def extract_section(text, start_header, end_header):
    """
    Extract the text between two **Header:** markers.
    Returns cleaned, trimmed string or None if not found.
    """
    pattern = re.compile(
        r'\*\*' + re.escape(start_header) + r':\*\*\s*(.*?)\s*(?=\*\*' + re.escape(end_header) + r':\*\*|\Z)',
        re.DOTALL
    )
    match = pattern.search(text)
    if match:
        raw = match.group(1).strip()
        # Remove trailing section headers that bled in
        raw = re.sub(r'\n\*\*\w[^:]+:\*\*.*$', '', raw, flags=re.DOTALL)
        return raw.strip() if raw else None
    return None


# ─── Step 3: Merge and validate ───────────────────────────────────────────────
def merge_and_validate(set_data, content_data):
    """
    Merge structured data (milestone set) with prose (content file).
    Milestone set takes precedence for numeric/controlled fields.
    Content file provides prose fields.
    """
    report_lines = []
    merged = []
    
    all_slugs = set(set_data.keys()) | set(content_data.keys())
    
    # Exclude post-v1 slugs
    all_slugs -= POST_V1_SLUGS
    
    for slug in sorted(all_slugs):
        s = set_data.get(slug, {})

        # Cross-reference: use primary slug's content if this is a secondary
        primary_slug = CROSS_REFS.get(slug, slug)
        c = content_data.get(primary_slug, content_data.get(slug, {}))

        # Merge: set_data wins for controlled fields; content_data provides prose
        window = {
            "slug":              slug,
            "title":             s.get("title") or c.get("title") or slug,
            "category":          slug_to_category(slug),
            "urgency":           s.get("urgency") or c.get("urgency") or "advisory",
            "open_age_weeks":    s.get("open_age_weeks", c.get("open_age_weeks", 0)),
            "peak_age_weeks":    s.get("peak_age_weeks") or c.get("peak_age_weeks"),
            "close_age_weeks":   s.get("close_age_weeks", c.get("close_age_weeks", 52)),
            "priority":          s.get("priority") or c.get("priority") or 3,
            "why_it_matters":    c.get("why_it_matters"),
            "what_to_do":        c.get("what_to_do"),
            "what_not_to_worry": c.get("what_not_to_worry"),
            "missed_window":     c.get("missed_window"),
            "source_citation":   c.get("source_citation"),
            "playbook_link":     slug_to_playbook(slug),
            "prenatal":          slug.startswith("prebirth"),
            "active":            True,
        }

        # For prebirth windows not in set_data, pull age fields from content
        if slug in PREBIRTH_SLUGS and not s:
            window["open_age_weeks"]  = c.get("open_age_weeks", -6)
            window["close_age_weeks"] = c.get("close_age_weeks", 0)

        # Validation — suppress expected warnings for known cases
        issues = []
        if not window["why_it_matters"]:
            issues.append("MISSING: why_it_matters")
        if not window["what_to_do"]:
            issues.append("MISSING: what_to_do")
        if slug not in set_data and slug not in PREBIRTH_SLUGS:
            issues.append("WARN: slug in content file only (not in milestone set)")
        if slug not in content_data and slug not in CROSS_REFS:
            issues.append("WARN: slug in milestone set only (no prose content)")

        if issues:
            report_lines.append(f"{slug}: {' | '.join(issues)}")

        merged.append(window)
    
    return merged, report_lines


# ─── Step 4: Generate SQL ─────────────────────────────────────────────────────
def generate_sql(windows):
    """Generate INSERT statements for milestone_windows."""
    lines = [
        "-- ═══════════════════════════════════════════════════════════════",
        "-- milestone_windows — data import",
        f"-- Generated by import-milestone-windows.py",
        f"-- Windows: {len(windows)}",
        "-- Run AFTER supabase-schema-scout-v2.sql",
        "-- ═══════════════════════════════════════════════════════════════",
        "",
        "-- Truncate first if re-running (safe during setup, not on live DB with FK refs)",
        "-- TRUNCATE milestone_windows CASCADE;",
        "",
        "INSERT INTO milestone_windows (",
        "  slug, title, category, urgency,",
        "  open_age_weeks, peak_age_weeks, close_age_weeks,",
        "  priority, why_it_matters, what_to_do,",
        "  what_not_to_worry, missed_window, source_citation,",
        "  playbook_link, prenatal, active",
        ") VALUES",
    ]
    
    value_rows = []
    for w in windows:
        peak = str(w["peak_age_weeks"]) if w["peak_age_weeks"] is not None else "NULL"
        row = (
            f"  ({escape_sql(w['slug'])}, {escape_sql(w['title'])}, "
            f"{escape_sql(w['category'])}, {escape_sql(w['urgency'])},\n"
            f"   {w['open_age_weeks']}, {peak}, {w['close_age_weeks']},\n"
            f"   {w['priority']}, {escape_sql(w['why_it_matters'])}, "
            f"{escape_sql(w['what_to_do'])},\n"
            f"   {escape_sql(w['what_not_to_worry'])}, "
            f"{escape_sql(w['missed_window'])}, "
            f"{escape_sql(w['source_citation'])},\n"
            f"   {escape_sql(w['playbook_link'])}, "
            f"{'TRUE' if w['prenatal'] else 'FALSE'}, "
            f"{'TRUE' if w['active'] else 'FALSE'})"
        )
        value_rows.append(row)
    
    lines.append(",\n".join(value_rows))
    lines.append("ON CONFLICT (slug) DO UPDATE SET")
    lines.append("  title             = EXCLUDED.title,")
    lines.append("  urgency           = EXCLUDED.urgency,")
    lines.append("  open_age_weeks    = EXCLUDED.open_age_weeks,")
    lines.append("  peak_age_weeks    = EXCLUDED.peak_age_weeks,")
    lines.append("  close_age_weeks   = EXCLUDED.close_age_weeks,")
    lines.append("  priority          = EXCLUDED.priority,")
    lines.append("  why_it_matters    = EXCLUDED.why_it_matters,")
    lines.append("  what_to_do        = EXCLUDED.what_to_do,")
    lines.append("  what_not_to_worry = EXCLUDED.what_not_to_worry,")
    lines.append("  missed_window     = EXCLUDED.missed_window,")
    lines.append("  source_citation   = EXCLUDED.source_citation,")
    lines.append("  playbook_link     = EXCLUDED.playbook_link,")
    lines.append("  active            = EXCLUDED.active,")
    lines.append("  updated_at        = now();")
    lines.append("")
    lines.append(f"-- Verify: SELECT count(*) FROM milestone_windows; -- Expected: ~{len(windows)}")
    lines.append("-- SELECT slug, title, priority FROM get_windows_for_age(26, 5);")
    
    return "\n".join(lines)


# ─── Step 5: Generate report ──────────────────────────────────────────────────
def generate_report(windows, issues):
    lines = [
        "MILESTONE WINDOWS IMPORT REPORT",
        "=" * 50,
        f"Total windows: {len(windows)}",
        f"Issues found:  {len(issues)}",
        "",
    ]
    
    # Count by category
    by_cat = {}
    for w in windows:
        by_cat[w["category"]] = by_cat.get(w["category"], 0) + 1
    lines.append("By category:")
    for cat, count in sorted(by_cat.items()):
        lines.append(f"  {cat:<20} {count}")
    lines.append("")
    
    # Count by priority
    by_pri = {}
    for w in windows:
        by_pri[w["priority"]] = by_pri.get(w["priority"], 0) + 1
    lines.append("By priority:")
    for pri in sorted(by_pri.keys()):
        lines.append(f"  Priority {pri}: {by_pri[pri]}")
    lines.append("")
    
    # Issues
    if issues:
        lines.append("Issues requiring review:")
        for issue in issues:
            lines.append(f"  {issue}")
    else:
        lines.append("No issues found. Ready to import.")
    
    return "\n".join(lines)


# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    if not MILESTONE_SET.exists():
        print(f"ERROR: Milestone set not found: {MILESTONE_SET}")
        sys.exit(1)
    if not CONTENT_FILE.exists():
        print(f"ERROR: Content file not found: {CONTENT_FILE}")
        sys.exit(1)
    
    # Parse both source files
    set_data     = parse_milestone_set(MILESTONE_SET)
    content_data = parse_content_file(CONTENT_FILE)
    
    # Merge and validate
    windows, issues = merge_and_validate(set_data, content_data)
    print(f"Merged: {len(windows)} windows, {len(issues)} issues")
    
    # Write SQL
    sql = generate_sql(windows)
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write(sql)
    print(f"SQL written to: {OUTPUT_SQL}")
    
    # Write JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(windows, f, indent=2, ensure_ascii=False)
    print(f"JSON written to: {OUTPUT_JSON}")
    
    # Write report
    report = generate_report(windows, issues)
    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"Report written to: {OUTPUT_REPORT}")
    print()
    print(report)


if __name__ == "__main__":
    main()
