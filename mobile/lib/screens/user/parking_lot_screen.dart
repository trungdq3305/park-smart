import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/parking_lot_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/app_scaffold.dart';
import 'booking_reservation/booking_screen.dart';
import 'package:mobile/widgets/parking_lot_map/parking_lot_bottom_sheet.dart';
import 'package:mobile/widgets/parking_lot_map/location_search_bar.dart';
import 'package:mobile/widgets/parking_lot_map/error_message.dart';
import 'package:mobile/widgets/parking_lot_map/permission_dialog.dart';
import 'package:mobile/widgets/parking_lot_map/parking_lot_list.dart';
import 'package:mobile/widgets/parking_lot_map/map_debug_indicator.dart';
import 'package:mobile/widgets/parking_lot_map/api_help_dialog.dart';

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

  // Socket service for real-time updates
  final SocketService _socketService = SocketService();
  bool _isSocketConnected = false;

  // Removed navigation state variables as we're using external Google Maps

  @override
  void initState() {
    super.initState();
    _getCurrentLocation();
    _initializeSocket();

    // Auto-fallback to list view if map doesn't load within 15 seconds
    Future.delayed(const Duration(seconds: 15), () {
      if (mounted && _parkingLots.isNotEmpty && !_mapLoaded) {
        setState(() {
          _showMapFallback = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _socketService.dispose();
    super.dispose();
  }

  /// Initialize socket connection for real-time updates
  void _initializeSocket() {
    _socketService.initialize();

    // Listen to connection status
    _socketService.connectionStatusStream.listen((isConnected) {
      if (mounted) {
        setState(() {
          _isSocketConnected = isConnected;
        });
      }
    });

    // Listen to parking lot updates
    _socketService.parkingLotUpdateStream.listen((data) {
      if (mounted) {
        _handleParkingLotUpdate(data);
      }
    });
  }

  /// Handle real-time parking lot updates
  void _handleParkingLotUpdate(Map<String, dynamic> data) {
    // Update parking lot data in real-time
    final parkingLotId = data['parkingLotId'] ?? data['id'];
    final availableSpots = data['availableSpots'];

    if (parkingLotId != null && availableSpots != null) {
      // Find and update the parking lot in the list
      setState(() {
        for (int i = 0; i < _parkingLots.length; i++) {
          final lot = _parkingLots[i];
          final lotId = lot['id'] ?? lot['_id'];

          if (lotId == parkingLotId) {
            _parkingLots[i] = {...lot, 'availableSpots': availableSpots};
            break;
          }
        }
      });

      // Update markers to reflect new data
      _updateMarkers();

      // Show notification
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cập nhật bãi đỗ xe: $availableSpots chỗ trống'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  // ... (rest of _getCurrentLocation, _getAddressFromPosition, _loadNearbyParkingLots, _loadParkingLotsInBounds remains the same) ...

  Future<void> _getCurrentLocation() async {
    // ... (Your existing _getCurrentLocation implementation remains the same) ...
    try {
      // Check current permission status first
      PermissionStatus currentStatus = await Permission.location.status;
      // If permission is denied or permanently denied, show dialog to request
      if (currentStatus == PermissionStatus.denied ||
          currentStatus == PermissionStatus.permanentlyDenied) {
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
      PermissionStatus permission = await Permission.location.request();

      if (permission != PermissionStatus.granted) {
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

      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();

      if (!serviceEnabled) {
        setState(() {
          _errorMessage =
              'Dịch vụ định vị chưa được bật. Vui lòng bật GPS trong Cài đặt.';
        });
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      setState(() {
        _currentPosition = position;
      });

      // Get address from coordinates
      await _getAddressFromPosition(position);

      // Load nearby parking lots
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
      // 1. Gọi API để lấy danh sách các bãi đỗ xe gần đó
      final response = await ParkingLotService.getNearbyParkingLots(
        longitude: _currentPosition!.longitude,
        latitude: _currentPosition!.latitude,
        distance: _searchRadius,
        pageSize: 20,
      );

      // Xử lý dữ liệu trả về từ API
      final responseData = response['data'];
      List<Map<String, dynamic>> loadedParkingLots = [];
      if (responseData != null &&
          responseData is List &&
          responseData.isNotEmpty) {
        if (responseData[0] is List) {
          loadedParkingLots = List<Map<String, dynamic>>.from(
            responseData[0] ?? [],
          );
        } else {
          loadedParkingLots = List<Map<String, dynamic>>.from(responseData);
        }
      }

      // 2. Cập nhật state với dữ liệu mới từ API
      setState(() {
        _parkingLots = loadedParkingLots;
      });

      // 3. (QUAN TRỌNG) Tham gia room mặc định để nhận cập nhật real-time
      if (_isSocketConnected) {
        print('🚀 Tham gia room mặc định để nhận cập nhật real-time...');
        // Server sử dụng room mặc định room_123456
        _socketService.joinParkingLotRoom('123456');
      } else {
        print('⚠️ Socket chưa kết nối, không thể tham gia room');
      }

      // 4. Cập nhật các marker trên bản đồ
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
      });
    } finally {
      // Luôn đảm bảo tắt trạng thái loading dù thành công hay thất bại
      setState(() {
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
      // 1. Gọi API để lấy danh sách các bãi đỗ xe trong tầm nhìn bản đồ
      final response = await ParkingLotService.getParkingLotsInBounds(
        bottomLeftLng: _currentBounds!.southwest.longitude,
        bottomLeftLat: _currentBounds!.southwest.latitude,
        topRightLng: _currentBounds!.northeast.longitude,
        topRightLat: _currentBounds!.northeast.latitude,
        pageSize: 50,
      );

      // Xử lý dữ liệu trả về từ API
      final responseData = response['data'];
      List<Map<String, dynamic>> loadedParkingLots = [];
      if (responseData != null &&
          responseData is List &&
          responseData.isNotEmpty) {
        if (responseData[0] is List) {
          loadedParkingLots = List<Map<String, dynamic>>.from(
            responseData[0] ?? [],
          );
        } else {
          loadedParkingLots = List<Map<String, dynamic>>.from(responseData);
        }
      }

      // 2. Cập nhật state với dữ liệu mới
      setState(() {
        _parkingLots = loadedParkingLots;
      });

      // 3. (QUAN TRỌNG) Tham gia room mặc định để nhận cập nhật real-time
      if (_isSocketConnected) {
        print('🚀 Tham gia room mặc định để nhận cập nhật real-time...');
        // Server sử dụng room mặc định room_123456
        _socketService.joinParkingLotRoom('123456');
      } else {
        print('⚠️ Socket chưa kết nối, không thể tham gia room');
      }

      // 4. Cập nhật các marker trên bản đồ
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
      });
    } finally {
      // Tắt trạng thái loading
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _updateMarkers() {
    Set<Marker> markers = {};

    // Add current location marker
    if (_currentPosition != null) {
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
      }
    }

    setState(() {
      _markers = markers;
    });
  }

  void _showParkingLotDetails(Map<String, dynamic> parkingLot) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => ParkingLotBottomSheet(
        parkingLot: parkingLot,
        onNavigate: () => _navigateToParkingLot(parkingLot),
        onBook: () => _bookParkingLot(parkingLot),
      ),
    );
  }

  // Function to open Google Maps for navigation
  Future<void> _navigateToParkingLot(Map<String, dynamic> parkingLot) async {
    // Extract coordinates from parking lot
    final addressId = parkingLot['addressId'];
    final lat = addressId?['latitude']?.toDouble();
    final lng = addressId?['longitude']?.toDouble();

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

        // Try to open Google Maps app first
        Uri googleMapsUri = Uri.parse(googleMapsUrl);

        if (await canLaunchUrl(googleMapsUri)) {
          await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
        } else {
          // Fallback to web browser
          await launchUrl(googleMapsUri, mode: LaunchMode.externalApplication);
        }
      } catch (e) {
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

  Future<void> _bookParkingLot(Map<String, dynamic> parkingLot) async {
    try {
      // Get parking lot ID
      final parkingLotId = parkingLot['id'] ?? parkingLot['_id'];

      if (parkingLotId == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không thể lấy thông tin bãi đỗ xe'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Show loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const Center(child: CircularProgressIndicator()),
      );

      // Get detailed parking lot information
      final detailedParkingLot = await ParkingLotService.getParkingLotById(
        parkingLotId,
      );

      // Close loading dialog
      Navigator.of(context).pop();

      // Navigate to booking screen
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => BookingScreen(
            parkingLot: detailedParkingLot['data'] ?? detailedParkingLot,
          ),
        ),
      );
    } catch (e) {
      // Close loading dialog if it's open
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải thông tin bãi đỗ xe: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<bool?> _showPermissionDialog() async {
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => const PermissionDialog(),
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
                    _mapController = controller;

                    // Force update markers after map is ready
                    Future.delayed(const Duration(milliseconds: 500), () {
                      if (mounted) {
                        _updateMarkers();
                      }
                    });

                    // Mark map as loaded and cancel auto-fallback
                    if (mounted) {
                      _mapLoaded = true;
                      _showMapFallback = false;
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
                MapDebugIndicator(mapLoaded: _mapLoaded),

                // Socket status indicator
                Positioned(
                  top: 140,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _isSocketConnected ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      _isSocketConnected ? 'Socket OK' : 'Socket Off',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),

                // Fallback: Show parking lots list when map doesn't load
                if (_showMapFallback)
                  Positioned.fill(
                    child: ParkingLotList(
                      parkingLots: _parkingLots,
                      onParkingLotTap: _showParkingLotDetails,
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
            child: LocationSearchBar(
              currentAddress: _currentAddress,
              showMapFallback: _showMapFallback,
              onToggleView: () {
                setState(() {
                  _showMapFallback = !_showMapFallback;
                });
              },
              onRefresh: _getCurrentLocation,
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
              child: ErrorMessage(
                errorMessage: _errorMessage!,
                onDismiss: () {
                  setState(() {
                    _errorMessage = null;
                  });
                },
                onShowHelp: _showApiHelpDialog,
              ),
            ),
        ],
      ),
    );
  }

  void _showApiHelpDialog() {
    showDialog(context: context, builder: (context) => const ApiHelpDialog());
  }

  // Removed _buildNavigationOverlay as we're using external Google Maps
}
