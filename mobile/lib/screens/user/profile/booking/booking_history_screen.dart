import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../../services/payment_service.dart';
import '../../../../widgets/app_scaffold.dart';

class BookingHistoryScreen extends StatefulWidget {
  const BookingHistoryScreen({super.key});

  @override
  State<BookingHistoryScreen> createState() => _BookingHistoryScreenState();
}

class _BookingHistoryScreenState extends State<BookingHistoryScreen> {
  final _currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: '₫',
    decimalDigits: 0,
  );
  final _dateFormat = DateFormat('dd/MM/yyyy HH:mm');

  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  List<Map<String, dynamic>> _payments = [];

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
      final response = await PaymentService.getMyPayments();
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
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => _loadPayments(isRefresh: true),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: _buildContent(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFF2E7D32), const Color(0xFF66BB6A)],
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.of(context).pop(),
          ),
          const Expanded(
            child: Text(
              'Lịch sử thanh toán',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
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
        title: 'Không thể tải lịch sử thanh toán',
        message: _errorMessage!,
        actionText: 'Thử lại',
        onAction: _loadPayments,
      );
    }

    if (_payments.isEmpty) {
      return _buildStateMessage(
        icon: Icons.receipt_long,
        title: 'Chưa có giao dịch',
        message: 'Bạn chưa thực hiện giao dịch nào.',
        actionText: 'Làm mới',
        onAction: _loadPayments,
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: _payments.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final payment = _payments[index];
        return _buildPaymentCard(payment);
      },
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
    final type = (payment['type'] ?? 'Thanh toán').toString();
    final amountText = _formatAmount(payment['amount']);
    final createdAt = _resolveDate(payment);
    final metadata =
        _ensureMap(payment['metadata']) ??
        _ensureMap(payment['entity']) ??
        _ensureMap(payment['context']);
    final description =
        payment['description']?.toString() ??
        metadata?['description']?.toString();
    final parkingLotName =
        metadata?['parkingLot']?['name']?.toString() ??
        metadata?['parkingLotName']?.toString();
    final pricingPolicyName =
        metadata?['pricingPolicyId']?['name']?.toString() ??
        metadata?['pricingPolicyName']?.toString();
    final referenceId =
        payment['_id']?.toString() ??
        payment['id']?.toString() ??
        payment['paymentId']?.toString();

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
                child: Text(
                  type,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
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
          if (description != null && description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              description,
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
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
                      Text(
                        createdAt,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.tag, size: 16, color: Colors.grey.shade600),
                      const SizedBox(width: 4),
                      Text(
                        'Mã: $referenceId',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5E9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  amountText,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF2E7D32),
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
}

class _StatusColor {
  final Color background;
  final Color foreground;

  _StatusColor({required this.background, required this.foreground});
}
