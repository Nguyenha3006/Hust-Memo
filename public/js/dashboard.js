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

const welcomeTitle = document.getElementById('welcome-title');
const welcomeSubtitle = document.getElementById('welcome-subtitle');
const bannerActionArea = document.getElementById('banner-action-area');

const statDecksCount = document.getElementById('stat-decks-count');
const statCardsCount = document.getElementById('stat-cards-count');
const statDueCount = document.getElementById('stat-due-count');
const decksGrid = document.getElementById('decks-grid');

const deckModal = document.getElementById('deck-modal');
const openCreateDeckBtn = document.getElementById('open-create-deck-btn');
const closeDeckModalBtn = document.getElementById('close-deck-modal-btn');
const cancelDeckBtn = document.getElementById('cancel-deck-btn');
const deckForm = document.getElementById('deck-form');
const deckIdInput = document.getElementById('deck-id-input');
const deckNameInput = document.getElementById('deck-name-input');
const deckDescInput = document.getElementById('deck-desc-input');
const modalTitle = document.getElementById('modal-title');

let currentUser = null;

// ==========================================
// AUTHENTICATION FLOW
// ==========================================

// Check Authentication Status
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();
        
        if (data.loggedIn) {
            currentUser = data.user;
            authOverlay.style.display = 'none';
            headerUserProfile.style.display = 'flex';
            
            // Set user info
            headerUsername.textContent = currentUser.fullname;
            headerAvatarLetter.textContent = currentUser.fullname.charAt(0).toUpperCase();
            
            // Load Dashboard data
            loadDashboardStats();
            loadDecks();
        } else {
            authOverlay.style.display = 'flex';
            headerUserProfile.style.display = 'none';
        }
    } catch (err) {
        console.error("Lỗi kiểm tra đăng nhập:", err);
    }
}

// Tab Switching (Login / Register)
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

// Login Form Submit
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
            
            // Clear inputs
            loginForm.reset();
            
            // Load dashboard
            loadDashboardStats();
            loadDecks();
        } else {
            loginErrorMsg.textContent = data.error || 'Đăng nhập không thành công.';
            loginErrorMsg.style.display = 'block';
        }
    } catch (err) {
        loginErrorMsg.textContent = 'Kết nối server thất bại.';
        loginErrorMsg.style.display = 'block';
    }
});

// Register Form Submit
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
            
            // Clear inputs
            registerForm.reset();
            
            // Load dashboard
            loadDashboardStats();
            loadDecks();
        } else {
            registerErrorMsg.textContent = data.error || 'Đăng ký không thành công.';
            registerErrorMsg.style.display = 'block';
        }
    } catch (err) {
        registerErrorMsg.textContent = 'Kết nối server thất bại.';
        registerErrorMsg.style.display = 'block';
    }
});

// Logout Button
logoutBtn.addEventListener('click', async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;
    try {
        const response = await fetch('/api/auth/logout', { method: 'POST' });
        if (response.ok) {
            currentUser = null;
            authOverlay.style.display = 'flex';
            headerUserProfile.style.display = 'none';
            // Reset forms
            loginForm.reset();
            registerForm.reset();
        }
    } catch (err) {
        alert("Lỗi đăng xuất.");
    }
});

// Handle unauthorized API responses
function handleApiError(response) {
    if (response.status === 418) { // 418 Custom code for UNAUTHORIZED
        authOverlay.style.display = 'flex';
        headerUserProfile.style.display = 'none';
        return true;
    }
    return false;
}

// ==========================================
// STATS & DECKS LOADING
// ==========================================

// Load Stats
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/stats');
        if (handleApiError(response)) return;
        
        const data = await response.json();
        
        statDecksCount.textContent = data.totalDecks;
        statCardsCount.textContent = data.totalCards;
        statDueCount.textContent = data.dueCardsCount;
        
        // Welcome message logic
        welcomeTitle.textContent = `Chào ${currentUser.fullname}!`;
        if (data.dueCardsCount > 0) {
            welcomeSubtitle.textContent = `Bạn có ${data.dueCardsCount} thẻ đang đến hạn ôn tập ngày hôm nay. Hãy học ngay nào!`;
            bannerActionArea.innerHTML = `<a href="study.html" class="btn btn-primary"><i class="fa-solid fa-graduation-cap"></i> Ôn tập ngay</a>`;
        } else {
            welcomeSubtitle.textContent = "Tuyệt vời! Bạn đã hoàn thành tất cả các thẻ ôn tập cho hôm nay.";
            bannerActionArea.innerHTML = `<span class="btn btn-secondary" style="cursor: default;"><i class="fa-solid fa-check"></i> Hoàn thành ngày</span>`;
        }
    } catch (err) {
        console.error("Lỗi tải thống kê:", err);
    }
}

