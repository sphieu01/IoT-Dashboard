# IoT Dashboard - Spring Boot Backend & MQTT Bridge

Backend REST API và MQTT Bridge dành cho hệ thống IoT Dashboard.
- **Framework:** Spring Boot 3.3.4 (Java 17)
- **Database:** H2 In-Memory (chạy ngay không cần cài đặt) / MySQL (chỉ cần đổi 1 dòng config)
- **Giao thức kết nối:** HTTP REST API, WebSocket (Realtime telemetry), MQTT (kết nối ESP32)

---

## 🚀 Cách chạy Backend

Mở terminal tại thư mục `backend/`:

### 1. Chạy với H2 In-Memory Database (Mặc định - Chưa cần MySQL)
```bash
# Trên Windows PowerShell hoặc CMD:
.\mvnw.cmd spring-boot:run
```
*Hệ thống sẽ tự khởi tạo bảng và nạp sẵn 30 bản ghi cảm biến mẫu để bạn test ngay trên giao diện web.*
- Xem bảng dữ liệu trực quan: `http://localhost:5000/h2-console`
  - JDBC URL: `jdbc:h2:mem:iot_dashboard`
  - User: `sa`
  - Password: *(để trống)*

### 2. Chuyển sang kết nối MySQL (Khi đã cài MySQL / XAMPP)
Chạy lệnh kèm profile `mysql`:
```bash
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=mysql
```
Hoặc mở file `src/main/resources/application.properties` và thêm dòng:
```properties
spring.profiles.active=mysql
```
File script tạo database: [schema.sql](file:///c:/Users/Admin/coding-2nd/nam%204%20-%20ki%202/IOT/IoT%20Dashboard/backend/database/schema.sql)

---

## 📡 Khớp nối MQTT với ESP32

Các topic và thông số trong backend đã được cấu hình khớp 100% với code ESP32 (`sketch_sep6a_copy_20261005210446.ino`):

| Hướng | MQTT Topic | Nội dung gói tin | Mô tả |
|---|---|---|---|
| **ESP32 ➔ Server** | `data/sensors` | `{"temp":28.5,"humid":70.0,"light":1250}` | Gửi chỉ số cảm biến định kỳ mỗi 2 giây |
| **Server ➔ ESP32** | `device/control` | `{"led1":"on"}` hoặc `{"led2":"off"}` | Gửi lệnh bật/tắt Đèn 1 (Light) hoặc Đèn 2 (Fan) |
| **ESP32 ➔ Server** | `device/status` | `{"led1":"on"}` hoặc `{"led2":"off"}` | ESP32 xác nhận (ACK) phần cứng đã bật/tắt thành công |

> **Lưu ý chế độ mô phỏng (Simulation Mode):**
> Nếu bạn chưa bật Mosquitto MQTT Broker hoặc chưa cắm ESP32, backend sẽ tự động mô phỏng độ trễ phần cứng sau 1.2s để trạng thái `PENDING` trên web vẫn chuyển sang `ON/OFF` mượt mà!

---

## 🔌 Danh sách REST API

| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/sensors?page=1&limit=10&searchType=all&query=...` | Dữ liệu cảm biến phân trang, tìm kiếm |
| `GET` | `/api/sensors/latest` | 15 điểm đo mới nhất cho biểu đồ LiveChart |
| `GET` | `/api/devices/status` | Trạng thái các thiết bị `{ "light": false, "fan": false }` |
| `POST` | `/api/devices/toggle` | Điều khiển bật/tắt thiết bị `{ "device": "Light", "action": "ON" }` |
| `GET` | `/api/devices/logs` | Lịch sử thao tác bật/tắt thiết bị |
| `GET` | `/api/profile` | Thông tin sinh viên (Đào Trung Hiếu - B23DCCN298) |
| `WS` | `ws://localhost:5000/ws` | Kênh WebSocket truyền nhận dữ liệu thời gian thực |
