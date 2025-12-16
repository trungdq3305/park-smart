import 'package:flutter/material.dart';
import 'package:mobile/services/favourities_service.dart';
import 'package:mobile/services/parking_lot_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/screens/user/booking/booking_screen.dart';

class FavouritiesScreen extends StatefulWidget {
  const FavouritiesScreen({super.key});

  @override
  State<FavouritiesScreen> createState() => _FavouritiesScreenState();
}

class _FavouritiesScreenState extends State<FavouritiesScreen> {
  bool _isLoading = true;
  bool _isRemoving = false;
  String? _error;
  List<dynamic> _items = [];
  final Map<String, Map<String, dynamic>> _parkingLotDetails = {};
  final Set<String> _loadingDetailIds = {};

  Map<String, dynamic>? _parseDetail(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is List && data.isNotEmpty && data.first is Map) {
      return Map<String, dynamic>.from(data.first as Map);
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final res = await FavouritiesService.getMyFavourites();
      final data = res['data'] as List<dynamic>? ?? [];
      _items = data;

      await _loadParkingLotDetails(data);

      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadParkingLotDetails(List<dynamic> favourites) async {
    for (final item in favourites) {
      final parkingLotId = item['parkingLotId']?.toString();
      if (parkingLotId == null ||
          _parkingLotDetails.containsKey(parkingLotId)) {
        continue;
      }

      try {
        final detailRes = await ParkingLotService.getParkingLotById(
          parkingLotId,
        );
        final detailData = _parseDetail(detailRes['data']);
        if (detailData != null) {
          _parkingLotDetails[parkingLotId] = detailData;
        }
      } catch (e) {
        // Ignore individual fetch errors; still show the id
        debugPrint('Failed to load parking lot detail $parkingLotId: $e');
      }
    }
  }

  Future<void> _ensureDetail(String parkingLotId) async {
    if (_parkingLotDetails.containsKey(parkingLotId)) return;
    if (_loadingDetailIds.contains(parkingLotId)) return;
    _loadingDetailIds.add(parkingLotId);
    try {
      final detailRes = await ParkingLotService.getParkingLotById(parkingLotId);
      final detailData = _parseDetail(detailRes['data']);
      if (detailData != null && mounted) {
        setState(() {
          _parkingLotDetails[parkingLotId] = detailData;
        });
      }
    } catch (e) {
      debugPrint('Failed to fetch detail lazily for $parkingLotId: $e');
    } finally {
      _loadingDetailIds.remove(parkingLotId);
    }
  }

  Future<void> _removeFavourite(String parkingLotId) async {
    if (_isRemoving) return;
    setState(() {
      _isRemoving = true;
    });
    try {
      await FavouritiesService.removeFromFavourites(parkingLotId: parkingLotId);
      await _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Xóa thất bại: $e')));
    } finally {
      if (!mounted) return;
      setState(() {
        _isRemoving = false;
      });
    }
  }

  Future<void> _confirmRemove(String parkingLotId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa khỏi yêu thích?'),
        content: const Text(
          'Bạn chắc chắn muốn xóa bãi đỗ này khỏi danh sách?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      await _removeFavourite(parkingLotId);
    }
  }

  Widget _buildEmpty() {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Text(
          'Chưa có bãi đỗ nào trong danh sách yêu thích.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 16),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Không thể tải danh sách yêu thích.',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Text(_error ?? 'Đã có lỗi xảy ra'),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadData, child: const Text('Thử lại')),
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
    if (_items.isEmpty) return _buildEmpty();

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        itemCount: _items.length,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemBuilder: (context, index) {
          final item = _items[index];
          final parkingLotId = item['parkingLotId']?.toString() ?? '';
          final createdAt = item['createdAt']?.toString();
          final detail = _parkingLotDetails[parkingLotId];

          if (detail == null && parkingLotId.isNotEmpty) {
            _ensureDetail(parkingLotId);
          }

          final title =
              detail?['name'] ??
              detail?['parkingLotName'] ??
              'Bãi đỗ $parkingLotId';
          final addressObj = detail?['addressId'] ?? detail?['address'];
          final fullAddress = addressObj?['fullAddress']?.toString() ?? '';
          final wardName =
              addressObj?['wardId']?['wardName']?.toString() ?? detail?['ward'];
          final address = [
            if (fullAddress.isNotEmpty) fullAddress,
            if (wardName.isNotEmpty) wardName,
          ].join(', ');
          final available =
              detail?['availableSpots'] ??
              detail?['displayAvailableSpots'] ??
              detail?['availableSlot'] ??
              detail?['available'];
          final total =
              detail?['totalSpots'] ??
              detail?['totalCapacityEachLevel'] ??
              detail?['totalSlot'] ??
              detail?['capacity'];
          final floors =
              detail?['totalLevel'] ??
              detail?['floorCount'] ??
              detail?['totalFloors'];

          return Card(
            elevation: 2,
            margin: const EdgeInsets.symmetric(vertical: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: parkingLotId.isEmpty
                  ? null
                  : () {
                      final parkingLotData =
                          detail ?? {'_id': parkingLotId, 'id': parkingLotId};
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              BookingScreen(parkingLot: parkingLotData),
                        ),
                      );
                    },
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CircleAvatar(
                      backgroundColor: Colors.green,
                      child: Icon(Icons.local_parking, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                icon: const Icon(
                                  Icons.delete_outline,
                                  color: Colors.red,
                                ),
                                onPressed: parkingLotId.isEmpty
                                    ? null
                                    : () => _confirmRemove(parkingLotId),
                              ),
                            ],
                          ),
                          if (address.isNotEmpty)
                            Text(
                              address,
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              if (available != null && total != null)
                                _InfoChip(
                                  icon: Icons.event_available,
                                  label: 'Còn $available/$total chỗ',
                                ),
                              if (floors != null)
                                _InfoChip(
                                  icon: Icons.layers,
                                  label: 'Số tầng: $floors',
                                ),
                            ],
                          ),
                          if (createdAt != null) ...[
                            const SizedBox(height: 6),
                            Text(
                              'Thêm lúc: $createdAt',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      appBar: AppBar(
        title: const Text('Bãi xe yêu thích'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      showBottomNav: false,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _buildError()
            : _buildList(),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.green),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: Colors.green),
          ),
        ],
      ),
    );
  }
}
