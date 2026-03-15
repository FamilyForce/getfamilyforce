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
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON)
      window._supabaseClient = sb
      _toast = document.getElementById('toastContainer')

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
            if (typeof onReady === 'function') onReady(_user, _child, _sub)
          })
        })
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
      sb.from('children').select('*').eq('user_id', _user.id).order('created_at').then(function (res) {
        var children = res.data || []
        if (children.length === 0) {
          // No child — redirect to child setup (unless already on that page)
          if (!window.location.pathname.includes('/child')) {
            window.location.href = '/scout-dashboard/child.html'
          }
          return
        }
        // Pick saved child or first
        var found = children.find(function (c) { return c.id === savedId })
        _child = found || children[0]
        localStorage.setItem('scout_active_child_id', _child.id)
        ScoutDash._renderChildSelector(children)
        if (typeof cb === 'function') cb()
      })
    },

    _renderChildSelector: function (children) {
      var btn  = document.getElementById('childSelectorBtn')
      var list = document.getElementById('childDropdownList')
      var mobileChildName = document.getElementById('mobileChildName')
      if (btn) btn.textContent = _child.name + ' ▾'
      if (mobileChildName) mobileChildName.textContent = _child.name + ' ▾'
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
      // Child selector toggle
      var wrapper = document.getElementById('childSelectorWrap')
      if (btn && wrapper && list) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation()
          list.classList.toggle('open')
          wrapper.style.position = 'relative'
        })
        document.addEventListener('click', function () { list.classList.remove('open') })
      }
    },

    /* ── Subscription ────────────────────────────────────────── */
    _loadSubscription: function (cb) {
      sb.from('scout_subscriptions').select('*').eq('user_id', _user.id).maybeSingle().then(function (res) {
        _sub = res.data || null
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
      banner.style.display = 'flex'
      var closeBtn = banner.querySelector('.trial-banner-close')
      if (closeBtn) closeBtn.addEventListener('click', function () {
        banner.style.display = 'none'
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
      var ageW   = ScoutDash.ageWeeks(dob)
      var lookahead = ageW + 8

      // Load milestone windows + progress in parallel
      Promise.all([
        sb.from('milestone_windows')
          .select('*')
          .lte('open_age_weeks', lookahead)
          .gte('close_age_weeks', ageW - 4)  // include recently closed (for missed state)
          .order('open_age_weeks'),
        sb.from('window_progress')
          .select('*')
          .eq('child_id', childId)
      ]).then(function (results) {
        var windows  = results[0].data || []
        var progress = results[1].data || []
        // Build a progress map: window_id → {status, notes}
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
    saveProgress: function (windowId, status, childId, cb) {
      var session = sb.auth.getSession()
      session.then(function (res) {
        var tok = res.data && res.data.session && res.data.session.access_token
        fetch(FUNCTIONS_URL + '/scout-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
          body: JSON.stringify({ window_id: windowId, child_id: childId, status: status }),
        }).then(function (r) { return r.json() }).then(function (d) {
          if (typeof cb === 'function') cb(d.ok ? null : (d.error || 'Error'), d)
        }).catch(function (e) { if (typeof cb === 'function') cb(e.message) })
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
        actionsHtml + noteHtml +
        '</div>'
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
      // Char count + auto-save
      container.addEventListener('input', function (e) {
        if (!e.target.classList.contains('note-textarea')) return
        var wid   = e.target.dataset.wid
        var count = document.getElementById('noteCount-' + wid)
        var len   = e.target.value.length
        if (count) count.textContent = len + ' / 500'
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
        })
      }, true)
    },

    /* ── Action button interactions ──────────────────────────── */
    wireActions: function (childId, windowsRef, container) {
      container = container || document
      container.addEventListener('click', function (e) {
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

        // If done/skipped: move to Done section after short delay
        if (newStatus === 'completed' || newStatus === 'skipped') {
          setTimeout(function () { ScoutDash._moveToDone(card, wid) }, 600)
        }

        // Persist
        ScoutDash.saveProgress(wid, newStatus, childId, function (err) {
          if (err) {
            ScoutDash.toast('Could not save. Please try again.', 'error')
            win._status = 'open'  // revert
          }
          ScoutDash._updateProgressBar(windowsRef)
        })
      })
    },

    _moveToDone: function (card, wid) {
      var doneBody = document.getElementById('doneAccordionBody')
      if (!doneBody) return
      card.classList.add('state-done')
      doneBody.appendChild(card)
      // Update done count
      var countEl = document.getElementById('doneCount')
      if (countEl) countEl.textContent = doneBody.querySelectorAll('.window-card').length
    },

    _updateProgressBar: function (windowsRef) {
      var addressed = windowsRef.filter(function (w) { return w._status === 'completed' || w._status === 'skipped' }).length
      var total     = windowsRef.filter(function (w) { return w._status !== 'coming' }).length
      var pct       = total > 0 ? Math.round(addressed / total * 100) : 0
      var fill      = document.getElementById('progressFill')
      var label     = document.getElementById('progressLabel')
      if (fill)  fill.style.width = pct + '%'
      if (label) label.textContent = addressed + ' of ' + total + ' windows addressed this month'
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
      var closeBtn = document.getElementById('modalClose')
      if (closeBtn) closeBtn.addEventListener('click', ScoutDash.closeModal)

      // Keyboard ESC
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') ScoutDash.closeModal()
      })

      // Swipe down to close (mobile)
      var startY = 0
      var sheet  = overlay.querySelector('.modal-sheet')
      if (sheet) {
        sheet.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY }, { passive: true })
        sheet.addEventListener('touchend', function (e) {
          if (e.changedTouches[0].clientY - startY > 80) ScoutDash.closeModal()
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
      if (noteTA) { noteTA.value = win._note || ''; noteTA.dataset.wid = win.id }

      overlay.classList.add('open')
      overlay.removeAttribute('aria-hidden')
      var closeBtn = document.getElementById('modalClose')
      if (closeBtn) closeBtn.focus()
    },

    closeModal: function () {
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
  }

})()
