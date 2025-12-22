import 'dart:convert';
import 'package:flutter/material.dart';
import '../../../../services/reservation_service.dart';
import '../../../../services/subcription_service.dart';
import '../../../../services/payment_service.dart';
import '../../../../services/promotion_service.dart';
import '../../../screens/user/booking/payment_checkout_screen.dart';
import '../../../screens/user/booking/payment_result_screen.dart';
import 'tiered_pricing_helper.dart';
import 'promotion_pricing_helper.dart';

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
    Map<String, dynamic>? selectedPromotion,
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
      final userExpectedTimeISO = userExpectedDateTime
          .toUtc()
          .toIso8601String();
      final estimatedEndTimeISO = estimatedEndDateTime
          .toUtc()
          .toIso8601String();

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
      final originalAmount = TieredPricingHelper.calculatePrice(
        tieredRateSetId: tieredRateSetId,
        startDateTime: userExpectedDateTime,
        endDateTime: estimatedEndDateTime,
      );

      if (originalAmount <= 0) {
        throw Exception('Không thể tính giá từ bảng giá tiered');
      }

      // Calculate final price with promotion discount
      final finalAmount = PromotionPricingHelper.calculateFinalPrice(
        originalPrice: originalAmount,
        promotion: selectedPromotion,
      );

      final discountAmount = originalAmount - finalAmount;

      print('💰 Calculated payment amount:');
      print('  Duration (hours): $durationInHours');
      print(
        '  Original amount: ${TieredPricingHelper.formatPrice(originalAmount)} đ',
      );
      if (discountAmount > 0) {
        print(
          '  Discount: -${TieredPricingHelper.formatPrice(discountAmount)} đ',
        );
      }
      print(
        '  Final amount: ${TieredPricingHelper.formatPrice(finalAmount)} đ',
      );

      // Step 3: Create payment with final amount (after discount)
      final operatorId = parkingLot['parkingLotOperatorId'] as String?;
      final entityId = reservationId; // Use reservation ID as entity ID

      print('💳 Creating payment:');
      print('  Entity ID (Reservation): $entityId');
      print('  Type: Reservation');
      print('  Amount (after discount): $finalAmount');
      print('  Operator ID: $operatorId');

      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId!,
        type: 'Reservation',
        amount: finalAmount,
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
            onPaymentComplete: (success, returnedPaymentId, type) async {
              // Wait for WebView to close
              await Future.delayed(const Duration(milliseconds: 500));

              if (success) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (reservationId != null && finalPaymentId != null) {
                  // Show loading dialog to prevent user interaction
                  if (!bookingContext.mounted) return;
                  showDialog(
                    context: bookingContext,
                    barrierDismissible: false,
                    builder: (dialogContext) => WillPopScope(
                      onWillPop: () async => false,
                      child: Dialog(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.green,
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Đang xác nhận thanh toán...',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Vui lòng đợi trong giây lát',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );

                  try {
                    // Step 0: Validate IDs
                    if (finalPaymentId.isEmpty || finalPaymentId.length < 20) {
                      throw Exception(
                        'Payment ID không hợp lệ: $finalPaymentId',
                      );
                    }

                    if (reservationId.isEmpty || reservationId.length < 20) {
                      throw Exception(
                        'Reservation ID không hợp lệ: $reservationId',
                      );
                    }

                    // Step 1: Confirm payment first
                    print('💳 Step 1: Confirming payment:');
                    print('  Payment ID: $finalPaymentId');

                    await PaymentService.confirmPayment(
                      paymentId: finalPaymentId,
                    );

                    print('✅ Payment confirmed successfully');

                    // Small delay to ensure backend processes payment confirmation
                    await Future.delayed(const Duration(milliseconds: 500));

                    // Step 2: Confirm reservation payment
                    print('💳 Step 2: Confirming reservation payment:');
                    print('  Reservation ID: $reservationId');
                    print('  Payment ID: $finalPaymentId');

                    await ReservationService.confirmReservationPayment(
                      reservationId: reservationId,
                      paymentId: finalPaymentId,
                    );

                    print('✅ Payment confirmed and reservation activated');

                    // Step 3: Use promotion if selected
                    if (selectedPromotion != null) {
                      try {
                        final promotionCode = selectedPromotion['code']
                            ?.toString();
                        if (promotionCode != null && promotionCode.isNotEmpty) {
                          print('🎁 Step 3: Using promotion:');
                          print('  Promotion Code: $promotionCode');
                          print('  Original Amount: $originalAmount');
                          print('  Entity ID (Reservation): $reservationId');

                          await PromotionService.usePromotion(
                            promotionCode: promotionCode,
                            originalAmount: originalAmount,
                            entityId: reservationId,
                          );

                          print('✅ Promotion used successfully');
                        } else {
                          print(
                            '⚠️ Promotion selected but code is missing or empty',
                          );
                        }
                      } catch (promoError) {
                        print('⚠️ Error using promotion: $promoError');
                        // Don't block navigation if promotion use fails
                        // The payment is already confirmed
                      }
                    }

                    // Close loading dialog
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext, rootNavigator: true).pop();
                    }

                    // Navigate to result screen
                    // After WebView closes, we're back at booking screen
                    // Use pushReplacement to replace booking screen with result screen
                    if (!bookingContext.mounted) return;
                    Navigator.of(bookingContext).pushReplacement(
                      MaterialPageRoute(
                        builder: (ctx) => PaymentResultScreen(
                          isSuccess: true,
                          message:
                              'Đặt chỗ của bạn đã được xác nhận thành công.',
                          paymentId: finalPaymentId,
                          reservationId: reservationId,
                        ),
                      ),
                    );
                  } catch (confirmError) {
                    print('❌ Error in reservation confirmation flow:');
                    print('  Error: $confirmError');
                    print('  Reservation ID: $reservationId');
                    print('  Payment ID: $finalPaymentId');

                    // Close loading dialog
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext, rootNavigator: true).pop();
                    }

                    // Extract error message
                    String errorMessage = confirmError.toString();
                    if (errorMessage.contains('Exception:')) {
                      errorMessage = errorMessage.replaceFirst(
                        'Exception: ',
                        '',
                      );
                    }

                    // Navigate to result screen with error
                    if (!bookingContext.mounted) return;
                    Navigator.of(bookingContext).pushReplacement(
                      MaterialPageRoute(
                        builder: (ctx) => PaymentResultScreen(
                          isSuccess: false,
                          message:
                              'Thanh toán thành công nhưng có lỗi khi xác nhận đặt chỗ.',
                          errorMessage: errorMessage,
                          paymentId: finalPaymentId,
                          reservationId: reservationId,
                        ),
                      ),
                    );
                  }
                } else {
                  // Missing information
                  if (!bookingContext.mounted) return;
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
              } else {
                // Payment failed or cancelled
                if (!bookingContext.mounted) return;
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
            },
          ),
        ),
      );

      return true;
    } catch (e) {
      print('❌ Error creating reservation/payment: $e');
      if (context.mounted) {
        // Parse error message from API response
        String errorMessage = _extractErrorMessage(e.toString());
        _showErrorDialog(
          context: context,
          title: 'Lỗi đặt chỗ',
          message: errorMessage,
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
    Map<String, dynamic>? selectedPromotion,
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
      final originalAmount = packageRate['price'] as int? ?? 0;
      final operatorId = parkingLot['parkingLotOperatorId'] as String?;

      if (entityId == null) {
        throw Exception('Không tìm thấy ID của gói thuê bao');
      }

      if (originalAmount <= 0) {
        throw Exception('Giá gói thuê bao không hợp lệ');
      }

      // Calculate final price with promotion discount
      final finalAmount = PromotionPricingHelper.calculateFinalPrice(
        originalPrice: originalAmount,
        promotion: selectedPromotion,
      );

      final discountAmount = originalAmount - finalAmount;

      print('💰 Calculated payment amount:');
      print(
        '  Original amount: ${PromotionPricingHelper.formatPrice(originalAmount)} đ',
      );
      if (discountAmount > 0) {
        print(
          '  Discount: -${PromotionPricingHelper.formatPrice(discountAmount)} đ',
        );
      }
      print(
        '  Final amount: ${PromotionPricingHelper.formatPrice(finalAmount)} đ',
      );

      // Step 1: Create payment with final amount (after discount)
      print('💳 Creating payment:');
      print('  Entity ID (Pricing Policy): $entityId');
      print('  Type: Subscription');
      print('  Amount (after discount): $finalAmount');
      print('  Operator ID: $operatorId');

      final paymentResponse = await PaymentService.createPayment(
        entityId: entityId,
        type: 'Subscription',
        amount: finalAmount,
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
        // Create UTC DateTime directly to avoid timezone conversion issues
        // This ensures the selected date (e.g., Dec 13) stays as Dec 13 in UTC
        startDateTime = DateTime.utc(
          selectedStartDate.year,
          selectedStartDate.month,
          selectedStartDate.day,
        );
      } else {
        final now = DateTime.now();
        // Use UTC to avoid timezone issues
        startDateTime = DateTime.utc(now.year, now.month, now.day);
      }

      final startDate = startDateTime.toIso8601String();

      print('📝 Creating subscription:');
      print('  Parking Lot ID: $parkingLotId');
      print('  Pricing Policy ID: $pricingPolicyId');
      print('  Selected Start Date (local): ${selectedStartDate?.toString()}');
      print('  Start DateTime (UTC): ${startDateTime.toString()}');
      print('  Start Date (ISO): $startDate');

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
            onPaymentComplete: (success, returnedPaymentId, type) async {
              await Future.delayed(const Duration(milliseconds: 300));

              if (success && bookingContext.mounted) {
                final finalPaymentId = returnedPaymentId ?? paymentId;
                if (subscriptionId != null && finalPaymentId != null) {
                  // Show loading dialog to prevent user interaction
                  if (!bookingContext.mounted) return;
                  showDialog(
                    context: bookingContext,
                    barrierDismissible: false,
                    builder: (dialogContext) => WillPopScope(
                      onWillPop: () async => false,
                      child: Dialog(
                        child: Padding(
                          padding: const EdgeInsets.all(24.0),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.green,
                                ),
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Đang xác nhận thanh toán...',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Vui lòng đợi trong giây lát',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[600],
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  );

                  try {
                    // Step 1: Check subscription status before confirming
                    print('🔍 Step 0: Checking subscription status:');
                    print('  Subscription ID: $subscriptionId');

                    try {
                      final subscriptionDetail =
                          await SubscriptionService.getSubscriptionById(
                            subscriptionId: subscriptionId,
                          );
                      final subscriptionData = subscriptionDetail['data'];
                      dynamic subData = subscriptionData;
                      if (subscriptionData is List &&
                          subscriptionData.isNotEmpty) {
                        subData = subscriptionData[0];
                      }
                      final status = subData?['status']?.toString();
                      print('  Current Subscription Status: $status');

                      if (status != null &&
                          status.toUpperCase() != 'PENDING_PAYMENT') {
                        print(
                          '⚠️ Warning: Subscription status is $status, expected PENDING_PAYMENT',
                        );
                        // Still try to confirm, but log the warning
                      } else if (status != null) {
                        print(
                          '✅ Subscription is in PENDING_PAYMENT status, ready to confirm',
                        );
                      }
                    } catch (e) {
                      print('⚠️ Could not check subscription status: $e');
                      // Continue anyway - subscription might be ready
                    }

                    // Step 1: Validate payment ID format
                    if (finalPaymentId.isEmpty || finalPaymentId.length < 20) {
                      throw Exception(
                        'Payment ID không hợp lệ: $finalPaymentId',
                      );
                    }

                    // Step 2: Validate subscription ID format
                    if (subscriptionId.isEmpty || subscriptionId.length < 20) {
                      throw Exception(
                        'Subscription ID không hợp lệ: $subscriptionId',
                      );
                    }

                    // Step 3: Confirm payment first
                    print('💳 Step 1: Confirming payment:');
                    print('  Payment ID: $finalPaymentId');

                    await PaymentService.confirmPayment(
                      paymentId: finalPaymentId,
                    );

                    print('✅ Payment confirmed successfully');

                    // Small delay to ensure backend processes payment confirmation
                    await Future.delayed(const Duration(milliseconds: 500));

                    // Step 4: Confirm subscription payment
                    print('💳 Step 2: Confirming subscription payment:');
                    print('  Subscription ID: $subscriptionId');
                    print('  Payment ID: $finalPaymentId');

                    await SubscriptionService.confirmSubcriptionPayment(
                      subscriptionId: subscriptionId,
                      paymentId: finalPaymentId,
                    );

                    print('✅ Payment confirmed and subscription activated');

                    // Step 3: Use promotion if selected
                    if (selectedPromotion != null) {
                      try {
                        final promotionCode = selectedPromotion['code']
                            ?.toString();
                        if (promotionCode != null && promotionCode.isNotEmpty) {
                          print('🎁 Step 3: Using promotion:');
                          print('  Promotion Code: $promotionCode');
                          print('  Original Amount: $originalAmount');
                          print('  Entity ID (Subscription): $subscriptionId');

                          await PromotionService.usePromotion(
                            promotionCode: promotionCode,
                            originalAmount: originalAmount,
                            entityId: subscriptionId,
                          );

                          print('✅ Promotion used successfully');
                        } else {
                          print(
                            '⚠️ Promotion selected but code is missing or empty',
                          );
                        }
                      } catch (promoError) {
                        print('⚠️ Error using promotion: $promoError');
                        // Don't block navigation if promotion use fails
                        // The payment is already confirmed
                      }
                    }

                    // Close loading dialog
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext, rootNavigator: true).pop();
                    }

                    if (!bookingContext.mounted) return;
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
                  } catch (confirmError) {
                    print('❌ Error in subscription confirmation flow:');
                    print('  Error: $confirmError');
                    print('  Subscription ID: $subscriptionId');
                    print('  Payment ID: $finalPaymentId');

                    // Close loading dialog
                    if (bookingContext.mounted) {
                      Navigator.of(bookingContext, rootNavigator: true).pop();
                    }

                    // Extract error message
                    String errorMessage = confirmError.toString();
                    if (errorMessage.contains('Exception:')) {
                      errorMessage = errorMessage.replaceFirst(
                        'Exception: ',
                        '',
                      );
                    }

                    if (!bookingContext.mounted) return;
                    Navigator.of(bookingContext).pushReplacement(
                      MaterialPageRoute(
                        builder: (context) => PaymentResultScreen(
                          isSuccess: false,
                          message:
                              'Thanh toán thành công nhưng có lỗi khi kích hoạt gói.',
                          errorMessage: errorMessage,
                          paymentId: finalPaymentId,
                          subscriptionId: subscriptionId,
                        ),
                      ),
                    );
                  }
                } else {
                  if (!bookingContext.mounted) return;
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
              } else {
                if (!bookingContext.mounted) return;
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
        // Parse error message from API response
        String errorMessage = _extractErrorMessage(e.toString());
        _showErrorDialog(
          context: context,
          title: 'Lỗi đăng ký gói thuê bao',
          message: errorMessage,
        );
      }
      return false;
    }
  }

  /// Show error dialog with better UI
  static void _showErrorDialog({
    required BuildContext context,
    required String title,
    required String message,
  }) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.error_outline,
                color: Colors.red.shade700,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.red.shade700,
                ),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(
            fontSize: 15,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            style: TextButton.styleFrom(
              foregroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
            child: const Text(
              'Đã hiểu',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Extract user-friendly error message from exception string
  static String _extractErrorMessage(String errorString) {
    try {
      // Try to find JSON in error string (format: "409 - {...}")
      final jsonMatch = RegExp(r'\{[^}]+\}').firstMatch(errorString);
      if (jsonMatch != null) {
        final jsonString = jsonMatch.group(0);
        if (jsonString != null) {
          final errorData = jsonDecode(jsonString);
          if (errorData is Map && errorData['message'] != null) {
            return errorData['message'].toString();
          }
        }
      }
      
      // If no JSON found, try to extract message from common patterns
      if (errorString.contains('409')) {
        // Check if it's a conflict error
        if (errorString.contains('đã có') || 
            errorString.contains('đang hoạt động') ||
            errorString.contains('chờ kích hoạt')) {
          // Try to extract Vietnamese message from JSON
          final jsonPattern = RegExp(r'\{[^}]+\}');
          final jsonMatch = jsonPattern.firstMatch(errorString);
          if (jsonMatch != null) {
            try {
              final jsonStr = jsonMatch.group(0);
              if (jsonStr != null) {
                final errorData = jsonDecode(jsonStr);
                if (errorData is Map && errorData['message'] != null) {
                  return errorData['message'].toString();
                }
              }
            } catch (_) {
              // Continue to fallback
            }
          }
        }
      }
      
      // Fallback: clean up exception format
      String cleaned = errorString;
      if (cleaned.contains('Exception:')) {
        cleaned = cleaned.replaceFirst('Exception: ', '');
      }
      if (cleaned.contains('Failed to create subscription:')) {
        cleaned = cleaned.replaceFirst('Failed to create subscription: ', '');
        // Try to extract just the message part
        final parts = cleaned.split(' - ');
        if (parts.length > 1) {
          try {
            final jsonPart = parts[1];
            final errorData = jsonDecode(jsonPart);
            if (errorData is Map && errorData['message'] != null) {
              return errorData['message'].toString();
            }
          } catch (_) {
            // If parsing fails, return cleaned string
          }
        }
      }
      
      return cleaned;
    } catch (_) {
      // If all parsing fails, return original error string
      String cleaned = errorString;
      if (cleaned.contains('Exception:')) {
        cleaned = cleaned.replaceFirst('Exception: ', '');
      }
      return cleaned;
    }
  }
}
