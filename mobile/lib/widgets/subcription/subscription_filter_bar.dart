import 'package:flutter/material.dart';

class SubscriptionFilterBar extends StatelessWidget {
  const SubscriptionFilterBar({
    super.key,
    required this.statuses,
    required this.selectedStatus,
    required this.getStatusText,
    required this.getStatusColor,
    required this.onStatusChanged,
  });

  final List<String> statuses;
  final String? selectedStatus;
  final String Function(String?) getStatusText;
  final Color Function(String?) getStatusColor;
  final ValueChanged<String?> onStatusChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildChip(
              label: 'Tất cả',
              statusCode: null,
            ),
            const SizedBox(width: 8),
            for (final status in statuses) ...[
              _buildChip(
                label: getStatusText(status),
                statusCode: status,
              ),
              const SizedBox(width: 8),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildChip({
    required String label,
    required String? statusCode,
  }) {
    final bool isSelected = selectedStatus == statusCode;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          onStatusChanged(statusCode);
        }
      },
      selectedColor: Colors.green.shade100,
      backgroundColor: Colors.grey.shade100,
      labelStyle: TextStyle(
        color: isSelected ? Colors.green.shade700 : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      side: BorderSide(
        color: isSelected ? Colors.green.shade600 : Colors.grey.shade300,
        width: isSelected ? 2 : 1,
      ),
    );
  }
}


