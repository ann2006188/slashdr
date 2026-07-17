// User Management Page JavaScript Controller
const UserManagementPage = {
    allUsers: [],
    clinics: {
        'clinic-001': 'Sunrise Medical Centre',
        'clinic-002': 'Horizon Healthcare',
        'clinic-003': 'Apex Medical Group'
    },

    async init() {
        const user = SlashDR.getCurrentUser();
        if (user.role !== 'ROLE_SUPER_ADMIN') {
            window.location.href = '/dashboard.html';
            return;
        }

        // Render standard shell elements
        SlashDR.renderLayout();
        SlashDR.initCardGlows();

        // Bind events
        this.bindEvents();

        // Load users data
        await this.loadUsers();

        // Show page content
        document.getElementById('page-content').style.display = 'block';
    },

    bindEvents() {
        // Trigger drawers
        document.getElementById('btn-add-user-trigger').addEventListener('click', () => this.openAddDrawer());
        
        // Add form role selector conditional visibility
        document.getElementById('add-role').addEventListener('change', (e) => {
            const block = document.getElementById('add-clinic-block');
            block.style.display = e.target.value === 'ROLE_SUPER_ADMIN' ? 'none' : 'block';
        });

        // Edit form role selector conditional visibility
        document.getElementById('edit-role').addEventListener('change', (e) => {
            const block = document.getElementById('edit-clinic-block');
            block.style.display = e.target.value === 'ROLE_SUPER_ADMIN' ? 'none' : 'block';
        });

        // Close triggers
        const closeSelectors = [
            'btn-close-add-drawer', 'btn-cancel-add',
            'btn-close-edit-drawer', 'btn-cancel-edit',
            'btn-close-reset-modal', 'btn-cancel-reset-modal',
            'user-backdrop', 'reset-modal-backdrop'
        ];
        closeSelectors.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', (e) => {
                    if (e.target === el || el.tagName === 'BUTTON') {
                        this.closeAllDrawers();
                    }
                });
            }
        });

        // Submissions
        document.getElementById('add-user-form').addEventListener('submit', (e) => this.handleAddSubmit(e));
        document.getElementById('edit-user-form').addEventListener('submit', (e) => this.handleEditSubmit(e));
        document.getElementById('reset-password-form').addEventListener('submit', (e) => this.handleResetSubmit(e));
    },

    async loadUsers() {
        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading users directory...</td></tr>`;

        try {
            this.allUsers = await SlashDR.apiFetch('/api/users');
            this.renderUsers();
        } catch (error) {
            console.error('Failed to load users:', error);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--status-danger-text);">Error loading user list: ${error.message}</td></tr>`;
        }
    },

    renderUsers() {
        const tbody = document.getElementById('users-tbody');
        if (this.allUsers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No users found in database.</td></tr>`;
            return;
        }

        const roleLabels = {
            'ROLE_STAFF': 'Staff',
            'ROLE_DOCTOR': 'Doctor',
            'ROLE_CLINIC_ADMIN': 'Clinic Admin',
            'ROLE_SUPER_ADMIN': 'Super Admin'
        };

        tbody.innerHTML = this.allUsers.map(user => {
            const clinicName = user.clinicId ? (this.clinics[user.clinicId.toLowerCase()] || user.clinicId.toUpperCase()) : 'All Clinics (Global)';
            const roleLabel = roleLabels[user.role] || user.role;
            const statusBadge = user.active 
                ? `<span class="badge" style="background-color: var(--status-success-bg); color: var(--status-success-text); border: 1px solid var(--status-success-border);">Active</span>`
                : `<span class="badge" style="background-color: var(--status-danger-bg); color: var(--status-danger-text); border: 1px solid var(--status-danger-border);">Disabled</span>`;

            return `
                <tr class="animate-fade-in">
                    <td>
                        <div style="font-weight: 700; color: var(--text-primary);">${user.fullName}</div>
                    </td>
                    <td style="font-family: monospace;">${user.username}</td>
                    <td><span class="badge badge-muted">${roleLabel}</span></td>
                    <td style="font-weight: 500;">${clinicName}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="flex gap-2">
                            <button class="btn btn-secondary" onclick="UserManagementPage.openEditDrawer(${user.id})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                                Edit
                            </button>
                            <button class="btn btn-secondary" onclick="UserManagementPage.toggleActive(${user.id})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                                ${user.active ? 'Disable' : 'Enable'}
                            </button>
                            <button class="btn btn-primary" onclick="UserManagementPage.openResetModal(${user.id})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                                Reset Password
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    openAddDrawer() {
        document.getElementById('add-user-form').reset();
        document.getElementById('add-clinic-block').style.display = 'block';

        document.getElementById('add-user-drawer').classList.add('open');
        document.getElementById('user-backdrop').classList.add('open');
    },

    openEditDrawer(id) {
        const user = this.allUsers.find(u => u.id === id);
        if (!user) return;

        document.getElementById('edit-user-id').value = user.id;
        document.getElementById('edit-full-name').value = user.fullName;
        document.getElementById('edit-role').value = user.role;
        document.getElementById('edit-clinic-id').value = user.clinicId || 'clinic-001';

        const block = document.getElementById('edit-clinic-block');
        block.style.display = user.role === 'ROLE_SUPER_ADMIN' ? 'none' : 'block';

        document.getElementById('edit-user-drawer').classList.add('open');
        document.getElementById('user-backdrop').classList.add('open');
    },

    openResetModal(id) {
        document.getElementById('reset-user-id').value = id;
        document.getElementById('reset-new-password').value = '';

        document.getElementById('reset-modal-backdrop').classList.add('open');
    },

    closeAllDrawers() {
        document.getElementById('add-user-drawer').classList.remove('open');
        document.getElementById('edit-user-drawer').classList.remove('open');
        document.getElementById('user-backdrop').classList.remove('open');
        document.getElementById('reset-modal-backdrop').classList.remove('open');
    },

    async handleAddSubmit(e) {
        e.preventDefault();
        const fullName = document.getElementById('add-full-name').value;
        const username = document.getElementById('add-username').value.trim();
        const password = document.getElementById('add-password').value;
        const role = document.getElementById('add-role').value;
        const clinicId = role === 'ROLE_SUPER_ADMIN' ? null : document.getElementById('add-clinic-id').value;

        try {
            await SlashDR.apiFetch('/api/users', {
                method: 'POST',
                body: JSON.stringify({ fullName, username, password, role, clinicId, active: true })
            });
            this.closeAllDrawers();
            await this.loadUsers();
        } catch (error) {
            alert('Failed to create user: ' + error.message);
        }
    },

    async handleEditSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('edit-user-id').value;
        const fullName = document.getElementById('edit-full-name').value;
        const role = document.getElementById('edit-role').value;
        const clinicId = role === 'ROLE_SUPER_ADMIN' ? null : document.getElementById('edit-clinic-id').value;

        // Keep existing active state
        const user = this.allUsers.find(u => u.id == id);
        const active = user ? user.active : true;

        try {
            await SlashDR.apiFetch(`/api/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ fullName, role, clinicId, active })
            });
            this.closeAllDrawers();
            await this.loadUsers();
        } catch (error) {
            alert('Failed to edit user: ' + error.message);
        }
    },

    async handleResetSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('reset-user-id').value;
        const password = document.getElementById('reset-new-password').value;

        try {
            const res = await SlashDR.apiFetch(`/api/users/${id}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ password })
            });
            alert(res.message || 'Password reset successfully');
            this.closeAllDrawers();
        } catch (error) {
            alert('Failed to reset password: ' + error.message);
        }
    },

    async toggleActive(id) {
        const user = this.allUsers.find(u => u.id === id);
        if (!user) return;

        try {
            await SlashDR.apiFetch(`/api/users/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    fullName: user.fullName,
                    role: user.role,
                    clinicId: user.clinicId,
                    active: !user.active
                })
            });
            await this.loadUsers();
        } catch (error) {
            alert('Failed to toggle status: ' + error.message);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UserManagementPage.init();
});
