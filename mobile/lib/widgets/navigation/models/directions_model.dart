import 'package:google_maps_flutter/google_maps_flutter.dart';

class Directions {
  final LatLngBounds bounds;
  final List<LatLng> polylinePoints;
  final String totalDistance;
  final String totalDuration;
  final List<Map<String, dynamic>> instructions;

  const Directions({
    required this.bounds,
    required this.polylinePoints,
    required this.totalDistance,
    required this.totalDuration,
    required this.instructions,
  });

  factory Directions.fromMap(Map<String, dynamic> map) {
    // Check if route is not available
    if ((map['routes'] as List).isEmpty) {
      throw Exception('No routes found');
    }

    // Get route information
    final data = Map<String, dynamic>.from(map['routes'][0]);

    // Bounds
    final northeast = data['bounds']['northeast'];
    final southwest = data['bounds']['southwest'];
    final bounds = LatLngBounds(
      northeast: LatLng(northeast['lat'], northeast['lng']),
      southwest: LatLng(southwest['lat'], southwest['lng']),
    );

    // Distance & Duration
    String distance = '';
    String duration = '';
    List<Map<String, dynamic>> instructions = [];

    if ((data['legs'] as List).isNotEmpty) {
      final leg = data['legs'][0];
      distance = leg['distance']['text'];
      duration = leg['duration']['text'];

      // Extract step-by-step instructions
      if (leg['steps'] != null) {
        for (var step in leg['steps']) {
          instructions.add({
            'instruction': step['html_instructions']
                .toString()
                .replaceAll(RegExp(r'<[^>]*>'), '') // Remove HTML tags
                .trim(),
            'distance': step['distance']['text'],
            'duration': step['duration']['text'],
            'maneuver': step['maneuver'] ?? 'straight',
          });
        }
      }
    }

    // Decode polyline manually
    final polylineString = data['overview_polyline']['points'];
    final List<LatLng> polylinePoints = _decodePolyline(polylineString);

    return Directions(
      bounds: bounds,
      polylinePoints: polylinePoints,
      totalDistance: distance,
      totalDuration: duration,
      instructions: instructions,
    );
  }

  // Simple polyline decoder
  static List<LatLng> _decodePolyline(String polyline) {
    final List<LatLng> points = [];
    int index = 0;
    int lat = 0;
    int lng = 0;

    while (index < polyline.length) {
      int b, shift = 0, result = 0;
      do {
        b = polyline.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = polyline.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.add(LatLng(lat / 1e5, lng / 1e5));
    }

    return points;
  }
}
