import 'package:flutter/material.dart';

class ApiHelpDialog extends StatelessWidget {
  const ApiHelpDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Hướng dẫn xử lý lỗi API'),
      content: const SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Tính năng chỉ đường sử dụng Google Maps bên ngoài. Nếu bạn thấy lỗi liên quan đến API bãi đỗ xe:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 12),
            Text('1. Kiểm tra kết nối mạng.'),
            Text(
              '2. Đảm bảo API Key cho dịch vụ bãi đỗ xe đã được cấu hình đúng.',
            ),
            SizedBox(height: 12),
            Text(
              'Chỉ đường sẽ mở ứng dụng Google Maps trên thiết bị của bạn.',
              style: TextStyle(
                fontStyle: FontStyle.italic,
                color: Colors.blue,
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Đóng'),
        ),
      ],
    );
  }
}
