import 'package:flutter/material.dart';
import 'package:mobile/widgets/app_scaffold.dart';

class PersonalInfoScreen extends StatelessWidget {
  final Map<String, dynamic> claims;
  const PersonalInfoScreen({super.key, required this.claims});

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: Colors.black54)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      showBottomNav: false,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Thông tin cá nhân',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _row('ID', (claims['id'] ?? '').toString()),
                      _row('Email', (claims['email'] ?? '').toString()),
                      _row(
                        'Số điện thoại',
                        (claims['phoneNumber'] ?? '').toString(),
                      ),
                      _row('Role', (claims['role'] ?? '').toString()),
                      _row('Họ tên', (claims['fullName'] ?? '').toString()),
                      _row('Giới tính', (claims['gender'] ?? '').toString()),
                      _row('Issuer', (claims['iss'] ?? '').toString()),
                      _row('Audience', (claims['aud'] ?? '').toString()),
                      _row('Expire', (claims['exp'] ?? '').toString()),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