// Load Decks List
async function loadDecks() {
    try {
        decksGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách bộ thẻ...
            </div>`;
            
        const response = await fetch('/api/decks');
        if (handleApiError(response)) return;
        
        const decks = await response.json();
        
        if (decks.length === 0) {
            decksGrid.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"><i class="fa-solid fa-folder-open"></i></div>
                    <h3>Chưa có bộ thẻ nào</h3>
                    <p>Hãy tạo bộ thẻ đầu tiên của bạn để lưu trữ các thẻ ghi nhớ và bắt đầu học tập.</p>
                    <button class="btn btn-primary" id="empty-create-deck-btn"><i class="fa-solid fa-plus"></i> Tạo bộ thẻ đầu tiên</button>
                </div>`;
            document.getElementById('empty-create-deck-btn').addEventListener('click', openCreateDeckModal);
            return;
        }
        
        decksGrid.innerHTML = '';
        decks.forEach(deck => {
            const card = document.createElement('div');
            card.className = 'deck-card';
            
            const dueBadgeClass = deck.due_cards > 0 ? 'has-due' : 'no-due';
            const dueBadgeText = deck.due_cards > 0 ? `${deck.due_cards} thẻ cần ôn` : 'Đã học xong';
            
            card.innerHTML = `
                <div class="deck-card-body">
                    <div class="deck-title-row">
                        <h3>${escapeHTML(deck.name)}</h3>
                        <div class="deck-actions-menu">
                            <button class="deck-menu-btn edit-deck-btn" data-id="${deck.id}" title="Sửa tên/mô tả"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="deck-menu-btn delete-deck-btn" data-id="${deck.id}" title="Xóa bộ thẻ"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <p class="deck-desc">${escapeHTML(deck.description || 'Không có mô tả.')}</p>
                    <div class="deck-meta">
                        <span class="total-badge"><i class="fa-solid fa-layer-group"></i> ${deck.total_cards} thẻ</span>
                        <span class="due-badge ${dueBadgeClass}"><i class="fa-solid fa-clock"></i> ${dueBadgeText}</span>
                    </div>
                </div>
                <div class="deck-card-actions">
                    <a href="study.html?id=${deck.id}" class="btn btn-primary ${deck.total_cards === 0 ? 'disabled' : ''}" style="${deck.total_cards === 0 ? 'pointer-events: none; opacity: 0.5;' : ''}">
                        <i class="fa-solid fa-graduation-cap"></i> Học ngay
                    </a>
                    <a href="deck.html?id=${deck.id}" class="btn btn-secondary">
                        <i class="fa-solid fa-gear"></i> Quản lý
                    </a>
                </div>
            `;
            decksGrid.appendChild(card);
        });
        
        // Attach Event Listeners to actions
        document.querySelectorAll('.edit-deck-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                openEditDeckModal(id);
            });
        });
        
        document.querySelectorAll('.delete-deck-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteDeck(id);
            });
        });
        
    } catch (err) {
        decksGrid.innerHTML = `<div class="loading-spinner" style="color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> Lỗi kết nối server khi tải bộ thẻ.</div>`;
    }
}

// ==========================================
// DECK OPERATIONS (CREATE / EDIT / DELETE)
// ==========================================

function openCreateDeckModal() {
    deckForm.reset();
    deckIdInput.value = '';
    modalTitle.textContent = 'Tạo Bộ Thẻ Mới';
    deckModal.style.display = 'flex';
}

async function openEditDeckModal(id) {
    try {
        const response = await fetch(`/api/decks/${id}`);
        if (handleApiError(response)) return;
        
        const deck = await response.json();
        
        deckIdInput.value = deck.id;
        deckNameInput.value = deck.name;
        deckDescInput.value = deck.description || '';
        
        modalTitle.textContent = 'Chỉnh Sửa Bộ Thẻ';
        deckModal.style.display = 'flex';
    } catch (err) {
        alert("Không thể tải thông tin bộ thẻ.");
    }
}

async function deleteDeck(id) {
    if (!confirm("CẢNH BÁO: Xóa bộ thẻ sẽ xóa toàn bộ các Flashcard bên trong nó! Bạn có chắc chắn muốn xóa không?")) return;
    try {
        const response = await fetch(`/api/decks/${id}`, { method: 'DELETE' });
        if (handleApiError(response)) return;
        
        const data = await response.json();
        if (response.ok && data.success) {
            loadDashboardStats();
            loadDecks();
        } else {
            alert(data.error || "Lỗi khi xóa bộ thẻ.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
}

deckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = deckIdInput.value;
    const name = deckNameInput.value.trim();
    const description = deckDescInput.value.trim();
    
    const url = id ? `/api/decks/${id}` : '/api/decks';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description })
        });
        if (handleApiError(response)) return;
        
        const data = await response.json();
        if (response.ok && (data.success || data.id)) {
            deckModal.style.display = 'none';
            loadDashboardStats();
            loadDecks();
        } else {
            alert(data.error || "Lỗi khi lưu bộ thẻ.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
});

// Event Listeners for Modal
openCreateDeckBtn.addEventListener('click', openCreateDeckModal);
closeDeckModalBtn.addEventListener('click', () => deckModal.style.display = 'none');
cancelDeckBtn.addEventListener('click', () => deckModal.style.display = 'none');

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === deckModal) {
        deckModal.style.display = 'none';
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
