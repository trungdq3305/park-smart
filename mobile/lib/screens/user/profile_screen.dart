import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/screens/user/profile/reservation/my_reservations_screen.dart';
import 'package:mobile/screens/user/profile/termpolicy/term_and_policy_screen.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'package:mobile/services/user_service.dart';
import 'profile/infor/personal_info_screen.dart';
import 'profile/booking/booking_history_screen.dart';
import 'profile/subcription/my_subscriptions_screen.dart';
import 'profile/faqs/faqs_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with RouteAware {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Map<String, dynamic>? _claims;

  @override
  void initState() {
    super.initState();
    _loadAndDecodeToken();
  }

  @override
  void didPopNext() {
    // Reload data khi quay lại từ màn hình khác
    _loadAndDecodeToken();
  }

  Future<void> _loadAndDecodeToken() async {
    // Thử lấy dữ liệu từ API trước
    try {
      final apiData = await UserService.getUserProfile();
      if (apiData['data'] != null) {
        final userData = apiData['data'];
        final driverDetail = userData['driverDetail'];
        final adminDetail = userData['adminDetail'];
        final operatorDetail = userData['operatorDetail'];

        // Tạo claims từ API data
        final Map<String, dynamic> apiClaims = {
          'fullName':
              driverDetail?['fullName'] ??
              adminDetail?['fullName'] ??
              operatorDetail?['fullName'],
          'email': userData['email'],
          'phoneNumber': userData['phoneNumber'],
          'role': userData['roleName'],
          'gender': driverDetail?['gender'],
          'creditPoint': driverDetail?['creditPoint'],
          'isActive': userData['isActive'],
        };

        if (mounted) {
          setState(() {
            _claims = apiClaims;
          });
        }
        print('Loaded claims from API: $_claims');
        return;
      }
    } catch (e) {
      print('API Error, falling back to token: $e');
    }

    // Fallback: Thử đọc từ token
    String? token = await _storage.read(key: 'accessToken');
    token ??= await _storage.read(key: 'data');

    print('Token found: ${token != null ? 'Yes' : 'No'}');
    if (token == null || token.isEmpty) {
      print('No token found');
      return;
    }

    try {
      // Kiểm tra nếu token là JSON object thay vì JWT
      if (token.startsWith('{')) {
        final Map<String, dynamic> jsonMap = json.decode(token);
        if (!mounted) return;
        setState(() {
          _claims = jsonMap;
        });
        print('Loaded claims from JSON: $_claims');
        return;
      }

      // Xử lý JWT token
      final parts = token.split('.');
      if (parts.length != 3) {
        print('Invalid JWT format');
        return;
      }

      String payload = parts[1].padRight(
        parts[1].length + ((4 - parts[1].length % 4) % 4),
        '=',
      );
      final decoded = utf8.decode(base64Url.decode(payload));
      final Map<String, dynamic> jsonMap = json.decode(decoded);
      if (!mounted) return;
      setState(() {
        _claims = jsonMap;
      });
      print('Loaded claims from JWT: $_claims');
    } catch (e) {
      print('Error decoding token: $e');
      // Thử lấy thông tin từ UserService
      try {
        final userData = await UserService.getUserData();
        if (userData != null && mounted) {
          setState(() {
            _claims = userData;
          });
          print('Loaded claims from UserService: $_claims');
        }
      } catch (e) {
        print('Error loading from UserService: $e');
      }
    }
  }

  String _getDisplayName() {
    return _claims?['fullName'] ??
        _claims?['name'] ??
        _claims?['user']?['name'] ??
        'Người dùng';
  }

  String? _getUserPhoto() {
    return _claims?['picture'] ??
        _claims?['photoUrl'] ??
        _claims?['avatar'] ??
        _claims?['user']?['photoUrl'];
  }

  Widget _buildHeader(BuildContext context) {
    final String fullName = _getDisplayName();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        // Blue gradient background
        Container(
          height: 280,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Colors.green, Colors.green],
            ),
          ),
          child: Stack(
            children: [
              // Background city buildings pattern
              Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: CustomPaint(
                  size: const Size(double.infinity, 100),
                  painter: _CityBackgroundPainter(),
                ),
              ),
            ],
          ),
        ),
        // Title
        Positioned(
          top: 50,
          left: 0,
          right: 0,
          child: const Text(
            'Thông tin tài khoản',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        // Avatar and user info
        Positioned(
          left: 0,
          right: 0,
          bottom: 20,
          child: Column(
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                ),
                child: ClipOval(
                  child: _getUserPhoto() != null
                      ? Image.network(
                          _getUserPhoto()!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Icon(
                              Icons.person,
                              size: 70,
                              color: Colors.white,
                            );
                          },
                        )
                      : const Icon(Icons.person, size: 70, color: Colors.white),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                fullName,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 24,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTile({
    required IconData icon,
    required String title,
    Widget? trailing,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
      child: ListTile(
        leading: Icon(icon, color: Colors.black87, size: 24),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        trailing:
            trailing ??
            const Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.black54,
            ),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildHeader(context),
              // White content card
              Container(
                margin: const EdgeInsets.only(top: 20),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(28),
                    topRight: Radius.circular(28),
                  ),
                ),
                child: Column(
                  children: [
                    // _buildLogo(),
                    _buildTile(
                      icon: Icons.person_outline,
                      title: 'Thông tin cá nhân',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                PersonalInfoScreen(claims: _claims ?? {}),
                          ),
                        );
                      },
                    ),
                    _buildTile(
                      icon: Icons.confirmation_num_outlined,
                      title: 'Gói thuê bao đã đăng ký',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const MySubscriptionsScreen(),
                          ),
                        );
                      },
                    ),
                    _buildTile(
                      icon: Icons.confirmation_number_outlined,
                      title: 'Vé đặt chỗ',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const MyReservationsScreen(),
                          ),
                        );
                      },
                    ),

                    _buildTile(
                      icon: Icons.history_outlined,
                      title: 'Lịch sử đặt chỗ',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const BookingHistoryScreen(),
                          ),
                        );
                      },
                    ),
                    _buildTile(
                      icon: Icons.confirmation_number_outlined,
                      title: 'Mã giảm giá',
                      onTap: () {
                        // TODO: Navigate to tickets screen
                      },
                    ),
                    _buildTile(
                      icon: Icons.question_answer_outlined,
                      title: 'Các câu hỏi thường gặp',
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const FaqsScreen(),
                          ),
                        );
                      },
                    ),
                    _buildTile(
                      icon: Icons.note_alt_outlined,
                      title: 'Điều khoản & Chính sách',
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const TermAndPolicyScreen(),
                          ),
                        );
                      },
                    ),

                    // Debug menu item
                    const SizedBox(height: 20),
                    // Logout button
                    Container(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: ListTile(
                        leading: const Icon(
                          Icons.logout,
                          color: Colors.red,
                          size: 24,
                        ),
                        title: const Text(
                          'Đăng xuất',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.red,
                          ),
                        ),
                        onTap: () async {
                          await _storage.delete(key: 'accessToken');
                          await _storage.delete(key: 'data');
                          if (!mounted) return;
                          Navigator.pushReplacementNamed(context, '/login');
                        },
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
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

class _CityBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    // Draw simple building silhouettes
    final double buildingWidth = size.width / 8;
    final double buildingHeight = size.height * 0.6;

    for (int i = 0; i < 8; i++) {
      final double x = i * buildingWidth;
      final double height = buildingHeight * (0.5 + (i % 3) * 0.2);
      final double y = size.height - height;

      canvas.drawRect(Rect.fromLTWH(x, y, buildingWidth * 0.8, height), paint);
    }

    // Draw a simple bus
    final double busWidth = size.width * 0.15;
    final double busHeight = size.height * 0.2;
    final double busX = size.width * 0.7;
    final double busY = size.height - busHeight - 10;

    canvas.drawRect(Rect.fromLTWH(busX, busY, busWidth, busHeight), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
