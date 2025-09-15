import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text('Trò chuyện'),
        backgroundColor: Colors.green,
      ),
      showBottomNav: false,
      body: const Center(child: Text('Màn hình Trò chuyện')),
    );
  }
}
