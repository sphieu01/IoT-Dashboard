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

    // 2. Bật / Tắt thiết bị (Gửi lệnh MQTT tới ESP32)
    @PostMapping("/toggle")
    public ResponseEntity<HistoryLogDto> toggleDevice(@RequestBody DeviceToggleRequest request) {
        if (request.getDevice() == null || request.getAction() == null) {
            return ResponseEntity.badRequest().build();
        }
        HistoryLogDto result = deviceService.toggleDevice(request.getDevice(), request.getAction());
        return ResponseEntity.ok(result);
    }

    // 3. Lấy lịch sử thao tác bật tắt
    @GetMapping("/logs")
    public ResponseEntity<List<HistoryLogDto>> getDeviceLogs() {
        return ResponseEntity.ok(historyService.getAllHistoryLogs());
    }
}
