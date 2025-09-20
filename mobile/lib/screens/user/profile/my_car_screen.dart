import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/vehicle_service.dart';

class MyCarScreen extends StatefulWidget {
  const MyCarScreen({super.key});

  @override
  State<MyCarScreen> createState() => _MyCarScreenState();
}

class _MyCarScreenState extends State<MyCarScreen> {
  List<Map<String, dynamic>> vehicles = [];
  bool isLoading = true;
  String? errorMessage;

  // Data for dropdowns
  List<Map<String, dynamic>> brands = [];
  List<Map<String, dynamic>> colors = [];
  List<Map<String, dynamic>> vehicleTypes = [];

  // Form controllers
  final TextEditingController _plateNumberController = TextEditingController();
  String? _selectedBrandId;
  String? _selectedColorId;
  String? _selectedVehicleTypeId;

  // Loading states for dropdowns
  bool _isLoadingDropdowns = false;

  // Store original vehicle data for comparison
  Map<String, dynamic>? _originalVehicle;

  // Dialog states
  bool _isUpdating = false;
  String? _updateError;

  @override
  void initState() {
    super.initState();
    _loadVehicles();
  }

  @override
  void dispose() {
    _plateNumberController.dispose();
    super.dispose();
  }

  Future<void> _loadDropdownData() async {
    if (_isLoadingDropdowns) return;

    setState(() {
      _isLoadingDropdowns = true;
    });

    try {
      print('Starting to load dropdown data...');

      final results = await Future.wait([
        VehicleService.getBrands(),
        VehicleService.getColors(),
        VehicleService.getVehicleTypes(),
      ]);

      print('API calls completed');
      print('Brands response: ${results[0]}');
      print('Colors response: ${results[1]}');
      print('Vehicle types response: ${results[2]}');

      setState(() {
        // Brands có nested array structure: data[0] chứa array
        final brandsData = results[0]['data'];
        print('Brands data structure: $brandsData');

        if (brandsData != null && brandsData is List && brandsData.isNotEmpty) {
          print('Brands data[0]: ${brandsData[0]}');
          final allBrands = List<Map<String, dynamic>>.from(
            brandsData[0] ?? [],
          );
          print('All brands before filter: $allBrands');
          // Filter ra các brands chưa bị xóa (deletedAt == null)
          brands = allBrands
              .where((brand) => brand['deletedAt'] == null)
              .toList();
          print('Filtered brands: $brands');
        } else {
          brands = [];
          print('Brands data is null or empty');
        }

        // Colors và VehicleTypes có structure bình thường: data chứa array
        final colorsData = results[1]['data'];
        print('Colors data: $colorsData');
        final allColors = List<Map<String, dynamic>>.from(colorsData ?? []);
        print('All colors before filter: $allColors');
        colors = allColors
            .where((color) => color['deletedAt'] == null)
            .toList();
        print('Filtered colors: $colors');

        final vehicleTypesData = results[2]['data'];
        print('Vehicle types data: $vehicleTypesData');
        vehicleTypes = List<Map<String, dynamic>>.from(vehicleTypesData ?? []);
        print('Vehicle types: $vehicleTypes');

        _isLoadingDropdowns = false;
      });

      print(
        'Final counts - brands: ${brands.length}, colors: ${colors.length}, vehicle types: ${vehicleTypes.length}',
      );
    } catch (e) {
      setState(() {
        _isLoadingDropdowns = false;
      });
      print('Error loading dropdown data: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải dữ liệu: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _loadVehicles() async {
    try {
      setState(() {
        isLoading = true;
        errorMessage = null;
      });

      final response = await VehicleService.getDriverVehicles(
        page: 1,
        pageSize: 50, // Load nhiều xe hơn
      );

      print('Vehicle response: $response');

      if (response['data'] != null) {
        setState(() {
          vehicles = List<Map<String, dynamic>>.from(response['data']);
          isLoading = false;
        });
        print('Loaded ${vehicles.length} vehicles');
        if (vehicles.isNotEmpty) {
          print('First vehicle: ${vehicles[0]}');
        }
      } else {
        setState(() {
          vehicles = [];
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
      print('Error loading vehicles: $e');
    }
  }

  Future<void> _deleteVehicle(String vehicleId) async {
    try {
      await VehicleService.deleteVehicle(vehicleId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Xóa xe thành công'),
          backgroundColor: Colors.green,
        ),
      );
      _loadVehicles(); // Reload danh sách
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi xóa xe: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _showDeleteDialog(String vehicleId, String plateNumber) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Xác nhận xóa'),
          content: Text('Bạn có chắc chắn muốn xóa xe $plateNumber?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Hủy'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteVehicle(vehicleId);
              },
              style: TextButton.styleFrom(foregroundColor: Colors.red),
              child: const Text('Xóa'),
            ),
          ],
        );
      },
    );
  }

