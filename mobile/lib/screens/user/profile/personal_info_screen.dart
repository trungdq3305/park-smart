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
  Map<String, dynamic>? apiUserData;
  bool isLoading = true;
  bool isEditing = false;

  // Controllers for editing
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  String _selectedGender = 'Nam';

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      // Load local data first
      final localData = await UserService.getUserData();
      setState(() {
        userData = localData;
      });

      // Then try to load from API
      try {
        final apiData = await UserService.getUserProfile();
        setState(() {
          apiUserData = apiData;
          isLoading = false;
        });
      } catch (apiError) {
        print('API Error: $apiError');
        // Nếu API fail, vẫn hiển thị local data
        setState(() {
          isLoading = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Không thể tải dữ liệu từ server. Hiển thị thông tin local.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
      }
    } catch (e) {
      setState(() {
        isLoading = false;
      });
      print('Error loading user data: $e');
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Lỗi tải dữ liệu: $e')));
    }
  }

  Future<void> _saveChanges() async {
    try {
      await UserService.updatePersonalInfo(
        fullName: _fullNameController.text.isNotEmpty
            ? _fullNameController.text
            : null,
        phoneNumber: _phoneController.text.isNotEmpty
            ? _phoneController.text
            : null,
        gender: _selectedGender == 'Nam',
      );

      // Reload data after successful update
      await _loadUserData();

      setState(() {
        isEditing = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật thông tin thành công')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Lỗi cập nhật: $e')));
      }
    }
  }

  void _startEditing() {
    setState(() {
      isEditing = true;
      _fullNameController.text = _getFullName();
      _phoneController.text = _getUserPhone();
      _selectedGender = _getUserGender() == 'Nam' ? 'Nam' : 'Nữ';
    });
  }

  void _cancelEditing() {
    setState(() {
      isEditing = false;
      _fullNameController.clear();
      _phoneController.clear();
    });
  }

  // Helper methods để lấy thông tin từ API response với fallback về local data
  String _getUserId() {
    return apiUserData?['data']?['_id'] ??
        widget.claims['sub'] ??
        widget.claims['id'] ??
        'N/A';
  }

  String _getUserEmail() {
    return apiUserData?['data']?['email'] ??
        widget.claims['email'] ??
        userData?['user']?['email'] ??
        'N/A';
  }

  String _getUserName() {
    return apiUserData?['data']?['adminDetail']?['fullName'] ??
        apiUserData?['data']?['driverDetail']?['fullName'] ??
        apiUserData?['data']?['operatorDetail']?['fullName'] ??
        widget.claims['name'] ??
        widget.claims['fullName'] ??
        userData?['user']?['name'] ??
        'N/A';
  }

  String _getFullName() {
    return apiUserData?['data']?['adminDetail']?['fullName'] ??
        apiUserData?['data']?['driverDetail']?['fullName'] ??
        apiUserData?['data']?['operatorDetail']?['fullName'] ??
        widget.claims['fullName'] ??
        widget.claims['name'] ??
        userData?['user']?['name'] ??
        'N/A';
  }

  String _getUserRole() {
    return apiUserData?['data']?['roleName'] ??
        widget.claims['role'] ??
        widget.claims['roles'] ??
        'N/A';
  }

  String _getUserPhone() {
    return apiUserData?['data']?['phoneNumber'] ??
        widget.claims['phone'] ??
        widget.claims['phoneNumber'] ??
        userData?['user']?['phone'] ??
        'N/A';
  }

  String? _getUserPhoto() {
    return widget.claims['picture'] ??
        widget.claims['photoUrl'] ??
        userData?['user']?['photoUrl'];
  }

  String _getUserGender() {
    // Ưu tiên API data
    final apiGender =
        apiUserData?['data']?['driverDetail']?['gender'] ??
        apiUserData?['data']?['adminDetail']?['gender'] ??
        apiUserData?['data']?['operatorDetail']?['gender'];

    print('API Gender value: $apiGender (type: ${apiGender.runtimeType})');

    if (apiGender != null) {
      // Backend trả về True cho nam, False cho nữ
      final result = apiGender == true ? 'Nam' : 'Nữ';
      print('Gender result: $result');
      return result;
    }

    // Fallback về claims hoặc local data
    final claimsGender = widget.claims['gender'];
    if (claimsGender != null) {
      if (claimsGender == 'True' ||
          claimsGender == 'true' ||
          claimsGender == 'male' ||
          claimsGender == 'Nam') {
        return 'Nam';
      } else if (claimsGender == 'False' ||
          claimsGender == 'false' ||
          claimsGender == 'female' ||
          claimsGender == 'Nữ') {
        return 'Nữ';
      }
    }

    return 'N/A';
  }

  String _getDepartment() {
    return apiUserData?['data']?['adminDetail']?['department'] ?? 'N/A';
  }

  String _getPosition() {
    return apiUserData?['data']?['adminDetail']?['position'] ?? 'N/A';
  }

  String _getLastLogin() {
    final lastLogin = apiUserData?['data']?['lastLoginAt'];
    if (lastLogin == null) return 'N/A';
    try {
      final date = DateTime.parse(lastLogin);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'N/A';
    }
  }

  // Lấy điểm uy tín
  int _getCreditPoint() {
    return apiUserData?['data']?['driverDetail']?['creditPoint'] ?? 0;
  }

  // Lấy trạng thái hoạt động
  bool _getIsActive() {
    return apiUserData?['data']?['isActive'] ?? false;
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
          if (!isEditing)
            IconButton(icon: const Icon(Icons.edit), onPressed: _startEditing),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Thông tin chi tiết',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (isEditing)
                        Row(
                          children: [
                            TextButton(
                              onPressed: _cancelEditing,
                              child: const Text('Hủy'),
                            ),
                            ElevatedButton(
                              onPressed: _saveChanges,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Lưu'),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _buildInfoCard('Email', _getUserEmail()),
                  _buildEditableInfoCard(
                    'Tên đầy đủ',
                    _getFullName(),
                    _fullNameController,
                  ),
                  _buildInfoCard('Vai trò', _getUserRole()),
                  _buildEditableInfoCard(
                    'Số điện thoại',
                    _getUserPhone(),
                    _phoneController,
                  ),
                  _buildGenderCard(),

                  // Hiển thị điểm uy tín và trạng thái hoạt động
                  _buildCreditPointCard(),
                  _buildActiveStatusCard(),

                  if (_getDepartment() != 'N/A')
                    _buildInfoCard('Phòng ban', _getDepartment()),
                  if (_getPosition() != 'N/A')
                    _buildInfoCard('Chức vụ', _getPosition()),
                  _buildInfoCard('Lần đăng nhập cuối', _getLastLogin()),

                  const SizedBox(height: 16),

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

  Widget _buildEditableInfoCard(
    String label,
    String value,
    TextEditingController controller,
  ) {
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
            Expanded(
              child: isEditing
                  ? TextField(
                      controller: controller,
                      decoration: InputDecoration(
                        hintText: value,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 8,
                        ),
                      ),
                    )
                  : Text(value, style: const TextStyle(fontSize: 14)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGenderCard() {
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
                'Giới tính:',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            Expanded(
              child: isEditing
                  ? DropdownButton<String>(
                      value: _selectedGender,
                      isExpanded: true,
                      items: ['Nam', 'Nữ'].map((String value) {
                        return DropdownMenuItem<String>(
                          value: value,
                          child: Text(value),
                        );
                      }).toList(),
                      onChanged: (String? newValue) {
                        if (newValue != null) {
                          setState(() {
                            _selectedGender = newValue;
                          });
                        }
                      },
                    )
                  : Text(
                      _getUserGender(),
                      style: const TextStyle(fontSize: 14),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget hiển thị điểm uy tín
  Widget _buildCreditPointCard() {
    final creditPoint = _getCreditPoint();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const SizedBox(
              width: 120,
              child: Text(
                'Điểm uy tín:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Icon(Icons.star, color: Colors.amber, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    '$creditPoint điểm',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: creditPoint >= 80
                          ? Colors.green
                          : creditPoint >= 50
                          ? Colors.orange
                          : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget hiển thị trạng thái hoạt động với badge
  Widget _buildActiveStatusCard() {
    final isActive = _getIsActive();
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const SizedBox(
              width: 120,
              child: Text(
                'Trạng thái:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            Expanded(
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: BoxDecoration(
                      color: isActive ? Colors.green : Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    isActive ? 'Đang hoạt động' : 'Không hoạt động',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: isActive ? Colors.green : Colors.red,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
