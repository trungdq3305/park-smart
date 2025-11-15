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

    if (accessToken != null && accessToken.isNotEmpty) {
      return accessToken;
    }

    // Thử đọc từ userData
    final userData = await getUserData();

    final token =
        userData?['backendToken'] ??
        userData?['idToken'] ??
        userData?['accessToken'];

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

    // Clear WebView session để cho phép chọn tài khoản khác
    await _clearWebViewSession();
  }

  // Clear WebView session để force account selection
  static Future<void> _clearWebViewSession() async {
    try {
      // Lưu flag để WebView biết cần clear session
      await storage.write(key: 'clearWebViewSession', value: 'true');
    } catch (e) {
      // Handle error setting WebView session clear flag
    }
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

  // Lấy user ID từ API hoặc token
  static Future<String?> getUserId() async {
    try {
      // Thử lấy từ API trước
      final apiData = await getUserProfile();
      if (apiData['data'] != null && apiData['data']['_id'] != null) {
        return apiData['data']['_id'] as String;
      }
    } catch (e) {
      // Fallback to token
    }

    // Fallback: decode từ token
    final token = await getToken();
    if (token != null) {
      final claims = await decodeJWTToken(token);
      if (claims != null) {
        return claims['sub'] ??
            claims['id'] ??
            claims['_id'] ??
            claims['userId'];
      }
    }

    return null;
  }

  // Decode JWT token để lấy thông tin role
  static Future<Map<String, dynamic>?> decodeJWTToken(String token) async {
    try {
      // Kiểm tra nếu token là JSON object thay vì JWT
      if (token.startsWith('{')) {
        return json.decode(token) as Map<String, dynamic>;
      }

      // Xử lý JWT token
      final parts = token.split('.');
      if (parts.length != 3) {
        return null;
      }

      String payload = parts[1].padRight(
        parts[1].length + ((4 - parts[1].length % 4) % 4),
        '=',
      );
      final decoded = utf8.decode(base64Url.decode(payload));
      return json.decode(decoded) as Map<String, dynamic>;
    } catch (e) {
      return null;
    }
  }

  // Kiểm tra role của user từ token
  static Future<String?> getUserRole() async {
    try {
      // Thử lấy từ API trước
      final apiData = await getUserProfile();
      if (apiData['data'] != null) {
        return apiData['data']['roleName'];
      }
    } catch (e) {
      // Fallback to token
    }

    // Fallback: decode từ token
    final token = await getToken();
    if (token != null) {
      final claims = await decodeJWTToken(token);
      return claims?['role'] ?? claims?['roles'];
    }

    return null;
  }

  // Kiểm tra xem user có phải Driver không
  static Future<bool> isDriver() async {
    final role = await getUserRole();
    return role?.toLowerCase() == 'driver';
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