  void _showAddVehicleDialog() {
    _resetForm();
    _loadDropdownData();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Thêm xe mới'),
              content: SizedBox(
                width: double.maxFinite,
                child: _buildVehicleForm(setDialogState),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: _isLoadingDropdowns ? null : _createVehicle,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Thêm xe'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _showEditVehicleDialog(Map<String, dynamic> vehicle) {
    print('Edit vehicle data: $vehicle');
    print('Vehicle ID: ${vehicle['_id']}');
    print('Brand ID structure: ${vehicle['brandId']}');
    print('Color ID structure: ${vehicle['colorId']}');
    print('Vehicle Type ID structure: ${vehicle['vehicleTypeId']}');

    _resetForm();
    _loadDropdownData();

    // Pre-fill form with existing data
    _plateNumberController.text = vehicle['plateNumber'] ?? '';
    _selectedBrandId = vehicle['brandId']?['_id'];
    _selectedColorId = vehicle['colorId']?['_id'];
    _selectedVehicleTypeId = vehicle['vehicleTypeId']?['_id'];

    // Store original values for comparison
    _originalVehicle = vehicle;

    print('Selected brand ID: $_selectedBrandId');
    print('Selected color ID: $_selectedColorId');
    print('Selected vehicle type ID: $_selectedVehicleTypeId');

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Chỉnh sửa xe'),
              content: SizedBox(
                width: double.maxFinite,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildVehicleForm(setDialogState),
                    if (_updateError != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.red.shade200),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error,
                              color: Colors.red.shade600,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _updateError!,
                                style: TextStyle(
                                  color: Colors.red.shade700,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: _isLoadingDropdowns || _isUpdating
                      ? null
                      : () => _updateVehicle(vehicle['_id']),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: _isUpdating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Colors.white,
                            ),
                          ),
                        )
                      : const Text('Cập nhật'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _resetForm() {
    _plateNumberController.clear();
    _selectedBrandId = null;
    _selectedColorId = null;
    _selectedVehicleTypeId = null;
  }

  Future<void> _createVehicle() async {
    if (_plateNumberController.text.isEmpty ||
        _selectedBrandId == null ||
        _selectedColorId == null ||
        _selectedVehicleTypeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng điền đầy đủ thông tin'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      await VehicleService.createVehicle(
        plateNumber: _plateNumberController.text.trim(),
        brandId: _selectedBrandId!,
        colorId: _selectedColorId!,
        vehicleTypeId: _selectedVehicleTypeId!,
      );

      Navigator.of(context).pop(); // Close dialog
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thêm xe thành công'),
          backgroundColor: Colors.green,
        ),
      );
      _loadVehicles(); // Reload list
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi thêm xe: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _updateVehicle(String vehicleId) async {
    print('Updating vehicle with ID: $vehicleId');
    print('Original vehicle: $_originalVehicle');

    if (_originalVehicle == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy thông tin xe gốc'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    // Compare with original values and only send changed fields
    final originalPlateNumber = _originalVehicle!['plateNumber'] ?? '';
    final originalBrandId = _originalVehicle!['brandId']?['_id'];
    final originalColorId = _originalVehicle!['colorId']?['_id'];
    final originalVehicleTypeId = _originalVehicle!['vehicleTypeId']?['_id'];

    final currentPlateNumber = _plateNumberController.text.trim();
    final currentBrandId = _selectedBrandId;
    final currentColorId = _selectedColorId;
    final currentVehicleTypeId = _selectedVehicleTypeId;

    print('Original values:');
    print('  Plate: $originalPlateNumber');
    print('  Brand: $originalBrandId');
    print('  Color: $originalColorId');
    print('  Type: $originalVehicleTypeId');

    print('Current values:');
    print('  Plate: $currentPlateNumber');
    print('  Brand: $currentBrandId');
    print('  Color: $currentColorId');
    print('  Type: $currentVehicleTypeId');

    setState(() {
      _isUpdating = true;
      _updateError = null;
    });

    try {
      await VehicleService.updateVehicle(
        vehicleId: vehicleId,
        brandId: currentBrandId,
        colorId: currentColorId,
        vehicleTypeId: currentVehicleTypeId,
      );

      Navigator.of(context).pop(); // Close dialog
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cập nhật xe thành công'),
          backgroundColor: Colors.green,
        ),
      );
      _loadVehicles(); // Reload list
    } catch (e) {
      setState(() {
        _isUpdating = false;
        _updateError = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: true,
      appBar: AppBar(
        title: const Text(
          'Xe của tôi',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        ),
        backgroundColor: Colors.green,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddVehicleDialog,
          ),
        ],
      ),
      body: RefreshIndicator(onRefresh: _loadVehicles, child: _buildBody()),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              'Lỗi tải dữ liệu',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadVehicles,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
              ),
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (vehicles.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car_outlined,
              size: 80,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có xe nào',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Thêm xe đầu tiên của bạn',
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showAddVehicleDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
              icon: const Icon(Icons.add),
              label: const Text('Thêm xe'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vehicles.length,
      itemBuilder: (context, index) {
        final vehicle = vehicles[index];
        return _buildVehicleCard(vehicle);
      },
    );
  }

  Widget _buildVehicleCard(Map<String, dynamic> vehicle) {
    final plateNumber = vehicle['plateNumber'] ?? 'N/A';
    final brand = vehicle['brandId']?['brandName'] ?? 'N/A';
    final color = vehicle['colorId']?['colorName'] ?? 'N/A';
    final type = vehicle['vehicleTypeId']?['typeName'] ?? 'N/A';
    final isActive = vehicle['isActive'] ?? true;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Colors.white, Colors.green.shade50],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header với biển số và trạng thái
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      plateNumber,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isActive ? Colors.green : Colors.red,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      isActive ? 'Hoạt động' : 'Không hoạt động',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Thông tin xe
              _buildInfoRow(Icons.business, 'Hãng xe', brand),
              const SizedBox(height: 8),
              _buildInfoRow(Icons.palette, 'Màu sắc', color),
              const SizedBox(height: 8),
              _buildInfoRow(Icons.category, 'Loại xe', type),

              const SizedBox(height: 16),

              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _showEditVehicleDialog(vehicle),
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Chỉnh sửa'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.green,
                        side: const BorderSide(color: Colors.green),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          _showDeleteDialog(vehicle['_id'] ?? '', plateNumber),
                      icon: const Icon(Icons.delete, size: 18),
                      label: const Text('Xóa'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.green.shade600),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 14, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  Widget _buildVehicleForm(StateSetter setDialogState) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Plate Number (Readonly)
          TextField(
            controller: _plateNumberController,
            readOnly: true,
            decoration: InputDecoration(
              labelText: 'Biển số xe',
              hintText: 'Biển số xe',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.directions_car),
              filled: true,
              fillColor: Colors.grey.shade100,
            ),
          ),
          const SizedBox(height: 16),

