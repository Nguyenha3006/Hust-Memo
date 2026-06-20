const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Setup Session Store
let sessionStore;
try {
    const FileStore = require('session-file-store')(session);
    // On Windows, use MemoryStore to avoid EPERM file locking rename issues.
    // On other platforms, use the slides' recommended FileStore.
    if (process.platform !== 'win32') {
        const sessionsDir = path.join(__dirname, 'sessions');
        if (!fs.existsSync(sessionsDir)) {
            fs.mkdirSync(sessionsDir, { recursive: true });
        }
        sessionStore = new FileStore({
            path: './sessions',
            logFn: () => {}
        });
    }
} catch (e) {
    console.warn("session-file-store initialization failed, falling back to MemoryStore.");
}

app.use(session({
    store: sessionStore,
    secret: 'hustmemo-secret-key-2026',
    cookie: { maxAge: 30 * 60000 }, // 30 minutes
    saveUninitialized: false,
    resave: false
}));

// ==========================================
// DATABASE LAYER (MYSQL WITH IN-MEMORY MOCK FALLBACK)
// ==========================================
let dbType = 'mysql';
let pool = null;

// Mock in-memory data
let mockUsers = [
    { id: 1, username: 'admin', password: '$2a$10$EuxJpD1hY427N6j5t.2Jt.jM/9gA9L5YV.R7C68v9t6hUe1sV5o4q', fullname: 'Nguyễn Văn Hust', email: 'admin@hust.edu.vn' }
];
let mockDecks = [
    { id: 1, user_id: 1, name: 'Từ vựng Tiếng Anh chuyên ngành', description: 'Các thuật ngữ tiếng Anh thường gặp trong lập trình và thiết kế web.' },
    { id: 2, user_id: 1, name: 'Lập trình Web (AC2070)', description: 'Các khái niệm cơ bản về HTML, CSS, JavaScript, ExpressJS và các công nghệ liên quan.' }
];
let mockCards = [
    { id: 1, deck_id: 1, front: 'Aesthetic', back: 'Thẩm mỹ, thuộc về mỹ học (Vd: Thiết kế tối giản mang lại giá trị thẩm mỹ cao).', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 2, deck_id: 1, front: 'Minimalist', back: 'Tối giản (Phong cách tập trung vào sự tinh giản, loại bỏ các chi tiết thừa thãi).', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 3, deck_id: 1, front: 'Spaced Repetition', back: 'Lặp lại ngắt quãng (Phương pháp học tập phân phối thời gian ôn tập để tối ưu hóa trí nhớ lâu dài).', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 4, deck_id: 1, front: 'Robustness', back: 'Tính bền vững, khả năng chịu lỗi (Hệ thống có thể xử lý các lỗi hoặc dữ liệu đầu vào bất thường mà không bị crash).', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 5, deck_id: 2, front: 'HTTP (HyperText Transfer Protocol)', back: 'Giao thức truyền tải siêu văn bản, là giao thức truyền nhận dữ liệu nền tảng của mạng WWW.', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 6, deck_id: 2, front: 'AJAX (Asynchronous JavaScript and XML)', back: 'Kỹ thuật tải dữ liệu bất đồng bộ từ server mà không cần phải tải lại toàn bộ trang web.', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 7, deck_id: 2, front: 'CORS (Cross-Origin Resource Sharing)', back: 'Cơ chế cho phép các trang web gửi yêu cầu truy xuất tài nguyên từ một domain khác với domain của trang hiện tại.', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() },
    { id: 8, deck_id: 2, front: 'Session vs Cookie', back: 'Cookie lưu trữ dữ liệu ở phía Client (trình duyệt), dễ bị can thiệp. Session lưu trữ trạng thái ở phía Server, Client chỉ giữ Session ID dạng cookie để định danh.', ease_factor: 2.5, interval: 0, repetitions: 0, next_review: new Date() }
];

let nextMockUserId = 2;
let nextMockDeckId = 3;
let nextMockCardId = 9;

let mockStudyLogs = [];

