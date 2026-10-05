# 🌐 IoT Smart Dashboard & Hardware Controller

Hệ thống giám sát dữ liệu cảm biến và điều khiển thiết bị thông minh theo thời gian thực (Real-time).

- **Sinh viên:** Đào Trung Hiếu
- **Mã sinh viên:** B23DCCN298
- **Lớp:** D23CNPM02
- **Trường:** Học viện Công nghệ Bưu chính Viễn thông (PTIT)
- **Môn học:** Lập trình IoT / Hệ thống IoT

---

## 🏛️ Kiến trúc hệ thống (System Architecture)

```
[ ESP32 + Sensors + LEDs ]
          │ ▲
     MQTT │ │ MQTT (Topic: data/sensors, device/control, device/status)
          ▼ │
 [ Mosquitto MQTT Broker (Port 1883) ]
          │ ▲
     MQTT │ │ MQTT (Paho Client)
          ▼ │
[ Spring Boot 3 Backend (Port 5000) ] ──── [ Database: H2 In-Memory / MySQL ]
          │ ▲
REST API  │ │ WebSocket (ws://localhost:5000/ws)
          ▼ │
[ React 19 Frontend (Port 5173) ]
```

---

## 📂 Cấu trúc thư mục (Monorepo)

```text
IoT Dashboard/
├── 🌐 frontend/              # Ứng dụng Web Dashboard (React 19, Vite, Tailwind CSS)
│   ├── src/                 # Giao diện, components, live chart, services
│   ├── package.json
│   └── vite.config.ts
│
├── ⚙️ backend/               # Server API & Cầu nối MQTT (Spring Boot 3, Java 17)
│   ├── src/main/java/       # Controller, Service, Repository, Entity, WebSocket
│   ├── database/schema.sql  # Script tạo Database MySQL nộp bài
│   ├── mvnw & mvnw.cmd      # Maven Wrapper (chạy không cần cài Maven)
│   └── pom.xml
│
├── 📟 esp32/                 # Mã nguồn vi điều khiển ESP32 (Arduino IDE)
│   └── sketch_sep6a_copy_20261005210446.ino
│
└── 📖 README.md              # Tài liệu hướng dẫn cài đặt & vận hành
```

---

## 🚀 Hướng dẫn chạy dự án (Getting Started)

### 1. Khởi động Backend (Spring Boot)

> **Yêu cầu:** Máy tính đã cài đặt **Java 17** trở lên.

Mở terminal thứ nhất tại thư mục gốc:

```powershell
cd backend

# Chạy với cơ chế mặc định (H2 In-Memory Database - Không cần cài MySQL):
.\mvnw.cmd spring-boot:run
```

- Server backend sẽ chạy tại: `http://localhost:5000`
- Giao diện quản lý Database trực quan: `http://localhost:5000/h2-console`
  - **JDBC URL:** `jdbc:h2:mem:iot_dashboard`
  - **Username:** `sa`
  - **Password:** *(để trống)*

*(Tùy chọn: Khi bạn muốn kết nối vào MySQL thật, chạy: `.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=mysql`)*

---

### 2. Khởi động Frontend (React + Vite)

> **Yêu cầu:** Máy tính đã cài đặt **Node.js** (khuyến nghị v18+).

Mở terminal thứ hai tại thư mục gốc:

```powershell
cd frontend

# Cài đặt thư viện (nếu mới clone về lần đầu):
npm install

# Khởi chạy máy chủ giao diện:
npm run dev
```

- Mở trình duyệt truy cập: `http://localhost:5173` (hoặc cổng được hiển thị trong terminal).
- Giao diện web sẽ tự động kết nối API và WebSocket tới `http://localhost:5000`.

---

### 3. Cấu hình & Nạp code ESP32

