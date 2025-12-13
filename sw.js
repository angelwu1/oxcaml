// Service Worker for Lines of Action Game
const CACHE_NAME = 'loa-game-v15';
const OFFLINE_CACHE_NAME = 'loa-offline-v15';

// Assets to cache for offline functionality
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './loa.html',
  './generated_js/loa_ui.bc.js',
  './hw5_html_css/loa_game.css',
  './game-storage.js',
  './game-bridge.js',
  './multiplayer.js',
  './multiplayer-ui.js',
  './multiplayer-integration.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // Network failed, return offline page if available
          return caches.match('./index.html');
        });
      })
  );
});

// Message event - handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_MOVES') {
    // Handle move synchronization when online
    console.log('[ServiceWorker] Syncing moves:', event.data.moves);
    // You can implement server sync here when backend is available
  }
});

// Background sync event (for future server synchronization)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-moves') {
    event.waitUntil(syncMoves());
  }
});

async function syncMoves() {
  // Placeholder for syncing moves to server when online
  console.log('[ServiceWorker] Syncing moves to server...');
  // Implementation would go here when you have a backend
}

