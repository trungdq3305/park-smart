import 'package:flutter/material.dart';

class ElectricCarMessage extends StatelessWidget {
  final bool isVisible;

  const ElectricCarMessage({
    super.key,
    required this.isVisible,
  });

  @override
  Widget build(BuildContext context) {
    if (!isVisible) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.shade200),
      ),
      child: Row(
        children: [
          Icon(
            Icons.electric_car,
            color: Colors.orange.shade600,
            size: 20,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Đây là vị trí dành cho xe điện',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.orange.shade700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
