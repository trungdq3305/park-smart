import 'package:flutter/material.dart';

class MapDebugIndicator extends StatelessWidget {
  final bool mapLoaded;

  const MapDebugIndicator({
    super.key,
    required this.mapLoaded,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 100,
      right: 16,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: mapLoaded ? Colors.green : Colors.red,
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          mapLoaded ? 'Map OK' : 'Map Loading...',
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ),
    );
  }
}
