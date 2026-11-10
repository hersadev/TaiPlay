// Service worker de TaiPlay: la app funciona sin conexión una vez cargada.
//
// No se sirve tal cual: al compilar, vite.config.js (plugin pwa) sustituye
// PRECACHE por la lista de ficheros generados y VERSION por una huella de
// esa lista, y lo publica como sw.js junto a index.html.
//
// - Al instalarse, descarga todo (JS de cada apartado, CSS, el WebAssembly
//   de SQL, iconos) en una caché con la versión en el nombre.
// - Las páginas (navegación) van primero a la red, para recoger la versión
//   nueva si la hay; sin conexión se sirve el index.html guardado.
// - El resto se sirve de la caché: los ficheros llevan huella en el nombre,
//   así que nunca cambian.
// - No usa skipWaiting: la versión nueva toma el control cuando se cierran
//   todas las pestañas. Así una pestaña abierta nunca pide trozos de JS que
//   ya no existen.

const PRECACHE = self.__PRECACHE__;
const CACHE = `taiplay-${self.__VERSION__}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('taiplay-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(CACHE).then((cache) => cache.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./', { cacheName: CACHE })),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { cacheName: CACHE, ignoreSearch: true }).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
