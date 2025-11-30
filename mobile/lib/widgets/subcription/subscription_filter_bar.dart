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
    return SizedBox(
      height: 48,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(
          children: [
            _buildChip(
              label: 'Tất cả',
              statusCode: null,
              color: Colors.green,
            ),
            const SizedBox(width: 8),
            for (final status in statuses) ...[
              _buildChip(
                label: getStatusText(status),
                statusCode: status,
                color: getStatusColor(status),
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
    required Color color,
  }) {
    final bool isSelected = selectedStatus == statusCode;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: color,
      labelPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey.shade700,
        fontWeight: FontWeight.w600,
      ),
      backgroundColor: Colors.grey.shade100,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: isSelected ? color : Colors.grey.shade300),
      ),
      onSelected: (_) => onStatusChanged(statusCode),
    );
  }
}


