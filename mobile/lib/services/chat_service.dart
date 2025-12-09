import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ChatService {
  static final String baseUrl = dotenv.env['BASE_URL'] ?? '';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  /// Get auth token from secure storage
  static Future<String?> _getToken() async {
    try {
      String? token = await _storage.read(key: 'accessToken');
      if (token != null && token.isNotEmpty) {
        return token;
      }

      final userDataString = await _storage.read(key: 'data');
      if (userDataString != null) {
        final Map<String, dynamic> userData = jsonDecode(userDataString);
        return userData['backendToken'] ??
            userData['idToken'] ??
            userData['accessToken'];
      }
      return null;
    } catch (e) {
      print('❌ Error getting token in ChatService: $e');
      return null;
    }
  }

  static Map<String, String> _buildHeaders(
    String token, {
    bool hasBody = false,
  }) {
    return {
      'Authorization': 'Bearer $token',
      'Accept': 'application/json',
      if (hasBody) 'Content-Type': 'application/json',
    };
  }

  /// POST /chatbot/chat
  /// Gửi câu hỏi đến Trợ lý Hướng dẫn Chatbot
  static Future<Map<String, dynamic>> sendChatMessage({
    required String newMessage,
    List<Map<String, String>>? history,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/parking/chatbot/chat');

      final requestBody = {'newMessage': newMessage, 'history': history ?? []};

      print('💬 Sending chat message:');
      print('  URL: $uri');
      print('  New message: $newMessage');
      print('  History length: ${history?.length ?? 0}');

      final response = await http.post(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: jsonEncode(requestBody),
      );

      print('📡 Chat response status: ${response.statusCode}');
      print('📡 Chat response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to send chat message: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in sendChatMessage: $e');
      rethrow;
    }
  }

  /// GET /api/accounts/by-phone
  /// Lấy thông tin tài khoản theo số điện thoại
  static Future<Map<String, dynamic>> getAccountByPhone({
    required String phone,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse(
        '$baseUrl/core/accounts/by-phone',
      ).replace(queryParameters: {'phone': phone});

      print('📱 Getting account by phone:');
      print('  URL: $uri');
      print('  Phone: $phone');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Get account by phone status: ${response.statusCode}');
      print('📡 Get account by phone body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to get account by phone: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getAccountByPhone: $e');
      rethrow;
    }
  }
}
