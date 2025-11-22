import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class CommentService {
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

  /// Lấy danh sách comments theo parking lot ID
  /// GET /api/comments/by-parkinglot/{parkingLotId}
  static Future<Map<String, dynamic>> getCommentsByParkingLot({
    required String parkingLotId,
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
        '$baseUrl/core/comments/by-parkinglot/$parkingLotId',
      ).replace(queryParameters: queryParams.isEmpty ? null : queryParams);

      print('💬 Getting comments by parking lot:');
      print('  Base URL: $baseUrl');
      print('  Parking Lot ID: $parkingLotId');
      print('  Full URL: $uri');
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
      print('📡 Response headers: ${response.headers}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched comments by parking lot');
        return responseData;
      } else if (response.statusCode == 404) {
        final errorBody = response.body;
        print(
          '❌ 404 Not Found - Endpoint may not exist or parking lot ID invalid',
        );
        print('  URL tried: $uri');
        print('  Response: $errorBody');
        throw Exception(
          'Không tìm thấy endpoint hoặc ID bãi đỗ xe không hợp lệ (404)',
        );
      } else {
        final errorBody = response.body;
        print('❌ Error fetching comments by parking lot: $errorBody');
        throw Exception(
          'Failed to fetch comments by parking lot: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getCommentsByParkingLot: $e');
      rethrow;
    }
  }

  /// Lấy danh sách comments theo FAQ ID
  /// GET /api/comments/by-faq/{faqId}
  static Future<Map<String, dynamic>> getCommentsByFaq({
    required String faqId,
    int? page,
    int? pageSize,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/comments/by-faq/$faqId').replace(
        queryParameters: {
          if (page != null) 'page': page.toString(),
          if (pageSize != null) 'pageSize': pageSize.toString(),
        },
      );

      print('💬 Getting comments by FAQ:');
      print('  URL: $uri');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched comments by FAQ');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching comments by FAQ: $errorBody');
        throw Exception(
          'Failed to fetch comments by FAQ: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getCommentsByFaq: $e');
      rethrow;
    }
  }

  /// Tạo comment mới
  /// POST /api/comments
  static Future<Map<String, dynamic>> createComment({
    required String targetId,
    required String content,
    String? parentId,
    int? star,
    required String targetType, // e.g., "ParkingLot", "FAQ"
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/comments');

      final requestBody = {
        'targetId': targetId,
        'content': content,
        'targetType': targetType,
        if (parentId != null) 'parentId': parentId,
        if (star != null) 'star': star,
      };

      print('💬 Creating comment:');
      print('  URL: $uri');
      print('  Request body: $requestBody');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(requestBody),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully created comment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error creating comment: $errorBody');
        throw Exception(
          'Failed to create comment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in createComment: $e');
      rethrow;
    }
  }

  /// Cập nhật comment
  /// PUT /api/comments
  static Future<Map<String, dynamic>> updateComment({
    required String id,
    required String content,
    int? star,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/comments');

      final requestBody = {
        'id': id,
        'content': content,
        if (star != null) 'star': star,
      };

      print('💬 Updating comment:');
      print('  URL: $uri');
      print('  Request body: $requestBody');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.put(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(requestBody),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully updated comment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error updating comment: $errorBody');
        throw Exception(
          'Failed to update comment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in updateComment: $e');
      rethrow;
    }
  }

  /// Xóa comment
  /// DELETE /api/comments/{id}
  static Future<Map<String, dynamic>> deleteComment({
    required String id,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/comments/$id');

      print('💬 Deleting comment:');
      print('  URL: $uri');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.delete(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 204) {
        final responseData = response.body.isNotEmpty
            ? jsonDecode(response.body)
            : {'success': true, 'message': 'Comment deleted successfully'};
        print('✅ Successfully deleted comment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error deleting comment: $errorBody');
        throw Exception(
          'Failed to delete comment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in deleteComment: $e');
      rethrow;
    }
  }
}
