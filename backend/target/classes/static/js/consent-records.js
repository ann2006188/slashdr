// Consent Records Controller Logic

let allConsentTemplates = [];
let selectedTemplate = null;
let currentStep = 1;
let patientSigPad = null;
let witnessSigPad = null;
let currentDetailsRecord = null;
let modalActionType = ''; // 'void' or 'decline'

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;

    ConsentRecords.init();
});

const ConsentRecords = {
    async init() {
        const user = SlashDR.getCurrentUser();
        
        // Pre-fill captured by in step 2
        const captureByInput = document.getElementById('capture-by');
        if (captureByInput) {
            captureByInput.value = user.name;
        }

        // Initialize signature pads
        patientSigPad = this.initSignaturePad('patient-sig-canvas', 'btn-clear-patient-sig');
        witnessSigPad = this.initSignaturePad('witness-sig-canvas', 'btn-clear-witness-sig');

        // Bind Tab events
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.getAttribute('data-panel');
                this.switchTab(tab.id, targetPanel);
            });
        });

        // Check if URL specifies auto-capture mode
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('capture') === 'true') {
            this.switchTab('tab-capture', 'panel-capture');
        }

        // Bind Filters & Buttons
        document.getElementById('btn-reset-filters').addEventListener('click', () => this.resetFilters());
        document.getElementById('btn-export-csv').addEventListener('click', () => this.exportCsv());
        
        // Bind Filter Input events for instant live searches (debounce)
        const filterInputs = ['filter-patient-id', 'filter-status', 'filter-procedure-type', 'filter-captured-by', 'filter-date-from', 'filter-date-to'];
        filterInputs.forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.loadRecords());
            if (id === 'filter-patient-id' || id === 'filter-captured-by') {
                document.getElementById(id).addEventListener('keyup', () => this.loadRecords());
            }
        });

        // Details drawer controls
        document.getElementById('btn-close-details').addEventListener('click', () => this.closeDetailsDrawer());
        document.getElementById('btn-close-details-footer').addEventListener('click', () => this.closeDetailsDrawer());
        document.getElementById('details-backdrop').addEventListener('click', () => this.closeDetailsDrawer());
        document.getElementById('btn-export-pdf').addEventListener('click', () => this.exportPdf());
        document.getElementById('btn-void-action').addEventListener('click', () => this.openReasonModal('void'));

        // Reason Modal controls
        document.getElementById('btn-close-reason-modal').addEventListener('click', () => this.closeReasonModal());
        document.getElementById('btn-cancel-reason-modal').addEventListener('click', () => this.closeReasonModal());
        document.getElementById('reason-modal-form').addEventListener('submit', (e) => this.handleReasonSubmit(e));

        // Decline Button
        document.getElementById('btn-decline-consent').addEventListener('click', () => this.openReasonModal('decline'));

        // Wizard navigation buttons
        document.querySelectorAll('.btn-next').forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseInt(btn.getAttribute('data-current'), 10);
                const next = parseInt(btn.getAttribute('data-next'), 10);
                this.navigateStep(current, next);
            });
        });

        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => {
                const current = parseInt(btn.getAttribute('data-current'), 10);
                const prev = parseInt(btn.getAttribute('data-prev'), 10);
                this.navigateStep(current, prev);
            });
        });

        // Submit Button
        document.getElementById('btn-submit-consent').addEventListener('click', () => this.submitConsentRecord());

        // Load Templates and Consent Records
        await this.loadTemplates();
        await this.loadRecords();

        // Reveal Page content
        document.getElementById('page-content').style.display = 'block';
    },

    switchTab(tabId, panelId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

        document.getElementById(tabId).classList.add('active');
        document.getElementById(panelId).classList.add('active');

        if (tabId === 'tab-capture') {
            this.resetWizard();
        } else {
            this.loadRecords();
        }
    },

    // --- Wizard Mechanics ---
    resetWizard() {
        currentStep = 1;
        selectedTemplate = null;
        patientSigPad.clear();
        witnessSigPad.clear();
        document.getElementById('capture-patient-id').value = '';
        document.getElementById('capture-visit-id').value = '';
        document.getElementById('capture-valid-until').value = '';
        document.getElementById('capture-witness-name').value = '';
        document.getElementById('capture-risks-explained').checked = false;
        
        // Reset steps visibility
        for (let i = 1; i <= 4; i++) {
            document.getElementById(`step-${i}`).style.display = i === 1 ? 'flex' : 'none';
        }
        
        this.renderTemplatePicker();
    },

    renderTemplatePicker() {
        const picker = document.getElementById('capture-template-picker');
        if (!picker) return;

        // Load only active templates for new captures (Requirement enforcement)
        const activeTemplates = allConsentTemplates.filter(t => t.active);

        if (activeTemplates.length === 0) {
            picker.innerHTML = `
                <div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 2rem;">
                    No active consent templates exist. Admins must create/activate templates first.
                </div>
            `;
            return;
        }

        picker.innerHTML = activeTemplates.map(t => `
            <button class="picker-card animate-fade-in" onclick="ConsentRecords.selectTemplate(${t.id})">
                <span class="badge badge-muted" style="margin-bottom: 0.5rem; text-transform: uppercase;">${t.procedureType}</span>
                <h4 style="font-size: 0.9375rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">${t.name}</h4>
                <p style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${t.formBody}</p>
            </button>
        `).join('');
    },

    selectTemplate(id) {
        selectedTemplate = allConsentTemplates.find(t => t.id === id);
        
        // Visually mark selected
        const buttons = document.querySelectorAll('#capture-template-picker .picker-card');
        buttons.forEach((btn, index) => {
            const activeTemplates = allConsentTemplates.filter(t => t.active);
            if (activeTemplates[index].id === id) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });

        // Automatically move to step 2 after a brief delay
        setTimeout(() => this.navigateStep(1, 2), 250);
    },

    navigateStep(current, next) {
        // Validate inputs before continuing
        if (next > current) {
            if (current === 1 && !selectedTemplate) {
                alert('Please select a consent template to proceed.');
                return;
            }
            if (current === 2) {
                const patientId = document.getElementById('capture-patient-id').value.trim();
                const visitId = document.getElementById('capture-visit-id').value.trim();
                if (!patientId || !visitId) {
                    alert('Patient ID and Visit ID are required fields.');
                    return;
                }
            }
            if (current === 3) {
                // Ensure placeholder inputs are filled out
                const inputs = document.querySelectorAll('#placeholder-inputs-container input');
                let isValid = true;
                inputs.forEach(inp => {
                    if (!inp.value.trim()) {
                        inp.style.borderColor = 'var(--status-danger-text)';
                        isValid = false;
                    } else {
                        inp.style.borderColor = 'var(--border-color)';
                    }
                });
                if (!isValid) {
                    alert('Please fill out all dynamic placeholder fields.');
                    return;
                }
            }
        }

        // Handle step-specific setups
        if (next === 3) {
            this.setupPlaceholderFields();
        }
        if (next === 4) {
            // Setup witness block visibility based on template rules
            const witnessBlock = document.getElementById('witness-signing-block');
            if (selectedTemplate.requiresWitness) {
                witnessBlock.style.display = 'flex';
            } else {
                witnessBlock.style.display = 'none';
            }
            
            // Trigger signature canvas sizing fixes
            setTimeout(() => {
                this.resizeCanvas('patient-sig-canvas');
                this.resizeCanvas('witness-sig-canvas');
            }, 50);
        }

        // Perform transition
        document.getElementById(`step-${current}`).style.display = 'none';
        document.getElementById(`step-${next}`).style.display = 'flex';
        currentStep = next;
    },

    setupPlaceholderFields() {
        const container = document.getElementById('placeholder-inputs-container');
        if (!container) return;

        // Parse placeholders in the template text using regex
        const bodyText = selectedTemplate.formBody;
        const regex = /\[([^\]]+)\]/g;
        let match;
        const placeholders = new Set();
        
        while ((match = regex.exec(bodyText)) !== null) {
            placeholders.add(match[1]);
        }

        if (placeholders.size === 0) {
            container.innerHTML = `
                <div style="grid-column: span 2; color: var(--text-muted); font-size: 0.8125rem; padding: 0.5rem 0;">
                    No dynamic placeholders identified in this template.
                </div>
            `;
            document.getElementById('live-consent-preview').textContent = bodyText;
            return;
        }

        container.innerHTML = Array.from(placeholders).map(tag => `
            <div class="form-group">
                <label class="form-label" for="placeholder-field-${tag.replace(/\s+/g, '-')}">${tag}</label>
                <input type="text" class="form-input placeholder-field-input" data-tag="${tag}" id="placeholder-field-${tag.replace(/\s+/g, '-')}" placeholder="Enter ${tag}..." required>
            </div>
        `).join('');

        // Attach keyup listeners to inputs to update the live preview in real time
        const inputs = container.querySelectorAll('.placeholder-field-input');
        inputs.forEach(inp => {
            inp.addEventListener('input', () => this.updateLivePreview());
        });

        this.updateLivePreview();
    },

    updateLivePreview() {
        const preview = document.getElementById('live-consent-preview');
        if (!preview) return;

        let renderedText = selectedTemplate.formBody;
        const inputs = document.querySelectorAll('.placeholder-field-input');
        
        inputs.forEach(inp => {
            const tag = inp.getAttribute('data-tag');
            const val = inp.value.trim() || `[${tag}]`;
            renderedText = renderedText.replaceAll(`[${tag}]`, val);
        });

        preview.textContent = renderedText;
    },

    // --- Dynamic Canvas Signature Pad Helpers ---
    initSignaturePad(canvasId, clearButtonId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        
        ctx.strokeStyle = '#6366f1'; // Beautiful indigo stroke color
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        let drawing = false;
        let lastX = 0;
        let lastY = 0;
        let empty = true;

        function getCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            // Handle both touch and mouse positions
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Adjust coordinates based on bounding rectangle and canvas scaling width/height
            return {
                x: ((clientX - rect.left) / rect.width) * canvas.width,
                y: ((clientY - rect.top) / rect.height) * canvas.height
            };
        }

        function startDrawing(e) {
            drawing = true;
            const coords = getCoordinates(e);
            lastX = coords.x;
            lastY = coords.y;
            empty = false;
            e.preventDefault();
        }

        function draw(e) {
            if (!drawing) return;
            const coords = getCoordinates(e);
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
            lastX = coords.x;
            lastY = coords.y;
            e.preventDefault();
        }

        function stopDrawing() {
            drawing = false;
        }

        // Mouse listeners
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);

        // Mobile touch listeners
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        // Bind Clear Button
        document.getElementById(clearButtonId).addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            empty = true;
        });

        return {
            clear() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                empty = true;
            },
            isEmpty() {
                return empty;
            },
            toBlob() {
                if (empty) return null;
                return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            }
        };
    },

    resizeCanvas(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Corrects drawing resolution issues on high-DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    },

    // --- API Integrations ---
    async loadTemplates() {
        allConsentTemplates = await SlashDR.apiFetch('/api/consent-templates');
    },

    async loadRecords() {
        const tbody = document.getElementById('records-tbody');
        const emptyState = document.getElementById('register-empty-state');
        const tableContainer = document.getElementById('records-table-container');
        if (!tbody) return;

        // Compile query filters
        const patientId = document.getElementById('filter-patient-id').value.trim();
        const status = document.getElementById('filter-status').value;
        const procedureType = document.getElementById('filter-procedure-type').value;
        const capturedBy = document.getElementById('filter-captured-by').value.trim();
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;

        let query = '/api/consent-records?';
        if (patientId) query += `patientId=${encodeURIComponent(patientId)}&`;
        if (status) query += `status=${encodeURIComponent(status)}&`;
        if (procedureType) query += `procedureType=${encodeURIComponent(procedureType)}&`;
        if (capturedBy) query += `capturedBy=${encodeURIComponent(capturedBy)}&`;
        if (dateFrom) query += `dateFrom=${encodeURIComponent(dateFrom)}&`;
        if (dateTo) query += `dateTo=${encodeURIComponent(dateTo)}&`;

        try {
            const records = await SlashDR.apiFetch(query);
            
            // Sort records: newest first (higher ID first)
            records.sort((a, b) => b.id - a.id);

            if (records.length === 0) {
                tableContainer.style.display = 'none';
                emptyState.style.display = 'flex';
                return;
            }

            emptyState.style.display = 'none';
            tableContainer.style.display = 'block';

            tbody.innerHTML = records.map(r => {
                const dateLabel = r.capturedAt ? new Date(r.capturedAt).toLocaleString() : 'N/A';
                // Resolve procedure type from templates cache
                const template = allConsentTemplates.find(t => t.id === r.templateId);
                const procType = template ? template.procedureType : 'Unknown';
                const witnessLabel = r.witnessName ? r.witnessName : 'None';

                // Expiry checks for visual warnings (A.4)
                let displayStatus = r.status;
                let badgeClass = r.status.toLowerCase();
                if (r.status === 'active' && r.validUntil && new Date(r.validUntil) < new Date()) {
                    displayStatus = 'Expired';
                    badgeClass = 'expired';
                }

                return `
                    <tr onclick="ConsentRecords.openDetailsDrawer(${r.id})" style="cursor: pointer;">
                        <td style="font-weight: 600; color: var(--primary);">#${r.id}</td>
                        <td style="font-weight: 600; color: var(--text-primary);">${r.patientId}</td>
                        <td>${r.visitId}</td>
                        <td>${r.capturedBy}</td>
                        <td>${dateLabel}</td>
                        <td><span class="badge badge-${badgeClass}">${displayStatus}</span></td>
                        <td style="text-align: right; color: var(--text-secondary);">${witnessLabel}</td>
                    </tr>
                `;
            }).join('');

        } catch (error) {
            console.error('Failed to load consent records:', error);
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--status-danger-text);">Error loading records: ${error.message}</td></tr>`;
        }
    },

    async openDetailsDrawer(id) {
        const drawer = document.getElementById('record-details-drawer');
        const backdrop = document.getElementById('details-backdrop');

        try {
            const record = await SlashDR.apiFetch(`/api/consent-records/${id}`);
            currentDetailsRecord = record;

            // Resolve procedure type
            const template = allConsentTemplates.find(t => t.id === record.templateId);
            const procType = template ? template.procedureType : 'Unknown';

            // Expiry checks for details view (A.4)
            let isExpired = false;
            if (record.status === 'active' && record.validUntil && new Date(record.validUntil) < new Date()) {
                isExpired = true;
            }

            // Fill Metadata
            document.getElementById('detail-record-id').textContent = record.id;
            document.getElementById('detail-patient-id').textContent = record.patientId;
            document.getElementById('detail-visit-id').textContent = record.visitId;
            document.getElementById('detail-procedure-type').textContent = procType.toUpperCase();
            document.getElementById('detail-captured-by').textContent = record.capturedBy;
            document.getElementById('detail-captured-at').textContent = record.capturedAt ? new Date(record.capturedAt).toLocaleString() : 'N/A';
            document.getElementById('detail-status').innerHTML = `<span class="badge badge-${isExpired ? 'expired' : record.status}">${isExpired ? 'Expired' : record.status}</span>`;

            // Expiry Date (valid_until)
            const expiryBlock = document.getElementById('detail-expiry-block');
            if (record.validUntil) {
                expiryBlock.style.display = 'flex';
                document.getElementById('detail-valid-until').textContent = new Date(record.validUntil).toLocaleDateString();
            } else {
                expiryBlock.style.display = 'none';
            }

            // Fill Frozen Text body
            document.getElementById('detail-frozen-text').textContent = record.frozenFormText || '(no consent text recorded)';

            // Hide/Show signatures or reason block
            const signaturesBox = document.getElementById('detail-signatures-container');
            const voidBox = document.getElementById('detail-void-block');
            const btnVoid = document.getElementById('btn-void-action');

            if (record.status === 'declined') {
                // Declined: No signatures, only decline reason
                signaturesBox.style.display = 'none';
                voidBox.style.display = 'block';
                document.getElementById('detail-void-label').textContent = 'Decline Reason';
                document.getElementById('detail-void-reason').textContent = record.voidReason || 'No reason specified.';
                btnVoid.style.display = 'none';
            } else if (record.status === 'void') {
                // Voided: Signatures present, plus void reason
                signaturesBox.style.display = 'grid';
                voidBox.style.display = 'block';
                document.getElementById('detail-void-label').textContent = 'Void Reason';
                document.getElementById('detail-void-reason').textContent = record.voidReason || 'No reason specified.';
                btnVoid.style.display = 'none';
                this.loadSignatureImages(record);
            } else if (isExpired) {
                // Expired: Signatures present, no void action
                signaturesBox.style.display = 'grid';
                voidBox.style.display = 'none';
                btnVoid.style.display = 'none';
                this.loadSignatureImages(record);
            } else {
                // Active: Signatures present, no void reason
                signaturesBox.style.display = 'grid';
                voidBox.style.display = 'none';
                
                // Show void action button only for admins
                const user = SlashDR.getCurrentUser();
                if (user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_SUPER_ADMIN') {
                    btnVoid.style.display = 'inline-flex';
                } else {
                    btnVoid.style.display = 'none';
                }
                this.loadSignatureImages(record);
            }

            drawer.classList.add('open');
            backdrop.classList.add('open');

        } catch (error) {
            alert('Failed to retrieve record details: ' + error.message);
        }
    },

    loadSignatureImages(record) {
        document.getElementById('detail-patient-signature-img').src = record.patientSignatureUrl || '';
        
        const witnessBlock = document.getElementById('detail-witness-sig-block');
        if (record.witnessSignatureUrl) {
            witnessBlock.style.display = 'flex';
            document.getElementById('detail-witness-name').textContent = record.witnessName || 'Witness';
            document.getElementById('detail-witness-signature-img').src = record.witnessSignatureUrl;
        } else {
            witnessBlock.style.display = 'none';
        }
    },

    closeDetailsDrawer() {
        document.getElementById('record-details-drawer').classList.remove('open');
        document.getElementById('details-backdrop').classList.remove('open');
        currentDetailsRecord = null;
    },

    // --- Document Canvas Uploader (Multipart) ---
    async uploadSignatureImage(sigPad, filename) {
        const blob = await sigPad.toBlob();
        if (!blob) return null;

        const formData = new FormData();
        formData.append('file', blob, filename);

        const response = await fetch('/api/documents/upload', {
            method: 'POST',
            headers: {
                'Authorization': SlashDR.getAuthHeader()
            },
            body: formData
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to upload signature file.');
        }

        const data = await response.json();
        return data.url; // Returns access-controlled download endpoint URL
    },

    // --- Submit Flow ---
    async submitConsentRecord() {
        // Enforce validations
        const risksChecked = document.getElementById('capture-risks-explained').checked;
        if (!risksChecked) {
            alert('You must confirm that risks have been explained to the patient.');
            return;
        }

        if (patientSigPad.isEmpty()) {
            alert('Patient signature is required.');
            return;
        }

        if (selectedTemplate.requiresWitness) {
            const witnessName = document.getElementById('capture-witness-name').value.trim();
            if (!witnessName) {
                alert('Witness Name is required.');
                return;
            }
            if (witnessSigPad.isEmpty()) {
                alert('Witness signature is required.');
                return;
            }
        }

        const btnSubmit = document.getElementById('btn-submit-consent');
        const btnDecline = document.getElementById('btn-decline-consent');
        const originalHtml = btnSubmit.innerHTML;

        // Enter loading state
        btnSubmit.disabled = true;
        btnDecline.disabled = true;
        btnSubmit.innerHTML = `
            <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            <span>Uploading Signatures...</span>
        `;

        try {
            const timestamp = Date.now();
            const patientId = document.getElementById('capture-patient-id').value.trim();
            const visitId = document.getElementById('capture-visit-id').value.trim();

            // 1. Upload Patient Signature
            const patientSignatureUrl = await this.uploadSignatureImage(
                patientSigPad, 
                `sig-patient-${patientId}-${timestamp}.png`
            );

            // 2. Upload Witness Signature if required
            let witnessSignatureUrl = null;
            let witnessName = null;
            if (selectedTemplate.requiresWitness) {
                witnessName = document.getElementById('capture-witness-name').value.trim();
                witnessSignatureUrl = await this.uploadSignatureImage(
                    witnessSigPad, 
                    `sig-witness-${patientId}-${timestamp}.png`
                );
            }

            // 3. Compile filled placeholder JSON map
            const filledData = {};
            document.querySelectorAll('.placeholder-field-input').forEach(inp => {
                const tag = inp.getAttribute('data-tag');
                filledData[tag] = inp.value.trim();
            });

            // Expiry validity check
            const validUntilVal = document.getElementById('capture-valid-until').value;
            const validUntil = validUntilVal ? `${validUntilVal}T23:59:59` : null;

            // 4. Save Consent Record
            const payload = {
                templateId: selectedTemplate.id,
                patientId: patientId,
                visitId: visitId,
                validUntil: validUntil,
                capturedBy: SlashDR.getCurrentUser().name,
                risksExplained: true,
                patientSignatureUrl: patientSignatureUrl,
                witnessSignatureUrl: witnessSignatureUrl,
                witnessName: witnessName,
                filledDataJson: JSON.stringify(filledData),
                status: 'active'
            };

            await SlashDR.apiFetch('/api/consent-records', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.showToast('Patient consent captured successfully!');
            this.switchTab('tab-register', 'panel-register');

        } catch (error) {
            console.error('Failed to capture consent:', error);
            alert('Failed to capture consent: ' + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnDecline.disabled = false;
            btnSubmit.innerHTML = originalHtml;
        }
    },

    // --- Reason Modals (Decline / Void) ---
    openReasonModal(type) {
        modalActionType = type;
        const modal = document.getElementById('reason-modal-backdrop');
        const title = document.getElementById('reason-modal-title');
        const label = document.getElementById('reason-modal-label');
        const textarea = document.getElementById('reason-text');

        textarea.value = '';

        if (type === 'decline') {
            title.textContent = 'Patient Declines Consent';
            label.textContent = 'Document the reason why the patient is declining this clinical consent form *';
            textarea.placeholder = 'e.g. Patient prefers alternative treatment...';
        } else {
            title.textContent = 'Void Consent Record';
            label.textContent = 'Document the reason why you are voiding this active consent record *';
            textarea.placeholder = 'e.g. Data entry error / correction needed...';
        }

        modal.classList.add('open');
    },

    closeReasonModal() {
        document.getElementById('reason-modal-backdrop').classList.remove('open');
        modalActionType = '';
    },

    async handleReasonSubmit(e) {
        e.preventDefault();
        const reason = document.getElementById('reason-text').value.trim();
        
        if (modalActionType === 'decline') {
            await this.submitDeclinedConsent(reason);
        } else {
            await this.submitVoidRecord(reason);
        }
        
        this.closeReasonModal();
    },

    async submitDeclinedConsent(reason) {
        // Capture record directly as declined
        const patientId = document.getElementById('capture-patient-id').value.trim();
        const visitId = document.getElementById('capture-visit-id').value.trim();

        if (!patientId || !visitId) {
            alert('Patient ID and Visit ID are required to log a declined consent.');
            return;
        }

        const btnSubmit = document.getElementById('btn-submit-consent');
        const btnDecline = document.getElementById('btn-decline-consent');
        const originalHtml = btnDecline.innerHTML;

        btnSubmit.disabled = true;
        btnDecline.disabled = true;
        btnDecline.innerHTML = `<span>Saving...</span>`;

        try {
            const payload = {
                templateId: selectedTemplate.id,
                patientId: patientId,
                visitId: visitId,
                capturedBy: SlashDR.getCurrentUser().name,
                risksExplained: false,
                filledDataJson: JSON.stringify({}),
                status: 'declined',
                voidReason: reason
            };

            await SlashDR.apiFetch('/api/consent-records', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            this.showToast('Consent refusal documented successfully.');
            this.switchTab('tab-register', 'panel-register');

        } catch (error) {
            console.error('Failed to log declined consent:', error);
            alert('Failed to log declined consent: ' + error.message);
        } finally {
            btnSubmit.disabled = false;
            btnDecline.disabled = false;
            btnDecline.innerHTML = originalHtml;
        }
    },

    async submitVoidRecord(reason) {
        if (!currentDetailsRecord) return;
        
        const btnVoid = document.getElementById('btn-void-action');
        btnVoid.disabled = true;

        try {
            await SlashDR.apiFetch(`/api/consent-records/${currentDetailsRecord.id}/void`, {
                method: 'POST',
                body: JSON.stringify({ reason: reason })
            });

            this.showToast(`Consent Record #${currentDetailsRecord.id} has been voided.`);
            this.closeDetailsDrawer();
            await this.loadRecords();

        } catch (error) {
            console.error('Failed to void record:', error);
            alert('Failed to void record: ' + error.message);
            btnVoid.disabled = false;
        }
    },

    // --- Exports (PDF & CSV) ---
    exportPdf() {
        if (!currentDetailsRecord) return;
        
        const url = `/api/consent-records/${currentDetailsRecord.id}/export`;
        
        // Use standard window.location to trigger download
        const link = document.createElement('a');
        link.href = url;
        // Attach auth credentials as query params? No, standard Basic Auth session will authorize it if they already authenticated.
        // Wait, standard browser downloads don't send Basic Auth header unless it is saved in browser cache.
        // If the browser already prompted/authenticated it once, it will work.
        // But since we use sessionStorage and custom header, standard anchor clicks might fail with 401!
        // To fix this, we can fetch the blob programmatically with auth headers, create an object URL, and trigger download!
        // This is a highly robust and necessary method!
        this.downloadFileWithAuth(url, `consent-record-${currentDetailsRecord.id}.pdf`);
    },

    exportCsv() {
        const patientId = document.getElementById('filter-patient-id').value.trim();
        const status = document.getElementById('filter-status').value;
        const procedureType = document.getElementById('filter-procedure-type').value;
        const capturedBy = document.getElementById('filter-captured-by').value.trim();
        const dateFrom = document.getElementById('filter-date-from').value;
        const dateTo = document.getElementById('filter-date-to').value;

        let url = '/api/consent-records/export?';
        if (patientId) url += `patientId=${encodeURIComponent(patientId)}&`;
        if (status) url += `status=${encodeURIComponent(status)}&`;
        if (procedureType) url += `procedureType=${encodeURIComponent(procedureType)}&`;
        if (capturedBy) url += `capturedBy=${encodeURIComponent(capturedBy)}&`;
        if (dateFrom) url += `dateFrom=${encodeURIComponent(dateFrom)}&`;
        if (dateTo) url += `dateTo=${encodeURIComponent(dateTo)}&`;

        this.downloadFileWithAuth(url, 'consent-register.csv');
    },

    async downloadFileWithAuth(url, filename) {
        try {
            const blob = await SlashDR.apiFetch(url);
            const objectUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error('Download failed:', error);
            alert('File download failed: ' + error.message);
        }
    },

    resetFilters() {
        document.getElementById('filter-patient-id').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-procedure-type').value = '';
        document.getElementById('filter-captured-by').value = '';
        document.getElementById('filter-date-from').value = '';
        document.getElementById('filter-date-to').value = '';
        
        this.loadRecords();
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
