// Core App Logic for SlashDR Clinic Management System

document.addEventListener('DOMContentLoaded', () => {
    // Prevent rendering layout if we are on the login page
    const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname === '/login';
    
    // Force dark theme always
    document.documentElement.setAttribute('data-theme', 'dark');
    
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
    
    // Initialize interactive card glows
    SlashDR.initCardGlows();

    // Initialize viewport scroll animations
    SlashDR.initScrollAnimations();
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
                const contentType = response.headers.get('content-type');
                if (contentType && (contentType.includes('application/pdf') || contentType.includes('image/') || contentType.includes('text/csv'))) {
                    return response.blob();
                }
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                }
                return response.text();
            });
    },

    // Helper to load secure images (e.g. signatures) programmatically using auth headers
    async loadSecureImage(imgElementId, imageUrl) {
        const img = document.getElementById(imgElementId);
        if (!img) return;
        
        if (!imageUrl) {
            img.style.display = 'none';
            return;
        }
        
        try {
            const blob = await this.apiFetch(imageUrl);
            const objectUrl = URL.createObjectURL(blob);
            img.src = objectUrl;
            img.style.display = 'block';
        } catch (error) {
            console.error('Failed to load secure image:', error);
            img.src = '';
            img.style.display = 'none';
        }
    },

    // Premium cursor-tracking glow initialization helper with layout-thrashing prevention (60fps)
    initCardGlows() {
        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.card');
            if (!card) return;
            
            // Cache card bounding rect on first hover to prevent layout thrashing
            if (!card._rect) {
                card._rect = card.getBoundingClientRect();
                
                // Clear cache when mouse leaves
                card.addEventListener('mouseleave', () => {
                    card._rect = null;
                }, { once: true });
            }
            
            const x = e.clientX - card._rect.left;
            const y = e.clientY - card._rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });

        // Clear rect caches on container scroll to ensure coordinate accuracy
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.addEventListener('scroll', () => {
                document.querySelectorAll('.card').forEach(c => {
                    c._rect = null;
                });
            }, { passive: true });
        }
    },

    // Premium viewport scroll-reveal animations using IntersectionObserver
    initScrollAnimations() {
        const mainContent = document.querySelector('.main-content');
        
        if (!window.IntersectionObserver) {
            document.querySelectorAll('.main-content .card, .main-content .table-container, .main-content .nav-hub-container, .main-content .dashboard-grid').forEach(el => {
                el.classList.add('in-view');
            });
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        }, {
            root: mainContent,
            threshold: 0.01,
            rootMargin: '0px 0px 50px 0px' // trigger slightly before it enters the viewport scroll box
        });

        const targets = document.querySelectorAll('.main-content .card:not(.scroll-reveal), .main-content .table-container:not(.scroll-reveal), .main-content .nav-hub-container:not(.scroll-reveal), .main-content .dashboard-grid:not(.scroll-reveal)');
        targets.forEach(el => {
            el.classList.add('scroll-reveal');
            observer.observe(el);
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
                { path: '/dashboard.html', name: 'Dashboard', icon: this.icons.dashboard, roles: ['ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/consent-templates.html', name: 'Consent Templates', icon: this.icons.templates, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/consent-records.html', name: 'Consent Records', icon: this.icons.records, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/clinic-licenses.html', name: 'Clinic Licenses', icon: this.icons.licenses, roles: ['ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/document-upload.html', name: 'Document Center', icon: this.icons.documents, roles: ['ROLE_STAFF', 'ROLE_DOCTOR', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] },
                { path: '/audit-logs.html', name: 'Audit Logs', icon: this.icons.audit, roles: ['ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN'] }
            ];

            // Filter menu based on user role
            const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

            let sidebarHtml = `
                <a href="/dashboard.html" class="sidebar-brand" style="text-decoration: none; color: inherit;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>SlashDR</span>
                </a>
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

            header.className = 'flex items-center justify-between';
            header.style.marginBottom = '2rem';
            header.innerHTML = `
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em;">${pageTitle}</h1>
                    <span style="font-size: 0.8125rem; color: var(--text-muted);">${user.clinicId ? 'Clinic: ' + user.clinicId.toUpperCase() : 'All Clinics (Super Admin)'}</span>
                </div>
            `;
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
