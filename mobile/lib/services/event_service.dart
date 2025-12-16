import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class EventService {
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
      print('❌ Error getting token in EventService: $e');
      return null;
    }
  }

  static Map<String, String> _headers(String token) => {
    'Authorization': 'Bearer $token',
    'Accept': 'application/json',
  };

  /// GET /api/events
  static Future<Map<String, dynamic>> getEvents() async {
    final token = await _getToken();
    if (token == null) throw Exception('No authentication token found');

    final uri = Uri.parse('$baseUrl/api/events');
    final res = await http.get(uri, headers: _headers(token));

    print('📡 GET /api/events status: ${res.statusCode}');
    print('📡 Body: ${res.body}');

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception('Failed to fetch events: ${res.statusCode} - ${res.body}');
  }

  /// GET /api/events/upcoming
  static Future<Map<String, dynamic>> getUpcomingEvents() async {
    final token = await _getToken();
    if (token == null) throw Exception('No authentication token found');

    final uri = Uri.parse('$baseUrl/api/events/upcoming');
    final res = await http.get(uri, headers: _headers(token));

    print('📡 GET /api/events/upcoming status: ${res.statusCode}');
    print('📡 Body: ${res.body}');

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception(
      'Failed to fetch upcoming events: ${res.statusCode} - ${res.body}',
    );
  }

  /// GET /api/events/{id}
  static Future<Map<String, dynamic>> getEventById(String id) async {
    final token = await _getToken();
    if (token == null) throw Exception('No authentication token found');

    final uri = Uri.parse('$baseUrl/api/events/$id');
    final res = await http.get(uri, headers: _headers(token));

    print('📡 GET /api/events/$id status: ${res.statusCode}');
    print('📡 Body: ${res.body}');

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    throw Exception(
      'Failed to fetch event detail: ${res.statusCode} - ${res.body}',
    );
  }
}
