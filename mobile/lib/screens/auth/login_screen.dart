import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/auth_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final AuthService _authService = AuthService();
  final storage = const FlutterSecureStorage();

  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleLogin() async {
    final email = emailController.text.trim();
    final password = passwordController.text.trim();
    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập email và mật khẩu';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await _authService.login(email, password);

      // Ví dụ API trả về token: {"accessToken": "abcxyz..."}
      final token = response['data'];
      if (token != null) {
        await storage.write(key: 'data', value: token);

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Đăng nhập thành công")));

        // Chuyển sang màn hình Home
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        setState(() {
          _errorMessage = 'Đăng nhập thất bại';
        });
      }
    } catch (e) {
      // Cố gắng lấy thông điệp dễ đọc từ exception
      String message = e.toString();
      // Nếu backend trả JSON, cố gắng tách nội dung message/error
      try {
        final start = message.indexOf('{');
        final end = message.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
          final jsonStr = message.substring(start, end + 1);
          // ignore: avoid_dynamic_calls
          final Map<String, dynamic> obj =
              jsonDecode(jsonStr) as Map<String, dynamic>;
          message = (obj['message'] ?? obj['error'] ?? obj['detail'] ?? message)
              .toString();
        }
      } catch (_) {
        // giữ nguyên message nếu parse thất bại
      }

      setState(() {
        _errorMessage = message;
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 40),
            Center(
              child: Column(
                children: [
                  Image.asset("assets/logo.webp", height: 150),
                  const SizedBox(height: 10),
                  const Text(
                    "Đăng nhập",
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // Email
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: TextField(
                controller: emailController,
                decoration: InputDecoration(
                  labelText: "Email",
                  prefixIcon: const Icon(Icons.email),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            // Password
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: TextField(
                controller: passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: "Mật khẩu",
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Nút login
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        "Đăng nhập",
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
              ),
            ),

            // Lỗi (nếu có)
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red, fontSize: 13),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 20),
            const Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text("Hoặc đăng nhập bằng"),
                ),
                Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 20),
            // Đăng nhập bằng Google
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: OutlinedButton.icon(
                onPressed: () {},
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Colors.grey),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 50),
                ),
                icon: Image.asset(
                  "assets/wired-flat-2557-logo-google-hover-pinch.png",
                  height: 24,
                ),
                label: const Text("Đăng nhập bằng Google"),
              ),
            ),

            // Chuyển sang Register
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text("Đã có tài khoản?"),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/register');
                  },
                  child: const Text("Đăng ký ngay"),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
