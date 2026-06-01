# 📮 Hướng Dẫn Test Postman — Rental Backend API

> **Base URL:** `http://localhost:5000/api/v1`
>
> **Yêu cầu trước khi test:**
> 1. MongoDB đang chạy
> 2. Chạy `npm run seed:roles` để tạo role "User" và "Admin"
> 3. Chạy `npm run dev` để start server
> 4. Cấu hình Cloudinary trong `.env` (nếu test upload avatar)

---

## 📋 Mục Lục

1. [Cấu hình Postman](#1-cấu-hình-postman)
2. [Auth APIs](#2-auth-apis)
3. [User APIs](#3-user-apis)
4. [Upload APIs](#4-upload-apis)
5. [Building APIs](#5-building-apis)
6. [Test Validation (Joi)](#6-test-validation-joi)
7. [Test Error Cases](#7-test-error-cases)

---

## 1. Cấu Hình Postman

### Tạo Environment

Vào **Environments** → **New Environment** → đặt tên `Rental Local`, thêm các biến:

| Variable        | Initial Value                          |
|-----------------|----------------------------------------|
| `base_url`      | `http://localhost:5000/api/v1`         |
| `access_token`  | _(để trống, sẽ tự động set sau login)_ |
| `refresh_token` | _(để trống)_                           |
| `user_id`       | _(để trống)_                           |
| `building_id`   | _(để trống)_                           |
| `building_slug` | _(để trống)_                           |

### Auto-set Token sau Login

Vào tab **Tests** (hoặc **Scripts > Post-response**) của request Login, dán đoạn script sau:

```javascript
if (pm.response.code === 200) {
    const json = pm.response.json();
    pm.environment.set("access_token", json.data.accessToken);
    pm.environment.set("user_id", json.data.user._id);
}
```

### Cấu hình Authorization chung

Tại **Collection** → tab **Authorization**:
- Type: `Bearer Token`
- Token: `{{access_token}}`

Tất cả request con sẽ **Inherit from parent** (không cần set lại token cho từng request).

---

## 2. Auth APIs

### 2.1 Register — Đăng ký tài khoản

```
POST {{base_url}}/auth/register
```

**Headers:**
| Key          | Value            |
|--------------|------------------|
| Content-Type | application/json |

**Body (raw → JSON):**

```json
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "123456"
}
```

**Expected Response — 201 Created:**

```json
{
    "statusCode": 201,
    "message": "User registered successfully",
    "data": {
        "userId": "665...",
        "username": "johndoe",
        "email": "john@example.com"
    }
}
```

> 💡 **Tip:** Đăng ký thêm 1 tài khoản nữa để test các case khác:
> ```json
> {
>     "username": "janedoe",
>     "email": "jane@example.com",
>     "password": "123456"
> }
> ```

---

### 2.2 Login — Đăng nhập

```
POST {{base_url}}/auth/login
```

**Body (raw → JSON):**

```json
{
    "email": "john@example.com",
    "password": "123456"
}
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Login successful",
    "data": {
        "accessToken": "eyJhbGci...",
        "user": {
            "_id": "665...",
            "username": "johndoe",
            "email": "john@example.com",
            "slug": "johndoe",
            "role": {
                "_id": "...",
                "name": "User"
            },
            "status": "active"
        }
    }
}
```

> ⚠️ **Quan trọng:** Copy giá trị `accessToken` vào biến `{{access_token}}` và `_id` vào `{{user_id}}` (hoặc dùng script tự động ở trên).

---

### 2.3 Get Me — Lấy thông tin user đang đăng nhập

```
GET {{base_url}}/auth/me
```

**Authorization:** Bearer Token → `{{access_token}}`

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "User profile retrieved successfully",
    "data": {
        "_id": "665...",
        "username": "johndoe",
        "email": "john@example.com",
        "slug": "johndoe",
        "role": {
            "_id": "...",
            "name": "User",
            "permissions": []
        },
        "status": "active"
    }
}
```

---

### 2.4 Refresh Token — Làm mới Access Token

```
POST {{base_url}}/auth/refresh-token
```

**Body (raw → JSON):**

```json
{
    "refreshToken": "{{refresh_token}}"
}
```

> 💡 Hoặc nếu server set cookie, Postman sẽ tự gửi cookie `refreshToken`.

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Access token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGci..."
    }
}
```

---

### 2.5 Logout — Đăng xuất

```
POST {{base_url}}/auth/logout
```

**Body (raw → JSON):**

```json
{
    "refreshToken": "{{refresh_token}}"
}
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Logged out successfully"
}
```

---

## 3. User APIs

> ⚠️ **Tất cả User APIs đều yêu cầu đăng nhập.** Đảm bảo `{{access_token}}` đã được set.

### 3.1 Get User By ID

```
GET {{base_url}}/users/{{user_id}}
```

**Authorization:** Bearer Token → `{{access_token}}`

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "User retrieved successfully",
    "data": {
        "_id": "665...",
        "username": "johndoe",
        "email": "john@example.com",
        "slug": "johndoe",
        "avatar": null,
        "role": {
            "_id": "...",
            "name": "User",
            "permissions": []
        },
        "status": "active"
    }
}
```

---

### 3.2 Get All Users (Admin Only)

```
GET {{base_url}}/users
```

**Authorization:** Bearer Token → `{{access_token}}` _(phải là Admin)_

**Query Params (optional):**

| Key     | Value      | Mô tả                   |
|---------|------------|--------------------------|
| page    | 1          | Trang hiện tại           |
| limit   | 10         | Số lượng mỗi trang      |
| status  | active     | Filter theo status       |
| keyword | john       | Tìm theo username/email  |

**URL ví dụ:**

```
GET {{base_url}}/users?page=1&limit=10&keyword=john
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Users retrieved successfully",
    "data": {
        "users": [...],
        "pagination": {
            "page": 1,
            "limit": 10,
            "totalCount": 2,
            "totalPages": 1
        }
    }
}
```

> ⚠️ Nếu user không phải Admin → **403 Forbidden**.
> Để test được, bạn cần sửa role của user trong MongoDB thành role Admin,
> hoặc tạo script seed user Admin riêng.

---

### 3.3 Update Profile (Chỉ chính mình)

```
PATCH {{base_url}}/users/{{user_id}}/profile
```

**Authorization:** Bearer Token → `{{access_token}}`

**Body (raw → JSON):**

```json
{
    "username": "johndoe_updated",
    "email": "john_new@example.com"
}
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Profile updated successfully",
    "data": {
        "_id": "665...",
        "username": "johndoe_updated",
        "email": "john_new@example.com",
        "slug": "johndoe-updated",
        "role": { ... }
    }
}
```

> 💡 **Lưu ý:** Slug sẽ tự động cập nhật theo username mới.

---

### 3.4 Change Password

```
PATCH {{base_url}}/users/{{user_id}}/change-password
```

**Authorization:** Bearer Token → `{{access_token}}`

**Body (raw → JSON):**

```json
{
    "currentPassword": "123456",
    "newPassword": "654321"
}
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Password changed successfully"
}
```

> ⚠️ Sau khi đổi password, hãy login lại với password mới để lấy token mới.

---

### 3.5 Delete User — Soft Delete (Admin Only)

```
DELETE {{base_url}}/users/{{user_id}}
```

**Authorization:** Bearer Token → `{{access_token}}` _(phải là Admin)_

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "User deactivated successfully"
}
```

---

## 4. Upload APIs

### 4.1 Upload Avatar

```
PATCH {{base_url}}/users/avatar
```

**Authorization:** Bearer Token → `{{access_token}}`

**Body → form-data:**

| Key    | Type | Value                  |
|--------|------|------------------------|
| avatar | File | _(chọn file ảnh JPG/PNG/WebP, < 5MB)_ |

**Cách thao tác trong Postman:**
1. Chọn tab **Body**
2. Chọn **form-data**
3. Ở cột **Key**: gõ `avatar`, rồi chuyển type từ **Text** sang **File**
4. Ở cột **Value**: click **Select Files** → chọn ảnh từ máy

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Avatar uploaded successfully",
    "data": {
        "avatar": "https://res.cloudinary.com/your-cloud/image/upload/v.../rental-app/avatars/abc123.webp",
        "public_id": "rental-app/avatars/abc123",
        "user": {
            "_id": "665...",
            "username": "johndoe",
            "avatar": "https://res.cloudinary.com/...",
            ...
        }
    }
}
```

---

## 5. Building APIs

### 5.1 Create Building (Yêu cầu đăng nhập)

```
POST {{base_url}}/buildings
```

**Authorization:** Bearer Token → `{{access_token}}`

**Body (raw → JSON):**

```json
{
    "name": "Khu trọ Sunrise",
    "type": "boarding_house",
    "description": "Khu trọ cao cấp, gần trung tâm thành phố, an ninh 24/7",
    "address": {
        "street": "123 Nguyễn Văn Linh",
        "ward": "Phường Tân Thuận Đông",
        "district": "Quận 7",
        "city": "Hồ Chí Minh"
    },
    "amenities": ["WiFi", "Máy giặt", "Bãi xe", "Camera an ninh"],
    "images": [],
    "totalRooms": 20,
    "contactPhone": "0901234567"
}
```

**Post-response script (tự lưu building_id và slug):**

```javascript
if (pm.response.code === 201) {
    const json = pm.response.json();
    pm.environment.set("building_id", json.data._id);
    pm.environment.set("building_slug", json.data.slug);
}
```

**Expected Response — 201 Created:**

```json
{
    "statusCode": 201,
    "message": "Building created successfully",
    "data": {
        "_id": "665...",
        "name": "Khu trọ Sunrise",
        "slug": "khu-tro-sunrise",
        "type": "boarding_house",
        "description": "Khu trọ cao cấp...",
        "landlordId": {
            "_id": "665...",
            "username": "johndoe",
            "email": "john@example.com",
            "avatar": null,
            "slug": "johndoe"
        },
        "address": {
            "street": "123 Nguyễn Văn Linh",
            "ward": "Phường Tân Thuận Đông",
            "district": "Quận 7",
            "city": "Hồ Chí Minh"
        },
        "amenities": ["WiFi", "Máy giặt", "Bãi xe", "Camera an ninh"],
        "totalRooms": 20,
        "contactPhone": "0901234567",
        "status": "active"
    }
}
```

> 💡 **Tạo thêm 1 building nữa để test danh sách:**
> ```json
> {
>     "name": "Chung cư Moonlight",
>     "type": "apartment",
>     "description": "Chung cư mini cho sinh viên",
>     "address": {
>         "street": "456 Lê Văn Việt",
>         "ward": "Phường Tăng Nhơn Phú A",
>         "district": "TP. Thủ Đức",
>         "city": "Hồ Chí Minh"
>     },
>     "amenities": ["WiFi", "Điều hòa"],
>     "totalRooms": 10,
>     "contactPhone": "0987654321"
> }
> ```

---

### 5.2 Get All Buildings (Public — không cần token)

```
GET {{base_url}}/buildings
```

**Không cần Authorization.**

**Query Params (optional):**

| Key      | Value           | Mô tả                                      |
|----------|-----------------|---------------------------------------------|
| page     | 1               | Trang                                       |
| limit    | 10              | Số lượng                                    |
| keyword  | Sunrise         | Tìm theo name hoặc street                   |
| type     | boarding_house  | Filter theo type                             |
| city     | Hồ Chí Minh     | Filter theo thành phố                        |
| district | Quận 7          | Filter theo quận                             |
| status   | active          | Filter status (mặc định active)              |

**Các URL ví dụ:**

```
GET {{base_url}}/buildings
GET {{base_url}}/buildings?page=1&limit=5
GET {{base_url}}/buildings?keyword=Sunrise
GET {{base_url}}/buildings?type=boarding_house&city=Hồ Chí Minh
GET {{base_url}}/buildings?district=Quận 7
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Buildings retrieved successfully",
    "data": {
        "buildings": [ ... ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "totalCount": 2,
            "totalPages": 1
        }
    }
}
```

---

### 5.3 Get Building By Slug (Public)

```
GET {{base_url}}/buildings/{{building_slug}}
```

**Ví dụ cụ thể:**

```
GET {{base_url}}/buildings/khu-tro-sunrise
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Building retrieved successfully",
    "data": {
        "_id": "665...",
        "name": "Khu trọ Sunrise",
        "slug": "khu-tro-sunrise",
        ...
    }
}
```

---

### 5.4 Get Building By ID (Public)

```
GET {{base_url}}/buildings/{{building_id}}
```

**Expected Response:** Giống 5.3.

---

### 5.5 Update Building (Chỉ Owner)

```
PATCH {{base_url}}/buildings/{{building_id}}
```

**Authorization:** Bearer Token → `{{access_token}}`

**Body (raw → JSON):**

```json
{
    "name": "Khu trọ Sunrise Premium",
    "description": "Đã nâng cấp toàn bộ phòng, thêm tiện ích mới",
    "amenities": ["WiFi", "Máy giặt", "Bãi xe", "Camera an ninh", "Hồ bơi"],
    "totalRooms": 25
}
```

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Building updated successfully",
    "data": {
        "name": "Khu trọ Sunrise Premium",
        "slug": "khu-tro-sunrise-premium",
        "totalRooms": 25,
        ...
    }
}
```

