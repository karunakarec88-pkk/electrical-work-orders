const gatePassModule = {
    rowCount: 0,
    render(container) {
        const passes = storage.get('gate_passes').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = `
            <div class="gate-pass-actions mb-4">
                <button onclick="gatePassModule.showNewPassForm()" class="btn-group-primary w-full p-3 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                    <i data-lucide="plus"></i> New Gate Pass Entry
                </button>
            </div>
            <div id="gate-passes-list" class="space-y-4">
                ${this.renderList(passes)}
            </div>
        `;
        lucide.createIcons();
    },

    renderList(passes) {
        if (passes.length === 0) {
            return '<div class="empty-state">No gate pass records found</div>';
        }

        const completedOrders = storage.get('work_orders').filter(o => o.status === 'completed');

        return passes.map(pass => `
            <div class="pass-card p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div class="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                    <div>
                        <span class="text-xs text-muted">Pass No: <strong>${utils.sanitize(pass.gatePassNo || pass.id.slice(-6))}</strong></span>
                        <h4 class="font-bold text-slate-100">${utils.renderDate(pass.gatePassDate || pass.createdAt)}</h4>
                    </div>
                </div>
                <div class="received-items space-y-4">
                    ${pass.items.map(item => {
            const indents = storage.get('indents');
            const linkedIndent = indents.find(i => i.id === item.indentId);
            const sourceText = item.source || 'LOCAL';
            const sourceColor = sourceText === 'GEM' ? 'text-amber-400' : 'text-indigo-400';
            const indentDisplay = linkedIndent
                ? `<span class="flex items-center ml-2 border-l border-slate-700 pl-2">
                    <span class="indent-badge">Indent: ${linkedIndent.indentNumber}</span>
                    <span class="ml-2 text-[10px] font-black uppercase ${sourceColor}">${sourceText}</span>
                   </span>`
                : `<span class="flex items-center ml-2 border-l border-slate-700 pl-2">
                    <span class="ml-1 text-[10px] font-black uppercase ${sourceColor}">${sourceText}</span>
                   </span>`;

            // Prep material name for matching
            const gpMaterial = item.item.toLowerCase();

            return `
                            <div class="pass-item-container">
                                <div class="flex justify-between items-center mb-3">
                                    <span class="font-bold text-slate-100">${item.item.replace(/\s(GEM|LOCAL)$/i, '')}</span>
                                    <span class="flex items-center">
                                        <span class="text-accent font-extrabold">: ${item.quantity} ${utils.getUnit(item.item)}</span>
                                        ${indentDisplay}
                                    </span>
                                </div>
                                <div class="pass-distribution-grid">
                                    ${item.distributions ? item.distributions.map(d => {
                // Calculate Used Quantity from completed work orders for THIS quarter and THIS material
                const usedQty = completedOrders
                    .filter(o => o.quarter === d.quarter)
                    .flatMap(o => o.materials)
                    .filter(m => {
                        const woMaterial = (m.category + ' : ' + m.item).toLowerCase();
                        return woMaterial.startsWith(gpMaterial) || gpMaterial.startsWith(woMaterial);
                    })
                    .reduce((sum, m) => sum + m.quantity, 0);

                const leftQty = Math.max(0, d.quantity - usedQty);

                return `
                                        <div class="pass-distribution-box">
                                            <div class="flex-1">
                                                <span class="text-[9px] text-primary/80 font-black uppercase tracking-wider">${d.quarter}</span>
                                            </div>
                                            
                                            <div class="tracking-status-grid">
                                                <div class="tracking-status-item">
                                                    <span class="status-label">Issued</span>
                                                    <span class="status-value value-issued">${d.quantity}</span>
                                                </div>
                                                <div class="tracking-status-item">
                                                    <span class="status-label">Used</span>
                                                    <span class="status-value value-used">${usedQty}</span>
                                                </div>
                                                <div class="tracking-status-item">
                                                    <span class="status-label text-green-500/80">Colony Store</span>
                                                    <span class="status-value value-left">${leftQty}</span>
                                                </div>
                                            </div>
                                        </div>
                                    `;
            }).join('') : `
                                        <div class="pass-distribution-box">
                                            <span class="text-[10px] text-slate-400">No Distribution Data</span>
                                        </div>
                                    `}
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `).join('');
    },

    showNewPassForm() {
        const container = document.getElementById('view-content');
        const today = new Date().toISOString().split('T')[0];
        const allMaterials = DATA.materials.flatMap(m => m.items);

        container.innerHTML = `
            <div class="form-container">
                <h3>New Gate Pass Entry</h3>
                <p class="text-sm text-muted mb-4">Record materials entering the Colony Store Room</p>
                
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="form-group">
                        <label>Gate Pass No</label>
                        <input type="text" id="gate-pass-no" placeholder="Enter No...">
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" id="gate-pass-date" value="${today}">
                    </div>
                </div>

                <div id="pass-items" class="gate-entry-list mb-6">
                    <!-- Material items will be added here -->
                </div>

                <div class="flex justify-center mb-6">
                    <button type="button" onclick="gatePassModule.addMaterialRow()" class="btn-primary-outline flex items-center gap-2">
                        <i data-lucide="plus-circle" size="18"></i>
                        Add Another Material
                    </button>
                </div>

                <datalist id="material-suggestions">
                    ${Array.from(new Set(allMaterials)).map(m => `<option value="${m}">`).join('')}
                </datalist>

                <div class="form-actions mt-6 flex gap-2">
                    <button type="button" onclick="router.navigate('gate-pass')" class="btn-secondary flex-1">Back</button>
                    <button type="button" onclick="gatePassModule.submitPass()" class="btn-primary flex-1">Save Gate Pass</button>
                </div>
            </div>
        `;
        this.addMaterialRow();
        lucide.createIcons();
    },

    addMaterialRow() {
        this.rowCount++;
        const section = document.getElementById('pass-items');
        const rowId = 'mat-' + this.rowCount + '-' + Date.now();
        const row = document.createElement('div');
        row.className = 'gate-item-row mb-3';
        row.id = rowId;

        row.innerHTML = `
            <!-- PRIMARY HEADER ROW -->
            <div class="gate-row-header !h-auto py-2" style="margin-bottom: 20px;">
                <!-- 1. Material (Flex: 1) -->
                <div class="gate-col-mat">
                    <input type="text" class="mat-name-input w-full bg-slate-800/40 border border-slate-700/50 text-[11px] font-bold text-slate-100 px-3 h-10 rounded-lg" placeholder="Tap to select material..." readonly onclick="gatePassModule.showMaterialPicker('${rowId}')">
                </div>

                <!-- 2. Qty Block (Shrink: 0) -->
                <div class="gate-col-qty !w-24">
                    <span class="text-[9px] text-slate-500 uppercase font-black">Quantity</span>
                    <div class="flex items-center gap-1 mt-1">
                        <button type="button" onclick="this.nextElementSibling.stepDown()" class="w-6 h-7 bg-black/20 rounded hover:bg-black/40 text-slate-400 text-[12px]">-</button>
                        <input type="number" class="total-qty-input qty-input !w-8 !text-[12px] !h-7 font-bold text-primary bg-transparent text-center border-none focus:ring-0" value="1" min="1">
                        <button type="button" onclick="this.previousElementSibling.stepUp()" class="w-6 h-7 bg-black/20 rounded hover:bg-black/40 text-slate-400 text-[12px]">+</button>
                    </div>
                </div>

                <!-- Metadata Inputs -->
                <input type="hidden" class="source-input" value="">
                <input type="hidden" class="indent-id-input" value="">

                <!-- 6. Delete Block -->
                <div class="gate-col-delete">
                    <button type="button" onclick="event.stopPropagation(); this.closest('.gate-item-row').remove()" class="text-slate-500 hover:text-error transition-colors p-2">
                        <i data-lucide="trash-2" size="16"></i>
                    </button>
                </div>
            </div>

            <!-- INDENT STATUS DISPLAY -->
            <div class="px-2" style="margin-bottom: 25px;">
                <div id="indent-status-${rowId}" class="flex items-center gap-2 py-2.5 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg cursor-pointer hover:bg-indigo-500/20 transition-all" onclick="gatePassModule.toggleIndentList('${rowId}')">
                    <i data-lucide="plus-circle" size="14" class="text-indigo-400" id="status-icon-${rowId}"></i>
                    <span class="text-[10px] text-indigo-100 font-bold" id="status-text-${rowId}">Add Indent</span>
                    <span class="text-[8px] text-indigo-400 ml-auto uppercase font-black hover:underline" id="status-action-${rowId}">Select</span>
                </div>
            </div>

            <!-- INDENT SELECTION AREA -->
            <div class="px-2" style="margin-bottom: 20px;">
                <div id="indent-selection-${rowId}" class="bg-indigo-500/10 rounded-lg border border-indigo-500/20 p-2 space-y-3 hidden shadow-inner" style="margin-top: 15px; margin-bottom: 15px;">
                    <!-- Local Section -->
                    <div>
                        <div class="flex items-center gap-2 mb-1.5 opacity-80">
                             <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             <span class="text-[9px] text-slate-200 uppercase font-black tracking-wider">Local Indents</span>
                        </div>
                        <div class="local-list flex flex-wrap gap-2 min-h-[20px]"></div>
                    </div>

                    <!-- Gem Section -->
                    <div>
                        <div class="flex items-center gap-2 mb-1.5 opacity-80">
                             <div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                             <span class="text-[9px] text-slate-200 uppercase font-black tracking-wider">Gem Indents</span>
                        </div>
                        <div class="gem-list flex flex-wrap gap-2 min-h-[20px]"></div>
                    </div>

                    <!-- No Indent Section -->
                    <div class="pt-1 border-t border-slate-700/30">
                        <div id="no-indent-chip-${rowId}" onclick="gatePassModule.selectIndent('${rowId}', 'NO_INDENT', '')" 
                             class="indent-chip w-full p-2 bg-slate-800 border border-slate-700 rounded cursor-pointer hover:border-slate-500 transition-all flex items-center justify-center gap-2">
                             <i data-lucide="minus-circle" size="12" class="text-slate-500"></i>
                             <span class="text-[10px] font-bold text-slate-300">No Indent (Material Available in Stock)</span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- COLLAPSIBLE DETAILS -->
            <div class="p-2" style="margin-top: 15px;">
                <div class="distribution-section bg-black/10 rounded-lg p-2 border border-slate-700/20">
                    <div class="flex justify-between items-center mb-2">
                        <div class="flex items-center gap-2">
                             <i data-lucide="layout-grid" size="10" class="text-primary/70"></i>
                             <h5 class="text-[9px] text-slate-400 uppercase font-black">Quarterly Distribution</h5>
                        </div>
                        <button type="button" onclick="gatePassModule.addQuarterRow('${rowId}')" class="btn-micro bg-primary/20 text-primary border border-primary/30 rounded px-2 py-0.5 text-[8px] font-black uppercase">
                            + ADD QTR
                        </button>
                    </div>
                    <div class="distribution-rows space-y-1.5"></div>
                </div>
            </div>
        `;
        section.appendChild(row);
        this.renderCategorizedIndents(rowId);
        this.addQuarterRow(rowId);
        lucide.createIcons();
    },

    addQuarterRow(matRowId) {
        const matRow = document.getElementById(matRowId);
        if (!matRow) return;
        const container = matRow.querySelector('.distribution-rows');
        const qRowId = 'qtr-' + Date.now();
        const qRow = document.createElement('div');
        qRow.className = 'qtr-row-header';
        qRow.id = qRowId;

        const allQuarters = [];
        DATA.quarters.forEach(q => {
            if (q.children) allQuarters.push(...q.children);
            else allQuarters.push(q.name);
        });

        qRow.innerHTML = `
            <!-- 1. Quarter Dropdown -->
            <div class="qtr-col-name" style="min-width: 0; flex: 1;">
                <input type="text" class="qtr-name-input w-full text-[10px] h-[32px] bg-slate-800/40 border border-slate-700/30 rounded px-2 text-slate-100" list="quarter-suggestions" placeholder="Select Quarter...">
            </div>

            <!-- 2. Qty Block -->
            <div class="qtr-col-qty" style="flex-shrink: 0;">
                <span class="text-[8px] text-slate-500 uppercase font-black">Qty</span>
                <button type="button" onclick="this.nextElementSibling.stepDown()" class="w-5 h-6 flex items-center justify-center bg-black/20 rounded hover:bg-black/40 text-slate-400 text-[10px]">-</button>
                <input type="number" class="qtr-qty-input qty-input !w-7 !text-[11px] !h-6 font-bold text-primary bg-transparent text-center border-none focus:ring-0" value="1" min="1">
                <button type="button" onclick="this.previousElementSibling.stepUp()" class="w-5 h-6 flex items-center justify-center bg-black/20 rounded hover:bg-black/40 text-slate-400 text-[10px]">+</button>
            </div>

            <!-- 3. Delete Block -->
            <div class="qtr-col-delete" style="flex-shrink: 0;" onclick="this.closest('.qtr-row-header').remove()">
                <i data-lucide="trash-2" size="12"></i>
            </div>

            <datalist id="quarter-suggestions">
                ${allQuarters.map(q => `<option value="${q}">`).join('')}
            </datalist>
        `;
        container.appendChild(qRow);
        lucide.createIcons();
    },

    toggleIndentList(rowId) {
        const row = document.getElementById(rowId);
        const list = document.getElementById(`indent-selection-${rowId}`);
        if (!list) return;

        const isHidden = list.classList.contains('hidden');
        if (isHidden) {
            list.classList.remove('hidden');
            this.renderCategorizedIndents(rowId);
        } else {
            list.classList.add('hidden');
        }
    },

    renderCategorizedIndents(rowId) {
        const row = document.getElementById(rowId);
        if (!row) return;

        const allIndents = storage.get('indents').filter(i =>
            i.status === 'pending' || i.status === 'approved' || i.status === 'received'
        );

        const localList = row.querySelector('.local-list');
        const gemList = row.querySelector('.gem-list');

        const localIndents = allIndents.filter(i => i.type === 'LOCAL');
        const gemIndents = allIndents.filter(i => i.type === 'GEM');

        const renderChip = (indent, source) => `
            <div data-id="${indent.id}" data-source="${source}" onclick="gatePassModule.selectIndent('${rowId}', '${source}', '${indent.id}', '${indent.indentNumber}')" 
                 class="indent-chip p-2 bg-slate-800 border border-slate-700 rounded cursor-pointer hover:border-indigo-500/50 transition-all min-w-[100px]">
                <div class="flex flex-col">
                    <span class="text-[10px] font-bold text-slate-200">#${indent.indentNumber}</span>
                    <span class="text-[8px] text-slate-500">${utils.renderDate(indent.indentDate)}</span>
                </div>
            </div>
        `;

        localList.innerHTML = localIndents.length > 0 ? localIndents.map(i => renderChip(i, 'LOCAL')).join('') :
            `<div class="text-[8px] text-slate-600 italic py-1">No Local Indents</div>`;

        gemList.innerHTML = gemIndents.length > 0 ? gemIndents.map(i => renderChip(i, 'GEM')).join('') :
            `<div class="text-[8px] text-slate-600 italic py-1">No Gem Indents</div>`;
    },

    selectIndent(rowId, source, indentId, indentNumber = '') {
        const row = document.getElementById(rowId);
        if (!row) return;

        // Update Hidden Inputs
        row.querySelector('.source-input').value = source;
        row.querySelector('.indent-id-input').value = indentId;

        // Update Status Display
        const statusText = document.getElementById(`status-text-${rowId}`);
        const statusIcon = document.getElementById(`status-icon-${rowId}`);
        const statusAction = document.getElementById(`status-action-${rowId}`);
        const statusContainer = document.getElementById(`indent-status-${rowId}`);

        // Reset classes first to avoid accumulation
        statusContainer.classList.remove('bg-indigo-500/10', 'border-indigo-500/20', 'bg-emerald-500/10', 'border-emerald-500/20', 'bg-blue-500/10', 'border-blue-500/20');

        if (source === 'NO_INDENT') {
            statusText.textContent = 'Stock Record (No Indent)';
            statusIcon.innerHTML = `<i data-lucide="package-check" size="14" class="text-emerald-400"></i>`;
            statusAction.textContent = 'Change';
            statusContainer.classList.add('bg-emerald-500/10', 'border-emerald-500/20');
        } else {
            statusText.textContent = `Linked to Indent #${indentNumber}`;
            statusIcon.innerHTML = `<i data-lucide="link-2" size="14" class="text-blue-400"></i>`;
            statusAction.textContent = 'Change';
            statusContainer.classList.add('bg-blue-500/10', 'border-blue-500/20');
        }
        lucide.createIcons();

        // Hide the selection list
        document.getElementById(`indent-selection-${rowId}`).classList.add('hidden');

        // Handle Chip Highlighting (Indent Chips)
        row.querySelectorAll('.indent-chip').forEach(chip => {
            if (chip.dataset.id === indentId && indentId !== '') {
                chip.classList.add('active', '!border-indigo-500', '!bg-indigo-500/20');
            } else {
                chip.classList.remove('active', '!border-indigo-500', '!bg-indigo-500/20');
            }
        });

        // Handle No Indent Chip specifically
        const noIndentChip = document.getElementById(`no-indent-chip-${rowId}`);
        if (source === 'NO_INDENT') {
            noIndentChip.classList.add('active', '!border-slate-400', '!bg-slate-700');
        } else {
            noIndentChip.classList.remove('active', '!border-slate-400', '!bg-slate-700');
        }
    },

    submitPass() {
        const gatePassNo = document.getElementById('gate-pass-no').value;
        const gatePassDate = document.getElementById('gate-pass-date').value;

        if (!gatePassNo) {
            alert('Please enter Gate Pass No');
            return;
        }

        const rows = Array.from(document.querySelectorAll('.gate-item-row'));
        const items = [];
        const indentsToUpdate = storage.get('indents');

        for (const row of rows) {
            const item = row.querySelector('.mat-name-input').value;
            const totalQuantity = parseInt(row.querySelector('.total-qty-input').value);
            const sourceInput = row.querySelector('.source-input');
            const source = sourceInput ? sourceInput.value : '';
            const indentId = row.querySelector('.indent-id-input')?.value;

            if (!item) continue;

            if (!source) {
                alert(`Please select an available indent (Local or Gem) for: ${item}.\nIf not available, select "No Indent".`);
                return;
            }

            if (source !== 'NO_INDENT' && !indentId) {
                alert(`Please link a valid indent number for: ${item}.\nLinking is compulsory for selected Local/Gem category.`);
                return;
            }

            const distRows = Array.from(row.querySelectorAll('.qtr-row-header'));
            const distributions = distRows.map(dr => ({
                quarter: dr.querySelector('.qtr-name-input').value,
                quantity: parseInt(dr.querySelector('.qtr-qty-input').value)
            })).filter(d => d.quarter && d.quantity > 0);

            if (distributions.length === 0) {
                alert(`Please add at least one quarter for item: ${item}`);
                return;
            }

            const currentSum = distributions.reduce((sum, d) => sum + d.quantity, 0);
            if (currentSum !== totalQuantity) {
                alert(`For item "${item}", the sum of quarter quantities (${currentSum}) must equal the total quantity (${totalQuantity}).`);
                return;
            }

            items.push({ item, quantity: totalQuantity, distributions, source, indentId });

            if (indentId) {
                const indent = indentsToUpdate.find(i => i.id === indentId);
                if (indent) {
                    const indentItem = indent.items.find(ii =>
                        ii.item.toLowerCase().includes(item.toLowerCase()) ||
                        item.toLowerCase().includes(ii.item.toLowerCase())
                    );
                    if (indentItem) {
                        indentItem.quantity = Math.max(0, indentItem.quantity - totalQuantity);
                        const allReceived = indent.items.every(ii => ii.quantity <= 0);
                        if (allReceived) indent.status = 'received';
                    }
                }
            }
        }

        if (items.length === 0) {
            alert('Please add at least one item');
            return;
        }

        const passes = storage.get('gate_passes');
        passes.push({
            id: Date.now().toString(),
            gatePassNo,
            gatePassDate,
            items,
            createdAt: new Date().toISOString()
        });

        storage.set('gate_passes', passes);
        storage.set('indents', indentsToUpdate);

        router.navigate('gate-pass');
    },

    showMaterialPicker(rowId) {
        const modalId = 'material-picker-modal';
        let modal = document.getElementById(modalId);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'picker-overlay';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="picker-modal">
                <div class="picker-header flex justify-between items-center p-4 border-b border-white/10">
                    <h4 class="text-primary font-bold">Select Material</h4>
                    <button type="button" onclick="document.getElementById('${modalId}').remove()" class="btn-close">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="picker-search p-4 bg-black/20">
                    <input type="text" id="picker-search-input" placeholder="Search materials..." oninput="gatePassModule.filterPickerItems('${rowId}', this.value)" class="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-sm">
                </div>

                <div class="picker-split-container">
                    <div class="picker-sidebar">
                        ${DATA.materials.map((cat, idx) => `
                            <button type="button" class="cat-btn ${idx === 0 ? 'active' : ''}" onclick="gatePassModule.switchCategory('${rowId}', '${cat.name}', this)">
                                <i data-lucide="package" size="14"></i>
                                ${cat.name}
                            </button>
                        `).join('')}
                    </div>
                    <div class="picker-main">
                        <div id="item-list-container" class="item-grid">
                            ${this.renderPickerItems(rowId, DATA.materials[0].name, DATA.materials[0].items)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    },

    renderPickerItems(rowId, categoryName, items) {
        return items.map(item => `
            <button type="button" class="picker-item" onclick="gatePassModule.selectMaterial('${rowId}', '${categoryName}', '${item}')">
                ${item}
            </button>
        `).join('');
    },

    switchCategory(rowId, categoryName, btn) {
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = DATA.materials.find(c => c.name === categoryName);
        const container = document.getElementById('item-list-container');
        if (category && container) {
            container.innerHTML = this.renderPickerItems(rowId, category.name, category.items);
        }
    },

    selectMaterial(rowId, category, material) {
        const row = document.getElementById(rowId);
        if (row) {
            row.querySelector('.mat-name-input').value = `${category} : ${material}`;
        }
        document.getElementById('material-picker-modal').remove();
    },

    filterPickerItems(rowId, query) {
        const container = document.getElementById('item-list-container');
        const sidebar = document.querySelector('.picker-sidebar');
        query = query.toLowerCase().trim();

        if (!query) {
            sidebar.classList.remove('hidden');
            const activeBtn = document.querySelector('.cat-btn.active');
            if (activeBtn) {
                const categoryName = activeBtn.textContent.trim();
                const category = DATA.materials.find(c => c.name === categoryName);
                if (category) {
                    container.innerHTML = this.renderPickerItems(rowId, category.name, category.items);
                }
            }
            return;
        }

        sidebar.classList.add('hidden');
        const results = [];
        DATA.materials.forEach(cat => {
            cat.items.forEach(item => {
                const fullText = (cat.name + ' ' + item).toLowerCase();
                if (fullText.includes(query)) {
                    results.push({ category: cat.name, item });
                }
            });
        });

        if (results.length === 0) {
            container.innerHTML = '<div class="col-span-full text-center text-slate-500 py-8 text-xs">No materials found matching "' + query + '"</div>';
        } else {
            container.innerHTML = results.map(res => `
                <button type="button" class="picker-item" onclick="gatePassModule.selectMaterial('${rowId}', '${res.category}', '${res.item}')">
                    <span class="block text-[9px] text-primary/70 uppercase mb-1">${res.category}</span>
                    ${res.item}
                </button>
            `).join('');
        }
    },

};
