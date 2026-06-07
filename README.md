# 🏠 Hệ Thống Quản Lý Phòng Trọ & Tòa Nhà Cho Thuê (Full-stack Rental Management System)

Chào mừng bạn đến với **Hệ thống Quản lý Phòng trọ & Tòa nhà Cho thuê**. Đây là một ứng dụng Web Full-stack toàn diện được thiết kế giúp các chủ trọ (Landlords) số hóa toàn bộ quy trình vận hành nhà cho thuê và khách thuê (Tenants) dễ dàng theo dõi hóa đơn, hợp đồng và dịch vụ trực tuyến.

Hệ thống được xây dựng trên mô hình phân lớp rõ ràng, đảm bảo tính mở rộng cao, tích hợp bộ nhớ đệm Redis để tối ưu hiệu năng và áp dụng các biện pháp bảo mật hiện đại.

---

## 🚀 Tính Năng Chính

### 👨‍💼 Phân Hệ Cho Chủ Trọ (Landlord Portal)
* **Bảng điều khiển Thống kê (Dashboard):**
  * Thống kê tổng số phòng, số phòng trống, số phòng đã thuê và tỷ lệ lấp đầy.
  * Theo dõi công nợ, tổng số hóa đơn chưa thanh toán.
  * Biểu đồ trực quan hóa doanh thu thu thực tế trong 6 tháng gần nhất (Sử dụng Recharts).
  * Danh sách cảnh báo hợp đồng sắp hết hạn (trong vòng 30 ngày) và hóa đơn quá hạn đóng tiền.
* **Quản lý Tòa nhà & Phòng trọ:**
  * CRUD tòa nhà (tên, địa chỉ, loại hình, dịch vụ đi kèm).
  * CRUD phòng trọ thuộc tòa nhà (tên phòng, diện tích, giá thuê, sức chứa tối đa, trạng thái: Trống, Đang thuê, Bảo trì).
  * **Cơ chế Phân trang đồng bộ phía máy chủ (Server-side Pagination):** Giảm tải lưu lượng mạng, loại bỏ lỗi gọi API trùng lặp (Double Fetch) và chống tranh chấp phản hồi (Race Condition).
* **Quản lý Hợp đồng thuê nhà:**
  * Tạo mới hợp đồng liên kết giữa Tòa nhà, Phòng và Khách thuê.
  * Thiết lập thời hạn thuê, giá thuê cố định, tiền đặt cọc và ngày bắt đầu/ngày kết thúc.
  * Tự động cập nhật trạng thái phòng thành "Đang thuê" khi hợp đồng có hiệu lực.
* **Quản lý Chỉ số Điện & Nước (Meter Reading):**
  * Chốt chỉ số điện và nước tiêu thụ hàng tháng của từng phòng.
  * Ràng buộc dữ liệu nghiêm ngặt: Không cho phép nhập chỉ số mới nhỏ hơn chỉ số cũ của tháng trước.
* **Quản lý Hóa đơn & Thanh toán:**
  * Tự động khởi tạo hóa đơn tháng dựa trên tiền phòng cố định và mức tiêu thụ điện nước thực tế nhân với đơn giá dịch vụ của tòa nhà.
  * Trạng thái hóa đơn linh hoạt: Nháp (Draft), Đã phát hành (Issued), Đã thanh toán (Paid), Quá hạn (Overdue).
  * Xuất file ảnh hóa đơn chuyên nghiệp để gửi trực tiếp cho khách qua Zalo/Facebook.

### 🧑‍🎓 Phân Hệ Cho Khách Thuê (Tenant Portal)
* **Đăng ký & Đăng nhập tài khoản cá nhân:** Đăng ký trực tuyến để trở thành khách thuê trên hệ thống.
* **Thuê phòng trực tuyến:** Tra cứu danh sách phòng trống trên "Marketplace" công khai và thực hiện thao tác thuê phòng trực tuyến.
* **Cổng thông tin khách thuê (Dashboard):**
  * Theo dõi chỉ số điện nước đã tiêu thụ qua các tháng dạng biểu đồ.
  * Xem danh sách hóa đơn cần thanh toán kèm theo mã QR thanh toán nhanh.
  * Theo dõi thời hạn hợp đồng thuê nhà hiện tại.

