#include <WiFi.h>
#include <WiFiMulti.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- KHAI BÁO CHÂN CẮM 4 LED (3 ĐÈN ĐIỀU KHIỂN + 1 ĐÈN CẢNH BÁO) ---
#define DPIN 4        
#define DTYPE DHT11   
#define LDR_PIN 32    
#define LED1_PIN 5        // Đèn điều khiển 1 (Light)
#define LED2_PIN 18       // Đèn điều khiển 2 (Fan)
#define LED3_PIN 19       // Đèn điều khiển 3 (Light 2)
#define LED_ALERT_PIN 21  // Đèn cảnh báo ánh sáng > x (tự động nháy khi vượt ngưỡng)

DHT dht(DPIN, DTYPE);

// --- BIẾN CẢNH BÁO ÁNH SÁNG > x (x người dùng tự cấu hình từ Web) ---
float lightThreshold = 1000.0; // Ngưỡng ánh sáng mặc định (LUX)
bool isLightAlert = false;
unsigned long lastAlertBlink = 0;
bool alertLedState = LOW;

// ==============================================================
// --- CẤU HÌNH 2 MẠNG WI-FI & IP MQTT BROKER TƯƠNG ỨNG ---
// ==============================================================
// 1. Mạng Hotspot điện thoại (iPhone)
const char* WIFI_1_SSID = "Iphone 10+=2"; 
const char* WIFI_1_PASS = "12345678910";
const char* MQTT_SERVER_1 = "172.20.10.6";  // IP Laptop khi phát Hotspot iPhone

// 2. Mạng WiFi ở nhà (Tự động phát hiện trên Laptop: "Green House", IP: 192.168.1.35)
const char* WIFI_2_SSID = "Green House";
const char* WIFI_2_PASS = "0606060408"; 
const char* MQTT_SERVER_2 = "192.168.1.35"; // IP Laptop khi bắt WiFi nhà

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

// HÀM BÁO CÁO TRẠNG THÁI HIỆN TẠI CỦA CẢ 4 ĐÈN LÊN TOPIC device/status
void publishDeviceStatus() {
  String s1 = (digitalRead(LED1_PIN) == HIGH) ? "on" : "off";
  String s2 = (digitalRead(LED2_PIN) == HIGH) ? "on" : "off";
  String s3 = (digitalRead(LED3_PIN) == HIGH) ? "on" : "off";
  String sAlert = isLightAlert ? "on" : "off";
  String payload = "{\"led1\":\"" + s1 + "\",\"led2\":\"" + s2 + "\",\"led3\":\"" + s3 + "\",\"alertLed\":\"" + sAlert + "\"}";
  client.publish("device/status", payload.c_str());
  Serial.print("-> Đã đồng bộ trạng thái 4 thiết bị lên server: ");
  Serial.println(payload);
}

