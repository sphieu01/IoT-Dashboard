package com.iot.dashboard.config;

import com.iot.dashboard.entity.Device;
import com.iot.dashboard.entity.Sensor;
import com.iot.dashboard.entity.User;
import com.iot.dashboard.repository.DeviceRepository;
import com.iot.dashboard.repository.SensorRepository;
import com.iot.dashboard.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
// Kiểm tra xem trong DB đã có sẵn các cảm biến, thiết bị và tài khoản admin chưa, nếu chưa thì thêm vào.
public class DataInitializer implements CommandLineRunner {

        private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

        private final SensorRepository sensorRepository;
        private final DeviceRepository deviceRepository;
        private final UserRepository userRepository;

        public DataInitializer(
                        SensorRepository sensorRepository,
                        DeviceRepository deviceRepository,
                        UserRepository userRepository) {
                this.sensorRepository = sensorRepository;
                this.deviceRepository = deviceRepository;
                this.userRepository = userRepository;
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
                deviceRepository.findByNameIgnoreCase("Light 2")
                                .orElseGet(() -> deviceRepository.save(new Device("Light 2", "OFF")));
                deviceRepository.findByNameIgnoreCase("Alert LED")
                                .orElseGet(() -> deviceRepository.save(new Device("Alert LED", "OFF")));

                // 3. Khởi tạo tài khoản Quản trị viên mặc định nếu chưa có (tbl_users)
                userRepository.findByUsername("admin")
                                .orElseGet(() -> userRepository.save(new User("admin", "123456", "Administrator", "ADMIN")));

                log.info(" [Initializer] Đã sẵn sàng danh mục cảm biến, thiết bị và tài khoản admin (admin / 123456) trong CSDL.");
        }
}
