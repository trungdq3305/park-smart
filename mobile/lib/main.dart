import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:mobile/screens/user/home_screen.dart';
import 'package:mobile/utils/custom_http_overrides.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/main/main_wrapper.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load biến môi trường
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
        '/main': (context) => const MainWrapper(),
        '/home': (context) => const HomeScreen(),
        // '/details': (context) => const DetailScreen(), // KHÔNG navbar
      },
      initialRoute: '/login',
    );
  }
}
