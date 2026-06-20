// Extract Deck ID from URL (optional)
const urlParams = new URLSearchParams(window.location.search);
const deckId = urlParams.get('id');

// DOM Elements for Study Session
const sessionDeckName = document.getElementById('session-deck-name');
const sessionTypeBadge = document.getElementById('session-type-badge');
const progressText = document.getElementById('progress-text');
const progressBarFill = document.getElementById('progress-bar-fill');

const studyWrapper = document.getElementById('study-wrapper');
const flashcardElement = document.getElementById('flashcard-element');
const cardFrontContent = document.getElementById('card-front-content');
const cardBackContent = document.getElementById('card-back-content');

const frontControls = document.getElementById('front-controls');
const backControls = document.getElementById('back-controls');
const showAnswerBtn = document.getElementById('show-answer-btn');

const rateHardBtn = document.getElementById('rate-hard-btn');
const rateMediumBtn = document.getElementById('rate-medium-btn');
const rateEasyBtn = document.getElementById('rate-easy-btn');

const completedWrapper = document.getElementById('completed-wrapper');
const compStatTotal = document.getElementById('comp-stat-total');
const compStatLeft = document.getElementById('comp-stat-left');

let dueCards = [];
let currentIndex = 0;
let reviewedCount = 0;
let totalSessionCards = 0;

// Callback triggered by auth-helper.js upon successful session verification
window.onAuthSuccess = function(user) {
    initSession();
};

// ==========================================
// STUDY SESSION LOGIC
// ==========================================

async function initSession() {
    try {
        // Load Deck Name
        if (deckId) {
            const resDeck = await fetch(`/api/decks/${deckId}`);
            if (handleApiError(resDeck)) return;
            const deck = await resDeck.json();
            sessionDeckName.textContent = deck.name;
            sessionTypeBadge.textContent = 'Học theo bộ';
        } else {
            sessionDeckName.textContent = 'Ôn tập tổng hợp';
            sessionTypeBadge.textContent = 'Học tất cả thẻ đến hạn';
        }
        
        // Fetch Due Cards
        const url = deckId ? `/api/study/due?deckId=${deckId}` : '/api/study/due';
        const resCards = await fetch(url);
        if (handleApiError(resCards)) return;
        dueCards = await resCards.json();
        
        currentIndex = 0;
        reviewedCount = 0;
        totalSessionCards = dueCards.length;
        
        if (dueCards.length === 0) {
            showEmptySession();
            return;
        }
        
        showCard(0);
    } catch (err) {
        console.error("Lỗi khởi tạo phiên học:", err);
        sessionDeckName.textContent = 'Lỗi kết nối';
    }
}

function showEmptySession() {
    progressBarFill.style.width = '100%';
    progressText.textContent = 'Thẻ 0 / 0';
    
    studyWrapper.innerHTML = `
        <div class="completed-card" style="box-shadow: none; border: none; background: transparent;">
            <div class="completed-icon" style="color: var(--success); filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.3));"><i class="fa-solid fa-circle-check"></i></div>
            <h2>Không có thẻ nào cần ôn!</h2>
            <p class="congrats-text">Bộ thẻ này không có thẻ nào đến hạn ôn tập hôm nay. Bạn đã học rất tốt!</p>
            <div class="completed-actions" style="margin-top: 2rem;">
                <a href="dashboard.html" class="btn btn-primary"><i class="fa-solid fa-house"></i> Quay lại trang chủ</a>
            </div>
        </div>`;
}

function showCard(index) {
    if (index >= dueCards.length) {
        finishSession();
        return;
    }
    
    // Reset flip status
    flashcardElement.classList.remove('flipped');
    frontControls.style.display = 'flex';
    backControls.style.display = 'none';
    
    // Set text contents
    const card = dueCards[index];
    cardFrontContent.textContent = card.front;
    cardBackContent.textContent = card.back;
    
    // Update progress
    progressText.textContent = `Thẻ ${index + 1} / ${dueCards.length}`;
    
    // Calculate progress percentage based on original cards
    // Note: totalSessionCards can increase if cards are appended due to "Hard" rating
    const progressPercent = Math.min(100, (reviewedCount / totalSessionCards) * 100);
    progressBarFill.style.width = `${progressPercent}%`;
}

// Flip Card Action
function flipCard() {
    const isFlipped = flashcardElement.classList.contains('flipped');
    if (isFlipped) {
        flashcardElement.classList.remove('flipped');
        frontControls.style.display = 'flex';
        backControls.style.display = 'none';
    } else {
        flashcardElement.classList.add('flipped');
        frontControls.style.display = 'none';
        backControls.style.display = 'flex';
    }
}

flashcardElement.addEventListener('click', flipCard);
showAnswerBtn.addEventListener('click', flipCard);

// Handle Ratings
async function submitReview(rating) {
    const card = dueCards[currentIndex];
    
    try {
        const response = await fetch('/api/study/review', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId: card.id, rating })
        });
        if (handleApiError(response)) return;
        
        if (response.ok) {
            reviewedCount++;
            
            // Spaced Repetition queue adjustment:
            // If rated 'hard', we push a copy of this card to the end of our current review queue
            // so the user encounters it again before the session is finished.
            if (rating === 'hard') {
                dueCards.push(card);
                totalSessionCards++; // Increment total session size
            }
            
            // Advance queue
            currentIndex++;
            showCard(currentIndex);
        } else {
            const data = await response.json();
            alert(data.error || "Lỗi cập nhật tiến trình ôn tập.");
        }
    } catch (err) {
        alert("Kết nối server thất bại.");
    }
}

rateHardBtn.addEventListener('click', (e) => { e.stopPropagation(); submitReview('hard'); });
rateMediumBtn.addEventListener('click', (e) => { e.stopPropagation(); submitReview('medium'); });
rateEasyBtn.addEventListener('click', (e) => { e.stopPropagation(); submitReview('easy'); });

// Finish Session
async function finishSession() {
    studyWrapper.style.display = 'none';
    completedWrapper.style.display = 'flex';
    progressBarFill.style.width = '100%';
    progressText.textContent = 'Hoàn thành';
    
    compStatTotal.textContent = reviewedCount;
    
    // Fetch remaining due counts
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();
            compStatLeft.textContent = data.dueCardsCount;
        }
    } catch (e) {
        compStatLeft.textContent = '0';
    }
}

