import 'package:flutter_polyline_points/flutter_polyline_points.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class Directions {
  final LatLngBounds bounds;
  final List<PointLatLng> polylinePoints;
  final String totalDistance;
  final String totalDuration;
  final List<Map<String, dynamic>> steps;

  const Directions({
    required this.bounds,
    required this.polylinePoints,
    required this.totalDistance,
    required this.totalDuration,
    required this.steps,
  });

  factory Directions.fromMap(Map<String, dynamic> map) {
    // Check if route is not available
    if ((map['routes'] as List).isEmpty) {
      throw Exception('No routes found in directions response');
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
    List<Map<String, dynamic>> steps = [];

    if ((data['legs'] as List).isNotEmpty) {
      final leg = data['legs'][0];
      distance = leg['distance']['text'];
      duration = leg['duration']['text'];

      // Extract steps for navigation instructions
      if (leg['steps'] != null) {
        steps = List<Map<String, dynamic>>.from(leg['steps']);
      }
    }

    return Directions(
      bounds: bounds,
      polylinePoints: PolylinePoints().decodePolyline(
        data['overview_polyline']['points'],
      ),
      totalDistance: distance,
      totalDuration: duration,
      steps: steps,
    );
  }
}