// HÀM CALLBACK: XỬ LÝ LỆNH BẬT TẮT 3 ĐÈN ĐỘC LẬP VÀ CẬP NHẬT NGƯỠNG
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Co lenh moi tu topic [");
  Serial.print(topic);
  Serial.print("]: ");
  
  String messageTemp = "";
  for (int i = 0; i < length; i++) {
    messageTemp += (char)payload[i];
  }
  
  messageTemp.toLowerCase(); 
  Serial.println(messageTemp);

  if (String(topic) == "device/control") {
    // --- 1. XỬ LÝ LỆNH KIỂM TRA TRẠNG THÁI TỪ SERVER ---
    if (messageTemp.indexOf("status") >= 0 || messageTemp.indexOf("check") >= 0) {
      Serial.println("-> Nhận yêu cầu kiểm tra trạng thái từ Server!");
      publishDeviceStatus();
      return;
    }

    // --- 2. CẬP NHẬT NGƯỠNG ÁNH SÁNG x TỪ WEB ---
    int threshIdx = messageTemp.indexOf("lightthreshold");
    if (threshIdx >= 0) {
      int colonIdx = messageTemp.indexOf(":", threshIdx);
      if (colonIdx >= 0) {
        String numStr = "";
        for (int j = colonIdx + 1; j < messageTemp.length(); j++) {
          char c = messageTemp[j];
          if ((c >= '0' && c <= '9') || c == '.') {
            numStr += c;
          } else if (numStr.length() > 0) {
            break;
          }
        }
        if (numStr.length() > 0) {
          lightThreshold = numStr.toFloat();
          Serial.print("-> Đã cập nhật ngưỡng ánh sáng mới: ");
          Serial.print(lightThreshold);
          Serial.println(" LUX");
        }
      }
    }

    // --- 3. XỬ LÝ ĐÈN 1 (Light) ---
    if (messageTemp.indexOf("led1: on") >= 0 || messageTemp.indexOf("\"led1\":\"on\"") >= 0) {
      digitalWrite(LED1_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 1 (Light)!");
      client.publish("device/status", "{\"led1\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led1: off") >= 0 || messageTemp.indexOf("\"led1\":\"off\"") >= 0) {
      digitalWrite(LED1_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 1 (Light)!");
      client.publish("device/status", "{\"led1\":\"off\"}");
    }

    // --- 4. XỬ LÝ ĐÈN 2 (Fan) ---
    if (messageTemp.indexOf("led2: on") >= 0 || messageTemp.indexOf("\"led2\":\"on\"") >= 0) {
      digitalWrite(LED2_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 2 (Fan)!");
      client.publish("device/status", "{\"led2\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led2: off") >= 0 || messageTemp.indexOf("\"led2\":\"off\"") >= 0) {
      digitalWrite(LED2_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 2 (Fan)!");
      client.publish("device/status", "{\"led2\":\"off\"}");
    }

    // --- 5. XỬ LÝ ĐÈN 3 (Light 2) ---
    if (messageTemp.indexOf("led3: on") >= 0 || messageTemp.indexOf("\"led3\":\"on\"") >= 0) {
      digitalWrite(LED3_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 3 (Light 2)!");
      client.publish("device/status", "{\"led3\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led3: off") >= 0 || messageTemp.indexOf("\"led3\":\"off\"") >= 0) {
      digitalWrite(LED3_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 3 (Light 2)!");
      client.publish("device/status", "{\"led3\":\"off\"}");
    }
  }
}

void setup() {
  Serial.begin(9600);
  dht.begin();
  
  // Khai báo Output và tắt cả 4 đèn lúc mới khởi động (LED1, LED2, LED3, LED Alert)
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  pinMode(LED3_PIN, OUTPUT);
  pinMode(LED_ALERT_PIN, OUTPUT);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(LED3_PIN, LOW);
  digitalWrite(LED_ALERT_PIN, LOW);
  
  // Đăng ký mạng Wi-Fi
  wifiMulti.addAP(WIFI_1_SSID, WIFI_1_PASS);
  wifiMulti.addAP(WIFI_2_SSID, WIFI_2_PASS);

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
    if (wifiMulti.run() != WL_CONNECTED) {
      Serial.println("Mất kết nối Wi-Fi, đang tìm kiếm lại mạng...");
      delay(2000);
      continue;
    }

    setupMqttServer();

    Serial.print("Đang ket noi MQTT Broker (" + String(current_mqtt_server) + ")... ");
    String clientId = "ESP32Client-" + String(random(0, 1000));
    
    if (client.connect(clientId.c_str(), "admin", "123456")) {
      Serial.println("Thanh cong!");
      client.subscribe("device/control"); // Đăng ký nhận lệnh

      // Đồng bộ trạng thái thực tế của cả 4 đèn lên server ngay khi kết nối lại
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
  if (wifiMulti.run() != WL_CONNECTED) {
    delay(500);
    return;
  }

  if (!client.connected()) {
    reconnect();
  }
  client.loop(); 

  // --- XỬ LÝ NHÁY ĐÈN CẢNH BÁO KHI ÁNH SÁNG > x (Chu kỳ 150ms) ---
  unsigned long now = millis();
  if (isLightAlert) {
    if (now - lastAlertBlink >= 150) {
      lastAlertBlink = now;
      alertLedState = !alertLedState;
      digitalWrite(LED_ALERT_PIN, alertLedState);
    }
  } else {
    digitalWrite(LED_ALERT_PIN, LOW);
    alertLedState = LOW;
  }

  // --- LUỒNG PUBLISH DỮ LIỆU CẢM BIẾN MỖI 2 GIÂY ---
  if (now - lastMsg > 2000) {
    lastMsg = now;
    
    float tc = dht.readTemperature(false);
    float hu = dht.readHumidity();
    int lightRaw = analogRead(LDR_PIN);

    // Tính giá trị ánh sáng thực tế đảo chiều (0 - 4095 LUX)
    float lightLux = (float)max(0, 4095 - lightRaw);

    // KIỂM TRA NGƯỠNG CẢNH BÁO ÁNH SÁNG > x
    if (lightLux > lightThreshold) {
      if (!isLightAlert) {
        isLightAlert = true;
        client.publish("device/status", "{\"alertLed\":\"on\"}");
        Serial.print("⚠️ [CẢNH BÁO] Ánh sáng ");
        Serial.print(lightLux);
        Serial.print(" LUX vượt ngưỡng ");
        Serial.print(lightThreshold);
        Serial.println(" LUX -> Đèn cảnh báo nháy liên tiếp!");
      }
    } else {
      if (isLightAlert) {
        isLightAlert = false;
        client.publish("device/status", "{\"alertLed\":\"off\"}");
        Serial.println("✅ [AN TOÀN] Ánh sáng đã trở về mức an toàn.");
      }
    }

    if (isnan(tc) || isnan(hu)) return;

    String payload = "{";
    payload += "\"temp\":" + String(tc) + ",";
    payload += "\"humid\":" + String(hu) + ",";
    payload += "\"light\":" + String(lightRaw);
    payload += "}";

    client.publish("data/sensors", payload.c_str()); 
  }
}