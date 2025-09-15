import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text('Tài khoản'),
        backgroundColor: Colors.green,
      ),
      showBottomNav: true,
      body: const Center(child: Text('Màn hình Tài khoản')),
    );
  }
}
