// Dashboard Controller Logic

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;
    
    // Boundary check: Staff cannot view compliance dashboard (redirect to records)
    const user = SlashDR.getCurrentUser();
    if (user.role === 'ROLE_STAFF') {
        window.location.href = '/consent-records.html';
        return;
    }
    
    // Start dashboard initialization
    Dashboard.init();
});

const Dashboard = {
    async init() {
        const user = SlashDR.getCurrentUser();
        const pageContent = document.getElementById('page-content');
        
        // Hide ops controls for Doctor & Staff roles
        const opsCard = document.getElementById('testing-controls-card');
        if (opsCard && (user.role === 'ROLE_DOCTOR' || user.role === 'ROLE_STAFF')) {
            opsCard.style.display = 'none';
        }

        try {
            // Load statistics, main grid panels, and alerts based on role
            await this.loadStats(user);
            await this.loadMainPanel(user);
            await this.loadNotifications(user);

            // Bind Ops Control action
            const btnTrigger = document.getElementById('btn-trigger-expiry');
            if (btnTrigger) {
                btnTrigger.addEventListener('click', () => this.triggerExpiryCheck(user));
            }

            // Reveal Page smoothly
            pageContent.style.display = 'block';
        } catch (error) {
            console.error('Dashboard init error:', error);
            // Display alert banner in main panel
            const mainPanel = document.getElementById('main-panel');
            if (mainPanel) {
                mainPanel.innerHTML = `
                    <div class="alert alert-danger">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>Failed to load dashboard data. Please try again. (${error.message})</span>
                    </div>
                `;
                pageContent.style.display = 'block';
            }
        }
    },

    async loadStats(user) {
        const container = document.getElementById('stats-container');
        if (!container) return;

        let stats = [];

        if (user.role === 'ROLE_SUPER_ADMIN') {
            // Super Admin: Cross-clinic license counts and total consent records
            const summary = await SlashDR.apiFetch('/api/clinic-licenses/summary');
            const consents = await SlashDR.apiFetch('/api/consent-records');

            stats = [
                { value: summary.total || 0, label: 'Active Licenses', icon: SlashDR.icons.licenses },
                { value: summary.expiringIn30Days || 0, label: 'Expiring Soon', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
                { value: summary.expired || 0, label: 'Expired Licenses', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
                { value: consents.length || 0, label: 'Total Consents', icon: SlashDR.icons.records }
            ];
        } else if (user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_DOCTOR') {
            // Clinic Admin or Doctor: Scoped license counts and consents
            const licenses = await SlashDR.apiFetch('/api/clinic-licenses');
            const consents = await SlashDR.apiFetch('/api/consent-records');

            const active = licenses.filter(l => l.status !== 'Superseded');
            const expired = active.filter(l => l.status === 'Expired').length;
            const urgent = active.filter(l => l.status === 'Urgent' || l.status === 'Renewal Due Soon').length;

            stats = [
                { value: active.length, label: 'Clinic Licenses', icon: SlashDR.icons.licenses },
                { value: urgent, label: 'Expiring/Urgent', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` },
                { value: expired, label: 'Expired Licenses', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
                { value: consents.length, label: 'Clinic Consents', icon: SlashDR.icons.records }
            ];
        } else {
            // Staff: Simplified dashboard showing consent activity
            const consents = await SlashDR.apiFetch('/api/consent-records');
            const activeConsents = consents.filter(c => c.status === 'active').length;
            const declined = consents.filter(c => c.status === 'declined').length;
            const voided = consents.filter(c => c.status === 'void').length;

            stats = [
                { value: consents.length, label: 'Captured Consents', icon: SlashDR.icons.records },
                { value: activeConsents, label: 'Active Consents', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>` },
                { value: declined, label: 'Declined Consents', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>` },
                { value: voided, label: 'Voided Consents', icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>` }
            ];
        }

        container.innerHTML = stats.map((s, idx) => `
            <div class="card stat-card animate-slide-up" style="animation-delay: ${idx * 0.08}s; opacity: 0; animation-fill-mode: forwards;">
                <div class="stat-info">
                    <span class="stat-value" id="stat-val-${idx}">${s.value}</span>
                    <span class="stat-label">${s.label}</span>
                </div>
                <div class="stat-icon">
                    ${s.icon}
                </div>
            </div>
        `).join('');

        // Apply count up animation
        stats.forEach((s, idx) => {
            const el = document.getElementById(`stat-val-${idx}`);
            if (el) {
                this.animateValue(el, 0, s.value, 800);
            }
        });
    },

    async loadMainPanel(user) {
        const panel = document.getElementById('main-panel');
        if (!panel) return;

        if (user.role === 'ROLE_SUPER_ADMIN') {
            // Super Admin Table: Cross-Clinic Rollup
            const summary = await SlashDR.apiFetch('/api/clinic-licenses/summary');
            
            let rows = '';
            if (summary.byClinic && summary.byClinic.length > 0) {
                rows = summary.byClinic.map(c => `
                    <tr>
                        <td style="font-weight: 600; color: var(--text-primary);">${c.clinicId.toUpperCase()}</td>
                        <td>${c.totalLicenses}</td>
                        <td><span class="badge badge-${c.worstStatus.toLowerCase().replace(/\s+/g, '-')}">${c.worstStatus}</span></td>
                        <td>${c.nextExpiry ? new Date(c.nextExpiry).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                `).join('');
            } else {
                rows = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No clinic records found.</td></tr>`;
            }

            panel.innerHTML = `
                <div class="card flex flex-col gap-4">
                    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">Cross-Clinic Compliance Rollup</h3>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Clinic ID</th>
                                    <th>Total Licenses</th>
                                    <th>Worst Status</th>
                                    <th>Next Expiry</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (user.role === 'ROLE_CLINIC_ADMIN' || user.role === 'ROLE_DOCTOR') {
            // Clinic Admin or Doctor: Licenses register list
            const licenses = await SlashDR.apiFetch('/api/clinic-licenses');
            const activeLicenses = licenses.filter(l => l.status !== 'Superseded');

            let rows = '';
            if (activeLicenses.length > 0) {
                rows = activeLicenses.map(l => `
                    <tr>
                        <td style="font-weight: 600; color: var(--text-primary);">${l.licenseType}</td>
                        <td style="font-family: monospace;">${l.licenseNumber}</td>
                        <td>${new Date(l.expiryDate).toLocaleDateString()}</td>
                        <td><span class="badge badge-${l.status.toLowerCase().replace(/\s+/g, '-')}">${l.status}</span></td>
                        ${user.role === 'ROLE_CLINIC_ADMIN' ? `
                            <td style="text-align: right;">
                                <a href="/clinic-licenses.html?renew=${l.id}" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">Renew</a>
                            </td>
                        ` : ''}
                    </tr>
                `).join('');
            } else {
                rows = `<tr><td colspan="${user.role === 'ROLE_CLINIC_ADMIN' ? 5 : 4}" style="text-align: center; color: var(--text-muted);">No active licenses recorded.</td></tr>`;
            }

            panel.innerHTML = `
                <div class="card flex flex-col gap-4">
                    <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">Clinic Licenses Register</h3>
                        ${user.role === 'ROLE_CLINIC_ADMIN' ? `
                            <a href="/clinic-licenses.html?add=true" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Add License
                            </a>
                        ` : ''}
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>License Type</th>
                                    <th>License Number</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                    ${user.role === 'ROLE_CLINIC_ADMIN' ? `<th style="text-align: right;">Actions</th>` : ''}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else {
            // Staff: Simplified panel with Capture Consent shortcut and recent consents list
            const consents = await SlashDR.apiFetch('/api/consent-records');
            const recentConsents = consents.slice(0, 5); // top 5 recent

            let rows = '';
            if (recentConsents.length > 0) {
                rows = recentConsents.map(c => `
                    <tr>
                        <td style="font-weight: 600; color: var(--text-primary);">${c.patientId}</td>
                        <td>${c.visitId}</td>
                        <td>${c.capturedBy}</td>
                        <td>${c.capturedAt ? new Date(c.capturedAt).toLocaleString() : 'N/A'}</td>
                        <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                    </tr>
                `).join('');
            } else {
                rows = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No consent records captured yet.</td></tr>`;
            }

            panel.innerHTML = `
                <div class="card card-glass flex items-center justify-between" style="padding: 2rem;">
                    <div class="flex flex-col gap-1">
                        <h3 style="font-size: 1.125rem; font-weight: 700; color: var(--text-primary);">Capture New Patient Consent</h3>
                        <p style="font-size: 0.8125rem; color: var(--text-secondary);">Start digitizing consent for a procedure or patient visit.</p>
                    </div>
                    <a href="/consent-records.html?capture=true" class="btn btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Start Capture</span>
                    </a>
                </div>

                <div class="card flex flex-col gap-4">
                    <div class="flex items-center justify-between" style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">Recent Captured Consents</h3>
                        <a href="/consent-records.html" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8125rem;">View Register</a>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Patient ID</th>
                                    <th>Visit ID</th>
                                    <th>Captured By</th>
                                    <th>Captured At</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    },

    async loadNotifications(user) {
        const feed = document.getElementById('notifications-feed');
        const badge = document.getElementById('alert-count');
        if (!feed) return;

        // Staff does not see license notifications
        if (user.role === 'ROLE_STAFF') {
            const feedCard = feed.closest('.card');
            if (feedCard) feedCard.style.display = 'none';
            return;
        }

        const notifications = await SlashDR.apiFetch('/api/clinic-licenses/notifications');
        
        // Sort notifications: newest first
        notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (badge) {
            badge.textContent = notifications.length;
            if (notifications.length > 0) {
                badge.className = 'badge badge-danger';
            } else {
                badge.className = 'badge badge-muted';
            }
        }

        if (notifications.length > 0) {
            feed.innerHTML = notifications.map(n => {
                // Parse threshold from EXPIRY_NOTIFICATION_X_DAYS
                const threshold = n.actionType.replace('EXPIRY_NOTIFICATION_', '').replace('_DAYS', '');
                let colorClass = 'status-warning-bg';
                let textColor = 'status-warning-text';
                
                if (threshold === '0' || threshold.includes('EXPIRED')) {
                    colorClass = 'badge-danger';
                    textColor = 'status-danger-text';
                } else if (threshold === '7') {
                    colorClass = 'badge-danger';
                    textColor = 'status-danger-text';
                }

                const desc = threshold === '0' ? 'License has expired!' : `License expires in ${threshold} days.`;
                const dateLabel = new Date(n.timestamp).toLocaleString();

                return `
                    <div class="timeline-item">
                        <div class="timeline-icon ${colorClass}" style="width: 10px; height: 10px; border-radius: 50%; margin-top: 5px;"></div>
                        <div class="timeline-content">
                            <span class="timeline-title" style="font-weight: 600;">License Expiry Alert</span>
                            <span class="timeline-desc" style="color: var(--text-secondary);">${desc} (Entity #${n.entityId})</span>
                            <span class="timeline-time">${dateLabel}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            feed.innerHTML = `
                <div class="empty-state">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>All clinic licenses are valid.</span>
                </div>
            `;
        }
    },

    async triggerExpiryCheck(user) {
        const btn = document.getElementById('btn-trigger-expiry');
        if (!btn) return;

        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `
            <svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            <span>Checking...</span>
        `;

        try {
            const result = await SlashDR.apiFetch('/api/clinic-licenses/check-expiry-notifications', {
                method: 'POST'
            });

            // Reload stats and notifications
            await this.loadStats(user);
            await this.loadMainPanel(user);
            await this.loadNotifications(user);

            // Display floating toast/alert
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
                    <span>Simulation complete. Notifications fired: ${result.notificationsFired}</span>
                `;
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => toast.remove(), 350);
                }, 4000);
            }
        } catch (error) {
            console.error('Trigger check failed:', error);
            alert('Failed to simulate expiry check: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    },

    animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }
};
