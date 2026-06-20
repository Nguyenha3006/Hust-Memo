// DOM Elements
const authOverlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const loginErrorMsg = document.getElementById('login-error-msg');
const registerErrorMsg = document.getElementById('register-error-msg');

const headerUserProfile = document.getElementById('header-user-profile');
const headerUsername = document.getElementById('header-username');
const headerAvatarLetter = document.getElementById('header-avatar-letter');
const logoutBtn = document.getElementById('logout-btn');

const profileBigAvatar = document.getElementById('profile-big-avatar');
const profileFullnameDisplay = document.getElementById('profile-fullname-display');
const profileUsernameDisplay = document.getElementById('profile-username-display');
const profileEmailDisplay = document.getElementById('profile-email-display');
const profileDecksCount = document.getElementById('profile-decks-count');
const profileCardsCount = document.getElementById('profile-cards-count');

const settingsAlertMsg = document.getElementById('settings-alert-msg');
const profileSettingsForm = document.getElementById('profile-settings-form');
const profileUsernameInput = document.getElementById('profile-username-input');
const profileFullnameInput = document.getElementById('profile-fullname-input');
const profileEmailInput = document.getElementById('profile-email-input');
const profileOldPasswordInput = document.getElementById('profile-old-password-input');
const profileNewPasswordInput = document.getElementById('profile-new-password-input');
const profileConfirmPasswordInput = document.getElementById('profile-confirm-password-input');

const profileLogoutBtn = document.getElementById('profile-logout-btn');

let currentUser = null;

// ==========================================
// AUTHENTICATION FLOW
// ==========================================

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.loggedIn) {
            currentUser = data.user;
            authOverlay.style.display = 'none';
            headerUserProfile.style.display = 'flex';
            headerUsername.textContent = currentUser.fullname;
            headerAvatarLetter.textContent = currentUser.fullname.charAt(0).toUpperCase();
            
            // Initialize Profile page details
            initProfilePage();
        } else {
            authOverlay.style.display = 'flex';
            headerUserProfile.style.display = 'none';
        }
    } catch (err) {
        console.error("Lỗi kiểm tra đăng nhập:", err);
    }
}

// Tab Switching
tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    loginErrorMsg.style.display = 'none';
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
    registerErrorMsg.style.display = 'none';
});

// Login Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.style.display = 'none';
    
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
            currentUser = data.user;
            authOverlay.style.display = 'none';
            headerUserProfile.style.display = 'flex';
            headerUsername.textContent = currentUser.fullname;
            headerAvatarLetter.textContent = currentUser.fullname.charAt(0).toUpperCase();
            loginForm.reset();
            
            initProfilePage();
        } else {
            loginErrorMsg.textContent = data.error || 'Đăng nhập không thành công.';
            loginErrorMsg.style.display = 'block';
        }
    } catch (err) {
        loginErrorMsg.textContent = 'Kết nối server thất bại.';
        loginErrorMsg.style.display = 'block';
    }
});

// Register Submit
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerErrorMsg.style.display = 'none';
    
    const username = document.getElementById('register-username').value.trim();
    const fullname = document.getElementById('register-fullname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    
    if (password.length < 6) {
        registerErrorMsg.textContent = 'Mật khẩu phải dài tối thiểu 6 ký tự.';
        registerErrorMsg.style.display = 'block';
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
            currentUser = data.user;
            authOverlay.style.display = 'none';
            headerUserProfile.style.display = 'flex';
            headerUsername.textContent = currentUser.fullname;
            headerAvatarLetter.textContent = currentUser.fullname.charAt(0).toUpperCase();
            registerForm.reset();
            
            initProfilePage();
        } else {
            registerErrorMsg.textContent = data.error || 'Đăng ký không thành công.';
            registerErrorMsg.style.display = 'block';
        }
    } catch (err) {
        registerErrorMsg.textContent = 'Kết nối server thất bại.';
        registerErrorMsg.style.display = 'block';
    }
});

