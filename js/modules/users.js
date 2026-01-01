const usersModule = {
    async render(container) {
        container.innerHTML = `<div class="loader-container"><div class="loader"></div><p>Loading Users...</p></div>`;

        const users = await auth.getAllUsers();

        if (users.length === 0) {
            container.innerHTML = `<p class="placeholder">No users found or unauthorized access.</p>`;
            return;
        }

        container.innerHTML = `
            <div class="users-list-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Current Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.email}</td>
                                <td><span class="badge badge-${user.role}">${user.role.toUpperCase()}</span></td>
                                <td>
                                    ${user.role === 'owner' ? '<span class="text-muted">Master Owner</span>' : `
                                        <select onchange="usersModule.changeRole('${user.id}', this.value)" class="role-select">
                                            <option value="technician" ${user.role === 'technician' ? 'selected' : ''}>Technician</option>
                                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                        </select>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- DANGER ZONE: ONLY FOR OWNER -->
            <div class="mt-12 pt-8 border-t-2 border-dashed border-error/20">
                <div class="bg-error/5 border border-error/20 rounded-3xl p-8">
                    <div class="flex items-center gap-4 mb-6">
                        <div class="w-12 h-12 rounded-2xl bg-error/20 flex items-center justify-center text-error">
                            <i data-lucide="bomb" size="24"></i>
                        </div>
                        <div>
                            <h3 class="text-error font-black uppercase tracking-widest text-lg">Danger Zone</h3>
                            <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Permanent System Actions</p>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <div class="p-6 bg-slate-900/60 rounded-2xl border border-white/5">
                            <h4 class="text-white font-bold text-sm mb-2 uppercase tracking-tight">Factory Reset App</h4>
                            <p class="text-xs text-slate-400 mb-6 leading-relaxed">This will permanently delete all Work Orders, Indents, Gate Passes, and Tenders from both this device and the cloud. User accounts will be preserved.</p>
                            
                            <div class="flex flex-col sm:flex-row gap-4 items-end">
                                <div class="flex-1 w-full">
                                    <label class="text-[9px] text-slate-500 uppercase font-black mb-1.5 block">Enter Master Security Key</label>
                                    <div class="relative">
                                        <i data-lucide="key-round" size="14" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                        <input type="password" id="reset-master-key" 
                                               class="w-full bg-slate-900 border-2 border-slate-700/50 h-12 rounded-xl pl-10 pr-4 text-sm font-black text-error focus:border-error transition-all" 
                                               placeholder="••••••••••••">
                                    </div>
                                </div>
                                <button onclick="usersModule.handleSecureReset()" class="h-12 px-8 bg-error text-white font-black uppercase text-[11px] rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-error/20 active:scale-95">
                                    <i data-lucide="trash-2" size="16"></i>
                                    Wipe All Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    async changeRole(uid, newRole) {
        if (confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
            const success = await auth.updateUserRole(uid, newRole);
            if (success) {
                alert('Role updated successfully!');
                router.refreshCurrentView();
            }
        } else {
            router.refreshCurrentView(); // Reset select if cancelled
        }
    },

    handleSecureReset() {
        const key = document.getElementById('reset-master-key').value;
        if (!key) {
            alert('Please enter the Master Security Key');
            return;
        }

        // Verify against owner key: ec88@1054
        if (key.toLowerCase() !== 'ec88@1054') {
            alert('❌ INVALID MASTER KEY. Action blocked for security.');
            return;
        }

        // Logic handled in storage utility
        storage.internal_factoryReset();
    }
};
