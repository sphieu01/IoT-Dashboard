# 📑 TÀI LIỆU CHI TIẾT REST API & WEBSOCKET - IOT DASHBOARD

> **Dự án**: IoT Dashboard - Hệ Thống Giám Sát Cảm Biến & Điều Khiển Thiết Bị  
> **Sinh viên**: Đào Trung Hiếu (B23DCCN298 - D23CNPM02 - PTIT)  
> **Backend Framework**: Spring Boot 3.3.4 (Java 17)  
> **Base URL**: `http://localhost:5000`  
> **Content-Type mặc định**: `application/json`  
> **Swagger UI**: [http://localhost:5000/swagger-ui/index.html](http://localhost:5000/swagger-ui/index.html)  
> **OpenAPI JSON**: [http://localhost:5000/v3/api-docs](http://localhost:5000/v3/api-docs)

---

## 📌 BẢNG TỔNG HỢP CÁC ENDPOINT (100% SERVER-SIDE PAGINATION & FILTERING)

| Nhóm | Phương thức | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| **Thiết bị** | `GET` | `/api/devices/status` | Lấy trạng thái ON/OFF hiện tại của đèn và quạt |
| **Thiết bị** | `POST` | `/api/devices/control` | Bật/tắt thiết bị, gửi lệnh MQTT tới ESP32 và lưu lịch sử |
| **Thiết bị** | `GET` | `/api/devices/history` | Lấy lịch sử bật/tắt thiết bị (lọc đa trường: thiết bị, hành động, trạng thái, tìm thời gian, phân trang server-side) |
| **Cảm biến** | `GET` | `/api/sensors/history` | Lấy danh sách đo cảm biến phẳng (phân trang, lọc theo cột, trần tối đa 1000 bản ghi) |
| **Cảm biến** | `GET` | `/api/sensors/latest` | Lấy 15 điểm đo mới nhất vẽ đồ thị Live Chart |
| **Hồ sơ** | `GET` | `/api/profile` | Lấy thông tin cá nhân sinh viên |
| **Realtime** | `WS` | `/ws` | Kênh WebSocket truyền nhận dữ liệu thời gian thực từ ESP32 |

---

## I. NHÓM API QUẢN LÝ THIẾT BỊ (`/api/devices`)

### 1. Lấy trạng thái hiện tại của thiết bị
* **Endpoint:** `GET /api/devices/status`
* **Mục đích:** Trả về trạng thái BẬT (`true`) / TẮT (`false`) của các thiết bị để cập nhật toggle switch trên Dashboard.
* **Headers:** Không yêu cầu

#### Ví dụ cURL:
```bash
curl -X GET http://localhost:5000/api/devices/status
```

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
* **Mục đích:** Gửi lệnh điều khiển tới ESP32 qua giao thức MQTT và ghi bản ghi vào bảng lịch sử.
* **Headers:** `Content-Type: application/json`
* **Request Body:**

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Giá trị hợp lệ / Mô tả |
| :--- | :---: | :---: | :--- |
| `device` | String | Có | `"Light"`, `"Fan"` |
| `action` | String | Có | `"ON"`, `"OFF"` |
| `device_id`| Integer | Không | ID thiết bị (`1`: Light, `2`: Fan) |

#### Ví dụ cURL:
```bash
curl -X POST http://localhost:5000/api/devices/control \
  -H "Content-Type: application/json" \
  -d '{"device": "Light", "action": "ON"}'
```

#### Response thành công (200 OK):
```json
{
  "id": 15,
  "device": "Light",
  "action": "ON",
  "status": "ON",
  "fullTime": "14:20:05 11/10/2026"
}
```

#### Mã lỗi:
* `400 Bad Request`: Khi thiếu trường `device` hoặc `action`.

---

### 3. Lấy lịch sử thao tác thiết bị
* **Endpoint:** `GET /api/devices/history`
* **Mục đích:** Lấy danh sách lịch sử thao tác bật/tắt thiết bị, hỗ trợ tìm kiếm, lọc và phân trang.
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `device` | String | `"all"` | Lọc theo thiết bị: `"all"`, `"Light"`, `"Fan"` |
| `action` | String | `"all"` | Lọc theo hành động: `"all"`, `"ON"`, `"OFF"` |
| `status` | String | `"all"` | Lọc theo trạng thái: `"all"`, `"ON"`, `"OFF"`, `"PENDING"`, `"SUCCESS"` |
| `query` | String | `""` | **Chỉ tìm kiếm theo Thời gian (`fullTime`)** (ví dụ: `"23:50"`, `"12/10"`, `"2026"`) |
| `sort` | String | `"newest"` | Thứ tự sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |
| `page` | Integer | `1` | Trang hiện tại (mặc định trang `1`, không bị mất lọc khi bỏ trống) |
| `limit` | Integer | `8` | Số bản ghi mỗi trang (mặc định `8`, tối đa khống chế `1000`) |

> ⚠️ **Quy tắc hệ thống**: Dữ liệu lấy từ CSDL bị khống chế tối đa **1000 bản ghi mới nhất** để tối ưu hóa tài nguyên và ngăn chặn cạn kiệt bộ nhớ.

#### Ví dụ cURL:
```bash
curl -X GET "http://localhost:5000/api/devices/history?device=Light&action=ON&query=23:50&page=1&limit=8&sort=newest"
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
      "fullTime": "23:50:18 12/10/2026"
    },
    {
      "id": 43,
      "device": "Light",
      "action": "ON",
      "status": "SUCCESS",
      "fullTime": "23:50:02 12/10/2026"
    }
  ]
}
```

---

## II. NHÓM API DỮ LIỆU CẢM BIẾN (`/api/sensors`)

### 1. Lấy dữ liệu cảm biến (Data Sensor Page - Server-side Pagination)
* **Endpoint:** `GET /api/sensors/history`
* **Mục đích:** Lấy danh sách số đo cảm biến phẳng. Tìm kiếm, lọc theo cột và phân trang 100% xử lý tại Backend.
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `searchType` | String | `"all"` | Phạm vi tìm kiếm: `"all"`, `"temperature"`, `"humidity"`, `"light"`, `"time"` |
| `query` | String | `""` | Từ khóa tìm kiếm khớp với loại cảm biến đã chọn hoặc thời gian |
| `sort` | String | `"newest"` | Sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |
| `page` | Integer | `1` | Số trang muốn xem (bắt đầu từ `1`) |
| `limit` | Integer | `8` | Số bản ghi mỗi trang (mặc định `8`, tối đa khống chế `1000`) |

> ⚠️ **Tối ưu hóa Database Query**: Backend sử dụng `PageRequest.of(0, 1000, sortOrder)` (`LIMIT 1000` ngay dưới MySQL), không kéo toàn bộ bảng hàng chục nghìn dòng lên RAM. Kết quả trả về và `total` luôn được giới hạn trần tối đa **1000 bản ghi**.

#### Ví dụ cURL (Tìm nhiệt độ quanh mức 29 độ, trang 1):
```bash
curl -X GET "http://localhost:5000/api/sensors/history?searchType=temperature&query=29&page=1&limit=8&sort=newest"
```

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
      "fullTime": "2026-10-12 20:50:07"
    },
    {
      "id": 14458,
      "sensorType": "Temperature",
      "value": 29.5,
      "fullTime": "2026-10-12 20:50:05"
    }
  ]
}
```

---

### 2. Lấy dữ liệu vẽ biểu đồ thời gian thực (Live Chart)
* **Endpoint:** `GET /api/sensors/latest`
* **Mục đích:** Lấy các điểm dữ liệu đo gần nhất (mỗi mốc gồm đầy đủ 3 giá trị Nhiệt độ, Độ ẩm, Ánh sáng) theo thứ tự thời gian tăng dần từ trái sang phải để hiển thị biểu đồ LiveChart.
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `limit` | Integer | `15` | Số lượng điểm mốc thời gian muốn lấy (mặc định 15 điểm) |

#### Ví dụ cURL:
```bash
curl -X GET "http://localhost:5000/api/sensors/latest?limit=5"
```

#### Response thành công (200 OK):
```json
[
  {
    "time": "20:49:53",
    "temp": 29.5,
    "humidity": 68.0,
    "light": 420.0
  },
  {
    "time": "20:49:57",
    "temp": 29.5,
    "humidity": 67.5,
    "light": 435.0
  },
  {
    "time": "20:50:01",
    "temp": 29.5,
    "humidity": 67.0,
    "light": 450.0
  },
  {
    "time": "20:50:05",
    "temp": 29.5,
    "humidity": 66.8,
    "light": 460.0
  },
  {
    "time": "20:50:07",
    "temp": 29.5,
    "humidity": 66.5,
    "light": 470.0
  }
]
```

---

## III. NHÓM API THÔNG TIN TÁC GIẢ (`/api/profile`)

### 1. Lấy thông tin cá nhân sinh viên
* **Endpoint:** `GET /api/profile`
* **Mục đích:** Trả về thông tin sinh viên thực hiện để hiển thị trên trang **Profile**.
* **Headers:** Không yêu cầu

#### Ví dụ cURL:
```bash
curl -X GET http://localhost:5000/api/profile
```

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

## IV. KÊNH REALTIME WEBSOCKET (`/ws`)

* **Mục đích:** Phát sóng (Broadcast) dữ liệu vi điều khiển ESP32 gửi lên tới máy tính người dùng theo thời gian thực (độ trễ ~ 0ms).
* **URL kết nối:** `ws://localhost:5000/ws` hoặc `ws://localhost:5000/ws/telemetry`
* **Giao thức:** Standard WebSocket (`TextWebSocketHandler`)

#### Định dạng gói tin SENSOR_UPDATE:
```json
{
  "type": "SENSOR_UPDATE",
  "time": "20:50:07",
  "temp": 29.5,
  "humidity": 66.5,
  "light": 470.0,
  "records": [
    { "id": 14461, "sensorType": "Temperature", "value": 29.5, "fullTime": "2026-10-12 20:50:07" },
    { "id": 14462, "sensorType": "Humidity", "value": 66.5, "fullTime": "2026-10-12 20:50:07" },
    { "id": 14463, "sensorType": "Light", "value": 470.0, "fullTime": "2026-10-12 20:50:07" }
  ]
}
```

---

## 🚀 HƯỚNG DẪN IMPORT VÀO POSTMAN

1. Khởi động Spring Boot Backend (chạy ở cổng 5000).
2. Mở ứng dụng **Postman**, bấm nút **Import** ở góc trên bên trái.
3. Dán đường dẫn OpenAPI Schema:
   ```text
   http://localhost:5000/v3/api-docs
   ```
4. Bấm **Import**. Postman sẽ tự động sinh ra một bộ **Collection** chứa đầy đủ các REST API chuẩn hóa với các trường lọc và phân trang tự động.
