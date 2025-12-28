const auth = {
    user: null,

    async handleSignup() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-pass').value.trim();
        const role = document.getElementById('signup-role').value;

        if (!email || !password || !role) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const userCredential = await fAuth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Save user profile to Firestore
            await db.collection('users').doc(user.uid).set({
                email,
                role,
                createdAt: new Date().toISOString()
            });

            console.log('User signed up and profile created');
        } catch (error) {
            console.error('Signup Error:', error);
            alert(error.message);
        }
    },

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-pass').value.trim();

        if (!email || !password) {
            alert('Please enter email and password');
            return;
        }

        try {
            await fAuth.signInWithEmailAndPassword(email, password);
        } catch (error) {
            console.error('Login Error:', error);
            alert('Login failed: ' + error.message);
        }
    },

    async handleAuthStateChange(firebaseUser) {
        try {
            // Fetch role from Firestore
            const doc = await db.collection('users').doc(firebaseUser.uid).get();
            if (doc.exists) {
                const profile = doc.data();
                this.user = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    role: profile.role
                };

                this.showMainApp();
            } else {
                console.warn('No profile found for user UID:', firebaseUser.uid);
                // Fallback or force profile creation if needed
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    },

    showMainApp() {
        document.getElementById('role-selector').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('role-display').textContent = this.user.role.toUpperCase();
        this.syncPermissions();
        lucide.createIcons();
    },

    switchAuthMode(mode) {
        document.getElementById('login-form-box').classList.toggle('hidden', mode === 'signup');
        document.getElementById('signup-form-box').classList.toggle('hidden', mode === 'login');
        lucide.createIcons();
    },

    togglePassword(id) {
        const input = document.getElementById(id);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';

        // Toggle icon in the parent wrapper
        const icon = input.parentElement.querySelector('.toggle-pass i');
        if (icon) {
            icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
            lucide.createIcons();
        }
    },

    async logout(silent = false) {
        if (!silent) await fAuth.signOut();

        this.user = null;
        document.getElementById('role-selector').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');

        // Reset to login form
        this.switchAuthMode('login');
    },

    checkAuth() {
        return !!fAuth.currentUser;
    },

    isOwner() {
        return this.user && this.user.role === 'owner';
    },
    isAdmin() {
        return this.user && this.user.role === 'admin';
    },
    isOwnerOrAdmin() {
        return this.user && (this.user.role === 'owner' || this.user.role === 'admin');
    },

    syncPermissions() {
        const restrictedModules = ['nav-indents', 'nav-gate-pass', 'nav-tender'];
        const canAccessModules = this.isOwnerOrAdmin();
        restrictedModules.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', !canAccessModules);
        });

        document.body.classList.toggle('role-not-admin', !this.isAdmin());

        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) backupBtn.classList.toggle('hidden', !this.isOwner());
    }
};
