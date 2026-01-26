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
                    ${auth.isOwner() ? `
                        <button onclick="gatePassModule.deletePass('${pass.id}')" class="btn-icon text-error/60 hover:text-error transition-colors p-2" title="Delete Gate Pass">
                            <i data-lucide="trash-2" size="18"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="received-items space-y-4">
                    ${pass.items.map(item => {
            const indents = storage.get('indents');
            const linkedIndent = indents.find(i => i.id === item.indentId);
            const sourceText = item.source || 'LOCAL';
            const sourceColor = sourceText === 'GEM' ? 'text-amber-400' : 'text-gold';
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
                    <button type="button" onclick="gatePassModule.addMaterialRow()" class="flex items-center gap-2 px-6 py-3 bg-primary text-slate-900 font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                        <i data-lucide="plus-circle" size="20"></i>
                        ADD ANOTHER MATERIAL
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
        row.className = 'gate-item-row bg-slate-800/40 border-2 border-slate-700/60 rounded-3xl p-6 mb-10 relative shadow-2xl';
        row.id = rowId;

        row.innerHTML = `
            <!-- MAIN MATERIAL CARD CONTENT -->
            <div class="space-y-6">
                <!-- 1. MATERIAL HEADER SECTION -->
                <div class="flex flex-col sm:flex-row gap-4 items-start border-b border-white/5 pb-6">
                    <div class="flex-1 w-full">
                        <label class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 block">Select Material</label>
                        <div class="relative group" onclick="gatePassModule.showMaterialPicker('${rowId}')">
                            <input type="text" class="mat-name-input w-full bg-slate-900/60 border-2 border-slate-700/50 text-base font-black text-slate-100 px-4 h-14 rounded-xl cursor-pointer hover:border-primary/50 transition-all shadow-inner" placeholder="Tap to search material..." readonly>
                            <i data-lucide="chevron-down" size="16" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 group-hover:text-primary transition-colors"></i>
                        </div>
                    </div>

                    <div class="w-full sm:w-32 shrink-0">
                        <label class="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1.5 block">Total Qty</label>
                        <div class="flex items-center gap-1">
                            <button type="button" onclick="this.nextElementSibling.stepDown()" class="w-10 h-14 bg-slate-700/50 border border-slate-600/50 rounded-l-xl flex items-center justify-center hover:bg-slate-600 text-white font-black text-xl">-</button>
                            <input type="number" class="total-qty-input qty-input w-12 h-14 font-black text-base text-primary bg-slate-900/80 border-y border-slate-600/50 text-center focus:ring-0" value="1" min="1">
                            <button type="button" onclick="this.previousElementSibling.stepUp()" class="w-10 h-14 bg-slate-700/50 border border-slate-600/50 rounded-r-xl flex items-center justify-center hover:bg-slate-600 text-white font-black text-xl">+</button>
                        </div>
                    </div>

                    <div class="pt-6">
                        <button type="button" onclick="this.closest('.gate-item-row').remove()" class="w-10 h-10 rounded-full bg-error/10 text-error/60 hover:bg-error hover:text-white transition-all flex items-center justify-center shadow-lg shadow-error/10">
                            <i data-lucide="trash-2" size="18"></i>
                        </button>
                    </div>
                </div>

                <!-- 2. INDENT LINKING COMPARTMENT -->
                <div class="bg-indigo-500/5 rounded-2xl border border-indigo-500/10 p-5">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                             <div class="p-1.5 bg-indigo-500/20 rounded-lg">
                                 <i data-lucide="link" size="14" class="text-indigo-400"></i>
                             </div>
                             <h5 class="text-[10px] text-indigo-300 uppercase font-black tracking-widest">Indent Source Connection</h5>
                        </div>
                        <span id="source-badge-${rowId}" class="text-[8px] px-2 py-0.5 rounded-full bg-slate-700 font-bold text-slate-400 uppercase tracking-tighter">Required</span>
                    </div>

                    <div id="indent-status-${rowId}" class="group relative bg-slate-900/80 border-2 border-dashed border-indigo-500/20 rounded-2xl p-4 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex items-center justify-between" onclick="gatePassModule.showIndentPicker('${rowId}')">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-lg group-hover:scale-110 transition-transform">
                                <i data-lucide="plus" id="status-icon-${rowId}"></i>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[11px] font-black text-indigo-100 uppercase" id="status-text-${rowId}">Select Matching Indent</span>
                                <span class="text-[9px] text-slate-500 font-bold" id="status-subtext-${rowId}">Linking is compulsory for Store items</span>
                            </div>
                        </div>
                        <div class="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <i data-lucide="search" size="14"></i>
                        </div>
                    </div>

                    <!-- Hidden Inputs -->
                    <input type="hidden" class="source-input" value="">
                    <input type="hidden" class="indent-id-input" value="">
                </div>

                <!-- 3. QUARTERLY DISTRIBUTION SECTION -->
                <div class="bg-primary/5 rounded-2xl border border-primary/10 p-5">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                             <div class="p-1.5 bg-primary/20 rounded-lg">
                                 <i data-lucide="calendar" size="14" class="text-primary"></i>
                             </div>
                             <h5 class="text-[10px] text-primary uppercase font-black tracking-widest">Quarterly Allocation</h5>
                        </div>
                        <button type="button" onclick="gatePassModule.addQuarterRow('${rowId}')" class="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black uppercase hover:bg-primary hover:text-slate-900 transition-colors">
                            <i data-lucide="plus" size="10"></i> Add Allocation
                        </button>
                    </div>
                    <div class="distribution-rows space-y-3"></div>
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
                <div class="flex items-center gap-1">
                    <button type="button" onclick="this.nextElementSibling.stepDown()" class="w-5 h-6 flex items-center justify-center bg-primary rounded hover:bg-primary/80 text-slate-900 font-black text-xs">-</button>
                    <input type="number" class="qtr-qty-input qty-input !w-8 !text-[11px] !h-6 font-black text-primary bg-slate-900/40 rounded text-center border-none focus:ring-0" value="1" min="1">
                    <button type="button" onclick="this.previousElementSibling.stepUp()" class="w-5 h-6 flex items-center justify-center bg-primary rounded hover:bg-primary/80 text-slate-900 font-black text-xs">+</button>
                </div>
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

    showIndentPicker(rowId) {
        const overlay = document.createElement('div');
        overlay.className = 'picker-overlay';
        overlay.id = 'indent-picker-modal';
        overlay.innerHTML = `
            <div class="picker-content !max-w-4xl !h-[90vh] flex flex-col p-0 overflow-hidden bg-[#0a0f18] border-primary/20">
                <!-- Picker Header -->
                <div class="p-6 border-b border-primary/10 bg-slate-900/50">
                    <div class="flex justify-between items-center mb-6">
                        <div class="flex items-center gap-3">
                            <div class="p-2 bg-primary/20 rounded-xl">
                                <i data-lucide="link" class="text-primary" size="20"></i>
                            </div>
                            <div>
                                <h3 class="text-white font-black uppercase tracking-widest text-lg">Indents Registry</h3>
                                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select an Indent to link with your material</p>
                            </div>
                        </div>
                        <button onclick="document.getElementById('indent-picker-modal').remove()" class="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <i data-lucide="x" class="text-slate-400"></i>
                        </button>
                    </div>

                    <!-- Search & Filter Bar -->
                    <div class="relative">
                        <i data-lucide="search" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
                        <input type="text" id="picker-search-input" 
                               class="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl pl-12 pr-4 h-14 text-sm font-bold text-white focus:border-primary transition-all placeholder:text-slate-600 shadow-inner" 
                               placeholder="Search by Indent # or Material Name..."
                               oninput="gatePassModule.renderCategorizedIndents('${rowId}', this.value)">
                    </div>
                </div>

                <!-- Scrollable Content -->
                <div class="flex-1 overflow-y-auto p-6 space-y-8 thin-scrollbar">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Local Section -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 px-2">
                                <div class="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                                <span class="text-xs text-emerald-400 font-black uppercase tracking-widest">Local Procurement</span>
                            </div>
                            <div class="local-list space-y-4"></div>
                        </div>

                        <!-- GeM Section -->
                        <div class="space-y-4">
                            <div class="flex items-center gap-3 px-2">
                                <div class="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                                <span class="text-xs text-blue-400 font-black uppercase tracking-widest">GeM Portal Registry</span>
                            </div>
                            <div class="gem-list space-y-4"></div>
                        </div>
                    </div>

                    <!-- Direct Stock Entry -->
                    <div class="pt-8 border-t border-white/5">
                        <div onclick="gatePassModule.selectIndent('${rowId}', 'NO_INDENT', '')" 
                             class="group p-6 bg-slate-800/40 border-2 border-dashed border-slate-700/50 rounded-3xl cursor-pointer hover:border-slate-300 transition-all flex flex-col items-center gap-4">
                             <div class="p-4 bg-slate-700/50 rounded-2xl group-hover:bg-primary/20 transition-colors">
                                <i data-lucide="layers" size="24" class="text-slate-500 group-hover:text-primary"></i>
                             </div>
                             <div class="text-center">
                                <span class="block text-sm font-black text-slate-400 group-hover:text-white uppercase tracking-widest">Direct Stock Entry</span>
                                <span class="text-[10px] text-slate-600 font-bold uppercase">Use this if there is no matching indent recorded</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.renderCategorizedIndents(rowId);
        lucide.createIcons();
    },

    renderCategorizedIndents(rowId, searchQuery = '') {
        const row = document.getElementById(rowId);
        if (!row) return;

        let allIndents = storage.get('indents')
            .filter(i => i.status === 'pending' || i.status === 'approved' || i.status === 'received')
            .sort((a, b) => new Date(b.indentDate) - new Date(a.indentDate));

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            allIndents = allIndents.filter(i =>
                (i.indentNumber && i.indentNumber.toLowerCase().includes(q)) ||
                i.items.some(item => item.item.toLowerCase().includes(q))
            );
        }

        const modal = document.getElementById('indent-picker-modal');
        const localList = modal.querySelector('.local-list');
        const gemList = modal.querySelector('.gem-list');

        const localIndents = allIndents.filter(i => i.type === 'LOCAL');
        const gemIndents = allIndents.filter(i => i.type === 'GEM');

        const renderChip = (indent, source) => {
            // Split items into bullet points for better readability
            const itemsList = indent.items.map(i => {
                const initial = i.initialQuantity !== undefined ? i.initialQuantity : i.quantity;
                const used = initial - i.quantity;
                const qtrTotal = i.quartersQty || 0;
                const qtrAvailable = Math.max(0, qtrTotal - used);
                return `
                    <div class="flex flex-col gap-1.5 p-3 bg-slate-800/40 rounded-xl border border-white/5">
                        <span class="text-[13px] text-slate-100 font-bold">${i.item}</span>
                        <div class="flex justify-between items-center text-[11px]">
                            <span class="text-slate-500 font-black uppercase tracking-widest">Share</span>
                            <span class="text-emerald-400 font-black">Available: ${qtrAvailable}</span>
                        </div>
                        <div class="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500/50" style="width: ${qtrTotal > 0 ? (qtrAvailable / qtrTotal) * 100 : 0}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div data-id="${indent.id}" data-source="${source}" onclick="gatePassModule.selectIndent('${rowId}', '${source}', '${indent.id}', '${indent.indentNumber}')" 
                     class="indent-chip group bg-[#111827] border-2 border-slate-700/50 rounded-2xl overflow-hidden hover:border-primary transition-all cursor-pointer mb-2 shadow-2xl">
                    
                    <div class="p-4 bg-slate-800/40 border-b border-slate-700/50 flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="p-1.5 bg-primary/10 rounded border border-primary/20">
                                <i data-lucide="hash" size="10" class="text-primary"></i>
                            </div>
                            <span class="text-[11px] font-black text-white uppercase tracking-tight">#${indent.indentNumber}</span>
                        </div>
                        <span class="text-[10px] text-slate-500 font-bold">${utils.renderDate(indent.indentDate)}</span>
                    </div>

                    <div class="p-4 space-y-1">
                        ${itemsList}
                    </div>
                </div>
            `;
        };

        localList.innerHTML = localIndents.length > 0 ? localIndents.map(i => renderChip(i, 'LOCAL')).join('') :
            `<div class="text-[10px] text-slate-600 italic py-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-white/5">No Matching Local Indents</div>`;

        gemList.innerHTML = gemIndents.length > 0 ? gemIndents.map(i => renderChip(i, 'GEM')).join('') :
            `<div class="text-[10px] text-slate-600 italic py-8 text-center bg-slate-900/40 rounded-3xl border border-dashed border-white/5">No Matching GeM Indents</div>`;

        lucide.createIcons();
    },

    selectIndent(rowId, source, indentId, indentNumber = '') {
        const row = document.getElementById(rowId);
        if (!row) return;

        // Update Hidden Inputs
        row.querySelector('.source-input').value = source;
        row.querySelector('.indent-id-input').value = indentId;

        // Update Status Display
        const statusText = document.getElementById(`status-text-${rowId}`);
        const statusSubtext = document.getElementById(`status-subtext-${rowId}`);
        const statusIcon = document.getElementById(`status-icon-${rowId}`);
        const sourceBadge = document.getElementById(`source-badge-${rowId}`);
        const statusContainer = document.getElementById(`indent-status-${rowId}`);

        // Reset classes
        statusContainer.classList.remove('border-dashed', 'border-indigo-500/20', 'bg-slate-900/80', 'bg-emerald-500/10', 'border-emerald-500/30', 'bg-blue-500/10', 'border-blue-500/30', 'bg-indigo-500/10', 'border-indigo-500/30');
        sourceBadge.classList.remove('bg-slate-700', 'text-slate-400', 'bg-emerald-500', 'text-white', 'bg-blue-500', 'bg-indigo-500');

        if (source === 'NO_INDENT') {
            statusText.textContent = 'Direct Stock (No Indent)';
            statusSubtext.textContent = 'Material will be taken from store stock';
            statusIcon.setAttribute('data-lucide', 'layers');
            statusIcon.className = 'text-emerald-400';
            statusContainer.classList.add('bg-emerald-500/10', 'border-emerald-500/30');
            sourceBadge.textContent = 'STOCK ENTRY';
            sourceBadge.classList.add('bg-emerald-500', 'text-white');
        } else {
            statusText.textContent = `Linked to Indent #${indentNumber}`;
            statusSubtext.textContent = `Source: ${source} PROCUREMENT`;
            statusIcon.setAttribute('data-lucide', 'check-circle');
            statusIcon.className = source === 'GEM' ? 'text-blue-400' : 'text-indigo-400';
            statusContainer.classList.add(source === 'GEM' ? 'bg-blue-500/10' : 'bg-indigo-500/10', source === 'GEM' ? 'border-blue-500/30' : 'border-indigo-500/30');
            sourceBadge.textContent = source;
            sourceBadge.classList.add(source === 'GEM' ? 'bg-blue-500' : 'bg-indigo-500', 'text-white');
        }

        // Close Modal
        const modal = document.getElementById('indent-picker-modal');
        if (modal) modal.remove();

        lucide.createIcons();
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
                    const normalize = (s) => {
                        if (!s) return '';
                        // Remove EVERYTHING before and including the last colon (category prefix)
                        const lastColonIndex = s.lastIndexOf(':');
                        const namePart = lastColonIndex !== -1 ? s.substring(lastColonIndex + 1) : s;
                        // Aggressive normalization: lowercase and remove all non-alphanumeric
                        return namePart.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                    };

                    const cleanMat = normalize(item);

                    const indentItem = indent.items.find(ii => {
                        const cleanIndentItem = normalize(ii.item);
                        // True equality or inclusion for robust matching
                        return cleanIndentItem === cleanMat || cleanIndentItem.includes(cleanMat) || cleanMat.includes(cleanIndentItem);
                    });

                    if (indentItem) {
                        if (indentItem.initialQuantity === undefined) {
                            indentItem.initialQuantity = parseInt(indentItem.quantity) || 0;
                        }

                        // Quarters Share from manual allocation
                        const qtrTotal = indentItem.quartersQty || 0;
                        const qToDeduct = parseInt(totalQuantity) || 0;

                        if (qToDeduct > qtrTotal) {
                            alert(`Error for "${item}": Cannot exceed Quarters Share (${qtrTotal} ${utils.getUnit(item)}). Please set or increase the Quarters Split in the Indent module first.`);
                            return;
                        }

                        indentItem.quantity = Math.max(0, (parseInt(indentItem.quantity) || 0) - qToDeduct);

                        // Check if entire indent is now fulfilled
                        // Note: If an indent is 50% fulfilled via gate pass, it might still have 50% left for LAB.
                        // But for Gate Pass tracking, we consider it fulfilled when Quarters share is used?
                        // Actually, let's keep it simple: just deduct.
                        const allFulfilled = indent.items.every(ii => (parseInt(ii.quantity) || 0) <= 0);
                        if (allFulfilled) indent.status = 'received';
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
            if (category === 'Starters') {
                this.showStarterOptions(rowId, material);
            } else {
                row.querySelector('.mat-name-input').value = `${category} : ${material}`;
                document.getElementById('material-picker-modal').remove();
            }
        }
    },

    showStarterOptions(rowId, starterType) {
        const modal = document.getElementById('material-picker-modal');
        const container = modal.querySelector('.picker-main');
        const sidebar = modal.querySelector('.picker-sidebar');
        const searchArea = modal.querySelector('.picker-search');

        sidebar.classList.add('hidden');
        searchArea.classList.add('hidden');

        const category = DATA.materials.find(m => m.name === 'Starters');

        if (starterType === 'DOL Starter') {
            container.innerHTML = `
                <div class="p-4">
                    <h5 class="text-xs font-bold text-primary mb-3">Select Phase for DOL Starter</h5>
                    <div class="grid grid-cols-2 gap-2">
                        ${category.phases.map(p => `
                            <button type="button" class="picker-item" onclick="gatePassModule.showStarterRatings('${rowId}', 'DOL Starter', '${p}')">
                                ${p}
                            </button>
                        `).join('')}
                    </div>
                    <button type="button" onclick="gatePassModule.showMaterialPicker('${rowId}')" class="btn-sm btn-outline mt-4 w-full">Back</button>
                </div>
            `;
        } else {
            // Star Delta
            this.showStarterRatings(rowId, 'Star Delta Starter', null);
        }
    },

    showStarterRatings(rowId, starterType, phase) {
        const modal = document.getElementById('material-picker-modal');
        const container = modal.querySelector('.picker-main');
        const category = DATA.materials.find(m => m.name === 'Starters');
        const ratings = category.ratings[starterType];

        container.innerHTML = `
            <div class="p-4">
                <h5 class="text-xs font-bold text-primary mb-3">Select Rating for ${starterType} ${phase ? '(' + phase + ')' : ''}</h5>
                <div class="grid grid-cols-2 gap-2">
                    ${ratings.map(r => `
                        <button type="button" class="picker-item" onclick="gatePassModule.finalizeStarter('${rowId}', '${starterType}', '${phase}', '${r}')">
                            ${r}
                        </button>
                    `).join('')}
                </div>
                <button type="button" onclick="gatePassModule.showStarterOptions('${rowId}', '${starterType}')" class="btn-sm btn-outline mt-4 w-full">Back</button>
            </div>
        `;
    },

    finalizeStarter(rowId, starterType, phase, rating) {
        const row = document.getElementById(rowId);
        // Handle potential 'null' or 'undefined' strings from template literals
        const hasPhase = phase && phase !== 'null' && phase !== 'undefined';
        const finalName = hasPhase ? `${starterType} (${phase} - ${rating})` : `${starterType} (${rating})`;
        row.querySelector('.mat-name-input').value = `Starters : ${finalName}`;
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

    deletePass(id) {
        if (confirm('Permanently delete this Gate Pass record? This will NOT restore quantities in Indents.')) {
            const passes = storage.get('gate_passes').filter(p => p.id !== id);
            storage.set('gate_passes', passes);
            this.render(document.getElementById('view-content'));
        }
    }
};
