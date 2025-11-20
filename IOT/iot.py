import cv2
import numpy as np
import torch
import torch.nn as nn
import time
import json
import threading
import base64
import requests
import queue
from ultralytics import YOLO
from pyzbar.pyzbar import decode, ZBarSymbol

# Flask & SocketIO
from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

# =============================
# 1) CẤU HÌNH (CONFIG)
# =============================
YOLO_MODEL_PATH = 'lp_detect_v4.pt'
OCR_MODEL_PATH = 'best_ocr_model.pth'

# IP các thiết bị
ESP32_BARRIER_URL = "http://10.20.30.52/open"   # IP ESP32 điều khiển cổng
NESTJS_API_URL = "http://localhost:5000/api/parking-sessions/check-in"
PARKING_LOT_ID = "605e3f5f4f3e8c1d4c9f1e1a"

# Camera Config
# Webcam 0 dùng để quét QR (Gần)
QR_CAM_INDEX = 0 
# IP Camera dùng để chụp toàn cảnh & biển số (Xa)
PLATE_CAM_URL = "http://10.20.30.7:8080/video"

IMG_HEIGHT = 64
MAX_IMG_WIDTH = 256
CHAR_LIST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BLANK_IDX = len(CHAR_LIST)

# =============================
# 2) MÔ HÌNH OCR (Giữ nguyên)
# =============================
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

# =============================
# 3) HỆ THỐNG CAMERA ĐA LUỒNG (CORE FIX)
# =============================
class ThreadedCamera:
    """
    Class này chạy camera trong một luồng riêng biệt.
    Giúp Flask không bị treo khi chờ frame từ camera (đặc biệt là IP Cam).
    """
    def __init__(self, src, name="Camera"):
        self.src = src
        self.name = name
        self.cap = cv2.VideoCapture(self.src)
        # Tối ưu buffer size cho IP Cam để giảm delay
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1) 
        self.grabbed, self.frame = self.cap.read()
        self.stopped = False
        self.lock = threading.Lock()

    def start(self):
        t = threading.Thread(target=self.update, args=())
        t.daemon = True
        t.start()
        return self

    def update(self):
        while True:
            if self.stopped:
                self.cap.release()
                return
            
            ret, frame = self.cap.read()
            if not ret:
                # Cơ chế tự động kết nối lại nếu mất tín hiệu
                print(f"⚠️ [{self.name}] Mất tín hiệu. Thử lại sau 2s...")
                self.cap.release()
                time.sleep(2)
                self.cap = cv2.VideoCapture(self.src)
                continue
            
            with self.lock:
                self.grabbed = ret
                self.frame = frame
            
            # Nghỉ cực ngắn để nhường CPU
            time.sleep(0.01)

    def read(self):
        with self.lock:
            return self.frame.copy() if self.grabbed else None

    def stop(self):
        self.stopped = True

# Khởi tạo 2 luồng camera riêng biệt
# 1. QR Camera (Webcam USB)
qr_cam = ThreadedCamera(QR_CAM_INDEX, "QR_CAM").start()

# 2. Plate Camera (IP Camera)
plate_cam = ThreadedCamera(PLATE_CAM_URL, "PLATE_CAM").start()


# =============================
# 4) KHỞI TẠO APP VÀ MODEL AI
# =============================
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"--> Device: {device}")

# Load Models
try:
    model_detector = YOLO(YOLO_MODEL_PATH)
    model_recognizer = CRNN(num_classes=len(CHAR_LIST) + 1).to(device)
    checkpoint = torch.load(OCR_MODEL_PATH, map_location=device)
    model_recognizer.load_state_dict(checkpoint['model_state'])
    model_recognizer.eval()
    print("✅ Models Loaded Successfully.")
except Exception as e:
    print(f"❌ Model Error: {e}")

# =============================
# 5) LOGIC XỬ LÝ AI (YOLO + OCR)
# =============================
def process_ai_detection(image_full):
    """Hàm xử lý nhận diện biển số từ ảnh input"""
    plate_text = ""
    
    try:
        # 1. YOLO Detect
        detections = model_detector(image_full, verbose=False)[0]
        if len(detections.boxes) > 0:
            best_box = max(detections.boxes, key=lambda b: b.conf)
            x1, y1, x2, y2 = map(int, best_box.xyxy[0])
            
            # Crop biển số
            plate_crop = image_full[y1:y2, x1:x2]
            
            # 2. OCR
            tensor = preprocess_for_ocr(plate_crop).to(device)
            logits = model_recognizer(tensor)
            plate_text = ctc_greedy_decode(logits)
            print(f"🔎 [AI RESULT] Biển số: {plate_text}")
        else:
            print("⚠️ [AI] Không tìm thấy biển số.")
            
    except Exception as e:
        print(f"❌ AI Process Error: {e}")
        
    return plate_text

