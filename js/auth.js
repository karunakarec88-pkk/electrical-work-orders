const auth = {
    user: null,
    // Access Keys (Lowercase for reliability)
    KEYS: {
        'technician@1054': 'technician',
        'iict@1054': 'admin',
        'ec88@1054': 'owner'
    },

    async checkAuth() {
        console.log('🛡️ Auth Version: 2.1 (Security Patch)');
        const cachedSession = localStorage.getItem('auth_session');
        if (cachedSession) {
            try {
                this.user = JSON.parse(cachedSession);
                this.showMainApp();
            } catch (e) {
                this.logout(true);
            }
        }
    },

    handleAccessKey() {
        const emailInput = document.getElementById('access-email').value.trim();
        const keyInput = document.getElementById('access-key').value.trim().toLowerCase();

        if (!emailInput || !emailInput.includes('@')) {
            alert('❌ Please enter a valid email address for tracking.');
            return;
        }

        const role = this.KEYS[keyInput];

        if (!role) {
            alert('❌ Invalid Access Key. Please check for typos and try again.');
            return;
        }

        // Create virtual user session with email tracking
        this.user = {
            role: role,
            email: emailInput,
            uid: `virtual_${role}_${Date.now()}`
        };

        // Persist session
        localStorage.setItem('auth_session', JSON.stringify(this.user));
        this.showMainApp();
        console.log(`🔐 Access Granted: Role = ${role}, User = ${emailInput}`);
    },

    showMainApp() {
        document.getElementById('role-selector').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('role-display').textContent = this.user.role.toUpperCase();

        this.syncPermissions();

        // Re-initialize Lucide icons for the new view
        if (window.lucide) {
            lucide.createIcons();
        }
    },

    logout(silent = false) {
        this.user = null;
        localStorage.removeItem('auth_session');

        document.getElementById('role-selector').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');

        // Clear inputs
        const emailField = document.getElementById('access-email');
        const keyField = document.getElementById('access-key');
        if (emailField) emailField.value = '';
        if (keyField) keyField.value = '';
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

    togglePassword(id) {
        const input = document.getElementById(id);
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';

        const icon = input.parentElement.querySelector('.toggle-pass i');
        if (icon) {
            icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
            lucide.createIcons();
        }
    },

    syncPermissions() {
        // Module visibility based on roles
        const adminModules = ['nav-indents', 'nav-gate-pass', 'nav-tender', 'nav-inventory'];
        const isElevated = this.isOwnerOrAdmin();

        adminModules.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', !isElevated);
        });

        // Specific buttons
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) backupBtn.classList.toggle('hidden', !this.isOwner());

        const manageUsersBtn = document.getElementById('nav-manage-users');
        if (manageUsersBtn) manageUsersBtn.classList.toggle('hidden', !this.isOwner());

        // Body class for CSS targeting
        document.body.classList.toggle('role-not-admin', !this.isAdmin() && !this.isOwner());
    },

    async getAllUsers() {
        const fallback = this.user ? [this.user] : [];
        if (!window.db) return fallback;

        try {
            // Set a strict 3-second timeout for cloud fetch
            const fetchPromise = window.db.collection('users').get();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 3000));

            const snapshot = await Promise.race([fetchPromise, timeoutPromise]);
            const users = [];
            snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }));

            return users.length > 0 ? users : fallback;
        } catch (e) {
            console.warn('Cloud Users Fetch Skip (Using Local Session):', e.message);
            return fallback;
        }
    },

    async updateUserRole(uid, newRole) {
        if (!window.db) return false;
        try {
            if (!uid || uid.startsWith('virtual_')) {
                alert('Cannot change role of a virtual session user.');
                return false;
            }
            await window.db.collection('users').doc(uid).update({ role: newRole });
            return true;
        } catch (e) {
            console.error('Update Role Error:', e);
            return false;
        }
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => auth.checkAuth());
