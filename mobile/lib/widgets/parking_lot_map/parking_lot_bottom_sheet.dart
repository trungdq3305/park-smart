import 'package:flutter/material.dart';

class ParkingLotBottomSheet extends StatelessWidget {
  final Map<String, dynamic> parkingLot;
  final VoidCallback onNavigate;
  final VoidCallback onBook;

  const ParkingLotBottomSheet({
    super.key,
    required this.parkingLot,
    required this.onNavigate,
    required this.onBook,
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
    // final openTime = parkingLot['openTime'] ?? 'N/A';
    // final closeTime = parkingLot['closeTime'] ?? 'N/A';
    // final is24Hours = parkingLot['is24Hours'] ?? false;

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHandleBar(),
          const SizedBox(height: 20),
          _buildTitle(),
          const SizedBox(height: 8),
          _buildAddress(address),
          const SizedBox(height: 8),
          // _buildOperatingHours(is24Hours, openTime, closeTime),
          // const SizedBox(height: 16),
          _buildAvailabilityStatus(availableSpots, totalSlots, occupancyRate),
          const SizedBox(height: 16),
          _buildPriceInfo(),
          const SizedBox(height: 16),
          _buildActionButtons(context),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildHandleBar() {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: Colors.grey.shade300,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildTitle() {
    return const Text(
      'Bãi đỗ xe',
      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildAddress(String address) {
    return Row(
      children: [
        Icon(Icons.location_on, color: Colors.grey.shade600, size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            address,
            style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
          ),
        ),
      ],
    );
  }

  // Widget _buildOperatingHours(bool is24Hours, String openTime, String closeTime) {
  //   return Row(
  //     children: [
  //       Icon(Icons.access_time, color: Colors.grey.shade600, size: 20),
  //       const SizedBox(width: 8),
  //       Text(
  //         is24Hours
  //             ? 'Mở cửa 24/7'
  //             : 'Giờ mở cửa: $openTime - $closeTime',
  //         style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
  //       ),
  //     ],
  //   );
  // }

  Widget _buildAvailabilityStatus(
    int availableSpots,
    int totalSlots,
    double occupancyRate,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: occupancyRate > 0.3 ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: occupancyRate > 0.3
              ? Colors.green.shade200
              : Colors.red.shade200,
        ),
      ),
      child: Row(
        children: [
          Icon(
            occupancyRate > 0.3 ? Icons.check_circle : Icons.warning,
            color: occupancyRate > 0.3 ? Colors.green : Colors.red,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  occupancyRate > 0.3 ? 'Còn chỗ trống' : 'Gần hết chỗ',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: occupancyRate > 0.3
                        ? Colors.green.shade700
                        : Colors.red.shade700,
                  ),
                ),
                Text(
                  '$availableSpots/$totalSlots chỗ trống',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceInfo() {
    if (parkingLot['pricePerHour'] == null) {
      return const SizedBox.shrink();
    }

    return Row(
      children: [
        Icon(Icons.attach_money, color: Colors.grey.shade600, size: 20),
        const SizedBox(width: 8),
        Text(
          '${parkingLot['pricePerHour']} VND/giờ',
          style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
        ),
      ],
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              onNavigate();
            },
            icon: const Icon(Icons.directions),
            label: const Text('Chỉ đường'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.green,
              side: const BorderSide(color: Colors.green),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              onBook();
            },
            icon: const Icon(Icons.book_online),
            label: const Text('Đặt chỗ'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}
