import 'package:flutter/material.dart';

class ParkingSpaceSelector extends StatefulWidget {
  final List<Map<String, dynamic>> parkingSpaces;
  final bool isLoadingSpaces;
  final List<int> availableLevels;
  final int selectedLevel;
  final String? selectedSpaceId;
  final Function(int) onLevelChanged;
  final Function(String?) onSpaceSelected;

  const ParkingSpaceSelector({
    super.key,
    required this.parkingSpaces,
    required this.isLoadingSpaces,
    required this.availableLevels,
    required this.selectedLevel,
    required this.selectedSpaceId,
    required this.onLevelChanged,
    required this.onSpaceSelected,
  });

  @override
  State<ParkingSpaceSelector> createState() => _ParkingSpaceSelectorState();
}

class _ParkingSpaceSelectorState extends State<ParkingSpaceSelector> {
  @override
  Widget build(BuildContext context) {
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
              Icon(Icons.grid_view, color: Colors.green.shade600, size: 24),
              const SizedBox(width: 8),
              const Text(
                'Chọn vị trí đỗ xe',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Level selector with horizontal scroll
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Tầng:',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: widget.availableLevels.length,
                  itemBuilder: (context, index) {
                    final level = widget.availableLevels[index];
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text('Tầng $level'),
                        selected: widget.selectedLevel == level,
                        onSelected: (selected) {
                          if (selected) widget.onLevelChanged(level);
                        },
                        selectedColor: Colors.green.shade100,
                        labelStyle: TextStyle(
                          color: widget.selectedLevel == level
                              ? Colors.green.shade700
                              : Colors.grey.shade700,
                          fontWeight: widget.selectedLevel == level
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Parking spaces grid
          if (widget.isLoadingSpaces)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            )
          else if (widget.parkingSpaces.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              child: const Center(
                child: Text(
                  'Không có vị trí đỗ xe nào',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            )
          else
            _buildParkingSpacesGrid(),
        ],
      ),
    );
  }

  /// Build parking spaces grid like cinema seats
  Widget _buildParkingSpacesGrid() {
    // Group spaces by row for better display
    Map<String, List<Map<String, dynamic>>> spacesByRow = {};

    for (var space in widget.parkingSpaces) {
      final row = space['row']?.toString() ?? 'A';
      if (!spacesByRow.containsKey(row)) {
        spacesByRow[row] = [];
      }
      spacesByRow[row]!.add(space);
    }

    // Sort rows alphabetically
    final sortedRows = spacesByRow.keys.toList()..sort();

    return Column(
      children: [
        // Legend
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildLegendItem(Colors.green, 'Trống'),
              _buildLegendItem(Colors.red, 'Đã đặt'),
              _buildLegendItem(Colors.blue, 'Đã chọn'),
              _buildLegendItem(Colors.grey, 'Không khả dụng'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Grid
        ...sortedRows.map(
          (row) => Column(
            children: [
              // Row label
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'Hàng $row',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
              // Spaces in row
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: spacesByRow[row]!
                    .map((space) => _buildSpaceButton(space))
                    .toList(),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Build legend item
  Widget _buildLegendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.grey.shade300),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
        ),
      ],
    );
  }

  /// Build individual space button
  Widget _buildSpaceButton(Map<String, dynamic> space) {
    final spaceId = space['_id'] ?? space['id'];
    final spaceCode =
        space['code'] ?? space['spaceNumber'] ?? space['number'] ?? '?';
    final isAvailable =
        space['parkingSpaceStatusId']?['status'] == 'Trống' ||
        (space['isAvailable'] ?? true);
    final isOccupied =
        space['parkingSpaceStatusId']?['status'] == 'Đã đặt' ||
        (space['isOccupied'] ?? false);
    final isSelected = widget.selectedSpaceId == spaceId;

    Color backgroundColor;
    Color borderColor;
    Color textColor;

    if (isSelected) {
      backgroundColor = Colors.blue.shade100;
      borderColor = Colors.blue;
      textColor = Colors.blue.shade700;
    } else if (isOccupied) {
      backgroundColor = Colors.red.shade50;
      borderColor = Colors.red.shade300;
      textColor = Colors.red.shade700;
    } else if (!isAvailable) {
      backgroundColor = Colors.grey.shade200;
      borderColor = Colors.grey.shade400;
      textColor = Colors.grey.shade600;
    } else {
      backgroundColor = Colors.green.shade50;
      borderColor = Colors.green.shade300;
      textColor = Colors.green.shade700;
    }

    return GestureDetector(
      onTap: () {
        if (isAvailable && !isOccupied) {
          widget.onSpaceSelected(isSelected ? null : spaceId);
        }
      },
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor, width: isSelected ? 2 : 1),
        ),
        child: Center(
          child: Text(
            spaceCode.toString(),
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }
}
