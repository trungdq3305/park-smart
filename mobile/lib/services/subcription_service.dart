import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class SubscriptionService {
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

  /// Tạo một Hóa đơn (draft) Gói thuê bao mới
  /// POST /subscriptions
  static Future<Map<String, dynamic>> createSubscription({
    required String parkingLotId,
    required String pricingPolicyId,
    required String startDate, // ISO 8601 format: "2025-11-12T00:00:00.000Z"
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/subscriptions');

      final requestBody = {
        'parkingLotId': parkingLotId,
        'pricingPolicyId': pricingPolicyId,
        'startDate': startDate,
      };

      print('📝 Creating subscription:');
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
        print('✅ Successfully created subscription');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error creating subscription: $errorBody');
        throw Exception(
          'Failed to create subscription: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in createSubscription: $e');
      rethrow;
    }
  }

  /// Kích hoạt Gói thuê bao (Xác nhận thanh toán)
  /// PATCH /subscriptions/{id}/confirm-payment
  static Future<Map<String, dynamic>> confirmPayment({
    required String subscriptionId,
    required String paymentId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/$subscriptionId/confirm-payment',
      );

      final requestBody = {'paymentId': paymentId};

      print('💳 Confirming payment for subscription:');
      print('  URL: $uri');
      print('  Request body: $requestBody');
      print('  Token: ${token.substring(0, 20)}...');

      final response = await http.patch(
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

  /// Gia hạn một gói thuê bao (do người dùng chủ động)
  /// POST /subscriptions/{id}/renew
  static Future<Map<String, dynamic>> renewSubscription({
    required String subscriptionId,
    required String paymentId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/$subscriptionId/renew',
      );

      final requestBody = {'paymentId': paymentId};

      print('🔄 Renewing subscription:');
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
        print('✅ Successfully renewed subscription');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error renewing subscription: $errorBody');
        throw Exception(
          'Failed to renew subscription: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in renewSubscription: $e');
      rethrow;
    }
  }

  /// Lấy tất cả gói thuê bao của người dùng hiện tại
  /// GET /subscriptions/my?pageSize=10&page=1
  static Future<Map<String, dynamic>> getMySubscriptions({
    required int pageSize,
    required int page,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/subscriptions/my').replace(
        queryParameters: {
          'pageSize': pageSize.toString(),
          'page': page.toString(),
        },
      );

      print('📋 Getting my subscriptions:');
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
        print('✅ Successfully fetched my subscriptions');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching my subscriptions: $errorBody');
        throw Exception(
          'Failed to fetch my subscriptions: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getMySubscriptions: $e');
      rethrow;
    }
  }

  /// Lấy thông tin gói bằng mã QR (cho Barie/Scanner)
  /// GET /subscriptions/identifier/{identifier}
  static Future<Map<String, dynamic>> getSubscriptionByIdentifier({
    required String identifier, // UUID from QR code
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/identifier/$identifier',
      );

      print('🔍 Getting subscription by identifier:');
      print('  URL: $uri');
      print('  Identifier: $identifier');
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
        print('✅ Successfully fetched subscription by identifier');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching subscription by identifier: $errorBody');
        throw Exception(
          'Failed to fetch subscription by identifier: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getSubscriptionByIdentifier: $e');
      rethrow;
    }
  }
}
