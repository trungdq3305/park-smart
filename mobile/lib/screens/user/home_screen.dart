import 'package:flutter/material.dart';
import 'package:mobile/screens/user/parking_lot_screen.dart';
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'profile/reservation/my_reservations_screen.dart';
import 'profile/subcription/my_subscriptions_screen.dart';
import 'profile/faqs/faqs_screen.dart';
import 'profile/termpolicy/term_and_policy_screen.dart';

class HomeScreen extends StatefulWidget {
  // Thêm tham số onNavigateToTab vào constructor
  final Function(int)? onNavigateToTab;

  const HomeScreen({super.key, this.onNavigateToTab});

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
      if (mounted) setState(() => _userName = 'Người dùng');
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
      if (mounted) setState(() => _userName = 'Người dùng');
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

    // QUAN TRỌNG: Không dùng AppScaffold ở đây vì MainWrapper đã bọc bên ngoài rồi
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: SizedBox(
          height: size.height,
          width: size.width,
          child: SingleChildScrollView(
            child: Column(
              children: [
                _buildHeader(size),
                _buildDestinationInput(context, size, () {
                  // Gọi callback để MainWrapper đổi Tab sang index 2
                  if (widget.onNavigateToTab != null) {
                    widget.onNavigateToTab!(2);
                  }
                }),
                _buildParkingInfoSection(),
                _buildQuickActionsSection(),
                const SizedBox(
                  height: 100,
                ), // Khoảng cách để không bị che bởi BottomNav
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(Size size) {
    return Container(
      height: size.height * 0.28,
      width: size.width,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green.shade500, Colors.green.shade700],
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
                const SizedBox(height: 20),
                Text(
                  'Xin chào,',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.white.withOpacity(0.9),
                  ),
                ),
                Text(
                  _userName ?? 'Người dùng',
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Bạn muốn gửi xe ở đâu?',
                  style: TextStyle(fontSize: 18, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDestinationInput(
    BuildContext context,
    Size size,
    VoidCallback onSearchClick,
  ) {
    return Transform.translate(
      offset: const Offset(0, -30),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: InkWell(
          onTap: onSearchClick,
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
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
        ),
      ),
    );
  }

  Widget _buildParkingInfoSection() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.green.shade600, Colors.green.shade700],
        ),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Bãi đỗ xe thông minh',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _buildInfoRow(Icons.location_on, 'Tìm bãi đỗ gần bạn'),
                const SizedBox(height: 8),
                _buildInfoRow(Icons.access_time, 'Đặt chỗ nhanh chóng'),
              ],
            ),
          ),
          const Icon(Icons.directions_car, size: 60, color: Colors.white24),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white70),
        const SizedBox(width: 8),
        Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13)),
      ],
    );
  }

  Widget _buildQuickActionsSection() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Dịch vụ',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.3,
            children: [
              _buildActionCard(
                'Đặt chỗ',
                Icons.event_available,
                Colors.green,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MyReservationsScreen(),
                    ),
                  );
                },
              ),
              _buildActionCard(
                'Gói thuê bao',
                Icons.confirmation_number,
                Colors.blue,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const MySubscriptionsScreen(),
                    ),
                  );
                },
              ),
              _buildActionCard(
                'Hỏi đáp',
                Icons.help_outline,
                Colors.orange,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const FaqsScreen()),
                  );
                },
              ),
              _buildActionCard(
                'Điều khoản',
                Icons.description,
                Colors.purple,
                () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const TermAndPolicyScreen(),
                    ),
                  );
                },
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
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _MapBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.white.withOpacity(0.05)
      ..strokeWidth = 1.0;

    for (int i = 0; i < 10; i++) {
      canvas.drawLine(Offset(0, i * 30.0), Offset(size.width, i * 30.0), paint);
      canvas.drawLine(
        Offset(i * 50.0, 0),
        Offset(i * 50.0, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
