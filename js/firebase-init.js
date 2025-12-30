// Hardcoded Firebase configuration for maximum reliability
// Verified against Firebase Console CLI - DEC 31 2025
window.firebaseConfig = {
    apiKey: "AIzaSyA5SQowOgyj-wliLpHSW8M9QAoBDaEwm44",
    authDomain: "work-orders--inventory.firebaseapp.com",
    projectId: "work-orders--inventory",
    storageBucket: "work-orders--inventory.firebasestorage.app",
    messagingSenderId: "25020400502",
    appId: "1:25020400502:web:e28684094f77ad7644b057"
};

// -- Mobile Debug Interceptor --
(function () {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function appendToDebug(msg, type) {
        const consoleEl = document.getElementById('debug-console');
        const logEl = document.getElementById('debug-logs');
        if (!consoleEl || !logEl) return;

        consoleEl.classList.remove('hidden');
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }

    console.log = (...args) => {
        originalLog(...args);
        appendToDebug(args.join(' '), 'info');
    };
    console.error = (...args) => {
        originalError(...args);
        appendToDebug(args.join(' '), 'error');
    };
    console.warn = (...args) => {
        originalWarn(...args);
        appendToDebug(args.join(' '), 'warn');
    };
})();

console.log('📦 Firebase Config: Hardcoded configuration loaded.');

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
