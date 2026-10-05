package com.iot.dashboard.config;

import com.iot.dashboard.entity.DeviceHistory;
import com.iot.dashboard.entity.DeviceState;
import com.iot.dashboard.entity.SensorReading;
import com.iot.dashboard.repository.DeviceHistoryRepository;
import com.iot.dashboard.repository.DeviceStateRepository;
import com.iot.dashboard.repository.SensorReadingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Random;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final SensorReadingRepository sensorRepository;
    private final DeviceHistoryRepository historyRepository;
    private final DeviceStateRepository deviceStateRepository;

    public DataInitializer(
            SensorReadingRepository sensorRepository,
            DeviceHistoryRepository historyRepository,
            DeviceStateRepository deviceStateRepository) {
        this.sensorRepository = sensorRepository;
        this.historyRepository = historyRepository;
        this.deviceStateRepository = deviceStateRepository;
    }

    @Override
    public void run(String... args) {
        // 1. Khởi tạo 2 thiết bị mặc định
        if (deviceStateRepository.count() == 0) {
            deviceStateRepository.save(new DeviceState("light", "Light", false));
            deviceStateRepository.save(new DeviceState("fan", "Fan", false));
            log.info("✅ [Initializer] Đã khởi tạo 2 thiết bị: Light, Fan");
        }

        // 2. Khởi tạo dữ liệu cảm biến mẫu nếu DB trống
        if (sensorRepository.count() == 0) {
            Random random = new Random();
            LocalDateTime now = LocalDateTime.now();

            for (int i = 30; i >= 1; i--) {
                double temp = Math.round((28.5 + random.nextDouble() * 2.5) * 10.0) / 10.0;
                double humid = Math.round((70.0 + random.nextDouble() * 15.0) * 10.0) / 10.0;
                double light = Math.round((600.0 + random.nextDouble() * 400.0) * 10.0) / 10.0;

                LocalDateTime recordTime = now.minusSeconds((long) i * 2);
                sensorRepository.save(new SensorReading(temp, humid, light, recordTime));
            }
            log.info("✅ [Initializer] Đã tạo sẵn 30 bản ghi cảm biến mẫu trong DB");
        }

        // 3. Khởi tạo lịch sử thao tác mẫu nếu DB trống
        if (historyRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();
            historyRepository.save(new DeviceHistory("Light", "ON", "ON", now.minusMinutes(30)));
            historyRepository.save(new DeviceHistory("Fan", "ON", "ON", now.minusMinutes(25)));
            historyRepository.save(new DeviceHistory("Light", "OFF", "OFF", now.minusMinutes(20)));
            historyRepository.save(new DeviceHistory("Fan", "OFF", "OFF", now.minusMinutes(10)));
            historyRepository.save(new DeviceHistory("Light", "ON", "ON", now.minusMinutes(5)));
            log.info("✅ [Initializer] Đã tạo sẵn dữ liệu lịch sử thao tác mẫu trong DB");
        }
    }
}
