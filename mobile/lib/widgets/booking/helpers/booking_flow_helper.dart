import 'package:flutter/material.dart';
import '../../../../services/reservation_service.dart';
import '../../../../services/subcription_service.dart';
import '../../../../services/payment_service.dart';
import '../../../../screens/user/booking_reservation/payment_checkout_screen.dart';
import '../../../../screens/user/booking_reservation/payment_result_screen.dart';

class BookingFlowHelper {
  /// Create reservation with selected date and time
  static Future<bool> createReservation({
    required BuildContext context,
    required String parkingLotId,
    required String pricingPolicyId,
    required DateTime selectedDate,
    required TimeOfDay userExpectedTime,
    required TimeOfDay estimatedEndTime,
  }) async {
    try {
      // Build DateTime objects from selected date and time
      final userExpectedDateTime = DateTime(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
        userExpectedTime.hour,
        userExpectedTime.minute,
      );

      final estimatedEndDateTime = DateTime(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
        estimatedEndTime.hour,
        estimatedEndTime.minute,
      );

      print('📝 Creating reservation:');
      print('  Parking Lot ID: $parkingLotId');
      print('  Pricing Policy ID: $pricingPolicyId');
      print(
        '  User Expected Time: ${userExpectedDateTime.toUtc().toIso8601String()}',
      );
      print(
        '  Estimated End Time: ${estimatedEndDateTime.toUtc().toIso8601String()}',
      );

      // Create reservation
      final reservationResponse = await ReservationService.createReservation(
        parkingLotId: parkingLotId,
        pricingPolicyId: pricingPolicyId,
        userExpectedTime: userExpectedDateTime,
        estimatedEndTime: estimatedEndDateTime,
      );

      print('📦 Reservation response: $reservationResponse');

      // Extract reservation ID
      String? reservationId;
      try {
        dynamic reservationData = reservationResponse['data'];
        if (reservationData is List && reservationData.isNotEmpty) {
          reservationData = reservationData[0];
        }
        if (reservationData is Map) {
          reservationId = reservationData['_id'] ?? reservationData['id'];
        }
        reservationId ??=
            reservationResponse['_id'] ?? reservationResponse['id'];
      } catch (e) {
        print('⚠️ Error extracting reservation ID: $e');
      }

      print(
        '✅ Reservation created successfully. Reservation ID: $reservationId',
      );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Đặt chỗ thành công!'),
            backgroundColor: Colors.green,
          ),
        );

