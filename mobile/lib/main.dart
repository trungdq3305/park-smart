import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/screens/user/home_screen.dart';
import 'package:mobile/utils/custom_http_overrides.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/register_otp_screen.dart';
import 'screens/main/main_wrapper.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  try {
    // Check if Firebase is already initialized
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp();
    }
  } catch (e) {
    debugPrint('Firebase initialization error: $e');
    // Re-throw to prevent app from running without Firebase
    rethrow;
  }

  // Load biến môi trường - tạm thời comment vì không có file .env
  await dotenv.load(fileName: ".env");

  // ✅ Gán HttpOverrides (không cần async, không cần create())
  HttpOverrides.global = CustomHttpOverrides();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Park Smart',
      theme: ThemeData(primarySwatch: Colors.blue),
      // Routes
      routes: {
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        // Truyền email bằng arguments: Navigator.pushNamed(context, '/register-otp', arguments: 'email@example.com')
        '/register-otp': (context) {
          final args = ModalRoute.of(context)?.settings.arguments as String?;
          return RegisterOtpScreen(email: args ?? '');
        },
        '/main': (context) => const MainWrapper(),
        '/home': (context) => const HomeScreen(),
        // '/details': (context) => const DetailScreen(), // KHÔNG navbar
      },
      home: const AuthWrapper(),
    );
  }
}

/// Widget kiểm tra token khi khởi động app
/// Nếu có token -> điều hướng đến /main
/// Nếu không có token -> điều hướng đến /login
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  bool _isChecking = true;
  Widget? _initialWidget;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    try {
      // Kiểm tra token trong storage
      final token = await _storage.read(key: 'accessToken');
      
      if (mounted) {
        setState(() {
          _isChecking = false;
          // Nếu có token và token không rỗng -> đã đăng nhập -> điều hướng đến /main
          // Nếu không có token hoặc token rỗng -> chưa đăng nhập -> điều hướng đến /login
          _initialWidget = (token != null && token.isNotEmpty) 
              ? const MainWrapper() 
              : const LoginScreen();
        });
      }
    } catch (e) {
      debugPrint('Error checking auth status: $e');
      // Nếu có lỗi, mặc định điều hướng đến /login
      if (mounted) {
        setState(() {
          _isChecking = false;
          _initialWidget = const LoginScreen();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Hiển thị loading khi đang kiểm tra token
    if (_isChecking) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    // Hiển thị widget phù hợp dựa trên kết quả kiểm tra token
    return _initialWidget ?? const LoginScreen();
  }
}