---

### 5.6 Delete Building — Soft Delete (Chỉ Owner)

```
DELETE {{base_url}}/buildings/{{building_id}}
```

**Authorization:** Bearer Token → `{{access_token}}`

**Expected Response — 200 OK:**

```json
{
    "statusCode": 200,
    "message": "Building deactivated successfully"
}
```

> 💡 Sau khi soft delete, GET building đó sẽ trả về **410 Gone**.

---

## 6. Test Validation (Joi)

### 6.1 Register — Thiếu field

```
POST {{base_url}}/auth/register
```

```json
{
    "username": "ab"
}
```

**Expected — 400 Bad Request:**

```json
{
    "statusCode": 400,
    "message": "Username must be at least 3 characters, Email is required, Password is required"
}
```

---

### 6.2 Register — Email sai format

```json
{
    "username": "testuser",
    "email": "not-an-email",
    "password": "123456"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Please provide a valid email address"
}
```

---

### 6.3 Register — Password quá ngắn

```json
{
    "username": "testuser",
    "email": "test@example.com",
    "password": "123"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Password must be at least 6 characters"
}
```

---

### 6.4 Login — Thiếu field

```
POST {{base_url}}/auth/login
```

```json
{
    "email": "john@example.com"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Password is required"
}
```

---

### 6.5 Change Password — Password mới giống cũ

