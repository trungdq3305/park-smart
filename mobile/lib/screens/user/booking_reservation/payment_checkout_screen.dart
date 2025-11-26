import 'dart:async';

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PaymentCheckoutScreen extends StatefulWidget {
  final String checkoutUrl;
  final String? paymentId;
  final Function(bool success, String? paymentId)? onPaymentComplete;

  const PaymentCheckoutScreen({
    super.key,
    required this.checkoutUrl,
    this.paymentId,
    this.onPaymentComplete,
  });

  @override
  State<PaymentCheckoutScreen> createState() => _PaymentCheckoutScreenState();
}

class _PaymentCheckoutScreenState extends State<PaymentCheckoutScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _isRecovering = false;
  Timer? _retryTimer;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    print('🔗 PaymentCheckoutScreen initialized');
    print('  Checkout URL: ${widget.checkoutUrl}');
    print('  Payment ID: ${widget.paymentId}');
    _initializeWebView();
  }

  void _initializeWebView() {
    print('🌐 Initializing WebView...');

    try {
      _controller = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setUserAgent(
          'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
        )
        ..setNavigationDelegate(
          NavigationDelegate(
            onProgress: (int progress) {
              print('📊 WebView loading progress: $progress%');
            },
            onPageStarted: (String url) {
              print('📄 Page started loading: $url');
              setState(() {
                _isLoading = true;
                _isRecovering = false;
                _errorMessage = null;
              });
            },
            onPageFinished: (String url) {
              print('✅ Page finished loading: $url');
              setState(() {
                _isLoading = false;
                _isRecovering = false;
                _errorMessage = null;
              });

              // Check for payment completion indicators
              _checkPaymentStatus(url);
            },
            onWebResourceError: (WebResourceError error) {
              print('❌ WebView error:');
              print('  Description: ${error.description}');
              print('  Error Code: ${error.errorCode}');
              print('  Error Type: ${error.errorType}');
              _handleLoadError(error);
            },
            onNavigationRequest: (NavigationRequest request) {
              final url = request.url;

              // Check for parksmart.vn/pay-result URL
              if (url.contains('parksmart.vn/pay-result') ||
                  url.contains('pay-result')) {
                try {
                  final uri = Uri.parse(url);
                  final result = uri.queryParameters['result'];
                  final paymentIdFromUrl = uri.queryParameters['paymentId'];

                  print('🔍 Payment result URL detected:');
                  print('  Full URL: $url');
                  print('  Result: $result');
                  print('  Payment ID from URL: $paymentIdFromUrl');
                  print('  Payment ID from widget: ${widget.paymentId}');

                  if (result != null) {
                    if (result.toLowerCase() == 'success') {
                      // PaymentId from URL callback is required for confirmation
                      if (paymentIdFromUrl == null ||
                          paymentIdFromUrl.isEmpty) {
                        print(
                          '⚠️ Warning: Payment ID not found in callback URL',
                        );
                        print('  URL: $url');
                        // Still try to use widget.paymentId as fallback
                      }
                      // Use paymentId from URL if available (required), otherwise use widget.paymentId
                      final finalPaymentId =
                          paymentIdFromUrl ?? widget.paymentId;
                      print('  Using Payment ID: $finalPaymentId');
                      _handlePaymentSuccess(finalPaymentId);
                      return NavigationDecision.prevent;
                    } else if (result.toLowerCase() == 'failure') {
                      _handlePaymentFailure();
                      return NavigationDecision.prevent;
                    }
                  }
                } catch (e) {
                  print('❌ Error parsing payment result URL: $e');
                }
              }

              // Fallback: Check for other success/failure indicators
              final lowerUrl = url.toLowerCase();

              // Xendit success indicators
              if (lowerUrl.contains('success') ||
                  lowerUrl.contains('completed') ||
                  lowerUrl.contains('paid')) {
                _handlePaymentSuccess(widget.paymentId);
                return NavigationDecision.prevent;
              }

              // Xendit failure indicators
              if (lowerUrl.contains('failed') ||
                  lowerUrl.contains('error') ||
                  lowerUrl.contains('cancelled') ||
                  lowerUrl.contains('expired')) {
                _handlePaymentFailure();
                return NavigationDecision.prevent;
              }

              return NavigationDecision.navigate;
            },
          ),
        );

      // Load the checkout URL
      final checkoutUri = Uri.parse(widget.checkoutUrl);
      print('🔗 Loading checkout URL: $checkoutUri');
      _controller.loadRequest(checkoutUri);
    } catch (e) {
      print('❌ Error initializing WebView: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage =
              'Không thể khởi tạo trang thanh toán. Vui lòng thử lại.';
        });
      }
    }
  }

  void _checkPaymentStatus(String url) {
    // Check for parksmart.vn/pay-result URL
    if (url.contains('parksmart.vn/pay-result') || url.contains('pay-result')) {
      try {
        final uri = Uri.parse(url);
        final result = uri.queryParameters['result'];
        final paymentIdFromUrl = uri.queryParameters['paymentId'];

        print('🔍 Payment result URL detected in onPageFinished:');
        print('  Full URL: $url');
        print('  Result: $result');
        print('  Payment ID from URL: $paymentIdFromUrl');
        print('  Payment ID from widget: ${widget.paymentId}');

        if (result != null) {
          if (result.toLowerCase() == 'success') {
            // PaymentId from URL callback is required for confirmation
            if (paymentIdFromUrl == null || paymentIdFromUrl.isEmpty) {
              print('⚠️ Warning: Payment ID not found in callback URL');
              print('  URL: $url');
              // Still try to use widget.paymentId as fallback
            }
            final finalPaymentId = paymentIdFromUrl ?? widget.paymentId;
            print('  Using Payment ID: $finalPaymentId');
            _handlePaymentSuccess(finalPaymentId);
            return;
          } else if (result.toLowerCase() == 'failure') {
            _handlePaymentFailure();
            return;
          }
        }
      } catch (e) {
        print('❌ Error parsing payment result URL: $e');
      }
    }

    // Fallback: Check URL for other payment status indicators
    final lowerUrl = url.toLowerCase();

    if (lowerUrl.contains('success') ||
        lowerUrl.contains('completed') ||
        lowerUrl.contains('paid')) {
      _handlePaymentSuccess(widget.paymentId);
    } else if (lowerUrl.contains('failed') ||
        lowerUrl.contains('error') ||
        lowerUrl.contains('cancelled')) {
      _handlePaymentFailure();
    }
  }

  void _handlePaymentSuccess(String? paymentId) {
    print('✅ Payment successful');
    print('  Using Payment ID: $paymentId');
    // Call callback first - navigation will be handled in the callback
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(true, paymentId);
    }
    // Close WebView after callback is called
    // The callback will handle navigation to result screen
    if (mounted) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    }
  }

  void _handlePaymentFailure() {
    print('❌ Payment failed or cancelled');
    // Call callback first - navigation will be handled in the callback
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(false, widget.paymentId);
    }
    // Close WebView after callback is called
    // The callback will handle navigation to result screen
    if (mounted) {
      Future.delayed(const Duration(milliseconds: 100), () {
        if (mounted) {
          Navigator.of(context).pop();
        }
      });
    }
  }

  void _handleLoadError(WebResourceError error) {
    if (!mounted) return;

    // Log once and show a stable error state instead of auto-retrying in a loop
    setState(() {
      _isLoading = false;
      _isRecovering = false;
      _errorMessage =
          'Không thể tải trang thanh toán (lỗi mạng hoặc chứng chỉ SSL). '
          'Vui lòng kiểm tra kết nối và thử lại.';
    });
  }

  void _manualReload() {
    setState(() {
      _isLoading = true;
      _isRecovering = false;
      _errorMessage = null;
    });
    _controller.reload();
  }

  @override
  void dispose() {
    _retryTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    print('🏗️ Building PaymentCheckoutScreen widget');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thanh toán'),
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            // Show confirmation dialog before closing
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Hủy thanh toán?'),
                content: const Text(
                  'Bạn có chắc chắn muốn hủy thanh toán? Giao dịch sẽ không được hoàn tất.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Tiếp tục thanh toán'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                      Navigator.of(context).pop(false); // Close WebView
                    },
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Hủy thanh toán'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Stack(
        children: [
          // WebView widget
          WebViewWidget(controller: _controller),
          // Loading indicator
          if (_isLoading)
            Container(
              color: Colors.white,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Đang tải trang thanh toán...',
                      style: TextStyle(color: Colors.grey, fontSize: 14),
                    ),
                  ],
                ),
              ),
            ),
          if (_errorMessage != null)
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                width: double.infinity,
                color: Colors.black.withOpacity(0.7),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (_isRecovering)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 12),
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.white,
                          ),
                        ),
                      ),
                    Text(
                      _errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                    if (!_isRecovering)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: OutlinedButton(
                          onPressed: _manualReload,
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white),
                          ),
                          child: const Text('Thử tải lại'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
