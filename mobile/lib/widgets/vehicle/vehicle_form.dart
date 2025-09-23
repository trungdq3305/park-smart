import 'package:flutter/material.dart';

class VehicleForm extends StatelessWidget {
  final TextEditingController plateNumberController;
  final String? selectedBrandId;
  final String? selectedColorId;
  final String? selectedVehicleTypeId;
  final List<Map<String, dynamic>> brands;
  final List<Map<String, dynamic>> colors;
  final List<Map<String, dynamic>> vehicleTypes;
  final ValueChanged<String?> onBrandChanged;
  final ValueChanged<String?> onColorChanged;
  final ValueChanged<String?> onVehicleTypeChanged;
  final bool isEdit;

  // App theme colors
  static const Color primaryColor = Colors.green;

  const VehicleForm({
    super.key,
    required this.plateNumberController,
    required this.selectedBrandId,
    required this.selectedColorId,
    required this.selectedVehicleTypeId,
    required this.brands,
    required this.colors,
    required this.vehicleTypes,
    required this.onBrandChanged,
    required this.onColorChanged,
    required this.onVehicleTypeChanged,
    this.isEdit = false,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Plate Number
          _buildTextField(
            controller: plateNumberController,
            labelText: 'Biển số xe',
            hintText: 'Nhập biển số xe',
            icon: Icons.directions_car_rounded,
            readOnly: isEdit,
          ),
          const SizedBox(height: 20),

          // Brand Dropdown
          _buildDropdown(
            value: selectedBrandId,
            labelText: 'Hãng xe',
            icon: Icons.business_rounded,
            items: brands.map((brand) {
              return DropdownMenuItem<String>(
                value: brand['_id'],
                child: Text(
                  brand['brandName'] ?? 'N/A',
                  style: const TextStyle(fontSize: 16),
                ),
              );
            }).toList(),
            onChanged: onBrandChanged,
          ),
          const SizedBox(height: 20),

          // Color Dropdown
          _buildDropdown(
            value: selectedColorId,
            labelText: 'Màu sắc',
            icon: Icons.palette_rounded,
            items: colors.map((color) {
              return DropdownMenuItem<String>(
                value: color['_id'],
                child: Text(
                  color['colorName'] ?? 'N/A',
                  style: const TextStyle(fontSize: 16),
                ),
              );
            }).toList(),
            onChanged: onColorChanged,
          ),
          const SizedBox(height: 20),

          // Vehicle Type Dropdown
          _buildDropdown(
            value: selectedVehicleTypeId,
            labelText: 'Loại xe',
            icon: Icons.category_rounded,
            items: vehicleTypes.map((type) {
              return DropdownMenuItem<String>(
                value: type['_id'],
                child: Text(
                  type['typeName'] ?? 'N/A',
                  style: const TextStyle(fontSize: 16),
                ),
              );
            }).toList(),
            onChanged: onVehicleTypeChanged,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String labelText,
    required String hintText,
    required IconData icon,
    bool readOnly = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        style: TextStyle(
          fontSize: 16,
          color: readOnly ? Colors.grey.shade600 : Colors.black87,
        ),
        decoration: InputDecoration(
          labelText: labelText,
          hintText: hintText,
          filled: true,
          fillColor: Colors.grey.shade50,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
          prefixIcon: Icon(icon, color: primaryColor),
          labelStyle: TextStyle(color: Colors.grey.shade600),
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String? value,
    required String labelText,
    required IconData icon,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: DropdownButtonFormField<String>(
        value: value,
        decoration: InputDecoration(
          labelText: labelText,
          filled: true,
          fillColor: Colors.grey.shade50,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: primaryColor, width: 2),
          ),
          prefixIcon: Icon(icon, color: primaryColor),
          labelStyle: TextStyle(color: Colors.grey.shade600),
        ),
        items: items,
        onChanged: onChanged,
      ),
    );
  }
}