```
PATCH {{base_url}}/users/{{user_id}}/change-password
```

```json
{
    "currentPassword": "123456",
    "newPassword": "123456"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "New password must be different from current password"
}
```

---

### 6.6 Create Building — Thiếu field bắt buộc

```
POST {{base_url}}/buildings
```

```json
{
    "name": "Test"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Building type is required, Address is required"
}
```

---

### 6.7 Create Building — Type không hợp lệ

```json
{
    "name": "Test Building",
    "type": "villa",
    "address": {
        "street": "123 ABC",
        "district": "Q1",
        "city": "HCM"
    }
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Type must be one of: apartment, boarding_house, dormitory, studio, other"
}
```

---

### 6.8 Update Building — Body rỗng

```
PATCH {{base_url}}/buildings/{{building_id}}
```

```json
{}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "At least one field must be provided to update"
}
```

---

### 6.9 Create Building — Phone không hợp lệ

```json
{
    "name": "Test Building",
    "type": "apartment",
    "address": {
        "street": "123 ABC",
        "district": "Q1",
        "city": "HCM"
    },
    "contactPhone": "abc123"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Please provide a valid phone number"
}
```

---

## 7. Test Error Cases

### 7.1 Không có token

```
GET {{base_url}}/users/{{user_id}}
```

