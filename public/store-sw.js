// Global service worker that handles per-store PWA manifests
// Scoped to / but only caches resources under /m/{slug}
const CACHE_PREFIX = 'store-cache-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Intercept dynamic manifest requests: /m/{slug}/manifest.json
  const manifestMatch = url.pathname.match(/^\/m\/([^/]+)\/manifest\.json$/);
  if (manifestMatch) {
    const name = url.searchParams.get('name') || 'Loja';
    const shortName = url.searchParams.get('short_name') || name.substring(0, 12);
    const slug = url.searchParams.get('slug') || manifestMatch[1];
    const themeColor = url.searchParams.get('theme_color') || '#7c3aed';
    const icon = url.searchParams.get('icon') || '/favicon.ico';
    const isExternal = icon.startsWith('http');

    const icons = isExternal
      ? [
          { src: icon, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: icon, sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
      : [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ];

    const manifest = {
      name,
      short_name: shortName,
      description: 'Cardápio digital - ' + name,
      start_url: '/m/' + slug,
      scope: '/m/' + slug,
      display: 'standalone',
      orientation: 'portrait',
      background_color: '#ffffff',
      theme_color: themeColor,
      icons
    };

    event.respondWith(
      new Response(JSON.stringify(manifest), {
        status: 200,
        headers: { 'Content-Type': 'application/manifest+json' }
      })
    );
    return;
  }

  // Cache static assets for /m/ pages
  if (url.pathname.startsWith('/m/') && (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  )) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_PREFIX + 'assets').then((c) => c.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation fallback for /m/ routes
  if (event.request.mode === 'navigate' && url.pathname.startsWith('/m/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
