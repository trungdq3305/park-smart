import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../services/reservation_service.dart';
import '../../../../services/parking_lot_service.dart';
import '../../../../services/payment_service.dart';
import '../../../../widgets/app_scaffold.dart';
import '../../../user/booking_reservation/payment_checkout_screen.dart';
import 'my_reservations_screen_filter_bar.dart';
import '../../../../widgets/reservation/my_reservation_card.dart';

class MyReservationsScreen extends StatefulWidget {
  const MyReservationsScreen({super.key});

  @override
  State<MyReservationsScreen> createState() => _MyReservationsScreenState();
}

class _MyReservationsScreenState extends State<MyReservationsScreen> {
  List<Map<String, dynamic>> _reservations = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _errorMessage;
  int _currentPage = 1;
  int _pageSize = 5;
  bool _hasMore = true;
  final Map<String, Map<String, dynamic>> _parkingLotCache = {};
  final Set<String> _extendingReservationIds = {};

  // Danh sách trạng thái đặt chỗ mới
  final List<String> _allStatuses = const [
    'PENDING_PAYMENT',
    'CONFIRMED',
    'CHECKED_IN',
    'CHECKED_OUT',
    'CANCELLED_BY_USER',
    'EXPIRED',
    'CANCELLED_BY_OPERATOR',
    'REFUND',
    'CANCELLED_DUE_TO_NON_PAYMENT',
    'PAYMENT_FAILED',
  ];

  String? _selectedStatusFilter;
  // Trạng thái mặc định cho filter "Tất cả" (hiển thị các vé đang sử dụng)
  static const String _defaultStatus = 'CHECKED_IN';

  @override
  void initState() {
    super.initState();
    _loadReservations();
  }

