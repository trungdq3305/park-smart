import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class TermPolicyService {
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

  /// Get all terms and policies
  /// GET /core/termpolicies
  static Future<Map<String, dynamic>> getAllTermPolicies({
    int? page,
    int? pageSize,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/termpolicies').replace(
        queryParameters: {
          if (page != null) 'page': page.toString(),
          if (pageSize != null) 'pageSize': pageSize.toString(),
        },
      );

      print('📜 Getting all term policies:');
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
      // Avoid printing huge bodies in production, but helpful while integrating
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched term policies');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching term policies: $errorBody');
        throw Exception(
          'Failed to fetch term policies: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getAllTermPolicies: $e');
      rethrow;
    }
  }

  /// Get term/policy by id
  /// GET /core/termpolicies/{id}
  static Future<Map<String, dynamic>> getTermPolicyById(String id) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/termpolicies/$id');

      print('📜 Getting term policy by ID:');
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
        print('✅ Successfully fetched term policy details');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching term policy details: $errorBody');
        throw Exception(
          'Failed to fetch term policy details: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getTermPolicyById: $e');
      rethrow;
    }
  }
}
