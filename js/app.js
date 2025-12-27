window.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.checkAuth();

    // Initialize Lucide icons
    lucide.createIcons();

    // Initial Badge Update
    router.updatePendingCount();

    // Initialize Real-time Cloud Listeners
    storage.initRealtimeListeners();

    // Run background maintenance
    setTimeout(() => storage.runMaintenance(), 5000);

    // Global click handler to close search results
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-select')) {
            const list = document.getElementById('quarter-list');
            if (list) list.classList.add('hidden');
        }
    });

    // Handle history/routing if needed (simple implementation)
    window.onpopstate = () => {
        router.navigate('home');
    };

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker Registered');

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('New version available! Reload to update?')) {
                                newWorker.postMessage('skipWaiting');
                            }
                        }
                    });
                });
            })
            .catch(err => console.log('Service Worker Failed', err));

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                window.location.reload();
                refreshing = true;
            }
        });
    }
});
