/* ═══════════════════════════════════════════════════════════════
   FamilyForce Scout — Dashboard Shared JS
   Loaded on every /scout-dashboard/* page.
   ═══════════════════════════════════════════════════════════════ */

;(function () {
  'use strict'

  /* ── localStorage key migration (one-time, runs on every load) ──
     Renamed Apr 2026:
       scout_referral_code → ff_inbound_referral  (code that referred you)
       ff_referral_code    → ff_own_referral       (your code to share)
     Migrates any existing values silently so returning users aren't affected. */
  ;(function migrateLsKeys() {
    var migrations = [
      ['scout_referral_code', 'ff_inbound_referral'],
      ['ff_referral_code',    'ff_own_referral'],
    ]
    migrations.forEach(function(m) {
      var old = m[0], next = m[1]
      var val = localStorage.getItem(old)
      if (val && !localStorage.getItem(next)) {
        localStorage.setItem(next, val)
      }
      if (val) localStorage.removeItem(old)
    })
  })()

  /* ── Config ───────────────────────────────────────────────── */
  var SUPABASE_URL  = 'https://ewjqbafaxeasyvknxmof.supabase.co'
  var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3anFiYWZheGVhc3l2a254bW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNDUyMDMsImV4cCI6MjA4ODYyMTIwM30.5_NCJP7r5BZSFXcA_WMBiK13vs5Q2bLVdcOZkzyvsWQ'
  var FUNCTIONS_URL = SUPABASE_URL + '/functions/v1'
  var SITE_URL      = 'https://getfamilyforce.com'

  /* ── Globals ──────────────────────────────────────────────── */
  var sb      = null   // supabase client
  var _user   = null   // current auth user
  var _child  = null   // active child object
  var _sub    = null   // scout_subscriptions row
  var _toast  = null   // toast container element
  var _token  = null   // cached access token — kept fresh by onAuthStateChange

  /* ── Init ─────────────────────────────────────────────────── */
  window.ScoutDash = {
    /* Call on every page DOMContentLoaded */
    init: function (pageName, onReady) {
      if (!window.supabase) {
        console.error('[ScoutDash] Supabase JS not loaded — retrying in 500ms')
        setTimeout(function () { ScoutDash.init(pageName, onReady) }, 500)
        return
      }
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
      window._supabaseClient = sb
      _toast = document.getElementById('toastContainer')

      var _readyFired = false
      function fireReady() {
        if (_readyFired) return
        _readyFired = true
        if (typeof onReady === 'function') onReady(_user, _child, _sub)
      }

      // Safety net: if the Supabase chain hangs for >10s, fire onReady anyway
      setTimeout(function () {
        if (!_readyFired) {
          console.warn('[ScoutDash] init timed out — firing onReady with partial data')
          fireReady()
        }
      }, 10000)

      // Keep _token fresh across refreshes — used by saveNote/saveProgress
      sb.auth.onAuthStateChange(function (event, session) {
        _token = session ? session.access_token : null
      })

      sb.auth.getSession().then(function (res) {
        var session = res.data && res.data.session
        if (!session) {
          window.location.href = '/sign-in.html?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
        _token = session.access_token
        _user  = session.user

        // Clear stale localStorage if a different user was previously active
        try {
          var _prevUid = localStorage.getItem('ff_user_id')
          if (_prevUid && _prevUid !== _user.id) {
            ['ff_progress','ff_user_name','ff_onboarded',
             'ff_course_screentime_v1','ff_course_sleep_v1','ff_course_tantrum_v1',
             'ff_course_feeding_v1','ff_course_potty_v1'].forEach(function (k) {
              localStorage.removeItem(k)
            })
          }
          localStorage.setItem('ff_user_id', _user.id)
        } catch (_) {}

        ScoutDash._initNav(pageName)

        // Load profile name and always refresh ff_user_name from DB so changes
        // made on other devices stay in sync. Settings also writes locally.
        var sb2 = window._supabaseClient
        sb2.from('profiles').select('name').eq('id', _user.id).maybeSingle().then(function (pRes) {
          var profileName = pRes.data && pRes.data.name && pRes.data.name.trim()
          if (profileName) localStorage.setItem('ff_user_name', profileName)
          ScoutDash._loadChild(function () {
            ScoutDash._loadSubscription(function () {
              ScoutDash._renderTrialBanner()
              fireReady()
            })
          })
        }).catch(function () {
          ScoutDash._loadChild(function () {
            ScoutDash._loadSubscription(function () {
              ScoutDash._renderTrialBanner()
              fireReady()
            })
          })
        })
      }, function (err) {
        console.error('[ScoutDash] getSession failed:', err)
        window.location.href = '/sign-in.html?redirect=' + encodeURIComponent(window.location.pathname)
      })
    },

    /* ── Navigation ─────────────────────────────────────────── */
    _initNav: function (pageName) {
      // Active state on sidebar and bottom nav
      document.querySelectorAll('[data-nav]').forEach(function (el) {
        if (el.dataset.nav === pageName) el.classList.add('active')
      })
      // Mobile child header child name
      var mobileChildName = document.getElementById('mobileChildName')
      // Will be populated after child loads
    },

    /* ── Child loading ───────────────────────────────────────── */
    _loadChild: function (cb) {
      var savedId = localStorage.getItem('scout_active_child_id')
      // Guard: Supabase v2 thenables can fire both .then() AND .catch() on the
      // same query in some edge cases (same bug as Promise.all — see commit 8bc0314).
      // finalize must only run once or the whole page renders twice.
      var _finalized = false

      function finalize(children) {
        if (_finalized) { console.warn('[Scout] _loadChild finalize called twice — ignoring duplicate'); return }
        _finalized = true
        if (children.length === 0) {
          var path = window.location.pathname
          // child.html handles its own setup flow — don't interrupt it
          if (path.includes('/child')) {
            if (typeof cb === 'function') cb()
            return
          }
          // All other pages (home, library, settings, history, family):
          // update the child selector to show "+ Add child" and let
          // each page's onReady handle the no-child empty state
          var btn = document.getElementById('childSelectorBtn')
          var pill = document.getElementById('mobileChildName')
          if (btn)  btn.textContent = '+ Add child'
          if (pill) pill.textContent = '+ Add child'
          if (typeof cb === 'function') cb()
          return
        }
        var found = children.find(function (c) { return c.id === savedId })
        _child = found || children[0]
        localStorage.setItem('scout_active_child_id', _child.id)
        ScoutDash._renderChildSelector(children)
        if (typeof cb === 'function') cb()
      }

      // Step 1: load own children (critical path)
      sb.from('children').select('*').eq('user_id', _user.id).order('created_at')
        .then(function (res) {
          var ownChildren = res.data || []

          // Step 2: try to load shared children via Family Circle (non-critical)
          // Query by child_id directly — set when invite is created
          sb.from('family_members').select('child_id').eq('member_user_id', _user.id).eq('status', 'active')
            .then(function (fmRes) {
              var childIds = (fmRes.data || []).map(function (m) { return m.child_id }).filter(Boolean)
              if (childIds.length === 0) { finalize(ownChildren); return }

              // Exclude any child already in ownChildren
              var ownIds = ownChildren.map(function (c) { return c.id })
              var sharedIds = childIds.filter(function (id) { return ownIds.indexOf(id) === -1 })
              if (sharedIds.length === 0) { finalize(ownChildren); return }

              sb.from('children').select('*').in('id', sharedIds).order('created_at')
                .then(function (r) {
                  finalize(ownChildren.concat(r.data || []))
                })
                .catch(function () { finalize(ownChildren) })
            })
            .catch(function () {
              // family_members query failed (RLS, missing table) — use own children
              finalize(ownChildren)
            })
        })
        .catch(function (e) {
          console.error('[_loadChild] children query failed:', e)
          finalize([])
        })
    },

    _renderChildSelector: function (children) {
      var btn  = document.getElementById('childSelectorBtn')
      var list = document.getElementById('childDropdownList')
      var mobileChildName = document.getElementById('mobileChildName')
      if (btn) btn.textContent = _child.name + ' ▾'
      if (mobileChildName) mobileChildName.textContent = _child.name + ' ▾'
      // Sidebar product label: "Mike's Scout"
      var productLabel = document.getElementById('sidebarProductLabel')
      if (productLabel) productLabel.textContent = _child.name + '\u2019s Scout'
      if (list) {
        list.innerHTML = ''
        children.forEach(function (c) {
          var item = document.createElement('div')
          item.className = 'child-dropdown-item' + (c.id === _child.id ? ' active' : '')
          item.textContent = c.name
          item.addEventListener('touchstart', function (e) { e.stopPropagation() }, { passive: true })
          item.addEventListener('click', function () {
            _child = c
            localStorage.setItem('scout_active_child_id', c.id)
            window.location.reload()
          })
          list.appendChild(item)
        })
        var addItem = document.createElement('div')
        addItem.className = 'child-dropdown-item add'
        addItem.textContent = '+ Add a child'
        addItem.addEventListener('touchstart', function (e) { e.stopPropagation() }, { passive: true })
        addItem.addEventListener('click', function () {
          window.location.href = '/scout-dashboard/child.html'
        })
        list.appendChild(addItem)
      }
      // Child selector toggle (sidebar — desktop)
      var wrapper = document.getElementById('childSelectorWrap')
      if (btn && wrapper && list) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation()
          list.classList.toggle('open')
          wrapper.style.position = 'relative'
        })
        document.addEventListener('click', function () { list.classList.remove('open') })
        document.addEventListener('touchstart', function () { list.classList.remove('open') }, { passive: true })
      }

      // Mobile child pill selector (phones/tablets — sidebar is hidden)
      var mobilePill   = document.getElementById('mobileChildName')
      var mobileHeader = document.getElementById('mobileChildHeader')
      if (mobilePill && mobileHeader) {
        // Create a dedicated mobile dropdown (separate from sidebar dropdown)
        var mobileDropdown = document.getElementById('mobileChildDropdown')
        if (!mobileDropdown) {
          mobileDropdown = document.createElement('div')
          mobileDropdown.id = 'mobileChildDropdown'
          mobileDropdown.className = 'child-dropdown'
          mobileDropdown.style.cssText = 'position:absolute;top:100%;left:12px;right:12px;min-width:auto;z-index:300'
          mobileHeader.style.position = 'relative'
          mobileHeader.appendChild(mobileDropdown)
        }
        // Populate mobile dropdown items
        mobileDropdown.innerHTML = ''
        children.forEach(function (c) {
          var item = document.createElement('div')
          item.className = 'child-dropdown-item' + (c.id === _child.id ? ' active' : '')
          item.textContent = c.name
          item.addEventListener('touchstart', function (e) { e.stopPropagation() }, { passive: true })
          item.addEventListener('click', function () {
            _child = c
            localStorage.setItem('scout_active_child_id', c.id)
            window.location.reload()
          })
          mobileDropdown.appendChild(item)
        })
        var addMobileItem = document.createElement('div')
        addMobileItem.className = 'child-dropdown-item add'
        addMobileItem.textContent = '+ Add a child'
        addMobileItem.addEventListener('touchstart', function (e) { e.stopPropagation() }, { passive: true })
        addMobileItem.addEventListener('click', function () {
          window.location.href = '/scout-dashboard/child.html'
        })
        mobileDropdown.appendChild(addMobileItem)
        // Wire toggle — but only if there are multiple children (no point if just one)
        mobilePill.style.cursor = 'pointer'
        mobilePill.addEventListener('click', function (e) {
          e.stopPropagation()
          mobileDropdown.classList.toggle('open')
        })
        document.addEventListener('click', function () { mobileDropdown.classList.remove('open') })
        document.addEventListener('touchstart', function () { mobileDropdown.classList.remove('open') }, { passive: true })
      }
    },

    /* ── Subscription ────────────────────────────────────────── */
    _loadSubscription: function (cb) {
      // Fetch all subscription rows for the subscription owner.
      // For family members, the subscription belongs to the child's owner (child.user_id),
      // not the logged-in user. Fall back to _user.id if child owner is unavailable.
      var subOwnerId = (_child && _child.user_id) ? _child.user_id : _user.id
      sb.from('scout_subscriptions').select('*').eq('user_id', subOwnerId).then(function (res) {
        var rows = res.data || []
        // Prefer exact child_id match; fall back to null child_id (legacy/first-child rows)
        // Guard: _child may be null on library/settings pages with no child set up
        // Prefer exact child_id match first.
        // Null child_id fallback is only used for trialing rows (pre-birth / first child before
        // child_id tracking). Active/paid subscriptions are always scoped to a specific child_id.
        var exactMatch = _child ? rows.find(function (r) { return r.child_id === _child.id }) : null
        var nullTrialingMatch = rows.find(function (r) { return !r.child_id && r.status === 'trialing' })
        var match = exactMatch || nullTrialingMatch || null
        _sub = match
        if (typeof cb === 'function') cb()
      }, function (err) {
        console.warn('[ScoutDash] _loadSubscription failed:', err)
        if (typeof cb === 'function') cb()
      })
    },

    _renderTrialBanner: function () {
      var banner = document.getElementById('trialBanner')
      if (!banner || !_sub) return
      if (_sub.status !== 'trialing') { banner.style.display = 'none'; return }

      // Expecting parents: trial hasn't started yet (trial_end is null until birth confirmed).
      // Hide the banner entirely — it's irrelevant until the baby arrives.
      if (!_sub.trial_end || (_child && _child.is_expecting)) { banner.style.display = 'none'; return }

      var end     = new Date(_sub.trial_end)
      var now     = new Date()
      var days    = Math.ceil((end - now) / 86400000)

      // Trial already ended — hide the banner. The paywall handles the expired-trial state.
      // Also catches "ended earlier today": days===0 but end < now (Math.ceil rounds same-day expiry to 0).
      if (days < 0 || (days === 0 && end < now)) { banner.style.display = 'none'; return }

      var dateStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      var daysStr = days === 0 ? 'today' : days + ' day' + (days === 1 ? '' : 's')

      // Check if user dismissed within last 24h
      var dismissKey = 'scout_trial_banner_dismissed'
      var dismissed  = localStorage.getItem(dismissKey)
      if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return

      // Use is_gift flag — no DB query needed
      var isGift  = !!(_sub && _sub.is_gift)
      var textEl  = banner.querySelector('.trial-banner-text')
      var subLink = banner.querySelector('.trial-banner-link')
      if (textEl) textEl.textContent = isGift
        ? 'Gift ends ' + dateStr + ' (' + daysStr + ')'
        : 'Free trial ends ' + dateStr + ' (' + daysStr + ')'
      if (subLink) subLink.style.display = isGift ? 'none' : ''
      banner.style.display = 'flex'
      var closeBtn = banner.querySelector('.trial-banner-close')
      if (closeBtn) closeBtn.addEventListener('click', function () {
        banner.style.display = 'none'
        localStorage.setItem(dismissKey, Date.now().toString())
      })
    },

    /* ── Age helpers ─────────────────────────────────────────── */
    ageWeeks: function (dob) {
      var born = new Date(dob + 'T00:00:00Z')
      var now  = new Date()
      return Math.floor((now - born) / (7 * 24 * 3600 * 1000))
    },

    ageMonths: function (dob) {
      var born = new Date(dob + 'T00:00:00Z')
      var now  = new Date()
      var m = (now.getUTCFullYear() - born.getUTCFullYear()) * 12 + (now.getUTCMonth() - born.getUTCMonth())
      if (now.getUTCDate() < born.getUTCDate()) m--  // birthday hasn't hit yet this month
      return Math.max(0, m)
    },

    weeksToMonths: function (w) { return Math.round(w / 4.33) },

    /* ── Window data ─────────────────────────────────────────── */
    loadWindows: function (childId, dob, cb) {
      var ageW        = ScoutDash.ageWeeks(dob)
      var lookahead   = ageW + 8
      var isExpecting = ageW < 0
      // For expecting parents (negative ageW), do NOT clamp the close floor to 0 —
      // prenatal windows have negative close_age_weeks and would be missed otherwise.
      var closeFloor  = isExpecting ? (ageW - 4) : Math.max(0, ageW - 4)

      // NOTE: Promise.all([supabaseQuery, supabaseQuery]) is unreliable with Supabase JS v2
      // thenables (see commit 8bc0314). Use sequential .then() chaining instead.
      var q = sb.from('milestone_windows')
        .select('*, prep_tip')
        .eq('window_type', 'milestone')
        .eq('prenatal', isExpecting)   // prenatal filter keeps pre/post-birth windows separate
        .lte('open_age_weeks', lookahead)
        .gte('close_age_weeks', closeFloor)
        .order('open_age_weeks')
      q
        .then(function (winRes) {
          var windows = winRes.data || []
          if (winRes.error) console.warn('[loadWindows] milestone_windows error:', winRes.error)

          sb.from('window_progress')
            .select('*')
            .eq('child_id', childId)
            .then(function (progRes) {
              var progress = progRes.data || []
              if (progRes.error) console.warn('[loadWindows] window_progress error:', progRes.error)

              // Build progress map: window_id → best progress row across all family members
              // Priority: completed = skipped > in_progress > open
              var STATUS_RANK = { completed: 3, skipped: 3, in_progress: 2, open: 1 }
              var progMap = {}
              progress.forEach(function (p) {
                var existing = progMap[p.window_id]
                if (!existing) {
                  progMap[p.window_id] = p
                } else {
                  var newRank = STATUS_RANK[p.status] || 0
                  var oldRank = STATUS_RANK[existing.status] || 0
                  if (newRank > oldRank) progMap[p.window_id] = p
                }
              })
              // Attach progress to each window
              windows.forEach(function (w) {
                w._progress = progMap[w.id] || null
                w._status   = w._progress ? w._progress.status : 'open'
                w._note     = w._progress ? (w._progress.notes || '') : ''
              })
              if (typeof cb === 'function') cb(windows, ageW)
            })
            .catch(function (e) {
              console.error('[loadWindows] window_progress fetch failed:', e)
              // Return windows without progress rather than failing entirely
              windows.forEach(function (w) { w._progress = null; w._status = 'open'; w._note = '' })
              if (typeof cb === 'function') cb(windows, ageW)
            })
        })
        .catch(function (e) {
          console.error('[loadWindows] milestone_windows fetch failed:', e)
          if (typeof cb === 'function') cb(null, ageW, e)
        })
    },

    loadReminders: function (ageW, cb) {
      var sb = this.getSb()
      if (!sb) { if (typeof cb === 'function') cb([]); return }
      var closeFloor = Math.max(0, ageW - 4)
      sb.from('milestone_windows')
        .select('id, slug, title, why_it_matters')
        .eq('window_type', 'reminder')
        .eq('active', true)
        .lte('open_age_weeks', ageW + 4)
        .gte('close_age_weeks', closeFloor)
        .order('open_age_weeks')
        .then(function (res) {
          if (typeof cb === 'function') cb(res.data || [])
        }, function () {
          if (typeof cb === 'function') cb([])
        })
    },

    sectionWindows: function (windows, ageW) {
      var closing  = []
      var thisMonth = []
      var comingUp  = []
      var done      = []

      windows.forEach(function (w) {
        var st = w._status
        if (st === 'completed' || st === 'skipped') { w._sectionTag = 'done'; done.push(w); return }
        var isActive  = w.open_age_weeks <= ageW && w.close_age_weeks >= ageW
        var isClosing = isActive && (w.close_age_weeks - ageW) <= 4
        var isComing  = w.open_age_weeks > ageW && w.open_age_weeks <= ageW + 8
        var isMissed  = w.close_age_weeks < ageW && w.urgency === 'clinical' && st !== 'completed'
        // in_progress windows that have aged out: always keep visible with elevated urgency
        // regardless of urgency tier — stays until user marks done or skip
        var isOverdue = w.close_age_weeks < ageW && st === 'in_progress'

        if (isOverdue)        { w._sectionTag = 'overdue'; closing.push(w) }
        else if (isMissed)    { w._sectionTag = 'missed';  thisMonth.push(w) }
        else if (isClosing)   { w._sectionTag = 'closing'; closing.push(w) }
        else if (isActive)    { w._sectionTag = 'month';   thisMonth.push(w) }
        else if (isComing)    { w._sectionTag = 'coming';  comingUp.push(w) }
      })

      return { closing: closing, thisMonth: thisMonth, comingUp: comingUp, done: done }
    },

    /* ── Progress save ───────────────────────────────────────── */
    /* ── Offline queue ───────────────────────────────────────── */
    // Progress saves that failed while offline are queued in localStorage
    // and flushed automatically when the connection is restored.
    _QUEUE_KEY: 'scout_progress_queue',

    _enqueue: function (payload) {
      var q = JSON.parse(localStorage.getItem(this._QUEUE_KEY) || '[]')
      payload._queuedAt = Date.now()
      q.push(payload)
      localStorage.setItem(this._QUEUE_KEY, JSON.stringify(q))
    },

    _flushQueue: function () {
      var self = this
      var q = JSON.parse(localStorage.getItem(self._QUEUE_KEY) || '[]')
      if (!q.length) return
      var remaining = []
      var sends = q.map(function (item) {
        return sb.functions.invoke('scout-progress', { body: item })
          .then(function (res) {
            var d = res.data
            if (!d || !d.ok) remaining.push(item)
          }).catch(function () { remaining.push(item) })
      })
      Promise.all(sends).then(function () {
        localStorage.setItem(self._QUEUE_KEY, JSON.stringify(remaining))
      })
    },

    saveProgress: function (windowId, status, childId, completedDate, cb) {
      // completedDate is optional: pass null to use today (server default)
      if (typeof completedDate === 'function') { cb = completedDate; completedDate = null }
      var self = this
      var body = { windowId: windowId, childId: childId, status: status }
      if (completedDate) body.completedDate = completedDate

      if (!navigator.onLine) {
        self._enqueue(body)
        if (typeof cb === 'function') cb(null, { ok: true, queued: true })
        return
      }

      sb.functions.invoke('scout-progress', { body: body })
        .then(function (res) {
          var d = res.data
          var err = res.error
          if (err) {
            self._enqueue(body)
            if (typeof cb === 'function') cb(null, { ok: true, queued: true })
            return
          }
          if (typeof cb === 'function') cb(d && d.ok ? null : ((d && d.error) || 'Error'), d)
        }).catch(function () {
          self._enqueue(body)
          if (typeof cb === 'function') cb(null, { ok: true, queued: true })
        })
    },

    saveNote: function (windowId, notes, childId, cb) {
      sb.functions.invoke('scout-progress', {
        body: { windowId: windowId, childId: childId, notes: notes },
      }).then(function (res) {
        var d = res.data
        var err = res.error
        if (err) {
          console.error('[Scout] saveNote invoke error:', err.message)
          if (typeof cb === 'function') cb(err.message)
          return
        }
        if (!d || !d.ok) console.error('[Scout] saveNote API error:', d && d.error)
        if (typeof cb === 'function') cb(d && d.ok ? null : ((d && d.error) || 'Error'))
      }).catch(function (e) {
        console.error('[Scout] saveNote failed:', e.message)
        if (typeof cb === 'function') cb(e.message)
      })
    },

    /* ── Card rendering ──────────────────────────────────────── */
    renderCard: function (w, opts) {
      opts = opts || {}
      var isPreview = opts.preview || false
      var isHistory = opts.history || false

      var urgencyClass = { advisory: 'badge-advisory', screening: 'badge-screening', clinical: 'badge-clinical' }
      var catLabel     = w.category ? (w.category.charAt(0).toUpperCase() + w.category.slice(1)) : ''
      var hook         = ScoutDash._hook(w.why_it_matters)
      var stateClass   = ''
      if (w._status === 'in_progress') stateClass = 'state-in-progress'
      else if (w._status === 'completed' || w._status === 'skipped') stateClass = 'state-done'
      else if (isPreview)  stateClass = 'state-coming'
      if (w._sectionTag === 'missed')   stateClass = 'state-missed-clinical'
      if (w._sectionTag === 'overdue')  stateClass = 'state-overdue'

      var actionsHtml = ''
      if (!isPreview && !isHistory) {
        var doneActive  = w._status === 'completed' ? 'active-done'     : ''
        var progActive  = w._status === 'in_progress' ? 'active-progress' : ''
        var skipActive  = w._status === 'skipped'     ? 'active-skip'     : ''
        actionsHtml = '<div class="card-actions">' +
          '<button class="action-btn ' + doneActive  + '" data-action="completed"  data-wid="' + w.id + '" aria-label="Mark ' + ScoutDash._esc(w.title) + ' as done">✓ Done</button>' +
          '<button class="action-btn ' + progActive  + '" data-action="in_progress" data-wid="' + w.id + '" aria-label="Mark ' + ScoutDash._esc(w.title) + ' as in progress">▶ In progress</button>' +
          '<button class="action-btn ' + skipActive  + '" data-action="skipped"    data-wid="' + w.id + '" aria-label="Skip ' + ScoutDash._esc(w.title) + '">– Skip</button>' +
          '</div>'
      }

      var noteHtml = ''
      if (!isPreview && !isHistory) {
        var hasNote = w._note && w._note.trim()
        if (hasNote) {
          // Show note text inline (2-line clamp) with an Edit button to open editor
          noteHtml =
            '<div class="note-inline" data-note-toggle="' + w.id + '">' +
            '<span class="note-inline-icon">📝</span>' +
            '<span class="note-inline-text">' + ScoutDash._esc(w._note) + '</span>' +
            '<button class="note-inline-edit" data-note-toggle="' + w.id + '" aria-label="Edit note">Edit</button>' +
            '</div>' +
            '<div class="note-editor" id="noteEditor-' + w.id + '">' +
            '<textarea class="note-textarea" data-wid="' + w.id + '" maxlength="500" placeholder="e.g. Tried peanuts today — no reaction. Will repeat next week.">' +
            ScoutDash._esc(w._note) + '</textarea>' +
            '<div class="note-meta"><span class="note-char-count" id="noteCount-' + w.id + '">' + w._note.length + ' / 500</span><span class="note-status" id="noteStatus-' + w.id + '"></span></div>' +
            '</div>'
        } else {
          // No note yet — show a subtle "Add note" button
          noteHtml =
            '<button class="note-btn" data-note-toggle="' + w.id + '">📝 Add note</button>' +
            '<div class="note-editor" id="noteEditor-' + w.id + '">' +
            '<textarea class="note-textarea" data-wid="' + w.id + '" maxlength="500" placeholder="e.g. Tried peanuts today — no reaction. Will repeat next week."></textarea>' +
            '<div class="note-meta"><span class="note-char-count" id="noteCount-' + w.id + '">0 / 500</span><span class="note-status" id="noteStatus-' + w.id + '"></span></div>' +
            '</div>'
        }
      }

      var prepHtml = ''
      if (isPreview && w.prep_tip) {
        prepHtml = '<div class="card-prep">' +
          '<div class="card-prep-label">How to prep</div>' +
          '<div class="card-prep-text">' + ScoutDash._esc(w.prep_tip) + '</div>' +
          '</div>'
      }

      var missedHtml  = w._sectionTag === 'missed'  ? '<p class="card-missed-label">This window has closed.</p>' : ''
      var overdueHtml = w._sectionTag === 'overdue' ? '<p class="card-overdue-label">⚠ Window closed — mark as done or skip.</p>' : ''

      // "The move" — shown when what_to_do is present and card is not history/preview
      var moveHtml = ''
      if (!isPreview && !isHistory && w.what_to_do && w.what_to_do.trim()) {
        var moveLine = w.what_to_do.split('\n')[0].replace(/^[-•·]\s*/, '').trim()
        if (moveLine) {
          moveHtml = '<div class="card-move">' +
            '<div class="card-move-label">The move</div>' +
            '<div class="card-move-text">' + ScoutDash._esc(moveLine) + '</div>' +
            '</div>'
        }
      }

      // Inline date edit strip — hidden until user taps "edit date" in attribution
      var datePromptHtml = (!isPreview && !isHistory)
        ? '<div class="date-prompt" id="datePrompt-' + w.id + '">' +
          '<span class="date-prompt-label">📅 Date done:</span>' +
          '<input type="date" class="date-prompt-input" id="dateInput-' + w.id + '" max="' + new Date().toISOString().split('T')[0] + '">' +
          '<button class="date-prompt-dismiss" data-dismiss-date="' + w.id + '">✕</button>' +
          '</div>'
        : ''

      // Attribution line (shown when progress has been set)
      var attrHtml = ''
      if (!isPreview && w._progress && w._status !== 'open') {
        var isMe = w._progress.updated_by_user_id && _user && w._progress.updated_by_user_id === _user.id
        var rawName = isMe
          ? (localStorage.getItem('ff_user_name') || w._progress.updated_by_name || '')
          : (w._progress.updated_by_name || '')
        // If name exactly matches the email prefix fallback (e.g. "jh.scholar1+209"),
        // or contains @, show "You" for own actions — avoids leaking raw email addresses
        var emailPrefix = _user && _user.email ? _user.email.split('@')[0] : null
        var looksLikeEmail = rawName && (rawName.indexOf('@') !== -1 || rawName === emailPrefix)
        var name = (isMe && looksLikeEmail) ? 'You' : rawName
        var date = w._progress.completed_date
          ? ScoutDash._fmtDate(w._progress.completed_date)
          : ''
        if (name || date) {
          attrHtml = '<p class="card-attribution">' +
            (name ? '<span class="card-attribution-name">' + ScoutDash._esc(name) + '</span>' : '') +
            (name && date ? ' · ' : '') +
            (date ? '<span class="card-attribution-date">' + ScoutDash._esc(date) + '</span>' : '') +
            (!isHistory ? ' · <button class="card-edit-date-btn" data-edit-date="' + w.id + '">edit date</button>' : '') +
            '</p>'
        }
      }

      return '<div class="window-card ' + stateClass + '" data-window-id="' + w.id + '">' +
        '<div class="card-header">' +
        '<div class="card-badges">' +
        '<span class="badge ' + (urgencyClass[w.urgency] || 'badge-advisory') + '">' + ScoutDash._esc(w.urgency || 'advisory') + '</span>' +
        (catLabel ? '<span class="badge badge-category">' + ScoutDash._esc(catLabel) + '</span>' : '') +
        '</div>' +
        (!isHistory ? '<button class="card-expand" data-modal-open="' + w.id + '" aria-label="Open detail for ' + ScoutDash._esc(w.title) + '">↗</button>' : '') +
        '</div>' +
        missedHtml + overdueHtml +
        '<p class="card-title" data-modal-open="' + w.id + '">' + ScoutDash._esc(w.title) + '</p>' +
        '<p class="card-hook">' + ScoutDash._esc(hook) + '</p>' +
        moveHtml + prepHtml +
        actionsHtml + datePromptHtml + attrHtml + noteHtml +
        '</div>'
    },

    _fmtDate: function (dateStr) {
      if (!dateStr) return ''
      var d = new Date(dateStr + 'T00:00:00Z')
      if (isNaN(d.getTime())) return ''
      var now     = new Date()
      var diffMs  = now - d
      var diffDay = Math.floor(diffMs / 86400000)
      if (diffDay === 0) return 'today'
      if (diffDay === 1) return 'yesterday'
      if (diffDay < 7)   return diffDay + ' days ago'
      if (diffDay < 14)  return '1 week ago'
      if (diffDay < 30)  return Math.floor(diffDay / 7) + ' weeks ago'
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    },

    _hook: function (text) {
      if (!text) return ''
      var first = text.split('.')[0]
      var words = first.trim().split(/\s+/)
      return (words.length > 15 ? words.slice(0, 15).join(' ') + '…' : first.trim())
    },

    _esc: function (s) {
      if (!s) return ''
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
    },

    /* ── Note interactions ───────────────────────────────────── */
    wireNotes: function (childId, container) {
      container = container || document
      // Toggle note editors
      container.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-note-toggle]')
        if (!btn) return
        var wid = btn.dataset.noteToggle
        var ed  = document.getElementById('noteEditor-' + wid)
        if (ed) {
          ed.classList.toggle('open')
          // Hide the inline preview while editor is open; restore on close
          var preview = btn.closest('.note-inline') || document.querySelector('.note-inline[data-note-toggle="' + wid + '"]')
          if (preview) preview.style.display = ed.classList.contains('open') ? 'none' : 'flex'
          if (ed.classList.contains('open')) ed.querySelector('textarea').focus()
        }
      })
      // Char count + auto-grow + auto-save
      container.addEventListener('input', function (e) {
        if (!e.target.classList.contains('note-textarea')) return
        var wid   = e.target.dataset.wid
        var count = document.getElementById('noteCount-' + wid)
        var len   = e.target.value.length
        if (count) count.textContent = len + ' / 500'
        // Auto-grow textarea
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 240) + 'px'
      })
      container.addEventListener('blur', function (e) {
        if (!e.target.classList.contains('note-textarea')) return
        var wid   = e.target.dataset.wid
        var text  = e.target.value.trim()
        var stat  = document.getElementById('noteStatus-' + wid)
        if (stat) { stat.className = 'note-status saving'; stat.textContent = 'Saving…' }
        ScoutDash.saveNote(wid, text, childId, function (err) {
          if (stat) {
            if (err) {
              console.error('[Scout] saveNote failed:', err)
              stat.className = 'note-status error'
              stat.textContent = 'Could not save. Tap to retry.'
            } else {
              stat.className = 'note-status saved'
              stat.textContent = 'Saved'
            }
          }
          // Update lastSaved so closeModal flush knows this is already persisted
          var modalTA = document.getElementById('modalNoteTA')
          if (modalTA && modalTA.dataset.wid === wid) modalTA.dataset.lastSaved = text
          // Refresh inline note preview text on the card
          var preview = document.querySelector('.note-inline[data-note-toggle="' + wid + '"]')
          if (preview) {
            var previewText = preview.querySelector('.note-inline-text')
            if (previewText) previewText.textContent = text
          }
        })
      }, true)
    },

    /* ── Action button interactions ──────────────────────────── */
    wireActions: function (childId, windowsRef, container) {
      container = container || document
      container.addEventListener('click', function (e) {
        // Save date prompt — user confirmed date, now persist
        // "Edit date" button — show the inline date picker
        var editDate = e.target.closest('[data-edit-date]')
        if (editDate) {
          var ewid  = editDate.dataset.editDate
          var ewin  = windowsRef.find(function (w) { return w.id === ewid })
          var edp   = document.getElementById('datePrompt-' + ewid)
          var eInp  = document.getElementById('dateInput-' + ewid)
          if (edp && eInp) {
            eInp.value = (ewin && ewin._progress && ewin._progress.completed_date)
              ? ewin._progress.completed_date
              : new Date().toISOString().split('T')[0]
            edp.classList.add('show')
            eInp.focus()
          }
          return
        }

        // Dismiss inline date picker — just hide it (progress already saved)
        var dismiss = e.target.closest('[data-dismiss-date]')
        if (dismiss) {
          var dwid = dismiss.dataset.dismissDate
          var dp   = document.getElementById('datePrompt-' + dwid)
          if (dp) dp.classList.remove('show')
          return
        }

        var btn = e.target.closest('[data-action]')
        if (!btn) return
        var card = btn.closest('.window-card')
        if (!card) return  // ignore modal action buttons — handled by wireModalActions
        var wid    = btn.dataset.wid
        var action = btn.dataset.action
        var win    = windowsRef.find(function (w) { return w.id === wid })
        if (!win) return

        // Block lower-rank actions when a family member already has a higher status
        var STATUS_RANK = { completed: 3, skipped: 3, in_progress: 2, open: 1 }
        var existingRank = STATUS_RANK[win._status] || 0
        var actionRank   = STATUS_RANK[action] || 0
        var markedByOther = win._progress && win._progress.updated_by_name &&
                            win._progress.updated_by_user_id && _user &&
                            win._progress.updated_by_user_id !== _user.id
        if (markedByOther && existingRank >= 3 && actionRank < 3) {
          ScoutDash.toast(win._progress.updated_by_name + ' already marked this done', 'info')
          return
        }

        // Toggle: if already active, revert to open
        var newStatus = (win._status === action) ? 'open' : action
        win._status = newStatus

        // Optimistic UI: update button classes
        var btns = card.querySelectorAll('[data-action]')
        btns.forEach(function (b) {
          b.classList.remove('active-done', 'active-progress', 'active-skip')
        })
        if (newStatus === 'completed')   btn.classList.add('active-done')
        if (newStatus === 'in_progress') btn.classList.add('active-progress')
        if (newStatus === 'skipped')     btn.classList.add('active-skip')

        // Update card state
        card.classList.remove('state-in-progress', 'state-done', 'state-skipped')
        if (newStatus === 'in_progress')  card.classList.add('state-in-progress')
        if (newStatus === 'completed' || newStatus === 'skipped') card.classList.add('state-done')

        // All statuses save immediately — no confirmation step
        // in_progress / skipped / reverted to open — save immediately, no date prompt
        if (newStatus === 'completed' || newStatus === 'skipped') {
          setTimeout(function () { ScoutDash._moveToDone(card, wid) }, 800)
        }
        card.style.opacity = '0.6'
        card.style.pointerEvents = 'none'
        ScoutDash.saveProgress(wid, newStatus, childId, null, function (err, data) {
          card.style.opacity = ''
          card.style.pointerEvents = ''
          if (err) {
            ScoutDash.toast('Could not save. Please try again.', 'error')
            win._status = 'open'
            btns.forEach(function (b) { b.classList.remove('active-done', 'active-progress', 'active-skip') })
            card.classList.remove('state-in-progress', 'state-done', 'state-skipped')
          } else {
            if (data && data.updatedByName) {
              if (!win._progress) win._progress = {}
              win._progress.updated_by_name = data.updatedByName
              win._progress.completed_date  = data.completedDate || null
              win._status = newStatus
              ScoutDash._updateCardAttribution(card, data.updatedByName, data.completedDate)
            }
          }
          ScoutDash._updateProgressBar(windowsRef)
        })
      })

      // Date prompt change: re-save with new date
      container.addEventListener('change', function (e) {
        if (!e.target.classList.contains('date-prompt-input')) return
        var wid = e.target.id.replace('dateInput-', '')
        var win = windowsRef.find(function (w) { return w.id === wid })
        if (!win || win._status === 'open') return
        var newDate = e.target.value
        ScoutDash.saveProgress(wid, win._status, childId, newDate, function (err, data) {
          if (err) { ScoutDash.toast('Could not save date.', 'error'); return }
          if (data && data.updatedByName) {
            if (!win._progress) win._progress = {}
            win._progress.completed_date = data.completedDate
            var card = document.querySelector('[data-window-id="' + wid + '"]')
            if (card) ScoutDash._updateCardAttribution(card, data.updatedByName, data.completedDate)
          }
        })
      })
    },

    _updateCardAttribution: function (card, name, dateStr, isHistory) {
      var existing  = card.querySelector('.card-attribution')
      var dateLabel = dateStr ? ScoutDash._fmtDate(dateStr) : ''
      var wid       = card.dataset.windowId || ''
      var html = '<p class="card-attribution">' +
        (name ? '<span class="card-attribution-name">' + ScoutDash._esc(name) + '</span>' : '') +
        (name && dateLabel ? ' · ' : '') +
        (dateLabel ? '<span class="card-attribution-date">' + ScoutDash._esc(dateLabel) + '</span>' : '') +
        (!isHistory && wid ? ' · <button class="card-edit-date-btn" data-edit-date="' + wid + '">edit date</button>' : '') +
        '</p>'
      if (existing) {
        existing.outerHTML = html
      } else {
        var dp = card.querySelector('.date-prompt')
        if (dp) dp.insertAdjacentHTML('beforebegin', html)
        else card.insertAdjacentHTML('beforeend', html)
      }
    },

    _moveToDone: function (card, wid) {
      var doneBody = document.getElementById('doneAccordionBody')
      if (!doneBody) return
      card.classList.add('state-done')
      doneBody.appendChild(card)
      // Auto-open the done section when first card arrives
      var doneHeader = document.getElementById('secHeader-done')
      if (doneHeader && doneHeader.classList.contains('section-collapsed')) {
        doneHeader.classList.remove('section-collapsed')
        localStorage.setItem('scout_section_done', '1')
      }
      // Update done count
      var countEl = document.getElementById('doneCount')
      if (countEl) countEl.textContent = doneBody.querySelectorAll('.window-card').length
    },

    _updateProgressBar: function (windowsRef) {
      // Only count windows that appear in a visible section (have a _sectionTag set)
      // This excludes ghost windows: recently closed, non-clinical, never shown in UI
      var active     = windowsRef.filter(function (w) { return w._sectionTag && w._sectionTag !== 'coming' })
      var total      = active.length
      var completed  = active.filter(function (w) { return w._status === 'completed' || w._status === 'skipped' }).length
      var inProgress = active.filter(function (w) { return w._status === 'in_progress' }).length
      var remaining  = total - completed - inProgress

      var pctDone = total > 0 ? (completed  / total * 100) : 0
      var pctProg = total > 0 ? (inProgress / total * 100) : 0

      var segGreen = document.getElementById('segGreen')
      var segAmber = document.getElementById('segAmber')
      var legend   = document.getElementById('progressLegend')

      if (segGreen) segGreen.style.width = pctDone + '%'
      if (segAmber) segAmber.style.width = pctProg + '%'

      if (legend) {
        legend.innerHTML =
          '<div class="progress-legend-item"><span class="progress-legend-dot green"></span>' +
          '<span class="progress-legend-count">' + completed + '</span> done</div>' +
          (inProgress > 0
            ? '<div class="progress-legend-item"><span class="progress-legend-dot amber"></span>' +
              '<span class="progress-legend-count">' + inProgress + '</span> in progress</div>'
            : '') +
          '<div class="progress-legend-item"><span class="progress-legend-dot grey"></span>' +
          '<span class="progress-legend-count">' + remaining + '</span> open</div>'
      }
    },

    /* ── Modal ───────────────────────────────────────────────── */
    wireModal: function (windowsRef) {
      var overlay = document.getElementById('windowModal')
      if (!overlay) return

      document.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-modal-open]')
        if (trigger) {
          var wid = trigger.dataset.modalOpen
          var win = windowsRef.find(function (w) { return w.id === wid })
          if (win) ScoutDash.openModal(win)
        }
      })

      // Close: X button, overlay click
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) ScoutDash.closeModal()
      })
      // Tag textarea with childId so closeModal can flush pending notes
      var ta = document.getElementById('modalNoteTA')
      if (ta) ta.dataset.childId = window._scoutChildId || ''
      var closeBtn = document.getElementById('modalClose')
      if (closeBtn) closeBtn.addEventListener('click', ScoutDash.closeModal)

      // Keyboard ESC
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') ScoutDash.closeModal()
      })

      // Swipe down to close (mobile) — with visual drag feedback
      var startY  = 0
      var dragging = false
      var sheet   = overlay.querySelector('.modal-sheet')
      if (sheet) {
        sheet.addEventListener('touchstart', function (e) {
          startY   = e.touches[0].clientY
          dragging = true
          sheet.style.transition = 'none'
        }, { passive: true })
        sheet.addEventListener('touchmove', function (e) {
          if (!dragging) return
          var delta = e.touches[0].clientY - startY
          if (delta > 0) sheet.style.transform = 'translateY(' + delta + 'px)'
        }, { passive: true })
        sheet.addEventListener('touchend', function (e) {
          dragging = false
          sheet.style.transition = ''
          var delta = e.changedTouches[0].clientY - startY
          if (delta > 80) {
            ScoutDash.closeModal()
          } else {
            sheet.style.transform = '' // snap back (CSS transition takes over)
          }
        }, { passive: true })
        sheet.addEventListener('touchcancel', function () {
          dragging = false
          sheet.style.transition = ''
          sheet.style.transform = ''
        }, { passive: true })
      }
    },

    openModal: function (win) {
      var overlay = document.getElementById('windowModal')
      if (!overlay) return

      // Update URL fragment
      history.pushState(null, '', '#window-' + win.id)

      // Set background inert
      document.getElementById('scoutLayout').setAttribute('inert', '')

      // Populate content
      var badges = document.getElementById('modalBadges')
      var urgencyClass = { advisory: 'badge-advisory', screening: 'badge-screening', clinical: 'badge-clinical' }
      var catLabel     = win.category ? (win.category.charAt(0).toUpperCase() + win.category.slice(1)) : ''
      if (badges) badges.innerHTML =
        '<span class="badge ' + (urgencyClass[win.urgency] || 'badge-advisory') + '">' + ScoutDash._esc(win.urgency) + '</span>' +
        (catLabel ? '<span class="badge badge-category">' + ScoutDash._esc(catLabel) + '</span>' : '')

      var el = function (id, txt) { var e = document.getElementById(id); if (e) e.textContent = txt || ''; }
      el('modalTitle', win.title)
      var openM  = ScoutDash.weeksToMonths(win.open_age_weeks)
      var closeM = ScoutDash.weeksToMonths(win.close_age_weeks)
      el('modalAge', 'Ages ' + openM + ' to ' + closeM + ' months (weeks ' + win.open_age_weeks + ' to ' + win.close_age_weeks + ')')
      el('modalWhy',     win.why_it_matters)
      el('modalWhat',    win.what_to_do)
      el('modalWorry',   win.what_not_to_worry)
      el('modalSource',  win.source_citation ? 'Source: ' + win.source_citation : '')
      el('modalMissedSection', '')

      var missedSec = document.getElementById('modalMissedSection')
      if (missedSec) {
        if (win._sectionTag === 'missed' && win.missed_window_guidance) {
          missedSec.style.display = 'block'
          var txt = missedSec.querySelector('.modal-body-text')
          if (txt) txt.textContent = win.missed_window_guidance
        } else { missedSec.style.display = 'none' }
      }

      var playbook = document.getElementById('modalPlaybook')
      if (playbook) {
        if (win.playbook_link) { playbook.href = win.playbook_link; playbook.style.display = 'block' }
        else { playbook.style.display = 'none' }
      }

      // Modal action buttons
      var doneBtn = document.getElementById('modalDone')
      var progBtn = document.getElementById('modalProg')
      var skipBtn = document.getElementById('modalSkip')
      if (doneBtn && progBtn && skipBtn) {
        doneBtn.classList.toggle('active-done',     win._status === 'completed')
        progBtn.classList.toggle('active-progress', win._status === 'in_progress')
        skipBtn.classList.toggle('active-skip',     win._status === 'skipped')
        ;[doneBtn, progBtn, skipBtn].forEach(function (b) {
          b.dataset.wid = win.id
        })
      }

      // Modal note
      var noteEl = document.getElementById('modalNoteText')
      var noteTA = document.getElementById('modalNoteTA')
      if (noteEl) noteEl.textContent = win._note || ''
      if (noteTA) { noteTA.value = win._note || ''; noteTA.dataset.wid = win.id; noteTA.dataset.lastSaved = win._note || '' }

      overlay.classList.add('open')
      overlay.removeAttribute('aria-hidden')
      // Tag textarea with childId so closeModal can flush pending notes
      var ta = document.getElementById('modalNoteTA')
      if (ta) ta.dataset.childId = window._scoutChildId || ''
      var closeBtn = document.getElementById('modalClose')
      if (closeBtn) closeBtn.focus()
    },

    closeModal: function () {
      // Flush any unsaved note before closing
      var ta  = document.getElementById('modalNoteTA')
      var wid = ta && ta.dataset.wid
      if (ta && wid && ta.dataset.childId && ta.value.trim() !== (ta.dataset.lastSaved || '')) {
        ScoutDash.saveNote(wid, ta.value.trim(), ta.dataset.childId, function () {})
        ta.dataset.lastSaved = ta.value.trim()
      }
      var overlay = document.getElementById('windowModal')
      if (!overlay) return
      overlay.classList.remove('open')
      overlay.setAttribute('aria-hidden', 'true')
      document.getElementById('scoutLayout').removeAttribute('inert')
      history.pushState(null, '', window.location.pathname)
    },

    /* ── Toast ───────────────────────────────────────────────── */
    toast: function (msg, type) {
      if (!_toast) _toast = document.getElementById('toastContainer')
      var t = document.createElement('div')
      t.className = 'toast' + (type ? ' ' + type : '')
      t.textContent = msg
      _toast.appendChild(t)
      requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add('show') }) })
      setTimeout(function () {
        t.classList.remove('show')
        setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t) }, 300)
      }, 2800)
    },

    /* ── Accessors ───────────────────────────────────────────── */
    getUser:  function () { return _user },
    getChild: function () { return _child },
    getSub:   function () { return _sub },
    getSb:    function () { return sb },

    /* ── IntersectionObserver — lazy card reveal ─────────────── */
    // Cards below the fold are rendered with opacity:0 and revealed on scroll.
    // Uses IntersectionObserver for performance; falls back gracefully.
    initLazyCards: function () {
      if (!('IntersectionObserver' in window)) return
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('card-visible')
            io.unobserve(entry.target)
          }
        })
      }, { rootMargin: '80px 0px', threshold: 0.01 })

      document.querySelectorAll('.window-card').forEach(function (card) {
        card.classList.add('card-lazy')
        io.observe(card)
      })
    },

    /* ── Init ────────────────────────────────────────────────── */
    _init: function () {
      var self = this
      // Flush any queued progress saves when coming back online
      window.addEventListener('online', function () {
        /* back online — flushing progress queue */
        self._flushQueue()
      })
      // Flush on load in case there are queued items from a previous session
      if (navigator.onLine) self._flushQueue()

      // Post-subscription modal init
      _initPostSubModal()
    },
  }

  // Run init
  ScoutDash._init()

  /* ── Modal helpers ────────────────────────────────────────── */
  function _showModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Prevent body scroll
    // Inert attribute (accessibility): exclude modal + toast containers so
    // toasts and overlays remain functional while the modal is open.
    document.querySelectorAll('body > *:not(#' + id + '):not(#toastContainer):not(#earnToast)').forEach(function(el) { el.inert = true; });
  }

  function _hideModal(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
    document.body.style.overflow = ''; // Restore body scroll
    document.querySelectorAll('body > *:not(#' + id + ')').forEach(function(el) { el.inert = false; });
  }

  /* ── Clipboard helpers ────────────────────────────────────── */
  // Fix #2: toast fires only after clipboard write confirms (or fallback runs).
  function _copyText(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(function() { if (onSuccess) onSuccess(); })
        .catch(function() { _fallbackCopy(text); if (onSuccess) onSuccess(); });
    } else {
      _fallbackCopy(text);
      if (onSuccess) onSuccess();
    }
  }

  function _fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(ta);
  }

  /* ── Post-subscription modal actions ──────────────────────── */

  // Resolve the referral link from 3 sources in order:
  //   1. #modalReferralLink element text (already populated)
  //   2. ff_own_referral in localStorage
  //   3. profiles.referral_code from Supabase (final fallback)
  // Calls onLink(link) once the link is resolved, or does nothing if unavailable.
  function _resolveModalLink(onLink) {
    var linkEl = document.getElementById('modalReferralLink');
    var link   = (linkEl && linkEl.textContent.trim()) || '';

    if (!link) {
      var code = localStorage.getItem('ff_own_referral');
      if (code) {
        link = 'https://getfamilyforce.com?via=' + code;
        if (linkEl) linkEl.textContent = link;
      }
    }

    if (link) { onLink(link); return; }

    // Final fallback: fetch from Supabase
    var client = sb || window._supabaseClient;
    if (!client) return;
    client.auth.getUser().then(function(res) {
      if (res.error || !res.data || !res.data.user) return;
      client.from('profiles').select('referral_code').eq('id', res.data.user.id).single()
        .then(function(result) {
          if (result.error || !result.data || !result.data.referral_code) return;
          var code = result.data.referral_code;
          localStorage.setItem('ff_own_referral', code);
          var resolvedLink = 'https://getfamilyforce.com?via=' + code;
          if (linkEl) linkEl.textContent = resolvedLink;
          onLink(resolvedLink);
        });
    });
  }

  window.copyModalLink = function(btn) {
    var btnEl    = btn || document.querySelector('#postSubModal button[onclick*="copyModalLink"]');
    var origText = btnEl ? btnEl.textContent : null;
    if (btnEl) { btnEl.textContent = 'Copying…'; btnEl.disabled = true; }

    _resolveModalLink(function(link) {
      _copyText(link, function() {
        if (btnEl) { btnEl.textContent = 'Copied ✓'; }
        setTimeout(function() {
          if (btnEl) { btnEl.textContent = origText; btnEl.disabled = false; }
        }, 2000);
        _logModalEvent('postsub_modal_copy_link');
      });
    });

    // If resolution fails, restore button after timeout
    setTimeout(function() {
      if (btnEl && btnEl.disabled) { btnEl.textContent = origText; btnEl.disabled = false; }
    }, 5000);
  };

  window.shareModalWhatsApp = function() {
    _resolveModalLink(function(link) {
      var msg = encodeURIComponent('Hey, thought of you. Scout sends one email a month about what developmental milestones are active for your baby right now. Super simple, actually useful. Free to try: ' + link);
      window.open('https://wa.me/?text=' + msg, '_blank');
      _logModalEvent('postsub_modal_whatsapp');
    });
  };

  window.skipPostSubModal = function() {
    _hideModal('postSubModal');
    _logModalEvent('postsub_modal_skip');
  };

  /* ── Post-sub modal init ─────────────────────────────────────── */
  // Called from ScoutDash._init after all other init is done.
  // If ff_own_referral isn't in localStorage yet (race condition at signup),
  // we fetch it from Supabase before deciding whether to show the modal.
  //
  // Fix #1: session flag is cleared only AFTER the modal successfully displays,
  // not upfront. If the DB fetch fails, ff_just_subscribed is preserved so the
  // next page load can retry — until ff_postsub_modal_shown is set.
  function _initPostSubModal() {
    var justSubscribed = sessionStorage.getItem('ff_just_subscribed') === '1';
    var modalShown     = localStorage.getItem('ff_postsub_modal_shown') === '1';

    if (!justSubscribed || modalShown) return;

    var referralCode = localStorage.getItem('ff_own_referral');

    if (referralCode) {
      _displayPostSubModal(referralCode);
    } else {
      // Race condition: fetch referral code from DB
      var client = sb || (window._supabaseClient);
      if (!client) return;
      client.auth.getUser().then(function(res) {
        if (res.error || !res.data || !res.data.user) return;
        client
          .from('profiles')
          .select('referral_code')
          .eq('id', res.data.user.id)
          .single()
          .then(function(result) {
            if (result.error || !result.data || !result.data.referral_code) return;
            var code = result.data.referral_code;
            localStorage.setItem('ff_own_referral', code);
            _displayPostSubModal(code);
          });
          // No .catch() needed — if fetch fails, ff_just_subscribed stays set
          // and the next dashboard load will retry automatically.
      });
    }
  }

  function _displayPostSubModal(referralCode) {
    var linkEl = document.getElementById('modalReferralLink');
    if (!linkEl) return; // Not on a page with the modal — retry on next load

    linkEl.textContent = 'https://getfamilyforce.com?via=' + referralCode;
    _showModal('postSubModal');

    // Clear session flag and mark modal as shown only after successful display
    sessionStorage.removeItem('ff_just_subscribed');
    localStorage.setItem('ff_postsub_modal_shown', '1');

    _logModalEvent('postsub_modal_view');
  }

  // Fix #3: expose a reset so the earn page can re-surface the referral modal.
  // Called by the earn page's "Share your link" button when the user hasn't
  // shared yet, giving them a second chance to see the modal.
  window.resetPostSubModal = function() {
    localStorage.removeItem('ff_postsub_modal_shown');
    var referralCode = localStorage.getItem('ff_own_referral');
    if (referralCode) {
      _displayPostSubModal(referralCode);
    } else {
      // Fetch from DB if not cached
      var client = sb || (window._supabaseClient);
      if (!client) return;
      client.auth.getUser().then(function(res) {
        if (res.error || !res.data || !res.data.user) return;
        client
          .from('profiles')
          .select('referral_code')
          .eq('id', res.data.user.id)
          .single()
          .then(function(result) {
            if (result.error || !result.data || !result.data.referral_code) return;
            localStorage.setItem('ff_own_referral', result.data.referral_code);
            _displayPostSubModal(result.data.referral_code);
          });
      });
    }
  };

  function _logModalEvent(eventName) {
    var client = sb || (window._supabaseClient);
    if (!client) return;
    client.auth.getUser().then(function(res) {
      if (res.error || !res.data || !res.data.user) return;
      client.from('scout_events').insert({
        user_id:    res.data.user.id,
        event_type: eventName,
        payload:    {}
      }).then(function() {}); // Fire and forget
    });
  }

})()
