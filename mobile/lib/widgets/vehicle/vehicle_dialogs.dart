import 'package:flutter/material.dart';
import 'vehicle_form.dart';

class VehicleDialogs {
  // App theme colors
  static const Color primaryColor = Colors.green;
  static const Color secondaryColor = Color(0xFF2E7D32);
  static const Color cardColor = Colors.white;

  static Widget buildAddVehicleDialog({
    required BuildContext context,
    required TextEditingController plateNumberController,
    required String? selectedBrandId,
    required String? selectedColorId,
    required bool isElectricCar,
    required List<Map<String, dynamic>> brands,
    required List<Map<String, dynamic>> colors,
    required ValueChanged<String?> onBrandChanged,
    required ValueChanged<String?> onColorChanged,
    required ValueChanged<bool> onElectricCarChanged,
    required String? errorMessage,
    required bool isLoadingDropdowns,
    required bool isSubmitting,
    required VoidCallback onCancel,
    required VoidCallback onSubmit,
  }) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            _buildHeader(icon: Icons.add_rounded, title: 'Thêm xe mới'),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  if (errorMessage != null) ...[
                    _buildErrorMessage(errorMessage),
                    const SizedBox(height: 16),
                  ],
                  VehicleForm(
                    plateNumberController: plateNumberController,
                    selectedBrandId: selectedBrandId,
                    selectedColorId: selectedColorId,
                    isElectricCar: isElectricCar,
                    brands: brands,
                    colors: colors,
                    onBrandChanged: onBrandChanged,
                    onColorChanged: onColorChanged,
                    onElectricCarChanged: onElectricCarChanged,
                    isEdit: false,
                  ),
                ],
              ),
            ),
            // Actions
            _buildActions(
              onCancel: onCancel,
              onSubmit: onSubmit,
              isLoadingDropdowns: isLoadingDropdowns,
              isSubmitting: isSubmitting,
              submitText: 'Thêm xe',
            ),
          ],
        ),
      ),
    );
  }

  static Widget buildEditVehicleDialog({
    required BuildContext context,
    required TextEditingController plateNumberController,
    required String? selectedBrandId,
    required String? selectedColorId,
    required bool isElectricCar,
    required List<Map<String, dynamic>> brands,
    required List<Map<String, dynamic>> colors,
    required ValueChanged<String?> onBrandChanged,
    required ValueChanged<String?> onColorChanged,
    required ValueChanged<bool> onElectricCarChanged,
    required String? errorMessage,
    required bool isLoadingDropdowns,
    required bool isSubmitting,
    required VoidCallback onCancel,
    required VoidCallback onSubmit,
  }) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            _buildHeader(icon: Icons.edit_rounded, title: 'Chỉnh sửa xe'),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  if (errorMessage != null) ...[
                    _buildErrorMessage(errorMessage),
                    const SizedBox(height: 16),
                  ],
                  VehicleForm(
                    plateNumberController: plateNumberController,
                    selectedBrandId: selectedBrandId,
                    selectedColorId: selectedColorId,
                    isElectricCar: isElectricCar,
                    brands: brands,
                    colors: colors,
                    onBrandChanged: onBrandChanged,
                    onColorChanged: onColorChanged,
                    onElectricCarChanged: onElectricCarChanged,
                    isEdit: true,
                  ),
                ],
              ),
            ),
            // Actions
            _buildActions(
              onCancel: onCancel,
              onSubmit: onSubmit,
              isLoadingDropdowns: isLoadingDropdowns,
              isSubmitting: isSubmitting,
              submitText: 'Cập nhật',
            ),
          ],
        ),
      ),
    );
  }

  static Widget buildDeleteDialog({
    required BuildContext context,
    required String plateNumber,
    required VoidCallback onCancel,
    required VoidCallback onDelete,
  }) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      elevation: 0,
      backgroundColor: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.red.shade100,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.warning_rounded,
                      color: Colors.red.shade600,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Xác nhận xóa',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    'Bạn có chắc chắn muốn xóa xe',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: primaryColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      plateNumber,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '?',
                    style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ),
            // Actions
            Container(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onCancel,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey.shade600,
                        side: BorderSide(color: Colors.grey.shade300),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: const Text('Hủy'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onDelete,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red.shade600,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 2,
                      ),
                      child: const Text('Xóa'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _buildHeader({required IconData icon, required String title}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryColor, secondaryColor],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildErrorMessage(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(
            Icons.error_outline_rounded,
            color: Colors.red.shade600,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: Colors.red.shade700,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildActions({
    required VoidCallback onCancel,
    required VoidCallback onSubmit,
    required bool isLoadingDropdowns,
    required bool isSubmitting,
    required String submitText,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: onCancel,
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.grey.shade600,
                side: BorderSide(color: Colors.grey.shade300),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text('Hủy'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: isLoadingDropdowns || isSubmitting ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                side: BorderSide(
                  color: primaryColor.withOpacity(0.4),
                  width: 1.5,
                ),
                elevation: 2,
              ),
              child: isSubmitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(submitText),
            ),
          ),
        ],
      ),
    );
  }
}
