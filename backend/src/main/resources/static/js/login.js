// Login Page JavaScript logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const eyeIcon = document.getElementById('eye-icon');
    const loginAlert = document.getElementById('login-alert');
    const alertMessage = document.getElementById('alert-message');
    const btnSubmit = document.getElementById('btn-submit');
    const demoUsers = document.querySelectorAll('.demo-user');

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update eye icon SVG
        if (type === 'text') {
            eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
        } else {
            eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
        }
    });

    // Quick select demo accounts
    demoUsers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const username = btn.getAttribute('data-user');
            const password = btn.getAttribute('data-pass');
            
            usernameInput.value = username;
            passwordInput.value = password;
            
            // Highlight submission effect
            btnSubmit.focus();
        });
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous alert states
        loginAlert.style.display = 'none';
        
        // Show loading state
        const originalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
            <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>
            <span>Verifying...</span>
        `;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        try {
            const success = await SlashDR.login(username, password);
            if (success) {
                // Successful redirect
                window.location.href = '/dashboard.html';
            }
        } catch (error) {
            // Restore button state
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalText;
            
            // Show alert
            alertMessage.textContent = error.message || 'Invalid username or password';
            loginAlert.style.display = 'flex';
            loginAlert.classList.add('animate-fade-in');
            
            // Clear password
            passwordInput.value = '';
            passwordInput.focus();
        }
    });
});
