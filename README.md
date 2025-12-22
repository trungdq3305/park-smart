# 🚗 ParkSmart - Hệ thống Quản lý Đỗ xe Thông minh TP.HCM

**ParkSmart** là nền tảng quản lý đỗ xe thời gian thực toàn diện dành cho người lái xe, đơn vị vận hành bãi xe và nhà quản lý đô thị. Dự án ứng dụng kiến trúc Microservices, trí tuệ nhân tạo (AI) để nhận diện biển số và hệ thống IoT nhằm hiện đại hóa hạ tầng giao thông tại TP. Hồ Chí Minh.

---

## 🌐 Liên kết dự án (Live Demo)
* **Landing Page:** [https://park-smart-6ncm.vercel.app/](https://park-smart-6ncm.vercel.app/)
* **Web Application:** [https://park-smart-two.vercel.app/](https://park-smart-two.vercel.app/)
* **API Swagger (Deployed):** [http://parksmarthcmc.io.vn:5001/swagger/index.html](http://parksmarthcmc.io.vn:5001/swagger/index.html)
                              [http://parksmarthcmc.io.vn:5000/swagger/index.html](http://parksmarthcmc.io.vn:5000/swagger/index.html)
                              [https://parksmarthcmc.io.vn](http://parksmarthcmc.io.vn)
---

## ✨ Tính năng chính
- **Real-time Availability:** Hiển thị vị trí trống trong bãi xe theo thời gian thực.
- **AI Plate Recognition:** Tự động nhận diện biển số xe bằng Camera AI (YOLOv8).
- **Reservation System:** Cho phép đặt trước chỗ đỗ xe trực tuyến.
- **Cashless Payment:** Thanh toán không dùng tiền mặt nhanh chóng và an toàn.
- **AI Chatbot Assistant:** Hỗ trợ giải đáp thắc mắc và điều hướng thông minh.
- **IoT Integration:** Điều khiển đóng/mở barrier tự động qua ESP32.

---

## 🛠 Yêu cầu hệ thống (System Requirements)

### 1. Web Application
- **Memory:** Tối thiểu 4GB RAM.
- **Internet:** Yêu cầu kết nối internet ổn định.
- **Browser:** Chrome (v87+), IE (v11+), hoặc trình duyệt hỗ trợ HTML5/CSS3.

### 2. Mobile Application
- **OS:** Android 8.0 hoặc cao hơn.
- **Memory:** Tối thiểu 1GB RAM.

---

## 📦 Hướng dẫn cài đặt chi tiết (Installation)



### 1. Back-end Services

#### 1.1 Core Service (.NET 8)
* **Yêu cầu:** Cài đặt Visual Studio 2022 & Hosting Bundle .NET 8.0.
* **Các bước:**
  1. Cài đặt EF Tool: `dotnet tool install --global dotnet-ef`.
  2. Mở Terminal tại thư mục `CoreService.Api` và cấu hình **User Secrets**:
     ```bash
     dotnet user-secrets set "MongoDbSettings:DatabaseName" "CoreServiceDB"
     dotnet user-secrets set "MongoDbSettings:ConnectionString" "mongodb+srv://..."
     dotnet user-secrets set "Jwt:Key" "3ba646e46be..."
     dotnet user-secrets set "EmailSettings:SmtpPassword" "navhzaatwrzvnezm"
     ```
  3. Run Project từ Visual Studio. Kiểm tra tại: `http://localhost:5001/swagger/index.html`.

#### 1.2 Parking Service (Node.js)
* **Yêu cầu:** Node.js v18.0.0+ & Yarn.
* **Các bước:**
  1. `cd .\backend\Services\parking-service\`
  2. `yarn install`
  3. Tạo file `.env` với các biến: `PORT=5000`, `MONGO_URI`, `JWT_SECRET`, `GOONG_API_KEY`, `CORE_SERVICE_URL`.
  4. **Dev mode:** `yarn start` | **Production:** `yarn build` -> `node dist/main.js`.

#### 1.3 Ocelot Gateway
* **Các bước:** Mở project Ocelot Gateway bằng VS 2022.
* **URL mặc định:** `https://localhost:1000`.

---

### 2. Front-end & Mobile

#### 2.1 Web Admin (ReactJS)
1. `cd frontend-admin`
2. `yarn install`
3. `yarn run dev` -> Truy cập: `http://localhost:5173`.

#### 2.2 Mobile Application (Flutter)
1. Cài đặt **Flutter SDK** và cấu hình biến môi trường (PATH).
2. Chạy `flutter doctor` để kiểm tra môi trường.
3. Chấp nhận license: `flutter doctor --android-licenses`.
4. Cài đặt extension Flutter trên VS Code/Android Studio.
5. Chạy lệnh: `flutter run`.

---

### 3. Hệ thống IoT & AI

#### 3.1 Cấu hình ESP32
1. Cài đặt **Arduino IDE** và Board **ESP32 by Espressif Systems**.
2. Cấu hình Wifi trong source code:
   ```cpp
   const char* ssid = "your-wifi-name";
   const char* password = "your-wifi-password";
