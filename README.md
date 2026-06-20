# 🧠 HustMemo - Ứng dụng ôn tập Flashcard thông minh (Spaced Repetition)
**HustMemo** là một ứng dụng web hỗ trợ học tập và ghi nhớ kiến thức hiệu quả bằng phương pháp **Lặp lại ngắt quãng (Spaced Repetition)** thông qua các bộ thẻ flashcard. Hệ thống tự động tính toán thời điểm tối ưu để ôn tập lại từng thẻ dựa trên thuật toán **SM-2**, giúp kiến thức được chuyển vào trí nhớ dài hạn một cách tự nhiên và bền vững nhất.
---
## 🚀 Tính năng nổi bật
### 1. 🔑 Xác thực người dùng (Authentication)
* Đăng ký tài khoản học tập cá nhân mới.
* Đăng nhập an toàn, bảo mật phiên làm việc bằng Session & Cookie.
* Bảo vệ các tuyến đường (Protected Routes) ngăn chặn truy cập trái phép.
* Trang quản lý hồ sơ: Cập nhật thông tin cá nhân và thay đổi mật khẩu.
### 2. 🗂️ Quản lý Bộ thẻ & Thẻ Flashcard (CRUD)
* Tạo mới, cập nhật thông tin (tên, mô tả) hoặc xóa các bộ thẻ (Decks) cá nhân.
* Thêm mới thẻ flashcard (mặt trước là câu hỏi/từ khóa, mặt sau là câu trả lời/định nghĩa), chỉnh sửa hoặc xóa thẻ trong bộ thẻ.
### 3. 🧠 Ôn tập thông minh với Thuật toán SM-2 (SuperMemo-2)
* Trình học hiển thị các thẻ đến hạn cần ôn tập (`next_review` đến hạn).
* Người học tự đánh giá mức độ thuộc bài qua 3 mức độ phản hồi:
  * 🔴 **Hard (Khó):** Đặt lại số lần lặp, lên lịch ôn lại vào ngày mai, giảm độ dễ (`ease_factor`).
  * 🟡 **Medium (Trung bình):** Tăng khoảng cách ngày ôn tiếp theo dựa trên hệ số dễ hiện tại.
  * 🟢 **Easy (Dễ):** Tăng nhanh khoảng cách ngày ôn tập tiếp theo, tăng hệ số dễ (`ease_factor`).
### 📚 4. Thư viện bộ thẻ dùng chung (Shared Library)
* Xem danh sách các bộ thẻ mẫu được biên soạn sẵn (Tiếng Nhật N5, Lịch sử Việt Nam, Lập trình Python,...).
* Sao chép (Clone) bộ thẻ từ thư viện công cộng về kho cá nhân để học tập riêng.
### 📊 5. Dashboard & Analytics trực quan
* Theo dõi số bộ thẻ, tổng số thẻ và số thẻ cần ôn tập trong ngày.
* Thống kê chi tiết số thẻ theo 3 mức độ thuần thục: *Thẻ mới*, *Đang học*, và *Đã thuần thục*.
* Biểu đồ hoạt động học tập trong 7 ngày gần nhất.
* **Activity Heatmap (Bản đồ đóng góp):** Trực quan hóa tiến độ học tập hàng ngày trong cả năm (tương tự đồ thị đóng góp của GitHub).
---
## 🏗️ Công nghệ sử dụng (Tech Stack)
* **Backend:** Node.js, Express.js (Xây dựng RESTful API)
* **Frontend:** HTML5, CSS3, JavaScript thuần (Vanilla JS) kết hợp Fetch API để gọi dữ liệu bất đồng bộ.
* **Database:** MySQL (Hỗ trợ chế độ tự động chạy trên bộ nhớ Mock tạm thời nếu không có kết nối cơ sở dữ liệu).
* **Mã hóa:** `bcryptjs` mã hóa mật khẩu người dùng.
* **Quản lý Session:** `express-session` & `session-file-store`.
---
## 💻 Hướng dẫn cài đặt và khởi chạy dự án
### 📋 Yêu cầu hệ thống
* Đã cài đặt **Node.js** (Khuyến nghị phiên bản 16.x trở lên).
* Cơ sở dữ liệu **MySQL** (Có thể dùng XAMPP, WampServer hoặc MySQL Server).
### 🛠️ Các bước triển khai
#### Bước 1: Tải mã nguồn dự án
Tải thư mục dự án hoặc sử dụng Git để clone về máy:
```bash
git clone <url-kho-chua-cua-ban>
cd hustmemo
```
#### Bước 2: Cài đặt các thư viện phụ thuộc
Chạy lệnh sau tại thư mục gốc của dự án để tải về các package cần thiết:
```bash
npm install
```
#### Bước 3: Khởi tạo Cơ sở dữ liệu (MySQL)
1. Mở phần mềm quản lý MySQL của bạn (ví dụ: phpMyAdmin tại `http://localhost/phpmyadmin`).
2. Tạo một cơ sở dữ liệu mới tên là `hustmemo`.
3. Nhập (Import) tệp tin SQL mẫu nằm tại đường dẫn: `database/hustmemo.sql`.
*(Tệp tin này đã tạo sẵn cấu trúc bảng và chèn một số dữ liệu mẫu về người dùng, bộ thẻ để bạn kiểm thử. Tài khoản kiểm thử mặc định: Tên đăng nhập `admin` / Mật khẩu `123456`).*
#### Bước 4: Khởi động Server
Chạy lệnh sau để khởi động máy chủ ứng dụng:
```bash
npm start
```
Nếu bạn muốn chạy ở chế độ phát triển (tự động khởi động lại nếu có thay đổi trong code), hãy chạy:
```bash
npm run dev
```
#### Bước 5: Truy cập ứng dụng
Mở trình duyệt web của bạn và truy cập vào đường dẫn:
```text
http://localhost:3000
```
---
## 📁 Cấu trúc thư mục chính của dự án
```text
hustmemo/
│
├── database/
│   └── hustmemo.sql        # Script tạo cấu trúc database & dữ liệu mẫu ban đầu
│
├── public/                 # Thư mục chứa giao diện Frontend tĩnh
│   ├── css/                # Các file định dạng CSS cho từng giao diện riêng biệt
│   ├── js/                 # Logic xử lý gọi API & thao tác DOM ở client
│   ├── dashboard.html      # Giao diện Trang chủ & Bảng điều khiển chính
│   ├── deck.html           # Giao diện quản lý bộ thẻ & thêm/sửa flashcard
│   ├── study.html          # Giao diện học tập, lật thẻ & chấm điểm thẻ
│   ├── library.html        # Giao diện thư viện công cộng
│   ├── analytics.html      # Giao diện xem thống kê tiến trình học tập
│   └── profile.html        # Giao diện thay đổi thông tin cá nhân
│
├── sessions/               # Thư mục tự động tạo để chứa các file session người dùng
├── server.js               # File cấu hình Server Express & định tuyến toàn bộ APIs
├── package.json            # Cấu hình dự án NodeJS & liệt kê các dependencies
└── .gitignore              # Chỉ định các tệp và thư mục Git cần bỏ qua
```
---
*Chúc bạn có những trải nghiệm học tập hiệu quả với HustMemo!*
