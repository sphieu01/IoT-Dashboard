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

    public SensorController(SensorService sensorService) {
        this.sensorService = sensorService;
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

    // 3. Lấy thống kê số cảnh báo theo từng ngày trong tháng (cho biểu đồ tháng)
    @GetMapping("/alerts/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyAlerts(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month
    ) {
        java.time.LocalDate now = java.time.LocalDate.now();
        int targetYear = (year != null && year >= 2000 && year <= 2100) ? year : now.getYear();
        int targetMonth = (month != null && month >= 1 && month <= 12) ? month : now.getMonthValue();
        return ResponseEntity.ok(sensorService.getMonthlyAlertStatistics(targetYear, targetMonth));
    }
}
