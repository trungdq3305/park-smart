import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../services/payment_service.dart';
import '../../../../widgets/app_scaffold.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

enum PaymentFilter { payments, refunds }

class _BookingHistoryScreenState extends State<BookingHistoryScreen> {
  final _currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: '₫',
    decimalDigits: 0,
  );
  final _dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  PaymentFilter _currentFilter = PaymentFilter.payments;
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _payments = [];
  static const int _pageSize = 10;
  int _currentPage = 1;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments({bool isRefresh = false}) async {
    if (!mounted) return;
    setState(() {
      if (isRefresh) {
        _isRefreshing = true;
      } else {
        _isLoading = true;
      }
      if (!isRefresh) _errorMessage = null;
    });

    try {
      // Gọi API dựa trên filter hiện tại
      final response = _currentFilter == PaymentFilter.payments
          ? await PaymentService.getMyPayments()
          : await PaymentService.getMyRefunds();

      final data = response['data'];
      List<Map<String, dynamic>> payments = [];

      if (data is List) {
        payments = data
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      } else if (data is Map<String, dynamic>) {
        final items = data['items'] ?? data['results'] ?? data['data'];
        if (items is List) {
          payments = items
              .whereType<Map>()
              .map((item) => Map<String, dynamic>.from(item))
              .toList();
        }
      }

      payments.sort((a, b) {
        final aDate =
            DateTime.tryParse(a['createdAt'] ?? '') ??
            DateTime.tryParse(a['createdDate'] ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0);
        final bDate =
            DateTime.tryParse(b['createdAt'] ?? '') ??
            DateTime.tryParse(b['createdDate'] ?? '') ??
            DateTime.fromMillisecondsSinceEpoch(0);
        return bDate.compareTo(aDate);
      });

      if (!mounted) return;
      setState(() {
        _payments = payments;
        _currentPage = 1;
        _errorMessage = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _isRefreshing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Lịch sử thanh toán'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: RefreshIndicator(
          onRefresh: () => _loadPayments(isRefresh: true),
          child: Column(
            children: [
              _buildFilterBar(),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: _buildContent(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterChip(
              label: 'Thanh toán',
              filter: PaymentFilter.payments,
              icon: Icons.payment,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildFilterChip(
              label: 'Hoàn tiền',
              filter: PaymentFilter.refunds,
              icon: Icons.undo,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required PaymentFilter filter,
    required IconData icon,
  }) {
    final isSelected = _currentFilter == filter;
    return InkWell(
      onTap: () {
        if (_currentFilter != filter) {
          setState(() {
            _currentFilter = filter;
            _currentPage = 1;
          });
          _loadPayments();
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.green : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.green.shade700 : Colors.transparent,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 18,
              color: isSelected ? Colors.white : Colors.grey.shade700,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected ? Colors.white : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading && !_isRefreshing) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return _buildStateMessage(
        icon: Icons.error_outline,
        title: _currentFilter == PaymentFilter.payments
            ? 'Không thể tải lịch sử thanh toán'
            : 'Không thể tải lịch sử hoàn tiền',
        message: _errorMessage!,
        actionText: 'Thử lại',
        onAction: _loadPayments,
      );
    }

    if (_payments.isEmpty) {
      return _buildStateMessage(
        icon: Icons.receipt_long,
        title: _currentFilter == PaymentFilter.payments
            ? 'Chưa có giao dịch'
            : 'Chưa có hoàn tiền',
        message: _currentFilter == PaymentFilter.payments
            ? 'Bạn chưa thực hiện giao dịch nào.'
            : 'Bạn chưa có giao dịch hoàn tiền nào.',
        actionText: 'Làm mới',
        onAction: _loadPayments,
      );
    }

    final pagePayments = _getCurrentPagePayments();

    return Column(
      children: [
        Expanded(
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: pagePayments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final payment = pagePayments[index];
              return _buildPaymentCard(payment);
            },
          ),
        ),
        const SizedBox(height: 8),
        _buildPaginationControls(),
      ],
    );
  }

  Widget _buildStateMessage({
    required IconData icon,
    required String title,
    required String message,
    required String actionText,
    required Future<void> Function({bool isRefresh}) onAction,
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
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    message,
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => onAction(isRefresh: false),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2E7D32),
                    foregroundColor: Colors.white,
                  ),
                  child: Text(actionText),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentCard(Map<String, dynamic> payment) {
    final status = (payment['status'] ?? 'UNKNOWN').toString().toUpperCase();
    // Đối với refunds, type có thể là "Refund" hoặc từ metadata
    final type = _currentFilter == PaymentFilter.refunds
        ? (payment['type'] ?? 'Hoàn tiền').toString()
        : (payment['type'] ?? 'Thanh toán').toString();
    final amountText = _formatAmount(payment['amount']);
    final createdAt = _resolveDate(payment);
    final metadata =
        _ensureMap(payment['metadata']) ??
        _ensureMap(payment['entity']) ??
        _ensureMap(payment['context']);

    // Xử lý description và reason cho refunds
    String? description;
    if (_currentFilter == PaymentFilter.refunds) {
      // Ưu tiên reason cho refunds
      description =
          payment['reason']?.toString() ??
          payment['description']?.toString() ??
          metadata?['reason']?.toString() ??
          metadata?['description']?.toString();
    } else {
      description =
          payment['description']?.toString() ??
          metadata?['description']?.toString();
    }

    final parkingLotName =
        metadata?['parkingLot']?['name']?.toString() ??
        metadata?['parkingLotName']?.toString() ??
        payment['parkingLot']?['name']?.toString();
    final pricingPolicyName =
        metadata?['pricingPolicyId']?['name']?.toString() ??
        metadata?['pricingPolicyName']?.toString();

    // Xử lý referenceId cho refunds (có thể là id, paymentId, hoặc xenditRefundId)
    final referenceId = _currentFilter == PaymentFilter.refunds
        ? (payment['id']?.toString() ??
              payment['_id']?.toString() ??
              payment['xenditRefundId']?.toString() ??
              payment['paymentId']?.toString())
        : (payment['_id']?.toString() ??
              payment['id']?.toString() ??
              payment['paymentId']?.toString() ??
              payment['refundId']?.toString());

    // Xác định loại refund (reservation hay subscription)
    final refundType = _currentFilter == PaymentFilter.refunds
        ? (payment['reservationId'] != null
              ? 'Đặt chỗ'
              : payment['subscriptionId'] != null
              ? 'Gói đăng ký'
              : null)
        : null;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      type,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    if (refundType != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        'Loại: $refundType',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey.shade600,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              _buildStatusChip(status),
            ],
          ),
          if (parkingLotName != null || pricingPolicyName != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  parkingLotName != null
                      ? Icons.local_parking
                      : Icons.assignment,
                  size: 16,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    parkingLotName ?? 'Gói: $pricingPolicyName',
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade600),
                  ),
                ),
              ],
            ),
          ],
          // if (description != null && description.isNotEmpty) ...[
          //   const SizedBox(height: 8),
          //   Text(
          //     description,
          //     style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
          //   ),
          // ],
          // const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 16,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            createdAt,
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Icon(Icons.tag, size: 16, color: Colors.grey.shade600),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            'Mã: $referenceId',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey.shade600,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _currentFilter == PaymentFilter.refunds
                        ? const Color(0xFFE3F2FD)
                        : const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _currentFilter == PaymentFilter.refunds
                        ? '+$amountText' // Thêm dấu + cho hoàn tiền
                        : amountText,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: _currentFilter == PaymentFilter.refunds
                          ? const Color(0xFF1976D2)
                          : const Color(0xFF2E7D32),
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final label = _mapStatusLabel(status);
    final colors = _mapStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: colors.foreground,
        ),
      ),
    );
  }

  _StatusColor _mapStatusColor(String status) {
    switch (status) {
      case 'PAID':
      case 'SUCCESS':
      case 'SUCCEEDED':
      case 'COMPLETED':
        return _StatusColor(
          background: Colors.green.shade50,
          foreground: Colors.green.shade700,
        );
      case 'PENDING':
      case 'PROCESSING':
      case 'INITIALIZED':
        return _StatusColor(
          background: Colors.orange.shade50,
          foreground: Colors.orange.shade700,
        );
      case 'FAILED':
      case 'CANCELED':
      case 'CANCELLED':
      case 'EXPIRED':
        return _StatusColor(
          background: Colors.red.shade50,
          foreground: Colors.red.shade700,
        );
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return _StatusColor(
          background: Colors.blue.shade50,
          foreground: Colors.blue.shade700,
        );
      default:
        return _StatusColor(
          background: Colors.grey.shade200,
          foreground: Colors.grey.shade700,
        );
    }
  }

  String _mapStatusLabel(String status) {
    switch (status) {
      case 'PAID':
      case 'SUCCESS':
      case 'SUCCEEDED':
      case 'COMPLETED':
        return 'Hoàn tất';
      case 'PENDING':
      case 'PROCESSING':
      case 'INITIALIZED':
        return 'Đang xử lý';
      case 'FAILED':
      case 'CANCELED':
      case 'CANCELLED':
      case 'EXPIRED':
        return 'Thất bại';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'Đã hoàn tiền';
      default:
        return status.isEmpty ? 'Không xác định' : status;
    }
  }

  String _formatAmount(dynamic amountValue) {
    if (amountValue is num) {
      return _currencyFormat.format(amountValue);
    }
    final parsed = int.tryParse(amountValue?.toString() ?? '');
    return parsed != null ? _currencyFormat.format(parsed) : '₫0';
  }

  String _resolveDate(Map<String, dynamic> payment) {
    final raw =
        payment['createdAt'] ?? payment['createdDate'] ?? payment['updatedAt'];
    final date = DateTime.tryParse(raw ?? '');
    if (date == null) return 'Không xác định';
    return _dateFormat.format(date.toLocal());
  }

  Map<String, dynamic>? _ensureMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }
    return null;
  }

  List<Map<String, dynamic>> _getCurrentPagePayments() {
    if (_payments.isEmpty) return [];
    final startIndex = (_currentPage - 1) * _pageSize;
    final endIndex = (startIndex + _pageSize).clamp(0, _payments.length);
    if (startIndex >= _payments.length) return [];
    return _payments.sublist(startIndex, endIndex);
  }

  int get _totalPages {
    if (_payments.isEmpty) return 1;
    return (_payments.length / _pageSize).ceil();
  }

  void _changePage(int delta) {
    final newPage = (_currentPage + delta).clamp(1, _totalPages);
    if (newPage == _currentPage) return;
    setState(() {
      _currentPage = newPage;
    });
  }

  Widget _buildPaginationControls() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          color: Colors.green,
          onPressed: _currentPage > 1 ? () => _changePage(-1) : null,
        ),
        Text(
          'Trang $_currentPage/$_totalPages',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          color: Colors.green,
          onPressed: _currentPage < _totalPages ? () => _changePage(1) : null,
        ),
      ],
    );
  }
}

class _StatusColor {
  final Color background;
  final Color foreground;

  _StatusColor({required this.background, required this.foreground});
}
