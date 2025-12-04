import 'package:flutter/material.dart';
import '../../../../services/promotion_service.dart';
import '../../../../widgets/app_scaffold.dart';

class PromotionScreen extends StatefulWidget {
  const PromotionScreen({super.key});

  @override
  State<PromotionScreen> createState() => _PromotionScreenState();
}

class _PromotionScreenState extends State<PromotionScreen> {
  List<Map<String, dynamic>> _promotions = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _selectedFilter; // 'all', 'active', 'inactive', 'expired'

  @override
  void initState() {
    super.initState();
    _selectedFilter = 'all';
    _loadPromotions();
  }

  Future<void> _loadPromotions() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await PromotionService.getAllPromotions();

      final promotionsData = response['data'];
      List<Map<String, dynamic>> promotions = [];

      if (promotionsData is List) {
        promotions = List<Map<String, dynamic>>.from(promotionsData);
      } else if (promotionsData is Map) {
        if (promotionsData['data'] is List) {
          promotions = List<Map<String, dynamic>>.from(promotionsData['data']);
        }
      }

      setState(() {
        _promotions = promotions;
        _isLoading = false;
      });
    } catch (e) {
      print('❌ Error loading promotions: $e');
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
        _promotions = [];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi tải danh sách khuyến mãi: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> _getFilteredPromotions() {
    if (_selectedFilter == 'all') {
      return _promotions;
    }

    return _promotions.where((promotion) {
      final statusStr = promotion['status']?.toString();
      final status = statusStr?.toUpperCase();
      final isActive = promotion['isActive'] == true;

      switch (_selectedFilter) {
        case 'active':
          return isActive || status == 'ACTIVE';
        case 'inactive':
          return !isActive && status != 'ACTIVE' && status != 'EXPIRED';
        case 'expired':
          return status == 'EXPIRED';
        default:
          return true;
      }
    }).toList();
  }

  String _formatDiscount(dynamic discountValue, String? discountType) {
    if (discountValue == null) return '0';

    if (discountType?.toUpperCase() == 'PERCENTAGE') {
      return '${discountValue}%';
    } else {
      final amount = discountValue is num ? discountValue.toInt() : 0;
      return '${amount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} đ';
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

  Color _getStatusColor(String? status, bool isActive) {
    if (isActive || status?.toUpperCase() == 'ACTIVE') {
      return Colors.green;
    } else if (status?.toUpperCase() == 'EXPIRED') {
      return Colors.red;
    } else {
      return Colors.grey;
    }
  }

  String _getStatusText(String? status, bool isActive) {
    if (isActive || status?.toUpperCase() == 'ACTIVE') {
      return 'Đang hoạt động';
    } else if (status?.toUpperCase() == 'EXPIRED') {
      return 'Đã hết hạn';
    } else {
      return 'Không hoạt động';
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Tất cả khuyến mãi'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _promotions.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
        ),
      );
    }

    if (_errorMessage != null && _promotions.isEmpty) {
      return _buildErrorState();
    }

    final filteredPromotions = _getFilteredPromotions();

    return Column(
      children: [
        _buildFilterBar(),
        Expanded(
          child: filteredPromotions.isEmpty
              ? _buildEmptyState()
              : _buildPromotionList(filteredPromotions),
        ),
      ],
    );
  }

  Widget _buildFilterBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip('all', 'Tất cả'),
            const SizedBox(width: 8),
            _buildFilterChip('active', 'Đang hoạt động'),
            const SizedBox(width: 8),
            _buildFilterChip('inactive', 'Không hoạt động'),
            const SizedBox(width: 8),
            _buildFilterChip('expired', 'Đã hết hạn'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filter, String label) {
    final isSelected = _selectedFilter == filter;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = filter;
          });
        }
      },
      selectedColor: Colors.green.shade100,
      backgroundColor: Colors.grey.shade100,
      labelStyle: TextStyle(
        color: isSelected ? Colors.green.shade700 : Colors.grey.shade700,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
      side: BorderSide(
        color: isSelected ? Colors.green.shade600 : Colors.grey.shade300,
        width: isSelected ? 2 : 1,
      ),
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
              onPressed: () => _loadPromotions(),
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
                Icons.local_offer_outlined,
                size: 64,
                color: Colors.green.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Không có khuyến mãi',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _selectedFilter == 'all'
                  ? 'Hiện tại không có khuyến mãi nào.'
                  : 'Không tìm thấy khuyến mãi phù hợp với bộ lọc.',
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

  Widget _buildPromotionList(List<Map<String, dynamic>> promotions) {
    return RefreshIndicator(
      onRefresh: () => _loadPromotions(),
      color: Colors.green.shade600,
      backgroundColor: Colors.white,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: promotions.length,
        itemBuilder: (context, index) {
          return _buildPromotionCard(promotions[index]);
        },
      ),
    );
  }

  Widget _buildPromotionCard(Map<String, dynamic> promotion) {
    final name = promotion['name']?.toString() ?? 'Khuyến mãi';
    final description = promotion['description']?.toString();
    final discountValue = promotion['discountValue'];
    final discountType = promotion['discountType']?.toString();
    final status = promotion['status']?.toString();
    final startDate = promotion['startDate']?.toString();
    final endDate = promotion['endDate']?.toString();
    final code = promotion['code']?.toString();
    final isActive =
        status?.toUpperCase() == 'ACTIVE' || promotion['isActive'] == true;
    final maxDiscountAmount = promotion['maxDiscountAmount'];
    final totalUsageLimit = promotion['totalUsageLimit'];
    final currentUsageCount = promotion['currentUsageCount'] ?? 0;

    final discountText = _formatDiscount(discountValue, discountType);
    final statusColor = _getStatusColor(status, isActive);
    final statusText = _getStatusText(status, isActive);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? Colors.green.shade200 : Colors.grey.shade300,
          width: isActive ? 2 : 1.5,
        ),
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
          // Header with discount badge
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isActive ? Colors.green.shade50 : Colors.grey.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: isActive
                              ? Colors.green.shade900
                              : Colors.grey.shade700,
                        ),
                      ),
                      if (description != null && description.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          description,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isActive
                        ? Colors.green.shade600
                        : Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    discountText,
                    style: const TextStyle(
                      fontSize: 18,
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
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Code
                if (code != null && code.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300, width: 1),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.confirmation_number,
                          size: 18,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Mã: $code',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade800,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                // Status
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isActive ? Icons.check_circle : Icons.cancel,
                            size: 14,
                            color: statusColor,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            statusText,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                // Dates
                if (startDate != null || endDate != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${_formatDate(startDate)} - ${_formatDate(endDate)}',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ],
                // Max discount and usage
                if (maxDiscountAmount != null || totalUsageLimit != null) ...[
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      if (maxDiscountAmount != null) ...[
                        Icon(
                          Icons.attach_money,
                          size: 16,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Giảm tối đa: ${_formatDiscount(maxDiscountAmount, 'FIXED')}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (totalUsageLimit != null) ...[
                        Icon(
                          Icons.people,
                          size: 16,
                          color: Colors.grey.shade600,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Đã dùng: $currentUsageCount/$totalUsageLimit',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
