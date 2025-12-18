import 'package:flutter/material.dart';

import '../../../../services/subcription_service.dart';
import '../../../../widgets/app_scaffold.dart';
import 'renewal_subscriptions_screen.dart';
import 'subscription_renewal_flow.dart';
import '../../../../widgets/subcription/subscription_filter_bar.dart';
import '../../../../widgets/subcription/subscription_card.dart';
import '../../../../widgets/subcription/subscription_error_state.dart';
import '../../../../widgets/subcription/subscription_empty_state.dart';
import '../../../../widgets/subcription/subscription_pagination_controls.dart';
import '../../../../widgets/subcription/subscription_qr_dialog.dart';
import '../../../../widgets/reservation/report_dialog.dart';

class MySubscriptionsScreen extends StatefulWidget {
  const MySubscriptionsScreen({super.key});

  @override
  State<MySubscriptionsScreen> createState() => _MySubscriptionsScreenState();
}

class _MySubscriptionsScreenState extends State<MySubscriptionsScreen> {
  List<Map<String, dynamic>> _allSubscriptions = [];
  List<Map<String, dynamic>> _subscriptions = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _currentPage = 1;
  final int _pageSize = 5;
  int _totalItems = 0;
  final Set<String> _renewingSubscriptionIds = <String>{};
  final Set<String> _cancellingSubscriptionIds = <String>{};
  String? _selectedStatusFilter;

  @override
  void initState() {
    super.initState();
    // Mặc định chọn ACTIVE
    _selectedStatusFilter = 'ACTIVE';
    _loadSubscriptions();
  }

