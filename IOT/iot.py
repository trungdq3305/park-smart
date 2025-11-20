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

# ⚠️ QUAN TRỌNG: IP của ESP32 (để Python gọi lệnh mở cổng)
# Bạn hãy thay đúng IP mà ESP32 đang nhận (xem trên Serial Monitor của Arduino)
ESP32_ENDPOINT = "http://10.20.30.52/open"  

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

def open_barrier():
    """Gửi lệnh mở barie đến ESP32."""
    print(f"===> Gửi lệnh MỞ đến Servo Controller ({ESP32_ENDPOINT})... <===")
    try:
        # Timeout ngắn để không treo server python nếu ESP32 mất kết nối
        requests.get(ESP32_ENDPOINT, timeout=3)
        print("✅ Lệnh đã được gửi thành công.")
    except requests.exceptions.RequestException as e:
        print(f"❌ LỖI: Không thể gửi lệnh đến ESP32: {e}")

# =============================
# 3) KHỞI TẠO SERVER & MODEL
# =============================
app = Flask(__name__)
CORS(app)

app.config['SWAGGER'] = {
    'title': 'Python IOT Service API',
    'uiversion': 3,
    'description': 'API documentation for AI/IOT Service (Flask)',
    'version': '1.0.0'
}
swagger = Swagger(app)

socketio = SocketIO(app, cors_allowed_origins="*")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"--> Sử dụng thiết bị: {device}")

model_detector = YOLO(YOLO_MODEL_PATH)
model_recognizer = CRNN(num_classes=len(CHAR_LIST) + 1).to(device)

try:
    checkpoint = torch.load(OCR_MODEL_PATH, map_location=device)
    model_recognizer.load_state_dict(checkpoint['model_state'])
    model_recognizer.eval()
    print("--> Đã tải mô hình OCR.")
except Exception as e:
    print(f"--> LỖI tải mô hình OCR: {e}")

current_qr_frame = None
lock = threading.Lock()

# =============================
# 4) LOGIC XỬ LÝ CAMERA
# =============================
def capture_full_scene():
    """Chụp ảnh từ camera biển số để gửi làm bằng chứng"""
    cap = cv2.VideoCapture(PLATE_CAM_INDEX)
    if not cap.isOpened(): return None
    # Đọc vài frame để xả buffer, lấy ảnh mới nhất
    for _ in range(2): cap.read()
    ret, frame = cap.read()
    cap.release()
    return frame if ret else None

def process_camera_loop():
    global current_qr_frame
    
    qr_cam = cv2.VideoCapture(QR_CAM_INDEX)
    last_scan_time = 0
    
    print("--> Bắt đầu luồng xử lý Camera...")

    while True:
        ret, frame = qr_cam.read()
        if not ret:
            time.sleep(0.1)
            qr_cam.release()
            qr_cam = cv2.VideoCapture(QR_CAM_INDEX)
            continue

        with lock:
            current_qr_frame = frame.copy()

        decoded_objects = decode(frame, symbols=[ZBarSymbol.QRCODE])
        
        # Quét QR Code (Logic cũ của bạn)
        if decoded_objects and (time.time() - last_scan_time > 5):
            last_scan_time = time.time()
            
            qr_content = decoded_objects[0].data.decode("utf-8")
            print(f"[QR] Phát hiện: {qr_content}")
            
            identifier = qr_content
            try:
                qr_json = json.loads(qr_content)
                identifier = qr_json.get("identifier", qr_content)
            except:
                pass

            print("--> Đang chụp ảnh toàn cảnh...")
            full_scene_image = capture_full_scene()
            
            plate_text = ""
            scene_image_base64 = None

            if full_scene_image is not None:
                detections = model_detector(full_scene_image, verbose=False)[0]
                
                if len(detections.boxes) > 0:
                    best_box = max(detections.boxes, key=lambda b: b.conf)
                    x1, y1, x2, y2 = map(int, best_box.xyxy[0])
                    
                    plate_crop = full_scene_image[y1:y2, x1:x2]
                    
                    tensor = preprocess_for_ocr(plate_crop).to(device)
                    logits = model_recognizer(tensor)
                    plate_text = ctc_greedy_decode(logits)
                    print(f"[OCR] Biển số: {plate_text}")
                else:
                    print("[YOLO] Không tìm thấy biển số trong ảnh toàn cảnh.")

                _, buffer = cv2.imencode('.jpg', full_scene_image)
                scene_image_base64 = base64.b64encode(buffer).decode('utf-8')
            
            print("--> Gửi dữ liệu QR lên Kiosk...")
            socketio.emit('scan_result', {
                'identifier': identifier,
                'type': 'QR_APP',
                'plateNumber': plate_text,
                'image': f"data:image/jpeg;base64,{scene_image_base64}" if scene_image_base64 else None
            })

        time.sleep(0.03) 

# =============================
# 5) ROUTES FLASK & SWAGGER DOCS
# =============================

