-- ─────────────────────────────────────────────────────────────────
-- Migration 002: FamilyForce Development Advisor — Milestones table
-- Run in: Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS milestones (
  id             TEXT        PRIMARY KEY,
  age_start      INTEGER     NOT NULL,
  age_end        INTEGER     NOT NULL,
  urgency        TEXT        NOT NULL DEFAULT 'normal'
                             CHECK (urgency IN ('critical', 'high', 'normal')),
  icon           TEXT        NOT NULL DEFAULT '📌',
  section        TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  body           TEXT        NOT NULL,
  family_moment  TEXT,
  todos          JSONB       NOT NULL DEFAULT '[]'::jsonb,
  playbook_key   TEXT,
  prenatal       BOOLEAN     NOT NULL DEFAULT FALSE,
  active         BOOLEAN     NOT NULL DEFAULT TRUE,
  sort_order     INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the primary query pattern: active milestones ordered by age_start
CREATE INDEX IF NOT EXISTS milestones_age_start_idx ON milestones (age_start) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS milestones_section_idx   ON milestones (section)   WHERE active = TRUE;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION milestones_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS milestones_updated_at ON milestones;
CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION milestones_set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────
-- Milestones are public read-only content (no user-specific data).
-- Only service_role (admin) can insert/update/delete.

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated) can read active milestones
CREATE POLICY "public_read_active_milestones"
  ON milestones FOR SELECT
  USING (active = TRUE);

-- Only authenticated service-role can write
-- (Supabase dashboard / admin scripts use service_role key)
CREATE POLICY "service_role_write"
  ON milestones FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
