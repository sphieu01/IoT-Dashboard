package com.iot.dashboard.config;

import com.iot.dashboard.entity.Device;
import com.iot.dashboard.entity.Sensor;
import com.iot.dashboard.repository.DeviceRepository;
import com.iot.dashboard.repository.SensorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final SensorRepository sensorRepository;
    private final DeviceRepository deviceRepository;

    public DataInitializer(
            SensorRepository sensorRepository,
            DeviceRepository deviceRepository) {
        this.sensorRepository = sensorRepository;
        this.deviceRepository = deviceRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Khởi tạo danh mục Cảm biến mặc định nếu chưa có (tbl_sensors)
        sensorRepository.findByType("temperature")
                .orElseGet(() -> sensorRepository.save(new Sensor("DHT11", "temperature")));
        sensorRepository.findByType("humidity")
                .orElseGet(() -> sensorRepository.save(new Sensor("DHT11", "humidity")));
        sensorRepository.findByType("light")
                .orElseGet(() -> sensorRepository.save(new Sensor("LDR", "light")));

        // 2. Khởi tạo danh mục 2 Thiết bị mặc định nếu chưa có (tbl_devices)
        deviceRepository.findByNameIgnoreCase("Light")
                .orElseGet(() -> deviceRepository.save(new Device("Light", "OFF")));
        deviceRepository.findByNameIgnoreCase("Fan")
                .orElseGet(() -> deviceRepository.save(new Device("Fan", "OFF")));

        log.info("✅ [Initializer] Đã sẵn sàng danh mục cảm biến và thiết bị trong CSDL.");
    }
}
