package com.iot.dashboard.controller;

import com.iot.dashboard.dto.DeviceToggleRequest;
import com.iot.dashboard.dto.HistoryLogDto;
import com.iot.dashboard.service.DeviceService;
import com.iot.dashboard.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;
    private final HistoryService historyService;

    public DeviceController(DeviceService deviceService, HistoryService historyService) {
        this.deviceService = deviceService;
        this.historyService = historyService;
    }

    // 1. Lấy trạng thái hiện tại của thiết bị (light, fan)
    @GetMapping("/status")
    public ResponseEntity<Map<String, Boolean>> getDeviceStatus() {
        return ResponseEntity.ok(deviceService.getDeviceStates());
    }

    // 2. Bật / Tắt thiết bị (Gửi lệnh MQTT tới ESP32) - Hỗ trợ cả /control (chuẩn SRS) và /toggle (Frontend)
    @PostMapping({"/control", "/toggle"})
    public ResponseEntity<HistoryLogDto> toggleDevice(@RequestBody DeviceToggleRequest request) {
        if (request.getDevice() == null || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        HistoryLogDto result = deviceService.toggleDevice(request.getDevice(), request.getAction());
        return ResponseEntity.ok(result);
    }

    // 3. Lấy lịch sử thao tác bật tắt - Hỗ trợ cả /history (chuẩn SRS) và /logs (Frontend)
    @GetMapping({"/history", "/logs"})
    public ResponseEntity<?> getDeviceLogs(
            @RequestParam(required = false) String query,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit
    ) {
        if (page != null && limit != null) {
            Map<String, Object> result = historyService.getFilteredHistoryLogs(query, sort, page, limit);
            return ResponseEntity.ok(result);
        }
        List<HistoryLogDto> list = historyService.getAllHistoryLogs();
        return ResponseEntity.ok(list);
    }
}