---

## 🛠️ Công Nghệ Sử Dụng

### 🖥️ Frontend (Giao diện người dùng)
* **Thư viện cốt lõi:** React 19, Redux Toolkit (Quản lý trạng thái toàn cục), React Router v7 (Điều hướng trang).
* **Giao diện & Style:** Tailwind CSS v4, Lucide Icons (Hệ thống icon vector), Recharts (Biểu đồ thống kê).
* **HTTP Client:** Axios (Tích hợp interceptors tự động gắn JWT và xử lý cơ chế làm mới Token - Refresh Token khi hết hạn).
* **Công cụ xây dựng:** Vite (Hỗ trợ HMR cực nhanh).

### ⚙️ Backend (API Server)
* **Môi trường & Framework:** Node.js, Express.js (RESTful API).
* **Cơ sở dữ liệu:** MongoDB kết hợp Mongoose ODM.
* **Caching (Bộ nhớ đệm):** Redis (Cache danh sách tòa nhà, danh sách phòng, chi tiết phòng, tăng tốc độ phản hồi API dưới 50ms).
* **Bảo mật:**
  * Mã hóa mật khẩu một chiều bằng Bcrypt.
  * Xác thực người dùng bằng JWT (Access Token thời hạn ngắn & Refresh Token lưu trữ trong Cookie HttpOnly an toàn).
  * Helmet (Bảo vệ HTTP headers), CORS (Giới hạn nguồn gốc truy cập), Express Rate Limit (Chống tấn công Brute-force/DDoS).
* **Tự động hóa (Cron Jobs):** Sử dụng `node-cron` quét định kỳ hàng ngày vào lúc 00:00 (giờ Việt Nam) để cập nhật hợp đồng hết hạn và gửi cảnh báo hóa đơn quá hạn.

---

## 📂 Cấu Trúc Mã Nguồn

```text
fullstack-rental/
├── docker-compose.yml       # Docker compose chạy Redis cục bộ
├── rental-backend/          # Mã nguồn API Server (Node.js/Express)
│   ├── src/
│   │   ├── config/          # Cấu hình DB, Redis, Environment, Cloudinary
│   │   ├── constants/       # Định nghĩa hằng số hệ thống (Roles, Trạng thái)
│   │   ├── controllers/     # Lớp điều khiển xử lý HTTP Requests
│   │   ├── middlewares/     # Bộ lọc bảo mật, xác thực (Auth), xử lý File (Multer)
│   │   ├── models/          # Lớp định nghĩa cấu trúc MongoDB Schema
│   │   ├── repositories/    # Lớp trừu tượng hóa thao tác Cơ sở dữ liệu (Base Repository pattern)
│   │   ├── routes/          # Định nghĩa các endpoints API v1
│   │   ├── services/        # Lớp xử lý Logic nghiệp vụ chính (Business Logic)
│   │   ├── utils/           # Các hàm tiện ích (Bảo mật, cache, định dạng dữ liệu)
│   │   └── Server.js        # Điểm khởi chạy API Server chính
│   └── tests/               # Bộ Integration tests & Unit tests
└── rental-frontend/         # Mã nguồn Single Page Application (React/Vite)
    ├── src/
    │   ├── components/      # Các UI components dùng chung (Modal, Button, Pagination...)
    │   ├── context/         # React Context toàn cục (Auth Context)
    │   ├── features/        # Các components đặc thù theo nghiệp vụ (Room, Tenant, Invoice...)
    │   ├── hooks/           # Các Custom hooks dùng chung
    │   ├── layout/          # Giao diện khung (Sidebar, Topbar, Layout Tenant/Admin)
    │   ├── pages/           # Các trang giao diện chính
    │   ├── redux/           # Cấu hình Redux store & Slices
    │   └── services/        # Lớp gọi API thông qua Axios Client
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 📋 Yêu Cầu Hệ Thống Trước Khi Cài Đặt
1. **Node.js:** Phiên bản `>= 18.x` (Khuyến nghị sử dụng LTS).
2. **MongoDB:** Một MongoDB Atlas Cluster trực tuyến hoặc MongoDB chạy cục bộ.
3. **Redis:** Đang chạy trên cổng mặc định `6379`.
4. **Docker Desktop** (Nếu muốn chạy Redis nhanh thông qua Docker Compose).

---

### Step 1: Khởi động Redis
Nếu bạn đã cài đặt Docker, hãy mở terminal tại thư mục gốc của dự án (`fullstack-rental`) và chạy lệnh sau để khởi động Redis Container:

```bash
docker-compose up -d
```

---

### Step 2: Cài đặt và Cấu hình Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd rental-backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` bằng cách copy từ file mẫu:
   ```bash
   cp .env.example .env
   ```