**Authorization:** Bỏ trống (No Auth)

**Expected — 401:**

```json
{
    "statusCode": 401,
    "message": "No token provided"
}
```

---

### 7.2 Token hết hạn / sai

**Authorization:** Bearer Token → `invalid_token_here`

**Expected — 401:**

```json
{
    "statusCode": 401,
    "message": "Invalid token"
}
```

---

### 7.3 User không phải Admin gọi Admin API

```
GET {{base_url}}/users
```

**Authorization:** Bearer Token → `{{access_token}}` _(token của user role "User")_

**Expected — 403:**

```json
{
    "statusCode": 403,
    "message": "You do not have permission to perform this action"
}
```

---

### 7.4 Update profile người khác

```
PATCH {{base_url}}/users/ANOTHER_USER_ID_HERE/profile
```

```json
{
    "username": "hacked"
}
```

**Expected — 403:**

```json
{
    "statusCode": 403,
    "message": "You can only update your own profile"
}
```

---

### 7.5 Update building người khác

Đăng nhập bằng tài khoản khác (jane), rồi PATCH building của john:

```
PATCH {{base_url}}/buildings/{{building_id}}
```

```json
{
    "name": "Hacked Building"
}
```

**Expected — 403:**

```json
{
    "statusCode": 403,
    "message": "You can only update your own building"
}
```

