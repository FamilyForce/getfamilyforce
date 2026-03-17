/* ═══════════════════════════════════════════════════════════════
   FamilyForce Scout — Dashboard Shared JS
   Loaded on every /scout-dashboard/* page.
   ═══════════════════════════════════════════════════════════════ */

;(function () {
  'use strict'

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

      sb.auth.getSession().then(function (res) {
        var session = res.data && res.data.session
        if (!session) {
          window.location.href = '/sign-in.html?redirect=' + encodeURIComponent(window.location.pathname)
          return
        }
        _user = session.user
        ScoutDash._initNav(pageName)
        ScoutDash._loadChild(function () {
          ScoutDash._loadSubscription(function () {
            ScoutDash._renderTrialBanner()
            fireReady()
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
          sb.from('family_members').select('owner_user_id').eq('member_user_id', _user.id)
            .then(function (fmRes) {
              var ownerIds = (fmRes.data || []).map(function (m) { return m.owner_user_id })
              if (ownerIds.length === 0) { finalize(ownChildren); return }

              sb.from('children').select('*').in('user_id', ownerIds).order('created_at')
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
      // Fetch all subscription rows for this user, then pick the one matching
      // the active child (child_id match), falling back to legacy rows (child_id null)
      sb.from('scout_subscriptions').select('*').eq('user_id', _user.id).then(function (res) {
        var rows = res.data || []
        // Prefer exact child_id match; fall back to null child_id (legacy/first-child rows)
        // Guard: _child may be null on library/settings pages with no child set up
        var match = (_child ? rows.find(function (r) { return r.child_id === _child.id }) : null)
                 || rows.find(function (r) { return !r.child_id })
                 || rows[0]
                 || null
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
      var end      = new Date(_sub.trial_end)
      var now      = new Date()
      var days     = Math.ceil((end - now) / 86400000)
      var dateStr  = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      var daysStr  = days > 0 ? days + ' day' + (days === 1 ? '' : 's') : 'today'
      var textEl   = banner.querySelector('.trial-banner-text')
      if (textEl) textEl.textContent = 'Free trial ends ' + dateStr + ' (' + daysStr + ')'
      // Check if user dismissed within last 24h
      var dismissKey = 'scout_trial_banner_dismissed'
      var dismissed  = localStorage.getItem(dismissKey)
      if (dismissed && (Date.now() - parseInt(dismissed)) < 86400000) return
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
      return Math.max(0, m)
    },

    weeksToMonths: function (w) { return Math.round(w / 4.33) },

    /* ── Window data ─────────────────────────────────────────── */
    loadWindows: function (childId, dob, cb) {
      var ageW      = ScoutDash.ageWeeks(dob)
      var lookahead = ageW + 8

      // NOTE: Promise.all([supabaseQuery, supabaseQuery]) is unreliable with Supabase JS v2
      // thenables (see commit 8bc0314). Use sequential .then() chaining instead.
      sb.from('milestone_windows')
        .select('*')
        .lte('open_age_weeks', lookahead)
        .gte('close_age_weeks', Math.max(0, ageW - 4))
        .order('open_age_weeks')
        .then(function (winRes) {
          var windows = winRes.data || []
          if (winRes.error) console.warn('[loadWindows] milestone_windows error:', winRes.error)

          sb.from('window_progress')
            .select('*')
            .eq('child_id', childId)
            .then(function (progRes) {
              var progress = progRes.data || []
              if (progRes.error) console.warn('[loadWindows] window_progress error:', progRes.error)

              // Build progress map: window_id → progress row
              var progMap = {}
              progress.forEach(function (p) { progMap[p.window_id] = p })
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

    sectionWindows: function (windows, ageW) {
      var closing  = []
      var thisMonth = []
      var comingUp  = []
      var done      = []

      windows.forEach(function (w) {
        var st = w._status
        if (st === 'completed' || st === 'skipped') { done.push(w); return }
        var isActive  = w.open_age_weeks <= ageW && w.close_age_weeks >= ageW
        var isClosing = isActive && (w.close_age_weeks - ageW) <= 4
        var isComing  = w.open_age_weeks > ageW && w.open_age_weeks <= ageW + 8
        var isMissed  = w.close_age_weeks < ageW && w.urgency === 'clinical' && st !== 'completed'

        if (isMissed)         { w._sectionTag = 'missed';  thisMonth.push(w) }
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
      sb.auth.getSession().then(function (res) {
        var tok = res.data && res.data.session && res.data.session.access_token
        if (!tok) return
        var remaining = []
        var sends = q.map(function (item) {
          return fetch(FUNCTIONS_URL + '/scout-progress', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
            body:    JSON.stringify(item),
          }).then(function (r) { return r.json() }).then(function (d) {
            if (!d.ok) remaining.push(item)
          }).catch(function () { remaining.push(item) })
        })
        Promise.all(sends).then(function () {
          localStorage.setItem(self._QUEUE_KEY, JSON.stringify(remaining))
          // if (remaining.length === 0 && q.length > 0) { /* flushed offline queue */ }
        })
      })
    },

    saveProgress: function (windowId, status, childId, completedDate, cb) {
      // completedDate is optional: pass null to use today (server default)
      if (typeof completedDate === 'function') { cb = completedDate; completedDate = null }
      var self = this
      var body = { windowId: windowId, childId: childId, status: status }
      if (completedDate) body.completedDate = completedDate

      if (!navigator.onLine) {
        // Queue for later, treat as optimistic success
        self._enqueue(body)
        if (typeof cb === 'function') cb(null, { ok: true, queued: true })
        return
      }

      var session = sb.auth.getSession()
      session.then(function (res) {
        var tok = res.data && res.data.session && res.data.session.access_token
        fetch(FUNCTIONS_URL + '/scout-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
          body: JSON.stringify(body),
        }).then(function (r) { return r.json() }).then(function (d) {
          if (typeof cb === 'function') cb(d.ok ? null : (d.error || 'Error'), d)
        }).catch(function () {
          // Network failure — queue it
          self._enqueue(body)
          if (typeof cb === 'function') cb(null, { ok: true, queued: true })
        })
      })
    },

    saveNote: function (windowId, notes, childId, cb) {
      sb.auth.getSession().then(function (res) {
        var tok = res.data && res.data.session && res.data.session.access_token
        fetch(FUNCTIONS_URL + '/scout-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
          body: JSON.stringify({ window_id: windowId, child_id: childId, notes: notes }),
        }).then(function (r) { return r.json() }).then(function (d) {
          if (typeof cb === 'function') cb(d.ok ? null : (d.error || 'Error'))
        }).catch(function (e) { if (typeof cb === 'function') cb(e.message) })
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
      if (w._sectionTag === 'missed') stateClass = 'state-missed-clinical'

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
        var noteDot = hasNote ? '<span class="note-dot"></span>' : ''
        noteHtml = '<button class="note-btn" data-note-toggle="' + w.id + '">📝 ' + (hasNote ? 'Note ' : 'Add note') + noteDot + '</button>' +
          '<div class="note-editor" id="noteEditor-' + w.id + '">' +
          '<textarea class="note-textarea" data-wid="' + w.id + '" maxlength="500" placeholder="e.g. Tried peanuts today — no reaction. Will repeat next week.">' +
          ScoutDash._esc(w._note || '') + '</textarea>' +
          '<div class="note-meta"><span class="note-char-count" id="noteCount-' + w.id + '">' + (w._note || '').length + ' / 500</span><span class="note-status" id="noteStatus-' + w.id + '"></span></div>' +
          '</div>'
      }

      var missedHtml = w._sectionTag === 'missed' ? '<p class="card-missed-label">⚠️ This window has closed.</p>' : ''

      // Date picker prompt (shown after marking done/in-progress)
      var datePromptHtml = (!isPreview && !isHistory)
        ? '<div class="date-prompt" id="datePrompt-' + w.id + '">' +
          '<span class="date-prompt-label">📅 When did this happen?</span>' +
          '<input type="date" class="date-prompt-input" id="dateInput-' + w.id + '" max="' + new Date().toISOString().split('T')[0] + '">' +
          '<button class="date-prompt-dismiss" data-dismiss-date="' + w.id + '">✕</button>' +
          '</div>'
        : ''

      // Attribution line (shown when progress has been set)
      var attrHtml = ''
      if (!isPreview && w._progress && w._status !== 'open') {
        var name = w._progress.updated_by_name || ''
        var date = w._progress.completed_date
          ? ScoutDash._fmtDate(w._progress.completed_date)
          : ''
        if (name || date) {
          attrHtml = '<p class="card-attribution">' +
            (name ? '<span class="card-attribution-name">' + ScoutDash._esc(name) + '</span>' : '') +
            (name && date ? ' · ' : '') +
            (date ? ScoutDash._esc(date) : '') +
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
        missedHtml +
        '<p class="card-title" data-modal-open="' + w.id + '">' + ScoutDash._esc(w.title) + '</p>' +
        '<p class="card-hook">' + ScoutDash._esc(hook) + '</p>' +
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
            if (err) { stat.className = 'note-status error'; stat.textContent = 'Could not save. Tap to retry.' }
            else     { stat.className = 'note-status saved'; stat.textContent = 'Saved' }
          }
          // Update lastSaved so closeModal flush knows this is already persisted
          var modalTA = document.getElementById('modalNoteTA')
          if (modalTA && modalTA.dataset.wid === wid) modalTA.dataset.lastSaved = text
        })
      }, true)
    },

    /* ── Action button interactions ──────────────────────────── */
    wireActions: function (childId, windowsRef, container) {
      container = container || document
      container.addEventListener('click', function (e) {
        // Dismiss date prompt
        var dismiss = e.target.closest('[data-dismiss-date]')
        if (dismiss) {
          var dp = document.getElementById('datePrompt-' + dismiss.dataset.dismissDate)
          if (dp) dp.classList.remove('show')
          return
        }

        var btn = e.target.closest('[data-action]')
        if (!btn) return
        var wid    = btn.dataset.wid
        var action = btn.dataset.action
        var card   = btn.closest('.window-card')
        var win    = windowsRef.find(function (w) { return w.id === wid })
        if (!win) return

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

        // Show date prompt for done/in-progress; hide for skip/open
        var prompt  = document.getElementById('datePrompt-' + wid)
        var dateInp = document.getElementById('dateInput-' + wid)
        if (prompt && dateInp) {
          if (newStatus === 'completed' || newStatus === 'in_progress') {
            dateInp.value = new Date().toISOString().split('T')[0]
            prompt.classList.add('show')
          } else {
            prompt.classList.remove('show')
          }
        }

        // If done/skipped: move to Done section after short delay
        if (newStatus === 'completed' || newStatus === 'skipped') {
          setTimeout(function () { ScoutDash._moveToDone(card, wid) }, 800)
        }

        // Persist (with today as default date)
        var selectedDate = (dateInp && dateInp.value) ? dateInp.value : null
        // In-flight indicator: briefly dim the card
        card.style.opacity = '0.6'
        card.style.pointerEvents = 'none'
        ScoutDash.saveProgress(wid, newStatus, childId, selectedDate, function (err, data) {
          card.style.opacity = ''
          card.style.pointerEvents = ''
          if (err) {
            ScoutDash.toast('Could not save. Please try again.', 'error')
            win._status = 'open'
            // Revert optimistic UI
            btns.forEach(function (b) { b.classList.remove('active-done', 'active-progress', 'active-skip') })
            card.classList.remove('state-in-progress', 'state-done', 'state-skipped')
          } else {
            // Store attribution data back on the window object
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

    _updateCardAttribution: function (card, name, dateStr) {
      var existing = card.querySelector('.card-attribution')
      var dateLabel = dateStr ? ScoutDash._fmtDate(dateStr) : ''
      var html = '<p class="card-attribution">' +
        (name ? '<span class="card-attribution-name">' + ScoutDash._esc(name) + '</span>' : '') +
        (name && dateLabel ? ' · ' : '') +
        (dateLabel ? ScoutDash._esc(dateLabel) : '') +
        '</p>'
      if (existing) {
        existing.outerHTML = html
      } else {
        card.insertAdjacentHTML('beforeend', html)
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
      // Active windows only (not "coming up" previews)
      var active     = windowsRef.filter(function (w) { return w._sectionTag !== 'coming' })
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
    },
  }

  // Run init
  ScoutDash._init()

})()
