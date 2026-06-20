-- Khởi tạo Database cho HustMemo
CREATE DATABASE IF NOT EXISTS hustmemo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hustmemo;

-- 1. Bảng lưu trữ thông tin Người dùng
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng lưu trữ các bộ thẻ (Decks)
CREATE TABLE IF NOT EXISTS decks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng lưu trữ danh sách các Flashcard và thông số lặp lại ngắt quãng (SM-2)
CREATE TABLE IF NOT EXISTS flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deck_id INT NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    ease_factor DOUBLE DEFAULT 2.5,
    `interval` INT DEFAULT 0,
    repetitions INT DEFAULT 0,
    next_review TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- CHÈN DỮ LIỆU MẪU ĐỂ KIỂM THỬ (Mật khẩu mặc định là '123456')
-- Mật khẩu đã mã hóa bằng bcrypt: '$2a$10$EuxJpD1hY427N6j5t.2Jt.jM/9gA9L5YV.R7C68v9t6hUe1sV5o4q'
-- --------------------------------------------------------

INSERT INTO users (id, username, password, fullname, email)
VALUES (1, 'admin', '$2a$10$EuxJpD1hY427N6j5t.2Jt.jM/9gA9L5YV.R7C68v9t6hUe1sV5o4q', 'Nguyễn Văn Hust', 'admin@hust.edu.vn')
ON DUPLICATE KEY UPDATE id=id;

-- Chèn bộ thẻ mẫu
INSERT INTO decks (id, user_id, name, description)
VALUES 
(1, 1, 'Từ vựng Tiếng Anh chuyên ngành', 'Các thuật ngữ tiếng Anh thường gặp trong lập trình và thiết kế web.'),
(2, 1, 'Lập trình Web (AC2070)', 'Các khái niệm cơ bản về HTML, CSS, JavaScript, ExpressJS và các công nghệ liên quan.')
ON DUPLICATE KEY UPDATE id=id;

-- Chèn Flashcard mẫu cho bộ 1 (English)
INSERT INTO flashcards (deck_id, front, back, ease_factor, `interval`, repetitions, next_review)
VALUES
(1, 'Aesthetic', 'Thẩm mỹ, thuộc về mỹ học (Vd: Thiết kế tối giản mang lại giá trị thẩm mỹ cao).', 2.5, 0, 0, CURRENT_TIMESTAMP),
(1, 'Minimalist', 'Tối giản (Phong cách tập trung vào sự tinh giản, loại bỏ các chi tiết thừa thãi).', 2.5, 0, 0, CURRENT_TIMESTAMP),
(1, 'Spaced Repetition', 'Lặp lại ngắt quãng (Phương pháp học tập phân phối thời gian ôn tập để tối ưu hóa trí nhớ lâu dài).', 2.5, 0, 0, CURRENT_TIMESTAMP),
(1, 'Robustness', 'Tính bền vững, khả năng chịu lỗi (Hệ thống có thể xử lý các lỗi hoặc dữ liệu đầu vào bất thường mà không bị crash).', 2.5, 0, 0, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id=id;

-- Chèn Flashcard mẫu cho bộ 2 (Web Programming)
INSERT INTO flashcards (deck_id, front, back, ease_factor, `interval`, repetitions, next_review)
VALUES
(2, 'HTTP (HyperText Transfer Protocol)', 'Giao thức truyền tải siêu văn bản, là giao thức truyền nhận dữ liệu nền tảng của mạng WWW.', 2.5, 0, 0, CURRENT_TIMESTAMP),
(2, 'AJAX (Asynchronous JavaScript and XML)', 'Kỹ thuật tải dữ liệu bất đồng bộ từ server mà không cần phải tải lại toàn bộ trang web.', 2.5, 0, 0, CURRENT_TIMESTAMP),
(2, 'CORS (Cross-Origin Resource Sharing)', 'Cơ chế cho phép các trang web gửi yêu cầu truy xuất tài nguyên từ một domain khác với domain của trang hiện tại.', 2.5, 0, 0, CURRENT_TIMESTAMP),
(2, 'Session vs Cookie', 'Cookie lưu trữ dữ liệu ở phía Client (trình duyệt), dễ bị can thiệp. Session lưu trữ trạng thái ở phía Server, Client chỉ giữ Session ID dạng cookie để định danh.', 2.5, 0, 0, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE id=id;
