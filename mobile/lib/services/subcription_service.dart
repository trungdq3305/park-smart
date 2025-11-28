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

  /// Kiểm tra điều kiện gia hạn (Pre-check trước khi thanh toán)
  /// GET /subscriptions/{id}/renewal-eligibility
  static Future<Map<String, dynamic>> checkRenewalEligibility({
    required String subscriptionId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/$subscriptionId/renewal-eligibility',
      );

      print('🔍 Checking renewal eligibility:');
      print('  URL: $uri');
      print('  Subscription ID: $subscriptionId');
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
        print('✅ Successfully checked renewal eligibility');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error checking renewal eligibility: $errorBody');
        throw Exception(
          'Failed to check renewal eligibility: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in checkRenewalEligibility: $e');
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

  /// Xem trước thông tin hoàn tiền khi hủy gói (chính sách thời gian)
  /// GET /subscriptions/{id}/cancel/preview
  static Future<Map<String, dynamic>> previewCancelSubscription({
    required String subscriptionId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/$subscriptionId/cancel/preview',
      );

      print('👀 Preview cancel subscription:');
      print('  URL: $uri');
      print('  Subscription ID: $subscriptionId');
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
        print('✅ Successfully previewed cancel subscription');
        return responseData;
      }

      final errorBody = response.body;
      print('❌ Error previewing cancel subscription: $errorBody');
      throw Exception(
        'Failed to preview cancel subscription: ${response.statusCode} - $errorBody',
      );
    } catch (e) {
      print('❌ Exception in previewCancelSubscription: $e');
      rethrow;
    }
  }

  /// Hủy một gói thuê bao (do người dùng thực hiện)
  /// DELETE /subscriptions/{id}
  static Future<Map<String, dynamic>> cancelSubscription({
    required String subscriptionId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/subscriptions/$subscriptionId');

      print('🛑 Cancelling subscription:');
      print('  URL: $uri');
      print('  Subscription ID: $subscriptionId');
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
            : <String, dynamic>{};
        print('✅ Successfully cancelled subscription');
        return responseData;
      }

      final errorBody = response.body;
      print('❌ Error cancelling subscription: $errorBody');
      throw Exception(
        'Failed to cancel subscription: ${response.statusCode} - $errorBody',
      );
    } catch (e) {
      print('❌ Exception in cancelSubscription: $e');
      rethrow;
    }
  }

  /// Lấy tất cả gói thuê bao của người dùng hiện tại
  /// GET /subscriptions/my?pageSize=10&page=1&status=ACTIVE
  static Future<Map<String, dynamic>> getMySubscriptions({
    required int pageSize,
    required int page,
    String? status,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final query = <String, String>{
        'pageSize': pageSize.toString(),
        'page': page.toString(),
        if (status != null && status.isNotEmpty) 'status': status,
      };

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/my',
      ).replace(queryParameters: query);

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
      }

      // 409 - Không có gói phù hợp với trạng thái / bộ lọc hiện tại
      // Trả về danh sách rỗng thay vì ném lỗi để UI hiển thị trạng thái "không có gói"
      if (response.statusCode == 409) {
        print('ℹ️ No subscriptions found for current filter (409).');
        Map<String, dynamic>? body;
        try {
          body = jsonDecode(response.body);
        } catch (_) {
          body = null;
        }

        return <String, dynamic>{
          'data': <dynamic>[],
          'pagination': <String, dynamic>{
            'totalItems': 0,
            'page': page,
            'pageSize': pageSize,
          },
          if (body != null) ...body,
        };
      }

      final errorBody = response.body;
      print('❌ Error fetching my subscriptions: $errorBody');
      throw Exception(
        'Failed to fetch my subscriptions: ${response.statusCode} - $errorBody',
      );
    } catch (e) {
      print('❌ Exception in getMySubscriptions: $e');
      rethrow;
    }
  }

  /// Lấy thông tin chi tiết gói thuê bao theo ID
  /// GET /subscriptions/{id}
  static Future<Map<String, dynamic>> getSubscriptionById({
    required String subscriptionId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/subscriptions/$subscriptionId');

      print('🔍 Getting subscription by ID:');
      print('  URL: $uri');
      print('  Subscription ID: $subscriptionId');
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
        print('✅ Successfully fetched subscription by ID');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching subscription by ID: $errorBody');
        throw Exception(
          'Failed to fetch subscription by ID: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getSubscriptionById: $e');
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

  /// Lấy tình trạng (số suất) Xô 1 (Thuê bao) cho 15 ngày tới
  /// GET /subscriptions/availability/{parkingLotId}
  static Future<Map<String, dynamic>> getSubscriptionAvailability({
    required String parkingLotId,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/subscriptions/availability/$parkingLotId',
      );

      print('📊 Getting subscription availability:');
      print('  URL: $uri');
      print('  Parking Lot ID: $parkingLotId');
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
        print('✅ Successfully fetched subscription availability');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching subscription availability: $errorBody');
        throw Exception(
          'Failed to fetch subscription availability: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getSubscriptionAvailability: $e');
      rethrow;
    }
  }
}
