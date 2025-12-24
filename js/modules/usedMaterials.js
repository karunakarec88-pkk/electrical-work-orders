const usedMaterialsModule = {
    render(container) {
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');

        // Group by Year -> then Group by Month -> then Group by Quarter
        const archive = {};
        orders.forEach(o => {
            const d = new Date(o.completedAt);
            const year = d.getFullYear();
            const month = d.toLocaleString('default', { month: 'long' });

            if (!archive[year]) archive[year] = {};
            if (!archive[year][month]) archive[year][month] = {};
            if (!archive[year][month][o.quarter]) archive[year][month][o.quarter] = [];

            o.materials.forEach(m => {
                archive[year][month][o.quarter].push({
                    ...m,
                    date: o.completedAt
                });
            });
        });

        // Convert to sorted array for rendering
        const sortedYears = Object.entries(archive).sort((a, b) => b[0] - a[0]);

        container.innerHTML = `
            <div class="search-box mb-4">
                <input type="text" id="material-list-search" placeholder="Search by material or quarter..." oninput="usedMaterialsModule.filter()">
            </div>
            <div id="material-list-results">
                ${this.renderArchive(sortedYears)}
            </div>
        `;
        lucide.createIcons();
    },

    renderArchive(sortedYears) {
        if (sortedYears.length === 0) {
            return '<div class="empty-state">No materials used yet</div>';
        }

        return sortedYears.map(([year, months]) => `
            <div class="year-section mb-6">
                <h3 class="year-title flex items-center gap-2 mb-4 text-primary text-xl font-bold">
                    <i data-lucide="folder"></i> ${year}
                </h3>
                <div class="month-grid space-y-4">
                    ${Object.entries(months).sort((a, b) => new Date(a[0] + ' 1 ' + year) - new Date(b[0] + ' 1 ' + year)).map(([month, quarters]) => `
                        <div class="month-container bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
                            <div class="month-header p-4 bg-slate-800/50 flex justify-between items-center border-b border-slate-700">
                                <h4 class="flex items-center gap-2 text-indigo-400 font-bold">
                                    <i data-lucide="calendar" size="16"></i> ${month}
                                </h4>
                                ${auth.isAdmin() ? `
                                    <button onclick="usedMaterialsModule.downloadMonthlyCSV('${year}', '${month}')" class="btn-micro bg-primary/20 text-primary hover:bg-primary/30 p-1.5 rounded flex items-center gap-1 text-[10px]" title="Download Monthly CSV">
                                        <i data-lucide="download" size="12"></i> CSV
                                    </button>
                                ` : ''}
                            </div>
                            <div class="p-4 space-y-4">
                                ${Object.entries(quarters).map(([q, materials]) => `
                                    <div class="quarter-box">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded uppercase font-black">${q}</span>
                                        </div>
                                        <div class="space-y-2">
                                            ${materials.map(m => `
                                                <div class="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                                                    <div>
                                                        <div class="text-[13px] font-bold text-slate-100">${m.item}</div>
                                                        <div class="text-[9px] text-slate-500">${utils.formatDate(m.date)}</div>
                                                    </div>
                                                    <div class="text-xs text-accent font-black">Qty: ${m.quantity} ${utils.getUnit(m.item)}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    downloadMonthlyCSV(year, month) {
        const orders = storage.get('work_orders').filter(o => {
            if (o.status !== 'completed') return false;
            const d = new Date(o.completedAt);
            return d.getFullYear().toString() === year && d.toLocaleString('default', { month: 'long' }) === month;
        });

        if (orders.length === 0) {
            alert('No data for this month');
            return;
        }

        let csv = "Quarter,Work Order Date,Item Name,Quantity,Unit\n";
        orders.forEach(o => {
            o.materials.forEach(m => {
                csv += `"${o.quarter}","${utils.formatDate(o.completedAt)}","${m.item}",${m.quantity},"${utils.getUnit(m.item)}"\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `Used_Materials_${month}_${year}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    filter() {
        const query = document.getElementById('material-list-search').value.toLowerCase().trim();
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');

        const archive = {};
        orders.forEach(o => {
            const d = new Date(o.completedAt);
            const monthYear = d.toLocaleString('default', { month: 'long', year: 'numeric' });

            const filteredMaterials = o.materials.filter(m =>
                m.item.toLowerCase().includes(query) || o.quarter.toLowerCase().includes(query)
            );

            if (filteredMaterials.length > 0) {
                if (!archive[monthYear]) archive[monthYear] = {};
                if (!archive[monthYear][o.quarter]) archive[monthYear][o.quarter] = [];

                filteredMaterials.forEach(m => {
                    archive[monthYear][o.quarter].push({
                        ...m,
                        date: o.completedAt
                    });
                });
            }
        });

        const sortedMonths = Object.entries(archive).sort((a, b) => new Date(b[0]) - new Date(a[0]));
        document.getElementById('material-list-results').innerHTML = this.renderArchive(sortedMonths);
        lucide.createIcons();
    }
};
