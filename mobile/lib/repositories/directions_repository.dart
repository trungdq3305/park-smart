import 'package:dio/dio.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/directions_model.dart';

class DirectionsRepository {
  static const String _baseUrl =
      'https://maps.googleapis.com/maps/api/directions/json?';

  final Dio _dio;

  DirectionsRepository({Dio? dio}) : _dio = dio ?? Dio();

  Future<Directions> getDirections({
    required LatLng origin,
    required LatLng destination,
    String travelMode = 'driving',
    bool avoidHighways = false,
    bool avoidTolls = false,
  }) async {
    try {
      final response = await _dio.get(
        _baseUrl,
        queryParameters: {
          'origin': '${origin.latitude},${origin.longitude}',
          'destination': '${destination.latitude},${destination.longitude}',
          'key':
              'AIzaSyBvOkBw7cJ8Xk8BYaWFTZaVebCy_0EkDJm8X4', // Replace with your API key
          'mode': travelMode,
          'avoid': _buildAvoidString(avoidHighways, avoidTolls),
          'language': 'vi',
          'units': 'metric',
        },
      );

      // Check if response is successful
      if (response.statusCode == 200) {
        final data = response.data;

        // Check for API errors
        if (data['status'] != 'OK') {
          throw Exception(
            'Google Directions API error: ${data['status']} - ${data['error_message'] ?? 'Unknown error'}',
          );
        }

        return Directions.fromMap(data);
      } else {
        throw Exception('HTTP error: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Directions API error: $e');
      rethrow;
    }
  }

  String _buildAvoidString(bool avoidHighways, bool avoidTolls) {
    List<String> avoids = [];
    if (avoidHighways) avoids.add('highways');
    if (avoidTolls) avoids.add('tolls');
    return avoids.join('|');
  }
}
