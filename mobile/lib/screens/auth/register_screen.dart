import 'package:flutter/material.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  void _handleRegister() {
    final data = {
      "email": emailController.text,
      "password": passwordController.text,
    };
    print(data); // sau này gọi API login qua services
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

            // Ô nhập email
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

            // Ô nhập password
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

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: TextField(
                controller: passwordController,
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

            const SizedBox(height: 20),

            // Nút đăng nhập
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ElevatedButton(
                onPressed: _handleRegister,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text(
                  "Đăng ký",
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Hoặc
            const Row(
              children: [
                Expanded(child: Divider()),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text("Hoặc đăng ký bằng."),
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

            // Đăng nhập bằng Apple
            // Padding(
            //   padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            //   child: ElevatedButton.icon(
            //     onPressed: () {},
            //     style: ElevatedButton.styleFrom(
            //       backgroundColor: Colors.black,
            //       padding: const EdgeInsets.symmetric(vertical: 14),
            //       shape: RoundedRectangleBorder(
            //         borderRadius: BorderRadius.circular(12),
            //       ),
            //       minimumSize: const Size(double.infinity, 50),
            //     ),
            //     icon: const Icon(Icons.apple, color: Colors.white),
            //     label: const Text(
            //       "Đăng nhập bằng Apple",
            //       style: TextStyle(color: Colors.white),
            //     ),
            //   ),
            // ),

            // const Spacer(),

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
    );
  }
}
