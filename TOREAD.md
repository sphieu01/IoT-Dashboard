# Thứ tự đọc project — từ nhánh → gốc

```
NGUYÊN TẮC:
TẦNG 0 — Cấu hình môi trường & Thư viện
TẦNG 1 — Mô hình dữ liệu thuần túy (không phụ thuộc tầng nào khác)
TẦNG 2 — Truy vấn dữ liệu (chỉ phụ thuộc Tầng 1)
TẦNG 3 — Cấu hình hệ thống & Realtime Socket
TẦNG 4 — Nghiệp vụ cốt lõi (Service - ráp nối Repository, MQTT, WebSocket)
TẦNG 5 — Cổng giao tiếp REST API (Controller đón Request từ Frontend)
TẦNG CUỐI — Điểm khởi động ứng dụng (main)
```

---

# 🌐 PHẦN A — FRONTEND (React + TypeScript)

> *Ghi chú: Các mục có dấu `✅` hoặc `✔` là các file bạn đã đọc xong.*

## 🌿 TẦNG 1 — Định nghĩa thuần túy (không import file nào trong project)

| Thứ tự | File | Nội dung | Trạng thái |
|---|---|---|:---:|
| 1 | `src/types/index.ts` | Khai báo tất cả kiểu TypeScript (`PageTab`, `SensorReading`, `DeviceStates`...) | ✅ | 
| 2 | `src/services/api.ts` | Hàm tạo dữ liệu giả (`randomTemp`, `generateLiveReading`...) | ✔ |
| 3 | `src/services/mockData.ts` | Dữ liệu mẫu ban đầu (`INITIAL_SENSOR_ROWS`, `INITIAL_HISTORY_ROWS`) | ✅ |

---

## 🌱 TẦNG 2 — Component nhỏ nhất (chỉ nhận props, không gọi component khác)

| Thứ tự | File | Nội dung | Trạng thái |
|---|---|---|:---:|
| 4 | `src/components/common/SensorCard.tsx` | Card hiển thị 1 chỉ số cảm biến | ✅ |
| 5 | `src/components/common/Toggle.tsx` | Nút bật/tắt | ✅ |
| 6 | `src/components/common/OnOffBadge.tsx` | Badge trạng thái ON/OFF | ✅ |
| 7 | `src/components/common/Pagination.tsx` | Nút phân trang | ✅ |
| 8 | `src/components/common/index.ts` | Re-export gom các common components lại | ✅ |

---

## 🌿 TẦNG 3 — Component phức tạp hơn (dùng component tầng 2)

| Thứ tự | File | Nội dung | Trạng thái |
|---|---|---|:---:|
| 9 | `src/components/dashboard/LiveChart.tsx` | Biểu đồ sensor realtime | ✅ |
| 10 | `src/components/dashboard/DeviceControl.tsx` | Panel bật/tắt thiết bị (dùng `Toggle`) | ✅ |

---

## 🌳 TẦNG 4 — Pages (lắp ghép các component)

| Thứ tự | File | Nội dung | Trạng thái |
|---|---|---|:---:|
| 11 | `src/pages/DashboardPage.tsx` | Trang chính: SensorCard + LiveChart + DeviceControl | ✅ |
| 12 | `src/pages/DataSensorPage.tsx` | Bảng dữ liệu cảm biến + lọc/tìm kiếm | ✅ |
| 13 | `src/pages/HistoryPage.tsx` | Lịch sử bật/tắt thiết bị | ✅ |
| 14 | `src/pages/ProfilePage.tsx` | Trang hồ sơ người dùng | ✅ |

---

## 🌲 TẦNG 5 — Khung sườn & Gốc Frontend

| Thứ tự | File | Nội dung | Trạng thái |
|---|---|---|:---:|
| 15 | `src/components/Layout.tsx` | Sidebar + Header + vùng chứa page | ✅ |
| 16 | `src/App.tsx` | Gốc: giữ toàn bộ state, điều phối trang | ✅ |
| 17 | `src/main.tsx` | Điểm khởi động: mount `<App/>` vào `index.html` | [ ] |

---

# ☕ PHẦN B — BACKEND (Spring Boot + Java 17)

> *Quy tắc: Đọc từ Định nghĩa dữ liệu (Entity/DTO) $\rightarrow$ Tầng dữ liệu (Repository) $\rightarrow$ Tầng cấu hình (Config) $\rightarrow$ Tầng logic (Service) $\rightarrow$ Tầng API (Controller) $\rightarrow$ File chạy chính.*

