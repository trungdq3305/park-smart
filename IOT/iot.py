import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from ultralytics import YOLO
from typing import List
import requests
from pyzbar.pyzbar import decode, ZBarSymbol
import time
import json

# =============================
# 1) CONFIG
# =============================
# --- Đường dẫn đến các mô hình đã huấn luyện ---
YOLO_MODEL_PATH = 'lp_detect_v4.pt'
OCR_MODEL_PATH = 'best_ocr_model.pth'
ESP32_ENDPOINT = "http://10.20.30.42/open" # <<<--- THAY ĐỔI ĐỊA CHỈ NÀY

# --- Cài đặt 2 Camera riêng biệt ---
# Chạy lệnh `ls /dev/video*` trên Linux/RPi hoặc thử các số khác nhau trên Windows
QR_CAM_INDEX = "http://10.20.30.19:8081/video"      # Chỉ số của camera quét QR
PLATE_CAM_INDEX = "http://10.20.30.168:8080/video"   # Chỉ số của camera chụp biển số

# Các thông số của mô hình OCR
IMG_HEIGHT = 64
MAX_IMG_WIDTH = 256
CHAR_LIST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
BLANK_IDX = len(CHAR_LIST)

# =============================
# 2) ĐỊNH NGHĨA LẠI KIẾN TRÚC VÀ CÁC HÀM HỖ TRỢ
# =============================

# Dán class CRNN từ tệp huấn luyện của bạn vào đây
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

# Khởi tạo từ điển tra cứu
int_to_char = {i: c for i, c in enumerate(CHAR_LIST)}
int_to_char[BLANK_IDX] = ""

def preprocess_for_ocr(img: np.ndarray) -> torch.Tensor:
    """Tiền xử lý ảnh đã cắt cho mô hình CRNN."""
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
    """Giải mã kết quả thô từ mô hình."""
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
    print("===> Gửi lệnh MỞ đến Servo Controller... <===")
    try:
        requests.get(ESP32_ENDPOINT, timeout=5)
        print("Lệnh đã được gửi thành công.")
    except requests.exceptions.RequestException as e:
        print(f"LỖI: Không thể gửi lệnh đến ESP32: {e}")

def capture_plate_image():
    """Hàm chuyên dụng để chụp một ảnh chất lượng cao từ camera biển số."""
    cap = cv2.VideoCapture(PLATE_CAM_INDEX)
    if not cap.isOpened():
        print(f"Lỗi: Không thể mở camera biển số (index {PLATE_CAM_INDEX})")
        return None
    
    time.sleep(1) # Cho camera thời gian để ổn định
    ret, frame = cap.read()
    cap.release()
    
    if ret:
        print("--> Đã chụp ảnh biển số thành công!")
        cv2.imwrite("last_plate_capture.jpg", frame) # Lưu lại ảnh để kiểm tra
        return frame
    else:
        print("--> Lỗi: Không thể chụp ảnh từ camera biển số.")
        return None

# =============================
# 3) TẢI CÁC MÔ HÌNH VÀO BỘ NHỚ
# =============================

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Hệ thống sẽ chạy trên thiết bị: {device}")

# Tải mô hình YOLO detector
model_detector = YOLO(YOLO_MODEL_PATH)

# Tải mô hình CRNN recognizer đã huấn luyện
model_recognizer = CRNN(num_classes=len(CHAR_LIST) + 1).to(device)
try:
    checkpoint = torch.load(OCR_MODEL_PATH, map_location=device, weights_only=True)
    model_recognizer.load_state_dict(checkpoint['model_state'])
    model_recognizer.eval()
    print("Tải mô hình OCR tùy chỉnh thành công.")
except Exception as e:
    print(f"LỖI: Không thể tải tệp mô hình OCR tại '{OCR_MODEL_PATH}'. Lỗi: {e}")
    model_recognizer = None

# =============================
# 4) VÒNG LẶP CHÍNH
# =============================
def main_loop():
    if model_recognizer is None:
        print("Không thể khởi động do lỗi tải mô hình OCR.")
        return

    qr_cam = cv2.VideoCapture(QR_CAM_INDEX)
    if not qr_cam.isOpened():
        print(f"Lỗi: Không thể mở camera QR (index {QR_CAM_INDEX})")
        return

    print("Hệ thống đã sẵn sàng. Hãy đưa mã QR vào Camera 1...")
    print("Nhấn 'q' trên cửa sổ camera để thoát.")
    
    last_qr_time = 0

    while True:
        ret, qr_frame = qr_cam.read()
        if not ret:
            print("Lỗi: Mất kết nối camera QR.")
            break

        decoded_objects = decode(qr_frame, symbols=[ZBarSymbol.QRCODE])

        if decoded_objects:
            qr_content = decoded_objects[0].data.decode("utf-8")
            current_time = time.time()
            
            if (current_time - last_qr_time > 10):
                last_qr_time = current_time
                print(f"\n[PHÁT HIỆN QR]: {qr_content}")

                try:
                    qr_data = json.loads(qr_content)
                    plate_from_qr = qr_data.get("plate")
                    
                    if not plate_from_qr:
                        print("Lỗi: Mã QR không chứa thông tin 'plate'.")
                        continue

                    # Kích hoạt camera biển số
                    plate_image = capture_plate_image()
                    
                    if plate_image is not None:
                        # Nhận dạng biển số từ ảnh vừa chụp
                        detections = model_detector(plate_image, verbose=False)[0]
                        
                        if len(detections.boxes) > 0:
                            best_detection = max(detections.boxes, key=lambda box: box.conf)
                            x1, y1, x2, y2 = map(int, best_detection.xyxy[0])
                            plate_crop = plate_image[y1:y2, x1:x2]
                            
                            image_tensor = preprocess_for_ocr(plate_crop).to(device)
                            logits = model_recognizer(image_tensor)
                            plate_from_ai = ctc_greedy_decode(logits)
                            print(f"--> AI nhận dạng: {plate_from_ai}")
                            
                            # So sánh và ra quyết định
                            print(f"--> So sánh: '{plate_from_ai}' (AI) vs '{plate_from_qr}' (QR)")
                            if plate_from_ai == plate_from_qr:
                                print("===> Hợp lệ! Mở barie. <===")
                                open_barrier()
                            else:
                                print("===> KHÔNG hợp lệ! Biển số không khớp. <===")
                        else:
                            print("--> Không phát hiện được biển số trong ảnh chụp.")
                
                except Exception as e:
                    print(f"Đã xảy ra lỗi trong quá trình xử lý: {e}")

        cv2.imshow("QR Scanner Feed - Nhan 'q' de thoat", qr_frame)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
            
    qr_cam.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main_loop()