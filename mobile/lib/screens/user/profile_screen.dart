import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/widgets/app_scaffold.dart';
import 'profile/personal_info_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Map<String, dynamic>? _claims;

  @override
  void initState() {
    super.initState();
    _loadAndDecodeToken();
  }

  Future<void> _loadAndDecodeToken() async {
    // Thử đọc theo cả 2 key để tránh không đồng nhất
    String? token = await _storage.read(key: 'accessToken');
    token ??= await _storage.read(key: 'data');
    if (token == null || token.isEmpty) return;

    try {
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
      });
    } catch (_) {
      // ignore lỗi decode
    }
  }

  Widget _buildHeader(BuildContext context) {
    final String fullName = (_claims?['fullName'] ?? 'Người dùng').toString();
    final String role = (_claims?['role'] ?? '').toString();

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 200,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Colors.green.shade700, Colors.green.shade400],
            ),
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(28),
              bottomRight: Radius.circular(28),
            ),
          ),
        ),
        Positioned(
          top: 40,
          left: 20,
          child: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () {},
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: -40,
          child: Column(
            children: [
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  image: const DecorationImage(
                    image: AssetImage(
                      'assets/wired-outline-268-avatar-man-hover-glance.png',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                fullName,
                style: const TextStyle(
                  color: Colors.black87,
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              if (role.isNotEmpty)
                Text(
                  role,
                  style: const TextStyle(color: Colors.black54, fontSize: 12),
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
    bool selected = false,
  }) {
    final Color highlight = const Color(0xFF7C4DFF);
    return Container(
      decoration: BoxDecoration(
        color: selected ? highlight.withOpacity(0.06) : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(icon, color: Colors.black87),
        title: Text(title),
        trailing: trailing,
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final String email = (_claims?['email'] ?? '').toString();
    final String phone = (_claims?['phoneNumber'] ?? '').toString();
    final String role = (_claims?['role'] ?? '').toString();

    return AppScaffold(
      showBottomNav: false,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              _buildHeader(context),
              const SizedBox(height: 56),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    _buildTile(
                      icon: Icons.person_outline,
                      title: 'Thông tin cá nhân',
                      selected: true,
                      onTap: () {
                        if (_claims == null) return;
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) =>
                                PersonalInfoScreen(claims: _claims!),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 6),
                    _buildTile(
                      icon: Icons.email_outlined,
                      title: 'Tin nhắn',
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7C4DFF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          '0',
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                      onTap: () {},
                    ),
                    const SizedBox(height: 6),
                    _buildTile(
                      icon: Icons.favorite_border,
                      title: 'Từng đặt chỗ',
                      onTap: () {},
                    ),
                    const SizedBox(height: 6),
                    _buildTile(
                      icon: Icons.location_on_outlined,
                      title: 'Địa chỉ',
                      onTap: () {},
                    ),
                    const SizedBox(height: 6),
                    _buildTile(
                      icon: Icons.settings_outlined,
                      title: 'Cài đặt',
                      onTap: () {},
                    ),
                    const SizedBox(height: 16),

                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          await _storage.delete(key: 'accessToken');
                          await _storage.delete(key: 'data');
                          if (!mounted) return;
                          Navigator.pushReplacementNamed(context, '/login');
                        },
                        icon: const Icon(Icons.logout),
                        label: const Text('Đăng xuất'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          foregroundColor: Colors.black87,
                        ),
                      ),
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
