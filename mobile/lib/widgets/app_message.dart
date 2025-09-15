import 'package:flutter/material.dart';

/// Common app message helper for showing response-based messages anywhere.
/// Usage:
/// AppMessage.show(context, 'BOOKING_SUCCESS');
/// AppMessage.show(context, 'PAYMENT_SUCCESS', style: AppMessageStyle.dialog);
enum AppMessageStyle { snackBar, dialog }

class AppMessage {
  AppMessage._();

  // DRIVER messages mapping (code -> description)
  static const Map<String, String> _driverMessages = {
    'BOOKING_SUCCESS': 'ĐĐặt chỗ thành công.',
    'BOOKING_FAILED': 'ĐĐặt chỗ thất bại.',
    'BOOKING_CANCELLED': 'ĐĐơn đặt chỗ bị hủy.',
    'REMINDER_UPCOMING_2H': 'Nhắc nhở 2 tiếng nữa là tới giờ đặt chỗ.',
    'REMINDER_PARKING_STARTED':
        'Thông báo thời gian gửi xe của bạn đã bắt đầu.',
    'REMINDER_ENDING_15M': 'Nhắc nhở 15 phút nữa là hết giờ gửi xe.',
    'PARKING_TIME_ENDED': 'Thông báo thời gian gửi xe đã kết thúc.',
    'PARKING_EXTENDED_SUCCESS': 'Gia hạn thời gian gửi xe thành công.',
    'CHECKIN_SUCCESS': 'Vào bãi thành công.',
    'CHECKOUT_SUCCESS': 'Ra khỏi bãi thành công.',
    'INVOICE_ISSUED':
        'Hóa đơn cho phiên gửi xe được tạo, kèm theo chi tiết chi phí.',
    'PAYMENT_SUCCESS': 'Thanh toán thành công.',
    'PROMOTION_INFO': 'Các thông tin về khuyến mãi, giảm giá.',
  };

  /// Get message by code. If not found, returns a fallback text or the code itself.
  static String resolve(String code, {String? fallback}) {
    return _driverMessages[code] ?? fallback ?? code;
  }

  /// Show a message by response code using SnackBar or Dialog.
  static void show(
    BuildContext context,
    String code, {
    AppMessageStyle style = AppMessageStyle.snackBar,
    String? title,
    Duration? duration,
  }) {
    final String message = resolve(code);

    switch (style) {
      case AppMessageStyle.dialog:
        _showDialog(context, title ?? 'Thông báo', message);
        break;
      case AppMessageStyle.snackBar:
        _showSnackBar(context, message, duration: duration);
        break;
    }
  }

  static void _showSnackBar(
    BuildContext context,
    String message, {
    Duration? duration,
  }) {
    final messenger = ScaffoldMessenger.maybeOf(context);
    if (messenger == null) return;
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration ?? const Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  static Future<void> _showDialog(
    BuildContext context,
    String title,
    String message,
  ) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}
