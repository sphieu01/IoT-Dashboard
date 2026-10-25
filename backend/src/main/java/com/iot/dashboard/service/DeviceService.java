package com.iot.dashboard.service;

import com.iot.dashboard.dto.DeviceHistoryDto;
import com.iot.dashboard.entity.Device;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import com.iot.dashboard.repository.DeviceRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
public class DeviceService {

    private final DeviceRepository deviceRepository;
    private final DeviceHistoryRepository historyRepository;
    private final MqttService mqttService;
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public DeviceService(
            DeviceRepository deviceRepository,
            DeviceHistoryRepository historyRepository,
            @Lazy MqttService mqttService) {
        this.deviceRepository = deviceRepository;
        this.historyRepository = historyRepository;
        this.mqttService = mqttService;
    }

    // Lấy trạng thái tất cả các thiết bị: { "light": true, "fan": false }
    public Map<String, Boolean> getDeviceStates() {
        Map<String, Boolean> states = new HashMap<>();
        states.put("light", false);
        states.put("fan", false);

        List<Device> list = deviceRepository.findAll();
        for (Device d : list) {
            states.put(d.getName().toLowerCase(), "ON".equalsIgnoreCase(d.getCurrentStatus()));
        }
        return states;
    }

    // Điều khiển bật tắt thiết bị từ Web
    @Transactional
    public DeviceHistoryDto toggleDevice(String deviceName, String action) {
        String devName = "Light".equalsIgnoreCase(deviceName) ? "Light" : "Fan";
        String targetAction = "ON".equalsIgnoreCase(action) ? "ON" : "OFF";

        Device device = deviceRepository.findByNameIgnoreCase(devName)
                .orElseGet(() -> deviceRepository.save(new Device(devName, "OFF")));

        // 1. Tạo log PENDING lưu vào database
        DeviceHistory history = new DeviceHistory(device, targetAction, "PENDING", LocalDateTime.now());
        history = historyRepository.save(history);
        final Long historyId = history.getId();

        // 2. Gửi lệnh qua MQTT Broker tới ESP32
        mqttService.publishDeviceControl(devName, targetAction);

        // 3. Sau 5 giây, nếu ESP32 không phản hồi (vẫn PENDING) thì tự động chuyển thành FAIL
        CompletableFuture.delayedExecutor(5, TimeUnit.SECONDS).execute(() -> {
            try {
                expirePendingLog(historyId);
            } catch (Exception e) {
                System.err.println("[DeviceService] Lỗi khi xử lý timeout 5s cho history log #" + historyId + ": " + e.getMessage());
            }
        });

        return new DeviceHistoryDto(
                history.getId(),
                device.getName(),
                history.getAction(),
                history.getStatus(),
                history.getExecutedAt().format(fullTimeFormatter));
    }

    // Hết thời gian chờ (5s) chuyển bản ghi PENDING sang FAIL
    @Transactional
    public void expirePendingLog(Long historyId) {
        historyRepository.findById(historyId).ifPresent(h -> {
            if ("PENDING".equalsIgnoreCase(h.getStatus())) {
                h.setStatus("FAIL");
                historyRepository.save(h);
                System.out.println("⏱️ [DeviceService] Log #" + historyId + " (" + 
                        (h.getDevice() != null ? h.getDevice().getName() : "Device") + " " + h.getAction() + 
                        ") quá 5s không phản hồi -> Đã chuyển trạng thái sang FAIL");
            }
        });
    }

    // Tác vụ nền định kỳ quét các bản ghi PENDING đã quá 5 giây và cập nhật thành FAIL
    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void checkStalePendingLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(5);
        List<DeviceHistory> staleList = historyRepository.findByStatusIgnoreCaseAndExecutedAtBefore("PENDING", threshold);
        if (!staleList.isEmpty()) {
            for (DeviceHistory h : staleList) {
                h.setStatus("FAIL");
            }
            historyRepository.saveAll(staleList);
            System.out.println("⏱️ [Scheduler] Đã cập nhật " + staleList.size() + " bản ghi PENDING quá 5s sang FAIL.");
        }
    }

    // Xử lý xác nhận từ ESP32 qua topic 'device/status'
    @Transactional
    public void handleDeviceAck(String deviceName, String status) {
        String devName = "Light".equalsIgnoreCase(deviceName) ? "Light" : "Fan";
        String stateUpper = status.toUpperCase();

        // Cập nhật trạng thái thiết bị trong tbl_devices
        Device device = deviceRepository.findByNameIgnoreCase(devName)
                .orElseGet(() -> new Device(devName, stateUpper));
        device.setCurrentStatus(stateUpper);
        deviceRepository.save(device);

        // Cập nhật log PENDING gần nhất của thiết bị thành trạng thái xác nhận
        // (ON/OFF/SUCCESS)
        Optional<DeviceHistory> pendingOpt = historyRepository
                .findTop1ByDevice_NameIgnoreCaseAndStatusOrderByExecutedAtDesc(devName, "PENDING");

        if (pendingOpt.isPresent()) {
            DeviceHistory h = pendingOpt.get();
            if ("FAIL".equalsIgnoreCase(stateUpper) || "ERROR".equalsIgnoreCase(stateUpper)) {
                h.setStatus("FAIL");
            } else {
                h.setStatus("SUCCESS");
            }
            historyRepository.save(h);
        }
    }
}
