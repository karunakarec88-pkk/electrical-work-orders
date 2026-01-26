const indentsModule = {
    render(container, searchQuery = '') {
        let indents = storage.get('indents').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Migration: Set latest indent's name to "D V.RAO" if requested and missing
        if (indents.length > 0 && !indents[0].indentorName) {
            indents[0].indentorName = 'D V.RAO';
            storage.set('indents', indents);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            indents = indents.filter(indent => {
                const matchesIndentNo = (indent.indentNumber || '').toLowerCase().includes(query);
                const matchesIndentor = (indent.indentorName || '').toLowerCase().includes(query);
                const matchesMaterials = indent.items.some(item => (item.item || '').toLowerCase().includes(query));
                return matchesIndentNo || matchesIndentor || matchesMaterials;
            });
        }

        container.innerHTML = `
            <div class="indent-actions space-y-4 mb-6">
                <button onclick="indentsModule.showNewIndentForm()" class="btn-primary w-full shadow-lg shadow-primary/20">
                    <i data-lucide="plus"></i> Create New Indent
                </button>
                
                <div class="search-box relative">
                    <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size="18"></i>
                    <input type="text" 
                           placeholder="Search by Material, No, or Indentor..." 
                           class="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-sm focus:border-primary outline-none transition-all"
                           value="${searchQuery}"
                           oninput="indentsModule.handleSearch(this.value)">
                </div>
            </div>
            <div id="indents-list" class="space-y-10 pb-20">
                ${this.renderList(indents)}
            </div>
        `;
        lucide.createIcons();
    },

    handleSearch(query) {
        this.render(document.getElementById('view-content'), query);
    },

    renderList(indents) {
        if (indents.length === 0) {
            return '<div class="empty-state">No indents created yet</div>';
        }

        return indents.map(indent => `
            <div class="indent-group">
                <div class="indent-card px-5 py-6 bg-slate-800/40 border-2 border-slate-700/50 rounded-2xl shadow-xl shadow-black/20 mb-8">
                    <div class="flex justify-between items-start border-b border-slate-700 pb-2 mb-2">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs text-muted">Indent No: <strong>${utils.sanitize(indent.indentNumber || 'N/A')}</strong></span>
                                <span class="text-[10px] bg-slate-700 px-1.5 rounded uppercase font-bold text-slate-300">${indent.type || 'LOCAL'}</span>
                                <div class="flex ml-auto" style="gap: 12px;">
                                    <button onclick="indentsModule.viewIndentDetails('${indent.id}')" class="btn-micro bg-slate-700 hover:bg-slate-600 text-slate-300 p-1 rounded" title="View Details">
                                        <i data-lucide="eye" size="12"></i>
                                    </button>
                                    ${auth.isOwner() ? `
                                        <button onclick="indentsModule.downloadIndentCSV('${indent.id}')" class="btn-micro bg-primary/20 hover:bg-primary/30 text-primary p-1 rounded" title="Download CSV">
                                            <i data-lucide="download" size="12"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            <h4 class="text-primary mt-1">Date: ${utils.renderDate(indent.indentDate) || utils.renderDate(indent.createdAt)}</h4>
                            ${indent.indentorName ? `<p class="text-[11px] font-bold text-slate-300 mt-1 flex items-center gap-1.5"><i data-lucide="user" size="10"></i> INDENTOR: ${utils.sanitize(indent.indentorName)}</p>` : ''}
                            ${indent.approvedAt ? `<p class="text-[10px] text-muted-foreground mt-1">Approved: ${utils.renderDate(indent.approvedAt)}</p>` : ''}
                        </div>
                    </div>
                    <div class="material-summary mt-3 space-y-3">
                        ${(() => {
                const gatePasses = storage.get('gate_passes');
                return indent.items.map((item, idx) => {
                    const normalize = (s) => {
                        if (!s) return '';
                        const lastColonIndex = s.lastIndexOf(':');
                        const namePart = lastColonIndex !== -1 ? s.substring(lastColonIndex + 1) : s;
                        return namePart.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
                    };

                    // Find Gate Passes that used this specific item from this indent to calculate true initial qty if missing
                    let totalFromPasses = 0;
                    gatePasses.forEach(gp => {
                        gp.items.forEach(gi => {
                            const cleanGPItem = normalize(gi.item);
                            const cleanIndentItem = normalize(item.item);
                            if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                                totalFromPasses += (parseInt(gi.quantity) || 0);
                            }
                        });
                    });

                    const remainingQty = parseInt(item.quantity) || 0;
                    const initialQty = item.initialQuantity !== undefined ? (parseInt(item.initialQuantity) || 0) : (remainingQty + totalFromPasses);
                    const usedQty = initialQty - remainingQty;
                    const isCompleted = remainingQty <= 0;
                    const unit = utils.getUnit(item.item);

                    const linkedPasses = [];
                    gatePasses.forEach(gp => {
                        gp.items.forEach(gi => {
                            const cleanGPItem = normalize(gi.item);
                            const cleanIndentItem = normalize(item.item);
                            if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                                if (gi.distributions) {
                                    gi.distributions.forEach(d => {
                                        linkedPasses.push({
                                            no: gp.gatePassNo || gp.id.slice(-6),
                                            qty: d.quantity,
                                            quarter: d.quarter
                                        });
                                    });
                                } else {
                                    linkedPasses.push({
                                        no: gp.gatePassNo || gp.id.slice(-6),
                                        qty: gi.quantity,
                                        quarter: gi.quarter || 'N/A'
                                    });
                                }
                            }
                        });
                    });

                    return `
                                    <div class="indent-item-box">
                                            <div class="flex flex-col">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <span class="text-base font-black text-slate-400">(${idx + 1})</span>
                                                    <span class="text-lg font-black indent-item-highlight ${isCompleted ? 'opacity-50 line-through' : ''}">${item.item}</span>
                                                    ${!isCompleted && (usedQty / initialQty) >= 0.8 ? `
                                                        <span class="usage-warning-badge pulse-warning" title="High Usage Alert: 80% or more used">
                                                            <i data-lucide="alert-triangle" size="12"></i> ATTENTION
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </div>
                                            ${auth.isOwner() ? `
                                                <button onclick="indentsModule.openAllocationModal('${indent.id}', '${item.item.replace(/'/g, "\\'")}')" class="btn-micro bg-primary/20 text-primary hover:bg-primary/40 rounded px-2 py-1 text-[10px] font-bold">
                                                    MANAGE SPLIT
                                                </button>
                                            ` : ''}
                                        </div>
                                        <div class="mt-6 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                                            <div class="p-4 border-b border-white/5 flex items-center bg-slate-800/10 gap-3">
                                                <span class="w-24 text-[9px] text-slate-500 uppercase font-black tracking-widest">Purchased</span>
                                                <div>
                                                    <span class="text-xl text-slate-100 font-black">: ${initialQty}</span>
                                                    <span class="text-xs text-slate-600 font-bold italic ml-1">${unit}</span>
                                                </div>
                                            </div>
                                            <div class="bg-slate-900/60 py-2 px-4 border-b border-white/5">
                                                <p class="text-[9px] text-primary/80 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                                    <i data-lucide="share-2" size="10"></i> Material Sharing Breakdown
                                                </p>
                                            </div>
                                            <div class="flex gap-2 border-b border-white/5 bg-slate-900/40 p-1">
                                                <div class="flex-1 p-3 rounded-xl bg-gold/10 border border-white/5 text-center">
                                                    <span class="block text-[8px] text-amber-500 uppercase font-black mb-1">LAB Split</span>
                                                    <input type="number" 
                                                           class="w-full bg-transparent border-none text-gold font-black p-0 focus:ring-0 text-xl h-8 text-center" 
                                                           value="${item.labQty || 0}" 
                                                           step="0.5"
                                                           onchange="indentsModule.updateInlineSplit('${indent.id}', '${item.item.replace(/'/g, "\\'")}', 'lab', this.value)">
                                                </div>
                                                <div class="flex-1 p-3 rounded-xl bg-emerald-500/5 border border-white/5 text-center">
                                                    <span class="block text-[8px] text-emerald-400/60 uppercase font-black mb-1">Quarters Split</span>
                                                    <input type="number" 
                                                           class="w-full bg-transparent border-none text-emerald-200 font-black p-0 focus:ring-0 text-xl h-8 text-center" 
                                                           value="${item.quartersQty || 0}" 
                                                           step="0.5"
                                                           onchange="indentsModule.updateInlineSplit('${indent.id}', '${item.item.replace(/'/g, "\\'")}', 'quarters', this.value)">
                                                </div>
                                            </div>
                                            <div class="p-4 flex flex-col items-center justify-center bg-emerald-500/10 gap-1 text-center">
                                                <span class="text-[9px] text-emerald-400/70 uppercase font-black tracking-widest leading-tight">QUARTERS<br>SECTION STORE</span>
                                                <div class="flex items-baseline justify-center">
                                                    <span class="text-xl text-emerald-300 font-black">: ${(item.quartersQty || 0) - usedQty}</span>
                                                    <span class="text-xs text-emerald-400/50 font-bold italic ml-2">&nbsp; ${unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                        ${linkedPasses.length > 0 ? `
                                            <div class="mt-4 pt-3 border-t border-slate-700/30">
                                                <p class="text-[9px] uppercase font-black text-primary/60 mb-2 flex items-center gap-1.5 px-1">
                                                    <i data-lucide="history" size="10"></i> Gate Pass Usage Breakdown:
                                                </p>
                                                <div class="space-y-1.5">
                                                    ${linkedPasses.map(lp => `
                                                        <div class="flex justify-between items-center text-[11px] bg-slate-900/50 p-2 rounded border border-white/5">
                                                            <span class="text-slate-400">GP: <strong class="text-slate-200">${lp.no}</strong> <span class="text-[9px] opacity-60 ml-1">(${lp.quarter})</span></span>
                                                            <span class="text-accent font-black"> : ${lp.qty} ${unit}</span>
                                                        </div>
                                                    `).join('')}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                }).join('');
            })()}
                    </div>
                    ${indent.attachment ? `
                        <div class="mt-2 pt-2 border-t border-slate-700/50">
                            <button onclick="indentsModule.viewAttachment('${indent.attachment.replace(/'/g, "\\'")}')" class="attachment-link border-0 bg-transparent cursor-pointer p-0">
                                <i data-lucide="eye" size="12"></i> View Attachment
                            </button>
                        </div>
                    ` : ''}
                    ${indent.status === 'pending' ? `
                        <div class="mt-3 flex gap-2">
                            ${auth.isOwner() ? `
                                <button onclick="indentsModule.deleteIndent('${indent.id}')" class="btn-sm btn-outline text-error">Cancel</button>
                                <button onclick="indentsModule.approveIndent('${indent.id}')" class="btn-sm btn-accent">Approve</button>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="h-1 w-24 bg-slate-800/50 mx-auto rounded-full mb-12"></div>
            </div>
        `).join('');
    },

    showNewIndentForm() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="form-container">
                <h3>Create New Indent</h3>
                
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="form-group">
                        <label>Indent Number</label>
                        <input type="text" id="indent-no" placeholder="Enter No...">
                    </div>
                    <div class="form-group">
                        <label>Indentor Name</label>
                        <input type="text" id="indentor-name" placeholder="Enter Name...">
                    </div>
                    <div class="form-group">
                        <label>Indent Date</label>
                        <input type="date" id="indent-date" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select id="indent-type" class="w-full">
                            <option value="LOCAL">LOCAL</option>
                            <option value="GEM">GEM</option>
                        </select>
                    </div>
                </div>

                <div class="mt-4">
                    <div class="form-group">
                        <label>Attachment (Optional)</label>
                        <input type="file" id="indent-attachment" class="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80">
                    </div>
                </div>

                <div class="mt-6">
                    <label class="block mb-2 text-sm text-muted">Material Requisition</label>
                    <div id="indent-items" class="space-y-4">
                        <!-- Dynamic material rows -->
                    </div>
                    <button onclick="indentsModule.addMaterialRow()" class="btn-outline btn-sm mt-4">
                        <i data-lucide="plus"></i> Add Material
                    </button>
                </div>
                <div class="form-actions mt-6 flex gap-2">
                    <button onclick="router.navigate('indents')" class="btn-secondary flex-1">Back</button>
                    <button onclick="indentsModule.submitIndent()" class="btn-primary flex-1">Submit Indent</button>
                </div>
            </div>
        `;
        this.addMaterialRow();
        lucide.createIcons();
    },

    addMaterialRow() {
        const section = document.getElementById('indent-items');
        const row = document.createElement('div');
        row.className = 'gate-item-row bg-slate-800/40 border-2 border-slate-700/60 rounded-3xl p-6 mb-10 relative shadow-2xl flex flex-col gap-4';
        row.innerHTML = `
            <div class="flex gap-4 items-center">
                <div class="flex-1">
                    <select class="material-select w-full" onchange="indentsModule.onMaterialChange(this)">
                        <option value="">Select Category...</option>
                        ${DATA.materials.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                    </select>
                    <div class="sub-material-container mt-1"></div>
                </div>
                <div class="qty-control h-12">
                    <button onclick="this.nextElementSibling.stepDown()" class="qty-btn">-</button>
                    <input type="number" class="qty-input" value="1" min="1">
                    <button onclick="this.previousElementSibling.stepUp()" class="qty-btn">+</button>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="btn-icon text-error">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
            
            <div class="allocation-grid grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/30">
                <div class="form-group mb-0">
                    <label class="text-[10px] uppercase font-black text-slate-500 mb-1">LAB Allocation</label>
                    <input type="number" class="lab-qty w-full !bg-slate-900/50 !border-slate-700/50 text-indigo-300 font-bold" value="0" step="0.5">
                </div>
                <div class="form-group mb-0">
                    <label class="text-[10px] uppercase font-black text-slate-500 mb-1">Quarters Allocation</label>
                    <input type="number" class="quarters-qty w-full !bg-slate-900/50 !border-slate-700/50 text-emerald-300 font-bold" value="0" step="0.5">
                </div>
            </div>
        `;
        section.appendChild(row);
        lucide.createIcons();
    },

    onMaterialChange(select) {
        const categoryName = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);
        const container = select.nextElementSibling;

        if (category) {
            container.innerHTML = `
                <select class="sub-material-select w-full" onchange="indentsModule.onSubMaterialChange(this, '${categoryName}')">
                    <option value="">Select Item...</option>
                    ${category.items.map(i => `<option value="${i}">${i}</option>`).join('')}
                </select>
                <div class="extra-options mt-1"></div>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    onSubMaterialChange(select, categoryName) {
        const container = select.nextElementSibling;
        const item = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);

        if (categoryName === 'Starters' && item) {
            if (item === 'DOL Starter') {
                container.innerHTML = `
                    <select class="phase-select w-full" onchange="indentsModule.onPhaseChange(this, 'Starters', 'DOL Starter')">
                        <option value="">Select Phase...</option>
                        ${category.phases.map(p => `<option value="${p}">${p}</option>`).join('')}
                    </select>
                    <div class="rating-container mt-1"></div>
                `;
            } else if (item === 'Star Delta Starter') {
                container.innerHTML = `
                    <select class="rating-select w-full">
                        <option value="">Select Rating...</option>
                        ${category.ratings['Star Delta Starter'].map(r => `<option value="${r}">${r}</option>`).join('')}
                    </select>
                `;
            }
        } else {
            container.innerHTML = '';
        }
    },

    onPhaseChange(select, categoryName, subItem) {
        const container = select.nextElementSibling;
        const phase = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);

        if (phase && category.ratings[subItem]) {
            container.innerHTML = `
                <select class="rating-select w-full">
                    <option value="">Select Rating...</option>
                    ${category.ratings[subItem].map(r => `<option value="${r}">${r}</option>`).join('')}
                </select>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    async submitIndent() {
        const indentNumber = document.getElementById('indent-no').value;
        const indentorName = document.getElementById('indentor-name').value;
        const indentDate = document.getElementById('indent-date').value;
        const type = document.getElementById('indent-type').value;
        const fileInput = document.getElementById('indent-attachment');

        if (!indentNumber) {
            alert('Please enter an Indent Number');
            return;
        }

        const rows = Array.from(document.querySelectorAll('.gate-item-row'));
        const items = rows.map(row => {
            const category = row.querySelector('.material-select').value;
            const subSelect = row.querySelector('.sub-material-select');
            const phaseSelect = row.querySelector('.phase-select');
            const ratingSelect = row.querySelector('.rating-select');

            const item = subSelect ? subSelect.value : null;
            const phase = phaseSelect ? phaseSelect.value : null;
            const rating = ratingSelect ? ratingSelect.value : null;
            const quantity = parseFloat(row.querySelector('.qty-input').value) || 0;
            const labQty = parseFloat(row.querySelector('.lab-qty').value) || 0;
            const quartersQty = parseFloat(row.querySelector('.quarters-qty').value) || 0;

            if (Math.abs((labQty + quartersQty) - quantity) > 0.01) {
                alert(`Allocation mismatch for ${item || 'item'}. LAB (${labQty}) + Quarters (${quartersQty}) must equal Total (${quantity})`);
                throw new Error('Allocation mismatch');
            }

            let finalItem = item;
            if (phase && rating) {
                finalItem = `${item} (${phase} - ${rating})`;
            } else if (rating) {
                finalItem = `${item} (${rating})`;
            }

            return {
                category,
                item: finalItem,
                quantity,
                initialQuantity: quantity,
                labQty,
                quartersQty
            };
        }).filter(i => i.category && i.item);

        if (items.length === 0) {
            alert('Please add at least one material');
            return;
        }

        let attachment = null;
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit for localStorage safety
                alert('File is too large. Please upload document smaller than 2MB.');
                return;
            }
            attachment = await this.fileToBase64(file);
        }

        const indents = storage.get('indents');
        indents.push({
            id: Date.now().toString(),
            indentNumber,
            indentorName,
            indentDate,
            type,
            attachment,
            createdAt: new Date().toISOString(),
            status: 'pending',
            items: items
        });

        storage.set('indents', indents);
        router.navigate('indents');
    },

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    },

    approveIndent(id) {
        const indents = storage.get('indents');
        const idx = indents.findIndex(i => i.id === id);
        if (idx !== -1) {
            indents[idx].status = 'approved';
            indents[idx].approvedAt = new Date().toISOString();
            storage.set('indents', indents);
            this.render(document.getElementById('view-content'));
        }
    },

    openAllocationModal(indentId, itemName) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === indentId);
        if (!indent) return;

        const item = indent.items.find(i => i.item === itemName);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'picker-overlay';
        overlay.id = 'allocation-modal';
        overlay.innerHTML = `
            <div class="picker-content !max-w-md !h-auto p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-primary font-black uppercase tracking-widest text-sm">Update Material Split</h3>
                    <button onclick="this.closest('.picker-overlay').remove()" class="text-slate-500 hover:text-white">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="bg-slate-900/50 p-4 rounded-2xl border border-white/5 mb-6">
                    <p class="text-[10px] text-slate-500 font-bold uppercase mb-1">Material Name</p>
                    <p class="font-black text-slate-100">${item.item}</p>
                    <p class="text-[10px] text-primary font-bold mt-2">TOTAL PURCHASED: ${item.initialQuantity || item.quantity}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group mb-4">
                        <label class="text-[10px] uppercase font-black text-indigo-400">LAB Allocation</label>
                        <input type="number" id="modal-lab-qty" class="w-full !bg-slate-800 !border-slate-700 text-indigo-200 font-bold" value="${item.labQty || 0}" step="0.5">
                    </div>
                    <div class="form-group mb-4">
                        <label class="text-[10px] uppercase font-black text-emerald-400">Quarters Allocation</label>
                        <input type="number" id="modal-qtr-qty" class="w-full !bg-slate-800 !border-slate-700 text-emerald-200 font-bold" value="${item.quartersQty || 0}" step="0.5">
                    </div>
                </div>

                <button onclick="indentsModule.saveAllocation('${indentId}', '${itemName.replace(/'/g, "\\'")}')" class="btn-primary w-full mt-4">SAVE ALLOCATION</button>
            </div>
        `;
        document.body.appendChild(overlay);
        lucide.createIcons();
    },

    saveAllocation(indentId, itemName) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === indentId);
        if (!indent) return;

        const item = indent.items.find(i => i.item === itemName);
        if (!item) return;

        const lab = parseFloat(document.getElementById('modal-lab-qty').value) || 0;
        const qtr = parseFloat(document.getElementById('modal-qtr-qty').value) || 0;
        const total = item.initialQuantity || item.quantity;

        if (Math.abs((lab + qtr) - total) > 0.01) {
            alert(`Allocation mismatch. LAB (${lab}) + Quarters (${qtr}) must equal Total (${total})`);
            return;
        }

        item.labQty = lab;
        item.quartersQty = qtr;

        storage.set('indents', indents);
        document.getElementById('allocation-modal').remove();
        this.render(document.getElementById('view-content'));
    },

    updateInlineSplit(indentId, itemName, type, value) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === indentId);
        if (!indent) return;

        const item = indent.items.find(i => i.item === itemName);
        if (!item) return;

        const numVal = parseFloat(value) || 0;
        const total = item.initialQuantity || item.quantity;

        if (type === 'lab') {
            item.labQty = numVal;
            // Optionally auto-adjust quarters if you want, but user said "enter sharing by me"
            // So we'll just check for mismatch if they both exist
        } else {
            item.quartersQty = numVal;
        }

        // Just validate total doesn't exceed purchased if both are set? 
        // Or just let them enter and we'll warn on Gate Pass if Quarters is too high?
        // User wants "enter sharing by me", so let them.

        storage.set('indents', indents);
        this.render(document.getElementById('view-content'));
    },

    downloadIndentCSV(id) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === id);
        if (!indent) return;

        const gatePasses = storage.get('gate_passes');
        const approvalDate = indent.approvedAt ? utils.formatDate(indent.approvedAt) : 'N/A';

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Indent No,Date of Received (Approved),Item Name,Purchased Qty,Gatepass No,Used Quarter,Used Qty\n";

        const normalize = (s) => {
            if (!s) return '';
            const lastColonIndex = s.lastIndexOf(':');
            const namePart = lastColonIndex !== -1 ? s.substring(lastColonIndex + 1) : s;
            return namePart.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        };

        indent.items.forEach(item => {
            // Find total received from passes for initial qty calculation
            let totalFromPasses = 0;
            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    const cleanGPItem = normalize(gi.item);
                    const cleanIndentItem = normalize(item.item);
                    if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                        totalFromPasses += (parseInt(gi.quantity) || 0);
                    }
                });
            });

            const remainingQty = parseInt(item.quantity) || 0;
            const initialQty = item.initialQuantity !== undefined ? (parseInt(item.initialQuantity) || 0) : (remainingQty + totalFromPasses);
            let hasGP = false;

            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    const cleanGPItem = normalize(gi.item);
                    const cleanIndentItem = normalize(item.item);
                    if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                        hasGP = true;
                        const dists = gi.distributions || [{ quarter: gi.quarter || 'N/A', quantity: gi.quantity }];
                        dists.forEach(d => {
                            csvContent += `"${indent.indentNumber}","${approvalDate}","${item.item}",${initialQty},"${gp.gatePassNo || gp.id.slice(-6)}","${d.quarter}",${d.quantity}\n`;
                        });
                    }
                });
            });

            if (!hasGP) {
                csvContent += `"${indent.indentNumber}","${approvalDate}","${item.item}",${initialQty},"N/A","N/A",0\n`;
            }
        });

        const filename = `Indent_${indent.indentNumber}_Report.csv`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    viewIndentDetails(id) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === id);
        if (!indent) return;

        const gatePasses = storage.get('gate_passes');
        const approvalDate = indent.approvedAt ? utils.renderDate(indent.approvedAt) : 'N/A';

        const normalize = (s) => {
            if (!s) return '';
            const lastColonIndex = s.lastIndexOf(':');
            const namePart = lastColonIndex !== -1 ? s.substring(lastColonIndex + 1) : s;
            return namePart.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        };

        const modalHtml = `
            <div id="indent-details-modal" class="overlay">
                <div class="overlay-content !max-w-xl !w-[95%] !p-0 max-h-[90vh] overflow-hidden flex flex-col">
                    <div class="modal-header p-5 bg-slate-900/80 backdrop-blur-md">
                        <button onclick="document.getElementById('indent-details-modal').remove()" class="flex items-center gap-2 px-4 py-2 bg-gold text-black hover:bg-amber-500 rounded-xl text-xs font-black transition-all shadow-lg shadow-gold/30 whitespace-nowrap">
                            <i data-lucide="arrow-left" size="16"></i> BACK
                        </button>
                        <div class="text-left overflow-hidden">
                            <h3 class="text-primary text-base font-black truncate">Indent #${indent.indentNumber}</h3>
                            <p class="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-0.5 truncate">${approvalDate}</p>
                        </div>
                        <button onclick="document.getElementById('indent-details-modal').remove()" class="ml-auto p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg transition-colors">
                            <i data-lucide="x" class="text-slate-400" size="18"></i>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-5 pt-0 space-y-6 text-left">
                        ${indent.items.map((item, idx) => {
            // Find total received from passes for initial qty calculation
            let totalFromPasses = 0;
            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    const cleanGPItem = normalize(gi.item);
                    const cleanIndentItem = normalize(item.item);
                    if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                        totalFromPasses += (parseInt(gi.quantity) || 0);
                    }
                });
            });

            const remainingQty = parseInt(item.quantity) || 0;
            const initialQty = item.initialQuantity !== undefined ? (parseInt(item.initialQuantity) || 0) : (remainingQty + totalFromPasses);

            const linkedData = [];
            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    const cleanGPItem = normalize(gi.item);
                    const cleanIndentItem = normalize(item.item);
                    if (gi.indentId === indent.id && (cleanGPItem === cleanIndentItem || cleanGPItem.includes(cleanIndentItem) || cleanIndentItem.includes(cleanGPItem))) {
                        const dists = gi.distributions || [{ quarter: gi.quarter || 'N/A', quantity: gi.quantity }];
                        dists.forEach(d => {
                            linkedData.push({
                                gpNo: gp.gatePassNo || gp.id.slice(-6),
                                quarter: d.quarter,
                                qty: d.quantity
                            });
                        });
                    }
                });
            });

            return `
                                <div class="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3">
                                    <div class="flex justify-between items-center mb-2">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-black text-slate-500">(${idx + 1})</span>
                                            <span class="font-black indent-item-highlight">${item.item}</span>
                                        </div>
                                        <span class="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">Purchased: ${initialQty} ${utils.getUnit(item.item)}</span>
                                    </div>
                                    <div class="mt-2 space-y-1">
                                        <p class="text-[9px] uppercase font-black text-slate-500 mb-2">Gate Pass & Usage Details:</p>
                                        ${linkedData.length > 0 ? linkedData.map(ld => `
                                            <div class="flex justify-between text-[11px] bg-black/20 p-2 rounded">
                                                <span>GP: <strong class="text-primary">${ld.gpNo}</strong> (${ld.quarter})</span>
                                                <span class="text-accent font-bold"> : ${ld.qty} ${utils.getUnit(item.item)}</span>
                                            </div>
                                        `).join('') : '<p class="text-[10px] text-slate-500 italic p-2">No gate passes recorded yet</p>'}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        lucide.createIcons();
    },

    deleteIndent(id) {
        if (confirm('Cancel this indent?')) {
            const indents = storage.get('indents').filter(i => i.id !== id);
            storage.set('indents', indents);
            this.render(document.getElementById('view-content'));
        }
    },

    viewAttachment(dataUrl) {
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                    <head>
                        <title>Indent Attachment</title>
                        <style>
                            body { margin: 0; background: #0f172a; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; }
                            .container { background: #1e293b; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; max-width: 90%; max-height: 90%; }
                            img { max-width: 100%; max-height: 70vh; border-radius: 8px; margin-bottom: 20px; border: 1px solid #334155; }
                            .btn { background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; display: inline-block; }
                            .header { margin-bottom: 15px; color: #f1f5f9; font-size: 18px; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">Document Preview</div>
                            ${dataUrl.startsWith('data:image/') ?
                    `<img src="${dataUrl}" alt="Attachment">` :
                    `<div style="color: #94a3b8; margin-bottom: 20px;">Attachment loaded. Click below if it didn't open.</div>`
                }
                            <br>
                            <a href="${dataUrl}" class="btn" download="attachment">Download Document</a>
                        </div>
                    </body>
                </html>
            `);
        } else {
            alert('Popup blocked! Please allow popups to view attachments.');
        }
    }
};
