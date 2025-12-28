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

// Auth State Listener: Automatically handles session persistence
fAuth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log('✅ Firebase Auth: User logged in:', user.email);
        updateCloudStatus(true);
        // Ensure user profile is loaded
        await auth.handleAuthStateChange(user);
    } else {
        console.log('🚪 Firebase Auth: No active session');
        updateCloudStatus(false);
        auth.logout(true); // Silent logout to reset UI
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
