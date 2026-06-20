// Extract Deck ID from URL
const urlParams = new URLSearchParams(window.location.search);
const deckId = urlParams.get('id');

if (!deckId) {
    window.location.href = 'dashboard.html';
}

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

const deckTitleDisplay = document.getElementById('deck-title-display');
const deckDescDisplay = document.getElementById('deck-desc-display');
const cardsCountLabel = document.getElementById('cards-count-label');
const cardsTableBody = document.getElementById('cards-table-body');
const studyDeckNowBtn = document.getElementById('study-deck-now-btn');

const cardModal = document.getElementById('card-modal');
const openCreateCardBtn = document.getElementById('open-create-card-btn');
const closeCardModalBtn = document.getElementById('close-card-modal-btn');
const cancelCardBtn = document.getElementById('cancel-card-btn');
const cardForm = document.getElementById('card-form');
const cardIdInput = document.getElementById('card-id-input');
const cardFrontInput = document.getElementById('card-front-input');
const cardBackInput = document.getElementById('card-back-input');
const cardModalTitle = document.getElementById('card-modal-title');

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
            
            // Load Deck and Cards
            loadDeckInfo();
            loadCards();
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
            
            // Load page data
            loadDeckInfo();
            loadCards();
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
            
            // Load page data
            loadDeckInfo();
            loadCards();
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
// DECK DETAILS LOADING
// ==========================================

async function loadDeckInfo() {
    try {
        const response = await fetch(`/api/decks/${deckId}`);
        if (handleApiError(response)) return;
        
        if (response.status === 404) {
            alert("Bộ thẻ không tồn tại.");
            window.location.href = 'dashboard.html';
            return;
        }
        
        const deck = await response.json();
        deckTitleDisplay.textContent = deck.name;
        deckDescDisplay.textContent = deck.description || 'Không có mô tả.';
        
        document.title = `${deck.name} - HustMemo`;
    } catch (err) {
        console.error("Lỗi tải thông tin bộ thẻ:", err);
    }
}

async function loadCards() {
    try {
        cardsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-loading-cell">
                    <i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách thẻ...
                </td>
            </tr>`;
            
        const response = await fetch(`/api/decks/${deckId}/cards`);
        if (handleApiError(response)) return;
        
        const cards = await response.json();
        cardsCountLabel.textContent = cards.length;
        
        if (cards.length > 0) {
            studyDeckNowBtn.href = `study.html?id=${deckId}`;
            studyDeckNowBtn.style.display = 'inline-flex';
        } else {
            studyDeckNowBtn.style.display = 'none';
        }
        
        if (cards.length === 0) {
            cardsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 2rem; margin-bottom: 10px; color: var(--text-muted);"><i class="fa-solid fa-layer-group"></i></div>
                        <strong>Chưa có thẻ nào trong bộ này.</strong><br>
                        Hãy nhấp vào nút "Thêm Flashcard" ở góc trên bên phải để bắt đầu thêm nội dung học tập.
                    </td>
                </tr>`;
            return;
        }
        
        cardsTableBody.innerHTML = '';
        cards.forEach(card => {
            const tr = document.createElement('tr');
            
            // Format Next Review Date
            const nextReviewDate = new Date(card.next_review);
            const now = new Date();
            let dateString = nextReviewDate.toLocaleDateString('vi-VN');
            let isOverdue = nextReviewDate <= now;
            let dateDisplay = dateString;
            
            if (isOverdue) {
                dateDisplay = `<span style="color: var(--warning); font-weight: 500;" title="Đã đến hạn ôn tập!"><i class="fa-solid fa-triangle-exclamation"></i> ${dateString} (Đến hạn)</span>`;
            }
            
            // Spaced repetition status badge
            let statusBadge = '';
            if (card.interval === 0) {
                statusBadge = '<span class="status-badge new"><i class="fa-solid fa-star"></i> Mới</span>';
            } else if (card.interval <= 7) {
                statusBadge = `<span class="status-badge reviewing"><i class="fa-solid fa-rotate-right"></i> Ôn tập (${card.interval} ngày)</span>`;
            } else {
                statusBadge = `<span class="status-badge mastered"><i class="fa-solid fa-circle-check"></i> Thuần thục (${card.interval} ngày)</span>`;
            }
            
            tr.innerHTML = `
                <td><div class="card-text-cell">${escapeHTML(card.front)}</div></td>
                <td><div class="card-text-cell">${escapeHTML(card.back)}</div></td>
                <td class="text-center font-monospace">${(card.ease_factor).toFixed(2)}</td>
                <td class="text-center">${statusBadge}</td>
                <td>${dateDisplay}</td>
                <td class="text-center">
                    <div class="card-ops">
                        <button class="ops-btn edit edit-card-btn" data-id="${card.id}" title="Sửa thẻ"><i class="fa-solid fa-pen"></i></button>
                        <button class="ops-btn delete delete-card-btn" data-id="${card.id}" title="Xóa thẻ"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            `;
            cardsTableBody.appendChild(tr);
        });
        
        // Attach Events to card buttons
        document.querySelectorAll('.edit-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                openEditCardModal(id);
            });
        });
        
        document.querySelectorAll('.delete-card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                deleteCard(id);
            });
        });
        
    } catch (err) {
        cardsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--danger); padding: 3rem;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Lỗi kết nối server khi tải danh sách thẻ.
                </td>
            </tr>`;
    }
}

// ==========================================
// CARD OPERATIONS (CREATE / EDIT / DELETE)
// ==========================================

function openCreateCardModal() {
    cardForm.reset();
    cardIdInput.value = '';
    cardModalTitle.textContent = 'Thêm Flashcard Mới';
    cardModal.style.display = 'flex';
}

async function openEditCardModal(id) {
    try {
        const response = await fetch(`/api/cards/${id}`);
        if (handleApiError(response)) return;
        
        const card = await response.json();
        
        cardIdInput.value = card.id;
        cardFrontInput.value = card.front;
        cardBackInput.value = card.back;
        
        cardModalTitle.textContent = 'Chỉnh Sửa Flashcard';
        cardModal.style.display = 'flex';
    } catch (err) {
        alert("Không thể tải nội dung Flashcard.");
    }
}

async function deleteCard(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa Flashcard này?")) return;
    try {
        const response = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
        if (handleApiError(response)) return;
        
        const data = await response.json();
        if (response.ok && data.success) {
            loadCards();
        } else {
            alert(data.error || "Lỗi khi xóa Flashcard.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
}

cardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = cardIdInput.value;
    const front = cardFrontInput.value.trim();
    const back = cardBackInput.value.trim();
    
    const url = id ? `/api/cards/${id}` : `/api/decks/${deckId}/cards`;
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ front, back })
        });
        if (handleApiError(response)) return;
        
        const data = await response.json();
        if (response.ok && (data.success || data.id)) {
            cardModal.style.display = 'none';
            loadCards();
        } else {
            alert(data.error || "Lỗi khi lưu Flashcard.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
});

// Event Listeners for Modal
openCreateCardBtn.addEventListener('click', openCreateCardModal);
closeCardModalBtn.addEventListener('click', () => cardModal.style.display = 'none');
cancelCardBtn.addEventListener('click', () => cardModal.style.display = 'none');

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === cardModal) {
        cardModal.style.display = 'none';
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
