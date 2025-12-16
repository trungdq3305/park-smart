import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';

import '../../../../services/payment_service.dart';
import '../../../../services/subcription_service.dart';
import '../../booking/payment_checkout_screen.dart';

class SubscriptionRenewalFlow {
  static Future<bool> start({
    required BuildContext context,
    required Map<String, dynamic> subscription,
  }) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    final subscriptionIdRaw =
        subscription['_id'] ??
        subscription['id'] ??
        subscription['subscriptionId'];
    if (subscriptionIdRaw == null) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID gói thuê bao để gia hạn.'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }
    final subscriptionId = subscriptionIdRaw.toString();

    Map<String, dynamic>? pricingPolicy = _ensureMap(
      subscription['pricingPolicyId'] ?? subscription['pricingPolicy'],
    );
    Map<String, dynamic>? packageRate = _ensureMap(
      pricingPolicy?['packageRateId'],
    );
    String? entityId = pricingPolicy?['_id'] ?? pricingPolicy?['id'];
    dynamic amountValue =
        packageRate?['price'] ??
        pricingPolicy?['price'] ??
        subscription['price'] ??
        subscription['amountPaid'];
    String? operatorId =
        subscription['parkingLotOperatorId']?.toString() ??
        subscription['operatorId']?.toString() ??
        subscription['parkingLotId']?['parkingLotOperatorId']?.toString();

    if (entityId == null || amountValue == null) {
      final detail = await _fetchSubscriptionDetail(subscription);
      if (detail != null) {
        pricingPolicy ??= _ensureMap(
          detail['pricingPolicyId'] ?? detail['pricingPolicy'],
        );
        packageRate ??= _ensureMap(pricingPolicy?['packageRateId']);
        entityId ??= pricingPolicy?['_id'] ?? pricingPolicy?['id'];
        amountValue ??=
            packageRate?['price'] ??
            pricingPolicy?['price'] ??
            detail['price'] ??
            detail['amountPaid'];
        operatorId ??=
            detail['parkingLotOperatorId']?.toString() ??
            detail['operatorId']?.toString() ??
            detail['parkingLotId']?['parkingLotOperatorId']?.toString();
      }
    }

    if (entityId == null || amountValue == null) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Thiếu thông tin gói thuê bao để gia hạn.'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    final amount = amountValue is num
        ? amountValue.round()
        : int.tryParse(amountValue.toString());

    if (amount == null || amount <= 0) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Giá gói thuê bao không hợp lệ.'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }

