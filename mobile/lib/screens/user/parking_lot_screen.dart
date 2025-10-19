import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/parking_lot_service.dart';
import '../../widgets/app_scaffold.dart';

class ParkingLotScreen extends StatefulWidget {
  const ParkingLotScreen({super.key});

  @override
  State<ParkingLotScreen> createState() => _ParkingLotScreenState();
}

class _ParkingLotScreenState extends State<ParkingLotScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  String _currentAddress = 'Đang lấy vị trí...';
  List<Map<String, dynamic>> _parkingLots = [];
  bool _isLoading = false;
  String? _errorMessage;
  Set<Marker> _markers = {};
  double _searchRadius = 5.0; // km

  // Map bounds for in-bounds search
  LatLngBounds? _currentBounds;
  bool _showMapFallback =
      false; // Show map by default, fallback to list if needed
  bool _mapLoaded = false; // Track if map has loaded successfully

  // Removed navigation state variables as we're using external Google Maps

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();

    // Auto-fallback to list view if map doesn't load within 15 seconds
    Future.delayed(const Duration(seconds: 15), () {
      if (mounted && _parkingLots.isNotEmpty && !_mapLoaded) {
        print('⚠️ Map failed to load, showing fallback list');
        setState(() {
          _showMapFallback = true;
        });
      }
    });
  }

  @override
  void dispose() {
    super.dispose();
  }

  // ... (rest of _getCurrentLocation, _getAddressFromPosition, _loadNearbyParkingLots, _loadParkingLotsInBounds remains the same) ...

  Future<void> _getCurrentLocation() async {
    // ... (Your existing _getCurrentLocation implementation remains the same) ...
    try {
      // Check current permission status first
      PermissionStatus currentStatus = await Permission.location.status;
      print('🔍 Current permission status: $currentStatus');

      // If permission is denied or permanently denied, show dialog to request
      if (currentStatus == PermissionStatus.denied ||
          currentStatus == PermissionStatus.permanentlyDenied) {
        print('📱 Permission denied, showing dialog...');

        // Show permission dialog
        bool? shouldRequest = await _showPermissionDialog();
        if (shouldRequest != true) {
          setState(() {
            _errorMessage =
                'Cần cấp quyền truy cập vị trí để sử dụng tính năng này';
          });
          return;
        }
      }

      // Request location permission
      print('🔐 Requesting location permission...');
      PermissionStatus permission = await Permission.location.request();
      print('📱 Permission result: $permission');

      if (permission != PermissionStatus.granted) {
        print('❌ Permission not granted: $permission');

        // Check if it's permanently denied
        if (permission == PermissionStatus.permanentlyDenied) {
          setState(() {
            _errorMessage =
                'Quyền truy cập vị trí đã bị từ chối vĩnh viễn. Vui lòng vào Cài đặt để cấp quyền.';
          });
        } else {
          setState(() {
            _errorMessage =
                'Cần cấp quyền truy cập vị trí để sử dụng tính năng này';
          });
        }
        return;
      }

      print('✅ Permission granted, proceeding with location...');

      // Check if location services are enabled
      print('🔍 Checking location services...');
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      print('📍 Location services enabled: $serviceEnabled');

      if (!serviceEnabled) {
        setState(() {
          _errorMessage =
              'Dịch vụ định vị chưa được bật. Vui lòng bật GPS trong Cài đặt.';
        });
        return;
      }

      // Get current position
      print('📍 Getting current position...');
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      print('✅ Position obtained: ${position.latitude}, ${position.longitude}');

      setState(() {
        _currentPosition = position;
      });

      // Get address from coordinates
      print('🏠 Getting address from coordinates...');
      await _getAddressFromPosition(position);

      // Load nearby parking lots
      print('🚗 Loading nearby parking lots...');
      await _loadNearbyParkingLots();
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi lấy vị trí: $e';
      });
    }
  }

  Future<void> _getAddressFromPosition(Position position) async {
    try {
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String address =
            '${place.street}, ${place.locality}, ${place.administrativeArea}';

        setState(() {
          _currentAddress = address;
        });
      }
    } catch (e) {
      setState(() {
        _currentAddress = 'Không thể lấy địa chỉ';
      });
    }
  }

  Future<void> _loadNearbyParkingLots() async {
    if (_currentPosition == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ParkingLotService.getNearbyParkingLots(
        longitude: _currentPosition!.longitude,
        latitude: _currentPosition!.latitude,
        distance: _searchRadius,
        pageSize: 20,
      );

      // Handle nested array structure: data[0] contains the actual array
      final responseData = response['data'];
      List<Map<String, dynamic>> parkingLots = [];

      if (responseData != null &&
          responseData is List &&
          responseData.isNotEmpty) {
        // Check if it's nested array structure
        if (responseData[0] is List) {
          parkingLots = List<Map<String, dynamic>>.from(responseData[0] ?? []);
        } else {
          // Direct array structure
          parkingLots = List<Map<String, dynamic>>.from(responseData);
        }
      }

      setState(() {
        _parkingLots = parkingLots;
        _isLoading = false;
      });

      print('🚗 Parsed ${_parkingLots.length} parking lots');

      _updateMarkers();
    } catch (e) {
      setState(() {
        // Check if it's a 404 error (no parking lots found)
        if (e.toString().contains('404') ||
            e.toString().contains('Không tìm thấy bãi đỗ xe nào')) {
          // Extract message from exception
          String errorMessage =
              'Không tìm thấy bãi gửi xe nào gần vị trí của bạn';
          try {
            // Try to parse JSON message from exception
            final match = RegExp(
              r'"message":"([^"]+)"',
            ).firstMatch(e.toString());
            if (match != null) {
              errorMessage = match.group(1) ?? errorMessage;
            }
          } catch (_) {
            // Keep default message if parsing fails
          }
          _errorMessage = errorMessage;
        } else {
          _errorMessage = 'Lỗi tải bãi đỗ xe: $e';
        }
        _isLoading = false;
      });
    }
  }

  Future<void> _loadParkingLotsInBounds() async {
    if (_currentBounds == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await ParkingLotService.getParkingLotsInBounds(
        bottomLeftLng: _currentBounds!.southwest.longitude,
        bottomLeftLat: _currentBounds!.southwest.latitude,
        topRightLng: _currentBounds!.northeast.longitude,
        topRightLat: _currentBounds!.northeast.latitude,
        pageSize: 50,
      );

      // Handle nested array structure: data[0] contains the actual array
      final responseData = response['data'];
      List<Map<String, dynamic>> parkingLots = [];

      if (responseData != null &&
          responseData is List &&
          responseData.isNotEmpty) {
        // Check if it's nested array structure
        if (responseData[0] is List) {
          parkingLots = List<Map<String, dynamic>>.from(responseData[0] ?? []);
        } else {
          // Direct array structure
          parkingLots = List<Map<String, dynamic>>.from(responseData);
        }
      }

      setState(() {
        _parkingLots = parkingLots;
        _isLoading = false;
      });

      print('🗺️ Parsed ${_parkingLots.length} parking lots in bounds');

      _updateMarkers();
    } catch (e) {
      setState(() {
        // Check if it's a 404 error (no parking lots found)
        if (e.toString().contains('404') ||
            e.toString().contains('Không tìm thấy bãi đỗ xe nào')) {
          // Extract message from exception
          String errorMessage =
              'Không tìm thấy bãi gửi xe nào gần vị trí của bạn';
          try {
            // Try to parse JSON message from exception
            final match = RegExp(
              r'"message":"([^"]+)"',
            ).firstMatch(e.toString());
            if (match != null) {
              errorMessage = match.group(1) ?? errorMessage;
            }
          } catch (_) {
            // Keep default message if parsing fails
          }
          _errorMessage = errorMessage;
        } else {
          _errorMessage = 'Lỗi tải bãi đỗ xe: $e';
        }
        _isLoading = false;
      });
    }
  }

  void _updateMarkers() {
    Set<Marker> markers = {};
    print('📍 Updating markers...');

    // Add current location marker
    if (_currentPosition != null) {
      print(
        '📍 Adding current location marker: ${_currentPosition!.latitude}, ${_currentPosition!.longitude}',
      );
      markers.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: LatLng(
            _currentPosition!.latitude,
            _currentPosition!.longitude,
          ),
          infoWindow: InfoWindow(
            title: 'Vị trí của bạn',
            snippet: _currentAddress,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        ),
      );
    }

    // Add parking lot markers
    for (int i = 0; i < _parkingLots.length; i++) {
      final parkingLot = _parkingLots[i];

      // Extract coordinates from addressId
      final addressId = parkingLot['addressId'];
      final lat = addressId?['latitude']?.toDouble();
      final lng = addressId?['longitude']?.toDouble();

      // Extract parking lot info
      final availableSpots = parkingLot['availableSpots'] ?? 0;
      final totalCapacity =
          (parkingLot['totalCapacityEachLevel'] ?? 0) *
          (parkingLot['totalLevel'] ?? 1);

      if (lat != null && lng != null) {
        print(
          '🚗 Adding parking lot marker $i: $lat, $lng - $availableSpots/$totalCapacity spots',
        );
        markers.add(
          Marker(
            markerId: MarkerId('parking_lot_$i'),
            position: LatLng(lat, lng),
            infoWindow: InfoWindow(
              title: 'Bãi đỗ xe',
              snippet: '$availableSpots/$totalCapacity chỗ trống',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              BitmapDescriptor.hueGreen,
            ),
            onTap: () => _showParkingLotDetails(parkingLot),
          ),
        );
      } else {
        print('❌ Invalid coordinates for parking lot $i: lat=$lat, lng=$lng');
      }
    }

    setState(() {
      _markers = markers;
    });

    print('📍 Total markers: ${_markers.length}');
  }

  void _showParkingLotDetails(Map<String, dynamic> parkingLot) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => _buildParkingLotBottomSheet(parkingLot),
    );
  }

  Widget _buildParkingLotBottomSheet(Map<String, dynamic> parkingLot) {
    // Extract data from nested structure
    final addressId = parkingLot['addressId'];
    final availableSpots = parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel = parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final occupancyRate = totalSlots > 0 ? (availableSpots / totalSlots) : 0.0;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final openTime = parkingLot['openTime'] ?? 'N/A';
    final closeTime = parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = parkingLot['is24Hours'] ?? false;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Parking lot name
          Text(
            'Bãi đỗ xe',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          // Address
          Row(
            children: [
              Icon(Icons.location_on, color: Colors.grey.shade600, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  address,
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Operating hours
          Row(
            children: [
              Icon(Icons.access_time, color: Colors.grey.shade600, size: 20),
              const SizedBox(width: 8),
              Text(
                is24Hours
                    ? 'Mở cửa 24/7'
                    : 'Giờ mở cửa: $openTime - $closeTime',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Availability status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: occupancyRate > 0.3
                  ? Colors.green.shade50
                  : Colors.red.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: occupancyRate > 0.3
                    ? Colors.green.shade200
                    : Colors.red.shade200,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  occupancyRate > 0.3 ? Icons.check_circle : Icons.warning,
                  color: occupancyRate > 0.3 ? Colors.green : Colors.red,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        occupancyRate > 0.3 ? 'Còn chỗ trống' : 'Gần hết chỗ',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: occupancyRate > 0.3
                              ? Colors.green.shade700
                              : Colors.red.shade700,
                        ),
                      ),
                      Text(
                        '$availableSpots/$totalSlots chỗ trống',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Price info
          if (parkingLot['pricePerHour'] != null) ...[
            Row(
              children: [
                Icon(Icons.attach_money, color: Colors.grey.shade600, size: 20),
                const SizedBox(width: 8),
                Text(
                  '${parkingLot['pricePerHour']} VND/giờ',
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],

          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    // Close bottom sheet first
                    Navigator.pop(context);
                    // Then start navigation
                    await _navigateToParkingLot(parkingLot);
                  },
                  icon: const Icon(Icons.directions),
                  label: const Text('Chỉ đường'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.green,
                    side: const BorderSide(color: Colors.green),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    _bookParkingLot(parkingLot);
                  },
                  icon: const Icon(Icons.book_online),
                  label: const Text('Đặt chỗ'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // Function to open Google Maps for navigation
  Future<void> _navigateToParkingLot(Map<String, dynamic> parkingLot) async {
    print('🧭 Opening Google Maps for navigation...');

    // Extract coordinates from parking lot
    final addressId = parkingLot['addressId'];
    final lat = addressId?['latitude']?.toDouble();
    final lng = addressId?['longitude']?.toDouble();
    // Address is not used in external Google Maps navigation

    print('🧭 Parking lot coordinates: lat=$lat, lng=$lng');
    print(
      '🧭 Current position: ${_currentPosition?.latitude}, ${_currentPosition?.longitude}',
    );

    if (lat != null && lng != null) {
      try {
        // Create Google Maps URL for navigation
        String googleMapsUrl;

        if (_currentPosition != null) {
          // Navigation from current location to destination
          googleMapsUrl =
              'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving';
        } else {
          // Just show destination on map
          googleMapsUrl =
              'https://www.google.com/maps/search/?api=1&query=$lat,$lng';
        }

        print('🧭 Opening Google Maps URL: $googleMapsUrl');

        // Try to open Google Maps app first
        Uri googleMapsUri = Uri.parse(googleMapsUrl);

        if (await canLaunchUrl(googleMapsUri)) {
          await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
          print('🧭 Google Maps opened successfully');
        } else {
          // Fallback to web browser
          print('🧭 Google Maps app not available, opening in browser...');
          await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
        }
      } catch (e) {
        print('❌ Error opening Google Maps: $e');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Không thể mở Google Maps: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } else {
      print('❌ Missing coordinates');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể lấy tọa độ bãi đỗ xe'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // Removed all navigation-related functions as we're using external Google Maps

  void _bookParkingLot(Map<String, dynamic> parkingLot) {
    // TODO: Implement booking functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Tính năng đặt chỗ sẽ được phát triển')),
    );
  }

  Widget _buildParkingLotCard(Map<String, dynamic> parkingLot, int index) {
    // ... (Your existing _buildParkingLotCard implementation remains the same) ...
    // Extract data from nested structure
    final addressId = parkingLot['addressId'];
    final availableSpots = parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel = parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final occupancyRate = totalSlots > 0 ? (availableSpots / totalSlots) : 0.0;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final openTime = parkingLot['openTime'] ?? 'N/A';
    final closeTime = parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = parkingLot['is24Hours'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => _showParkingLotDetails(parkingLot),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with name and status
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Bãi đỗ xe ${index + 1}',
                      style: TextStyle(
                        color: Colors.green.shade700,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: occupancyRate > 0.3
                          ? Colors.green.shade100
                          : Colors.red.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      occupancyRate > 0.3 ? 'Còn chỗ' : 'Gần hết chỗ',
                      style: TextStyle(
                        color: occupancyRate > 0.3
                            ? Colors.green.shade700
                            : Colors.red.shade700,
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Address
              Row(
                children: [
                  Icon(
                    Icons.location_on,
                    color: Colors.grey.shade600,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      address,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Operating hours
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    color: Colors.grey.shade600,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    is24Hours
                        ? 'Mở cửa 24/7'
                        : 'Giờ mở cửa: $openTime - $closeTime',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Availability info
              Row(
                children: [
                  Icon(
                    Icons.local_parking,
                    color: Colors.green.shade600,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$availableSpots/$totalSlots chỗ trống',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.green.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${(occupancyRate * 100).toInt()}% còn trống',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<bool?> _showPermissionDialog() async {
    // ... (Your existing _showPermissionDialog implementation remains the same) ...
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Icon(Icons.location_on, color: Colors.green.shade600, size: 28),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Cấp quyền định vị',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Ứng dụng cần quyền truy cập vị trí để:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 12),
              _buildPermissionItem(Icons.search, 'Tìm kiếm bãi đỗ xe gần bạn'),
              const SizedBox(height: 8),
              _buildPermissionItem(Icons.map, 'Hiển thị bãi đỗ trên bản đồ'),
              const SizedBox(height: 8),
              _buildPermissionItem(Icons.navigation, 'Chỉ đường đến bãi đỗ'),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.blue.shade600,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Dữ liệu vị trí chỉ được sử dụng để tìm kiếm bãi đỗ xe và không được chia sẻ với bên thứ ba.',
                        style: TextStyle(fontSize: 13, color: Colors.black87),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(false);
              },
              child: Text(
                'Không',
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
              child: const Text(
                'Cho phép',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPermissionItem(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Colors.green.shade600, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Stack(
        children: [
          // Google Map or Fallback List
          if (_currentPosition != null)
            Stack(
              children: [
                // Try to show Google Map
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: LatLng(
                      _currentPosition!.latitude,
                      _currentPosition!.longitude,
                    ),
                    zoom: 15,
                  ),
                  markers: _markers,
                  onMapCreated: (GoogleMapController controller) {
                    print('🗺️ Google Map created successfully');
                    print('🗺️ Map controller: $controller');
                    print('🗺️ Previous controller: $_mapController');
                    print('🗺️ Widget mounted: $mounted');
                    print('🗺️ Map loaded successfully');
                    _mapController = controller;
                    print('🗺️ Map controller set: $_mapController');

                    // Force update markers after map is ready
                    Future.delayed(const Duration(milliseconds: 500), () {
                      if (mounted) {
                        print('🔄 Force updating markers after map ready...');
                        _updateMarkers();
                      } else {
                        print('❌ Widget not mounted, skipping marker update');
                      }
                    });

                    // Mark map as loaded and cancel auto-fallback
                    if (mounted) {
                      _mapLoaded = true;
                      _showMapFallback = false;
                      print('🗺️ Map loaded state updated without setState');
                    }
                  },
                  onCameraMove: (CameraPosition position) {
                    // Update bounds for in-bounds search
                    if (mounted) {
                      _mapController?.getVisibleRegion().then((bounds) {
                        if (mounted) {
                          _currentBounds = bounds;
                        }
                      });
                    }
                  },
                  onCameraIdle: () {
                    // Load parking lots in current view when camera stops moving
                    if (mounted) {
                      _loadParkingLotsInBounds();
                    }
                  },
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  mapType: MapType.normal,
                  mapToolbarEnabled: false,
                  zoomControlsEnabled: true,
                  // Add key to prevent widget recreation
                  key: const ValueKey('google_map'),
                  compassEnabled: true,
                  liteModeEnabled: false,
                  buildingsEnabled: true,
                  trafficEnabled: false,
                ),

                // Debug indicator
                Positioned(
                  top: 100,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _mapLoaded ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _mapLoaded ? 'Map OK' : 'Map Loading...',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),

                // Fallback: Show parking lots list when map doesn't load
                if (_showMapFallback)
                  Positioned.fill(
                    child: Container(
                      color: Colors.white,
                      child: Column(
                        children: [
                          // Header
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: const BorderRadius.only(
                                bottomLeft: Radius.circular(16),
                                bottomRight: Radius.circular(16),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.location_on,
                                  color: Colors.green.shade600,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    'Tìm thấy ${_parkingLots.length} bãi đỗ xe gần bạn',
                                    style: TextStyle(
                                      color: Colors.green.shade700,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  onPressed: () {
                                    setState(() {
                                      _showMapFallback = !_showMapFallback;
                                    });
                                  },
                                  icon: Icon(
                                    _showMapFallback ? Icons.map : Icons.list,
                                    color: Colors.green.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Parking lots list
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _parkingLots.length,
                              itemBuilder: (context, index) {
                                return _buildParkingLotCard(
                                  _parkingLots[index],
                                  index,
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            )
          else
            const Center(child: CircularProgressIndicator()),

          // Top search bar
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(Icons.location_on, color: Colors.green.shade600),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Vị trí hiện tại',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        Text(
                          _currentAddress,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _showMapFallback = !_showMapFallback;
                      });
                    },
                    icon: Icon(_showMapFallback ? Icons.map : Icons.list),
                  ),
                  IconButton(
                    onPressed: _getCurrentLocation,
                    icon: const Icon(Icons.refresh),
                  ),
                ],
              ),
            ),
          ),

          // Removed navigation controls as we're using external Google Maps

          // Loading indicator
          if (_isLoading)
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
              ),
            ),

          // Error message
          if (_errorMessage != null)
            Positioned(
              top: MediaQuery.of(context).padding.top + 80,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.error_outline, color: Colors.red.shade600),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(color: Colors.red.shade700),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _errorMessage = null;
                            });
                          },
                          icon: Icon(Icons.close, color: Colors.red.shade600),
                        ),
                      ],
                    ),
                    // Show help button for API errors
                    if (_errorMessage!.contains('API key'))
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  // Show help dialog
                                  _showApiHelpDialog();
                                },
                                icon: const Icon(Icons.help_outline),
                                label: const Text('Hướng dẫn'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: Colors.blue.shade600,
                                  side: BorderSide(color: Colors.blue.shade600),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  setState(() {
                                    _errorMessage = null;
                                  });
                                },
                                icon: const Icon(Icons.close),
                                label: const Text('Đóng'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red.shade600,
                                  foregroundColor: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    // Show Settings button if permission is permanently denied
                    if (_errorMessage!.contains('vĩnh viễn') ||
                        _errorMessage!.contains('Cài đặt'))
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () async {
                              await openAppSettings();
                            },
                            icon: const Icon(Icons.settings),
                            label: const Text('Mở Cài đặt'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red.shade600,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showApiHelpDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hướng dẫn xử lý lỗi API'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Tính năng chỉ đường sử dụng Google Maps bên ngoài. Nếu bạn thấy lỗi liên quan đến API bãi đỗ xe:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              Text('1. Kiểm tra kết nối mạng.'),
              Text(
                '2. Đảm bảo API Key cho dịch vụ bãi đỗ xe đã được cấu hình đúng.',
              ),
              SizedBox(height: 12),
              Text(
                'Chỉ đường sẽ mở ứng dụng Google Maps trên thiết bị của bạn.',
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  color: Colors.blue,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  // Removed _buildNavigationOverlay as we're using external Google Maps
}
