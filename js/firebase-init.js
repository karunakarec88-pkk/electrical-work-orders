// Firebase initialization using external config
console.log('📦 Firebase Config: Loading external configuration...');

if (!window.firebaseConfig) {
    console.error('❌ Firebase Config: Not found! Create js/firebase-config.js (ignored by Git).');
}

// Initialize Firebase SDKs
if (typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(window.firebaseConfig);
        window.db = firebase.firestore();
        window.fAuth = firebase.auth();

        console.log('✅ Firebase SDK: Initialized successfully.');
        initializeCloudSync();

    } catch (error) {
        console.error('❌ Firebase SDK: Initialization failed:', error);
    }
} else {
    window.db = null;
    window.fAuth = null;
    console.error('❌ Firebase SDK: Not found. Check your internet or CDN links.');
}

async function initializeCloudSync() {
    if (!window.fAuth) return;
    try {
        await fAuth.signInAnonymously();
    } catch (e) {
        console.error('⚠️ Sync Fail:', e.message);
        const errorMsg = e.code === 'auth/operation-not-allowed'
            ? 'ENABLE ANON AUTH IN CONSOLE'
            : `ERROR: ${e.code || 'Network Error'}`;
        updateCloudStatus(false, errorMsg);

        // If it's a network error, retry in 20s
        if (e.code !== 'auth/operation-not-allowed') {
            setTimeout(initializeCloudSync, 20000);
        }
    }
}

// Global Cloud Status UI Updater
function updateCloudStatus(isOnline, errorDetail = '') {
    const container = document.getElementById('cloud-status');
    const dot = container?.querySelector('.status-dot');
    const text = container?.querySelector('span');
    if (!container || !dot) return;

    container.classList.remove('hidden');
    dot.classList.toggle('online', isOnline);
    dot.classList.toggle('offline', !isOnline);

    if (text) {
        if (isOnline) {
            text.textContent = 'CLOUD ONLINE';
        } else {
            text.textContent = errorDetail || 'SYNC ERROR (RETRYING)';
        }
    }

    // Add click-to-retry
    container.style.cursor = 'pointer';
    container.onclick = () => {
        if (!isOnline) {
            if (text) text.textContent = 'CONNECTING...';
            initializeCloudSync();
        }
    };
}

// Monitor Auth State (Internal sync only)
let isSyncStarted = false;
if (window.fAuth) {
    fAuth.onAuthStateChanged((user) => {
        updateCloudStatus(!!user);
        if (user) {
            console.log('☁️ Cloud Sync: Active (Anonymous Session v2.6)');

            const startSync = () => {
                if (typeof storage !== 'undefined') {
                    if (!isSyncStarted) {
                        storage.initRealtimeListeners();
                        isSyncStarted = true;
                    }
                } else {
                    console.warn('🕒 Waiting for storage.js to load...');
                    setTimeout(startSync, 2000);
                }
            };

            startSync();
        }
    });
}
