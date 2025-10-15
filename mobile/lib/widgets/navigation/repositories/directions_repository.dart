import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/directions_model.dart';

class DirectionsRepository {
  static const String _baseUrl =
      'https://maps.googleapis.com/maps/api/directions/json?';

  // Get API key from environment or use fallback
  static String get _apiKey {
    try {
      final key = dotenv.env['GOOGLE_DIRECTIONS_API_KEY'];
      if (key != null && key.isNotEmpty) {
        print('🔑 Using API key from .env: ${key.substring(0, 10)}...');
        return key;
      }
    } catch (e) {
      print('⚠️ Error loading API key from .env: $e');
    }

    // Fallback to hardcoded key for testing
    print('⚠️ Using fallback API key');
    return 'AIzaSyAd2AxK9Xk8BYaWFTZaVebCy_0EkDJm8X4';
  }

  Future<Directions?> getDirections({
    required LatLng origin,
    required LatLng destination,
  }) async {
    try {
      final apiKey = _apiKey;
      print('🔑 Using API key: ${apiKey.substring(0, 10)}...');

      final url =
          '$_baseUrl'
          'origin=${origin.latitude},${origin.longitude}'
          '&destination=${destination.latitude},${destination.longitude}'
          '&key=$apiKey'
          '&language=vi'
          '&mode=driving'
          '&alternatives=true'
          '&avoid=tolls'
          '&units=metric';

      print('🧭 Requesting directions: $url');

      final response = await http.get(Uri.parse(url));

      // Check if response is successful
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('📡 API Response status: ${data['status']}');
        print('📡 Response body length: ${response.body.length}');

        if (data['status'] == 'OK') {
          print('✅ Directions API successful');

          // Debug route information
          if (data['routes'] != null && data['routes'].isNotEmpty) {
            final route = data['routes'][0];
            print(
              '📡 Route overview_polyline: ${route['overview_polyline'] != null ? 'Present' : 'Missing'}',
            );
            if (route['overview_polyline'] != null) {
              print(
                '📡 Polyline length: ${route['overview_polyline']['points']?.length ?? 0}',
              );
            }
            print('📡 Route legs: ${route['legs']?.length ?? 0}');
          }

          return Directions.fromMap(data);
        } else {
          print(
            '❌ Directions API error: ${data['status']} - ${data['error_message'] ?? 'Unknown error'}',
          );
          print('❌ Full response: ${response.body}');
          return null;
        }
      } else {
        print('❌ HTTP error: ${response.statusCode}');
        print('❌ Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('❌ Error getting directions: $e');
      return null;
    }
  }
}
