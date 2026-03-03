const CACHE_NAME = 'pwa-push-notifications-v1';

// Install event - basic setup
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep current cache, remove old ones
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache successful responses
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache).catch(() => {
            // Silently fail if caching fails
            console.debug('[SW] Could not cache:', event.request.url);
          });
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', event.request.url);
            return cachedResponse;
          }
          // Return a basic offline response for HTML requests
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return new Response('Offline - Please check your connection', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        });
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received at:', new Date().toLocaleString());

  let notificationData = {
    title: 'PWA Push Notification',
    body: 'You have a new notification!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/',
      timestamp: Date.now(),
    },
    tag: `pwa-push-${Date.now()}`,
    requireInteraction: false,
    silent: false,
  };

  // Try to parse the push data - handle both JSON and plain text
  if (event.data) {
    try {
      // Try parsing as JSON first
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData,
      };
      console.log('[SW] Parsed JSON push data');
    } catch (jsonError) {
      // If JSON parsing fails, try as plain text
      try {
        const textData = event.data.text();
        if (textData) {
          notificationData.body = textData;
          console.log('[SW] Using text data as notification body');
        }
      } catch (textError) {
        console.error('[SW] Error reading push data:', textError);
      }
    }
  }

  // Simplified notification data for better compatibility
  const simplifiedNotification = {
    title: notificationData.title,
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.tag,
  };

  event.waitUntil(
    self.registration.showNotification(simplifiedNotification.title, simplifiedNotification)
      .then(() => {
        console.log('[SW] Notification shown successfully');
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error);
        // Try with minimal options
        return self.registration.showNotification(
          simplifiedNotification.title,
          {
            title: simplifiedNotification.title,
            body: simplifiedNotification.body,
            icon: simplifiedNotification.icon,
          }
        );
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
            return client.focus();
          }
        }

        // Open a new window if none is open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded at:', new Date().toLocaleString());
