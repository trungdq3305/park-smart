import 'package:flutter/material.dart';
import '../../../../services/reservation_service.dart';
import '../../../../services/subcription_service.dart';
import '../../../../services/payment_service.dart';
import '../../../../screens/user/booking_reservation/payment_checkout_screen.dart';
import '../../../../screens/user/booking_reservation/payment_result_screen.dart';
import 'tiered_pricing_helper.dart';

class BookingFlowHelper {
  /// Create reservation with selected date and time, then proceed to payment
  static Future<bool> createReservation({
    required BuildContext context,
    required String parkingLotId,
    required String pricingPolicyId,
    required DateTime selectedDate,
    required TimeOfDay userExpectedTime,
    required TimeOfDay estimatedEndTime,
    required Map<String, dynamic> selectedLink,
    required Map<String, dynamic> parkingLot,
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

      // Format to ISO 8601 for API
      final userExpectedTimeISO = userExpectedDateTime.toUtc().toIso8601String();
      final estimatedEndTimeISO = estimatedEndDateTime.toUtc().toIso8601String();

      print('📝 Creating reservation:');
      print('  Parking Lot ID: $parkingLotId');
      print('  Pricing Policy ID: $pricingPolicyId');
      print('  User Expected Time: $userExpectedTimeISO');
      print('  Estimated End Time: $estimatedEndTimeISO');

      // Step 1: Create reservation
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
        throw Exception('Không thể lấy ID đặt chỗ từ phản hồi');
      }

      print(
        '✅ Reservation created successfully. Reservation ID: $reservationId',
      );

      // Step 2: Calculate amount from tieredRateSetId and duration
      final pricingPolicy = selectedLink['pricingPolicyId'];
      final tieredRateSetId = pricingPolicy?['tieredRateSetId'];

      if (tieredRateSetId == null) {
        throw Exception('Không tìm thấy thông tin bảng giá tiered');
      }

      // Calculate duration
      final duration = estimatedEndDateTime.difference(userExpectedDateTime);
      final durationInHours = duration.inMinutes / 60.0;

      if (durationInHours <= 0) {
        throw Exception('Thời gian không hợp lệ');
      }

      // Calculate price using tiered pricing helper
      final amount = TieredPricingHelper.calculatePrice(
        tieredRateSetId: tieredRateSetId,
        startDateTime: userExpectedDateTime,
        endDateTime: estimatedEndDateTime,
      );

      if (amount <= 0) {
        throw Exception('Không thể tính giá từ bảng giá tiered');
      }

      print('💰 Calculated payment amount:');
      print('  Duration (hours): $durationInHours');
      print('  Total amount: ${TieredPricingHelper.formatPrice(amount)} đ');

      // Step 3: Create payment
      final operatorId = parkingLot['parkingLotOperatorId'] as String?;
      final entityId = reservationId; // Use reservation ID as entity ID

      print('💳 Creating payment:');
      print('  Entity ID (Reservation): $entityId');
      print('  Type: Reservation');
      print('  Amount: $amount');
      print('  Operator ID: $operatorId');

      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId!,
        type: 'Reservation',
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

      print('✅ Payment created successfully. Payment ID: $paymentId');

      // Step 4: Open payment checkout WebView
      if (!context.mounted) return false;

      final bookingContext = context;
      await Navigator.push(
        bookingContext,
        MaterialPageRoute(
          builder: (webViewContext) => PaymentCheckoutScreen(
            checkoutUrl: checkoutUrl!,
            paymentId: paymentId,
            onPaymentComplete: (success, returnedPaymentId) async {
              // Wait for WebView to close
              await Future.delayed(const Duration(milliseconds: 500));

              if (success) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (reservationId != null && finalPaymentId != null) {
                  try {
                    print('💳 Confirming reservation payment:');
                    print('  Reservation ID: $reservationId');
                    print('  Payment ID: $finalPaymentId');

                    await ReservationService.confirmReservationPayment(
                      reservationId: reservationId,
                      paymentId: finalPaymentId,
                    );

                    print('✅ Payment confirmed and reservation activated');

                    // Navigate to result screen
                    // After WebView closes, we're back at booking screen
                    // Use pushReplacement to replace booking screen with result screen
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext).pushReplacement(
                        MaterialPageRoute(
                          builder: (ctx) => PaymentResultScreen(
                            isSuccess: true,
                            message: 'Đặt chỗ của bạn đã được xác nhận thành công.',
                            paymentId: finalPaymentId,
                            reservationId: reservationId,
                          ),
                        ),
                      );
                    }
                  } catch (confirmError) {
                    print('⚠️ Error confirming reservation payment: $confirmError');
                    // Navigate to result screen with error
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext).pushReplacement(
                        MaterialPageRoute(
                          builder: (ctx) => PaymentResultScreen(
                            isSuccess: false,
                            message:
                                'Thanh toán thành công nhưng có lỗi khi xác nhận đặt chỗ.',
                            errorMessage: confirmError.toString(),
                            paymentId: finalPaymentId,
                            reservationId: reservationId,
                          ),
                        ),
                      );
                    }
                  }
                } else {
                  // Missing information
                  if (bookingContext.mounted) {
                    Navigator.of(bookingContext).pushReplacement(
                      MaterialPageRoute(
                        builder: (ctx) => PaymentResultScreen(
                          isSuccess: false,
                          message: 'Thiếu thông tin để xác nhận đặt chỗ.',
                          paymentId: returnedPaymentId ?? paymentId,
                          reservationId: reservationId,
                        ),
                      ),
                    );
                  }
                }
              } else {
                // Payment failed or cancelled
                if (bookingContext.mounted) {
                  Navigator.of(bookingContext).pushReplacement(
                    MaterialPageRoute(
                      builder: (ctx) => PaymentResultScreen(
                        isSuccess: false,
                        message: 'Thanh toán đã bị hủy hoặc thất bại.',
                        paymentId: returnedPaymentId ?? paymentId,
                        reservationId: reservationId,
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
      print('❌ Error creating reservation/payment: $e');
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
        bookingContext,
        MaterialPageRoute(
          builder: (context) => PaymentCheckoutScreen(
            checkoutUrl: checkoutUrl!,
            paymentId: paymentId,
            onPaymentComplete: (success, returnedPaymentId) async {
              await Future.delayed(const Duration(milliseconds: 300));

              if (success && bookingContext.mounted) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (subscriptionId != null && finalPaymentId != null) {
                  try {
                    await SubscriptionService.confirmPayment(
                      subscriptionId: subscriptionId,
                      paymentId: finalPaymentId,
                    );

                    if (bookingContext.mounted) {
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
                    if (bookingContext.mounted) {
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
                } else if (bookingContext.mounted) {
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
              } else if (bookingContext.mounted) {
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
