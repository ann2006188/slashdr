// Clinic Licenses Page Controller

let allLicenses = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;

    const user = SlashDR.getCurrentUser();
    
    // Boundary check: Nursing/Support Staff are blocked from viewing compliance licenses
    if (user.role === 'ROLE_STAFF') {
        window.location.href = '/consent-records.html';
        return;
    }

    ClinicLicensesPage.init();
});

const ClinicLicensesPage = {
    async init() {
        const user = SlashDR.getCurrentUser();
        const isAdmin = user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_SUPER_ADMIN';

        // Add License Button visibility based on permissions
        const btnAdd = document.getElementById('btn-add-license');
        if (btnAdd && isAdmin) {
            btnAdd.style.display = 'inline-flex';
            btnAdd.addEventListener('click', () => this.openAddDrawer());
        }

        // Check Alerts button visibility and click handler
        const btnAlerts = document.getElementById('btn-check-expiry-alerts');
        if (btnAlerts && isAdmin) {
            btnAlerts.style.display = 'inline-flex';
            btnAlerts.addEventListener('click', () => this.checkExpiryAlerts());
        }

        // Expose Clinic filter and clinic input fields for Super Admin only
        if (user.role === 'ROLE_SUPER_ADMIN') {
            const filterBlock = document.getElementById('superadmin-clinic-filter-block');
            filterBlock.innerHTML = `
                <select id="filter-clinic-id" class="form-input" style="padding: 0.625rem 1rem;">
                    <option value="">All Clinics</option>
                    <option value="clinic-001">Clinic 001</option>
                    <option value="clinic-002">Clinic 002</option>
                    <option value="clinic-003">Clinic 003</option>
                </select>
            `;
            document.getElementById('filter-clinic-id').addEventListener('change', () => this.loadLicenses());

            // Show clinic dropdown in Add Form
            document.getElementById('drawer-clinic-block').style.display = 'block';
            document.getElementById('add-clinic-id').required = true;
        }

        // Setup Search/Filter events
        document.getElementById('search-authority').addEventListener('input', () => this.applyFilters());
        document.getElementById('filter-license-type').addEventListener('change', () => this.applyFilters());

        // Setup Drawers close actions
        const closeSelectors = ['btn-close-add-drawer', 'btn-cancel-add', 'btn-close-renew-drawer', 'btn-cancel-renew', 'license-backdrop'];
        closeSelectors.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', () => this.closeAllDrawers());
            }
        });

        // Setup File Upload Dropzones
        this.setupDropzone('add-dropzone', 'add-file-input', 'add-file-preview', 'add-filename', 'add-document-url', 'btn-remove-add-file');
        this.setupDropzone('renew-dropzone', 'renew-file-input', 'renew-file-preview', 'renew-filename', 'renew-document-url', 'btn-remove-renew-file');

        // Bind Form submissions
        document.getElementById('add-license-form').addEventListener('submit', (e) => this.handleAddSubmit(e));
        document.getElementById('renew-license-form').addEventListener('submit', (e) => this.handleRenewSubmit(e));

        // Load Licenses from server
        await this.loadLicenses();

        // Check query parameters to automatically open workflows
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('add') === 'true' && isAdmin) {
            this.openAddDrawer();
        } else {
            const renewId = urlParams.get('renew');
            if (renewId && isAdmin) {
                this.openRenewDrawer(parseInt(renewId, 10));
            }
        }

        // Reveal Page content
        document.getElementById('page-content').style.display = 'block';
    },

    async loadLicenses() {
        const user = SlashDR.getCurrentUser();
        let query = '/api/clinic-licenses';

        // Super Admin clinic parameter filtering
        if (user.role === 'ROLE_SUPER_ADMIN') {
            const clinicVal = document.getElementById('filter-clinic-id')?.value;
            if (clinicVal) {
                query += `?clinicId=${encodeURIComponent(clinicVal)}`;
            }
        }

        try {
            allLicenses = await SlashDR.apiFetch(query);
            this.calculateKpis();
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load clinic licenses:', error);
            const container = document.getElementById('licenses-container');
            if (container) {
                container.innerHTML = `
                    <div style="grid-column: span 3;" class="alert alert-danger">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>Failed to load licenses records. (${error.message})</span>
                    </div>
                `;
            }
        }
    },

    calculateKpis() {
        // Calculate counter metrics for non-superseded licenses
        const current = allLicenses.filter(l => l.status !== 'Superseded');
        
        const total = current.length;
        const valid = current.filter(l => l.status === 'Valid').length;
        const warning = current.filter(l => l.status === 'Renewal Due Soon').length;
        const danger = current.filter(l => l.status === 'Urgent' || l.status === 'Expired').length;

        document.getElementById('kpi-total').textContent = total;
        document.getElementById('kpi-valid').textContent = valid;
        document.getElementById('kpi-warning').textContent = warning;
        document.getElementById('kpi-danger').textContent = danger;
    },

    applyFilters() {
        const searchQuery = document.getElementById('search-authority').value.toLowerCase().trim();
        const typeFilter = document.getElementById('filter-license-type').value;
        const container = document.getElementById('licenses-container');
        const emptyState = document.getElementById('licenses-empty-state');

        // Filter licenses client-side
        const filtered = allLicenses.filter(l => {
            const matchesSearch = l.issuingAuthority.toLowerCase().includes(searchQuery) || l.licenseNumber.toLowerCase().includes(searchQuery);
            const matchesType = typeFilter === '' || l.licenseType === typeFilter;
            return matchesSearch && matchesType;
        });

        if (filtered.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        container.style.display = 'grid';

        const user = SlashDR.getCurrentUser();
        const isAdmin = user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_SUPER_ADMIN';

        container.innerHTML = filtered.map(l => {
            const isSuperseded = l.status === 'Superseded';
            const statusBadgeClass = l.status.toLowerCase().replace(/\s+/g, '-');
            
            // Warnings banner if duplications flagged
            const duplicateBanner = l.duplicateWarning ? `
                <div class="duplicate-alert">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>Flagged: Multiple active ${l.licenseType} recorded.</span>
                </div>
            ` : '';

            // Trace link if renewed
            const historyLink = l.renewedFromId ? `
                <div class="license-info-row">
                    <span class="license-info-lbl">Renewed From</span>
                    <span class="license-info-val" style="color: var(--primary);">ID #${l.renewedFromId}</span>
                </div>
            ` : '';

            // Scope clinical context if Super Admin
            const clinicScope = user.role === 'ROLE_SUPER_ADMIN' ? `
                <div class="license-info-row">
                    <span class="license-info-lbl">Clinic ID</span>
                    <span class="license-info-val" style="text-transform: uppercase;">${l.clinicId}</span>
                </div>
            ` : '';

            return `
                <div class="card license-card animate-fade-in ${isSuperseded ? 'profile-role' : ''}" style="${isSuperseded ? 'opacity: 0.6;' : ''}">
                    <div>
                        <div class="license-header">
                            <span class="badge badge-${statusBadgeClass}">${l.status}</span>
                            <span class="badge badge-muted">${l.licenseType}</span>
                        </div>
                        <h4 class="license-title" style="margin-bottom: 1rem;">${l.issuingAuthority}</h4>
                        
                        ${duplicateBanner}
                        ${clinicScope}

                        <div class="license-info-row">
                            <span class="license-info-lbl">License Number</span>
                            <span class="license-info-val" style="font-family: monospace;">${l.licenseNumber}</span>
                        </div>
                        <div class="license-info-row">
                            <span class="license-info-lbl">Issue Date</span>
                            <span class="license-info-val">${new Date(l.issueDate).toLocaleDateString()}</span>
                        </div>
                        <div class="license-info-row">
                            <span class="license-info-lbl">Expiry Date</span>
                            <span class="license-info-val">${new Date(l.expiryDate).toLocaleDateString()}</span>
                        </div>
                        ${historyLink}
                    </div>

                    <div class="license-actions">
                        <button class="btn btn-secondary" onclick="ClinicLicensesPage.viewDocument('${l.documentUrl}')" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View File
                        </button>
                        ${isAdmin && !isSuperseded ? `
                            <button class="btn btn-primary" onclick="ClinicLicensesPage.openRenewDrawer(${l.id})" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">
                                Renew
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    async checkExpiryAlerts() {
        const btnAlerts = document.getElementById('btn-check-expiry-alerts');
        const originalHtml = btnAlerts.innerHTML;
        btnAlerts.disabled = true;
        btnAlerts.innerHTML = `<span>Checking...</span>`;
        try {
            const data = await SlashDR.apiFetch('/api/clinic-licenses/check-expiry-notifications', {
                method: 'POST'
            });
            this.showToast(`Checked expiry thresholds! Notifications Fired: ${data.notificationsFired}`);
            // Reload list to reflect warning changes
            await this.loadLicenses();
        } catch (error) {
            alert('Failed to trigger alerts: ' + error.message);
        } finally {
            btnAlerts.disabled = false;
            btnAlerts.innerHTML = originalHtml;
        }
    },

    // --- Programmatic File Downloads with Auth Headers ---
    async viewDocument(docUrl) {
        try {
            const blob = await SlashDR.apiFetch(docUrl);
            const objectUrl = URL.createObjectURL(blob);
            
            // Open attachment in a new browser window/tab
            window.open(objectUrl, '_blank');
        } catch (error) {
            console.error('File opening failed:', error);
            alert('Could not retrieve certificate attachment: ' + error.message);
        }
    },

    // --- Uploader Drag & Drop Event Binds ---
    setupDropzone(zoneId, inputId, previewId, filenameId, hiddenUrlId, removeBtnId) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        const filenameText = document.getElementById(filenameId);
        const hiddenUrl = document.getElementById(hiddenUrlId);
        const removeBtn = document.getElementById(removeBtnId);

        // Click zone triggers browse dialog
        zone.addEventListener('click', () => input.click());

        // Drag highlights
        ['dragenter', 'dragover'].forEach(name => {
            zone.addEventListener(name, (e) => {
                e.preventDefault();
                zone.style.borderColor = 'var(--primary)';
                zone.style.backgroundColor = 'var(--bg-card-hover)';
            });
        });

        ['dragleave', 'dragend', 'drop'].forEach(name => {
            zone.addEventListener(name, (e) => {
                e.preventDefault();
                zone.style.borderColor = 'var(--border-color)';
                zone.style.backgroundColor = 'rgba(255, 255, 255, 0.01)';
            });
        });

        // Drop file
        zone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0], zone, preview, filenameText, hiddenUrl);
            }
        });

        // Select file
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                this.handleFileUpload(input.files[0], zone, preview, filenameText, hiddenUrl);
            }
        });

        // Remove Attachment
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hiddenUrl.value = '';
            input.value = '';
            preview.style.display = 'none';
            zone.style.display = 'block';
        });
    },

    async handleFileUpload(file, zone, preview, filenameText, hiddenUrl) {
        // Enforce validations (Size limit 5MB, Allowed types: PDF, JPG, PNG)
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
        const ext = file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(ext)) {
            alert('Only PDF, JPG, and PNG files are allowed.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('File exceeds the 5MB size limit.');
            return;
        }

        const originalZoneHtml = zone.innerHTML;
        zone.style.pointerEvents = 'none';
        zone.innerHTML = `
            <div class="loading-spinner" style="margin: 0 auto; width: 24px; height: 24px;"></div>
            <div class="dropzone-text">Uploading attachment...</div>
        `;

        try {
            const formData = new FormData();
            formData.append('file', file);

            const data = await SlashDR.apiFetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            });

            hiddenUrl.value = data.url;
            filenameText.textContent = file.name;
            zone.style.display = 'none';
            preview.style.display = 'flex';

        } catch (error) {
            alert('Upload failed: ' + error.message);
        } finally {
            zone.style.pointerEvents = 'auto';
            zone.innerHTML = originalZoneHtml;
        }
    },

    // --- Drawer Operations ---
    openAddDrawer() {
        const drawer = document.getElementById('add-license-drawer');
        const backdrop = document.getElementById('license-backdrop');
        document.getElementById('add-license-form').reset();
        
        // Reset file widgets
        document.getElementById('add-document-url').value = '';
        document.getElementById('add-file-preview').style.display = 'none';
        document.getElementById('add-dropzone').style.display = 'block';

        drawer.classList.add('open');
        backdrop.classList.add('open');
    },

    openRenewDrawer(id) {
        const license = allLicenses.find(l => l.id === id);
        if (!license) return;

        const drawer = document.getElementById('renew-license-drawer');
        const backdrop = document.getElementById('license-backdrop');
        document.getElementById('renew-license-form').reset();

        // Populate ReadOnly details
        document.getElementById('renew-license-id').value = license.id;
        document.getElementById('renew-old-type').textContent = license.licenseType;
        document.getElementById('renew-old-number').textContent = license.licenseNumber;
        document.getElementById('renew-old-authority').textContent = license.issuingAuthority;

        // Default prefill values
        document.getElementById('renew-license-number').value = license.licenseNumber;

        // Reset file widgets
        document.getElementById('renew-document-url').value = '';
        document.getElementById('renew-file-preview').style.display = 'none';
        document.getElementById('renew-dropzone').style.display = 'block';

        drawer.classList.add('open');
        backdrop.classList.add('open');
    },

    closeAllDrawers() {
        document.getElementById('add-license-drawer').classList.remove('open');
        document.getElementById('renew-license-drawer').classList.remove('open');
        document.getElementById('license-backdrop').classList.remove('open');
    },

    // --- Submissions (REST API Save & Renew) ---
    async handleAddSubmit(e) {
        e.preventDefault();

        const user = SlashDR.getCurrentUser();
        const issueDate = document.getElementById('add-issue-date').value;
        const expiryDate = document.getElementById('add-expiry-date').value;

        // Validate date ranges
        if (new Date(expiryDate) <= new Date(issueDate)) {
            alert('Expiry Date must be after the Issue Date.');
            return;
        }

        const documentUrl = document.getElementById('add-document-url').value;
        if (!documentUrl) {
            alert('Please upload a verification document certificate.');
            return;
        }

        const btnSave = document.getElementById('btn-save-license');
        const originalText = btnSave.innerHTML;
        btnSave.disabled = true;
        btnSave.innerHTML = `<span>Saving...</span>`;

        const payload = {
            licenseType: document.getElementById('add-license-type').value,
            licenseNumber: document.getElementById('add-license-number').value.trim(),
            issuingAuthority: document.getElementById('add-issuing-authority').value.trim(),
            issueDate: issueDate,
            expiryDate: expiryDate,
            documentUrl: documentUrl
        };

        if (user.role === 'ROLE_SUPER_ADMIN') {
            payload.clinicId = document.getElementById('add-clinic-id').value;
        }

        try {
            await SlashDR.apiFetch('/api/clinic-licenses', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.closeAllDrawers();
            await this.loadLicenses();
            this.showToast('Compliance license recorded successfully!');

        } catch (error) {
            alert('Failed to save license: ' + error.message);
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = originalText;
        }
    },

    async handleRenewSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('renew-license-id').value;
        const issueDate = document.getElementById('renew-issue-date').value;
        const expiryDate = document.getElementById('renew-expiry-date').value;

        // Validate date ranges
        if (new Date(expiryDate) <= new Date(issueDate)) {
            alert('Expiry Date must be after the Issue Date.');
            return;
        }

        const documentUrl = document.getElementById('renew-document-url').value;
        if (!documentUrl) {
            alert('Please upload a new verification document certificate.');
            return;
        }

        const btnSubmit = document.getElementById('btn-submit-renew');
        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<span>Submitting...</span>`;

        const payload = {
            licenseNumber: document.getElementById('renew-license-number').value.trim(),
            issueDate: issueDate,
            expiryDate: expiryDate,
            documentUrl: documentUrl
        };

        try {
            await SlashDR.apiFetch(`/api/clinic-licenses/${id}/renew`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.closeAllDrawers();
            await this.loadLicenses();
            this.showToast('Compliance license successfully renewed!');

        } catch (error) {
            alert('Failed to renew license: ' + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
        }
    },

    showToast(message) {
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
                <span>${message}</span>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 350);
            }, 3000);
        }
    }
};
