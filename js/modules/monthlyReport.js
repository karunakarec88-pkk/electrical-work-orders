const monthlyReportModule = {
    currentYear: null,
    currentMonth: null,

    render(container) {
        this.currentYear = null;
        this.currentMonth = null;
        this.renderFolders(container);
    },

    renderFolders(container) {
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');
        const archive = {};

        orders.forEach(o => {
            const d = new Date(o.completedAt);
            const year = d.getFullYear();
            const month = d.toLocaleString('default', { month: 'long' });

            if (!archive[year]) archive[year] = new Set();
            archive[year].add(month);
        });

        const years = Object.keys(archive).sort((a, b) => b - a);

        if (years.length === 0) {
            container.innerHTML = '<div class="empty-state">No archived records found</div>';
            return;
        }

        container.innerHTML = `
            <div class="archive-container">
                <p class="text-xs text-muted mb-4">Select a year and month to view reports.</p>
                ${years.map(year => `
                    <div class="archive-year-group mb-6">
                        <h3 class="flex items-center gap-2 text-primary font-bold mb-3">
                            <i data-lucide="calendar"></i> ${year}
                        </h3>
                        <div class="grid grid-cols-2 gap-3">
                            ${Array.from(archive[year]).sort((a, b) => {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            return months.indexOf(b) - months.indexOf(a);
        }).map(month => `
                                <div class="archive-folder" onclick="monthlyReportModule.openMonth('${year}', '${month}')">
                                    <i data-lucide="folder"></i>
                                    <span>${month}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    openMonth(year, month) {
        this.currentYear = year;
        this.currentMonth = month;
        const container = document.getElementById('view-content');
        this.renderMonthDetails(container, year, month);
    },

    renderMonthDetails(container, year, month) {
        const orders = storage.get('work_orders').filter(o => {
            if (o.status !== 'completed') return false;
            const d = new Date(o.completedAt);
            return d.getFullYear().toString() === year && d.toLocaleString('default', { month: 'long' }) === month;
        }).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        container.innerHTML = `
            <button class="btn-back" onclick="monthlyReportModule.render(document.getElementById('view-content'))">
                <i data-lucide="chevron-left"></i> Back to Archive
            </button>

            <div class="flex justify-between items-center mt-6 mb-4">
                <h2 class="text-xl font-black text-indigo-400">${month} ${year}</h2>
                ${auth.isOwnerOrAdmin() ? `
                    <button onclick="monthlyReportModule.downloadCSV('${year}', '${month}')" class="btn-primary !py-2 !px-4 flex items-center gap-2 text-sm">
                        <i data-lucide="download" size="16"></i> CSV
                    </button>
                ` : ''}
            </div>

            <div class="search-box mb-4">
                <input type="text" id="archive-search" placeholder="Search by quarter or material..." oninput="monthlyReportModule.filterMonth()">
            </div>

            <div id="archive-results" class="space-y-4">
                ${this.renderOrdersList(orders)}
            </div>
        `;
        lucide.createIcons();
    },

    renderOrdersList(orders) {
        if (orders.length === 0) return '<div class="empty-state">No matching records</div>';

        return orders.map(o => `
            <div class="order-card !border-slate-700/50">
                <div class="flex justify-between items-center mb-3 border-b border-white/5 pb-2 gap-2">
                    <span class="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-black whitespace-nowrap">${o.quarter}</span>
                    <span class="text-[10px] text-slate-500 font-medium whitespace-nowrap">${utils.formatDate(o.completedAt)}</span>
                </div>
                <div class="space-y-2">
                    ${o.materials.map(m => `
                        <div class="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                            <span class="text-xs text-slate-200">${m.category} - ${m.item}</span>
                            <span class="text-xs font-medium text-accent">: ${m.quantity} ${utils.getUnit(m.item)}</span>
                        </div>
                    `).join('')}
                    ${o.materials.length === 0 ? '<div class="text-[10px] text-muted italic">No materials used</div>' : ''}
                </div>
            </div>
        `).join('');
    },

    filterMonth() {
        const query = document.getElementById('archive-search').value.toLowerCase().trim();
        const year = this.currentYear;
        const month = this.currentMonth;

        const allOrders = storage.get('work_orders').filter(o => {
            if (o.status !== 'completed') return false;
            const d = new Date(o.completedAt);
            return d.getFullYear().toString() === year && d.toLocaleString('default', { month: 'long' }) === month;
        });

        const filtered = allOrders.filter(o =>
            o.quarter.toLowerCase().includes(query) ||
            o.materials.some(m => m.item.toLowerCase().includes(query))
        ).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        document.getElementById('archive-results').innerHTML = this.renderOrdersList(filtered);
    },

    downloadCSV(year, month) {
        const orders = storage.get('work_orders').filter(o => {
            if (o.status !== 'completed') return false;
            const d = new Date(o.completedAt);
            return d.getFullYear().toString() === year && d.toLocaleString('default', { month: 'long' }) === month;
        });

        let csv = "Quarter,Status,Completed Date,Remarks,Technicians,Material,Quantity,Unit\n";
        orders.forEach(o => {
            const techs = o.technicians ? o.technicians.join(' | ') : 'N/A';
            if (o.materials.length === 0) {
                csv += `"${o.quarter}","Completed","${utils.formatDate(o.completedAt)}","${o.remarks}","${techs}","None",0,"N/A"\n`;
            } else {
                o.materials.forEach(m => {
                    csv += `"${o.quarter}","Completed","${utils.formatDate(o.completedAt)}","${o.remarks}","${techs}","${m.item}",${m.quantity},"${utils.getUnit(m.item)}"\n`;
                });
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorkOrders_${month}_${year}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
