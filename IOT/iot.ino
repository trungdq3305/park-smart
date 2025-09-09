#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

// --- CẤU HÌNH ---
const char* ssid ="YOUR WIFI NAME";
const char* password = "YOUR WIFI PASSWORD";

// Pin kết nối
const int SERVO_PIN = 13;
const int SENSOR_PIN = 14; // Chỉ dùng 1 cảm biến

// Cài đặt Servo
Servo barrierServo;
const int OPEN_ANGLE = 90;
const int CLOSE_ANGLE = 0;
const long CLOSE_DELAY = 1500; // Đợi 1.5 giây sau khi xe đi qua rồi mới đóng

// Biến trạng thái
enum GateState { CLOSED, OPEN, WAITING_FOR_VEHICLE_TO_CLEAR };
GateState currentState = CLOSED;

WebServer server(80);

// --- HÀM XỬ LÝ LỆNH MỞ ---
void handleOpen() {
  if (currentState == CLOSED) {
    Serial.println("Nhan lenh mo barie!");
    barrierServo.write(OPEN_ANGLE);
    currentState = OPEN;
    server.send(200, "text/plain", "Barie da mo.");
  } else {
    server.send(200, "text/plain", "Barie da mo san.");
  }
}

void setup() {
  Serial.begin(115200);

  // Khởi tạo các chân pin
  barrierServo.attach(SERVO_PIN);
  pinMode(SENSOR_PIN, INPUT_PULLUP);

  barrierServo.write(CLOSE_ANGLE);

  // Kết nối Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.println(WiFi.localIP());

  // Khởi động server
  server.on("/open", HTTP_GET, handleOpen);
  server.begin();
}

void loop() {
  server.handleClient(); // Lắng nghe lệnh từ PC

  // Đọc trạng thái cảm biến (LOW = có xe, HIGH = không có xe)
  bool isVehiclePresent = (digitalRead(SENSOR_PIN) == LOW);

  // Logic tự động đóng barie
  switch (currentState) {
    case OPEN:
      // Nếu phát hiện xe bắt đầu đi vào
      if (isVehiclePresent) {
        currentState = WAITING_FOR_VEHICLE_TO_CLEAR;
        Serial.println("Phat hien xe dang di qua...");
      }
      break;
      
    case WAITING_FOR_VEHICLE_TO_CLEAR:
      // Nếu không còn phát hiện xe nữa (xe đã đi qua)
      if (!isVehiclePresent) {
        Serial.println("Xe da di qua. Dong barie sau 1.5 giay...");
        delay(CLOSE_DELAY); // Chờ 2 giây
        barrierServo.write(CLOSE_ANGLE);
        currentState = CLOSED;
        Serial.println("Barie da dong.");
      }
      break;
      
    default:
      // Không làm gì ở trạng thái CLOSED
      break;
  }
}