  Future<void> _loadReservations({bool loadMore = false}) async {
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
        _reservations = [];
      });
    }

    try {
      final response = await ReservationService.getMyReservations(
        page: _currentPage,
        pageSize: _pageSize,
        status: _selectedStatusFilter ?? _defaultStatus,
      );

      final newReservations = _parseReservationResponse(response);

      // Enrich reservations with parking lot details if needed
      await _enrichReservationsWithParkingLotDetails(newReservations);

      setState(() {
        if (loadMore) {
          _reservations.addAll(newReservations);
        } else {
          _reservations = newReservations;
        }

        final totalItems = _extractTotalItems(response);
        final fetchedCount = newReservations.length;
        final currentCount = _reservations.length;

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
      print('❌ Error loading reservations: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _isLoadingMore = false;
      });

      if (mounted && !loadMore) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải danh sách đặt chỗ: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> _parseReservationResponse(
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

  /// Enrich reservations with parking lot details if parkingLotId only has _id
  Future<void> _enrichReservationsWithParkingLotDetails(
    List<Map<String, dynamic>> reservations,
  ) async {
    for (var reservation in reservations) {
      final parkingLot = reservation['parkingLotId'];
      if (parkingLot == null) continue;

      // Check if parking lot already has name (already populated)
      if (parkingLot['name'] != null) continue;

      // Get parking lot ID
      final parkingLotId =
          parkingLot['_id']?.toString() ?? parkingLot['id']?.toString();
      if (parkingLotId == null) continue;

      // Check cache first
      if (_parkingLotCache.containsKey(parkingLotId)) {
        reservation['parkingLotId'] = _parkingLotCache[parkingLotId];
        continue;
      }

      // Fetch parking lot details
      try {
        final parkingLotDetails = await ParkingLotService.getParkingLotById(
          parkingLotId,
        );
        final parkingLotData = parkingLotDetails['data'] ?? parkingLotDetails;
        _parkingLotCache[parkingLotId] = parkingLotData;
        reservation['parkingLotId'] = parkingLotData;
      } catch (e) {
        print('⚠️ Failed to fetch parking lot details for $parkingLotId: $e');
        // Keep original parkingLotId if fetch fails
      }
    }
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

  String _formatDateTime(String? dateString) {
    if (dateString == null) return 'N/A';
    try {
      final date = DateTime.parse(dateString);
      final hour = date.hour.toString().padLeft(2, '0');
      final minute = date.minute.toString().padLeft(2, '0');
      return '${_formatDate(dateString)} $hour:$minute';
    } catch (e) {
      return dateString;
    }
  }

  String _formatPrice(int? price) {
    if (price == null) return '0';
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  String _getStatusText(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return 'Chờ thanh toán';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'CHECKED_IN':
        return 'Đã check-in';
      case 'CHECKED_OUT':
        return 'Đã check-out';
      case 'CANCELLED_BY_USER':
        return 'Người dùng hủy';
      case 'EXPIRED':
        return 'Đã hết hạn';
      case 'CANCELLED_BY_OPERATOR':
        return 'Nhà vận hành hủy';
      case 'REFUND':
        return 'Hoàn tiền';
      case 'CANCELLED_DUE_TO_NON_PAYMENT':
        return 'Hủy do không thanh toán';
      case 'PAYMENT_FAILED':
        return 'Thanh toán thất bại';
      default:
        return status ?? 'Không xác định';
    }
  }

  Color _getStatusColor(String? status) {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return Colors.orange;
      case 'CONFIRMED':
      case 'CHECKED_IN':
      case 'CHECKED_OUT':
        return Colors.green;
      case 'REFUND':
        return Colors.blue;
      case 'CANCELLED_BY_USER':
      case 'CANCELLED_BY_OPERATOR':
      case 'CANCELLED_DUE_TO_NON_PAYMENT':
      case 'PAYMENT_FAILED':
      case 'EXPIRED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _onFilterChanged(String? status) {
    setState(() {
      _selectedStatusFilter = status;
    });
    _loadReservations();
  }

  Future<void> _handleExtendReservation(
    Map<String, dynamic> reservation,
  ) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    final reservationId =
        reservation['_id']?.toString() ?? reservation['id']?.toString();
    if (reservationId == null) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy ID đặt chỗ để gia hạn.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    int? baseCostPerHour =
        reservation['price'] as int? ??
        reservation['additionalCost'] as int? ??
        reservation['hourlyRate'] as int?;

    // Nếu reservation không có price trực tiếp, lấy từ pricingPolicy.tieredRateSetId.tiers[0].price
    if (baseCostPerHour == null || baseCostPerHour <= 0) {
      final pricingPolicy =
          reservation['pricingPolicyId'] as Map<String, dynamic>?;
      final tieredRateSet =
          pricingPolicy?['tieredRateSetId'] as Map<String, dynamic>?;
      final tiers = tieredRateSet?['tiers'];
      if (tiers is List && tiers.isNotEmpty) {
        final firstTier = tiers.first;
        final dynamic tierPrice = firstTier['price'];
        if (tierPrice is int) {
          baseCostPerHour = tierPrice;
        } else if (tierPrice is num) {
          baseCostPerHour = tierPrice.round();
        }
      }
    }

    if (baseCostPerHour == null || baseCostPerHour <= 0) {
      scaffoldMessenger.showSnackBar(
        const SnackBar(
          content: Text('Không tìm thấy đơn giá để gia hạn thêm giờ.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final int? additionalHours = await _showExtensionHoursDialog(
      baseCostPerHour,
    );
    if (additionalHours == null || additionalHours <= 0) {
      return;
    }

    final int additionalCost = baseCostPerHour;
    final int totalAmount = additionalCost * additionalHours;

    setState(() {
      _extendingReservationIds.add(reservationId);
    });

    try {
      // Step 1: Check extension eligibility
      await ReservationService.checkReservationExtension(
        reservationId: reservationId,
        additionalHours: additionalHours,
        additionalCost: additionalCost,
      );

      // Step 2: Create payment for extension
      final parkingLot = reservation['parkingLotId'] as Map<String, dynamic>?;
      final operatorId = parkingLot?['parkingLotOperatorId']?.toString();

      final paymentResponse = await PaymentService.createPayment(
        entityId: reservationId,
        // Backend chỉ chấp nhận các PaymentType hợp lệ (ví dụ: Reservation, Subscription)
        // nên dùng lại type 'Reservation' cho giao dịch gia hạn đặt chỗ
        type: 'Reservation',
        amount: totalAmount,
        operatorId: operatorId,
      );

      dynamic paymentData = paymentResponse['data'];
      if (paymentData is List && paymentData.isNotEmpty) {
        paymentData = paymentData.first;
      }

      String? paymentId;
      if (paymentData is Map) {
        paymentId = paymentData['_id'] ?? paymentData['id'];
      }
      paymentId ??= paymentResponse['_id'] ?? paymentResponse['id'];

      String? checkoutUrl;
      if (paymentData is Map) {
        checkoutUrl = paymentData['checkoutUrl']?.toString();
      }
      checkoutUrl ??= paymentResponse['checkoutUrl']?.toString();

      if (checkoutUrl == null || checkoutUrl.isEmpty) {
        throw Exception('Không nhận được đường dẫn thanh toán cho gia hạn.');
      }

      if (!mounted) return;

      final completer = Completer<bool>();

      await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => PaymentCheckoutScreen(
            checkoutUrl: checkoutUrl!,
            paymentId: paymentId,
            onPaymentComplete: (success, returnedPaymentId) async {
              await Future.delayed(const Duration(milliseconds: 300));

              if (!success) {
                scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Thanh toán gia hạn đã bị hủy hoặc thất bại.',
                    ),
                    backgroundColor: Colors.orange,
                  ),
                );
                if (!completer.isCompleted) completer.complete(false);
                return;
              }

              final finalPaymentId = returnedPaymentId ?? paymentId;
              if (finalPaymentId == null) {
                scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Không nhận được mã thanh toán cho gia hạn đặt chỗ.',
                    ),
                    backgroundColor: Colors.red,
                  ),
                );
                if (!completer.isCompleted) completer.complete(false);
                return;
              }

              try {
                await ReservationService.confirmReservationExtension(
                  reservationId: reservationId,
                  additionalHours: additionalHours,
                  paymentId: finalPaymentId,
                );

                scaffoldMessenger.showSnackBar(
                  const SnackBar(
                    content: Text('Gia hạn thêm giờ cho đặt chỗ thành công!'),
                    backgroundColor: Colors.green,
                  ),
                );
                if (!completer.isCompleted) completer.complete(true);
              } catch (e) {
                scaffoldMessenger.showSnackBar(
                  SnackBar(
                    content: Text(
                      'Thanh toán thành công nhưng có lỗi khi gia hạn: $e',
                    ),
                    backgroundColor: Colors.red,
                  ),
                );
                if (!completer.isCompleted) completer.complete(false);
              }
            },
          ),
        ),
      );

      final success = await completer.future;
      if (success && mounted) {
        _loadReservations();
      }
    } catch (e) {
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('Không thể gia hạn thêm giờ cho đặt chỗ: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _extendingReservationIds.remove(reservationId);
        });
      }
    }
  }

  Future<int?> _showExtensionHoursDialog(int baseCostPerHour) async {
    final controller = TextEditingController(text: '1');
    return showDialog<int>(
      context: context,
      builder: (ctx) {
        String? errorText;
        return StatefulBuilder(
          builder: (context, setState) {
            int hours = int.tryParse(controller.text.trim()) ?? 1;
            if (hours <= 0) hours = 1;
            final totalAmount = baseCostPerHour * hours;

            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              titlePadding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              contentPadding: const EdgeInsets.fromLTRB(24, 12, 24, 8),
              actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Gia hạn thêm giờ',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 20),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Chọn số giờ muốn gia hạn thêm cho đặt chỗ hiện tại.',
                    style: TextStyle(fontSize: 13, color: Colors.grey),
                  ),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.attach_money,
                          size: 20,
                          color: Colors.green.shade700,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Đơn giá mỗi giờ: ${_formatPrice(baseCostPerHour)} đ',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Colors.green.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Số giờ muốn gia hạn',
                      hintText: 'Ví dụ: 1, 2, 3...',
                      errorText: errorText,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: Colors.green.shade600,
                          width: 1.5,
                        ),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                    ),
                    onChanged: (_) => setState(() {
                      errorText = null;
                    }),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tổng tiền dự kiến',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Text(
                          '${_formatPrice(totalAmount)} đ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text(
                    'Hủy',
                    style: TextStyle(fontWeight: FontWeight.w500),
                  ),
                ),
                ElevatedButton(
                  onPressed: () {
                    final value = int.tryParse(controller.text.trim());
                    if (value == null || value <= 0) {
                      setState(() {
                        errorText = 'Vui lòng nhập số giờ hợp lệ (> 0).';
                      });
                      return;
                    }
                    Navigator.of(ctx).pop(value);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green.shade600,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                  ),
                  child: const Text(
                    'Xác nhận',
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Đặt chỗ của tôi'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _reservations.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
        ),
      );
    }

    if (_errorMessage != null && _reservations.isEmpty) {
      return _buildErrorState();
    }

    return Column(
      children: [
        ReservationFilterBar(
          statuses: _allStatuses,
          selectedStatus: _selectedStatusFilter,
          getStatusText: _getStatusText,
          getStatusColor: _getStatusColor,
          onStatusChanged: _onFilterChanged,
        ),
        Expanded(
          child: _reservations.isEmpty
              ? _buildEmptyState()
              : _buildReservationList(),
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
              onPressed: () => _loadReservations(),
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
                Icons.event_available_outlined,
                size: 64,
                color: Colors.green.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              _selectedStatusFilter == null
                  ? 'Chưa có đặt chỗ'
                  : 'Không có đặt chỗ phù hợp',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _selectedStatusFilter == null
                  ? 'Bạn chưa có đặt chỗ nào. Hãy đặt chỗ để sử dụng dịch vụ.'
                  : 'Không tìm thấy đặt chỗ với trạng thái "${_getStatusText(_selectedStatusFilter)}".',
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

  Widget _buildReservationList() {
    return RefreshIndicator(
      onRefresh: () => _loadReservations(),
      color: Colors.green.shade600,
      backgroundColor: Colors.white,
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 24),
        itemCount: _reservations.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _reservations.length) {
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
              _loadReservations(loadMore: true);
            });
            return const SizedBox.shrink();
          }

          final reservation = _reservations[index];
          return _buildReservationCard(reservation);
        },
      ),
    );
  }

  Widget _buildReservationCard(Map<String, dynamic> reservation) {
    final status = reservation['status'] as String?;
    final statusColor = _getStatusColor(status);
    final statusText = _getStatusText(status);
    final isCheckedIn = status?.toUpperCase() == 'CHECKED_IN';

    final reservationId =
        reservation['_id']?.toString() ?? reservation['id']?.toString();
    final isExtending =
        reservationId != null &&
        _extendingReservationIds.contains(reservationId);

    // Extract reservation details
    final parkingLot = reservation['parkingLotId'];
    final pricingPolicy = reservation['pricingPolicyId'];
    final userExpectedTime = reservation['userExpectedTime'];
    final prepaidAmount = reservation['prepaidAmount'] as int?;

    // Extract parking lot name and address
    final parkingLotName =
        parkingLot?['name'] ??
        parkingLot?['payload']?['name'] ??
        'Không xác định';

    // Extract address
    final addressId =
        parkingLot?['addressId'] ?? parkingLot?['payload']?['addressId'];
    String? addressText;
    if (addressId is Map) {
      final street = addressId['street'] ?? '';
      final ward = addressId['ward'] ?? '';
      final district = addressId['district'] ?? '';
      final city = addressId['city'] ?? '';
      final parts = [
        street,
        ward,
        district,
        city,
      ].where((part) => part.isNotEmpty).toList();
      addressText = parts.isNotEmpty ? parts.join(', ') : null;
    }

    final policyName = pricingPolicy?['name'] ?? 'Không có tên';

    final userExpectedTimeText = _formatDateTime(userExpectedTime);
    final prepaidAmountText = prepaidAmount != null
        ? '${_formatPrice(prepaidAmount)} đ'
        : null;

    return MyReservationCard(
      statusText: statusText,
      statusColor: statusColor,
      isCheckedIn: isCheckedIn,
      isExtending: isExtending,
      policyName: policyName,
      parkingLotName: parkingLotName,
      addressText: addressText,
      userExpectedTimeText: userExpectedTimeText,
      prepaidAmountText: prepaidAmountText,
      onTapQr: () => _showQRCodeDialog(reservation),
      onExtend: isCheckedIn && reservationId != null
          ? () => _handleExtendReservation(reservation)
          : null,
    );
  }

  void _showQRCodeDialog(Map<String, dynamic> reservation) {
    final identifier = reservation['reservationIdentifier'] as String?;

    if (identifier == null || identifier.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Không tìm thấy mã định danh của đặt chỗ'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    _showQRCodePopup(reservation, identifier);
  }

  void _showQRCodePopup(Map<String, dynamic> reservation, String identifier) {
    final parkingLot = reservation['parkingLotId'];
    final pricingPolicy = reservation['pricingPolicyId'];
    final policyName = pricingPolicy?['name'] ?? 'Không có tên';
    final parkingLotName =
        parkingLot?['name'] ??
        parkingLot?['payload']?['name'] ??
        'Không xác định';

    // Extract address
    final addressId =
        parkingLot?['addressId'] ?? parkingLot?['payload']?['addressId'];
    String? addressText;
    if (addressId is Map) {
      final street = addressId['street'] ?? '';
      final ward = addressId['ward'] ?? '';
      final district = addressId['district'] ?? '';
      final city = addressId['city'] ?? '';
      final parts = [
        street,
        ward,
        district,
        city,
      ].where((part) => part.isNotEmpty).toList();
      addressText = parts.isNotEmpty ? parts.join(', ') : null;
    }

    final userExpectedTime = reservation['userExpectedTime'];

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
                        'Mã QR Đặt chỗ',
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
                    // Reservation info card
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
                                Icons.event_available,
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
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
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
                              if (addressText != null &&
                                  addressText.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Padding(
                                  padding: const EdgeInsets.only(left: 24),
                                  child: Text(
                                    addressText,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.green.shade700,
                                      fontWeight: FontWeight.w400,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          if (userExpectedTime != null) ...[
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(
                                  Icons.access_time,
                                  size: 16,
                                  color: Colors.green.shade600,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _formatDateTime(userExpectedTime),
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
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    // QR Code container
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
