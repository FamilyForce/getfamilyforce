/**
 * FamilyForce — Supabase Sync Layer  (ff-sync.js)
 * ──────────────────────────────────────────────────────────────
 * Strategy: localStorage is the primary store (fast, offline-safe).
 *           Supabase is an async sync layer — never blocks the UI.
 *
 * What gets synced:
 *   profiles        → user name + onboarded flag
 *   user_progress   → cert earned, chapters completed, full course state
 *
 * Public API (window.ffSync.*):
 *   onSignIn(session)                              — call from auth/callback.html
 *   saveProfile(userId, { name, onboarded_at })    — call from onboarding.html
 *   syncCert(userId, courseKey, completedArr)       — call when cert is earned
 *   syncState(userId, courseKey, state)             — call on saveState (debounced)
 *   syncProgressFromLocal(userId)                  — call from dashboard on load
 *   loadAndMerge(userId)                           — pull all remote → merge localStorage
 *
 * SQL tables required (run in Supabase SQL editor):
 *   See supabase-schema.sql
 * ──────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── Constants ── */
  const SUPABASE_URL  = 'https://ewjqbafaxeasyvknxmof.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDUyMDMsImV4cCI6MjA4ODYyMTIwM30.5_NCJP7r5BZSFXcA_WMBiK13vs5Q2bLVdcOZkzyvsWQ';

  /* Maps course keys (used in ff_progress / user_progress table) to localStorage SAVE_KEY */
  const COURSE_SAVE_KEYS = {
    'screen-time':    'ff_course_screentime_v1',
    'sleep-training': 'ff_course_sleep_v1',
    'tantrum':        'ff_course_tantrum_v1',
    'feeding':        'ff_course_feeding_v1',
    'potty-training': 'ff_course_potty_v1',
  };

  /* Per-course debounce timers for state sync */
  const _debounceTimers = {};

  /* ── Get Supabase client (reuse window._supabaseClient if already created) ── */
  function getSb() {
    if (window._supabaseClient) return window._supabaseClient;
    if (typeof supabase !== 'undefined') {
      window._supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    }
    return window._supabaseClient || null;
  }

  /* ── Get current session (returns null if not signed in) ── */
  async function getSession() {
    const sb = getSb();
    if (!sb) return null;
    try {
      const { data } = await sb.auth.getSession();
      return data?.session || null;
    } catch (_) { return null; }
  }

  /* ── Get current user ID (convenience helper) ── */
  async function getUserId() {
    const session = await getSession();
    return session?.user?.id || null;
  }

  /* ════════════════════════════════════════════════════════════
     PROFILES
     ════════════════════════════════════════════════════════════ */

  /**
   * Load profile row from Supabase.
   * Returns { id, name, onboarded_at, created_at } or null.
   */
  async function loadProfile(userId) {
    const sb = getSb();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('profiles')
        .select('id, name, onboarded_at')
        .eq('id', userId)
        .maybeSingle();
      if (error) { console.warn('[ffSync] loadProfile error:', error.message); return null; }
      return data;
    } catch (e) { return null; }
  }

  /**
   * Save (upsert) profile to Supabase.
   * Accepts { name?, onboarded_at? } — only provided keys are written.
   */
  async function saveProfile(userId, { name, onboarded_at } = {}) {
    const sb = getSb();
    if (!sb || !userId) return;
    const row = { id: userId };
    if (name         !== undefined) row.name          = name;
    if (onboarded_at !== undefined) row.onboarded_at  = onboarded_at;
    try {
      const { error } = await sb.from('profiles').upsert(row, { onConflict: 'id' });
      if (error) console.warn('[ffSync] saveProfile error:', error.message);
    } catch (_) {}
  }

  /* ════════════════════════════════════════════════════════════
     PROGRESS
     ════════════════════════════════════════════════════════════ */

  /**
   * Load all user_progress rows from Supabase.
   * Returns array of { course_key, chapters_completed, cert_earned, cert_earned_at, state_json }
   * or null on error.
   */
  async function loadProgress(userId) {
    const sb = getSb();
    if (!sb || !userId) return null;
    try {
      const { data, error } = await sb
        .from('user_progress')
        .select('course_key, chapters_completed, cert_earned, cert_earned_at, state_json')
        .eq('user_id', userId);
      if (error) { console.warn('[ffSync] loadProgress error:', error.message); return null; }
      return data;
    } catch (_) { return null; }
  }

  /**
   * Upsert a single user_progress row.
   * Only the fields you pass are written (partial update).
   */
  async function _upsertProgress(userId, courseKey, fields) {
    const sb = getSb();
    if (!sb || !userId) return;
    const row = {
      user_id:    userId,
      course_key: courseKey,
      updated_at: new Date().toISOString(),
      ...fields,
    };
    try {
      const { error } = await sb
        .from('user_progress')
        .upsert(row, { onConflict: 'user_id,course_key' });
      if (error) console.warn('[ffSync] upsertProgress error:', error.message);
    } catch (_) {}
  }

  /**
   * Sync cert earned + completed chapters to Supabase.
   * Call this immediately when a user earns a cert — it's the most important event.
   *
   * @param {string} userId
   * @param {string} courseKey  — e.g. 'screen-time'
   * @param {Array}  completedArr — STATE.completed (chapter IDs or indices)
   */
  async function syncCert(userId, courseKey, completedArr) {
    if (!userId) userId = await getUserId();
    if (!userId) return;
    await _upsertProgress(userId, courseKey, {
      cert_earned:        true,
      cert_earned_at:     new Date().toISOString(),
      chapters_completed: (completedArr || []).length,
    });
  }

  /**
   * Sync the full course STATE object to Supabase (debounced 4s).
   * Use this on every saveState() call — debounce prevents flooding.
   *
   * @param {string} userId
   * @param {string} courseKey
   * @param {Object} state    — the full STATE object
   */
  function syncState(userId, courseKey, state) {
    if (!userId) return;           // skip if not logged in
    if (_debounceTimers[courseKey]) clearTimeout(_debounceTimers[courseKey]);
    _debounceTimers[courseKey] = setTimeout(async function () {
      await _upsertProgress(userId, courseKey, {
        chapters_completed: (state.completed || []).length,
        state_json:         state,
      });
    }, 4000);
  }

  /**
   * Push ALL local progress to Supabase (call from dashboard on load, once per session).
   * Useful for backfilling Supabase when a user has localStorage data from before sync was enabled.
   */
  async function syncProgressFromLocal(userId) {
    if (!userId) userId = await getUserId();
    if (!userId) return;
    try {
      const ff = JSON.parse(localStorage.getItem('ff_progress') || '{}');
      for (const [key, data] of Object.entries(ff)) {
        if (!data) continue;
        const fields = {};
        if (data.cert === true) {
          fields.cert_earned    = true;
          fields.cert_earned_at = fields.cert_earned_at || new Date().toISOString();
        }
        // Also grab chapter count from course state if available
        const saveKey = COURSE_SAVE_KEYS[key];
        if (saveKey) {
          try {
            const courseState = JSON.parse(localStorage.getItem(saveKey) || 'null');
            if (courseState) {
              fields.chapters_completed = (courseState.completed || []).length;
              fields.state_json         = courseState;
            }
          } catch (_) {}
        }
        if (Object.keys(fields).length > 0) {
          await _upsertProgress(userId, key, fields);
        }
      }
    } catch (_) {}
  }

  /* ════════════════════════════════════════════════════════════
     MERGE — Remote → localStorage
     Remote always wins for cert (once earned = always earned).
     Remote course state only loads if local is empty (fresh device).
     ════════════════════════════════════════════════════════════ */

  /**
   * Merge remote progress rows into localStorage.
   * @param {Array} remoteRows — from loadProgress()
   */
  function mergeProgressIntoLocal(remoteRows) {
    if (!remoteRows || !remoteRows.length) return;
    try {
      const local = JSON.parse(localStorage.getItem('ff_progress') || '{}');
      let changed = false;

      for (const row of remoteRows) {
        const key = row.course_key;
        if (!local[key]) local[key] = {};

        /* Remote cert wins */
        if (row.cert_earned && !local[key].cert) {
          local[key].cert = true;
          changed = true;
        }

        /* Restore course state on a fresh device (no local state exists) */
        if (row.state_json) {
          const saveKey = COURSE_SAVE_KEYS[key];
          if (saveKey && !localStorage.getItem(saveKey)) {
            try { localStorage.setItem(saveKey, JSON.stringify(row.state_json)); } catch (_) {}
          }
        }
      }

      if (changed) localStorage.setItem('ff_progress', JSON.stringify(local));
    } catch (_) {}
  }

  /**
   * Merge remote profile into localStorage.
   * Remote name only fills in if local is empty (don't overwrite user's current name).
   */
  function mergeProfileIntoLocal(profile) {
    if (!profile) return;
    if (profile.name && !localStorage.getItem('ff_user_name')) {
      try { localStorage.setItem('ff_user_name', profile.name); } catch (_) {}
    }
    if (profile.onboarded_at && !localStorage.getItem('ff_onboarded')) {
      try { localStorage.setItem('ff_onboarded', '1'); } catch (_) {}
    }
  }

  /* ════════════════════════════════════════════════════════════
     ON SIGN-IN — full pull from Supabase → merge into localStorage
     Call this from auth/callback.html after confirming a valid session.
     ════════════════════════════════════════════════════════════ */

  /**
   * Full sync on sign-in: pull profile + progress → merge into localStorage.
   * @param {Object} session — Supabase session object
   */
  async function onSignIn(session) {
    if (!session?.user?.id) return;
    const userId = session.user.id;

    /* Store essentials from auth session */
    try {
      localStorage.setItem('ff_user_id',    userId);
      localStorage.setItem('ff_user_email', session.user.email || '');
    } catch (_) {}

    /* Pull profile and progress in parallel */
    const [profile, remoteProgress] = await Promise.all([
      loadProfile(userId),
      loadProgress(userId),
    ]);

    mergeProfileIntoLocal(profile);
    mergeProgressIntoLocal(remoteProgress);
  }

  /* ════════════════════════════════════════════════════════════
     EXPORT
     ════════════════════════════════════════════════════════════ */
  window.ffSync = {
    /* Core */
    getSb,
    getSession,
    getUserId,
    /* Profiles */
    loadProfile,
    saveProfile,
    mergeProfileIntoLocal,
    /* Progress */
    loadProgress,
    syncCert,
    syncState,
    syncProgressFromLocal,
    mergeProgressIntoLocal,
    /* Lifecycle */
    onSignIn,
    /* Reference */
    COURSE_SAVE_KEYS,
  };

})();
