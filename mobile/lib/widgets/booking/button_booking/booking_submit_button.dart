import 'package:flutter/material.dart';
import '../card/booking_method_card.dart';

class BookingSubmitButton extends StatelessWidget {
  final bool isLoading;
  final BookingMethod? bookingMethod;
  final VoidCallback? onPressed;

  const BookingSubmitButton({
    super.key,
    required this.isLoading,
    required this.bookingMethod,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                bookingMethod == BookingMethod.reservation
                    ? 'Đặt chỗ'
                    : 'Đăng ký gói thuê bao',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
