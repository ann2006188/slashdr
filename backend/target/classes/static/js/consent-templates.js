// Consent Templates Page Controller

let allTemplates = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;

    TemplatesPage.init();
});

const TemplatesPage = {
    init() {
        const user = SlashDR.getCurrentUser();

        // Enable "New Template" button for Admins only
        const btnNew = document.getElementById('btn-new-template');
        if (btnNew && (user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_SUPER_ADMIN')) {
            btnNew.style.display = 'inline-flex';
            btnNew.addEventListener('click', () => this.openDrawer());
        }

        // Bind filter/search events
        document.getElementById('search-name').addEventListener('input', () => this.applyFilters());
        document.getElementById('filter-procedure').addEventListener('change', () => this.applyFilters());

        // Bind drawer events
        document.getElementById('btn-close-drawer').addEventListener('click', () => this.closeDrawer());
        document.getElementById('btn-cancel-drawer').addEventListener('click', () => this.closeDrawer());
        document.getElementById('drawer-backdrop').addEventListener('click', () => this.closeDrawer());

        // Form submission
        document.getElementById('template-form').addEventListener('submit', (e) => this.handleSave(e));

        // Setup placeholder helper tag clicks
        document.querySelectorAll('.placeholder-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const textarea = document.getElementById('form-body');
                const tagValue = tag.getAttribute('data-tag');
                this.insertAtCursor(textarea, tagValue);
            });
        });

        // Load templates from API
        this.loadTemplates();
        
        // Reveal content
        document.getElementById('page-content').style.display = 'block';
    },

    async loadTemplates() {
        const grid = document.getElementById('template-grid');
        if (!grid) return;

        grid.innerHTML = `
            <div style="grid-column: span 3; text-align: center; padding: 3rem;">
                <div class="loading-spinner" style="margin: 0 auto 1rem auto; width: 36px; height: 36px;"></div>
                <span style="color: var(--text-secondary); font-size: 0.875rem;">Fetching clinical templates...</span>
            </div>
        `;

        try {
            allTemplates = await SlashDR.apiFetch('/api/consent-templates');
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load templates:', error);
            grid.innerHTML = `
                <div style="grid-column: span 3;" class="alert alert-danger">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Failed to retrieve templates. (${error.message})</span>
                </div>
            `;
        }
    },

    applyFilters() {
        const searchQuery = document.getElementById('search-name').value.toLowerCase().trim();
        const procFilter = document.getElementById('filter-procedure').value;
        const grid = document.getElementById('template-grid');
        const emptyState = document.getElementById('empty-state');

        const filtered = allTemplates.filter(t => {
            const matchesSearch = t.name.toLowerCase().includes(searchQuery);
            const matchesProc = procFilter === '' || t.procedureType === procFilter;
            return matchesSearch && matchesProc;
        });

        if (filtered.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        grid.style.display = 'grid';

        const user = SlashDR.getCurrentUser();
        const isAdmin = user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_SUPER_ADMIN';

        grid.innerHTML = filtered.map(t => {
            const procClass = t.procedureType.toLowerCase().replace(/\s+/g, '-');
            const witnessText = t.requiresWitness ? 'Witness Req' : 'Patient Signature Only';
            const statusLabel = t.active ? 'Active' : 'Inactive';
            const statusClass = t.active ? 'valid' : 'muted';

            return `
                <div class="card template-card animate-fade-in">
                    <div>
                        <div class="template-header">
                            <span class="badge badge-${statusClass}">${statusLabel}</span>
                            <span class="badge badge-muted" style="text-transform: capitalize;">${t.procedureType}</span>
                        </div>
                        <h4 class="template-title">${t.name}</h4>
                        <p class="template-body-preview">${t.formBody}</p>
                    </div>
                    <div class="template-footer">
                        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
                            ${witnessText}
                        </span>
                        ${isAdmin ? `
                            <button class="btn btn-secondary" onclick="TemplatesPage.openDrawer(${t.id})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                                Edit Template
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    openDrawer(templateId = null) {
        const drawer = document.getElementById('template-drawer');
        const backdrop = document.getElementById('drawer-backdrop');
        const form = document.getElementById('template-form');
        const titleEl = document.getElementById('drawer-title');

        form.reset();
        document.getElementById('template-id').value = '';
        document.getElementById('is-active').checked = true;
        document.getElementById('requires-witness').checked = false;

        if (templateId) {
            titleEl.textContent = 'Edit Consent Template';
            const template = allTemplates.find(t => t.id === templateId);
            if (template) {
                document.getElementById('template-id').value = template.id;
                document.getElementById('template-name').value = template.name;
                document.getElementById('procedure-type').value = template.procedureType;
                document.getElementById('form-body').value = template.formBody;
                document.getElementById('requires-witness').checked = template.requiresWitness;
                // Bind to boolean 'active'
                document.getElementById('is-active').checked = template.active;
            }
        } else {
            titleEl.textContent = 'New Consent Template';
        }

        drawer.classList.add('open');
        backdrop.classList.add('open');
    },

    closeDrawer() {
        document.getElementById('template-drawer').classList.remove('open');
        document.getElementById('drawer-backdrop').classList.remove('open');
    },

    async handleSave(e) {
        e.preventDefault();
        
        const btnSave = document.getElementById('btn-save-template');
        const originalText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = `
            <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            <span>Saving...</span>
        `;

        const id = document.getElementById('template-id').value;
        const payload = {
            name: document.getElementById('template-name').value.trim(),
            procedureType: document.getElementById('procedure-type').value,
            formBody: document.getElementById('form-body').value.trim(),
            requiresWitness: document.getElementById('requires-witness').checked,
            active: document.getElementById('is-active').checked
        };

        if (id) {
            payload.id = parseInt(id, 10);
        }

        try {
            await SlashDR.apiFetch('/api/consent-templates', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.closeDrawer();
            await this.loadTemplates();
            
            // Display visual success indicator
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                const toast = document.createElement('div');
                toast.className = 'alert alert-success animate-fade-in';
                toast.style.position = 'fixed';
                toast.style.top = '2rem';
                toast.style.right = '2rem';
                toast.style.zIndex = '9999';
                toast.style.boxShadow = 'var(--shadow-xl)';
                toast.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Consent template saved successfully!</span>
                `;
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 350);
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Failed to save template: ' + error.message);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    },

    // UX Cursor Tag insertion utility
    insertAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        
        textarea.value = value.substring(0, start) + text + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }
};
