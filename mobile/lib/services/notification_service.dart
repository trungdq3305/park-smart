import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class NotificationService {
  static final String baseUrl = dotenv.env['BASE_URL'] ?? '';
  static final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// Get authentication token
  static Future<String?> _getToken() async {
    try {
      // Try to get accessToken directly from storage first
      String? accessToken = await _storage.read(key: 'accessToken');
      if (accessToken != null && accessToken.isNotEmpty) {
        return accessToken;
      }

      // Fallback to userData
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

  /// Lấy lịch sử thông báo của người dùng
  /// GET /notifications
  static Future<Map<String, dynamic>> getNotifications({
    int? page,
    int? pageSize,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      // Build query parameters
      final queryParams = <String, String>{};
      if (page != null) queryParams['page'] = page.toString();
      if (pageSize != null) queryParams['pageSize'] = pageSize.toString();

      final uri = Uri.parse(
        '$baseUrl/parking/notifications',
      ).replace(queryParameters: queryParams.isEmpty ? null : queryParams);

      print('🔔 Getting notifications:');
      print('  URL: $uri');
      print('  Query params: $queryParams');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched notifications');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching notifications: $errorBody');
        throw Exception(
          'Failed to fetch notifications: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getNotifications: $e');
      rethrow;
    }
  }

  /// Lấy số lượng thông báo chưa đọc
  /// GET /notifications/unread-count
  static Future<Map<String, dynamic>> getUnreadCount() async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/notifications/unread-count');

      print('🔔 Getting unread notification count:');
      print('  URL: $uri');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched unread count');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching unread count: $errorBody');
        throw Exception(
          'Failed to fetch unread count: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getUnreadCount: $e');
      rethrow;
    }
  }

  /// Đánh dấu một thông báo là đã đọc
  /// PATCH /notifications/{id}/read
  static Future<Map<String, dynamic>> markAsRead({required String id}) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/notifications/$id/read');

      print('🔔 Marking notification as read:');
      print('  URL: $uri');
      print('  Notification ID: $id');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.patch(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 204) {
        final responseData = response.body.isNotEmpty
            ? jsonDecode(response.body)
            : {'success': true, 'message': 'Notification marked as read'};
        print('✅ Successfully marked notification as read');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error marking notification as read: $errorBody');
        throw Exception(
          'Failed to mark notification as read: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in markAsRead: $e');
      rethrow;
    }
  }

  /// Đánh dấu tất cả thông báo là đã đọc
  /// PATCH /notifications/read-all
  static Future<Map<String, dynamic>> markAllAsRead() async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/notifications/read-all');

      print('🔔 Marking all notifications as read:');
      print('  URL: $uri');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.patch(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 204) {
        final responseData = response.body.isNotEmpty
            ? jsonDecode(response.body)
            : {'success': true, 'message': 'All notifications marked as read'};
        print('✅ Successfully marked all notifications as read');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error marking all notifications as read: $errorBody');
        throw Exception(
          'Failed to mark all notifications as read: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in markAllAsRead: $e');
      rethrow;
    }
  }
}
