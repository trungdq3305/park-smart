import 'package:flutter/material.dart';

class ReservationEmptyState extends StatelessWidget {
  final String? selectedStatusFilter;
  final String Function(String?) getStatusText;

  const ReservationEmptyState({
    super.key,
    required this.selectedStatusFilter,
    required this.getStatusText,
  });

  @override
  Widget build(BuildContext context) {
    final bool isAll = selectedStatusFilter == null;
    final String title =
        isAll ? 'Chưa có đặt chỗ' : 'Không có đặt chỗ phù hợp';
    final String description = isAll
        ? 'Bạn chưa có đặt chỗ nào. Hãy đặt chỗ để sử dụng dịch vụ.'
        : 'Không tìm thấy đặt chỗ với trạng thái "${getStatusText(selectedStatusFilter)}".';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.event_available_outlined,
                size: 64,
                color: Colors.green.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}


