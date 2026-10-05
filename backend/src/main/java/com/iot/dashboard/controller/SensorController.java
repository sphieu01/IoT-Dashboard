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
    @GetMapping
    public ResponseEntity<?> getSensors(
            @RequestParam(required = false, defaultValue = "all") String searchType,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "10") int limit,
            @RequestParam(required = false) Integer perPage
    ) {
        int pageSize = perPage != null ? perPage : limit;
        Map<String, Object> result = sensorService.getFlatSensors(searchType, query, sort, page, pageSize);
        return ResponseEntity.ok(result);
    }

    // 2. Lấy 15 điểm đo mới nhất cho biểu đồ thời gian thực (LiveChart)
    @GetMapping("/latest")
    public ResponseEntity<List<LiveChartPointDto>> getLatestPoints(
            @RequestParam(required = false, defaultValue = "15") int limit
    ) {
        return ResponseEntity.ok(sensorService.getLatestChartPoints(limit));
    }
}