// Logout Shared Handlers
async function logoutAction() {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            currentUser = null;
            authOverlay.style.display = 'flex';
            headerUserProfile.style.display = 'none';
            loginForm.reset();
            registerForm.reset();
        }
    } catch (err) {
        alert("Lỗi đăng xuất.");
    }
}

logoutBtn.addEventListener('click', logoutAction);
profileLogoutBtn.addEventListener('click', logoutAction);

function handleApiError(response) {
    if (response.status === 418) {
        authOverlay.style.display = 'flex';
        headerUserProfile.style.display = 'none';
        return true;
    }
    return false;
}

// ==========================================
// PROFILE VIEW INITIALIZATION & ACTIONS
// ==========================================

async function initProfilePage() {
    // 1. Populate details
    profileBigAvatar.textContent = currentUser.fullname.charAt(0).toUpperCase();
    profileFullnameDisplay.textContent = currentUser.fullname;
    profileUsernameDisplay.textContent = `@${currentUser.username}`;
    profileEmailDisplay.textContent = currentUser.email;
    
    profileUsernameInput.value = currentUser.username;
    profileFullnameInput.value = currentUser.fullname;
    profileEmailInput.value = currentUser.email;
    
    profileOldPasswordInput.value = '';
    profileNewPasswordInput.value = '';
    profileConfirmPasswordInput.value = '';
    
    // 2. Fetch Stats
    try {
        const response = await fetch('/api/stats');
        if (handleApiError(response)) return;
        const stats = await response.json();
        
        profileDecksCount.textContent = stats.totalDecks;
        profileCardsCount.textContent = stats.totalCards;
    } catch (err) {
        console.error("Lỗi tải thông tin thống kê hồ sơ:", err);
    }
}

// Handle Form Submission
profileSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();
    
    const fullname = profileFullnameInput.value.trim();
    const email = profileEmailInput.value.trim();
    const oldPassword = profileOldPasswordInput.value;
    const newPassword = profileNewPasswordInput.value;
    const confirmPassword = profileConfirmPasswordInput.value;
    
    // Validations
    if (!fullname || !email) {
        showAlert('Họ tên và email không được để trống.', 'error');
        return;
    }
    
    if (newPassword || oldPassword) {
        if (!oldPassword) {
            showAlert('Bạn cần nhập mật khẩu cũ để đổi mật khẩu mới.', 'error');
            return;
        }
        if (!newPassword) {
            showAlert('Vui lòng nhập mật khẩu mới.', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showAlert('Mật khẩu mới phải dài tối thiểu 6 ký tự.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showAlert('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.', 'error');
            return;
        }
    }
    
    // Call Update Profile API
    try {
        const response = await fetch('/api/auth/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullname,
                email,
                oldPassword: oldPassword || null,
                newPassword: newPassword || null
            })
        });
        if (handleApiError(response)) return;
        
        const data = await response.json();
        if (response.ok && data.success) {
            currentUser = data.user;
            
            // Reload details
            initProfilePage();
            
            // Update global navbar
            headerUsername.textContent = currentUser.fullname;
            headerAvatarLetter.textContent = currentUser.fullname.charAt(0).toUpperCase();
            
            showAlert('Cập nhật thông tin tài khoản thành công!', 'success');
            
            // Auto hide success alert
            setTimeout(hideAlert, 4000);
        } else {
            showAlert(data.error || 'Cập nhật thông tin không thành công.', 'error');
        }
    } catch (err) {
        showAlert('Kết nối server thất bại.', 'error');
    }
});

// Helper Alerts
function showAlert(msg, type) {
    settingsAlertMsg.textContent = msg;
    settingsAlertMsg.className = `settings-alert ${type}`;
    settingsAlertMsg.style.display = 'block';
    
    // Scroll to alert
    settingsAlertMsg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideAlert() {
    settingsAlertMsg.style.display = 'none';
}

// Initial Run
checkAuth();
