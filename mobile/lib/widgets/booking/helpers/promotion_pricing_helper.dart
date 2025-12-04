/// Helper class to calculate pricing with promotion discounts
class PromotionPricingHelper {
  /// Calculate discount amount based on promotion
  /// 
  /// [originalPrice] is the original price (for subscription or reservation)
  /// [promotion] is the promotion object with discountType, discountValue, maxDiscountAmount
  /// 
  /// Returns the discount amount (not the final price)
  static int calculateDiscount({
    required int originalPrice,
    required Map<String, dynamic> promotion,
  }) {
    final discountType = promotion['discountType']?.toString() ?? '';
    final discountValue = promotion['discountValue'];
    final maxDiscountAmount = promotion['maxDiscountAmount'] as num?;

    if (discountValue == null) {
      return 0;
    }

    int discountAmount = 0;

    if (discountType.toUpperCase() == 'PERCENTAGE') {
      // Calculate percentage discount
      final discountPercent = discountValue is num ? discountValue.toDouble() : 0.0;
      discountAmount = (originalPrice * discountPercent / 100).round();
      
      // Apply max discount limit if exists
      if (maxDiscountAmount != null) {
        final maxDiscount = maxDiscountAmount.toInt();
        if (discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      }
    } else {
      // Fixed amount discount
      discountAmount = discountValue is num ? discountValue.toInt() : 0;
      
      // Don't exceed original price
      if (discountAmount > originalPrice) {
        discountAmount = originalPrice;
      }
    }

    return discountAmount;
  }

  /// Calculate final price after applying promotion discount
  /// 
  /// [originalPrice] is the original price
  /// [promotion] is the promotion object (can be null)
  /// 
  /// Returns the final price to pay
  static int calculateFinalPrice({
    required int originalPrice,
    Map<String, dynamic>? promotion,
  }) {
    if (promotion == null) {
      return originalPrice;
    }

    final discountAmount = calculateDiscount(
      originalPrice: originalPrice,
      promotion: promotion,
    );

    return originalPrice - discountAmount;
  }

  /// Format price to VND string
  static String formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}

