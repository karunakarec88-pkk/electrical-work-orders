const monthlyOrdersModule = {
    render(container) {
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');

        // Structure: Year -> Month
        const archive = {};
        orders.forEach(o => {
            const d = new Date(o.completedAt);
            const year = d.getFullYear();
            const month = d.toLocaleString('default', { month: 'long' });

            if (!archive[year]) archive[year] = {};
            if (!archive[year][month]) archive[year][month] = [];
            archive[year][month].push(o);
        });

        if (Object.keys(archive).length === 0) {
            container.innerHTML = `
                <div class="empty-state">No monthly records found</div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = `
            <div id="monthly-list">
                ${Object.entries(archive).sort((a, b) => b[0] - a[0]).map(([year, months]) => `
                    <div class="archive-year">
                        <h3><i data-lucide="calendar"></i> ${year}</h3>
                        <div class="archive-months">
                            ${Object.entries(months).map(([month, ords]) => `
                                <div class="archive-month-item" onclick="monthlyOrdersModule.viewMonth('${year}', '${month}')">
                                    <i data-lucide="folder"></i> ${month} (${ords.length})
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    viewMonth(year, month) {
        const orders = storage.get('work_orders').filter(o => {
            if (o.status !== 'completed') return false;
            const d = new Date(o.completedAt);
            return d.getFullYear() == year && d.toLocaleString('default', { month: 'long' }) == month;
        }).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <button class="btn-back" onclick="monthlyOrdersModule.render(document.getElementById('view-content'))">
                <i data-lucide="chevron-left"></i> Back to Monthly List
            </button>
            
            <div class="flex justify-between items-center mt-6 mb-4">
                <h4 class="text-indigo-400 font-bold text-lg">${month} ${year}</h4>
                ${auth.isOwner() ? `
                    <button onclick="inventoryModule.downloadMonthlyCSV('${year}', '${month}')" class="btn-sm btn-accent">
                        <i data-lucide="download"></i> CSV
                    </button>
                ` : ''}
            </div>

            <div class="space-y-4">
                ${orders.map(o => `
                    <div class="wo-rect-box">
                        <div class="box-header-rect">
                            <span class="q-tag">${o.quarter}</span>
                            <span class="date-tag">${utils.renderDate(o.completedAt)}</span>
                        </div>
                        <div class="box-body-rect">
                            <p class="remarks-text">"${utils.sanitize(o.remarks || 'No remarks')}"</p>
                            <div class="tech-list-small">
                                <i data-lucide="users" size="14"></i> 
                                ${o.technicians ? o.technicians.join(', ') : 'N/A'}
                            </div>
                            <div class="material-grid-rect">
                                ${o.materials.map(m => `
                                    <div class="mat-item-rect">
                                        <span class="mat-name">${m.item}</span>
                                        <span class="mat-qty">: ${m.quantity}</span>
                                    </div>
                                `).join('')}
                                ${o.materials.length === 0 ? '<div class="text-muted text-xs">No materials used</div>' : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();
    }
};
