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
    }
};
