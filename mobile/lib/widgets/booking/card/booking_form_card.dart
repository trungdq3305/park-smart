import 'package:flutter/material.dart';

class BookingFormCard extends StatelessWidget {
  final TextEditingController durationController;
  final String? selectedSpaceInfo;
  final bool isSelectedSpaceElectric;
  final String Function() calculateEstimatedCost;

  const BookingFormCard({
    super.key,
    required this.durationController,
    this.selectedSpaceInfo,
    required this.isSelectedSpaceElectric,
    required this.calculateEstimatedCost,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
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
          if (selectedSpaceInfo != null) ...[
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
                    'Vị trí đã chọn: $selectedSpaceInfo',
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
            controller: durationController,
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
                  'Chi phí dự kiến: ${calculateEstimatedCost()} VND',
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
    );
  }
}
