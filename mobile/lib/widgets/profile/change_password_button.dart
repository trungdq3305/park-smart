import 'package:flutter/material.dart';
import '../../widgets/auth/change_password_dialog.dart';

class ChangePasswordButton extends StatelessWidget {
  const ChangePasswordButton({super.key});

  // App theme colors
  static const Color primaryColor = Colors.green;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: primaryColor.withOpacity(0.3), width: 1),
          ),
          child: Icon(Icons.lock_rounded, color: primaryColor, size: 20),
        ),
        title: const Text(
          'Đổi mật khẩu',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),
        subtitle: const Text(
          'Thay đổi mật khẩu để bảo mật tài khoản',
          style: TextStyle(fontSize: 14, color: Colors.grey),
        ),
        trailing: Icon(
          Icons.arrow_forward_ios_rounded,
          size: 16,
          color: Colors.grey.shade400,
        ),
        onTap: () => _showChangePasswordDialog(context),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        tileColor: Colors.grey.shade50,
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return const ChangePasswordDialog();
      },
    );
  }
}
