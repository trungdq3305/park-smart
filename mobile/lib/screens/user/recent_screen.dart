import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class RecentScreen extends StatelessWidget {
  const RecentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text('Gần đây'),
        backgroundColor: Colors.green,
      ),
      showBottomNav: true,
      body: const Center(child: Text('Màn hình Gần đây')),
    );
  }
}