## ⚙️ TẦNG 0 — Cấu hình & Thư viện nền tảng

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B0.1 | `backend/pom.xml` | Khai báo các Starter: Web, JPA, WebSocket, Paho MQTT v3, MySQL, H2. | [ ] |
| B0.2 | `backend/src/main/resources/application.properties` | Khai báo port (8080), MQTT Broker (`tcp://localhost:1883`), Topic MQTT, DB H2 in-memory. | [ ] |
| B0.3 | `backend/src/main/resources/application-mysql.properties` | Cấu hình chuyển đổi sang MySQL thật khi cần chạy production. | [ ] |

---

## 🌿 TẦNG 1 — Mô hình dữ liệu thuần túy (Entity & DTO)
*Các class này là khuôn mẫu dữ liệu (POJO), hoàn toàn độc lập, không phụ thuộc vào tầng nào.*

### 1.1. Entities (Ánh xạ trực tiếp bảng Database)
| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B1.1 | `backend/src/main/java/com/iot/dashboard/entity/DeviceHistory.java` | Bảng `device_history`: Lưu log hành động bật/tắt (`device`, `action`, `createdAt`). Có đánh index để tìm kiếm nhanh. | [ ] |
| B1.2 | `backend/src/main/java/com/iot/dashboard/entity/DeviceState.java` | Bảng `device_states`: Lưu trạng thái hiện tại của từng thiết bị (`id`, `name`, `status`, `lastUpdated`). | [ ] |
| B1.3 | `backend/src/main/java/com/iot/dashboard/entity/SensorReading.java` | Bảng `sensor_readings`: Lưu chỉ số cảm biến đo được (`temperature`, `humidity`, `light`, `timestamp`). | [ ] |

### 1.2. DTO (Data Transfer Object - Gói dữ liệu trao đổi với Web Client)
| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B1.4 | `backend/src/main/java/com/iot/dashboard/dto/DeviceToggleRequest.java` | Nhận request bật/tắt thiết bị từ Frontend gửi lên: `{ "status": true/false }`. | [ ] |
| B1.5 | `backend/src/main/java/com/iot/dashboard/dto/LiveChartPointDto.java` | Format điểm dữ liệu nhẹ để vẽ biểu đồ realtime (`time`, `temperature`, `humidity`, `light`). | [ ] |
| B1.6 | `backend/src/main/java/com/iot/dashboard/dto/SensorFlatDto.java` | Dữ liệu từng dòng cho bảng Data Sensor (hỗ trợ phân trang, lọc). | [ ] |
| B1.7 | `backend/src/main/java/com/iot/dashboard/dto/HistoryLogDto.java` | Dữ liệu từng dòng log cho bảng History bật/tắt thiết bị. | [ ] |
| B1.8 | `backend/src/main/java/com/iot/dashboard/dto/ProfileResponse.java` | Trả về thông tin sinh viên/nhà phát triển hệ thống. | [ ] |

---

## 🗄️ TẦNG 2 — Truy vấn Cơ sở dữ liệu (Repository)
*Kế thừa `JpaRepository` của Spring Data JPA. Tự động có sẵn các hàm CRUD mà không cần viết SQL.*

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B2.1 | `backend/src/main/java/com/iot/dashboard/repository/DeviceStateRepository.java` | Truy vấn và cập nhật trạng thái thiết bị theo ID (`LED`, `FAN`,...). | [ ] |
| B2.2 | `backend/src/main/java/com/iot/dashboard/repository/DeviceHistoryRepository.java` | Lấy lịch sử thiết bị, sắp xếp theo thời gian mới nhất (`findAllByOrderByCreatedAtDesc`). | [ ] |
| B2.3 | `backend/src/main/java/com/iot/dashboard/repository/SensorReadingRepository.java` | Lấy 1 bản ghi mới nhất cho Dashboard (`findTopByOrderByTimestampDesc`), lấy 10 điểm cho biểu đồ, truy vấn theo khoảng thời gian. | [ ] |

---

## 🔌 TẦNG 3 — Cấu hình hệ thống & Realtime Socket
*Thiết lập môi trường mạng, bảo mật CORS và kênh truyền dữ liệu WebSocket.*

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B3.1 | `backend/src/main/java/com/iot/dashboard/config/CorsConfig.java` | Cấu hình cho phép Frontend (`localhost:5173`, `localhost:3000`) gọi API Backend không bị chặn CORS. | [ ] |
| B3.2 | `backend/src/main/java/com/iot/dashboard/config/TelemetryWebSocketHandler.java` | Quản lý danh sách kết nối WebSocket (`CopyOnWriteArrayList`), hàm `broadcastTelemetry()` đẩy dữ liệu tức thì xuống React. | [ ] |
| B3.3 | `backend/src/main/java/com/iot/dashboard/config/WebSocketConfig.java` | Đăng ký đường dẫn endpoint `/ws/telemetry` kết nối với `TelemetryWebSocketHandler`. | [ ] |
| B3.4 | `backend/src/main/java/com/iot/dashboard/config/DataInitializer.java` | Chạy lúc server vừa khởi động (`CommandLineRunner`), nạp sẵn dữ liệu mẫu vào DB nếu rỗng. | [ ] |

