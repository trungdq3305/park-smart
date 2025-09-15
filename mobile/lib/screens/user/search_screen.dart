import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text('Tìm kiếm'),
        backgroundColor: Colors.green,
      ),
      showBottomNav: false,
      body: const Center(child: Text('Màn hình Tìm kiếm')),
    );
  }
}
