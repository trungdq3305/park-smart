import 'package:flutter/material.dart';

class SubscriptionPaginationControls extends StatelessWidget {
  const SubscriptionPaginationControls({
    super.key,
    required this.currentPage,
    required this.totalPages,
    required this.onPrevious,
    required this.onNext,
  });

  final int currentPage;
  final int totalPages;
  final VoidCallback onPrevious;
  final VoidCallback onNext;

  @override
  Widget build(BuildContext context) {
    if (totalPages <= 1) {
      return const SizedBox.shrink();
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          color: Colors.green,
          onPressed: currentPage > 1 ? onPrevious : null,
        ),
        Text(
          'Trang $currentPage/$totalPages',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          color: Colors.green,
          onPressed: currentPage < totalPages ? onNext : null,
        ),
      ],
    );
  }
}


