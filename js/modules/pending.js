const pendingModule = {
    render(container) {
        const orders = storage.get('work_orders')
            .filter(o => o.status === 'pending')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No pending work orders</div>';
            return;
        }

        container.innerHTML = `
            <div class="orders-list">
                ${orders.map(order => `
                    <div class="order-card">
                        <div class="order-header">
                            <span class="quarter-tag">${order.quarter}</span>
                            <span class="date-tag">${utils.renderDate(order.createdAt)}</span>
                        </div>
                        <p class="remarks">${utils.sanitize(order.remarks)}</p>
                        <div class="action-buttons">
                            <button onclick="pendingModule.markCompleted('${order.id}')" class="btn-accent btn-sm">
                                <i data-lucide="check"></i> Complete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    currentMaterials: [],
    tempMaterials: [],

    markCompleted(id) {
        this.currentMaterials = []; // Clear for new session
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <h3>Complete Work Order</h3>
            <div class="form-group">
                <label>Select Technicians (Multi-select)</label>
                <div class="tech-grid">
                    ${DATA.technicians.map(t => `
                        <label class="checkbox-container">
                            <input type="checkbox" name="technicians" value="${t}">
                            <span class="checkmark"></span>
                            ${t}
                        </label>
                    `).join('')}
                </div>
            </div>

            <div class="form-group">
                <label>Material Used</label>
                <div class="no-material-option">
                    <label class="checkbox-container">
                        <input type="checkbox" id="no-material" onchange="pendingModule.toggleMaterialInput(this)">
                        <span class="checkmark"></span>
                        No material used for this work
                    </label>
                </div>
                <div id="material-picker-area">
                    <button type="button" onclick="pendingModule.openMaterialPicker('${id}')" class="btn-primary-outline w-full flex items-center justify-center gap-2">
                        <i data-lucide="plus-circle"></i> ADD / EDIT MATERIALS
                    </button>
                    <div id="selected-materials-summary" class="selected-summary-card hidden">
                        <!-- Summary tags will appear here -->
                    </div>
                </div>
            </div>

            <button onclick="pendingModule.saveCompletion('${id}')" class="btn-primary w-full">SUBMIT COMPLETION</button>
        `;
        lucide.createIcons();
    },


    openMaterialPicker(orderId) {
        // Clone current selections into temp
        this.tempMaterials = JSON.parse(JSON.stringify(this.currentMaterials));

        const overlay = document.createElement('div');
        overlay.className = 'picker-overlay';
        overlay.id = 'picker-overlay';

        overlay.innerHTML = `
            <div class="picker-content">
                <div class="picker-header">
                    <div class="flex-1">
                        <h3 class="flex items-center gap-2 mb-3">
                            <i data-lucide="layers" class="text-primary"></i>
                            Select Materials
                        </h3>
                        <div class="relative">
                            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" style="width: 14px; height: 14px;"></i>
                            <input type="text" id="picker-search" placeholder="Search materials..." class="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-sm focus:border-primary focus:outline-none transition-all" oninput="pendingModule.renderPickerItems()">
                        </div>
                    </div>
                    <button onclick="document.getElementById('picker-overlay').remove()" class="btn-icon self-start ml-4">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="picker-body">
                    <div class="picker-sidebar no-scrollbar" id="picker-sidebar">
                        ${DATA.materials.map((cat, idx) => `
                            <button onclick="pendingModule.renderPickerItems('${cat.name}')" class="picker-category-btn ${idx === 0 ? 'active' : ''}" data-cat="${cat.name}">
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                    <div class="picker-main no-scrollbar" id="picker-items-list">
                        <!-- Items will be rendered here -->
                    </div>
                </div>
                
                <div class="picker-footer">
                    <button onclick="pendingModule.applyPickerSelections()" class="btn-primary px-10">
                        APPLY SELECTIONS
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        lucide.createIcons();

        // Render initial category
        this.renderPickerItems(DATA.materials[0].name);
    },

    renderPickerItems(categoryName) {
        const searchInput = document.getElementById('picker-search');
        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const list = document.getElementById('picker-items-list');
        const sidebar = document.getElementById('picker-sidebar');

        if (categoryName) {
            this.activeCategory = categoryName;
            document.querySelectorAll('.picker-category-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-cat') === categoryName);
            });
        }

        let html = '';

        if (search) {
            sidebar.style.opacity = '0.3';
            sidebar.style.pointerEvents = 'none';

            DATA.materials.forEach(cat => {
                const matches = cat.items.filter(item =>
                    item.toLowerCase().includes(search) || cat.name.toLowerCase().includes(search)
                );

                if (matches.length > 0) {
                    html += `<div class="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-3 mt-4">${cat.name}</div>`;
                    html += matches.map(item => this.getItemRowHtml(cat, item)).join('');
                }
            });

            if (!html) html = '<div class="empty-state">No materials match your search</div>';
        } else {
            sidebar.style.opacity = '1';
            sidebar.style.pointerEvents = 'auto';
            const cat = DATA.materials.find(m => m.name === this.activeCategory);
            if (cat) {
                html = cat.items.map(item => this.getItemRowHtml(cat, item)).join('');
            }
        }

        list.innerHTML = html;
        lucide.createIcons();
    },

    getItemRowHtml(category, item) {
        const existing = this.tempMaterials.find(m => m.category === category.name && m.baseItem === item);
        const qty = existing ? existing.quantity : 0;
        const ratingValue = existing ? existing.rating : '';

        let configHtml = '';
        if (category.name === 'MCB' && category.ratings) {
            let ratings = category.ratings;
            if (item.startsWith('SP') || item.startsWith('DP')) ratings = ratings.filter(r => r !== '60A');
            configHtml = `
                <select class="rating-select mt-2" onchange="pendingModule.updateTempItem('${category.name}', '${item}', null, this.value)">
                    <option value="">Rating...</option>
                    ${ratings.map(r => `<option value="${r}" ${r === ratingValue ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            `;
        } else if (category.name === 'Switches & Sockets' && item.includes('Modular') && category.companies) {
            configHtml = `
                <select class="rating-select mt-2" onchange="pendingModule.updateTempItem('${category.name}', '${item}', null, this.value)">
                    <option value="">Company...</option>
                    ${category.companies.map(c => `<option value="${c}" ${c === ratingValue ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            `;
        } else if (category.name === 'Starters' && item) {
            if (item === 'DOL Starter') {
                configHtml = `
                    <select class="rating-select mt-2" onchange="pendingModule.updateTempItem('${category.name}', '${item}', null, null, this.value)">
                        <option value="">Phase...</option>
                        ${category.phases.map(p => `<option value="${p}" ${p === existing?.phase ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                    <select class="rating-select mt-1" onchange="pendingModule.updateTempItem('${category.name}', '${item}', null, this.value)">
                        <option value="">Rating...</option>
                        ${category.ratings['DOL Starter'].map(r => `<option value="${r}" ${r === ratingValue ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                `;
            } else if (item === 'Star Delta Starter') {
                configHtml = `
                    <select class="rating-select mt-2" onchange="pendingModule.updateTempItem('${category.name}', '${item}', null, this.value)">
                        <option value="">Rating...</option>
                        ${category.ratings['Star Delta Starter'].map(r => `<option value="${r}" ${r === ratingValue ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                `;
            }
        }

        return `
            <div class="picker-item-row" data-cat="${category.name}" data-item="${item}">
                <div class="picker-item-info">
                    <span class="picker-item-name">${item}</span>
                    ${configHtml}
                </div>
                <div class="qty-control sm">
                    <button type="button" onclick="pendingModule.updateTempItem('${category.name}', '${item}', -1)" class="qty-btn">-</button>
                    <input type="number" class="qty-input-bulk" value="${qty}" readonly>
                    <button type="button" onclick="pendingModule.updateTempItem('${category.name}', '${item}', 1)" class="qty-btn">+</button>
                </div>
            </div>
        `;
    },

    updateTempItem(categoryName, item, delta, newRating, newPhase) {
        let existingIndex = this.tempMaterials.findIndex(m => m.category === categoryName && m.baseItem === item);

        if (existingIndex === -1) {
            if (delta <= 0 && !newRating) return;
            this.tempMaterials.push({
                category: categoryName,
                baseItem: item,
                item: item,
                quantity: 0,
                rating: '',
                phase: ''
            });
            existingIndex = this.tempMaterials.length - 1;
        }

        const m = this.tempMaterials[existingIndex];
        if (delta !== null) m.quantity = Math.max(0, m.quantity + delta);
        if (newRating !== undefined && newRating !== null) m.rating = newRating;
        if (newPhase !== undefined && newPhase !== null) m.phase = newPhase;

        if (m.phase && m.rating) {
            m.item = `${m.baseItem} (${m.phase} - ${m.rating})`;
        } else if (m.rating) {
            m.item = `${m.baseItem} (${m.rating})`;
        } else {
            m.item = m.baseItem;
        }

        const row = document.querySelector(`.picker-item-row[data-cat="${categoryName}"][data-item="${item}"]`);
        if (row) row.querySelector('.qty-input-bulk').value = m.quantity;
    },

    applyPickerSelections() {
        this.currentMaterials = this.tempMaterials.filter(m => m.quantity > 0);
        const overlay = document.getElementById('picker-overlay');
        if (overlay) overlay.remove();

        const summary = document.getElementById('selected-materials-summary');
        if (this.currentMaterials.length > 0) {
            summary.classList.remove('hidden');
            summary.innerHTML = this.currentMaterials.map(m => `
                <span class="selected-item-tag">
                    ${m.item} : ${m.quantity} ${utils.getUnit(m.item)}
                </span>
            `).join('');
        } else {
            summary.classList.add('hidden');
        }
    },

    toggleMaterialInput(checkbox) {
        const wrapper = document.getElementById('material-picker-area');
        if (checkbox.checked) {
            wrapper.style.opacity = '0.5';
            wrapper.style.pointerEvents = 'none';
        } else {
            wrapper.style.opacity = '1';
            wrapper.style.pointerEvents = 'auto';
        }
    },

    saveCompletion(id) {
        const orderId = id;
        const selectedTechs = Array.from(document.querySelectorAll('input[name="technicians"]:checked')).map(cb => cb.value);
        const noMaterial = document.getElementById('no-material').checked;

        if (selectedTechs.length === 0) {
            alert('Please select at least one technician');
            return;
        }

        const materialsUsed = noMaterial ? [] : this.currentMaterials;

        if (!noMaterial && materialsUsed.length === 0) {
            alert('Please add at least one material or check "No material used"');
            return;
        }

        const orders = storage.get('work_orders');
        const orderIndex = orders.findIndex(o => o.id === orderId);

        if (orderIndex !== -1) {
            orders[orderIndex].status = 'completed';
            orders[orderIndex].completedAt = new Date().toISOString();
            orders[orderIndex].technicians = selectedTechs;
            orders[orderIndex].materials = materialsUsed;

            storage.set('work_orders', orders);
            this.currentMaterials = [];
            router.navigate('home');
        }
    }
};
