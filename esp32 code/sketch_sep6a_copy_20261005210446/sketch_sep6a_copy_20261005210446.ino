#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// --- KHAI BÁO CHÂN CẮM ---
#define DPIN 4        
#define DTYPE DHT11   
#define LDR_PIN 32    
#define LED1_PIN 5    // Đèn 1 cắm ở D5
#define LED2_PIN 18   // Đèn 2 cắm ở D18

DHT dht(DPIN, DTYPE);

// --- THÔNG TIN MẠNG & MQTT ---
const char* ssid = "Iphone 10+=2"; 
const char* password = "12345678910";
const char* mqtt_server = "172.20.10.6"; // IP Laptop (Hotspot)
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastMsg = 0;


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
    
    // --- XỬ LÝ ĐÈN 1 ---
    if (messageTemp.indexOf("led1: on") >= 0 || messageTemp.indexOf("\"led1\":\"on\"") >= 0) { // "\"led1\":\"on\"" == "led1":"on"
      digitalWrite(LED1_PIN, HIGH);
      Serial.println("-> Đã BẬT đèn 1!");
      // Báo cáo lại cho Server
      client.publish("device/status", "{\"led1\":\"on\"}");
    } 
    else if (messageTemp.indexOf("led1: off") >= 0 || messageTemp.indexOf("\"led1\":\"off\"") >= 0) {
      digitalWrite(LED1_PIN, LOW);
      Serial.println("-> Đã TẮT đèn 1!");
      // Báo cáo lại cho Server
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
  
  Serial.print("Đang ket noi Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi da ket noi!");

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback); // Lát nữa nếu có ai gửi tin nhắn đến, hãy gọi cái quy trình có tên là callback ra để xử lý nhé!
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Đang ket noi MQTT Broker... ");
    String clientId = "ESP32Client-" + String(random(0, 1000)); // esp tự xưng là ESP32Client-123...
    
    if (client.connect(clientId.c_str(), "admin", "123456")) { // .c_str() (C-string) – đây là phép thuật biến String trở về dạng nguyên thủy char* để bộ đàm đọc được!
      Serial.println("Thanh cong!");
      client.subscribe("device/control"); // Đăng ký nhận lệnh
    } else {
      Serial.print("That bai, ma loi = ");
      Serial.print(client.state());
      Serial.println(". Thu lai sau 5 giay.");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();  // ESP32 liên tục kiểm tra hòm thư xem có tin nhắn hay lệnh bật đèn nào mới tới không.

  // LUỒNG PUBLISH: Gửi dữ liệu mỗi 2 giây ---
  unsigned long now = millis();
  if (now - lastMsg > 2000) { // đa nhiệm thay cho delay(2000)
    lastMsg = now;
    
    float tc = dht.readTemperature(false);
    float hu = dht.readHumidity();
    int lightRaw = analogRead(LDR_PIN);

    if (isnan(tc) || isnan(hu)) return;

    String payload = "{";
    payload += "\"temp\":" + String(tc) + ",";
    payload += "\"humid\":" + String(hu) + ",";
    payload += "\"light\":" + String(lightRaw);
    payload += "}";

    client.publish("data/sensors", payload.c_str()); // Ném gói văn bản đó lên mạng (topic data/sensor)
  }
}