// Seed mock study logs for admin user (userId = 1) for the year 2026
function seedMockStudyLogs() {
    const userId = 1;
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-06-12"); // Seed up to yesterday
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        if (Math.random() < 0.45) { // 45% chance of activity
            const count = Math.floor(Math.random() * 25) + 1; // 1 to 25 cards
            const dateStr = d.toISOString().split('T')[0];
            for (let i = 0; i < count; i++) {
                mockStudyLogs.push({
                    userId: userId,
                    date: dateStr,
                    cardId: Math.floor(Math.random() * 8) + 1
                });
            }
        }
    }
}
seedMockStudyLogs();

// Database Connection Attempt
async function initDatabase() {
    try {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '', // Default XAMPP/WAMP password
            database: 'hustmemo',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        // Simple test query to check connection
        await pool.query('SELECT 1');
        console.log("=========================================");
        console.log(" SUCCESSFULLY CONNECTED TO MYSQL DATABASE");
        console.log("=========================================");
        
        // Create study_logs table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS study_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                card_id INT NOT NULL,
                study_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
    } catch (err) {
        dbType = 'mock';
        console.warn("=========================================");
        console.warn(" WARNING: CANNOT CONNECT TO MYSQL DATABASE");
        console.warn(" FALLING BACK TO IN-MEMORY MOCK DATABASE MODE");
        console.warn(" Error Details:", err.message);
        console.warn("=========================================");
    }
}
initDatabase();

