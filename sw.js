/**
 * Scout Service Worker
 * Strategy:
 *   - Static assets (CSS/JS/fonts/images): cache-first, network fallback
 *   - Navigation (HTML pages): network-first, cache fallback, offline page last resort
 *   - Supabase / Stripe / external API: network-only (never cache auth or payment calls)
 */

const CACHE_VERSION = 'scout-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGE_CACHE    = `${CACHE_VERSION}-pages`;

// Core shell — pre-cached on install
const PRECACHE_URLS = [
  '/scout-dashboard',
  '/sign-in',
  '/assets/scout-dashboard.css',
  '/assets/scout-dashboard.js',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/offline',
];

// Never cache these — always go to network
const NETWORK_ONLY_PATTERNS = [
  /supabase\.co/,
  /stripe\.com/,
  /googleapis\.com\/css/,   // font CSS (let it revalidate)
  /r\.wdfl\.co/,            // Rewardful
  /auth\/v1/,
  /functions\/v1/,
];

// ── Install: pre-cache shell ───────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS.filter(u => !u.includes('offline'))))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: prune old caches ─────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith('scout-') && k !== STATIC_CACHE && k !== PAGE_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: routing logic ───────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Network-only: external APIs, auth, payments
  if (NETWORK_ONLY_PATTERNS.some(p => p.test(request.url))) return;

  // Network-only: chrome-extension or non-http
  if (!url.protocol.startsWith('http')) return;

  // Navigation requests: network-first → page cache → offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(PAGE_CACHE).then(c => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match('/scout-dashboard') || offlinePage())
        )
    );
    return;
  }

  // Static assets (same origin): cache-first → network → cache on miss
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(request, clone));
          }
          return res;
        });
      })
    );
  }
});

// ── Offline fallback page ──────────────────────────────────────────────────
function offlinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Scout — Offline</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Outfit', system-ui, sans-serif;
    background: #FAFAFA; color: #1C1B2E;
    display: flex; align-items: center; justify-content: center;
    min-height: 100dvh; padding: 24px;
    text-align: center;
  }
  .wrap { max-width: 320px; }
  .icon { font-size: 48px; margin-bottom: 16px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
  p  { font-size: 15px; color: #6B7280; line-height: 1.5; margin-bottom: 24px; }
  a  {
    display: inline-block; background: #6E4ED6; color: #fff;
    text-decoration: none; padding: 12px 28px;
    border-radius: 100px; font-weight: 600; font-size: 15px;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="icon">📡</div>
    <h1>You're offline</h1>
    <p>Scout needs a connection to load your child's milestones. Check your signal and try again.</p>
    <a href="/scout-dashboard">Try again</a>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
