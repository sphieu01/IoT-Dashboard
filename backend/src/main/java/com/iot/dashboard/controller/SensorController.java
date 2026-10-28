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

    // 3. Đếm số lần vượt ngưỡng của 4 cảm biến từ MySQL
    @GetMapping("/exceed-counts")
    public ResponseEntity<Map<String, Long>> getExceedCounts(
            @RequestParam(required = false) Double temp,
            @RequestParam(required = false) Double humidity,
            @RequestParam(required = false) Double light,
            @RequestParam(required = false) Double co2
    ) {
        return ResponseEntity.ok(sensorService.getExceedanceCounts(temp, humidity, light, co2));
    }
}
