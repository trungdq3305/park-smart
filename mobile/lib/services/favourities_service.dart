import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class FavouritiesService {
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
      print('❌ Error getting token in FavouritiesService: $e');
      return null;
    }
  }

  static Map<String, String> _buildHeaders(
    String token, {
    bool hasBody = false,
  }) => {
    'Authorization': 'Bearer $token',
    'Accept': 'application/json',
    if (hasBody) 'Content-Type': 'application/json',
  };

  /// GET /core/favourites/my-favourites
  static Future<Map<String, dynamic>> getMyFavourites() async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('No authentication token found');

      final uri = Uri.parse('$baseUrl/core/favourites/my-favourites');

      print('📌 Getting my favourites');
      print('  URL: $uri');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to fetch favourites: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getMyFavourites: $e');
      rethrow;
    }
  }

  /// POST /core/favourites
  static Future<Map<String, dynamic>> addToFavourites({
    required String parkingLotId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('No authentication token found');

      final uri = Uri.parse('$baseUrl/core/favourites');
      final payload = {'parkingLotId': parkingLotId};

      print('➕ Adding parking lot to favourites: $parkingLotId');
      print('  URL: $uri');
      print('  Payload: $payload');

      final response = await http.post(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: jsonEncode(payload),
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to add favourite: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in addToFavourites: $e');
      rethrow;
    }
  }

  /// DELETE /core/favourites/{parkingLotId}
  static Future<Map<String, dynamic>> removeFromFavourites({
    required String parkingLotId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('No authentication token found');

      final uri = Uri.parse('$baseUrl/core/favourites/$parkingLotId');

      print('🗑️ Removing parking lot from favourites: $parkingLotId');
      print('  URL: $uri');

      final response = await http.delete(uri, headers: _buildHeaders(token));

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }

      throw Exception(
        'Failed to remove favourite: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in removeFromFavourites: $e');
      rethrow;
    }
  }
}
