#include <WiFi.h>
#include <WiFiMulti.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- KHAI BÁO CHÂN CẮM ---
#define DPIN 4        
#define DTYPE DHT11   
#define LDR_PIN 32    
#define CO2_PIN 35    // Cảm biến khí CO2 / MQ-135 cắm ở chân 35 (ADC1)
#define LED1_PIN 5    // Đèn 1 cắm ở D5
#define LED2_PIN 18   // Đèn 2 cắm ở D18

DHT dht(DPIN, DTYPE);

// ==============================================================
// --- CẤU HÌNH 2 MẠNG WI-FI & IP MQTT BROKER TƯƠNG ỨNG ---
// ==============================================================
// 1. Mạng Hotspot điện thoại (iPhone)
const char* WIFI_1_SSID = "Iphone 10+=2"; 
const char* WIFI_1_PASS = "12345678910";
const char* MQTT_SERVER_1 = "172.20.10.6";  // IP Laptop khi phát Hotspot iPhone

// 2. Mạng WiFi ở nhà (Tự động phát hiện trên Laptop: "Green House", IP: 192.168.1.35)
const char* WIFI_2_SSID = "Green House";
const char* WIFI_2_PASS = "0606060408"; // <-- ĐIỀN MẬT KHẨU WIFI GREEN HOUSE VÀO ĐÂY
const char* MQTT_SERVER_2 = "192.168.1.35";         // IP Laptop khi bắt WiFi nhà (xem bằng lệnh ipconfig)

const int mqtt_port = 1883;

WiFiMulti wifiMulti;
WiFiClient espClient;
PubSubClient client(espClient);

const char* current_mqtt_server = "";
unsigned long lastMsg = 0;

// Khai báo trước hàm callback
void callback(char* topic, byte* payload, unsigned int length);

