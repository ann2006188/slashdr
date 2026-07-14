// Core App Logic for SlashDR Clinic Management System

document.addEventListener('DOMContentLoaded', () => {
    // Prevent rendering layout if we are on the login page
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname === '/login';
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('slashdr_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (isLoginPage) {
        // If logged in already, redirect to dashboard
        if (SlashDR.isAuthenticated()) {
            window.location.href = '/dashboard.html';
        }
        return;
    }

    // Check authentication
    if (!SlashDR.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Render Layout Components
    SlashDR.renderLayout();
});

const SlashDR = {
    // Auth Session Storage Keys
    AUTH_KEY: 'slashdr_auth',
    USER_KEY: 'slashdr_username',

    // Hardcoded user details mapper for POC (conforming to backend SecurityConfig.java)
    getUserDetails(username) {
        const users = {
            'staff1': { role: 'ROLE_STAFF', clinicId: 'clinic-001', name: 'Support Staff', desc: 'OP / Nursing Staff' },
            'doctor1': { role: 'ROLE_DOCTOR', clinicId: 'clinic-001', name: 'Dr. Alex Stone', desc: 'Medical Practitioner' },
            'admin1': { role: 'ROLE_CLINIC_ADMIN', clinicId: 'clinic-001', name: 'Clinic Administrator', desc: 'Compliance Officer' },
            'admin2': { role: 'ROLE_CLINIC_ADMIN', clinicId: 'clinic-002', name: 'Second Clinic Admin', desc: 'Compliance Officer' },
            'superadmin1': { role: 'ROLE_SUPER_ADMIN', clinicId: null, name: 'SlashDR Super Admin', desc: 'Super Administrator' }
        };
        return users[username.toLowerCase()] || { role: 'ROLE_STAFF', clinicId: 'clinic-001', name: username, desc: 'Clinic Staff' };
    },

    // Authentication Checks
    isAuthenticated() {
        return sessionStorage.getItem(this.AUTH_KEY) !== null;
    },

    getAuthHeader() {
        return sessionStorage.getItem(this.AUTH_KEY);
    },

    getUsername() {
        return sessionStorage.getItem(this.USER_KEY) || 'unknown';
    },

    getCurrentUser() {
        return this.getUserDetails(this.getUsername());
    },

    login(username, password) {
        const token = 'Basic ' + btoa(username + ':' + password);
        return fetch('/api/consent-templates', {
            method: 'GET',
            headers: {
                'Authorization': token
            }
        }).then(response => {
            if (response.ok) {
                sessionStorage.setItem(this.AUTH_KEY, token);
                sessionStorage.setItem(this.USER_KEY, username);
                return true;
            }
            throw new Error('Invalid credentials');
        });
    },

    logout() {
        sessionStorage.removeItem(this.AUTH_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        window.location.href = '/login.html';
    },

    // API Wrapper with Auth
    apiFetch(url, options = {}) {
        const headers = options.headers || {};
        headers['Authorization'] = this.getAuthHeader();
        
        // Auto set content-type for JSON requests (except for FormData uploads)
        if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        return fetch(url, { ...options, headers })
            .then(async response => {
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Session expired');
                }
                if (!response.ok) {
                    const errBody = await response.json().catch(() => ({}));
                    throw new Error(errBody.error || errBody.message || `API error ${response.status}`);
                }
                
                // Determine if response is json, text or blob (for files)
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/pdf')) {
                    return response.blob();
                }
                if (contentType && contentType.includes('text/csv')) {
                    return response.blob();
                }
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                }
                return response.text();
            });
    },

    // Render navigation and header
    renderLayout() {
        const user = this.getCurrentUser();
        const sidebar = document.getElementById('sidebar-container');
        const header = document.getElementById('header-container');
        const currentPath = window.location.pathname;

        if (sidebar) {
            let menuItems = [
                { path: '/dashboard.html', name: 'Dashboard', icon: this.icons.dashboard, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/consent-templates.html', name: 'Consent Templates', icon: this.icons.templates, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/consent-records.html', name: 'Consent Records', icon: this.icons.records, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/clinic-licenses.html', name: 'Clinic Licenses', icon: this.icons.licenses, roles: ['ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/document-upload.html', name: 'Document Center', icon: this.icons.documents, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/audit-logs.html', name: 'Audit Logs', icon: this.icons.audit, roles: ['ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] }
            ];

            // Filter menu based on user role
            const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

            let sidebarHtml = `
                <div class="sidebar-brand">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>SlashDR</span>
                </div>
                <nav class="sidebar-menu">
            `;

            allowedItems.forEach(item => {
                const isActive = currentPath.includes(item.path);
                sidebarHtml += `
                    <a href="${item.path}" class="sidebar-link ${isActive ? 'active' : ''}">
                        ${item.icon}
                        <span>${item.name}</span>
                    </a>
                `;
            });

            sidebarHtml += `
                </nav>
                <div class="sidebar-profile">
                    <div class="profile-info">
                        <span class="profile-name" title="${user.name}">${user.name}</span>
                        <span class="profile-role">${user.desc}</span>
                    </div>
                    <button class="btn-logout" onclick="SlashDR.logout()" title="Logout">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    </button>
                </div>
            `;

            sidebar.className = 'sidebar';
            sidebar.innerHTML = sidebarHtml;
        }

        if (header) {
            const pageTitle = document.title.split(' - ')[0];
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const themeIcon = currentTheme === 'light' ? this.icons.moon : this.icons.sun;

            header.className = 'flex items-center justify-between';
            header.style.marginBottom = '2rem';
            header.innerHTML = `
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">${pageTitle}</h1>
                    <span style="font-size: 0.8125rem; color: var(--text-muted);">${user.clinicId ? 'Clinic: ' + user.clinicId.toUpperCase() : 'All Clinics (Super Admin)'}</span>
                </div>
                <div class="flex items-center gap-4">
                    <button id="theme-toggle" class="btn btn-secondary" style="padding: 0.5rem;" title="Toggle Theme">
                        ${themeIcon}
                    </button>
                </div>
            `;

            document.getElementById('theme-toggle').addEventListener('click', () => {
                const html = document.documentElement;
                const nextTheme = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', nextTheme);
                localStorage.setItem('slashdr_theme', nextTheme);
                
                // Swap the button icon dynamically
                const btn = document.getElementById('theme-toggle');
                btn.innerHTML = nextTheme === 'light' ? SlashDR.icons.moon : SlashDR.icons.sun;
            });
        }
    },

    // SVG icons helper
    icons: {
        dashboard: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>`,
        templates: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
        records: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M12 10h.01"/></svg>`,
        licenses: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>`,
        documents: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
        audit: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>`,
        sun: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
        moon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
    }
};
