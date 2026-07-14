// System Audit Logs Page Controller

let allLogs = [];
let selectedLog = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!SlashDR.isAuthenticated()) return;

    const user = SlashDR.getCurrentUser();
    
    // Boundary check: Only admins can view audit logs
    if (user.role !== 'ROLE_CLINIC_ADMIN' && user.role !== 'ROLE_SUPER_ADMIN') {
        window.location.href = '/dashboard.html';
        return;
    }

    AuditLogsPage.init();
});

const AuditLogsPage = {
    async init() {
        // Bind Filter Events
        document.getElementById('search-user').addEventListener('input', () => this.applyFilters());
        document.getElementById('filter-entity-type').addEventListener('change', () => this.applyFilters());
        document.getElementById('filter-action-type').addEventListener('change', () => this.applyFilters());
        
        // Refresh logs button
        document.getElementById('btn-refresh-logs').addEventListener('click', () => this.loadLogs());

        // Bind Close actions
        const closeSelectors = ['btn-close-details', 'btn-close-details-footer', 'logs-backdrop'];
        closeSelectors.forEach(id => {
            document.getElementById(id).addEventListener('click', () => this.closeDrawer());
        });

        // Load logs
        await this.loadLogs();

        // Reveal Page content
        document.getElementById('page-content').style.display = 'block';
    },

    async loadLogs() {
        const btnRefresh = document.getElementById('btn-refresh-logs');
        const originalText = btnRefresh.innerHTML;
        btnRefresh.disabled = true;
        btnRefresh.innerHTML = `
            <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><polyline points="4.93 4.93 7.76 7.76"/><polyline points="16.24 16.24 19.07 19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            <span>Refreshing...</span>
        `;

        try {
            allLogs = await SlashDR.apiFetch('/api/audit-log');
            // Sort by log ID descending (newest first)
            allLogs.sort((a, b) => b.id - a.id);
            
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            const tbody = document.getElementById('logs-tbody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; color: var(--status-danger-text);">
                            Error loading system audit logs: ${error.message}
                        </td>
                    </tr>
                `;
            }
        } finally {
            btnRefresh.disabled = false;
            btnRefresh.innerHTML = originalText;
        }
    },

    applyFilters() {
        const searchVal = document.getElementById('search-user').value.toLowerCase().trim();
        const entityVal = document.getElementById('filter-entity-type').value;
        const actionVal = document.getElementById('filter-action-type').value;
        const container = document.getElementById('logs-table-container');
        const emptyState = document.getElementById('logs-empty-state');
        const tbody = document.getElementById('logs-tbody');

        const filtered = allLogs.filter(l => {
            const matchesSearch = l.userId.toLowerCase().includes(searchVal);
            const matchesEntity = entityVal === '' || l.entityType === entityVal;
            
            // Allow actions prefix/exact matches
            const matchesAction = actionVal === '' || l.actionType.toUpperCase().includes(actionVal.toUpperCase());
            
            return matchesSearch && matchesEntity && matchesAction;
        });

        if (filtered.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        emptyState.style.display = 'none';
        container.style.display = 'block';

        tbody.innerHTML = filtered.map(l => {
            const timestamp = l.timestamp ? new Date(l.timestamp).toLocaleString() : 'N/A';
            const actionClass = this.getActionBadgeClass(l.actionType);
            const entityLabel = l.entityType.replace(/_/g, ' ');

            return `
                <tr onclick="AuditLogsPage.openDrawer(${l.id})" style="cursor: pointer;">
                    <td style="font-weight: 600; color: var(--text-muted);">#${l.id}</td>
                    <td>${timestamp}</td>
                    <td style="font-weight: 700; color: var(--text-primary);">${l.userId}</td>
                    <td style="font-size: 0.75rem; color: var(--text-muted);">${l.userRole}</td>
                    <td><span class="badge ${actionClass}" style="text-transform: uppercase;">${l.actionType}</span></td>
                    <td style="text-transform: capitalize;">${entityLabel}</td>
                    <td style="font-weight: 600; color: var(--primary);">ID ${l.entityId}</td>
                    <td style="text-align: right;">
                        <button class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getActionBadgeClass(action) {
        action = action.toUpperCase();
        if (action.includes('CREATED') || action.includes('CAPTURED')) return 'badge-valid';
        if (action.includes('DECLINED') || action.includes('VOID') || action.includes('EXPIRED')) return 'badge-danger';
        if (action.includes('RENEWED') || action.includes('UPDATED')) return 'badge-warning'; // amber/orange
        return 'badge-muted'; // fallback (LOGIN, etc.)
    },

    openDrawer(id) {
        const log = allLogs.find(l => l.id === id);
        if (!log) return;

        selectedLog = log;
        const drawer = document.getElementById('log-details-drawer');
        const backdrop = document.getElementById('logs-backdrop');

        // Populate fields
        document.getElementById('detail-log-id').textContent = log.id;
        document.getElementById('detail-log-userid').textContent = log.userId;
        document.getElementById('detail-log-userrole').textContent = log.userRole;
        document.getElementById('detail-log-time').textContent = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';
        document.getElementById('detail-log-entitytype').textContent = log.entityType.toUpperCase().replace(/_/g, ' ');
        document.getElementById('detail-log-entityid').textContent = `ID ${log.entityId}`;

        // Action badge
        const badgeClass = this.getActionBadgeClass(log.actionType);
        document.getElementById('detail-log-action').innerHTML = `
            <span class="badge ${badgeClass}" style="text-transform: uppercase;">${log.actionType}</span>
        `;

        // Format metadata JSON with syntax coloring
        const jsonBox = document.getElementById('detail-log-json');
        jsonBox.innerHTML = this.formatJSON(log.metaJson);

        drawer.classList.add('open');
        backdrop.classList.add('open');
    },

    closeDrawer() {
        document.getElementById('log-details-drawer').classList.remove('open');
        document.getElementById('logs-backdrop').classList.remove('open');
        selectedLog = null;
    },

    // Custom REGEX based syntax highlighter for JSON blocks
    formatJSON(jsonStr) {
        if (!jsonStr) {
            return '<span class="meta-val-string">"No metadata recorded"</span>';
        }

        try {
            const parsed = JSON.parse(jsonStr);
            const pretty = JSON.stringify(parsed, null, 2);
            
            // Escape HTML entities to avoid script execution / tag render
            const escaped = pretty
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');

            // Match JSON elements for dynamic class tagging
            return escaped.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
                let cls = 'meta-val-num';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'meta-key';
                    } else {
                        cls = 'meta-val-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'meta-val-string';
                } else if (/null/.test(match)) {
                    cls = 'meta-val-num';
                }
                return `<span class="${cls}">${match}</span>`;
            });
        } catch (e) {
            // Return raw string if parse fails
            return `<span class="meta-val-string">"${jsonStr}"</span>`;
        }
    }
};
