import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';
import '../../../services/parking_lot_service.dart';

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
  List<Map<String, dynamic>> _parkingSpaces = [];
  String? _selectedSpaceId;
  int _selectedLevel = 1;
  List<int> _availableLevels = [];

  @override
  void initState() {
    super.initState();
    _loadParkingSpaces();
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

      // Get available levels from the spaces
      Set<int> levels = spaces
          .map((space) => (space['level'] ?? 1) as int)
          .toSet();

      setState(() {
        _parkingSpaces = spaces;
        _availableLevels = levels.toList()..sort();
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

  /// Change selected level and reload spaces
  void _changeLevel(int level) {
    if (level != _selectedLevel) {
      setState(() {
        _selectedLevel = level;
        _selectedSpaceId = null; // Reset selection
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
    final row = selectedSpace['row'] ?? '?';

    return 'Tầng $_selectedLevel - Hàng $row - Vị trí $spaceCode';
  }

  @override
  Widget build(BuildContext context) {
    // Extract data from parking lot
    final addressId = widget.parkingLot['addressId'];
    final availableSpots = widget.parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel =
        widget.parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = widget.parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final wardName = addressId?['wardId']?['wardName'] ?? '';
    final openTime = widget.parkingLot['openTime'] ?? 'N/A';
    final closeTime = widget.parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = widget.parkingLot['is24Hours'] ?? false;
    final maxVehicleHeight = widget.parkingLot['maxVehicleHeight'] ?? 0;
    final maxVehicleWidth = widget.parkingLot['maxVehicleWidth'] ?? 0;
    final electricCarPercentage =
        widget.parkingLot['electricCarPercentage'] ?? 0;
    final parkingLotStatus = widget.parkingLot['parkingLotStatus'] ?? 'N/A';

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
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.local_parking,
                            color: Colors.green.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Thông tin bãi đỗ xe',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Address
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.location_on,
                            color: Colors.grey.shade600,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  address,
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey.shade700,
                                  ),
                                ),
                                if (wardName.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    wardName,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Operating hours
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            color: Colors.grey.shade600,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            is24Hours
                                ? 'Mở cửa 24/7'
                                : 'Giờ mở cửa: $openTime - $closeTime',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Availability
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: availableSpots > 0
                              ? Colors.green.shade50
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: availableSpots > 0
                                ? Colors.green.shade200
                                : Colors.red.shade200,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              availableSpots > 0
                                  ? Icons.check_circle
                                  : Icons.warning,
                              color: availableSpots > 0
                                  ? Colors.green
                                  : Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              availableSpots > 0
                                  ? 'Còn $availableSpots/$totalSlots chỗ trống'
                                  : 'Hết chỗ trống',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: availableSpots > 0
                                    ? Colors.green.shade700
                                    : Colors.red.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Vehicle size limits
                      Row(
                        children: [
                          Icon(
                            Icons.directions_car,
                            color: Colors.grey.shade600,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Giới hạn kích thước: ${maxVehicleHeight}m x ${maxVehicleWidth}m',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Electric car support
                      if (electricCarPercentage > 0) ...[
                        Row(
                          children: [
                            Icon(
                              Icons.electric_car,
                              color: Colors.green.shade600,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Hỗ trợ xe điện: $electricCarPercentage%',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Parking lot status
                      Row(
                        children: [
                          Icon(
                            Icons.verified,
                            color: parkingLotStatus == 'Đã duyệt'
                                ? Colors.green
                                : Colors.orange,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Trạng thái: $parkingLotStatus',
                            style: TextStyle(
                              fontSize: 14,
                              color: parkingLotStatus == 'Đã duyệt'
                                  ? Colors.green.shade700
                                  : Colors.orange.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // User info from token
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.document_scanner,
                            color: Colors.green.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Thông tin đặt chỗ',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 20),

                      // Selected space info
                      if (_selectedSpaceId != null) ...[
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
                                Icons.check_circle,
                                color: Colors.blue.shade600,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Vị trí đã chọn: ${_getSelectedSpaceInfo()}',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.blue.shade700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Duration field
                      TextFormField(
                        controller: _durationController,
                        decoration: const InputDecoration(
                          labelText: 'Thời gian dự kiến (giờ) *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.access_time_outlined),
                          suffixText: 'giờ',
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập thời gian dự kiến';
                          }
                          final duration = int.tryParse(value);
                          if (duration == null || duration <= 0) {
                            return 'Thời gian phải là số dương';
                          }
                          if (duration > 24) {
                            return 'Thời gian không được vượt quá 24 giờ';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Estimated cost
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
                              Icons.calculate,
                              color: Colors.blue.shade600,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Chi phí dự kiến: ${_calculateEstimatedCost()} VND',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.blue.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Terms and conditions
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.orange.shade600,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Điều khoản và điều kiện:',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange.shade700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '• Đặt chỗ có hiệu lực trong 30 phút kể từ khi xác nhận\n'
                              '• Vui lòng đến đúng giờ, chỗ đỗ có thể bị hủy nếu trễ quá 15 phút\n'
                              '• Chi phí có thể thay đổi tùy theo thời gian thực tế sử dụng\n'
                              '• Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Parking space selection
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
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
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.grid_view,
                            color: Colors.green.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Chọn vị trí đỗ xe',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Level selector
                      if (_availableLevels.isNotEmpty) ...[
                        Row(
                          children: [
                            const Text(
                              'Tầng: ',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(width: 8),
                            ..._availableLevels.map(
                              (level) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text('Tầng $level'),
                                  selected: _selectedLevel == level,
                                  onSelected: (selected) {
                                    if (selected) _changeLevel(level);
                                  },
                                  selectedColor: Colors.green.shade100,
                                  labelStyle: TextStyle(
                                    color: _selectedLevel == level
                                        ? Colors.green.shade700
                                        : Colors.grey.shade700,
                                    fontWeight: _selectedLevel == level
                                        ? FontWeight.w600
                                        : FontWeight.normal,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Parking spaces grid
                      if (_isLoadingSpaces)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else if (_parkingSpaces.isEmpty)
                        Container(
                          padding: const EdgeInsets.all(32),
                          child: const Center(
                            child: Text(
                              'Không có vị trí đỗ xe nào',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey,
                              ),
                            ),
                          ),
                        )
                      else
                        _buildParkingSpacesGrid(),
                    ],
                  ),
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

  /// Build parking spaces grid like cinema seats
  Widget _buildParkingSpacesGrid() {
    // Group spaces by row for better display
    Map<String, List<Map<String, dynamic>>> spacesByRow = {};

    for (var space in _parkingSpaces) {
      final row = space['row']?.toString() ?? 'A';
      if (!spacesByRow.containsKey(row)) {
        spacesByRow[row] = [];
      }
      spacesByRow[row]!.add(space);
    }

    // Sort rows alphabetically
    final sortedRows = spacesByRow.keys.toList()..sort();

    return Column(
      children: [
        // Legend
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildLegendItem(Colors.green, 'Trống'),
              _buildLegendItem(Colors.red, 'Đã đặt'),
              _buildLegendItem(Colors.blue, 'Đã chọn'),
              _buildLegendItem(Colors.grey, 'Không khả dụng'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Grid
        ...sortedRows.map(
          (row) => Column(
            children: [
              // Row label
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'Hàng $row',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
              // Spaces in row
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: spacesByRow[row]!
                    .map((space) => _buildSpaceButton(space))
                    .toList(),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ],
    );
  }

  /// Build legend item
  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.grey.shade300),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
        ),
      ],
    );
  }

  /// Build individual space button
  Widget _buildSpaceButton(Map<String, dynamic> space) {
    final spaceId = space['_id'] ?? space['id'];
    final spaceCode =
        space['code'] ?? space['spaceNumber'] ?? space['number'] ?? '?';
    final isAvailable =
        space['parkingSpaceStatusId']?['status'] == 'Trống' ||
        (space['isAvailable'] ?? true);
    final isOccupied =
        space['parkingSpaceStatusId']?['status'] == 'Đã đặt' ||
        (space['isOccupied'] ?? false);
    final isSelected = _selectedSpaceId == spaceId;

    Color backgroundColor;
    Color borderColor;
    Color textColor;

    if (isSelected) {
      backgroundColor = Colors.blue.shade100;
      borderColor = Colors.blue;
      textColor = Colors.blue.shade700;
    } else if (isOccupied) {
      backgroundColor = Colors.red.shade50;
      borderColor = Colors.red.shade300;
      textColor = Colors.red.shade700;
    } else if (!isAvailable) {
      backgroundColor = Colors.grey.shade200;
      borderColor = Colors.grey.shade400;
      textColor = Colors.grey.shade600;
    } else {
      backgroundColor = Colors.green.shade50;
      borderColor = Colors.green.shade300;
      textColor = Colors.green.shade700;
    }

    return GestureDetector(
      onTap: () {
        if (isAvailable && !isOccupied) {
          setState(() {
            _selectedSpaceId = isSelected ? null : spaceId;
          });
        }
      },
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
        ),
        child: Center(
          child: Text(
            spaceCode.toString(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: textColor,
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
