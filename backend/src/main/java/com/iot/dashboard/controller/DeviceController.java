package com.iot.dashboard.controller;

import com.iot.dashboard.dto.DeviceHistoryDto;
import com.iot.dashboard.dto.DeviceToggleRequest;
import com.iot.dashboard.service.DeviceHistoryService;
import com.iot.dashboard.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;
    private final DeviceHistoryService historyService;

    public DeviceController(DeviceService deviceService, DeviceHistoryService historyService) {
        this.deviceService = deviceService;
        this.historyService = historyService;
    }

    // 1. Lấy trạng thái hiện tại của thiết bị (light, fan)
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getDeviceStatus() {
        return ResponseEntity.ok(deviceService.getDeviceStates());
    }

    // 2. Bật / Tắt thiết bị (Gửi lệnh MQTT tới ESP32)
    @PostMapping("/control")
    public ResponseEntity<DeviceHistoryDto> toggleDevice(@RequestBody DeviceToggleRequest request) {
        if (request.getDevice() == null || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        DeviceHistoryDto result = deviceService.toggleDevice(request.getDevice(), request.getAction());
        return ResponseEntity.ok(result);
    }

    // 3. Lấy lịch sử thao tác bật tắt
    @GetMapping("/history")
    public ResponseEntity<?> getDeviceLogs(
            @RequestParam(required = false, defaultValue = "all") String device,
            @RequestParam(required = false, defaultValue = "all") String action,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "") String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "8") int limit
    ) {
        int pageSize = Math.min(Math.max(limit, 1), 1000);
        int safePage = Math.max(page, 1);
        Map<String, Object> result = historyService.getFilteredHistoryLogs(device, action, status, query, sort, safePage, pageSize);
        return ResponseEntity.ok(result);
    }
}
