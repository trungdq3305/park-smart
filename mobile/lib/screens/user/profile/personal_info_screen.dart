import 'package:flutter/material.dart';
import 'package:mobile/services/user_service.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class PersonalInfoScreen extends StatefulWidget {
  final Map<String, dynamic> claims;

  const PersonalInfoScreen({super.key, required this.claims});

  @override
  State<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends State<PersonalInfoScreen> {
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
    if (mounted) {
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  // Helper methods để lấy thông tin từ cả claims và userData
  String _getUserId() {
    return widget.claims['sub'] ??
        widget.claims['id'] ??
        userData?['user']?['id'] ??
        'N/A';
  }

  String _getUserEmail() {
    return widget.claims['email'] ?? userData?['user']?['email'] ?? 'N/A';
  }

  String _getUserName() {
    return widget.claims['name'] ??
        widget.claims['fullName'] ??
        userData?['user']?['name'] ??
        'N/A';
  }

  String _getFullName() {
    return widget.claims['fullName'] ??
        widget.claims['name'] ??
        userData?['user']?['name'] ??
        'N/A';
  }

  String _getUserRole() {
    return widget.claims['role'] ?? widget.claims['roles'] ?? 'N/A';
  }

  String _getUserPhone() {
    return widget.claims['phone'] ??
        widget.claims['phoneNumber'] ??
        userData?['user']?['phone'] ??
        'N/A';
  }

  String? _getUserPhoto() {
    return widget.claims['picture'] ??
        widget.claims['photoUrl'] ??
        userData?['user']?['photoUrl'];
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: true,
      currentIndex: 4, // Profile tab index (last tab)
      onTapBottomNav: (index) {
        // Handle bottom navigation
        switch (index) {
          case 0:
            Navigator.pushReplacementNamed(context, '/home');
            break;
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
            // Already on profile page
            break;
        }
      },
      appBar: AppBar(
        title: const Text('Thông tin cá nhân'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: _logout),
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header với ảnh đại diện
                  Center(
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 50,
                          backgroundImage: _getUserPhoto() != null
                              ? NetworkImage(_getUserPhoto()!)
                              : null,
                          child: _getUserPhoto() == null
                              ? const Icon(Icons.person, size: 50)
                              : null,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _getUserName(),
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _getUserEmail(),
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Thông tin chi tiết
                  const Text(
                    'Thông tin chi tiết',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),

                  _buildInfoCard('ID', _getUserId()),
                  _buildInfoCard('Email', _getUserEmail()),
                  _buildInfoCard('Tên đầy đủ', _getFullName()),
                  _buildInfoCard('Vai trò', _getUserRole()),
                  _buildInfoCard('Số điện thoại', _getUserPhone()),
                  _buildInfoCard(
                    'Loại đăng nhập',
                    userData?['loginType'] ?? 'N/A',
                  ),
                  _buildInfoCard(
                    'Thời gian đăng nhập',
                    userData?['loginTime'] != null
                        ? DateTime.parse(userData!['loginTime']).toString()
                        : 'N/A',
                  ),

                  const SizedBox(height: 16),

                  // Tokens (ẩn một phần để bảo mật)

                  // Nút refresh
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _loadUserData,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        'Làm mới thông tin',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoCard(String label, String value) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 120,
              child: Text(
                '$label:',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
          ],
        ),
      ),
    );
  }
}
