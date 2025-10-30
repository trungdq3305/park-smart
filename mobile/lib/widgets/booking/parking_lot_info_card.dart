import 'package:flutter/material.dart';

class ParkingLotInfoCard extends StatelessWidget {
  final Map<String, dynamic> parkingLot;

  const ParkingLotInfoCard({
    super.key,
    required this.parkingLot,
  });

  @override
  Widget build(BuildContext context) {
    // Extract data from parking lot
    final addressId = parkingLot['addressId'];
    final availableSpots = parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel = parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final wardName = addressId?['wardId']?['wardName'] ?? '';
    final openTime = parkingLot['openTime'] ?? 'N/A';
    final closeTime = parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = parkingLot['is24Hours'] ?? false;
    final maxVehicleHeight = parkingLot['maxVehicleHeight'] ?? 0;
    final maxVehicleWidth = parkingLot['maxVehicleWidth'] ?? 0;
    final electricCarPercentage = parkingLot['electricCarPercentage'] ?? 0;
    final parkingLotStatus = parkingLot['parkingLotStatus'] ?? 'N/A';

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
                Icons.local_parking,
                color: Colors.green.shade600,
                size: 24,
              ),
              const SizedBox(width: 8),
              const Text(
                'Thông tin bãi đỗ xe',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on,
                color: Colors.grey.shade600,
                size: 20,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      address,
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade700,
                      ),
                    ),
                    if (wardName.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        wardName,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Operating hours
          Row(
            children: [
              Icon(
                Icons.access_time,
                color: Colors.grey.shade600,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                is24Hours
                    ? 'Mở cửa 24/7'
                    : 'Giờ mở cửa: $openTime - $closeTime',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Availability
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: availableSpots > 0
                  ? Colors.green.shade50
                  : Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: availableSpots > 0
                    ? Colors.green.shade200
                    : Colors.red.shade200,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  availableSpots > 0
                      ? Icons.check_circle
                      : Icons.warning,
                  color: availableSpots > 0
                      ? Colors.green
                      : Colors.red,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  availableSpots > 0
                      ? 'Còn $availableSpots/$totalSlots chỗ trống'
                      : 'Hết chỗ trống',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: availableSpots > 0
                        ? Colors.green.shade700
                        : Colors.red.shade700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Vehicle size limits
          Row(
            children: [
              Icon(
                Icons.directions_car,
                color: Colors.grey.shade600,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Giới hạn kích thước: ${maxVehicleHeight}m x ${maxVehicleWidth}m',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Electric car support
          if (electricCarPercentage > 0) ...[
            Row(
              children: [
                Icon(
                  Icons.electric_car,
                  color: Colors.green.shade600,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Hỗ trợ xe điện: $electricCarPercentage%',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],

          // Total levels info
          Row(
            children: [
              Icon(
                Icons.layers,
                color: Colors.grey.shade600,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Tổng số tầng: $totalLevel',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Parking lot status
          Row(
            children: [
              Icon(
                Icons.verified,
                color: parkingLotStatus == 'Đã duyệt'
                    ? Colors.green
                    : Colors.orange,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'Trạng thái: $parkingLotStatus',
                style: TextStyle(
                  fontSize: 14,
                  color: parkingLotStatus == 'Đã duyệt'
                      ? Colors.green.shade700
                      : Colors.orange.shade700,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
