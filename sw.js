const CACHE = 'study-timer-v4';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const c = r.clone(); caches.open(CACHE).then(ch => ch.put(e.request, c)); return r; })
      .catch(() => caches.match(e.request))
  );
});

// Periodic Background Sync (Android PWA)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'study-timer-check') {
    e.waitUntil(checkNotifications());
  }
});

// Also handle regular sync as fallback
self.addEventListener('sync', e => {
  if (e.tag === 'study-timer-notify') {
    e.waitUntil(checkNotifications());
  }
});

async function checkNotifications() {
  try {
    // Read data from localStorage via client
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      // Ask client to check and notify
      clients[0].postMessage({ type: 'check-notifications' });
      return;
    }
    // If no clients open, try direct notification for recurring
    const now = new Date();
    const hr = now.getHours();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    
    // Morning reminder at 8 AM
    if (hr === 8) {
      await self.registration.showNotification('🔥 Study Timer', {
        body: 'New day, new battle. Your competition started already. Open the app!',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'morning-' + todayKey
      });
    }
    // Evening push at 6 PM
    if (hr === 18) {
      await self.registration.showNotification('⚡ Evening Check', {
        body: 'Hours are slipping away. How much have you studied today? Open and check!',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'evening-' + todayKey
      });
    }
  } catch (e) {
    console.log('SW notification error:', e);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      return self.clients.openWindow('./index.html');
    })
  );
});
