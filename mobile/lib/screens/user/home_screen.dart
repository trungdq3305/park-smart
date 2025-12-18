import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'profile/reservation/my_reservations_screen.dart';
import 'profile/subcription/my_subscriptions_screen.dart';
import 'profile/faqs/faqs_screen.dart';
import 'profile/termpolicy/term_and_policy_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  Map<String, dynamic>? _claims;
  String? _userName;

  @override
  void initState() {
    super.initState();
    _loadAndDecodeToken();
  }

  Future<void> _loadAndDecodeToken() async {
    String? token = await _storage.read(key: 'accessToken');
    token ??= await _storage.read(key: 'data');

    if (token == null || token.isEmpty) {
      setState(() {
        _userName = 'Người dùng';
      });
      return;
    }

    try {
      if (token.startsWith('{')) {
        final Map<String, dynamic> jsonMap = json.decode(token);
        if (!mounted) return;
        setState(() {
          _claims = jsonMap;
          _userName = _getDisplayName();
        });
        return;
      }

      final parts = token.split('.');
      if (parts.length != 3) return;

      String payload = parts[1].padRight(
        parts[1].length + ((4 - parts[1].length % 4) % 4),
        '=',
      );
      final decoded = utf8.decode(base64Url.decode(payload));
      final Map<String, dynamic> jsonMap = json.decode(decoded);
      if (!mounted) return;
      setState(() {
        _claims = jsonMap;
        _userName = _getDisplayName();
      });
    } catch (e) {
      setState(() {
        _userName = 'Người dùng';
      });
    }
  }

  String _getDisplayName() {
    return _claims?['fullName'] ??
        _claims?['name'] ??
        _claims?['user']?['name'] ??
        'Người dùng';
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return AppScaffold(
      currentIndex: 0,
      onTapBottomNav: (index) {
        switch (index) {
          case 1:
            Navigator.pushReplacementNamed(context, '/parking');
            break;
          case 2:
            Navigator.pushReplacementNamed(context, '/tickets');
            break;
          case 3:
            Navigator.pushReplacementNamed(context, '/history');
            break;
          case 4:
            Navigator.pushReplacementNamed(context, '/profile');
            break;
        }
      },
      body: SafeArea(
        child: Container(
          height: size.height,
          width: size.width,
          child: SingleChildScrollView(
            child: Column(
              children: [
                _buildHeader(size),
                _buildDestinationInput(size),
                // _buildVehicleSelection(size),
                _buildParkingInfoSection(),
                _buildQuickActionsSection(),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Size size) {
    return Container(
      height: size.height * 0.3,
      width: size.width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green.shade400, Colors.green.shade600],
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _MapBackgroundPainter())),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 30),
                Text(
                  'Xin chào ${_userName ?? 'Người dùng'}!',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Bạn muốn gửi xe ở đâu?',
                  style: TextStyle(fontSize: 20, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDestinationInput(Size size) {
    return Transform.translate(
      offset: const Offset(0, -30),
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              offset: const Offset(0, 8),
              spreadRadius: 2,
            ),
          ],
        ),
        child: Row(
          children: [
            Icon(Icons.location_on, color: Colors.green.shade700, size: 28),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                'Tìm kiếm bãi đỗ xe',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget _buildVehicleSelection(Size size) {
  //   return Container(
  //     margin: const EdgeInsets.symmetric(horizontal: 20),
  //     child: Row(
  //       mainAxisAlignment: MainAxisAlignment.spaceEvenly,
  //       children: [
  //         _buildVehicleCard('Xe 4 chỗ', Icons.directions_car, 4, Colors.green),
  //         _buildVehicleCard('Xe 6 chỗ', Icons.directions_car, 6, Colors.green),
  //         _buildVehicleCard('BIKE', Icons.motorcycle, 1, Colors.green),
  //       ],
  //     ),
  //   );
  // }

  Widget _buildVehicleCard(
    String title,
    IconData icon,
    int capacity,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Icon(icon, size: 30, color: Colors.green.shade700),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$capacity',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.green.shade700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildParkingInfoSection() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 20, 20, 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green.shade600, Colors.green.shade700],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.local_parking,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Text(
                        'Bãi đỗ xe thông minh',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildInfoRow(
                  Icons.location_on,
                  'Tìm bãi đỗ gần bạn',
                  Colors.white.withOpacity(0.9),
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.access_time,
                  'Đặt chỗ nhanh chóng',
                  Colors.white.withOpacity(0.9),
                ),
                const SizedBox(height: 8),
                _buildInfoRow(
                  Icons.security,
                  'An toàn và tiện lợi',
                  Colors.white.withOpacity(0.9),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.white.withOpacity(0.3),
                width: 2,
              ),
            ),
            child: const Icon(
              Icons.directions_car,
              size: 50,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, Color color) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Dịch vụ',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.5,
            children: [
              _buildActionCard(
                'Đặt chỗ',
                Icons.event_available,
                Colors.green,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const MyReservationsScreen(),
                  ),
                ),
              ),
              _buildActionCard(
                'Gói thuê bao',
                Icons.confirmation_number,
                Colors.blue,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const MySubscriptionsScreen(),
                  ),
                ),
              ),
              _buildActionCard(
                'Câu hỏi thường gặp',
                Icons.help_outline,
                Colors.orange,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const FaqsScreen()),
                ),
              ),
              _buildActionCard(
                'Điều khoản & Chính sách',
                Icons.description,
                Colors.purple,
                () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const TermAndPolicyScreen(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard(
    String title,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 15,
                offset: const Offset(0, 5),
                spreadRadius: 1,
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    for (int i = 0; i < 5; i++) {
      final double y = size.height * 0.2 + (i * size.height * 0.15);
      canvas.drawRect(Rect.fromLTWH(0, y, size.width, 2), paint);
    }

    for (int i = 0; i < 8; i++) {
      final double x = i * size.width / 8;
      final double height = (i % 3 + 1) * 30;
      final double y = size.height - height - 20;
      canvas.drawRect(Rect.fromLTWH(x, y, size.width / 8 - 6, height), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