          // Brand Dropdown
          DropdownButtonFormField<String>(
            value: _selectedBrandId,
            decoration: InputDecoration(
              labelText: 'Hãng xe',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.business),
            ),
            items: brands.map((brand) {
              print(
                'Creating brand dropdown item: ${brand['_id']} - ${brand['brandName']}',
              );
              return DropdownMenuItem<String>(
                value: brand['_id'],
                child: Text(brand['brandName'] ?? 'N/A'),
              );
            }).toList(),
            onChanged: (value) {
              setDialogState(() {
                _selectedBrandId = value;
              });
            },
          ),
          const SizedBox(height: 16),

          // Color Dropdown
          DropdownButtonFormField<String>(
            value: _selectedColorId,
            decoration: InputDecoration(
              labelText: 'Màu sắc',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.palette),
            ),
            items: colors.map((color) {
              return DropdownMenuItem<String>(
                value: color['_id'],
                child: Text(color['colorName'] ?? 'N/A'),
              );
            }).toList(),
            onChanged: (value) {
              setDialogState(() {
                _selectedColorId = value;
              });
            },
          ),
          const SizedBox(height: 16),

          // Vehicle Type Dropdown
          DropdownButtonFormField<String>(
            value: _selectedVehicleTypeId,
            decoration: InputDecoration(
              labelText: 'Loại xe',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.category),
            ),
            items: vehicleTypes.map((type) {
              return DropdownMenuItem<String>(
                value: type['_id'],
                child: Text(type['typeName'] ?? 'N/A'),
              );
            }).toList(),
            onChanged: (value) {
              setDialogState(() {
                _selectedVehicleTypeId = value;
              });
            },
          ),

          if (_isLoadingDropdowns) ...[
            const SizedBox(height: 16),
            const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
