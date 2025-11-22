/// Helper class to calculate tiered pricing for reservations
class TieredPricingHelper {
  /// Calculate price based on tiered rate set and time range
  /// 
  /// [tieredRateSetId] can be a Map (populated) or String (ID)
  /// [startDateTime] is the user expected time
  /// [endDateTime] is the estimated end time
  static int calculatePrice({
    required dynamic tieredRateSetId,
    required DateTime startDateTime,
    required DateTime endDateTime,
  }) {
    if (tieredRateSetId == null) {
      return 0;
    }

    // Get tiers from tieredRateSetId
    List<Map<String, dynamic>> tiers = [];
    if (tieredRateSetId is Map) {
      final tiersData = tieredRateSetId['tiers'];
      if (tiersData is List) {
        tiers = List<Map<String, dynamic>>.from(tiersData);
      }
    }

    if (tiers.isEmpty) {
      return 0;
    }

    // Sort tiers by fromHour
    tiers.sort((a, b) {
      final aFrom = _parseHour(a['fromHour'] ?? '00:00');
      final bFrom = _parseHour(b['fromHour'] ?? '00:00');
      return aFrom.compareTo(bFrom);
    });

    // Calculate duration in hours
    final duration = endDateTime.difference(startDateTime);
    final totalHours = duration.inMinutes / 60.0;

    if (totalHours <= 0) {
      return 0;
    }

    // Get start hour (0-23)
    final startHour = startDateTime.hour;
    final startMinute = startDateTime.minute;
    final startHourDecimal = startHour + (startMinute / 60.0);

    // Calculate price based on time ranges
    int totalCost = 0;
    double hoursAccountedFor = 0;

    for (final tier in tiers) {
      final tierFromHour = _parseHour(tier['fromHour'] ?? '00:00');
      final tierToHourStr = tier['toHour'];
      final tierToHour = tierToHourStr != null && tierToHourStr != '24:00'
          ? _parseHour(tierToHourStr)
          : 24.0;
      final tierPrice = (tier['price'] ?? 0) as int;

      // Calculate how many hours in this tier
      // We need to check if the reservation time overlaps with this tier
      final tierStart = tierFromHour;
      final tierEnd = tierToHour;

      // Check if reservation overlaps with this tier
      // Reservation: [startHourDecimal, startHourDecimal + totalHours]
      // Tier: [tierStart, tierEnd]
      final reservationStart = startHourDecimal;
      final reservationEnd = startHourDecimal + totalHours;

      // Find overlap
      final overlapStart = reservationStart > tierStart ? reservationStart : tierStart;
      final overlapEnd = reservationEnd < tierEnd ? reservationEnd : tierEnd;

      if (overlapStart < overlapEnd) {
        // There's overlap, calculate hours in this tier
        final hoursInTier = overlapEnd - overlapStart;
        if (hoursInTier > 0) {
          totalCost += (hoursInTier * tierPrice).round();
          hoursAccountedFor += hoursInTier;
        }
      }

      // If we've accounted for all hours, break
      if (hoursAccountedFor >= totalHours) {
        break;
      }
    }

    return totalCost;
  }

  /// Parse hour string (HH:mm) to decimal hours
  static double _parseHour(String hourStr) {
    try {
      final parts = hourStr.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = int.parse(parts[1]);
        return hour + (minute / 60.0);
      }
      // If format is just a number (e.g., "5" for 5:00)
      return double.parse(hourStr);
    } catch (e) {
      return 0.0;
    }
  }

  /// Format price to VND string
  static String formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }
}

