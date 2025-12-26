const CACHE_NAME = 'work-order-v5';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './js/app.js',
    './js/router.js',
    './js/data.js',
    './js/auth.js',
    './js/utils.js',
    './js/modules/pending.js',
    './js/modules/completed.js',
    './js/modules/upload.js',
    './js/modules/inventory.js',
    './js/modules/monthlyReport.js',
    './js/modules/indents.js',
    './js/modules/gatepass.js',
    './js/modules/tender.js',
    './js/modules/deleted.js',
    'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
