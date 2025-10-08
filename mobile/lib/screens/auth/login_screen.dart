import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/auth_service.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'forgot_password_screen.dart';
import 'webview_login_screen.dart';
import 'package:url_launcher/url_launcher.dart';

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
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // Sử dụng Web client ID để có thể lấy idToken
    clientId:
        '595180731029-l00vridqa54h8uckh8lgijul6ulv69sm.apps.googleusercontent.com',
  );

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
      print('Login response in screen: $response');
      print('Response type: ${response.runtimeType}');

      // Lưu toàn bộ response data vào storage
      try {
        await storage.write(key: 'data', value: jsonEncode(response));
        print('Data saved to storage successfully');
      } catch (e) {
        print('Error saving to storage: $e');
        // Thử lưu dưới dạng string nếu jsonEncode fail
        await storage.write(key: 'data', value: response.toString());
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Đăng nhập thành công")));

      // Chuyển sang màn hình Home
      Navigator.pushReplacementNamed(context, '/main');
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

  Future<void> _handleGoogleLogin() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('Starting Google Login via API...');

      // Gọi API để lấy URL hoặc token
      final response = await _authService.googleLogin();
      print('Google Login API Response: $response');

      if (!mounted) return;

      // Kiểm tra nếu API trả về URL để mở WebView hoặc HTML response
      if (response['data'] != null &&
          (response['data'].toString().startsWith('http') ||
              response['type'] == 'html')) {
        final loginUrl = response['data'].toString();
        print('Opening WebView with URL: $loginUrl');

        // Mở WebView để đăng nhập Google
        final result = await Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => WebViewLoginScreen(
              url: loginUrl,
              onSuccess: (token) async {
                // Lưu token và chuyển trang
                await _authService.saveToken(token);
                Navigator.pushReplacementNamed(context, '/main');
              },
            ),
          ),
        );

        if (result == true) {
          // Đăng nhập thành công
          Navigator.pushReplacementNamed(context, '/main');
        } else {
          // Nếu WebView thất bại, thử mở trình duyệt hệ thống
          await _openInSystemBrowser(loginUrl);
        }
      } else {
        // API trả về token trực tiếp
        print('Login successful with token');
        Navigator.pushReplacementNamed(context, '/main');
      }
    } catch (e) {
      print('Google Login Error: $e');
      setState(() => _errorMessage = 'Lỗi đăng nhập Google: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openInSystemBrowser(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);

        // Hiển thị thông báo cho user
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Đã mở trình duyệt. Sau khi đăng nhập thành công, quay lại app.',
              ),
              duration: Duration(seconds: 5),
            ),
          );
        }
      } else {
        throw Exception('Không thể mở trình duyệt');
      }
    } catch (e) {
      print('Error opening browser: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi mở trình duyệt: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
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

            // Link quên mật khẩu
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ForgotPasswordScreen(),
                      ),
                    );
                  },
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: Text(
                    'Quên mật khẩu?',
                    style: TextStyle(
                      color: Colors.green,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),

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

            // Tạm thời ẩn Google Sign-In cho đến khi có cấu hình đúng
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
                onPressed: _isLoading ? null : _handleGoogleLogin,
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
