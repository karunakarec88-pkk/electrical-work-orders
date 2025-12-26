const inventoryModule = {
    currentTab: 'quarter',
    currentYear: null,
    currentMonth: null,

    render(container) {
        container.innerHTML = `
            <div class="inventory-controls">
                <div class="tab-buttons">
                    <button id="tab-quarter" onclick="inventoryModule.switchTab('quarter')" class="tab-btn active">By Quarter</button>
                    <button id="tab-material" onclick="inventoryModule.switchTab('material')" class="tab-btn">By Material</button>
                    <button id="tab-store" onclick="inventoryModule.switchTab('store')" class="tab-btn">Unused Materials</button>
                </div>
                <div id="search-container" class="search-box mt-2">
                    <input type="text" id="inventory-search" placeholder="Type to search..." oninput="inventoryModule.filter()">
                </div>
            </div>
            <div id="inventory-results" class="mt-4"></div>
            
            <div id="inventory-actions" class="hidden">
                ${auth.isAdmin() ? `
                    <div class="admin-actions">
                        <button onclick="inventoryModule.downloadCSV()" class="btn-primary w-full mt-4">
                            <i data-lucide="download"></i> Download CSV (Admin Only)
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        this.switchTab('quarter');
        lucide.createIcons();
    },

    switchTab(tab) {
        this.currentTab = tab;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`tab-${tab}`).classList.add('active');

        const searchBox = document.getElementById('search-container');
        const actions = document.getElementById('inventory-actions');

        searchBox.classList.remove('hidden');
        actions.classList.remove('hidden');
        this.filter();
    },

    filter() {
        const input = document.getElementById('inventory-search');
        if (input) {
            const rawValue = input.value;
            const formatted = utils.formatQuarter(rawValue);
            if (rawValue !== formatted) {
                input.value = formatted;
            }
        }

        const query = input?.value.toLowerCase().trim() || '';
        const results = document.getElementById('inventory-results');
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');

        // Show all results by default, no query needed

        if (this.currentTab === 'quarter') {
            this.renderByQuarter(results, orders, query);
        } else if (this.currentTab === 'material') {
            this.renderByMaterial(results, orders, query);
        } else if (this.currentTab === 'store') {
            this.renderUnusedMaterials(results, query);
        }
        lucide.createIcons();
    },

    renderByQuarter(container, orders, query) {
        // Group by quarter
        const matchedOrders = orders.filter(o => o.quarter.toLowerCase().includes(query))
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        if (matchedOrders.length === 0) {
            container.innerHTML = '<p class="text-center">No matches found</p>';
            return;
        }

        container.innerHTML = matchedOrders.map(o => `
            <div class="inventory-detail-card">
                <div class="card-header">
                    <strong>${o.quarter}</strong>
                    <span class="text-muted">${utils.renderDate(o.createdAt)}</span>
                </div>
                <div class="card-body">
                    <p class="mb-1"><em>${utils.sanitize(o.remarks || 'No remarks')}</em></p>
                    <div class="material-list-small">
                        ${o.materials.length > 0 ? o.materials.map(m => `
                            <span class="material-tag">${m.item} : ${m.quantity} ${utils.getUnit(m.item)}</span>
                        `).join('') : '<span class="text-muted">No material used</span>'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderByMaterial(container, orders, query) {
        const results = [];
        orders.forEach(o => {
            o.materials.forEach(m => {
                if (m.item.toLowerCase().includes(query)) {
                    results.push({
                        quarter: o.quarter,
                        date: o.createdAt,
                        material: m.item,
                        quantity: m.quantity
                    });
                }
            });
        });

        if (results.length === 0) {
            container.innerHTML = '<p class="text-center">No matches found</p>';
            return;
        }

        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = results.map(r => `
            <div class="inventory-detail-card">
                <div class="card-header">
                    <strong>${r.material}</strong>
                    <span class="text-muted">${utils.renderDate(r.date)}</span>
                </div>
                <div class="card-body">
                    <div class="flex-bw">
                        <span>Quarter: ${r.quarter}</span>
                        <strong>Qty : ${r.quantity} ${utils.getUnit(r.material)}</strong>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderUnusedMaterials(container, query) {
        const indents = storage.get('indents').filter(i => i.status !== 'archived');
        const passes = storage.get('gate_passes');
        const usedOrders = storage.get('work_orders').filter(o => o.status === 'completed');

        const metrics = {};

        // Helper to normalize material names for matching
        const normalize = (name) => {
            if (!name) return '';
            return name
                .split(' : ').pop() // Remove category prefix if present
                .replace(/\s*\([^)]*\)$/, '') // Remove rating suffixes like (16A)
                .replace(/\s(GEM|LOCAL)$/i, '') // Remove source suffixes
                .trim()
                .toLowerCase();
        };

        // 1. Process Indents
        indents.forEach(indent => {
            indent.items.forEach(item => {
                const rawName = item.item;
                const normName = normalize(rawName);
                if (!metrics[normName]) metrics[normName] = { displayName: rawName, indent: 0, gatepass: 0, used: 0 };
                metrics[normName].indent += (item.initialQuantity !== undefined ? item.initialQuantity : item.quantity);
            });
        });

        // 2. Process Gate Passes
        passes.forEach(pass => {
            pass.items.forEach(item => {
                const normName = normalize(item.item);
                if (!metrics[normName]) metrics[normName] = { displayName: item.item.split(' : ').pop(), indent: 0, gatepass: 0, used: 0 };
                metrics[normName].gatepass += item.quantity;
            });
        });

        // 3. Process Used Materials
        usedOrders.forEach(order => {
            order.materials.forEach(m => {
                const normName = normalize(m.item);
                if (!metrics[normName]) metrics[normName] = { displayName: m.item, indent: 0, gatepass: 0, used: 0 };
                metrics[normName].used += m.quantity;
            });
        });

        const filteredMetrics = Object.entries(metrics).filter(([normName, data]) =>
            data.displayName.toLowerCase().includes(query.toLowerCase()) || normName.includes(query.toLowerCase())
        );

        if (filteredMetrics.length === 0) {
            container.innerHTML = '<p class="text-center">No materials found matching search</p>';
            return;
        }

        container.innerHTML = `
            <div class="space-y-3">
                ${filteredMetrics.map(([normName, data]) => {
            const sectionQty = data.indent - data.gatepass;
            const colonyQty = data.gatepass - data.used;
            const unit = utils.getUnit(data.displayName);

            return `
                        <div class="inventory-detail-card !p-3">
                            <div class="flex justify-between items-center mb-3">
                                <strong class="text-base text-slate-100">${data.displayName}</strong>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                                    <span class="text-[9px] uppercase font-black text-indigo-400 block mb-1">Section Store</span>
                                    <span class="text-sm font-bold text-slate-200">${sectionQty} ${unit}</span>
                                </div>
                                <div class="bg-accent/10 p-2 rounded border border-accent/20">
                                    <span class="text-[9px] uppercase font-black text-accent block mb-1">Colony Store</span>
                                    <span class="text-sm font-bold text-slate-200">${colonyQty} ${unit}</span>
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    downloadCSV() {
        const query = document.getElementById('inventory-search')?.value || 'inventory';
        const orders = storage.get('work_orders').filter(o => o.status === 'completed');
        let csvContent = "data:text/csv;charset=utf-8,";

        if (this.currentTab === 'quarter') {
            csvContent += "Quarter,Date Received,Completed Date,Remarks,Material,Quantity\n";
            orders.filter(o => o.quarter.toLowerCase().includes(query.toLowerCase())).forEach(o => {
                if (o.materials.length === 0) {
                    csvContent += `"${o.quarter}","${utils.formatDate(o.createdAt)}","${utils.formatDate(o.completedAt)}","${o.remarks}","N/A",0\n`;
                } else {
                    o.materials.forEach(m => {
                        csvContent += `"${o.quarter}","${utils.formatDate(o.createdAt)}","${utils.formatDate(o.completedAt)}","${o.remarks}","${m.item}",${m.quantity} ${utils.getUnit(m.item)}\n`;
                    });
                }
            });
        } else {
            csvContent += "Material,Quarter,Date,Quantity\n";
            orders.forEach(o => {
                o.materials.forEach(m => {
                    if (m.item.toLowerCase().includes(query.toLowerCase())) {
                        csvContent += `"${m.item}","${o.quarter}","${utils.formatDate(o.createdAt)}",${m.quantity} ${utils.getUnit(m.item)}\n`;
                    }
                });
            });
        }

        this.triggerDownload(csvContent, `Inventory_${this.currentTab}_${query}.csv`);
    },

    triggerDownload(csvContent, filename) {
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
