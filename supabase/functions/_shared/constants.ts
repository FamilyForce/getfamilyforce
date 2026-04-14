// ═══════════════════════════════════════════════════════════════
// FamilyForce Scout — Shared Constants
// ═══════════════════════════════════════════════════════════════

// Pre-birth editorial window slugs — hardcoded because the
// scout_editorial_schedule check constraint only allows months 0–36,
// and month 0 is reserved for born newborns.
// If these slugs change, update here only.
export const PREBIRTH_SLUGS = [
  'prebirth-pediatrician-selection',
  'prebirth-hospital-bag',
  'prebirth-newborn-screening',
] as const
