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
              });
            },
            onPageFinished: (String url) {
              print('✅ Page finished loading: $url');
              setState(() {
                _isLoading = false;
              });

              // Check for payment completion indicators
              _checkPaymentStatus(url);
            },
            onWebResourceError: (WebResourceError error) {
              print('❌ WebView error:');
              print('  Description: ${error.description}');
              print('  Error Code: ${error.errorCode}');
              print('  Error Type: ${error.errorType}');
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Lỗi tải trang: ${error.description}'),
                    backgroundColor: Colors.red,
                    duration: const Duration(seconds: 5),
                  ),
                );
              }
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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Lỗi khởi tạo WebView: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
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
    // Call callback - navigation will be handled in the callback
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(true, paymentId);
    }
    // Close WebView - navigation to result screen is handled in callback
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  void _handlePaymentFailure() {
    print('❌ Payment failed or cancelled');
    // Call callback - navigation will be handled in the callback
    if (widget.onPaymentComplete != null) {
      widget.onPaymentComplete!(false, widget.paymentId);
    }
    // Close WebView - navigation to result screen is handled in callback
    if (mounted) {
      Navigator.of(context).pop();
    }
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
        ],
      ),
    );
  }
}
