# Tạo môi trường ảo tên là 'venv'
python -m venv venv

# Kích hoạt môi trường ảo
# Trên Windows:
venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

pip install opencv-python numpy ultralytics pyzbar flask flask-socketio flask-cors requests eventlet

# Cài PyTorch (Nếu máy có GPU NVIDIA, hãy cài bản CUDA để nhanh hơn)
# Truy cập https://pytorch.org/get-started/locally/ để lấy lệnh cài đúng cho GPU của bạn.
# Ví dụ cho CPU (nếu không có GPU):
pip install torch torchvision

python iot.py