1. Mở file [sketch_sep6a_copy_20261005210446.ino](file:///c:/Users/Admin/coding-2nd/nam%204%20-%20ki%202/IOT/IoT%20Dashboard/esp32/sketch_sep6a_copy_20261005210446.ino) bằng **Arduino IDE**.
2. Cài đặt các thư viện cần thiết trong Library Manager:
   - `WiFi` (tích hợp sẵn với board ESP32)
   - `PubSubClient` (của Nick O'Leary)
   - `DHT sensor library` (của Adafruit)
3. Chỉnh sửa thông tin mạng trong code:
   ```cpp
   const char* ssid = "Tên_Wifi_Của_Bạn"; 
   const char* password = "Mat_Khau_Wifi";
   const char* mqtt_server = "192.168.x.x"; // IP máy tính chạy Mosquitto Broker
   const int mqtt_port = 1883;
   ```
4. **Sơ đồ nối chân phần cứng:**
   - Cảm biến DHT11 (Data) ➔ Chân `D4`
   - Cảm biến Quang trở LDR (Analog) ➔ Chân `D32`
   - Đèn LED 1 (Light) ➔ Chân `D5`
   - Đèn LED 2 (Fan / Quạt) ➔ Chân `D18`
5. Chọn đúng cổng COM và nhấn **Upload**.

---

## 📡 Đặc tả giao thức MQTT

| Hướng dữ liệu | Topic | Định dạng gói tin (Payload) | Ý nghĩa |
|---|---|---|---|
| **ESP32 ➔ Backend** | `data/sensors` | `{"temp":28.5,"humid":70.0,"light":1250}` | Gửi chỉ số cảm biến định kỳ mỗi 2 giây |
| **Backend ➔ ESP32** | `device/control` | `{"led1":"on"}` hoặc `{"led2":"off"}` | Gửi lệnh bật/tắt Đèn 1 (Light) hoặc Đèn 2 (Fan) |
| **ESP32 ➔ Backend** | `device/status` | `{"led1":"on"}` hoặc `{"led2":"off"}` | ESP32 gửi phản hồi xác nhận (ACK) phần cứng đã chuyển trạng thái |

> **Chế độ mô phỏng tự động (Simulation Mode):**
> Nếu bạn chưa bật Mosquitto Broker hoặc chưa kết nối phần cứng ESP32, Backend sẽ tự động bật chế độ mô phỏng: vẫn phản hồi ACK sau 1.2s và tự sinh dữ liệu telemetry để bạn test toàn bộ giao diện Web mượt mà 100%!

---

## 🔌 Danh mục RESTful API

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/api/sensors` | Lấy danh sách cảm biến phẳng (hỗ trợ tìm kiếm, lọc theo loại, sắp xếp, phân trang) |
| `GET` | `/api/sensors/latest` | Lấy 15 điểm đo mới nhất cho đồ thị LiveChart |
| `GET` | `/api/devices/status` | Lấy trạng thái hiện tại của toàn bộ thiết bị (`light`, `fan`) |
| `POST` | `/api/devices/toggle` | Gửi lệnh điều khiển bật/tắt thiết bị (`{"device":"Light","action":"ON"}`) |
| `GET` | `/api/devices/logs` | Lấy toàn bộ lịch sử thao tác bật/tắt thiết bị |
| `GET` | `/api/profile` | Thông tin cá nhân sinh viên |
| `WS` | `/ws` | WebSocket endpoint nhận dữ liệu telemetry và trạng thái ACK thời gian thực |

---

## ✨ Tính năng nổi bật

1. **Dashboard thời gian thực (Real-time):** Sử dụng WebSocket hai chiều, biểu đồ đường trượt mượt mà mỗi 2 giây mà không cần người dùng tải lại trang.
2. **Cơ chế xác nhận trạng thái phần cứng (Hardware ACK):** Khi bấm nút công tắc, hệ thống hiển thị trạng thái `PENDING` nhấp nháy cho đến khi nhận được tín hiệu ACK từ ESP32 mới chính thức chuyển trạng thái `ON/OFF`.
3. **Phân trang & Tìm kiếm linh hoạt:** Tìm kiếm theo giá trị đo, loại cảm biến, thời gian, hỗ trợ sắp xếp theo thứ tự mới nhất / cũ nhất.
4. **Không phụ thuộc môi trường cài đặt sẵn:** Tích hợp H2 In-Memory Database + Maven Wrapper giúp thầy cô hoặc người chấm bài có thể chạy dự án ngay lập tức chỉ với 1 câu lệnh mà không cần cài đặt MySQL hay Maven trước.
