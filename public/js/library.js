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

const libraryGrid = document.getElementById('library-grid');

const previewModal = document.getElementById('preview-modal');
const closePreviewModalBtn = document.getElementById('close-preview-modal-btn');
const closePreviewBtn = document.getElementById('close-preview-btn');
const clonePreviewDeckBtn = document.getElementById('clone-preview-deck-btn');
const previewDeckName = document.getElementById('preview-deck-name');
const previewDeckDesc = document.getElementById('preview-deck-desc');
const previewCardsScroller = document.getElementById('preview-cards-scroller');

let currentUser = null;
let currentPreviewId = null;

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
            
            // Load library
            loadLibrary();
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
            
            loadLibrary();
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
            
            loadLibrary();
        } else {
            registerErrorMsg.textContent = data.error || 'Đăng ký không thành công.';
            registerErrorMsg.style.display = 'block';
        }
    } catch (err) {
        registerErrorMsg.textContent = 'Kết nối server thất bại.';
        registerErrorMsg.style.display = 'block';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
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
});

function handleApiError(response) {
    if (response.status === 418) {
        authOverlay.style.display = 'flex';
        headerUserProfile.style.display = 'none';
        return true;
    }
    return false;
}

// ==========================================
// LIBRARY RETRIEVAL & CLONING
// ==========================================

async function loadLibrary() {
    try {
        libraryGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách bộ thẻ cộng đồng...
            </div>`;
            
        const response = await fetch('/api/library');
        if (handleApiError(response)) return;
        const decks = await response.json();
        
        libraryGrid.innerHTML = '';
        decks.forEach(deck => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            
            card.innerHTML = `
                <div class="deck-card-body">
                    <div class="deck-title-row">
                        <h3>${escapeHTML(deck.name)}</h3>
                    </div>
                    <p class="deck-desc">${escapeHTML(deck.description)}</p>
                    <div class="deck-meta">
                        <span class="total-badge"><i class="fa-solid fa-layer-group"></i> ${deck.total_cards} thẻ</span>
                        <span class="due-badge no-due"><i class="fa-solid fa-globe"></i> Công cộng</span>
                    </div>
                </div>
                <div class="deck-card-actions">
                    <button class="btn btn-secondary preview-deck-btn" data-id="${deck.id}">
                        <i class="fa-solid fa-eye"></i> Xem thử
                    </button>
                    <button class="btn btn-primary clone-deck-btn" data-id="${deck.id}">
                        <i class="fa-solid fa-download"></i> Tải về
                    </button>
                </div>
            `;
            libraryGrid.appendChild(card);
        });
        
        // Event Listeners
        document.querySelectorAll('.preview-deck-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openPreviewModal(id);
            });
        });
        
        document.querySelectorAll('.clone-deck-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                cloneDeck(id);
            });
        });
    } catch (err) {
        libraryGrid.innerHTML = `<div class="loading-spinner" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Lỗi kết nối server khi tải thư viện.</div>`;
    }
}

async function openPreviewModal(id) {
    currentPreviewId = id;
    try {
        const response = await fetch(`/api/library/${id}`);
        if (handleApiError(response)) return;
        const deck = await response.json();
        
        previewDeckName.textContent = deck.name;
        previewDeckDesc.textContent = deck.description;
        
        previewCardsScroller.innerHTML = '';
        deck.cards.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'preview-card-item';
            cardDiv.innerHTML = `
                <div class="preview-card-face-val">
                    <span class="face-label">Mặt trước</span>
                    <span class="face-content">${escapeHTML(card.front)}</span>
                </div>
                <div class="preview-card-face-val">
                    <span class="face-label">Mặt sau</span>
                    <span class="face-content">${escapeHTML(card.back)}</span>
                </div>
            `;
            previewCardsScroller.appendChild(cardDiv);
        });
        
        previewModal.style.display = 'flex';
    } catch (err) {
        alert("Không thể tải nội dung xem trước.");
    }
}

async function cloneDeck(id) {
    try {
        const response = await fetch(`/api/library/${id}/clone`, { method: 'POST' });
        if (handleApiError(response)) return;
        const data = await response.json();
        
        if (response.ok && data.success) {
            previewModal.style.display = 'none';
            if (confirm("Đã tải bộ thẻ về thư viện cá nhân thành công! Bạn có muốn quay lại trang chủ để học ngay không?")) {
                window.location.href = 'dashboard.html';
            }
        } else {
            alert(data.error || "Lỗi khi tải bộ thẻ.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
}

// Modal closing
closePreviewModalBtn.addEventListener('click', () => previewModal.style.display = 'none');
closePreviewBtn.addEventListener('click', () => previewModal.style.display = 'none');
clonePreviewDeckBtn.addEventListener('click', () => {
    if (currentPreviewId) {
        cloneDeck(currentPreviewId);
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = 'none';
    }
});

// Helper: Escape HTML
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Initial Run
checkAuth();
