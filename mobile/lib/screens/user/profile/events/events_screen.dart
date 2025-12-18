import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:mobile/services/event_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';

enum EventFilter { all, upcoming }

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final _dateFormat = DateFormat('dd/MM/yyyy HH:mm');
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _events = [];
  EventFilter _filter = EventFilter.upcoming;
  bool _isDetailLoading = false;

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents({bool isRefresh = false}) async {
    if (!mounted) return;
    setState(() {
      if (!isRefresh) _isLoading = true;
      if (!isRefresh) _error = null;
    });

    try {
      final res = _filter == EventFilter.upcoming
          ? await EventService.getUpcomingEvents()
          : await EventService.getEvents();
      final data = res['data'];
      final list = data is List
          ? data
                .whereType<Map>()
                .map((e) => Map<String, dynamic>.from(e))
                .toList()
          : <Map<String, dynamic>>[];
      if (!mounted) return;
      setState(() {
        _events = list;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _openEventDetail(
    String id, {
    Map<String, dynamic>? fallback,
  }) async {
    setState(() => _isDetailLoading = true);
    Map<String, dynamic>? detail;
    try {
      final res = await EventService.getEventById(id);
      final data = res['data'];
      if (data is Map<String, dynamic>) {
        detail = data;
      } else if (data is List && data.isNotEmpty && data.first is Map) {
        detail = Map<String, dynamic>.from(data.first as Map);
      }
    } catch (e) {
      debugPrint('Error fetching event detail: $e');
      detail = fallback;
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Không thể tải chi tiết sự kiện: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isDetailLoading = false);
    }

    if (!mounted || detail == null) return;

    final promotions =
        (detail['promotions'] as List?)
            ?.whereType<Map>()
            .map((p) => Map<String, dynamic>.from(p))
            .toList() ??
        [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    detail?['title']?.toString() ?? 'Sự kiện',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _InfoRow(
                    icon: Icons.access_time,
                    text:
                        '${_formatDate(detail?['startDate'])} - ${_formatDate(detail?['endDate'])}',
                  ),
                  if ((detail?['location'] ?? '').toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: _InfoRow(
                        icon: Icons.place,
                        text: (detail?['location'] ?? '').toString(),
                      ),
                    ),
                  if ((detail?['description'] ?? '').toString().isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 10),
                      child: Text(
                        (detail?['description'] ?? '').toString(),
                        style: const TextStyle(fontSize: 13, height: 1.5),
                      ),
                    ),
                  const SizedBox(height: 12),
                  if (promotions.isNotEmpty) ...[
                    const Text(
                      'Khuyến mãi',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...promotions.map(
                      (p) => Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p['name']?.toString() ?? 'Khuyến mãi',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                              ),
                            ),
                            if ((p['description'] ?? '').toString().isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  p['description'].toString(),
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Colors.black87,
                                  ),
                                ),
                              ),
                            const SizedBox(height: 6),
                            _InfoRow(
                              icon: Icons.calendar_today,
                              text:
                                  '${_formatDate(p['startDate'])} - ${_formatDate(p['endDate'])}',
                            ),
                            _InfoRow(
                              icon: Icons.percent,
                              text:
                                  'Giảm: ${p['discountValue'] ?? ''}${p['discountType'] == 'Percentage' ? '%' : ''} '
                                  '${p['maxDiscountAmount'] != null ? '(Tối đa ${p['maxDiscountAmount']})' : ''}',
                            ),
                            _InfoRow(
                              icon: Icons.tag,
                              text: 'Mã: ${p['code'] ?? ''}',
                            ),
                            _InfoRow(
                              icon: Icons.bar_chart,
                              text:
                                  'Số lần dùng: ${p['currentUsageCount'] ?? 0}/${p['totalUsageLimit'] ?? '-'}',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ] else
                    const Text(
                      'Không có khuyến mãi đính kèm.',
                      style: TextStyle(fontSize: 13, color: Colors.grey),
                    ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _formatDate(dynamic value) {
    if (value == null) return '';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return _dateFormat.format(parsed.toLocal());
  }

  Widget _buildState({
    required IconData icon,
    required String title,
    String? message,
    bool showRetry = false,
  }) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(
          height: MediaQuery.of(context).size.height * 0.5,
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 48, color: Colors.grey.shade500),
                const SizedBox(height: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (message != null) ...[
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      message,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
                if (showRetry) ...[
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _loadEvents(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Thử lại'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: Container(
        color: Colors.white,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Row(
          children: [
            _FilterChip(
              label: 'Sắp tới',
              selected: _filter == EventFilter.upcoming,
              onTap: () {
                if (_filter != EventFilter.upcoming) {
                  setState(() => _filter = EventFilter.upcoming);
                  _loadEvents();
                }
              },
            ),
            const SizedBox(width: 8),
            _FilterChip(
              label: 'Tất cả',
              selected: _filter == EventFilter.all,
              onTap: () {
                if (_filter != EventFilter.all) {
                  setState(() => _filter = EventFilter.all);
                  _loadEvents();
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
    if (_events.isEmpty) {
      return _buildState(
        icon: Icons.event_busy,
        title: 'Chưa có sự kiện',
        message: 'Hiện tại không có sự kiện nào.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadEvents(isRefresh: true),
      child: ListView.separated(
        itemCount: _events.length,
        padding: const EdgeInsets.fromLTRB(16, 64, 16, 24),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final e = _events[index];
          final title = e['title']?.toString() ?? 'Sự kiện';
          final description = e['description']?.toString() ?? '';
          final location = e['location']?.toString() ?? '';
          final includedPromotions = e['includedPromotions'] == true;
          final start = _formatDate(e['startDate']);
          final end = _formatDate(e['endDate']);
          final id = e['_id']?.toString() ?? e['id']?.toString() ?? '';

          return Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Colors.white, Color(0xFFF9FBFF)],
              ),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
              border: Border.all(color: Colors.green, width: 1),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
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
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      if (includedPromotions)
                        _InfoChip(
                          icon: Icons.local_offer_rounded,
                          label: 'Kèm khuyến mãi',
                          color: Colors.orange,
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _InfoRow(icon: Icons.access_time, text: '$start - $end'),
                  if (location.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: _InfoRow(icon: Icons.place, text: location),
                    ),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Text(
                      description,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        height: 1.4,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                  const SizedBox(height: 10),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton.icon(
                      onPressed: id.isEmpty
                          ? null
                          : () => _openEventDetail(id, fallback: e),
                      icon: const Icon(Icons.remove_red_eye, size: 16),
                      label: const Text('Xem chi tiết'),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.green.shade700,
                      ),
                    ),
                  ),
                ],
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
        title: const Text('Sự kiện'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      showBottomNav: false,
      body: Stack(
        children: [
          SafeArea(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? _buildState(
                    icon: Icons.error_outline,
                    title: 'Không thể tải sự kiện',
                    message: _error,
                    showRetry: true,
                  )
                : _buildList(),
          ),
          _buildFilterBar(),
          if (_isDetailLoading)
            Positioned.fill(
              child: Container(
                color: Colors.black.withOpacity(0.05),
                child: const Center(child: CircularProgressIndicator()),
              ),
            ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.green : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? Colors.green : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.black87,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: Colors.grey.shade700),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: Colors.black87),
          ),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _InfoChip({
    required this.icon,
    required this.label,
    this.color = Colors.green,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 12, color: color)),
        ],
      ),
    );
  }
}