        await Future.delayed(const Duration(seconds: 1));
        if (context.mounted) {
          Navigator.pop(context);
        }
      }

      return true;
    } catch (e) {
      print('❌ Error creating reservation: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi đặt chỗ: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      return false;
    }
  }

  /// Create subscription with selected pricing policy and payment
  static Future<bool> createSubscription({
    required BuildContext context,
    required String parkingLotId,
    required String pricingPolicyId,
    required Map<String, dynamic> selectedLink,
    required Map<String, dynamic> parkingLot,
    DateTime? selectedStartDate,
  }) async {
    try {
      // Extract pricing policy and package rate information
      final pricingPolicy = selectedLink['pricingPolicyId'];
      final packageRate = pricingPolicy?['packageRateId'];

      if (pricingPolicy == null || packageRate == null) {
        throw Exception('Thông tin gói thuê bao không đầy đủ');
      }

      // Get required data for payment
      final entityId = pricingPolicy['_id'] ?? pricingPolicy['id'];
      final amount = packageRate['price'] as int? ?? 0;
      final operatorId = parkingLot['parkingLotOperatorId'] as String?;

      if (entityId == null) {
        throw Exception('Không tìm thấy ID của gói thuê bao');
      }

      if (amount <= 0) {
        throw Exception('Giá gói thuê bao không hợp lệ');
      }

      // Step 1: Create payment
      print('💳 Creating payment:');
      print('  Entity ID (Pricing Policy): $entityId');
      print('  Type: Subscription');
      print('  Amount: $amount');
      print('  Operator ID: $operatorId');

      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId,
        type: 'Subscription',
        amount: amount,
        operatorId: operatorId,
      );

      // Extract payment data
      dynamic paymentData = paymentResponse['data'];
      if (paymentData is List && paymentData.isNotEmpty) {
        paymentData = paymentData[0];
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
        throw Exception('Không nhận được checkout URL từ server');
      }

      // Step 2: Create subscription
      DateTime startDateTime;
      if (selectedStartDate != null) {
        startDateTime = selectedStartDate;
      } else {
        final now = DateTime.now();
        startDateTime = DateTime(now.year, now.month, now.day);
      }

      final startDate = DateTime(
        startDateTime.year,
        startDateTime.month,
        startDateTime.day,
      ).toUtc().toIso8601String();

      print('📝 Creating subscription:');
      print('  Parking Lot ID: $parkingLotId');
      print('  Pricing Policy ID: $pricingPolicyId');
      print('  Start Date: $startDate');

      final subscriptionResponse = await SubscriptionService.createSubscription(
        parkingLotId: parkingLotId,
        pricingPolicyId: pricingPolicyId,
        startDate: startDate,
      );

      // Extract subscription ID
      dynamic subscriptionData = subscriptionResponse['data'];
      if (subscriptionData is List && subscriptionData.isNotEmpty) {
        subscriptionData = subscriptionData[0];
      }

      String? subscriptionId;
      if (subscriptionData is Map) {
        subscriptionId = subscriptionData['_id'] ?? subscriptionData['id'];
      }
      subscriptionId ??=
          subscriptionResponse['_id'] ?? subscriptionResponse['id'];

      print(
        '✅ Subscription created successfully. Subscription ID: $subscriptionId',
      );

      // Step 3: Open payment checkout WebView
      if (!context.mounted) return false;

      final bookingContext = context;
      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentCheckoutScreen(
            checkoutUrl: checkoutUrl!,
            paymentId: paymentId,
            onPaymentComplete: (success, returnedPaymentId) async {
              await Future.delayed(const Duration(milliseconds: 300));

              if (success) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (subscriptionId != null && finalPaymentId != null) {
                  try {
                    await SubscriptionService.confirmPayment(
                      subscriptionId: subscriptionId,
                      paymentId: finalPaymentId,
                    );

                    if (context.mounted && bookingContext.mounted) {
                      Navigator.of(bookingContext).pushReplacement(
                        MaterialPageRoute(
                          builder: (context) => PaymentResultScreen(
                            isSuccess: true,
                            message:
                                'Gói thuê bao của bạn đã được kích hoạt thành công.',
                            paymentId: finalPaymentId,
                            subscriptionId: subscriptionId,
                          ),
                        ),
                      );
                    }
                  } catch (confirmError) {
                    if (context.mounted && bookingContext.mounted) {
                      Navigator.of(bookingContext).pushReplacement(
                        MaterialPageRoute(
                          builder: (context) => PaymentResultScreen(
                            isSuccess: false,
                            message:
                                'Thanh toán thành công nhưng có lỗi khi kích hoạt gói.',
                            errorMessage: confirmError.toString(),
                            paymentId: finalPaymentId,
                            subscriptionId: subscriptionId,
                          ),
                        ),
                      );
                    }
                  }
                } else {
                  if (context.mounted && bookingContext.mounted) {
                    Navigator.of(bookingContext).pushReplacement(
                      MaterialPageRoute(
                        builder: (context) => PaymentResultScreen(
                          isSuccess: false,
                          message: returnedPaymentId == null
                              ? 'Không nhận được Payment ID từ URL callback.'
                              : 'Thiếu thông tin để kích hoạt gói thuê bao.',
                          paymentId: returnedPaymentId ?? paymentId,
                          subscriptionId: subscriptionId,
                        ),
                      ),
                    );
                  }
                }
              } else {
                if (context.mounted && bookingContext.mounted) {
                  Navigator.of(bookingContext).pushReplacement(
                    MaterialPageRoute(
                      builder: (context) => PaymentResultScreen(
                        isSuccess: false,
                        message: 'Thanh toán đã bị hủy hoặc thất bại.',
                        paymentId: returnedPaymentId ?? paymentId,
                        subscriptionId: subscriptionId,
                      ),
                    ),
                  );
                }
              }
            },
          ),
        ),
      );

      return true;
    } catch (e) {
      print('❌ Error creating subscription/payment: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
      return false;
    }
  }
}
