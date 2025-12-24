const deletedModule = {
    render(container) {
        const archived = storage.get('work_orders').filter(o => o.status === 'archived')
            .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));

        if (archived.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="trash-2" size="48" class="text-muted mb-4"></i>
                    <p>No deleted records found</p>
                    <button onclick="router.navigate('completed')" class="btn-primary mt-6">Back to Completed</button>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <div class="view-header-row mb-6">
                <button onclick="router.navigate('completed')" class="btn-back">
                    <i data-lucide="chevron-left"></i> Back to Completed
                </button>
            </div>
            <div class="space-y-4">
                ${archived.map(o => `
                    <div class="wo-rect-box opacity-80">
                        <div class="box-header-rect">
                            <span class="q-tag">${o.quarter}</span>
                            <span class="status-tag ${o.status}">DELETED</span>
                        </div>
                        <div class="box-body-rect">
                            <p class="remarks-text">"${utils.sanitize(o.remarks || 'No remarks')}"</p>
                            <div class="tech-list-small">
                                <i data-lucide="users" size="14"></i> 
                                ${o.technicians ? o.technicians.join(', ') : 'N/A'}
                            </div>
                            <div class="material-grid-rect">
                                ${o.materials ? o.materials.map(m => `
                                    <div class="mat-item-rect">
                                        <span class="mat-name">${m.item}</span>
                                        <span class="mat-qty">${m.quantity}</span>
                                    </div>
                                `).join('') : ''}
                            </div>
                            <div class="action-buttons-rect mt-4 pt-3 border-t border-slate-700/50 flex gap-2">
                                <button onclick="deletedModule.restore('${o.id}')" class="btn-sm btn-outline flex-1">
                                    <i data-lucide="rotate-ccw"></i> Restore
                                </button>
                                ${auth.isOwner() ? `
                                    <button onclick="deletedModule.permanentDelete('${o.id}')" class="btn-sm btn-icon text-error">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    restore(id) {
        if (confirm('Restore this work order?')) {
            const orders = storage.get('work_orders');
            const idx = orders.findIndex(o => o.id === id);
            if (idx !== -1) {
                orders[idx].status = orders[idx].completedAt ? 'completed' : 'pending';
                storage.set('work_orders', orders);
                this.render(document.getElementById('view-content'));
            }
        }
    },

    permanentDelete(id) {
        if (confirm('Permanently delete this record? This cannot be undone.')) {
            const orders = storage.get('work_orders').filter(o => o.id !== id);
            storage.set('work_orders', orders);
            this.render(document.getElementById('view-content'));
        }
    }
};
