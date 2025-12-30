const auth = {
    user: null,
    // Access Keys (Lowercase for reliability)
    KEYS: {
        'technician@1054': 'technician',
        'iict@1054': 'admin',
        'ec88@1054': 'owner'
    },

    async init() {
        console.log('🛡️ Auth Version: 2.0 (Access Key System)');
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
        const keyInput = document.getElementById('access-key').value.trim().toLowerCase();
        const role = this.KEYS[keyInput];

        if (!role) {
            alert('❌ Invalid Access Key. Please check for typos and try again.');
            return;
        }

        // Create virtual user session
        this.user = {
            role: role,
            email: role === 'owner' ? 'karunakarec88@gmail.com' : `${role}@local`,
            uid: `virtual_${role}_${Date.now()}`
        };

        // Persist session
        localStorage.setItem('auth_session', JSON.stringify(this.user));
        this.showMainApp();
        console.log(`🔐 Access Granted: Role = ${role}`);
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

        // Clear input
        const keyField = document.getElementById('access-key');
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
        const adminModules = ['nav-indents', 'nav-gate-pass', 'nav-tender'];
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
    }
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => auth.init());
