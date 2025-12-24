// Firebase Configuration provided by user
const firebaseConfig = {
    apiKey: "AIzaSyA5SQowOgyj-wliLpHSW8M9QAoBDaEwm44",
    authDomain: "work-orders--inventory.firebaseapp.com",
    databaseURL: "https://work-orders--inventory-default-rtdb.firebaseio.com",
    projectId: "work-orders--inventory",
    storageBucket: "work-orders--inventory.firebasestorage.app",
    messagingSenderId: "25020400502",
    appId: "1:25020400502:web:e28684094f77ad7644b057",
    measurementId: "G-F6X7SF76L1"
};

// Initialize Firebase
console.log('Firebase Init: Using Project "' + firebaseConfig.projectId + '"');
firebase.initializeApp(firebaseConfig);

// Create global references
window.db = firebase.firestore();
window.fAuth = firebase.auth();

// Silent sign-in to provide a session for Security Rules
fAuth.signInAnonymously().then(() => {
    console.log('✅ Firebase Auth: Anonymous session started');
    updateCloudStatus(true);
}).catch(err => {
    console.error('🛑 FIREBASE AUTH ERROR:', err);
    updateCloudStatus(false);

    if (err.code === 'auth/operation-not-allowed') {
        console.error('👉 ACTION REQUIRED: Go to Firebase Console -> Authentication -> Sign-in method and ENABLE "Anonymous".');
    } else if (err.code === 'auth/invalid-api-key') {
        console.error('👉 ERROR: The API Key in your firebase-init.js is incorrect or restricted.');
    }
});

function updateCloudStatus(isOnline) {
    const container = document.getElementById('cloud-status');
    const dot = container?.querySelector('.status-dot');
    if (!container || !dot) return;

    container.classList.remove('hidden');
    dot.classList.toggle('online', isOnline);
    dot.classList.toggle('offline', !isOnline);
}