---

### 7.6 Get user/building không tồn tại

```
GET {{base_url}}/users/000000000000000000000000
GET {{base_url}}/buildings/khong-ton-tai-slug
```

**Expected — 404:**

```json
{
    "statusCode": 404,
    "message": "User not found"
}
```

---

### 7.7 Upload avatar — File quá lớn (> 5MB)

```
PATCH {{base_url}}/users/avatar
```

Chọn file ảnh > 5MB trong form-data.

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "File too large. Maximum size is 5MB"
}
```

---

### 7.8 Upload avatar — File sai định dạng

Chọn file `.txt` hoặc `.pdf` làm avatar.

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Invalid file type \"text/plain\". Only JPEG, PNG and WebP are allowed"
}
```

---

### 7.9 Register email trùng

```
POST {{base_url}}/auth/register
```

```json
{
    "username": "another_user",
    "email": "john@example.com",
    "password": "123456"
}
```

**Expected — 400:**

```json
{
    "statusCode": 400,
    "message": "Email already in use"
}
```

---

### 7.10 Change password — Sai mật khẩu cũ

```
PATCH {{base_url}}/users/{{user_id}}/change-password
```

```json
{
    "currentPassword": "wrong_password",
    "newPassword": "newpass123"
}
```

**Expected — 401:**

```json
{
    "statusCode": 401,
    "message": "Current password is incorrect"
}
```

---

## 📌 Thứ Tự Test Đề Xuất

Chạy theo thứ tự này để đảm bảo data đúng:

| # | Request                              | Ghi chú                             |
|---|--------------------------------------|--------------------------------------|
| 1 | `POST /auth/register` (johndoe)      | Tạo user đầu tiên                    |
| 2 | `POST /auth/register` (janedoe)      | Tạo user thứ hai                     |
| 3 | `POST /auth/login` (johndoe)         | Lấy access_token + user_id           |
| 4 | `GET /auth/me`                       | Verify token hoạt động               |
| 5 | `GET /users/{{user_id}}`             | Xem profile (có slug)                |
| 6 | `PATCH /users/{{user_id}}/profile`   | Cập nhật username → xem slug tự đổi  |
| 7 | `PATCH /users/avatar`                | Upload ảnh đại diện                  |
| 8 | `PATCH /users/{{user_id}}/change-password` | Đổi mật khẩu                  |
| 9 | `POST /buildings` (building 1)       | Tạo khu trọ                         |
| 10 | `POST /buildings` (building 2)      | Tạo thêm 1 khu trọ                  |
| 11 | `GET /buildings`                    | Danh sách (không cần token)          |
| 12 | `GET /buildings?type=boarding_house`| Filter theo loại                     |
| 13 | `GET /buildings/khu-tro-sunrise`    | Lấy theo slug                        |
| 14 | `GET /buildings/{{building_id}}`    | Lấy theo ID                          |
| 15 | `PATCH /buildings/{{building_id}}`  | Cập nhật building                    |
| 16 | `DELETE /buildings/{{building_id}}` | Soft delete building                 |
| 17 | Chạy các test Validation (mục 6)    | Test Joi bắt lỗi                    |
| 18 | Chạy các test Error Cases (mục 7)   | Test error handling                  |
| 19 | `POST /auth/refresh-token`          | Làm mới token                        |
| 20 | `POST /auth/logout`                 | Đăng xuất                            |
