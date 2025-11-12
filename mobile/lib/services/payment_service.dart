import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class PaymentService {
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

  /// Tạo thanh toán
  /// POST /api/payments/pay
  static Future<Map<String, dynamic>> createPayment({
    required String entityId,
    required String type, // e.g., "Reservation", "Subscription"
    required int amount,
    String? operatorId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/payments/pay').replace(
        queryParameters: {if (operatorId != null) 'operatorId': operatorId},
      );

      final requestBody = {
        'entityId': entityId,
        'type': type,
        'amount': amount,
      };

      print('💳 Creating payment:');
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
        print('✅ Successfully created payment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error creating payment: $errorBody');
        throw Exception(
          'Failed to create payment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in createPayment: $e');
      rethrow;
    }
  }

  /// Xác nhận thanh toán
  /// GET /api/payments/confirm?paymentId=...
  static Future<Map<String, dynamic>> confirmPayment({
    required String paymentId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/core/payments/confirm',
      ).replace(queryParameters: {'paymentId': paymentId});

      print('✅ Confirming payment:');
      print('  URL: $uri');
      print('  Payment ID: $paymentId');
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
        print('✅ Successfully confirmed payment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error confirming payment: $errorBody');
        throw Exception(
          'Failed to confirm payment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in confirmPayment: $e');
      rethrow;
    }
  }

  /// Hoàn tiền theo ID thanh toán
  /// POST /api/payments/{paymentId}/refund-by-id
  static Future<Map<String, dynamic>> refundPaymentById({
    required String paymentId,
    int? amount, // If null, refund full amount
    String? reason,
    String? operatorId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/payments/$paymentId/refund-by-id')
          .replace(
            queryParameters: {if (operatorId != null) 'operatorId': operatorId},
          );

      final requestBody = {
        if (amount != null) 'amount': amount,
        if (reason != null) 'reason': reason,
      };

      print('💰 Refunding payment:');
      print('  URL: $uri');
      print('  Payment ID: $paymentId');
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
        print('✅ Successfully refunded payment');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error refunding payment: $errorBody');
        throw Exception(
          'Failed to refund payment: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in refundPaymentById: $e');
      rethrow;
    }
  }

  /// Lấy danh sách hoàn tiền của người dùng hiện tại
  /// GET /api/payments/refunds/createdBy/me
  static Future<Map<String, dynamic>> getMyRefunds() async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/payments/refunds/createdBy/me');

      print('📋 Getting my refunds:');
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
        print('✅ Successfully fetched my refunds');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching my refunds: $errorBody');
        throw Exception(
          'Failed to fetch my refunds: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getMyRefunds: $e');
      rethrow;
    }
  }

  /// Lấy danh sách thanh toán của người dùng hiện tại
  /// GET /api/payments/createdBy/me
  static Future<Map<String, dynamic>> getMyPayments() async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/payments/createdBy/me');

      print('📋 Getting my payments:');
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
        print('✅ Successfully fetched my payments');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching my payments: $errorBody');
        throw Exception(
          'Failed to fetch my payments: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getMyPayments: $e');
      rethrow;
    }
  }

  /// Lấy thông tin thanh toán theo ID
  /// GET /api/payments/{id}
  static Future<Map<String, dynamic>> getPaymentById({
    required String id,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/core/payments/$id');

      print('🔍 Getting payment by ID:');
      print('  URL: $uri');
      print('  Payment ID: $id');
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
        print('✅ Successfully fetched payment details');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching payment details: $errorBody');
        throw Exception(
          'Failed to fetch payment details: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getPaymentById: $e');
      rethrow;
    }
  }
}
