/**
 * js/auth-helper.js
 * Shared Authentication and Navigation Header logic for HustMemo.
 * Automatically handles page security by checking authorization status,
 * managing the login/registration forms, and maintaining user session states.
 */

(function() {
    // DOM Elements for Auth Overlay
    const authOverlay = document.getElementById('auth-overlay');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const registerErrorMsg = document.getElementById('register-error-msg');

    // DOM Elements for Navigation Header Profile
    const headerUserProfile = document.getElementById('header-user-profile');
    const headerUsername = document.getElementById('header-username');
    const headerAvatarLetter = document.getElementById('header-avatar-letter');
    const logoutBtn = document.getElementById('logout-btn');

    // Shared global user reference
    window.currentUser = null;

    /**
     * Check if user is currently logged in.
     * Shows the Login Overlay if not authorized, or triggers page loading.
     */
    async function checkAuth() {
        if (!authOverlay) return; // Guard for pages without Auth check
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();
            
            if (data.loggedIn) {
                window.currentUser = data.user;
                authOverlay.style.display = 'none';
                if (headerUserProfile) headerUserProfile.style.display = 'flex';
                if (headerUsername) headerUsername.textContent = window.currentUser.fullname;
                if (headerAvatarLetter) headerAvatarLetter.textContent = window.currentUser.fullname.charAt(0).toUpperCase();
                
                // Trigger page-specific success callback
                if (typeof window.onAuthSuccess === 'function') {
                    window.onAuthSuccess(window.currentUser);
                }
            } else {
                authOverlay.style.display = 'flex';
                if (headerUserProfile) headerUserProfile.style.display = 'none';
            }
        } catch (err) {
            console.error("Lỗi kiểm tra đăng nhập:", err);
        }
    }

    // Toggle Login/Register Tabs
    if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabRegisterBtn.classList.remove('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        });

        tabRegisterBtn.addEventListener('click', () => {
            tabRegisterBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
            if (registerErrorMsg) registerErrorMsg.style.display = 'none';
        });
    }

    // Login Form Submit Handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (loginErrorMsg) loginErrorMsg.style.display = 'none';
            
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    window.currentUser = data.user;
                    authOverlay.style.display = 'none';
                    if (headerUserProfile) headerUserProfile.style.display = 'flex';
                    if (headerUsername) headerUsername.textContent = window.currentUser.fullname;
                    if (headerAvatarLetter) headerAvatarLetter.textContent = window.currentUser.fullname.charAt(0).toUpperCase();
                    loginForm.reset();
                    
                    if (typeof window.onAuthSuccess === 'function') {
                        window.onAuthSuccess(window.currentUser);
                    }
                } else {
                    if (loginErrorMsg) {
                        loginErrorMsg.textContent = data.error || 'Đăng nhập không thành công.';
                        loginErrorMsg.style.display = 'block';
                    }
                }
            } catch (err) {
                if (loginErrorMsg) {
                    loginErrorMsg.textContent = 'Kết nối server thất bại.';
                    loginErrorMsg.style.display = 'block';
                }
            }
        });
    }

    // Registration Form Submit Handler
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (registerErrorMsg) registerErrorMsg.style.display = 'none';
            
            const username = document.getElementById('register-username').value.trim();
            const fullname = document.getElementById('register-fullname').value.trim();
            const email = document.getElementById('register-email').value.trim();
            const password = document.getElementById('register-password').value;
            
            if (password.length < 6) {
                if (registerErrorMsg) {
                    registerErrorMsg.textContent = 'Mật khẩu phải dài tối thiểu 6 ký tự.';
                    registerErrorMsg.style.display = 'block';
                }
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, fullname, email })
                });
                const data = await response.json();
                
                if (response.ok && data.success) {
                    window.currentUser = data.user;
                    authOverlay.style.display = 'none';
                    if (headerUserProfile) headerUserProfile.style.display = 'flex';
                    if (headerUsername) headerUsername.textContent = window.currentUser.fullname;
                    if (headerAvatarLetter) headerAvatarLetter.textContent = window.currentUser.fullname.charAt(0).toUpperCase();
                    registerForm.reset();
                    
                    if (typeof window.onAuthSuccess === 'function') {
                        window.onAuthSuccess(window.currentUser);
                    }
                } else {
                    if (registerErrorMsg) {
                        registerErrorMsg.textContent = data.error || 'Đăng ký không thành công.';
                        registerErrorMsg.style.display = 'block';
                    }
                }
            } catch (err) {
                if (registerErrorMsg) {
                    registerErrorMsg.textContent = 'Kết nối server thất bại.';
                    registerErrorMsg.style.display = 'block';
                }
            }
        });
    }

    // Logout Click Handler
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
            try {
                const response = await fetch('/api/auth/logout', { method: 'POST' });
                if (response.ok) {
                    window.currentUser = null;
                    authOverlay.style.display = 'flex';
                    if (headerUserProfile) headerUserProfile.style.display = 'none';
                    if (loginForm) loginForm.reset();
                    if (registerForm) registerForm.reset();
                }
            } catch (err) {
                alert("Lỗi đăng xuất.");
            }
        });
    }

    /**
     * Intercepts API responses. If status is 418 (Session expired/Unauthorized),
     * forces the Login overlay to display.
     * @param {Response} response
     * @returns {boolean} True if unauthorized and redirected, false otherwise.
     */
    window.handleApiError = function(response) {
        if (response.status === 418) {
            authOverlay.style.display = 'flex';
            if (headerUserProfile) headerUserProfile.style.display = 'none';
            return true;
        }
        return false;
    };

    // Auto-trigger auth check as soon as DOM is ready
    document.addEventListener('DOMContentLoaded', checkAuth);
})();
