import 'package:flutter/material.dart';
import '../../../services/vehicle_service.dart';
import '../../../widgets/vehicle/state_widgets.dart';
import '../../../widgets/vehicle/deleted_vehicle_card.dart';
import '../../../widgets/vehicle/deleted_vehicles_empty_state.dart';

class DeletedVehiclesHistoryScreen extends StatefulWidget {
  const DeletedVehiclesHistoryScreen({super.key});

  @override
  State<DeletedVehiclesHistoryScreen> createState() =>
      _DeletedVehiclesHistoryScreenState();
}

class _DeletedVehiclesHistoryScreenState
    extends State<DeletedVehiclesHistoryScreen>
    with TickerProviderStateMixin {
  List<Map<String, dynamic>> deletedVehicles = [];
  bool isLoading = true;
  String? errorMessage;

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
    _loadDeletedVehicles();
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
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  Future<void> _loadDeletedVehicles() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await VehicleService.getAllDeletedVehicles();
      setState(() {
        deletedVehicles = List<Map<String, dynamic>>.from(
          response['data'] ?? [],
        );
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        errorMessage = e.toString();
        isLoading = false;
      });
    }
  }

  Future<void> _restoreVehicle(String vehicleId) async {
    try {
      await VehicleService.restoreVehicle(vehicleId);
      _showSnackBar('Khôi phục xe thành công', isError: false);
      _loadDeletedVehicles(); // Reload danh sách
    } catch (e) {
      _showSnackBar('Lỗi khôi phục xe: $e', isError: true);
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
          'Lịch sử xe đã xóa',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
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
        onRetry: _loadDeletedVehicles,
      );
    }

    if (deletedVehicles.isEmpty) {
      return const DeletedVehiclesEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadDeletedVehicles,
      color: primaryColor,
      backgroundColor: cardColor,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: deletedVehicles.length,
        itemBuilder: (context, index) {
          return AnimatedContainer(
            duration: Duration(milliseconds: 300 + (index * 100)),
            curve: Curves.easeOutCubic,
            child: DeletedVehicleCard(
              vehicle: deletedVehicles[index],
              onRestore: () => _restoreVehicle(deletedVehicles[index]['_id']),
            ),
          );
        },
      ),
    );
  }
}
