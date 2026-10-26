package com.iot.dashboard.controller;

import com.iot.dashboard.dto.LiveChartPointDto;
import com.iot.dashboard.service.SensorService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {

    private final SensorService sensorService;
    private final com.iot.dashboard.service.MqttService mqttService;

    public SensorController(SensorService sensorService, com.iot.dashboard.service.MqttService mqttService) {
        this.sensorService = sensorService;
        this.mqttService = mqttService;
    }

    // 1. Lấy dữ liệu cảm biến (hỗ trợ phân trang, tìm kiếm, lọc)
    @GetMapping("/history")
    public ResponseEntity<?> getSensors(
            @RequestParam(required = false, defaultValue = "all") String searchType,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "8") int limit
    ) {
        int safeLimit = Math.min(Math.max(limit, 1), 1000);
        int safePage = Math.max(page, 1);
        Map<String, Object> result = sensorService.getFlatSensors(searchType, query, sort, safePage, safeLimit);
        return ResponseEntity.ok(result);
    }

    // 2. Lấy 15 điểm đo mới nhất cho biểu đồ thời gian thực (LiveChart)
    @GetMapping("/latest")
    public ResponseEntity<List<LiveChartPointDto>> getLatestPoints(
            @RequestParam(required = false, defaultValue = "15") int limit
    ) {
        return ResponseEntity.ok(sensorService.getLatestChartPoints(limit));
    }

    // 3. Thống kê số lượng cảnh báo trong từng ngày của tháng (có lọc theo led cảnh báo)
    @GetMapping("/alerts/monthly")
    public ResponseEntity<?> getMonthlyAlerts(
            @RequestParam(required = false, defaultValue = "2026") int year,
            @RequestParam(required = false, defaultValue = "10") int month,
            @RequestParam(required = false, defaultValue = "Alert LED") String device
    ) {
        return ResponseEntity.ok(sensorService.getMonthlyAlertStatistics(year, month, device));
    }

    // 4. Lấy ngưỡng ánh sáng cảnh báo hiện tại (x)
    @GetMapping("/threshold/light")
    public ResponseEntity<Map<String, Object>> getLightThreshold() {
        return ResponseEntity.ok(Map.of("threshold", mqttService.getLightThreshold()));
    }

    // 5. Cập nhật ngưỡng ánh sáng cảnh báo (x) do người dùng tự nhập
    @PostMapping("/threshold/light")
    public ResponseEntity<Map<String, Object>> updateLightThreshold(@RequestBody Map<String, Object> body) {
        if (body.containsKey("threshold")) {
            double val = Double.parseDouble(body.get("threshold").toString());
            mqttService.setLightThreshold(val);
            return ResponseEntity.ok(Map.of("success", true, "threshold", val));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Thiếu tham số threshold"));
    }
}
