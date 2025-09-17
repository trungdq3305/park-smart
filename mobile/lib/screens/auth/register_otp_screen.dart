import 'package:flutter/material.dart';
import '../../services/auth_service.dart';

class RegisterOtpScreen extends StatefulWidget {
  final String email;
  const RegisterOtpScreen({super.key, required this.email});

  @override
  State<RegisterOtpScreen> createState() => _RegisterOtpScreenState();
}

class _RegisterOtpScreenState extends State<RegisterOtpScreen> {
  final TextEditingController _otpController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _confirm() async {
    final code = _otpController.text.trim();
    if (code.isEmpty) {
      setState(() => _errorMessage = 'Vui lòng nhập mã OTP');
      return;
    }
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final res = await AuthService().confirmRegister(
        email: widget.email,
        otpCode: code,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']?.toString() ?? 'Xác nhận thành công'),
        ),
      );
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/login');
    } catch (e) {
      setState(
        () => _errorMessage = e.toString().replaceFirst('Exception: ', ''),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Xác nhận OTP')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Email: ${widget.email}'),
            const SizedBox(height: 12),
            TextField(
              controller: _otpController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Mã OTP',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _confirm,
                child: _isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text('Xác nhận'),
              ),
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ],
          ],
        ),
      ),
    );
  }
}
