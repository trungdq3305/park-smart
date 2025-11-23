import cv2
import numpy as np
import torch
import torch.nn as nn
import time
import json
import threading
import base64
import requests
from ultralytics import YOLO
from pyzbar.pyzbar import decode, ZBarSymbol

# Flask & SocketIO
from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from flasgger import Swagger

# =============================
# 1) CONFIG (CẤU HÌNH)
# =============================
YOLO_MODEL_PATH = 'lp_detect_v4.pt'
OCR_MODEL_PATH = 'best_ocr_model.pth'

# ⚠️ IP ESP32: Cần chính xác để Python điều khiển Barie
ESP32_ENDPOINT = "http://10.20.30.52/open"  

# Camera Config (Nếu test NFC thì camera chưa quan trọng lắm, có thể để nguyên)
QR_CAM_INDEX = 0
PLATE_CAM_INDEX = "http://10.20.30.7:8080/video"

NESTJS_API_URL = "http://localhost:5000/api/parking-sessions/check-in" 
PARKING_LOT_ID = "605e3f5f4f3e8c1d4c9f1e1a"
IMG_HEIGHT = 64
MAX_IMG_WIDTH = 256
CHAR_LIST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BLANK_IDX = len(CHAR_LIST)

# =============================
# 2) MÔ HÌNH OCR & HÀM HỖ TRỢ
# =============================
# ... (Giữ nguyên Class CRNN để không lỗi code) ...
class CRNN(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(1, 64, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2),
            nn.Conv2d(64, 128, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d(2, 2),
            nn.Conv2d(128, 256, 3, 1, 1), nn.BatchNorm2d(256), nn.ReLU(True),
            nn.Conv2d(256, 256, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d((2, 1)),
            nn.Conv2d(256, 512, 3, 1, 1), nn.BatchNorm2d(512), nn.ReLU(True),
            nn.Conv2d(512, 512, 3, 1, 1), nn.ReLU(True), nn.MaxPool2d((2, 1)),
            nn.Conv2d(512, 512, 3, 1, 1), nn.BatchNorm2d(512), nn.ReLU(True),
            nn.MaxPool2d((2, 1)),
            nn.Conv2d(512, 1024, (2, 1)), nn.ReLU(True)
        )
        self.rnn = nn.LSTM(1024, 512, num_layers=2, bidirectional=True, batch_first=True)
        self.fc  = nn.Linear(1024, num_classes)

    def forward(self, x):
        feat = self.cnn(x)
        feat = feat.squeeze(2)
        feat = feat.permute(0, 2, 1)
        seq, _ = self.rnn(feat)
        logits = self.fc(seq)
        return logits.permute(1, 0, 2)

int_to_char = {i: c for i, c in enumerate(CHAR_LIST)}
int_to_char[BLANK_IDX] = ""

def preprocess_for_ocr(img: np.ndarray) -> torch.Tensor:
    if len(img.shape) == 3 and img.shape[2] == 3:
        img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        img_gray = img
    h, w = img_gray.shape
    ratio = w / h
    new_w = int(IMG_HEIGHT * ratio)
    new_w = max(1, min(new_w, MAX_IMG_WIDTH))
    img_resized = cv2.resize(img_gray, (new_w, IMG_HEIGHT), interpolation=cv2.INTER_LINEAR)
    canvas = np.ones((IMG_HEIGHT, MAX_IMG_WIDTH), dtype=np.uint8) * 255
    canvas[:, :new_w] = img_resized
    tensor_img = torch.from_numpy(canvas.astype(np.float32) / 255.0).unsqueeze(0)
    return tensor_img.unsqueeze(0)

@torch.no_grad()
def ctc_greedy_decode(logits_TNC: torch.Tensor) -> str:
    best = logits_TNC.argmax(dim=2).permute(1, 0)
    decoded_str = ""
    for seq in best:
        prev = None
        chars = []
        for idx in seq.tolist():
            if idx != BLANK_IDX and idx != prev:
                chars.append(int_to_char[idx])
            prev = idx
        decoded_str = ''.join(chars)
    return decoded_str

# --- HÀM GỬI LỆNH MỞ BARIE ---
def open_barrier():
    """Gửi lệnh mở barie đến ESP32."""
    print(f"===> 🚀 [TEST] Gửi lệnh MỞ đến ESP32 ({ESP32_ENDPOINT})...")
    try:
        requests.get(ESP32_ENDPOINT, timeout=3)
        print("✅ Lệnh đã được gửi thành công. Barie sẽ mở!")
    except requests.exceptions.RequestException as e:
        print(f"❌ LỖI KẾT NỐI ESP32: {e}")
        print("   -> Hãy kiểm tra lại IP và nguồn điện của ESP32.")

# =============================
# 3) KHỞI TẠO SERVER & MODEL
# =============================
app = Flask(__name__)
CORS(app)

app.config['SWAGGER'] = {
    'title': 'Python IOT Service API (TEST MODE)',
    'uiversion': 3,
    'description': 'API documentation for AI/IOT Service (Flask)',
    'version': '1.0.0'
}
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,  # bao gồm tất cả
            "model_filter": lambda tag: True,  # bao gồm tất cả
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/apidocs/"  # <--- ĐÂY LÀ CHỖ QUY ĐỊNH ĐƯỜNG DẪN
}

swagger = Swagger(app, config=swagger_config)
socketio = SocketIO(app, cors_allowed_origins="*")

# Load Model (Có thể lỗi nếu không có GPU hoặc file model, ta try catch để không crash server test)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
try:
    model_detector = YOLO(YOLO_MODEL_PATH)
    model_recognizer = CRNN(num_classes=len(CHAR_LIST) + 1).to(device)
    checkpoint = torch.load(OCR_MODEL_PATH, map_location=device)
    model_recognizer.load_state_dict(checkpoint['model_state'])
    model_recognizer.eval()
    print("--> Đã tải mô hình AI.")
except Exception as e:
    print(f"⚠️ CẢNH BÁO: Lỗi tải Model AI ({e}). Chế độ Test NFC vẫn hoạt động bình thường.")
    model_detector = None
    model_recognizer = None

current_qr_frame = None
lock = threading.Lock()

# =============================
# 4) LOGIC XỬ LÝ CAMERA (Rút gọn cho nhẹ)
# =============================
def capture_full_scene():
    try:
        cap = cv2.VideoCapture(PLATE_CAM_INDEX)
        if not cap.isOpened(): return None
        for _ in range(2): cap.read()
        ret, frame = cap.read()
        cap.release()
        return frame if ret else None
    except:
        return None

def process_camera_loop():
    global current_qr_frame
    # Nếu cam QR lỗi thì bỏ qua để server vẫn chạy
    try:
        qr_cam = cv2.VideoCapture(QR_CAM_INDEX)
    except:
        print("⚠️ Không mở được Camera QR, bỏ qua luồng này.")
        return

    last_scan_time = 0
    print("--> Bắt đầu luồng Camera...")

    while True:
        ret, frame = qr_cam.read()
        if not ret:
            time.sleep(0.1)
            continue

        with lock:
            current_qr_frame = frame.copy()
        
        # (Phần xử lý QR Code giữ nguyên nếu muốn test QR)
        # ...
        time.sleep(0.03) 

# =============================
# 5) API ROUTES (TEST MODE)
# =============================

@app.route('/nfc-scan', methods=['POST'])
def nfc_scan():
    """
    API nhận mã thẻ NFC từ ESP32.
    ---
    tags:
      - TEST HARDWARE
    description: Trong chế độ Test, khi nhận thẻ sẽ TỰ ĐỘNG MỞ CỔNG LUÔN.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [nfc_id]
          properties:
            nfc_id: { type: string, example: "3A12B4C5" }
    """
    try:
        data = request.json
        nfc_id = data.get('nfc_id')
        
        if not nfc_id:
            return jsonify({"status": "error", "message": "Missing nfc_id"}), 400
            
        print(f"\n🔔 [NFC RECEIVED] Đã nhận mã thẻ: {nfc_id}")
        print(f"👉 [TEST MODE] Bypass NestJS -> Gửi lệnh MỞ BARIE ngay lập tức...")
        
        # --- TEST MODE: MỞ CỔNG NGAY ---
        open_barrier()
        
        # Vẫn bắn SocketIO để nếu bạn mở React lên thì sẽ thấy thông báo
        socketio.emit('nfc_scanned', {
            'identifier': nfc_id,
            'type': 'TEST_MODE_NFC',
            'timestamp': time.time()
        })
        
        return jsonify({"status": "success", "message": "NFC received & Barrier Opened (Test Mode)"}), 200

    except Exception as e:
        print(f"Lỗi xử lý NFC: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/confirm-checkin', methods=['POST'])
def confirm_checkin():
    """
    API Check-in (Giả lập thành công).
    ---
    tags:
      - TEST HARDWARE
    """
    try:
        print("--> Nhận lệnh Confirm Check-in (Từ Kiosk).")
        print("👉 [TEST MODE] Giả lập NestJS trả về thành công -> Mở Barie.")

        # --- TEST MODE: KHÔNG GỌI NESTJS ---
        # url = f"{NESTJS_API_URL}/{PARKING_LOT_ID}"
        # response = requests.post(...) 
        
        open_barrier() # Mở cổng
        
        return jsonify({"success": True, "message": "Check-in THÀNH CÔNG (Giả lập)!"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/')
def index():
    return "<h1>🐍 Python NFC Test Server is Running!</h1><p>Mode: Hardware Test (No NestJS)</p>"

# =============================
# 6) KHỞI ĐỘNG
# =============================
if __name__ == '__main__':
    # Chạy luồng camera nền (có thể tắt nếu chỉ test NFC)
    t = threading.Thread(target=process_camera_loop)
    t.daemon = True
    t.start()
    
    print("----------------------------------------------------")
    print(f"🚀 PYTHON SERVER STARTING at http://0.0.0.0:1836")
    print(f"📡 ESP32 Target IP: {ESP32_ENDPOINT}")
    print("👉 Hãy quẹt thẻ vào ESP32 để test mở cổng.")
    print("----------------------------------------------------")
    
    socketio.run(app, host='0.0.0.0', port=1836, allow_unsafe_werkzeug=True)