import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ParkingLotService {
  static final String baseUrl =
      dotenv.env['BASE_URL'] ?? 'http://localhost:5000';
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

  /// Tìm các bãi đỗ xe gần một tọa độ (theo bán kính)
  /// GET /parking/parking-lots/nearby?longitude=106.8091162&latitude=10.8160312&distance=5&page=1&pageSize=10
  static Future<Map<String, dynamic>> getNearbyParkingLots({
    required double longitude,
    required double latitude,
    required double distance, // in kilometers
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/parking-lots/nearby').replace(
        queryParameters: {
          'longitude': longitude.toString(),
          'latitude': latitude.toString(),
          'distance': distance.toString(),
          'page': page.toString(),
          'pageSize': pageSize.toString(),
        },
      );

      print('🔍 Getting nearby parking lots:');
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
        print('✅ Successfully fetched nearby parking lots');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching nearby parking lots: $errorBody');
        throw Exception(
          'Failed to fetch nearby parking lots: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getNearbyParkingLots: $e');
      rethrow;
    }
  }

  /// Tìm các bãi đỗ xe trong một khung nhìn bản đồ
  /// GET /parking/parking-lots/in-bounds?bottomLeftLng=106.786&bottomLeftLat=10.793&topRightLng=106.832&topRightLat=10.838&page=1&pageSize=10
  static Future<Map<String, dynamic>> getParkingLotsInBounds({
    required double bottomLeftLng,
    required double bottomLeftLat,
    required double topRightLng,
    required double topRightLat,
    int page = 1,
    int pageSize = 10,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/parking-lots/in-bounds').replace(
        queryParameters: {
          'bottomLeftLng': bottomLeftLng.toString(),
          'bottomLeftLat': bottomLeftLat.toString(),
          'topRightLng': topRightLng.toString(),
          'topRightLat': topRightLat.toString(),
          'page': page.toString(),
          'pageSize': pageSize.toString(),
        },
      );

      print('🗺️ Getting parking lots in bounds:');
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
        print('✅ Successfully fetched parking lots in bounds');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching parking lots in bounds: $errorBody');
        throw Exception(
          'Failed to fetch parking lots in bounds: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getParkingLotsInBounds: $e');
      rethrow;
    }
  }

  /// Lấy thông tin chi tiết của một bãi đỗ xe
  /// GET /parking/parking-lots/:id
  static Future<Map<String, dynamic>> getParkingLotById(
    String parkingLotId,
  ) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/parking-lots/$parkingLotId');

      print('🏢 Getting parking lot by ID:');
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
        print('✅ Successfully fetched parking lot details');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching parking lot details: $errorBody');
        throw Exception(
          'Failed to fetch parking lot details: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getParkingLotById: $e');
      rethrow;
    }
  }

  /// Lấy tất cả bãi đỗ xe (với phân trang)
  /// GET /parking/parking-lots?page=1&pageSize=10
  static Future<Map<String, dynamic>> getAllParkingLots({
    int page = 1,
    int pageSize = 10,
    String? search,
    String? sortBy,
    String? sortOrder,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      Map<String, String> queryParams = {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (sortBy != null && sortBy.isNotEmpty) {
        queryParams['sortBy'] = sortBy;
      }
      if (sortOrder != null && sortOrder.isNotEmpty) {
        queryParams['sortOrder'] = sortOrder;
      }

      final uri = Uri.parse(
        '$baseUrl/parking/parking-lots',
      ).replace(queryParameters: queryParams);

      print('📋 Getting all parking lots:');
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
        print('✅ Successfully fetched all parking lots');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching all parking lots: $errorBody');
        throw Exception(
          'Failed to fetch all parking lots: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getAllParkingLots: $e');
      rethrow;
    }
  }

  /// Lấy thông tin trạng thái realtime của bãi đỗ xe
  /// GET /parking/parking-lots/:id/realtime-status
  static Future<Map<String, dynamic>> getParkingLotRealtimeStatus(
    String parkingLotId,
  ) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/parking-lots/$parkingLotId/realtime-status',
      );

      print('⚡ Getting realtime status:');
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
        print('✅ Successfully fetched realtime status');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching realtime status: $errorBody');
        throw Exception(
          'Failed to fetch realtime status: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getParkingLotRealtimeStatus: $e');
      rethrow;
    }
  }

  /// Lấy thông tin realtime của nhiều bãi đỗ xe cùng lúc
  /// POST /parking/parking-lots/realtime-status/batch
  static Future<Map<String, dynamic>> getBatchRealtimeStatus(
    List<String> parkingLotIds,
  ) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/parking-lots/realtime-status/batch',
      );

      final requestBody = {'parkingLotIds': parkingLotIds};

      print('⚡ Getting batch realtime status:');
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

      if (response.statusCode == 200) {
        final responseData = jsonDecode(response.body);
        print('✅ Successfully fetched batch realtime status');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching batch realtime status: $errorBody');
        throw Exception(
          'Failed to fetch batch realtime status: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getBatchRealtimeStatus: $e');
      rethrow;
    }
  }

  /// Cập nhật trạng thái thực tế của bãi đỗ xe (tăng/giảm availableSpots)
  /// POST /parking/parking-lots/:id/check-real-time-status { change }
  static Future<Map<String, dynamic>> checkRealTimeStatus({
    required String parkingLotId,
    required int change,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse(
        '$baseUrl/parking/parking-lots/$parkingLotId/check-real-time-status',
      );

      final body = jsonEncode({'change': change});

      print('⚡ Check realtime status:');
      print('  URL: $uri');
      print('  Body: $body');

      final response = await http.post(
        uri,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: body,
      );

      print('📡 Response status: ${response.statusCode}');
      print('📡 Response body: ${response.body}');

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorBody = response.body;
        throw Exception(
          'Failed to check realtime status: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in checkRealTimeStatus: $e');
      rethrow;
    }
  }

  /// Lấy danh sách các vị trí đỗ xe của một bãi đỗ xe theo tầng
  /// GET /parking/parking-spaces?parkingLotId=68e51c5f4745c81c82b61833&level=1
  static Future<Map<String, dynamic>> getParkingSpaces({
    required String parkingLotId,
    int? level,
    int page = 1,
    int pageSize = 100,
  }) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      Map<String, String> queryParams = {
        'parkingLotId': parkingLotId,
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

      if (level != null) {
        queryParams['level'] = level.toString();
      }

      final uri = Uri.parse(
        '$baseUrl/parking/parking-spaces',
      ).replace(queryParameters: queryParams);

      print('🅿️ Getting parking spaces:');
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
        print('✅ Successfully fetched parking spaces');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching parking spaces: $errorBody');
        throw Exception(
          'Failed to fetch parking spaces: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getParkingSpaces: $e');
      rethrow;
    }
  }

  /// Lấy tất cả các vị trí đỗ xe của một bãi đỗ xe (tất cả các tầng)
  /// GET /parking/parking-spaces?parkingLotId=68e51c5f4745c81c82b61833
  static Future<Map<String, dynamic>> getAllParkingSpaces({
    required String parkingLotId,
    int page = 1,
    int pageSize = 1000,
  }) async {
    return getParkingSpaces(
      parkingLotId: parkingLotId,
      level: null,
      page: page,
      pageSize: pageSize,
    );
  }

  /// Lấy vị trí đỗ xe theo ID cụ thể
  /// GET /parking/parking-spaces/:id
  static Future<Map<String, dynamic>> getParkingSpaceById(
    String parkingSpaceId,
  ) async {
    try {
      String? token = await _getToken();
      if (token == null) {
        throw Exception('No authentication token found');
      }

      final uri = Uri.parse('$baseUrl/parking/parking-spaces/$parkingSpaceId');

      print('🅿️ Getting parking space by ID:');
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
        print('✅ Successfully fetched parking space details');
        return responseData;
      } else {
        final errorBody = response.body;
        print('❌ Error fetching parking space details: $errorBody');
        throw Exception(
          'Failed to fetch parking space details: ${response.statusCode} - $errorBody',
        );
      }
    } catch (e) {
      print('❌ Exception in getParkingSpaceById: $e');
      rethrow;
    }
  }
}
