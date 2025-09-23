import 'package:flutter/material.dart';
import '../../../services/vehicle_service.dart';
import '../../../widgets/vehicle/vehicle_card.dart';
import '../../../widgets/vehicle/vehicle_dialogs.dart';
import '../../../widgets/vehicle/state_widgets.dart';

class MyCarScreen extends StatefulWidget {
  const MyCarScreen({super.key});

  @override
  State<MyCarScreen> createState() => _MyCarScreenState();
}

class _MyCarScreenState extends State<MyCarScreen>
    with TickerProviderStateMixin {
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
  bool _isSubmitting = false;
  String? _errorMessage;

  // Animation controllers
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // App theme colors
  static const Color primaryColor = Colors.green;
  static const Color backgroundColor = Color(0xFFF8FAFC);
  static const Color cardColor = Colors.white;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
    _loadVehicles();
  }

  void _initializeAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );

    _slideAnimation =
        Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero).animate(
          CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic),
        );

    _fadeController.forward();
    _slideController.forward();
  }

  @override
  void dispose() {
    _plateNumberController.dispose();
    _fadeController.dispose();
    _slideController.dispose();
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
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return VehicleDialogs.buildAddVehicleDialog(
              context: context,
              plateNumberController: _plateNumberController,
              selectedBrandId: _selectedBrandId,
              selectedColorId: _selectedColorId,
              selectedVehicleTypeId: _selectedVehicleTypeId,
              brands: brands,
              colors: colors,
              vehicleTypes: vehicleTypes,
              onBrandChanged: (value) {
                setDialogState(() {
                  _selectedBrandId = value;
                });
              },
              onColorChanged: (value) {
                setDialogState(() {
                  _selectedColorId = value;
                });
              },
              onVehicleTypeChanged: (value) {
                setDialogState(() {
                  _selectedVehicleTypeId = value;
                });
              },
              errorMessage: _errorMessage,
              isLoadingDropdowns: _isLoadingDropdowns,
              isSubmitting: _isSubmitting,
              onCancel: () => Navigator.of(context).pop(),
              onSubmit: () => _createVehicle(),
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
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return VehicleDialogs.buildEditVehicleDialog(
              context: context,
              plateNumberController: _plateNumberController,
              selectedBrandId: _selectedBrandId,
              selectedColorId: _selectedColorId,
              selectedVehicleTypeId: _selectedVehicleTypeId,
              brands: brands,
              colors: colors,
              vehicleTypes: vehicleTypes,
              onBrandChanged: (value) {
                setDialogState(() {
                  _selectedBrandId = value;
                });
              },
              onColorChanged: (value) {
                setDialogState(() {
                  _selectedColorId = value;
                });
              },
              onVehicleTypeChanged: (value) {
                setDialogState(() {
                  _selectedVehicleTypeId = value;
                });
              },
              errorMessage: _errorMessage,
              isLoadingDropdowns: _isLoadingDropdowns,
              isSubmitting: _isSubmitting,
              onCancel: () => Navigator.of(context).pop(),
              onSubmit: () => _updateVehicle(vehicle['_id']),
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
    _errorMessage = null;
  }

  Future<void> _createVehicle() async {
    if (_plateNumberController.text.isEmpty ||
        _selectedBrandId == null ||
        _selectedColorId == null ||
        _selectedVehicleTypeId == null) {
      setState(() {
        _errorMessage = 'Vui lòng điền đầy đủ thông tin';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await VehicleService.createVehicle(
        plateNumber: _plateNumberController.text.trim(),
        brandId: _selectedBrandId!,
        colorId: _selectedColorId!,
        vehicleTypeId: _selectedVehicleTypeId!,
      );

      Navigator.of(context).pop();
      _showSnackBar('Thêm xe thành công', isError: false);
      _loadVehicles();
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi thêm xe: $e';
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  Future<void> _updateVehicle(String vehicleId) async {
    if (_plateNumberController.text.isEmpty ||
        _selectedBrandId == null ||
        _selectedColorId == null ||
        _selectedVehicleTypeId == null) {
      setState(() {
        _errorMessage = 'Vui lòng điền đầy đủ thông tin';
      });
      return;
    }

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });

    try {
      await VehicleService.updateVehicle(
        vehicleId: vehicleId,
        brandId: _selectedBrandId!,
        colorId: _selectedColorId!,
        vehicleTypeId: _selectedVehicleTypeId!,
      );

      Navigator.of(context).pop();
      _showSnackBar('Cập nhật xe thành công', isError: false);
      _loadVehicles();
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi cập nhật xe: $e';
      });
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  void _showDeleteDialog(String vehicleId, String plateNumber) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return VehicleDialogs.buildDeleteDialog(
          context: context,
          plateNumber: plateNumber,
          onCancel: () => Navigator.of(context).pop(),
          onDelete: () {
            Navigator.of(context).pop();
            _deleteVehicle(vehicleId);
          },
        );
      },
    );
  }

  Future<void> _deleteVehicle(String vehicleId) async {
    try {
      await VehicleService.deleteVehicle(vehicleId);
      _showSnackBar('Xóa xe thành công', isError: false);
      _loadVehicles();
    } catch (e) {
      _showSnackBar('Lỗi xóa xe: $e', isError: true);
    }
  }

  void _showSnackBar(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white,
              size: 20,
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError ? Colors.red.shade600 : primaryColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Xe của tôi',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: IconButton(
              onPressed: _showAddVehicleDialog,
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.add_rounded, size: 20),
              ),
            ),
          ),
        ],
      ),
      body: FadeTransition(
        opacity: _fadeAnimation,
        child: SlideTransition(position: _slideAnimation, child: _buildBody()),
      ),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return StateWidgets.buildLoadingState();
    }

    if (errorMessage != null) {
      return StateWidgets.buildErrorState(
        errorMessage: errorMessage!,
        onRetry: _loadVehicles,
      );
    }

    if (vehicles.isEmpty) {
      return StateWidgets.buildEmptyState(onAddVehicle: _showAddVehicleDialog);
    }

    return RefreshIndicator(
      onRefresh: _loadVehicles,
      color: primaryColor,
      backgroundColor: cardColor,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: vehicles.length,
        itemBuilder: (context, index) {
          return AnimatedContainer(
            duration: Duration(milliseconds: 300 + (index * 100)),
            curve: Curves.easeOutCubic,
            child: VehicleCard(
              vehicle: vehicles[index],
              onEdit: () => _showEditVehicleDialog(vehicles[index]),
              onDelete: () => _showDeleteDialog(
                vehicles[index]['_id'] ?? '',
                vehicles[index]['plateNumber'] ?? 'N/A',
              ),
            ),
          );
        },
      ),
    );
  }
}
