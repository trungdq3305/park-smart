import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';
import '../../../services/parking_lot_service.dart';
import '../../../widgets/booking/parking_lot_info_card.dart';
import '../../../widgets/booking/booking_form_card.dart';
import '../../../widgets/booking/electric_car_message.dart';
import '../../../widgets/booking/pricing_table_card.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> parkingLot;

  const BookingScreen({super.key, required this.parkingLot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _durationController = TextEditingController();

  bool _isLoading = false;
  bool _isLoadingSpaces = false;
  bool _isLoadingPricing = false;
  List<Map<String, dynamic>> _parkingSpaces = [];
  List<Map<String, dynamic>> _pricingLinks = [];
  String? _selectedSpaceId;
  int _selectedLevel = 1;
  List<int> _availableLevels = [];
  bool _isSelectedSpaceElectric = false;

  @override
  void initState() {
    super.initState();
    _initializeLevels();
    _loadParkingSpaces();
    _loadPricingLinks();
  }

  /// Initialize available levels from parking lot data
  void _initializeLevels() {
    final totalLevel = widget.parkingLot['totalLevel'] ?? 1;
    _availableLevels = List.generate(totalLevel, (index) => index + 1);
    print('🏢 Available levels from parking lot: $_availableLevels');
  }

  @override
  void dispose() {
    _durationController.dispose();
    super.dispose();
  }

  /// Load parking spaces for the selected level
  Future<void> _loadParkingSpaces() async {
    setState(() {
      _isLoadingSpaces = true;
    });

    try {
      final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
      if (parkingLotId == null) {
        throw Exception('Không tìm thấy ID bãi đỗ xe');
      }

      print('🅿️ Loading parking spaces for level $_selectedLevel...');

      final response = await ParkingLotService.getParkingSpaces(
        parkingLotId: parkingLotId,
        level: _selectedLevel,
        pageSize: 1000, // Get all spaces for the level
      );

      final spacesData = response['data'];
      List<Map<String, dynamic>> spaces = [];

      if (spacesData is List) {
        spaces = List<Map<String, dynamic>>.from(spacesData);
      }

      setState(() {
        _parkingSpaces = spaces;
        _isLoadingSpaces = false;
      });

      print(
        '✅ Loaded ${spaces.length} parking spaces for level $_selectedLevel',
      );
      print('📊 Available levels: $_availableLevels');

      // Debug: Print first few spaces to see the data structure
      if (spaces.isNotEmpty) {
        print('🔍 Sample space data:');
        for (int i = 0; i < (spaces.length > 3 ? 3 : spaces.length); i++) {
          print('  Space $i: ${spaces[i]}');
        }
      }
    } catch (e) {
      setState(() {
        _isLoadingSpaces = false;
      });
      print('❌ Error loading parking spaces: $e');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải vị trí đỗ xe: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  /// Load pricing links for the parking lot
  Future<void> _loadPricingLinks() async {
    setState(() {
      _isLoadingPricing = true;
    });

    try {
      final parkingLotId = widget.parkingLot['_id'] ?? widget.parkingLot['id'];
      if (parkingLotId == null) {
        throw Exception('Không tìm thấy ID bãi đỗ xe');
      }

      print('💰 Loading pricing links for parking lot...');

      final response =
          await ParkingLotService.getActiveParkingLotLinksByParkingLot(
            parkingLotId,
          );

      final linksData = response['data'];
      List<Map<String, dynamic>> links = [];

      if (linksData is List) {
        links = List<Map<String, dynamic>>.from(linksData);
      }

      setState(() {
        _pricingLinks = links;
        _isLoadingPricing = false;
      });

      print('✅ Loaded ${links.length} pricing links');
    } catch (e) {
      setState(() {
        _isLoadingPricing = false;
      });
      print('❌ Error loading pricing links: $e');

      // Don't show error snackbar for pricing, just log it
      // Pricing is not critical for booking flow
    }
  }

  /// Change selected level and reload spaces
  void _changeLevel(int level) {
    if (level != _selectedLevel) {
      setState(() {
        _selectedLevel = level;
        _selectedSpaceId = null; // Reset selection
        _isSelectedSpaceElectric = false; // Reset electric car status
      });
      _loadParkingSpaces();
    }
  }

  /// Get selected space information
  String _getSelectedSpaceInfo() {
    if (_selectedSpaceId == null) return '';

    final selectedSpace = _parkingSpaces.firstWhere(
      (space) => (space['_id'] ?? space['id']) == _selectedSpaceId,
      orElse: () => {},
    );

    if (selectedSpace.isEmpty) return 'Không xác định';

    final spaceCode =
        selectedSpace['code'] ??
        selectedSpace['spaceNumber'] ??
        selectedSpace['number'] ??
        '?';
    final row = selectedSpace['row'] ?? 'A';

    // Update electric car status
    _isSelectedSpaceElectric = selectedSpace['isElectricCar'] ?? false;

    return 'Tầng $_selectedLevel - Hàng $row - Vị trí $spaceCode';
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Đặt chỗ đỗ xe'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Parking lot info card
                ParkingLotInfoCard(parkingLot: widget.parkingLot),

                const SizedBox(height: 24),

                // Pricing table card
                PricingTableCard(
                  pricingLinks: _pricingLinks,
                  isLoading: _isLoadingPricing,
                ),

                const SizedBox(height: 24),

                // Electric car message
                ElectricCarMessage(
                  isVisible:
                      _selectedSpaceId != null && _isSelectedSpaceElectric,
                ),

                // Booking form card
                BookingFormCard(
                  durationController: _durationController,
                  selectedSpaceInfo: _selectedSpaceId != null
                      ? _getSelectedSpaceInfo()
                      : null,
                  isSelectedSpaceElectric: _isSelectedSpaceElectric,
                  calculateEstimatedCost: _calculateEstimatedCost,
                ),

                const SizedBox(height: 24),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitBooking,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Xác nhận đặt chỗ',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _calculateEstimatedCost() {
    final duration = int.tryParse(_durationController.text);
    if (duration == null || duration <= 0) return '0';

    // Placeholder calculation - will be updated with actual pricing logic
    const basePrice = 5000; // VND per hour
    final total = duration * basePrice;

    return total.toString();
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.parkingLot['availableSpots'] <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bãi đỗ xe đã hết chỗ trống'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_selectedSpaceId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn vị trí đỗ xe'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement actual booking API call
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Đặt chỗ thành công! Bạn sẽ nhận được thông báo xác nhận.',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate back to parking lot screen
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi đặt chỗ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
