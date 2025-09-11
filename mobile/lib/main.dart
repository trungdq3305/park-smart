import 'package:flutter/material.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';

void main() {
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
      // Cách 1: chỉ định thẳng màn hình home
      home: LoginScreen(),

      // Cách 2: dùng routes map
      routes: {
        '/login': (context) => LoginScreen(),
        '/register': (context) => RegisterScreen(),
      },
      initialRoute: '/login',
    );
  }
}