---

## 🧠 TẦNG 4 — Tầng Nghiệp vụ cốt lõi (Service)
*Nơi chứa toàn bộ logic xử lý: tính toán, phối hợp giữa DB, MQTT và WebSocket.*

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B4.1 | `backend/src/main/java/com/iot/dashboard/service/HistoryService.java` | Lưu log lịch sử khi bật tắt, lấy danh sách phân trang và tìm kiếm log. | [ ] |
| B4.2 | `backend/src/main/java/com/iot/dashboard/service/SensorService.java` | Lấy dữ liệu cảm biến mới nhất, định dạng dữ liệu cho biểu đồ, lọc theo ngày giờ. | [ ] |
| B4.3 | `backend/src/main/java/com/iot/dashboard/service/DeviceService.java` | Xử lý logic bật/tắt thiết bị: cập nhật DB $\rightarrow$ ghi log history $\rightarrow$ gọi `MqttService` gửi lệnh xuống phần cứng. | [ ] |
| B4.4 | `backend/src/main/java/com/iot/dashboard/service/MqttService.java` | ⭐ **TRỌNG TÂM**: Cầu nối MQTT: kết nối Mosquitto, subscribe topic ESP32, nhận JSON cảm biến $\rightarrow$ lưu DB $\rightarrow$ bắn WebSocket, gửi lệnh điều khiển xuống ESP32. | [ ] |

---

## 🚪 TẦNG 5 — Tầng REST Controller (Cổng tiếp nhận HTTP Request)
*Nhận request từ Frontend React, gọi Service xử lý và trả về JSON.*

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B5.1 | `backend/src/main/java/com/iot/dashboard/controller/ProfileController.java` | API `/api/profile`: trả về thông tin cá nhân/sinh viên. | [ ] |
| B5.2 | `backend/src/main/java/com/iot/dashboard/controller/SensorController.java` | API `/api/sensors/...`: `/live`, `/chart`, `/history` (phục vụ trang Dashboard & Data Sensor). | [ ] |
| B5.3 | `backend/src/main/java/com/iot/dashboard/controller/HistoryController.java` | API `/api/history/...`: lấy danh sách lịch sử bật/tắt thiết bị (phục vụ trang History). | [ ] |
| B5.4 | `backend/src/main/java/com/iot/dashboard/controller/DeviceController.java` | API `/api/devices/...`: lấy trạng thái tất cả thiết bị, toggle bật/tắt (`POST /api/devices/{id}/toggle`). | [ ] |

---

## 🚀 TẦNG CUỐI — Điểm khởi động Backend

| Thứ tự | File | Nội dung & Điểm mấu chốt cần nắm | Đã đọc |
|---|---|---|:---:|
| B6.1 | `backend/src/main/java/com/iot/dashboard/DashboardApplication.java` | Chứa hàm `main()`, đánh dấu `@SpringBootApplication`, kích hoạt quét Bean (Component Scanning) và bật server nhúng Tomcat. | [ ] |

---

## 🔄 Sơ đồ luồng hoạt động tổng thể Backend

```
                                 [ ESP32 Phần Cứng ]
                                      ▲          │
                 (2) Gửi lệnh điều khiển│          │ (1) Gửi gói tin cảm biến
                 [Topic: devices/control]│          │ [Topic: sensors/telemetry]
                                      │          ▼
                            [ Mosquitto MQTT Broker ]
                                      ▲          │
                                      │          ▼
                        ┌─────────────┴──────────┴───────────────┐
                        │             MqttService                │
                        └───────┬─────────────────────┬──────────┘
                                │ (Nhận telemetry)    │ (Lưu & Bắn WS)
                                ▼                     ▼
                     ┌──────────────────┐    ┌───────────────────────────┐
                     │  SensorService   │    │ TelemetryWebSocketHandler │
                     └─────────┬────────┘    └─────────────┬─────────────┘
                               │                           │ (Realtime Push)
                               ▼                           ▼
                     [ SensorRepository ]       [ React LiveChart / Card ]
                               │
                               ▼
                        [ Cơ sở dữ liệu ]
                         (H2 / MySQL)
                               ▲
                               │ (Lưu trạng thái & Log)
                     ┌─────────┴────────┐
                     │  DeviceService   │
                     └─────────▲────────┘
                               │ (Gọi khi bấm công tắc)
                     ┌─────────┴────────┐
                     │ DeviceController │
                     └─────────▲────────┘
                               │ HTTP POST /api/devices/{id}/toggle
                     [ React Dashboard ]
```

