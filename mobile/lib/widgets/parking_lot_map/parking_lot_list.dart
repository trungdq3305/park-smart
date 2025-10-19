import 'package:flutter/material.dart';
import 'parking_lot_card.dart';

class ParkingLotList extends StatelessWidget {
  final List<Map<String, dynamic>> parkingLots;
  final Function(Map<String, dynamic>) onParkingLotTap;

  const ParkingLotList({
    super.key,
    required this.parkingLots,
    required this.onParkingLotTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: parkingLots.length,
              itemBuilder: (context, index) {
                return ParkingLotCard(
                  parkingLot: parkingLots[index],
                  index: index,
                  onTap: () => onParkingLotTap(parkingLots[index]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(16),
          bottomRight: Radius.circular(16),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.location_on,
            color: Colors.green.shade600,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Tìm thấy ${parkingLots.length} bãi đỗ xe gần bạn',
              style: TextStyle(
                color: Colors.green.shade700,
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