def open_barrier():
    try:
        requests.get(ESP32_BARRIER_URL, timeout=2)
        print("--> 🚪 Sent OPEN command to ESP32")
    except Exception as e:
        print(f"--> ❌ Cannot trigger barrier: {e}")

# =============================
# 6) ROUTES & CONTROLLERS
# =============================

@app.route('/video_feed')
def video_feed():
    """Stream MJPEG từ Plate Camera (hoặc QR cam tùy bạn chọn hiển thị)"""
    def generate():
        while True:
            # Lấy frame từ luồng IP Cam (không block)
            frame = plate_cam.read()
            if frame is None:
                time.sleep(0.1)
                continue
                
            _, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(0.04) # ~25 FPS

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/nfc-scan', methods=['POST'])
def nfc_scan():
    """ESP32 gọi vào đây khi quẹt thẻ NFC"""
    data = request.json
    nfc_id = data.get('nfc_id', 'UNKNOWN')
    print(f"📡 [NFC] Received UID: {nfc_id}")

    # 1. Lấy ngay frame hiện tại từ IP Camera (Không cần khởi tạo connection mới!)
    full_scene = plate_cam.read()
    
    # 2. Xử lý AI (Chạy luôn hoặc đẩy vào Queue nếu muốn cực nhanh)
    plate_number = ""
    image_base64 = None
    
    if full_scene is not None:
        plate_number = process_ai_detection(full_scene)
        # Encode ảnh để gửi xuống Client
        _, buffer = cv2.imencode('.jpg', full_scene)
        image_base64 = base64.b64encode(buffer).decode('utf-8')

    # 3. Bắn SocketIO
    socketio.emit('nfc_scanned', {
        'identifier': nfc_id,
        'type': 'NFC',
        'plateNumber': plate_number,
        'image': f"data:image/jpeg;base64,{image_base64}" if image_base64 else None,
        'timestamp': time.time()
    })

    return jsonify({"status": "ok"}), 200

@app.route('/open-barrier-command', methods=['GET'])
def manual_open():
    open_barrier()
    return jsonify({"status": "opened"}), 200

@app.route('/confirm-checkin', methods=['POST'])
def confirm_checkin():
    """Nhận lệnh từ React -> Lưu xuống NestJS -> Mở cổng"""
    try:
        data = request.json
        print(f"📝 Check-in confirm: {data.get('plateNumber')}")
        
        # Forward sang NestJS (Microservice structure)
        # Code logic gọi NestJS giữ nguyên như cũ...
        # Nếu thành công:
        open_barrier()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# =============================
# 7) BACKGROUND THREAD: QUÉT QR LIÊN TỤC
# =============================
def qr_scan_loop():
    """Luồng chạy ngầm chỉ để quét QR từ Webcam"""
    print("--> 📸 Bắt đầu luồng quét QR...")
    last_scan = 0
    
    while True:
        frame = qr_cam.read()
        if frame is None:
            time.sleep(0.1)
            continue

        # Chỉ quét QR mỗi 0.1s để tiết kiệm CPU
        decoded_objects = decode(frame, symbols=[ZBarSymbol.QRCODE])
        
        if decoded_objects and (time.time() - last_scan > 3):
            qr_data = decoded_objects[0].data.decode("utf-8")
            print(f"📸 [QR DETECTED] Content: {qr_data}")
            last_scan = time.time()

            # Logic xử lý giống NFC: Lấy ảnh từ Cam IP để đọc biển số
            scene_frame = plate_cam.read()
            plate_text = ""
            img_b64 = None
            
            if scene_frame is not None:
                plate_text = process_ai_detection(scene_frame)
                _, buffer = cv2.imencode('.jpg', scene_frame)
                img_b64 = base64.b64encode(buffer).decode('utf-8')
            
            socketio.emit('scan_result', {
                'identifier': qr_data,
                'type': 'QR_APP',
                'plateNumber': plate_text,
                'image': f"data:image/jpeg;base64,{img_b64}" if img_b64 else None
            })
        
        time.sleep(0.1)

# =============================
# 8) MAIN
# =============================
if __name__ == '__main__':
    # Chạy luồng quét QR
    t_qr = threading.Thread(target=qr_scan_loop)
    t_qr.daemon = True
    t_qr.start()

    print("--> 🚀 Server starting at port 1836...")
    # allow_unsafe_werkzeug=True cần thiết khi chạy production/dev mode trên 0.0.0.0
    socketio.run(app, host='0.0.0.0', port=1836, allow_unsafe_werkzeug=True)