  Future<void> _loadSubscriptions({int? page, bool reset = false}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      if (reset) {
        _currentPage = 1;
      } else if (page != null) {
        _currentPage = page;
      }
      _renewingSubscriptionIds.clear();
      _cancellingSubscriptionIds.clear();
      _allSubscriptions = [];
      _subscriptions = [];
    });

    try {
      final response = await SubscriptionService.getMySubscriptions(
        page: _currentPage,
        pageSize: _pageSize,
        status: _selectedStatusFilter ?? 'ACTIVE',
      );

      final newSubscriptions = _parseSubscriptionResponse(response);

      setState(() {
        _allSubscriptions = newSubscriptions;
        _subscriptions = _filterSubscriptionsList();
        _totalItems = _extractTotalItems(response) ?? newSubscriptions.length;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading subscriptions: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });

      if (mounted && !reset) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải danh sách gói thuê bao: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> _parseSubscriptionResponse(
    Map<String, dynamic> response,
  ) {
    final List<Map<String, dynamic>> results = [];
    final dynamic data = response['data'];

    void addList(dynamic listData) {
      final list = listData
          .map<Map<String, dynamic>>(
            (item) => Map<String, dynamic>.from(item as Map),
          )
          .toList();
      results.addAll(list);
    }

    if (data is List) {
      addList(data);
    } else if (data is Map) {
      if (data['data'] is List) {
        addList(data['data']);
      } else if (data.containsKey('_id') || data.containsKey('id')) {
        results.add(Map<String, dynamic>.from(data));
      }
    }

    return results;
  }

  int? _extractTotalItems(Map<String, dynamic> response) {
    final pagination = response['pagination'];
    if (pagination is Map) {
      final totalItems = pagination['totalItems'] ?? pagination['total'];
      if (totalItems is int) return totalItems;
    }

    final data = response['data'];
    if (data is Map) {
      final innerPagination = data['pagination'];
      if (innerPagination is Map) {
        final total = innerPagination['totalItems'] ?? innerPagination['total'];
        if (total is int) return total;
      }

      final totalInside = data['totalItems'] ?? data['total'];
      if (totalInside is int) return totalInside;
    }

    final total =
        response['totalItems'] ?? response['total'] ?? response['totalCount'];
    if (total is int) return total;
    return null;
  }

  // Danh sách enum trạng thái subscription theo backend
  static const List<String> _allStatuses = <String>[
    'ACTIVE',
    'PAYMENT_FAILED',
    'SCHEDULED',
    'EXPIRED',
    'CANCELLED',
    'CANCELLED_DUE_TO_NON_PAYMENT',
  ];

  List<Map<String, dynamic>> _filterSubscriptionsList() {
    if (_selectedStatusFilter == null) return _allSubscriptions;
    return _allSubscriptions.where((sub) {
      final status = (sub['status'] as String?)?.toUpperCase();
      if (status == null) return false;
      return status == _selectedStatusFilter;
    }).toList();
  }

  void _onFilterChanged(String? statusCode) {
    if (_selectedStatusFilter == statusCode) return;
    setState(() {
      _selectedStatusFilter = statusCode;
    });
    // Khi đổi filter, luôn quay về trang 1 và gọi lại API
    _loadSubscriptions(reset: true);
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year}';
    } catch (e) {
      return dateString;
    }
  }

  String _getStatusText(String? status) {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Đang hoạt động';
      case 'PAYMENT_FAILED':
        return 'Thanh toán thất bại';
      case 'SCHEDULED':
        return 'Đã lên lịch';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'CANCELLED_DUE_TO_NON_PAYMENT':
        return 'Hủy do chưa thanh toán';
      default:
        return status ?? 'Không xác định';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return Colors.green;

      case 'PAYMENT_FAILED':
        return Colors.red;
      case 'SCHEDULED':
        return Colors.blue;

      case 'EXPIRED':
        return Colors.grey;
      case 'CANCELLED':
      case 'CANCELLED_DUE_TO_NON_PAYMENT':
        return Colors.red.shade700;

      default:
        return Colors.grey;
    }
  }

  String _formatCurrency(num? amount) {
    if (amount == null) return '0';
    final value = amount.toInt();
    final regex = RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))');
    final str = value.toString().replaceAllMapped(regex, (m) => '${m[1]},');
    return '$str đ';
  }

  Future<void> _handleRenewSubscription(
    Map<String, dynamic> subscription,
  ) async {
    final currentStatus =
        (subscription['status'] as String?)?.toUpperCase() ?? '';
    if (currentStatus != 'ACTIVE') {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Chỉ có thể gia hạn khi gói đang ở trạng thái ĐANG HOẠT ĐỘNG.',
          ),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    final dynamic subscriptionIdValue =
        subscription['_id'] ??
        subscription['id'] ??
        subscription['subscriptionId'];
    final String? subscriptionId = subscriptionIdValue?.toString();

    if (subscriptionId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID của gói thuê bao để gia hạn.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _renewingSubscriptionIds.add(subscriptionId);
    });

    final success = await SubscriptionRenewalFlow.start(
      context: context,
      subscription: subscription,
    );

    if (!mounted) return;

    setState(() {
      _renewingSubscriptionIds.remove(subscriptionId);
    });

    if (success) {
      _loadSubscriptions();
    }
  }

  Future<void> _handleCancelSubscription(
    Map<String, dynamic> subscription,
  ) async {
    final subscriptionId = (subscription['_id'] ?? subscription['id'])
        ?.toString();
    if (subscriptionId == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID của gói để hủy.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _cancellingSubscriptionIds.add(subscriptionId);
    });

    try {
      final preview = await SubscriptionService.previewCancelSubscription(
        subscriptionId: subscriptionId,
      );
      final bool canCancel = preview['canCancel'] == true;

      if (!mounted) return;

      if (!canCancel) {
        final warningMessage =
            preview['warningMessage']?.toString() ?? 'Gói này không thể hủy.';
        await showDialog<void>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text(
              'Không thể hủy gói',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            content: Text(warningMessage),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Đóng'),
              ),
            ],
          ),
        );
      } else {
        final refundAmount = preview['refundAmount'] as num?;
        final refundPercentage = preview['refundPercentage'] as num?;
        final policyApplied = preview['policyApplied']?.toString();
        final daysUntilActivation = preview['daysUntilActivation'];

        final bool? confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text(
              'Xác nhận hủy gói',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Sau khi hủy, gói thuê bao sẽ bị vô hiệu hóa ngay lập tức.',
                ),
                const SizedBox(height: 12),
                _buildPreviewRow(
                  'Chính sách áp dụng',
                  policyApplied ?? 'Không xác định',
                ),
                _buildPreviewRow(
                  'Số ngày tới khi kích hoạt',
                  '$daysUntilActivation',
                ),
                _buildPreviewRow(
                  'Tỷ lệ hoàn tiền',
                  '${refundPercentage?.toStringAsFixed(0) ?? '0'}%',
                ),
                _buildPreviewRow(
                  'Tiền hoàn dự kiến',
                  _formatCurrency(refundAmount),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Đóng'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red.shade600,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => Navigator.of(ctx).pop(true),
                child: const Text('Xác nhận hủy'),
              ),
            ],
          ),
        );

        if (confirmed == true && mounted) {
          final cancelResponse = await SubscriptionService.cancelSubscription(
            subscriptionId: subscriptionId,
          );
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                cancelResponse['message']?.toString() ??
                    'Hủy gói thuê bao thành công.',
              ),
              backgroundColor: Colors.green,
            ),
          );
          _loadSubscriptions();
        }
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể hủy gói thuê bao: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _cancellingSubscriptionIds.remove(subscriptionId);
        });
      }
    }
  }

  Widget _buildPreviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Gói thuê bao đã đăng ký'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
          actions: [
            IconButton(
              tooltip: 'Gói cần gia hạn',
              icon: const Icon(Icons.refresh),
              onPressed: () async {
                final bool? shouldRefresh = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const RenewalSubscriptionsScreen(),
                  ),
                );
                if (!mounted) return;
                if (shouldRefresh == true) {
                  _loadSubscriptions();
                }
              },
            ),
          ],
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _subscriptions.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
        ),
      );
    }

    if (_errorMessage != null &&
        _subscriptions.isEmpty &&
        _allSubscriptions.isEmpty) {
      return SubscriptionErrorState(
        message: _errorMessage!,
        onRetry: _loadSubscriptions,
      );
    }

    return Column(
      children: [
        SubscriptionFilterBar(
          statuses: _allStatuses,
          selectedStatus: _selectedStatusFilter,
          getStatusText: _getStatusText,
          getStatusColor: _getStatusColor,
          onStatusChanged: _onFilterChanged,
        ),
        Expanded(
          child: _subscriptions.isEmpty
              ? SubscriptionEmptyState(
                  title: 'Không có gói phù hợp',
                  description: _selectedStatusFilter != null
                      ? 'Không tìm thấy gói thuê bao với trạng thái "${_getStatusText(_selectedStatusFilter)}".'
                      : 'Bạn chưa có gói thuê bao nào. Hãy đăng ký gói thuê bao để sử dụng dịch vụ.',
                )
              : _buildSubscriptionList(),
        ),
      ],
    );
  }

  Widget _buildSubscriptionList() {
    return RefreshIndicator(
      onRefresh: () => _loadSubscriptions(reset: true),
      color: Colors.green.shade600,
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
              itemCount: _subscriptions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final subscription = _subscriptions[index];
                return _buildSubscriptionCard(subscription);
              },
            ),
          ),
          const SizedBox(height: 4),
          SubscriptionPaginationControls(
            currentPage: _currentPage,
            totalPages: _totalPages,
            onPrevious: () => _changePage(-1),
            onNext: () => _changePage(1),
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  int get _totalPages {
    if (_totalItems <= 0) return 1;
    return (_totalItems / _pageSize).ceil();
  }

  void _changePage(int delta) {
    final newPage = (_currentPage + delta).clamp(1, _totalPages);
    if (newPage == _currentPage) return;
    _loadSubscriptions(page: newPage);
  }

  Widget _buildSubscriptionCard(Map<String, dynamic> subscription) {
    final status = subscription['status'] as String?;
    final statusColor = _getStatusColor(status);
    final statusText = _getStatusText(status);
    final dynamic subscriptionIdValue =
        subscription['_id'] ?? subscription['id'];
    final String? subscriptionId = subscriptionIdValue?.toString();
    final statusUpper = status?.toUpperCase() ?? '';
    final isRenewalStatus = statusUpper == 'RENEWAL';
    final isActiveStatus = statusUpper == 'ACTIVE';
    final isScheduledStatus = statusUpper == 'SCHEDULED';
    final isExpiredStatus = statusUpper == 'EXPIRED';
    final isProcessingRenewal =
        subscriptionId != null &&
        _renewingSubscriptionIds.contains(subscriptionId);
    final isProcessingCancel =
        subscriptionId != null &&
        _cancellingSubscriptionIds.contains(subscriptionId);

    // Extract subscription details
    final pricingPolicy = subscription['pricingPolicyId'];
    final parkingLot = subscription['parkingLotId'];

    final policyName = pricingPolicy?['name'] ?? 'Không có tên';
    final parkingLotName = parkingLot?['name'] ?? 'Không xác định';
    final parkingLotIdStr =
        parkingLot?['_id']?.toString() ?? parkingLot?['id']?.toString() ?? '';
    final startDate = subscription['startDate'];
    final endDate = subscription['endDate'];

    // Tính toán trạng thái "sắp hết hạn" cho gói ACTIVE (còn <= 3 ngày)
    bool isNearExpiry = false;
    if (isActiveStatus && endDate is String) {
      final end = DateTime.tryParse(endDate);
      if (end != null) {
        final now = DateTime.now();
        final diff = end.difference(now);
        if (!diff.isNegative && diff.inDays <= 3) {
          isNearExpiry = true;
        }
      }
    }

    final Color effectiveStatusColor = isNearExpiry
        ? Colors.orange.shade600
        : statusColor;
    final bool canShowCancelButton = isScheduledStatus && !isRenewalStatus;
    final bool shouldShowRenewButton =
        isNearExpiry && isActiveStatus && !isRenewalStatus;
    final String dateRangeText =
        '${_formatDate(startDate)} - ${_formatDate(endDate)}';

    return SubscriptionCard(
      policyName: policyName,
      parkingLotName: parkingLotName,
      statusText: statusText,
      statusColor: effectiveStatusColor,
      dateRangeText: dateRangeText,
      onTap: isActiveStatus ? () => _showQRCodeDialog(subscription) : null,
      showRenewButton: shouldShowRenewButton,
      isProcessingRenew: isProcessingRenewal,
      renewButtonLabel: 'Gia hạn thêm',
      onRenew: () => _handleRenewSubscription(subscription),
      showCancelButton: canShowCancelButton,
      isProcessingCancel: isProcessingCancel,
      cancelButtonLabel: 'Hủy gói đăng ký',
      onCancel: () => _handleCancelSubscription(subscription),
      showRenewalNotice: isRenewalStatus,
      renewalNoticeMessage:
          'Gói thuê bao đã đến hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
      renewalNoticeButtonLabel: 'Gia hạn ngay',
      parkingLotId: parkingLotIdStr,
      onReport: (isActiveStatus || isExpiredStatus) && parkingLotIdStr.isNotEmpty
          ? () => showParkingLotReportFlow(
                context,
                parkingLotId: parkingLotIdStr,
                parkingLotName: parkingLotName,
              )
          : null,
    );
  }

  void _showQRCodeDialog(Map<String, dynamic> subscription) {
    // Get identifier from subscription (subscriptionIdentifier field)
    final identifier =
        subscription['subscriptionIdentifier'] as String? ??
        subscription['identifier'] as String?;

    if (identifier == null || identifier.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không tìm thấy mã định danh của gói thuê bao'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    // Show QR code popup directly with subscription data
    final pricingPolicy = subscription['pricingPolicyId'];
    final parkingLot = subscription['parkingLotId'];
    final policyName = pricingPolicy?['name'] ?? 'Không có tên';
    final parkingLotName = parkingLot?['name'] ?? 'Không xác định';

    SubscriptionQrDialog.show(
      context: context,
      policyName: policyName,
      parkingLotName: parkingLotName,
      identifier: identifier,
    );
  }
}
