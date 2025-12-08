const CACHE_NAME = 'cat-care-v2-modular';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/variables.css',
    '/css/layout.css',
    '/css/components.css',
    '/js/app.js',
    '/js/sync.js',
    '/js/toilets.js',
    '/js/food.js',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito:wght@400;600;700&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
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
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // Clone the response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
            .catch(() => {
                // Return offline page if available
                return caches.match('/index.html');
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'È ora di pulire una toilette!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'open',
                title: 'Apri app',
                icon: '/icons/icon-72.png'
            },
            {
                action: 'close',
                title: 'Chiudi',
                icon: '/icons/icon-72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Cat Care Tracker 🐱', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background sync for offline cleaning registration
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cleanings') {
        event.waitUntil(syncCleanings());
    }
});

async function syncCleanings() {
    // This would sync with a backend if you had one
    console.log('Syncing cleanings...');
}
