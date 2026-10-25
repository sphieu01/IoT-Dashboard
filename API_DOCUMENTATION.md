# 📑 TÀI LIỆU CHI TIẾT REST API & XÁC THỰC - IOT DASHBOARD

> **Dự án**: IoT Dashboard - Hệ Thống Giám Sát Cảm Biến & Điều Khiển Thiết Bị  
> **Sinh viên**: Đào Trung Hiếu (B23DCCN298 - D23CNPM02 - PTIT)  
> **Backend Framework**: Spring Boot 3.3.4 (Java 17)  
> **Base URL**: `http://localhost:5000`  
> **Content-Type mặc định**: `application/json`  
> **Cơ chế xác thực**: Token-based Authentication (`Authorization: Bearer <token>`)  
> **Swagger UI**: [http://localhost:5000/swagger-ui/index.html](http://localhost:5000/swagger-ui/index.html)  
> **OpenAPI JSON**: [http://localhost:5000/v3/api-docs](http://localhost:5000/v3/api-docs)

---

## 📌 BẢNG TỔNG HỢP CÁC ENDPOINT

| Nhóm | Phương thức | Endpoint | Yêu cầu Token | Mô tả |
| :--- | :---: | :--- | :---: | :--- |
| **Xác thực** | `POST` | `/api/auth/login` | ❌ Không | Đăng nhập hệ thống, trả về Token xác thực và thông tin User |
| **Xác thực** | `POST` | `/api/auth/register` | ❌ Không | Đăng ký tài khoản người dùng mới |
| **Xác thực** | `GET` | `/api/auth/me` | ✅ Có | Lấy thông tin tài khoản hiện tại từ Token |
| **Thiết bị** | `GET` | `/api/devices/status` | ✅ Có | Lấy trạng thái ON/OFF hiện tại của đèn và quạt |
| **Thiết bị** | `POST` | `/api/devices/control` | ✅ Có | Bật/tắt thiết bị, gửi lệnh MQTT tới ESP32, tạo log `PENDING` |
| **Thiết bị** | `GET` | `/api/devices/history` | ✅ Có | Lịch sử thao tác (`SUCCESS`, `FAIL`, `PENDING`), tìm theo thời gian |
| **Cảm biến** | `GET` | `/api/sensors/history` | ✅ Có | Lấy danh sách đo cảm biến phẳng (Nhiệt độ, Độ ẩm, Ánh sáng, Tốc độ gió), phân trang, lọc theo cột |
| **Cảm biến** | `GET` | `/api/sensors/latest` | ✅ Có | Lấy 15 điểm đo mới nhất vẽ đồ thị Live Chart (gồm cả Tốc độ gió) |
| **Cảm biến** | `GET` | `/api/sensors/alerts/monthly` | ✅ Có | Thống kê số lượng cảnh báo tốc độ gió (> 300 m/s) theo từng ngày trong tháng |
| **Hồ sơ** | `GET` | `/api/profile` | ❌ Không | Lấy thông tin cá nhân sinh viên |
| **Realtime** | `WS` | `/ws` | ❌ Không | Kênh WebSocket truyền nhận dữ liệu thời gian thực (tham khảo) |

---

## 🔐 CƠ CHẾ XÁC THỰC (AUTHENTICATION)

Hệ thống sử dụng cơ chế **Token Authentication** an toàn qua Header HTTP:
```http
Authorization: Bearer <token_nhan_duoc_khi_login>
```

- **Tài khoản mặc định sẵn trong CSDL**:
  - **Username**: `admin`
  - **Password**: `123456`
  - **Role**: `ADMIN`
- **Mã lỗi 401 Unauthorized**: Xảy ra khi request vào các endpoint được bảo vệ (`/api/devices/**`, `/api/sensors/**`) mà không truyền hoặc truyền sai token.

---

## I. NHÓM API XÁC THỰC & TÀI KHOẢN (`/api/auth`)

### 1. Đăng nhập hệ thống
* **Endpoint:** `POST /api/auth/login`
* **Mục đích:** Xác thực tài khoản người dùng và sinh mã Token truy cập.
* **Headers:** `Content-Type: application/json`
* **Request Body:**

| Thuộc tính | Kiểu | Bắt buộc | Mô tả |
| :--- | :---: | :---: | :--- |
| `username` | String | Có | Tên đăng nhập (ví dụ: `"admin"`) |
| `password` | String | Có | Mật khẩu (ví dụ: `"123456"`) |

#### Ví dụ cURL:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "123456"}'
```

#### Response thành công (200 OK):
```json
{
  "token": "YWRtaW46MTc2MTU4MTkyNzg2NTpmYWUzZjg4...",
  "username": "admin",
  "fullName": "Administrator",
  "role": "ADMIN"
}
```

#### Mã lỗi:
* `400 Bad Request`: `{"error": "Tài khoản không tồn tại!"}` hoặc `{"error": "Mật khẩu không chính xác!"}`.

---

### 2. Đăng ký tài khoản
* **Endpoint:** `POST /api/auth/register`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "username": "hieudt",
  "password": "mypassword123",
  "fullName": "Đào Trung Hiếu"
}
```

#### Response thành công (200 OK):
```json
{
  "token": "aGlldWR0OjE3NjE1ODE5Mjc4NjU6ZGIyY...",
  "username": "hieudt",
  "fullName": "Đào Trung Hiếu",
  "role": "ADMIN"
}
```

---

### 3. Lấy thông tin tài khoản hiện tại
* **Endpoint:** `GET /api/auth/me`
* **Headers:** `Authorization: Bearer <token>`

#### Response thành công (200 OK):
```json
{
  "id": 1,
  "username": "admin",
  "fullName": "Administrator",
  "role": "ADMIN"
}
```

---

## II. NHÓM API QUẢN LÝ THIẾT BỊ (`/api/devices`)

### 1. Lấy trạng thái hiện tại của thiết bị
* **Endpoint:** `GET /api/devices/status`
* **Mục đích:** Trả về trạng thái BẬT (`true`) / TẮT (`false`) của các thiết bị để cập nhật toggle switch trên Dashboard.
* **Headers:** `Authorization: Bearer <token>`

#### Response thành công (200 OK):
```json
{
  "light": true,
  "fan": false
}
```

---

### 2. Điều khiển Bật / Tắt thiết bị
* **Endpoint:** `POST /api/devices/control`
* **Mục đích:** Tạo bản ghi log `PENDING` trong database, bắn lệnh MQTT `{"led1":"on"}` tới ESP32 và trả về thông tin log đang chờ xử lý.
* **Headers:** 
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>`
* **Request Body:**

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Giá trị hợp lệ / Mô tả |
| :--- | :---: | :---: | :--- |
| `device` | String | Có | `"Light"`, `"Fan"` |
| `action` | String | Có | `"ON"`, `"OFF"` |

#### Ví dụ cURL:
```bash
curl -X POST http://localhost:5000/api/devices/control \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"device": "Light", "action": "ON"}'
```

#### Response thành công (200 OK - Khởi tạo trạng thái PENDING):
```json
{
  "id": 15,
  "device": "Light",
  "action": "ON",
  "status": "PENDING",
  "fullTime": "14:20:05 21/10/2026"
}
```

*(Quy tắc chuyển trạng thái của bản ghi PENDING)*:
- **`SUCCESS`**: Khi ESP32 nhận lệnh, thực thi thành công và gửi bản tin xác nhận ACK qua MQTT topic `device/status`.
- **`FAIL`**: Khi ESP32 phản hồi lỗi, HOẶC sau **5 giây (5s timeout)** nếu không nhận được phản hồi ACK từ thiết bị (ví dụ ESP32 tắt nguồn hoặc mất mạng), Backend và bảng History trên Web sẽ tự động cập nhật bản ghi từ `PENDING` thành `FAIL`.

---

### 3. Lấy lịch sử thao tác thiết bị
* **Endpoint:** `GET /api/devices/history`
* **Mục đích:** Lấy danh sách lịch sử thao tác bật/tắt thiết bị, hỗ trợ tìm kiếm, lọc và phân trang.
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `device` | String | `"all"` | Lọc theo thiết bị: `"all"`, `"Light"`, `"Fan"` |
| `action` | String | `"all"` | Lọc theo hành động: `"all"`, `"ON"`, `"OFF"` |
| `status` | String | `"all"` | Lọc theo trạng thái: `"all"`, `"SUCCESS"`, `"FAIL"`, `"PENDING"` |
| `query` | String | `""` | Tìm kiếm theo thời gian (ví dụ: `"14:20"`, `"21/10"`, `"2026"`) |
| `sort` | String | `"newest"` | Thứ tự sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |
| `page` | Integer | `1` | Trang hiện tại (bắt đầu từ `1`) |
| `limit` | Integer | `8` | Số bản ghi mỗi trang (mặc định `8`, tối đa `1000`) |

#### Ví dụ cURL:
```bash
curl -X GET "http://localhost:5000/api/devices/history?device=Light&action=ON&status=SUCCESS&page=1&limit=8" \
  -H "Authorization: Bearer <token>"
```

#### Response thành công (200 OK):
```json
{
  "currentPage": 1,
  "totalPages": 2,
  "total": 12,
  "data": [
    {
      "id": 45,
      "device": "Light",
      "action": "ON",
      "status": "SUCCESS",
      "fullTime": "14:20:05 21/10/2026"
    },
    {
      "id": 43,
      "device": "Light",
      "action": "ON",
      "status": "SUCCESS",
      "fullTime": "14:18:22 21/10/2026"
    }
  ]
}
```

---

## III. NHÓM API DỮ LIỆU CẢM BIẾN (`/api/sensors`)

### 1. Lấy dữ liệu cảm biến (Data Sensor Page)
* **Endpoint:** `GET /api/sensors/history`
* **Mục đích:** Lấy danh sách số đo cảm biến phẳng. Phân trang, lọc theo cột và tìm kiếm xử lý 100% tại Server.
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `searchType` | String | `"all"` | Tiêu chí tìm kiếm: `"all"`, `"temperature"`, `"humidity"`, `"light"`, `"time"` |
| `query` | String | `""` | Từ khóa tìm kiếm (nếu để trống, hệ thống hiển thị toàn bộ bản ghi cảm biến) |
| `sort` | String | `"newest"` | Sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |
| `page` | Integer | `1` | Số trang muốn xem (bắt đầu từ `1`) |
| `limit` | Integer | `8` | Số bản ghi mỗi trang (mặc định `8`, tối đa `1000`) |

> 💡 **Quy tắc tìm kiếm**: Khi `query` rỗng `""`, API luôn trả về toàn bộ dữ liệu (cả Nhiệt độ, Độ ẩm, Ánh sáng) mà không lọc riêng một loại cảm biến.

#### Response thành công (200 OK):
```json
{
  "currentPage": 1,
  "totalPages": 5,
  "total": 38,
  "data": [
    {
      "id": 14461,
      "sensorType": "Temperature",
      "value": 29.5,
      "fullTime": "14:20:07 21/10/2026"
    },
    {
      "id": 14462,
      "sensorType": "Humidity",
      "value": 68.0,
      "fullTime": "14:20:07 21/10/2026"
    },
    {
      "id": 14463,
      "sensorType": "Light",
      "value": 420.0,
      "fullTime": "14:20:07 21/10/2026"
    }
  ]
}
```

---

### 2. Lấy dữ liệu vẽ biểu đồ thời gian thực (Live Chart)
* **Endpoint:** `GET /api/sensors/latest`
* **Mục đích:** Lấy các điểm đo mới nhất (mỗi mốc gồm đầy đủ 3 giá trị Nhiệt độ, Độ ẩm, Ánh sáng) theo thứ tự thời gian tăng dần từ trái sang phải để hiển thị biểu đồ và 3 thẻ Metric.
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `limit` | Integer | `15` | Số lượng điểm mốc thời gian muốn lấy (mặc định 15 điểm) |

#### Response thành công (200 OK):
```json
[
  {
    "time": "14:19:53",
    "temp": 29.5,
    "humidity": 68.0,
    "light": 420.0
  },
  {
    "time": "14:19:57",
    "temp": 29.6,
    "humidity": 67.5,
    "light": 435.0
  },
  {
    "time": "14:20:01",
    "temp": 29.5,
    "humidity": 67.0,
    "light": 450.0,
    "windSpeed": 345.5
  }
]
```

---

### 3. Thống kê số cảnh báo theo tháng (Alert Chart)
* **Endpoint:** `GET /api/sensors/alerts/monthly`
* **Mục đích:** Thống kê số lần tốc độ gió vượt ngưỡng an toàn (> 300 m/s) theo từng ngày trong tháng để vẽ biểu đồ tháng (Bar Chart & Area Chart).
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `year` | Integer | Năm hiện tại | Năm cần thống kê (VD: `2026`) |
| `month` | Integer | Tháng hiện tại | Tháng cần thống kê (1 - 12, VD: `10`) |

#### Response thành công (200 OK):
```json
{
  "year": 2026,
  "month": 10,
  "totalAlerts": 42,
  "peakDay": {
    "day": 14,
    "count": 9
  },
  "maxMonthlyWindSpeed": 488.5,
  "daysWithAlerts": 8,
  "safeDays": 23,
  "dailyCounts": [
    {
      "day": 1,
      "date": "2026-10-01",
      "alertCount": 3,
      "maxWindSpeed": 350.2,
      "totalReadings": 8
    },
    {
      "day": 2,
      "date": "2026-10-02",
      "alertCount": 0,
      "maxWindSpeed": 180.0,
      "totalReadings": 6
    }
  ]
}
```

---

## IV. NHÓM API THÔNG TIN TÁC GIẢ (`/api/profile`)

### 1. Lấy thông tin cá nhân sinh viên
* **Endpoint:** `GET /api/profile`
* **Mục đích:** Trả về thông tin sinh viên thực hiện để hiển thị trên trang **My Profile**.
* **Headers:** Không yêu cầu

#### Response thành công (200 OK):
```json
{
  "name": "Đào Trung Hiếu",
  "studentId": "B23DCCN298",
  "className": "D23CNPM02",
  "university": "Học viện Công nghệ Bưu chính Viễn thông (PTIT)",
  "role": "Software Engineer"
}
```

---

## V. KÊNH REALTIME WEBSOCKET (`/ws`) *(Tùy chọn tham khảo)*

* **URL kết nối:** `ws://localhost:5000/ws`
* **Giao thức:** Standard WebSocket (`TextWebSocketHandler`)
* **Ghi chú:** Hệ thống hiện tại đang vận hành theo cơ chế **REST API Polling** định kỳ 2 giây trực tiếp từ CSDL. Khối mã WebSocket vẫn được bảo toàn nguyên vẹn trong code backend và frontend để phục vụ chấm điểm và tham khảo.

---

## 🚀 HƯỚNG DẪN KIỂM THỬ QUA POSTMAN

1. Khởi động Spring Boot Backend (cổng 5000).
2. Mở **Postman**, import OpenAPI Schema từ:
   ```text
   http://localhost:5000/v3/api-docs
   ```
3. Gọi API `POST /api/auth/login` với body:
   ```json
   {
     "username": "admin",
     "password": "123456"
   }
   ```
4. Copy chuỗi `token` nhận được và thêm vào tab **Authorization** (Type: `Bearer Token`) khi gọi các API `/api/devices/**` và `/api/sensors/**`.
