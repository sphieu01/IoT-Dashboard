# 📑 TÀI LIỆU CHI TIẾT REST API & WEBSOCKET - IOT DASHBOARD

> **Dự án**: IoT Dashboard - Hệ Thống Giám Sát Cảm Biến & Điều Khiển Thiết Bị  
> **Sinh viên**: Đào Trung Hiếu (B23DCCN298 - D23CNPM02 - PTIT)  
> **Backend Framework**: Spring Boot 3.3.4 (Java 17)  
> **Base URL**: `http://localhost:5000`  
> **Content-Type mặc định**: `application/json`  
> **Swagger UI**: [http://localhost:5000/swagger-ui/index.html](http://localhost:5000/swagger-ui/index.html)  
> **OpenAPI JSON**: [http://localhost:5000/v3/api-docs](http://localhost:5000/v3/api-docs)

---

## 📌 BẢNG TỔNG HỢP CÁC ENDPOINT (ĐÃ TINH GỌN)

| Nhóm | Phương thức | Endpoint | Mô tả |
| :--- | :---: | :--- | :--- |
| **Thiết bị** | `GET` | `/api/devices/status` | Lấy trạng thái ON/OFF hiện tại của đèn và quạt |
| **Thiết bị** | `POST` | `/api/devices/control` | Bật/tắt thiết bị, gửi lệnh MQTT tới ESP32 và lưu lịch sử |
| **Thiết bị** | `GET` | `/api/devices/history` | Lấy lịch sử bật/tắt thiết bị (hỗ trợ phân trang, lọc, tìm kiếm) |
| **Cảm biến** | `GET` | `/api/sensors/history` | Lấy danh sách đo cảm biến phẳng (phân trang, lọc, tìm kiếm) |
| **Cảm biến** | `GET` | `/api/sensors/latest` | Lấy 15 điểm đo mới nhất vẽ đồ thị Live Chart |
| **Hồ sơ** | `GET` | `/api/profile` | Lấy thông tin cá nhân sinh viên |
| **Realtime** | `WS` | `/ws` | Kênh WebSocket truyền nhận dữ liệu thời gian thực |

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
| `page` | Integer | (tùy chọn) | Trang hiện tại (bắt đầu từ `1`) |
| `limit` | Integer | (tùy chọn) | Số bản ghi trên mỗi trang |
| `query` | String | `""` | Từ khóa tìm kiếm theo thiết bị, hành động, thời gian |
| `sort` | String | `"newest"` | Thứ tự sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |

#### Ví dụ cURL (Có phân trang):
```bash
curl -X GET "http://localhost:5000/api/devices/history?page=1&limit=5&sort=newest"
```

#### Response thành công (200 OK):
```json
{
  "currentPage": 1,
  "totalPages": 3,
  "total": 15,
  "data": [
    {
      "id": 15,
      "device": "Light",
      "action": "ON",
      "status": "ON",
      "fullTime": "14:20:05 11/10/2026"
    },
    {
      "id": 14,
      "device": "Fan",
      "action": "OFF",
      "status": "OFF",
      "fullTime": "14:15:20 11/10/2026"
    }
  ]
}
```
*(Nếu không truyền `page` và `limit`, API sẽ trả về toàn bộ mảng `List<DeviceHistoryDto>`)*.

---

## II. NHÓM API DỮ LIỆU CẢM BIẾN (`/api/sensors`)

### 1. Lấy dữ liệu cảm biến (Data Sensor Page)
* **Endpoint:** `GET /api/sensors/history`
* **Mục đích:** Lấy danh sách dữ liệu đo cảm biến được làm phẳng (phục vụ hiển thị bảng, tìm kiếm, lọc theo cột trên trang DataSensorPage).
* **Query Parameters:**

| Tham số | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :---: | :---: | :--- |
| `page` | Integer | `1` | Số trang muốn xem |
| `limit` | Integer | `8` | Số lượng bản ghi trên một trang (mặc định 8 dòng) |
| `searchType` | String | `"all"` | Phạm vi tìm kiếm: `"all"`, `"temperature"`, `"humidity"`, `"light"`, `"time"` |
| `query` | String | `""` | Giá trị tìm kiếm (ví dụ tìm giá trị `30`, thời gian `2026-10-11`...) |
| `sort` | String | `"newest"` | Sắp xếp: `"newest"` (mới nhất) hoặc `"oldest"` (cũ nhất) |

#### Ví dụ cURL:
```bash
curl -X GET "http://localhost:5000/api/sensors/history?searchType=temperature&query=30&page=1&limit=3&sort=newest"
```

#### Response thành công (200 OK):
```json
{
  "currentPage": 1,
  "totalPages": 8,
  "total": 24,
  "data": [
    {
      "id": 102,
      "sensorType": "Temperature",
      "value": 30.5,
      "fullTime": "2026-10-11 14:18:00"
    },
    {
      "id": 99,
      "sensorType": "Temperature",
      "value": 30.1,
      "fullTime": "2026-10-11 14:17:30"
    },
    {
      "id": 96,
      "sensorType": "Temperature",
      "value": 30.0,
      "fullTime": "2026-10-11 14:17:00"
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
    "time": "14:16:00",
    "temp": 28.5,
    "humidity": 65.0,
    "light": 420.0
  },
  {
    "time": "14:16:30",
    "temp": 28.7,
    "humidity": 64.5,
    "light": 435.0
  },
  {
    "time": "14:17:00",
    "temp": 29.0,
    "humidity": 64.0,
    "light": 450.0
  },
  {
    "time": "14:17:30",
    "temp": 29.2,
    "humidity": 63.8,
    "light": 460.0
  },
  {
    "time": "14:18:00",
    "temp": 29.5,
    "humidity": 63.5,
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
* **URL kết nối:** `ws://localhost:5000/ws`
* **Giao thức:** Standard WebSocket

#### Dữ liệu nhận được từ Server:
```json
{
  "type": "TELEMETRY",
  "data": {
    "temperature": 29.5,
    "humidity": 63.5,
    "light": 470.0,
    "time": "14:18:00"
  }
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
4. Bấm **Import**. Postman sẽ tự động sinh ra một bộ **Collection** chứa chuẩn 6 REST API trên mà không hề bị trùng lặp!
