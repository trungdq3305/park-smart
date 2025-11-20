#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <HTTPClient.h>

// ==========================================
// 1. CẤU HÌNH HỆ THỐNG (USER CONFIG)
// ==========================================
const char* ssid = "#YOUR WIFI SSID";
const char* password = "#YOUR WIFI PASSWORD";

// Địa chỉ Server Python (Máy tính của bạn)
// Cần chính xác để gửi mã thẻ về xử lý
const char* pythonServerUrl = "http://#YOUR PYTHON SERVER IP:PORT/nfc-scan"; 

// ==========================================
// 2. CẤU HÌNH CHÂN (WEACT ESP32-S3)
// ==========================================
// Cụm Barie & Cảm biến (Bên Phải)
const int SERVO_PIN = 13;
const int SENSOR_PIN = 14; 

// Cụm NFC RC522 (Bên Trái - SPI Custom)
const int NFC_SDA_PIN = 4;  // SS
const int NFC_SCK_PIN = 5;  // SCK
const int NFC_MOSI_PIN = 6; // MOSI
const int NFC_MISO_PIN = 7; // MISO
const int NFC_RST_PIN = 15; // RST

// ==========================================
// 3. KHỞI TẠO
// ==========================================
Servo barrierServo;
MFRC522 mfrc522(NFC_SDA_PIN, NFC_RST_PIN);
WebServer server(80);

const int OPEN_ANGLE = 90;
const int CLOSE_ANGLE = 0;
const long CLOSE_DELAY = 1500; // Thời gian chờ đóng sau khi xe qua

enum GateState { CLOSED, OPEN, WAITING_FOR_VEHICLE_TO_CLEAR };
GateState currentState = CLOSED;

// ==========================================
// 4. LOGIC GIAO TIẾP SERVER
// ==========================================

// Hàm gửi mã thẻ lên Python
void sendNfcToPython(String uidString) {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    // Tạo kết nối nhanh, timeout ngắn để không treo hệ thống
    http.begin(pythonServerUrl);
    http.setConnectTimeout(3000); 
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"nfc_id\": \"" + uidString + "\"}";
    
    // Gửi POST
    int httpResponseCode = http.POST(payload);
    
    if(httpResponseCode > 0){
      Serial.println("[Cloud] Gui the thanh cong: " + uidString);
    } else {
      Serial.print("[Cloud] Loi gui: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("[WiFi] Mat ket noi, khong gui duoc the!");
  }
}

// Hàm nhận lệnh MỞ từ Server (Python gọi xuống)
void handleOpen() {
  if (currentState == CLOSED) {
    Serial.println("-> NHAN LENH MO TU SERVER!");
    barrierServo.write(OPEN_ANGLE);
    currentState = OPEN;
    server.send(200, "text/plain", "OK: Opening Barrier");
  } else {
    server.send(200, "text/plain", "Info: Already Open");
  }
}

// ==========================================
// 5. SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // A. Thiết lập phần cứng Barie
  barrierServo.attach(SERVO_PIN);
  barrierServo.write(CLOSE_ANGLE); // Khởi động trạng thái đóng
  pinMode(SENSOR_PIN, INPUT_PULLUP);

  // B. Thiết lập NFC (Custom Pins cho S3)
  SPI.begin(NFC_SCK_PIN, NFC_MISO_PIN, NFC_MOSI_PIN, NFC_SDA_PIN);
  mfrc522.PCD_Init();
  
  // Kiểm tra nhanh Module NFC
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print("NFC Version: 0x"); Serial.println(v, HEX);
  if (v == 0x00 || v == 0xFF) Serial.println("⚠️ CANH BAO: Khong thay NFC Reader!");

  // C. Kết nối WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500); Serial.print(".");
    retry++;
  }
  Serial.println("\n✅ WiFi IP: " + WiFi.localIP().toString());

  // QUAN TRỌNG: Tắt ngủ WiFi để phản hồi nhanh
  WiFi.setSleep(false); 

  // D. Khởi chạy Server lắng nghe lệnh
  server.on("/open", HTTP_GET, handleOpen);
  server.begin();
  Serial.println("--- SYSTEM READY ---");
}

// ==========================================
// 6. LOOP (VÒNG LẶP CHÍNH)
// ==========================================
void loop() {
  // 1. Luôn lắng nghe lệnh từ Python Server
  server.handleClient(); 

  // 2. Logic xử lý Barie & Cảm biến an toàn
  bool isVehiclePresent = (digitalRead(SENSOR_PIN) == LOW);

  switch (currentState) {
    case OPEN:
      // Nếu phát hiện xe đi vào vùng cảm biến
      if (isVehiclePresent) {
        currentState = WAITING_FOR_VEHICLE_TO_CLEAR;
        Serial.println("-> Phat hien xe...");
      }
      break;
      
    case WAITING_FOR_VEHICLE_TO_CLEAR:
      // Nếu xe đã đi qua hoàn toàn
      if (!isVehiclePresent) {
        Serial.println("-> Xe da qua. Cho dong cong...");
        delay(CLOSE_DELAY); // Chờ 1.5s cho an toàn
        barrierServo.write(CLOSE_ANGLE);
        currentState = CLOSED;
        Serial.println("-> Da dong cong.");
      }
      break;
      
    default: break;
  }

  // 3. Logic đọc thẻ NFC (Chỉ đọc khi cổng đang đóng)
  if (currentState == CLOSED) {
    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      // Đọc UID
      String uid = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        uid += String(mfrc522.uid.uidByte[i], HEX);
      }
      uid.toUpperCase();
      
      Serial.println(">>> Quet the: " + uid + " -> Dang gui Server...");
      
      // Gửi lên Server (KHÔNG MỞ CỔNG TẠI ĐÂY)
      sendNfcToPython(uid);

      // Dừng thẻ, tránh đọc lặp lại liên tục
      mfrc522.PICC_HaltA();
      mfrc522.PCD_StopCrypto1();
    }
  }
}