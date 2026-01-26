const completedModule = {
    render(container) {
        // Inject Deleted icon in header FIRST so it always appears (Admin/Owner only)
        const header = document.querySelector('.view-header');
        if (header && !header.querySelector('.btn-deleted-small') && auth.isOwnerOrAdmin()) {
            const delBtn = document.createElement('button');
            delBtn.className = 'btn-deleted-small';
            delBtn.title = 'View Deleted Records';
            delBtn.onclick = () => router.navigate('deleted');
            delBtn.innerHTML = '<i data-lucide="trash-2"></i>';
            header.appendChild(delBtn);
            lucide.createIcons();
        }

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const allCompleted = storage.get('work_orders').filter(o => o.status === 'completed');
        const orders = allCompleted
            .filter(o => {
                const compDate = new Date(o.completedAt);
                return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
            })
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        if (allCompleted.length > 0 && orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No work orders completed in ${now.toLocaleString('default', { month: 'long' })}.</p>
                    <p class="text-xs mt-2 text-muted">Previous records are moved to <strong>MONTHLY REPORT</strong> archive.</p>
                </div>
            `;
            return;
        }

        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state">No completed work orders</div>';
            return;
        }

        container.innerHTML = `
            <div class="orders-list">
                ${orders.map(order => this.renderOrderCard(order)).join('')}
            </div>
        `;
        lucide.createIcons();
    },

    renderOrderCard(order) {
        return `
            <div class="order-card completed">
                <div class="order-header">
                    <span class="quarter-tag">${order.quarter}</span>
                    <span class="status-tag">Completed</span>
                </div>
                <p class="remarks">${utils.sanitize(order.remarks)}</p>
                <div class="time-details">
                    <p><strong>Uploaded:</strong> ${utils.renderDate(order.createdAt)}</p>
                    <p><strong>Finished:</strong> ${utils.renderDate(order.completedAt)}</p>
                </div>
                <div class="completion-details mt-2">
                    <p><strong>Technicians:</strong> ${order.technicians.join(', ')}</p>
                    <p><strong>Materials:</strong><br>
                        ${order.materials.map(m => `• ${m.category} - ${m.item} : ${m.quantity} ${utils.getUnit(m.item)}`).join('<br>')}
                    </p>
                </div>
                <div class="action-buttons mt-2">
                    <button onclick="completedModule.edit('${order.id}')" class="btn-icon-text">
                        <i data-lucide="edit-3"></i> Edit
                    </button>
                    ${auth.isOwnerOrAdmin() ? `
                        <button onclick="completedModule.delete('${order.id}')" class="btn-icon-text text-error">
                            <i data-lucide="trash-2"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    edit(id) {
        const order = storage.get('work_orders').find(o => o.id === id);
        if (!order) return;

        const container = document.getElementById('view-content');
        container.innerHTML = `
            <button class="btn-back" onclick="completedModule.render(document.getElementById('view-content'))">
                <i data-lucide="chevron-left"></i> Back to Completed
            </button>
            <h3 class="mt-4">Edit Work Order</h3>
            <div class="form-group mt-6">
                <label>Completion Date</label>
                <input type="date" id="edit-completed-at" class="form-control" value="${new Date(order.completedAt).toISOString().split('T')[0]}">
            </div>

            <div class="form-group">
                <label>Select Technicians (Multi-select)</label>
                <div class="tech-grid">
                    ${DATA.technicians.map(t => `
                        <label class="checkbox-container">
                            <input type="checkbox" name="technicians" value="${t}" ${order.technicians.includes(t) ? 'checked' : ''}>
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
                        <input type="checkbox" id="no-material" onchange="completedModule.toggleMaterialInput(this)" ${order.materials.length === 0 ? 'checked' : ''}>
                        <span class="checkmark"></span>
                        No material used for this work
                    </label>
                </div>
                <div id="material-sections-wrapper" style="${order.materials.length === 0 ? 'opacity: 0.5; pointer-events: none;' : ''}">
                    <div id="material-sections">
                        <!-- Materials will be injected here -->
                    </div>
                    <button id="add-material-btn" onclick="completedModule.addMaterialRow()" class="btn-outline btn-sm mt-2">
                        <i data-lucide="plus"></i> Add Material
                    </button>
                </div>
            </div>

            <button onclick="completedModule.saveEdit('${id}')" class="btn-primary w-full mt-6">SAVE CHANGES</button>
        `;

        // Pre-fill materials
        if (order.materials.length > 0) {
            order.materials.forEach(m => this.addMaterialRow(m));
        }

        lucide.createIcons();
    },

    addMaterialRow(existingData = null) {
        const section = document.getElementById('material-sections');
        const row = document.createElement('div');
        row.className = 'material-row';

        let categoryHTML = `
            <select class="material-select" onchange="completedModule.onMaterialChange(this)">
                <option value="">Select Category...</option>
                ${DATA.materials.map(m => `<option value="${m.name}" ${existingData && existingData.category === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}
            </select>
            <div class="sub-material-container"></div>
            <div class="qty-control">
                <button onclick="this.nextElementSibling.stepDown()" class="qty-btn">-</button>
                <input type="number" class="qty-input" value="${existingData ? existingData.quantity : 1}" min="1">
                <button onclick="this.previousElementSibling.stepUp()" class="qty-btn">+</button>
            </div>
            <button onclick="this.parentElement.remove()" class="btn-icon text-error">
                <i data-lucide="trash-2"></i>
            </button>
        `;

        row.innerHTML = categoryHTML;
        section.appendChild(row);

        if (existingData) {
            this.onMaterialChange(row.querySelector('.material-select'), existingData);
        }

        lucide.createIcons();
    },

    onMaterialChange(select, existingData = null) {
        const categoryName = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);
        const container = select.nextElementSibling;

        if (category) {
            // Check if existing item has properties in brackets
            let cleanItem = existingData ? existingData.item : null;
            let existingRating = null;
            let existingPhase = null;

            if (cleanItem && cleanItem.includes('(')) {
                const match = cleanItem.match(/(.+)\s\((.+)\)/);
                if (match) {
                    cleanItem = match[1].trim();
                    const details = match[2].split(' - ');
                    if (details.length > 1) {
                        existingPhase = details[0].trim();
                        existingRating = details[1].trim();
                    } else {
                        existingRating = details[0].trim();
                    }
                }
            }

            let html = `
                <select class="sub-material-select" onchange="completedModule.onSubMaterialChange(this, '${categoryName}')">
                    <option value="">Select Item...</option>
                    ${category.items.map(i => `<option value="${i}" ${cleanItem === i ? 'selected' : ''}>${i}</option>`).join('')}
                </select>
                <div class="rating-container"></div>
            `;
            container.innerHTML = html;

            if (cleanItem) {
                this.onSubMaterialChange(container.querySelector('.sub-material-select'), categoryName, existingRating, existingPhase);
            }
        } else {
            container.innerHTML = '';
        }
    },

    onSubMaterialChange(select, categoryName, existingRating = null, existingPhase = null) {
        const container = select.nextElementSibling;
        const item = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);

        if (categoryName === 'MCB' && category.ratings && item) {
            let ratings = category.ratings;
            if (item.startsWith('SP') || item.startsWith('DP')) {
                ratings = ratings.filter(r => r !== '60A');
            }
            container.innerHTML = `
                <select class="rating-select">
                    <option value="">Rating...</option>
                    ${ratings.map(r => `<option value="${r}" ${existingRating === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            `;
        } else if (categoryName === 'Switches & Sockets' && item.includes('Modular') && !item.toLowerCase().includes('non modular') && category.companies) {
            container.innerHTML = `
                <select class="rating-select">
                    <option value="">Company...</option>
                    ${category.companies.map(c => `<option value="${c}" ${existingRating === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            `;
        } else if (categoryName === 'Starters' && item) {
            if (item === 'DOL Starter') {
                container.innerHTML = `
                    <select class="phase-select" onchange="completedModule.onPhaseChange(this, 'Starters', 'DOL Starter')">
                        <option value="">Select Phase...</option>
                        ${category.phases.map(p => `<option value="${p}" ${existingPhase === p ? 'selected' : ''}>${p}</option>`).join('')}
                    </select>
                    <div class="final-rating-container"></div>
                `;
                if (existingPhase) {
                    this.onPhaseChange(container.querySelector('.phase-select'), 'Starters', 'DOL Starter', existingRating);
                }
            } else if (item === 'Star Delta Starter') {
                container.innerHTML = `
                    <select class="rating-select">
                        <option value="">Rating...</option>
                        ${category.ratings['Star Delta Starter'].map(r => `<option value="${r}" ${existingRating === r ? 'selected' : ''}>${r}</option>`).join('')}
                    </select>
                `;
            }
        } else {
            container.innerHTML = '';
        }
    },

    onPhaseChange(select, categoryName, subItem, existingRating = null) {
        const container = select.nextElementSibling;
        const phase = select.value;
        const category = DATA.materials.find(m => m.name === categoryName);

        if (phase && category.ratings[subItem]) {
            container.innerHTML = `
                <select class="rating-select">
                    <option value="">Rating...</option>
                    ${category.ratings[subItem].map(r => `<option value="${r}" ${existingRating === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            `;
        } else {
            container.innerHTML = '';
        }
    },

    toggleMaterialInput(checkbox) {
        const wrapper = document.getElementById('material-sections-wrapper');
        if (checkbox.checked) {
            wrapper.style.opacity = '0.5';
            wrapper.style.pointerEvents = 'none';
        } else {
            wrapper.style.opacity = '1';
            wrapper.style.pointerEvents = 'auto';
        }
    },

    saveEdit(id) {
        const selectedTechs = Array.from(document.querySelectorAll('input[name="technicians"]:checked')).map(cb => cb.value);
        const noMaterial = document.getElementById('no-material').checked;

        if (selectedTechs.length === 0) {
            alert('Please select at least one technician');
            return;
        }

        const materialsUsed = noMaterial ? [] : Array.from(document.querySelectorAll('.material-row')).map(row => {
            const category = row.querySelector('.material-select').value;
            const subSelect = row.querySelector('.sub-material-select');
            const phaseSelect = row.querySelector('.phase-select');
            const ratingSelect = row.querySelector('.rating-select');

            const item = subSelect ? subSelect.value : null;
            const phase = phaseSelect ? phaseSelect.value : null;
            const rating = ratingSelect ? ratingSelect.value : null;
            const quantity = parseInt(row.querySelector('.qty-input').value);

            let finalItem = item;
            if (phase && rating) {
                finalItem = `${item} (${phase} - ${rating})`;
            } else if (rating) {
                finalItem = `${item} (${rating})`;
            }

            return { category, item: finalItem, quantity };
        }).filter(m => m.category && m.item);

        if (!noMaterial && materialsUsed.length === 0) {
            alert('Please add at least one material or check "No material used"');
            return;
        }

        const newCompletedAtString = document.getElementById('edit-completed-at').value;
        const orders = storage.get('work_orders');
        const orderIndex = orders.findIndex(o => o.id === id);

        if (orderIndex !== -1) {
            const originalDate = new Date(orders[orderIndex].completedAt);
            const selectedDate = new Date(newCompletedAtString);

            // Handle edge case where date selection might fail
            if (!isNaN(selectedDate.getTime())) {
                // Keep the original time if possible, just change the date part
                originalDate.setFullYear(selectedDate.getFullYear());
                originalDate.setMonth(selectedDate.getMonth());
                originalDate.setDate(selectedDate.getDate());
                orders[orderIndex].completedAt = originalDate.toISOString();
            }

            orders[orderIndex].technicians = selectedTechs;
            orders[orderIndex].materials = materialsUsed;
            orders[orderIndex].updatedAt = new Date().toISOString();

            storage.set('work_orders', orders);
            this.render(document.getElementById('view-content'));
        }
    },

    delete(id) {
        if (confirm('Are you sure you want to delete this record?')) {
            const orders = storage.get('work_orders');
            const orderIndex = orders.findIndex(o => o.id === id);
            if (orderIndex !== -1) {
                orders[orderIndex].status = 'archived';
                storage.set('work_orders', orders);
                this.render(document.getElementById('view-content'));
            }
        }
    }
};
