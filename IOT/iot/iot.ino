#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <HTTPClient.h>
// Bỏ thư viện UDP vì không dùng nữa
// #include <WiFiUdp.h> 

// --- CẤU HÌNH WIFI ---
const char* ssid = "#02 Tan My";
const char* password = "0982621234";

// --- CẤU HÌNH TỰ ĐỘNG TÌM SERVER ---
const int API_PORT = 1836; // Cổng API Flask
IPAddress pythonServerIp = IPAddress(0,0,0,0); // Sẽ được tìm thấy khi quét

// --- CẤU HÌNH CHÂN ---
const int SERVO_PIN = 13;
const int SENSOR_PIN = 14;
const int BUILTIN_LED_PIN = 48; 

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

void blinkFeedback() {
  digitalWrite(BUILTIN_LED_PIN, HIGH); delay(100); digitalWrite(BUILTIN_LED_PIN, LOW);
}

// --- HÀM MỚI: QUÉT DẢI IP (IP SCANNER) ---
void findPythonServer() {
  Serial.println("🔍 Bắt đầu quét mạng LAN để tìm Server (Port 1836)...");
  
  IPAddress local = WiFi.localIP();
  IPAddress scanIp = local; // Copy IP hiện tại để giữ 3 số đầu (ví dụ 10.20.30.x)
  
  WiFiClient client;
  
  // Quét từ 1 đến 254
  for(int i = 1; i < 255; i++) {
    scanIp[3] = i; // Thay đổi số cuối cùng
    
    // Bỏ qua chính mình
    if (scanIp == local) continue;

    // Thử kết nối tới Port 1836 với timeout cực ngắn (20-50ms)
    // Trong mạng LAN, kết nối thành công thường <10ms
    // Nếu timeout nghĩa là IP đó không phải server hoặc không online
    if (client.connect(scanIp, API_PORT, 120)) {
       pythonServerIp = scanIp;
       client.stop(); // Ngắt kết nối ngay
       
       Serial.println("");
       Serial.print("✅ ĐÃ TÌM THẤY! Server tại IP: ");
       Serial.println(pythonServerIp);
       blinkFeedback(); blinkFeedback();
       return; // Thoát ngay khi tìm thấy
    }
    
    // In dấu chấm mỗi 10 IP để biết đang chạy
    if (i % 10 == 0) Serial.print(".");
  }
  
  Serial.println("\n❌ Đã quét hết mạng mà không thấy Server.");
  Serial.println("👉 Hãy đảm bảo file Python 'server.py' đang chạy và tắt Firewall.");
  
  // Fallback: Nếu không thấy thì gán cứng IP máy bạn (Cứu cánh cuối cùng)
  pythonServerIp = IPAddress(10, 20, 30, 200);
}

// --- HÀM ĐĂNG KÝ IP ---
void registerToPython() {
  if (pythonServerIp.toString() == "0.0.0.0") {
     findPythonServer();
  }

  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    String url = "http://" + pythonServerIp.toString() + ":" + String(API_PORT) + "/register-barrier";
    http.begin(url);
    http.setConnectTimeout(2000);
    http.addHeader("Content-Type", "application/json");
    int code = http.POST("{}"); 
    if(code > 0) {
      Serial.println("✅ Đăng ký IP thành công!");
      blinkFeedback();
    } else {
      Serial.print("⚠️ Đăng ký thất bại. Lỗi HTTP: "); Serial.println(code);
    }
    http.end();
  }
}

// --- HÀM GỬI NFC ---
void sendNfcToPython(String uidString) {
  if (pythonServerIp.toString() == "0.0.0.0") findPythonServer();

  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    String url = "http://" + pythonServerIp.toString() + ":" + String(API_PORT) + "/nfc-scan";
    http.begin(url);
    http.setConnectTimeout(1000); 
    http.addHeader("Content-Type", "application/json");
    String payload = "{\"nfc_id\": \"" + uidString + "\"}";
    
    int code = http.POST(payload);
    if(code > 0) {
        blinkFeedback();
        Serial.println("✅ Gửi NFC OK");
    } else {
        Serial.print("❌ Lỗi gửi: "); Serial.println(http.errorToString(code).c_str());
        // Nếu lỗi kết nối, có thể server đổi IP, kích hoạt tìm lại
        if (code == HTTPC_ERROR_CONNECTION_REFUSED) {
            pythonServerIp = IPAddress(0,0,0,0); 
        }
    }
    http.end();
  }
}

void handleOpen() {
  Serial.println("--> 📥 NHẬN YÊU CẦU MỞ CỔNG");

  // 1. Kiểm tra trạng thái cửa
  if (currentState == OPEN || currentState == WAITING) {
      Serial.println("⚠️ TỪ CHỐI: Cửa đang mở hoặc đang chờ đóng.");
      // Trả về mã lỗi 409 (Conflict)
      server.send(409, "application/json", "{\"status\":\"error\", \"message\":\"BARRIER_IS_ALREADY_OPEN\"}");
      return;
  }

  // 2. Nếu cửa đang đóng thì mới mở
  Serial.println("✅ CHẤP NHẬN: Mở cổng ngay.");
  barrierServo.write(OPEN_ANGLE);
  currentState = OPEN;
  
  server.send(200, "application/json", "{\"status\":\"success\", \"message\":\"OPENED\"}");
  blinkFeedback();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUILTIN_LED_PIN, OUTPUT); digitalWrite(BUILTIN_LED_PIN, LOW);
  pinMode(SENSOR_PIN, INPUT_PULLUP);
  barrierServo.attach(SERVO_PIN); barrierServo.write(CLOSE_ANGLE);

  SPI.begin(NFC_SCK_PIN, NFC_MISO_PIN, NFC_MOSI_PIN, NFC_SDA_PIN);
  mfrc522.PCD_Init();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); }
  Serial.println("\n✅ WiFi Connected");
  Serial.print("👉 ESP32 IP: "); Serial.println(WiFi.localIP());

  server.on("/open", HTTP_GET, handleOpen);
  server.begin();
  
  // Tìm server ngay khi khởi động
  findPythonServer();
  registerToPython();
}

void loop() {
  server.handleClient();

  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      uid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(mfrc522.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.println("SCAN: " + uid);
    sendNfcToPython(uid);
    mfrc522.PICC_HaltA(); mfrc522.PCD_StopCrypto1();
    delay(500); 
  }

  if (currentState == OPEN && digitalRead(SENSOR_PIN) == LOW) currentState = WAITING;
  if (currentState == WAITING && digitalRead(SENSOR_PIN) == HIGH) {
    delay(1500); barrierServo.write(CLOSE_ANGLE); currentState = CLOSED;
  }
}