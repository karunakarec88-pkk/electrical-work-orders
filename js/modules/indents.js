const indentsModule = {
    render(container) {
        const indents = storage.get('indents').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = `
            <div class="indent-actions mb-4">
                <button onclick="indentsModule.showNewIndentForm()" class="btn-primary w-full">
                    <i data-lucide="plus"></i> Create New Indent
                </button>
            </div>
            <div id="indents-list" class="space-y-4">
                ${this.renderList(indents)}
            </div>
        `;
        lucide.createIcons();
    },

    renderList(indents) {
        if (indents.length === 0) {
            return '<div class="empty-state">No indents created yet</div>';
        }

        return indents.map(indent => `
            <div class="indent-card px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                <div class="flex justify-between items-start border-b border-slate-700 pb-2 mb-2">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-muted">Indent No: <strong>${utils.sanitize(indent.indentNumber || 'N/A')}</strong></span>
                            <span class="text-[10px] bg-slate-700 px-1.5 rounded uppercase font-bold text-slate-300">${indent.type || 'LOCAL'}</span>
                            <div class="flex ml-auto" style="gap: 12px;">
                                <button onclick="indentsModule.viewIndentDetails('${indent.id}')" class="btn-micro bg-slate-700 hover:bg-slate-600 text-slate-300 p-1 rounded" title="View Details">
                                    <i data-lucide="eye" size="12"></i>
                                </button>
                                ${auth.isAdmin() ? `
                                    <button onclick="indentsModule.downloadIndentCSV('${indent.id}')" class="btn-micro bg-primary/20 hover:bg-primary/30 text-primary p-1 rounded" title="Download CSV">
                                        <i data-lucide="download" size="12"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <h4 class="text-primary">Date: ${utils.renderDate(indent.indentDate) || utils.renderDate(indent.createdAt)}</h4>
                        ${indent.approvedAt ? `<p class="text-[10px] text-muted-foreground mt-1">Approved: ${utils.renderDate(indent.approvedAt)}</p>` : ''}
                    </div>
                    ${indent.status !== 'approved' ? `<span class="status-tag ${indent.status}">${indent.status.toUpperCase()}</span>` : ''}
                </div>
                <div class="material-summary mt-3 space-y-3">
                    ${(() => {
                const gatePasses = storage.get('gate_passes');
                return indent.items.map(item => {
                    const initialQty = item.initialQuantity || item.quantity;
                    const remainingQty = item.quantity;
                    const usedQty = initialQty - remainingQty;
                    const isCompleted = remainingQty <= 0;
                    const unit = utils.getUnit(item.item);

                    // Find Gate Passes that used this specific item from this indent
                    const linkedPasses = [];
                    gatePasses.forEach(gp => {
                        gp.items.forEach(gi => {
                            if (gi.indentId === indent.id && (gi.item.toLowerCase() === item.item.toLowerCase() || item.item.toLowerCase().includes(gi.item.toLowerCase()))) {
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
                                    <div class="flex justify-between items-start mb-3">
                                        <div class="flex flex-col">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="text-lg font-black ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-100'}">${item.item}</span>
                                                ${!isCompleted && (usedQty / initialQty) >= 0.8 ? `
                                                    <span class="usage-warning-badge pulse-warning" title="High Usage Alert: 80% or more used">
                                                        <i data-lucide="alert-triangle" size="12"></i> ATTENTION
                                                    </span>
                                                ` : ''}
                                            </div>
                                        </div>
                                        </div>
                                        <div class="mt-6 bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                                            <div class="p-4 border-b border-white/5 flex items-center bg-slate-800/10 gap-3">
                                                <span class="w-24 text-[9px] text-slate-500 uppercase font-black tracking-widest">Purchased</span>
                                                <div class="flex items-baseline">
                                                    <span class="text-xl text-slate-100 font-black">: ${initialQty}</span>
                                                    <span class="text-xs text-slate-600 font-bold italic ml-1.5">${unit}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="p-4 border-b border-white/5 flex items-center bg-accent/5 gap-3">
                                                <span class="w-24 text-[9px] text-accent/60 uppercase font-black tracking-widest">Received</span>
                                                <div class="flex items-baseline">
                                                    <span class="text-xl text-accent font-black">: ${usedQty}</span>
                                                    <span class="text-xs text-accent/50 font-bold italic ml-1.5">${unit}</span>
                                                </div>
                                            </div>
                                            
                                            <div class="p-4 flex items-center bg-indigo-500/5 gap-3">
                                                <span class="w-24 text-[9px] text-indigo-400/70 uppercase font-black tracking-widest">Sec Store</span>
                                                <div class="flex items-baseline">
                                                    <span class="text-xl text-indigo-300 font-black">: ${initialQty - usedQty}</span>
                                                    <span class="text-xs text-indigo-400/50 font-bold italic ml-1.5">${unit}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    ${linkedPasses.length > 0 ? `
                                        <div class="usage-breakdown-container mt-3">
                                            <p class="text-[10px] uppercase font-bold text-slate-400 mb-2 flex items-center gap-2">
                                                <i data-lucide="activity" size="12"></i> Gate Pass Usage Breakdown:
                                            </p>
                                            <div class="space-y-1.5">
                                                ${linkedPasses.map(lp => `
                                                    <div class="flex justify-between items-center text-[11px] bg-black/10 p-2 rounded-md border border-slate-700/30">
                                                        <span class="text-slate-400">GP: <span class="text-slate-200 font-semibold">${lp.no}</span> (${lp.quarter})</span>
                                                        <span class="text-accent font-bold"> : ${lp.qty} ${unit}</span>
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
                        <button onclick="indentsModule.deleteIndent('${indent.id}')" class="btn-sm btn-outline text-error">Cancel</button>
                        ${auth.isOwner() ? `<button onclick="indentsModule.approveIndent('${indent.id}')" class="btn-sm btn-accent">Approve</button>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('');
    },

    showNewIndentForm() {
        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="form-container">
                <h3>Create New Indent</h3>
                
                <div class="grid grid-cols-3 gap-4 mt-4">
                    <div class="form-group">
                        <label>Indent Number</label>
                        <input type="text" id="indent-no" placeholder="Enter No...">
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
        row.className = 'material-row flex gap-2 items-center';
        row.innerHTML = `
            <div class="flex-1">
                <select class="material-select w-full" onchange="indentsModule.onMaterialChange(this)">
                    <option value="">Select Category...</option>
                    ${DATA.materials.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                </select>
                <div class="sub-material-container mt-1"></div>
            </div>
            <div class="qty-control">
                <button onclick="this.nextElementSibling.stepDown()" class="qty-btn">-</button>
                <input type="number" class="qty-input" value="1" min="1">
                <button onclick="this.previousElementSibling.stepUp()" class="qty-btn">+</button>
            </div>
            <button onclick="this.parentElement.remove()" class="btn-icon text-error">
                <i data-lucide="trash-2"></i>
            </button>
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
                <select class="sub-material-select w-full">
                    <option value="">Select Item...</option>
                    ${category.items.map(i => `<option value="${i}">${i}</option>`).join('')}
                </select>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    async submitIndent() {
        const indentNumber = document.getElementById('indent-no').value;
        const indentDate = document.getElementById('indent-date').value;
        const type = document.getElementById('indent-type').value;
        const fileInput = document.getElementById('indent-attachment');

        if (!indentNumber) {
            alert('Please enter an Indent Number');
            return;
        }

        const rows = Array.from(document.querySelectorAll('.material-row'));
        const items = rows.map(row => {
            const category = row.querySelector('.material-select').value;
            const subSelect = row.querySelector('.sub-material-select');
            const item = subSelect ? subSelect.value : null;
            const quantity = parseInt(row.querySelector('.qty-input').value);
            return { category, item, quantity, initialQuantity: quantity };
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

    downloadIndentCSV(id) {
        const indents = storage.get('indents');
        const indent = indents.find(i => i.id === id);
        if (!indent) return;

        const gatePasses = storage.get('gate_passes');
        const approvalDate = indent.approvedAt ? utils.formatDate(indent.approvedAt) : 'N/A';

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Indent No,Date of Received (Approved),Item Name,Purchased Qty,Gatepass No,Used Quarter,Used Qty\n";

        indent.items.forEach(item => {
            const initialQty = item.initialQuantity || item.quantity;
            let hasGP = false;

            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    // Match by indentId and item name (normalization not strictly needed here as we use indentId)
                    if (gi.indentId === indent.id && (gi.item.toLowerCase().includes(item.item.toLowerCase()) || item.item.toLowerCase().includes(gi.item.toLowerCase()))) {
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

        const modalHtml = `
            <div id="indent-details-modal" class="overlay">
                <div class="overlay-content !max-w-xl !w-full !p-6 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                        <div class="text-left">
                            <h3 class="text-primary">Indent #${indent.indentNumber}</h3>
                            <p class="text-[10px] text-muted uppercase font-bold">Approved On: ${approvalDate}</p>
                        </div>
                        <button onclick="document.getElementById('indent-details-modal').remove()" class="btn-icon">
                            <i data-lucide="x"></i>
                        </button>
                    </div>

                    <div class="space-y-6 text-left">
                        ${indent.items.map(item => {
            const initialQty = item.initialQuantity || item.quantity;
            const linkedData = [];
            gatePasses.forEach(gp => {
                gp.items.forEach(gi => {
                    if (gi.indentId === indent.id && (gi.item.toLowerCase().includes(item.item.toLowerCase()) || item.item.toLowerCase().includes(gi.item.toLowerCase()))) {
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
                                        <span class="font-bold text-slate-100">${item.item}</span>
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
