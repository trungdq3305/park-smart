import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class VehicleService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static final String _baseUrl = dotenv.env['BASE_URL'] ?? '';

  // Lấy token từ storage
  static Future<String?> _getToken() async {
    final accessToken = await _storage.read(key: 'accessToken');
    if (accessToken != null && accessToken.isNotEmpty) {
      return accessToken;
    }

    final userData = await _storage.read(key: 'data');
    if (userData != null) {
      try {
        final Map<String, dynamic> data = jsonDecode(userData);
        return data['backendToken'] ?? data['idToken'] ?? data['accessToken'];
      } catch (e) {
        print('Error parsing user data: $e');
      }
    }
    return null;
  }

  // Tạo xe mới
  static Future<Map<String, dynamic>> createVehicle({
    required String plateNumber,
    required String colorId,
    required String vehicleTypeId,
    required String brandId,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles');

    final body = {
      'plateNumber': plateNumber,
      'colorId': colorId,
      'vehicleTypeId': vehicleTypeId,
      'brandId': brandId,
    };

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to create vehicle: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lấy danh sách xe của driver (có phân trang)
  static Future<Map<String, dynamic>> getDriverVehicles({
    int page = 1,
    int pageSize = 10,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles/driver/all').replace(
      queryParameters: {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      },
    );

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to get driver vehicles: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Cập nhật thông tin xe
  static Future<Map<String, dynamic>> updateVehicle({
    required String vehicleId,
    String? plateNumber,
    String? colorId,
    String? vehicleTypeId,
    String? brandId,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles/$vehicleId');

    final Map<String, dynamic> body = {};
    if (plateNumber != null) body['plateNumber'] = plateNumber;
    if (colorId != null) body['colorId'] = colorId;
    if (vehicleTypeId != null) body['vehicleTypeId'] = vehicleTypeId;
    if (brandId != null) body['brandId'] = brandId;

    final response = await http.put(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to update vehicle: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Xóa xe
  static Future<Map<String, dynamic>> deleteVehicle(String vehicleId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles/$vehicleId');

    final response = await http.delete(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to delete vehicle: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Khôi phục xe đã xóa
  static Future<Map<String, dynamic>> restoreVehicle(String vehicleId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles/restore/$vehicleId');

    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to restore vehicle: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lấy danh sách nhãn xe (brands)
  static Future<Map<String, dynamic>> getBrands() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/brands');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to get brands: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lấy danh sách màu xe (colors)
  static Future<Map<String, dynamic>> getColors() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/colors');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to get colors: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lấy danh sách loại xe (types)
  static Future<Map<String, dynamic>> getVehicleTypes() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicle-types');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to get vehicle types: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lấy thông tin chi tiết một xe
  static Future<Map<String, dynamic>> getVehicleById(String vehicleId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$_baseUrl/parking/vehicles/$vehicleId');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to get vehicle: ${response.statusCode} - ${response.body}',
      );
    }
  }
}