// HÀM TỰ ĐỘNG CHỌN IP MQTT BROKER PHÙ HỢP VỚI MẠNG ĐANG BẮT
void setupMqttServer() {
  String connectedSSID = WiFi.SSID();
  IPAddress localIP = WiFi.localIP();

  // Nhận diện theo tên SSID hoặc theo dải IP (172.x là Hotspot, 192.x là WiFi nhà)
  if (localIP[0] == 172) {
    current_mqtt_server = MQTT_SERVER_1;
    Serial.println("[MẠNG] Đang kết nối Hotspot (" + String(WIFI_1_SSID) + ")");
  } else {
    current_mqtt_server = MQTT_SERVER_2;
    Serial.println("[MẠNG] Đang kết nối WiFi Nhà (" + String(connectedSSID) + ")");
  }

  Serial.print("   -> IP ESP32: ");
  Serial.println(localIP);
  Serial.print("   -> MQTT Broker Server: ");
  Serial.println(current_mqtt_server);

  client.setServer(current_mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// HÀM BÁO CÁO TRẠNG THÁI HIỆN TẠI CỦA 2 ĐÈN LÊN TOPIC device/status
void publishDeviceStatus() {
  String s1 = (digitalRead(LED1_PIN) == HIGH) ? "on" : "off";
  String s2 = (digitalRead(LED2_PIN) == HIGH) ? "on" : "off";
  String payload = "{\"led1\":\"" + s1 + "\",\"led2\":\"" + s2 + "\"}";
  client.publish("device/status", payload.c_str());
  Serial.print("-> Đã đồng bộ trạng thái thiết bị lên server: ");
  Serial.println(payload);
}

// HÀM CALLBACK: XỬ LÝ LỆNH BẬT TẮT 2 ĐÈN ĐỘC LẬP
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Co lenh moi tu topic [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String messageTemp = "";
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  
  // Chuyển tất cả về chữ thường để dễ lọc
  messageTemp.toLowerCase(); 
  Serial.println(messageTemp);

  if (String(topic) == "device/control") {
    // --- XỬ LÝ LỆNH KIỂM TRA TRẠNG THÁI TỪ SERVER ---
    if (messageTemp.indexOf("status") >= 0 || messageTemp.indexOf("check") >= 0) {
      Serial.println("-> Nhận yêu cầu kiểm tra trạng thái từ Server!");
      publishDeviceStatus();
      return;
    }

    // --- XỬ LÝ ĐÈN 1 ---
    if (messageTemp.indexOf("led1: on") >= 0 || messageTemp.indexOf("\"led1\":\"on\"") >= 0) {
      digitalWrite(LED1_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 1!");
      client.publish("device/status", "{\"led1\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led1: off") >= 0 || messageTemp.indexOf("\"led1\":\"off\"") >= 0) {
      digitalWrite(LED1_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 1!");
      client.publish("device/status", "{\"led1\":\"off\"}");
    }

    // --- XỬ LÝ ĐÈN 2 ---
    if (messageTemp.indexOf("led2: on") >= 0 || messageTemp.indexOf("\"led2\":\"on\"") >= 0) {
      digitalWrite(LED2_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 2!");
      client.publish("device/status", "{\"led2\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led2: off") >= 0 || messageTemp.indexOf("\"led2\":\"off\"") >= 0) {
      digitalWrite(LED2_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 2!");
      client.publish("device/status", "{\"led2\":\"off\"}");
    }
  }
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Khai báo Output và tắt cả 2 đèn lúc mới khởi động
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  
  // Đăng ký cả 2 mạng Wi-Fi vào danh sách tự động tìm kiếm (WiFiMulti)
  wifiMulti.addAP(WIFI_1_SSID, WIFI_1_PASS);
  // wifiMulti.addAP(WIFI_2_SSID, WIFI_2_PASS);

  Serial.println("\nĐang quét và kết nối Wi-Fi (Hotspot hoặc WiFi nhà)...");
  while (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ Wi-Fi đã kết nối thành công!");
  setupMqttServer();
}

void reconnect() {
  while (!client.connected()) {
    // Nếu Wi-Fi bị đứt, đợi WiFiMulti tự kết nối lại trước
    if (wifiMulti.run() != WL_CONNECTED) {
      Serial.println("Mất kết nối Wi-Fi, đang tìm kiếm lại mạng...");
      delay(2000);
      continue;
    }

    // Cập nhật lại MQTT server theo mạng hiện tại (phòng trường hợp vừa đổi mạng)
    setupMqttServer();

    Serial.print("Đang ket noi MQTT Broker (" + String(current_mqtt_server) + ")... ");
    String clientId = "ESP32Client-" + String(random(0, 1000));
    
    if (client.connect(clientId.c_str(), "admin", "123456")) {
      Serial.println("Thanh cong!");
      client.subscribe("device/control"); // Đăng ký nhận lệnh

      // Đồng bộ trạng thái thực tế của 2 đèn lên server ngay khi kết nối lại
      publishDeviceStatus();
    } else {
      Serial.print("That bai, ma loi = ");
      Serial.print(client.state());
      Serial.println(". Thu lai sau 5 giay.");
      delay(5000);
    }
  }
}

void loop() {
  // Tự động duy trì và chuyển đổi mạng nếu 1 mạng bị mất sóng
  if (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    return;
  }

  if (!client.connected()) {
    reconnect();
  }
  client.loop();  // ESP32 liên tục kiểm tra hòm thư xem có tin nhắn hay lệnh mới không.

  // LUỒNG PUBLISH: Gửi dữ liệu mỗi 2 giây ---
  unsigned long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;
    
    float tc = dht.readTemperature(false);
    float hu = dht.readHumidity();
    // Đọc giá trị thô từ chân LDR (0 - 4095). Backend Spring Boot sẽ tự động đảo chiều (4095 - light)
    int lightRaw = analogRead(LDR_PIN);
    int co2Raw = analogRead(CO2_PIN);
    int co2Ppm = 400 + map(co2Raw, 0, 4095, 0, 1100);

    if (isnan(tc) || isnan(hu)) return;

    String payload = "{";
    payload += "\"temp\":" + String(tc) + ",";
    payload += "\"humid\":" + String(hu) + ",";
    payload += "\"light\":" + String(lightRaw) + ",";
    payload += "\"co2\":" + String(co2Ppm);
    payload += "}";

    client.publish("data/sensors", payload.c_str()); // Gửi gói tin lên topic data/sensors
  }
}