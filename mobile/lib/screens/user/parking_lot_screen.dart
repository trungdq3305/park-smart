import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:permission_handler/permission_handler.dart';
// import '../../services/parking_lot_service.dart'; // ⬅️ Keep if needed for other parts
//  // ⬅️ REMOVED: No longer using custom service
import '../../services/parking_lot_service.dart';
import '../../services/navigation_service.dart';
import '../../widgets/app_scaffold.dart';
import '../../widgets/navigation/navigation_controls.dart';
// import '../../widgets/navigation/navigation_overlay.dart'; // ⬅️ REMOVED: No longer needed for in-app nav

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

  // Navigation state for in-app navigation
  bool _isNavigating = false;
  bool _hasRoute = false;
  List<Polyline> _routePolylines = [];
  List<LatLng> _routePoints = [];
  List<Map<String, dynamic>> _routeInstructions = [];
  String? _estimatedTime;
  String? _estimatedDistance;
  String? _currentInstruction;
  String? _nextInstruction;
  bool _isMuted = false;

  // GPS tracking
  StreamSubscription<Position>? _positionStream;
  Timer? _navigationTimer;

  // Navigation UI state
  bool _showNavigationUI = false;
  bool _isNavigationActive = false;

  // NEW: Destination details for route overview (since we removed route instructions)
  LatLng? _destination;
  String? _destinationName;

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
    _positionStream?.cancel();
    _navigationTimer?.cancel();
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
                  onPressed: () {
                    Navigator.pop(context);
                    // ⬅️ Call the modified function
                    _navigateToParkingLot(parkingLot);
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
        ],
      ),
    );
  }

  // ⬅️ MODIFIED: Function to start in-app navigation
  void _navigateToParkingLot(Map<String, dynamic> parkingLot) async {
    print('🧭 Starting navigation to parking lot...');

    // Extract coordinates from parking lot
    final addressId = parkingLot['addressId'];
    final lat = addressId?['latitude']?.toDouble();
    final lng = addressId?['longitude']?.toDouble();
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';

    print('🧭 Parking lot coordinates: lat=$lat, lng=$lng');
    print(
      '🧭 Current position: ${_currentPosition?.latitude}, ${_currentPosition?.longitude}',
    );

    if (lat != null && lng != null && _currentPosition != null) {
      Navigator.pop(context); // Close bottom sheet
      print('🧭 Bottom sheet closed, loading route...');

      // Load route using NavigationService
      await _loadRouteToDestination(lat, lng, address);
    } else {
      print('❌ Missing coordinates or current position');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không thể lấy tọa độ hoặc vị trí hiện tại'),
        ),
      );
    }
  }

  Future<void> _loadRouteToDestination(
    double lat,
    double lng,
    String address,
  ) async {
    if (_currentPosition == null) {
      print('❌ No current position available');
      return;
    }

    print('🧭 Loading route to destination: $lat, $lng');
    print(
      '🧭 From current position: ${_currentPosition!.latitude}, ${_currentPosition!.longitude}',
    );

    if (mounted) {
      print('🧭 Setting loading state...');
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _destination = LatLng(lat, lng);
        _destinationName = address;
      });
    }

    try {
      final start = LatLng(
        _currentPosition!.latitude,
        _currentPosition!.longitude,
      );
      final end = LatLng(lat, lng);

      print('🧭 Calling NavigationService.getRouteInfo...');
      final route = NavigationService.getRouteInfo(start, end);
      print('🧭 Route generated: ${route['summary']}');

      print('🧭 Processing route...');
      _processRoute(route);

      if (mounted) {
        print('🧭 Setting route state...');
        setState(() {
          _hasRoute = true;
          _isLoading = false;
        });
      }
      print('🧭 Route processed successfully');
    } catch (e) {
      print('❌ Error loading route: $e');
      if (mounted) {
        setState(() {
          _errorMessage = 'Lỗi tải tuyến đường: $e';
          _isLoading = false;
        });
      }
    }
  }

  // ⬅️ REMOVED/SIMPLIFIED: No longer needed for in-app route calculation
  /*
  Future<void> _loadRouteToDestination(
    double lat,
    double lng,
    String address,
  ) async { ... }
  */

  void _processRoute(Map<String, dynamic> route) {
    print('🧭 Processing route: ${route.keys}');

    try {
      if (mounted) {
        setState(() {
          _routePoints = List<LatLng>.from(route['points'] ?? []);
          _routeInstructions = List<Map<String, dynamic>>.from(
            route['instructions'] ?? [],
          );
          _estimatedTime = route['estimatedTime'];
          _estimatedDistance = route['estimatedDistance'];

          // Create blue polyline for the route
          if (_routePoints.isNotEmpty) {
            _routePolylines = [
              Polyline(
                polylineId: const PolylineId('route'),
                points: _routePoints,
                color: Colors.blue,
                width: 6,
                patterns: [PatternItem.dash(30), PatternItem.gap(10)],
              ),
            ];
          }

          _hasRoute = true;
          _showNavigationUI = true;
        });
      }

      print(
        '🧭 Route processed: ${_routePoints.length} points, ${_routeInstructions.length} instructions',
      );
    } catch (e) {
      print('❌ Error processing route: $e');
      if (mounted) {
        setState(() {
          _errorMessage = 'Lỗi xử lý tuyến đường: $e';
          _isLoading = false;
        });
      }
    }
  }

  // ⬅️ REMOVED/SIMPLIFIED: No longer needed for in-app polylines
  /*
  void _updateRoutePolylines() { ... }
  */

  // ⬅️ REMOVED/SIMPLIFIED: No longer needed for in-app instructions
  /*
  void _updateCurrentInstruction() { ... }
  */

  // ⬅️ MODIFIED: Start in-app navigation with GPS tracking
  void _startNavigation() {
    try {
      if (!_hasRoute || _destination == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vui lòng chọn bãi đỗ xe để bắt đầu chỉ đường'),
          ),
        );
        return;
      }

      print('🧭 Starting navigation...');

      setState(() {
        _isNavigating = true;
        _isNavigationActive = true;
        _showNavigationUI = true;
      });

      // Start navigation with first instruction
      if (_routeInstructions.isNotEmpty) {
        _currentInstruction = _routeInstructions[0]['instruction'];
        if (_routeInstructions.length > 1) {
          _nextInstruction = _routeInstructions[1]['instruction'];
        }
      }

      // Start GPS tracking
      _startGPSTracking();

      print('🧭 In-app navigation started with GPS tracking');
    } catch (e) {
      print('❌ Error starting navigation: $e');
      if (mounted) {
        setState(() {
          _isNavigating = false;
          _isNavigationActive = false;
          _showNavigationUI = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi bắt đầu chỉ đường: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  // ⬅️ MODIFIED: Stop navigation and GPS tracking
  void _stopNavigation() {
    setState(() {
      _isNavigating = false;
      _isNavigationActive = false;
      _showNavigationUI = false;
      _currentInstruction = null;
      _nextInstruction = null;
    });

    // Stop GPS tracking
    _stopGPSTracking();

    print('🧭 In-app navigation stopped');
  }

  // ⬅️ MODIFIED: Simplified to clear only the basic route state
  void _clearRoute() {
    setState(() {
      _hasRoute = false;
      _isNavigating = false;
      _isNavigationActive = false;
      _showNavigationUI = false;
      _routePolylines = [];
      _routePoints = [];
      _routeInstructions = [];
      _estimatedTime = null;
      _estimatedDistance = null;
      _currentInstruction = null;
      _nextInstruction = null;
      _destination = null;
      _destinationName = null;
    });
    print('🧭 Route cleared');
  }

  /// Start continuous GPS tracking during navigation
  void _startGPSTracking() {
    print('📍 Starting GPS tracking for navigation');

    try {
      const LocationSettings locationSettings = LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // Update every 10 meters
      );

      _positionStream =
          Geolocator.getPositionStream(
            locationSettings: locationSettings,
          ).listen(
            (Position position) {
              print(
                '📍 GPS update: ${position.latitude}, ${position.longitude}',
              );

              if (mounted) {
                setState(() {
                  _currentPosition = position;
                });

                // Update map camera to follow user
                if (_mapController != null) {
                  _mapController!.animateCamera(
                    CameraUpdate.newLatLng(
                      LatLng(position.latitude, position.longitude),
                    ),
                  );
                }

                // Check if user has reached destination
                if (_destination != null) {
                  final distance = NavigationService.calculateDistance(
                    LatLng(position.latitude, position.longitude),
                    _destination!,
                  );

                  if (distance < 50) {
                    // Within 50 meters of destination
                    _onReachDestination();
                  }
                }
              }
            },
            onError: (error) {
              print('❌ GPS tracking error: $error');
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Lỗi GPS: $error'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
          );
    } catch (e) {
      print('❌ Error starting GPS tracking: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể bắt đầu GPS: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Stop GPS tracking
  void _stopGPSTracking() {
    print('📍 Stopping GPS tracking');
    _positionStream?.cancel();
    _positionStream = null;
  }

  /// Handle reaching destination
  void _onReachDestination() {
    print('🎯 Reached destination!');

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('🎉 Đã đến đích!'),
          backgroundColor: Colors.green,
          duration: Duration(seconds: 3),
        ),
      );

      // Stop navigation
      _stopNavigation();
    }
  }

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
                  polylines: Set<Polyline>.from(_routePolylines),
                  onMapCreated: (GoogleMapController controller) {
                    print('🗺️ Google Map created successfully');
                    _mapController = controller;

                    // Force update markers after map is ready
                    Future.delayed(const Duration(milliseconds: 500), () {
                      print('🔄 Force updating markers after map ready...');
                      _updateMarkers();
                    });

                    // Mark map as loaded and cancel auto-fallback
                    setState(() {
                      _mapLoaded = true;
                      _showMapFallback = false;
                    });
                  },
                  onCameraMove: (CameraPosition position) {
                    // Update bounds for in-bounds search
                    _mapController?.getVisibleRegion().then((bounds) {
                      _currentBounds = bounds;
                    });
                  },
                  onCameraIdle: () {
                    // Load parking lots in current view when camera stops moving
                    if (!_isNavigating) {
                      _loadParkingLotsInBounds();
                    }
                  },
                  myLocationEnabled: true,
                  myLocationButtonEnabled: true,
                  mapType: MapType.normal,
                  mapToolbarEnabled: false,
                  zoomControlsEnabled: true,
                  compassEnabled: true,
                  liteModeEnabled: false,
                  buildingsEnabled: true,
                  trafficEnabled: false,
                ),

                // ⬅️ Navigation overlay (REMOVED or COMMENTED OUT)
                /*
                NavigationOverlay(
                  isVisible: _isNavigating,
                  currentInstruction: _currentInstruction,
                  nextInstruction: _nextInstruction,
                  distanceToNext: _distanceToNext,
                  timeToNext: _timeToNext,
                  isMuted: _isMuted,
                  onClose: _stopNavigation,
                  onMute: () {
                    setState(() {
                      _isMuted = !_isMuted;
                    });
                  },
                  onShowInstructions: () {
                    // ... (Instructions UI REMOVED) ...
                  },
                ),
                */
                // A simpler, temporary overlay to show navigation is external
                if (_isNavigating)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade600,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Chỉ đường đang chạy trên ứng dụng bản đồ bên ngoài...',
                        style: TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
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

                // Navigation debug indicator
                if (_hasRoute)
                  Positioned(
                    top: 140,
                    right: 16,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _isNavigating ? Colors.blue : Colors.orange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        _isNavigating ? 'Navigating' : 'Route Ready',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
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

          // Navigation controls
          // ⬅️ The NavigationControls widget is reused to manage the external navigation state
          if (_hasRoute)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: NavigationControls(
                // _startNavigation will now only update the UI state to reflect external nav
                onStartNavigation: _startNavigation,
                onStopNavigation: _stopNavigation,
                onShowAlternatives: null, // Disable for now
                isNavigating: _isNavigating,
                hasRoute: _hasRoute,
                estimatedTime: _estimatedTime,
                estimatedDistance: _estimatedDistance,
                destination: _destination,
                destinationName: _destinationName,
              ),
            ),

          // Navigation UI overlay
          if (_showNavigationUI && _isNavigationActive)
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              child: _buildNavigationOverlay(),
            ),

          // Navigation error overlay
          if (_hasRoute &&
              _errorMessage != null &&
              _errorMessage!.contains('navigation'))
            Positioned(
              top: MediaQuery.of(context).padding.top + 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
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
              ),
            ),

          // Clear route button
          if (_hasRoute)
            Positioned(
              top: MediaQuery.of(context).padding.top + 80,
              right: 16,
              child: FloatingActionButton.small(
                onPressed: _clearRoute,
                backgroundColor: Colors.red,
                child: const Icon(Icons.close, color: Colors.white),
              ),
            ),

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
                    // ⬅️ Since we removed the custom Directions API logic, this help is less relevant for the new error,
                    // but keeping it for other potential API errors (e.g., ParkingLotService)
                    if (_errorMessage!.contains('Directions API') ||
                        _errorMessage!.contains('API key'))
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
        title: const Text('Hướng dẫn bật Google Directions API'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Tính năng chỉ đường đã được chuyển sang sử dụng ứng dụng bản đồ bên ngoài. Nếu bạn thấy lỗi liên quan đến API bãi đỗ xe:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              Text('1. Kiểm tra kết nối mạng.'),
              Text(
                '2. Đảm bảo API Key cho dịch vụ bãi đỗ xe đã được cấu hình đúng.',
              ),
              SizedBox(height: 12),
              Text(
                'Nếu lỗi liên quan đến Google Directions API (cũ), có thể đã bị thay thế trong hệ thống.',
                style: TextStyle(
                  fontStyle: FontStyle.italic,
                  color: Colors.orange,
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

  /// Build navigation overlay UI
  Widget _buildNavigationOverlay() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Current instruction
          if (_currentInstruction != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.navigation, color: Colors.blue, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _currentInstruction!,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.blue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_estimatedTime != null && _estimatedDistance != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            color: Colors.grey[600],
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _estimatedTime!,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Icon(
                            Icons.straighten,
                            color: Colors.grey[600],
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _estimatedDistance!,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // Next instruction
          if (_nextInstruction != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(Icons.arrow_forward, color: Colors.grey[600], size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _nextInstruction!,
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    ),
                  ),
                ],
              ),
            ),

          const SizedBox(height: 12),

          // Navigation controls
          Row(
            children: [
              // Stop navigation button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _stopNavigation,
                  icon: const Icon(Icons.stop, color: Colors.white),
                  label: const Text(
                    'Dừng chỉ đường',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 12),

              // Mute button
              Container(
                decoration: BoxDecoration(
                  border: Border.all(
                    color: _isMuted ? Colors.red : Colors.grey,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: IconButton(
                  onPressed: () {
                    setState(() {
                      _isMuted = !_isMuted;
                    });
                  },
                  icon: Icon(
                    _isMuted ? Icons.volume_off : Icons.volume_up,
                    color: _isMuted ? Colors.red : Colors.grey[600],
                  ),
                  tooltip: _isMuted ? 'Bật âm thanh' : 'Tắt âm thanh',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
