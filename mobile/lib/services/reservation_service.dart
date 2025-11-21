import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ReservationService {
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
      print('❌ Error getting token in ReservationService: $e');
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

  /// GET /reservations/availability/{parkingLotId}?date=YYYY-MM-DD
  static Future<Map<String, dynamic>> getReservationAvailability({
    required String parkingLotId,
    required String date,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse(
        '$baseUrl/parking/reservations/availability/$parkingLotId',
      ).replace(queryParameters: {'date': date});

      print(
        '📅 Fetching reservation availability for lot $parkingLotId on $date',
      );

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Availability status: ${response.statusCode}');
      print('📡 Availability body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch availability: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getReservationAvailability: $e');
      rethrow;
    }
  }

  /// POST /reservations
  static Future<Map<String, dynamic>> createReservation({
    required String parkingLotId,
    required String pricingPolicyId,
    required DateTime userExpectedTime,
    required DateTime estimatedEndTime,
    String? promotionId,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse('$baseUrl/parking/reservations');

      final payload = <String, dynamic>{
        'parkingLotId': parkingLotId,
        'pricingPolicyId': pricingPolicyId,
        'userExpectedTime': userExpectedTime.toIso8601String(),
        'estimatedEndTime': estimatedEndTime.toIso8601String(),
        if (promotionId != null) 'promotionId': promotionId,
      };

      if (additionalData != null) {
        payload.addAll(additionalData);
      }

      print('📝 Creating reservation with payload: $payload');

      final response = await http.post(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: jsonEncode(payload),
      );

      print('📡 Create reservation status: ${response.statusCode}');
      print('📡 Create reservation body: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to create reservation: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in createReservation: $e');
      rethrow;
    }
  }

  /// PATCH /reservations/{id}/confirm-payment
  static Future<Map<String, dynamic>> confirmReservationPayment({
    required String reservationId,
    required String paymentId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse(
        '$baseUrl/parking/reservations/$reservationId/confirm-payment',
      );

      final payload = {'paymentId': paymentId};

      print(
        '💳 Confirming reservation payment: reservation=$reservationId, payment=$paymentId',
      );

      final response = await http.patch(
        uri,
        headers: _buildHeaders(token, hasBody: true),
        body: jsonEncode(payload),
      );

      print('📡 Confirm payment status: ${response.statusCode}');
      print('📡 Confirm payment body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to confirm payment: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in confirmReservationPayment: $e');
      rethrow;
    }
  }

  /// GET /reservations/my?page=&pageSize=
  static Future<Map<String, dynamic>> getMyReservations({
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse('$baseUrl/parking/reservations/my').replace(
        queryParameters: {
          'page': page.toString(),
          'pageSize': pageSize.toString(),
        },
      );

      print('📋 Fetching my reservations page=$page size=$pageSize');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 My reservations status: ${response.statusCode}');
      print('📡 My reservations body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch my reservations: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getMyReservations: $e');
      rethrow;
    }
  }

  /// GET /reservations/identifier/{identifier}
  static Future<Map<String, dynamic>> getReservationByIdentifier(
    String identifier,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse(
        '$baseUrl/parking/reservations/identifier/$identifier',
      );

      print('🔍 Fetching reservation by identifier: $identifier');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 By identifier status: ${response.statusCode}');
      print('📡 By identifier body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch reservation by identifier: '
        '${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getReservationByIdentifier: $e');
      rethrow;
    }
  }

  /// GET /reservations/{id}
  static Future<Map<String, dynamic>> getReservationById(
    String reservationId,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse('$baseUrl/parking/reservations/$reservationId');

      print('🔍 Fetching reservation detail by ID: $reservationId');

      final response = await http.get(uri, headers: _buildHeaders(token));

      print('📡 Reservation detail status: ${response.statusCode}');
      print('📡 Reservation detail body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      throw Exception(
        'Failed to fetch reservation detail: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in getReservationById: $e');
      rethrow;
    }
  }

  /// DELETE /reservations/{id}
  static Future<Map<String, dynamic>> cancelReservation(
    String reservationId,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) throw Exception('Authentication token not found');

      final uri = Uri.parse('$baseUrl/parking/reservations/$reservationId');

      print('🗑️ Cancelling reservation: $reservationId');

      final response = await http.delete(uri, headers: _buildHeaders(token));

      print('📡 Cancel reservation status: ${response.statusCode}');
      print('📡 Cancel reservation body: ${response.body}');

      if (response.statusCode == 200 ||
          response.statusCode == 204 ||
          response.statusCode == 202) {
        return response.body.isNotEmpty
            ? jsonDecode(response.body)
            : {
                'success': true,
                'message': 'Reservation cancelled successfully',
              };
      }
      throw Exception(
        'Failed to cancel reservation: ${response.statusCode} - ${response.body}',
      );
    } catch (e) {
      print('❌ Exception in cancelReservation: $e');
      rethrow;
    }
  }
}
