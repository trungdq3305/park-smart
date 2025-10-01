import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final String baseUrl = dotenv.env['BASE_URL'] ?? '';
  final String baseUrlGoogle = dotenv.env['BASE_URL_GOOGLE'] ?? '';
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/core/auths/login');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final responseData = jsonDecode(response.body);
      print('Login response data: $responseData');
      print('Response data keys: ${responseData.keys.toList()}');

      // Lưu token vào storage - data là JWT token string
      if (responseData['data'] != null) {
        await _storage.write(
          key: 'accessToken',
          value: responseData['data'], // data chính là JWT token
        );
        print('JWT token saved to storage');
      }

      return responseData;
    } else {
      throw Exception('Login failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> register(
    String email,
    String password,
    String phoneNumber,
    String fullName,
    bool gender,
  ) async {
    final url = Uri.parse('$baseUrl/core/auths/driver-register');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'fullName': fullName,
        'phoneNumber': phoneNumber,
        'gender': gender,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Register failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> confirmRegister({
    required String email,
    required String code,
  }) async {
    final url = Uri.parse('$baseUrl/core/auths/register-confirm');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'code': code}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Confirm register failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> changePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    // Lấy token từ storage
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('No authentication token found');
    }

    final url = Uri.parse('$baseUrl/core/auths/change-password');

    final response = await http.put(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'oldPassword': oldPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Change password failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final url = Uri.parse(
      '$baseUrl/core/auths/forgot-password',
    ).replace(queryParameters: {'email': email});

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Forgot password failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> confirmForgotPassword({
    required String email,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final url = Uri.parse('$baseUrl/core/auths/confirm-forgot-pass');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      }),
    );

    print('Confirm forgot password response status: ${response.statusCode}');
    print('Confirm forgot password response body: ${response.body}');

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Confirm forgot password failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> confirmForgotCode({
    required String email,
    required String code,
  }) async {
    final url = Uri.parse('$baseUrl/core/auths/confirm-forgot-code');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'code': code}),
    );

    print('Confirm forgot code response status: ${response.statusCode}');
    print('Confirm forgot code response body: ${response.body}');

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Confirm forgot code failed: ${response.body}');
    }
  }

  // Tạo Google OAuth URL để user có thể đăng nhập
  String getGoogleOAuthUrl() {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Cần thay bằng client ID thực tế
    const redirectUri = 'park-smart://login-success';

    final params = {
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'response_type': 'code',
      'scope': 'openid email profile',
      'access_type': 'offline',
    };

    final uri = Uri.parse(
      'https://accounts.google.com/o/oauth2/v2/auth',
    ).replace(queryParameters: params);

    return uri.toString();
  }

  Future<Map<String, dynamic>> googleLogin() async {
    // Lấy URL từ API để mở WebView
    final url = Uri.parse('$baseUrlGoogle/api/auths/google-login');

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    print('Google login response status: ${response.statusCode}');
    print('Google login response body: ${response.body}');

    if (response.statusCode == 200) {
      try {
        final responseData = jsonDecode(response.body);

        // Nếu API trả về URL để mở WebView
        if (responseData['data'] != null &&
            responseData['data'].toString().startsWith('http')) {
          return responseData; // Trả về URL để mở WebView
        }

        // Nếu API trả về token trực tiếp
        if (responseData['data'] != null) {
          await _storage.write(key: 'accessToken', value: responseData['data']);
          print('JWT token saved to storage');

          // Lưu thông tin user từ message
          if (responseData['message'] != null) {
            await _storage.write(
              key: 'userInfo',
              value: responseData['message'],
            );
            print('User info saved to storage');
          }
        }

        return responseData;
      } catch (e) {
        print('Error parsing response: $e');
        // Nếu không parse được JSON, có thể là HTML
        if (response.body.trim().startsWith('<!doctype html>') ||
            response.body.trim().startsWith('<html')) {
          print('Response is HTML, opening WebView');
          return {'data': url.toString(), 'type': 'html'};
        }
        throw Exception('Lỗi xử lý response từ server: $e');
      }
    } else {
      print('Error response: ${response.statusCode} - ${response.body}');
      throw Exception(
        'Google login failed: ${response.statusCode} - ${response.body}',
      );
    }
  }

  // Lưu token từ WebView callback
  Future<void> saveToken(String token) async {
    await _storage.write(key: 'accessToken', value: token);
    print('Token saved to storage from WebView');
  }

  // Logout và xóa token
  Future<void> logout() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
    print('Tokens cleared from storage');
  }
}
