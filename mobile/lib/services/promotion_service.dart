import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class PromotionService {
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
      print('❌ Error getting token in PromotionService: $e');
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

  /// GET /core/promotions
  /// Get all promotions
  static Future<Map<String, dynamic>> getAllPromotions() async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/core/promotions');

      print('🎁 Fetching all promotions');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Get all promotions status: ${response.statusCode}');
      print('📡 Get all promotions body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch promotions: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getAllPromotions: $e');
      rethrow;
    }
  }

  /// GET /core/promotions/operator?operatorId={operatorId}
  /// Get promotions by operator ID
  static Future<Map<String, dynamic>> getPromotionsByOperator({
    required String operatorId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse(
        '$baseUrl/core/promotions/operator',
      ).replace(queryParameters: {'operatorId': operatorId});

      print('🎁 Fetching promotions for operator: $operatorId');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Get promotions by operator status: ${response.statusCode}');
      print('📡 Get promotions by operator body: ${response.body}');

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        print('📡 Decoded response type: ${decoded.runtimeType}');
        print('📡 Decoded response: $decoded');

        // If response is directly an array, wrap it
        if (decoded is List) {
          return {'data': decoded};
        }
        return decoded;
      }
      throw Exception(
        'Failed to fetch promotions by operator: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getPromotionsByOperator: $e');
      rethrow;
    }
  }

  /// GET /core/promotions/{id}
  /// Get promotion by ID
  static Future<Map<String, dynamic>> getPromotionById({
    required String promotionId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/core/promotions/$promotionId');

      print('🎁 Fetching promotion by ID: $promotionId');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Get promotion by ID status: ${response.statusCode}');
      print('📡 Get promotion by ID body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch promotion by ID: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getPromotionById: $e');
      rethrow;
    }
  }

  /// POST /core/promotions/use
  /// Use a promotion code
  static Future<Map<String, dynamic>> usePromotion({
    required String promotionCode,
    required int originalAmount,
    required String entityId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse('$baseUrl/core/promotions/use');

      final payload = {
        'promotionCode': promotionCode,
        'originalAmount': originalAmount,
        'entityId': entityId,
      };

      print('🎁 Using promotion code: $promotionCode');
      print('   Original amount: $originalAmount');
      print('   Entity ID: $entityId');

      final response = await http.post(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: jsonEncode(payload),
      );

      print('📡 Use promotion status: ${response.statusCode}');
      print('📡 Use promotion body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to use promotion: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in usePromotion: $e');
      rethrow;
    }
  }

  /// POST /core/promotions/refund?entityId={entityId}
  /// Refund a promotion
  static Future<Map<String, dynamic>> refundPromotion({
    required String entityId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('Authentication token not found');
      }

      final uri = Uri.parse(
        '$baseUrl/core/promotions/refund',
      ).replace(queryParameters: {'entityId': entityId});

      print('🎁 Refunding promotion for entity: $entityId');

      final response = await http.post(uri, headers: _buildHeaders(token));

      print('📡 Refund promotion status: ${response.statusCode}');
      print('📡 Refund promotion body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to refund promotion: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in refundPromotion: $e');
      rethrow;
    }
  }
}
