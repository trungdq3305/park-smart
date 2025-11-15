import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class FaqService {
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

  /// Lấy danh sách FAQs
  /// GET /core/faqs
  static Future<Map<String, dynamic>> getFaqs({
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
        '$baseUrl/core/faqs',
      ).replace(queryParameters: queryParams.isEmpty ? null : queryParams);

      print('❓ Getting FAQs:');
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
        print('✅ Successfully fetched FAQs');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching FAQs: $errorBody');
        throw Exception(
          'Failed to fetch FAQs: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getFaqs: $e');
      rethrow;
    }
  }

  /// Lấy FAQ theo ID
  /// GET /core/faqs/{id}
  static Future<Map<String, dynamic>> getFaqById(String id) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/faqs/$id');

      print('❓ Getting FAQ by ID:');
      print('  URL: $uri');
      print('  FAQ ID: $id');
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
        print('✅ Successfully fetched FAQ by ID');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching FAQ by ID: $errorBody');
        throw Exception(
          'Failed to fetch FAQ by ID: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getFaqById: $e');
      rethrow;
    }
  }

  /// Lấy FAQs của user hiện tại
  /// GET /core/faqs/me
  static Future<Map<String, dynamic>> getMyFaqs({
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
        '$baseUrl/core/faqs/me',
      ).replace(queryParameters: queryParams.isEmpty ? null : queryParams);

      print('❓ Getting my FAQs:');
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
        print('✅ Successfully fetched my FAQs');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching my FAQs: $errorBody');
        throw Exception(
          'Failed to fetch my FAQs: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getMyFaqs: $e');
      rethrow;
    }
  }

  /// Tạo FAQ mới
  /// POST /core/faqs
  static Future<Map<String, dynamic>> createFaq({
    required String question,
    required String answer,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/faqs');

      final requestBody = {'question': question, 'answer': answer};

      print('❓ Creating FAQ:');
      print('  URL: $uri');
      print('  Request body: $requestBody');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: jsonEncode(requestBody),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully created FAQ');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error creating FAQ: $errorBody');
        throw Exception(
          'Failed to create FAQ: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in createFaq: $e');
      rethrow;
    }
  }

  /// Cập nhật FAQ
  /// PUT /core/faqs
  static Future<Map<String, dynamic>> updateFaq({
    required String id,
    required String question,
    required String answer,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/faqs');

      final requestBody = {'id': id, 'question': question, 'answer': answer};

      print('❓ Updating FAQ:');
      print('  URL: $uri');
      print('  Request body: $requestBody');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.put(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
        body: jsonEncode(requestBody),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully updated FAQ');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error updating FAQ: $errorBody');
        throw Exception(
          'Failed to update FAQ: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in updateFaq: $e');
      rethrow;
    }
  }

  /// Xóa FAQ
  /// DELETE /core/faqs/{id}
  static Future<Map<String, dynamic>> deleteFaq({required String id}) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/faqs/$id');

      print('❓ Deleting FAQ:');
      print('  URL: $uri');
      print('  FAQ ID: $id');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.delete(
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
            : {'success': true, 'message': 'FAQ deleted successfully'};
        print('✅ Successfully deleted FAQ');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error deleting FAQ: $errorBody');
        throw Exception(
          'Failed to delete FAQ: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in deleteFaq: $e');
      rethrow;
    }
  }
}
