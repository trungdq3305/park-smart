import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../services/report_service.dart';
import '../../../../widgets/app_scaffold.dart';

class MyReportScreen extends StatefulWidget {
  const MyReportScreen({super.key});

  @override
  State<MyReportScreen> createState() => _MyReportScreenState();
}

class _MyReportScreenState extends State<MyReportScreen> {
  final DateFormat _dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _reports = [];

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports({bool isRefresh = false}) async {
    if (!mounted) return;
    setState(() {
      if (!isRefresh) _isLoading = true;
      if (!isRefresh) _error = null;
    });

    try {
      final res = await ReportService.getMyReports();
      final data = res['data'];

      final List<Map<String, dynamic>> list = [];

      void addList(dynamic source) {
        if (source is Iterable) {
          list.addAll(
            source.whereType<Map>().map(
              (e) => Map<String, dynamic>.from(e as Map),
            ),
          );
        }
      }

      if (data is List) {
        addList(data);
      } else if (data is Map) {
        if (data['data'] is List) {
          addList(data['data']);
        } else if (data.containsKey('_id') || data.containsKey('id')) {
          list.add(Map<String, dynamic>.from(data));
        }
      }

      if (!mounted) return;
      setState(() {
        _reports = list;
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

  String _formatDate(dynamic value) {
    if (value == null) return '';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return value.toString();
    return _dateFormat.format(parsed.toLocal());
  }

  Color _getStatusColor(String? status) {
    final upper = status?.toUpperCase() ?? '';
    if (upper == 'PENDING') return Colors.orange.shade600;
    if (upper == 'IN_PROGRESS') return Colors.blue.shade600;
    if (upper == 'RESOLVED') return Colors.green.shade600;
    if (upper == 'REJECTED') return Colors.red.shade600;
    return Colors.grey.shade500;
  }

  String _getStatusText(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Đang chờ xử lý';
      case 'IN_PROGRESS':
        return 'Đang xử lý';
      case 'RESOLVED':
        return 'Đã xử lý';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return status?.toString() ?? 'Không rõ';
    }
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
                    onPressed: () => _loadReports(),
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

  Widget _buildList() {
    if (_reports.isEmpty) {
      return _buildState(
        icon: Icons.report_gmailerrorred_outlined,
        title: 'Chưa có báo cáo nào',
        message: 'Bạn chưa gửi báo cáo nào về bãi đỗ xe.',
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadReports(isRefresh: true),
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: _reports.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final r = _reports[index];
          final rawStatus =
              r['status']?.toString() ?? r['reportStatus']?.toString();
          final isProcessed = r['isProcessed'] == true;
          final effectiveStatus = (rawStatus != null && rawStatus.isNotEmpty)
              ? rawStatus
              : (isProcessed ? 'RESOLVED' : 'PENDING');
          final statusColor = _getStatusColor(effectiveStatus);
          final statusText = _getStatusText(effectiveStatus);

          final category = r['categoryId'] ?? r['category'];
          final categoryName = category is Map
              ? (category['name'] ?? '').toString()
              : (r['categoryName'] ?? '').toString();
          final categoryDescription = category is Map
              ? (category['description'] ?? '').toString()
              : (r['categoryDescription'] ?? '').toString();

          final parkingLot = r['parkingLotId'] ?? r['parkingLot'];
          final parkingLotName = parkingLot is Map
              ? (parkingLot['name'] ?? '').toString()
              : (r['parkingLotName'] ?? '').toString();

          final createdAt = _formatDate(r['createdAt'] ?? r['createdDate']);
          final reason = (r['reason'] ?? r['content'] ?? '').toString();

          return Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.12),
                  spreadRadius: 0,
                  blurRadius: 15,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.grey.withOpacity(0.08),
                  spreadRadius: 0,
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        statusColor.withOpacity(0.15),
                        statusColor.withOpacity(0.08),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          Icons.flag_outlined,
                          color: statusColor,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              categoryName.isNotEmpty
                                  ? categoryName
                                  : 'Báo cáo bãi đỗ xe',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Colors.grey.shade900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (parkingLotName.isNotEmpty)
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.local_parking,
                                    size: 16,
                                    color: Colors.grey.shade700,
                                  ),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      parkingLotName,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.grey.shade800,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            if (createdAt.isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(
                                    Icons.access_time,
                                    size: 14,
                                    color: Colors.grey.shade600,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    createdAt,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey.shade700,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: statusColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          statusText,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Content
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (categoryDescription.isNotEmpty) ...[
                        Text(
                          'Loại báo cáo',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          categoryDescription,
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade800,
                            height: 1.4,
                          ),
                        ),
                        const SizedBox(height: 10),
                      ],
                      Text(
                        'Nội dung bạn đã gửi',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Text(
                          reason.isNotEmpty
                              ? reason
                              : 'Không có nội dung chi tiết.',
                          style: TextStyle(
                            fontSize: 13,
                            color: Colors.grey.shade900,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
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
        title: const Text('Báo cáo của tôi'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      showBottomNav: false,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _buildState(
                icon: Icons.error_outline,
                title: 'Không thể tải danh sách báo cáo',
                message: _error,
                showRetry: true,
              )
            : _buildList(),
      ),
    );
  }
}
