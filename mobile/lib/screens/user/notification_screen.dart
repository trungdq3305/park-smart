import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/notification_service.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:intl/intl.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;
  int _currentPage = 1;
  int _pageSize = 20;
  bool _hasMore = true;
  final ScrollController _scrollController = ScrollController();
  IO.Socket? _socket;
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // Socket events constants
  static const String _identityEvent = 'identity';
  static const String _newNotificationEvent = 'newNotification';
  static const String _authErrorEvent = 'authError';
  static const String _connectedEvent = 'connected';

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _scrollController.addListener(_onScroll);
    _initializeSocket();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _disconnectSocket();
    super.dispose();
  }

  /// Get authentication token
  Future<String?> _getToken() async {
    try {
      String? accessToken = await _storage.read(key: 'accessToken');
      if (accessToken != null && accessToken.isNotEmpty) {
        return accessToken;
      }

      String? userDataString = await _storage.read(key: 'data');
      if (userDataString != null) {
        Map<String, dynamic> userData = jsonDecode(userDataString);
        return userData['backendToken'] ??
            userData['idToken'] ??
            userData['accessToken'];
      }

      return null;
    } catch (e) {
      print('Error getting token: $e');
      return null;
    }
  }

  /// Build Socket.IO URL
  /// Socket.IO server typically runs on HTTP (ws://) not HTTPS (wss://)
  String _buildSocketUrl() {
    final baseUrl = dotenv.env['BASE_URL'] ?? '';

    // Extract host from BASE_URL
    String host;
    if (baseUrl.isEmpty) {
      // Fallback to default
      host = 'parksmarthcmc.io.vn';
    } else {
      final uri = Uri.parse(baseUrl);
      host = uri.host;
    }

    // Socket.IO server typically runs on port 5000 with ws:// (not wss://)
    // Use ws:// (HTTP WebSocket) instead of wss:// (HTTPS WebSocket)
    return 'ws://$host:5000';
  }

  /// Initialize socket connection for real-time notifications
  Future<void> _initializeSocket() async {
    try {
      final token = await _getToken();
      if (token == null) {
        print('⚠️ [WS] Bỏ qua kết nối: Không tìm thấy user token.');
        return;
      }

      final socketUrl = _buildSocketUrl();
      print('🔌 [WS] Đang kết nối đến: $socketUrl');

      // Disconnect existing socket if any
      _socket?.disconnect();
      _socket?.dispose();

      // Create new socket connection with token in query
      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setQuery({'token': token})
            .setPath('/socket.io')
            .enableAutoConnect()
            .build(),
      );

      // Handle connection
      _socket!.onConnect((_) {
        print('✅ [WS] Đã kết nối Socket ID: ${_socket!.id}');
        // Emit identity event to authenticate
        _socket!.emit(_identityEvent, {});
      });

      // Handle authentication success
      _socket!.on(_connectedEvent, (data) {
        print('✅ [WS] Xác thực thành công: $data');
      });

      // Handle authentication error
      _socket!.on(_authErrorEvent, (error) {
        print('❌ [WS] Lỗi xác thực: $error');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Lỗi xác thực WebSocket: $error'),
              backgroundColor: Colors.red,
            ),
          );
        }
        _socket?.disconnect();
      });

      // Handle new notification
      _socket!.on(_newNotificationEvent, (data) {
        print('🔔 [WS] Nhận được thông báo mới: $data');
        _handleNewNotification(data);
      });

      // Handle disconnect
      _socket!.onDisconnect((_) {
        print('❌ [WS] Đã ngắt kết nối');
      });

      // Handle connection error
      _socket!.onConnectError((error) {
        print('❌ [WS] Lỗi kết nối: $error');
      });

      // Handle general error
      _socket!.onError((error) {
        print('❌ [WS] Lỗi: $error');
      });
    } catch (e) {
      print('❌ [WS] Exception khi khởi tạo socket: $e');
    }
  }

  /// Handle new notification received from socket
  void _handleNewNotification(dynamic data) {
    try {
      Map<String, dynamic> notification;
      if (data is Map<String, dynamic>) {
        notification = data;
      } else {
        notification = Map<String, dynamic>.from(jsonDecode(jsonEncode(data)));
      }

      // Add notification to the top of the list
      setState(() {
        _notifications.insert(0, notification);
      });

      // Refresh unread count (will be handled by MainWrapper)
      // Show snackbar to notify user
      if (mounted) {
        final title = notification['title'] ?? 'Thông báo mới';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.notifications, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }

      // Refresh notifications list to get latest data
      _loadNotifications(refresh: true);

      // Refresh unread count
      _refreshUnreadCount();
    } catch (e) {
      print('❌ [WS] Error handling new notification: $e');
    }
  }

  /// Refresh unread count (triggers MainWrapper to update badge)
  Future<void> _refreshUnreadCount() async {
    try {
      await NotificationService.getUnreadCount();
      // MainWrapper will refresh automatically via periodic refresh
    } catch (e) {
      print('❌ Error refreshing unread count: $e');
    }
  }

  /// Disconnect socket
  void _disconnectSocket() {
    print('🧹 [WS] Đang ngắt kết nối socket');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent * 0.8 &&
        !_isLoading &&
        _hasMore) {
      _loadMoreNotifications();
    }
  }

  Future<void> _loadNotifications({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentPage = 1;
        _hasMore = true;
      });
    } else {
      setState(() {
        _isLoading = true;
      });
    }

    try {
      final response = await NotificationService.getNotifications(
        page: _currentPage,
        pageSize: _pageSize,
      );

      final data = response['data'];
      List<Map<String, dynamic>> notifications = [];

      if (data is List) {
        notifications = List<Map<String, dynamic>>.from(data);
      } else if (data is Map && data['data'] is List) {
        notifications = List<Map<String, dynamic>>.from(data['data']);
      }

      setState(() {
        if (refresh) {
          _notifications = notifications;
        } else {
          _notifications.addAll(notifications);
        }
        _hasMore = notifications.length >= _pageSize;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading notifications: $e');
      setState(() {
        _isLoading = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải thông báo: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadMoreNotifications() async {
    if (_isLoading || !_hasMore) return;

    setState(() {
      _currentPage++;
      _isLoading = true;
    });

    try {
      final response = await NotificationService.getNotifications(
        page: _currentPage,
        pageSize: _pageSize,
      );

      final data = response['data'];
      List<Map<String, dynamic>> notifications = [];

      if (data is List) {
        notifications = List<Map<String, dynamic>>.from(data);
      } else if (data is Map && data['data'] is List) {
        notifications = List<Map<String, dynamic>>.from(data['data']);
      }

      setState(() {
        _notifications.addAll(notifications);
        _hasMore = notifications.length >= _pageSize;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading more notifications: $e');
      setState(() {
        _currentPage--;
        _isLoading = false;
      });
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      await NotificationService.markAsRead(id: notificationId);
      setState(() {
        final index = _notifications.indexWhere(
          (n) => (n['_id'] ?? n['id']) == notificationId,
        );
        if (index != -1) {
          _notifications[index]['isRead'] = true;
        }
      });
    } catch (e) {
      print('❌ Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      await NotificationService.markAllAsRead();
      setState(() {
        for (var notification in _notifications) {
          notification['isRead'] = true;
        }
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đã đánh dấu tất cả là đã đọc'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Error marking all as read: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return '';
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 7) {
      return DateFormat('dd/MM/yyyy').format(dateTime);
    } else if (difference.inDays > 0) {
      return '${difference.inDays} ngày trước';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} giờ trước';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} phút trước';
    } else {
      return 'Vừa xong';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => n['isRead'] != true).length;

    return AppScaffold(
      showBottomNav: false,
      currentIndex: 3,
      appBar: AppBar(
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.notifications_active, size: 24),
            ),
            const SizedBox(width: 12),
            const Text(
              'Thông báo',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Colors.green.shade600, Colors.green.shade400],
            ),
          ),
        ),
        actions: [
          if (unreadCount > 0)
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.done_all, size: 20),
              ),
              onPressed: _markAllAsRead,
              tooltip: 'Đánh dấu tất cả đã đọc',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadNotifications(refresh: true),
        color: Colors.green,
        child: _isLoading && _notifications.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Đang tải thông báo...',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              )
            : _notifications.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.notifications_none,
                        size: 80,
                        color: Colors.grey.shade400,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Chưa có thông báo mới nào',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Các thông báo mới sẽ xuất hiện ở đây',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                itemCount: _notifications.length + (_hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _notifications.length) {
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }

                  final notification = _notifications[index];
                  final id = notification['_id'] ?? notification['id'];
                  final title = notification['title'] ?? 'Không có tiêu đề';
                  final body = notification['body'] ?? '';
                  final isRead = notification['isRead'] ?? false;
                  final createdAt = notification['createdAt'];
                  DateTime? dateTime;

                  if (createdAt != null) {
                    if (createdAt is String) {
                      dateTime = DateTime.tryParse(createdAt);
                    }
                  }

                  return TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0.0, end: 1.0),
                    duration: Duration(milliseconds: 300 + (index * 50)),
                    curve: Curves.easeOut,
                    builder: (context, value, child) {
                      return Opacity(
                        opacity: value,
                        child: Transform.translate(
                          offset: Offset(0, 20 * (1 - value)),
                          child: child,
                        ),
                      );
                    },
                    child: _buildNotificationCard(
                      id: id,
                      title: title,
                      body: body,
                      isRead: isRead,
                      dateTime: dateTime,
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildNotificationCard({
    required String id,
    required String title,
    required String body,
    required bool isRead,
    required DateTime? dateTime,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isRead ? Colors.grey.shade200 : Colors.green.shade300,
          width: isRead ? 1 : 2,
        ),
        boxShadow: [
          BoxShadow(
            color: isRead
                ? Colors.grey.withOpacity(0.1)
                : Colors.green.withOpacity(0.15),
            blurRadius: 8,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            if (!isRead) {
              _markAsRead(id);
            }
          },
          borderRadius: BorderRadius.circular(16),
          child: Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon container
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isRead
                          ? [Colors.grey.shade200, Colors.grey.shade300]
                          : [Colors.green.shade400, Colors.green.shade600],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.notifications,
                    color: isRead ? Colors.grey.shade600 : Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: isRead
                                    ? FontWeight.w500
                                    : FontWeight.w700,
                                color: Colors.black87,
                                height: 1.3,
                              ),
                            ),
                          ),
                          if (!isRead)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      if (body.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          body,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade700,
                            height: 1.5,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: Colors.grey.shade500,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatTime(dateTime),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
