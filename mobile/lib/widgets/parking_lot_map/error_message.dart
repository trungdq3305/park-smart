import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';

class ErrorMessage extends StatelessWidget {
  final String errorMessage;
  final VoidCallback onDismiss;
  final VoidCallback? onShowHelp;

  const ErrorMessage({
    super.key,
    required this.errorMessage,
    required this.onDismiss,
    this.onShowHelp,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.yellow.shade700),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildErrorMessage(),
          if (_shouldShowHelpButton()) ...[
            const SizedBox(height: 12),
            _buildHelpButton(),
          ],
          if (_shouldShowSettingsButton()) ...[
            const SizedBox(height: 12),
            _buildSettingsButton(),
          ],
        ],
      ),
    );
  }

  Widget _buildErrorMessage() {
    return Row(
      children: [
        Icon(Icons.error_outline, color: Colors.yellow.shade700),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            errorMessage,
            style: TextStyle(color: Colors.yellow.shade700),
          ),
        ),
        IconButton(
          onPressed: onDismiss,
          icon: Icon(Icons.close, color: Colors.yellow.shade700),
        ),
      ],
    );
  }

  Widget _buildHelpButton() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: onShowHelp,
            icon: const Icon(Icons.help_outline),
            label: const Text('Hướng dẫn'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.blue.shade600,
              side: BorderSide(color: Colors.blue.shade600),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: onDismiss,
            icon: const Icon(Icons.close),
            label: const Text('Đóng'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: Colors.white,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSettingsButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () async {
          await openAppSettings();
        },
        icon: const Icon(Icons.settings),
        label: const Text('Mở Cài đặt'),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.red.shade600,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  bool _shouldShowHelpButton() {
    return errorMessage.contains('API key');
  }

  bool _shouldShowSettingsButton() {
    return errorMessage.contains('vĩnh viễn') ||
        errorMessage.contains('Cài đặt');
  }
}
