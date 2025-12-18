import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ReportService {
  static final String baseUrl = dotenv.env['BASE_URL'] ?? '';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  /// Lấy token từ secure storage
  static Future<String?> _getToken() async {
    try {
      final accessToken = await _storage.read(key: 'accessToken');
      if (accessToken != null && accessToken.isNotEmpty) {
        return accessToken;
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
      print('❌ Error getting token in ReportService: $e');
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

  /// POST /api/reports
  ///
  /// Tạo báo cáo cho một bãi đỗ xe
  static Future<Map<String, dynamic>> createReport({
    required String parkingLotId,
    required String categoryId,
    required String reason,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/api/reports');
      final body = jsonEncode({
        'parkingLotId': parkingLotId,
        'categoryId': categoryId,
        'reason': reason,
      });

      print('📝 Creating report: $body');

      final response = await http.post(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: body,
      );

      print('📡 POST /api/reports status: ${response.statusCode}');
      print('📡 Body: ${response.body}');

      if (response.statusCode == 200 ||
          response.statusCode == 201 ||
          response.statusCode == 204) {
        return response.body.isNotEmpty
            ? jsonDecode(response.body)
            : <String, dynamic>{};
      }

      throw Exception(
        'Failed to create report: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in createReport: $e');
      rethrow;
    }
  }

  /// GET /api/reports/my-reports
  ///
  /// Lấy danh sách báo cáo của tài xế hiện tại
  static Future<Map<String, dynamic>> getMyReports() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/api/reports/my-reports');

      print('📄 Fetching my reports: $uri');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 GET /api/reports/my-reports status: ${response.statusCode}');
      print('📡 Body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to fetch my reports: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getMyReports: $e');
      rethrow;
    }
  }
}
