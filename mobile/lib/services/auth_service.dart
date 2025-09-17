import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AuthService {
  final String baseUrl = dotenv.env['BASE_URL'] ?? '';

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
    final url = Uri.parse('$baseUrl/api/auths/google-login');

    final response = await http.get(
      url,
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Google login failed: ${response.body}');
    }
  }
}
