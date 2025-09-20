import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class UserService {
  static const storage = FlutterSecureStorage();
  static final String baseUrl = dotenv.env['BASE_URL'] ?? '';

  // Lưu thông tin user
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    await storage.write(key: 'data', value: jsonEncode(userData));
  }

  // Đọc thông tin user
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final data = await storage.read(key: 'data');
      if (data != null) {
        return jsonDecode(data) as Map<String, dynamic>;
      }
    } catch (e) {
      print('Error reading user data: $e');
    }
    return null;
  }

  // Lấy thông tin user cơ bản
  static Future<Map<String, dynamic>?> getUserInfo() async {
    final userData = await getUserData();
    return userData?['user'];
  }

  // Lấy token
  static Future<String?> getToken() async {
    // Thử đọc token từ storage trực tiếp
    final accessToken = await storage.read(key: 'accessToken');
    print(
      'AccessToken from storage: ${accessToken != null ? 'Found' : 'Not found'}',
    );

    if (accessToken != null && accessToken.isNotEmpty) {
      return accessToken;
    }

    // Thử đọc từ userData
    final userData = await getUserData();
    print('UserData keys: ${userData?.keys.toList()}');

    final token =
        userData?['backendToken'] ??
        userData?['idToken'] ??
        userData?['accessToken'];

    print('Token found: ${token != null ? 'Yes' : 'No'}');
    return token;
  }

  // Kiểm tra đã đăng nhập chưa
  static Future<bool> isLoggedIn() async {
    final userData = await getUserData();
    return userData != null && userData['user'] != null;
  }

  // Đăng xuất
  static Future<void> logout() async {
    await storage.delete(key: 'data');
    await storage.delete(key: 'accessToken');
    await storage.delete(key: 'refreshToken');
  }

  // Lấy email
  static Future<String?> getUserEmail() async {
    final userInfo = await getUserInfo();
    return userInfo?['email'];
  }

  // Lấy tên
  static Future<String?> getUserName() async {
    final userInfo = await getUserInfo();
    return userInfo?['name'];
  }

  // Lấy ảnh đại diện
  static Future<String?> getUserPhoto() async {
    final userInfo = await getUserInfo();
    return userInfo?['photoUrl'];
  }

  // API: Lấy thông tin user từ backend
  static Future<Map<String, dynamic>> getUserProfile() async {
    final token = await getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$baseUrl/core/accounts/me');

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
        'Failed to get user profile: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // API: Cập nhật thông tin cá nhân
  static Future<Map<String, dynamic>> updatePersonalInfo({
    String? fullName,
    String? phoneNumber,
    bool? gender,
  }) async {
    final token = await getToken();
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$baseUrl/core/drivers');

    // Chỉ gửi các field có giá trị
    final Map<String, dynamic> body = {};
    if (fullName != null) body['fullName'] = fullName;
    if (phoneNumber != null) body['phoneNumber'] = phoneNumber;
    if (gender != null) body['gender'] = gender;

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
        'Failed to update personal info: ${response.statusCode} - ${response.body}',
      );
    }
  }
}
