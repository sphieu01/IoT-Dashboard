package com.iot.dashboard.service;

import com.iot.dashboard.dto.HistoryLogDto;
import com.iot.dashboard.entity.Device;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import com.iot.dashboard.repository.DeviceRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
    public HistoryLogDto toggleDevice(String deviceName, String action) {
        String devName = "Light".equalsIgnoreCase(deviceName) ? "Light" : "Fan";
        String targetAction = "ON".equalsIgnoreCase(action) ? "ON" : "OFF";

        Device device = deviceRepository.findByNameIgnoreCase(devName)
                .orElseGet(() -> deviceRepository.save(new Device(devName, "OFF")));

        // 1. Tạo log PENDING lưu vào database
        DeviceHistory history = new DeviceHistory(device, targetAction, "PENDING", LocalDateTime.now());
        history = historyRepository.save(history);

        // 2. Gửi lệnh qua MQTT Broker tới ESP32
        mqttService.publishDeviceControl(devName, targetAction);

        return new HistoryLogDto(
                history.getId(),
                device.getName(),
                history.getAction(),
                history.getStatus(),
                history.getExecutedAt().format(fullTimeFormatter)
        );
    }

    // Xử lý khi ESP32 gửi phản hồi ACK qua topic 'device/status'
    @Transactional
    public void handleDeviceAck(String deviceName, String status) {
        String devName = "Light".equalsIgnoreCase(deviceName) ? "Light" : "Fan";
        String stateUpper = status.toUpperCase();

        // Cập nhật trạng thái thiết bị trong tbl_devices
        Device device = deviceRepository.findByNameIgnoreCase(devName)
                .orElseGet(() -> new Device(devName, stateUpper));
        device.setCurrentStatus(stateUpper);
        deviceRepository.save(device);

        // Cập nhật log PENDING gần nhất của thiết bị thành trạng thái xác nhận (ON/OFF/SUCCESS)
        Optional<DeviceHistory> pendingOpt = historyRepository
                .findTop1ByDevice_NameIgnoreCaseAndStatusOrderByExecutedAtDesc(devName, "PENDING");
        
        if (pendingOpt.isPresent()) {
            DeviceHistory h = pendingOpt.get();
            h.setStatus(stateUpper);
            historyRepository.save(h);
        }
    }
}
