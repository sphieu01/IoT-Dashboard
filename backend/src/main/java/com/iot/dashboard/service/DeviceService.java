package com.iot.dashboard.service;

import com.iot.dashboard.dto.HistoryLogDto;
import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.entity.DeviceState;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import com.iot.dashboard.repository.DeviceStateRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class DeviceService {

    private final DeviceStateRepository deviceStateRepository;
    private final DeviceHistoryRepository historyRepository;
    private final MqttService mqttService;
    private final DateTimeFormatter fullTimeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public DeviceService(
            DeviceStateRepository deviceStateRepository,
            DeviceHistoryRepository historyRepository,
            @Lazy MqttService mqttService) {
        this.deviceStateRepository = deviceStateRepository;
        this.historyRepository = historyRepository;
        this.mqttService = mqttService;
    }

    // Lấy trạng thái tất cả các thiết bị: { "light": true, "fan": false }
    public Map<String, Boolean> getDeviceStates() {
        Map<String, Boolean> states = new HashMap<>();
        states.put("light", false);
        states.put("fan", false);

        List<DeviceState> list = deviceStateRepository.findAll();
        for (DeviceState ds : list) {
            states.put(ds.getDeviceKey().toLowerCase(), ds.getState());
        }
        return states;
    }

    // Điều khiển bật tắt thiết bị từ Web
    @Transactional
    public HistoryLogDto toggleDevice(String deviceName, String action) {
        String devName = "Light".equalsIgnoreCase(deviceName) ? "Light" : "Fan";
        String targetAction = "ON".equalsIgnoreCase(action) ? "ON" : "OFF";

        // 1. Tạo log PENDING lưu vào database
        DeviceHistory history = new DeviceHistory(devName, targetAction, "PENDING", LocalDateTime.now());
        history = historyRepository.save(history);

        // 2. Gửi lệnh qua MQTT Broker tới ESP32
        mqttService.publishDeviceControl(devName, targetAction);

        return new HistoryLogDto(
                history.getId(),
                history.getDevice(),
                history.getAction(),
                history.getStatus(),
                history.getCreatedAt().format(fullTimeFormatter)
        );
    }

    // Xử lý khi ESP32 gửi phản hồi ACK qua topic 'device/status'
    @Transactional
    public void handleDeviceAck(String deviceName, String status) {
        String key = deviceName.toLowerCase();
        boolean isOn = "on".equalsIgnoreCase(status);

        // Cập nhật trạng thái thiết bị
        DeviceState state = deviceStateRepository.findById(key)
                .orElse(new DeviceState(key, deviceName, isOn));
        state.setState(isOn);
        state.setUpdatedAt(LocalDateTime.now());
        deviceStateRepository.save(state);

        // Cập nhật log PENDING gần nhất của thiết bị thành trạng thái xác nhận (ON/OFF)
        Optional<DeviceHistory> pendingOpt = historyRepository
                .findTop1ByDeviceAndStatusOrderByCreatedAtDesc(deviceName, "PENDING");
        
        if (pendingOpt.isPresent()) {
            DeviceHistory h = pendingOpt.get();
            h.setStatus(status.toUpperCase());
            historyRepository.save(h);
        }
    }
}