    // Kiểm tra điều kiện gia hạn trước khi tạo payment
    try {
      await SubscriptionService.checkRenewalEligibility(
        subscriptionId: subscriptionId,
      );
      print('✅ Renewal eligibility check passed');
    } catch (e) {
      final message = _extractErrorMessage(e);

      // Hiển thị popup thay vì snackbar để người dùng dễ đọc
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text(
            'Không thể gia hạn gói thuê bao',
            style: TextStyle(fontWeight: FontWeight.w700),
          ),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Đóng'),
            ),
          ],
        ),
      );

      return false;
    }

    try {
      if (operatorId == null || operatorId.isEmpty) {
        throw Exception('Thiếu operatorId để tạo thanh toán.');
      }
      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId,
        type: 'Subscription',
        amount: amount,
        operatorId: operatorId,
      );

      dynamic paymentData = paymentResponse['data'];
      if (paymentData is List && paymentData.isNotEmpty) {
        paymentData = paymentData.first;
      }

      String? paymentId;
      if (paymentData is Map) {
        paymentId = paymentData['_id'] ?? paymentData['id'];
      }
      paymentId ??= paymentResponse['_id'] ?? paymentResponse['id'];

      String? checkoutUrl;
      if (paymentData is Map) {
        checkoutUrl = paymentData['checkoutUrl']?.toString();
      }
      checkoutUrl ??= paymentResponse['checkoutUrl']?.toString();

      if (checkoutUrl == null || checkoutUrl.isEmpty) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(
            content: Text('Không nhận được đường dẫn thanh toán.'),
            backgroundColor: Colors.red,
          ),
        );
        return false;
      }

      final completer = Completer<bool>();

      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentCheckoutScreen(
            checkoutUrl: checkoutUrl!,
            paymentId: paymentId,
            onPaymentComplete: (success, returnedPaymentId, type) async {
              await Future.delayed(const Duration(milliseconds: 300));

              if (success) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (finalPaymentId == null) {
                  scaffoldMessenger.showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Không nhận được mã thanh toán từ cổng thanh toán.',
                      ),
                      backgroundColor: Colors.red,
                    ),
                  );
                  if (!completer.isCompleted) completer.complete(false);
                  return;
                }

                try {
                  // Step 1: Confirm payment first
                  print('💳 Step 1: Confirming payment:');
                  print('  Payment ID: $finalPaymentId');

                  await PaymentService.confirmPayment(
                    paymentId: finalPaymentId,
                  );

                  print('✅ Payment confirmed successfully');

                  // Step 2: Renew subscription
                  print('💳 Step 2: Renewing subscription:');
                  print('  Subscription ID: $subscriptionId');
                  print('  Payment ID: $finalPaymentId');

                  await SubscriptionService.renewSubscription(
                    subscriptionId: subscriptionId,
                    paymentId: finalPaymentId,
                  );

                  print('✅ Subscription renewal confirmed successfully');

                  scaffoldMessenger.showSnackBar(
                    const SnackBar(
                      content: Text('Gia hạn gói thuê bao thành công!'),
                    ),
                  );
                  if (!completer.isCompleted) completer.complete(true);
                } catch (e) {
                  scaffoldMessenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        'Thanh toán thành công nhưng có lỗi khi gia hạn: $e',
                      ),
                      backgroundColor: Colors.red,
                    ),
                  );
                  if (!completer.isCompleted) completer.complete(false);
                }
              } else {
                scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Thanh toán gia hạn đã bị hủy hoặc thất bại.',
                    ),
                    backgroundColor: Colors.orange,
                  ),
                );
                if (!completer.isCompleted) completer.complete(false);
              }
            },
          ),
        ),
      );

      if (!completer.isCompleted) {
        completer.complete(false);
      }
      return completer.future;
    } catch (e) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Không thể khởi tạo thanh toán gia hạn: $e'),
          backgroundColor: Colors.red,
        ),
      );
      return false;
    }
  }

  static Map<String, dynamic>? _ensureMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return null;
  }

  static String _extractErrorMessage(dynamic error) {
    if (error is Exception) {
      final message = error.toString();
      // Try to extract message from JSON error response
      if (message.contains('{')) {
        try {
          final jsonMatch = RegExp(r'\{[^}]+\}').firstMatch(message);
          if (jsonMatch != null) {
            final jsonStr = jsonMatch.group(0);
            final json = jsonDecode(jsonStr!);
            return json['message'] ?? json['error'] ?? message;
          }
        } catch (_) {
          // If parsing fails, return original message
        }
      }
      // Remove "Exception: " prefix if present
      return message.replaceFirst(RegExp(r'^Exception:\s*'), '');
    }
    return error.toString();
  }

  static Future<Map<String, dynamic>?> _fetchSubscriptionDetail(
    Map<String, dynamic> subscription,
  ) async {
    final subscriptionIdRaw =
        subscription['_id'] ??
        subscription['id'] ??
        subscription['subscriptionId'];
    if (subscriptionIdRaw == null) {
      return null;
    }

    try {
      // Use getSubscriptionById instead of getSubscriptionByIdentifier
      // because identifier may not be valid for RENEWAL status subscriptions
      final response = await SubscriptionService.getSubscriptionById(
        subscriptionId: subscriptionIdRaw.toString(),
      );
      final data = response['data'];
      if (data is List && data.isNotEmpty) {
        final firstItem = data.first;
        if (firstItem is Map<String, dynamic>) {
          return firstItem;
        }
        if (firstItem is Map) {
          return Map<String, dynamic>.from(firstItem);
        }
      }
      if (data is Map<String, dynamic>) {
        return data;
      }
      if (data is Map) {
        return Map<String, dynamic>.from(data);
      }
    } catch (e) {
      print('❌ Unable to fetch subscription detail for renewal: $e');
    }
    return null;
  }
}
