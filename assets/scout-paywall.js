/**
 * FamilyForce Scout — Paywall Component
 * Self-contained module. Drop into scout-dashboard.html and call ScoutPaywall.init().
 *
 * Handles:
 *   - Trial banner (status = trialing, trial not yet expired)
 *   - Expired trial paywall card (status = trialing + trial_end passed)
 *   - Post-payment: remove paywall, show toast
 *
 * Dependencies: Stripe.js (loaded separately), Supabase client (window._supabaseClient)
 * Usage:
 *   ScoutPaywall.init({ trialEnd: '2026-04-14T00:00:00Z', status: 'trialing', childName: 'Oliver' })
 */

window.ScoutPaywall = (function () {

  var STRIPE_PK   = 'pk_live_51TAQTQIbsOmqAIBV8VA8gQdscdslvnT5xLC7sRvPaoy0W4dMhat9OnPaBJZFKn7iq4MorTbvjcPoTIYoxbn1ACnx00HJEpmwFH'
  var CONVERT_URL = 'https://ewjqbafaxeasyvknxmof.supabase.co/functions/v1/scout-convert'

  var stripeInstance = null
  var stripeCard     = null

  // ─── Inject CSS ────────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('scout-paywall-styles')) return
    var style = document.createElement('style')
    style.id  = 'scout-paywall-styles'
    style.textContent = `
      /* ── Trial banner ── */
      .scout-trial-banner {
        background: #EDE9FF;
        border-bottom: 1px solid #C4B5FD;
        padding: 10px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 13px;
        color: #3D2A9E;
        flex-wrap: wrap;
      }
      .scout-trial-banner strong { font-weight: 700; }
      .scout-trial-banner-btn {
        background: #6E4ED6;
        color: #fff;
        border: none;
        border-radius: 100px;
        padding: 6px 16px;
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
      }
      @media (hover: hover) { .scout-trial-banner-btn:hover { background: #5B3CC4; } }

      /* ── Paywall card ── */
      .scout-paywall-card {
        background: #FFFFFF;
        border: 1.5px solid #E5E2EC;
        border-radius: 16px;
        padding: 28px 24px;
        margin: 24px 0;
        position: relative;
        overflow: hidden;
      }
      .scout-paywall-blur {
        filter: blur(4px);
        pointer-events: none;
        user-select: none;
        opacity: 0.6;
        margin-bottom: 16px;
      }
      .scout-paywall-blur-item {
        height: 56px;
        background: #F5F3FF;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .scout-paywall-heading {
        font-family: var(--serif, 'Instrument Serif', serif);
        font-size: 22px;
        font-weight: 400;
        color: #1D1D1F;
        margin: 0 0 8px;
      }
      .scout-paywall-sub {
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 14px;
        color: #5C5960;
        margin: 0 0 20px;
        line-height: 1.6;
      }
      /* Annual plan button */
      .scout-paywall-btn-annual {
        display: block;
        width: 100%;
        background: #6E4ED6;
        color: #fff;
        border: none;
        border-radius: 100px;
        padding: 14px;
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 15px;
        font-weight: 700;
        cursor: pointer;
        margin-bottom: 10px;
        text-align: center;
      }
      @media (hover: hover) { .scout-paywall-btn-annual:hover { background: #5B3CC4; transform: translateY(-1px); } }
      .scout-paywall-btn-annual:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      /* Monthly plan button */
      .scout-paywall-btn-monthly {
        display: block;
        width: 100%;
        background: transparent;
        color: #6E4ED6;
        border: 1.5px solid #C4B5FD;
        border-radius: 100px;
        padding: 12px;
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 16px;
        text-align: center;
      }
      @media (hover: hover) { .scout-paywall-btn-monthly:hover { border-color: #6E4ED6; } }
      /* Stripe card input area */
      .scout-paywall-card-input {
        border: 1.5px solid #E5E2EC;
        border-radius: 10px;
        padding: 13px 16px;
        background: #FAFAFA;
        margin-bottom: 12px;
        transition: border-color 0.15s;
      }
      .scout-paywall-card-input.focused { border-color: #6E4ED6; }
      .scout-paywall-card-error {
        font-size: 11px;
        color: #DC2626;
        margin-bottom: 10px;
        display: none;
      }
      .scout-paywall-terms {
        font-size: 11px;
        color: #8A879A;
        text-align: center;
        line-height: 1.6;
        margin: 0;
      }
      /* Toast */
      .scout-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #1D1D1F;
        color: #fff;
        font-family: var(--sans, 'Outfit', sans-serif);
        font-size: 14px;
        font-weight: 500;
        padding: 12px 24px;
        border-radius: 100px;
        z-index: 9999;
        transition: transform 0.3s ease;
        white-space: nowrap;
      }
      .scout-toast.visible { transform: translateX(-50%) translateY(0); }
    `
    document.head.appendChild(style)
  }

  // ─── Days remaining until trial_end ────────────────────────────────────────
  function daysUntilTrialEnd(trialEnd) {
    var end  = new Date(trialEnd)
    var now  = new Date()
    var diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  // ─── Render trial banner ────────────────────────────────────────────────────
  function renderTrialBanner(daysLeft, container) {
    var banner = document.createElement('div')
    banner.className = 'scout-trial-banner'
    banner.id        = 'scout-trial-banner'

    var label = daysLeft <= 0
      ? '<strong>Your free trial has ended.</strong> Subscribe to keep your monthly digests.'
      : daysLeft === 1
      ? 'Free trial · <strong>ends tomorrow</strong> · Subscribe to keep going →'
      : `Free trial · <strong>${daysLeft} days left</strong> · Subscribe to keep going →`

    banner.innerHTML = `
      <span>${label}</span>
      <button class="scout-trial-banner-btn" onclick="ScoutPaywall.showPaywall()">Subscribe →</button>
    `
    container.insertBefore(banner, container.firstChild)
  }

  // ─── Render paywall card ────────────────────────────────────────────────────
  function renderPaywallCard(childName, targetEl) {
    var card = document.createElement('div')
    card.className = 'scout-paywall-card'
    card.id        = 'scout-paywall-card'

    card.innerHTML = `
      <div class="scout-paywall-blur" aria-hidden="true">
        <div class="scout-paywall-blur-item"></div>
        <div class="scout-paywall-blur-item" style="width:75%"></div>
      </div>
      <h2 class="scout-paywall-heading">${childName}'s next month is ready.</h2>
      <p class="scout-paywall-sub">Subscribe to unlock ${childName}'s coming-up windows and keep getting monthly digests.</p>

      <!-- Plan buttons — annual shown first, card input hidden until clicked -->
      <div id="paywall-plan-select">
        <button class="scout-paywall-btn-annual" onclick="ScoutPaywall.selectPlan('annual')">
          Continue with Annual — $49.99/year
        </button>
        <button class="scout-paywall-btn-monthly" onclick="ScoutPaywall.selectPlan('monthly')">
          Monthly instead — $9.99/month
        </button>
        <div id="paywall-promo-wrap" style="margin-top:8px">
          <button type="button" id="paywall-promo-toggle"
            onclick="ScoutPaywall.togglePromoInput()"
            style="background:none;border:none;font-family:var(--sans,'Outfit',sans-serif);font-size:12px;color:#8A879A;cursor:pointer;padding:4px 0;text-decoration:underline;text-underline-offset:2px">
            Have a promo code?
          </button>
          <div id="paywall-promo-field" style="display:none;margin-top:8px;display:none">
            <div style="display:flex;gap:8px;align-items:center">
              <input id="paywall-promo-input" type="text" placeholder="Enter code"
                autocomplete="off" autocapitalize="characters"
                oninput="this.value=this.value.toUpperCase()"
                style="flex:1;border:1.5px solid #E5E2EC;border-radius:10px;padding:10px 14px;font-family:var(--sans,'Outfit',sans-serif);font-size:14px;color:#1D1D1F;background:#FAFAFA;outline:none;box-sizing:border-box">
              <button type="button" id="paywall-promo-apply-btn"
                onclick="ScoutPaywall.applyPromoCode()"
                style="padding:10px 16px;background:var(--elevated,#F5F3FF);border:1.5px solid #C4B5FD;border-radius:10px;font-family:var(--sans,'Outfit',sans-serif);font-size:13px;font-weight:700;color:#6E4ED6;cursor:pointer;white-space:nowrap;flex-shrink:0">
                Apply
              </button>
            </div>
            <p id="paywall-promo-feedback" style="font-size:11px;margin-top:6px;display:none"></p>
          </div>
        </div>
      </div>

      <!-- Card input (shown after plan selected) -->
      <div id="paywall-payment-form" style="display:none">
        <p style="font-size:13px;color:#5C5960;margin:0 0 12px">
          <button onclick="ScoutPaywall.backToPlanSelect()" style="background:none;border:none;color:#6E4ED6;font-size:13px;cursor:pointer;padding:0">← Change plan</button>
        </p>
        <div id="paywall-card-section">
          <div id="paywall-name-wrap" style="margin-bottom:12px">
            <label style="font-size:12px;font-weight:600;color:#5C5960;display:block;margin-bottom:6px">Name on card</label>
            <input id="paywall-card-name" type="text" placeholder="Full name" autocomplete="cc-name"
              style="width:100%;box-sizing:border-box;border:1.5px solid #E5E2EC;border-radius:10px;padding:11px 14px;font-family:var(--sans,'Outfit',sans-serif);font-size:14px;color:#1D1D1F;background:#FAFAFA;outline:none">
          </div>
          <label style="font-size:12px;font-weight:600;color:#5C5960;display:block;margin-bottom:6px">Card details</label>
          <div id="paywall-stripe-element" class="scout-paywall-card-input"></div>
          <div id="paywall-card-error" class="scout-paywall-card-error"></div>
        </div>
        <button class="scout-paywall-btn-annual" id="paywall-submit-btn" onclick="ScoutPaywall.submitPayment()">
          Subscribe now →
        </button>
        <p class="scout-paywall-terms" id="paywall-terms-text">
          🔒 Secured by Stripe. Cancel any time. 30-day refund guarantee.<br>
          By continuing you agree to our <a href="/terms.html" style="color:#6E4ED6">Terms</a>.
        </p>
      </div>
    `

    targetEl.appendChild(card)
  }

  // ─── Mount Stripe card element ──────────────────────────────────────────────
  function mountStripeCard() {
    if (stripeCard) return
    if (!window.Stripe) { console.error('[ScoutPaywall] Stripe.js not loaded'); return }

    stripeInstance = Stripe(STRIPE_PK)
    var elements   = stripeInstance.elements()
    stripeCard     = elements.create('card', {
      style: {
        base: { fontFamily: "'Outfit', sans-serif", fontSize: '14px', color: '#1D1D1F', '::placeholder': { color: '#B0AEBC' } },
        invalid: { color: '#DC2626' },
      },
    })
    stripeCard.mount('#paywall-stripe-element')
    stripeCard.on('focus', function () { document.getElementById('paywall-stripe-element').classList.add('focused') })
    stripeCard.on('blur',  function () { document.getElementById('paywall-stripe-element').classList.remove('focused') })
    stripeCard.on('change', function (e) {
      var errEl = document.getElementById('paywall-card-error')
      if (errEl) { errEl.style.display = e.error ? 'block' : 'none'; if (e.error) errEl.textContent = e.error.message }
    })
  }

  // ─── Show toast ─────────────────────────────────────────────────────────────
  function showToast(message) {
    var toast = document.createElement('div')
    toast.className = 'scout-toast'
    toast.textContent = message
    document.body.appendChild(toast)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { toast.classList.add('visible') })
    })
    setTimeout(function () {
      toast.classList.remove('visible')
      setTimeout(function () { toast.remove() }, 400)
    }, 4000)
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  var _selectedPlan  = 'annual'
  var _childName     = 'your child'
  var _appliedPromo  = null  // { code, free } — set when a valid promo code is applied

  return {

    init: function (opts) {
      injectStyles()
      _childName = (opts && opts.childName) || 'your child'

      var status   = opts && opts.status
      var trialEnd = opts && opts.trialEnd

      if (status !== 'trialing' && status !== 'expired') return  // paid user — nothing to show

      var daysLeft  = trialEnd ? daysUntilTrialEnd(trialEnd) : -1
      var container = document.body

      // Always show the banner
      renderTrialBanner(daysLeft, container)

      // If trial expired, show paywall card in the "Coming Up" section
      if (daysLeft <= 0) {
        var comingUpSection = document.getElementById('coming-up-section')
        if (comingUpSection) {
          renderPaywallCard(_childName, comingUpSection)
        }
      }
    },

    showPaywall: function () {
      var existing = document.getElementById('scout-paywall-card')
      if (existing) { existing.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
      var target = document.getElementById('coming-up-section') || document.body
      renderPaywallCard(_childName, target)
      var card = document.getElementById('scout-paywall-card')
      if (card) setTimeout(function () { card.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 100)
    },

    togglePromoInput: function () {
      var field = document.getElementById('paywall-promo-field')
      if (!field) return
      var isHidden = field.style.display === 'none' || field.style.display === ''
      field.style.display = isHidden ? 'block' : 'none'
      if (isHidden) {
        var input = document.getElementById('paywall-promo-input')
        if (input) input.focus()
      }
    },

    applyPromoCode: function () {
      var input    = document.getElementById('paywall-promo-input')
      var feedback = document.getElementById('paywall-promo-feedback')
      var code     = (input ? input.value : '').trim().toUpperCase()
      if (!code) return

      if (code === 'SCOUT3FREE') {
        _appliedPromo = { code: code, free: true }
        _selectedPlan = 'triennial'

        // Update promo UI
        if (input) { input.disabled = true; input.style.borderColor = '#16A34A' }
        var applyBtn = document.getElementById('paywall-promo-apply-btn')
        if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = '✓' }
        if (feedback) {
          feedback.style.display = 'block'
          feedback.style.color   = '#166534'
          feedback.textContent   = '🎉 SCOUT3FREE applied — 3 years completely free!'
        }

        // Switch to the payment form, hide card (no charge needed)
        var planSelect  = document.getElementById('paywall-plan-select')
        var payForm     = document.getElementById('paywall-payment-form')
        var cardSection = document.getElementById('paywall-card-section')
        var submitBtn   = document.getElementById('paywall-submit-btn')
        var termsText   = document.getElementById('paywall-terms-text')
        if (planSelect)  planSelect.style.display  = 'none'
        if (payForm)     payForm.style.display     = 'block'
        if (cardSection) cardSection.style.display = 'none'
        if (submitBtn)   submitBtn.textContent     = 'Activate 3-Year Access — Free →'
        if (termsText)   termsText.textContent     = 'No card required. 3 years of Scout, on us.'
      } else {
        _appliedPromo = null
        if (input) input.style.borderColor = '#EF4444'
        if (feedback) {
          feedback.style.display = 'block'
          feedback.style.color   = '#DC2626'
          feedback.textContent   = 'That code isn\'t valid. Check for typos and try again.'
        }
      }
    },

    selectPlan: function (plan) {
      _selectedPlan = plan
      _appliedPromo = null  // clear any promo if user manually picks a plan
      var planSelect = document.getElementById('paywall-plan-select')
      var payForm    = document.getElementById('paywall-payment-form')
      var submitBtn  = document.getElementById('paywall-submit-btn')
      var cardSection = document.getElementById('paywall-card-section')
      if (planSelect)  planSelect.style.display  = 'none'
      if (payForm)     payForm.style.display     = 'block'
      if (cardSection) cardSection.style.display = 'block'
      if (submitBtn)   submitBtn.textContent     = plan === 'annual'
        ? 'Subscribe — $49.99/year →'
        : 'Subscribe — $9.99/month →'
      mountStripeCard()
    },

    backToPlanSelect: function () {
      var planSelect = document.getElementById('paywall-plan-select')
      var payForm    = document.getElementById('paywall-payment-form')
      if (planSelect) planSelect.style.display = 'block'
      if (payForm)    payForm.style.display    = 'none'
    },

    submitPayment: function () {
      var btn    = document.getElementById('paywall-submit-btn')
      var errEl  = document.getElementById('paywall-card-error')
      var nameEl = document.getElementById('paywall-card-name')
      var isFree = _appliedPromo && _appliedPromo.free

      if (btn) { btn.disabled = true; btn.textContent = 'Processing…' }
      if (errEl) errEl.style.display = 'none'

      var sb = window._supabaseClient
      if (!sb) { if (btn) { btn.disabled = false; btn.textContent = isFree ? 'Activate 3-Year Access — Free →' : 'Subscribe now →' } return }

      sb.auth.getSession().then(function (res) {
        var session = res.data && res.data.session
        if (!session) { if (btn) { btn.disabled = false; btn.textContent = isFree ? 'Activate 3-Year Access — Free →' : 'Subscribe now →' } return }

        function callConvert(paymentMethodId) {
          fetch(CONVERT_URL, {
            method:  'POST',
            headers: {
              'Content-Type':  'application/json',
              'Authorization': 'Bearer ' + session.access_token,
            },
            body: JSON.stringify({
              paymentMethodId: paymentMethodId || null,
              plan:            _selectedPlan,
              promoCode:       _appliedPromo ? _appliedPromo.code : null,
            }),
          })
          .then(function (r) { return r.json() })
          .then(function (data) {
            if (!data.ok) {
              if (errEl) { errEl.style.display = 'block'; errEl.textContent = data.error || 'Something went wrong. Please try again.' }
              if (btn)   { btn.disabled = false; btn.textContent = isFree ? 'Activate 3-Year Access — Free →' : 'Subscribe now →' }
              return
            }
            var paywallCard = document.getElementById('scout-paywall-card')
            var banner      = document.getElementById('scout-trial-banner')
            if (paywallCard) paywallCard.remove()
            if (banner)      banner.remove()

            showToast(isFree ? '🎉 3 years of Scout activated. Welcome aboard!' : '🎉 You\'re subscribed. Your next digest is on its way.')
            setTimeout(function () { window.location.reload() }, 3000)
          })
          .catch(function (e) {
            if (errEl) { errEl.style.display = 'block'; errEl.textContent = 'Network error. Please try again.' }
            if (btn)   { btn.disabled = false; btn.textContent = isFree ? 'Activate 3-Year Access — Free →' : 'Subscribe now →' }
            console.error('[ScoutPaywall] Network error:', e)
          })
        }

        // ── Free promo path: skip card entirely ─────────────────────────────
        if (isFree) {
          callConvert(null)
          return
        }

        // ── Paid path: collect card first ───────────────────────────────────
        if (!stripeInstance || !stripeCard) return
        stripeInstance.createPaymentMethod({
          type: 'card',
          card: stripeCard,
          billing_details: { name: nameEl ? nameEl.value : '', email: session.user.email },
        }).then(function (result) {
          if (result.error) {
            if (errEl) { errEl.style.display = 'block'; errEl.textContent = result.error.message }
            if (btn)   { btn.disabled = false; btn.textContent = 'Subscribe now →' }
            return
          }
          callConvert(result.paymentMethod.id)
        })
      })
    },
  }

})()
