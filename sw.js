const CACHE = 'study-timer-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  './css/base.css',
  './css/timer.css',
  './css/features.css',
  './js/data.js',
  './js/ui.js',
  './js/timer.js',
  './js/plan.js',
  './js/calendar.js',
  './js/academics.js',
  './js/reports.js',
  './js/tasks.js',
  './js/settings.js',
  './js/app.js',
  './js/todo.js',
  './js/summary.js'
];

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

self.addEventListener('periodicsync', e => {
  if (e.tag === 'study-timer-check') {
    e.waitUntil(checkNotifications());
  }
});

self.addEventListener('sync', e => {
  if (e.tag === 'study-timer-notify') {
    e.waitUntil(checkNotifications());
  }
});

async function checkNotifications() {
  try {
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'check-notifications' });
      return;
    }
    const now = new Date();
    const hr = now.getHours();
    const todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    if (hr === 8) {
      await self.registration.showNotification('🔥 Study Timer', {
        body: 'New day, new battle. Your competition started already. Open the app!',
        icon: 'icon192.png', badge: 'icon192.png',
        vibrate: [200, 100, 200], tag: 'morning-' + todayKey
      });
    }
    if (hr === 18) {
      await self.registration.showNotification('⚡ Evening Check', {
        body: 'Hours are slipping away. How much have you studied today?',
        icon: 'icon192.png', badge: 'icon192.png',
        vibrate: [200, 100, 200], tag: 'evening-' + todayKey
      });
    }
  } catch (e) { console.log('SW notification error:', e); }
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(cls => {
      if (cls.length > 0) { cls[0].focus(); return; }
      return self.clients.openWindow('./index.html');
    })
  );
});
