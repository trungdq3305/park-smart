import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final storage = const FlutterSecureStorage();
  String? token;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final savedToken = await storage.read(key: 'accessToken');
    setState(() {
      token = savedToken;
    });
  }

  Future<void> _logout() async {
    await storage.delete(key: 'accessToken');
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text("Trang chủ"),
        backgroundColor: Colors.green,
        actions: [
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout)),
        ],
      ),
      showBottomNav: false,
      body: Center(
        child: token == null
            ? const CircularProgressIndicator()
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    "Chào mừng bạn đã đăng nhập!",
                    style: TextStyle(fontSize: 20),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Token của bạn:",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    token ?? "Không có token",
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: Colors.blue),
                  ),
                ],
              ),
      ),
    );
  }
}
