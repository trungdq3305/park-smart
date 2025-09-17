import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class UserService {
  static const storage = FlutterSecureStorage();

  // Lưu thông tin user
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    await storage.write(key: 'data', value: jsonEncode(userData));
  }

  // Đọc thông tin user
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final data = await storage.read(key: 'data');
      if (data != null) {
        return jsonDecode(data) as Map<String, dynamic>;
      }
    } catch (e) {
      print('Error reading user data: $e');
    }
    return null;
  }

  // Lấy thông tin user cơ bản
  static Future<Map<String, dynamic>?> getUserInfo() async {
    final userData = await getUserData();
    return userData?['user'];
  }

  // Lấy token
  static Future<String?> getToken() async {
    final userData = await getUserData();
    return userData?['backendToken'] ?? userData?['idToken'];
  }

  // Kiểm tra đã đăng nhập chưa
  static Future<bool> isLoggedIn() async {
    final userData = await getUserData();
    return userData != null && userData['user'] != null;
  }

  // Đăng xuất
  static Future<void> logout() async {
    await storage.delete(key: 'data');
  }

  // Lấy email
  static Future<String?> getUserEmail() async {
    final userInfo = await getUserInfo();
    return userInfo?['email'];
  }

  // Lấy tên
  static Future<String?> getUserName() async {
    final userInfo = await getUserInfo();
    return userInfo?['name'];
  }

  // Lấy ảnh đại diện
  static Future<String?> getUserPhoto() async {
    final userInfo = await getUserInfo();
    return userInfo?['photoUrl'];
  }
}
