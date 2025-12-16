import 'package:flutter/material.dart';
import 'package:mobile/services/favourities_service.dart';
import 'package:mobile/services/parking_lot_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';

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
        final detailData = detailRes['data'] as Map<String, dynamic>?;
        if (detailData != null) {
          _parkingLotDetails[parkingLotId] = detailData;
        }
      } catch (e) {
        // Ignore individual fetch errors; still show the id
        debugPrint('Failed to load parking lot detail $parkingLotId: $e');
      }
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

          final title =
              detail?['name'] ??
              detail?['parkingLotName'] ??
              'Bãi đỗ $parkingLotId';
          final address = detail?['address'] ?? detail?['addressLine'] ?? '';

          return Card(
            elevation: 2,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListTile(
              leading: const CircleAvatar(
                backgroundColor: Colors.green,
                child: Icon(Icons.local_parking, color: Colors.white),
              ),
              title: Text(title),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (address.isNotEmpty) Text(address),
                  if (createdAt != null)
                    Text(
                      'Thêm lúc: $createdAt',
                      style: const TextStyle(fontSize: 12),
                    ),
                ],
              ),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: parkingLotId.isEmpty
                    ? null
                    : () => _confirmRemove(parkingLotId),
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
