import 'package:flutter/material.dart';
import 'dart:convert';
import '../../services/auth_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();
  final TextEditingController phoneController = TextEditingController();

  bool genderIsMale = true; // true: male, false: female
  bool isLoading = false;
  bool isAgreeToTerms = false;
  String? _errorMessage;

  @override
  void dispose() {
    fullNameController.dispose();
    emailController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    phoneController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    final fullName = fullNameController.text.trim();
    final email = emailController.text.trim();
    final password = passwordController.text;
    final confirmPassword = confirmPasswordController.text;
    final phone = phoneController.text.trim();

    if (fullName.isEmpty ||
        email.isEmpty ||
        phone.isEmpty ||
        password.isEmpty ||
        confirmPassword.isEmpty) {
      setState(() {
        _errorMessage = 'Vui lòng nhập đầy đủ thông tin';
      });
      return;
    }

    if (password != confirmPassword) {
      setState(() {
        _errorMessage = 'Mật khẩu nhập lại không khớp';
      });
      return;
    }

    if (!isAgreeToTerms) {
      setState(() {
        _errorMessage = 'Vui lòng chấp nhận điều khoản dịch vụ';
      });
      return;
    }

    setState(() {
      isLoading = true;
      _errorMessage = null;
    });

    try {
      final auth = AuthService();
      final res = await auth.register(
        email,
        password,
        phone,
        fullName,
        genderIsMale,
        isAgreeToTerms,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Đăng ký thành công'),
        ),
      );

      if (mounted) {
        Navigator.pushNamed(context, '/register-otp', arguments: email);
      }
    } catch (e) {
      String message = e.toString();
      try {
        final start = message.indexOf('{');
        final end = message.lastIndexOf('}');
        if (start != -1 && end != -1 && end > start) {
          final jsonStr = message.substring(start, end + 1);
          final Map<String, dynamic> obj =
              jsonDecode(jsonStr) as Map<String, dynamic>;
          message = (obj['message'] ?? obj['error'] ?? obj['detail'] ?? message)
              .toString();
        }
      } catch (_) {}
      setState(() {
        _errorMessage = message.startsWith('Exception: ')
            ? message.replaceFirst('Exception: ', '')
            : message;
      });
    } finally {
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 16,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),

              // Logo
              Center(
                child: Column(
                  children: [
                    Image.asset("assets/logo.webp", height: 150), // logo app
                    const SizedBox(height: 10),
                    const Text(
                      "Tạo tài khoản",
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

              // Ô nhập họ và tên
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: TextField(
                  controller: fullNameController,
                  decoration: InputDecoration(
                    labelText: "Họ và Tên",
                    prefixIcon: const Icon(Icons.person),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              // Ô nhập email
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
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

              // Ô nhập số điện thoại
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: "Số điện thoại",
                    prefixIcon: const Icon(Icons.phone),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),

              // Ô nhập password
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
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

              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: TextField(
                  controller: confirmPasswordController,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: "Nhập lại mật khẩu",
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),

              // Chọn giới tính
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    const Text('Giới tính:'),
                    const SizedBox(width: 12),
                    ChoiceChip(
                      label: const Text('Nam'),
                      selected: genderIsMale,
                      onSelected: (_) => setState(() => genderIsMale = true),
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Nữ'),
                      selected: !genderIsMale,
                      onSelected: (_) => setState(() => genderIsMale = false),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Checkbox chấp nhận điều khoản
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    Checkbox(
                      value: isAgreeToTerms,
                      onChanged: (value) {
                        setState(() {
                          isAgreeToTerms = value ?? false;
                        });
                      },
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            isAgreeToTerms = !isAgreeToTerms;
                          });
                        },
                        child: const Text(
                          "Chấp nhận điều khoản dịch vụ",
                          style: TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Nút đăng ký
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ElevatedButton(
                  onPressed: (isLoading || !isAgreeToTerms)
                      ? null
                      : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: isLoading
                      ? const SizedBox(
                          height: 22,
                          width: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text(
                          "Đăng ký",
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

              // Hoặc
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Text("Hoặc đăng ký bằng"),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 20),

              // Đăng nhập bằng Google
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 8,
                ),
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

              // Chuyển sang Login
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Đã có tài khoản?"),
                  TextButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/login');
                    },
                    child: const Text("Đăng nhập ngay"),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
