const uploadModule = {
    render(container) {
        container.innerHTML = `
            <div class="form-group">
                <label>Select Quarter</label>
                <div class="search-select">
                    <input type="text" id="quarter-search" placeholder="Type to search quarter (e.g. C-1)..." autocomplete="off">
                    <div id="quarter-list" class="search-results hidden"></div>
                </div>
            </div>
            <div class="form-group">
                <label>Remarks</label>
                <textarea id="work-remarks" placeholder="Enter work details..."></textarea>
            </div>
            ${auth.isOwnerOrAdmin() ? `
                <div class="form-group">
                    <label>Attachment (Optional)</label>
                    <input type="file" id="work-attachment" accept="image/*">
                </div>
            ` : ''}
            <button onclick="uploadModule.save()" class="btn-primary w-full">SAVE WORK ORDER</button>
        `;

        this.setupSearch();
    },

    setupSearch() {
        const searchInput = document.getElementById('quarter-search');
        const results = document.getElementById('quarter-list');

        searchInput.addEventListener('input', (e) => {
            // Auto-format F18 -> F-18
            const rawValue = e.target.value;
            const formatted = utils.formatQuarter(rawValue);
            if (rawValue !== formatted) {
                e.target.value = formatted;
            }

            const query = e.target.value.toLowerCase();
            if (!query) {
                results.classList.add('hidden');
                return;
            }

            const matches = [];
            DATA.quarters.forEach(q => {
                if (q.children) {
                    q.children.forEach(child => {
                        if (child.toLowerCase().includes(query)) matches.push(child);
                    });
                } else if (q.name.toLowerCase().includes(query)) {
                    matches.push(q.name);
                }
            });

            if (matches.length > 0) {
                results.innerHTML = matches.slice(0, 10).map(m => `<div class="search-item" onclick="uploadModule.selectQuarter('${m}')">${m}</div>`).join('');
                results.classList.remove('hidden');
            } else {
                results.classList.add('hidden');
            }
        });
    },

    selectQuarter(val) {
        document.getElementById('quarter-search').value = val;
        document.getElementById('quarter-list').classList.add('hidden');
    },

    save() {
        const quarter = document.getElementById('quarter-search').value;
        const remarks = document.getElementById('work-remarks').value;

        if (!quarter) {
            alert('Please select a quarter');
            return;
        }

        const orders = storage.get('work_orders');
        orders.push({
            id: utils.generateId(),
            quarter,
            remarks: utils.sanitize(remarks),
            status: 'pending',
            createdAt: new Date().toISOString(),
            uploads: [] // Image handling would normally involve blob/base64 for localstorage
        });

        storage.set('work_orders', orders);
        router.navigate('home');
    }
};
