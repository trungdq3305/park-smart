import '../../../../../services/reservation_service.dart';
import '../../../../../services/subcription_service.dart';

class BookingAvailabilityHelper {
  /// Load reservation availability for the selected parking lot (15 days)
  static Future<Map<String, dynamic>> loadReservationAvailability({
    required String parkingLotId,
  }) async {
    final today = DateTime.now();
    Map<String, dynamic> availabilityMap = {};

    // Fetch availability for each day (next 15 days)
    for (int i = 0; i < 15; i++) {
      final date = today.add(Duration(days: i));
      final dateString = _formatDateForAPI(date);

      try {
        final response = await ReservationService.getReservationAvailability(
          parkingLotId: parkingLotId,
          date: dateString,
        );

        // Parse response
        dynamic data = response['data'];
        if (data is Map) {
          availabilityMap[dateString] = {
            'isAvailable': data['isAvailable'] ?? true,
            'remaining': data['remaining'] ?? data['availableSpots'] ?? 0,
          };
        } else if (data is List && data.isNotEmpty) {
          final firstItem = data[0];
          if (firstItem is Map) {
            availabilityMap[dateString] = {
              'isAvailable': firstItem['isAvailable'] ?? true,
              'remaining':
                  firstItem['remaining'] ?? firstItem['availableSpots'] ?? 0,
            };
          }
        } else {
          availabilityMap[dateString] = {'isAvailable': true, 'remaining': 0};
        }
      } catch (e) {
        print('⚠️ Error loading availability for $dateString: $e');
        availabilityMap[dateString] = {'isAvailable': false, 'remaining': 0};
      }
    }

    return availabilityMap;
  }

  /// Load subscription availability for the selected parking lot
  static Future<Map<String, dynamic>> loadSubscriptionAvailability({
    required String parkingLotId,
  }) async {
    final response = await SubscriptionService.getSubscriptionAvailability(
      parkingLotId: parkingLotId,
    );

    dynamic data = response['data'];
    Map<String, dynamic> availabilityMap = {};

    if (data is List && data.isNotEmpty) {
      final firstItem = data[0];
      if (firstItem is Map) {
        availabilityMap = Map<String, dynamic>.from(firstItem);
      }
    } else if (data is Map) {
      availabilityMap = Map<String, dynamic>.from(data);
    }

    return availabilityMap;
  }

  /// Format date to YYYY-MM-DD for API
  static String _formatDateForAPI(DateTime date) {
    final year = date.year.toString();
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }
}
