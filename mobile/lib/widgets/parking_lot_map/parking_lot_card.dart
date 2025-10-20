import 'package:flutter/material.dart';

class ParkingLotCard extends StatelessWidget {
  final Map<String, dynamic> parkingLot;
  final int index;
  final VoidCallback onTap;

  const ParkingLotCard({
    super.key,
    required this.parkingLot,
    required this.index,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Extract data from nested structure
    final addressId = parkingLot['addressId'];
    final availableSpots = parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel = parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final occupancyRate = totalSlots > 0 ? (availableSpots / totalSlots) : 0.0;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final openTime = parkingLot['openTime'] ?? 'N/A';
    final closeTime = parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = parkingLot['is24Hours'] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(index, occupancyRate),
              const SizedBox(height: 12),
              _buildAddress(address),
              const SizedBox(height: 8),
              _buildOperatingHours(is24Hours, openTime, closeTime),
              const SizedBox(height: 12),
              _buildAvailabilityInfo(availableSpots, totalSlots, occupancyRate),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(int index, double occupancyRate) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: Colors.green.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            'Bãi đỗ xe ${index + 1}',
            style: TextStyle(
              color: Colors.green.shade700,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(
            horizontal: 8,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            color: occupancyRate > 0.3
                ? Colors.green.shade100
                : Colors.red.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            occupancyRate > 0.3 ? 'Còn chỗ' : 'Gần hết chỗ',
            style: TextStyle(
              color: occupancyRate > 0.3
                  ? Colors.green.shade700
                  : Colors.red.shade700,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAddress(String address) {
    return Row(
      children: [
        Icon(
          Icons.location_on,
          color: Colors.grey.shade600,
          size: 16,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            address,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOperatingHours(bool is24Hours, String openTime, String closeTime) {
    return Row(
      children: [
        Icon(
          Icons.access_time,
          color: Colors.grey.shade600,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(
          is24Hours
              ? 'Mở cửa 24/7'
              : 'Giờ mở cửa: $openTime - $closeTime',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildAvailabilityInfo(int availableSpots, int totalSlots, double occupancyRate) {
    return Row(
      children: [
        Icon(
          Icons.local_parking,
          color: Colors.green.shade600,
          size: 16,
        ),
        const SizedBox(width: 8),
        Text(
          '$availableSpots/$totalSlots chỗ trống',
          style: TextStyle(
            fontSize: 14,
            color: Colors.green.shade700,
            fontWeight: FontWeight.w600,
          ),
        ),
        const Spacer(),
        Text(
          '${(occupancyRate * 100).toInt()}% còn trống',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }
}
