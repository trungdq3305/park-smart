import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../services/subcription_service.dart';
import '../../../../widgets/app_scaffold.dart';
import 'renewal_subscriptions_screen.dart';
import 'subscription_renewal_flow.dart';

class MySubscriptionsScreen extends StatefulWidget {
  const MySubscriptionsScreen({super.key});

  @override
  State<MySubscriptionsScreen> createState() => _MySubscriptionsScreenState();
}

class _MySubscriptionsScreenState extends State<MySubscriptionsScreen> {
  List<Map<String, dynamic>> _allSubscriptions = [];
  List<Map<String, dynamic>> _subscriptions = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  int _currentPage = 1;
  int _pageSize = 10;
  bool _hasMore = true;
  final Set<String> _renewingSubscriptionIds = <String>{};
  bool _showExpired = false;

  @override
  void initState() {
    super.initState();
    _loadSubscriptions();
  }

  Future<void> _loadSubscriptions({bool loadMore = false}) async {
    if (loadMore) {
      if (!_hasMore || _isLoadingMore) return;
      setState(() {
        _isLoadingMore = true;
      });
    } else {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
        _currentPage = 1;
        _hasMore = true;
        _renewingSubscriptionIds.clear();
        _allSubscriptions = [];
        _subscriptions = [];
      });
    }

    try {
      final response = await SubscriptionService.getMySubscriptions(
        page: _currentPage,
        pageSize: _pageSize,
      );

      final newSubscriptions = _parseSubscriptionResponse(response);

      setState(() {
        if (loadMore) {
          _allSubscriptions.addAll(newSubscriptions);
        } else {
          _allSubscriptions = newSubscriptions;
        }

        _subscriptions = _filterSubscriptionsList();

        final totalItems = _extractTotalItems(response);
        final fetchedCount = newSubscriptions.length;
        final currentCount = _allSubscriptions.length;

        _hasMore =
            fetchedCount == _pageSize &&
            (totalItems == null || currentCount < totalItems);

        if (_hasMore) {
          _currentPage++;
        }

        _isLoading = false;
        _isLoadingMore = false;
      });
    } catch (e) {
      print('❌ Error loading subscriptions: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });

      if (mounted && !loadMore) {
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

  static const List<String> _activeStatuses = <String>[
    'ACTIVE',
    'ACTIVATED',
    'PENDING',
  ];

  static const List<String> _expiredStatuses = <String>[
    'RENEWAL',
    'EXPIRED',
    'CANCELLED',
    'INACTIVE',
    'FINISHED',
    'DEACTIVATED',
  ];

  List<Map<String, dynamic>> _filterSubscriptionsList() {
    final allowedStatuses = _showExpired ? _expiredStatuses : _activeStatuses;
    return _allSubscriptions.where((sub) {
      final status = (sub['status'] as String?)?.toUpperCase();
      if (status == null) return false;
      return allowedStatuses.contains(status);
    }).toList();
  }

  void _onFilterChanged(bool showExpired) {
    if (_showExpired == showExpired) return;
    setState(() {
      _showExpired = showExpired;
      _subscriptions = _filterSubscriptionsList();
    });
  }

  Widget _buildFilterChips() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Wrap(
        spacing: 12,
        children: [
          ChoiceChip(
            label: const Text('Đang hoạt động'),
            selected: !_showExpired,
            selectedColor: Colors.green.shade600,
            labelStyle: TextStyle(
              color: !_showExpired ? Colors.white : Colors.grey.shade700,
              fontWeight: FontWeight.w600,
            ),
            onSelected: (_) => _onFilterChanged(false),
          ),
          ChoiceChip(
            label: const Text('Đã hết hạn'),
            selected: _showExpired,
            selectedColor: Colors.red.shade500,
            labelStyle: TextStyle(
              color: _showExpired ? Colors.white : Colors.grey.shade700,
              fontWeight: FontWeight.w600,
            ),
            onSelected: (_) => _onFilterChanged(true),
          ),
        ],
      ),
    );
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
      case 'ACTIVATED':
        return 'Đang hoạt động';
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'CANCELLED':
        return 'Đã hủy';
      case 'RENEWAL':
        return 'Cần gia hạn';
      default:
        return status ?? 'Không xác định';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'ACTIVATED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'EXPIRED':
      case 'CANCELLED':
        return Colors.red;
      case 'RENEWAL':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Future<void> _handleRenewSubscription(
    Map<String, dynamic> subscription,
  ) async {
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

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Vé của tôi'),
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
      return _buildErrorState();
    }

    return Column(
      children: [
        _buildFilterChips(),
        Expanded(
          child: _subscriptions.isEmpty
              ? _buildEmptyState()
              : _buildSubscriptionList(),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Không thể tải danh sách',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => _loadSubscriptions(),
              icon: const Icon(Icons.refresh, size: 20),
              label: const Text(
                'Thử lại',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final title = _showExpired ? 'Chưa có gói hết hạn' : 'Chưa có gói thuê bao';
    final description = _showExpired
        ? 'Chưa có gói thuê bao nào đã hết hạn. Bạn sẽ thấy danh sách tại đây khi có gói hết hạn.'
        : 'Bạn chưa có gói thuê bao nào đang hoạt động. Hãy đăng ký gói thuê bao để sử dụng dịch vụ.';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.green.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _showExpired
                    ? Icons.history_rounded
                    : Icons.confirmation_number_outlined,
                size: 64,
                color: Colors.green.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubscriptionList() {
    return RefreshIndicator(
      onRefresh: () => _loadSubscriptions(),
      color: Colors.green.shade600,
      backgroundColor: Colors.white,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        itemCount: _subscriptions.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _subscriptions.length) {
            if (_isLoadingMore) {
              return const Padding(
                padding: EdgeInsets.all(16.0),
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                  ),
                ),
              );
            }
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _loadSubscriptions(loadMore: true);
            });
            return const SizedBox.shrink();
          }

          final subscription = _subscriptions[index];
          return _buildSubscriptionCard(subscription);
        },
      ),
    );
  }

  Widget _buildSubscriptionCard(Map<String, dynamic> subscription) {
    final status = subscription['status'] as String?;
    final statusColor = _getStatusColor(status);
    final statusText = _getStatusText(status);
    final dynamic subscriptionIdValue =
        subscription['_id'] ?? subscription['id'];
    final String? subscriptionId = subscriptionIdValue?.toString();
    final isRenewalStatus = status?.toUpperCase() == 'RENEWAL';
    final isProcessingRenewal =
        subscriptionId != null &&
        _renewingSubscriptionIds.contains(subscriptionId);

    // Extract subscription details
    final pricingPolicy = subscription['pricingPolicyId'];
    final parkingLot = subscription['parkingLotId'];
    final packageRate = pricingPolicy?['packageRateId'];

    final policyName = pricingPolicy?['name'] ?? 'Không có tên';
    final parkingLotName = parkingLot?['name'] ?? 'Không xác định';
    final startDate = subscription['startDate'];
    final endDate = subscription['endDate'];
    final durationAmount = packageRate?['durationAmount'] ?? 0;
    final unit = packageRate?['unit'] ?? '';

    return InkWell(
      onTap: () => _showQRCodeDialog(subscription),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
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
            // Header with gradient background
            Container(
              padding: const EdgeInsets.all(20),
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
                  // Icon container
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(
                      Icons.confirmation_number,
                      color: statusColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Title and location
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          policyName,
                          style: TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade900,
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 16,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                parkingLotName,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: statusColor.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          statusText,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // Content section
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  // Date range card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: Colors.grey.shade200, width: 1),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.green.shade50,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            Icons.calendar_today,
                            size: 20,
                            color: Colors.green.shade700,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Thời hạn',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey.shade600,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${_formatDate(startDate)} - ${_formatDate(endDate)}',
                                style: TextStyle(
                                  fontSize: 15,
                                  color: Colors.grey.shade900,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Duration info
                  if (packageRate != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.blue.shade50,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.blue.shade100,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.blue.shade100,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              Icons.access_time,
                              size: 20,
                              color: Colors.blue.shade700,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Thời lượng',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.blue.shade700,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '$durationAmount $unit',
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: Colors.blue.shade900,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  // Tap hint
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.touch_app,
                        size: 16,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Chạm để xem mã QR',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.w500,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (isRenewalStatus) ...[
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange.shade200),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.info_outline,
                            color: Colors.orange.shade600,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Gói thuê bao đã đến hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.orange.shade900,
                                fontWeight: FontWeight.w600,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: isProcessingRenewal
                            ? null
                            : () => _handleRenewSubscription(subscription),
                        icon: isProcessingRenewal
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.refresh),
                        label: Text(
                          isProcessingRenewal
                              ? 'Đang xử lý...'
                              : 'Gia hạn ngay',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange.shade600,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
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
    _showQRCodePopup(subscription, identifier);
  }

  void _showQRCodePopup(Map<String, dynamic> subscription, String identifier) {
    final pricingPolicy = subscription['pricingPolicyId'];
    final parkingLot = subscription['parkingLotId'];
    final policyName = pricingPolicy?['name'] ?? 'Không có tên';
    final parkingLotName = parkingLot?['name'] ?? 'Không xác định';

    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.7),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 380),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.15),
                blurRadius: 20,
                offset: const Offset(0, 10),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header with gradient
              Container(
                padding: const EdgeInsets.fromLTRB(24, 20, 16, 20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.green.shade600, Colors.green.shade700],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.qr_code_2,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Mã QR Vé',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.close,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              ),
              // Content
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    // Subscription info card
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.green.shade50, Colors.green.shade100],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.green.shade200,
                          width: 1,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(
                                Icons.confirmation_number,
                                size: 18,
                                color: Colors.green.shade700,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  policyName,
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.green.shade900,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.location_on,
                                size: 16,
                                color: Colors.green.shade600,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  parkingLotName,
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.green.shade800,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // QR Code container with decorative border
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.green.shade300,
                          width: 3,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.green.shade100,
                            blurRadius: 15,
                            spreadRadius: 2,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        child: QrImageView(
                          data: identifier,
                          version: QrVersions.auto,
                          size: 220.0,
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black,
                          errorCorrectionLevel: QrErrorCorrectLevel.H,
                          padding: const EdgeInsets.all(8),
                          embeddedImage: null,
                          embeddedImageStyle: null,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Identifier text with copy button
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.grey.shade200,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.fingerprint,
                            size: 18,
                            color: Colors.grey.shade600,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              identifier,
                              style: TextStyle(
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: Colors.grey.shade800,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 0.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Material(
                            color: Colors.green.shade100,
                            borderRadius: BorderRadius.circular(8),
                            child: InkWell(
                              onTap: () async {
                                await Clipboard.setData(
                                  ClipboardData(text: identifier),
                                );
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Row(
                                        children: [
                                          Icon(
                                            Icons.check_circle,
                                            color: Colors.white,
                                            size: 20,
                                          ),
                                          const SizedBox(width: 8),
                                          const Text(
                                            'Đã sao chép mã định danh',
                                          ),
                                        ],
                                      ),
                                      backgroundColor: Colors.green.shade600,
                                      behavior: SnackBarBehavior.floating,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      duration: const Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                child: Icon(
                                  Icons.copy,
                                  size: 18,
                                  color: Colors.green.shade700,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => Navigator.of(context).pop(),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.grey.shade700,
                              side: BorderSide(
                                color: Colors.grey.shade300,
                                width: 1.5,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text(
                              'Đóng',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                              // TODO: Add share functionality if needed
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade600,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.share, size: 18),
                                const SizedBox(width: 6),
                                const Text(
                                  'Chia sẻ',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
