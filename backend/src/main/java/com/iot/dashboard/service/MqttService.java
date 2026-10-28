package com.iot.dashboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot.dashboard.config.TelemetryWebSocketHandler;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class MqttService implements MqttCallback {

    private static final Logger log = LoggerFactory.getLogger(MqttService.class);
    // đi tìm trong application.properties, nếu k thấy thì gán giá trị bên dưới
    @Value("${mqtt.broker.url:tcp://127.0.0.1:1883}")
    private String brokerUrl;

    @Value("${mqtt.client.id:SpringBootBackendClient}")
    private String clientId;

    @Value("${mqtt.username:admin}")
    private String username;

    @Value("${mqtt.password:123456}")
    private String password;

    @Value("${mqtt.topic.sensor:data/sensors}")
    private String topicSensor;

    @Value("${mqtt.topic.control:device/control}")
    private String topicControl;

    @Value("${mqtt.topic.status:device/status}")
    private String topicStatus;

    @Value("${mqtt.simulation.enabled:true}")
    private boolean simulationEnabled;

    private final SensorService sensorService;
    private final DeviceService deviceService;
    private final TelemetryWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper = new ObjectMapper(); // phân tích chuỗi JSON thành dữ liệu Java.
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2); // 2 cái hẹn giờ

    private MqttClient client;
    private boolean isConnected = false;
    private volatile long lastSensorReceivedAt = 0;
    private volatile boolean isEspConnected = false; //

    public MqttService(
            @Lazy SensorService sensorService, // @Lazy tránh gọi nhau, vòng lặp luẩn quẩn
            @Lazy DeviceService deviceService,
            TelemetryWebSocketHandler webSocketHandler) {
        this.sensorService = sensorService;
        this.deviceService = deviceService;
        this.webSocketHandler = webSocketHandler;
    }

    @PostConstruct
    public void start() {
        connectToBroker();
        // startWatchdog(); // Tạm tắt vì Frontend hiện tại tự kiểm tra nhịp tim ESP32
        // qua REST API
    }

    // =========================================================================
    // [TẠM COMMENT VÌ KHÔNG DÙNG ĐẾN NỮA]
    // Trước đây dùng để bắn WebSocket "ESP_STATUS: OFFLINE".
    // Hiện tại Frontend đã tự kiểm tra nhịp tim (mốc thời gian điểm đo mới nhất)
    // qua REST API Polling.
    // =========================================================================
    /*
     * private void startWatchdog() {
     * // lặp đi lặp lại một việc sau mỗi 1 giây.
     * scheduler.scheduleAtFixedRate(() -> {
     * try {
     * if (isEspConnected && lastSensorReceivedAt > 0
     * && (System.currentTimeMillis() - lastSensorReceivedAt > 5000)) {
     * isEspConnected = false;
     * log.
     * warn("[ESP32 Watchdog] Quá 5s không nhận được telemetry -> Đánh dấu ESP32 OFFLINE"
     * );
     * //
     * webSocketHandler.broadcast("{\"type\":\"ESP_STATUS\",\"status\":\"OFFLINE\"}"
     * );
     * }
     * } catch (Exception e) {
     * log.error("[ESP32 Watchdog] Lỗi kiểm tra nhịp tim ESP32: {}",
     * e.getMessage());
     * }
     * }, 1, 1, TimeUnit.SECONDS);
     * }
     */

    private void connectToBroker() {
        try {
            if (brokerUrl != null) {
                brokerUrl = brokerUrl.trim();
            }
            log.info("[MQTT] Đang kết nối tới MQTT Broker tại {}...", brokerUrl);
            client = new MqttClient(brokerUrl, clientId + "-" + System.currentTimeMillis(),
                    new org.eclipse.paho.client.mqttv3.persist.MemoryPersistence()); // clientId cộng thêm
                                                                                     // currentTimeMillis() để đảm bảo
                                                                                     // không bị trùng lặp.

            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setConnectionTimeout(5);
            options.setKeepAliveInterval(60); // Cứ 60 giây gửi gói ping giữ kết nối
            options.setAutomaticReconnect(true);
            if (username != null && !username.isEmpty()) {
                options.setUserName(username.trim());
                options.setPassword(password.trim().toCharArray());
            }

            client.setCallback(this); // Đăng ký: "Có tin mới thì gọi các hàm trong class này!"
            client.connect(options); // Thực hiện kết nối
            isConnected = true;

            // Đăng ký nhận dữ liệu từ ESP32
            client.subscribe(topicSensor.trim());
            client.subscribe(topicStatus.trim());

            log.info("[MQTT] Đã kết nối MQTT Broker thành công! Subscribed: [{}, {}]", topicSensor, topicStatus);
            requestDeviceStatusCheck();
        } catch (Exception e) {
            isConnected = false;
            log.warn("[MQTT] Chưa kết nối được Broker ({}) - {}", brokerUrl, e.getMessage());
            log.info("[MQTT] Chế độ mô phỏng tự động bật (Simulation Mode). Hệ thống vẫn hoạt động bình thường!");
        }
    }

    // Gửi lệnh "status_check" để ESP32 báo trạng thái các thiết bị về server
    public void requestDeviceStatusCheck() {
        if (client != null && client.isConnected()) {
            try {
                String payload = "{\"action\":\"status_check\"}";
                MqttMessage message = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
                message.setQos(1); // 1 : đảm bảo tin nhắn được gửi ( ít nhất 1 lần )
                client.publish(topicControl, message);
                log.info("[MQTT] Đã gửi yêu cầu kiểm tra trạng thái thiết bị tới [{}]: {}", topicControl, payload);
            } catch (MqttException e) {
                log.error("[MQTT] Gửi yêu cầu kiểm tra trạng thái thất bại: {}", e.getMessage());
            }
        }
    }

    // Gửi lệnh điều khiển bật/tắt thiết bị qua topic 'device/control'
    public void publishDeviceControl(String deviceName, String action) {
        String ledKey = "Light".equalsIgnoreCase(deviceName) ? "led1" : "led2"; // light => led1
        String actStr = action.toLowerCase();

        // Tạo payload JSON: {"led1":"on"} hoặc {"led2":"off"}
        String payload = String.format("{\"%s\":\"%s\"}", ledKey, actStr);

        if (client != null && client.isConnected()) {
            try {
                MqttMessage message = new MqttMessage(payload.getBytes(StandardCharsets.UTF_8));
                message.setQos(1);
                client.publish(topicControl, message);
                log.info("[MQTT] Published to [{}]: {}", topicControl, payload);
            } catch (MqttException e) {
                log.error("[MQTT] Gửi lệnh thất bại: {}", e.getMessage());
            }
        } else { // chế độ mô phỏng
            log.info("[MQTT - Offline] Gửi lệnh mô phỏng cho {}: {}", deviceName, payload);
            if (simulationEnabled) {
                // Mô phỏng độ trễ phần cứng ACK sau 1.2s nếu broker chưa bật
                scheduler.schedule(() -> {
                    deviceService.handleDeviceAck(deviceName, actStr);
                    // [WEBSOCKET] Tạm tắt:
                    // broadcastDeviceAck(deviceName, action.toUpperCase());
                }, 1200, TimeUnit.MILLISECONDS);
            }
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        isConnected = false;
        log.warn("[MQTT] Mất kết nối tới Broker: {}", cause != null ? cause.getMessage() : "Unknown");
    }

    // Xử lý gói tin nhận được
    // Cứ khi nào có tin nhắn đến hộp thư đã đăng ký, hãy tự động kích hoạt hàm
    // messageArrived(...)
    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        log.info("[MQTT] Nhận tin từ [{}]: {}", topic, payload);

        try {
            // 1. Dữ liệu cảm biến từ ESP32 gửi lên (data/sensors)
            if (topicSensor.equals(topic)) {
                lastSensorReceivedAt = System.currentTimeMillis();
                if (!isEspConnected) {
                    isEspConnected = true;
                    log.info("🟢 [ESP32 Watchdog] Đã nhận tín hiệu từ ESP32 -> Đánh dấu ESP32 ONLINE");
                    // [WEBSOCKET] Tạm tắt vì Frontend tự kiểm tra qua REST API Polling:
                    // webSocketHandler.broadcast("{\"type\":\"ESP_STATUS\",\"status\":\"ONLINE\"}");
                    // Yêu cầu ESP32 phản hồi trạng thái thiết bị để đồng bộ toggle với Web
                    requestDeviceStatusCheck();
                }

                JsonNode json = objectMapper.readTree(payload);
                Double rawTemp = json.has("temp") ? json.get("temp").asDouble() : 0.0;
                Double rawHumid = json.has("humid") ? json.get("humid").asDouble() : 0.0;
                Double rawLight = json.has("light") ? json.get("light").asDouble() : 0.0;
                Double rawCo2 = json.has("co2") ? json.get("co2").asDouble() : null;

                // Làm tròn 1 chữ số thập phân cho nhiệt độ và độ ẩm
                Double temp = (double) Math.round(rawTemp * 10.0) / 10.0;
                Double humid = (double) Math.round(rawHumid * 10.0) / 10.0;

                // Đảo chiều quang trở: ESP32 ADC 12-bit (0 - 4095) và làm tròn số nguyên cho
                // Ánh sáng
                Double light = (double) Math.round(Math.max(0.0, 4095.0 - rawLight));
                Double co2 = rawCo2 != null ? (double) Math.round(rawCo2) : (double) Math.round(400.0 + (Math.random() * 250.0));

                // Lưu vào database và lấy ra danh sách bản ghi với ID tự tăng thật
                java.util.List<com.iot.dashboard.entity.DataSensor> savedList = sensorService.saveReading(temp, humid,
                        light, co2);

                /*
                 * [WEBSOCKET] Tạm tắt broadcast vì Frontend đã chuyển sang gọi REST API
                 * /api/sensors/latest mỗi 2s:
                 * com.iot.dashboard.entity.DataSensor savedTemp = savedList.get(0);
                 * com.iot.dashboard.entity.DataSensor savedHum = savedList.get(1);
                 * com.iot.dashboard.entity.DataSensor savedLight = savedList.get(2);
                 * 
                 * String fullTime = savedTemp.getMeasuredAt().format(DateTimeFormatter.
                 * ofPattern("yyyy-MM-dd HH:mm:ss"));
                 * String timeStr =
                 * savedTemp.getMeasuredAt().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
                 * 
                 * String wsMsg = String.format(
                 * java.util.Locale.US,
                 * "{\"type\":\"SENSOR_UPDATE\",\"time\":\"%s\",\"temp\":%.1f,\"humidity\":%.1f,\"light\":%.1f,"
                 * +
                 * "\"records\":[" +
                 * "{\"id\":%d,\"sensorType\":\"Light\",\"value\":%.1f,\"fullTime\":\"%s\"}," +
                 * "{\"id\":%d,\"sensorType\":\"Humidity\",\"value\":%.1f,\"fullTime\":\"%s\"},"
                 * +
                 * "{\"id\":%d,\"sensorType\":\"Temperature\",\"value\":%.1f,\"fullTime\":\"%s\"}"
                 * +
                 * "]}",
                 * timeStr, temp, humid, light,
                 * savedLight.getId(), light, fullTime,
                 * savedHum.getId(), humid, fullTime,
                 * savedTemp.getId(), temp, fullTime);
                 * webSocketHandler.broadcast(wsMsg);
                 */
            }

            // 2. Phản hồi trạng thái xác nhận từ ESP32 (device/status)
            if (topicStatus.equals(topic)) {
                JsonNode json = objectMapper.readTree(payload);
                if (json.has("led1")) {
                    String status = json.get("led1").asText(); // "on" / "off"
                    deviceService.handleDeviceAck("Light", status);
                    // [WEBSOCKET] Tạm tắt:
                    // broadcastDeviceAck("Light", status.toUpperCase());
                }
                if (json.has("led2")) {
                    String status = json.get("led2").asText();
                    deviceService.handleDeviceAck("Fan", status);
                    // [WEBSOCKET] Tạm tắt:
                    // broadcastDeviceAck("Fan", status.toUpperCase());
                }
            }
        } catch (Exception e) {
            log.error("[MQTT] Lỗi phân tích gói tin: {}", e.getMessage());
        }
    }

    // [WEBSOCKET] Tạm comment vì Frontend đã tự Polling qua REST API:
    /*
     * private void broadcastDeviceAck(String device, String status) {
     * String wsMsg = String.format(
     * "{\"type\":\"DEVICE_ACK\",\"device\":\"%s\",\"status\":\"%s\"}", device,
     * status);
     * webSocketHandler.broadcast(wsMsg);
     * }
     */

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // No-op
    }

    @PreDestroy
    public void stop() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
            }
        } catch (MqttException ignored) {
        }
        scheduler.shutdown();
    }
}
