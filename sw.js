// Service worker do PersonalNutri: deixa o app abrir sem internet.
// Arquivos do próprio app: tenta a rede primeiro (para pegar atualizações) e usa a cópia salva se estiver offline.
// Fontes e bibliotecas de CDN: usa a cópia salva e atualiza em segundo plano.
// Chamadas ao Supabase nunca passam pelo cache.
const VERSION = 'pn-v2';
const APP_CACHE = VERSION + '-app';
const CDN_CACHE = VERSION + '-cdn';
const APP_FILES = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest', './favicon.svg', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'cdn.sheetjs.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP_CACHE).then((c) => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(APP_CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(CDN_CACHE).then((c) =>
        c.match(req).then((cached) => {
          const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => cached);
          return cached || net;
        })
      )
    );
  }
});
