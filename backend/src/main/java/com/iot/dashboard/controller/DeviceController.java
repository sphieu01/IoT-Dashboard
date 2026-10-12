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
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        if (page != null) {
            int pageSize = (limit != null && limit > 0) ? limit : 8;
            Map<String, Object> result = historyService.getFilteredHistoryLogs(query, sort, page, pageSize);
            return ResponseEntity.ok(result);
        }
        List<DeviceHistoryDto> list = historyService.getAllHistoryLogs();
        return ResponseEntity.ok(list);
    }
}
