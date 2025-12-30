const router = {
    currentView: 'home',

    navigate(view) {
        this.currentView = view;
        const mainNav = document.querySelector('.dashboard-grid');
        const viewContainer = document.getElementById('view-container');
        const viewTitle = document.getElementById('view-title');
        const viewContent = document.getElementById('view-content');

        if (view === 'home') {
            mainNav.classList.remove('hidden');
            viewContainer.classList.add('hidden');
            this.updatePendingCount();
        } else {
            // Clear module-specific header actions
            const existingAction = document.querySelector('.view-header .btn-deleted-small');
            if (existingAction) existingAction.remove();

            mainNav.classList.add('hidden');
            viewContainer.classList.remove('hidden');
            viewTitle.textContent = view.toUpperCase().replace('-', ' ');

            // Trigger View Animation
            viewContent.classList.remove('view-enter');
            void viewContent.offsetWidth;
            viewContent.classList.add('view-enter');

            this.renderView(view, viewContent);
        }
        lucide.createIcons();
    },

    renderView(view, container) {
        container.innerHTML = '';
        switch (view) {
            case 'upload':
                uploadModule.render(container);
                break;
            case 'pending':
                pendingModule.render(container);
                break;
            case 'completed':
                completedModule.render(container);
                break;
            case 'inventory':
                inventoryModule.render(container);
                break;
            case 'monthly-report':
                monthlyReportModule.render(container);
                break;
            case 'indents':
                indentsModule.render(container);
                break;
            case 'gate-pass':
                gatePassModule.render(container);
                break;
            case 'deleted':
                deletedModule.render(container);
                break;
            case 'tender':
                tenderModule.render(container);
                break;
            case 'users':
                usersModule.render(container);
                break;
            default:
                container.innerHTML = `<p class="placeholder">Module ${view} coming soon...</p>`;
        }
    },

    updatePendingCount() {
        const pending = storage.get('work_orders').filter(o => o.status === 'pending');
        const badge = document.getElementById('pending-count');
        if (pending.length > 0) {
            badge.textContent = pending.length;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    },

    refreshCurrentView() {
        if (this.currentView !== 'home') {
            const container = document.getElementById('view-content');
            this.renderView(this.currentView, container);
            lucide.createIcons();
        }
    }
};
