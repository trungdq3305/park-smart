import 'package:flutter/material.dart';
import '../../../widgets/app_scaffold.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> parkingLot;

  const BookingScreen({super.key, required this.parkingLot});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _licensePlateController = TextEditingController();
  final _durationController = TextEditingController();

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _licensePlateController.dispose();
    _durationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Extract data from parking lot
    final addressId = widget.parkingLot['addressId'];
    final availableSpots = widget.parkingLot['availableSpots'] ?? 0;
    final totalCapacityEachLevel =
        widget.parkingLot['totalCapacityEachLevel'] ?? 0;
    final totalLevel = widget.parkingLot['totalLevel'] ?? 1;
    final totalSlots = totalCapacityEachLevel * totalLevel;
    final address = addressId?['fullAddress'] ?? 'Không có địa chỉ';
    final openTime = widget.parkingLot['openTime'] ?? 'N/A';
    final closeTime = widget.parkingLot['closeTime'] ?? 'N/A';
    final is24Hours = widget.parkingLot['is24Hours'] ?? false;
    final pricePerHour = widget.parkingLot['pricePerHour'];

    return AppScaffold(
      showBottomNav: false,
      body: Scaffold(
        appBar: AppBar(
          title: const Text('Đặt chỗ đỗ xe'),
          backgroundColor: Colors.green,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Parking lot info card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
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
                      Row(
                        children: [
                          Icon(
                            Icons.local_parking,
                            color: Colors.green.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Thông tin bãi đỗ xe',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Address
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            Icons.location_on,
                            color: Colors.grey.shade600,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              address,
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Operating hours
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            color: Colors.grey.shade600,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            is24Hours
                                ? 'Mở cửa 24/7'
                                : 'Giờ mở cửa: $openTime - $closeTime',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade700,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Availability
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: availableSpots > 0
                              ? Colors.green.shade50
                              : Colors.red.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: availableSpots > 0
                                ? Colors.green.shade200
                                : Colors.red.shade200,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              availableSpots > 0
                                  ? Icons.check_circle
                                  : Icons.warning,
                              color: availableSpots > 0
                                  ? Colors.green
                                  : Colors.red,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              availableSpots > 0
                                  ? 'Còn $availableSpots/$totalSlots chỗ trống'
                                  : 'Hết chỗ trống',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: availableSpots > 0
                                    ? Colors.green.shade700
                                    : Colors.red.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Price info
                      if (pricePerHour != null) ...[
                        Row(
                          children: [
                            Icon(
                              Icons.attach_money,
                              color: Colors.grey.shade600,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Giá: $pricePerHour VND/giờ',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Booking form
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
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
                      Row(
                        children: [
                          Icon(
                            Icons.person,
                            color: Colors.green.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'Thông tin đặt chỗ',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Name field
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Họ và tên *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập họ và tên';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Phone field
                      TextFormField(
                        controller: _phoneController,
                        decoration: const InputDecoration(
                          labelText: 'Số điện thoại *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.phone_outlined),
                        ),
                        keyboardType: TextInputType.phone,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập số điện thoại';
                          }
                          if (value.length < 10) {
                            return 'Số điện thoại phải có ít nhất 10 số';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // License plate field
                      TextFormField(
                        controller: _licensePlateController,
                        decoration: const InputDecoration(
                          labelText: 'Biển số xe *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.directions_car_outlined),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập biển số xe';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Duration field
                      TextFormField(
                        controller: _durationController,
                        decoration: const InputDecoration(
                          labelText: 'Thời gian dự kiến (giờ) *',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.access_time_outlined),
                          suffixText: 'giờ',
                        ),
                        keyboardType: TextInputType.number,
                        validator: (value) {
                          if (value == null || value.isEmpty) {
                            return 'Vui lòng nhập thời gian dự kiến';
                          }
                          final duration = int.tryParse(value);
                          if (duration == null || duration <= 0) {
                            return 'Thời gian phải là số dương';
                          }
                          if (duration > 24) {
                            return 'Thời gian không được vượt quá 24 giờ';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),

                      // Estimated cost
                      if (pricePerHour != null &&
                          _durationController.text.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.blue.shade200),
                          ),
                          child: Row(
                            children: [
                              Icon(
                                Icons.calculate,
                                color: Colors.blue.shade600,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Chi phí dự kiến: ${_calculateEstimatedCost(pricePerHour)} VND',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.blue.shade700,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Terms and conditions
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  Icons.info_outline,
                                  color: Colors.orange.shade600,
                                  size: 20,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  'Điều khoản và điều kiện:',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.orange.shade700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '• Đặt chỗ có hiệu lực trong 30 phút kể từ khi xác nhận\n'
                              '• Vui lòng đến đúng giờ, chỗ đỗ có thể bị hủy nếu trễ quá 15 phút\n'
                              '• Chi phí có thể thay đổi tùy theo thời gian thực tế sử dụng\n'
                              '• Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submitBooking,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'Xác nhận đặt chỗ',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _calculateEstimatedCost(dynamic pricePerHour) {
    final duration = int.tryParse(_durationController.text);
    if (duration == null || duration <= 0) return '0';

    final price = int.tryParse(pricePerHour.toString()) ?? 0;
    final total = duration * price;

    return total.toString();
  }

  Future<void> _submitBooking() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (widget.parkingLot['availableSpots'] <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bãi đỗ xe đã hết chỗ trống'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // TODO: Implement actual booking API call
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Đặt chỗ thành công! Bạn sẽ nhận được thông báo xác nhận.',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate back to parking lot screen
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi đặt chỗ: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}
