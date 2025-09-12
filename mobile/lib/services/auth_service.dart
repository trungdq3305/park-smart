// import 'dart:convert';
// import 'api_client.dart';

// class AuthService {
//   // login
//   static Future<Map<String, dynamic>> login(
//     String email,
//     String password,
//   ) async {
//     final response = await ApiClient.post(
//       'auth/login',
//       body: {'email': email, 'password': password},
//     );

//     if (response.statusCode == 200) {
//       return jsonDecode(response.body);
//     } else {
//       throw Exception('Login failed: ${response.body}');
//     }
//   }

//   // register
//   static Future<Map<String, dynamic>> register(
//     String name,
//     String email,
//     String password,
//   ) async {
//     final response = await ApiClient.post(
//       'auth/register',
//       body: {'name': name, 'email': email, 'password': password},
//     );

//     if (response.statusCode == 201) {
//       return jsonDecode(response.body);
//     } else {
//       throw Exception('Register failed: ${response.body}');
//     }
//   }
// }