// Database Service Layer
const db = {
    async getUserByUsername(username) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
                return rows[0];
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockUsers.find(u => u.username === username);
    },
    async getUserById(id) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
                return rows[0];
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockUsers.find(u => u.id === id);
    },
    async getUserByEmail(email) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
                return rows[0];
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockUsers.find(u => u.email === email);
    },
    async createUser(username, passwordHash, fullname, email) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query(
                    'INSERT INTO users (username, password, fullname, email) VALUES (?, ?, ?, ?)',
                    [username, passwordHash, fullname, email]
                );
                return result.insertId;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const newUser = { id: nextMockUserId++, username, password: passwordHash, fullname, email };
        mockUsers.push(newUser);
        return newUser.id;
    },
    async updateUser(id, fullname, email, passwordHash) {
        if (dbType === 'mysql') {
            try {
                if (passwordHash) {
                    await pool.query('UPDATE users SET fullname = ?, email = ?, password = ? WHERE id = ?', [fullname, email, passwordHash, id]);
                } else {
                    await pool.query('UPDATE users SET fullname = ?, email = ? WHERE id = ?', [fullname, email, id]);
                }
                return true;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const user = mockUsers.find(u => u.id === id);
        if (user) {
            user.fullname = fullname;
            user.email = email;
            if (passwordHash) user.password = passwordHash;
            return true;
        }
        return false;
    },
    async getDecks(userId) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM decks WHERE user_id = ?', [userId]);
                return rows;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockDecks.filter(d => d.user_id === userId);
    },
    async getDeckById(id, userId) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM decks WHERE id = ? AND user_id = ?', [id, userId]);
                return rows[0];
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockDecks.find(d => d.id === parseInt(id) && d.user_id === parseInt(userId));
    },
    async createDeck(userId, name, description) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('INSERT INTO decks (user_id, name, description) VALUES (?, ?, ?)', [userId, name, description]);
                return result.insertId;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const newDeck = { id: nextMockDeckId++, user_id: userId, name, description };
        mockDecks.push(newDeck);
        return newDeck.id;
    },
    async updateDeck(id, userId, name, description) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('UPDATE decks SET name = ?, description = ? WHERE id = ? AND user_id = ?', [name, description, id, userId]);
                return result.affectedRows > 0;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const deck = mockDecks.find(d => d.id === parseInt(id) && d.user_id === parseInt(userId));
        if (deck) {
            deck.name = name;
            deck.description = description;
            return true;
        }
        return false;
    },
    async deleteDeck(id, userId) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('DELETE FROM decks WHERE id = ? AND user_id = ?', [id, userId]);
                return result.affectedRows > 0;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const index = mockDecks.findIndex(d => d.id === parseInt(id) && d.user_id === parseInt(userId));
        if (index !== -1) {
            mockDecks.splice(index, 1);
            mockCards = mockCards.filter(c => c.deck_id !== parseInt(id));
            return true;
        }
        return false;
    },
    async getCards(deckId) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM flashcards WHERE deck_id = ? ORDER BY id ASC', [deckId]);
                return rows;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockCards.filter(c => c.deck_id === parseInt(deckId));
    },
    async getCardById(id) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query('SELECT * FROM flashcards WHERE id = ?', [id]);
                return rows[0];
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockCards.find(c => c.id === parseInt(id));
    },
    async createCard(deckId, front, back) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('INSERT INTO flashcards (deck_id, front, back) VALUES (?, ?, ?)', [deckId, front, back]);
                return result.insertId;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const newCard = {
            id: nextMockCardId++,
            deck_id: parseInt(deckId),
            front,
            back,
            ease_factor: 2.5,
            interval: 0,
            repetitions: 0,
            next_review: new Date()
        };
        mockCards.push(newCard);
        return newCard.id;
    },
    async updateCard(id, front, back) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('UPDATE flashcards SET front = ?, back = ? WHERE id = ?', [front, back, id]);
                return result.affectedRows > 0;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const card = mockCards.find(c => c.id === parseInt(id));
        if (card) {
            card.front = front;
            card.back = back;
            return true;
        }
        return false;
    },
    async deleteCard(id) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query('DELETE FROM flashcards WHERE id = ?', [id]);
                return result.affectedRows > 0;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const index = mockCards.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            mockCards.splice(index, 1);
            return true;
        }
        return false;
    },
    async updateCardReview(id, easeFactor, interval, repetitions, nextReview) {
        if (dbType === 'mysql') {
            try {
                const [result] = await pool.query(
                    'UPDATE flashcards SET ease_factor = ?, `interval` = ?, repetitions = ?, next_review = ? WHERE id = ?',
                    [easeFactor, interval, repetitions, nextReview, id]
                );
                return result.affectedRows > 0;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const card = mockCards.find(c => c.id === parseInt(id));
        if (card) {
            card.ease_factor = easeFactor;
            card.interval = interval;
            card.repetitions = repetitions;
            card.next_review = new Date(nextReview);
            return true;
        }
        return false;
    },
    async getDueCardsCount(userId) {
        const now = new Date();
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query(
                    'SELECT COUNT(*) as count FROM flashcards f JOIN decks d ON f.deck_id = d.id WHERE d.user_id = ? AND f.next_review <= ?',
                    [userId, now]
                );
                return rows[0].count;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const userDecks = mockDecks.filter(d => d.user_id === userId).map(d => d.id);
        return mockCards.filter(c => userDecks.includes(c.deck_id) && new Date(c.next_review) <= now).length;
    },
    async getDecksWithDueCount(userId) {
        const now = new Date();
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query(
                    `SELECT d.*, 
                            COUNT(f.id) as total_cards,
                            SUM(CASE WHEN f.next_review <= ? THEN 1 ELSE 0 END) as due_cards
                     FROM decks d 
                     LEFT JOIN flashcards f ON d.id = f.deck_id
                     WHERE d.user_id = ?
                     GROUP BY d.id`,
                    [now, userId]
                );
                return rows.map(r => ({
                    ...r,
                    total_cards: parseInt(r.total_cards) || 0,
                    due_cards: parseInt(r.due_cards) || 0
                }));
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        return mockDecks.filter(d => d.user_id === userId).map(d => {
            const cards = mockCards.filter(c => c.deck_id === d.id);
            const dueCards = cards.filter(c => new Date(c.next_review) <= now);
            return {
                ...d,
                total_cards: cards.length,
                due_cards: dueCards.length
            };
        });
    },
    async getDueCards(userId, deckId = null) {
        const now = new Date();
        if (dbType === 'mysql') {
            try {
                let sql = 'SELECT f.*, d.name as deck_name FROM flashcards f JOIN decks d ON f.deck_id = d.id WHERE d.user_id = ? AND f.next_review <= ?';
                let params = [userId, now];
                if (deckId) {
                    sql += ' AND f.deck_id = ?';
                    params.push(deckId);
                }
                sql += ' ORDER BY f.id ASC';
                const [rows] = await pool.query(sql, params);
                return rows;
            } catch (e) {
                console.error("MySQL Error, falling back to mock:", e.message);
            }
        }
        const userDecks = mockDecks.filter(d => d.user_id === userId);
        const userDeckIds = userDecks.map(d => d.id);
        let cards = mockCards.filter(c => userDeckIds.includes(c.deck_id) && new Date(c.next_review) <= now);
        if (deckId) {
            cards = cards.filter(c => c.deck_id === parseInt(deckId));
        }
        return cards.map(c => {
            const d = userDecks.find(deck => deck.id === c.deck_id);
            return {
                ...c,
                deck_name: d ? d.name : ''
            };
        });
    },
    async logStudyActivity(userId, cardId) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (dbType === 'mysql') {
            try {
                await pool.query('INSERT INTO study_logs (user_id, card_id, study_date) VALUES (?, ?, ?)', [userId, cardId, todayStr]);
                return true;
            } catch (e) {
                console.error("MySQL Error logging study activity, falling back to mock:", e.message);
            }
        }
        mockStudyLogs.push({ userId: parseInt(userId), date: todayStr, cardId: parseInt(cardId) });
        return true;
    },
    async getStudyHistoryForYear(userId, year) {
        if (dbType === 'mysql') {
            try {
                const [rows] = await pool.query(
                    'SELECT study_date as date, COUNT(*) as count FROM study_logs WHERE user_id = ? AND YEAR(study_date) = ? GROUP BY study_date',
                    [userId, year]
                );
                const history = {};
                rows.forEach(r => {
                    const d = new Date(r.date);
                    const offset = d.getTimezoneOffset();
                    const correctedDate = new Date(d.getTime() - (offset * 60 * 1000));
                    const dateStr = correctedDate.toISOString().split('T')[0];
                    history[dateStr] = r.count;
                });
                return history;
            } catch (e) {
                console.error("MySQL Error fetching study history, falling back to mock:", e.message);
            }
        }
        const history = {};
        mockStudyLogs.forEach(log => {
            if (log.userId === parseInt(userId) && log.date.startsWith(year.toString())) {
                history[log.date] = (history[log.date] || 0) + 1;
            }
        });
        return history;
    }
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================
function requireLogin(req, res, next) {
    if (req.session && req.session.userId) {
        next();
    } else {
        res.status(418).json({ error: 'UNAUTHORIZED', message: 'Bạn cần đăng nhập để thực hiện tác vụ này.' });
    }
}

// ==========================================
// API ROUTES
// ==========================================

// 1. Auth APIs
app.get('/api/auth/status', (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username, fullname: req.session.fullname, email: req.session.email } });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { username, password, fullname, email } = req.body;
    if (!username || !password || !fullname || !email) {
        return res.status(400).json({ error: 'Missing parameters' });
    }
    
    try {
        const existingUser = await db.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại.' });
        }
        const existingEmail = await db.getUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ error: 'Email đã được sử dụng.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const newId = await db.createUser(username, passwordHash, fullname, email);
        
        // Auto-login after registration
        req.session.userId = newId;
        req.session.username = username;
        req.session.fullname = fullname;
        req.session.email = email;
        
        res.json({ success: true, message: 'Đăng ký thành công.', user: { id: newId, username, fullname, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }
    
    try {
        const user = await db.getUserByUsername(username);
        if (!user) {
            return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
        }
        
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.fullname = user.fullname;
        req.session.email = user.email;
        
        res.json({ success: true, message: 'Đăng nhập thành công.', user: { id: user.id, username: user.username, fullname: user.fullname, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Không thể đăng xuất.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Đăng xuất thành công.' });
    });
});

app.post('/api/auth/update-profile', requireLogin, async (req, res) => {
    const { fullname, email, oldPassword, newPassword } = req.body;
    const userId = req.session.userId;
    
    if (!fullname || !email) {
        return res.status(400).json({ error: 'Họ tên và Email không được để trống.' });
    }
    
    try {
        const user = await db.getUserById(userId);
        
        // Email unique check
        const existingEmail = await db.getUserByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
            return res.status(400).json({ error: 'Email đã được sử dụng bởi tài khoản khác.' });
        }
        
        let passwordHash = null;
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ error: 'Bạn cần nhập mật khẩu cũ để đổi mật khẩu.' });
            }
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Mật khẩu cũ không chính xác.' });
            }
            const salt = await bcrypt.genSalt(10);
            passwordHash = await bcrypt.hash(newPassword, salt);
        }
        
        await db.updateUser(userId, fullname, email, passwordHash);
        
        // Update session
        req.session.fullname = fullname;
        req.session.email = email;
        
        res.json({ success: true, message: 'Cập nhật thông tin thành công.', user: { id: userId, username: req.session.username, fullname, email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Deck APIs
app.get('/api/decks', requireLogin, async (req, res) => {
    try {
        const decks = await db.getDecksWithDueCount(req.session.userId);
        res.json(decks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/decks/:id', requireLogin, async (req, res) => {
    try {
        const deck = await db.getDeckById(req.params.id, req.session.userId);
        if (!deck) {
            return res.status(404).json({ error: 'Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu.' });
        }
        res.json(deck);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/decks', requireLogin, async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Tên bộ thẻ không được để trống.' });
    }
    try {
        const newId = await db.createDeck(req.session.userId, name, description || '');
        res.json({ success: true, id: newId, name, description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/decks/:id', requireLogin, async (req, res) => {
    const { name, description } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Tên bộ thẻ không được để trống.' });
    }
    try {
        const success = await db.updateDeck(parseInt(req.params.id), req.session.userId, name, description || '');
        if (!success) {
            return res.status(404).json({ error: 'Không tìm thấy bộ thẻ cần cập nhật.' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/decks/:id', requireLogin, async (req, res) => {
    try {
        const success = await db.deleteDeck(parseInt(req.params.id), req.session.userId);
        if (!success) {
            return res.status(404).json({ error: 'Không tìm thấy bộ thẻ cần xóa.' });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Flashcard APIs
app.get('/api/decks/:deckId/cards', requireLogin, async (req, res) => {
    try {
        // Verify deck ownership first
        const deck = await db.getDeckById(req.params.deckId, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        const cards = await db.getCards(parseInt(req.params.deckId));
        res.json(cards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/decks/:deckId/cards', requireLogin, async (req, res) => {
    const { front, back } = req.body;
    if (!front || !back) {
        return res.status(400).json({ error: 'Nội dung hai mặt thẻ không được để trống.' });
    }
    try {
        const deck = await db.getDeckById(req.params.deckId, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        const newId = await db.createCard(parseInt(req.params.deckId), front, back);
        res.json({ success: true, id: newId, front, back });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/cards/:id', requireLogin, async (req, res) => {
    try {
        const card = await db.getCardById(parseInt(req.params.id));
        if (!card) {
            return res.status(404).json({ error: 'Thẻ không tồn tại.' });
        }
        const deck = await db.getDeckById(card.deck_id, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        res.json(card);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/cards/:id', requireLogin, async (req, res) => {
    const { front, back } = req.body;
    if (!front || !back) {
        return res.status(400).json({ error: 'Nội dung hai mặt thẻ không được để trống.' });
    }
    try {
        // Check deck ownership of the card
        const card = await db.getCardById(parseInt(req.params.id));
        if (!card) {
            return res.status(404).json({ error: 'Thẻ không tồn tại.' });
        }
        const deck = await db.getDeckById(card.deck_id, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        
        await db.updateCard(parseInt(req.params.id), front, back);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/cards/:id', requireLogin, async (req, res) => {
    try {
        const card = await db.getCardById(parseInt(req.params.id));
        if (!card) {
            return res.status(404).json({ error: 'Thẻ không tồn tại.' });
        }
        const deck = await db.getDeckById(card.deck_id, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        
        await db.deleteCard(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Study APIs
app.get('/api/study/due', requireLogin, async (req, res) => {
    const deckId = req.query.deckId ? parseInt(req.query.deckId) : null;
    try {
        const dueCards = await db.getDueCards(req.session.userId, deckId);
        res.json(dueCards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/study/review', requireLogin, async (req, res) => {
    const { cardId, rating } = req.body; // rating: 'hard', 'medium', 'easy'
    if (!cardId || !rating) {
        return res.status(400).json({ error: 'Missing parameters' });
    }
    
    try {
        const card = await db.getCardById(parseInt(cardId));
        if (!card) {
            return res.status(404).json({ error: 'Thẻ không tồn tại.' });
        }
        const deck = await db.getDeckById(card.deck_id, req.session.userId);
        if (!deck) {
            return res.status(403).json({ error: 'Quyền truy cập bị từ chối.' });
        }
        
        let easeFactor = card.ease_factor || 2.5;
        let interval = card.interval || 0;
        let repetitions = card.repetitions || 0;
        
        if (rating === 'hard') {
            repetitions = 0;
            interval = 1; // Study again tomorrow
            easeFactor = Math.max(1.3, easeFactor - 0.2);
        } else if (rating === 'medium') {
            repetitions += 1;
            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 3;
            } else {
                interval = Math.round(interval * easeFactor);
            }
        } else if (rating === 'easy') {
            repetitions += 1;
            if (repetitions === 1) {
                interval = 3;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * easeFactor * 1.2);
            }
            easeFactor = Math.min(3.0, easeFactor + 0.15);
        } else {
            return res.status(400).json({ error: 'Mức đánh giá không hợp lệ. Chỉ chấp nhận: hard, medium, easy.' });
        }
        
        // Calculate next review date: current time + interval days
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + interval);
        
        await db.updateCardReview(card.id, easeFactor, interval, repetitions, nextReview);
        
        // Log study activity for heatmap tracking
        await db.logStudyActivity(req.session.userId, card.id);
        
        res.json({
            success: true,
            card: {
                id: card.id,
                ease_factor: easeFactor,
                interval: interval,
                repetitions: repetitions,
                next_review: nextReview
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Dashboard / General Stats API
app.get('/api/stats', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        const decks = await db.getDecks(userId);
        
        let totalCards = 0;
        for (const deck of decks) {
            const cards = await db.getCards(deck.id);
            totalCards += cards.length;
        }
        
        const dueCardsCount = await db.getDueCardsCount(userId);
        
        res.json({
            totalDecks: decks.length,
            totalCards: totalCards,
            dueCardsCount: dueCardsCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mock Library Decks
const libraryDecks = [
    {
        id: 101,
        name: "Từ vựng tiếng Nhật N5",
        description: "Tổng hợp 100 từ vựng và mẫu câu cơ bản ôn thi JLPT N5.",
        cards: [
            { front: "こんにちは (Konnichiwa)", back: "Chào buổi chiều / Xin chào" },
            { front: "ありがとう (Arigatou)", back: "Cảm ơn" },
            { front: "さようなら (Sayounara)", back: "Tạm biệt" },
            { front: "いってきます (Ittekimasu)", back: "Tôi đi đây (nói khi ra khỏi nhà)" },
            { front: "ただいま (Tadaima)", back: "Tôi đã về (nói khi về đến nhà)" }
        ]
    },
    {
        id: 102,
        name: "Lịch sử Việt Nam (Cơ bản)",
        description: "Các mốc lịch sử quan trọng và các vị anh hùng dân tộc Việt Nam.",
        cards: [
            { front: "Năm 938", back: "Ngô Quyền đánh bại quân Nam Hán trên sông Bạch Đằng, chấm dứt 1000 năm bắc thuộc." },
            { front: "Năm 1010", back: "Lý Công Uẩn viết Chiếu dời đô, chuyển kinh đô từ Hoa Lư về Đại La (Thăng Long)." },
            { front: "Năm 1945", back: "Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình, khai sinh ra nước VNDCCH." }
        ]
    },
    {
        id: 103,
        name: "Lập trình Python cho người mới bắt đầu",
        description: "Kiến thức căn bản về biến, kiểu dữ liệu, vòng lặp và hàm trong Python.",
        cards: [
            { front: "List vs Tuple", back: "List có thể thay đổi giá trị (mutable), khai báo bằng []. Tuple không thể thay đổi giá trị (immutable), khai báo bằng ()." },
            { front: "Cách định nghĩa hàm", back: "Sử dụng từ khóa def. Ví dụ: def my_func():" },
            { front: "List Comprehension", back: "Cú pháp ngắn gọn để tạo list mới. Ví dụ: [x*2 for x in range(5)]" }
        ]
    }
];

// 6. Library APIs
app.get('/api/library', requireLogin, (req, res) => {
    const list = libraryDecks.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        total_cards: d.cards.length
    }));
    res.json(list);
});

app.get('/api/library/:id', requireLogin, (req, res) => {
    const deck = libraryDecks.find(d => d.id === parseInt(req.params.id));
    if (!deck) {
        return res.status(404).json({ error: "Bộ thẻ thư viện không tồn tại." });
    }
    res.json(deck);
});

app.post('/api/library/:id/clone', requireLogin, async (req, res) => {
    const deck = libraryDecks.find(d => d.id === parseInt(req.params.id));
    if (!deck) {
        return res.status(404).json({ error: "Bộ thẻ thư viện không tồn tại." });
    }
    
    try {
        const userId = req.session.userId;
        const newDeckId = await db.createDeck(userId, deck.name, deck.description);
        
        for (const card of deck.cards) {
            await db.createCard(newDeckId, card.front, card.back);
        }
        
        res.json({ success: true, message: "Đã tải bộ thẻ về thư viện cá nhân thành công!", deckId: newDeckId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Analytics API
app.get('/api/analytics', requireLogin, async (req, res) => {
    try {
        const userId = req.session.userId;
        const decks = await db.getDecks(userId);
        
        let newCount = 0;
        let reviewingCount = 0;
        let masteredCount = 0;
        
        for (const deck of decks) {
            const cards = await db.getCards(deck.id);
            cards.forEach(card => {
                if (card.interval === 0) {
                    newCount++;
                } else if (card.interval <= 7) {
                    reviewingCount++;
                } else {
                    masteredCount++;
                }
            });
        }
        
        const history = await db.getStudyHistoryForYear(userId, 2026);
        
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const dateKey = d.toISOString().split('T')[0];
            const count = history[dateKey] || 0;
            last7Days.push({ date: dateStr, count });
        }
        
        const heatmap = [];
        const startDate = new Date("2026-01-01");
        const endDate = new Date("2026-12-31");
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const count = history[dateStr] || 0;
            
            let level = 0;
            if (count === 0) level = 0;
            else if (count <= 2) level = 1;
            else if (count <= 5) level = 2;
            else if (count <= 9) level = 3;
            else if (count <= 14) level = 4;
            else if (count <= 19) level = 5;
            else level = 6;
            
            heatmap.push({ date: dateStr, count, level });
        }
        
        res.json({
            summary: {
                totalDecks: decks.length,
                totalCards: newCount + reviewingCount + masteredCount,
                newCount,
                reviewingCount,
                masteredCount
            },
            last7Days,
            heatmap
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Redirect root to dashboard.html
app.get('/', (req, res) => {
    res.redirect('/dashboard.html');
});

// Start Server
app.listen(port, () => {
    console.log(`HustMemo Server is running at http://localhost:${port}`);
});
