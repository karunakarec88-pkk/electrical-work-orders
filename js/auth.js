const auth = {
    user: null,

    async login(role) {
        const passId = `${role}-pass`;
        const el = document.getElementById(passId);
        if (!el) {
            alert('Selection error. Please refresh.');
            return;
        }
        const password = el.value.trim();

        // Secure hashing: Passwords are compared as SHA-256 hashes
        const validHashes = {
            'owner': '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
            'admin': '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', // manager123
            'technician': '3ac40463b419a7de590185c7121f0bfbe411d6168699e8014f521b050b1d6653' // tech123
        };

        const inputHash = await utils.sha256(password);

        if (inputHash !== validHashes[role]) {
            alert(`Incorrect password for ${role.toUpperCase()} role! Please check for typos.`);
            return;
        }

        this.user = { role };
        localStorage.setItem('user_role', role);
        document.getElementById('role-selector').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('user-info').classList.remove('hidden');
        document.getElementById('role-display').textContent = role.toUpperCase();
        this.syncPermissions();
        lucide.createIcons();
    },

    logout() {
        this.user = null;
        localStorage.removeItem('user_role');
        document.getElementById('role-selector').classList.remove('hidden');
        document.getElementById('main-content').classList.add('hidden');
        document.getElementById('user-info').classList.add('hidden');
    },

    checkAuth() {
        const savedRole = localStorage.getItem('user_role');
        if (savedRole) {
            this.user = { role: savedRole };
            document.getElementById('role-selector').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            document.getElementById('user-info').classList.remove('hidden');
            document.getElementById('role-display').textContent = savedRole.toUpperCase();
            this.syncPermissions();
            lucide.createIcons();
            return true;
        }
        return false;
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
        // Toggle restricted modules
        const restrictedModules = ['nav-indents', 'nav-gate-pass', 'nav-tender'];
        const canAccessModules = this.isOwnerOrAdmin();
        restrictedModules.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('hidden', !canAccessModules);
        });

        // Toggle download buttons - this depends on modules being rendered
        document.body.classList.toggle('role-not-admin', !this.isAdmin());

        // Toggle Backup button (Owner/Admin only)
        const backupBtn = document.getElementById('backup-btn');
        if (backupBtn) backupBtn.classList.toggle('hidden', !this.isOwnerOrAdmin());

        // Toggle Reset button (Owner only - High Risk)
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.classList.toggle('hidden', !this.isOwner());
    }
};
