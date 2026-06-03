# Hướng Dẫn Test Toàn Bộ Luồng Nghiệp Vụ Rental App

Tài liệu này cung cấp các bước chi tiết để kiểm thử (test) bằng Postman toàn bộ quy trình cốt lõi của hệ thống, từ tạo User cho đến lập Hóa đơn tiền nhà.

> [!TIP]
> Hãy cài đặt biến môi trường trong Postman (`{{url}}` = `http://localhost:3000` hoặc port bạn đang chạy) và tự động gán Token vào Headers của các request yêu cầu xác thực.

---

## 1. Xác thực (Auth)

### 1.1 Đăng ký tài khoản (Register)
- **Method:** `POST {{url}}/api/v1/auth/register`
- **Body (JSON):**
```json
{
  "username": "landlord1",
  "email": "landlord1@example.com",
  "password": "Password123"
}
```

### 1.2 Đăng nhập (Login)
- **Method:** `POST {{url}}/api/v1/auth/login`
- **Body (JSON):**
```json
{
  "email": "landlord1@example.com",
  "password": "Password123"
}
```
> [!IMPORTANT]
> Lưu giá trị `accessToken` trả về vào biến môi trường `{{token}}`. Ở các Request bên dưới, nhớ setup Authorization: Bearer Token với `{{token}}`.

---

## 2. Quản lý Cơ sở vật chất

### 2.1 Tạo Tòa nhà (Building)
- **Method:** `POST {{url}}/api/v1/buildings`
- **Body (JSON):**
```json
{
  "name": "Chung cư Mini Xanh",
  "type": "boarding_house",
  "address": {
    "street": "123 Đường A",
    "district": "Quận 1",
    "city": "Hồ Chí Minh"
  },
  "contactPhone": "0901234567"
}
```
*(Lưu lại `_id` của Building thành `{{buildingId}}`)*

### 2.2 Tạo Phòng (Room)
- **Method:** `POST {{url}}/api/v1/rooms`
- **Body (JSON):**
```json
{
  "name": "Phòng 101",
  "buildingId": "{{buildingId}}",
  "price": 3000000,
  "area": 25,
  "maxCapacity": 2,
  "status": "available"
}
```
*(Lưu lại `_id` của Room thành `{{roomId}}`)*

---

## 3. Quản lý Khách thuê và Hợp đồng

### 3.1 Thêm Khách thuê (Tenant)
- **Method:** `POST {{url}}/api/v1/tenants`
- **Body (JSON):**
```json
{
  "fullName": "Nguyễn Văn A",
  "identityCard": "012345678912",
  "phoneNumber": "0987654321",
  "homeTown": "Hà Nội",
  "roomId": "{{roomId}}"
}
```
*(Lưu lại `_id` của Tenant thành `{{tenantId}}`)*

### 3.2 Tạo Hợp đồng (Contract)
- **Method:** `POST {{url}}/api/v1/contracts`
- **Body (JSON):**
```json
{
  "roomId": "{{roomId}}",
  "tenantId": "{{tenantId}}",
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "deposit": 3000000,
  "monthlyPrice": 3000000,
  "electricityPrice": 3500,
  "waterPrice": 100000
}
```
*(Lưu lại `_id` của Contract thành `{{contractId}}`)*

> [!NOTE]
> Sau bước này, API sẽ báo tạo thành công với `contractCode` tự sinh. Hãy kiểm tra lại API Get Room để thấy phòng đã chuyển trạng thái sang `rented`.

---

## 4. Kiểm thử Chốt Số (Meter Reading)

### 4.1 Chốt số tháng 1 (Khởi tạo)
- **Method:** `POST {{url}}/api/v1/meter-readings`
- **Body (JSON):**
```json
{
  "contractId": "{{contractId}}",
  "month": 1,
  "year": 2024,
  "electricity": {
    "newIndex": 150
  }
}
```
*Lưu ý: Bạn có thể thử không truyền `water.newIndex` để test chức năng thu tiền nước khoán.*

### 4.2 Cố tình chốt số lại tháng 1 (Test Chống trùng)
- Gửi lại request 4.1. Hệ thống phải quăng lỗi `400`: *"Phiếu chốt số cho tháng này đã tồn tại."*

### 4.3 Chốt số tháng 2 (Test Kế thừa & Tăng tiến)
- **Method:** `POST {{url}}/api/v1/meter-readings`
- **Body (JSON):**
```json
{
  "contractId": "{{contractId}}",
  "month": 2,
  "year": 2024,
  "electricity": {
    "newIndex": 130
  }
}
```
- **Kết quả mong đợi:** Quăng lỗi do `newIndex` (130) nhỏ hơn `oldIndex` (150 từ tháng 1). Bạn hãy đổi lại `newIndex` thành `200` để pass qua lỗi này. Khi tạo thành công, `oldIndex` sẽ tự động là `150`.

