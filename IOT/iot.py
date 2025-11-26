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
import os
import socket # 👈 THÊM MỚI: Để chạy UDP Broadcast
from dotenv import load_dotenv
import socketio as sio_client_lib 
from ultralytics import YOLO
from pyzbar.pyzbar import decode, ZBarSymbol

# Flask & SocketIO (Local Server)
from flask import Flask, Response, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS

# =============================
# 0) LOAD CONFIG TỪ .ENV
# =============================
load_dotenv()

CLOUD_URL = os.getenv("CLOUD_URL", "http://localhost:3000") 
PARKING_ID = os.getenv("PARKING_ID", "PARKING_01")
SECRET_KEY = os.getenv("SECRET_KEY", "secret-key-mac-dinh")

YOLO_MODEL_PATH = 'lp_detect_v4.pt'
OCR_MODEL_PATH = 'best_ocr_model.pth'

QR_CAM_INDEX = 0 
PLATE_CAM_URL = "http://10.20.30.7:8080/video" 

IMG_HEIGHT = 64
MAX_IMG_WIDTH = 256
CHAR_LIST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BLANK_IDX = len(CHAR_LIST)

CURRENT_ESP32_IP = None

# =============================
# 1) MÔ HÌNH OCR & YOLO (Giữ nguyên)
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
# 2) HỆ THỐNG CAMERA (Threaded)
# =============================
class ThreadedCamera:
    def __init__(self, src, name="Camera"):
        self.src = src
        self.name = name
        self.cap = cv2.VideoCapture(self.src)
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
                print(f"⚠️ [{self.name}] Mất tín hiệu. Reconnect sau 2s...")
                self.cap.release()
                time.sleep(2)
                self.cap = cv2.VideoCapture(self.src)
                continue
            
            with self.lock:
                self.grabbed = ret
                self.frame = frame
            time.sleep(0.01)

    def read(self):
        with self.lock:
            return self.frame.copy() if self.grabbed else None

    def stop(self):
        self.stopped = True

qr_cam = ThreadedCamera(QR_CAM_INDEX, "QR_CAM").start()
plate_cam = ThreadedCamera(PLATE_CAM_URL, "PLATE_CAM").start()

# =============================
# 3) SETUP APP & MODELS
# =============================
app = Flask(__name__)
CORS(app)
socketio_local = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"--> Device: {device}")

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
# 4) LOGIC AI & ĐIỀU KHIỂN BARIE
# =============================
def process_ai_detection(image_full):
    plate_text = ""
    try:
        detections = model_detector(image_full, verbose=False)[0]
        if len(detections.boxes) > 0:
            best_box = max(detections.boxes, key=lambda b: b.conf)
            x1, y1, x2, y2 = map(int, best_box.xyxy[0])
            plate_crop = image_full[y1:y2, x1:x2]
            tensor = preprocess_for_ocr(plate_crop).to(device)
            logits = model_recognizer(tensor)
            plate_text = ctc_greedy_decode(logits)
            print(f"🔎 [AI] Biển số: {plate_text}")
        else:
            print("⚠️ [AI] Không tìm thấy biển số.")
    except Exception as e:
        print(f"❌ AI Error: {e}")
    return plate_text

