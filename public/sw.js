/* public/sw.js */
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/styles.css',
  '/main.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (![STATIC_CACHE, DYNAMIC_CACHE].includes(k)) return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Network-first for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // cache API responses
          const resClone = res.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for App Shell and navigation
  if (req.mode === 'navigate' || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).catch(()=>caches.match('/offline.html')))
    );
    return;
  }

  // Stale-while-revalidate for images and fonts
  if (req.destination === 'image' || req.destination === 'font') {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(async cache => {
        const cached = await cache.match(req);
        const network = fetch(req).then(networkRes => {
          cache.put(req, networkRes.clone());
          return networkRes;
        }).catch(()=>null);
        return cached || network || caches.match('/offline.html');
      })
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(()=>caches.match('/offline.html')))
  );
});

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pwa-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllEntriesFromIDB() {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteEntryFromIDB(id) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-entries') {
    event.waitUntil(syncEntries());
  }
});

async function syncEntries() {
  try {
    const entries = await getAllEntriesFromIDB();
    for (const e of entries) {
      try {
        const res = await fetch('/api/sync-entries', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(e)
        });
        if (res.ok) {
          // eliminar del IDB
          if (e.id !== undefined) await deleteEntryFromIDB(e.id);
        }
      } catch (err) {
        // si falla, lanzar para que se reintente más tarde
        console.error('Sync fetch failed for entry', e, err);
        throw err;
      }
    }
  } catch (err) {
    console.error('syncEntries error', err);
    throw err;
  }
}

/* ---------- Push ---------- */
self.addEventListener('push', event => {
  let payload = { title: 'Notificación', body: 'Tienes una notificación', url: '/' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) { /* no JSON */ }

  const options = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-72.png',
    data: { url: payload.url || '/' }
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