---

## 5. Kiểm thử Hóa đơn (Invoice)

### 5.1 Cố tình xuất hóa đơn tháng 3 (Test Khóa)
- **Method:** `POST {{url}}/api/v1/invoices`
- **Body (JSON):**
```json
{
  "contractId": "{{contractId}}",
  "month": 3,
  "year": 2024
}
```
- **Kết quả mong đợi:** Lỗi `400` do tháng 3 chưa chốt số.

### 5.2 Xuất hóa đơn tháng 2 (Thành công)
- **Method:** `POST {{url}}/api/v1/invoices`
- **Body (JSON):**
```json
{
  "contractId": "{{contractId}}",
  "month": 2,
  "year": 2024,
  "otherFees": [
    { "name": "Rác", "amount": 50000 },
    { "name": "Wifi", "amount": 100000 }
  ],
  "discount": 20000
}
```
- **Kết quả mong đợi:** Hóa đơn tạo thành công với `totalAmount` được tính tự động từ (tiền phòng + điện + nước + phụ phí - giảm giá). *(Lưu `_id` của Invoice thành `{{invoiceId}}`)*

### 5.3 Chốt (Issue) Hóa đơn
- **Method:** `PATCH {{url}}/api/v1/invoices/{{invoiceId}}/status`
- **Body (JSON):**
```json
{
  "status": "issued"
}
```

### 5.4 Quay lại sửa chốt số tháng 2 (Test Khóa chéo)
- **Method:** `PATCH {{url}}/api/v1/meter-readings/{{meterReadingId_thang_2}}`
- **Body (JSON):**
```json
{
  "electricity": { "newIndex": 300 }
}
```
- **Kết quả mong đợi:** Bị block ngay lập tức với lỗi `400`: *"Phiếu chốt số đã được lập hóa đơn chính thức, không thể thay đổi hoặc xóa."* 

---

## 6. Kiểm thử Thống kê Dashboard (Overview)

### 6.1 Lấy dữ liệu Dashboard
- **Method:** `GET {{url}}/api/v1/dashboard/overview`
- **Body:** *(Không có)*
- **Kết quả mong đợi:** Hệ thống sẽ chạy đồng thời 6 luồng truy vấn (tốc độ rất nhanh, thường dưới 100ms) và trả về một Object chứa toàn bộ thông tin thống kê:
  - `roomStats`: Số lượng phòng, số phòng đang thuê, tỷ lệ lấp đầy.
  - `revenue.currentMonth` và `previousMonth`: Tổng doanh thu (các hóa đơn có trạng thái `paid`).
  - `totalDebt`: Tổng nợ (các hóa đơn có trạng thái `issued`).
  - `revenueChart`: Mảng doanh thu 6 tháng gần nhất.
  - `overdueInvoices`: Danh sách hóa đơn trễ hạn (`dueDate < today`).
  - `expiringContracts`: Danh sách hợp đồng sắp hết hạn trong vòng 30 ngày.

> [!TIP]
> Bạn có thể thử đổi trạng thái của các Hóa đơn (Invoice) từ `issued` sang `paid`, đổi ngày `dueDate` của Hóa đơn thành quá khứ, hoặc đổi `endDate` của hợp đồng thành tháng này trong MongoDB Compass, sau đó call lại API Dashboard để thấy sự thay đổi số liệu theo thời gian thực một cách cực kỳ trực quan!

---

## 7. Kiểm thử Notification & Cron Jobs

### 7.1 Lấy danh sách Thông báo (Phân trang & Lọc)
- **Method:** `GET {{url}}/api/v1/notifications?page=1&limit=10` (có thể thêm `&isRead=false` để lọc chưa đọc).
- **Body:** *(Không có)*
- **Kết quả mong đợi:** Trả về danh sách thông báo của tài khoản (sắp xếp mới nhất lên đầu) kèm thông tin phân trang.

### 7.2 Lấy số lượng Thông báo chưa đọc (Badge)
- **Method:** `GET {{url}}/api/v1/notifications/unread-count`
- **Body:** *(Không có)*
- **Kết quả mong đợi:** Trả về `{ count: X }` với X là số lượng thông báo `isRead: false`.