def open_barrier_physical():
    global CURRENT_ESP32_IP
    if CURRENT_ESP32_IP:
        try:
            url = f"http://{CURRENT_ESP32_IP}/open"
            print(f"--> 🚀 Gửi lệnh mở tới ESP32: {url}")
            
            # Gọi ESP32
            response = requests.get(url, timeout=2)
            
            # Kiểm tra mã phản hồi
            if response.status_code == 200:
                print("--> ✅ ESP32: Mở cổng thành công")
                return True
            elif response.status_code == 409:
                print("--> ⚠️ ESP32: Cổng đang mở hoặc bận, từ chối lệnh.")
                # Ném lỗi để API catch được
                raise Exception("Cổng barie đang mở, vui lòng chờ xe qua!")
            else:
                raise Exception(f"Lỗi ESP32: Mã lỗi {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"❌ Lỗi kết nối ESP32: {e}")
            raise Exception("Không thể kết nối tới Barie (Mất mạng LAN)")
    else:
        print("⚠️ Chưa tìm thấy ESP32 (Chưa đăng ký IP)")
        raise Exception("Chưa tìm thấy thiết bị Barie trong mạng")

# =============================
# 5) KẾT NỐI CLOUD (SOCKET CLIENT)
# =============================
sio_cloud = sio_client_lib.Client()

@sio_cloud.event
def connect():
    print(f"✅ [CLOUD] Đã kết nối socket tới {CLOUD_URL}")

@sio_cloud.event
def disconnect():
    print("❌ [CLOUD] Mất kết nối với Cloud!")

@sio_cloud.on('connection_ack')
def on_connection_ack(data):
    print(f"\n✨ [CLOUD] KẾT NỐI THÀNH CÔNG! Server xác nhận:")
    print(f"   - Status: {data.get('status')}")
    print(f"   - Message: {data.get('message')}\n")

@sio_cloud.on('open_barrier')
def on_cloud_open_command(data):
    print(f"📥 [CLOUD] Nhận lệnh mở cổng từ Admin: {data}")
    open_barrier_physical()

def start_cloud_socket_thread():
    while True:
        try:
            if not sio_cloud.connected:
                print(f"--> ☁️ Đang kết nối Cloud {CLOUD_URL}...")
                sio_cloud.connect(
                    CLOUD_URL, 
                    auth={'parkingId': PARKING_ID, 'secretKey': SECRET_KEY}
                )
                sio_cloud.wait()
        except Exception as e:
            print(f"⚠️ Lỗi Cloud: {e}. Thử lại sau 5s...")
            time.sleep(5)

# =============================
# 6) UDP DISCOVERY SERVICE (MỚI)
# =============================
# Thay thế hoàn toàn mDNS. Máy tính sẽ lắng nghe trên cổng 1837.
# Khi ESP32 hỏi "WHO_IS_PARKING_SERVER", Python trả lời "I_AM_PARKING_SERVER".
def udp_discovery_service():
    udp_sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    udp_sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    
    # Lấy IP thật của máy tính trong mạng LAN (ví dụ 10.20.30.200)
    # Thay vì bind '', ta bind '0.0.0.0' (nghe mọi nơi) hoặc IP cụ thể
    try:
        # Cách này giúp in ra xem Python đang thực sự nghe ở đâu
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        print(f"--> ℹ️ Máy tính đang có IP: {local_ip}")

        udp_sock.bind(('0.0.0.0', 1837)) # 0.0.0.0 là an toàn nhất
        print(f"--> 📡 UDP Discovery Service listening on port 1837")
        while True:
            data, addr = udp_sock.recvfrom(1024)
            message = data.decode().strip()
            
            if message == "WHO_IS_PARKING_SERVER":
                print(f"--> 🔍 Nhận yêu cầu tìm server từ {addr[0]}")
                # Phản hồi lại để ESP32 biết IP của mình
                response = b"I_AM_PARKING_SERVER"
                udp_sock.sendto(response, addr)
    except Exception as e:
        print(f"❌ UDP Discovery Error: {e}")

# =============================
# 7) FLASK ROUTES (LOCAL API)
# =============================

@app.route('/register-barrier', methods=['POST'])
def register_barrier():
    global CURRENT_ESP32_IP
    CURRENT_ESP32_IP = request.remote_addr 
    print(f"🤖 [ESP32] Đăng ký thành công IP: {CURRENT_ESP32_IP}")
    return jsonify({"status": "registered", "ip": CURRENT_ESP32_IP}), 200

@app.route('/video_feed')
def video_feed():
    def generate():
        while True:
            frame = plate_cam.read()
            if frame is None: time.sleep(0.1); continue
            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            time.sleep(0.04)
    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/nfc-scan', methods=['POST'])
def nfc_scan():
    data = request.json
    nfc_id = data.get('nfc_id', 'UNKNOWN')
    print(f"📡 [NFC] Thẻ: {nfc_id}")

    full_scene = plate_cam.read()
    plate_number = ""
    image_base64 = None
    
    if full_scene is not None:
        plate_number = process_ai_detection(full_scene)
        _, buffer = cv2.imencode('.jpg', full_scene)
        image_base64 = base64.b64encode(buffer).decode('utf-8')

    socketio_local.emit('nfc_scanned', {
        'nfcUid': nfc_id,
        'type': 'NFC',
        'plateNumber': plate_number,
        'image': f"data:image/jpeg;base64,{image_base64}" if image_base64 else None,
        'timestamp': time.time()
    })
    return jsonify({"status": "ok"}), 200

@app.route('/confirm-checkin', methods=['POST'])
def confirm_checkin():
    try:
        open_barrier_physical()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
@app.route('/confirm-checkout', methods=['POST'])
def confirm_checkout():
    try:
        open_barrier_physical()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

# =============================
# 8) BACKGROUND TASKS & MAIN
# =============================
def qr_scan_loop():
    print("--> 📸 Bắt đầu luồng quét QR...")
    last_scan = 0
    while True:
        frame = qr_cam.read()
        if frame is None: time.sleep(0.1); continue

        decoded_objects = decode(frame, symbols=[ZBarSymbol.QRCODE])
        if decoded_objects and (time.time() - last_scan > 3):
            qr_data = decoded_objects[0].data.decode("utf-8")
            print(f"📸 [QR] Content: {qr_data}")
            last_scan = time.time()

            scene_frame = plate_cam.read()
            plate_text = ""
            img_b64 = None
            if scene_frame is not None:
                plate_text = process_ai_detection(scene_frame)
                _, buffer = cv2.imencode('.jpg', scene_frame)
                img_b64 = base64.b64encode(buffer).decode('utf-8')
            
            socketio_local.emit('scan_result', {
                'identifier': qr_data,
                'type': 'QR_APP',
                'plateNumber': plate_text,
                'image': f"data:image/jpeg;base64,{img_b64}" if img_b64 else None
            })
        time.sleep(0.1)

if __name__ == '__main__':
    # 1. Chạy luồng kết nối Cloud
    t_cloud = threading.Thread(target=start_cloud_socket_thread)
    t_cloud.daemon = True
    t_cloud.start()

    # 2. Chạy luồng quét QR
    t_qr = threading.Thread(target=qr_scan_loop)
    t_qr.daemon = True
    t_qr.start()

    # 3. Chạy luồng UDP Discovery (MỚI)
    t_udp = threading.Thread(target=udp_discovery_service)
    t_udp.daemon = True
    t_udp.start()

    print(f"--> 🚀 Local Server running on port 1836...")
    
    # 4. Chạy Flask Server (Local)
    socketio_local.run(app, host='0.0.0.0', port=1836, allow_unsafe_werkzeug=True)