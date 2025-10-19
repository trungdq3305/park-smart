import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:google_maps_flutter/google_maps_flutter.dart';

void main() async {
  print('🧪 Testing Google Directions API...');

  // Test coordinates (Ho Chi Minh City area)
  final origin = LatLng(10.7769, 106.7009); // District 1, HCMC
  final destination = LatLng(10.8231, 106.6297); // District 7, HCMC

  // Replace with your actual API key
  const apiKey = 'AIzaSyBvOkBw7cJ8Xk8BYaWFTZaVebCy_0EkDJm8X4';

  try {
    print('📍 Origin: ${origin.latitude}, ${origin.longitude}');
    print('📍 Destination: ${destination.latitude}, ${destination.longitude}');
    print('🔑 API Key: ${apiKey.substring(0, 10)}...');

    final url = Uri.parse(
      'https://maps.googleapis.com/maps/api/directions/json'
      '?origin=${origin.latitude},${origin.longitude}'
      '&destination=${destination.latitude},${destination.longitude}'
      '&key=$apiKey'
      '&language=vi'
      '&units=metric',
    );

    print(
      '🌐 Request URL: ${url.toString().replaceAll(apiKey, 'API_KEY_HIDDEN')}',
    );

    final response = await http.get(url);

    print('📡 Response status: ${response.statusCode}');
    print('📡 Response body length: ${response.body.length}');

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      if (data['status'] == 'OK') {
        print('✅ API Key works! Google Directions API response OK');

        final routes = data['routes'] as List;
        if (routes.isNotEmpty) {
          final route = routes[0];
          final legs = route['legs'] as List;
          if (legs.isNotEmpty) {
            final leg = legs[0];
            print('📊 Route found:');
            print('   - Distance: ${leg['distance']['text']}');
            print('   - Duration: ${leg['duration']['text']}');
            print('   - Steps: ${leg['steps'].length}');

            // Test polyline decoding
            final overviewPolyline = route['overview_polyline']['points'];
            print(
              '   - Polyline points: ${overviewPolyline.length} characters',
            );
          }
        }

        print('🎉 API Key is working correctly!');
        print('📝 You can now use this API key in your app');
      } else {
        print('❌ API Error: ${data['status']}');
        if (data['error_message'] != null) {
          print('❌ Error message: ${data['error_message']}');
        }

        if (data['status'] == 'REQUEST_DENIED') {
          print(
            '🔧 Solution: Check API key permissions and enable Directions API',
          );
        } else if (data['status'] == 'OVER_QUERY_LIMIT') {
          print('🔧 Solution: Check billing and quota limits');
        }
      }
    } else {
      print('❌ HTTP Error: ${response.statusCode}');
      print('📄 Response: ${response.body}');
    }
  } catch (e) {
    print('❌ Test failed: $e');
  }
}