### 7.3 Đánh dấu đã đọc một Thông báo
- **Method:** `PATCH {{url}}/api/v1/notifications/:id/read`
- **Body:** *(Không có)*
- **Kết quả mong đợi:** Trạng thái `isRead` của thông báo tương ứng được cập nhật thành `true` và `readAt` mang giá trị timestamp.

### 7.4 Đánh dấu đã đọc tất cả Thông báo
- **Method:** `PATCH {{url}}/api/v1/notifications/read-all`
- **Body:** *(Không có)*
- **Kết quả mong đợi:** Tất cả các thông báo chưa đọc của user hiện tại đều được cập nhật thành `isRead: true`.

### 7.5 Kiểm tra Trigger Tự động
Để kiểm tra cơ chế Trigger thông báo có hoạt động không:
1. Bạn hãy chạy API **Tạo mới Hóa đơn** (như hướng dẫn ở Phần 4).
2. Sau khi tạo xong, chạy lại API `GET {{url}}/api/v1/notifications/unread-count`, bạn sẽ thấy count tăng thêm 1.
3. Chạy tiếp API `GET {{url}}/api/v1/notifications`, bạn sẽ thấy có một thông báo loại `NEW_INVOICE` ở trên cùng, trong phần `metadata` có chứa chính xác `invoiceId` của hóa đơn vừa tạo.
4. Tương tự, nếu bạn chạy API **Cập nhật trạng thái Hóa đơn** thành `paid`, hệ thống sẽ bắn ra một thông báo `INVOICE_PAID`.

> [!TIP]
> **Test Cron Job:** Cron Job được cấu hình chạy ngầm lúc 00:00 sáng mỗi ngày. Nếu bạn muốn kiểm tra xem tính năng nhắc nợ có chạy thành công không, bạn hãy mở file `src/scripts/cronJobs.js`, sửa dòng `cron.schedule("0 0 * * *", ...)` thành `cron.schedule("* * * * *", ...)` (chạy mỗi phút). Sau đó Restart server, mở MongoDB Compass sửa một Hóa đơn (issued) có `dueDate` là ngày hôm qua, và ngồi chờ tối đa 1 phút, thông báo `OVERDUE_INVOICE` sẽ lập tức xuất hiện ở API Get Notifications!

---

## 8. Hướng dẫn Test MongoDB Transaction & Rollback

Hệ thống đã tích hợp MongoDB Transaction tại 2 API: **Tạo Hợp đồng** và **Tạo Hóa đơn**. Điều này đảm bảo tính toàn vẹn dữ liệu cực cao: Mọi truy vấn sửa đổi DB chỉ thực sự được lưu khi toàn bộ khối lệnh hoàn thành không lỗi. Nếu có bất kỳ sự cố nào ở giữa luồng (lỗi logic, lỗi mạng, DB sập), toàn bộ sẽ bị Rollback.

> [!IMPORTANT]
> **Yêu cầu môi trường:** MongoDB của bạn BẮT BUỘC phải đang chạy ở chế độ **Replica Set** hoặc **MongoDB Atlas**. Nếu dùng Standalone (như localhost mặc định), khi gọi API sẽ trả về lỗi `Transaction numbers are only allowed on a replica set member...`.

### 8.1 Giả lập Lỗi Rollback khi Tạo Hợp đồng

Bình thường, logic Tạo Hợp đồng diễn ra theo các bước:
1. Validate (check phòng trống, check người thuê).
2. Tạo Hợp đồng mới (Contract).
3. Đổi trạng thái Phòng (Room) thành `rented`.

**Cách test:** Hãy cố tình "phá" luồng số 3 để xem Hợp đồng có bị thu hồi không.
1. Mở file `src/services/contract.service.js`.
2. Tìm đến hàm `createContractService`, tìm đoạn code cập nhật trạng thái phòng:
   ```javascript
   room.status = "rented";
   await room.save({ session });
   ```
3. Chèn ngay bên dưới dòng đó một dòng lệnh gây lỗi giả lập:
   ```javascript
   room.status = "rented";
   await room.save({ session });
   
   // DÒNG CODE GIẢ LẬP LỖI ĐỂ KIỂM TRA ROLLBACK
   throw new Error("LỖI GIẢ LẬP: Mạng bị đứt trước khi commit!");
   ```
4. Lưu file và gọi API **Tạo mới Hợp đồng** qua Postman.
5. **Kết quả mong đợi:** 
   - Postman sẽ trả về lỗi 500 kèm nội dung "LỖI GIẢ LẬP: Mạng bị đứt trước khi commit!".
   - Mở MongoDB Compass, vào collection `contracts`: Bạn sẽ KHÔNG TÌM THẤY hợp đồng vừa tạo (vì nó đã bị Rollback xóa đi).
   - Kiểm tra collection `rooms`: Trạng thái của phòng đó VẪN LÀ `available` (mặc dù code `room.save()` đổi sang `rented` đã được chạy qua trước khi throw lỗi).

