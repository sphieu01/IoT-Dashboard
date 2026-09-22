# IoT Dashboard - Backend Server

Hệ thống backend NodeJS Express sẵn sàng tích hợp với cơ sở dữ liệu và MQTT Broker dành cho ứng dụng IoT Dashboard.

## 🚀 Tính năng có sẵn:
1. **REST API**:
   - `GET /api/sensors?limit=30`: Lấy dữ liệu cảm biến gần nhất (Nhiệt độ, Độ ẩm, Ánh sáng).
   - `GET /api/devices/status`: Lấy trạng thái hiện tại của thiết bị (Light, Fan).
   - `POST /api/devices/toggle`: Gửi lệnh Bật / Tắt thiết bị (`{ "device": "Light", "action": "ON" }`).
   - `GET /api/devices/logs`: Lấy lịch sử thao tác điều khiển thiết bị.
   - `GET /api/profile`: Lấy thông tin sinh viên & đề tài.
2. **MQTT Integration Ready**:
   - Kết nối sẵn sàng tới MQTT Broker (HiveMQ / Mosquitto).
   - Tự động subscribe topic cảm biến `iot/dashboard/sensors`.
   - Publish lệnh điều khiển tới `iot/dashboard/commands` để gửi cho vi điều khiển (ESP32, ESP8266, STM32).

## 🛠️ Hướng dẫn cài đặt & chạy:

```bash
cd backend
npm install
npm run dev
# Server sẽ khởi chạy tại http://localhost:5000
```