# --- API MỚI: XỬ LÝ NFC TỪ ESP32 ---
@app.route('/nfc-scan', methods=['POST'])
def nfc_scan():
    """
    API nhận mã thẻ NFC từ ESP32 gửi lên.
    ---
    tags:
      - Hardware
    description: Khi ESP32 đọc được thẻ, nó sẽ gọi API này. Server sẽ bắn SocketIO để Frontend hiển thị.
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - nfc_id
          properties:
            nfc_id:
              type: string
              example: "3A12B4C5"
              description: UID của thẻ NFC
    responses:
      200:
        description: Đã nhận và chuyển tiếp thành công
    """
    try:
        data = request.json
        nfc_id = data.get('nfc_id')
        
        if not nfc_id:
            return jsonify({"status": "error", "message": "Missing nfc_id"}), 400
            
        print(f"--> [NFC] Nhận tín hiệu thẻ: {nfc_id}")
        
        # 1. Chụp ảnh biển số ngay lập tức để làm bằng chứng
        full_scene_image = capture_full_scene()
        plate_text = ""
        scene_image_base64 = None
        
        if full_scene_image is not None:
            # Thử nhận diện biển số luôn (để tiện cho bảo vệ đỡ phải nhập)
            try:
                detections = model_detector(full_scene_image, verbose=False)[0]
                if len(detections.boxes) > 0:
                    best_box = max(detections.boxes, key=lambda b: b.conf)
                    x1, y1, x2, y2 = map(int, best_box.xyxy[0])
                    plate_crop = full_scene_image[y1:y2, x1:x2]
                    tensor = preprocess_for_ocr(plate_crop).to(device)
                    logits = model_recognizer(tensor)
                    plate_text = ctc_greedy_decode(logits)
                    print(f"[NFC-OCR] Tự động nhận diện biển số: {plate_text}")
            except Exception as e:
                print(f"Lỗi OCR khi quét NFC: {e}")

            _, buffer = cv2.imencode('.jpg', full_scene_image)
            scene_image_base64 = base64.b64encode(buffer).decode('utf-8')

        # 2. Bắn sự kiện sang React Frontend
        socketio.emit('nfc_scanned', {
            'identifier': nfc_id,         # Mã thẻ
            'type': 'NFC_GUEST',          # Loại khách
            'plateNumber': plate_text,    # Biển số (nếu OCR được)
            'image': f"data:image/jpeg;base64,{scene_image_base64}" if scene_image_base64 else None,
            'timestamp': time.time()
        })
        
        return jsonify({"status": "success", "message": "NFC received"}), 200

    except Exception as e:
        print(f"Lỗi xử lý NFC: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# --- CÁC API CŨ ---

def generate_video():
    while True:
        with lock:
            if current_qr_frame is None:
                continue
            _, buffer = cv2.imencode('.jpg', current_qr_frame)
            frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@app.route('/video_feed')
def video_feed():
    """
    Stream video MJPEG.
    ---
    tags:
      - Camera
    """
    return Response(generate_video(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/confirm-checkin', methods=['POST'])
def confirm_checkin():
    """
    API xác nhận mở cổng (Từ Kiosk).
    ---
    tags:
      - Operations
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            plateNumber:
              type: string
            identifier:
              type: string
            image:
              type: string
    """
    try:
        data = request.json
        plate_number = data.get('plateNumber')
        identifier = data.get('identifier')
        image_base64 = data.get('image') 

        print(f"--> Nhận lệnh Check-in từ Kiosk: Plate={plate_number}")

        files = {}
        if image_base64:
            if "base64," in image_base64:
                image_base64 = image_base64.split("base64,")[1]
            try:
                image_bytes = base64.b64decode(image_base64)
                files = {'file': ('snapshot.jpg', image_bytes, 'image/jpeg')}
            except Exception as img_err:
                print(f"Lỗi decode ảnh: {img_err}")

        payload = {
            'plateNumber': plate_number,
            'identifier': identifier,
            'description': f"Check-in từ Kiosk tại bãi {PARKING_LOT_ID}"
        }
        
        if not payload['identifier']:
            del payload['identifier']

        # Gọi NestJS
        url = f"{NESTJS_API_URL}/{PARKING_LOT_ID}"
        response = requests.post(url, data=payload, files=files, timeout=10)

        if response.status_code == 201:
            print("===> NestJS OK! Mở Barie. <===")
            open_barrier() # Gọi ESP32 mở cổng
            return jsonify({"success": True, "message": "Check-in thành công!"}), 200
        else:
            error_msg = "Lỗi Server"
            try:
                error_msg = response.json().get('message', error_msg)
            except:
                error_msg = response.text
            print(f"===> NestJS từ chối: {error_msg}")
            return jsonify({"success": False, "message": error_msg}), response.status_code

    except Exception as e:
        print(f"Lỗi xử lý: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/')
def index():
    """Home Page."""
    return "Python IOT Server is running! Go to /apidocs for Swagger UI."

# =============================
# 6) KHỞI ĐỘNG
# =============================
if __name__ == '__main__':
    t = threading.Thread(target=process_camera_loop)
    t.daemon = True
    t.start()
    
    # ⚠️ HOST='0.0.0.0' LÀ BẮT BUỘC ĐỂ ESP32 GỌI ĐƯỢC VÀO
    print("--> Khởi động Web Server tại http://0.0.0.0:1836")
    socketio.run(app, host='0.0.0.0', port=1836, allow_unsafe_werkzeug=True)