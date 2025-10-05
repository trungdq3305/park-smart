import 'dart:math';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class NavigationService {
  /// Calculate distance between two points in meters
  static double calculateDistance(LatLng point1, LatLng point2) {
    const double earthRadius = 6371000; // Earth's radius in meters
    final double lat1Rad = point1.latitude * pi / 180;
    final double lat2Rad = point2.latitude * pi / 180;
    final double deltaLatRad = (point2.latitude - point1.latitude) * pi / 180;
    final double deltaLngRad = (point2.longitude - point1.longitude) * pi / 180;

    final double a =
        sin(deltaLatRad / 2) * sin(deltaLatRad / 2) +
        cos(lat1Rad) *
            cos(lat2Rad) *
            sin(deltaLngRad / 2) *
            sin(deltaLngRad / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadius * c;
  }

  /// Calculate bearing between two points
  static double calculateBearing(LatLng from, LatLng to) {
    final double lat1Rad = from.latitude * pi / 180;
    final double lat2Rad = to.latitude * pi / 180;
    final double deltaLngRad = (to.longitude - from.longitude) * pi / 180;

    final double y = sin(deltaLngRad) * cos(lat2Rad);
    final double x =
        cos(lat1Rad) * sin(lat2Rad) -
        sin(lat1Rad) * cos(lat2Rad) * cos(deltaLngRad);

    return (atan2(y, x) * 180 / pi + 360) % 360;
  }

  /// Generate realistic route points between two locations
  static List<LatLng> generateRealisticRoute(LatLng start, LatLng end) {
    final List<LatLng> points = [start];

    // Calculate distance to determine number of intermediate points
    final double distance = calculateDistance(start, end);
    final int numPoints = (distance / 50).round().clamp(
      10,
      50,
    ); // 1 point per 50m, min 10, max 50

    // Create a more realistic route with slight curves
    for (int i = 1; i < numPoints; i++) {
      final double ratio = i / numPoints;

      // Add slight curve to make route more realistic
      final double curveOffset =
          sin(ratio * pi) * 0.0002; // Slightly larger curve offset

      final double lat =
          start.latitude +
          (end.latitude - start.latitude) * ratio +
          curveOffset;
      final double lng =
          start.longitude + (end.longitude - start.longitude) * ratio;

      points.add(LatLng(lat, lng));
    }

    points.add(end);
    return points;
  }

  /// Get detailed navigation instructions
  static List<Map<String, dynamic>> getDetailedInstructions(
    LatLng start,
    LatLng end,
  ) {
    final double distance = calculateDistance(start, end);
    final double bearing = calculateBearing(start, end);

    final String direction = _getDirectionFromBearing(bearing);
    final String distanceText = _formatDistance(distance);

    // Create multiple instruction steps for a more realistic navigation
    final List<Map<String, dynamic>> instructions = [];

    // Start instruction
    instructions.add({
      'instruction': 'Bắt đầu hành trình đến bãi đỗ xe',
      'distance': distanceText,
      'duration': _formatDuration(distance),
      'maneuver': 'start',
    });

    // Main direction instruction
    instructions.add({
      'instruction': 'Đi thẳng về phía $direction',
      'distance': distanceText,
      'duration': _formatDuration(distance),
      'maneuver': 'straight',
    });

    // Add intermediate instructions if route is long enough
    if (distance > 500) {
      // More than 500m
      final double midDistance = distance / 2;
      instructions.add({
        'instruction': 'Tiếp tục đi thẳng theo tuyến đường',
        'distance': _formatDistance(midDistance),
        'duration': _formatDuration(midDistance),
        'maneuver': 'straight',
      });
    }

    if (distance > 1000) {
      // More than 1km - add another instruction
      final double quarterDistance = distance / 4;
      instructions.add({
        'instruction': 'Tiếp tục hành trình',
        'distance': _formatDistance(quarterDistance),
        'duration': _formatDuration(quarterDistance),
        'maneuver': 'straight',
      });
    }

    // Arrival instruction
    instructions.add({
      'instruction': 'Đã đến bãi đỗ xe',
      'distance': '0 m',
      'duration': '0 phút',
      'maneuver': 'arrive',
    });

    return instructions;
  }

  /// Get direction from bearing
  static String _getDirectionFromBearing(double bearing) {
    if (bearing >= 337.5 || bearing < 22.5) return 'Bắc';
    if (bearing >= 22.5 && bearing < 67.5) return 'Đông Bắc';
    if (bearing >= 67.5 && bearing < 112.5) return 'Đông';
    if (bearing >= 112.5 && bearing < 157.5) return 'Đông Nam';
    if (bearing >= 157.5 && bearing < 202.5) return 'Nam';
    if (bearing >= 202.5 && bearing < 247.5) return 'Tây Nam';
    if (bearing >= 247.5 && bearing < 292.5) return 'Tây';
    if (bearing >= 292.5 && bearing < 337.5) return 'Tây Bắc';
    return 'Bắc';
  }

  /// Format distance
  static String _formatDistance(double distanceInMeters) {
    if (distanceInMeters < 1000) {
      return '${distanceInMeters.round()} m';
    } else {
      return '${(distanceInMeters / 1000).toStringAsFixed(1)} km';
    }
  }

  /// Format duration based on distance (assuming walking speed)
  static String _formatDuration(double distanceInMeters) {
    // Assuming walking speed of 1.4 m/s (5 km/h)
    final int minutes = (distanceInMeters / (1.4 * 60)).round();
    if (minutes < 1) return '1 phút';
    return '$minutes phút';
  }

  /// Get route information using local calculation only
  static Map<String, dynamic> getRouteInfo(LatLng start, LatLng end) {
    final double distance = calculateDistance(start, end);
    final List<LatLng> points = generateRealisticRoute(start, end);
    final List<Map<String, dynamic>> instructions = getDetailedInstructions(
      start,
      end,
    );

    return {
      'points': points,
      'instructions': instructions,
      'estimatedTime': _formatDuration(distance),
      'estimatedDistance': _formatDistance(distance),
      'summary': 'Tuyến đường nội bộ',
      'startLocation': {
        'latitude': start.latitude,
        'longitude': start.longitude,
      },
      'endLocation': {'latitude': end.latitude, 'longitude': end.longitude},
    };
  }
}
