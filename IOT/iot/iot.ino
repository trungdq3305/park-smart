#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <HTTPClient.h>

// --- CẤU HÌNH ---
const char* ssid = "#02 Tan My";
const char* password = "0982621234";
const char* pythonServerUrl = "http://10.20.30.200:1836/nfc-scan";

// --- CẤU HÌNH CHÂN ---
const int SERVO_PIN = 13;
const int SENSOR_PIN = 14;

// 💡 SỬ DỤNG ĐÈN LED CÓ SẴN TRÊN BOARD WEACT S3
// Thông thường là GPIO 48. Nếu không sáng, thử đổi thành số 2 hoặc 38.
const int BUILTIN_LED_PIN = 48; 

// NFC PINS
const int NFC_SDA_PIN = 4;
const int NFC_SCK_PIN = 5;
const int NFC_MOSI_PIN = 6;
const int NFC_MISO_PIN = 7;
const int NFC_RST_PIN = 15;

Servo barrierServo;
MFRC522 mfrc522(NFC_SDA_PIN, NFC_RST_PIN);
WebServer server(80);

const int OPEN_ANGLE = 90;
const int CLOSE_ANGLE = 0;
enum GateState { CLOSED, OPEN, WAITING };
GateState currentState = CLOSED;

// --- HÀM NHÁY ĐÈN BÁO HIỆU ---
void blinkFeedback() {
  digitalWrite(BUILTIN_LED_PIN, HIGH); // Bật đèn
  delay(100); 
  digitalWrite(BUILTIN_LED_PIN, LOW);  // Tắt đèn
}

void sendNfcToPython(String uidString) {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin(pythonServerUrl);
    http.setConnectTimeout(1000); // Timeout cực ngắn để quét nhanh
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"nfc_id\": \"" + uidString + "\"}";
    int code = http.POST(payload);
    http.end();
    
    // Nếu gửi thành công -> Nháy đèn
    if (code > 0) {
      blinkFeedback();
    }
  }
}

void handleOpen() {
  barrierServo.write(OPEN_ANGLE);
  currentState = OPEN;
  server.send(200, "text/plain", "OPEN");
}

void setup() {
  Serial.begin(115200);
  
  // Setup LED tích hợp
  pinMode(BUILTIN_LED_PIN, OUTPUT);
  digitalWrite(BUILTIN_LED_PIN, LOW); // Tắt mặc định

  // Setup Servo & Sensor
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  barrierServo.attach(SERVO_PIN);
  barrierServo.write(CLOSE_ANGLE);

  // Setup NFC
  SPI.begin(NFC_SCK_PIN, NFC_MISO_PIN, NFC_MOSI_PIN, NFC_SDA_PIN);
  mfrc522.PCD_Init();

  // Setup Wifi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(200);
  WiFi.setSleep(false); // Max performance

  server.on("/open", HTTP_GET, handleOpen);
  server.begin();
  
  // Nháy đèn 3 lần báo hiệu khởi động xong
  blinkFeedback(); delay(100); blinkFeedback(); delay(100); blinkFeedback();
}

void loop() {
  server.handleClient();

  // LOGIC QUÉT NHANH (FAST SCAN)
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    
    Serial.println("SCAN: " + uid);
    sendNfcToPython(uid);

    // Dừng thẻ
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
    
    // Nghỉ 0.5s giữa các lần quẹt để tránh trùng
    delay(500); 
  }

  // Logic đóng cổng tự động
  if (currentState == OPEN && digitalRead(SENSOR_PIN) == LOW) currentState = WAITING;
  if (currentState == WAITING && digitalRead(SENSOR_PIN) == HIGH) {
    delay(1500);
    barrierServo.write(CLOSE_ANGLE);
    currentState = CLOSED;
  }
}