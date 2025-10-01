import 'package:flutter/material.dart';

class DeletedVehicleCard extends StatelessWidget {
  final Map<String, dynamic> vehicle;
  final VoidCallback onRestore;

  const DeletedVehicleCard({
    super.key,
    required this.vehicle,
    required this.onRestore,
  });

  static const Color primaryColor = Colors.green;
  static const Color cardColor = Colors.white;

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: primaryColor.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Icon(icon, size: 14, color: primaryColor),
          ),
          const SizedBox(width: 10),
          Text(
            '$label: ',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade600,
              fontSize: 13,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade800,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final plateNumber = vehicle['plateNumber'] ?? 'N/A';
    final brand = vehicle['brandId']?['brandName'] ?? 'N/A';
    final color = vehicle['colorId']?['colorName'] ?? 'N/A';
    final type = vehicle['vehicleTypeId']?['typeName'] ?? 'N/A';
    final deletedAt = vehicle['deletedAt'] ?? 'N/A';

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [cardColor, Colors.red.withOpacity(0.02)],
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header với biển số và trạng thái đã xóa
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Colors.red.withOpacity(0.3),
                                width: 1,
                              ),
                            ),
                            child: Icon(
                              Icons.directions_car_rounded,
                              color: Colors.red,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              plateNumber,
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.grey.shade800,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red.shade100,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.red.shade300,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Đã xóa',
                            style: TextStyle(
                              color: Colors.red.shade700,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Thông tin xe
                _buildInfoRow(Icons.business_rounded, 'Hãng xe', brand),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.palette_rounded, 'Màu sắc', color),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.category_rounded, 'Loại xe', type),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.access_time_rounded, 'Ngày xóa', deletedAt),

                const SizedBox(height: 16),

                // Nút khôi phục
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: onRestore,
                    icon: const Icon(Icons.restore_rounded, size: 18),
                    label: const Text('Khôi phục xe'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      side: BorderSide(
                        color: primaryColor.withOpacity(0.4),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