4. Mở file `.env` vừa tạo và điền các thông tin kết nối của bạn:
   ```env
   PORT=5000
   NODE_ENV=development
   
   # Chuỗi kết nối MongoDB của bạn
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/rental?retryWrites=true&w=majority
   
   # Cấu hình JWT
   JWT_ACCESSTOKEN_SECRET=your_jwt_access_secret_key_here
   JWT_ACCESSTOKEN_EXPIRES_IN=30m
   JWT_REFRESHTOKEN_SECRET=your_jwt_refresh_secret_key_here
   JWT_REFRESHTOKEN_EXPIRES_IN=7d
   
   # Cấu hình dịch vụ lưu trữ ảnh Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Cấu hình SMTP gửi Email (ví dụ dùng Gmail App Password)
   EMAIL_USERNAME=your_gmail@gmail.com
   EMAIL_PASSWORD=your_gmail_app_password
   
   # URL Frontend để cấu hình CORS
   FRONTEND_URL=http://localhost:5173
   
   # Chuỗi kết nối Redis cục bộ
   REDIS_URL=redis://localhost:6379
   ```

5. **Khởi tạo cơ sở dữ liệu (Database Seeding):** 
   Trước khi chạy ứng dụng lần đầu tiên, bạn cần khởi tạo các quyền truy cập (Roles) trong MongoDB bằng cách chạy script seed:
   ```bash
   npm run seed:roles
   ```

6. Khởi động server Backend ở chế độ phát triển (Development mode):
   ```bash
   npm run dev
   ```
   *Lúc này, server API sẽ lắng nghe tại địa chỉ: `http://localhost:5000`*

---

### Step 3: Cài đặt và Cấu hình Frontend

1. Mở một terminal mới và di chuyển vào thư mục frontend:
   ```bash
   cd rental-frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env`:
   ```bash
   cp .env.example .env
   ```
4. Mở file `.env` và chắc chắn địa chỉ API khớp với cổng chạy backend:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   ```
5. Khởi động server Frontend ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *Ứng dụng Web sẽ chạy trên trình duyệt tại địa chỉ mặc định: `http://localhost:5173`*

---

## 🧪 Kiểm Thử & Biên Dịch

### Chạy Kiểm thử Backend (Unit & Integration Tests)
Backend tích hợp bộ kiểm thử tự động gồm 53 bài test kiểm tra tất cả các dịch vụ (Room, Tenant, Contract, Invoice, User, Auth):
```bash
cd rental-backend
npm test
```

### Biên dịch Frontend cho Production
Kiểm tra khả năng đóng gói sản phẩm của giao diện người dùng:
```bash
cd rental-frontend
npm run build
```
*Mã nguồn tối ưu sau khi biên dịch sẽ nằm trong thư mục `/dist`.*

---

## 🔒 Bản Quyền & Giấy Phép
Dự án được phát triển nhằm mục đích quản lý nhà cho thuê và học tập. Vui lòng liên hệ tác giả nếu có nhu cầu đóng góp hoặc mở rộng hệ thống.
