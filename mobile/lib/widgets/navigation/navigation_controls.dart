import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class NavigationControls extends StatelessWidget {
  final VoidCallback? onStartNavigation;
  final VoidCallback? onStopNavigation;
  final VoidCallback? onShowAlternatives;
  final bool isNavigating;
  final bool hasRoute;
  final String? estimatedTime;
  final String? estimatedDistance;
  final LatLng? destination;
  final String? destinationName;

  const NavigationControls({
    Key? key,
    this.onStartNavigation,
    this.onStopNavigation,
    this.onShowAlternatives,
    this.isNavigating = false,
    this.hasRoute = false,
    this.estimatedTime,
    this.estimatedDistance,
    this.destination,
    this.destinationName,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Route info
          if (hasRoute) ...[_buildRouteInfo(), const SizedBox(height: 12)],

          // Navigation buttons
          Row(
            children: [
              // Start/Stop navigation button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: isNavigating
                      ? onStopNavigation
                      : onStartNavigation,
                  icon: Icon(
                    isNavigating ? Icons.stop : Icons.navigation,
                    color: Colors.white,
                  ),
                  label: Text(
                    isNavigating ? 'Dừng chỉ đường' : 'Bắt đầu chỉ đường',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isNavigating ? Colors.red : Colors.green,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 12),

              // Alternative routes button
              if (hasRoute && !isNavigating)
                Container(
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.green),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    onPressed: onShowAlternatives,
                    icon: const Icon(Icons.route, color: Colors.green),
                    tooltip: 'Tuyến đường khác',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRouteInfo() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.route, color: Colors.blue, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (destinationName != null)
                  Text(
                    'Đến: $destinationName',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 4),
                if (estimatedTime != null && estimatedDistance != null)
                  Row(
                    children: [
                      Icon(Icons.access_time, color: Colors.blue, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        estimatedTime!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.blue,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(Icons.straighten, color: Colors.blue, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        estimatedDistance!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Colors.blue,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
