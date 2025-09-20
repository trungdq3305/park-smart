import 'package:flutter/material.dart';
import '../../../services/vehicle_service.dart';

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

  Future<void> _loadVehicles() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await VehicleService.getDriverVehicles();
      setState(() {
        vehicles = List<Map<String, dynamic>>.from(response['data'] ?? []);
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _loadDropdownData() async {
    if (_isLoadingDropdowns) return;

    setState(() {
      _isLoadingDropdowns = true;
    });

    try {
      final results = await Future.wait([
        VehicleService.getBrands(),
        VehicleService.getColors(),
        VehicleService.getVehicleTypes(),
      ]);

      setState(() {
        // Brands có nested array structure: data[0] chứa array
        final brandsData = results[0]['data'];
        if (brandsData != null && brandsData is List && brandsData.isNotEmpty) {
          final allBrands = List<Map<String, dynamic>>.from(
            brandsData[0] ?? [],
          );
          brands = allBrands
              .where((brand) => brand['deletedAt'] == null)
              .toList();
        } else {
          brands = [];
        }

        // Colors và VehicleTypes có structure bình thường: data chứa array
        final allColors = List<Map<String, dynamic>>.from(
          results[1]['data'] ?? [],
        );
        colors = allColors
            .where((color) => color['deletedAt'] == null)
            .toList();

        vehicleTypes = List<Map<String, dynamic>>.from(
          results[2]['data'] ?? [],
        );
        _isLoadingDropdowns = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingDropdowns = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi tải dữ liệu: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
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
                child: _buildVehicleForm(setDialogState, isEdit: false),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: _isLoadingDropdowns
                      ? null
                      : () => _createVehicle(),
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
    _resetForm();
    _loadDropdownData();

    // Pre-fill form with existing data
    _plateNumberController.text = vehicle['plateNumber'] ?? '';
    _selectedBrandId = vehicle['brandId']?['_id'];
    _selectedColorId = vehicle['colorId']?['_id'];
    _selectedVehicleTypeId = vehicle['vehicleTypeId']?['_id'];

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Chỉnh sửa xe'),
              content: SizedBox(
                width: double.maxFinite,
                child: _buildVehicleForm(setDialogState, isEdit: true),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Hủy'),
                ),
                ElevatedButton(
                  onPressed: _isLoadingDropdowns
                      ? null
                      : () => _updateVehicle(vehicle['_id']),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Cập nhật'),
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

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Thêm xe thành công'),
          backgroundColor: Colors.green,
        ),
      );
      _loadVehicles();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi thêm xe: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _updateVehicle(String vehicleId) async {
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
      await VehicleService.updateVehicle(
        vehicleId: vehicleId,
        brandId: _selectedBrandId!,
        colorId: _selectedColorId!,
        vehicleTypeId: _selectedVehicleTypeId!,
      );

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Cập nhật xe thành công'),
          backgroundColor: Colors.green,
        ),
      );
      _loadVehicles();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi cập nhật xe: $e'),
          backgroundColor: Colors.red,
        ),
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
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _deleteVehicle(vehicleId);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Xóa'),
            ),
          ],
        );
      },
    );
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
      _loadVehicles();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi xóa xe: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Xe của tôi'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _showAddVehicleDialog,
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: _buildBody(),
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
                color: Colors.red.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              errorMessage!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600),
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
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có xe nào',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Thêm xe đầu tiên của bạn',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _showAddVehicleDialog,
              icon: const Icon(Icons.add),
              label: const Text('Thêm xe'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadVehicles,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: vehicles.length,
        itemBuilder: (context, index) {
          return _buildVehicleCard(vehicles[index]);
        },
      ),
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
        Icon(icon, size: 16, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: TextStyle(
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade700,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVehicleForm(StateSetter setDialogState, {bool isEdit = false}) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Plate Number
          TextField(
            controller: _plateNumberController,
            readOnly: isEdit, // Only readonly for edit
            decoration: InputDecoration(
              labelText: 'Biển số xe',
              hintText: 'Nhập biển số xe',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              prefixIcon: const Icon(Icons.directions_car),
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
        ],
      ),
    );
  }
}
