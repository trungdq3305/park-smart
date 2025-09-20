import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService {
  final String baseUrl = dotenv.env['BASE_URL'] ?? '';
  final String baseUrlGoogle = dotenv.env['BASE_URL_GOOGLE'] ?? '';

  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/core/auths/login');

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
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

  Future<Map<String, dynamic>> googleLogin(String idToken) async {
    // Sử dụng GET request với query parameter
    final url = Uri.parse('$baseUrlGoogle/api/auths/google-login').replace(
      queryParameters: {
        'idToken': idToken,
        'redirectUrl': 'park-smart://login-success', // Custom scheme cho mobile
      },
    );

    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );

    print('Google login response status: ${response.statusCode}');
    print('Google login response headers: ${response.headers}');
    print('Google login response body: ${response.body.substring(0, 500)}...');

    if (response.statusCode == 200) {
      // Kiểm tra xem response có phải là JSON không
      try {
        return jsonDecode(response.body);
      } catch (e) {
        // Nếu không phải JSON, có thể là HTML redirect page
        print('Response is not JSON, might be redirect page');

        // Thử parse HTML để tìm redirect URL hoặc token
        if (response.body.contains('window.location') ||
            response.body.contains('redirect') ||
            response.body.contains('token')) {
          // Có thể cần follow redirect hoặc extract token từ HTML
          throw Exception(
            'API trả về redirect page. Cần xử lý redirect hoặc extract token từ HTML.',
          );
        }

        throw Exception(
          'API trả về định dạng không đúng. Status: ${response.statusCode}. Body: ${response.body.substring(0, 200)}...',
        );
      }
    } else if (response.statusCode == 302 || response.statusCode == 301) {
      // Handle redirect
      final location = response.headers['location'];
      print('Redirect to: $location');
      throw Exception('API redirect to: $location');
    } else {
      print('Error response: ${response.statusCode} - ${response.body}');
      throw Exception(
        'Google login failed: ${response.statusCode} - ${response.body}',
      );
    }
  }
}
