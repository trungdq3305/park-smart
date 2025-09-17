import 'package:flutter/material.dart';
import '../../services/user_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Map<String, dynamic>? userData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      final data = await UserService.getUserData();
      setState(() {
        userData = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      print('Error loading user data: $e');
    }
  }

  Future<void> _logout() async {
    await UserService.logout();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : userData == null
          ? const Center(child: Text('Không có thông tin người dùng'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Header với thông tin user
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundImage:
                                userData!['user']?['photoUrl'] != null
                                ? NetworkImage(userData!['user']['photoUrl'])
                                : null,
                            child: userData!['user']?['photoUrl'] == null
                                ? const Icon(Icons.person, size: 30)
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Chào mừng, ${userData!['user']?['name'] ?? 'User'}!',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text(
                                  userData!['user']?['email'] ?? 'No email',
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: _logout,
                            icon: const Icon(Icons.logout),
                            tooltip: 'Đăng xuất',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Thông tin đăng nhập
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Thông tin đăng nhập',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          _buildInfoRow(
                            'Loại đăng nhập',
                            userData!['loginType'] ?? 'N/A',
                          ),
                          _buildInfoRow(
                            'Thời gian',
                            userData!['loginTime'] != null
                                ? DateTime.parse(
                                    userData!['loginTime'],
                                  ).toString().substring(0, 19)
                                : 'N/A',
                          ),
                          _buildInfoRow(
                            'Có Backend Token',
                            userData!['backendToken'] != null ? 'Có' : 'Không',
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Nút làm mới
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _loadUserData,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Làm mới thông tin'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
