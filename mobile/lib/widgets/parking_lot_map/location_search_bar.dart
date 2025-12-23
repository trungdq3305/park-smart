import 'package:flutter/material.dart';

class LocationSearchBar extends StatelessWidget {
  final String currentAddress;
  final bool showMapFallback;
  final VoidCallback onToggleView;
  final VoidCallback onRefresh;

  const LocationSearchBar({
    super.key,
    required this.currentAddress,
    required this.showMapFallback,
    required this.onToggleView,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.location_on, color: Colors.green.shade600),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Vị trí hiện tại',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                Text(
                  currentAddress,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          // IconButton(
          //   onPressed: onToggleView,
          //   icon: Icon(showMapFallback ? Icons.map : Icons.list),
          // ),
          IconButton(onPressed: onRefresh, icon: const Icon(Icons.refresh)),
        ],
      ),
    );
  }
}
