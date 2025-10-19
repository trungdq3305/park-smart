import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  // Biến singleton để đảm bảo chỉ có một instance của SocketService trong toàn bộ ứng dụng
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  // Biến socket client
  IO.Socket? _socket;

  // StreamControllers để quản lý và phát ra các trạng thái/dữ liệu
  // Dùng .broadcast() để cho phép nhiều listener cùng lắng nghe một stream
  final _connectionStatusController = StreamController<bool>.broadcast();
  final _parkingLotUpdateController =
      StreamController<Map<String, dynamic>>.broadcast();

  // "Getters" để các widget khác (như ParkingLotScreen) có thể lắng nghe stream
  Stream<bool> get connectionStatusStream => _connectionStatusController.stream;
  Stream<Map<String, dynamic>> get parkingLotUpdateStream =>
      _parkingLotUpdateController.stream;

  /// Khởi tạo và kết nối tới Socket.IO server.
  /// Hàm này chỉ nên được gọi một lần khi ứng dụng khởi động.
  void initialize() {
    // Nếu socket đã được khởi tạo hoặc đang kết nối thì không làm gì cả
    if (_socket != null) {
      print('SOCKET: Service đã được khởi tạo.');
      return;
    }

    // Cấu hình kết nối
    _socket = IO.io('ws://parksmarthcmc.io.vn:5000', <String, dynamic>{
      'transports': ['websocket'],
      'path': '/socket.io',
      'autoConnect': true, // Tự động kết nối khi khởi tạo
    });

    // Lắng nghe các sự kiện cơ bản của socket
    _socket!.onConnect((_) {
      print('✅ SOCKET: Đã kết nối thành công!');
      // Khi kết nối thành công, đẩy giá trị `true` vào stream
      _connectionStatusController.add(true);

      // Bắt đầu lắng nghe sự kiện cập nhật số chỗ trống từ server
      _socket!.on('parking-lot-spots-updated', (data) {
        print('✅ SOCKET: Nhận được cập nhật chỗ trống: $data');
        if (data is Map<String, dynamic>) {
          // Khi nhận được dữ liệu, đẩy nó vào stream tương ứng
          _parkingLotUpdateController.add(data);
        }
      });

      // Lắng nghe response khi join room thành công
      _socket!.on('room-joined', (data) {
        print('✅ SOCKET: Đã tham gia room thành công: $data');
      });

      // Lắng nghe response khi join room thất bại
      _socket!.on('room-join-error', (data) {
        print('❌ SOCKET: Không thể tham gia room: $data');
      });

      // Lắng nghe response chung cho join room
      _socket!.on('joined-room', (data) {
        print('✅ SOCKET: Joined room response: $data');
      });

      // DEBUG: Lắng nghe tất cả events để debug
      _socket!.onAny((event, data) {
        print('🔍 SOCKET DEBUG: Received event "$event" with data: $data');
      });
    });

    _socket!.onDisconnect((_) {
      print('❌ SOCKET: Đã mất kết nối!');
      // Khi mất kết nối, đẩy giá trị `false` vào stream
      _connectionStatusController.add(false);
    });

    _socket!.onConnectError((err) {
      print('❌ SOCKET: Lỗi kết nối: $err');
      _connectionStatusController.add(false);
    });

    _socket!.onError((err) {
      print('❌ SOCKET: Lỗi chung: $err');
    });
  }

  /// Gửi sự kiện yêu cầu tham gia vào một "room" của bãi đỗ xe cụ thể.
  /// @param parkingLotId ID của bãi đỗ xe cần theo dõi.
  void joinParkingLotRoom(String parkingLotId) {
    if (_socket != null && _socket!.connected) {
      final roomName = 'room_$parkingLotId';
      // Tên sự kiện 'join-room' phải khớp với tên mà server đang lắng nghe
      _socket!.emit('join-room', {'newRoom': roomName});
      print('🚀 SOCKET: Đã gửi yêu cầu tham gia room: $roomName');
    } else {
      print('⚠️ SOCKET: Không thể tham gia room. Socket chưa được kết nối.');
    }
  }

  /// Dọn dẹp tài nguyên khi không cần dùng service nữa (rất quan trọng!).
  /// Thường được gọi khi ứng dụng bị đóng hoàn toàn.
  void dispose() {
    print('🧹 SOCKET: Đang dọn dẹp và đóng service...');
    _socket?.disconnect();
    _socket?.dispose();
    _connectionStatusController.close();
    _parkingLotUpdateController.close();
  }
}
