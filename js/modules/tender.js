const tenderModule = {
    render(container) {
        const tenders = storage.get('tenders', []);

        container.innerHTML = `
            <div class="view-header-row mb-6">
                <button onclick="router.navigate('home')" class="btn-back">
                    <i data-lucide="chevron-left"></i> Back to Home
                </button>
                <button onclick="tenderModule.renderNewForm()" class="btn-primary">
                    <i data-lucide="plus"></i> New Tender
                </button>
            </div>

            <div id="tender-content">
                ${this.renderList(tenders)}
            </div>
        `;
        lucide.createIcons();
    },

    renderList(tenders) {
        if (tenders.length === 0) {
            return '<div class="empty-state">No tenders found</div>';
        }

        // Sort by work order date
        const sorted = [...tenders].sort((a, b) => new Date(a.woDate) - new Date(b.woDate));

        return `
            <div class="space-y-4">
                ${sorted.map((t, idx) => {
            const progress = this.calculateProgress(t);
            const isAtRisk = progress >= 0.7 && t.status !== 'completed';
            const leftDays = this.getDaysLeft(t.completionDate);

            return `
                        <div class="tender-card ${t.status === 'completed' ? 'completed' : ''}" onclick="tenderModule.viewTender('${t.id}')">
                            <div class="tender-sn">#${idx + 1}</div>
                            <div class="tender-info">
                                <h4 class="tender-name">${utils.sanitize(t.workName)}</h4>
                                <div class="tender-meta">
                                    <span>File: ${utils.sanitize(t.fileNo)}</span>
                                    <span>Amount: ₹${utils.sanitize(t.amount)}</span>
                                </div>
                                <div class="tender-dates-grid">
                                    <div class="date-item">
                                        <label>WO Date</label>
                                        <span>${utils.renderDate(t.woDate)}</span>
                                    </div>
                                    <div class="date-item">
                                        <label>Duration</label>
                                        <span>${t.duration} Days</span>
                                    </div>
                                    <div class="date-item">
                                        <label>Commencement</label>
                                        <span>${utils.renderDate(t.commencementDate)}</span>
                                    </div>
                                    <div class="date-item">
                                        <label>Completion</label>
                                        <span>${utils.renderDate(t.completionDate)}</span>
                                    </div>
                                </div>
                                ${isAtRisk ? `
                                    <div class="tender-attention">
                                        <i data-lucide="alert-triangle"></i>
                                        ATTENTION: ${leftDays} days left to complete!
                                    </div>
                                ` : ''}
                                ${t.status === 'completed' ? `
                                    <div class="tender-completed-badge">
                                        <i data-lucide="check-circle"></i> WORK COMPLETED
                                    </div>
                                ` : ''}
                            </div>
                            <i data-lucide="chevron-right" class="text-slate-500"></i>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    },

    renderNewForm() {
        const container = document.getElementById('tender-content');
        container.innerHTML = `
            <div class="form-card">
                <h3>New Tender Entry</h3>
                <form id="tender-form" onsubmit="tenderModule.saveTender(event)">
                    <div class="form-group">
                        <label>Name of the Work</label>
                        <input type="text" name="workName" required placeholder="Enter work description...">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label>File No</label>
                            <input type="text" name="fileNo" required placeholder="e.g. WS/2023/01">
                        </div>
                        <div class="form-group">
                            <label>Tender Amount</label>
                            <input type="number" name="amount" required placeholder="₹">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label>Work Order Date</label>
                            <input type="date" name="woDate" id="wo-date" required onchange="tenderModule.updateDates()">
                        </div>
                        <div class="form-group">
                            <label>Duration of Work (Days)</label>
                            <input type="number" name="duration" id="work-duration" required placeholder="Days" onchange="tenderModule.updateDates()">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4 bg-slate-800/20 p-4 rounded-xl mb-6">
                        <div class="form-group mb-0">
                            <label class="text-xs uppercase text-slate-500">Commencement Date</label>
                            <div id="commencement-display" class="text-sm font-semibold text-primary">-</div>
                            <input type="hidden" name="commencementDate" id="commencement-input">
                        </div>
                        <div class="form-group mb-0">
                            <label class="text-xs uppercase text-slate-500">Completion Date</label>
                            <div id="completion-display" class="text-sm font-semibold text-primary">-</div>
                            <input type="hidden" name="completionDate" id="completion-input">
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <button type="button" onclick="tenderModule.render(document.getElementById('view-content'))" class="btn-outline flex-1">Cancel</button>
                        <button type="submit" class="btn-primary flex-1">Save Tender</button>
                    </div>
                </form>
            </div>
        `;
        lucide.createIcons();
    },

    updateDates() {
        const woDateVal = document.getElementById('wo-date').value;
        const durationVal = parseInt(document.getElementById('work-duration').value);

        if (!woDateVal || isNaN(durationVal)) return;

        const woDate = new Date(woDateVal);

        // Commencement = WO Date + 10 days (including both dates means +9 days)
        // User says "Work order date + 10 days", and "include both dates while adding".
        // If WO Date is 1st, +10 days including 1st is 10th. (1+9=10)
        const commencement = new Date(woDate);
        commencement.setDate(woDate.getDate() + 9);

        // Completion = Commencement + Duration (including commencement means -1)
        const completion = new Date(commencement);
        completion.setDate(commencement.getDate() + durationVal - 1);

        document.getElementById('commencement-display').textContent = utils.formatDate(commencement.toISOString());
        document.getElementById('commencement-input').value = commencement.toISOString();

        document.getElementById('completion-display').textContent = utils.formatDate(completion.toISOString());
        document.getElementById('completion-input').value = completion.toISOString();
    },

    saveTender(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const tenders = storage.get('tenders', []);

        const newTender = {
            id: Date.now().toString(),
            workName: formData.get('workName'),
            fileNo: formData.get('fileNo'),
            amount: formData.get('amount'),
            woDate: formData.get('woDate'),
            duration: parseInt(formData.get('duration')),
            commencementDate: formData.get('commencementDate'),
            completionDate: formData.get('completionDate'),
            status: 'active',
            dailyStatus: [],
            createdAt: new Date().toISOString()
        };

        tenders.push(newTender);
        storage.set('tenders', tenders);
        this.render(document.getElementById('view-content'));
    },

    viewTender(id) {
        const tender = storage.get('tenders', []).find(t => t.id === id);
        if (!tender) return;

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <div class="view-header-row mb-6">
                <button onclick="tenderModule.render(document.getElementById('view-content'))" class="btn-back">
                    <i data-lucide="chevron-left"></i> Back to Tenders
                </button>
                <div class="flex gap-2">
                    ${auth.isAdmin() ? `
                        <button onclick="tenderModule.downloadCSV('${id}')" class="btn-outline btn-sm">
                            <i data-lucide="download"></i> CSV
                        </button>
                    ` : ''}
                    <button onclick="tenderModule.showDailyStatusForm('${id}')" class="btn-accent btn-sm">
                        <i data-lucide="plus"></i> Add Status
                    </button>
                </div>
            </div>

            <div class="tender-details-card mb-6">
                ${(() => {
                const progress = this.calculateProgress(tender);
                if (progress >= 0.7 && tender.status !== 'completed') {
                    const left = this.getDaysLeft(tender.completionDate);
                    return `
                            <div class="tender-attention mb-4">
                                <i data-lucide="alert-triangle"></i>
                                ATTENTION: ${left} days left to complete!
                            </div>
                        `;
                }
                return '';
            })()}
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold text-slate-100">${utils.sanitize(tender.workName)}</h3>
                        <p class="text-slate-400">File No: ${utils.sanitize(tender.fileNo)} | Amount: ₹${utils.sanitize(tender.amount)}</p>
                    </div>
                    ${tender.status !== 'completed' ? `
                        <button onclick="tenderModule.markTenderCompleted('${id}')" class="btn-sm btn-outline text-primary">
                            Mark Completed
                        </button>
                    ` : '<span class="status-tag status-completed">COMPLETED</span>'}
                </div>
                <div class="tender-detail-grid py-4 border-y border-slate-700/50">
                    <div class="detail-item">
                        <label>WO Date</label>
                        <span>${utils.renderDate(tender.woDate)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Duration</label>
                        <span>${tender.duration} Days</span>
                    </div>
                    <div class="detail-item">
                        <label>Commencement</label>
                        <span>${utils.renderDate(tender.commencementDate)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Completion</label>
                        <span>${utils.renderDate(tender.completionDate)}</span>
                    </div>
                </div>
            </div>

            <h4 class="mb-4 flex items-center gap-2">
                <i data-lucide="clipboard-list" class="text-primary"></i>
                Daily Status of the Work
            </h4>

            <div id="daily-status-list" class="space-y-3">
                ${this.renderDailyStatus(tender)}
            </div>
        `;
        lucide.createIcons();
    },

    renderDailyStatus(tender) {
        if (!tender.dailyStatus || tender.dailyStatus.length === 0) {
            return '<div class="empty-state sm">No work status entries yet</div>';
        }

        return tender.dailyStatus.sort((a, b) => new Date(b.date) - new Date(a.date)).map(s => `
            <div class="status-entry-card">
                <div class="status-entry-header">
                    <span class="status-date">${utils.renderDate(s.date)}</span>
                    <div class="actions">
                        <button onclick="tenderModule.editStatus('${tender.id}', '${s.id}')" class="btn-icon sm">
                            <i data-lucide="edit-2"></i>
                        </button>
                        <button onclick="tenderModule.deleteStatus('${tender.id}', '${s.id}')" class="btn-icon sm text-error">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <p class="status-text">${utils.sanitize(s.workDone)}</p>
            </div>
        `).join('');
    },

    showDailyStatusForm(tenderId, statusId = null) {
        const tender = storage.get('tenders', []).find(t => t.id === tenderId);
        const existing = statusId ? tender.dailyStatus.find(s => s.id === statusId) : null;

        const overlay = document.createElement('div');
        overlay.className = 'picker-overlay';
        overlay.id = 'status-modal';
        overlay.innerHTML = `
            <div class="picker-content max-w-md h-auto!">
                <div class="picker-header">
                    <h3>${statusId ? 'Edit Status' : 'Add Daily Status'}</h3>
                    <button onclick="document.getElementById('status-modal').remove()" class="btn-icon">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="p-6">
                    <form onsubmit="tenderModule.saveDailyStatus(event, '${tenderId}', ${statusId ? `'${statusId}'` : 'null'})">
                        <div class="form-group">
                            <label>Date</label>
                            <input type="date" name="date" required value="${existing ? existing.date : new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="form-group">
                            <label>Work Done</label>
                            <textarea name="workDone" required rows="4" placeholder="Describe work done by workers...">${existing ? existing.workDone : ''}</textarea>
                        </div>
                        <button type="submit" class="btn-primary w-full">${statusId ? 'Update' : 'Save'} Status</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        lucide.createIcons();
    },

    saveDailyStatus(e, tenderId, statusId) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const tenders = storage.get('tenders', []);
        const tIdx = tenders.findIndex(t => t.id === tenderId);

        if (tIdx === -1) return;

        const entry = {
            id: statusId || Date.now().toString(),
            date: formData.get('date'),
            workDone: formData.get('workDone')
        };

        if (statusId) {
            const sIdx = tenders[tIdx].dailyStatus.findIndex(s => s.id === statusId);
            tenders[tIdx].dailyStatus[sIdx] = entry;
        } else {
            tenders[tIdx].dailyStatus.push(entry);
        }

        storage.set('tenders', tenders);
        document.getElementById('status-modal').remove();
        this.viewTender(tenderId);
    },

    deleteStatus(tenderId, statusId) {
        if (!confirm('Delete this status entry?')) return;

        const tenders = storage.get('tenders', []);
        const tIdx = tenders.findIndex(t => t.id === tenderId);
        tenders[tIdx].dailyStatus = tenders[tIdx].dailyStatus.filter(s => s.id !== statusId);

        storage.set('tenders', tenders);
        this.viewTender(tenderId);
    },

    editStatus(tenderId, statusId) {
        this.showDailyStatusForm(tenderId, statusId);
    },

    markTenderCompleted(id) {
        if (!confirm('Mark this tender work as completed?')) return;

        const tenders = storage.get('tenders', []);
        const tIdx = tenders.findIndex(t => t.id === id);
        tenders[tIdx].status = 'completed';

        storage.set('tenders', tenders);
        this.viewTender(id);
    },

    calculateProgress(tender) {
        const start = new Date(tender.commencementDate).getTime();
        const end = new Date(tender.completionDate).getTime();
        const now = new Date().getTime();

        if (now < start) return 0;
        if (now > end) return 1;

        const total = end - start;
        const current = now - start;
        return current / total;
    },

    getDaysLeft(completionDate) {
        const end = new Date(completionDate);
        const now = new Date();
        const diff = end - now;
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    },

    downloadCSV(id) {
        const tender = storage.get('tenders', []).find(t => t.id === id);
        if (!tender) return;

        let csvContents = `TENDER REPORT: ${tender.workName}\n`;
        csvContents += `File No,${tender.fileNo}\n`;
        csvContents += `Work Order Date,${utils.formatDate(tender.woDate)}\n`;
        csvContents += `Duration,${tender.duration} Days\n`;
        csvContents += `Tender Amount,${tender.amount}\n`;
        csvContents += `Commencement Date,${utils.formatDate(tender.commencementDate)}\n`;
        csvContents += `Completion Date,${utils.formatDate(tender.completionDate)}\n`;
        csvContents += `Status,${tender.status}\n\n`;

        csvContents += `DAILY STATUS LOG\n`;
        csvContents += `Date,Work Done\n`;

        tender.dailyStatus.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(s => {
            csvContents += `"${utils.formatDate(s.date)}","${s.workDone.replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csvContents], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tender_${tender.fileNo.replace(/\//g, '_')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
};
