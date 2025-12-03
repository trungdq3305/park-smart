import 'package:flutter/material.dart';
import '../helpers/promotion_pricing_helper.dart';
import '../helpers/tiered_pricing_helper.dart';

class PaymentSummaryCard extends StatelessWidget {
  // For subscription: use originalPrice directly
  // For reservation: calculate from time and tieredRateSetId
  final int? originalPrice; // For subscription
  final Map<String, dynamic>? selectedPromotion;
  final String? promotionName;

  // For reservation calculation
  final DateTime? selectedDate;
  final TimeOfDay? userExpectedTime;
  final TimeOfDay? estimatedEndTime;
  final dynamic tieredRateSetId;

  const PaymentSummaryCard({
    super.key,
    this.originalPrice,
    this.selectedPromotion,
    this.promotionName,
    this.selectedDate,
    this.userExpectedTime,
    this.estimatedEndTime,
    this.tieredRateSetId,
  });

  @override
  Widget build(BuildContext context) {
    // Calculate original price
    int calculatedOriginalPrice = 0;

    if (originalPrice != null) {
      // Subscription: use provided price
      calculatedOriginalPrice = originalPrice!;
    } else if (selectedDate != null &&
        userExpectedTime != null &&
        estimatedEndTime != null &&
        tieredRateSetId != null) {
      // Reservation: calculate from time and tiered rate
      final startDateTime = DateTime(
        selectedDate!.year,
        selectedDate!.month,
        selectedDate!.day,
        userExpectedTime!.hour,
        userExpectedTime!.minute,
      );

      final endDateTime = DateTime(
        selectedDate!.year,
        selectedDate!.month,
        selectedDate!.day,
        estimatedEndTime!.hour,
        estimatedEndTime!.minute,
      );

      calculatedOriginalPrice = TieredPricingHelper.calculatePrice(
        tieredRateSetId: tieredRateSetId,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
      );
    }

    final discountAmount = selectedPromotion != null
        ? PromotionPricingHelper.calculateDiscount(
            originalPrice: calculatedOriginalPrice,
            promotion: selectedPromotion!,
          )
        : 0;

    final finalPrice = PromotionPricingHelper.calculateFinalPrice(
      originalPrice: calculatedOriginalPrice,
      promotion: selectedPromotion,
    );

    final hasDiscount = discountAmount > 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(
          color: hasDiscount ? Colors.green.shade300 : Colors.grey.shade200,
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.receipt_long,
                  color: Colors.green.shade700,
                  size: 24,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Tổng thanh toán',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Original price (only show if > 0)
          if (calculatedOriginalPrice > 0) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Tiền gốc:',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
                ),
                Text(
                  '${PromotionPricingHelper.formatPrice(calculatedOriginalPrice)} đ',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade700,
                    decoration: hasDiscount
                        ? TextDecoration.lineThrough
                        : TextDecoration.none,
                  ),
                ),
              ],
            ),
          ],

          // Discount (if any)
          if (hasDiscount) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.green.shade200, width: 1),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.local_offer,
                        color: Colors.green.shade700,
                        size: 18,
                      ),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            promotionName ?? 'Khuyến mãi',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.green.shade900,
                            ),
                          ),
                          if (selectedPromotion?['code'] != null)
                            Text(
                              'Mã: ${selectedPromotion!['code']}',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.green.shade700,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  Text(
                    '-${PromotionPricingHelper.formatPrice(discountAmount)} đ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Colors.green.shade700,
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),

          // Final price
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Tổng cộng:',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade600, Colors.green.shade400],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.green.withOpacity(0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Text(
                  '${PromotionPricingHelper.formatPrice(finalPrice)} đ',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
