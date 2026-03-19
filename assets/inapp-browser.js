/**
 * FamilyForce — In-App Browser Handler
 *
 * Problem: Google OAuth is blocked in WebViews (Facebook, Instagram, Gmail,
 * TikTok, LinkedIn, etc.) with Error 403: disallowed_useragent.
 *
 * Strategy:
 *   1. On ANY page: detect WebView early.
 *   2. On landing pages: intercept "Try Scout Free" CTA clicks and try to
 *      open sign-in in the real browser before the user ever sees a form.
 *   3. On sign-in page: try a silent redirect first (iOS: x-safari scheme,
 *      Android: Chrome intent URL). If that fails, show a prominent
 *      full-width "Open in Safari/Chrome" card above the email form.
 *      Google button is hidden (it can't work here regardless).
 */
(function () {
  'use strict';

  // ─── Detection ────────────────────────────────────────────────────────────
  var ua = navigator.userAgent || '';

  var isInApp = (
    /FBAN|FBAV|Instagram|TwitterAndroid|LinkedInApp|TikTok|Snapchat|Pinterest|Threads|GSA\/|Musical\.ly|Line\//.test(ua)
    || (/Android/.test(ua) && /; wv\)/.test(ua))       // Android WebView flag
    || (/iPhone|iPad/.test(ua) && !/Safari\//.test(ua) && /AppleWebKit/.test(ua))  // iOS non-Safari WebKit
  );

  if (!isInApp) return;

  var isIOS     = /iPhone|iPad|iPod/.test(ua);
  var isAndroid = /Android/.test(ua);
  var browser   = isAndroid ? 'Chrome' : 'Safari';

  // Expose so other scripts can check if needed
  window.__inAppBrowser = { detected: true, ios: isIOS, android: isAndroid };

  // ─── Open-in-browser URL builders ─────────────────────────────────────────
  function chromeIntentUrl(url) {
    // Opens URL directly in Chrome on Android
    return 'intent://' + url.replace(/^https?:\/\//, '') + '#Intent;scheme=https;package=com.android.chrome;end';
  }

  function safariUrl(url) {
    // x-safari scheme: opens URL in Safari on iOS (works in most in-app browsers)
    return 'x-safari-' + url;
  }

  function openInBrowser(url) {
    if (isAndroid) {
      window.location.href = chromeIntentUrl(url);
    } else {
      window.location.href = safariUrl(url);
    }
  }

  // ─── Landing page: intercept all CTA links to sign-in ─────────────────────
  function interceptCTAs() {
    document.querySelectorAll('a[href*="sign-in"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        // Use the absolute URL (handles relative hrefs)
        var dest = link.href || (window.location.origin + '/sign-in.html');
        openInBrowser(dest);
      });
    });
  }

  // ─── Sign-in page: silent redirect + fallback UI ──────────────────────────
  function setupSignInPage() {
    var currentUrl = window.location.href;

    // Attempt silent redirect immediately.
    // iOS x-safari / Android intent will open the real browser.
    // If the redirect is blocked (newer OS, strict WebView), the page stays
    // loaded and the fallback UI below kicks in.
    openInBrowser(currentUrl);

    // Render fallback UI after a short delay — gives redirect a chance to fire.
    // If user is still here, the redirect didn't work: show the prominent gate.
    setTimeout(function () {
      // Hide Google button (non-functional in any WebView)
      var googleWrap = document.getElementById('signin-google-wrap');
      if (googleWrap) googleWrap.style.display = 'none';

      // Build the gate card
      var gate = document.createElement('div');
      gate.id = 'inapp-browser-gate';
      gate.style.cssText = 'margin-bottom:24px';
      gate.innerHTML = [
        '<div style="',
          'background:#F5F0FF;',
          'border:2px solid #6E4ED6;',
          'border-radius:14px;',
          'padding:22px 20px;',
          'text-align:center;',
        '">',
          '<p style="font-size:28px;margin:0 0 10px;line-height:1">🌐</p>',
          '<p style="',
            'font-family:\'Outfit\',Arial,sans-serif;',
            'font-size:16px;font-weight:700;',
            'color:#1D1D1F;margin:0 0 6px;',
          '">Open in ' + browser + ' to sign up</p>',
          '<p style="',
            'font-family:\'Outfit\',Arial,sans-serif;',
            'font-size:13px;color:#555;',
            'margin:0 0 18px;line-height:1.55;',
          '">',
            'Google sign-in doesn\'t work inside apps like Gmail or Instagram. ',
            'Tap below — it takes 2 seconds.',
          '</p>',
          '<a href="', (isAndroid ? chromeIntentUrl(currentUrl) : safariUrl(currentUrl)), '"',
            ' style="',
              'display:block;',
              'background:#6E4ED6;',
              'color:#fff;',
              'font-family:\'Outfit\',Arial,sans-serif;',
              'font-size:15px;font-weight:700;',
              'padding:15px;',
              'border-radius:10px;',
              'text-decoration:none;',
              'letter-spacing:-.01em;',
            '">',
            'Open in ' + browser + ' →',
          '</a>',
        '</div>',
        '<div style="',
          'text-align:center;',
          'font-family:\'Outfit\',Arial,sans-serif;',
          'font-size:12px;color:#999;',
          'margin:14px 0 4px;',
        '">or sign in with your email below</div>',
      ].join('');

      // Insert at the top of the sign-in card, before the logo
      var card = document.querySelector('.signin-card');
      if (card) {
        // Insert after the logo block (first child), before the banner divs
        var logo = card.querySelector('.signin-card-logo');
        var insertAfter = logo ? logo.nextSibling : card.firstChild;
        card.insertBefore(gate, insertAfter);
      }
    }, 150);
  }

  // ─── Router: which page are we on? ────────────────────────────────────────
  function init() {
    var path = window.location.pathname;
    if (path.indexOf('sign-in') !== -1) {
      setupSignInPage();
    } else {
      interceptCTAs();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