### 8.2 Giả lập Lỗi Rollback khi Tạo Hóa đơn

Tương tự, logic Tạo Hóa đơn diễn ra theo các bước:
1. Đọc dữ liệu (Hợp đồng, Người thuê, Phiếu chốt số).
2. Tạo Hóa đơn mới (Invoice).
3. Tạo Thông báo (Notification).

**Cách test:** Cố tình ném lỗi sau bước 2 để xem Hóa đơn có bị thu hồi không.
1. Mở file `src/services/invoice.service.js`.
2. Tìm đến hàm `createInvoiceService`, đoạn bọc khối lệnh Notification:
   ```javascript
   const newInvoices = await invoiceModel.create([newInvoiceData], { session });
   const newInvoice = newInvoices[0];
   
   // DÒNG CODE GIẢ LẬP LỖI ĐỂ KIỂM TRA ROLLBACK
   throw new Error("LỖI GIẢ LẬP: Database sập trước khi tạo Notification!");
   ```
3. Lưu file và gọi API **Tạo mới Hóa đơn** qua Postman.
4. **Kết quả mong đợi:**
   - Trả về lỗi 500 với text giả lập.
   - Hóa đơn (Invoice) dù đã được gọi `create` nhưng sẽ BỊ BIẾN MẤT hoàn toàn khỏi CSDL, không để lại rác.

> [!TIP]
> Sau khi test và tận mắt chứng kiến sức mạnh bảo vệ dữ liệu của Transaction, đừng quên **XÓA các dòng `throw new Error()`** để API hoạt động lại bình thường nhé!

---

## 9. Hướng dẫn Test Quên mật khẩu & Đặt lại mật khẩu

Để test chức năng này, trước tiên bạn cần cấu hình thư gửi đi (SMTP) trong file `.env` ở thư mục Backend. Nếu dùng Gmail, bạn hãy tạo một **App Password (Mật khẩu ứng dụng)** và cấu hình như sau:

```env
EMAIL_USERNAME=email_cua_ban@gmail.com
EMAIL_PASSWORD=mat_khau_ung_dung_cua_ban
FRONTEND_URL=http://localhost:3000
```

### 9.1 Test API Quên Mật Khẩu (Forgot Password)
- **Method:** `POST {{url}}/api/v1/auth/forgot-password`
- **Body (JSON):**
  ```json
  {
      "email": "email_user_da_dang_ky@gmail.com"
  }
  ```
- **Kết quả mong đợi:** 
  - API trả về 200 OK với message *"Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn"*.
  - Kiểm tra Hộp thư đến (Inbox) của Email bạn vừa nhập. Sẽ có một email từ "Hệ thống Quản lý Trọ" chứa đường link Reset Password. 
  - Hãy copy đoạn **Token** (chuỗi ký tự dài ngoằng) nằm ở cuối đường link trong Email.

### 9.2 Test API Đặt lại Mật Khẩu (Reset Password)
- **Method:** `PUT {{url}}/api/v1/auth/reset-password/:token`
  - *(Thay `:token` trên URL bằng mã Token bạn vừa copy từ Email)*
- **Body (JSON):**
  ```json
  {
      "password": "new_password_123"
  }
  ```
- **Kết quả mong đợi:**
  - API trả về 200 OK với message *"Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."*
  - Lúc này, DB sẽ xóa trắng Token cũ và băm mật khẩu mới. Bạn có thể sử dụng mật khẩu mới này để gọi API `POST /api/v1/auth/login` kiểm chứng.

> [!TIP]
> **Test Lỗi (Edge Cases):**
> - Thử điền email chưa từng đăng ký ở API Forgot Password -> Báo lỗi 404.
> - Thử lấy mã Token cũ vừa xài thành công, gọi API Reset Password lần 2 -> Báo lỗi 400 *"Token không hợp lệ hoặc đã hết hạn"*.
> - Thử sửa đổi một vài ký tự trong mã Token -> Báo lỗi 400.
> - (Nâng cao) Để test tính năng tự động thu hồi Token khi gửi mail lỗi, hãy thay một `EMAIL_PASSWORD` sai vào `.env`, khởi động lại server và gọi API Forgot Password. Hệ thống sẽ báo lỗi 500. Lúc này mở CSDL lên, bạn sẽ thấy `passwordResetToken` không hề bị kẹt lại trong bảng User.

**(End of Test)**
