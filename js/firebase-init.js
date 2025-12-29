const firebaseConfig = {
    apiKey: "AIzaSyDPb9sh6NCFbFk20eEywI7vxUr-KUsmyys",
    authDomain: "electrical-work-orders-pkk.firebaseapp.com",
    projectId: "electrical-work-orders-pkk",
    storageBucket: "electrical-work-orders-pkk.firebasestorage.app",
    messagingSenderId: "1079961358792",
    appId: "1:1079961358792:web:a1c4deadcf533c425e30fd"
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
