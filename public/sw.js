/* =========================================================================
   Service Worker — Skarbnik Klasowy (PWA)
   - App shell cache (offline start)
   - Nawigacja: network-first z fallbackiem do /index.html (SPA offline)
   - Statyczne assety (JS/CSS/obrazy z tej samej domeny): cache-first
   - Żądania cross-origin (Firebase, Google Fonts, API) — pomijane,
     obsługuje je przeglądarka, żeby nie psuć synchronizacji w czasie rzecz.
   ========================================================================= */
const CACHE = 'skarbnik-cache-v1'
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa-192.png',
  '/pwa-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Tylko ta sama domena — Firebase/Google Fonts/API zostawiamy przeglądarce.
  if (url.origin !== self.location.origin) return

  // Nawigacje (SPA): network-first, offline → cache index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    )
    return
  }

  // Statyczne assety: cache-first, w tle aktualizacja
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
