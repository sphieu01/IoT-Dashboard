# Thứ tự đọc project — từ nhánh → gốc

```
TẦNG 1 — Không import gì từ project (lá cây)
TẦNG 2 — Chỉ import từ tầng 1
TẦNG 3 — Import từ tầng 1 + 2
...
TẦNG CUỐI — Điểm khởi động
```

---

## 🌿 TẦNG 1 — Định nghĩa thuần túy (không import file nào trong project)

| Thứ tự | File | Nội dung |
|---|---|---|
| 1 | `src/types/index.ts` | Khai báo tất cả kiểu TypeScript (`PageTab`, `SensorReading`, `DeviceStates`...) ✅| 
| 2 | `src/services/api.ts` | Hàm tạo dữ liệu giả (`randomTemp`, `generateLiveReading`...) ✔ |
| 3 | `src/services/mockData.ts` | Dữ liệu mẫu ban đầu (`INITIAL_SENSOR_ROWS`, `INITIAL_HISTORY_ROWS`) ✅ |

---

## 🌱 TẦNG 2 — Component nhỏ nhất (chỉ nhận props, không gọi component khác)

| Thứ tự | File | Nội dung |
|---|---|---|
| 4 | `src/components/common/SensorCard.tsx` | Card hiển thị 1 chỉ số cảm biến ✅ |
| 5 | `src/components/common/Toggle.tsx` | Nút bật/tắt ✅ |
| 6 | `src/components/common/OnOffBadge.tsx` | Badge trạng thái ON/OFF |
| 7 | `src/components/common/Pagination.tsx` | Nút phân trang |
| 8 | `src/components/common/index.ts` | Re-export gom các common components lại |

---

## 🌿 TẦNG 3 — Component phức tạp hơn (dùng component tầng 2)

| Thứ tự | File | Nội dung |
|---|---|---|
| 9 | `src/components/dashboard/LiveChart.tsx` | Biểu đồ sensor realtime ✅ |
| 10 | `src/components/dashboard/DeviceControl.tsx` | Panel bật/tắt thiết bị (dùng `Toggle`) ✅ |

---

## 🌳 TẦNG 4 — Pages (lắp ghép các component)

| Thứ tự | File | Nội dung |
|---|---|---|
| 11 | `src/pages/DashboardPage.tsx` | Trang chính: SensorCard + LiveChart + DeviceControl ✅ |
| 12 | `src/pages/DataSensorPage.tsx` | Bảng dữ liệu cảm biến + lọc/tìm kiếm |
| 13 | `src/pages/HistoryPage.tsx` | Lịch sử bật/tắt thiết bị |
| 14 | `src/pages/ProfilePage.tsx` | Trang hồ sơ người dùng |

---

## 🌲 TẦNG 5 — Khung sườn & Gốc

| Thứ tự | File | Nội dung |
|---|---|---|
| 15 | `src/components/Layout.tsx` | Sidebar + Header + vùng chứa page |
| 16 | `src/App.tsx` | Gốc: giữ toàn bộ state, điều phối trang |
| 17 | `src/main.tsx` | Điểm khởi động: mount `<App/>` vào `index.html` |

---

## Sơ đồ cây

```
main.tsx
  └── App.tsx  (state tổng)
        └── Layout.tsx  (khung sidebar/header)
              ├── DashboardPage
              │     ├── SensorCard (×3)
              │     ├── LiveChart
              │     └── DeviceControl
              │           └── Toggle
              ├── DataSensorPage
              │     ├── Pagination
              │     └── OnOffBadge
              ├── HistoryPage
              │     └── Pagination, OnOffBadge
              └── ProfilePage
```
